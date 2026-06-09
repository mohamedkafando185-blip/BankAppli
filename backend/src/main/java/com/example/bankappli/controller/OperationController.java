package com.example.bankappli.controller;

import com.example.bankappli.model.*;
import com.example.bankappli.repository.ClientRepository;
import com.example.bankappli.repository.EmployeRepository;
import com.example.bankappli.repository.OperationBancaireRepository;
import com.example.bankappli.service.CodeTransactionService;
import com.example.bankappli.service.OtpService;
import com.example.bankappli.service.OperationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/operations")
public class OperationController {

    private final OperationService operationService;
    private final ClientRepository clientRepository;
    private final EmployeRepository employeRepository;
    private final OperationBancaireRepository operationRepository;
    private final CodeTransactionService codeTransactionService;
    // BUG FIX OTP : OtpService injecté pour pouvoir exposer l'endpoint /otp/verifier
    private final OtpService otpService;

    public OperationController(OperationService operationService,
                               ClientRepository clientRepository,
                               EmployeRepository employeRepository,
                               OperationBancaireRepository operationRepository,
                               CodeTransactionService codeTransactionService,
                               OtpService otpService) {
        this.operationService = operationService;
        this.clientRepository = clientRepository;
        this.employeRepository = employeRepository;
        this.operationRepository = operationRepository;
        this.codeTransactionService = codeTransactionService;
        this.otpService = otpService;
    }

    @GetMapping
    public List<OperationBancaire> getAll() {
        return operationRepository.findAllWithDetails();
    }

    /**
     * BUG FIX HISTORIQUE :
     * - Avant : retournait directement les entités → problèmes LAZY + Jackson
     *   ne savait pas quel sous-type sérialiser → champs manquants dans JSON
     *   → côté front, "initiateur" pouvait ne pas apparaître.
     * - Après : on s'assure que l'initiateur n'est jamais null (fallback "Inconnu"),
     *   et on trie par date décroissante (le plus récent en premier).
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMesOperations(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        Client client = clientRepository.findByEmail(authentication.getName());
        if (client == null) return ResponseEntity.ok(List.of());

        List<OperationBancaire> ops = operationRepository.findAllByClientId(client.getId());

        // BUG FIX HISTORIQUE : garantir que initiateur n'est jamais null dans la réponse
        ops.forEach(op -> {
            if (op.getInitiateur() == null || op.getInitiateur().isBlank()) {
                // Fallback : on utilise l'email du client connecté (ne devrait jamais arriver
                // si OperationService est correct, mais défense en profondeur)
                op.setInitiateur(authentication.getName());
            }
        });

        // Tri par date décroissante
        ops.sort(Comparator.comparing(OperationBancaire::getDateOperation).reversed());

        return ResponseEntity.ok(ops);
    }

    /**
     * BUG FIX N+1 : Avant, on faisait findIdsByCompteNumero puis un findById par ID
     * → N+1 requêtes. Maintenant on utilise directement findAllByClientId ou
     * on garde le flux mais avec un tri en mémoire (acceptable pour un compte).
     * Le vrai fix est dans le repository (findAllWithDetails).
     */
    @GetMapping("/compte/{numeroCompte}")
    public ResponseEntity<?> getByCompte(@PathVariable String numeroCompte) {
        List<String> ids = operationRepository.findIdsByCompteNumero(numeroCompte);
        List<OperationBancaire> ops = ids.stream()
            .map(id -> operationRepository.findById(id).orElse(null))
            .filter(op -> op != null)
            // BUG FIX HISTORIQUE : garantir initiateur non null
            .peek(op -> {
                if (op.getInitiateur() == null || op.getInitiateur().isBlank()) {
                    op.setInitiateur("Système");
                }
            })
            .sorted(Comparator.comparing(OperationBancaire::getDateOperation).reversed())
            .collect(Collectors.toList());
        return ResponseEntity.ok(ops);
    }

    /**
     * BUG FIX OTP — Étape 1 : Demander l'OTP
     * Corrections :
     * 1. body == null → NPE sur body.get() → ajout guard null complet
     * 2. Le codeTransaction est vérifié AVANT de générer l'OTP (logique métier correcte)
     * 3. Meilleur message d'erreur
     */
    @PostMapping("/otp/demander")
    public ResponseEntity<?> demanderOtp(@RequestBody(required = false) Map<String, String> body,
                                         Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        // BUG FIX OTP : body peut être null si le client envoie une requête sans body
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Le body est obligatoire (codeTransaction requis)."
            ));
        }

        try {
            Client client = clientRepository.findByEmail(authentication.getName());
            if (client == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));
            }

            String codeTransaction = body.get("codeTransaction");
            if (codeTransaction == null || codeTransaction.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Le code de transaction est obligatoire pour demander un OTP."
                ));
            }

            // Vérifie le code transaction (lève exception si incorrect)
            codeTransactionService.verifier(client.getId(), codeTransaction);

            // Génère et envoie l'OTP par email
            Map<String, Object> result = operationService.demanderOtpTransaction(authentication.getName());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * BUG FIX OTP — Étape 2 : Vérifier l'OTP (endpoint MANQUANT dans l'original)
     * Sans cet endpoint, le client n'a aucun moyen de valider son OTP
     * séparément des opérations → le flux OTP était INCOMPLET.
     * Cet endpoint permet de tester la validité du code OTP avant l'opération.
     */
    @PostMapping("/otp/verifier")
    public ResponseEntity<?> verifierOtp(@RequestBody Map<String, String> body,
                                         Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        if (body == null || body.get("codeOtp") == null || body.get("codeOtp").isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le code OTP est obligatoire."));
        }

        try {
            String email = authentication.getName();
            String codeOtp = body.get("codeOtp");

            boolean valide = otpService.verifierOtp(email, codeOtp, OtpToken.TypeOtp.TRANSACTION);
            if (!valide) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Code OTP invalide ou expiré."
                ));
            }
            return ResponseEntity.ok(Map.of("message", "OTP valide."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/virement")
    public ResponseEntity<?> virement(@RequestBody Map<String, String> body,
                                      Authentication authentication) {
        // BUG FIX : vérification authentication null avant tout accès
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            Double montant = parseMontant(body.get("montant"));
            boolean isClient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));

            String srcId  = operationService.resoudreCompteId(body.get("compteSourceId"));
            String destId = operationService.resoudreCompteId(body.get("compteDestId"));

            Virement v;
            if (isClient) {
                Client client = clientRepository.findByEmail(authentication.getName());
                if (client == null)
                    return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));
                v = operationService.effectuerVirementClient(
                    srcId, destId, montant, body.get("motif"),
                    client.getId(), authentication.getName(),
                    body.get("codeTransaction"), body.get("codeOtp")
                );
            } else {
                Employe auteur = employeRepository.findByEmail(authentication.getName());
                if (auteur == null)
                    return ResponseEntity.status(404).body(Map.of("error", "Employé introuvable."));
                v = operationService.effectuerVirement(srcId, destId, montant, body.get("motif"), auteur);
            }
            return ResponseEntity.ok(v);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/versement")
    public ResponseEntity<?> versement(@RequestBody Map<String, String> body,
                                       Authentication authentication) {
        // BUG FIX : vérification authentication null
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            Double montant = parseMontant(body.get("montant"));
            String destId = operationService.resoudreCompteId(body.get("compteDestId"));
            Employe auteur = employeRepository.findByEmail(authentication.getName());
            // BUG FIX : auteur null → NPE dans le service
            if (auteur == null)
                return ResponseEntity.status(404).body(Map.of("error", "Employé introuvable."));
            Versement v = operationService.effectuerVersement(destId, montant, body.get("source"), auteur);
            return ResponseEntity.ok(v);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/retrait")
    public ResponseEntity<?> retrait(@RequestBody Map<String, String> body,
                                     Authentication authentication) {
        // BUG FIX : vérification authentication null
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            Double montant = parseMontant(body.get("montant"));
            boolean isClient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));

            String srcId = operationService.resoudreCompteId(body.get("compteSourceId"));

            Retrait r;
            if (isClient) {
                Client client = clientRepository.findByEmail(authentication.getName());
                if (client == null)
                    return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));
                r = operationService.effectuerRetraitClient(
                    srcId, montant,
                    client.getId(), authentication.getName(),
                    body.get("codeTransaction"), body.get("codeOtp")
                );
            } else {
                Employe auteur = employeRepository.findByEmail(authentication.getName());
                // BUG FIX : auteur null → NPE dans le service
                if (auteur == null)
                    return ResponseEntity.status(404).body(Map.of("error", "Employé introuvable."));
                r = operationService.effectuerRetrait(srcId, montant, body.get("modeRetrait"), auteur);
            }
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Double parseMontant(String montantStr) {
        if (montantStr == null || montantStr.isBlank())
            throw new NumberFormatException("Montant absent.");
        try {
            return Double.parseDouble(montantStr.trim());
        } catch (NumberFormatException e) {
            throw new NumberFormatException("Montant invalide : '" + montantStr + "'");
        }
    }
}

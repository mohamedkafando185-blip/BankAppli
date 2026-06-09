package com.example.bankappli.controller;

import com.example.bankappli.model.Client;
import com.example.bankappli.service.ClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<Client> getAll() {
        return clientService.findAll();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        Client client = clientService.findByEmail(authentication.getName());
        if (client == null) return ResponseEntity.status(404)
            .body(Map.of("error", "Profil client introuvable pour cet utilisateur"));
        return ResponseEntity.ok(client);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Client client = clientService.findById(id);
        if (client == null)
            return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));
        return ResponseEntity.ok(client);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Client client) {
        try {
            return ResponseEntity.ok(clientService.creerClient(client));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /{id} — Modification basique (admin).
     * BUG FIX : était retournée directement sans gestion d'erreur.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody Client client,
                                    Authentication authentication) {
        try {
            boolean isEmployeOrAdmin = authentication != null &&
                authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYE")
                               || a.getAuthority().equals("ROLE_ADMIN"));

            Client updated;
            if (isEmployeOrAdmin) {
                // BUG FIX : Employé/Admin utilisent modifierClientComplet
                // (la méthode qui modifie TOUS les champs)
                updated = clientService.modifierClientComplet(id, client);
            } else {
                // Client modifie ses propres infos (champs limités)
                updated = clientService.modifierClient(id, client);
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            clientService.supprimerClient(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/bloquer")
    public ResponseEntity<?> bloquer(@PathVariable String id) {
        try {
            return ResponseEntity.ok(clientService.bloquerClient(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/debloquer")
    public ResponseEntity<?> debloquer(@PathVariable String id) {
        try {
            return ResponseEntity.ok(clientService.debloquerClient(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * BUG FIX : Ancien et nouveau mot de passe — validation renforcée.
     * Admin peut changer sans connaître l'ancien mot de passe.
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changerMotDePasse(@PathVariable String id,
                                               @RequestBody Map<String, String> body,
                                               Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        Client client = clientService.findById(id);
        if (client == null)
            return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));

        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isSelf = client.getEmail().equals(authentication.getName());

        if (!isSelf && !isAdmin) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "Vous ne pouvez modifier que votre propre mot de passe."
            ));
        }

        String nouveau = body.get("nouveauMotDePasse");
        if (nouveau == null || nouveau.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Nouveau mot de passe requis."));
        if (nouveau.length() < 8)
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Le mot de passe doit contenir au moins 8 caractères."
            ));

        try {
            if (isAdmin && !isSelf) {
                // Admin change sans vérifier l'ancien
                clientService.reinitialiserMotDePasse(id, nouveau);
            } else {
                // Client doit fournir l'ancien
                String ancien = body.get("ancienMotDePasse");
                if (ancien == null || ancien.isBlank())
                    return ResponseEntity.badRequest().body(Map.of("error", "Ancien mot de passe requis."));
                clientService.changerMotDePasse(id, ancien, nouveau);
            }
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

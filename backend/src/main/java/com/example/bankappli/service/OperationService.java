package com.example.bankappli.service;

import com.example.bankappli.exception.*;
import com.example.bankappli.model.*;
import com.example.bankappli.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class OperationService {

    private final OperationBancaireRepository operationRepository;
    private final CompteBancaireRepository compteRepository;
    private final OtpService otpService;
    private final CodeTransactionService codeTransactionService;
    private final ClientRepository clientRepository;

    public OperationService(OperationBancaireRepository operationRepository,
                            CompteBancaireRepository compteRepository,
                            OtpService otpService,
                            CodeTransactionService codeTransactionService,
                            ClientRepository clientRepository) {
        this.operationRepository = operationRepository;
        this.compteRepository = compteRepository;
        this.otpService = otpService;
        this.codeTransactionService = codeTransactionService;
        this.clientRepository = clientRepository;
    }

    public List<OperationBancaire> findAll() {
        return operationRepository.findAllWithDetails();
    }

    public List<OperationBancaire> findByCompte(String numeroCompte) {
        return operationRepository.findAllWithDetails(); // fallback
    }

    /**
     * Résout un identifiant de compte : accepte le numéro de compte (UUID)
     * OU le RIB (24 chiffres numériques).
     * Retourne toujours le numeroCompte (clé primaire).
     */
    public String resoudreCompteId(String input) {
        if (input == null || input.isBlank())
            throw new InvalidAmountException("Numéro de compte ou RIB manquant.");

        String clean = input.trim().replaceAll("\\s+", ""); // enlever espaces éventuels

        // Si 24 chiffres → c'est un RIB, chercher par RIB
        if (clean.matches("\\d{24}")) {
            CompteBancaire compte = compteRepository.findByRib(clean)
                .orElseThrow(() -> new EntityNotFoundException(
                    "Aucun compte trouvé avec le RIB : " + clean + ". " +
                    "Vérifiez que le RIB est exact (24 chiffres sans espaces)."));
            return compte.getNumeroCompte();
        }

        // Sinon supposer que c'est un numéro de compte direct
        return clean;
    }

    public Map<String, Object> demanderOtpTransaction(String email) {
        return otpService.genererEtEnvoyer(email, OtpToken.TypeOtp.TRANSACTION);
    }

    // ── VIREMENT CLIENT ──────────────────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Virement effectuerVirementClient(String compteSourceId, String compteDestId,
                                            Double montant, String motif,
                                            String clientId, String email,
                                            String codeTransaction, String codeOtp) {
        codeTransactionService.verifier(clientId, codeTransaction);
        otpService.verifier(email, codeOtp, OtpToken.TypeOtp.TRANSACTION);
        
        // Récupérer le client pour obtenir son nom complet
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new EntityNotFoundException("Client introuvable : " + clientId));
        String nomClient = client.getPrenom() + " " + client.getNom();
        
        return doVirement(compteSourceId, compteDestId, montant, motif, null, nomClient);
    }

    // ── VIREMENT EMPLOYÉ/ADMIN ───────────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Virement effectuerVirement(String compteSourceId, String compteDestId,
                                      Double montant, String motif, Employe auteur) {
        String label = auteur != null
            ? auteur.getPrenom() + " " + auteur.getNom()
            : "Employé";
        return doVirement(compteSourceId, compteDestId, montant, motif, auteur, label);
    }

    private Virement doVirement(String compteSourceId, String compteDestId,
                                 Double montant, String motif, Employe auteur, String initiateur) {
        validerMontant(montant, "virement");
        if (compteSourceId == null || compteSourceId.isBlank())
            throw new InvalidAmountException("Numéro de compte source manquant.");
        if (compteDestId == null || compteDestId.isBlank())
            throw new InvalidAmountException("Numéro de compte destination manquant.");
        if (compteSourceId.trim().equals(compteDestId.trim()))
            throw new InvalidAmountException(
                "Le compte source et la destination ne peuvent pas être identiques.");

        CompteBancaire source = trouverCompte(compteSourceId, "source");
        CompteBancaire destination = trouverCompte(compteDestId, "destination");

        validerActif(source, "source");
        validerActif(destination, "destination");

        double soldeSrc  = nvl(source.getSolde());
        double soldeDest = nvl(destination.getSolde());
        double soldeDisponible = soldeSrc;
        if (source instanceof CompteCourant cc)
            soldeDisponible += nvl(cc.getDecouvertAutorise());

        if (soldeDisponible < montant)
            throw new InsufficientBalanceException(String.format(
                "Solde insuffisant sur le compte source. " +
                "Disponible : %.2f MAD (solde : %.2f MAD, découvert : %.2f MAD). " +
                "Montant demandé : %.2f MAD.",
                soldeDisponible, soldeSrc, soldeDisponible - soldeSrc, montant));

        source.setSolde(soldeSrc - montant);
        destination.setSolde(soldeDest + montant);
        compteRepository.save(source);
        compteRepository.save(destination);

        Virement v = new Virement();
        v.setCompteSource(source);
        v.setCompteDestination(destination);
        v.setMontant(montant);
        v.setSoldeAvant(soldeSrc);
        v.setSoldeApres(source.getSolde());
        v.setMotif(motif != null && !motif.isBlank() ? motif : "Virement bancaire");
        v.setDateOperation(LocalDateTime.now());
        v.setDateValidation(LocalDateTime.now());
        v.setStatut(OperationBancaire.StatutOperation.VALIDEE);
        v.setDevise("MAD");
        v.setReference("VIR-" + System.currentTimeMillis());
        v.setTypeVirement(Virement.TypeVirement.INTERNE);
        v.setEmployeValideur(auteur);
        v.setInitiateur(initiateur);
        v.setCompteSourceNumero(source.getNumeroCompte());
        v.setCompteDestNumero(destination.getNumeroCompte());
        return operationRepository.save(v);
    }

    // ── RETRAIT CLIENT ───────────────────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Retrait effectuerRetraitClient(String compteSourceId, Double montant,
                                          String clientId, String email,
                                          String codeTransaction, String codeOtp) {
        codeTransactionService.verifier(clientId, codeTransaction);
        otpService.verifier(email, codeOtp, OtpToken.TypeOtp.TRANSACTION);
        
        // Récupérer le client pour obtenir son nom complet
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new EntityNotFoundException("Client introuvable : " + clientId));
        String nomClient = client.getPrenom() + " " + client.getNom();
        
        return doRetrait(compteSourceId, montant, "GUICHET", null, nomClient);
    }

    // ── RETRAIT EMPLOYÉ/ADMIN ────────────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Retrait effectuerRetrait(String compteSourceId, Double montant,
                                    String modeRetrait, Employe auteur) {
        String label = auteur != null
            ? auteur.getPrenom() + " " + auteur.getNom()
            : "Employé";
        return doRetrait(compteSourceId, montant, modeRetrait, auteur, label);
    }

    private Retrait doRetrait(String compteSourceId, Double montant,
                               String modeRetrait, Employe auteur, String initiateur) {
        validerMontant(montant, "retrait");
        if (compteSourceId == null || compteSourceId.isBlank())
            throw new InvalidAmountException("Numéro de compte source manquant.");

        CompteBancaire source = trouverCompte(compteSourceId, "source");
        validerActif(source, "source");

        double solde = nvl(source.getSolde());
        double soldeDisponible = solde;
        if (source instanceof CompteCourant cc)
            soldeDisponible += nvl(cc.getDecouvertAutorise());

        if (soldeDisponible < montant)
            throw new InsufficientBalanceException(String.format(
                "Solde insuffisant. Disponible : %.2f MAD. Montant demandé : %.2f MAD.",
                soldeDisponible, montant));

        source.setSolde(solde - montant);
        compteRepository.save(source);

        Retrait r = new Retrait();
        r.setCompteSource(source);
        r.setMontant(montant);
        r.setSoldeAvant(solde);
        r.setSoldeApres(source.getSolde());
        Retrait.ModeRetrait mode = Retrait.ModeRetrait.GUICHET;
        if (modeRetrait != null) {
            try { mode = Retrait.ModeRetrait.valueOf(modeRetrait.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        r.setModeRetrait(mode);
        r.setDateOperation(LocalDateTime.now());
        r.setDateValidation(LocalDateTime.now());
        r.setStatut(OperationBancaire.StatutOperation.VALIDEE);
        r.setDevise("MAD");
        r.setReference("RTR-" + System.currentTimeMillis());
        r.setEmployeValideur(auteur);
        r.setInitiateur(initiateur);
        r.setCompteSourceNumero(source.getNumeroCompte());
        return operationRepository.save(r);
    }

    // ── VERSEMENT (employé/admin) ────────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Versement effectuerVersement(String compteDestId, Double montant,
                                        String sourceVersement, Employe auteur) {        validerMontant(montant, "versement");
        if (compteDestId == null || compteDestId.isBlank())
            throw new InvalidAmountException("Numéro de compte destination manquant.");

        CompteBancaire destination = trouverCompte(compteDestId, "destination");
        validerActif(destination, "destination");

        double soldeDest = nvl(destination.getSolde());
        if (destination instanceof CompteEpargne ce && ce.getPlafond() != null && ce.getPlafond() > 0) {
            if (soldeDest + montant > ce.getPlafond())
                throw new InsufficientBalanceException(String.format(
                    "Versement refusé : plafond épargne dépassé. " +
                    "Solde actuel : %.2f MAD, Montant : %.2f MAD, Plafond : %.2f MAD.",
                    soldeDest, montant, ce.getPlafond()));
        }

        destination.setSolde(soldeDest + montant);
        compteRepository.save(destination);

        Versement vs = new Versement();
        vs.setCompteDestination(destination);
        vs.setMontant(montant);
        vs.setSoldeAvant(soldeDest);
        vs.setSoldeApres(destination.getSolde());
        vs.setSourceVersement(sourceVersement != null ? sourceVersement : "ESPECE");
        vs.setDateOperation(LocalDateTime.now());
        vs.setDateValidation(LocalDateTime.now());
        vs.setStatut(OperationBancaire.StatutOperation.VALIDEE);
        vs.setDevise("MAD");
        vs.setReference("VRS-" + System.currentTimeMillis());
        vs.setEmployeValideur(auteur);
        vs.setInitiateur(auteur != null ? auteur.getPrenom() + " " + auteur.getNom() : "Système");
        vs.setCompteDestNumero(destination.getNumeroCompte());
        return operationRepository.save(vs);
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private void validerMontant(Double m, String type) {
        if (m == null || m <= 0)
            throw new InvalidAmountException(
                "Montant invalide pour le " + type + " : doit être > 0. Reçu : " + m);
    }

    private CompteBancaire trouverCompte(String id, String role) {
        return compteRepository.findById(id).orElseThrow(() ->
            new EntityNotFoundException(
                "Compte " + role + " introuvable : " + id + ". " +
                "Vérifiez le numéro de compte."));
    }

    private void validerActif(CompteBancaire c, String role) {
        if (c.getStatut() != CompteBancaire.StatutCompte.ACTIF)
            throw new AccountStatusException(
                "Le compte " + role + " (" + c.getNumeroCompte() + ") n'est pas actif. " +
                "Statut : " + c.getStatut() + ".");
    }

    private double nvl(Double v) { return v != null ? v : 0.0; }
}
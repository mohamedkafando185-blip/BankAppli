package com.example.bankappli.service;

import com.example.bankappli.exception.AccountStatusException;
import com.example.bankappli.exception.EntityNotFoundException;
import com.example.bankappli.model.*;
import com.example.bankappli.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class CompteService {

    private final CompteBancaireRepository compteBancaireRepository;
    private final CompteCourantRepository compteCourantRepository;
    private final CompteEpargneRepository compteEpargneRepository;
    private final ClientRepository clientRepository;

    public CompteService(CompteBancaireRepository compteBancaireRepository,
                         CompteCourantRepository compteCourantRepository,
                         CompteEpargneRepository compteEpargneRepository,
                         ClientRepository clientRepository) {
        this.compteBancaireRepository = compteBancaireRepository;
        this.compteCourantRepository = compteCourantRepository;
        this.compteEpargneRepository = compteEpargneRepository;
        this.clientRepository = clientRepository;
    }

    public List<CompteBancaire> findAll() {
        return compteBancaireRepository.findAllWithClient();
    }

    public List<CompteBancaire> findByClient(String clientId) {
        return compteBancaireRepository.findByClientId(clientId);
    }

    private String genererNumeroCompte() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase();
    }

    private String genererRib24Chiffres() {
        Random rnd = new Random();
        String banque  = "2" + String.format("%04d", 1000 + rnd.nextInt(9000));
        String guichet = String.format("%03d", 100 + rnd.nextInt(900));
        String indice  = String.format("%03d", rnd.nextInt(1000));
        StringBuilder compteNum = new StringBuilder();
        for (int i = 0; i < 11; i++) compteNum.append(rnd.nextInt(10));
        String base = banque + guichet + indice + compteNum;
        // FIX : utiliser long pour éviter l'overflow et la lossy conversion
        long val1 = Long.parseLong(base.substring(0, 9));
        long val2 = Long.parseLong(base.substring(9));
        long cle  = 97L - (val1 % 97L * 1000000000L + val2) % 97L;
        if (cle == 0) cle = 97;
        return banque + guichet + indice + compteNum + String.format("%02d", cle);
    }

    public static String formaterRib(String rib) {
        if (rib == null || rib.length() != 24) return rib;
        return rib.substring(0, 5) + " " + rib.substring(5, 8) + " " +
               rib.substring(8, 11) + " " + rib.substring(11, 22) + " " +
               rib.substring(22, 24);
    }

    @Transactional
    public CompteCourant ouvrirCompteCourant(String clientId, Double decouvertAutorise) {
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new EntityNotFoundException("Client introuvable : " + clientId));
        if (Boolean.TRUE.equals(client.getEstBloque()))
            throw new AccountStatusException(
                "Impossible d'ouvrir un compte : le client " + client.getPrenom() +
                " " + client.getNom() + " est bloqué.");

        CompteCourant compte = new CompteCourant();
        compte.setNumeroCompte(genererNumeroCompte());
        compte.setRib(genererRib24Chiffres());
        compte.setClient(client);
        compte.setSolde(0.0);
        compte.setDevise("MAD");
        compte.setStatut(CompteBancaire.StatutCompte.ACTIF);
        compte.setDateOuverture(LocalDate.now());
        compte.setDecouvertAutorise(decouvertAutorise != null ? decouvertAutorise : 0.0);
        compte.setDecouvertUtilise(0.0);
        compte.setTypeCompte(CompteCourant.TypeCompte.PARTICULIER);
        return compteCourantRepository.save(compte);
    }

    @Transactional
    public CompteEpargne ouvrirCompteEpargne(String clientId, Double tauxInteret, Double plafond) {
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new EntityNotFoundException("Client introuvable : " + clientId));
        if (Boolean.TRUE.equals(client.getEstBloque()))
            throw new AccountStatusException("Impossible d'ouvrir un compte : le client est bloqué.");

        CompteEpargne compte = new CompteEpargne();
        compte.setNumeroCompte(genererNumeroCompte());
        compte.setRib(genererRib24Chiffres());
        compte.setClient(client);
        compte.setSolde(0.0);
        compte.setDevise("MAD");
        compte.setStatut(CompteBancaire.StatutCompte.ACTIF);
        compte.setDateOuverture(LocalDate.now());
        compte.setTauxInteret(tauxInteret != null ? tauxInteret : 3.0);
        compte.setPlafond(plafond);
        compte.setTypeEpargne(CompteEpargne.TypeEpargne.LIVRET);
        compte.setDateProchainInteret(LocalDate.now().plusMonths(1));
        return compteEpargneRepository.save(compte);
    }

    @Transactional
    public void cloturerCompte(String numeroCompte) {
        CompteBancaire compte = compteBancaireRepository.findById(numeroCompte)
            .orElseThrow(() -> new EntityNotFoundException(
                "Compte introuvable : " + numeroCompte));

        if (compte.getStatut() == CompteBancaire.StatutCompte.CLOTURE)
            throw new AccountStatusException("Le compte " + numeroCompte + " est déjà clôturé.");

        // FIX : comparaison avec seuil (évite bug flottant != 0.0)
        double solde = compte.getSolde() != null ? compte.getSolde() : 0.0;
        if (Math.abs(solde) > 0.01)
            throw new AccountStatusException(
                "Impossible de clôturer le compte " + numeroCompte +
                " : le solde doit être à zéro. " +
                "Solde actuel : " + String.format("%.2f MAD", solde) + ". " +
                "Effectuez d'abord un retrait ou un virement pour solder ce compte.");

        compte.setStatut(CompteBancaire.StatutCompte.CLOTURE);
        compte.setDateFermeture(LocalDate.now());
        compteBancaireRepository.save(compte);
    }
}

package com.example.bankappli.controller;

import com.example.bankappli.model.*;
import com.example.bankappli.repository.ClientRepository;
import com.example.bankappli.repository.CompteBancaireRepository;
import com.example.bankappli.service.CompteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comptes")
public class CompteController {

    private final CompteService compteService;
    private final ClientRepository clientRepository;
    private final CompteBancaireRepository compteRepository;

    public CompteController(CompteService compteService, 
                           ClientRepository clientRepository,
                           CompteBancaireRepository compteRepository) {
        this.compteService = compteService;
        this.clientRepository = clientRepository;
        this.compteRepository = compteRepository;
    }

    @GetMapping
    public List<CompteBancaire> getAll() {
        return compteRepository.findAllWithClient();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMesComptes(Authentication authentication) {
        if (authentication == null) {
            System.out.println("[CompteController] Authentication is null");
            return ResponseEntity.status(401).build();
        }
        
        System.out.println("[CompteController] Email: " + authentication.getName());
        
        Client client = clientRepository.findByEmail(authentication.getName());
        if (client == null) {
            System.out.println("[CompteController] Client not found for email: " + authentication.getName());
            return ResponseEntity.ok(List.of());
        }
        
        System.out.println("[CompteController] Client ID: " + client.getId());
        
        List<CompteBancaire> comptes = compteRepository.findByClientId(client.getId());
        System.out.println("[CompteController] Found " + comptes.size() + " accounts");
        
        // Log each account
        for (CompteBancaire c : comptes) {
            System.out.println("[CompteController] Account: " + c.getNumeroCompte() + 
                             ", status: " + c.getStatut() + 
                             ", solde: " + c.getSolde());
        }
        
        return ResponseEntity.ok(comptes);
    }

    @GetMapping("/client/{clientId}")
    public List<CompteBancaire> getByClient(@PathVariable String clientId) {
        return compteService.findByClient(clientId);
    }

    @PostMapping("/courant/{clientId}")
    public ResponseEntity<?> ouvrirCourant(@PathVariable String clientId,
                                           @RequestBody Map<String, Object> body) {
        Double decouvert = parseDouble(body.get("decouvertAutorise"));
        CompteCourant compte = compteService.ouvrirCompteCourant(clientId, decouvert);
        return ResponseEntity.ok(compte);
    }

    @PostMapping("/epargne/{clientId}")
    public ResponseEntity<?> ouvrirEpargne(@PathVariable String clientId,
                                           @RequestBody Map<String, Object> body) {
        Double taux = parseDouble(body.get("tauxInteret"));
        Double plafond = parseDouble(body.get("plafond"));
        CompteEpargne compte = compteService.ouvrirCompteEpargne(clientId, taux, plafond);
        return ResponseEntity.ok(compte);
    }

    @PutMapping("/{numeroCompte}/cloturer")
    public ResponseEntity<Void> cloturer(@PathVariable String numeroCompte) {
        compteService.cloturerCompte(numeroCompte);
        return ResponseEntity.noContent().build();
    }

    private Double parseDouble(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); }
        catch (NumberFormatException e) { return null; }
    }
}
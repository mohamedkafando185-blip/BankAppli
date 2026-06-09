package com.example.bankappli.service;

import com.example.bankappli.exception.EntityNotFoundException;
import com.example.bankappli.model.Client;
import com.example.bankappli.repository.ClientRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    public ClientService(ClientRepository clientRepository, PasswordEncoder passwordEncoder) {
        this.clientRepository = clientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Client> findAll() {
        return clientRepository.findAll();
    }

    public Client findById(String id) {
        return clientRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Client introuvable : " + id));
    }

    public Client findByEmail(String email) {
        return clientRepository.findByEmail(email);
    }

    @Transactional
    public Client creerClient(Client client) {
        if (client.getEmail() != null && clientRepository.findByEmail(client.getEmail()) != null) {
            throw new RuntimeException("Un client avec cet email existe déjà");
        }
        if (client.getCin() != null && clientRepository.findByCin(client.getCin()) != null) {
            throw new RuntimeException("Un client avec ce CIN existe déjà");
        }

        client.setDateInscription(LocalDate.now());
        client.setDateCreation(LocalDate.now());
        client.setEstBloque(false);
        client.setStatut(Client.Statut.ACTIF);

        if (client.getNumeroClient() == null || client.getNumeroClient().isBlank()) {
            client.setNumeroClient("CLI-" + System.currentTimeMillis());
        }
        if (client.getMotDePasse() != null && !client.getMotDePasse().isBlank()) {
            client.setMotDePasse(passwordEncoder.encode(client.getMotDePasse()));
        }

        return clientRepository.save(client);
    }

    /**
     * Modification de base (par le client lui-même via son profil).
     */
    @Transactional
    public Client modifierClient(String id, Client client) {
        Client existing = findById(id);
        if (client.getNom() != null) existing.setNom(client.getNom());
        if (client.getPrenom() != null) existing.setPrenom(client.getPrenom());
        if (client.getEmail() != null) existing.setEmail(client.getEmail());
        if (client.getTelephone() != null) existing.setTelephone(client.getTelephone());
        if (client.getAdresse() != null) existing.setAdresse(client.getAdresse());
        if (client.getProfession() != null) existing.setProfession(client.getProfession());
        if (client.getRevenuMensuel() != null) existing.setRevenuMensuel(client.getRevenuMensuel());
        return clientRepository.save(existing);
    }

    /**
     * Modification complète d'un client par un employé ou admin.
     * Permet de modifier : nom, prénom, email, CIN, téléphone, adresse,
     * profession, revenu, statut, et de réinitialiser le mot de passe.
     */
    @Transactional
    public Client modifierClientComplet(String id, Client client) {
        Client existing = findById(id);

        if (client.getNom() != null) existing.setNom(client.getNom());
        if (client.getPrenom() != null) existing.setPrenom(client.getPrenom());
        if (client.getTelephone() != null) existing.setTelephone(client.getTelephone());
        if (client.getAdresse() != null) existing.setAdresse(client.getAdresse());
        if (client.getProfession() != null) existing.setProfession(client.getProfession());
        if (client.getRevenuMensuel() != null) existing.setRevenuMensuel(client.getRevenuMensuel());
        if (client.getStatut() != null) existing.setStatut(client.getStatut());

        // Mise à jour de l'email avec vérification d'unicité
        if (client.getEmail() != null && !client.getEmail().equals(existing.getEmail())) {
            Client autre = clientRepository.findByEmail(client.getEmail());
            if (autre != null && !autre.getId().equals(id))
                throw new RuntimeException("Un client avec cet email existe déjà.");
            existing.setEmail(client.getEmail());
        }

        // Mise à jour du CIN avec vérification d'unicité
        if (client.getCin() != null && !client.getCin().equals(existing.getCin())) {
            Client autre = clientRepository.findByCin(client.getCin());
            if (autre != null && !autre.getId().equals(id))
                throw new RuntimeException("Un client avec ce CIN existe déjà.");
            existing.setCin(client.getCin());
        }

        // Réinitialisation du mot de passe par l'admin/employé
        if (client.getMotDePasse() != null && !client.getMotDePasse().isBlank()
                && !client.getMotDePasse().startsWith("$2a$")) {
            if (client.getMotDePasse().length() < 6)
                throw new RuntimeException("Le mot de passe doit contenir au moins 6 caractères.");
            existing.setMotDePasse(passwordEncoder.encode(client.getMotDePasse()));
        }

        return clientRepository.save(existing);
    }

    @Transactional
    public void supprimerClient(String id) {
        findById(id);
        clientRepository.deleteById(id);
    }

    @Transactional
    public Client bloquerClient(String id) {
        Client client = findById(id);
        client.setEstBloque(true);
        client.setStatut(Client.Statut.SUSPENDU);
        return clientRepository.save(client);
    }

    @Transactional
    public Client debloquerClient(String id) {
        Client client = findById(id);
        client.setEstBloque(false);
        client.setStatut(Client.Statut.ACTIF);
        return clientRepository.save(client);
    }

    @Transactional
    public void changerMotDePasse(String id, String ancienMotDePasse, String nouveauMotDePasse) {
        Client client = findById(id);
        if (!passwordEncoder.matches(ancienMotDePasse, client.getMotDePasse())) {
            throw new RuntimeException("Ancien mot de passe incorrect.");
        }
        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < 6) {
            throw new RuntimeException("Le nouveau mot de passe doit contenir au moins 6 caractères.");
        }
        client.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        clientRepository.save(client);
    }

    public void reinitialiserMotDePasse(String clientId, String nouveauMotDePasse) {
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Client introuvable : " + clientId));

        if (nouveauMotDePasse == null || nouveauMotDePasse.isBlank())
            throw new RuntimeException("Le nouveau mot de passe ne peut pas être vide.");
        if (nouveauMotDePasse.length() < 8)
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères.");

        client.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        clientRepository.save(client);
    }

}

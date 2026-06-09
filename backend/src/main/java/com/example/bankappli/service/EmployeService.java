package com.example.bankappli.service;

import com.example.bankappli.exception.EntityNotFoundException;
import com.example.bankappli.model.Employe;
import com.example.bankappli.repository.ClientRepository;
import com.example.bankappli.repository.CompteBancaireRepository;
import com.example.bankappli.repository.EmployeRepository;
import com.example.bankappli.repository.OperationBancaireRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClientRepository clientRepository;
    private final CompteBancaireRepository compteBancaireRepository;
    private final OperationBancaireRepository operationBancaireRepository;

    public EmployeService(EmployeRepository employeRepository,
                          PasswordEncoder passwordEncoder,
                          ClientRepository clientRepository,
                          CompteBancaireRepository compteBancaireRepository,
                          OperationBancaireRepository operationBancaireRepository) {
        this.employeRepository = employeRepository;
        this.passwordEncoder = passwordEncoder;
        this.clientRepository = clientRepository;
        this.compteBancaireRepository = compteBancaireRepository;
        this.operationBancaireRepository = operationBancaireRepository;
    }

    public List<Employe> findAll() {
        return employeRepository.findAll();
    }

    public Employe findById(String id) {
        return employeRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Employé introuvable : " + id));
    }

    @Transactional
    public Employe creerEmploye(Employe employe) {
        if (employe.getEmail() != null && employeRepository.findByEmail(employe.getEmail()) != null)
            throw new RuntimeException("Un employé avec cet email existe déjà.");
        if (employe.getCin() != null && employe.getCin().isBlank())
            employe.setCin(null);

        employe.setDateCreation(LocalDate.now());
        employe.setStatut(Employe.Statut.ACTIF);
        employe.setDateEmbauche(employe.getDateEmbauche() != null ? employe.getDateEmbauche() : LocalDate.now());

        if (employe.getMotDePasse() != null && !employe.getMotDePasse().isBlank())
            employe.setMotDePasse(passwordEncoder.encode(employe.getMotDePasse()));
        if (employe.getRole() == null)
            employe.setRole(Employe.Role.EMPLOYE);

        return employeRepository.save(employe);
    }

    @Transactional
    public Employe modifierEmploye(String id, Employe employe) {
        Employe existing = findById(id);
        
        // Champs de base
        if (employe.getNom() != null) existing.setNom(employe.getNom());
        if (employe.getPrenom() != null) existing.setPrenom(employe.getPrenom());
        if (employe.getPoste() != null) existing.setPoste(employe.getPoste());
        if (employe.getDepartement() != null) existing.setDepartement(employe.getDepartement());
        if (employe.getSalaire() != null) existing.setSalaire(employe.getSalaire());
        if (employe.getRole() != null) existing.setRole(employe.getRole());
        
        // Champs supplémentaires pour l'édition complète
        if (employe.getTypeContrat() != null) existing.setTypeContrat(employe.getTypeContrat());
        if (employe.getStatut() != null) existing.setStatut(employe.getStatut());
        if (employe.getTelephone() != null) existing.setTelephone(employe.getTelephone());
        if (employe.getAdresse() != null) existing.setAdresse(employe.getAdresse());
        if (employe.getCin() != null) existing.setCin(employe.getCin());
        if (employe.getAgence() != null) existing.setAgence(employe.getAgence());
        if (employe.getMatricule() != null) existing.setMatricule(employe.getMatricule());
        if (employe.getDateFinContrat() != null) existing.setDateFinContrat(employe.getDateFinContrat());
        if (employe.getSuperviseur() != null) existing.setSuperviseur(employe.getSuperviseur());
        
        // Gestion du mot de passe (ne pas hasher si déjà hashé)
        if (employe.getMotDePasse() != null && !employe.getMotDePasse().isBlank()
                && !employe.getMotDePasse().startsWith("$2a$"))
            existing.setMotDePasse(passwordEncoder.encode(employe.getMotDePasse()));
        
        return employeRepository.save(existing);
    }

    /**
     * Suppression sécurisée d'un employé.
     * Avant de supprimer, on nullifie toutes les FK qui pointent vers cet employé
     * pour éviter les violations de contrainte d'intégrité référentielle.
     */
    @Transactional
    public void supprimerEmploye(String id) {
        Employe employe = findById(id);

        // 1. Nullifier conseiller_dedie dans clients
        clientRepository.findAll().stream()
            .filter(c -> c.getConseillerDedie() != null && c.getConseillerDedie().getId().equals(id))
            .forEach(c -> { c.setConseillerDedie(null); clientRepository.save(c); });

        // 2. Nullifier employe_id dans comptes_bancaires (créateur du compte)
        compteBancaireRepository.findAll().stream()
            .filter(c -> c.getEmploye() != null && c.getEmploye().getId().equals(id))
            .forEach(c -> { c.setEmploye(null); compteBancaireRepository.save(c); });

        // 3. Nullifier employe_valideur_id dans operations_bancaires
        operationBancaireRepository.findAll().stream()
            .filter(o -> o.getEmployeValideur() != null && o.getEmployeValideur().getId().equals(id))
            .forEach(o -> { o.setEmployeValideur(null); operationBancaireRepository.save(o); });

        // 4. Nullifier superviseur dans les autres employés
        employeRepository.findAll().stream()
            .filter(e -> e.getSuperviseur() != null && e.getSuperviseur().getId().equals(id))
            .forEach(e -> { e.setSuperviseur(null); employeRepository.save(e); });

        // 5. Supprimer
        employeRepository.deleteById(id);
    }
}
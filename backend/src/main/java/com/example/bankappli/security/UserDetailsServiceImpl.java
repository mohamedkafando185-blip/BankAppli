package com.example.bankappli.security;

import com.example.bankappli.repository.ClientRepository;
import com.example.bankappli.repository.EmployeRepository;
import com.example.bankappli.model.Client;
import com.example.bankappli.model.Employe;
import com.example.bankappli.model.Person;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final ClientRepository clientRepository;
    private final EmployeRepository employeRepository;

    public UserDetailsServiceImpl(ClientRepository clientRepository, EmployeRepository employeRepository) {
        this.clientRepository = clientRepository;
        this.employeRepository = employeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // Chercher d'abord dans les employés
        Employe employe = employeRepository.findByEmail(email);
        if (employe != null) {
            // CORRECTION : Statut est défini dans Person, pas dans Employe
            if (employe.getStatut() != null && employe.getStatut() != Person.Statut.ACTIF) {
                throw new UsernameNotFoundException("Compte employé inactif : " + email);
            }
            return new User(
                employe.getEmail(),
                employe.getMotDePasse(),
                List.of(new SimpleGrantedAuthority("ROLE_" + employe.getRole().name()))
            );
        }

        // Ensuite parmi les clients
        Client client = clientRepository.findByEmail(email);
        if (client != null) {
            if (Boolean.TRUE.equals(client.getEstBloque())) {
                throw new UsernameNotFoundException("Client bloqué : " + email);
            }
            // CORRECTION : Person.Statut (pas Client.Statut)
            if (client.getStatut() != null && client.getStatut() != Person.Statut.ACTIF) {
                throw new UsernameNotFoundException("Compte client inactif : " + email);
            }
            return new User(
                client.getEmail(),
                client.getMotDePasse(),
                List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
            );
        }

        throw new UsernameNotFoundException("Utilisateur introuvable : " + email);
    }
}
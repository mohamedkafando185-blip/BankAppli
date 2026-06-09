package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "persons")
public abstract class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String nationalite;

    @Column(unique = true)
    private String cin;

    private String adresse;
    private String telephone;

    // BUG FIX #29 : email doit être nullable=false pour la sécurité
    @Column(unique = true, nullable = false)
    private String email;

    // BUG FIX #30 : mot de passe non nullable en base
    @Column(nullable = false)
    private String motDePasse;

    private String photo;

    // BUG FIX #31 : valeur par défaut en Java pour éviter null en base
    @Column(nullable = false, updatable = false)
    private LocalDate dateCreation = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.ACTIF;

    public enum Statut {
        ACTIF, INACTIF, SUSPENDU
    }
}

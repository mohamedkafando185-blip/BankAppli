package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "employes")
public class Employe extends Person {
    private String matricule;
    private String poste;
    private String departement;
    private String agence;
    private LocalDate dateEmbauche;
    private LocalDate dateFinContrat;

    @Enumerated(EnumType.STRING)
    private TypeContrat typeContrat;

    private Double salaire;
    private String rib;

    @Enumerated(EnumType.STRING)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "superviseur_id")
    private Employe superviseur;

    public enum TypeContrat {
        CDI, CDD, STAGE, INTERIM
    }

    public enum Role {
        ADMIN, EMPLOYE, AUDITEUR, MANAGER
    }
}
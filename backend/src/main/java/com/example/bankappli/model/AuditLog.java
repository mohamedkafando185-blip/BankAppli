package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String entite;
    private String entiteId;

    @Enumerated(EnumType.STRING)
    private TypeOperation typeOperation;

    private String champModifie;
    private String ancienneValeur;
    private String nouvelleValeur;
    private LocalDateTime dateAction;
    private String utilisateurId;

    @Enumerated(EnumType.STRING)
    private RoleUtilisateur roleUtilisateur;

    private String canal;
    private String ipOrigine;
    private String commentaire;

    public enum TypeOperation {
        CREATION, MODIFICATION, SUPPRESSION, CONNEXION,
        DECONNEXION, CONSULTATION, TENTATIVE_ECHEC
    }

    public enum RoleUtilisateur {
        ADMIN, EMPLOYE, CLIENT, SYSTEME
    }
}
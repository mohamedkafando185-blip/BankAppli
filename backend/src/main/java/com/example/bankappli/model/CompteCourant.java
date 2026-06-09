package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "comptes_courants")
public class CompteCourant extends CompteBancaire {
    private Double decouvertAutorise;
    private Double decouvertUtilise;
    private Double fraisGestion;
    private String carteAssociee;

    @Enumerated(EnumType.STRING)
    private TypeCompte typeCompte;

    public enum TypeCompte {
        PARTICULIER, PROFESSIONNEL
    }
}
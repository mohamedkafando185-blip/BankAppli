package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "comptes_epargne")
public class CompteEpargne extends CompteBancaire {
    private Double tauxInteret;
    private Double plafond;
    private Integer dureeMinimale;
    private LocalDate dateProchainInteret;
    private Double penaliteRetrait;

    @Enumerated(EnumType.STRING)
    private TypeEpargne typeEpargne;

    public enum TypeEpargne {
        LIVRET, TERME, PLAN
    }
}
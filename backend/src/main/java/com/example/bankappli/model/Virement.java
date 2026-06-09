package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "virements")
public class Virement extends OperationBancaire {
    @ManyToOne
    @JoinColumn(name = "compte_destination_id")
    private CompteBancaire compteDestination;

    private String nomBeneficiaire;
    private String ibanDestination;

    @Enumerated(EnumType.STRING)
    private TypeVirement typeVirement;

    private Boolean estRecurrent;
    private String periodicite;

    public enum TypeVirement {
        INTERNE, EXTERNE
    }
}
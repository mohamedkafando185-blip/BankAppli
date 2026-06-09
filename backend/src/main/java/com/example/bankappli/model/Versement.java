package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "versements")
public class Versement extends OperationBancaire {
    @ManyToOne
    @JoinColumn(name = "compte_destination_id")
    private CompteBancaire compteDestination;

    private String sourceVersement;
    private String numeroCheque;
    private String guichet;
}
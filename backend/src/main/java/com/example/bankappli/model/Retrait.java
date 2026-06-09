package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "retraits")
public class Retrait extends OperationBancaire {
    @Enumerated(EnumType.STRING)
    private ModeRetrait modeRetrait;

    private String adresseDab;
    private String numeroCarte;

    public enum ModeRetrait {
        GUICHET, DAB, EN_LIGNE
    }
}
package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "clients")
public class Client extends Person {
    private String numeroClient;
    private LocalDate dateInscription;
    private Integer scoreCredit;

    @Enumerated(EnumType.STRING)
    private CategorieClient categorieClient;

    @ManyToOne
    @JoinColumn(name = "conseiller_id")
    private Employe conseillerDedie;

    private String pieceJustificative;
    private String numeroPiece;

    @Enumerated(EnumType.STRING)
    private SituationFamiliale situationFamiliale;

    private String profession;
    private Double revenuMensuel;
    private Boolean estBloque;

    public enum CategorieClient {
        STANDARD, PREMIUM, VIP
    }

    public enum SituationFamiliale {
        CELIBATAIRE, MARIE, DIVORCE, VEUF
    }
}
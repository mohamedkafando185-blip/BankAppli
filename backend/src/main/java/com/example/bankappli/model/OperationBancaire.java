package com.example.bankappli.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "operations_bancaires")
// BUG FIX HISTORIQUE : Sans ces annotations, Jackson sérialise le type abstrait
// et perd tous les champs des sous-types (Virement, Retrait, Versement).
// Le champ "type" est ajouté dans le JSON pour que le front puisse distinguer.
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Virement.class,  name = "VIREMENT"),
    @JsonSubTypes.Type(value = Retrait.class,   name = "RETRAIT"),
    @JsonSubTypes.Type(value = Versement.class, name = "VERSEMENT")
})
public abstract class OperationBancaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String idOperation;

    private String reference;

    @Column(nullable = false)
    private LocalDateTime dateOperation;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private String devise = "MAD";

    private String motif;
    private String commentaire;
    private String ipOrigine;
    private LocalDateTime dateValidation;

    private Double soldeAvant;
    private Double soldeApres;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutOperation statut = StatutOperation.VALIDEE;

    // BUG FIX LAZY : FetchType.LAZY sur les relations → LazyInitializationException
    // lors de la sérialisation JSON hors transaction. On force EAGER ici car ces
    // objets sont TOUJOURS nécessaires dans l'historique.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compte_source_id")
    private CompteBancaire compteSource;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employe_valideur_id")
    private Employe employeValideur;

    /**
     * BUG FIX HISTORIQUE : Ce champ String stocke directement "Jean Dupont"
     * ou "admin@bank.com". Il est TOUJOURS rempli par OperationService.
     * Si null → affiche "Inconnu" côté controller (défense en profondeur).
     */
    @Column(name = "initiateur")
    private String initiateur;

    @Column(name = "compte_source_numero")
    private String compteSourceNumero;

    @Column(name = "compte_dest_numero")
    private String compteDestNumero;

    public enum StatutOperation {
        EN_ATTENTE, VALIDEE, REFUSEE, ANNULEE
    }
}

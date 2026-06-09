package com.example.bankappli.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "comptes_bancaires")
public abstract class CompteBancaire {

    @Id
    private String numeroCompte;

    private String rib;
    private String iban;

    @Column(nullable = false)
    private Double solde = 0.0;

    @Column(nullable = false)
    private String devise = "MAD";

    @Column(nullable = false)
    private LocalDate dateOuverture;

    private LocalDate dateFermeture;
    private String agence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCompte statut = StatutCompte.ACTIF;

    // BUG FIX SERIALISATION : FetchType.LAZY → LazyInitializationException hors transaction.
    // @JsonIgnoreProperties évite la boucle infinie client→comptes→client lors
    // de la sérialisation JSON (jackson suit les références circulaires à l'infini).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"comptes", "motDePasse", "conseillerDedie"})
    private Client client;

    // BUG FIX SERIALISATION : idem pour employe
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employe_id")
    @JsonIgnoreProperties({"motDePasse", "superviseur"})
    private Employe employe;

    public enum StatutCompte {
        ACTIF, INACTIF, SUSPENDU, CLOTURE
    }
}

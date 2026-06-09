package com.example.bankappli.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Code secret à 6 chiffres configuré une fois par le client.
 * Doit être saisi AVANT chaque opération (retrait, virement).
 * Différent du mot de passe de connexion.
 */
@Data
@Entity
@Table(name = "codes_transaction")
public class CodeTransaction {

    @Id
    private String clientId;

    @Column(nullable = false)
    private String codeHash; // BCrypt hash du code à 6 chiffres

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private boolean actif = true;
}

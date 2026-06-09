package com.example.bankappli.service;

import com.example.bankappli.model.CodeTransaction;
import com.example.bankappli.repository.CodeTransactionRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CodeTransactionService {

    private final CodeTransactionRepository codeTransactionRepository;
    private final PasswordEncoder passwordEncoder;

    public CodeTransactionService(CodeTransactionRepository codeTransactionRepository,
                                  PasswordEncoder passwordEncoder) {
        this.codeTransactionRepository = codeTransactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean clientAUnCode(String clientId) {
        return codeTransactionRepository.findByClientId(clientId).isPresent();
    }

    /**
     * Définit ou change le code transaction d'un client.
     * Le code doit être exactement 6 chiffres.
     */
    @Transactional
    public void definirCode(String clientId, String code) {
        if (code == null || !code.matches("\\d{6}")) {
            throw new RuntimeException(
                "Le code de transaction doit être composé de 6 chiffres exactement.");
        }

        CodeTransaction ct = codeTransactionRepository.findByClientId(clientId)
            .orElse(new CodeTransaction());
        ct.setClientId(clientId);
        ct.setCodeHash(passwordEncoder.encode(code));
        ct.setUpdatedAt(LocalDateTime.now());
        ct.setCreatedAt(ct.getCreatedAt() == null ? LocalDateTime.now() : ct.getCreatedAt());
        ct.setActif(true);
        codeTransactionRepository.save(ct);
    }

    /**
     * Vérifie le code transaction avant une opération.
     * Lève une exception explicite si invalide.
     */
    public void verifier(String clientId, String code) {
        if (code == null || code.isBlank()) {
            throw new RuntimeException(
                "Le code de transaction est obligatoire pour effectuer cette opération.");
        }

        CodeTransaction ct = codeTransactionRepository.findByClientId(clientId)
            .orElseThrow(() -> new RuntimeException(
                "Vous n'avez pas encore défini votre code de transaction. " +
                "Rendez-vous dans votre profil pour en créer un."));

        if (!ct.isActif()) {
            throw new RuntimeException("Votre code de transaction est désactivé. Contactez votre conseiller.");
        }

        if (!passwordEncoder.matches(code, ct.getCodeHash())) {
            throw new RuntimeException(
                "Code de transaction incorrect. Opération refusée.");
        }
    }
}

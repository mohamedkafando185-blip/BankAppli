package com.example.bankappli.service;

import com.example.bankappli.model.OtpToken;
import com.example.bankappli.repository.OtpTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final OtpTokenRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:#{null}}")
    private String mailUsername;

    public OtpService(OtpTokenRepository otpRepository,
                      @Autowired(required = false) JavaMailSender mailSender) {
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    /**
     * Génère un OTP à 6 chiffres valide 10 minutes.
     * Utilise REQUIRES_NEW pour s'assurer que le delete + save sont committé
     * indépendamment de toute transaction parente.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> genererEtEnvoyer(String email, OtpToken.TypeOtp type) {
        // Supprimer tous les anciens OTP de cet email/type
        otpRepository.deleteByEmailAndType(email, type);
        otpRepository.flush();

        String code = genererCode();

        OtpToken otp = new OtpToken();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setType(type);
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otp.setUsed(false);
        otpRepository.saveAndFlush(otp);

        boolean smtpConfigured = estSmtpConfigured();
        boolean emailEnvoye = false;

        if (smtpConfigured) {
            try {
                envoyerEmail(email, code, type);
                emailEnvoye = true;
                log.info("OTP envoyé par email à {}", email);
            } catch (Exception e) {
                log.warn("Échec envoi email OTP à {} : {}. Code disponible dans la réponse.", email, e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", emailEnvoye
            ? "Code OTP envoyé à " + email + ". Il est valable 10 minutes."
            : "Code OTP généré. Il est valable 10 minutes.");

        // Si SMTP non configuré ou envoi échoué : exposer le code (mode développement)
        if (!emailEnvoye) {
            result.put("code", code);
            result.put("note", "Mode développement : SMTP non configuré. Le code est exposé ici.");
            result.put("expiresAt", otp.getExpiresAt().toString());
        }

        return result;
    }
    // ← Ta méthode genererEtEnvoyer existante

    // AJOUTER ICI ↓
    public boolean verifierOtp(String email, String code, OtpToken.TypeOtp type) {
        OtpToken otp = otpRepository
            .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type)
            .orElse(null);

        if (otp == null) return false;
        if (otp.isUsed()) return false;
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) return false;
        if (!otp.getCode().equals(code)) return false;

        otp.setUsed(true);
        otpRepository.saveAndFlush(otp);
        return true;
}

    @Transactional
    public void verifier(String email, String code, OtpToken.TypeOtp type) {
        if (code == null || code.isBlank())
            throw new RuntimeException(
                "Code OTP manquant. Cliquez sur 'Envoyer OTP' pour recevoir un code.");

        Optional<OtpToken> otpOpt = otpRepository
            .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type);

        if (otpOpt.isEmpty())
            throw new RuntimeException(
                "Aucun code OTP actif. Cliquez sur 'Envoyer OTP' pour en obtenir un nouveau.");

        OtpToken otp = otpOpt.get();

        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otp.setUsed(true);
            otpRepository.save(otp);
            throw new RuntimeException(
                "Le code OTP a expiré (validité 10 minutes). Cliquez sur 'Envoyer OTP' pour en obtenir un nouveau.");
        }

        if (!otp.getCode().equals(code.trim()))
            throw new RuntimeException("Code OTP incorrect. Vérifiez le code à 6 chiffres et réessayez.");

        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP validé pour {}", email);
    }

    private boolean estSmtpConfigured() {
        return mailSender != null
            && mailUsername != null
            && !mailUsername.isBlank()
            && !mailUsername.equals("votre.email@gmail.com");
    }

    private String genererCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1000000));
    }

    private void envoyerEmail(String email, String code, OtpToken.TypeOtp type) {
        if (mailSender == null) {
            log.warn("JavaMailSender non disponible. Email non envoyé.");
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        if (type == OtpToken.TypeOtp.TRANSACTION) {
            message.setSubject("BankAppli — Code de validation de transaction");
            message.setText(
                "Bonjour,\n\nVotre code de validation est :\n\n    " + code +
                "\n\nValable 10 minutes.\n\nBankAppli — Sécurité");
        } else {
            message.setSubject("BankAppli — Réinitialisation de mot de passe");
            message.setText(
                "Bonjour,\n\nVotre code de réinitialisation est :\n\n    " + code +
                "\n\nValable 10 minutes.\n\nBankAppli");
        }
        mailSender.send(message);
    }
}

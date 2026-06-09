package com.example.bankappli.controller;

import com.example.bankappli.model.Client;
import com.example.bankappli.repository.ClientRepository;
import com.example.bankappli.service.CodeTransactionService;
import com.example.bankappli.service.OtpService;
import com.example.bankappli.model.OtpToken;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/securite")
public class SecuriteController {

    private final CodeTransactionService codeTransactionService;
    private final OtpService otpService;
    private final ClientRepository clientRepository;

    public SecuriteController(CodeTransactionService codeTransactionService,
                              OtpService otpService,
                              ClientRepository clientRepository) {
        this.codeTransactionService = codeTransactionService;
        this.otpService = otpService;
        this.clientRepository = clientRepository;
    }

    /** Définir ou changer le code transaction (6 chiffres) */
    @PostMapping("/code-transaction")
    public ResponseEntity<?> definirCode(@RequestBody Map<String, String> body,
                                         Authentication authentication) {
        try {
            Client client = clientRepository.findByEmail(authentication.getName());
            if (client == null)
                return ResponseEntity.status(404)
                    .body(Map.of("error", "Client introuvable."));

            codeTransactionService.definirCode(client.getId(), body.get("code"));
            return ResponseEntity.ok(Map.of(
                "message", "Code de transaction défini avec succès."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Vérifier si le client a déjà un code transaction défini */
    @GetMapping("/code-transaction/statut")
    public ResponseEntity<?> statutCode(Authentication authentication) {
        Client client = clientRepository.findByEmail(authentication.getName());
        if (client == null)
            return ResponseEntity.status(404).body(Map.of("error", "Client introuvable."));
        boolean aUnCode = codeTransactionService.clientAUnCode(client.getId());
        return ResponseEntity.ok(Map.of("aUnCodeTransaction", aUnCode));
    }

    /** Demander un OTP de réinitialisation de mot de passe */
    @PostMapping("/otp/mot-de-passe")
    public ResponseEntity<?> otpMotDePasse(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.isBlank())
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email obligatoire."));
            otpService.genererEtEnvoyer(email, OtpToken.TypeOtp.PASSWORD_RESET);
            return ResponseEntity.ok(Map.of(
                "message", "Code OTP envoyé à " + email + ". Valable 2 minutes."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

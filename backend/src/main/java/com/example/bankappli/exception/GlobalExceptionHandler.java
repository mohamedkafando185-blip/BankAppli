package com.example.bankappli.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException e) {
        return erreur(HttpStatus.NOT_FOUND, "Ressource introuvable", e.getMessage());
    }

    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficient(InsufficientBalanceException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Solde insuffisant", e.getMessage());
    }

    @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<Map<String, Object>> handleAccountStatus(AccountStatusException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Statut du compte invalide", e.getMessage());
    }

    @ExceptionHandler(InvalidAmountException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidAmount(InvalidAmountException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Montant invalide", e.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException e) {
        return erreur(HttpStatus.UNAUTHORIZED, "Authentification échouée",
            "Email ou mot de passe incorrect.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException e) {
        return erreur(HttpStatus.FORBIDDEN, "Accès refusé",
            "Vous n'avez pas les droits nécessaires pour effectuer cette action.");
    }

    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<Map<String, Object>> handleNumberFormat(NumberFormatException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Format numérique invalide", e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Erreur de traitement", e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception e) {
        return erreur(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur",
            "Une erreur inattendue s'est produite. Contactez l'administrateur.");
    }

    private ResponseEntity<Map<String, Object>> erreur(HttpStatus status, String type, String detail) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", type);
        body.put("message", detail);
        return ResponseEntity.status(status).body(body);
    }
}

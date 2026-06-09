package com.example.bankappli.exception;

public class AccountStatusException extends RuntimeException {
    public AccountStatusException(String message) {
        super(message);
    }
}
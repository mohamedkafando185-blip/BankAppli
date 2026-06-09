package com.example.bankappli.repository;

import com.example.bankappli.model.CodeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CodeTransactionRepository extends JpaRepository<CodeTransaction, String> {
    Optional<CodeTransaction> findByClientId(String clientId);
}

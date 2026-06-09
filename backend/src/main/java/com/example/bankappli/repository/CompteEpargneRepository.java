package com.example.bankappli.repository;

import com.example.bankappli.model.CompteEpargne;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompteEpargneRepository extends JpaRepository<CompteEpargne, String> {
    List<CompteEpargne> findByClientId(String clientId);
}
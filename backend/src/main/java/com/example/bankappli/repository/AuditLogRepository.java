package com.example.bankappli.repository;

import com.example.bankappli.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByUtilisateurId(String utilisateurId);
    List<AuditLog> findByEntite(String entite);
}
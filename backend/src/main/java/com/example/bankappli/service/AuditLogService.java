package com.example.bankappli.service;

import com.example.bankappli.model.AuditLog;
import com.example.bankappli.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> findAll() {
        return auditLogRepository.findAll();
    }

    public List<AuditLog> findByUtilisateur(String utilisateurId) {
        return auditLogRepository.findByUtilisateurId(utilisateurId);
    }

    @Transactional
    public void logAction(String entite, String entiteId, AuditLog.TypeOperation typeOperation,
                          String champModifie, String ancienneValeur, String nouvelleValeur,
                          String utilisateurId, AuditLog.RoleUtilisateur role) {
        AuditLog log = new AuditLog();
        log.setEntite(entite);
        log.setEntiteId(entiteId);
        log.setTypeOperation(typeOperation);
        log.setChampModifie(champModifie);
        log.setAncienneValeur(ancienneValeur);
        log.setNouvelleValeur(nouvelleValeur);
        log.setUtilisateurId(utilisateurId);
        log.setRoleUtilisateur(role);
        log.setDateAction(LocalDateTime.now());
        log.setCanal("API_REST");
        auditLogRepository.save(log);
    }
}
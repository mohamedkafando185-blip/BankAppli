package com.example.bankappli.controller;

import com.example.bankappli.model.AuditLog;
import com.example.bankappli.service.AuditLogService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AuditLog> getAll() {
        return auditLogService.findAll();
    }

    @GetMapping("/utilisateur/{id}")
    public List<AuditLog> getByUtilisateur(@PathVariable String id) {
        return auditLogService.findByUtilisateur(id);
    }
}
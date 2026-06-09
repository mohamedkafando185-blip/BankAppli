package com.example.bankappli.controller;

import com.example.bankappli.model.Employe;
import com.example.bankappli.service.EmployeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employes")
public class EmployeController {

    private final EmployeService employeService;

    public EmployeController(EmployeService employeService) {
        this.employeService = employeService;
    }

    @GetMapping
    public List<Employe> getAll() {
        return employeService.findAll();
    }

    @GetMapping("/{id}")
    public Employe getById(@PathVariable String id) {
        return employeService.findById(id);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Employe employe) {
        try {
            return ResponseEntity.ok(employeService.creerEmploye(employe));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Employe employe) {
        try {
            return ResponseEntity.ok(employeService.modifierEmploye(id, employe));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            employeService.supprimerEmploye(id);
            return ResponseEntity.ok(Map.of("message", "Employé supprimé avec succès."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

package com.example.bankappli.repository;

import com.example.bankappli.model.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeRepository extends JpaRepository<Employe, String> {

    /**
     * CORRECTION : Employe hérite de Person via @Inheritance(JOINED)
     * Il n'y a pas de champ "e.person" — on accède directement aux champs hérités (e.email)
     */
    @Query("SELECT e FROM Employe e WHERE e.email = :email")
    Employe findByEmail(@Param("email") String email);

    Employe findByMatricule(String matricule);
}
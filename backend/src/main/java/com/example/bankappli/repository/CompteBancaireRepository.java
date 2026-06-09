package com.example.bankappli.repository;

import com.example.bankappli.model.CompteBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CompteBancaireRepository extends JpaRepository<CompteBancaire, String> {

    @Query("SELECT c FROM CompteBancaire c JOIN FETCH c.client WHERE c.client.id = :clientId")
    List<CompteBancaire> findByClientId(@Param("clientId") String clientId);

    @Query("SELECT c FROM CompteBancaire c JOIN FETCH c.client")
    List<CompteBancaire> findAllWithClient();

    // Recherche par RIB (24 chiffres) — utilisé pour les virements
    @Query("SELECT c FROM CompteBancaire c JOIN FETCH c.client WHERE c.rib = :rib")
    Optional<CompteBancaire> findByRib(@Param("rib") String rib);

    CompteBancaire findByIban(String iban);
}

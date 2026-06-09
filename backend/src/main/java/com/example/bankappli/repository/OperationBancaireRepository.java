package com.example.bankappli.repository;

import com.example.bankappli.model.OperationBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OperationBancaireRepository extends JpaRepository<OperationBancaire, String> {

    @Query(value = """
        SELECT DISTINCT ob.id_operation FROM operations_bancaires ob
        LEFT JOIN virements v  ON v.id_operation  = ob.id_operation
        LEFT JOIN versements vs ON vs.id_operation = ob.id_operation
        WHERE ob.compte_source_id        = :num
           OR v.compte_destination_id   = :num
           OR vs.compte_destination_id  = :num
        ORDER BY ob.date_operation DESC
        """, nativeQuery = true)
    List<String> findIdsByCompteNumero(@Param("num") String numeroCompte);

    @Query(value = """
        SELECT DISTINCT ob.id_operation FROM operations_bancaires ob
        LEFT JOIN comptes_bancaires cb_src ON ob.compte_source_id       = cb_src.numero_compte
        LEFT JOIN virements v              ON v.id_operation             = ob.id_operation
        LEFT JOIN comptes_bancaires cb_vir ON v.compte_destination_id   = cb_vir.numero_compte
        LEFT JOIN versements vs            ON vs.id_operation            = ob.id_operation
        LEFT JOIN comptes_bancaires cb_vs  ON vs.compte_destination_id  = cb_vs.numero_compte
        WHERE cb_src.client_id = :clientId
           OR cb_vir.client_id = :clientId
           OR cb_vs.client_id  = :clientId
        ORDER BY ob.date_operation DESC
        """, nativeQuery = true)
    List<String> findIdsByClientId(@Param("clientId") String clientId);

    @Query("SELECT o FROM OperationBancaire o " +
           "LEFT JOIN FETCH o.compteSource cs " +
           "LEFT JOIN FETCH cs.client " +
           "ORDER BY o.dateOperation DESC")
    List<OperationBancaire> findAllWithDetails();

    // Nouvelle méthode pour récupérer toutes les opérations d'un client en une seule requête
    @Query("SELECT o FROM OperationBancaire o " +
           "LEFT JOIN FETCH o.compteSource cs " +
           "LEFT JOIN FETCH cs.client " +
           "LEFT JOIN FETCH o.employeValideur " +
           "WHERE cs.client.id = :clientId " +
           "OR EXISTS (SELECT 1 FROM Virement v WHERE v.idOperation = o.idOperation AND v.compteDestination.client.id = :clientId) " +
           "OR EXISTS (SELECT 1 FROM Versement vs WHERE vs.idOperation = o.idOperation AND vs.compteDestination.client.id = :clientId) " +
           "ORDER BY o.dateOperation DESC")
    List<OperationBancaire> findAllByClientId(@Param("clientId") String clientId);
}
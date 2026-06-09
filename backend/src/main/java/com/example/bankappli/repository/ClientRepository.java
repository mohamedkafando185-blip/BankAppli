package com.example.bankappli.repository;

import com.example.bankappli.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, String> {
    Client findByEmail(String email);
    Client findByNumeroClient(String numeroClient);
    Client findByCin(String cin);
}
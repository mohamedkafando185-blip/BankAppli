package com.example.bankappli.repository;

import com.example.bankappli.model.CompteCourant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompteCourantRepository extends JpaRepository<CompteCourant, String> {
    List<CompteCourant> findByClientId(String clientId);
}
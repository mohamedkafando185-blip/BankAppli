package com.example.bankappli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BankappliApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankappliApplication.class, args);
    }

    /**
     * BUG FIX #39 : enregistrer le module Hibernate pour que Jackson
     * ne plante pas sur les proxies LAZY non initialisés.
     * Sérialise les propriétés LAZY non chargées comme null.
     */
    @Bean
    public Hibernate6Module hibernateModule() {
        Hibernate6Module module = new Hibernate6Module();
        module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
        return module;
    }
}

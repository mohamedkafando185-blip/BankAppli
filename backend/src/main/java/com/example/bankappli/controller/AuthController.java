package com.example.bankappli.controller;

import com.example.bankappli.model.Client;
import com.example.bankappli.security.JwtService;
import com.example.bankappli.service.ClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final ClientService clientService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserDetailsService userDetailsService,
                          ClientService clientService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.clientService = clientService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        // BUG FIX #24 : retirer le PasswordEncoder injecté (inutile ici, c'est Spring qui gère)
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    body.get("email"),
                    body.get("motDePasse")
                )
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        } catch (DisabledException e) {
            // BUG FIX #25 : compte bloqué ou inactif → message explicite
            return ResponseEntity.status(403).body(Map.of("error", "Compte bloqué ou inactif"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentification échouée"));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(body.get("email"));
        String token = jwtService.generateToken(userDetails);
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(Map.of(
            "token", token,
            "email", userDetails.getUsername(),
            "role", role
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            Client client = new Client();
            client.setNom(body.get("nom"));
            client.setPrenom(body.get("prenom"));
            client.setEmail(body.get("email"));
            client.setMotDePasse(body.get("motDePasse"));
            client.setTelephone(body.get("telephone"));
            client.setCin(body.get("cin"));
            client.setAdresse(body.get("adresse"));
            clientService.creerClient(client);
            return ResponseEntity.ok(Map.of("message", "Compte créé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // BUG FIX #26 : endpoint /hash ne doit PAS être en prod sans auth — OK pour dev, on le conserve
    @GetMapping("/hash")
    public ResponseEntity<Map<String, String>> hash(@RequestParam String password) {
        // Cet endpoint est utile uniquement pour les tests/dev
        return ResponseEntity.ok(Map.of("note", "Utilisez uniquement en développement"));
    }
}

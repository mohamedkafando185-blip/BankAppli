# BankAppli — Application de Gestion Bancaire

Application bancaire full-stack (Spring Boot + React + MySQL) conteneurisée avec Docker.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Ports libres : **3000** (frontend), **8080** (backend), **3306** (MySQL)

---

## Démarrage rapide

### 1. Configurer le SMTP (envoi d'emails OTP)

Éditez `backend/src/main/resources/application.properties` :

```properties
spring.mail.username=votre.email@gmail.com
spring.mail.password=votre_mot_de_passe_application
```

> **Gmail** : Activez "Mots de passe d'application" dans les paramètres de sécurité Google, puis utilisez ce mot de passe (pas votre mot de passe Gmail habituel).

### 2. Lancer l'application

```bash
# Premier lancement (build complet)
docker compose up --build -d

# Lancements suivants (plus rapide)
docker compose up -d
```

### 3. Vérifier que tout tourne

```bash
docker compose ps
```

Vous devriez voir 3 conteneurs avec le statut **Up** :
- `bankappli-mysql`
- `bankappli-backend`
- `bankappli-frontend`

### 4. Accéder à l'application

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000       |
| Backend    | http://localhost:8080/api   |
| MySQL      | localhost:3306              |

---

## Comptes par défaut

| Rôle  | Email                    | Mot de passe |
|-------|--------------------------|--------------|
| Admin | admin@bankappli.com      | admin123     |
| Client test | client@test.com   | client123    |

---

## Commandes utiles

```bash
# Arrêter l'application
docker compose down

# Arrêter et supprimer les données (reset complet)
docker compose down -v

# Voir les logs en temps réel
docker compose logs -f backend

# Rebuilder uniquement le backend après modification
docker compose build backend --no-cache
docker compose up -d backend

# Accéder à MySQL
docker exec -it bankappli-mysql mysql -u bankuser -pbankpass bankappli
```

---

## Appliquer la migration v2 (base existante)

Si vous mettez à jour depuis une version précédente :

```bash
# Copier le fichier dans le conteneur MySQL
docker cp migration_v2.sql bankappli-mysql:/tmp/migration_v2.sql

# Exécuter la migration
docker exec -it bankappli-mysql mysql -u bankuser -pbankpass bankappli -e "source /tmp/migration_v2.sql"
```

---

## Architecture

```
Bank/
├── backend/          # Spring Boot 3.1 + Java 17
│   ├── src/main/java/com/example/bankappli/
│   │   ├── controller/   # REST endpoints
│   │   ├── model/        # Entités JPA
│   │   ├── repository/   # Spring Data JPA
│   │   ├── service/      # Logique métier
│   │   ├── security/     # JWT + Spring Security
│   │   └── exception/    # Gestion d'erreurs
│   └── src/main/resources/
│       └── application.properties
├── frontend/         # React 18
│   └── src/
│       ├── pages/    # Login, Comptes, Operations, Profil...
│       └── services/ # api.js (appels HTTP)
├── docker-compose.yml
├── init.sql          # Données initiales
└── migration_v2.sql  # Migration base existante
```

---

## Fonctionnalités

### Sécurité
- Authentification JWT (8h de validité)
- **Code de transaction** (6 chiffres) requis pour retrait/virement côté client
- **Code OTP** envoyé par email, valide **2 minutes**, avant chaque opération client
- Versement réservé aux employés/admin (les clients ne peuvent pas créditer eux-mêmes)
- Audit trail complet des opérations (qui a fait quoi)

### Comptes
- RIB à **24 chiffres** au format bancaire
- Compte courant (avec découvert autorisé) et compte épargne (avec plafond et taux)
- Copie rapide du RIB et du numéro de compte

### Opérations
- Virement, retrait (client) — avec double validation OTP + code transaction
- Versement (employés/admin uniquement)
- Historique personnalisé : chaque client voit **uniquement ses opérations**
- Solde avant/après enregistré pour chaque opération
- Traçabilité employé : l'admin voit qui a effectué chaque opération

### Rôles
| Rôle      | Versement | Retrait/Virement | Gestion clients | Gestion employés | Audit |
|-----------|-----------|------------------|-----------------|-----------------|-------|
| ADMIN     | ✓         | ✓                | ✓               | ✓               | ✓     |
| MANAGER   | ✓         | ✓                | ✓               | Modifier        | ✓     |
| EMPLOYE   | ✓         | ✓                | ✓               | ✗               | ✗     |
| AUDITEUR  | ✗         | ✗                | Lecture         | Lecture         | ✓     |
| CLIENT    | ✗         | ✓ (avec OTP)     | Son profil      | ✗               | ✗     |

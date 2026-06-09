# BankAppli — Application de Gestion Bancaire

[![Java](https://img.shields.io/badge/Java-17-007396?logo=java)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-26-2496ED?logo=docker)](https://www.docker.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)

**BankAppli** est une application bancaire complète développée dans le cadre du projet de fin d'année à l'École Mohammadia d'Ingénieurs (EMI). L'application permet la gestion centralisée des clients, des comptes bancaires et des opérations financières sécurisées.

---

## Table des matières

- [Prérequis](#prérequis)
- [Installation rapide](#installation-rapide)
- [Configuration SMTP (obligatoire)](#configuration-smtp-obligatoire)
- [Comptes par défaut](#comptes-par-defaut)
- [Commandes Docker utiles](#commandes-docker-utiles)
- [Architecture du projet](#architecture-du-projet)
- [Fonctionnalités](#fonctionnalites)
- [Structure des rôles](#structure-des-roles)
- [API REST principales](#api-rest-principales)
- [Migration d'une version existante](#migration-dune-version-existante)
- [Dépannage](#depannage)
- [Équipe](#equipe)

---

## Prérequis

| Outil | Version | Téléchargement |
| :--- | :--- | :--- |
| **Docker Desktop** | 26+ | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Ports libres** | 3000, 8080, 3306 | — |

> ⚠️ **Important** : Docker Desktop doit être démarré avant de lancer l'application.

---

## Installation rapide

### 1. Cloner le dépôt

git clone [https://github.com/mohamedkafando185-blip/BankAppli.git](https://github.com/mohamedkafando185-blip/BankAppli.git)
cd BankAppli

### 2. Configurer le SMTP (obligatoire)
Éditez le fichier backend/src/main/resources/application.properties :
spring.mail.username=votre.email@gmail.com
spring.mail.password=votre_mot_de_passe_application

> 💡 Configuration Gmail : Activez les "Mots de passe d'application" dans votre compte Google (Sécurité → Mots de passe d'application). Utilisez ce mot de passe de 16 caractères, pas votre mot de passe Gmail habituel.

### 3. Lancer l'application

#### Premier lancement (build complet)
docker compose up --build -d

#### Lancements suivants (plus rapide)
docker compose up -d

### 4. Vérifier l'état des conteneurs
docker compose ps

Vous devriez voir 3 conteneurs avec le statut Up :

| Conteneur | Port | Rôle |
| :--- | :--- | :--- |
| bankappli-mysql | 3306 | Base de données MySQL |
| bankappli-backend | 8080 | API Spring Boot |
| bankappli-frontend | 3000 | Interface React |

### 5. Accéder à l'application

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| MySQL | localhost:3306 |

---

## Comptes par défaut

| Rôle | Email | Mot de passe | Droits |
| :--- | :--- | :--- | :--- |
| Administrateur | admin@bankappli.com | admin123 | Accès total |
| Employé | employe@bankappli.com | employe123 | Gestion clients, versements |
| Client | client@test.com | client123 | Virements, retraits (avec OTP) |

Note : Le compte administrateur et le client sont automatiquement créés au premier démarrage via le script init.sql.

---

## Commandes Docker utiles

# Arrêter l'application
docker compose down

# Arrêter et supprimer les volumes (reset complet)
docker compose down -v

# Voir les logs en temps réel
docker compose logs -f backend

# Rebuilder uniquement le backend après modification
docker compose build backend --no-cache
docker compose up -d backend

# Rebuilder uniquement le frontend
docker compose build frontend --no-cache
docker compose up -d frontend

# Accéder à MySQL
docker exec -it bankappli-mysql mysql -u bankuser -pbankpass bankappli

# Voir la consommation des conteneurs
docker stats

## Architecture du projet

---

BankAppli/ \
├── backend/ \
│   ├── Dockerfile \
│   ├── pom.xml \
│   └── src/main/java/com/example/bankappli/ \
│       ├── controller/      # REST endpoints (Auth, Client, Compte, Operation, Employe, Audit) \
│       ├── model/           # Entités JPA (Person,Client, Employe, CompteBancaire, OperationBancaire) \
│       ├── repository/      # Spring Data JPA \
│       ├── service/         # Logique métier (Client, Compte, Operation, Otp, Audit) \
│       ├── security/        # JWT + Spring Security  \(JwtService, JwtAuthFilter, SecurityConfig) \
│       └── exception/       # Gestion centralisée des erreurs \
├── frontend/ \
│   ├── Dockerfile \
│   ├── package.json \
│   └── src/ \
│       ├── pages/           # Composants React (Login,  \Register, Clients, Comptes, Operations, Employes, Profil) \
│       ├── services/        # Appels API (api.js) \
│       └── App.js \
├── docker-compose.yml \
├── init.sql                 # Base de données initiale \
├── migration_v2.sql          # Migration pour base existante \
└── README.md \

---

## Fonctionnalités

### Sécurité

| Mécanisme | Implémentation |
| :--- | :--- |
| Authentification | JWT (expiration 24h) |
| Mots de passe | BCrypt (facteur 10) |
| Double facteur | Code de transaction (6 chiffres, hashé BCrypt) |
| Validation OTP | 6 chiffres par email (valable 2 minutes) |
| Audit | Table audit_log immuable (qui, quoi, quand, avant/après) |

### Comptes bancaires

| Type | Caractéristiques |
| :--- | :--- |
| Compte courant | Découvert autorisé, frais de gestion |
| Compte épargne | Taux d'intérêt, plafond, pénalité de retrait anticipé |
| RIB | 24 chiffres au format bancaire (copie rapide) |

### Opérations

| Opération | Client | Employé/Admin | Sécurité |
| :--- | :---: | :---: | :--- |
| Virement | Oui | Oui | Code transaction + OTP |
| Retrait | Oui | Oui | Code transaction + OTP |
| Versement | Non | Oui | OTP uniquement |

### Traçabilité

| Fonctionnalité | Description |
| :--- | :--- |
| Historique personnalisé | Chaque client voit uniquement ses opérations |
| Solde avant/après | Enregistré pour chaque opération |
| Auteur | Visible par l'admin (qui a effectué l'opération) |

---

## Structure des rôles

| Rôle | Versement | Retrait/Virement | Gestion clients | Gestion employés | Audit | Code transaction |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| ADMIN | Oui | Oui | Oui | Oui | Oui | Non |
| MANAGER | Oui | Oui | Oui | Modification | Oui | Non |
| EMPLOYE | Oui | Oui | Oui | Non | Non | Non |
| AUDITEUR | Non | Non | Lecture | Lecture | Oui | Non |
| CLIENT | Non | Oui (OTP) | Son profil | Non | Non | Oui |

---

## API REST principales

| Méthode | Endpoint | Accès | Description |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/login | Public | Connexion, retourne JWT |
| POST | /api/auth/register | Public | Inscription client |
| GET | /api/clients | EMPLOYE | Liste tous les clients |
| POST | /api/comptes/courant/{id} | EMPLOYE | Ouvrir compte courant |
| POST | /api/operations/otp/demander | CLIENT | Demander un OTP |
| POST | /api/operations/virement | Tous | Virement (code + OTP pour client) |
| GET | /api/operations/me | CLIENT | Historique personnel |
| GET | /api/audit | EMPLOYE | Journal d'audit |
| POST | /api/securite/code-transaction | CLIENT | Définir code transaction |

Documentation Swagger : http://localhost:8080/swagger-ui.html

---

## Migration d'une version existante

Si vous mettez à jour depuis une version antérieure :

# Copier le fichier de migration dans le conteneur
docker cp migration_v2.sql bankappli-mysql:/tmp/migration_v2.sql

# Exécuter la migration
docker exec -it bankappli-mysql mysql -u bankuser -pbankpass bankappli -e "source /tmp/migration_v2.sql"

Modifications de la migration v2 :
- Ajout des colonnes solde_avant et solde_apres dans operations_bancaires
- Ajout du champ initiateur pour traçabilité employé
- Ajout des tables otp_tokens et codes_transaction

---

## Dépannage

Erreur : "port is already allocated"
# Trouver le processus utilisant le port 8080
netstat -ano | findstr :8080

# Arrêter le processus (remplacer PID par l'identifiant)
taskkill /PID <PID> /F

Erreur : "Access denied for user 'bankuser'"
# Réinitialiser les droits MySQL
docker exec -it bankappli-mysql mysql -u root -prootpass

GRANT ALL PRIVILEGES ON bankappli.* TO 'bankuser'@'%';
FLUSH PRIVILEGES;

Erreur : "Cannot connect to MySQL"
# Redémarrer MySQL seul
docker compose restart mysql

# Vérifier que MySQL est sain
docker exec -it bankappli-mysql mysqladmin ping -u bankuser -pbankpass

OTP ne s'envoie pas
- Vérifiez votre configuration SMTP dans application.properties
- Activez les "Mots de passe d'application" dans Gmail
- Consultez les logs : docker compose logs backend | findstr "OTP"

---

## Équipe

| Nom | Rôle |
| :--- | :--- |
| ABOUBAKAR Abdelaziz | Développeur Backend |
| DIN Isaac Kaougahi | Développeur Frontend |
| KAFANDO Mohamed | DevOps / Base de données |
| ZOUNGRANA Abdoul Gafarou | Documentation / Tests |

Encadré par : Pr. Zohair ELMOURABIT

Établissement : École Mohammadia d'Ingénieurs (EMI) — Département Génie Informatique

Année académique : 2025 — 2026

## Licence

Ce projet est développé dans un cadre pédagogique à l'École Mohammadia d'Ingénieurs. Toute reproduction ou utilisation doit mentionner la source.

BankAppli — Votre banque, à portée de main. 🏦
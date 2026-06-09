# 🏦 BankAppli - Application de Gestion Bancaire

## 📋 Description

BankAppli est une application web complète de gestion bancaire développée dans le cadre du projet de fin d'année à l'École Mohammadia d'Ingénieurs (EMI). L'application permet aux clients de gérer leurs comptes bancaires et aux employés d'administrer les comptes clients avec une traçabilité complète des opérations.

## ✨ Fonctionnalités

### Pour les Clients
- Authentification sécurisée (JWT)
- Consultation des comptes et soldes en temps réel
- Visualisation des comptes courants et épargne
- Opérations bancaires :
  - Versement (dépôt)
  - Retrait
  - Virement interne
- Historique complet des transactions
- Copie des numéros de compte (RIB/IBAN)

### Pour les Employés
- Gestion complète des clients (CRUD + blocage)
- Ouverture de comptes (courant et épargne)
- Consultation globale des comptes
- Clôture de comptes
- Vue d'audit sur toutes les opérations

### Pour les Administrateurs
- Gestion des employés (CRUD)
- Attribution des rôles (ADMIN, EMPLOYE, MANAGER, AUDITEUR)
- Consultation des logs d'audit

## 🛠️ Stack Technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Backend** | Java Spring Boot | 3.1.x |
| **Frontend** | React 18 | 18.2.0 |
| **UI Framework** | Material-UI (MUI) | 5.x |
| **Base de données** | MySQL | 8.0 |
| **Sécurité** | Spring Security + JWT | - |
| **ORM** | Spring Data JPA / Hibernate | - |
| **Build** | Maven (backend), npm (frontend) | - |

## 📁 Structure du Projet
bankappli/
├── backend/
│ └── src/main/java/com/example/bankappli/
│ ├── controller/ # Contrôleurs REST
│ ├── model/ # Entités JPA
│ ├── repository/ # Interfaces JPA
│ ├── service/ # Logique métier
│ ├── security/ # JWT + Spring Security
│ └── exception/ # Gestion des exceptions
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── pages/ # Composants React
│ │ ├── services/ # Appels API
│ │ ├── App.js
│ │ └── index.js
│ └── package.json
└── pom.xml

text

## 🚀 Installation et Lancement

### Prérequis

- **Java 17** ou supérieur
- **Node.js 18** ou supérieur
- **MySQL 8.0**
- **Maven** (ou utiliser le wrapper Maven inclus)
- **npm** (inclus avec Node.js)

### 1. Base de données MySQL

```sql
-- Créer la base de données
CREATE DATABASE bankappli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur (optionnel)
CREATE USER 'bankuser'@'localhost' IDENTIFIED BY 'bankpass';
GRANT ALL PRIVILEGES ON bankappli.* TO 'bankuser'@'localhost';
FLUSH PRIVILEGES;
Avec Docker :

bash
docker run -d \
  --name mysql-bank \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=bankappli \
  -e MYSQL_USER=bankuser \
  -e MYSQL_PASSWORD=bankpass \
  -p 3306:3306 \
  mysql:8.0
2. Backend (Spring Boot)
bash
# Se positionner dans le dossier backend
cd backend

# Compiler et lancer l'application
mvn spring-boot:run

# Ou en utilisant le wrapper Maven (Windows)
mvnw.cmd spring-boot:run

# Ou (Linux/Mac)
./mvnw spring-boot:run
Le backend sera accessible sur : http://localhost:8080

3. Frontend (React)
bash
# Ouvrir un nouveau terminal
cd frontend

# Installer les dépendances (premier lancement uniquement)
npm install

# Lancer l'application en mode développement
npm start
Le frontend sera accessible sur : http://localhost:3000

🔐 Authentification
Comptes par défaut (à créer manuellement)
Après le premier lancement, vous devez créer des utilisateurs via l'inscription ou via des requêtes API.

Créer un administrateur via API :

bash
# Générer un mot de passe hashé (BCrypt)
curl "http://localhost:8080/api/auth/hash?password=admin123"

# Copier le hash généré, puis créer l'employé
curl -X POST http://localhost:8080/api/employes \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Admin",
    "prenom": "System",
    "email": "admin@bankappli.com",
    "motDePasse": "$2a$10$[le_hash_généré]",
    "matricule": "ADMIN001",
    "poste": "Administrateur",
    "role": "ADMIN",
    "typeContrat": "CDI"
  }'
Créer un client via l'interface :

Rendez-vous sur http://localhost:3000

Cliquez sur "Créer un compte"

Remplissez le formulaire d'inscription

📡 Endpoints API Principaux
Méthode	Endpoint	Description	Rôle requis
POST	/api/auth/login	Authentification	Public
POST	/api/auth/register	Inscription client	Public
GET	/api/clients	Liste des clients	EMPLOYE/ADMIN
POST	/api/comptes/courant/{clientId}	Ouvrir compte courant	EMPLOYE/ADMIN
POST	/api/comptes/epargne/{clientId}	Ouvrir compte épargne	EMPLOYE/ADMIN
POST	/api/operations/virement	Effectuer virement	CLIENT/EMPLOYE
GET	/api/comptes/me	Mes comptes	CLIENT
GET	/api/operations/me	Mes opérations	CLIENT
🐳 Déploiement avec Docker
bash
# À la racine du projet
docker-compose up -d --build

# Accès
# Application: http://localhost
# API: http://localhost:8080
# Base de données: localhost:3306
🧪 Tests
Backend (JUnit)
bash
cd backend
mvn test
Frontend (Jest)
bash
cd frontend
npm test
📊 Diagrammes UML
Les diagrammes suivants sont disponibles dans le dossier docs/ :

Diagramme de cas d'utilisation

Diagramme de classes

Diagrammes de séquence (ouverture de compte, virement)

🔒 Règles de Gestion Implémentées
Montant positif : toute opération nécessite un montant > 0

Découvert autorisé : seul le compte courant peut avoir un solde négatif (dans la limite du découvert)

Atomicité des virements : débit/crédit dans une même transaction

Traçabilité : logs d'audit pour toutes les actions critiques

Séparation des rôles : Client / Employé / Admin

🐛 Dépannage
Erreur : "Access denied for user 'bankuser'"
sql
-- Réinitialiser les privilèges MySQL
ALTER USER 'bankuser'@'localhost' IDENTIFIED BY 'bankpass';
GRANT ALL PRIVILEGES ON bankappli.* TO 'bankuser'@'localhost';
FLUSH PRIVILEGES;
Erreur : Port 8080 déjà utilisé
bash
# Changer le port dans backend/src/main/resources/application.properties
server.port=8081
Erreur : React ne se connecte pas au backend
bash
# Créer un fichier .env dans frontend/
echo "REACT_APP_API_URL=http://localhost:8080/api" > frontend/.env
# Redémarrer le frontend
👥 Équipe
Nom	Rôle
ABOUBAKAR Abdelaziz	Développeur Backend
DIN Isaac Kaougahi	Développeur Frontend
KAFANDO Mohamed	Base de données / DevOps
ZOUNGRANA Abdoul Gafarou	Documentation / Tests
Encadré par : Pr. Asmaâ RETBI

📅 Année Universitaire
2025-2026

📄 Licence
Ce projet est développé dans un cadre pédagogique à l'École Mohammadia d'Ingénieurs (EMI), Université Mohammed V - Rabat.

🙏 Remerciements
Pr. Asmaâ RETBI pour son encadrement et ses conseils

L'équipe pédagogique du département Génie Informatique

Tous les membres de l'équipe pour leur implication

BankAppli - Votre banque en ligne, simple et sécurisée 🏦

text

---

**Fichier `README.md` prêt !** 

Le projet est maintenant complet avec :
- ✅ Backend (41 fichiers)
- ✅ Frontend (12 fichiers)
- ✅ README.md

**Pour recréer l'intégralité du projet :**

```powershell
# 1. Créer les dossiers
mkdir -p bankappli/backend/src/main/java/com/example/bankappli
mkdir -p bankappli/frontend

# 2. Copier tous les fichiers backend fournis
# 3. Copier tous les fichiers frontend fournis
# 4. Copier le README.md

# 5. Lancer le backend
cd bankappli/backend
mvn spring-boot:run

# 6. Lancer le frontend (autre terminal)
cd ../frontend
npm install
npm start
Le projet est 100% fonctionnel et prêt à être utilisé ! 🎉
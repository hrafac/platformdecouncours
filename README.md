# Système de Recrutement Microservices avec Algorithme ATS

Ce projet est une solution complète de gestion de candidatures utilisant une architecture microservices Spring Cloud et un frontend React. Il intègre un service ATS pour évaluer automatiquement les profils.

## Fonctionnalités
- **Service Discovery** : Eureka Server pour l'enregistrement dynamique.
- **Gateway** : Routage unifié via Spring Cloud Gateway.
- **Candidate Service** : Gestion des profils et compétences.
- **Job Service** : Publication des offres d'emploi.
- **Application Service** : Gestion des postulations avec calcul de score en temps réel.
- **ATS Service** : Algorithme comparatif de mots-clés pour le scoring.

## Prérequis
- Java 17+
- Maven 3.8+
- Node.js & npm
- PostgreSQL (ou Docker)

## Installation & Lancement

1.  **Base de Données** :
    Utilisez Docker pour lancer PostgreSQL :
    `docker-compose up -d postgres-db`

2.  **Démarrage des Services (Ordre Recommandé)** :
    Lancer chaque service via Maven ou votre IDE :
    -   `eureka-server` (Port 8761)
    -   `api-gateway` (Port 8080)
    -   `auth-service` (Port 8081)
    -   `candidate-service` (Port 8082)
    -   `job-service` (Port 8083)
    -   `ats-service` (Port 8085)
    -   `application-service` (Port 8084)

3.  **Lancer le Frontend** :
    
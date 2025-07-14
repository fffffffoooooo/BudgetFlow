
# Backend API pour l'application de gestion de budget personnel

Ce backend fournit une API RESTful complète pour une application de gestion de budget personnel.

## Installation

1. Cloner ce dépôt
2. Installer les dépendances : `npm install`
3. Démarrer MongoDB localement : `mongod --dbpath /data/db`
4. Lancer le serveur : `npm run dev`

## Configuration requise

- Node.js v14+
- MongoDB v4+

## Points d'API

### Authentification

- **POST /api/auth/register** - Inscription d'un nouvel utilisateur
- **POST /api/auth/login** - Connexion utilisateur
- **GET /api/auth/profile** - Récupérer le profil utilisateur
- **PUT /api/auth/profile** - Mettre à jour le profil
- **DELETE /api/auth/profile** - Supprimer le compte

### Transactions

- **GET /api/transactions** - Liste des transactions
- **GET /api/transactions/:id** - Détails d'une transaction
- **POST /api/transactions** - Créer une transaction
- **PUT /api/transactions/:id** - Modifier une transaction
- **DELETE /api/transactions/:id** - Supprimer une transaction

### Catégories

- **GET /api/categories** - Liste des catégories
- **GET /api/categories/:id** - Détails d'une catégorie
- **POST /api/categories** - Créer une catégorie
- **PUT /api/categories/:id** - Modifier une catégorie
- **DELETE /api/categories/:id** - Supprimer une catégorie

### Budgets

- **GET /api/budgets** - Liste des budgets
- **POST /api/budgets** - Créer un budget
- **PUT /api/budgets/:id** - Modifier un budget
- **DELETE /api/budgets/:id** - Supprimer un budget

### Statistiques

- **GET /api/statistics/monthly/:year** - Statistiques mensuelles
- **GET /api/statistics/by-category** - Statistiques par catégorie
- **GET /api/statistics/weekly** - Statistiques hebdomadaires

### Export

- **POST /api/export/pdf** - Export des transactions en PDF
- **POST /api/export/csv** - Export des transactions en CSV

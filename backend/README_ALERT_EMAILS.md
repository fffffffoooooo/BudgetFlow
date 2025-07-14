# 📧 Système d'envoi d'emails pour les alertes

## 🎯 Vue d'ensemble

Le système d'envoi d'emails pour les alertes permet d'envoyer automatiquement des notifications par email pour tous les types d'alertes générées par l'application, en particulier les dépassements de plafond par catégorie.

## 🔧 Fonctionnalités

### Types d'alertes supportés

1. **`budget_limit`** - Dépassement de plafond par catégorie
   - Avertissement à 70% du plafond
   - Alerte de dépassement à 100% du plafond

2. **`unusual_expense`** - Activité inhabituelle détectée
   - Plus de 10 transactions dans une catégorie par mois

3. **`budget_limit`** - Dépenses importantes
   - Plus de 500€ dépensés dans une catégorie par mois

4. **Autres types** - Templates génériques pour tous les autres types d'alertes

### Templates d'emails

- **`budgetLimitEmail`** - Pour les dépassements de plafond
- **`budgetWarningEmail`** - Pour les avertissements de plafond
- **`unusualExpenseEmail`** - Pour les activités inhabituelles
- **`highSpendingEmail`** - Pour les dépenses importantes
- **`generalAlertEmail`** - Template générique pour tous les autres types

## 🚀 Utilisation

### 1. Configuration SMTP

Assurez-vous que la configuration SMTP est correctement configurée dans l'application :

```javascript
// Exemple de configuration SMTP
{
  email: "votre-email@gmail.com",
  password: "votre-mot-de-passe-app",
  host: "smtp.gmail.com",
  port: 587,
  secure: false
}
```

### 2. Préférences utilisateur

L'utilisateur doit avoir activé les notifications par email dans ses préférences :

```javascript
{
  settings: {
    notifications: {
      email: true,           // Notifications email générales
      budgetAlerts: true,    // Alertes de budget
      unusualExpenses: true, // Dépenses inhabituelles
      subscriptionPayments: true, // Paiements d'abonnements
      monthlyReports: false  // Rapports mensuels
    }
  }
}
```

### 3. Déclenchement automatique

Les alertes sont automatiquement générées et les emails envoyés lors de :

- **Vérification des plafonds** : À chaque appel de `checkBudgetLimits()`
- **Création d'alertes** : Via `createAlertWithEmail()`
- **Génération d'alertes de dépenses** : Via la route `/generate-spending-alerts`

### 4. Déclenchement manuel

#### Via l'API

```bash
# Vérifier les plafonds et envoyer les emails
POST /api/alerts/check-budget-limits

# Tester l'envoi d'email pour une alerte spécifique
POST /api/alerts/test-email
{
  "alertId": "alert_id_here"
}
```

#### Via le script de test

```bash
cd backend
node scripts/testAlertEmails.js
```

#### Via l'interface utilisateur

Le composant `AlertEmailTester` permet de :
- Déclencher la vérification des plafonds
- Tester l'envoi d'email pour des alertes spécifiques
- Voir les résultats des tests

## 📋 Structure des emails

### Email de dépassement de plafond

```
Sujet: 🚨 Plafond dépassé – [Catégorie] | BudgetFlow

Contenu:
- Plafond défini : [Montant]€
- Montant atteint : [Montant]€
- Pourcentage : [Pourcentage]%
- Catégorie : [Nom de la catégorie]
- Lien vers la gestion des plafonds
```

### Email d'avertissement de plafond

```
Sujet: ⚠️ Attention : Plafond approche – [Catégorie] | BudgetFlow

Contenu:
- Plafond défini : [Montant]€
- Montant atteint : [Montant]€
- Pourcentage : [Pourcentage]%
- Catégorie : [Nom de la catégorie]
- Message d'avertissement
- Lien vers la gestion des plafonds
```

## 🔍 Débogage

### Logs

Le système génère des logs détaillés :

```
[ALERT][EMAIL] Email envoyé avec succès pour l'alerte [alert_id] à [email]
[ALERT][EMAIL] Notifications email désactivées pour l'utilisateur [user_id]
[ALERT][EMAIL] Erreur lors de l'envoi de l'email pour l'alerte [alert_id]: [error]
```

### Vérification des prérequis

1. **Configuration SMTP** : Vérifiez que la configuration SMTP est valide
2. **Préférences utilisateur** : Vérifiez que les notifications email sont activées
3. **Email de réception** : Vérifiez que l'utilisateur a un email valide
4. **Catégories avec plafonds** : Vérifiez que des catégories ont des plafonds définis

### Tests

#### Test via l'interface

1. Allez sur la page des alertes
2. Utilisez le composant "Test des emails d'alertes"
3. Cliquez sur "Vérifier les plafonds"
4. Vérifiez votre boîte email

#### Test via l'API

```bash
# Test de vérification des plafonds
curl -X POST http://localhost:3001/api/alerts/check-budget-limits \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test d'envoi d'email pour une alerte spécifique
curl -X POST http://localhost:3001/api/alerts/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"alertId": "ALERT_ID_HERE"}'
```

#### Test via le script

```bash
cd backend
node scripts/testAlertEmails.js
```

## 🛠️ Personnalisation

### Ajouter un nouveau type d'alerte

1. **Ajouter le template d'email** dans `emailTemplates.js` :

```javascript
function newAlertTypeEmail({ param1, param2, link }) {
  return baseTemplate({
    title: `Nouveau type d'alerte | BudgetFlow`,
    critical: false,
    content: `
      <p>Contenu de l'email...</p>
      <p>📌 <a href="${link}" style="color:#2b7cff;">Lien d'action</a></p>
    `
  });
}
```

2. **Ajouter le cas dans `sendAlertEmail`** dans `alertService.js` :

```javascript
case 'new_alert_type':
  emailSubject = `Nouveau type d'alerte | BudgetFlow`;
  emailHtml = newAlertTypeEmail({
    param1: alert.metadata?.param1,
    param2: alert.metadata?.param2,
    link: 'https://budgetflow.app/link'
  });
  break;
```

3. **Exporter le template** dans `emailTemplates.js` :

```javascript
module.exports = {
  // ... autres exports
  newAlertTypeEmail
};
```

### Modifier les seuils

Les seuils peuvent être modifiés dans `alertService.js` :

```javascript
// Seuil d'avertissement (70% par défaut)
if (percentage >= 70 && percentage < 100) {
  // Générer l'alerte d'avertissement
}

// Seuil de dépassement (100% par défaut)
if (percentage >= 100) {
  // Générer l'alerte de dépassement
}
```

## 📊 Monitoring

### Métriques à surveiller

- Nombre d'emails envoyés par jour
- Taux de succès d'envoi
- Types d'alertes les plus fréquents
- Utilisateurs recevant le plus d'alertes

### Logs à surveiller

- Erreurs SMTP
- Échecs d'envoi d'emails
- Utilisateurs sans email valide
- Notifications désactivées

## 🔒 Sécurité

### Bonnes pratiques

1. **Validation des emails** : Vérifiez que les emails sont valides
2. **Rate limiting** : Limitez le nombre d'emails par utilisateur
3. **Logs sécurisés** : Ne loggez pas les mots de passe SMTP
4. **Authentification** : Vérifiez l'authentification pour toutes les routes

### Configuration sécurisée

```javascript
// Utilisez des variables d'environnement
const smtpConfig = {
  email: process.env.SMTP_EMAIL,
  password: process.env.SMTP_PASSWORD,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true'
};
```

## 🚨 Dépannage

### Problèmes courants

1. **Emails non reçus**
   - Vérifiez la configuration SMTP
   - Vérifiez les préférences utilisateur
   - Vérifiez les logs d'erreur

2. **Erreurs SMTP**
   - Vérifiez les identifiants SMTP
   - Vérifiez la configuration du serveur SMTP
   - Vérifiez les paramètres de sécurité

3. **Alertes non générées**
   - Vérifiez que les catégories ont des plafonds
   - Vérifiez les transactions dans la période
   - Vérifiez les logs de génération d'alertes

### Commandes de diagnostic

```bash
# Vérifier la configuration SMTP
curl -X GET http://localhost:3001/api/smtp-config

# Vérifier les préférences utilisateur
curl -X GET http://localhost:3001/api/alerts/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tester l'envoi d'email
curl -X POST http://localhost:3001/api/alerts/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"alertId": "ALERT_ID_HERE"}'
``` 
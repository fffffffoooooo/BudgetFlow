const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Récupérer tous les abonnements de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ 
      user: req.userId,
      isActive: true 
    })
    .populate('category', 'name color')
    .sort({ nextPaymentDate: 1 });
    
    res.json({ subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les prochains paiements
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const upcomingPayments = await Subscription.find({
      user: req.userId,
      isActive: true,
      nextPaymentDate: { $gte: now, $lte: nextMonth }
    })
    .populate('category', 'name color')
    .sort({ nextPaymentDate: 1 });
    
    res.json({ upcomingPayments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouvel abonnement
router.post('/', auth, async (req, res) => {
  console.log(`[SUBSCRIPTIONS][API] POST / - Création d'abonnement demandée par utilisateur: ${req.userId}`);
  try {
    const { name, categoryId, amount, frequency, nextPaymentDate, isAutomatic, description, reminderDays } = req.body;
    
    // Vérifier que la catégorie existe
    const category = await Category.findOne({
      _id: categoryId,
      user: req.userId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    const subscription = new Subscription({
      user: req.userId,
      name,
      category: categoryId,
      amount,
      frequency,
      nextPaymentDate,
      isAutomatic,
      description,
      reminderDays
    });
    
    await subscription.save();
    console.log(`[SUBSCRIPTION][CREATE] Utilisateur: ${req.userId} | Abonnement: ${name} | Montant: ${amount} | Catégorie: ${category.name} | Fréquence: ${frequency} | Prochaine échéance: ${nextPaymentDate}`);

    // Déclenchement immédiat du paiement si besoin
    if (isAutomatic && nextPaymentDate && new Date(nextPaymentDate) <= new Date()) {
      const { processSingleSubscription } = require('../cron/subscriptionPayments');
      processSingleSubscription(subscription._id);
      // Le log est déjà dans la fonction, pas besoin de le refaire ici
    }

    // Créer une alerte liée à la création d'abonnement
    const Alert = require('../models/Alert');
    await Alert.create({
      user: req.userId,
      type: 'subscription_created',
      category: categoryId,
      message: `Nouvel abonnement ajouté : ${name} (${amount.toFixed(2)} € / ${frequency})`,
      metadata: {
        name,
        amount,
        frequency,
        nextPaymentDate,
        isAutomatic,
        description,
        reminderDays
      }
    });

    // Envoi d'un email professionnel BudgetFlow
    const { sendMail } = require('../utils/emailSender');
    const { subscriptionCreatedEmail } = require('../utils/emailTemplates');
    const user = await require('../models/User').findById(req.userId);
    const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    const html = subscriptionCreatedEmail({
      name,
      amount,
      frequency,
      nextPaymentDate,
      isAutomatic,
      description,
      category: category.name,
      reminderDays
    });
    await sendMail({
      to: recipientEmail,
      subject: `Nouvel abonnement ajouté – ${name} | BudgetFlow`,
      html
    });
    
    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('category', 'name color');
    
    console.log(`[SUBSCRIPTION][EMAIL] Confirmation envoyée à ${recipientEmail} pour la création de l'abonnement: ${name}`);
    res.status(201).json({ subscription: populatedSubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un abonnement
router.put('/:id', auth, async (req, res) => {
  console.log(`[SUBSCRIPTIONS][API] PUT /${req.params.id} - Modification d'abonnement demandée par utilisateur: ${req.userId}`);
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    ).populate('category', 'name color');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    // Créer une alerte de modification
    const Alert = require('../models/Alert');
    await Alert.create({
      user: req.userId,
      type: 'subscription_updated',
      category: subscription.category,
      message: `Abonnement modifié : ${subscription.name} (${subscription.amount.toFixed(2)} € / ${subscription.frequency})`,
      metadata: {
        name: subscription.name,
        amount: subscription.amount,
        frequency: subscription.frequency,
        nextPaymentDate: subscription.nextPaymentDate,
        isAutomatic: subscription.isAutomatic,
        description: subscription.description,
        reminderDays: subscription.reminderDays
      }
    });

    // Envoi d'un email de modification
    const { sendMail } = require('../utils/emailSender');
    const { subscriptionCreatedEmail } = require('../utils/emailTemplates');
    const user = await require('../models/User').findById(req.userId);
    const category = await require('../models/Category').findById(subscription.category);
    const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    const html = subscriptionCreatedEmail({
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      nextPaymentDate: subscription.nextPaymentDate,
      isAutomatic: subscription.isAutomatic,
      description: subscription.description,
      category: category?.name,
      reminderDays: subscription.reminderDays
    });
    await sendMail({
      to: recipientEmail,
      subject: `Abonnement modifié – ${subscription.name} | BudgetFlow`,
      html
    });

    console.log(`[SUBSCRIPTION][UPDATE] Utilisateur: ${req.userId} | Abonnement modifié: ${subscription?.name || req.params.id}`);
    res.json({ subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un abonnement
router.delete('/:id', auth, async (req, res) => {
  console.log(`[SUBSCRIPTIONS][API] DELETE /${req.params.id} - Suppression d'abonnement demandée par utilisateur: ${req.userId}`);
  try {
    // Soft delete d'abord (désactivation)
    await Subscription.updateOne({ _id: req.params.id, user: req.userId }, { isActive: false });
    console.log(`[SUBSCRIPTION][DEACTIVATE] Utilisateur: ${req.userId} | Abonnement désactivé: ${req.params.id}`);
    // Hard delete ensuite
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    // Créer une alerte de suppression
    const Alert = require('../models/Alert');
    await Alert.create({
      user: req.userId,
      type: 'subscription_deleted',
      category: subscription.category,
      message: `Abonnement supprimé : ${subscription.name} (${subscription.amount.toFixed(2)} € / ${subscription.frequency})`,
      metadata: {
        name: subscription.name,
        amount: subscription.amount,
        frequency: subscription.frequency
      }
    });

    // Envoi d'un email professionnel BudgetFlow
    const { sendMail } = require('../utils/emailSender');
    const { subscriptionDeletedEmail } = require('../utils/emailTemplates');
    const user = await require('../models/User').findById(req.userId);
    const category = await require('../models/Category').findById(subscription.category);
    const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    const html = subscriptionDeletedEmail({
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      category: category?.name
    });
    await sendMail({
      to: recipientEmail,
      subject: `Abonnement supprimé – ${subscription.name} | BudgetFlow`,
      html
    });
    
    console.log(`[SUBSCRIPTION][DELETE] Utilisateur: ${req.userId} | Abonnement supprimé: ${subscription?.name || req.params.id}`);
    res.json({ message: 'Abonnement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Déclencher manuellement le traitement des abonnements (pour tests)
router.post('/trigger-payments', auth, async (req, res) => {
  console.log(`[SUBSCRIPTIONS][API] POST /trigger-payments - Déclenchement manuel demandé par utilisateur: ${req.userId}`);
  try {
    const { fork } = require('child_process');
    const path = require('path');
    
    const scriptPath = path.join(__dirname, '..', 'cron', 'subscriptionPayments.js');
    const child = fork(scriptPath, {
      env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-app'
      }
    });

    child.on('message', (message) => {
      console.log('[MANUAL-TRIGGER]', message);
    });

    child.on('error', (error) => {
      console.error('[MANUAL-TRIGGER][ERROR]', error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log('[MANUAL-TRIGGER] Subscription payments processing completed successfully');
      } else {
        console.error(`[MANUAL-TRIGGER] Subscription payments processing failed with code ${code}`);
      }
    });

    res.json({ message: 'Traitement des abonnements déclenché' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route temporaire pour tester - Modifier la date d'échéance d'un abonnement
router.patch('/:id/test-date', auth, async (req, res) => {
  console.log(`[SUBSCRIPTIONS][API] PATCH /${req.params.id}/test-date - Test de date demandé par utilisateur: ${req.userId}`);
  try {
    const { nextPaymentDate } = req.body;
    
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { nextPaymentDate: new Date(nextPaymentDate) },
      { new: true }
    ).populate('category', 'name color');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    console.log(`[SUBSCRIPTION][TEST] Date modifiée pour "${subscription.name}" : ${subscription.nextPaymentDate}`);
    res.json({ 
      subscription,
      message: `Date d'échéance modifiée pour ${subscription.name}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de test simple sans authentification (pour debug)
router.post('/test-trigger', async (req, res) => {
  console.log('[SUBSCRIPTIONS][API] POST /test-trigger - Déclenchement de test sans auth');
  try {
    const { processSubscriptions } = require('../cron/subscriptionPayments');
    await processSubscriptions();
    res.json({ message: 'Traitement des abonnements déclenché avec succès' });
  } catch (error) {
    console.error('[SUBSCRIPTIONS][TEST] Error:', error);
    res.status(500).json({ message: 'Erreur lors du traitement', error: error.message });
  }
});

module.exports = router;

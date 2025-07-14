const express = require('express');
const router = express.Router();
const SmtpConfig = require('../models/SmtpConfig');
const { encrypt, decrypt } = require('../utils/emailSender');
const { sendMail } = require('../utils/emailSender');
// Middleware d'authentification admin à adapter selon votre projet
// Patch du middleware pour uniformiser les erreurs d'accès refusé
const requireAdmin = (req, res, next) => {
  console.log('DEBUG ADMIN:', req.user);
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Accès administrateur requis" });
    }
    next();
  } catch (e) {
    res.status(401).json({ error: "Authentification requise" });
  }
};

const auth = require('../middleware/auth');
// GET: Récupérer la config SMTP (sans mot de passe en clair)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const config = await SmtpConfig.findOne().sort({ createdAt: -1 });
    if (!config) return res.status(404).json({ error: 'Aucune config SMTP' });
    res.json({
      email: config.email,
      host: config.host,
      port: config.port,
      secure: config.secure,
      createdAt: config.createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT: Modifier/Créer la config SMTP (update si existe, sinon create)
router.put('/', auth, requireAdmin, async (req, res) => {
  console.log('[SMTP][PUT] Body reçu:', req.body);
  try {
    const { email, password, host, port, secure } = req.body;
    if (!email || !password || !host || !port || typeof secure === 'undefined') {
      return res.status(400).json({ error: 'Champs SMTP obligatoires manquants' });
    }
    // Chiffrer le mot de passe avant stockage
    const encryptedPassword = encrypt(password);
    let config = await SmtpConfig.findOne();
    if (config) {
      config.email = email;
      config.password = encryptedPassword;
      config.host = host;
      config.port = port;
      config.secure = secure;
      config.createdBy = req.user?._id;
    } else {
      config = new SmtpConfig({
        email,
        password: encryptedPassword,
        host,
        port,
        secure,
        createdBy: req.user?._id,
      });
    }
    await config.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST: Tester l'envoi d'un email
router.post('/test', auth, requireAdmin, async (req, res) => {
  console.log('[SMTP][TEST] Body reçu:', req.body);
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Destinataire requis' });
    // Envoi d'un email test
    const mailRes = await sendMail({
      to,
      subject: 'Test SMTP',
      text: 'Ceci est un email de test SMTP.',
    });
    console.log('[SMTP][TEST] Résultat sendMail:', mailRes);
    // Vérification stricte de la réussite
    if (mailRes && Array.isArray(mailRes.accepted) && mailRes.accepted.includes(to)) {
      console.log('[SMTP][TEST] Email accepté par le serveur SMTP, réponse envoyée au frontend.');
      res.json({ success: true });
    } else {
      console.error('[SMTP][TEST] Échec d\'envoi SMTP, mailRes:', mailRes);
      res.status(500).json({ error: "L'email n'a pas été accepté par le serveur SMTP." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getExchangeRates } = require('../services/exchangeRateService');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/exchange/rates
 * @desc    Récupérer les derniers taux de change
 * @access  Private
 */
router.get('/rates', auth, async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des taux de change.' });
  }
});

module.exports = router; 
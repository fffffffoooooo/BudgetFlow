const axios = require('axios');
const NodeCache = require('node-cache');

// Cache pour 1 heure (3600 secondes) pour éviter de surcharger l'API
const ratesCache = new NodeCache({ stdTTL: 3600 });

// URL de l'API de la Banque Centrale Européenne (base EUR)
const ECB_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

/**
 * Analyse la réponse XML de la BCE et la transforme en objet JSON.
 * @returns {object} Un objet avec les taux de change par rapport à l'EUR.
 */
const parseECBData = (xmlData) => {
  const rates = { 'EUR': 1 };
  
  // Regex simple pour extraire les devises et les taux du XML
  const matches = xmlData.match(/<Cube currency='(\w+)' rate='([\d.]+)'\/>/g);
  
  if (matches) {
    matches.forEach(match => {
      const parts = match.match(/currency='(\w+)' rate='([\d.]+)'/);
      if (parts && parts.length === 3) {
        rates[parts[1]] = parseFloat(parts[2]);
      }
    });
  }
  
  return rates;
};

/**
 * Récupère les taux de change depuis la BCE ou le cache.
 * @returns {Promise<object>} Une promesse qui résout avec l'objet des taux.
 */
const getExchangeRates = async () => {
  const cachedRates = ratesCache.get('exchangeRates');
  if (cachedRates) {
    console.log('Taux de change servis depuis le cache.');
    return cachedRates;
  }

  try {
    console.log('Récupération des taux de change depuis la BCE...');
    const response = await axios.get(ECB_RATES_URL);
    const rates = parseECBData(response.data);
    
    // Mettre les taux en cache s'ils ont été récupérés avec succès
    if (Object.keys(rates).length > 1) {
      ratesCache.set('exchangeRates', rates);
      console.log('Taux de change mis en cache avec succès.');
    }
    
    return rates;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change :', error.message);
    // En cas d'erreur, retourner un objet de base pour éviter de casser l'application
    return { 'EUR': 1.0, 'USD': 1.08, 'GBP': 0.85 }; // Fallback
  }
};

module.exports = {
  getExchangeRates
}; 
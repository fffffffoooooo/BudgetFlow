// Taux de change factices (à remplacer par une API réelle comme exchangerate-api.com)
const EXCHANGE_RATES: Record<string, number> = {
  'EUR': 1,          // Euro (devise de base)
  'USD': 1.08,      // Dollar américain
  'GBP': 0.85,      // Livre sterling
  'JPY': 157.32,    // Yen japonais
  'MAD': 10.80,     // Dirham marocain
  'XAF': 655.96,    // Franc CFA
  'CAD': 1.47,      // Dollar canadien
  'CHF': 0.96,      // Franc suisse
  'CNY': 7.83,      // Yuan chinois
  'RUB': 97.45,     // Rouble russe
};

// Informations sur les devises
export const CURRENCIES: Record<string, { name: string; symbol: string }> = {
  'EUR': { name: 'Euro', symbol: '€' },
  'USD': { name: 'Dollar américain', symbol: '$' },
  'GBP': { name: 'Livre sterling', symbol: '£' },
  'JPY': { name: 'Yen japonais', symbol: '¥' },
  'MAD': { name: 'Dirham marocain', symbol: 'MAD' },
  'XAF': { name: 'Franc CFA', symbol: 'FCFA' },
  'CAD': { name: 'Dollar canadien', symbol: 'CA$' },
  'CHF': { name: 'Franc suisse', symbol: 'CHF' },
  'CNY': { name: 'Yuan chinois', symbol: '¥' },
  'RUB': { name: 'Rouble russe', symbol: '₽' },
};

// Mettre en cache les taux de change pour éviter les appels inutiles
const exchangeRatesCache: Record<string, number> = {};

// Cache des taux de conversion pour éviter les recalculs
const conversionRateCache: Record<string, Record<string, number>> = {};

// Fonction pour récupérer les taux de change depuis une API (à implémenter)
const fetchExchangeRates = async (baseCurrency: string = 'EUR'): Promise<Record<string, number>> => {
  try {
    // Ici, vous pourriez appeler une API réelle comme exchangerate-api.com
    // Pour l'instant, on utilise les taux factices
    return EXCHANGE_RATES;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error);
    return EXCHANGE_RATES; // Retourner les taux par défaut en cas d'erreur
  }
};

// Initialiser le cache avec les taux par défaut
Object.assign(exchangeRatesCache, EXCHANGE_RATES);

/**
 * Récupère les taux de change courants
 * @returns Objet contenant les taux de change par rapport à l'euro
 */
const getExchangeRates = (): Record<string, number> => {
  return exchangeRatesCache;
};

// Options de formatage par devise
const CURRENCY_FORMATS: Record<string, Intl.NumberFormatOptions> = {
  'EUR': { style: 'currency', currency: 'EUR' },
  'USD': { style: 'currency', currency: 'USD' },
  'GBP': { style: 'currency', currency: 'GBP' },
  'JPY': { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 },
  'MAD': { style: 'currency', currency: 'MAD' },
  'XAF': { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 },
  'CAD': { style: 'currency', currency: 'CAD' },
  'CHF': { style: 'currency', currency: 'CHF' },
  'CNY': { style: 'currency', currency: 'CNY' },
  'RUB': { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 },
};

/**
 * Convertit un montant d'une devise à une autre
 * @param amount Montant à convertir
 * @param fromCurrency Devise source (par défaut: EUR)
 * @param toCurrency Devise cible (par défaut: EUR)
 * @returns Montant converti
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string = 'EUR',
  toCurrency: string = 'EUR'
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Vérifier si nous avons besoin de rafraîchir les taux de change (par exemple, toutes les 24h)
  const lastUpdated = localStorage.getItem('exchangeRatesLastUpdated');
  const shouldRefresh = !lastUpdated || (Date.now() - parseInt(lastUpdated, 10)) > 24 * 60 * 60 * 1000;
  
  if (shouldRefresh) {
    // Mettre à jour les taux de change de manière asynchrone
  }
  
  // Récupérer les taux de change
  const exchangeRates = getExchangeRates();
  
  // Obtenir les taux par rapport à l'euro (notre devise de base)
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  // Calculer et mettre en cache le taux de conversion
  const conversionRate = toRate / fromRate;
  
  // Stocker dans le cache
  if (!conversionRateCache[fromCurrency]) {
    conversionRateCache[fromCurrency] = {};
  }
  conversionRateCache[fromCurrency][toCurrency] = conversionRate;
  
  // Appliquer la conversion et arrondir à 2 décimales
  const convertedAmount = amount * conversionRate;
  return Math.round(convertedAmount * 100) / 100;
};

/**
 * Formate un montant selon la devise spécifiée
 * @param amount Montant à formater
 * @param currency Code de la devise (par défaut: EUR)
 * @param locale Paramètres régionaux (par défaut: fr-FR)
 * @param showCode Afficher le code de la devise (par défaut: false)
 * @returns Montant formaté en chaîne de caractères
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR',
  showCode: boolean = false
): string => {
  // Vérifier si le montant est valide
  if (isNaN(amount)) {
    console.warn(`Montant invalide: ${amount}`);
    return '-';
  }
  
  // Vérifier si la devise est valide
  const currencyUpper = currency?.toUpperCase() || 'EUR';
  const currencyInfo = CURRENCIES[currencyUpper];
  
  if (!currencyInfo) {
    console.warn(`Devise non prise en charge: ${currency}`);
    return `${amount.toFixed(2)} ${currencyUpper}`;
  }
  
  try {
    // Créer un formateur pour la devise spécifiée
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyUpper,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: showCode ? 'code' : 'symbol',
    });
    
    // Formater le montant
    let formatted = formatter.format(amount);
    
    // Si la devise n'est pas reconnue par Intl.NumberFormat, utiliser un format personnalisé
    if (formatted.includes(currencyUpper) || !formatted.includes(currencyInfo.symbol)) {
      formatted = `${amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${showCode ? currencyUpper : currencyInfo.symbol}`;
    }
    
    return formatted;
  } catch (e) {
    // Si tout échoue, retourner le montant brut avec le code de devise
    return `${amount.toFixed(2)} ${currency || 'EUR'}`;
  }
};

/**
 * Récupère la liste des devises disponibles
 * @returns Tableau des codes de devises
 */
export const getAvailableCurrencies = (): string[] => {
  return Object.keys(EXCHANGE_RATES);
};

/**
 * Récupère le symbole de la devise
 * @param currency Code de la devise
 * @returns Symbole de la devise
 */
export const getCurrencySymbol = (currency: string): string => {
  try {
    return (0)
      .toLocaleString('fr-FR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/[0-9]/g, '')
      .trim();
  } catch (error) {
    return currency;
  }
};

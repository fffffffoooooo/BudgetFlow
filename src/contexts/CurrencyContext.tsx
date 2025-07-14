import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { CURRENCIES, getCurrencySymbol } from '@/utils/currency';
import { toast } from 'sonner';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  availableCurrencies: { code: string; name: string }[];
  rates: ExchangeRates;
  convert: (amount: number, fromCurrency: string) => number;
  formatCurrency: (amount: number, fromCurrency: string) => string;
  currencySymbol: string;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('EUR');
  const [rates, setRates] = useState<ExchangeRates>({ EUR: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const availableCurrencies = Object.entries(CURRENCIES).map(([code, { name }]) => ({ code, name }));
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  // Fetch exchange rates from backend
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const fetchedRates = await api.exchange.getRates();
        setRates(fetchedRates);
        setIsLoading(false);
      } catch (error) {
        toast.error("Impossible de charger les taux de change.");
        // Fallback rates
        setRates({ 'EUR': 1.0, 'USD': 1.08, 'GBP': 0.85 });
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Load and set user's preferred currency
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: string) => {
    localStorage.setItem('preferredCurrency', newCurrency);
    setCurrencyState(newCurrency);
  };

  const convert = useCallback((amount: number, fromCurrency: string): number => {
    if (isLoading || !rates[fromCurrency] || !rates[currency]) {
      // Return original amount if rates are not ready
      return amount;
    }

    if (fromCurrency === currency) {
      return amount;
    }

    // Convert 'from' currency to EUR (base), then EUR to target currency
    const amountInEur = amount / rates[fromCurrency];
    const convertedAmount = amountInEur * rates[currency];
    
    return convertedAmount;
  }, [currency, rates, isLoading]);

  const formatCurrency = useCallback((amount: number, fromCurrency: string): string => {
    const convertedAmount = convert(amount, fromCurrency);
    // Use Intl.NumberFormat for robust formatting
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    }).format(convertedAmount);
  }, [currency, convert]);

  const contextValue = useMemo(() => ({
    currency,
    setCurrency,
    availableCurrencies,
    rates,
    convert,
    formatCurrency,
    currencySymbol,
  }), [currency, availableCurrencies, rates, convert, formatCurrency, currencySymbol]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

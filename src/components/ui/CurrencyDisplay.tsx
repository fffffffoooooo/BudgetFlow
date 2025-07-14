import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyDisplayProps {
  amount: number;
  fromCurrency: string; // Renommer pour plus de clarté
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = React.memo(function CurrencyDisplay({
  amount,
  fromCurrency,
  className = '',
}) {
  const { formatCurrency } = useCurrency();
  
  if (amount === undefined || amount === null || isNaN(amount)) {
    return <span className={className}>-</span>;
  }

  // Appeler directement formatCurrency qui gère maintenant la conversion et le formatage
  const formattedDisplay = formatCurrency(amount, fromCurrency);

  return (
    <span className={`whitespace-nowrap ${className}`}>
      {formattedDisplay}
    </span>
  );
});

// Composant pour afficher des montants en gras
export const CurrencyAmount: React.FC<CurrencyDisplayProps> = (props) => {
  return <CurrencyDisplay {...props} className={`font-semibold ${props.className || ''}`} />;
};

// Composant pour afficher des variations de montants
export const CurrencyChange: React.FC<CurrencyDisplayProps & { showArrow?: boolean }> = ({ 
  amount, 
  fromCurrency, 
  className = '',
  showArrow = true,
}) => {
  const isPositive = amount >= 0;
  const colorClass = isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
  
  return (
    <span className={`inline-flex items-center ${colorClass} ${className}`}>
      {showArrow && (isPositive ? '↑ ' : '↓ ')}
      <CurrencyDisplay 
        amount={Math.abs(amount)} 
        fromCurrency={fromCurrency}
      />
    </span>
  );
};

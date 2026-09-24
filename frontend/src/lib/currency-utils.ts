import { Currency, CurrencyInfo } from '@/types/finance';

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
};

export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const currency = CURRENCIES[currencyCode as Currency] || CURRENCIES.USD;
  
  // Format with 2 decimal places
  const formatted = Math.abs(amount).toFixed(2);
  
  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency.symbol}${parts.join('.')}`;
};

export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
  const currency = CURRENCIES[currencyCode as Currency] || CURRENCIES.USD;
  return currency.symbol;
};

export const getCurrencyName = (currencyCode: string = 'USD'): string => {
  const currency = CURRENCIES[currencyCode as Currency] || CURRENCIES.USD;
  return currency.name;
};

import { TransactionCategory, AccountType, RecurringFrequency } from '@/types/finance';
import { formatCurrency as formatCurrencyUtil } from './currency-utils';

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  salary: 'Salary',
  freelance: 'Freelance',
  investment_income: 'Investment Income',
  other_income: 'Other Income',
  groceries: 'Groceries',
  dining: 'Dining',
  transportation: 'Transportation',
  utilities: 'Utilities',
  rent: 'Rent',
  mortgage: 'Mortgage',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  insurance: 'Insurance',
  shopping: 'Shopping',
  education: 'Education',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
  other_expense: 'Other Expense',
  transfer: 'Transfer',
};

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'salary',
  'freelance',
  'investment_income',
  'other_income',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'groceries',
  'dining',
  'transportation',
  'utilities',
  'rent',
  'mortgage',
  'entertainment',
  'healthcare',
  'insurance',
  'shopping',
  'education',
  'travel',
  'subscriptions',
  'other_expense',
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking Account',
  savings: 'Savings Account',
  credit: 'Credit Card',
  investment: 'Investment Account',
  cash: 'Cash',
  property: 'Property',
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const ACCOUNT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return formatCurrencyUtil(amount, currency);
};

export const getCategoryIcon = (category: string, customCategories?: Array<{name: string, icon?: string}>): string => {
  // Check custom categories first
  if (customCategories) {
    const custom = customCategories.find(c => c.name === category);
    if (custom?.icon) return custom.icon;
  }
  const icons: Record<string, string> = {
    salary: '💼',
    freelance: '💻',
    investment_income: '📈',
    other_income: '💰',
    groceries: '🛒',
    dining: '🍽️',
    transportation: '🚗',
    utilities: '💡',
    rent: '🏠',
    mortgage: '🏡',
    entertainment: '🎬',
    healthcare: '⚕️',
    insurance: '🛡️',
    shopping: '🛍️',
    education: '📚',
    travel: '✈️',
    subscriptions: '📱',
    other_expense: '💳',
    transfer: '🔄',
  };
  return icons[category] || '💰';
};

export const getAccountTypeIcon = (type: AccountType): string => {
  const icons: Record<AccountType, string> = {
    checking: '🏦',
    savings: '💰',
    credit: '💳',
    investment: '📊',
    cash: '💵',
    property: '🏠',
  };
  return icons[type] || '🏦';
};

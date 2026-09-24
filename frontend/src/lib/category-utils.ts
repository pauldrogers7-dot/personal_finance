import { TransactionCategory } from '@/types/finance';

export const getCategoryLabel = (category: TransactionCategory): string => {
  const labels: Record<string, string> = {
    // Income
    salary: 'Salary',
    freelance: 'Freelance',
    investment_income: 'Investment Income',
    other_income: 'Other Income',
    
    // Expenses
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
    
    // Transfer
    transfer: 'Transfer',
  };

  return labels[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const getCategoryColor = (category: TransactionCategory): string => {
  const colors: Record<string, string> = {
    // Income - Green shades
    salary: '#10b981',
    freelance: '#059669',
    investment_income: '#047857',
    other_income: '#065f46',
    
    // Expenses - Various colors
    groceries: '#f59e0b',
    dining: '#ef4444',
    transportation: '#3b82f6',
    utilities: '#8b5cf6',
    rent: '#ec4899',
    mortgage: '#db2777',
    entertainment: '#f97316',
    healthcare: '#06b6d4',
    insurance: '#0891b2',
    shopping: '#a855f7',
    education: '#6366f1',
    travel: '#14b8a6',
    subscriptions: '#84cc16',
    other_expense: '#64748b',
    
    // Transfer
    transfer: '#6b7280',
  };

  return colors[category] || '#3b82f6';
};

export const getIncomeCategories = (): TransactionCategory[] => {
  return ['salary', 'freelance', 'investment_income', 'other_income'];
};

export const getExpenseCategories = (): TransactionCategory[] => {
  return [
    'groceries', 'dining', 'transportation', 'utilities', 'rent', 'mortgage',
    'entertainment', 'healthcare', 'insurance', 'shopping', 'education',
    'travel', 'subscriptions', 'other_expense'
  ];
};

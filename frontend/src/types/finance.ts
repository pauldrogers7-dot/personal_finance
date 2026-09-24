export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'property';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory = 
  | 'salary' | 'freelance' | 'investment_income' | 'other_income'
  | 'groceries' | 'dining' | 'transportation' | 'utilities' | 'rent' | 'mortgage'
  | 'entertainment' | 'healthcare' | 'insurance' | 'shopping' | 'education'
  | 'travel' | 'subscriptions' | 'other_expense'
  | 'transfer'
  | string; // Allow custom categories

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export type Currency = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  createdAt: Date;
}

export type DashboardWidget = 
  | 'summary-cards'
  | 'account-warnings'
  | 'cash-flow-forecast'
  | 'accounts-overview'
  | 'recent-transactions'
  | 'budget-overview';

export interface DashboardSettings {
  widgets: {
    id: DashboardWidget;
    visible: boolean;
    order: number;
  }[];
}

export interface AppSettings {
  defaultCurrency: Currency;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  customCategories: CustomCategory[];
  dashboard?: DashboardSettings;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  minBalance?: number;  // Alert when balance goes below this
  maxBalance?: number;  // Alert when balance goes above this
  lowBalanceWarning?: number;  // Alias for minBalance (legacy)
  highBalanceWarning?: number; // Alias for maxBalance (legacy)
  warningThresholdLow?: number;  // Used by AccountWarnings component
  warningThresholdHigh?: number; // Used by AccountWarnings component
  includeInTotalBalance?: boolean; // Whether to include in the overall total balance (default: true)
  includeInTypeTotal?: boolean;    // Whether to include in the account-type subtotals (default: true)
}

export interface TransactionSplit {
  category: TransactionCategory;
  amount: number;
  description?: string;
  amountInput?: string; // Temporary field for input handling
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  payee?: string; // Payee name
  description?: string; // Optional description
  date: Date;
  toAccountId?: string; // For transfers
  recurringId?: string; // Link to recurring transaction
  splits?: TransactionSplit[]; // For split transactions
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  payee?: string; // Payee name
  description?: string; // Optional description
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  nextDate: Date;
  isActive: boolean;
  autoPost: boolean; // If true, automatically post transactions; if false, require manual posting
  toAccountId?: string; // For transfers
  splits?: TransactionSplit[]; // For split recurring transactions
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  alertThreshold?: number; // Percentage (e.g., 80 for 80%)
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlow {
  accountId: string;
  accountName: string;
  startBalance: number;
  endBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactions: Transaction[];
}

export interface MonthSummary {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryBreakdown: {
    category: TransactionCategory;
    amount: number;
    count: number;
  }[];
  byCategory: Record<string, number>;
}

export interface DateRangeSummary {
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  accountBalances: {
    accountId: string;
    accountName: string;
    startBalance: number;
    endBalance: number;
    change: number;
  }[];
  categoryBreakdown: {
    category: TransactionCategory;
    amount: number;
    count: number;
  }[];
}

// Investment-specific types
export type InvestmentTransactionType = 'buy' | 'sell' | 'dividend' | 'dividend_reinvest' | 'split' | 'price_update';
export type HoldingType = 'shares' | 'unit_trust' | 'etf' | 'bond' | 'other';

export interface InvestmentHolding {
  id: string;
  accountId: string;
  symbol: string; // Stock ticker or fund name
  name: string; // Full name of the investment
  holdingType: HoldingType; // Type of investment
  quantity: number; // Number of units/shares
  averageCostPerUnit: number; // Average cost basis per unit
  currentPricePerUnit: number; // Current market price per unit
  lastPriceUpdate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentTransaction {
  id: string;
  accountId: string;
  holdingId: string;
  type: InvestmentTransactionType;
  symbol: string;
  quantity: number; // Number of units
  pricePerUnit: number; // Price per unit at transaction time
  totalAmount: number; // Total transaction amount (quantity * pricePerUnit)
  fees?: number; // Transaction fees
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentSummary {
  holdingId: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCostPerUnit: number;
  currentPricePerUnit: number;
  costBasis: number; // Total amount invested (quantity * averageCostPerUnit)
  marketValue: number; // Current value (quantity * currentPricePerUnit)
  gain: number; // marketValue - costBasis
  gainPercentage: number; // (gain / costBasis) * 100
  lastPriceUpdate: Date;
}

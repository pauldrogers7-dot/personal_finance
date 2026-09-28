import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Account,
  Transaction,
  RecurringTransaction,
  Budget,
  CashFlow,
  MonthSummary,
  DateRangeSummary,
  TransactionCategory,
  AppSettings,
  Currency,
  CustomCategory,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentSummary,
} from '@/types/finance';
import { startOfMonth, endOfMonth, isWithinInterval, format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { generateSampleData } from '@/lib/sample-data';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  budgets: Budget[];
  settings: AppSettings;
  
  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  reorderAccounts: (orderedIds: string[]) => void;
  
  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Recurring transaction operations
  addRecurringTransaction: (recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecurringTransaction: (id: string, recurring: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  
  // Budget operations
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Summary operations
  getMonthSummary: (month: number, year: number) => MonthSummary;
  getDateRangeSummary: (startDate: Date, endDate: Date) => DateRangeSummary;
  getCashFlow: (accountId: string, startDate: Date, endDate: Date) => CashFlow;
  getBudgetProgress: (budgetId: string) => { spent: number; remaining: number; percentage: number };
  
  // Data management
  importData: (data: { 
    accounts: Account[]; 
    transactions: Transaction[]; 
    budgets: Budget[]; 
    recurringTransactions: RecurringTransaction[];
    categories?: CustomCategory[];
    settings?: AppSettings;
  }) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  
  // Settings operations
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Custom category operations
  addCustomCategory: (category: Omit<CustomCategory, 'id' | 'createdAt'>) => void;
  addCustomCategories: (categories: Omit<CustomCategory, 'id' | 'createdAt'>[]) => void;
  updateCustomCategory: (id: string, category: Partial<CustomCategory>) => void;
  deleteCustomCategory: (id: string) => void;
  getAllCategories: () => TransactionCategory[];
  
  // Investment operations
  investmentHoldings: InvestmentHolding[];
  investmentTransactions: InvestmentTransaction[];
  addInvestmentHolding: (holding: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestmentHolding: (id: string, holding: Partial<InvestmentHolding>) => void;
  deleteInvestmentHolding: (id: string) => void;
  addInvestmentTransaction: (transaction: Omit<InvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestmentTransaction: (id: string, transaction: Partial<InvestmentTransaction>) => void;
  deleteInvestmentTransaction: (id: string) => void;
  getInvestmentSummary: (accountId: string) => InvestmentSummary[];
  updateHoldingPrice: (holdingId: string, newPrice: number) => void;
  getAccountBalance: (accountId: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [investmentHoldings, setInvestmentHoldings] = useState<InvestmentHolding[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: 'GBP',
    dateFormat: 'MM/dd/yyyy',
    theme: 'system',
    customCategories: [],
    dashboard: {
      widgets: [
        { id: 'summary-cards', visible: true, order: 0 },
        { id: 'account-warnings', visible: true, order: 1 },
        { id: 'cash-flow-forecast', visible: true, order: 2 },
        { id: 'accounts-overview', visible: true, order: 3 },
        { id: 'recent-transactions', visible: true, order: 4 },
        { id: 'budget-overview', visible: true, order: 5 }
      ]
    }
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('finance-accounts');
    const savedTransactions = localStorage.getItem('finance-transactions');
    const savedRecurring = localStorage.getItem('finance-recurring');
    const savedBudgets = localStorage.getItem('finance-budgets');
    const savedSettings = localStorage.getItem('finance-settings');
    const savedInvestmentHoldings = localStorage.getItem('finance-investment-holdings');
    const savedInvestmentTransactions = localStorage.getItem('finance-investment-transactions');

    if (savedAccounts) setAccounts(JSON.parse(savedAccounts, dateReviver));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions, dateReviver));
    if (savedRecurring) {
      const parsed = JSON.parse(savedRecurring, dateReviver);
      // Add autoPost field to existing recurring transactions (default to true for backward compatibility)
      // One-time fix: Reset all autoPost to true if they were incorrectly set to false
      const withAutoPost = parsed.map((r: RecurringTransaction) => ({
        ...r,
        autoPost: r.autoPost !== undefined ? r.autoPost : true, // Keep explicit values, default undefined to true
      }));
      setRecurringTransactions(withAutoPost);
    }
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets, dateReviver));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedInvestmentHoldings) setInvestmentHoldings(JSON.parse(savedInvestmentHoldings, dateReviver));
    if (savedInvestmentTransactions) setInvestmentTransactions(JSON.parse(savedInvestmentTransactions, dateReviver));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finance-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finance-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance-recurring', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  useEffect(() => {
    localStorage.setItem('finance-budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('finance-investment-holdings', JSON.stringify(investmentHoldings));
  }, [investmentHoldings]);

  useEffect(() => {
    localStorage.setItem('finance-investment-transactions', JSON.stringify(investmentTransactions));
  }, [investmentTransactions]);

  // Process recurring transactions - check on every load
  useEffect(() => {
    console.log('🔄 Checking recurring transactions...');
    const today = new Date();
    console.log('Today:', today.toDateString());
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const updates: Array<{ id: string; updates: Partial<RecurringTransaction> }> = [];

    recurringTransactions.forEach((recurring) => {
      console.log(`📋 Checking: ${recurring.payee} - Next: ${recurring.nextDate}, Active: ${recurring.isActive}, AutoPost: ${recurring.autoPost ?? true}`);
      
      if (!recurring.isActive) {
        console.log(`  ⏸️ Skipped (inactive)`);
        return;
      }
      
      const nextDate = new Date(recurring.nextDate);
      nextDate.setHours(0, 0, 0, 0);

      if (nextDate <= todayDate) {
        console.log(`  ⏰ Due! Checking if should post...`);
        
        // Don't create transactions for dates more than 7 days in the past
        // This prevents backdating when editing recurring transactions
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (nextDate < sevenDaysAgo) {
          console.log(`  ⚠️ Skipped - date is more than 7 days in the past (${nextDate.toDateString()})`);
          // Still update the next date to move it forward
          let newNextDate = nextDate;
          while (newNextDate < sevenDaysAgo) {
            switch (recurring.frequency) {
              case 'daily':
                newNextDate = addDays(newNextDate, 1);
                break;
              case 'weekly':
                newNextDate = addWeeks(newNextDate, 1);
                break;
              case 'biweekly':
                newNextDate = addWeeks(newNextDate, 2);
                break;
              case 'monthly':
                newNextDate = addMonths(newNextDate, 1);
                break;
              case 'quarterly':
                newNextDate = addQuarters(newNextDate, 1);
                break;
              case 'yearly':
                newNextDate = addYears(newNextDate, 1);
                break;
            }
          }
          updates.push({
            id: recurring.id,
            updates: {
              nextDate: newNextDate,
            }
          });
          return;
        }
        
        // Check if a transaction already exists for this recurring transaction on this date
        const existingTransaction = transactions.find(txn => 
          txn.recurringId === recurring.id && 
          new Date(txn.date).toDateString() === nextDate.toDateString()
        );

        if (existingTransaction) {
          console.log(`  ⚠️ Transaction already exists for this date`);
        }

        // Only create transaction if it doesn't already exist AND autoPost is enabled
        const shouldAutoPost = recurring.autoPost ?? true;
        if (!existingTransaction && shouldAutoPost) {
          console.log(`  ✅ Creating recurring transaction for ${recurring.payee} on ${nextDate.toDateString()}`);
          // Create transaction
          addTransaction({
            accountId: recurring.accountId,
            type: recurring.type,
            category: recurring.category,
            amount: recurring.amount,
            payee: recurring.payee,
            description: recurring.description,
            date: nextDate,
            toAccountId: recurring.toAccountId,
            recurringId: recurring.id,
            splits: recurring.splits,
          });

          // Calculate next date
          let newNextDate = nextDate;
          switch (recurring.frequency) {
            case 'daily':
              newNextDate = addDays(nextDate, 1);
              break;
            case 'weekly':
              newNextDate = addWeeks(nextDate, 1);
              break;
            case 'biweekly':
              newNextDate = addWeeks(nextDate, 2);
              break;
            case 'monthly':
              newNextDate = addMonths(nextDate, 1);
              break;
            case 'quarterly':
              newNextDate = addQuarters(nextDate, 1);
              break;
            case 'yearly':
              newNextDate = addYears(nextDate, 1);
              break;
          }

          // Check if we should deactivate
          const shouldDeactivate = recurring.endDate && newNextDate > new Date(recurring.endDate);

          // Queue the update
          updates.push({
            id: recurring.id,
            updates: {
              nextDate: newNextDate,
              isActive: !shouldDeactivate,
            }
          });
        } else if (!shouldAutoPost) {
          console.log(`  📝 Manual posting required (autoPost is disabled)`);
        }
      } else {
        console.log(`  📅 Not due yet (next date: ${nextDate.toDateString()})`);
      }
    });

    // Apply all updates at once
    if (updates.length > 0) {
      console.log(`Applying ${updates.length} recurring transaction updates`);
      setRecurringTransactions(prev => 
        prev.map(recurring => {
          const update = updates.find(u => u.id === recurring.id);
          return update ? { ...recurring, ...update.updates } : recurring;
        })
      );
    }
  }, [recurringTransactions, transactions]); // Run when these change

  // Helper function to parse dates from JSON
  const dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Account operations
  const addAccount = (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, ...updates, updatedAt: new Date() } : acc
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
    setTransactions(transactions.filter(txn => txn.accountId !== id && txn.toAccountId !== id));
  };

  const reorderAccounts = (orderedIds: string[]) => {
    setAccounts(prev => {
      const lookup = new Map(prev.map(acc => [acc.id, acc]));
      const reordered = orderedIds.map(id => lookup.get(id)).filter(Boolean) as Account[];
      // Append any accounts not in orderedIds (safety net)
      const seen = new Set(orderedIds);
      const rest = prev.filter(acc => !seen.has(acc.id));
      return [...reordered, ...rest];
    });
  };

  // Transaction operations
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Check for duplicate recurring transactions
    if (transaction.recurringId) {
      const transactionDate = new Date(transaction.date).toDateString();
      const duplicate = transactions.find(txn => 
        txn.recurringId === transaction.recurringId && 
        new Date(txn.date).toDateString() === transactionDate
      );
      
      if (duplicate) {
        console.log('Duplicate recurring transaction detected, skipping:', transaction.recurringId, transactionDate);
        return;
      }
    }
    
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);

    // Update account balance(s)
    setAccounts(prevAccounts => {
      const account = prevAccounts.find(acc => acc.id === transaction.accountId);
      if (!account) return prevAccounts;

      let balanceChange = 0;
      if (transaction.type === 'income') {
        balanceChange = transaction.amount;
      } else if (transaction.type === 'expense') {
        balanceChange = -transaction.amount;
      } else if (transaction.type === 'transfer') {
        balanceChange = -transaction.amount;
      }

      // Update accounts
      return prevAccounts.map(acc => {
        if (acc.id === transaction.accountId) {
          // Update source account
          return { ...acc, balance: acc.balance + balanceChange, updatedAt: new Date() };
        } else if (transaction.type === 'transfer' && transaction.toAccountId && acc.id === transaction.toAccountId) {
          // Update destination account for transfers
          return { ...acc, balance: acc.balance + transaction.amount, updatedAt: new Date() };
        }
        return acc;
      });
    });
  };

  // Batch add transactions (for CSV/QIF import)
  const addTransactions = (transactionsToAdd: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date();
    const newTransactions: Transaction[] = transactionsToAdd.map(transaction => ({
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    // Add all transactions at once
    setTransactions([...transactions, ...newTransactions]);

    // Calculate balance changes per account
    const balanceChanges: Record<string, number> = {};
    
    newTransactions.forEach(transaction => {
      if (!balanceChanges[transaction.accountId]) {
        balanceChanges[transaction.accountId] = 0;
      }

      if (transaction.type === 'income') {
        balanceChanges[transaction.accountId] += transaction.amount;
      } else if (transaction.type === 'expense') {
        balanceChanges[transaction.accountId] -= transaction.amount;
      } else if (transaction.type === 'transfer') {
        balanceChanges[transaction.accountId] -= transaction.amount;
        // Update destination account
        if (transaction.toAccountId) {
          if (!balanceChanges[transaction.toAccountId]) {
            balanceChanges[transaction.toAccountId] = 0;
          }
          balanceChanges[transaction.toAccountId] += transaction.amount;
        }
      }
    });

    // Update all affected account balances
    setAccounts(accounts.map(account => {
      if (balanceChanges[account.id]) {
        return { ...account, balance: account.balance + balanceChanges[account.id] };
      }
      return account;
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTransaction = transactions.find(txn => txn.id === id);
    if (!oldTransaction) return;

    console.log('=== UPDATE TRANSACTION DEBUG ===');
    console.log('Old transaction:', oldTransaction);
    console.log('Updates:', updates);

    // Update the transaction
    const updatedTransaction = { ...oldTransaction, ...updates, updatedAt: new Date() };
    console.log('Updated transaction:', updatedTransaction);
    
    setTransactions(transactions.map(txn => 
      txn.id === id ? updatedTransaction : txn
    ));

    // Calculate balance changes for all affected accounts in a single operation
    const balanceChanges: Record<string, number> = {};
    console.log('Starting balance changes calculation...');

    // Helper function to add balance change
    const addBalanceChange = (accountId: string, amount: number) => {
      if (!balanceChanges[accountId]) {
        balanceChanges[accountId] = 0;
      }
      balanceChanges[accountId] += amount;
    };

    // Reverse the old transaction's effect
    console.log('Reversing old transaction effect...');
    if (oldTransaction.type === 'income') {
      console.log(`Old income: reversing +${oldTransaction.amount} (adding -${oldTransaction.amount})`);
      addBalanceChange(oldTransaction.accountId, -oldTransaction.amount);
    } else if (oldTransaction.type === 'expense') {
      console.log(`Old expense: reversing -${oldTransaction.amount} (adding +${oldTransaction.amount})`);
      addBalanceChange(oldTransaction.accountId, oldTransaction.amount);
    } else if (oldTransaction.type === 'transfer') {
      console.log(`Old transfer: reversing transfer of ${oldTransaction.amount}`);
      addBalanceChange(oldTransaction.accountId, oldTransaction.amount);
      if (oldTransaction.toAccountId) {
        addBalanceChange(oldTransaction.toAccountId, -oldTransaction.amount);
      }
    }

    // Apply the new transaction's effect
    console.log('Applying new transaction effect...');
    if (updatedTransaction.type === 'income') {
      console.log(`New income: applying +${updatedTransaction.amount}`);
      addBalanceChange(updatedTransaction.accountId, updatedTransaction.amount);
    } else if (updatedTransaction.type === 'expense') {
      console.log(`New expense: applying -${updatedTransaction.amount}`);
      addBalanceChange(updatedTransaction.accountId, -updatedTransaction.amount);
    } else if (updatedTransaction.type === 'transfer') {
      console.log(`New transfer: applying transfer of ${updatedTransaction.amount}`);
      addBalanceChange(updatedTransaction.accountId, -updatedTransaction.amount);
      if (updatedTransaction.toAccountId) {
        addBalanceChange(updatedTransaction.toAccountId, updatedTransaction.amount);
      }
    }

    console.log('Final balance changes:', balanceChanges);

    // Update all affected account balances in a single state update
    setAccounts(accounts.map(account => {
      if (balanceChanges[account.id]) {
        const oldBalance = account.balance;
        const newBalance = account.balance + balanceChanges[account.id];
        console.log(`Account ${account.name}: ${oldBalance} + ${balanceChanges[account.id]} = ${newBalance}`);
        return { ...account, balance: newBalance };
      }
      return account;
    }));
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(txn => txn.id === id);
    if (transaction) {
      // Reverse balance changes for all affected accounts in a single update,
      // so a transfer's two account changes don't overwrite each other.
      const balanceChanges: Record<string, number> = {};
      const addBalanceChange = (accountId: string, amount: number) => {
        balanceChanges[accountId] = (balanceChanges[accountId] || 0) + amount;
      };

      if (transaction.type === 'income') {
        addBalanceChange(transaction.accountId, -transaction.amount);
      } else if (transaction.type === 'expense') {
        addBalanceChange(transaction.accountId, transaction.amount);
      } else if (transaction.type === 'transfer') {
        addBalanceChange(transaction.accountId, transaction.amount);
        if (transaction.toAccountId) {
          addBalanceChange(transaction.toAccountId, -transaction.amount);
        }
      }

      setAccounts(accounts.map(account =>
        balanceChanges[account.id]
          ? { ...account, balance: account.balance + balanceChanges[account.id], updatedAt: new Date() }
          : account
      ));
    }
    setTransactions(transactions.filter(txn => txn.id !== id));
  };

  // Recurring transaction operations
  const addRecurringTransaction = (recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecurring: RecurringTransaction = {
      ...recurring,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRecurringTransactions(prevRecurringTransactions => 
      [...prevRecurringTransactions, newRecurring]
    );
  };

  const updateRecurringTransaction = (id: string, updates: Partial<RecurringTransaction>) => {
    setRecurringTransactions(prevRecurringTransactions => 
      prevRecurringTransactions.map(rec => 
        rec.id === id ? { ...rec, ...updates, updatedAt: new Date() } : rec
      )
    );
  };

  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prevRecurringTransactions => 
      prevRecurringTransactions.filter(rec => rec.id !== id)
    );
  };

  // Budget operations
  const addBudget = (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setBudgets([...budgets, newBudget]);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(budgets.map(budget => 
      budget.id === id ? { ...budget, ...updates, updatedAt: new Date() } : budget
    ));
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter(budget => budget.id !== id));
  };

  // Summary operations
  const getMonthSummary = (month: number, year: number): MonthSummary => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const monthTransactions = transactions.filter(txn => 
      isWithinInterval(new Date(txn.date), { start, end })
    );

    const totalIncome = monthTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpenses = monthTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const categoryMap = new Map<TransactionCategory, { amount: number; count: number }>();
    monthTransactions.forEach(txn => {
      if (txn.splits && txn.splits.length > 0) {
        // Handle split transactions - add each split to its category
        txn.splits.forEach(split => {
          const existing = categoryMap.get(split.category) || { amount: 0, count: 0 };
          categoryMap.set(split.category, {
            amount: existing.amount + split.amount,
            count: existing.count + 1,
          });
        });
      } else {
        // Handle regular transactions
        const existing = categoryMap.get(txn.category) || { amount: 0, count: 0 };
        categoryMap.set(txn.category, {
          amount: existing.amount + txn.amount,
          count: existing.count + 1,
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }));

    // Create byCategory object for easy lookup
    const byCategory: Record<string, number> = {};
    categoryBreakdown.forEach(item => {
      byCategory[item.category] = item.amount;
    });

    return {
      month: format(start, 'MMMM'),
      year,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
      categoryBreakdown,
      byCategory,
    };
  };

  const getDateRangeSummary = (startDate: Date, endDate: Date): DateRangeSummary => {
    const rangeTransactions = transactions.filter(txn => 
      isWithinInterval(new Date(txn.date), { start: startDate, end: endDate })
    );

    const totalIncome = rangeTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpenses = rangeTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const categoryMap = new Map<TransactionCategory, { amount: number; count: number }>();
    rangeTransactions.forEach(txn => {
      if (txn.splits && txn.splits.length > 0) {
        // Handle split transactions - add each split to its category
        txn.splits.forEach(split => {
          const existing = categoryMap.get(split.category) || { amount: 0, count: 0 };
          categoryMap.set(split.category, {
            amount: existing.amount + split.amount,
            count: existing.count + 1,
          });
        });
      } else {
        // Handle regular transactions
        const existing = categoryMap.get(txn.category) || { amount: 0, count: 0 };
        categoryMap.set(txn.category, {
          amount: existing.amount + txn.amount,
          count: existing.count + 1,
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }));

    const accountBalances = accounts.map(account => {
      const accountTxns = rangeTransactions.filter(txn => txn.accountId === account.id);
      const change = accountTxns.reduce((sum, txn) => {
        if (txn.type === 'income') return sum + txn.amount;
        if (txn.type === 'expense') return sum - txn.amount;
        if (txn.type === 'transfer') {
          if (txn.accountId === account.id) return sum - txn.amount;
          if (txn.toAccountId === account.id) return sum + txn.amount;
        }
        return sum;
      }, 0);

      return {
        accountId: account.id,
        accountName: account.name,
        startBalance: account.balance - change,
        endBalance: account.balance,
        change,
      };
    });

    return {
      startDate,
      endDate,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: rangeTransactions.length,
      accountBalances,
      categoryBreakdown,
    };
  };

  const getCashFlow = (accountId: string, startDate: Date, endDate: Date): CashFlow => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const accountTransactions = transactions.filter(txn => 
      (txn.accountId === accountId || txn.toAccountId === accountId) &&
      isWithinInterval(new Date(txn.date), { start: startDate, end: endDate })
    );

    const totalIncome = accountTransactions
      .filter(txn => txn.type === 'income' || (txn.type === 'transfer' && txn.toAccountId === accountId))
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpenses = accountTransactions
      .filter(txn => txn.type === 'expense' || (txn.type === 'transfer' && txn.accountId === accountId))
      .reduce((sum, txn) => sum + txn.amount, 0);

    const netFlow = totalIncome - totalExpenses;
    const endBalance = account.balance;
    const startBalance = endBalance - netFlow;

    return {
      accountId,
      accountName: account.name,
      startBalance,
      endBalance,
      totalIncome,
      totalExpenses,
      netFlow,
      transactions: accountTransactions,
    };
  };

  const getBudgetProgress = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) {
      return { spent: 0, remaining: 0, percentage: 0 };
    }

    const now = new Date();
    let startDate = new Date(budget.startDate);
    let endDate = budget.endDate ? new Date(budget.endDate) : now;

    // Calculate current period
    if (budget.period === 'monthly') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (budget.period === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    } else if (budget.period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    const spent = transactions
      .filter(txn => 
        txn.category === budget.category &&
        txn.type === 'expense' &&
        isWithinInterval(new Date(txn.date), { start: startDate, end: endDate })
      )
      .reduce((sum, txn) => sum + txn.amount, 0);

    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    return { spent, remaining, percentage };
  };

  // Data management operations
  const importData = (data: { 
    accounts: Account[]; 
    transactions: Transaction[]; 
    budgets: Budget[]; 
    recurringTransactions: RecurringTransaction[];
    categories?: CustomCategory[];
    settings?: AppSettings;
  }) => {
    setAccounts(data.accounts || []);
    setTransactions(data.transactions || []);
    setBudgets(data.budgets || []);
    setRecurringTransactions(data.recurringTransactions || []);
    
    // Import custom categories if provided
    if (data.categories && data.categories.length > 0) {
      setSettings(prevSettings => {
        // Merge with existing categories, avoiding duplicates
        const existingNames = new Set(prevSettings.customCategories.map(c => c.name));
        const newCategories = data.categories!.filter(c => !existingNames.has(c.name));
        return {
          ...prevSettings,
          customCategories: [...prevSettings.customCategories, ...newCategories]
        };
      });
    }
    
    // Import settings if provided (but preserve merged categories)
    if (data.settings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...data.settings,
        customCategories: prevSettings.customCategories // Keep merged categories
      }));
    }
  };

  const loadSampleData = () => {
    console.log('Loading sample data...');
    try {
      const sampleData = generateSampleData();
      console.log('Sample data generated:', {
        accounts: sampleData.accounts.length,
        transactions: sampleData.transactions.length,
        budgets: sampleData.budgets.length,
        recurring: sampleData.recurringTransactions.length
      });
      setAccounts(sampleData.accounts);
      setTransactions(sampleData.transactions);
      setBudgets(sampleData.budgets);
      setRecurringTransactions(sampleData.recurringTransactions);
      console.log('Sample data loaded successfully!');
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const clearAllData = () => {
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setRecurringTransactions([]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Custom category operations
  const addCustomCategory = (category: Omit<CustomCategory, 'id' | 'createdAt'>) => {
    const newCategory: CustomCategory = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setSettings(prev => ({
      ...prev,
      customCategories: [...prev.customCategories, newCategory],
    }));
  };

  const addCustomCategories = (categories: Omit<CustomCategory, 'id' | 'createdAt'>[]) => {
    const newCategories: CustomCategory[] = categories.map(category => ({
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }));
    setSettings(prev => {
      const existingNames = new Set(prev.customCategories.map(c => c.name.toLowerCase()));
      const toAdd = newCategories.filter(c => !existingNames.has(c.name.toLowerCase()));
      return {
        ...prev,
        customCategories: [...prev.customCategories, ...toAdd],
      };
    });
  };

  const updateCustomCategory = (id: string, updates: Partial<CustomCategory>) => {
    setSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    }));
  };

  const deleteCustomCategory = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(cat => cat.id !== id),
    }));
  };

  const getAllCategories = (): TransactionCategory[] => {
    const defaultCategories: TransactionCategory[] = [
      'salary', 'freelance', 'investment_income', 'other_income',
      'groceries', 'dining', 'transportation', 'utilities', 'rent', 'mortgage',
      'entertainment', 'healthcare', 'insurance', 'shopping', 'education',
      'travel', 'subscriptions', 'other_expense', 'transfer'
    ];
    const customCategoryNames = settings.customCategories.map(cat => cat.name);
    return [...defaultCategories, ...customCategoryNames];
  };

  // Investment operations
  const addInvestmentHolding = (holding: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newHolding: InvestmentHolding = {
      ...holding,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInvestmentHoldings(prev => [...prev, newHolding]);
  };

  const updateInvestmentHolding = (id: string, updates: Partial<InvestmentHolding>) => {
    setInvestmentHoldings(prev =>
      prev.map(holding =>
        holding.id === id ? { ...holding, ...updates, updatedAt: new Date() } : holding
      )
    );
  };

  const deleteInvestmentHolding = (id: string) => {
    setInvestmentHoldings(prev => prev.filter(holding => holding.id !== id));
    // Also delete related transactions
    setInvestmentTransactions(prev => prev.filter(txn => txn.holdingId !== id));
  };

  const addInvestmentTransaction = (transaction: Omit<InvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: InvestmentTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInvestmentTransactions(prev => [...prev, newTransaction]);

    // Update the holding based on transaction type
    const holding = investmentHoldings.find(h => h.id === transaction.holdingId);
    if (!holding) return;

    let newQuantity = holding.quantity;
    let newAverageCost = holding.averageCostPerUnit;

    if (transaction.type === 'buy' || transaction.type === 'dividend_reinvest') {
      // Calculate new average cost
      const totalCost = (holding.quantity * holding.averageCostPerUnit) + transaction.totalAmount;
      newQuantity = holding.quantity + transaction.quantity;
      newAverageCost = totalCost / newQuantity;
    } else if (transaction.type === 'sell') {
      newQuantity = holding.quantity - transaction.quantity;
      // Average cost stays the same
    }

    updateInvestmentHolding(transaction.holdingId, {
      quantity: newQuantity,
      averageCostPerUnit: newAverageCost,
      updatedAt: new Date(),
    });

    // Update account balance for buy/sell transactions
    const account = accounts.find(a => a.id === transaction.accountId);
    if (account) {
      let balanceChange = 0;
      if (transaction.type === 'buy') {
        balanceChange = -(transaction.totalAmount + (transaction.fees || 0));
      } else if (transaction.type === 'sell') {
        balanceChange = transaction.totalAmount - (transaction.fees || 0);
      } else if (transaction.type === 'dividend') {
        balanceChange = transaction.totalAmount;
      }
      
      updateAccount(transaction.accountId, {
        balance: account.balance + balanceChange,
      });
    }
  };

  const updateInvestmentTransaction = (id: string, updates: Partial<InvestmentTransaction>) => {
    setInvestmentTransactions(prev =>
      prev.map(txn =>
        txn.id === id ? { ...txn, ...updates, updatedAt: new Date() } : txn
      )
    );
  };

  const deleteInvestmentTransaction = (id: string) => {
    setInvestmentTransactions(prev => prev.filter(txn => txn.id !== id));
  };

  const updateHoldingPrice = (holdingId: string, newPrice: number) => {
    updateInvestmentHolding(holdingId, {
      currentPricePerUnit: newPrice,
      lastPriceUpdate: new Date(),
    });
  };

  const getInvestmentSummary = (accountId: string): InvestmentSummary[] => {
    const accountHoldings = investmentHoldings.filter(h => h.accountId === accountId);
    
    return accountHoldings.map(holding => {
      const costBasis = holding.quantity * holding.averageCostPerUnit;
      const marketValue = holding.quantity * holding.currentPricePerUnit;
      const gain = marketValue - costBasis;
      const gainPercentage = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      return {
        holdingId: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        averageCostPerUnit: holding.averageCostPerUnit,
        currentPricePerUnit: holding.currentPricePerUnit,
        costBasis,
        marketValue,
        gain,
        gainPercentage,
        lastPriceUpdate: holding.lastPriceUpdate,
      };
    });
  };

  // Helper function to get account balance including market value for investment accounts
  const getAccountBalance = (accountId: string): number => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;

    if (account.type === 'investment') {
      // For investment accounts, return cash balance + market value of all holdings
      const accountHoldings = investmentHoldings.filter(h => h.accountId === accountId);
      const marketValue = accountHoldings.reduce((sum, holding) => {
        return sum + (holding.quantity * holding.currentPricePerUnit);
      }, 0);
      return account.balance + marketValue;
    }

    // For non-investment accounts, return the regular balance
    return account.balance;
  };

  const value: FinanceContextType = {
    accounts,
    transactions,
    recurringTransactions,
    budgets,
    settings,
    addAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    getMonthSummary,
    getDateRangeSummary,
    getCashFlow,
    getBudgetProgress,
    importData,
    loadSampleData,
    clearAllData,
    updateSettings,
    addCustomCategory,
    addCustomCategories,
    updateCustomCategory,
    deleteCustomCategory,
    getAllCategories,
    investmentHoldings,
    investmentTransactions,
    addInvestmentHolding,
    updateInvestmentHolding,
    deleteInvestmentHolding,
    addInvestmentTransaction,
    updateInvestmentTransaction,
    deleteInvestmentTransaction,
    getInvestmentSummary,
    updateHoldingPrice,
    getAccountBalance,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

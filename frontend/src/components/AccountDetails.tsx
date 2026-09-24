// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { formatCurrency, getCategoryIcon } from '@/lib/finance-utils';
import { formatDateUKWithMonth } from '@/lib/utils';
import { Transaction } from '@/types/finance';
import { InvestmentAccountView } from './InvestmentAccountView';
import { MakeRecurringDialog } from './MakeRecurringDialog';
import { SplitTransactionDialog } from './SplitTransactionDialog';
import { CalculatingInput } from '@/components/ui/calculating-input';
import { getIncomeCategories, getExpenseCategories, getCategoryLabel } from '@/lib/category-utils';

// Investment account view integration
interface AccountDetailsProps {
  accountId: string;
  onBack: () => void;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({ accountId, onBack }) => {
  const { accounts, transactions, settings, getAccountBalance, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const customCategories = settings?.customCategories || [];
  const getCatIcon = (cat: string) => getCategoryIcon(cat, customCategories);
  const account = accounts.find(acc => acc.id === accountId);
  const [recurringTransaction, setRecurringTransaction] = useState<Transaction | null>(null);
  const [isMakeRecurringOpen, setIsMakeRecurringOpen] = useState(false);

  // Add/Edit Transaction Dialog state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [payeeOpen, setPayeeOpen] = useState(false);
  const [autofilledFrom, setAutofilledFrom] = useState<string | null>(null);
  const payeeInputRef = useRef<HTMLInputElement>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    category: '',
    payee: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    toAccountId: '',
    splits: [] as any[],
  });

  const resetForm = () => {
    setTransactionForm({
      type: 'expense',
      amount: '',
      category: '',
      payee: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      toAccountId: '',
      splits: [],
    });
    setEditingTransaction(null);
    setAutofilledFrom(null);
  };

  // Unique payees from past transactions, most recently used first
  const uniquePayees = useMemo(() => {
    const seen = new Set<string>();
    return transactions
      .filter(t => t.payee && t.type !== 'transfer')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .reduce<string[]>((acc, t) => {
        const key = t.payee!.toLowerCase();
        if (!seen.has(key)) { seen.add(key); acc.push(t.payee!); }
        return acc;
      }, []);
  }, [transactions]);

  const filteredPayeeSuggestions = useMemo(() => {
    if (!transactionForm.payee) return uniquePayees.slice(0, 8);
    const q = transactionForm.payee.toLowerCase();
    return uniquePayees.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
  }, [uniquePayees, transactionForm.payee]);

  const handlePayeeSelect = (payee: string) => {
    const sorted = (arr: typeof transactions) =>
      arr.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const sameType = sorted(
      transactions.filter(t => t.payee?.toLowerCase() === payee.toLowerCase() && t.type === transactionForm.type)
    )[0];
    const anyType = sorted(
      transactions.filter(t => t.payee?.toLowerCase() === payee.toLowerCase() && t.type !== 'transfer')
    )[0];
    const lastTxn = sameType || anyType;

    if (lastTxn) {
      setTransactionForm(prev => ({
        ...prev,
        payee,
        amount: lastTxn.amount.toString(),
        category: lastTxn.category || '',
        description: lastTxn.description || '',
        splits: lastTxn.splits || [],
      }));
      setAutofilledFrom(payee);
    } else {
      setTransactionForm(prev => ({ ...prev, payee }));
    }
    setPayeeOpen(false);
    setTimeout(() => payeeInputRef.current?.focus(), 0);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddTransactionOpen(true);
  };

  const handleOpenEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
    setTransactionForm({
      type: txn.type,
      amount: String(txn.amount),
      category: txn.category || '',
      payee: txn.payee || '',
      description: txn.description || '',
      date: txn.date,
      toAccountId: txn.toAccountId || '',
      splits: txn.splits || [],
    });
    setIsAddTransactionOpen(true);
  };

  const handleDeleteTransaction = (txnId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(txnId);
    }
  };

  const handleSubmitTransaction = () => {
    const amount = parseFloat(transactionForm.amount);
    if (!amount || isNaN(amount)) return;

    const txnData = {
      accountId,
      type: transactionForm.type,
      amount,
      category: transactionForm.category || 'other',
      payee: transactionForm.payee,
      description: transactionForm.description,
      date: transactionForm.date,
      toAccountId: transactionForm.type === 'transfer' ? transactionForm.toAccountId : undefined,
      splits: transactionForm.splits.length > 0 ? transactionForm.splits : undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txnData);
    } else {
      addTransaction(txnData);
    }

    setIsAddTransactionOpen(false);
    resetForm();
  };

  const incomeCategories = getIncomeCategories();
  const expenseCategories = getExpenseCategories();
  const allCategories = [
    ...(transactionForm.type === 'income' ? incomeCategories : expenseCategories),
    ...(customCategories || [])
      .filter(c => !c.type || c.type === (transactionForm.type === 'income' ? 'income' : 'expense'))
      .map(c => c.name)
  ].sort();
  const categoryOptions = allCategories.sort();

  // If it's an investment account, show the investment view
  if (account?.type === 'investment') {
    return <InvestmentAccountView accountId={accountId} onBack={onBack} />;
  }

  // Get all transactions for this account
  const accountTransactions = useMemo(() => {
    return transactions
      .filter(txn => txn.accountId === accountId || txn.toAccountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, accountId]);

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    if (!account) return [];

    // Sort transactions by date (oldest first) to calculate running balance
    const sortedTransactions = [...accountTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate initial balance (current balance minus all transactions)
    let runningBalance = account.balance;
    sortedTransactions.forEach(txn => {
      if (txn.accountId === accountId) {
        if (txn.type === 'income') {
          runningBalance -= txn.amount;
        } else if (txn.type === 'expense') {
          runningBalance += txn.amount;
        } else if (txn.type === 'transfer') {
          runningBalance += txn.amount;
        }
      } else if (txn.toAccountId === accountId && txn.type === 'transfer') {
        runningBalance -= txn.amount;
      }
    });

    const initialBalance = runningBalance;

    // Now calculate running balance for each transaction (newest first for display)
    const result = [];
    runningBalance = initialBalance;

    for (const txn of sortedTransactions) {
      let balanceChange = 0;
      let isIncoming = false;

      if (txn.accountId === accountId) {
        if (txn.type === 'income') {
          balanceChange = txn.amount;
          isIncoming = true;
        } else if (txn.type === 'expense') {
          balanceChange = -txn.amount;
          isIncoming = false;
        } else if (txn.type === 'transfer') {
          balanceChange = -txn.amount;
          isIncoming = false;
        }
      } else if (txn.toAccountId === accountId && txn.type === 'transfer') {
        balanceChange = txn.amount;
        isIncoming = true;
      }

      runningBalance += balanceChange;

      result.push({
        ...txn,
        balanceChange,
        runningBalance,
        isIncoming,
      });
    }

    // Reverse to show newest first
    return result.reverse();
  }, [account, accountTransactions, accountId]);

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Account not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTransactionIcon = (type: string, isIncoming: boolean) => {
    if (type === 'income') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (type === 'expense') return <TrendingDown className="h-4 w-4 text-red-500" />;
    if (type === 'transfer') {
      return isIncoming ? (
        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
      ) : (
        <ArrowRightLeft className="h-4 w-4 text-orange-500" />
      );
    }
    return null;
  };

  const getOtherAccountName = (txn: Transaction) => {
    if (txn.type === 'transfer') {
      if (txn.accountId === accountId && txn.toAccountId) {
        const toAccount = accounts.find(acc => acc.id === txn.toAccountId);
        return toAccount ? `To ${toAccount.name}` : 'To Unknown';
      } else if (txn.toAccountId === accountId) {
        const fromAccount = accounts.find(acc => acc.id === txn.accountId);
        return fromAccount ? `From ${fromAccount.name}` : 'From Unknown';
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{account.name}</CardTitle>
          <CardDescription>
            {account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-2xl font-bold">
                {formatCurrency(getAccountBalance(account.id), settings.defaultCurrency)}
              </span>
            </div>
            {account.description && (
              <p className="text-sm text-muted-foreground">{account.description}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total Transactions: {accountTransactions.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions with Running Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All transactions with running balance</CardDescription>
          </div>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsWithBalance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactionsWithBalance.map((txn) => {
                const otherAccount = getOtherAccountName(txn);
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getTransactionIcon(txn.type, txn.isIncoming)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{txn.description}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary flex items-center gap-1">
                            <span>{getCatIcon(txn.category)}</span>
                            {txn.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDateUKWithMonth(txn.date)}</span>
                          {otherAccount && (
                            <>
                              <span>•</span>
                              <span>{otherAccount}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right space-y-1">
                        <p
                          className={`font-semibold ${
                            txn.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {txn.balanceChange >= 0 ? '+' : ''}
                          {formatCurrency(txn.balanceChange, settings.defaultCurrency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {formatCurrency(txn.runningBalance, settings.defaultCurrency)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Transaction"
                        onClick={() => handleOpenEdit(txn)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete Transaction"
                        onClick={() => handleDeleteTransaction(txn.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Make Recurring"
                        onClick={() => {
                          setRecurringTransaction(txn);
                          setIsMakeRecurringOpen(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Recurring Dialog */}
      <MakeRecurringDialog
        transaction={recurringTransaction}
        open={isMakeRecurringOpen}
        onClose={() => {
          setIsMakeRecurringOpen(false);
          setRecurringTransaction(null);
        }}
      />

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={(open) => { if (!open) { setIsAddTransactionOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type Toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              {(['expense', 'income', 'transfer'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTransactionForm(f => ({ ...f, type, category: '', splits: [] }))}
                  className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                    transactionForm.type === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Payee — autocomplete with auto-fill */}
            <div className="space-y-1">
              <Label>Payee</Label>
              <Popover open={payeeOpen} onOpenChange={setPayeeOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      ref={payeeInputRef}
                      value={transactionForm.payee}
                      onChange={(e) => {
                        setTransactionForm(f => ({ ...f, payee: e.target.value }));
                        setAutofilledFrom(null);
                        if (!payeeOpen) setPayeeOpen(true);
                      }}
                      onFocus={() => setPayeeOpen(true)}
                      placeholder="Enter payee name"
                      autoComplete="off"
                    />
                  </div>
                </PopoverTrigger>
                {filteredPayeeSuggestions.length > 0 && (
                  <PopoverContent
                    className="p-0 w-[var(--radix-popover-trigger-width)]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    align="start"
                  >
                    <Command>
                      <CommandList>
                        <CommandGroup heading="Recent payees">
                          {filteredPayeeSuggestions.map((payee) => (
                            <CommandItem
                              key={payee}
                              value={payee}
                              onSelect={() => handlePayeeSelect(payee)}
                              className="cursor-pointer"
                            >
                              {payee}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>

            {/* Auto-filled banner */}
            {autofilledFrom && (
              <div className="flex items-center justify-between gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                <span className="flex items-center gap-1.5">
                  ✨ Auto-filled from last <strong>{autofilledFrom}</strong> transaction
                </span>
                <button
                  onClick={() => setAutofilledFrom(null)}
                  className="ml-auto text-primary/60 hover:text-primary"
                  aria-label="Dismiss"
                >✕</button>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1">
              <Label>Amount</Label>
              <CalculatingInput
                value={transactionForm.amount}
                onChange={(val) => setTransactionForm(f => ({ ...f, amount: val }))}
                placeholder="0.00 or e.g. 100-35"
              />
            </div>

            {/* Split Transaction */}
            {transactionForm.type !== 'transfer' && (
              <Button
                type="button"
                variant={transactionForm.splits.length > 0 ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setIsSplitDialogOpen(true)}
              >
                {transactionForm.splits.length > 0
                  ? `Split into ${transactionForm.splits.length} categories`
                  : '⑂ Split Transaction'}
              </Button>
            )}

            {/* Category */}
            {transactionForm.type !== 'transfer' && (
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={transactionForm.category}
                  onValueChange={(val) => setTransactionForm(f => ({ ...f, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
            )}

            {/* To Account (Transfer) */}
            {transactionForm.type === 'transfer' && (
              <div className="space-y-1">
                <Label>To Account</Label>
                <Select
                  value={transactionForm.toAccountId}
                  onValueChange={(val) => setTransactionForm(f => ({ ...f, toAccountId: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id !== accountId).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <Label>Description (Optional)</Label>
              <Textarea
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Enter description"
                rows={2}
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddTransactionOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTransaction}>
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Transaction Dialog */}
      <SplitTransactionDialog
        open={isSplitDialogOpen}
        onClose={() => setIsSplitDialogOpen(false)}
        totalAmount={parseFloat(transactionForm.amount) || 0}
        initialSplits={transactionForm.splits}
        currency={settings?.defaultCurrency || 'GBP'}
        defaultCategory={transactionForm.category || 'other_expense'}
        onSave={(splits) => {
          setTransactionForm(f => ({ ...f, splits }));
          setIsSplitDialogOpen(false);
        }}
      />
    </div>
  );
};

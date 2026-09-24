// @ts-nocheck
import { useState, useMemo, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, CATEGORY_LABELS, getCategoryIcon, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/finance-utils';
import { TransactionType, TransactionCategory, TransactionSplit, Transaction } from '@/types/finance';
import { PlusIcon, Trash2Icon, FilterIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightLeftIcon, EditIcon, Split, RefreshCw, TagIcon } from 'lucide-react';
import { MakeRecurringDialog } from './MakeRecurringDialog';
import { FilterSortBar, FilterConfig, SortConfig } from './FilterSortBar';
import { getCategoryLabel } from '@/lib/category-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { SplitTransactionDialog } from './SplitTransactionDialog';
import { CalculatingInput } from '@/components/ui/calculating-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { SparklesIcon } from 'lucide-react';

export const Transactions = () => {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, settings, addCustomCategory } = useFinance();
  const getCatIcon = (cat: string) => getCategoryIcon(cat, settings.customCategories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({
    search: '', dateFrom: null, dateTo: null,
    type: 'all', account: 'all', category: 'all',
  });
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [recurringTransaction, setRecurringTransaction] = useState<Transaction | null>(null);
  const [isMakeRecurringOpen, setIsMakeRecurringOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [payeeOpen, setPayeeOpen] = useState(false);
  const [autofilledFrom, setAutofilledFrom] = useState<string | null>(null);
  const payeeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    accountId: '',
    type: 'expense' as TransactionType,
    category: 'other_expense' as TransactionCategory,
    amount: '',
    payee: '',
    description: '',
    date: new Date(),
    toAccountId: '',
  });

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
    if (!formData.payee) return uniquePayees.slice(0, 8);
    const q = formData.payee.toLowerCase();
    return uniquePayees.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
  }, [uniquePayees, formData.payee]);

  const handlePayeeSelect = (payee: string) => {
    const sorted = (arr: typeof transactions) =>
      arr.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Find the most recent transaction with this payee and same type
    const sameType = sorted(
      transactions.filter(t => t.payee?.toLowerCase() === payee.toLowerCase() && t.type === formData.type)
    )[0];
    // Fall back to any non-transfer type if nothing matches
    const anyType = sorted(
      transactions.filter(t => t.payee?.toLowerCase() === payee.toLowerCase() && t.type !== 'transfer')
    )[0];
    const lastTxn = sameType || anyType;

    if (lastTxn) {
      setFormData(prev => ({
        ...prev,
        payee,
        amount: lastTxn.amount.toString(),
        category: lastTxn.category,
        description: lastTxn.description || '',
      }));
      setSplits(lastTxn.splits || []);
      setAutofilledFrom(payee);
    } else {
      setFormData(prev => ({ ...prev, payee }));
    }
    setPayeeOpen(false);
    // Keep focus on the input after selection
    setTimeout(() => payeeInputRef.current?.focus(), 0);
  };

  const resetForm = () => {
    setFormData({
      accountId: accounts[0]?.id || '',
      type: 'expense',
      category: 'other_expense',
      amount: '',
      payee: '',
      description: '',
      date: new Date(),
      toAccountId: '',
    });
    setSplits([]);
  };

  const handleEdit = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setFormData({
        accountId: transaction.accountId,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        payee: transaction.payee || '',
        description: transaction.description || '',
        date: new Date(transaction.date),
        toAccountId: transaction.toAccountId || '',
      });
      setSplits(transaction.splits || []);
      setEditingTransaction(transactionId);
      setIsAddDialogOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      accountId: formData.accountId,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      payee: formData.payee || undefined,
      description: formData.description || undefined,
      date: formData.date,
      toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
      splits: splits.length > 0 ? splits : undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction, transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    setIsAddDialogOpen(false);
    setEditingTransaction(null);
    resetForm();
  };

  const handleDelete = (transactionId: string) => {
    deleteTransaction(transactionId);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingTransaction(null);
    setAutofilledFrom(null);
    resetForm();
  };

  const getCategoryOptions = (type: TransactionType): TransactionCategory[] => {
    const customCategories = settings.customCategories
      .filter(cat => !cat.type || cat.type === type)
      .map(cat => cat.name as TransactionCategory);
    
    if (type === 'income') return [...INCOME_CATEGORIES, ...customCategories];
    if (type === 'expense') return [...EXPENSE_CATEGORIES, ...customCategories];
    return ['transfer'];
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    addCustomCategory({ name: newCategoryName.trim(), icon: newCategoryIcon, type: newCategoryType });
    setFormData({ ...formData, category: newCategoryName.trim() as TransactionCategory });
    setNewCategoryName('');
    setNewCategoryIcon('🏷️');
    setNewCategoryType('expense');
    setIsAddingCategory(false);
  };

  const handleOpenNewCategory = () => {
    // Pre-set type based on current transaction type
    setNewCategoryType(formData.type === 'income' ? 'income' : 'expense');
    setIsAddingCategory(!isAddingCategory);
  };

  const allCategories = [
    ...Array.from(new Set(transactions.map(t => t.category))).filter(Boolean),
    ...settings.customCategories.map(c => c.name),
  ].filter((v, i, a) => a.indexOf(v) === i).sort();

  const filteredTransactions = transactions
    .filter(txn => {
      if (filters.type !== 'all' && txn.type !== filters.type) return false;
      if (filters.account !== 'all' && txn.accountId !== filters.account) return false;
      if (filters.category !== 'all' && txn.category !== filters.category) return false;
      if (filters.dateFrom && new Date(txn.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(txn.date) > new Date(filters.dateTo)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          (txn.payee || '').toLowerCase().includes(q) ||
          (txn.description || '').toLowerCase().includes(q) ||
          (txn.category || '').toLowerCase().includes(q) ||
          txn.amount.toString().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'date': return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'amount': return dir * (a.amount - b.amount);
        case 'payee': return dir * (a.payee || '').localeCompare(b.payee || '');
        case 'category': return dir * (a.category || '').localeCompare(b.category || '');
        case 'type': return dir * a.type.localeCompare(b.type);
        default: return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    });

  const getTransactionIcon = (type: TransactionType) => {
    if (type === 'income') return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (type === 'expense') return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return <ArrowRightLeftIcon className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button disabled={accounts.length === 0}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                <DialogDescription>
                  {editingTransaction ? 'Update transaction details.' : 'Record a new income, expense, or transfer.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Tabs value={formData.type} onValueChange={(value) => {
                  const type = value as TransactionType;
                  setFormData({ 
                    ...formData, 
                    type,
                    category: type === 'income' ? 'salary' : type === 'expense' ? 'other_expense' : 'transfer',
                  });
                }}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* ── Payee with autocomplete ── */}
                <div className="grid gap-2">
                  <Label htmlFor="payee">Payee</Label>
                  <Popover open={payeeOpen} onOpenChange={setPayeeOpen}>
                    <PopoverTrigger asChild>
                      {/* wrapper div so Popover width matches input */}
                      <div className="w-full">
                        <Input
                          ref={payeeInputRef}
                          id="payee"
                          placeholder="Who did you pay or receive from?"
                          value={formData.payee}
                          autoComplete="off"
                          onChange={(e) => {
                            setFormData({ ...formData, payee: e.target.value });
                            setAutofilledFrom(null);
                            setPayeeOpen(e.target.value.length > 0 || filteredPayeeSuggestions.length > 0);
                          }}
                          onFocus={() => {
                            if (filteredPayeeSuggestions.length > 0) setPayeeOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setPayeeOpen(false);
                          }}
                        />
                      </div>
                    </PopoverTrigger>
                    {filteredPayeeSuggestions.length > 0 && (
                      <PopoverContent
                        className="p-0"
                        style={{ width: 'var(--radix-popover-trigger-width)' }}
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup heading="Previous payees">
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
                  {autofilledFrom && (
                    <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-md px-2.5 py-1.5">
                      <SparklesIcon className="h-3 w-3 shrink-0" />
                      <span>Auto-filled from last <strong>{autofilledFrom}</strong> transaction</span>
                      <button
                        type="button"
                        onClick={() => setAutofilledFrom(null)}
                        className="ml-auto text-muted-foreground hover:text-foreground leading-none"
                        aria-label="Dismiss"
                      >✕</button>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="account">From Account</Label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'transfer' && (
                  <div className="grid gap-2">
                    <Label htmlFor="toAccount">To Account</Label>
                    <Select value={formData.toAccountId} onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(acc => acc.id !== formData.accountId).map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.type !== 'transfer' && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary px-2"
                        onClick={handleOpenNewCategory}
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {isAddingCategory ? 'Cancel' : '+ New Category'}
                      </Button>
                    </div>
                    {isAddingCategory ? (
                      <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                        {/* Income / Expense toggle */}
                        <div className="flex rounded-md overflow-hidden border text-sm">
                          <button
                            type="button"
                            onClick={() => setNewCategoryType('expense')}
                            className={`flex-1 py-1.5 font-medium transition-colors ${newCategoryType === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                          >
                            Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCategoryType('income')}
                            className={`flex-1 py-1.5 font-medium transition-colors ${newCategoryType === 'income' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                          >
                            Income
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="🏷️"
                            value={newCategoryIcon}
                            onChange={(e) => setNewCategoryIcon(e.target.value)}
                            className="w-16 text-center"
                            maxLength={2}
                          />
                          <Input
                            placeholder="Category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={handleAddNewCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Add & Select Category
                        </Button>
                      </div>
                    ) : (
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TransactionCategory })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {getCategoryOptions(formData.type)
                            .sort((a, b) => {
                              const labelA = getCategoryLabel(a, settings.customCategories);
                              const labelB = getCategoryLabel(b, settings.customCategories);
                              return labelA.localeCompare(labelB);
                            })
                            .map((category) => (
                              <SelectItem key={category} value={category}>
                                {getCatIcon(category)} {getCategoryLabel(category, settings.customCategories)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <CalculatingInput
                    id="amount"
                    value={formData.amount}
                    onChange={(val) => setFormData({ ...formData, amount: String(val) })}
                    placeholder="0.00 or e.g. 100-50"
                    step="0.01"
                  />
                </div>

                {formData.type !== 'transfer' && formData.amount && (
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSplitDialogOpen(true)}
                      className="w-full"
                    >
                      <Split className="mr-2 h-4 w-4" />
                      {splits.length > 0 ? `Split into ${splits.length} categories` : 'Split Transaction'}
                    </Button>
                    {splits.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Transaction will be split across {splits.length} categories
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a note..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <DatePicker
                    date={formData.date}
                    onDateChange={(date) => setFormData({ ...formData, date: date || new Date() })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter + Sort Bar */}
      <Card>
        <CardContent className="pt-4">
          <FilterSortBar
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            resultCount={filteredTransactions.length}
            totalCount={transactions.length}
            sortFields={[
              { key: 'date', label: 'Date' },
              { key: 'amount', label: 'Amount' },
              { key: 'payee', label: 'Payee' },
              { key: 'category', label: 'Category' },
              { key: 'type', label: 'Type' },
            ]}
            filterFields={[
              {
                key: 'type',
                label: 'Type',
                type: 'select',
                options: [
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'transfer', label: 'Transfer' },
                ],
              },
              {
                key: 'account',
                label: 'Account',
                type: 'select',
                options: accounts.map(a => ({ value: a.id, label: a.name })),
              },
              {
                key: 'category',
                label: 'Category',
                type: 'select',
                options: allCategories.map(c => ({ value: c, label: c })),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>{filteredTransactions.length} transaction(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {accounts.length === 0 
                  ? 'Add an account first to start tracking transactions.' 
                  : 'No transactions yet. Add your first transaction to get started.'}
              </p>
              {accounts.length > 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Your First Transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                const toAccount = transaction.toAccountId ? accounts.find(acc => acc.id === transaction.toAccountId) : null;
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transaction.payee || 'No payee'}</p>
                          <span className="text-xl">{getCatIcon(transaction.category)}</span>
                          {transaction.splits && transaction.splits.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                              <Split className="h-3 w-3" />
                              Split ({transaction.splits.length})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account?.name}
                          {toAccount && ` → ${toAccount.name}`}
                          {' • '}
                          {new Date(transaction.date).toLocaleDateString()}
                          {' • '}
                          {transaction.splits && transaction.splits.length > 0 
                            ? `Split: ${transaction.splits.map(s => getCategoryLabel(s.category, settings.customCategories)).join(', ')}`
                            : getCategoryLabel(transaction.category, settings.customCategories)
                          }
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground italic">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-right font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 
                        transaction.type === 'expense' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount, settings.defaultCurrency)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Make Recurring"
                        onClick={() => {
                          setRecurringTransaction(transaction);
                          setIsMakeRecurringOpen(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction.id)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(transaction.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Transaction Dialog */}
      <SplitTransactionDialog
        open={isSplitDialogOpen}
        onOpenChange={setIsSplitDialogOpen}
        totalAmount={parseFloat(formData.amount) || 0}
        currency={accounts.find(a => a.id === formData.accountId)?.currency || settings.defaultCurrency}
        onSave={(newSplits) => setSplits(newSplits)}
        initialSplits={splits}
        defaultCategory={formData.category || 'other_expense'}
      />

      {/* Make Recurring Dialog */}
      <MakeRecurringDialog
        transaction={recurringTransaction}
        open={isMakeRecurringOpen}
        onClose={() => {
          setIsMakeRecurringOpen(false);
          setRecurringTransaction(null);
        }}
      />
    </div>
  );
};

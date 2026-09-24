// @ts-nocheck
import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, CATEGORY_LABELS, getCategoryIcon, INCOME_CATEGORIES, EXPENSE_CATEGORIES, FREQUENCY_LABELS } from '@/lib/finance-utils';
import { TransactionType, TransactionCategory, RecurringFrequency, TransactionSplit } from '@/types/finance';
import { PlusIcon, Trash2Icon, RepeatIcon, PlayIcon, PauseIcon, PencilIcon, SplitIcon, LayoutGridIcon, ListIcon, SkipForwardIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { getCategoryLabel } from '@/lib/category-utils';
import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { SplitTransactionDialog } from './SplitTransactionDialog';
import { CalculatingInput } from '@/components/ui/calculating-input';
import { FilterSortBar, FilterConfig, SortConfig } from './FilterSortBar';

export const RecurringTransactions = () => {
  const { accounts, recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, addTransaction, settings } = useFinance();
  const getCatIcon = (category: string) => getCategoryIcon(category, settings.customCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [postingRecurringId, setPostingRecurringId] = useState<string | null>(null);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tile' | 'list'>(() => {
    return (localStorage.getItem('recurring-view-mode') as 'tile' | 'list') || 'tile';
  });

  // Persist view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('recurring-view-mode', viewMode);
  }, [viewMode]);

  // State for manual post edit dialog
  const [isManualPostDialogOpen, setIsManualPostDialogOpen] = useState(false);
  const [manualPostData, setManualPostData] = useState<{
    recurringId: string;
    accountId: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: string;
    payee: string;
    description: string;
    date: Date;
    toAccountId: string;
    splits: any;
  } | null>(null);
  const [isManualPostSplitDialogOpen, setIsManualPostSplitDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({
    search: '', dateFrom: null, dateTo: null,
    type: 'all', account: 'all', frequency: 'all', posting: 'all',
  });
  const [sort, setSort] = useState<SortConfig>({ field: 'nextDate', direction: 'asc' });
  
  const [formData, setFormData] = useState({
    accountId: '',
    type: 'expense' as TransactionType,
    category: 'other_expense' as TransactionCategory,
    amount: '',
    payee: '',
    description: '',
    frequency: 'monthly' as RecurringFrequency,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    nextDate: new Date(),
    isActive: true,
    autoPost: true,
    toAccountId: '',
    splits: undefined as any,
  });

  const resetForm = () => {
    setFormData({
      accountId: accounts[0]?.id || '',
      type: 'expense',
      category: 'other_expense',
      amount: '',
      payee: '',
      description: '',
      frequency: 'monthly',
      startDate: new Date(),
      endDate: undefined,
      nextDate: new Date(),
      isActive: true,
      autoPost: true,
      toAccountId: '',
      splits: undefined,
    });
  };

  const handleEdit = (recurring: typeof recurringTransactions[0]) => {
    setFormData({
      accountId: recurring.accountId,
      type: recurring.type,
      category: recurring.category,
      amount: recurring.amount.toString(),
      payee: recurring.payee || '',
      description: recurring.description || '',
      frequency: recurring.frequency,
      startDate: new Date(recurring.startDate),
      endDate: recurring.endDate ? new Date(recurring.endDate) : undefined,
      nextDate: new Date(recurring.nextDate),
      isActive: recurring.isActive,
      autoPost: recurring.autoPost ?? true, // Default to true for existing recurring transactions
      toAccountId: recurring.toAccountId || '',
      splits: recurring.splits,
    });
    setEditingId(recurring.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing recurring transaction
      updateRecurringTransaction(editingId, {
        accountId: formData.accountId,
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        payee: formData.payee || undefined,
        description: formData.description || undefined,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        nextDate: formData.nextDate,
        isActive: formData.isActive,
        autoPost: formData.autoPost,
        toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
        splits: formData.splits,
      });
      setIsDialogOpen(false);
      setEditingId(null);
    } else {
      // Add new recurring transaction
      addRecurringTransaction({
        accountId: formData.accountId,
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        payee: formData.payee || undefined,
        description: formData.description || undefined,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        nextDate: formData.nextDate,
        isActive: formData.isActive,
        autoPost: formData.autoPost,
        toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
        splits: formData.splits,
      });
      setIsDialogOpen(false);
    }
    
    resetForm();
  };

  const handleDelete = (recurringId: string) => {
    deleteRecurringTransaction(recurringId);
  };

  const toggleActive = (recurringId: string, isActive: boolean) => {
    updateRecurringTransaction(recurringId, { isActive: !isActive });
  };

  const handleManualPost = (recurringId: string) => {
    const recurring = recurringTransactions.find(r => r.id === recurringId);
    if (!recurring) return;

    // Open the edit dialog pre-filled with recurring transaction data
    setManualPostData({
      recurringId: recurring.id,
      accountId: recurring.accountId,
      type: recurring.type,
      category: recurring.category,
      amount: String(recurring.amount),
      payee: recurring.payee || '',
      description: recurring.description || '',
      date: new Date(recurring.nextDate),
      toAccountId: recurring.toAccountId || '',
      splits: recurring.splits ? [...recurring.splits] : undefined,
    });
    setIsManualPostDialogOpen(true);
  };

  const handleConfirmManualPost = () => {
    if (!manualPostData || postingRecurringId === manualPostData.recurringId) return;

    setPostingRecurringId(manualPostData.recurringId);

    // Create the transaction with potentially edited values
    addTransaction({
      accountId: manualPostData.accountId,
      type: manualPostData.type,
      category: manualPostData.category,
      amount: parseFloat(manualPostData.amount) || 0,
      payee: manualPostData.payee,
      description: manualPostData.description,
      date: manualPostData.date,
      toAccountId: manualPostData.toAccountId || undefined,
      recurringId: manualPostData.recurringId,
      splits: manualPostData.splits,
    });

    // Calculate next date based on frequency
    const recurring = recurringTransactions.find(r => r.id === manualPostData.recurringId);
    if (recurring) {
      const transactionDate = manualPostData.date;
      let newNextDate = transactionDate;

      switch (recurring.frequency) {
        case 'daily': newNextDate = addDays(transactionDate, 1); break;
        case 'weekly': newNextDate = addWeeks(transactionDate, 1); break;
        case 'biweekly': newNextDate = addWeeks(transactionDate, 2); break;
        case 'monthly': newNextDate = addMonths(transactionDate, 1); break;
        case 'quarterly': newNextDate = addQuarters(transactionDate, 1); break;
        case 'yearly': newNextDate = addYears(transactionDate, 1); break;
      }

      const shouldDeactivate = recurring.endDate && newNextDate > new Date(recurring.endDate);
      updateRecurringTransaction(manualPostData.recurringId, {
        nextDate: newNextDate,
        isActive: !shouldDeactivate,
      });
    }

    setPostingRecurringId(null);
    setIsManualPostDialogOpen(false);
    setManualPostData(null);
  };

  const handleSkip = (recurringId?: string) => {
    const id = recurringId ?? manualPostData?.recurringId;
    if (!id) return;
    const recurring = recurringTransactions.find(r => r.id === id);
    if (!recurring) return;

    // Advance the next date based on frequency, starting from the current nextDate
    const currentNext = new Date(recurring.nextDate);
    let newNextDate = currentNext;

    switch (recurring.frequency) {
      case 'daily':     newNextDate = addDays(currentNext, 1);      break;
      case 'weekly':    newNextDate = addWeeks(currentNext, 1);     break;
      case 'biweekly':  newNextDate = addWeeks(currentNext, 2);     break;
      case 'monthly':   newNextDate = addMonths(currentNext, 1);    break;
      case 'quarterly': newNextDate = addQuarters(currentNext, 1);  break;
      case 'yearly':    newNextDate = addYears(currentNext, 1);     break;
    }

    const shouldDeactivate = recurring.endDate && newNextDate > new Date(recurring.endDate);
    updateRecurringTransaction(id, {
      nextDate: newNextDate,
      isActive: !shouldDeactivate,
    });

    setIsManualPostDialogOpen(false);
    setManualPostData(null);
  };

  const getCategoryOptions = (type: TransactionType): TransactionCategory[] => {
    const customCategories = settings.customCategories
      .filter(cat => !cat.type || cat.type === type)
      .map(cat => cat.name as TransactionCategory);
    
    if (type === 'income') return [...INCOME_CATEGORIES, ...customCategories];
    if (type === 'expense') return [...EXPENSE_CATEGORIES, ...customCategories];
    return ['transfer'];
  };

  const applyFiltersAndSort = (list: typeof recurringTransactions) => {
    return list
      .filter(r => {
        if (filters.type !== 'all' && r.type !== filters.type) return false;
        if (filters.account !== 'all' && r.accountId !== filters.account) return false;
        if (filters.frequency !== 'all' && r.frequency !== filters.frequency) return false;
        if (filters.posting !== 'all') {
          const isAuto = (r.autoPost ?? true);
          if (filters.posting === 'auto' && !isAuto) return false;
          if (filters.posting === 'manual' && isAuto) return false;
        }
        if (filters.dateFrom && new Date(r.nextDate) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(r.nextDate) > new Date(filters.dateTo)) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          return (
            (r.payee || '').toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q) ||
            (r.category || '').toLowerCase().includes(q) ||
            r.amount.toString().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1;
        switch (sort.field) {
          case 'nextDate': return dir * (new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
          case 'amount': return dir * (a.amount - b.amount);
          case 'payee': return dir * (a.payee || '').localeCompare(b.payee || '');
          case 'category': return dir * (a.category || '').localeCompare(b.category || '');
          case 'frequency': return dir * a.frequency.localeCompare(b.frequency);
          default: return dir * (new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
        }
      });
  };

  const activeRecurring = applyFiltersAndSort(recurringTransactions.filter(r => r.isActive));
  const inactiveRecurring = applyFiltersAndSort(recurringTransactions.filter(r => !r.isActive));
  const totalActive = recurringTransactions.filter(r => r.isActive).length;
  const totalInactive = recurringTransactions.filter(r => !r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
          <p className="text-muted-foreground">Automate your regular income and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'tile' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9 px-3"
              onClick={() => setViewMode('tile')}
              title="Tile view"
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9 px-3"
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button disabled={accounts.length === 0}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Update your recurring income or expense.' : 'Set up automatic recurring income or expenses.'}
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
                    <Label htmlFor="category">Category</Label>
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
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                {formData.type !== 'transfer' && (
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant={formData.splits ? "default" : "outline"}
                      onClick={() => setIsSplitDialogOpen(true)}
                      className="w-full"
                    >
                      <SplitIcon className="h-4 w-4 mr-2" />
                      {formData.splits ? `Split into ${formData.splits.length} categories` : 'Split Transaction'}
                    </Button>
                    {formData.splits && (
                      <p className="text-xs text-muted-foreground">
                        This transaction will be split across multiple categories
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="payee">Payee</Label>
                  <Input
                    id="payee"
                    placeholder="Who do you pay or receive from?"
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Monthly rent payment"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value as RecurringFrequency })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData({ ...formData, startDate: date || new Date(), nextDate: date || new Date() })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData({ ...formData, endDate: date })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for ongoing recurring transaction
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoPost">Auto-Post Transactions</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically create transactions on the scheduled date, or require manual posting
                    </p>
                  </div>
                  <Switch
                    id="autoPost"
                    checked={formData.autoPost}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoPost: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingId ? 'Update Recurring Transaction' : 'Add Recurring Transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {recurringTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RepeatIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {accounts.length === 0 
                ? 'Add an account first to start creating recurring transactions.' 
                : 'No recurring transactions yet. Set up automatic payments or income.'}
            </p>
            {accounts.length > 0 && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Your First Recurring Transaction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Filter + Sort Bar */}
          <Card>
            <CardContent className="pt-4">
              <FilterSortBar
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                resultCount={activeRecurring.length + inactiveRecurring.length}
                totalCount={recurringTransactions.length}
                sortFields={[
                  { key: 'nextDate', label: 'Next Date' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'payee', label: 'Payee' },
                  { key: 'category', label: 'Category' },
                  { key: 'frequency', label: 'Frequency' },
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
                    key: 'frequency',
                    label: 'Frequency',
                    type: 'select',
                    options: [
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'biweekly', label: 'Bi-Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly' },
                      { value: 'yearly', label: 'Yearly' },
                    ],
                  },
                  {
                    key: 'posting',
                    label: 'Posting',
                    type: 'select',
                    options: [
                      { value: 'auto', label: 'Automatic' },
                      { value: 'manual', label: 'Manual' },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Active Recurring Transactions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Active ({activeRecurring.length} of {totalActive})</h2>

            {/* List View */}
            {viewMode === 'list' && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium">Payee</th>
                      <th className="text-left p-3 font-medium">Account</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-left p-3 font-medium">Frequency</th>
                      <th className="text-left p-3 font-medium">Next Date</th>
                      <th className="text-left p-3 font-medium">Posting</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecurring.map((recurring) => {
                      const account = accounts.find(acc => acc.id === recurring.accountId);
                      const toAccount = recurring.toAccountId ? accounts.find(acc => acc.id === recurring.toAccountId) : null;
                      const today = new Date(); today.setHours(0,0,0,0);
                      const nextDate = new Date(recurring.nextDate); nextDate.setHours(0,0,0,0);
                      const canPost = !(recurring.autoPost ?? true);
                      const daysUntilDue = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={recurring.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span>{getCatIcon(recurring.category)}</span>
                              <span className="font-medium">{recurring.payee || 'No payee'}</span>
                              {recurring.splits && <SplitIcon className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            {recurring.description && <div className="text-xs text-muted-foreground italic">{recurring.description}</div>}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {account?.name}{toAccount && ` → ${toAccount.name}`}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {getCategoryLabel(recurring.category, settings.customCategories)}
                          </td>
                          <td className="p-3 text-muted-foreground capitalize">
                            {FREQUENCY_LABELS[recurring.frequency]}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(recurring.nextDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3">
                            <Badge variant={(recurring.autoPost ?? true) ? 'default' : 'outline'} className="text-xs">
                              {(recurring.autoPost ?? true) ? 'Auto' : 'Manual'}
                            </Badge>
                            {canPost && (
                              <div className="text-xs text-destructive mt-1">
                                {daysUntilDue > 0 ? `Due in ${daysUntilDue}d` : daysUntilDue < 0 ? `Overdue ${Math.abs(daysUntilDue)}d` : 'Due today'}
                              </div>
                            )}
                          </td>
                          <td className={`p-3 text-right font-semibold ${
                            recurring.type === 'income' ? 'text-green-600' :
                            recurring.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {recurring.type === 'income' ? '+' : recurring.type === 'expense' ? '-' : ''}
                            {formatCurrency(recurring.amount, settings.defaultCurrency)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              {canPost && (
                                <>
                                  <Button variant="default" size="sm" className="h-7 px-2 text-xs"
                                    onClick={() => handleManualPost(recurring.id)}
                                    disabled={postingRecurringId === recurring.id}>
                                    <PlayIcon className="h-3 w-3 mr-1" />
                                    {postingRecurringId === recurring.id ? '...' : 'Post'}
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                                    onClick={() => handleSkip(recurring.id)}
                                    title="Skip this occurrence">
                                    <SkipForwardIcon className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {(recurring.autoPost ?? true) && (
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  onClick={() => toggleActive(recurring.id, recurring.isActive)}
                                  title={recurring.isActive ? 'Pause' : 'Resume'}>
                                  <PauseIcon className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => handleEdit(recurring)} title="Edit">
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                    <Trash2Icon className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this recurring transaction?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(recurring.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tile View */}
            <div className={viewMode === 'tile' ? "grid gap-4 md:grid-cols-2" : "hidden"}>
              {activeRecurring.map((recurring) => {
                const account = accounts.find(acc => acc.id === recurring.accountId);
                const toAccount = recurring.toAccountId ? accounts.find(acc => acc.id === recurring.toAccountId) : null;
                
                return (
                  <Card key={recurring.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCatIcon(recurring.category)}</span>
                            <CardTitle className="text-lg">{recurring.payee || 'No payee'}</CardTitle>
                          </div>
                          <CardDescription>
                            {account?.name}
                            {toAccount && ` → ${toAccount.name}`}
                            {' • '}
                            {getCategoryLabel(recurring.category, settings.customCategories)}
                          </CardDescription>
                          {recurring.description && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {recurring.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={recurring.isActive ? 'default' : 'secondary'}>
                          {recurring.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className={`font-semibold text-lg ${
                          recurring.type === 'income' ? 'text-green-600' : 
                          recurring.type === 'expense' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {recurring.type === 'income' ? '+' : recurring.type === 'expense' ? '-' : ''}
                          {formatCurrency(recurring.amount, settings.defaultCurrency)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency</span>
                          <span>{FREQUENCY_LABELS[recurring.frequency]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Date</span>
                          <span>{new Date(recurring.nextDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Posting</span>
                          <Badge variant={(recurring.autoPost ?? true) ? 'default' : 'outline'} className="text-xs">
                            {(recurring.autoPost ?? true) ? 'Automatic' : 'Manual'}
                          </Badge>
                        </div>
                        {recurring.splits && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Split</span>
                            <Badge variant="secondary" className="text-xs">
                              <SplitIcon className="h-3 w-3 mr-1" />
                              {recurring.splits.length} categories
                            </Badge>
                          </div>
                        )}
                        {recurring.endDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ends</span>
                            <span>{new Date(recurring.endDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {!(recurring.autoPost ?? true) && (() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const nextDate = new Date(recurring.nextDate); nextDate.setHours(0,0,0,0);
                        const daysUntilDue = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div className="pt-2 space-y-2">
                            {daysUntilDue > 0 && (
                              <div className="text-xs text-center text-muted-foreground">
                                Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                              </div>
                            )}
                            {daysUntilDue === 0 && (
                              <div className="text-xs text-center text-amber-600">Due today</div>
                            )}
                            {daysUntilDue < 0 && (
                              <div className="text-xs text-center text-destructive">
                                Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                              </div>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full"
                              onClick={() => handleManualPost(recurring.id)}
                              disabled={postingRecurringId === recurring.id}
                            >
                              <PlayIcon className="mr-2 h-4 w-4" />
                              {postingRecurringId === recurring.id ? 'Posting...' : 'Post Transaction Now'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleSkip(recurring.id)}
                            >
                              <SkipForwardIcon className="mr-2 h-4 w-4" />
                              Skip This Occurrence
                            </Button>
                          </div>
                        );
                      })()}

                      <div className="flex gap-2 pt-2 border-t">
                        {(recurring.autoPost ?? true) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => toggleActive(recurring.id, recurring.isActive)}
                          >
                            {recurring.isActive ? (
                              <>
                                <PauseIcon className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <PlayIcon className="mr-2 h-4 w-4" />
                                Resume
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(recurring)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this recurring transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(recurring.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Inactive Recurring Transactions */}
          {inactiveRecurring.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paused ({inactiveRecurring.length} of {totalInactive})</h2>

              {/* List View - Paused */}
              {viewMode === 'list' && (
                <div className="border rounded-lg overflow-hidden opacity-60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Payee</th>
                        <th className="text-left p-3 font-medium">Account</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Frequency</th>
                        <th className="text-left p-3 font-medium">Next Date</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveRecurring.map((recurring) => {
                        const account = accounts.find(acc => acc.id === recurring.accountId);
                        const toAccount = recurring.toAccountId ? accounts.find(acc => acc.id === recurring.toAccountId) : null;
                        return (
                          <tr key={recurring.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span>{getCatIcon(recurring.category)}</span>
                                <span className="font-medium">{recurring.payee || 'No payee'}</span>
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{account?.name}{toAccount && ` → ${toAccount.name}`}</td>
                            <td className="p-3 text-muted-foreground">{getCategoryLabel(recurring.category, settings.customCategories)}</td>
                            <td className="p-3 text-muted-foreground capitalize">{FREQUENCY_LABELS[recurring.frequency]}</td>
                            <td className="p-3 text-muted-foreground">{new Date(recurring.nextDate).toLocaleDateString('en-GB')}</td>
                            <td className={`p-3 text-right font-semibold ${recurring.type === 'income' ? 'text-green-600' : recurring.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                              {recurring.type === 'income' ? '+' : recurring.type === 'expense' ? '-' : ''}{formatCurrency(recurring.amount, settings.defaultCurrency)}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive(recurring.id, recurring.isActive)} title="Resume">
                                  <PlayIcon className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(recurring)} title="Edit">
                                  <PencilIcon className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                      <Trash2Icon className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                                      <AlertDialogDescription>Are you sure you want to delete this recurring transaction?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(recurring.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={viewMode === 'tile' ? "grid gap-4 md:grid-cols-2" : "hidden"}>
                {inactiveRecurring.map((recurring) => {
                  const account = accounts.find(acc => acc.id === recurring.accountId);
                  const toAccount = recurring.toAccountId ? accounts.find(acc => acc.id === recurring.toAccountId) : null;
                  
                  return (
                    <Card key={recurring.id} className="opacity-60">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getCatIcon(recurring.category)}</span>
                              <CardTitle className="text-lg">{recurring.payee || 'No payee'}</CardTitle>
                            </div>
                            <CardDescription>
                              {account?.name}
                              {toAccount && ` → ${toAccount.name}`}
                              {' • '}
                              {getCategoryLabel(recurring.category, settings.customCategories)}
                            </CardDescription>
                            {recurring.description && (
                              <p className="text-sm text-muted-foreground italic mt-1">
                                {recurring.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">Paused</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className={`font-semibold text-lg ${
                            recurring.type === 'income' ? 'text-green-600' : 
                            recurring.type === 'expense' ? 'text-red-600' : 
                            'text-blue-600'
                          }`}>
                            {recurring.type === 'income' ? '+' : recurring.type === 'expense' ? '-' : ''}
                            {formatCurrency(recurring.amount, settings.defaultCurrency)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frequency</span>
                            <span>{FREQUENCY_LABELS[recurring.frequency]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Date</span>
                            <span>{new Date(recurring.nextDate).toLocaleDateString()}</span>
                          </div>
                          {recurring.endDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ends</span>
                              <span>{new Date(recurring.endDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => toggleActive(recurring.id, recurring.isActive)}
                          >
                            <PlayIcon className="mr-2 h-4 w-4" />
                            Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(recurring)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this recurring transaction? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(recurring.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isSplitDialogOpen && (
        <SplitTransactionDialog
          open={isSplitDialogOpen}
          onOpenChange={setIsSplitDialogOpen}
          totalAmount={parseFloat(formData.amount) || 0}
          currency={settings?.defaultCurrency || 'GBP'}
          defaultCategory={formData.category || 'other_expense'}
          onSave={(splits) => {
            setFormData({ ...formData, splits });
            setIsSplitDialogOpen(false);
          }}
          initialSplits={formData.splits || []}
        />
      )}

      {/* Manual Post Edit Dialog */}
      {manualPostData && (
        <Dialog open={isManualPostDialogOpen} onOpenChange={(open) => {
          setIsManualPostDialogOpen(open);
          if (!open) setManualPostData(null);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlayIcon className="h-5 w-5 text-primary" />
                Post Transaction
              </DialogTitle>
              <DialogDescription>
                Review and adjust the transaction details before posting. Changes here only affect this posting, not the recurring template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Type tabs */}
              <div className="flex rounded-lg border overflow-hidden">
                {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setManualPostData({ ...manualPostData, type: t })}
                    className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                      manualPostData.type === t
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Account */}
              <div className="space-y-1">
                <Label>Account</Label>
                <Select value={manualPostData.accountId} onValueChange={(v) => setManualPostData({ ...manualPostData, accountId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={manualPostData.category} onValueChange={(v) => setManualPostData({ ...manualPostData, category: v as TransactionCategory })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {getCategoryOptions(manualPostData.type).sort((a, b) => getCategoryLabel(a, settings).localeCompare(getCategoryLabel(b, settings))).map(cat => (
                      <SelectItem key={cat} value={cat}>{getCatIcon(cat)} {getCategoryLabel(cat, settings)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <Label>Amount</Label>
                <CalculatingInput
                  value={manualPostData.amount}
                  onChange={(val) => setManualPostData({ ...manualPostData, amount: String(val) })}
                  placeholder="0.00 or e.g. 100-50"
                  step="0.01"
                />
              </div>

              {/* Split Transaction Button */}
              <Button
                type="button"
                variant={manualPostData.splits && manualPostData.splits.length > 0 ? "default" : "outline"}
                className="w-full"
                onClick={() => setIsManualPostSplitDialogOpen(true)}
              >
                <SplitIcon className="h-4 w-4 mr-2" />
                {manualPostData.splits && manualPostData.splits.length > 0
                  ? `Split into ${manualPostData.splits.length} categories`
                  : 'Split Transaction'}
              </Button>

              {/* Payee */}
              <div className="space-y-1">
                <Label>Payee</Label>
                <Input
                  value={manualPostData.payee}
                  onChange={(e) => setManualPostData({ ...manualPostData, payee: e.target.value })}
                  placeholder="Payee name"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={manualPostData.description}
                  onChange={(e) => setManualPostData({ ...manualPostData, description: e.target.value })}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <Label>Date</Label>
                <DatePicker
                  date={manualPostData.date}
                  onDateChange={(d) => d && setManualPostData({ ...manualPostData, date: d })}
                />
              </div>

              {/* Transfer destination */}
              {manualPostData.type === 'transfer' && (
                <div className="space-y-1">
                  <Label>To Account</Label>
                  <Select value={manualPostData.toAccountId} onValueChange={(v) => setManualPostData({ ...manualPostData, toAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select destination account" /></SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {accounts.filter(a => a.id !== manualPostData.accountId).map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsManualPostDialogOpen(false); setManualPostData(null); }}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSkip}
                title={`Skip this occurrence and advance to the next ${recurringTransactions.find(r => r.id === manualPostData.recurringId)?.frequency ?? 'scheduled'} date`}
              >
                <SkipForwardIcon className="h-4 w-4 mr-2" />
                Skip This Occurrence
              </Button>
              <Button onClick={handleConfirmManualPost} disabled={postingRecurringId === manualPostData.recurringId}>
                <PlayIcon className="h-4 w-4 mr-2" />
                {postingRecurringId === manualPostData.recurringId ? 'Posting...' : 'Post Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Split dialog for manual post */}
      {isManualPostSplitDialogOpen && manualPostData && (
        <SplitTransactionDialog
          open={isManualPostSplitDialogOpen}
          onOpenChange={setIsManualPostSplitDialogOpen}
          totalAmount={parseFloat(manualPostData.amount) || 0}
          currency={settings?.defaultCurrency || 'GBP'}
          defaultCategory={manualPostData.category || 'other_expense'}
          onSave={(splits) => {
            setManualPostData({ ...manualPostData, splits });
            setIsManualPostSplitDialogOpen(false);
          }}
          initialSplits={manualPostData.splits || []}
        />
      )}
    </div>
  );
};

// @ts-nocheck
import { useState, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, ACCOUNT_TYPE_LABELS, ACCOUNT_COLORS, getAccountTypeIcon } from '@/lib/finance-utils';
import { AccountType } from '@/types/finance';
import { PlusIcon, Trash2Icon, EditIcon, GripVertical, EyeOffIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AccountDetails } from './AccountDetails';

export const Accounts = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, reorderAccounts, settings, getAccountBalance } = useFinance();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Drag-and-drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as AccountType,
    balance: '',
    currency: settings.defaultCurrency,
    color: ACCOUNT_COLORS[0],
    warningThresholdLow: '',
    warningThresholdHigh: '',
    includeInTotalBalance: true,
    includeInTypeTotal: true,
    // Property fields
    propertyAddress: '',
    purchasePrice: '',
    purchaseDate: '',
    currentValuation: '',
    mortgageBalance: '',
    mortgageLender: '',
    mortgageRate: '',
    mortgageMonthlyPayment: '',
    mortgageEndDate: '',
  });

  // If an account is selected, show account details
  if (selectedAccountId) {
    return (
      <AccountDetails
        accountId={selectedAccountId}
        onBack={() => setSelectedAccountId(null)}
      />
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'checking',
      balance: '',
      currency: settings.defaultCurrency,
      color: ACCOUNT_COLORS[0],
      warningThresholdLow: '',
      warningThresholdHigh: '',
      includeInTotalBalance: true,
      includeInTypeTotal: true,
      propertyAddress: '',
      purchasePrice: '',
      purchaseDate: '',
      currentValuation: '',
      mortgageBalance: '',
      mortgageLender: '',
      mortgageRate: '',
      mortgageMonthlyPayment: '',
      mortgageEndDate: '',
    });
    setEditingAccount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const accountData = {
      name: formData.name,
      type: formData.type,
      balance: formData.type === 'property'
        ? (parseFloat(formData.currentValuation) || 0) - (parseFloat(formData.mortgageBalance) || 0)
        : parseFloat(formData.balance),
      currency: formData.currency,
      color: formData.color,
      warningThresholdLow: formData.warningThresholdLow ? parseFloat(formData.warningThresholdLow) : undefined,
      warningThresholdHigh: formData.warningThresholdHigh ? parseFloat(formData.warningThresholdHigh) : undefined,
      lowBalanceWarning: formData.warningThresholdLow ? parseFloat(formData.warningThresholdLow) : undefined,
      highBalanceWarning: formData.warningThresholdHigh ? parseFloat(formData.warningThresholdHigh) : undefined,
      includeInTotalBalance: formData.includeInTotalBalance,
      includeInTypeTotal: formData.includeInTypeTotal,
      ...(formData.type === 'property' && {
        propertyAddress: formData.propertyAddress,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        purchaseDate: formData.purchaseDate,
        currentValuation: parseFloat(formData.currentValuation) || 0,
        mortgageBalance: parseFloat(formData.mortgageBalance) || 0,
        mortgageLender: formData.mortgageLender,
        mortgageRate: parseFloat(formData.mortgageRate) || 0,
        mortgageMonthlyPayment: parseFloat(formData.mortgageMonthlyPayment) || 0,
        mortgageEndDate: formData.mortgageEndDate,
      }),
    };

    if (editingAccount) {
      updateAccount(editingAccount, accountData);
    } else {
      addAccount(accountData);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        currency: account.currency,
        color: account.color,
        warningThresholdLow: (account.warningThresholdLow ?? account.lowBalanceWarning)?.toString() || '',
        warningThresholdHigh: (account.warningThresholdHigh ?? account.highBalanceWarning)?.toString() || '',
        includeInTotalBalance: account.includeInTotalBalance !== false,
        includeInTypeTotal: account.includeInTypeTotal !== false,
        propertyAddress: (account as any).propertyAddress || '',
        purchasePrice: (account as any).purchasePrice?.toString() || '',
        purchaseDate: (account as any).purchaseDate || '',
        currentValuation: (account as any).currentValuation?.toString() || '',
        mortgageBalance: (account as any).mortgageBalance?.toString() || '',
        mortgageLender: (account as any).mortgageLender || '',
        mortgageRate: (account as any).mortgageRate?.toString() || '',
        mortgageMonthlyPayment: (account as any).mortgageMonthlyPayment?.toString() || '',
        mortgageEndDate: (account as any).mortgageEndDate || '',
      });
      setEditingAccount(accountId);
      setIsAddDialogOpen(true);
    }
  };

  const handleDelete = (accountId: string) => {
    deleteAccount(accountId);
  };

  // ── Drag and drop handlers ──────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost image so the card itself appears to move
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newOrder = [...accounts];
      const dragged = newOrder.splice(dragItem.current, 1)[0];
      newOrder.splice(dragOverItem.current, 0, dragged);
      reorderAccounts(newOrder.map(a => a.id));
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ── Totals by account type ──────────────────────────────────────────────
  const totalBalance = accounts
    .filter(acc => acc.includeInTotalBalance !== false)
    .reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);

  // Build per-type summaries (only for types that have at least one account)
  const typeSummaries = Object.entries(ACCOUNT_TYPE_LABELS)
    .map(([type, label]) => {
      const typeAccounts = accounts.filter(a => a.type === type);
      if (typeAccounts.length === 0) return null;
      const includedAccounts = typeAccounts.filter(a => a.includeInTypeTotal !== false);
      const total = includedAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
      const excludedCount = typeAccounts.length - includedAccounts.length;
      return { type: type as AccountType, label, count: typeAccounts.length, includedCount: includedAccounts.length, excludedCount, total };
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts and balances</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? 'Update your account details.' : 'Create a new account to track your finances.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Checking"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {getAccountTypeIcon(value as AccountType)} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type !== 'property' && (
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="warningThresholdLow">Low Balance Warning (Optional)</Label>
                  <Input
                    id="warningThresholdLow"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={formData.warningThresholdLow}
                    onChange={(e) => setFormData({ ...formData, warningThresholdLow: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Alert when balance falls below this amount</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="warningThresholdHigh">High Balance Warning (Optional)</Label>
                  <Input
                    id="warningThresholdHigh"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10000"
                    value={formData.warningThresholdHigh}
                    onChange={(e) => setFormData({ ...formData, warningThresholdHigh: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Alert when balance exceeds this amount</p>
                </div>
              </div>

              {/* Property-specific fields */}
              {formData.type === 'property' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">🏠 Property Details</h3>
                  <div className="grid gap-2">
                    <Label>Property Address</Label>
                    <Input placeholder="e.g., 123 Main Street, London" value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Purchase Price</Label>
                      <Input type="number" placeholder="e.g., 250000" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Purchase Date</Label>
                      <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Current Valuation</Label>
                    <Input type="number" placeholder="e.g., 300000" value={formData.currentValuation} onChange={(e) => setFormData({ ...formData, currentValuation: e.target.value })} />
                  </div>
                  <h3 className="font-semibold text-sm pt-2">🏦 Mortgage Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Mortgage Balance</Label>
                      <Input type="number" placeholder="e.g., 180000" value={formData.mortgageBalance} onChange={(e) => setFormData({ ...formData, mortgageBalance: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mortgage Lender</Label>
                      <Input placeholder="e.g., Halifax" value={formData.mortgageLender} onChange={(e) => setFormData({ ...formData, mortgageLender: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Interest Rate (%)</Label>
                      <Input type="number" step="0.01" placeholder="e.g., 3.5" value={formData.mortgageRate} onChange={(e) => setFormData({ ...formData, mortgageRate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Monthly Payment</Label>
                      <Input type="number" placeholder="e.g., 800" value={formData.mortgageMonthlyPayment} onChange={(e) => setFormData({ ...formData, mortgageMonthlyPayment: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Mortgage End Date</Label>
                    <Input type="date" value={formData.mortgageEndDate} onChange={(e) => setFormData({ ...formData, mortgageEndDate: e.target.value })} />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="submit">{editingAccount ? 'Update' : 'Add'} Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Total Balance ── */}
      <Card>
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
          <CardDescription>
            {accounts.filter(a => a.includeInTotalBalance === false).length > 0
              ? `Combined balance across included accounts (${accounts.filter(a => a.includeInTotalBalance === false).length} excluded)`
              : 'Combined balance across all accounts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{formatCurrency(totalBalance, settings.defaultCurrency)}</div>
        </CardContent>
      </Card>

      {/* ── Totals by Account Type ── */}
      {typeSummaries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Totals by Account Type</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {typeSummaries.map(({ type, label, count, total }) => (
              <Card key={type} className="border-l-4" style={{ borderLeftColor: accounts.find(a => a.type === type)?.color || '#6366f1' }}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{getAccountTypeIcon(type)}</span>
                    <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
                  </div>
                  <div className="text-xl font-bold leading-tight">
                    {formatCurrency(total, settings.defaultCurrency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {count} {count === 1 ? 'account' : 'accounts'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Accounts Grid (draggable) ── */}
      {accounts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">All Accounts</h2>
            {accounts.length > 1 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> drag to reorder
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => (
              <Card
                key={account.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-150 ${
                  dragOverIndex === index && dragItem.current !== index
                    ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                    : ''
                } ${
                  isDragging && dragItem.current === index
                    ? 'opacity-50'
                    : ''
                }`}
              >
                <div className="px-6 pt-6 pb-0 flex items-center gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: account.color }}
                      >
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <CardTitle className="text-lg truncate">{account.name}</CardTitle>
                        <CardDescription className="capitalize truncate">{ACCOUNT_TYPE_LABELS[account.type]}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(account.id)}
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
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This will also delete all associated transactions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(account.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                </div>
                <CardContent
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <div className="text-3xl font-bold">{formatCurrency(getAccountBalance(account.id), settings.defaultCurrency)}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Created {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-primary mt-2">Click to view transactions →</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No accounts yet. Add your first account to get started.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

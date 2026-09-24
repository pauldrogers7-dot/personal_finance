// @ts-nocheck
import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { Transaction, RecurringFrequency } from '@/types/finance';
import { formatCurrency } from '@/lib/finance-utils';
import { RefreshCw } from 'lucide-react';
import { getCategoryLabel } from '@/lib/category-utils';

interface MakeRecurringDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly (Every 2 Weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const MakeRecurringDialog: React.FC<MakeRecurringDialogProps> = ({ transaction, open, onClose }) => {
  const { addRecurringTransaction, accounts, settings } = useFinance();

  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [autoPost, setAutoPost] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = () => {
    if (!transaction) return;

    addRecurringTransaction({
      accountId: transaction.accountId,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      payee: transaction.payee,
      description: transaction.description,
      frequency,
      startDate,
      endDate,
      nextDate: startDate,
      isActive,
      autoPost,
      toAccountId: transaction.toAccountId,
      splits: transaction.splits,
    });

    onClose();
  };

  if (!transaction) return null;

  const account = accounts.find(a => a.id === transaction.accountId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Make Recurring
          </DialogTitle>
          <DialogDescription>
            Set up this transaction to repeat automatically
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payee</span>
            <span className="font-medium">{transaction.payee || transaction.description || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className={`font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
              {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount, settings.defaultCurrency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span>{getCategoryLabel(transaction.category)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account</span>
            <span>{account?.name || 'Unknown'}</span>
          </div>
          {transaction.splits && transaction.splits.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Splits</span>
              <span>{transaction.splits.length} categories</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {FREQUENCY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date (Next Occurrence)</Label>
            <DatePicker
              date={startDate}
              onDateChange={(d) => d && setStartDate(d)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date (Optional)</Label>
            <DatePicker
              date={endDate}
              onDateChange={(d) => setEndDate(d)}
            />
            <p className="text-xs text-muted-foreground">Leave empty for ongoing recurring transaction</p>
          </div>

          {/* Auto Post */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Post Transactions</Label>
              <p className="text-xs text-muted-foreground">
                Automatically create transactions on the scheduled date
              </p>
            </div>
            <Switch checked={autoPost} onCheckedChange={setAutoPost} />
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">
                Start recurring immediately
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Create Recurring Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

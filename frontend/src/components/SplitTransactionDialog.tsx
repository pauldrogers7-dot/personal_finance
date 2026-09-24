import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionSplit, TransactionCategory } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Split } from 'lucide-react';
import { formatCurrency } from '@/lib/finance-utils';
import { CalculatingInput } from '@/components/ui/calculating-input';
import { getCategoryLabel } from '@/lib/category-utils';

interface SplitTransactionDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  totalAmount: number;
  currency: string;
  onSave: (splits: TransactionSplit[]) => void;
  initialSplits?: TransactionSplit[];
  defaultCategory?: string;
}

export const SplitTransactionDialog: React.FC<SplitTransactionDialogProps> = ({
  open,
  onOpenChange,
  onClose,
  totalAmount,
  currency,
  onSave,
  initialSplits = [],
  defaultCategory = 'other_expense',
}) => {
  const { getAllCategories } = useFinance();
  const [splits, setSplits] = useState<TransactionSplit[]>(
    initialSplits.length > 0 ? initialSplits : [{ category: defaultCategory, amount: totalAmount, description: '' }]
  );

  const allCategories = getAllCategories();

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    if (!open && onClose) onClose();
  };

  // Reset splits when dialog opens or when initialSplits/totalAmount changes
  useEffect(() => {
    if (open) {
      if (initialSplits.length > 0) {
        // Load existing splits
        setSplits(initialSplits);
      } else {
        // Reset to default single split using the form's current category
        setSplits([{ category: defaultCategory, amount: totalAmount, description: '' }]);
      }
    }
  }, [open, totalAmount, initialSplits, defaultCategory]);

  const addSplit = () => {
    const remaining = totalAmount - splits.reduce((sum, split) => sum + split.amount, 0);
    setSplits([...splits, { category: defaultCategory, amount: Math.max(0, remaining), description: '' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateSplit = (index: number, field: keyof TransactionSplit, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
  const difference = totalAmount - splitTotal;
  const isValid = Math.abs(difference) < 0.01; // Allow for small floating point errors

  const handleSave = () => {
    if (isValid) {
      onSave(splits);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Transaction
          </DialogTitle>
          <DialogDescription>
            Divide this transaction across multiple categories. Total must equal {formatCurrency(totalAmount, currency)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {splits.map((split, index) => (
            <div key={index} className="flex gap-2 items-start p-4 border rounded-lg bg-card">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`category-${index}`}>Category</Label>
                  <Select
                    value={split.category}
                    onValueChange={(value) => updateSplit(index, 'category', value)}
                  >
                    <SelectTrigger id={`category-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {allCategories
                        .sort((a, b) => {
                          const labelA = getCategoryLabel(a);
                          const labelB = getCategoryLabel(b);
                          return labelA.localeCompare(labelB);
                        })
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryLabel(category)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>Amount</Label>
                  <CalculatingInput
                    id={`amount-${index}`}
                    value={split.amount}
                    onChange={(val) => {
                      const newSplits = [...splits];
                      newSplits[index] = { ...newSplits[index], amount: val };
                      setSplits(newSplits);
                    }}
                    placeholder="0.00 or e.g. 100-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use expressions e.g. 100-35, or negative values e.g. -35
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="e.g., Office supplies"
                    value={split.description || ''}
                    onChange={(e) => updateSplit(index, 'description', e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSplit(index)}
                disabled={splits.length === 1}
                className="mt-8"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addSplit}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Split
          </Button>

          {/* Summary */}
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction Total:</span>
              <span className="font-medium">{formatCurrency(totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Split Total:</span>
              <span className={`font-medium ${!isValid ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(splitTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {difference > 0 ? 'Remaining to Allocate:' : difference < 0 ? 'Over Allocated:' : 'Balanced:'}
              </span>
              <span className={`font-medium ${!isValid ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(difference), currency)}
              </span>
            </div>
            {!isValid && (
              <p className="text-xs text-destructive mt-2">
                {difference > 0 
                  ? `Add ${formatCurrency(difference, currency)} more to balance the split.`
                  : `Reduce by ${formatCurrency(Math.abs(difference), currency)} to balance the split.`
                }
              </p>
            )}
            {isValid && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Split is balanced and ready to save
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Splits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

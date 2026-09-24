import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, CATEGORY_LABELS, getCategoryIcon, EXPENSE_CATEGORIES } from '@/lib/finance-utils';
import { TransactionCategory } from '@/types/finance';
import { PlusIcon, Trash2Icon, AlertTriangleIcon, CheckCircleIcon, PencilIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DatePicker } from '@/components/ui/date-picker';

export const Budgets = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetProgress, settings } = useFinance();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'other_expense' as TransactionCategory,
    amount: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    alertThreshold: '80',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other_expense',
      amount: '',
      period: 'monthly',
      startDate: new Date(),
      endDate: undefined,
      alertThreshold: '80',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBudgetId) {
      // Update existing budget
      updateBudget(editingBudgetId, {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
        alertThreshold: parseFloat(formData.alertThreshold),
      });
      setIsEditDialogOpen(false);
      setEditingBudgetId(null);
    } else {
      // Add new budget
      addBudget({
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
        alertThreshold: parseFloat(formData.alertThreshold),
      });
      setIsAddDialogOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (budget: any) => {
    setEditingBudgetId(budget.id);
    setFormData({
      name: budget.name,
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: new Date(budget.startDate),
      endDate: budget.endDate ? new Date(budget.endDate) : undefined,
      alertThreshold: budget.alertThreshold?.toString() || '80',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (budgetId: string) => {
    deleteBudget(budgetId);
  };

  const getBudgetStatus = (percentage: number, alertThreshold?: number) => {
    if (percentage >= 100) return { color: 'text-red-600', icon: AlertTriangleIcon, label: 'Over Budget' };
    if (alertThreshold && percentage >= alertThreshold) return { color: 'text-yellow-600', icon: AlertTriangleIcon, label: 'Near Limit' };
    return { color: 'text-green-600', icon: CheckCircleIcon, label: 'On Track' };
  };

  // Group budgets by category and calculate combined progress
  const getCategoryBudgetProgress = (category: TransactionCategory) => {
    const categoryBudgets = budgets.filter(b => b.category === category);
    if (categoryBudgets.length === 0) return null;

    // Get spending from the first budget (they all have the same category, so spending is the same)
    const firstBudgetProgress = getBudgetProgress(categoryBudgets[0].id);
    
    // Sum all budget amounts for this category
    const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
    
    // Calculate combined progress
    const spent = firstBudgetProgress.spent;
    const remaining = totalBudget - spent;
    const percentage = (spent / totalBudget) * 100;
    
    // Use the lowest alert threshold from all budgets in this category
    const lowestThreshold = Math.min(...categoryBudgets.map(b => b.alertThreshold || 100));

    return {
      budgets: categoryBudgets,
      totalBudget,
      spent,
      remaining,
      percentage,
      alertThreshold: lowestThreshold,
    };
  };

  // Get unique categories from all budgets
  const uniqueCategories = Array.from(new Set(budgets.map(b => b.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Set spending limits and track your progress</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Budget</DialogTitle>
                <DialogDescription>Set a spending limit for a category.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Groceries"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TransactionCategory })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {EXPENSE_CATEGORIES
                        .sort((a, b) => {
                          const labelA = CATEGORY_LABELS[a];
                          const labelB = CATEGORY_LABELS[b];
                          return labelA.localeCompare(labelB);
                        })
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryIcon(category)} {CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Budget Amount</Label>
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

                <div className="grid gap-2">
                  <Label htmlFor="period">Period</Label>
                  <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value as 'monthly' | 'quarterly' | 'yearly' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="80"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get notified when spending reaches this percentage
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData({ ...formData, endDate: date })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for ongoing budget
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingBudgetId(null);
          }
        }}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Budget</DialogTitle>
                <DialogDescription>Update your budget details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Budget Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., Monthly Groceries"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TransactionCategory })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {EXPENSE_CATEGORIES
                        .sort((a, b) => {
                          const labelA = CATEGORY_LABELS[a];
                          const labelB = CATEGORY_LABELS[b];
                          return labelA.localeCompare(labelB);
                        })
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryIcon(category)} {CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Budget Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-period">Period</Label>
                  <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value as 'monthly' | 'quarterly' | 'yearly' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-alertThreshold">Alert Threshold (%)</Label>
                  <Input
                    id="edit-alertThreshold"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="80"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get notified when spending reaches this percentage
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData({ ...formData, endDate: date })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for ongoing budget
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No budgets yet. Create your first budget to start tracking spending limits.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {uniqueCategories.map((category) => {
            const categoryProgress = getCategoryBudgetProgress(category);
            if (!categoryProgress) return null;

            const status = getBudgetStatus(categoryProgress.percentage, categoryProgress.alertThreshold);
            const StatusIcon = status.icon;

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                        <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
                      </div>
                      <CardDescription>
                        {categoryProgress.budgets.length > 1 
                          ? `${categoryProgress.budgets.length} budgets combined` 
                          : categoryProgress.budgets[0].name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {categoryProgress.budgets.length === 1 ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(categoryProgress.budgets[0])}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Select onValueChange={(budgetId) => {
                          const budget = categoryProgress.budgets.find(b => b.id === budgetId);
                          if (budget) handleEdit(budget);
                        }}>
                          <SelectTrigger className="w-auto h-9 px-2">
                            <PencilIcon className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryProgress.budgets.map((budget) => (
                              <SelectItem key={budget.id} value={budget.id}>
                                Edit {budget.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Budget{categoryProgress.budgets.length > 1 ? 's' : ''}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {categoryProgress.budgets.length > 1 
                              ? `Are you sure you want to delete all ${categoryProgress.budgets.length} budgets in this category? This action cannot be undone.`
                              : 'Are you sure you want to delete this budget? This action cannot be undone.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => categoryProgress.budgets.forEach(b => handleDelete(b.id))}>
                            Delete {categoryProgress.budgets.length > 1 ? 'All' : ''}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-medium">{formatCurrency(categoryProgress.spent, settings.defaultCurrency)} of {formatCurrency(categoryProgress.totalBudget, settings.defaultCurrency)}</span>
                    </div>
                    <Progress value={Math.min(categoryProgress.percentage, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <div className={`flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">{status.label}</span>
                      </div>
                      <span className="text-muted-foreground">{categoryProgress.percentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  {categoryProgress.budgets.length > 1 && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Budget Breakdown:</div>
                      {categoryProgress.budgets.map((budget) => (
                        <div key={budget.id} className="flex justify-between text-sm pl-2">
                          <span className="text-muted-foreground">{budget.name}</span>
                          <span className="font-medium">{formatCurrency(budget.amount, settings.defaultCurrency)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-semibold ${categoryProgress.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(categoryProgress.remaining), settings.defaultCurrency)}
                        {categoryProgress.remaining < 0 && ' over'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

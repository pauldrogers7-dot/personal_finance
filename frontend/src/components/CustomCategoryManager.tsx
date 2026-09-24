import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { CustomCategory } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { toast } from 'sonner';

// Curated set of icons relevant to personal finance / daily life
const ICON_OPTIONS = [
  // Money & Finance
  '💰', '💵', '💴', '💳', '🏦', '📈', '📉', '🪙', '💸', '🤑',
  // Work & Income
  '💼', '💻', '🖥️', '🏢', '🎯', '🏆', '📊', '🤝', '🎓',
  // Home & Living
  '🏠', '🏡', '🔧', '🛋️', '💡', '🌿', '🌊', '🔑',
  // Food & Drink
  '🛒', '🍽️', '☕', '🍕', '🍔', '🍱', '🥗', '🍷',
  // Transport
  '🚗', '🚌', '🚂', '✈️', '⛽', '🛵', '🚲',
  // Health & Wellness
  '⚕️', '💊', '🏋️', '🧘', '🏥', '🦷', '🌡️',
  // Entertainment & Leisure
  '🎬', '🎮', '🎵', '🎨', '📚', '⚽', '🎸', '🎭', '🎲',
  // Shopping & Lifestyle
  '🛍️', '👗', '👟', '💄', '📱', '🖼️', '🎁',
  // Family & Pets
  '👶', '🐶', '🐱', '🌸',
  // Subscriptions & Utilities
  '📡', '🛡️', '🔒', '📦', '🌐',
  // Miscellaneous
  '🏷️', '⭐', '🔄', '📌', '🗓️',
];

interface FormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  type: 'expense',
  color: '#3b82f6',
  icon: '🏷️',
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => (
  <div>
    <Label>Icon</Label>
    <div className="mt-2 flex items-center gap-3 mb-2">
      <span className="text-3xl">{value}</span>
      <span className="text-sm text-muted-foreground">Selected icon</span>
    </div>
    <div className="grid grid-cols-10 gap-1 p-2 border rounded-lg bg-muted/30 max-h-40 overflow-y-auto">
      {ICON_OPTIONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={`text-xl p-1 rounded hover:bg-accent transition-colors flex items-center justify-center ${
            value === icon ? 'bg-primary/20 ring-2 ring-primary' : ''
          }`}
          title={icon}
        >
          {icon}
        </button>
      ))}
    </div>
  </div>
);

const CategoryForm: React.FC<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  description: string;
  submitLabel: string;
}> = ({ formData, setFormData, onSubmit, title, description, submitLabel }) => (
  <form onSubmit={onSubmit}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          placeholder="e.g., Pet Care, Gifts, Hobbies"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: 'income' | 'expense') =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <IconPicker
        value={formData.icon}
        onChange={(icon) => setFormData({ ...formData, icon })}
      />
      <div className="space-y-2">
        <Label htmlFor="color">Colour</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#3b82f6"
          />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">{submitLabel}</Button>
    </DialogFooter>
  </form>
);

export const CustomCategoryManager: React.FC = () => {
  const { settings, addCustomCategory, updateCustomCategory, deleteCustomCategory } = useFinance();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    addCustomCategory({
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
    });
    toast.success('Category added successfully');
    setIsAddDialogOpen(false);
    setFormData(DEFAULT_FORM);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (!editingCategory) return;
    updateCustomCategory(editingCategory.id, {
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
    });
    toast.success('Category updated successfully');
    setEditingCategory(null);
    setFormData(DEFAULT_FORM);
  };

  const handleEdit = (category: CustomCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
      icon: category.icon || '🏷️',
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      deleteCustomCategory(id);
      toast.success('Category deleted successfully');
    }
  };

  const incomeCategories = settings.customCategories.filter((cat) => cat.type === 'income');
  const expenseCategories = settings.customCategories.filter((cat) => cat.type === 'expense');

  const renderCategoryList = (categories: CustomCategory[]) => (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon || '🏷️'}</span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color || '#3b82f6' }}
            />
            <span className="font-medium">{category.name}</span>
          </div>
          <div className="flex gap-2">
            {/* Edit dialog */}
            <Dialog
              open={editingCategory?.id === category.id}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingCategory(null);
                  setFormData(DEFAULT_FORM);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <CategoryForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleEditSubmit}
                  title="Edit Category"
                  description="Update the category details"
                  submitLabel="Save Changes"
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id, category.name)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Custom Categories
            </CardTitle>
            <CardDescription>
              Create and manage your own transaction categories
            </CardDescription>
          </div>

          {/* Add dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setFormData(DEFAULT_FORM)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <CategoryForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddSubmit}
                title="Add Custom Category"
                description="Create a new category for your transactions"
                submitLabel="Add Category"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Income */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-green-600 dark:text-green-400">
              Income Categories ({incomeCategories.length})
            </h3>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom income categories yet</p>
            ) : (
              renderCategoryList(incomeCategories)
            )}
          </div>

          {/* Expense */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-red-600 dark:text-red-400">
              Expense Categories ({expenseCategories.length})
            </h3>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom expense categories yet</p>
            ) : (
              renderCategoryList(expenseCategories)
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

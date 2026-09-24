// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { DashboardWidget, DashboardSettings } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const widgetLabels: Record<DashboardWidget, { title: string; description: string }> = {
  'summary-cards': {
    title: 'Summary Cards',
    description: 'Total balance, monthly income, expenses, and net income'
  },
  'account-warnings': {
    title: 'Account Warnings',
    description: 'Alerts for low/high balance thresholds'
  },
  'cash-flow-forecast': {
    title: 'Cash Flow Forecast',
    description: 'Visual projection of future balances based on recurring transactions'
  },
  'accounts-overview': {
    title: 'Accounts Overview',
    description: 'Quick view of all your accounts and balances'
  },
  'recent-transactions': {
    title: 'Recent Transactions',
    description: 'Latest 10 transactions across all accounts'
  },
  'budget-overview': {
    title: 'Budget Overview',
    description: 'Current month budget progress and spending'
  }
};

export function DashboardCustomizer({ open, onOpenChange }: DashboardCustomizerProps) {
  const { settings, updateSettings } = useFinance();
  const [localSettings, setLocalSettings] = useState(settings.dashboard);

  useEffect(() => {
    setLocalSettings(settings.dashboard);
  }, [settings.dashboard]);

  const handleToggleVisibility = (widgetId: DashboardWidget) => {
    const newSettings = {
      ...localSettings,
      widgets: localSettings.widgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    };
    setLocalSettings(newSettings);
  };

  const handleMoveUp = (widgetId: DashboardWidget) => {
    const index = localSettings.widgets.findIndex(w => w.id === widgetId);
    if (index > 0) {
      const newWidgets = [...localSettings.widgets];
      [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
      // Update order numbers
      const reordered = newWidgets.map((w, i) => ({ ...w, order: i }));
      setLocalSettings({ ...localSettings, widgets: reordered });
    }
  };

  const handleMoveDown = (widgetId: DashboardWidget) => {
    const index = localSettings.widgets.findIndex(w => w.id === widgetId);
    if (index < localSettings.widgets.length - 1) {
      const newWidgets = [...localSettings.widgets];
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      // Update order numbers
      const reordered = newWidgets.map((w, i) => ({ ...w, order: i }));
      setLocalSettings({ ...localSettings, widgets: reordered });
    }
  };

  const handleSave = () => {
    updateSettings({ ...settings, dashboard: localSettings });
    onOpenChange(false);
  };

  const handleReset = () => {
    // Reset to default
    const defaultSettings: DashboardSettings = {
      widgets: [
        { id: 'summary-cards', visible: true, order: 0 },
        { id: 'account-warnings', visible: true, order: 1 },
        { id: 'cash-flow-forecast', visible: true, order: 2 },
        { id: 'accounts-overview', visible: true, order: 3 },
        { id: 'recent-transactions', visible: true, order: 4 },
        { id: 'budget-overview', visible: true, order: 5 }
      ]
    };
    setLocalSettings(defaultSettings);
  };

  const visibleCount = localSettings.widgets.filter(w => w.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which widgets to display and arrange their order. {visibleCount} of {localSettings.widgets.length} widgets visible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {localSettings.widgets.map((widget, index) => {
            const info = widgetLabels[widget.id];
            return (
              <Card key={widget.id} className={!widget.visible ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {widget.visible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base">{info.title}</CardTitle>
                      </div>
                      <CardDescription className="mt-1 text-sm">
                        {info.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleMoveUp(widget.id)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleMoveDown(widget.id)}
                          disabled={index === localSettings.widgets.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={widget.visible}
                          onCheckedChange={() => handleToggleVisibility(widget.id)}
                          id={`widget-${widget.id}`}
                        />
                        <Label htmlFor={`widget-${widget.id}`} className="sr-only">
                          Toggle {info.title}
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

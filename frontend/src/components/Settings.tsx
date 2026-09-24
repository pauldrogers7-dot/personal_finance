import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { SecuritySettings } from './SecuritySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, Upload, Trash2, Sparkles, Database, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CURRENCIES } from '@/lib/currency-utils';
import { Currency } from '@/types/finance';
import { CustomCategoryManager } from './CustomCategoryManager';
import { QIFImport } from './QIFImport';
import { CSVImport } from './CSVImport';

export const Settings = () => {
  const { accounts, transactions, budgets, recurringTransactions, settings, importData, loadSampleData, clearAllData, updateSettings } = useFinance();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const handleCurrencyChange = (currency: Currency) => {
    updateSettings({ defaultCurrency: currency });
    toast({
      title: 'Currency Updated',
      description: `Default currency changed to ${CURRENCIES[currency].name} (${CURRENCIES[currency].symbol})`,
    });
  };

  const handleExport = () => {
    const data = {
      accounts,
      transactions,
      budgets,
      recurringTransactions,
      categories: settings.customCategories,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Your financial data has been exported successfully.',
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.accounts || !data.transactions) {
          throw new Error('Invalid data format');
        }

        importData({
          accounts: data.accounts || [],
          transactions: data.transactions || [],
          budgets: data.budgets || [],
          recurringTransactions: data.recurringTransactions || [],
          categories: data.categories || [],
          settings: data.settings || settings,
        });

        toast({
          title: 'Data Imported',
          description: 'Your financial data has been imported successfully.',
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Failed to import data. Please check the file format.',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleClearData = () => {
    clearAllData();
    toast({
      title: 'Data Cleared',
      description: 'All your financial data has been cleared.',
    });
  };

  const handleLoadSample = () => {
    loadSampleData();
    toast({
      title: 'Sample Data Loaded',
      description: 'Sample data has been loaded successfully. Explore the features!',
    });
  };

  const dataStats = {
    accounts: accounts.length,
    transactions: transactions.length,
    budgets: budgets.length,
    recurring: recurringTransactions.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your data and preferences</p>
      </div>

      {/* Security Settings */}
      <SecuritySettings />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
            </CardTitle>
            <CardDescription>Set your default currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={settings.defaultCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CURRENCIES).map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This currency will be used as the default when creating new accounts
            </p>
          </CardContent>
        </Card>

        {/* Data Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Overview
            </CardTitle>
            <CardDescription>Current data statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Accounts</span>
              <span className="font-semibold">{dataStats.accounts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transactions</span>
              <span className="font-semibold">{dataStats.transactions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Budgets</span>
              <span className="font-semibold">{dataStats.budgets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recurring Transactions</span>
              <span className="font-semibold">{dataStats.recurring}</span>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download a backup of your financial data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} className="w-full" disabled={dataStats.accounts === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export to JSON
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Download all your data in JSON format for backup or migration
            </p>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>Restore data from a backup file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                variant="outline"
                className="w-full"
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import from JSON'}
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Import will replace all existing data with the backup file
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Load Sample Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sample Data
            </CardTitle>
            <CardDescription>Load demo data to explore features</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Load Sample Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Load Sample Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace all your current data with sample data. This action cannot be undone unless you have a backup.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLoadSample}>
                    Load Sample Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">
              Populate with realistic sample data to test the application
            </p>
          </CardContent>
        </Card>

        {/* Clear All Data */}
        <Card className="md:col-span-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Permanently delete all your data</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={dataStats.accounts === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your accounts, transactions, budgets, and recurring transactions.
                    Make sure you have exported your data if you want to keep a backup.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">
              This will remove all data from your browser's local storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Categories */}
      <CustomCategoryManager />

      {/* QIF Import */}
      <QIFImport />

      {/* CSV Import */}
      <CSVImport />

      {/* Data Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Data Storage & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • All your financial data is stored locally in your browser's LocalStorage
          </p>
          <p>
            • Your password is hashed using SHA-256 and stored securely
          </p>
          <p>
            • Your data never leaves your device and is completely private
          </p>
          <p>
            • Clearing browser data or cache will delete your financial records and password
          </p>
          <p>
            • Regular exports are recommended to keep backups of your data
          </p>
          <p>
            • Data is not synchronized across different browsers or devices
          </p>
          <p>
            • Password protection is session-based - you'll need to login again after closing the browser
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

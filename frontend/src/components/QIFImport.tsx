import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { parseQIF, convertQIFToTransactions, isValidQIF, QIFParseResult } from '@/lib/qif-parser';
import { toast } from 'sonner';

export const QIFImport = () => {
  const { accounts, addTransactions, addCustomCategories, getAllCategories, settings } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<QIFParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filteredCount = parseResult ? parseResult.transactions.filter(txn => {
    if (!dateFrom && !dateTo) return true;
    const txnDate = new Date(txn.date);
    if (dateFrom && txnDate < new Date(dateFrom + 'T00:00:00')) return false;
    if (dateTo && txnDate > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }).length : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseResult(null);
    }
  };

  const handleParseFile = async () => {
    if (!file) {
      toast.error('Please select a QIF file');
      return;
    }

    setIsProcessing(true);

    try {
      const content = await file.text();

      // Validate QIF format
      if (!isValidQIF(content)) {
        toast.error('Invalid QIF file format');
        setIsProcessing(false);
        return;
      }

      // Parse QIF
      const result = parseQIF(content);
      setParseResult(result);

      if (result.errors.length > 0) {
        toast.warning(`Parsed with ${result.errors.length} warnings`);
      } else {
        toast.success(`Found ${result.transactions.length} transactions`);
      }
    } catch (error) {
      console.error('Error parsing QIF file:', error);
      toast.error('Error parsing QIF file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!parseResult || !selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) {
      toast.error('Account not found');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert QIF transactions to our format
      let transactions = convertQIFToTransactions(parseResult.transactions, account);

      // Apply date filters
      if (dateFrom || dateTo) {
        const fromDate = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
        const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        transactions = transactions.filter(txn => {
          const txnDate = new Date(txn.date);
          if (fromDate && txnDate < fromDate) return false;
          if (toDate && txnDate > toDate) return false;
          return true;
        });
      }

      // Auto-create missing categories
      const existingCategories = getAllCategories();
      const existingCustomNames = new Set(settings.customCategories.map(c => c.name.toLowerCase()));
      const existingDefaultNames = new Set(existingCategories.map(c => c.toLowerCase()));

      const categoriesToCreate = new Map<string, 'income' | 'expense'>();
      transactions.forEach(txn => {
        // Check main category
        const cat = txn.category as string;
        if (cat &&
            !existingDefaultNames.has(cat.toLowerCase()) &&
            !existingCustomNames.has(cat.toLowerCase()) &&
            !categoriesToCreate.has(cat)) {
          categoriesToCreate.set(cat, txn.type === 'income' ? 'income' : 'expense');
        }
        // Check split categories
        if (txn.splits && txn.splits.length > 0) {
          txn.splits.forEach(split => {
            const splitCat = split.category as string;
            if (splitCat &&
                !existingDefaultNames.has(splitCat.toLowerCase()) &&
                !existingCustomNames.has(splitCat.toLowerCase()) &&
                !categoriesToCreate.has(splitCat)) {
              categoriesToCreate.set(splitCat, txn.type === 'income' ? 'income' : 'expense');
            }
          });
        }
      });

      // Create all missing categories in a single batch operation
      if (categoriesToCreate.size > 0) {
        const categoriesToAdd = Array.from(categoriesToCreate.entries()).map(([name, type]) => ({
          name,
          type,
          icon: '🏷️',
        }));
        addCustomCategories(categoriesToAdd);
        toast.info(`Created ${categoriesToCreate.size} new categories`);
      }

      // Add all transactions at once
      addTransactions(transactions);

      toast.success(`Imported ${transactions.length} transactions successfully!`);

      // Reset
      setFile(null);
      setParseResult(null);
      setSelectedAccountId('');
      
      // Reset file input
      const fileInput = document.getElementById('qif-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('Error importing transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import QIF File
        </CardTitle>
        <CardDescription>
          Import transactions from Quicken Interchange Format (QIF) files exported from Quicken, Microsoft Money, or your bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Selection */}
        <div className="space-y-2">
          <Label htmlFor="account-select">Select Account</Label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger id="account-select">
              <SelectValue placeholder="Choose account to import into" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <Label>Date Filter <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="qif-date-from" className="text-xs text-muted-foreground">From Date</Label>
              <input
                id="qif-date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qif-date-to" className="text-xs text-muted-foreground">To Date</Label>
              <input
                id="qif-date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dateFrom && dateTo
                  ? `Importing transactions between ${new Date(dateFrom).toLocaleDateString('en-GB')} and ${new Date(dateTo).toLocaleDateString('en-GB')}`
                  : dateFrom
                  ? `Importing transactions from ${new Date(dateFrom).toLocaleDateString('en-GB')} onwards`
                  : `Importing transactions up to ${new Date(dateTo).toLocaleDateString('en-GB')}`}
              </p>
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="qif-file-input">QIF File</Label>
          <div className="flex gap-2">
            <input
              id="qif-file-input"
              type="file"
              accept=".qif,.QIF"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={handleParseFile}
              disabled={!file || isProcessing}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Parse
            </Button>
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Parse Results */}
        {parseResult && (
          <div className="space-y-3">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Found {parseResult.transactions.length} transactions
                  {(dateFrom || dateTo) && ` (${filteredCount} match date filter)`}
                </strong>
                {parseResult.accountName && (
                  <div className="mt-1">Account: {parseResult.accountName}</div>
                )}
                {parseResult.accountType && (
                  <div>Type: {parseResult.accountType}</div>
                )}
              </AlertDescription>
            </Alert>

            {/* Errors/Warnings */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{parseResult.errors.length} warnings:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {parseResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>• ... and {parseResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Preview */}
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm">Transaction Preview (first 5):</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parseResult.transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="text-sm border-b pb-2 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {transaction.payee || transaction.category || 'No description'}
                      </span>
                      <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {transaction.date.toLocaleDateString()}
                      {transaction.memo && ` • ${transaction.memo}`}
                      {transaction.category && ` • ${transaction.category}`}
                    </div>
                  </div>
                ))}
                {parseResult.transactions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... and {parseResult.transactions.length - 5} more transactions
                  </p>
                )}
              </div>
            </div>

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={!selectedAccountId || isProcessing}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Import {(dateFrom || dateTo) ? filteredCount : parseResult.transactions.length} Transaction{((dateFrom || dateTo) ? filteredCount : parseResult.transactions.length) !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Supported formats:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>QIF files from Quicken, Microsoft Money</li>
              <li>Bank exports in QIF format</li>
              <li>Credit card statements in QIF format</li>
            </ul>
            <p className="mt-2">
              <strong>Note:</strong> Transactions will be added to the selected account. 
              Duplicate checking is not performed, so avoid importing the same file multiple times.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

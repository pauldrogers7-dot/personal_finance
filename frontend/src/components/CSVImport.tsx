// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { parseCSV, type ParsedCSVTransaction } from '@/lib/csv-parser';
import { toast } from 'sonner';

export const CSVImport: React.FC = () => {
  const { accounts, addTransactions } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{
    transactions: ParsedCSVTransaction[];
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filteredCount = parsedData ? parsedData.transactions.filter(txn => {
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
      setParsedData(null);
    }
  };

  const handleParse = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const result = parseCSV(text);
      setParsedData(result);

      if (result.transactions.length === 0) {
        toast.error('No valid transactions found in CSV file');
      } else {
        toast.success(`Found ${result.transactions.length} transactions`);
      }
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parse error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!parsedData || !selectedAccountId) {
      toast.error('Please select an account and parse the CSV file first');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) {
      toast.error('Selected account not found');
      return;
    }

    console.log(`Starting import of ${parsedData.transactions.length} transactions to account:`, account.name);
    
    try {
      // Apply date filter
      const filteredTransactions = parsedData.transactions.filter(txn => {
        if (!dateFrom && !dateTo) return true;
        const txnDate = new Date(txn.date);
        if (dateFrom && txnDate < new Date(dateFrom + 'T00:00:00')) return false;
        if (dateTo && txnDate > new Date(dateTo + 'T23:59:59')) return false;
        return true;
      });

      // Convert CSV transactions to the format expected by addTransactions
      const transactionsToAdd = filteredTransactions.map((csvTx, index) => {
        const newTx = {
          accountId: selectedAccountId,
          type: csvTx.type,
          amount: Math.abs(csvTx.amount),
          category: 'other' as const,
          payee: csvTx.description,
          description: '',
          date: csvTx.date,
        };
        console.log(`Preparing transaction ${index + 1}:`, newTx);
        return newTx;
      });

      // Add all transactions at once
      console.log(`Adding ${transactionsToAdd.length} transactions in batch...`);
      addTransactions(transactionsToAdd);
      console.log(`Import complete: ${transactionsToAdd.length} transactions added successfully`);
      
      toast.success(`Successfully imported ${transactionsToAdd.length} transactions!`);
    } catch (error) {
      console.error('Failed to import transactions:', error);
      toast.error('Failed to import transactions');
    }

    // Reset
    setFile(null);
    setParsedData(null);
    setSelectedAccountId('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import CSV File
        </CardTitle>
        <CardDescription>
          Import transactions from a CSV file exported from your bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Account</label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose account to import into" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Filter <span className="text-muted-foreground font-normal">(Optional)</span></label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To Date</label>
              <input
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
                {parsedData && ` • ${filteredCount} of ${parsedData.transactions.length} transactions match`}
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
          <label className="text-sm font-medium">CSV File</label>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button onClick={handleParse} disabled={!file || isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              Parse
            </Button>
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Expected Format Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Expected CSV format:</strong>
            <br />
            <strong>Option 1:</strong> Headers: Transaction Date, Transaction Description, Debit Amount, Credit Amount
            <br />
            <strong>Option 2:</strong> Headers: Date, Description, Amount (negative = expense, positive = income)
            <br />
            Date format: DD/MM/YYYY (e.g., 18/12/2025) or MM/DD/YYYY or YYYY-MM-DD
            <br />
            Debit = Expense, Credit = Income
          </AlertDescription>
        </Alert>

        {/* Parsed Data Preview */}
        {parsedData && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Found {parsedData.transactions.length} transactions{(dateFrom || dateTo) && ` (${filteredCount} match date filter)`}
              </h3>
              <Button
                onClick={handleImport}
                disabled={!selectedAccountId || parsedData.transactions.length === 0}
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Import {(dateFrom || dateTo) ? filteredCount : parsedData.transactions.length} Transaction{((dateFrom || dateTo) ? filteredCount : parsedData.transactions.length) !== 1 ? 's' : ''}
              </Button>
            </div>

            {/* Errors */}
            {parsedData.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {parsedData.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parsedData.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {parsedData.warnings.slice(0, 5).map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                    {parsedData.warnings.length > 5 && (
                      <li>... and {parsedData.warnings.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Preview */}
            {parsedData.transactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview (first 5 transactions):</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parsedData.transactions.slice(0, 5).map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}£{Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {parsedData.transactions.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ... and {parsedData.transactions.length - 5} more transactions
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, CATEGORY_LABELS, getCategoryIcon } from '@/lib/finance-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, DownloadIcon, FilterIcon, ChevronDown, Check } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from 'date-fns';
import { TransactionCategory, Transaction } from '@/types/finance';

export const Reports = () => {
  const { accounts, transactions, recurringTransactions, getMonthSummary, getDateRangeSummary, getCashFlow, settings, getAllCategories } = useFinance();
  const getCatIcon = (cat: string) => getCategoryIcon(cat, settings.customCategories);
  
  // Month Summary State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Date Range State
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());
  
  // Category Filter State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [excludeRecurring, setExcludeRecurring] = useState<boolean>(false);
  
  // Cash Flow State
  const [cashFlowAccount, setCashFlowAccount] = useState(accounts[0]?.id || '');
  const [cashFlowStart, setCashFlowStart] = useState(startOfMonth(new Date()));
  const [cashFlowEnd, setCashFlowEnd] = useState(endOfMonth(new Date()));

  const monthSummary = getMonthSummary(selectedMonth, selectedYear);
  const dateRangeSummary = getDateRangeSummary(startDate, endDate);
  const cashFlow = cashFlowAccount ? getCashFlow(cashFlowAccount, cashFlowStart, cashFlowEnd) : null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

  // Get all available categories
  const allCategories = getAllCategories();

  // Filter transactions based on date range, category, and account
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Date range filter
      const transactionDate = new Date(transaction.date);
      const inDateRange = isWithinInterval(transactionDate, { start: startDate, end: endDate });
      
      // Category filter - check both main category and splits
      const noFilter = selectedCategories.length === 0;
      let matchesCategory = noFilter || selectedCategories.includes(transaction.category);
      
      // If transaction has splits, check if any split matches the selected category
      if (!matchesCategory && transaction.splits && transaction.splits.length > 0) {
        matchesCategory = noFilter || transaction.splits.some(split => selectedCategories.includes(split.category));
      }
      
      // Account filter
      const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
      
      // Recurring transaction filter
      const isRecurring = recurringTransactions.some(rt => 
        rt.description === transaction.description && 
        rt.amount === transaction.amount && 
        rt.category === transaction.category
      );
      const includeTransaction = excludeRecurring ? !isRecurring : true;
      
      return inDateRange && matchesCategory && matchesAccount && includeTransaction;
    });
  }, [transactions, startDate, endDate, selectedCategories, selectedAccount, excludeRecurring, recurringTransactions]);

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    
    filteredTransactions.forEach(transaction => {
      // For split transactions, only count the splits that match the selected category
      if (transaction.splits && transaction.splits.length > 0) {
        transaction.splits.forEach(split => {
          if (selectedCategories.length === 0 || selectedCategories.includes(split.category)) {
            if (transaction.type === 'income') {
              income += split.amount;
            } else if (transaction.type === 'expense') {
              expenses += split.amount;
            }
          }
        });
      } else {
        // Regular transaction without splits
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
        }
      }
    });
    
    const categoryBreakdown = filteredTransactions.reduce((acc, transaction) => {
      // If transaction has splits, add each split to the breakdown
      if (transaction.splits && transaction.splits.length > 0) {
        transaction.splits.forEach(split => {
          // Only include this split if it matches the selected category filter (or if showing all)
          if (selectedCategories.length === 0 || selectedCategories.includes(split.category)) {
            const existing = acc.find(item => item.category === split.category);
            if (existing) {
              existing.amount += split.amount;
              existing.count += 1;
            } else {
              acc.push({
                category: split.category,
                amount: split.amount,
                count: 1
              });
            }
          }
        });
      } else {
        // Regular transaction without splits
        const existing = acc.find(item => item.category === transaction.category);
        if (existing) {
          existing.amount += transaction.amount;
          existing.count += 1;
        } else {
          acc.push({
            category: transaction.category,
            amount: transaction.amount,
            count: 1
          });
        }
      }
      return acc;
    }, [] as { category: TransactionCategory; amount: number; count: number }[]);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount: filteredTransactions.length,
      categoryBreakdown
    };
  }, [filteredTransactions, selectedCategories]);

  // CSV Export function
  const exportToCSV = () => {
    console.log('Export CSV clicked');
    console.log('Filtered transactions:', filteredTransactions.length);
    
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    
    try {

    // Create CSV header
    const headers = ['Date', 'Account', 'Category', 'Type', 'Description', 'Amount', 'Balance'];
    
    // Create CSV rows - handle split transactions
    const rows: string[][] = [];
    
    filteredTransactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(transaction => {
        const account = accounts.find(a => a.id === transaction.accountId);
        
        // If transaction has splits and we're filtering by a specific category
        if (transaction.splits && transaction.splits.length > 0) {
          // If filtering by specific category, only export matching splits
          if (selectedCategories.length > 0) {
            transaction.splits
              .filter(split => selectedCategories.includes(split.category))
              .forEach(split => {
                rows.push([
                  format(new Date(transaction.date), 'MM/dd/yyyy'),
                  account?.name || 'Unknown',
                  CATEGORY_LABELS[split.category] || split.category,
                  transaction.type,
                  split.description || transaction.description || transaction.payee || '',
                  transaction.type === 'expense' ? `-${split.amount.toFixed(2)}` : split.amount.toFixed(2),
                  '' // Balance will be calculated if needed
                ]);
              });
          } else {
            // If showing all categories, export each split as a separate row
            transaction.splits.forEach(split => {
              rows.push([
                format(new Date(transaction.date), 'MM/dd/yyyy'),
                account?.name || 'Unknown',
                CATEGORY_LABELS[split.category] || split.category,
                transaction.type,
                split.description || transaction.description || transaction.payee || '',
                transaction.type === 'expense' ? `-${split.amount.toFixed(2)}` : split.amount.toFixed(2),
                '' // Balance will be calculated if needed
              ]);
            });
          }
        } else {
          // Regular transaction without splits
          rows.push([
            format(new Date(transaction.date), 'MM/dd/yyyy'),
            account?.name || 'Unknown',
            CATEGORY_LABELS[transaction.category] || transaction.category,
            transaction.type,
            transaction.description || transaction.payee || '',
            transaction.type === 'expense' ? `-${transaction.amount.toFixed(2)}` : transaction.amount.toFixed(2),
            '' // Balance will be calculated if needed
          ]);
        }
      });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const categoryPart = selectedCategories.length > 0 
      ? `_${selectedCategories.map(c => CATEGORY_LABELS[c] || c).join('-')}` 
      : '';
    const filename = excludeRecurring 
      ? `transactions_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}${categoryPart}_excluding_recurring.csv`
      : `transactions_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}${categoryPart}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('CSV export completed successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please check the console for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analyze your financial data</p>
      </div>

      <Tabs defaultValue="month" className="space-y-6">
        <TabsList>
          <TabsTrigger value="month">Monthly Summary</TabsTrigger>
          <TabsTrigger value="range">Date Range</TabsTrigger>
          <TabsTrigger value="category">Category Report</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Monthly Summary */}
        <TabsContent value="month" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Month</CardTitle>
              <CardDescription>View summary for a specific month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label>Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label>Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthSummary.totalIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {monthSummary.month} {monthSummary.year}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthSummary.totalExpenses, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {monthSummary.month} {monthSummary.year}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${monthSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthSummary.netIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {monthSummary.transactionCount} transaction(s)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Spending by category for {monthSummary.month} {monthSummary.year}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthSummary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions for this month.</p>
              ) : (
                <div className="space-y-4">
                  {monthSummary.categoryBreakdown
                    .sort((a, b) => b.amount - a.amount)
                    .map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCatIcon(item.category)}</span>
                          <div>
                            <p className="font-medium">{CATEGORY_LABELS[item.category]}</p>
                            <p className="text-sm text-muted-foreground">{item.count} transaction(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.amount, settings.defaultCurrency)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date Range Summary */}
        <TabsContent value="range" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date Range</CardTitle>
              <CardDescription>View summary for a custom date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label>Start Date</Label>
                  <DatePicker
                    date={startDate}
                    onDateChange={(date) => setStartDate(date || new Date())}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label>End Date</Label>
                  <DatePicker
                    date={endDate}
                    onDateChange={(date) => setEndDate(date || new Date())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dateRangeSummary.totalIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(dateRangeSummary.totalExpenses, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${dateRangeSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dateRangeSummary.netIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dateRangeSummary.transactionCount} transaction(s)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>Balance changes during the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {dateRangeSummary.accountBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts found.</p>
              ) : (
                <div className="space-y-4">
                  {dateRangeSummary.accountBalances.map((account) => (
                    <div key={account.accountId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{account.accountName}</p>
                        <p className="text-sm text-muted-foreground">
                          Start: {formatCurrency(account.startBalance, settings.defaultCurrency)} → End: {formatCurrency(account.endBalance, settings.defaultCurrency)}
                        </p>
                      </div>
                      <div className={`text-right font-semibold ${account.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {account.change >= 0 ? '+' : ''}{formatCurrency(account.change, settings.defaultCurrency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Spending by category for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {dateRangeSummary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions for this period.</p>
              ) : (
                <div className="space-y-4">
                  {dateRangeSummary.categoryBreakdown
                    .sort((a, b) => b.amount - a.amount)
                    .map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCatIcon(item.category)}</span>
                          <div>
                            <p className="font-medium">{CATEGORY_LABELS[item.category]}</p>
                            <p className="text-sm text-muted-foreground">{item.count} transaction(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.amount, settings.defaultCurrency)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Report */}
        <TabsContent value="category" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Transactions</CardTitle>
              <CardDescription>Filter by date range, category, and account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <DatePicker
                      date={startDate}
                      onDateChange={(date) => setStartDate(date || new Date())}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <DatePicker
                      date={endDate}
                      onDateChange={(date) => setEndDate(date || new Date())}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Categories</Label>
                    <div className="relative">
                      <div className="border rounded-md">
                        <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
                          <span className="text-sm">
                            {selectedCategories.length === 0 
                              ? 'All Categories' 
                              : selectedCategories.length === 1
                                ? `${getCatIcon(selectedCategories[0])} ${CATEGORY_LABELS[selectedCategories[0]] || selectedCategories[0]}`
                                : `${selectedCategories.length} categories selected`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </div>
                        {isCategoryOpen && (
                          <div className="border-t max-h-[250px] overflow-y-auto">
                            <div className="p-2 border-b flex gap-2">
                              <Button variant="ghost" size="sm" className="h-7 text-xs flex-1"
                                onClick={() => setSelectedCategories([])}>
                                Clear All
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs flex-1"
                                onClick={() => setSelectedCategories(allCategories)}>
                                Select All
                              </Button>
                            </div>
                            {allCategories
                              .sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b))
                              .map((category) => (
                                <div key={category}
                                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedCategories(prev =>
                                      prev.includes(category)
                                        ? prev.filter(c => c !== category)
                                        : [...prev, category]
                                    );
                                  }}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selectedCategories.includes(category) 
                                      ? 'bg-primary border-primary' 
                                      : 'border-muted-foreground'
                                  }`}>
                                    {selectedCategories.includes(category) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">{getCatIcon(category)} {CATEGORY_LABELS[category] || category}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories.map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs gap-1 cursor-pointer"
                            onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}>
                            {getCatIcon(cat)} {CATEGORY_LABELS[cat] || cat} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Accounts" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="excludeRecurring"
                    checked={excludeRecurring}
                    onChange={(e) => setExcludeRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="excludeRecurring" className="text-sm font-normal cursor-pointer">
                    Exclude recurring transactions
                  </Label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={exportToCSV} className="gap-2">
                    <DownloadIcon className="h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredSummary.totalIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredSummary.transactionCount} transaction(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(filteredSummary.totalExpenses, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredSummary.transactionCount} transaction(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${filteredSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(filteredSummary.netIncome, settings.defaultCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                {selectedCategories.length === 0
                  ? 'All categories'
                  : selectedCategories.length === 1
                    ? CATEGORY_LABELS[selectedCategories[0]] || selectedCategories[0]
                    : `${selectedCategories.length} categories selected`}
                {' • '}
                {selectedAccount === 'all' 
                  ? 'All accounts' 
                  : accounts.find(a => a.id === selectedAccount)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSummary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions match the selected filters.</p>
              ) : (
                <div className="space-y-4">
                  {filteredSummary.categoryBreakdown
                    .sort((a, b) => b.amount - a.amount)
                    .map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCatIcon(item.category)}</span>
                          <div>
                            <p className="font-medium">{CATEGORY_LABELS[item.category] || item.category}</p>
                            <p className="text-sm text-muted-foreground">{item.count} transaction(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.amount, settings.defaultCurrency)}</p>
                          <p className="text-xs text-muted-foreground">
                            {((item.amount / (filteredSummary.totalIncome + filteredSummary.totalExpenses)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>{filteredTransactions.length} transaction(s) found</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions match the selected filters.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .flatMap((transaction) => {
                      const account = accounts.find(a => a.id === transaction.accountId);

                      // If transaction has splits and we're filtering by category,
                      // show only the matching splits as separate rows
                      if (transaction.splits && transaction.splits.length > 0) {
                        // When showing all categories, show all splits but highlight matching ones
                        // When filtering by category, show only matching splits
                        const hasFilter = selectedCategories.length > 0;
                        const splitsToShow = !hasFilter
                          ? transaction.splits
                          : transaction.splits.filter(s => selectedCategories.includes(s.category));

                        return splitsToShow.map((split) => {
                          const isMatch = !hasFilter || selectedCategories.includes(split.category);

                          return (
                            <div
                              key={`${transaction.id}-${split.category}-${split.description || ''}`}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                isMatch && hasFilter
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                  : 'hover:bg-accent/50'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getCatIcon(split.category)}</span>
                                  <div>
                                    <p className="font-medium">
                                      {split.description || transaction.description || transaction.payee || 'No description'}
                                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                        isMatch && hasFilter
                                          ? 'bg-primary/10 text-primary font-semibold'
                                          : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {isMatch && hasFilter ? '✓ matched split' : 'split'}
                                      </span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(transaction.date), 'dd/MM/yyyy')} • {account?.name} • {CATEGORY_LABELS[split.category] || split.category}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(Math.abs(split.amount), settings.defaultCurrency)}
                              </div>
                            </div>
                          );
                        });
                      }

                      // Regular (non-split) transaction
                      return [(
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCatIcon(transaction.category)}</span>
                              <div>
                                <p className="font-medium">{transaction.description || transaction.payee || 'No description'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.date), 'dd/MM/yyyy')} • {account?.name} • {CATEGORY_LABELS[transaction.category] || transaction.category}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount, settings.defaultCurrency)}
                          </div>
                        </div>
                      )];
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Account & Period</CardTitle>
              <CardDescription>View cash flow for a specific account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Account</Label>
                  <Select value={cashFlowAccount} onValueChange={setCashFlowAccount}>
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
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Start Date</Label>
                    <DatePicker
                      date={cashFlowStart}
                      onDateChange={(date) => setCashFlowStart(date || new Date())}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>End Date</Label>
                    <DatePicker
                      date={cashFlowEnd}
                      onDateChange={(date) => setCashFlowEnd(date || new Date())}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {cashFlow && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Starting Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(cashFlow.startBalance, settings.defaultCurrency)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      +{formatCurrency(cashFlow.totalIncome, settings.defaultCurrency)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      -{formatCurrency(cashFlow.totalExpenses, settings.defaultCurrency)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ending Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(cashFlow.endBalance, settings.defaultCurrency)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Net Cash Flow</CardTitle>
                  <CardDescription>{cashFlow.accountName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${cashFlow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cashFlow.netFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow.netFlow, settings.defaultCurrency)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {cashFlowStart.toLocaleDateString()} - {cashFlowEnd.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>{cashFlow.transactions.length} transaction(s) in this period</CardDescription>
                </CardHeader>
                <CardContent>
                  {cashFlow.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions for this period.</p>
                  ) : (
                    <div className="space-y-2">
                      {cashFlow.transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()} • {CATEGORY_LABELS[transaction.category]}
                              </p>
                            </div>
                            <div className={`font-semibold ${
                              transaction.type === 'income' || (transaction.type === 'transfer' && transaction.toAccountId === cashFlowAccount)
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {(transaction.type === 'income' || (transaction.type === 'transfer' && transaction.toAccountId === cashFlowAccount)) ? '+' : '-'}
                              {formatCurrency(transaction.amount, settings.defaultCurrency)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!cashFlow && accounts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Add an account first to view cash flow reports.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

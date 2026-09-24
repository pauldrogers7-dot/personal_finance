import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/finance-utils';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, WalletIcon, Sparkles, Settings2Icon } from 'lucide-react';
import { AccountDetails } from './AccountDetails';
import { CashFlowForecast } from './CashFlowForecast';
import { AccountWarnings } from './AccountWarnings';
import { DashboardCustomizer } from './DashboardCustomizer';
import { ErrorBoundary } from './ErrorBoundary';
import type { DashboardWidget } from '@/types/finance';

export const Dashboard = () => {
  console.log('Dashboard rendering...');
  const { accounts, transactions, budgets, getMonthSummary, loadSampleData, settings, getAccountBalance } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  console.log('Dashboard data loaded:', { 
    accountsCount: accounts?.length || 0, 
    transactionsCount: transactions?.length || 0,
    budgetsCount: budgets?.length || 0,
    settingsDashboard: settings?.dashboard
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

  const totalBalance = accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);
  console.log('Total balance calculated:', totalBalance);
  
  const now = new Date();
  console.log('Getting month summary for:', now.getMonth() + 1, now.getFullYear());
  const currentMonth = getMonthSummary(now.getMonth() + 1, now.getFullYear());
  console.log('Current month summary:', currentMonth);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Show welcome screen if no accounts
  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <WalletIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Welcome to Finance Tracker</CardTitle>
            <CardDescription className="text-lg mt-2">
              Start managing your personal finances with ease
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Add Your Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by adding your bank accounts, credit cards, and investments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Track Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    Record your income, expenses, and transfers between accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Set Budgets & Goals</h3>
                  <p className="text-sm text-muted-foreground">
                    Create budgets and track your spending against your goals
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <Button 
                onClick={loadSampleData} 
                className="w-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Load Sample Data
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Try the app with pre-populated sample data, or start fresh by adding your own accounts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Widget components
  const widgets: Record<DashboardWidget, React.ReactNode> = {
    'summary-cards': (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance, settings.defaultCurrency)}</div>
            <p className="text-xs text-muted-foreground">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonth.totalIncome, settings.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.month} {currentMonth.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Expenses</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentMonth.totalExpenses, settings.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.month} {currentMonth.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonth.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentMonth.netIncome, settings.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>
    ),

    'account-warnings': <AccountWarnings />,

    'cash-flow-forecast': <CashFlowForecast />,

    'accounts-overview': (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Your account balances</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet. Add your first account to get started.</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(getAccountBalance(account.id), account.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    'recent-transactions': (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                return (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {transaction.payee || transaction.description || 'No description'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account?.name} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 
                      transaction.type === 'expense' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                      {formatCurrency(transaction.amount, settings.defaultCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    'budget-overview': (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Current month budget progress</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets set. Create budgets to track your spending.</p>
          ) : (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((budget) => {
                const spent = currentMonth.byCategory[budget.category] || 0;
                const percentage = (spent / budget.amount) * 100;
                const isOverBudget = spent > budget.amount;

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{budget.category}</span>
                      <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                        {formatCurrency(spent, settings.defaultCurrency)} / {formatCurrency(budget.amount, settings.defaultCurrency)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  };

  // Get visible widgets sorted by order
  const visibleWidgets = settings.dashboard.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your finances</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomizer(true)}
        >
          <Settings2Icon className="h-4 w-4 mr-2" />
          Customize Dashboard
        </Button>
      </div>

      {/* Render widgets based on settings */}
      {visibleWidgets.map((widget) => (
        <ErrorBoundary key={widget.id}>
          <div>
            {widgets[widget.id]}
          </div>
        </ErrorBoundary>
      ))}

      {/* Dashboard Customizer Dialog */}
      <DashboardCustomizer
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
      />
    </div>
  );
};

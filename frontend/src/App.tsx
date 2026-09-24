// v1.3.3
import { useState } from 'react';
import { FinanceProvider, useFinance } from '@/contexts/FinanceContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/components/Login';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Dashboard } from '@/components/Dashboard';
import { Accounts } from '@/components/Accounts';
import { Transactions } from '@/components/Transactions';
import { Budgets } from '@/components/Budgets';
import { RecurringTransactions } from '@/components/RecurringTransactions';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';
import { 
  LayoutDashboardIcon, 
  WalletIcon, 
  ArrowRightLeftIcon, 
  TargetIcon, 
  RepeatIcon, 
  BarChart3Icon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  DownloadIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import packageJson from '../package.json';
import { BackupPrompt } from '@/components/BackupPrompt';

type Page = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'recurring' | 'reports' | 'settings';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <Toaster />
      </>
    );
  }

  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}

function MainApp() {
  const { accounts, transactions, budgets, recurringTransactions, settings } = useFinance();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleQuickBackup = () => {
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
    localStorage.setItem('finance-last-backup-date', new Date().toISOString());
  };

  const getLastBackupText = () => {
    const lastBackup = localStorage.getItem('finance-last-backup-date');
    if (!lastBackup) return 'Never backed up';
    const days = Math.floor((new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Backed up today';
    if (days === 1) return 'Backed up yesterday';
    return `Backed up ${days} days ago`;
  };

  const navigation = [
    { id: 'dashboard' as Page, name: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'accounts' as Page, name: 'Accounts', icon: WalletIcon },
    { id: 'transactions' as Page, name: 'Transactions', icon: ArrowRightLeftIcon },
    { id: 'budgets' as Page, name: 'Budgets', icon: TargetIcon },
    { id: 'recurring' as Page, name: 'Recurring', icon: RepeatIcon },
    { id: 'reports' as Page, name: 'Reports', icon: BarChart3Icon },
    { id: 'settings' as Page, name: 'Settings', icon: SettingsIcon },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'recurring':
        return <RecurringTransactions />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Toaster />
      <BackupPrompt />
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl font-bold">💰 Finance Tracker</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b hidden lg:flex items-center justify-between">
              <h1 className="text-2xl font-bold">💰 Finance Tracker</h1>
              <ThemeToggle />
            </div>
            
            <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-0">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>

            <div className="p-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleQuickBackup}
              >
                <DownloadIcon className="h-3 w-3" />
                Quick Backup
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {getLastBackupText()}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Finance Tracker v{packageJson.version}
              </p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen pt-20 lg:pt-0">
          <div className="p-6 lg:p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

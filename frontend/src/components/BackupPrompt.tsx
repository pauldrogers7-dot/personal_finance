import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DownloadIcon, XIcon, ClockIcon, BellOffIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BACKUP_REMINDER_KEY = 'finance-last-backup-date';
const BACKUP_SNOOZE_KEY = 'finance-backup-snoozed-until';
const BACKUP_INTERVAL_DAYS = 7; // Remind every 7 days
const SNOOZE_HOURS = 24; // Snooze for 24 hours

export const BackupPrompt = () => {
  const { accounts, transactions, budgets, recurringTransactions, settings } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkIfBackupNeeded();
  }, []);

  const checkIfBackupNeeded = () => {
    // Don't show if no data
    if (accounts.length === 0) return;

    // Check if snoozed
    const snoozedUntil = localStorage.getItem(BACKUP_SNOOZE_KEY);
    if (snoozedUntil && new Date(snoozedUntil) > new Date()) return;

    // Check last backup date
    const lastBackup = localStorage.getItem(BACKUP_REMINDER_KEY);
    if (lastBackup) {
      const lastBackupDate = new Date(lastBackup);
      setLastBackupDate(lastBackupDate);
      const daysSinceBackup = Math.floor(
        (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceBackup < BACKUP_INTERVAL_DAYS) return;
    }

    // Show prompt after 2 second delay
    setTimeout(() => setIsOpen(true), 2000);
  };

  const handleBackup = () => {
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

    // Save backup date
    localStorage.setItem(BACKUP_REMINDER_KEY, new Date().toISOString());
    localStorage.removeItem(BACKUP_SNOOZE_KEY);
    setIsOpen(false);

    toast({
      title: '✅ Backup Complete',
      description: `Your data has been backed up successfully.`,
    });
  };

  const handleSnooze = () => {
    // Snooze for 24 hours
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + SNOOZE_HOURS);
    localStorage.setItem(BACKUP_SNOOZE_KEY, snoozeUntil.toISOString());
    setIsOpen(false);

    toast({
      title: '⏰ Reminder Snoozed',
      description: `We'll remind you again in ${SNOOZE_HOURS} hours.`,
    });
  };

  const handleDismiss = () => {
    // Dismiss until next interval
    localStorage.setItem(BACKUP_REMINDER_KEY, new Date().toISOString());
    setIsOpen(false);
  };

  const getDaysSinceBackup = () => {
    if (!lastBackupDate) return null;
    return Math.floor(
      (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const daysSince = getDaysSinceBackup();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DownloadIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Time to Back Up Your Data</DialogTitle>
              <DialogDescription className="text-sm">
                {daysSince !== null
                  ? `Your last backup was ${daysSince} days ago`
                  : 'No backup has been made yet'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info box */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Regular backups protect your financial data from being lost if your browser cache is cleared.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium pt-1">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{accounts.length}</span>
                <span className="text-muted-foreground">Accounts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{transactions.length}</span>
                <span className="text-muted-foreground">Transactions</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{recurringTransactions.length}</span>
                <span className="text-muted-foreground">Recurring</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{budgets.length}</span>
                <span className="text-muted-foreground">Budgets</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleBackup} className="w-full gap-2">
              <DownloadIcon className="h-4 w-4" />
              Back Up Now
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSnooze}
                className="flex-1 gap-2"
              >
                <ClockIcon className="h-4 w-4" />
                Remind in 24h
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="flex-1 gap-2 text-muted-foreground"
              >
                <BellOffIcon className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You'll be reminded every {BACKUP_INTERVAL_DAYS} days • Backup includes all your data
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

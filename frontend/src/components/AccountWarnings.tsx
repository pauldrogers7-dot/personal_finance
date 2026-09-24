import { useFinance } from '@/contexts/FinanceContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/finance-utils';
import { Account } from '@/types/finance';

interface AccountWarning {
  account: Account;
  type: 'low' | 'high';
  threshold: number;
}

export const AccountWarnings = () => {
  const { accounts } = useFinance();

  // Check for accounts that exceed warning thresholds
  const warnings: AccountWarning[] = [];

  accounts.forEach(account => {
    // Check low balance warning
    if (account.warningThresholdLow !== undefined && account.warningThresholdLow !== null) {
      const threshold = typeof account.warningThresholdLow === 'string' 
        ? parseFloat(account.warningThresholdLow) 
        : account.warningThresholdLow;
      
      if (!isNaN(threshold) && account.balance < threshold) {
        warnings.push({
          account,
          type: 'low',
          threshold,
        });
      }
    }

    // Check high balance warning
    if (account.warningThresholdHigh !== undefined && account.warningThresholdHigh !== null) {
      const threshold = typeof account.warningThresholdHigh === 'string' 
        ? parseFloat(account.warningThresholdHigh) 
        : account.warningThresholdHigh;
      
      if (!isNaN(threshold) && account.balance > threshold) {
        warnings.push({
          account,
          type: 'high',
          threshold,
        });
      }
    }
  });

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {warnings.map((warning, index) => (
        <Alert
          key={`${warning.account.id}-${warning.type}-${index}`}
          variant={warning.type === 'low' ? 'destructive' : 'default'}
          className={warning.type === 'high' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}
        >
          {warning.type === 'low' ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          )}
          <AlertTitle className="flex items-center gap-2">
            {warning.type === 'low' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                Low Balance Alert: {warning.account.name}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                High Balance Alert: {warning.account.name}
              </>
            )}
          </AlertTitle>
          <AlertDescription>
            {warning.type === 'low' ? (
              <>
                Your account balance of{' '}
                <span className="font-semibold">
                  {formatCurrency(warning.account.balance, warning.account.currency)}
                </span>{' '}
                has fallen below the warning threshold of{' '}
                <span className="font-semibold">
                  {formatCurrency(warning.threshold, warning.account.currency)}
                </span>
                . Consider transferring funds or monitoring your spending.
              </>
            ) : (
              <>
                Your account balance of{' '}
                <span className="font-semibold">
                  {formatCurrency(warning.account.balance, warning.account.currency)}
                </span>{' '}
                has exceeded the warning threshold of{' '}
                <span className="font-semibold">
                  {formatCurrency(warning.threshold, warning.account.currency)}
                </span>
                . Consider investing excess funds or transferring to savings.
              </>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

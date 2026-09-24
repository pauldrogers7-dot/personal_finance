// @ts-nocheck
import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/finance-utils';
import { RecurringTransaction, RecurringFrequency } from '@/types/finance';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

export const CashFlowForecast = () => {
  const { accounts, recurringTransactions, settings } = useFinance();
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cashflow-selected-accounts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Deduplicate and filter out invalid IDs
      const deduped = [...new Set<string>(parsed)];
      // Save clean version back to localStorage
      localStorage.setItem('cashflow-selected-accounts', JSON.stringify(deduped));
      return deduped;
    } catch {
      return [];
    }
  });
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(3);

  // Derived at component level so JSX can access it
  const selectedAccount = selectedAccountIds.length === 1
    ? accounts.find(acc => acc.id === selectedAccountIds[0]) ?? null
    : null;

  const getNextOccurrence = (date: Date, frequency: RecurringFrequency): Date => {
    const next = new Date(date);
    switch (frequency) {
      case 'daily': next.setDate(next.getDate() + 1); break;
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'biweekly': next.setDate(next.getDate() + 14); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'quarterly': next.setMonth(next.getMonth() + 3); break;
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  };

  const generateOccurrences = (recurring: RecurringTransaction, endDate: Date) => {
    const occurrences: { date: Date; amount: number; type: string }[] = [];
    let currentDate = new Date(recurring.nextDate);
    
    while (currentDate <= endDate) {
      if (recurring.endDate && currentDate > new Date(recurring.endDate)) break;
      
      const amount = recurring.type === 'income' ? recurring.amount : -recurring.amount;
      occurrences.push({ date: new Date(currentDate), amount, type: recurring.type });
      currentDate = getNextOccurrence(currentDate, recurring.frequency);
    }
    
    return occurrences;
  };

  const forecastData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + forecastMonths);

    const selectedAccounts = selectedAccountIds.length > 0
      ? accounts.filter(acc => selectedAccountIds.includes(acc.id))
      : accounts;

    const startingBalance = selectedAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const activeRecurring = recurringTransactions.filter(
      rec => rec.isActive && selectedAccounts.some(
        acc => acc.id === rec.accountId || acc.id === rec.toAccountId
      )
    );

    const allOccurrences: { date: Date; amount: number; type: string; description: string }[] = [];
    activeRecurring.forEach(recurring => {
      const description = recurring.payee || recurring.description || 'Recurring transaction';

      if (recurring.type === 'transfer') {
        // For each selected account, generate the correct side of the transfer
        selectedAccounts.forEach(acc => {
          // Source account - deduct amount
          if (acc.id === recurring.accountId) {
            const occurrences = generateOccurrences(recurring, endDate);
            occurrences.forEach(occ => {
              allOccurrences.push({
                date: occ.date,
                amount: -recurring.amount, // deduct from source
                type: 'transfer_out',
                description: `${description} (Transfer out)`
              });
            });
          }
          // Destination account - add amount
          if (acc.id === recurring.toAccountId) {
            const occurrences = generateOccurrences(recurring, endDate);
            occurrences.forEach(occ => {
              allOccurrences.push({
                date: occ.date,
                amount: recurring.amount, // add to destination
                type: 'transfer_in',
                description: `${description} (Transfer in)`
              });
            });
          }
        });
      } else {
        const occurrences = generateOccurrences(recurring, endDate);
        occurrences.forEach(occ => {
          allOccurrences.push({
            ...occ,
            description
          });
        });
      }
    });

    allOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

    const dataPoints: {
      date: Date;
      dateLabel: string;
      balance: number;
      income: number;
      expenses: number;
      net: number;
      description: string;
    }[] = [];

    dataPoints.push({
      date: today,
      dateLabel: 'Now',
      balance: startingBalance,
      income: 0,
      expenses: 0,
      net: 0,
      description: 'Current Balance'
    });

    let runningBalance = startingBalance;
    allOccurrences.forEach(occ => {
      runningBalance += occ.amount;
      const month = occ.date.toLocaleDateString('en-US', { month: 'short' });
      const day = occ.date.getDate();
      const year = occ.date.getFullYear();
      
      dataPoints.push({
        date: occ.date,
        dateLabel: `${month} ${day}, ${year}`,
        balance: runningBalance,
        income: occ.amount > 0 ? occ.amount : 0,
        expenses: occ.amount < 0 ? Math.abs(occ.amount) : 0,
        net: occ.amount,
        description: occ.description
      });
    });

    const totalIncome = allOccurrences
      .filter(o => o.amount > 0 && o.type !== 'transfer_in' && o.type !== 'transfer_out')
      .reduce((sum, o) => sum + o.amount, 0);
    const totalExpenses = Math.abs(allOccurrences
      .filter(o => o.amount < 0 && o.type !== 'transfer_in' && o.type !== 'transfer_out')
      .reduce((sum, o) => sum + o.amount, 0));

    return { dataPoints, startingBalance, totalIncome, totalExpenses };
  }, [accounts, recurringTransactions, selectedAccountIds, forecastMonths]);

  // Save selection to localStorage whenever it changes
  const handleSetSelectedAccountIds = (ids: string[]) => {
    setSelectedAccountIds(ids);
    localStorage.setItem('cashflow-selected-accounts', JSON.stringify(ids));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Forecast</CardTitle>
        <CardDescription>
          Projected balance based on recurring transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Forecast Period</Label>
            <Select value={forecastMonths.toString()} onValueChange={(v) => setForecastMonths(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Accounts</Label>
            <div className="relative mt-2">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white dark:bg-gray-950 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 text-foreground"
              >
                <span className="text-muted-foreground">
                  {selectedAccountIds.length === 0
                    ? 'All Accounts'
                    : selectedAccountIds.length === accounts.length
                    ? 'All Accounts'
                    : selectedAccountIds.length === 1
                    ? accounts.find(a => a.id === selectedAccountIds[0])?.name
                    : `${selectedAccountIds.length} accounts selected`}
                </span>
                <span className="ml-2">▼</span>
              </button>
              {isAccountDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.length === 0 || selectedAccountIds.length === accounts.length}
                      onChange={() => handleSetSelectedAccountIds([])}
                    />
                    <span className="text-sm font-medium">All Accounts</span>
                  </label>
                  {accounts.map(account => (
                    <label key={account.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={() => {
                          handleSetSelectedAccountIds(
                            selectedAccountIds.includes(account.id)
                              ? selectedAccountIds.filter(id => id !== account.id)
                              : [...selectedAccountIds, account.id]
                          );
                        }}
                      />
                      <span className="text-sm">{account.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground capitalize">{account.type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedAccountIds.length > 0 && selectedAccountIds.length < accounts.length && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedAccountIds.map(id => {
                  const account = accounts.find(a => a.id === id);
                  return account ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                      {account.name}
                      <button onClick={() => handleSetSelectedAccountIds(selectedAccountIds.filter(i => i !== id))}>✕</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {forecastData.dataPoints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active recurring transactions to forecast.</p>
            <p className="text-sm mt-2">Add recurring transactions to see your cash flow projection.</p>
          </div>
        ) : forecastData.dataPoints.length === 1 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recurring transactions scheduled in the forecast period.</p>
            <p className="text-sm mt-2">Try extending the forecast period or add more recurring transactions.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-2xl font-bold mt-1">
                  {formatCurrency(forecastData.startingBalance, settings.defaultCurrency)}
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUpIcon className="h-4 w-4 text-green-600" />
                  Expected Income
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  +{formatCurrency(forecastData.totalIncome, settings.defaultCurrency)}
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDownIcon className="h-4 w-4 text-red-600" />
                  Expected Expenses
                </div>
                <div className="text-2xl font-bold mt-1 text-red-600">
                  -{formatCurrency(forecastData.totalExpenses, settings.defaultCurrency)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Balance Projection ({forecastData.dataPoints.length} transactions)
                </span>
                <span className="text-muted-foreground">
                  End: {formatCurrency(forecastData.dataPoints[forecastData.dataPoints.length - 1].balance, settings.defaultCurrency)}
                </span>
              </div>

              {/* Chart */}
              <div className="relative h-64 bg-muted/30 rounded-lg p-4">
                {/* Y-axis labels */}
                {(() => {
                  const maxBalance = Math.max(...forecastData.dataPoints.map(d => d.balance));
                  // Calculate a nice step size that gives ~6-8 ticks
                  const rawStep = maxBalance / 7;
                  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
                  const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                  const niceMax = Math.ceil(maxBalance / niceStep) * niceStep;
                  const ticks = [];
                  for (let v = 0; v <= niceMax; v += niceStep) ticks.push(v);
                  return (
                    <div className="absolute left-0 top-4 bottom-4 w-20 flex flex-col-reverse justify-between text-xs text-muted-foreground pr-2">
                      {ticks.map((tick, i) => (
                        <div key={i} className="text-right leading-none">{formatCurrency(tick, settings.defaultCurrency)}</div>
                      ))}
                    </div>
                  );
                })()}

                {/* Chart area */}
                <div className="ml-20 h-full relative">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines - one per tick */}
                    {(() => {
                      const maxBalance = Math.max(...forecastData.dataPoints.map(d => d.balance));
                      const rawStep = maxBalance / 7;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
                      const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                      const niceMax = Math.ceil(maxBalance / niceStep) * niceStep;
                      const ticks = [];
                      for (let v = 0; v <= niceMax; v += niceStep) ticks.push(v);
                      return ticks.map((tick, i) => {
                        const y = 100 - (tick / niceMax) * 100;
                        return (
                          <line key={i} x1="0" y1={y} x2="100" y2={y}
                            stroke="currentColor" strokeWidth="0.2"
                            className={tick === 0 ? "text-muted-foreground/40" : "text-muted-foreground/20"}
                          />
                        );
                      });
                    })()}

                    {/* Threshold lines (only for single account) */}
                    {selectedAccount && (() => {
                      const minThreshold = Number(selectedAccount.warningThresholdLow || selectedAccount.lowBalanceWarning || selectedAccount.minBalance || 0) || undefined;
                      const maxThreshold = Number(selectedAccount.warningThresholdHigh || selectedAccount.highBalanceWarning || selectedAccount.maxBalance || 0) || undefined;
                      if (!minThreshold && !maxThreshold) return null;
                      const chartMax = Math.max(
                        ...forecastData.dataPoints.map(d => d.balance),
                        maxThreshold ?? 0,
                        minThreshold ?? 0
                      );
                      const balanceRange = chartMax - 0;
                      return (
                        <>
                          {minThreshold && (
                            <line
                              x1="0"
                              y1={`${100 - ((minThreshold / balanceRange) * 100)}%`}
                              x2="100%"
                              y2={`${100 - ((minThreshold / balanceRange) * 100)}%`}
                              stroke="rgb(239, 68, 68)"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                          )}
                          {maxThreshold && (
                            <line
                              x1="0"
                              y1={`${100 - ((maxThreshold / balanceRange) * 100)}%`}
                              x2="100%"
                              y2={`${100 - ((maxThreshold / balanceRange) * 100)}%`}
                              stroke="rgb(234, 179, 8)"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                          )}
                        </>
                      );
                    })()}

                    {/* Line graph */}
                    {(() => {
                      const minBalance = 0;
                      const maxBalance = Math.max(...forecastData.dataPoints.map(d => d.balance));
                      const rawStep = maxBalance / 7;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
                      const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                      const niceMax = Math.ceil(maxBalance / niceStep) * niceStep || 1;
                      const balanceRange = niceMax - minBalance;
                      const totalPoints = forecastData.dataPoints.length;

                      if (totalPoints < 2) return null;

                      const points = forecastData.dataPoints.map((data, index) => {
                        const x = (index / (totalPoints - 1)) * 100;
                        const y = 100 - ((data.balance - minBalance) / balanceRange) * 100;
                        return `${x},${y}`;
                      }).join(' ');

                      const areaPath = `M 0,100 L ${points} L 100,100 Z`;

                      return (
                        <>
                          <path d={areaPath} fill="rgb(34, 197, 94)" fillOpacity="0.1" />
                          <polyline
                            points={points}
                            fill="none"
                            stroke="rgb(34, 197, 94)"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      );
                    })()}
                  </svg>

                  {/* Threshold labels - check ALL possible field name variants */}
                  {selectedAccount && (() => {
                    const minVal = Number(selectedAccount.warningThresholdLow || selectedAccount.lowBalanceWarning || selectedAccount.minBalance || 0);
                    const maxVal = Number(selectedAccount.warningThresholdHigh || selectedAccount.highBalanceWarning || selectedAccount.maxBalance || 0);
                    const chartMax = Math.max(...forecastData.dataPoints.map(d => d.balance));
                    return <>
                      {minVal > 0 && (
                        <div className="absolute right-2 text-xs text-red-600" style={{
                          top: `${Math.max(0, 100 - (minVal / chartMax) * 100)}%`
                        }}>
                          Low: {formatCurrency(minVal, settings.defaultCurrency)}
                        </div>
                      )}
                      {maxVal > 0 && (
                        <div className="absolute right-2 text-xs text-yellow-600" style={{
                          top: `${Math.max(0, 100 - (maxVal / chartMax) * 100)}%`
                        }}>
                          High: {formatCurrency(maxVal, settings.defaultCurrency)}
                        </div>
                      )}
                    </>;
                  })()}
                </div>

                {/* X-axis labels */}
                <div className="ml-16 flex justify-between mt-2 text-xs text-muted-foreground">
                  {forecastData.dataPoints
                    .filter((_, index, arr) => {
                      const totalPoints = arr.length;
                      if (totalPoints <= 8) return true;
                      if (index === 0 || index === totalPoints - 1) return true;
                      const step = Math.floor(totalPoints / 6);
                      return index % step === 0;
                    })
                    .map((data, index) => (
                      <div key={index} className="text-center">
                        {data.dateLabel}
                      </div>
                    ))}
                </div>
              </div>

              {/* Legend */}
              {selectedAccount && (selectedAccount.lowBalanceWarning || selectedAccount.highBalanceWarning) && (
                <div className="flex gap-4 text-xs text-muted-foreground justify-center">
                  {selectedAccount.lowBalanceWarning && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-0.5 bg-red-600 border-dashed border-t-2 border-red-600"></div>
                      <span>Low Threshold</span>
                    </div>
                  )}
                  {selectedAccount.highBalanceWarning && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-0.5 bg-yellow-600 border-dashed border-t-2 border-yellow-600"></div>
                      <span>High Threshold</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-3 font-medium text-sm">
                Upcoming Transactions ({forecastData.dataPoints.length - 1} total)
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                      <th className="text-right p-3 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.dataPoints.slice(1).map((data, index) => (
                      <tr key={index} className="border-t hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{data.dateLabel}</td>
                        <td className="p-3">{data.description}</td>
                        <td className={`p-3 text-right font-medium ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.net >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.net), settings.defaultCurrency)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(data.balance, settings.defaultCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

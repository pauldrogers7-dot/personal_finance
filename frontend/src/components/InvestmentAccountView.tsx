// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, PoundSterling, RefreshCw, Pencil, Trash2, BarChart3, ArrowUpDown } from 'lucide-react';
import { formatDateUK } from '@/lib/utils';
import { InvestmentTransactionType, HoldingType } from '@/types/finance';

interface InvestmentAccountViewProps {
  accountId: string;
  onBack: () => void;
}

const HOLDING_TYPE_LABELS: Record<HoldingType, string> = {
  shares: 'Shares',
  unit_trust: 'Unit Trust',
  etf: 'ETF',
  bond: 'Bond',
  other: 'Other',
};

const TRANSACTION_TYPE_LABELS: Record<InvestmentTransactionType, string> = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  dividend_reinvest: 'Dividend Reinvest',
  split: 'Stock Split',
  price_update: 'Price Update',
};

const TRANSACTION_TYPE_COLORS: Record<InvestmentTransactionType, string> = {
  buy: 'bg-blue-100 text-blue-800',
  sell: 'bg-orange-100 text-orange-800',
  dividend: 'bg-green-100 text-green-800',
  dividend_reinvest: 'bg-emerald-100 text-emerald-800',
  split: 'bg-purple-100 text-purple-800',
  price_update: 'bg-gray-100 text-gray-800',
};

const defaultHoldingForm = {
  symbol: '',
  name: '',
  holdingType: 'shares' as HoldingType,
  quantity: '',
  averageCostPerUnit: '',
  currentPricePerUnit: '',
  notes: '',
};

const defaultTransactionForm = {
  holdingId: '',
  type: 'buy' as InvestmentTransactionType,
  quantity: '',
  pricePerUnit: '',
  fees: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

const defaultPriceForm = {
  holdingId: '',
  newPrice: '',
};

export const InvestmentAccountView: React.FC<InvestmentAccountViewProps> = ({ accountId, onBack }) => {
  const {
    accounts,
    investmentHoldings,
    investmentTransactions,
    addInvestmentHolding,
    addInvestmentTransaction,
    updateHoldingPrice,
    getInvestmentSummary,
    updateInvestmentHolding,
    deleteInvestmentHolding,
    deleteInvestmentTransaction,
  } = useFinance();

  const account = accounts.find(a => a.id === accountId);

  // Dialog states
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [isEditHoldingOpen, setIsEditHoldingOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [isDeleteHoldingOpen, setIsDeleteHoldingOpen] = useState(false);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [deletingHoldingId, setDeletingHoldingId] = useState<string | null>(null);

  // Form states
  const [holdingForm, setHoldingForm] = useState(defaultHoldingForm);
  const [transactionForm, setTransactionForm] = useState(defaultTransactionForm);
  const [priceForm, setPriceForm] = useState(defaultPriceForm);

  // Filter state
  const [selectedHoldingFilter, setSelectedHoldingFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  if (!account || account.type !== 'investment') {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
        <Card>
          <CardContent className="p-6">
            <p>Investment account not found or invalid account type.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = getInvestmentSummary(account.id);
  const accountHoldings = investmentHoldings.filter(h => h.accountId === account.id);
  const accountTransactions = investmentTransactions
    .filter(t => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Portfolio totals
  const totalMarketValue = summary.reduce((sum, s) => sum + s.marketValue, 0);
  const totalCostBasis = summary.reduce((sum, s) => sum + s.costBasis, 0);
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercentage = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Total dividends received
  const totalDividends = accountTransactions
    .filter(t => t.type === 'dividend' || t.type === 'dividend_reinvest')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Filtered transactions
  const filteredTransactions = accountTransactions.filter(t => {
    if (selectedHoldingFilter !== 'all' && t.holdingId !== selectedHoldingFilter) return false;
    if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) return false;
    return true;
  });

  // Per-holding dividend totals
  const dividendsByHolding = useMemo(() => {
    const map: Record<string, number> = {};
    accountTransactions
      .filter(t => t.type === 'dividend' || t.type === 'dividend_reinvest')
      .forEach(t => {
        map[t.holdingId] = (map[t.holdingId] || 0) + t.totalAmount;
      });
    return map;
  }, [accountTransactions]);

  // Handlers - Holdings
  const handleAddHolding = () => {
    if (!holdingForm.symbol || !holdingForm.name) return;
    addInvestmentHolding({
      accountId: account.id,
      symbol: holdingForm.symbol.toUpperCase(),
      name: holdingForm.name,
      holdingType: holdingForm.holdingType,
      quantity: parseFloat(holdingForm.quantity) || 0,
      averageCostPerUnit: parseFloat(holdingForm.averageCostPerUnit) || 0,
      currentPricePerUnit: parseFloat(holdingForm.currentPricePerUnit) || 0,
      notes: holdingForm.notes,
      lastPriceUpdate: new Date(),
    });
    setHoldingForm(defaultHoldingForm);
    setIsAddHoldingOpen(false);
  };

  const handleEditHolding = (holdingId: string) => {
    const holding = accountHoldings.find(h => h.id === holdingId);
    if (!holding) return;
    setHoldingForm({
      symbol: holding.symbol,
      name: holding.name,
      holdingType: holding.holdingType || 'shares',
      quantity: holding.quantity.toString(),
      averageCostPerUnit: holding.averageCostPerUnit.toString(),
      currentPricePerUnit: holding.currentPricePerUnit.toString(),
      notes: holding.notes || '',
    });
    setEditingHoldingId(holdingId);
    setIsEditHoldingOpen(true);
  };

  const handleUpdateHolding = () => {
    if (!editingHoldingId || !holdingForm.symbol || !holdingForm.name) return;
    updateInvestmentHolding(editingHoldingId, {
      symbol: holdingForm.symbol.toUpperCase(),
      name: holdingForm.name,
      holdingType: holdingForm.holdingType,
      quantity: parseFloat(holdingForm.quantity) || 0,
      averageCostPerUnit: parseFloat(holdingForm.averageCostPerUnit) || 0,
      currentPricePerUnit: parseFloat(holdingForm.currentPricePerUnit) || 0,
      notes: holdingForm.notes,
    });
    setHoldingForm(defaultHoldingForm);
    setEditingHoldingId(null);
    setIsEditHoldingOpen(false);
  };

  const handleDeleteHolding = () => {
    if (!deletingHoldingId) return;
    deleteInvestmentHolding(deletingHoldingId);
    setDeletingHoldingId(null);
    setIsDeleteHoldingOpen(false);
  };

  // Handlers - Transactions
  const handleAddTransaction = () => {
    if (!transactionForm.holdingId) return;
    const holding = accountHoldings.find(h => h.id === transactionForm.holdingId);
    if (!holding) return;
    const quantity = parseFloat(transactionForm.quantity) || 0;
    const pricePerUnit = parseFloat(transactionForm.pricePerUnit) || 0;
    const totalAmount = quantity * pricePerUnit;
    addInvestmentTransaction({
      accountId: account.id,
      holdingId: transactionForm.holdingId,
      symbol: holding.symbol,
      type: transactionForm.type,
      quantity,
      pricePerUnit,
      totalAmount,
      fees: parseFloat(transactionForm.fees) || 0,
      date: new Date(transactionForm.date),
      notes: transactionForm.notes,
    });
    setTransactionForm(defaultTransactionForm);
    setIsAddTransactionOpen(false);
  };

  const handleUpdatePrice = () => {
    if (!priceForm.holdingId || !priceForm.newPrice) return;
    updateHoldingPrice(priceForm.holdingId, parseFloat(priceForm.newPrice));
    setPriceForm(defaultPriceForm);
    setIsUpdatePriceOpen(false);
  };

  // Computed total amount for transaction form
  const transactionTotal = (parseFloat(transactionForm.quantity) || 0) * (parseFloat(transactionForm.pricePerUnit) || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-muted-foreground text-sm">Investment Portfolio</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsUpdatePriceOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Price
          </Button>
          <Button variant="outline" onClick={() => { setTransactionForm(defaultTransactionForm); setIsAddTransactionOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button onClick={() => { setHoldingForm(defaultHoldingForm); setIsAddHoldingOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holding
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Value</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalMarketValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current portfolio value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalCostBasis.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total amount invested</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {totalGain >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGain >= 0 ? '+' : ''}£{totalGain.toFixed(2)}
            </div>
            <p className={`text-xs ${totalGainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainPercentage >= 0 ? '+' : ''}{totalGainPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dividends</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{totalDividends.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Income received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountHoldings.length}</div>
            <p className="text-xs text-muted-foreground">{accountTransactions.length} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="holdings">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
              <CardDescription>Your investment holdings and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No holdings yet. Click "Add Holding" to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Cost Basis</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                        <TableHead className="text-right">Gain %</TableHead>
                        <TableHead className="text-right">Dividends</TableHead>
                        <TableHead className="text-right">Last Updated</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.map((s) => {
                        const holding = accountHoldings.find(h => h.id === s.holdingId);
                        return (
                          <TableRow key={s.holdingId}>
                            <TableCell className="font-bold">{s.symbol}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {HOLDING_TYPE_LABELS[holding?.holdingType || 'other']}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{s.quantity.toFixed(4)}</TableCell>
                            <TableCell className="text-right">£{s.averageCostPerUnit.toFixed(4)}</TableCell>
                            <TableCell className="text-right">£{s.currentPricePerUnit.toFixed(4)}</TableCell>
                            <TableCell className="text-right">£{s.costBasis.toFixed(2)}</TableCell>
                            <TableCell className="text-right">£{s.marketValue.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-medium ${s.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {s.gain >= 0 ? '+' : ''}£{s.gain.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${s.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {s.gainPercentage >= 0 ? '+' : ''}{s.gainPercentage.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              £{(dividendsByHolding[s.holdingId] || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {holding?.lastPriceUpdate ? formatDateUK(new Date(holding.lastPriceUpdate)) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditHolding(s.holdingId)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setDeletingHoldingId(s.holdingId); setIsDeleteHoldingOpen(true); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All investment transactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedHoldingFilter} onValueChange={setSelectedHoldingFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Holdings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Holdings</SelectItem>
                      {accountHoldings.map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="dividend">Dividend</SelectItem>
                      <SelectItem value="dividend_reinvest">Dividend Reinvest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price/Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Fees</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>{formatDateUK(new Date(txn.date))}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_TYPE_COLORS[txn.type]}`}>
                              {TRANSACTION_TYPE_LABELS[txn.type]}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{txn.symbol}</TableCell>
                          <TableCell className="text-right">{txn.quantity.toFixed(4)}</TableCell>
                          <TableCell className="text-right">£{txn.pricePerUnit.toFixed(4)}</TableCell>
                          <TableCell className={`text-right font-medium ${txn.type === 'dividend' || txn.type === 'dividend_reinvest' ? 'text-green-600' : txn.type === 'sell' ? 'text-orange-600' : ''}`}>
                            £{txn.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{txn.fees ? `£${txn.fees.toFixed(2)}` : '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{txn.notes || '-'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteInvestmentTransaction && deleteInvestmentTransaction(txn.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dividends Tab */}
        <TabsContent value="dividends">
          <div className="space-y-4">
            {/* Dividend summary per holding */}
            <Card>
              <CardHeader>
                <CardTitle>Dividend Income by Holding</CardTitle>
                <CardDescription>Total dividends and reinvestments received per holding</CardDescription>
              </CardHeader>
              <CardContent>
                {accountHoldings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No holdings yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Cash Dividends</TableHead>
                        <TableHead className="text-right">Reinvested</TableHead>
                        <TableHead className="text-right">Total Income</TableHead>
                        <TableHead className="text-right">Yield on Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountHoldings.map((holding) => {
                        const holdingTxns = accountTransactions.filter(t => t.holdingId === holding.id);
                        const cashDividends = holdingTxns.filter(t => t.type === 'dividend').reduce((sum, t) => sum + t.totalAmount, 0);
                        const reinvested = holdingTxns.filter(t => t.type === 'dividend_reinvest').reduce((sum, t) => sum + t.totalAmount, 0);
                        const totalIncome = cashDividends + reinvested;
                        const holdingSummary = summary.find(s => s.holdingId === holding.id);
                        const yieldOnCost = holdingSummary && holdingSummary.costBasis > 0 ? (totalIncome / holdingSummary.costBasis) * 100 : 0;
                        return (
                          <TableRow key={holding.id}>
                            <TableCell className="font-bold">{holding.symbol}</TableCell>
                            <TableCell>{holding.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {HOLDING_TYPE_LABELS[holding.holdingType || 'other']}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-green-600">£{cashDividends.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-emerald-600">£{reinvested.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">£{totalIncome.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{yieldOnCost.toFixed(2)}%</TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals row */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right text-green-600">
                          £{accountTransactions.filter(t => t.type === 'dividend').reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600">
                          £{accountTransactions.filter(t => t.type === 'dividend_reinvest').reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">£{totalDividends.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {totalCostBasis > 0 ? (totalDividends / totalCostBasis * 100).toFixed(2) : '0.00'}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Dividend transaction history */}
            <Card>
              <CardHeader>
                <CardTitle>Dividend Transaction History</CardTitle>
                <CardDescription>All dividend payments and reinvestments</CardDescription>
              </CardHeader>
              <CardContent>
                {accountTransactions.filter(t => t.type === 'dividend' || t.type === 'dividend_reinvest').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No dividend transactions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Rate/Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountTransactions
                        .filter(t => t.type === 'dividend' || t.type === 'dividend_reinvest')
                        .map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell>{formatDateUK(new Date(txn.date))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_TYPE_COLORS[txn.type]}`}>
                                {TRANSACTION_TYPE_LABELS[txn.type]}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{txn.symbol}</TableCell>
                            <TableCell className="text-right">{txn.quantity.toFixed(4)}</TableCell>
                            <TableCell className="text-right">£{txn.pricePerUnit.toFixed(4)}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">£{txn.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{txn.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Holding Dialog */}
      <Dialog open={isAddHoldingOpen} onOpenChange={setIsAddHoldingOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Holding</DialogTitle>
            <DialogDescription>Add a new shares, unit trust, ETF or other investment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Symbol / Ticker *</Label>
                <Input value={holdingForm.symbol} onChange={(e) => setHoldingForm({ ...holdingForm, symbol: e.target.value.toUpperCase() })} placeholder="e.g., VWRL, LLOY" />
              </div>
              <div>
                <Label>Holding Type *</Label>
                <Select value={holdingForm.holdingType} onValueChange={(v: HoldingType) => setHoldingForm({ ...holdingForm, holdingType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shares">Shares</SelectItem>
                    <SelectItem value="unit_trust">Unit Trust</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input value={holdingForm.name} onChange={(e) => setHoldingForm({ ...holdingForm, name: e.target.value })} placeholder="e.g., Lloyds Banking Group, Vanguard FTSE All-World" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" step="0.0001" value={holdingForm.quantity} onChange={(e) => setHoldingForm({ ...holdingForm, quantity: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Avg Cost/Unit (£)</Label>
                <Input type="number" step="0.0001" value={holdingForm.averageCostPerUnit} onChange={(e) => setHoldingForm({ ...holdingForm, averageCostPerUnit: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Current Price (£)</Label>
                <Input type="number" step="0.0001" value={holdingForm.currentPricePerUnit} onChange={(e) => setHoldingForm({ ...holdingForm, currentPricePerUnit: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input value={holdingForm.notes} onChange={(e) => setHoldingForm({ ...holdingForm, notes: e.target.value })} placeholder="e.g., Held in ISA" />
            </div>
            {holdingForm.quantity && holdingForm.averageCostPerUnit && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="flex justify-between">
                  <span>Cost Basis:</span>
                  <span className="font-medium">£{((parseFloat(holdingForm.quantity) || 0) * (parseFloat(holdingForm.averageCostPerUnit) || 0)).toFixed(2)}</span>
                </div>
                {holdingForm.currentPricePerUnit && (
                  <div className="flex justify-between">
                    <span>Market Value:</span>
                    <span className="font-medium">£{((parseFloat(holdingForm.quantity) || 0) * (parseFloat(holdingForm.currentPricePerUnit) || 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddHoldingOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddHolding} disabled={!holdingForm.symbol || !holdingForm.name}>Add Holding</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Holding Dialog */}
      <Dialog open={isEditHoldingOpen} onOpenChange={setIsEditHoldingOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Holding</DialogTitle>
            <DialogDescription>Update the details for this holding</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Symbol / Ticker *</Label>
                <Input value={holdingForm.symbol} onChange={(e) => setHoldingForm({ ...holdingForm, symbol: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <Label>Holding Type *</Label>
                <Select value={holdingForm.holdingType} onValueChange={(v: HoldingType) => setHoldingForm({ ...holdingForm, holdingType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shares">Shares</SelectItem>
                    <SelectItem value="unit_trust">Unit Trust</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input value={holdingForm.name} onChange={(e) => setHoldingForm({ ...holdingForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" step="0.0001" value={holdingForm.quantity} onChange={(e) => setHoldingForm({ ...holdingForm, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Avg Cost/Unit (£)</Label>
                <Input type="number" step="0.0001" value={holdingForm.averageCostPerUnit} onChange={(e) => setHoldingForm({ ...holdingForm, averageCostPerUnit: e.target.value })} />
              </div>
              <div>
                <Label>Current Price (£)</Label>
                <Input type="number" step="0.0001" value={holdingForm.currentPricePerUnit} onChange={(e) => setHoldingForm({ ...holdingForm, currentPricePerUnit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input value={holdingForm.notes} onChange={(e) => setHoldingForm({ ...holdingForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditHoldingOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleUpdateHolding}>Update Holding</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Holding Dialog */}
      <Dialog open={isDeleteHoldingOpen} onOpenChange={setIsDeleteHoldingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Holding</DialogTitle>
            <DialogDescription>Are you sure you want to delete this holding? All associated transactions will also be deleted. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteHoldingOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteHolding}>Delete Holding</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Investment Transaction</DialogTitle>
            <DialogDescription>Record a purchase, sale, dividend or reinvestment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Holding *</Label>
              <Select value={transactionForm.holdingId} onValueChange={(v) => setTransactionForm({ ...transactionForm, holdingId: v })}>
                <SelectTrigger><SelectValue placeholder="Select holding" /></SelectTrigger>
                <SelectContent>
                  {accountHoldings.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.symbol} - {h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transaction Type *</Label>
              <Select value={transactionForm.type} onValueChange={(v: InvestmentTransactionType) => setTransactionForm({ ...transactionForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">🟦 Buy - Purchase units/shares</SelectItem>
                  <SelectItem value="sell">🟧 Sell - Sell units/shares</SelectItem>
                  <SelectItem value="dividend">🟩 Dividend - Cash payment received</SelectItem>
                  <SelectItem value="dividend_reinvest">🟢 Dividend Reinvest - Reinvested as units</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{transactionForm.type === 'dividend' ? 'Units Held (for reference)' : 'Quantity / Units'}</Label>
                <Input type="number" step="0.0001" value={transactionForm.quantity} onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>{transactionForm.type === 'dividend' ? 'Dividend Rate/Unit (£)' : 'Price per Unit (£)'}</Label>
                <Input type="number" step="0.0001" value={transactionForm.pricePerUnit} onChange={(e) => setTransactionForm({ ...transactionForm, pricePerUnit: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fees (£, Optional)</Label>
                <Input type="number" step="0.01" value={transactionForm.fees} onChange={(e) => setTransactionForm({ ...transactionForm, fees: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })} />
              </div>
            </div>
            {transactionTotal > 0 && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="flex justify-between">
                  <span>{transactionForm.type === 'dividend' ? 'Total Dividend:' : 'Transaction Total:'}</span>
                  <span className="font-medium text-green-600">£{transactionTotal.toFixed(2)}</span>
                </div>
                {parseFloat(transactionForm.fees) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net (after fees):</span>
                    <span>£{(transactionTotal - (parseFloat(transactionForm.fees) || 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Notes (Optional)</Label>
              <Input value={transactionForm.notes} onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })} placeholder="e.g., Q1 2026 dividend" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddTransactionOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddTransaction} disabled={!transactionForm.holdingId}>Add Transaction</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Price Dialog */}
      <Dialog open={isUpdatePriceOpen} onOpenChange={setIsUpdatePriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Market Price</DialogTitle>
            <DialogDescription>Update the current market price for a holding. This will recalculate your gain/loss.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Holding *</Label>
              <Select value={priceForm.holdingId} onValueChange={(v) => {
                const holding = accountHoldings.find(h => h.id === v);
                setPriceForm({ holdingId: v, newPrice: holding ? holding.currentPricePerUnit.toString() : '' });
              }}>
                <SelectTrigger><SelectValue placeholder="Select holding" /></SelectTrigger>
                <SelectContent>
                  {accountHoldings.map(h => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.symbol} - {h.name} (Current: £{h.currentPricePerUnit.toFixed(4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New Price per Unit (£) *</Label>
              <Input type="number" step="0.0001" value={priceForm.newPrice} onChange={(e) => setPriceForm({ ...priceForm, newPrice: e.target.value })} placeholder="0.0000" />
            </div>
            {priceForm.holdingId && priceForm.newPrice && (() => {
              const holding = accountHoldings.find(h => h.id === priceForm.holdingId);
              const holdingSummary = summary.find(s => s.holdingId === priceForm.holdingId);
              if (!holding || !holdingSummary) return null;
              const newPrice = parseFloat(priceForm.newPrice) || 0;
              const newMarketValue = holdingSummary.quantity * newPrice;
              const newGain = newMarketValue - holdingSummary.costBasis;
              const priceChange = newPrice - holding.currentPricePerUnit;
              return (
                <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Price change:</span>
                    <span className={`font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange >= 0 ? '+' : ''}£{priceChange.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New market value:</span>
                    <span className="font-medium">£{newMarketValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New gain/loss:</span>
                    <span className={`font-medium ${newGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {newGain >= 0 ? '+' : ''}£{newGain.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsUpdatePriceOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleUpdatePrice} disabled={!priceForm.holdingId || !priceForm.newPrice}>Update Price</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

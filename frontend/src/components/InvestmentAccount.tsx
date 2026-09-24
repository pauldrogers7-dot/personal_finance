// @ts-nocheck
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { InvestmentTransactionType } from '@/types/finance';

export const InvestmentAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    accounts,
    investmentHoldings,
    investmentTransactions,
    addInvestmentHolding,
    addInvestmentTransaction,
    updateHoldingPrice,
    getInvestmentSummary,
  } = useFinance();

  const account = accounts.find(a => a.id === id);
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<string>('');

  // Form states
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    name: '',
    quantity: 0,
    averageCostPerUnit: 0,
    currentPricePerUnit: 0,
  });

  const [newTransaction, setNewTransaction] = useState({
    holdingId: '',
    type: 'buy' as InvestmentTransactionType,
    quantity: 0,
    pricePerUnit: 0,
    fees: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [priceUpdate, setPriceUpdate] = useState({
    holdingId: '',
    newPrice: 0,
  });

  if (!account || account.type !== 'investment') {
    return (
      <div className="p-6">
        <Button onClick={() => navigate('/accounts')} variant="ghost" className="mb-4">
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

  const totalMarketValue = summary.reduce((sum, s) => sum + s.marketValue, 0);
  const totalCostBasis = summary.reduce((sum, s) => sum + s.costBasis, 0);
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercentage = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  const handleAddHolding = () => {
    if (!newHolding.symbol || !newHolding.name) return;

    addInvestmentHolding({
      accountId: account.id,
      symbol: newHolding.symbol,
      name: newHolding.name,
      quantity: newHolding.quantity,
      averageCostPerUnit: newHolding.averageCostPerUnit,
      currentPricePerUnit: newHolding.currentPricePerUnit,
      lastPriceUpdate: new Date(),
    });

    setNewHolding({
      symbol: '',
      name: '',
      quantity: 0,
      averageCostPerUnit: 0,
      currentPricePerUnit: 0,
    });
    setIsAddHoldingOpen(false);
  };

  const handleAddTransaction = () => {
    if (!newTransaction.holdingId) return;

    const holding = accountHoldings.find(h => h.id === newTransaction.holdingId);
    if (!holding) return;

    const totalAmount = newTransaction.quantity * newTransaction.pricePerUnit;

    addInvestmentTransaction({
      accountId: account.id,
      holdingId: newTransaction.holdingId,
      symbol: holding.symbol,
      type: newTransaction.type,
      quantity: newTransaction.quantity,
      pricePerUnit: newTransaction.pricePerUnit,
      totalAmount,
      fees: newTransaction.fees,
      date: new Date(newTransaction.date),
      notes: newTransaction.notes,
    });

    setNewTransaction({
      holdingId: '',
      type: 'buy',
      quantity: 0,
      pricePerUnit: 0,
      fees: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setIsAddTransactionOpen(false);
  };

  const handleUpdatePrice = () => {
    if (!priceUpdate.holdingId || priceUpdate.newPrice <= 0) return;

    updateHoldingPrice(priceUpdate.holdingId, priceUpdate.newPrice);
    setPriceUpdate({ holdingId: '', newPrice: 0 });
    setIsUpdatePriceOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/accounts')} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{account.name}</h1>
            <p className="text-muted-foreground">Investment Account</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUpdatePriceOpen} onOpenChange={setIsUpdatePriceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Holding Price</DialogTitle>
                <DialogDescription>Update the current market price for a holding</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Holding</Label>
                  <Select value={priceUpdate.holdingId} onValueChange={(value) => setPriceUpdate({ ...priceUpdate, holdingId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select holding" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountHoldings.map(holding => (
                        <SelectItem key={holding.id} value={holding.id}>
                          {holding.symbol} - {holding.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New Price per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceUpdate.newPrice || ''}
                    onChange={(e) => setPriceUpdate({ ...priceUpdate, newPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <Button onClick={handleUpdatePrice} className="w-full">Update Price</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Investment Transaction</DialogTitle>
                <DialogDescription>Record a buy, sell, or dividend transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Holding</Label>
                  <Select value={newTransaction.holdingId} onValueChange={(value) => setNewTransaction({ ...newTransaction, holdingId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select holding" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountHoldings.map(holding => (
                        <SelectItem key={holding.id} value={holding.id}>
                          {holding.symbol} - {holding.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transaction Type</Label>
                  <Select value={newTransaction.type} onValueChange={(value: InvestmentTransactionType) => setNewTransaction({ ...newTransaction, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="dividend">Dividend</SelectItem>
                      <SelectItem value="dividend_reinvest">Dividend Reinvest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTransaction.quantity || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTransaction.pricePerUnit || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, pricePerUnit: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Fees (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTransaction.fees || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, fees: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full">Add Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddHoldingOpen} onOpenChange={setIsAddHoldingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Holding</DialogTitle>
                <DialogDescription>Add a new investment holding to this account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Symbol / Ticker</Label>
                  <Input
                    value={newHolding.symbol}
                    onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                    placeholder="e.g., AAPL, VWRL"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newHolding.name}
                    onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                    placeholder="e.g., Apple Inc., Vanguard FTSE All-World"
                  />
                </div>
                <div>
                  <Label>Initial Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newHolding.quantity || ''}
                    onChange={(e) => setNewHolding({ ...newHolding, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Average Cost per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newHolding.averageCostPerUnit || ''}
                    onChange={(e) => setNewHolding({ ...newHolding, averageCostPerUnit: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Current Price per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newHolding.currentPricePerUnit || ''}
                    onChange={(e) => setNewHolding({ ...newHolding, currentPricePerUnit: parseFloat(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddHolding} className="w-full">Add Holding</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalMarketValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalCostBasis.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {totalGain >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              £{totalGain.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain/Loss %</CardTitle>
            {totalGainPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalGainPercentage.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Your investment holdings and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No holdings yet. Click "Add Holding" to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Gain/Loss %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((holding) => (
                  <TableRow key={holding.holdingId}>
                    <TableCell className="font-medium">{holding.symbol}</TableCell>
                    <TableCell>{holding.name}</TableCell>
                    <TableCell className="text-right">{holding.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{holding.averageCostPerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{holding.currentPricePerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{holding.costBasis.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{holding.marketValue.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${holding.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      £{holding.gain.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${holding.gainPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {holding.gainPercentage.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent investment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {accountTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{format(new Date(txn.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="capitalize">{txn.type.replace('_', ' ')}</TableCell>
                    <TableCell className="font-medium">{txn.symbol}</TableCell>
                    <TableCell className="text-right">{txn.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{txn.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">£{txn.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{txn.fees ? `£${txn.fees.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{txn.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

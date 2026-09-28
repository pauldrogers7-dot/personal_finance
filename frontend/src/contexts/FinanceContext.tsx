  const importData = (data: { 
    accounts: Account[]; 
    transactions: Transaction[]; 
    budgets: Budget[]; 
    recurringTransactions: RecurringTransaction[];
    investmentHoldings?: InvestmentHolding[];
    investmentTransactions?: InvestmentTransaction[];
    categories?: CustomCategory[];
    settings?: AppSettings;
  }) => {
    setAccounts(data.accounts || []);
    setTransactions(data.transactions || []);
    setBudgets(data.budgets || []);
    setRecurringTransactions(data.recurringTransactions || []);
    if (data.investmentHoldings) setInvestmentHoldings(data.investmentHoldings);
    if (data.investmentTransactions) setInvestmentTransactions(data.investmentTransactions);
    if (data.categories && data.categories.length > 0) {
      setSettings(prevSettings => {
        const existingNames = new Set(prevSettings.customCategories.map(c => c.name));
        const newCategories = data.categories!.filter(c => !existingNames.has(c.name));
        return {
          ...prevSettings,
          customCategories: [...prevSettings.customCategories, ...newCategories]
        };
      });
    }
    if (data.settings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...data.settings,
        customCategories: prevSettings.customCategories
      }));
    }
  };

# 🏗️ Finance Tracker - Application Structure

## 📱 Application Pages

### 1. Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│  💰 Finance Tracker                    🌙 Theme     │
├─────────────────────────────────────────────────────┤
│  📊 Dashboard                                        │
│  ├─ Total Balance: $61,669.75                      │
│  ├─ Monthly Income: $5,000.00                      │
│  ├─ Monthly Expenses: $1,510.50                    │
│  └─ Net Income: $3,489.50                          │
│                                                      │
│  📈 Recent Transactions                             │
│  └─ Last 5 transactions                            │
│                                                      │
│  💳 Account Cards                                   │
│  ├─ Main Checking: $5,420.50                       │
│  ├─ Emergency Savings: $15,000.00                  │
│  ├─ Chase Credit Card: -$1,250.75                  │
│  ├─ Investment Portfolio: $42,500.00               │
│  └─ Cash Wallet: $350.00                           │
└─────────────────────────────────────────────────────┘
```

### 2. Accounts Page
```
┌─────────────────────────────────────────────────────┐
│  🏦 Accounts                                         │
│  ├─ [+ Add Account]                                 │
│  │                                                   │
│  ├─ Account Cards:                                  │
│  │  ┌──────────────────────┐                       │
│  │  │ 💳 Main Checking     │                       │
│  │  │ Balance: $5,420.50   │                       │
│  │  │ Type: Checking       │                       │
│  │  │ [Edit] [Delete]      │                       │
│  │  └──────────────────────┘                       │
│  │                                                   │
│  └─ (Repeat for all accounts)                      │
│                                                      │
│  Add Account Dialog:                                │
│  ├─ Name                                            │
│  ├─ Type (Dropdown)                                 │
│  ├─ Balance                                         │
│  ├─ Currency (Dropdown)                             │
│  └─ Color (Picker)                                  │
└─────────────────────────────────────────────────────┘
```

### 3. Transactions Page
```
┌─────────────────────────────────────────────────────┐
│  💸 Transactions                                     │
│  ├─ [+ Add Transaction]                             │
│  │                                                   │
│  ├─ Filters:                                        │
│  │  ├─ Type: [All | Income | Expense | Transfer]   │
│  │  └─ Account: [All Accounts | Specific]          │
│  │                                                   │
│  └─ Transaction List:                               │
│     ┌────────────────────────────────────────────┐ │
│     │ 💰 Monthly Salary                          │ │
│     │ +$5,000.00 | Salary | Main Checking       │ │
│     │ Dec 1, 2024                      [Delete]  │ │
│     └────────────────────────────────────────────┘ │
│     ┌────────────────────────────────────────────┐ │
│     │ 🏠 Monthly Rent Payment                    │ │
│     │ -$1,200.00 | Rent | Main Checking         │ │
│     │ Dec 14, 2024                     [Delete]  │ │
│     └────────────────────────────────────────────┘ │
│                                                      │
│  Add Transaction Dialog:                            │
│  ├─ Type (Income/Expense/Transfer)                  │
│  ├─ Account                                         │
│  ├─ To Account (if transfer)                        │
│  ├─ Amount                                          │
│  ├─ Category                                        │
│  ├─ Description                                     │
│  └─ Date                                            │
└─────────────────────────────────────────────────────┘
```

### 4. Budgets Page
```
┌─────────────────────────────────────────────────────┐
│  🎯 Budgets                                          │
│  ├─ [+ Add Budget]                                  │
│  │                                                   │
│  └─ Budget Cards:                                   │
│     ┌────────────────────────────────────────────┐ │
│     │ 🛒 Groceries Budget                        │ │
│     │ Category: Groceries | Monthly              │ │
│     │                                            │ │
│     │ Progress: [████████░░] 85%                │ │
│     │ Spent: $340.00 / $400.00                  │ │
│     │ Remaining: $60.00                         │ │
│     │ Status: 🟡 Near Limit                     │ │
│     │                                            │ │
│     │ [Edit] [Delete]                           │ │
│     └────────────────────────────────────────────┘ │
│                                                      │
│  Add Budget Dialog:                                 │
│  ├─ Name                                            │
│  ├─ Category                                        │
│  ├─ Amount                                          │
│  ├─ Period (Monthly/Quarterly/Yearly)               │
│  └─ Alert Threshold (%)                             │
└─────────────────────────────────────────────────────┘
```

### 5. Recurring Transactions Page
```
┌─────────────────────────────────────────────────────┐
│  🔄 Recurring Transactions                           │
│  ├─ [+ Add Recurring]                               │
│  │                                                   │
│  └─ Recurring List:                                 │
│     ┌────────────────────────────────────────────┐ │
│     │ 💰 Monthly Salary                          │ │
│     │ +$5,000.00 | Salary                        │ │
│     │ Frequency: Monthly                         │ │
│     │ Account: Main Checking                     │ │
│     │ Status: ✅ Active                          │ │
│     │ [Toggle] [Edit] [Delete]                  │ │
│     └────────────────────────────────────────────┘ │
│     ┌────────────────────────────────────────────┐ │
│     │ 🏠 Monthly Rent                            │ │
│     │ -$1,200.00 | Rent                          │ │
│     │ Frequency: Monthly                         │ │
│     │ Account: Main Checking                     │ │
│     │ Status: ✅ Active                          │ │
│     │ [Toggle] [Edit] [Delete]                  │ │
│     └────────────────────────────────────────────┘ │
│                                                      │
│  Add Recurring Dialog:                              │
│  ├─ Type (Income/Expense/Transfer)                  │
│  ├─ Amount                                          │
│  ├─ Category                                        │
│  ├─ Description                                     │
│  ├─ Frequency                                       │
│  ├─ Start Date                                      │
│  ├─ End Date (optional)                             │
│  └─ Account(s)                                      │
└─────────────────────────────────────────────────────┘
```

### 6. Reports Page
```
┌─────────────────────────────────────────────────────┐
│  📊 Reports                                          │
│  │                                                   │
│  ├─ [Monthly Summary] [Date Range] [Cash Flow]     │
│  │                                                   │
│  ├─ Monthly Summary Tab:                            │
│  │  ├─ Select Month: [December ▼]                  │
│  │  ├─ Select Year: [2024 ▼]                       │
│  │  │                                               │
│  │  ├─ Summary Cards:                               │
│  │  │  ┌─────────────────┐                         │
│  │  │  │ Total Income    │                         │
│  │  │  │ $5,000.00       │                         │
│  │  │  └─────────────────┘                         │
│  │  │  ┌─────────────────┐                         │
│  │  │  │ Total Expenses  │                         │
│  │  │  │ $1,510.50       │                         │
│  │  │  └─────────────────┘                         │
│  │  │  ┌─────────────────┐                         │
│  │  │  │ Net Income      │                         │
│  │  │  │ $3,489.50       │                         │
│  │  │  └─────────────────┘                         │
│  │  │                                               │
│  │  └─ Category Breakdown:                          │
│  │     ├─ Groceries: $340.00 (22%)                 │
│  │     ├─ Dining: $185.00 (12%)                    │
│  │     ├─ Transportation: $240.00 (16%)            │
│  │     └─ Utilities: $120.00 (8%)                  │
│  │                                                   │
│  ├─ Date Range Tab:                                 │
│  │  ├─ Start Date: [Date Picker]                   │
│  │  ├─ End Date: [Date Picker]                     │
│  │  └─ [Generate Report]                            │
│  │                                                   │
│  └─ Cash Flow Tab:                                  │
│     ├─ Select Account: [Dropdown]                   │
│     ├─ Start Date: [Date Picker]                    │
│     ├─ End Date: [Date Picker]                      │
│     └─ [Generate Report]                            │
│        ├─ Starting Balance: $5,000.00               │
│        ├─ Total Inflow: +$5,500.00                  │
│        ├─ Total Outflow: -$1,510.50                 │
│        ├─ Net Cash Flow: +$3,989.50                 │
│        └─ Ending Balance: $8,989.50                 │
└─────────────────────────────────────────────────────┘
```

### 7. Settings Page
```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Settings                                         │
│  │                                                   │
│  ├─ Data Overview:                                  │
│  │  ┌────────────────────────────────────────────┐ │
│  │  │ 📊 Data Statistics                         │ │
│  │  │ ├─ Accounts: 5                             │ │
│  │  │ ├─ Transactions: 142                       │ │
│  │  │ ├─ Budgets: 5                              │ │
│  │  │ └─ Recurring: 6                            │ │
│  │  └────────────────────────────────────────────┘ │
│  │                                                   │
│  ├─ Data Management:                                │
│  │  ┌────────────────────────────────────────────┐ │
│  │  │ 💾 Export Data                             │ │
│  │  │ [Export to JSON]                           │ │
│  │  └────────────────────────────────────────────┘ │
│  │  ┌────────────────────────────────────────────┐ │
│  │  │ 📥 Import Data                             │ │
│  │  │ [Import from JSON]                         │ │
│  │  └────────────────────────────────────────────┘ │
│  │  ┌────────────────────────────────────────────┐ │
│  │  │ ✨ Sample Data                             │ │
│  │  │ [Load Sample Data]                         │ │
│  │  └────────────────────────────────────────────┘ │
│  │                                                   │
│  └─ Danger Zone:                                    │
│     ┌────────────────────────────────────────────┐ │
│     │ 🗑️ Clear All Data                          │ │
│     │ [Clear All Data] (with confirmation)       │ │
│     └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🗂️ Data Structure

### Account Object
```typescript
{
  id: "uuid-string",
  name: "Main Checking",
  type: "checking" | "savings" | "credit" | "investment" | "cash",
  balance: 5420.50,
  currency: "USD",
  color: "#3b82f6",
  createdAt: "2024-12-16T10:00:00Z",
  updatedAt: "2024-12-16T11:00:00Z"
}
```

### Transaction Object
```typescript
{
  id: "uuid-string",
  type: "income" | "expense" | "transfer",
  amount: 5000.00,
  category: "Salary",
  description: "Monthly Salary",
  date: "2024-12-01T00:00:00Z",
  accountId: "account-uuid",
  toAccountId: "account-uuid", // for transfers
  createdAt: "2024-12-01T10:00:00Z",
  updatedAt: "2024-12-01T11:00:00Z"
}
```

### Budget Object
```typescript
{
  id: "uuid-string",
  name: "Groceries Budget",
  category: "Groceries",
  amount: 400.00,
  period: "monthly" | "quarterly" | "yearly",
  alertThreshold: 80, // percentage
  createdAt: "2024-12-01T00:00:00Z",
  updatedAt: "2024-12-01T11:00:00Z"
}
```

### Recurring Transaction Object
```typescript
{
  id: "uuid-string",
  type: "income" | "expense" | "transfer",
  amount: 5000.00,
  category: "Salary",
  description: "Monthly Salary",
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-12-31T00:00:00Z", // optional
  accountId: "account-uuid",
  toAccountId: "account-uuid", // for transfers
  isActive: true,
  lastProcessed: "2024-12-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-12-01T11:00:00Z"
}
```

## 🔄 User Workflows

### Adding a New Account
```
1. Click "Accounts" in sidebar
2. Click "+ Add Account" button
3. Fill in form:
   - Name
   - Type
   - Balance
   - Currency
   - Color
4. Click "Add Account"
5. Account appears in list
6. Balance updates dashboard
```

### Recording a Transaction
```
1. Click "Transactions" in sidebar
2. Click "+ Add Transaction" button
3. Select transaction type
4. Fill in details:
   - Account(s)
   - Amount
   - Category
   - Description
   - Date
5. Click "Add Transaction"
6. Transaction appears in list
7. Account balance updates
8. Budget progress updates (if applicable)
```

### Creating a Budget
```
1. Click "Budgets" in sidebar
2. Click "+ Add Budget" button
3. Fill in form:
   - Name
   - Category
   - Amount
   - Period
   - Alert Threshold
4. Click "Add Budget"
5. Budget appears with progress bar
6. Tracks spending automatically
```

### Setting Up Recurring Transaction
```
1. Click "Recurring" in sidebar
2. Click "+ Add Recurring" button
3. Configure:
   - Type
   - Amount
   - Category
   - Description
   - Frequency
   - Start/End dates
   - Account(s)
4. Click "Add Recurring Transaction"
5. Appears in recurring list
6. Automatically creates transactions
```

### Generating Reports
```
1. Click "Reports" in sidebar
2. Select report type:
   - Monthly Summary
   - Date Range
   - Cash Flow
3. Configure parameters:
   - Month/Year or Date Range
   - Account (for cash flow)
4. View results:
   - Summary cards
   - Category breakdown
   - Transaction list
```

## 🎨 UI Components Used

### Layout Components
- Sidebar Navigation
- Mobile Menu
- Page Container
- Card Grid

### Form Components
- Input Fields
- Select Dropdowns
- Date Pickers
- Color Picker
- Switches/Toggles

### Display Components
- Cards
- Progress Bars
- Badges
- Icons
- Tables/Lists

### Interactive Components
- Buttons
- Dialogs/Modals
- Alert Dialogs
- Tabs
- Toasts

### Visual Elements
- Color Indicators
- Status Badges
- Progress Bars
- Icons
- Separators

## 📊 Data Flow

### State Management
```
User Action
    ↓
Component Handler
    ↓
Context Function
    ↓
State Update
    ↓
LocalStorage Save
    ↓
Re-render
    ↓
UI Update
```

### Balance Calculation
```
Transaction Added/Deleted
    ↓
Identify Affected Account(s)
    ↓
Calculate Balance Change
    ↓
Update Account Balance
    ↓
Save to LocalStorage
    ↓
Update Dashboard
```

### Budget Tracking
```
Expense Transaction Added
    ↓
Check Category
    ↓
Find Matching Budget
    ↓
Calculate Spent Amount
    ↓
Update Progress
    ↓
Check Alert Threshold
    ↓
Update Status Indicator
```

## 🎯 Navigation Structure

```
Finance Tracker
├── 📊 Dashboard (Home)
├── 🏦 Accounts
├── 💸 Transactions
├── 🎯 Budgets
├── 🔄 Recurring
├── 📈 Reports
│   ├── Monthly Summary
│   ├── Date Range
│   └── Cash Flow
└── ⚙️ Settings
    ├── Data Overview
    ├── Export Data
    ├── Import Data
    ├── Sample Data
    └── Clear Data
```

## 🔐 Data Storage

### LocalStorage Keys
```
finance-accounts          → Account[]
finance-transactions      → Transaction[]
finance-budgets          → Budget[]
finance-recurring        → RecurringTransaction[]
```

### Storage Format
```json
{
  "accounts": [...],
  "transactions": [...],
  "budgets": [...],
  "recurringTransactions": [...]
}
```

---

**This structure provides a complete overview of the Finance Tracker application architecture and user interface.**

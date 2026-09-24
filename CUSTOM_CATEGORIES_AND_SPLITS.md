# Custom Categories & Split Transactions ✨

## Overview
Two powerful new features have been added to your Personal Finance Tracker:
1. **Custom Categories** - Create your own transaction categories
2. **Split Transactions** - Divide transactions across multiple categories

---

## 🏷️ Custom Categories

### What It Does
Create personalized categories beyond the default ones to better match your spending and income patterns.

### How to Use

#### Creating a Custom Category
1. Go to **Settings** page
2. Scroll to **Custom Categories** section
3. Click **Add Category** button
4. Fill in the form:
   - **Category Name**: e.g., "Pet Care", "Gifts", "Side Hustle"
   - **Type**: Income or Expense
   - **Color**: Pick a color to identify the category
5. Click **Add Category**

#### Managing Custom Categories
- **Edit**: Click the edit icon (✏️) next to any custom category
- **Delete**: Click the trash icon (🗑️) to remove a category
- **View**: Categories are organized by type (Income/Expense)

### Features
- ✅ Unlimited custom categories
- ✅ Color-coded for easy identification
- ✅ Separate income and expense categories
- ✅ Edit anytime
- ✅ Delete when no longer needed
- ✅ Automatically available in all transaction forms

### Default Categories
**Income:**
- Salary
- Freelance
- Investment Income
- Other Income

**Expense:**
- Groceries
- Dining
- Transportation
- Utilities
- Rent
- Mortgage
- Entertainment
- Healthcare
- Insurance
- Shopping
- Education
- Travel
- Subscriptions
- Other Expense

**Plus your custom categories!**

---

## ✂️ Split Transactions

### What It Does
Divide a single transaction across multiple categories. Perfect for:
- Shopping trips with multiple item types
- Bills that cover multiple services
- Mixed-purpose expenses
- Detailed expense tracking

### How to Use

#### Creating a Split Transaction
1. Go to **Transactions** page
2. Click **Add Transaction**
3. Fill in basic details:
   - Account
   - Type (Income or Expense)
   - **Total Amount** (important!)
   - Description
   - Date
4. Click **Split Transaction** button
5. In the Split Dialog:
   - Each split has:
     - **Category**: Choose from all available categories
     - **Amount**: Portion of the total
     - **Description**: Optional note for this split
   - Click **Add Split** to add more categories
   - Click trash icon to remove a split
6. Ensure splits add up to total amount
7. Click **Save Splits**
8. Click **Add Transaction**

#### Editing Split Transactions
1. Click edit icon (✏️) on any transaction
2. Existing splits are preserved
3. Click **Split Transaction** to modify splits
4. Update as needed
5. Save changes

### Features
- ✅ Split into unlimited categories
- ✅ Real-time total validation
- ✅ Individual descriptions per split
- ✅ Visual split indicator on transactions
- ✅ Edit splits anytime
- ✅ Works with both income and expenses
- ✅ Uses custom and default categories

### Split Transaction Display
Split transactions show:
- 🏷️ **Split Badge**: Shows number of categories
- 📝 **Category List**: All categories in the split
- 💰 **Total Amount**: Overall transaction amount

### Example Use Cases

#### Shopping Trip
**Total: $150**
- Groceries: $80
- Healthcare (vitamins): $30
- Entertainment (magazine): $15
- Household (cleaning supplies): $25

#### Utility Bill
**Total: $200**
- Utilities (electricity): $120
- Utilities (water): $50
- Internet (subscriptions): $30

#### Mixed Income
**Total: $3,000**
- Salary: $2,500
- Freelance: $500

---

## 🎯 Benefits

### Custom Categories
- **Personalized Tracking**: Match your unique financial situation
- **Better Organization**: Group transactions your way
- **Detailed Insights**: More specific category breakdowns
- **Flexibility**: Add categories as your needs change

### Split Transactions
- **Accurate Categorization**: No more "best guess" categories
- **Detailed Reports**: See exactly where money goes
- **Budget Tracking**: More precise budget monitoring
- **Tax Preparation**: Better documentation for deductions

---

## 💡 Tips & Best Practices

### Custom Categories
1. **Start Simple**: Don't create too many categories at once
2. **Be Specific**: "Pet Care" is better than "Animals"
3. **Use Colors**: Pick distinct colors for quick identification
4. **Review Regularly**: Delete unused categories
5. **Consistent Naming**: Use clear, descriptive names

### Split Transactions
1. **Double-Check Totals**: Ensure splits equal the transaction amount
2. **Use Descriptions**: Add notes to remember what each split was for
3. **Be Consistent**: Split similar transactions the same way
4. **Don't Over-Split**: Only split when it adds value
5. **Review Periodically**: Check if splits still make sense

---

## 🔧 Technical Details

### Data Structure

#### Custom Category
```typescript
{
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  createdAt: Date;
}
```

#### Transaction Split
```typescript
{
  category: TransactionCategory;
  amount: number;
  description?: string;
}
```

#### Transaction with Splits
```typescript
{
  id: string;
  accountId: string;
  type: TransactionType;
  category: TransactionCategory; // Primary category
  amount: number; // Total amount
  description: string;
  date: Date;
  splits?: TransactionSplit[]; // Optional splits
  // ... other fields
}
```

### Storage
- Custom categories stored in `AppSettings`
- Splits stored with each transaction
- All data persists in localStorage
- Included in export/import

### Validation
- Split amounts must equal transaction total
- Category names must be unique
- Minimum one split required
- All splits must have valid categories

---

## 📊 Impact on Reports

### Category Breakdown
- Split transactions counted in each category
- Amounts distributed according to splits
- More accurate category totals

### Budget Tracking
- Splits counted toward relevant budgets
- Better budget accuracy
- More precise overspending alerts

### Monthly Summaries
- Split amounts included in category totals
- More detailed expense breakdowns
- Better financial insights

---

## 🎨 UI Components

### Custom Category Manager
- **Location**: Settings page
- **Features**: Add, edit, delete categories
- **Organization**: Grouped by income/expense
- **Visual**: Color-coded category cards

### Split Transaction Dialog
- **Location**: Transaction form
- **Features**: Add/remove splits, validate totals
- **Visual**: Real-time total calculation
- **Feedback**: Clear error messages

### Transaction Display
- **Split Badge**: Shows split indicator
- **Category List**: Displays all split categories
- **Hover Details**: Full split information

---

## 🚀 Getting Started

### Quick Start - Custom Categories
1. Settings → Custom Categories
2. Click "Add Category"
3. Create "Pet Care" (Expense, Orange)
4. Use it in your next transaction!

### Quick Start - Split Transactions
1. Transactions → Add Transaction
2. Enter $100 total amount
3. Click "Split Transaction"
4. Split: Groceries ($60) + Dining ($40)
5. Save and add transaction!

---

## ❓ FAQ

**Q: Can I split transfer transactions?**
A: No, splits only work for income and expense transactions.

**Q: What happens if I delete a custom category that's in use?**
A: The category is removed from settings, but existing transactions keep the category name.

**Q: Can I change a split after creating the transaction?**
A: Yes! Edit the transaction and modify the splits.

**Q: Do splits affect my account balance?**
A: No, the total transaction amount affects the balance. Splits are just for categorization.

**Q: How many categories can I split into?**
A: Unlimited! Split into as many categories as needed.

**Q: Can I use custom categories in budgets?**
A: Yes! Custom categories appear in all category dropdowns.

**Q: Are splits included in exports?**
A: Yes, splits are preserved when exporting/importing data.

**Q: Can I have the same category name for income and expense?**
A: Yes, but it's not recommended for clarity.

---

## 📝 Summary

### Custom Categories
✅ Create unlimited personalized categories  
✅ Color-coded for easy identification  
✅ Edit and delete anytime  
✅ Works everywhere categories are used  
✅ Stored with your settings  

### Split Transactions
✅ Divide transactions across categories  
✅ Unlimited splits per transaction  
✅ Real-time validation  
✅ Individual descriptions  
✅ Visual indicators  
✅ Edit anytime  

**These features give you complete control over how you categorize and track your finances!** 🎉

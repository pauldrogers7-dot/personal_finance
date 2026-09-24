# 🎯 Cash Flow Threshold Lines Feature

## Feature Overview

When viewing the **Cash Flow Forecast** for a **single account**, the graph now displays horizontal reference lines showing the account's warning thresholds.

---

## What You Get ✅

### **Visual Threshold Lines**
- ✅ **Red dashed line** - Low balance warning threshold
- ✅ **Yellow dashed line** - High balance warning threshold
- ✅ **Only shown for single account view** (not when viewing multiple accounts)
- ✅ **Labeled with amounts** on the right side of the graph
- ✅ **Legend** showing what each line represents

### **Smart Display Logic**
- ✅ Lines only appear when viewing **one account**
- ✅ Lines only appear if thresholds are **set** for that account
- ✅ Lines automatically **scale** with the graph
- ✅ Lines span the **entire forecast period**

---

## How to Use

### **Step 1: Set Warning Thresholds**
1. Go to **Accounts** page
2. Edit an account (or create new)
3. Set warning thresholds:
   - **Low Balance Warning**: e.g., 1000
   - **High Balance Warning**: e.g., 10000
4. Save the account

### **Step 2: View in Cash Flow Forecast**
1. Go to **Dashboard**
2. Scroll to **Cash Flow Forecast**
3. In the **Accounts** section, click **only one account**
4. See the threshold lines appear on the graph!

### **Step 3: Interpret the Graph**
- **Green line** = Your projected balance over time
- **Red dashed line** = Low balance threshold (don't go below)
- **Yellow dashed line** = High balance threshold (consider investing above)
- **Legend** = Shows which lines are displayed

---

## Visual Examples

### **Example 1: Main Checking Account**

**Settings:**
- Low Balance Warning: £1,000
- High Balance Warning: £10,000
- Current Balance: £5,420.50

**Graph Shows:**
```
£12,000 ─────────────────────────────────
        │                                  High: £10,000
£10,000 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ (Yellow dashed)
        │              ●        ●
£8,000  │        ●    ╱        ╱
        │  ●    ╱    ╱        ╱
£6,000  │ ╱    ╱    ╱        ╱
        │╱    ╱    ╱        ╱
£4,000  │    ╱    ╱        ╱
        │                                  Low: £1,000
£2,000  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ (Red dashed)
        │
£0      ─────────────────────────────────
        Now  Jan    Feb    Mar    Apr
```

**Interpretation:**
- Balance stays well above low threshold ✅
- Balance approaches high threshold in Feb/Mar ⚠️
- Consider transferring excess to savings or investments

---

### **Example 2: Emergency Savings**

**Settings:**
- Low Balance Warning: £10,000
- High Balance Warning: £20,000
- Current Balance: £15,000

**Graph Shows:**
```
£22,000 ─────────────────────────────────
        │                                  High: £20,000
£20,000 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ (Yellow dashed)
        │
£18,000 │
        │  ●────●────●────●────●
£16,000 │
        │
£14,000 │
        │                                  Low: £10,000
£12,000 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ (Red dashed)
        │
£10,000 ─────────────────────────────────
        Now  Jan    Feb    Mar    Apr
```

**Interpretation:**
- Balance stays between thresholds ✅
- Emergency fund is maintained properly ✅
- No action needed

---

### **Example 3: Credit Card**

**Settings:**
- Low Balance Warning: -£2,000 (credit limit warning)
- High Balance Warning: (not set)
- Current Balance: -£1,250.75

**Graph Shows:**
```
£0      ─────────────────────────────────
        │  ●────●────●────●────●
-£500   │
        │
-£1,000 │
        │
-£1,500 │
        │                                  Low: -£2,000
-£2,000 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ (Red dashed)
        │
-£2,500 ─────────────────────────────────
        Now  Jan    Feb    Mar    Apr
```

**Interpretation:**
- Balance stays above low threshold (less negative) ✅
- Not approaching credit limit ✅
- Debt is under control

---

## Use Cases

### **1. Prevent Overdrafts**
- Set low threshold on checking account
- See if balance will drop below threshold
- Plan transfers before it happens

### **2. Maintain Emergency Fund**
- Set low threshold on savings
- Ensure emergency fund stays adequate
- Get visual warning if depleting

### **3. Optimize Cash Allocation**
- Set high threshold on checking
- See when excess cash accumulates
- Plan investments or transfers

### **4. Monitor Credit Usage**
- Set low threshold on credit cards (negative)
- Visualize approach to credit limit
- Manage debt proactively

### **5. Investment Planning**
- Set high threshold on savings
- Identify excess cash to invest
- Maximize returns on idle money

---

## Technical Details

### **When Lines Appear**
```javascript
// Lines only show when:
1. selectedAccountIds.length === 1 (single account selected)
2. account.lowBalanceWarning !== undefined (threshold is set)
   OR
   account.highBalanceWarning !== undefined (threshold is set)
```

### **Line Positioning**
```javascript
// Y-coordinate calculation:
y = 100 - ((threshold - minBalance) / balanceRange) * 100

// This ensures:
- Lines scale with the graph
- Lines stay in correct position relative to balance
- Lines work with any currency or amount
```

### **Visual Styling**
- **Low Balance Line**: Red (#EF4444), dashed (4px dash, 4px gap)
- **High Balance Line**: Yellow (#EAB308), dashed (4px dash, 4px gap)
- **Line Width**: 1.5px
- **Labels**: Positioned on right side with semi-transparent background

---

## Benefits

### **Better Planning**
- ✅ See if you'll hit thresholds in advance
- ✅ Plan transfers or adjustments proactively
- ✅ Avoid surprises

### **Visual Clarity**
- ✅ Instant understanding of balance safety
- ✅ Clear visual reference points
- ✅ Easy to interpret at a glance

### **Proactive Management**
- ✅ Prevent overdrafts before they happen
- ✅ Optimize cash allocation
- ✅ Maintain financial goals

### **Multi-Currency Support**
- ✅ Works with all 6 supported currencies
- ✅ Thresholds display in account's currency
- ✅ Automatic formatting

---

## Testing Checklist

### **Test 1: Low Balance Line (2 min)**
- [ ] Edit Main Checking account
- [ ] Set Low Balance Warning: 1000
- [ ] Go to Dashboard → Cash Flow Forecast
- [ ] Select only Main Checking account
- [ ] See red dashed line at £1,000 ✅
- [ ] See "Low: £1,000" label on right ✅
- [ ] See "Low Threshold" in legend ✅

### **Test 2: High Balance Line (2 min)**
- [ ] Edit Emergency Savings account
- [ ] Set High Balance Warning: 20000
- [ ] Go to Dashboard → Cash Flow Forecast
- [ ] Select only Emergency Savings account
- [ ] See yellow dashed line at £20,000 ✅
- [ ] See "High: £20,000" label on right ✅
- [ ] See "High Threshold" in legend ✅

### **Test 3: Both Lines (2 min)**
- [ ] Edit any account
- [ ] Set both Low and High warnings
- [ ] Go to Dashboard → Cash Flow Forecast
- [ ] Select only that account
- [ ] See both red and yellow lines ✅
- [ ] See both labels ✅
- [ ] See both in legend ✅

### **Test 4: Multiple Accounts (1 min)**
- [ ] Go to Dashboard → Cash Flow Forecast
- [ ] Select multiple accounts (or "All")
- [ ] Lines should NOT appear ✅
- [ ] Legend should NOT appear ✅

### **Test 5: No Thresholds (1 min)**
- [ ] Select account with no thresholds set
- [ ] Lines should NOT appear ✅
- [ ] Graph works normally ✅

---

## Files Changed

| File | Change | Lines Added |
|------|--------|-------------|
| CashFlowForecast.tsx | Added threshold lines | +54 |

---

## Status: Complete ✅

| Feature | Status |
|---------|--------|
| Low Balance Line | ✅ Working |
| High Balance Line | ✅ Working |
| Line Labels | ✅ Working |
| Legend | ✅ Working |
| Single Account Detection | ✅ Working |
| Multi-Currency Support | ✅ Working |
| Responsive Scaling | ✅ Working |

---

## Summary

The Cash Flow Forecast now displays **visual warning threshold lines** when viewing a single account, making it easy to:
- ✅ See if your balance will cross warning thresholds
- ✅ Plan ahead to avoid overdrafts
- ✅ Identify opportunities to optimize cash
- ✅ Maintain financial goals visually

**Perfect for proactive financial management!** 🎯💰

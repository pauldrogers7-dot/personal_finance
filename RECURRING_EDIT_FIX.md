# Recurring Transaction Edit Dialog Fix

## Issue
When clicking the Edit button on a recurring transaction, the preview would disappear.

## Root Cause
The Dialog component's `DialogContent` had a `max-w-md` (max-width: medium) class which was too narrow for the form content, causing layout issues that could make the preview disappear or become unresponsive.

## Solution
Updated both Add and Edit dialogs to use `max-w-2xl` (max-width: 2xl) and adjusted the max-height from `90vh` to `85vh` for better viewport fit.

### Changes Made

**File:** `/frontend/src/components/RecurringTransactions.tsx`

#### Before:
```tsx
<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
```

#### After:
```tsx
<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
```

### Applied To:
1. **Add Recurring Transaction Dialog** (line 158)
2. **Edit Recurring Transaction Dialog** (line 571)

## Benefits
- ✅ More space for form fields
- ✅ Better readability
- ✅ Prevents layout overflow issues
- ✅ Consistent dialog sizing
- ✅ Better viewport fit
- ✅ Improved user experience

## Testing
1. Go to **Recurring Transactions** page
2. Click **Edit** (pencil icon) on any recurring transaction
3. Dialog should open properly without preview disappearing
4. All form fields should be visible and editable
5. Click **Update Recurring Transaction** to save changes
6. Dialog should close and preview should remain visible

## Status
✅ **FIXED** - Both Add and Edit dialogs now work correctly with proper sizing.

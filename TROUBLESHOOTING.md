# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue: Preview Failed to Load

**Error:** `Failed to resolve import "@/hooks/use-toast"`

**Solution:** ✅ **FIXED** - Created the missing `use-toast` hook and added the Toaster component.

**What was done:**
1. Created `/frontend/src/hooks/use-toast.ts` - A custom hook that wraps the Sonner toast library
2. Added `<Toaster />` component to `App.tsx` to enable toast notifications
3. The Settings component now works correctly with import/export notifications

---

## Application Status

✅ **All systems operational**

- Frontend server running on port 3000
- All components loading correctly
- Toast notifications working
- No build errors

---

## If You Encounter Issues

### 1. Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear local storage if data seems corrupted

### 2. Check Console
- Open browser DevTools (F12)
- Look for any error messages in the Console tab
- Check Network tab for failed requests

### 3. Verify Data
- Go to Settings → Export Data to backup your data
- If data is corrupted, you can clear it from Settings → Clear All Data
- Import your backup or load sample data

### 4. Module Not Found Errors
If you see "Cannot find module" errors:
- Check that all imports use the correct path aliases (`@/`)
- Verify the file exists in the expected location
- Restart the dev server if needed

### 5. TypeScript Errors
- Most TypeScript errors are informational and won't break the app
- Check the terminal for actual build errors
- Ensure all types are properly defined in `/frontend/src/types/finance.ts`

---

## Development Tips

### Local Storage
All data is stored in browser's localStorage under the key `finance-tracker-data`. You can:
- View it in DevTools → Application → Local Storage
- Clear it manually if needed
- Export/import through the Settings page

### Sample Data
- Use "Load Sample Data" button on the Dashboard when you have no data
- Sample data includes realistic accounts, transactions, budgets, and recurring items
- Great for testing and exploring features

### Data Persistence
- Data saves automatically after every change
- No manual save button needed
- Export regularly to backup your data

---

## Feature-Specific Issues

### Transactions Not Showing
- Check date filters - expand the date range
- Verify the account has transactions
- Check if filters are applied

### Budget Not Tracking
- Ensure budget category matches transaction categories
- Check budget date range includes your transactions
- Verify transactions are categorized correctly

### Recurring Transactions Not Processing
- Recurring transactions are processed when you visit the Dashboard
- Check the "Next Date" to see when it will process next
- Ensure the recurring transaction is active

### Reports Showing Zero
- Verify you have transactions in the selected date range
- Check that accounts have balances
- Ensure transactions are properly categorized

---

## Performance Tips

### Large Transaction History
If you have 1000+ transactions:
- Use date filters to limit displayed transactions
- Export old data and start fresh periodically
- Use the Reports page for summaries instead of viewing all transactions

### Browser Performance
- Close unused browser tabs
- Clear browser cache periodically
- Use a modern browser (Chrome, Firefox, Edge, Safari)

---

## Data Management Best Practices

1. **Regular Backups**
   - Export your data monthly
   - Keep backups in a safe location
   - Test imports occasionally

2. **Data Organization**
   - Use consistent category names
   - Add descriptions to transactions
   - Review and categorize regularly

3. **Account Management**
   - Update balances regularly
   - Reconcile with bank statements
   - Archive old accounts if needed

---

## Need More Help?

### Check Documentation
- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [FEATURES.md](FEATURES.md) - Complete feature list
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details

### Debug Mode
Open browser console (F12) to see:
- State changes
- API calls (if backend is added)
- Error stack traces
- Performance metrics

---

## Known Limitations

1. **No Cloud Sync** - Data is stored locally only
2. **No Multi-Currency** - All amounts in single currency
3. **No Attachments** - Cannot attach receipts/documents
4. **No Mobile App** - Web-only (but responsive)
5. **No Collaboration** - Single-user application

---

## Future Enhancements

Potential features for future versions:
- Cloud backup and sync
- Multi-currency support
- Receipt attachments
- Bank account integration
- Mobile apps (iOS/Android)
- Multi-user support
- Advanced analytics
- Tax reporting

---

**Last Updated:** December 16, 2024
**Version:** 1.0.0
**Status:** ✅ Fully Operational

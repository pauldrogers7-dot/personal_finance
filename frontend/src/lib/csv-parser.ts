export interface ParsedCSVTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface CSVParseResult {
  transactions: ParsedCSVTransaction[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse CSV file content into transactions
 * Supports common bank CSV formats with headers
 */
export function parseCSV(content: string): CSVParseResult {
  const transactions: ParsedCSVTransaction[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Split into lines
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      errors.push('CSV file must contain at least a header row and one data row');
      return { transactions, errors, warnings };
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    
    // Find column indices
    const dateIndex = findColumnIndex(headers, ['transaction date', 'date', 'posted date']);
    const descriptionIndex = findColumnIndex(headers, ['transaction description', 'description', 'payee', 'narrative']);
    const debitIndex = findColumnIndex(headers, ['debit amount', 'debit', 'withdrawals', 'money out']);
    const creditIndex = findColumnIndex(headers, ['credit amount', 'credit', 'deposits', 'money in']);
    const amountIndex = findColumnIndex(headers, ['amount', 'transaction amount']);

    if (dateIndex === -1) {
      errors.push('Could not find date column. Expected: "Transaction Date", "Date", or "Posted Date"');
    }
    if (descriptionIndex === -1) {
      errors.push('Could not find description column. Expected: "Transaction Description", "Description", or "Payee"');
    }
    if (debitIndex === -1 && creditIndex === -1 && amountIndex === -1) {
      errors.push('Could not find amount columns. Expected: "Debit Amount" and "Credit Amount", or "Amount"');
    }

    if (errors.length > 0) {
      return { transactions, errors, warnings };
    }

    // Log header info for debugging
    console.log('CSV Headers:', headers);
    console.log('Column indices:', { 
      dateIndex, 
      descriptionIndex, 
      debitIndex, 
      creditIndex, 
      amountIndex 
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line, headers.length);
        
        // Log all rows for debugging
        console.log(`Row ${i + 1} values (${values.length} columns):`, values);
        
        // Extract values
        const dateStr = values[dateIndex]?.trim();
        const description = values[descriptionIndex]?.trim() || 'Unknown';
        const debitStr = debitIndex !== -1 ? (values[debitIndex]?.trim() || '') : '';
        const creditStr = creditIndex !== -1 ? (values[creditIndex]?.trim() || '') : '';
        const amountStr = amountIndex !== -1 ? (values[amountIndex]?.trim() || '') : '';

        // Parse date
        if (!dateStr) {
          warnings.push(`Row ${i + 1}: Missing date, skipping`);
          continue;
        }

        const date = parseDate(dateStr);
        if (!date) {
          warnings.push(`Row ${i + 1}: Invalid date "${dateStr}", skipping`);
          continue;
        }

        // Parse amount
        let amount: number | null = null;
        let type: 'income' | 'expense' = 'expense';

        // Log amount strings for debugging
        console.log(`Row ${i + 1} amount strings:`, { debitStr, creditStr, amountStr });

        // If there's a single amount column, use it (negative = expense, positive = income)
        if (amountStr) {
          const parsedAmount = parseAmountWithSign(amountStr);
          if (i <= 3) {
            console.log(`Row ${i + 1} parsed amount from amountStr:`, parsedAmount);
          }
          if (parsedAmount !== null) {
            amount = Math.abs(parsedAmount);
            type = parsedAmount < 0 ? 'expense' : 'income';
          }
        } else {
          // Try to parse debit amount first
          if (debitStr) {
            const debitAmount = parseAmount(debitStr);
            if (debitAmount !== null && debitAmount > 0) {
              amount = debitAmount;
              type = 'expense';
            }
          }

          // If no debit amount, try credit amount
          if (amount === null && creditStr) {
            const creditAmount = parseAmount(creditStr);
            if (creditAmount !== null && creditAmount > 0) {
              amount = creditAmount;
              type = 'income';
            }
          }
        }

        // Skip if no valid amount found
        if (amount === null || amount === 0) {
          const debugInfo = [];
          if (amountStr) debugInfo.push(`amount="${amountStr}"`);
          if (debitStr) debugInfo.push(`debit="${debitStr}"`);
          if (creditStr) debugInfo.push(`credit="${creditStr}"`);
          console.log(`Row ${i + 1}: SKIPPED - No valid amount`);
          warnings.push(`Row ${i + 1}: No valid amount found (${debugInfo.join(', ') || 'all empty'}), skipping`);
          continue;
        }

        console.log(`Row ${i + 1}: PARSED - Amount: ${amount}, Type: ${type}, Description: ${description}`);
        transactions.push({
          date: date.toISOString(),
          description,
          amount,
          type,
        });
      } catch (error) {
        warnings.push(`Row ${i + 1}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { transactions, errors, warnings };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { transactions, errors, warnings };
  }
}

/**
 * Parse a CSV line, handling quoted fields
 */
function parseCSVLine(line: string, expectedColumns?: number): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  
  // If we have expectedColumns and got fewer columns, try simple split
  // This handles cases where the CSV doesn't use quotes but has the right number of commas
  if (expectedColumns && values.length < expectedColumns) {
    const simpleSplit = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (simpleSplit.length === expectedColumns) {
      return simpleSplit;
    }
  }
  
  return values;
}

/**
 * Find column index by matching against possible names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  
  return -1;
}

/**
 * Parse date string in various formats
 */
function parseDate(dateStr: string): Date | null {
  // Try DD/MM/YYYY (UK format)
  const ukMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try MM/DD/YYYY (US format)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try native Date parsing as fallback
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  return null;
}

/**
 * Parse amount string, removing currency symbols and handling decimals
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;

  // Remove currency symbols, spaces, commas, and quotes
  let cleaned = amountStr.trim().replace(/[£$€,\s"']/g, '');
  
  // Handle empty string after cleaning
  if (cleaned === '' || cleaned === '-') return null;
  
  // Parse as float
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) return null;
  
  return Math.abs(amount); // Return absolute value
}

/**
 * Parse amount string with sign (for single amount column)
 * Negative values = expenses, Positive values = income
 */
function parseAmountWithSign(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;

  // Remove currency symbols, spaces, commas, and quotes (but keep minus sign)
  let cleaned = amountStr.trim().replace(/[£$€,\s"']/g, '');
  
  // Handle empty string after cleaning
  if (cleaned === '' || cleaned === '-') return null;
  
  // Parse as float (preserving sign)
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) return null;
  
  return amount; // Return with sign
}

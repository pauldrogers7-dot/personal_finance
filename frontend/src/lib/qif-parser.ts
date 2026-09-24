// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Account, TransactionType, TransactionCategory } from '@/types/finance';
import { parseISO, isValid, parse } from 'date-fns';

export interface QIFSplit {
  category: string;
  memo?: string;
  amount: number;
}

export interface QIFTransaction {
  date: Date;
  amount: number;
  payee?: string;
  memo?: string;
  category?: string;
  cleared?: boolean;
  number?: string;
  splits?: QIFSplit[];
}

export interface QIFParseResult {
  transactions: QIFTransaction[];
  accountName?: string;
  accountType?: string;
  errors: string[];
}

/**
 * Parse a QIF file content
 */
export function parseQIF(content: string): QIFParseResult {
  const lines = content.split('\n').map(line => line.trim());
  const transactions: QIFTransaction[] = [];
  const errors: string[] = [];
  let accountName: string | undefined;
  let accountType: string | undefined;

  let currentTransaction: Partial<QIFTransaction> = {};
  let currentSplits: QIFSplit[] = [];
  let currentSplit: Partial<QIFSplit> | null = null;
  let lineNumber = 0;

  const finaliseCurrentSplit = () => {
    if (currentSplit && currentSplit.category !== undefined && currentSplit.amount !== undefined) {
      currentSplits.push({
        category: currentSplit.category,
        memo: currentSplit.memo,
        amount: currentSplit.amount,
      });
    }
    currentSplit = null;
  };

  for (const line of lines) {
    lineNumber++;

    if (!line) continue;

    if (line.startsWith('!')) {
      if (line.startsWith('!Type:')) {
        accountType = line.substring(6).trim();
      }
      continue;
    }

    // Handle account name line (N inside !Account block)
    if (line.startsWith('N') && !currentTransaction.date && !currentTransaction.amount) {
      accountName = line.substring(1).trim();
      continue;
    }

    const code = line.charAt(0);
    const value = line.substring(1).trim();

    switch (code) {
      case 'D': // Date
        try {
          const date = parseQIFDate(value);
          if (date && isValid(date)) {
            currentTransaction.date = date;
          } else {
            errors.push(`Line ${lineNumber}: Invalid date format: ${value}`);
          }
        } catch (error) {
          errors.push(`Line ${lineNumber}: Error parsing date: ${value}`);
        }
        break;

      case 'T': // Total amount
      case 'U': // Amount (alternative)
        try {
          const amount = parseFloat(value.replace(/,/g, ''));
          if (!isNaN(amount)) {
            currentTransaction.amount = amount;
          } else {
            errors.push(`Line ${lineNumber}: Invalid amount: ${value}`);
          }
        } catch (error) {
          errors.push(`Line ${lineNumber}: Error parsing amount: ${value}`);
        }
        break;

      case 'P': // Payee
        currentTransaction.payee = value;
        break;

      case 'M': // Memo
        currentTransaction.memo = value;
        break;

      case 'L': // Main category
        currentTransaction.category = value;
        break;

      case 'C': // Cleared status
        currentTransaction.cleared = value === 'X' || value === 'x' || value === '*';
        break;

      case 'N': // Number (check number)
        currentTransaction.number = value;
        break;

      case 'A': // Address - ignore
        break;

      // ── Split transaction lines ──────────────────────────────────────────
      case 'S': // Split category - starts a new split
        // Save any in-progress split before starting a new one
        finaliseCurrentSplit();
        currentSplit = { category: value };
        break;

      case 'E': // Split memo
        if (currentSplit) {
          currentSplit.memo = value;
        }
        break;

      case '$': // Split amount
        try {
          const splitAmount = parseFloat(value.replace(/,/g, ''));
          if (!isNaN(splitAmount)) {
            if (!currentSplit) currentSplit = {};
            currentSplit.amount = splitAmount;
          }
        } catch {
          // ignore bad split amount
        }
        break;

      case '%': // Split percentage - ignore (we use $ amounts)
        break;
      // ─────────────────────────────────────────────────────────────────────

      case '^': // End of transaction
        // Finalise any in-progress split
        finaliseCurrentSplit();

        if (currentTransaction.date && currentTransaction.amount !== undefined) {
          if (currentSplits.length > 0) {
            currentTransaction.splits = [...currentSplits];
          }
          transactions.push(currentTransaction as QIFTransaction);
        } else {
          errors.push(`Line ${lineNumber}: Incomplete transaction (missing date or amount)`);
        }
        currentTransaction = {};
        currentSplits = [];
        currentSplit = null;
        break;

      default:
        break;
    }
  }

  return {
    transactions,
    accountName,
    accountType,
    errors,
  };
}

/**
 * Parse QIF date format (various formats supported)
 */
function parseQIFDate(dateStr: string): Date | null {
  let normalised = dateStr
    .replace(/'/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  // Try UK date formats first (DD/MM/YYYY), then fallback to others
  const formats = [
    'dd/MM/yyyy',
    'dd/MM/yy',
    'd/M/yyyy',
    'd/M/yy',
    'dd-MM-yyyy',
    'dd-MM-yy',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'MM/dd/yy',
    'M/d/yyyy',
    'M/d/yy',
    'MM-dd-yyyy',
    'MM-dd-yy',
    'dd/MM/ yyyy',
    "dd/MM'yyyy",
  ];

  for (const format of formats) {
    try {
      const date = parse(normalised, format, new Date());
      if (isValid(date) && date.getFullYear() > 1900) {
        return date;
      }
    } catch {
      continue;
    }
  }

  try {
    const date = parseISO(normalised);
    if (isValid(date)) return date;
  } catch {
    // continue
  }

  return null;
}

/**
 * Map QIF category to our TransactionCategory
 */
export function mapQIFCategory(qifCategory?: string): TransactionCategory {
  if (!qifCategory) return 'other';

  const category = qifCategory.toLowerCase();

  const categoryMap: Record<string, TransactionCategory> = {
    'groceries': 'groceries',
    'food': 'groceries',
    'supermarket': 'groceries',
    'dining': 'dining',
    'restaurant': 'dining',
    'entertainment': 'entertainment',
    'movies': 'entertainment',
    'shopping': 'shopping',
    'retail': 'shopping',
    'transportation': 'transportation',
    'gas': 'transportation',
    'fuel': 'transportation',
    'auto': 'transportation',
    'utilities': 'utilities',
    'electric': 'utilities',
    'water': 'utilities',
    'healthcare': 'healthcare',
    'medical': 'healthcare',
    'doctor': 'healthcare',
    'insurance': 'insurance',
    'salary': 'salary',
    'income': 'salary',
    'paycheck': 'salary',
    'freelance': 'freelance',
    'investment': 'investment',
    'dividend': 'investment',
    'interest': 'investment',
  };

  if (categoryMap[category]) return categoryMap[category];

  for (const [key, value] of Object.entries(categoryMap)) {
    if (category.includes(key)) return value;
  }

  return 'other';
}

/**
 * Convert QIF transactions to our Transaction format, preserving splits
 */
export function convertQIFToTransactions(
  qifTransactions: QIFTransaction[],
  account: Account
): Transaction[] {
  return qifTransactions.map(qif => {
    const amount = Math.abs(qif.amount);
    const type: TransactionType = qif.amount >= 0 ? 'income' : 'expense';
    const category = mapQIFCategory(qif.category);

    // Build splits if present
    let splits = undefined;
    if (qif.splits && qif.splits.length > 0) {
      splits = qif.splits.map(s => ({
        id: uuidv4(),
        category: s.category || 'other',
        amount: Math.abs(s.amount),
        description: s.memo || '',
      }));
    }

    return {
      id: uuidv4(),
      type,
      amount,
      category,
      accountId: account.id,
      toAccountId: undefined,
      description: qif.memo || qif.category || '',
      payee: qif.payee || '',
      date: qif.date.toISOString(),
      splits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Validate QIF file content
 */
export function isValidQIF(content: string): boolean {
  if (!content.includes('!Type:') && !content.includes('!Account')) {
    return false;
  }
  if (!content.includes('^')) {
    return false;
  }
  return true;
}

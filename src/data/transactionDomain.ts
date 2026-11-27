export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled' | 'failed';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly';

export interface TransactionFilters {
  search?: string;
  category?: string;
  accountId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  dateField?: 'date' | 'dueDate';
}

export function moneyToCents(value: number | string): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return NaN;
    return Math.round((value + Math.sign(value) * Number.EPSILON) * 100);
  }
  if (typeof value !== 'string') return NaN;
  const clean = value.trim().replace(/[R$\s]/g, '');
  if (!clean) return NaN;
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? Math.round((numeric + Math.sign(numeric) * Number.EPSILON) * 100) : NaN;
}

export function centsToMoney(cents: number): number {
  return Number.isInteger(cents) ? cents / 100 : 0;
}

export function transactionCents(transaction: { amountCents?: number; amount: number }): number {
  return Number.isInteger(transaction.amountCents) ? transaction.amountCents! : moneyToCents(transaction.amount);
}

export function sumCents<T extends { amountCents?: number; amount: number }>(rows: T[]): number {
  return rows.reduce((total, row) => total + transactionCents(row), 0);
}

export function splitCents(totalCents: number, count: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 1 || !Number.isInteger(count) || count < 2 || count > 60) {
    throw new Error('Informe um valor em centavos e de 2 a 60 parcelas.');
  }
  const each = Math.floor(totalCents / count);
  const remainder = totalCents - each * count;
  return Array.from({ length: count }, (_, index) => each + (index < remainder ? 1 : 0));
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('Data inválida.');
  return date;
}

export function addCalendarMonths(start: Date, months: number): Date {
  const year = start.getFullYear();
  const month = start.getMonth() + months;
  const targetLastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(start.getDate(), targetLastDay));
}

export function advanceRecurrenceDate(start: Date, index: number, frequency: RecurrenceFrequency): Date {
  if (frequency === 'daily' || frequency === 'weekly' || frequency === 'fortnightly') {
    const step = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;
    const next = new Date(start);
    next.setDate(next.getDate() + index * step);
    return next;
  }
  const monthStep: Record<Exclude<RecurrenceFrequency, 'daily' | 'weekly' | 'fortnightly'>, number> = {
    monthly: 1, bimonthly: 2, quarterly: 3, semiannual: 6, yearly: 12,
  };
  return addCalendarMonths(start, index * monthStep[frequency]);
}

export function generateRecurrenceDates(input: {
  dateStart: string;
  frequency: RecurrenceFrequency;
  dateEnd?: string;
  repetitions?: number;
  maxOccurrences?: number;
}): string[] {
  const start = parseDateKey(input.dateStart);
  const end = input.dateEnd ? parseDateKey(input.dateEnd) : undefined;
  const max = input.maxOccurrences ?? 500;
  const count = input.repetitions ?? max;
  if (!Number.isInteger(count) || count < 1 || count > max) throw new Error(`A repetição deve ter entre 1 e ${max} ocorrências.`);
  if (!end && input.repetitions === undefined) throw new Error('Informe a quantidade de repetições ou uma data final.');
  if (end && end < start) throw new Error('A data final deve ser igual ou posterior à data inicial.');
  const dates: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const date = advanceRecurrenceDate(start, index, input.frequency);
    if (end && date > end) break;
    dates.push(dateKey(date));
  }
  if (!dates.length) throw new Error('A série não possui ocorrências no intervalo informado.');
  return dates;
}

export function filterAndSortTransactions<T extends {
  date: string; dueDate?: string; description: string; category: string; accountId?: string;
  type: TransactionType; status: TransactionStatus; amountCents?: number; amount: number;
}>(rows: T[], filters: TransactionFilters, sortBy: 'date' | 'dueDate' | 'amount' | 'description', direction: 'asc' | 'desc' = 'desc'): T[] {
  const needle = filters.search?.trim().toLocaleLowerCase('pt-BR') ?? '';
  return rows.filter((row) => {
    const date = filters.dateField === 'dueDate' ? (row.dueDate ?? row.date) : row.date;
    return (!needle || `${row.description} ${row.category}`.toLocaleLowerCase('pt-BR').includes(needle))
      && (!filters.category || filters.category === 'all' || row.category === filters.category)
      && (!filters.accountId || filters.accountId === 'all' || (filters.accountId === 'none' ? !row.accountId : row.accountId === filters.accountId))
      && (!filters.type || filters.type === 'all' || row.type === filters.type)
      && (!filters.status || filters.status === 'all' || row.status === filters.status)
      && (!filters.from || date >= filters.from)
      && (!filters.to || date <= filters.to);
  }).sort((left, right) => {
    const sign = direction === 'asc' ? 1 : -1;
    const a = sortBy === 'amount' ? transactionCents(left) : sortBy === 'description' ? left.description.toLocaleLowerCase('pt-BR') : (sortBy === 'dueDate' ? left.dueDate ?? left.date : left.date);
    const b = sortBy === 'amount' ? transactionCents(right) : sortBy === 'description' ? right.description.toLocaleLowerCase('pt-BR') : (sortBy === 'dueDate' ? right.dueDate ?? right.date : right.date);
    return (a < b ? -1 : a > b ? 1 : left.date.localeCompare(right.date)) * sign;
  });
}

export function completedTotals<T extends { type: TransactionType; status: TransactionStatus; amountCents?: number; amount: number }>(rows: T[]) {
  const totals = rows.reduce((result, row) => {
    if (row.status === 'completed') result[row.type] += transactionCents(row);
    return result;
  }, { income: 0, expense: 0 });
  return { income: centsToMoney(totals.income), expense: centsToMoney(totals.expense), incomeCents: totals.income, expenseCents: totals.expense };
}

import { useSyncExternalStore } from 'react';
import { readLocal, writeLocal } from '../storage.ts';
import {
  centsToMoney, completedTotals, generateRecurrenceDates, moneyToCents,
  splitCents, transactionCents, type RecurrenceFrequency,
  type TransactionStatus, type TransactionType,
} from './transactionDomain.ts';

export type { RecurrenceFrequency, TransactionStatus, TransactionType } from './transactionDomain';
export interface Transaction {
  id: string; date: string; description: string; category: string; amount: number; amountCents?: number;
  type: TransactionType; status: TransactionStatus; dueDate?: string; accountId?: string;
  paymentMethod?: string; notes?: string; recurring?: boolean; recurrenceSeriesId?: string;
  occurrenceDate?: string; occurrenceIndex?: number; installmentGroup?: string; purchaseId?: string; purchaseTotalCents?: number;
  installmentNumber?: number; installmentCount?: number;
}
export interface Category { id?: string; name: string; icon: string; color?: string; type: 'income' | 'expense' | 'both'; archived?: boolean }
export interface Budget { category: string; limit: number }
export interface Goal { name: string; current: number; target: number; color: string; deadline?: string }
export interface Account { id: string; name: string; type: 'corrente' | 'poupanca' | 'dinheiro' | 'investimento' | 'cartao'; balance: number; creditLimit?: number; closingDay?: number; dueDay?: number }
export interface Transfer { id: string; date: string; fromAccountId: string; toAccountId: string; amount: number; note?: string; status: 'completed' | 'pending' }
export interface Recurring { id: string; description: string; category: string; amount: number; type: TransactionType; day: number; nextDate: string; frequency?: RecurrenceFrequency }
export interface RecurrenceSeries {
  id: string; description: string; category: string; amount: number; amountCents: number;
  type: TransactionType; frequency: RecurrenceFrequency; dateStart: string; dateEnd?: string;
  repetitions?: number; dueDateOffsetDays?: number; accountId?: string; paymentMethod?: string;
  notes?: string; initialStatus: TransactionStatus; excludedOccurrences: number[];
}
export interface FinanceData { transactions: Transaction[]; budgets: Budget[]; goals: Goal[]; accounts: Account[]; transfers: Transfer[]; recurring: Recurring[]; categories: Category[]; recurrenceSeries: RecurrenceSeries[] }
export type TransactionDraft = Omit<Transaction, 'id' | 'amountCents' | 'recurrenceSeriesId' | 'occurrenceDate' | 'occurrenceIndex' | 'installmentGroup' | 'purchaseId' | 'installmentNumber' | 'installmentCount'>;
export type SeriesScope = 'occurrence' | 'future' | 'series';

export const STORAGE_KEY = 'finance-dashboard-data-v1';
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-food', name: 'Alimentação', icon: '🍽️', color: '#F59E0B', type: 'expense' },
  { id: 'default-home', name: 'Moradia', icon: '🏠', color: '#60A5FA', type: 'expense' },
  { id: 'default-transport', name: 'Transporte', icon: '🚗', color: '#A78BFA', type: 'expense' },
  { id: 'default-health', name: 'Saúde', icon: '🩺', color: '#F87185', type: 'expense' },
  { id: 'default-education', name: 'Educação', icon: '📚', color: '#38BDF8', type: 'expense' },
  { id: 'default-leisure', name: 'Lazer', icon: '🎬', color: '#FB7185', type: 'expense' },
  { id: 'default-bills', name: 'Contas', icon: '🧾', color: '#FBBF24', type: 'expense' },
  { id: 'default-subscriptions', name: 'Assinaturas', icon: '🔁', color: '#A78BFA', type: 'expense' },
  { id: 'default-salary', name: 'Salário', icon: '💼', color: '#34D399', type: 'income' },
  { id: 'default-freelance', name: 'Freelance', icon: '💻', color: '#38BDF8', type: 'income' },
  { id: 'default-investments', name: 'Investimentos', icon: '📈', color: '#6EE7B7', type: 'income' },
  { id: 'default-other', name: 'Outros', icon: '📦', color: '#95AA9D', type: 'both' },
];
const emptyData = (): FinanceData => ({ transactions: [], budgets: [], goals: [], accounts: [], transfers: [], recurring: [], categories: DEFAULT_CATEGORIES, recurrenceSeries: [] });

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validTransaction(row: Transaction): boolean {
  return Boolean(row && typeof row.id === 'string' && row.id && typeof row.description === 'string' && row.description.trim() && typeof row.category === 'string' && row.category.trim() && validDate(row.date)
    && (!row.dueDate || validDate(row.dueDate)) && Number.isInteger(transactionCents(row)) && transactionCents(row) > 0
    && ['income', 'expense'].includes(row.type) && ['completed', 'pending', 'cancelled', 'failed'].includes(row.status));
}
function canonicalTransaction<T extends Omit<Transaction, 'amountCents'>>(row: T): T & { amountCents: number } {
  const amountCents = moneyToCents(row.amount);
  return { ...row, amountCents, amount: centsToMoney(amountCents) };
}
function validTransfer(row: Transfer) {
  return Boolean(row?.id && validDate(row.date) && row.fromAccountId && row.toAccountId && row.fromAccountId !== row.toAccountId && Number.isFinite(row.amount) && moneyToCents(row.amount) > 0 && ['completed', 'pending'].includes(row.status));
}
function validSeries(row: RecurrenceSeries) {
  try {
    return Boolean(row?.id && row.description?.trim() && row.category?.trim() && Number.isInteger(row.amountCents) && row.amountCents > 0
      && ['income', 'expense'].includes(row.type) && ['daily', 'weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly'].includes(row.frequency)
      && validDate(row.dateStart) && (!row.dateEnd || validDate(row.dateEnd))
      && (row.repetitions === undefined || (Number.isInteger(row.repetitions) && row.repetitions > 0 && row.repetitions <= 500))
      && (Boolean(row.dateEnd) || Boolean(row.repetitions)));
  } catch { return false; }
}
function normalizeTransaction(input: Transaction): Transaction {
  const amountCents = Number.isInteger(input.amountCents) && input.amountCents! > 0 ? input.amountCents! : moneyToCents(input.amount);
  return { ...input, amountCents, amount: centsToMoney(amountCents), purchaseId: input.purchaseId ?? input.installmentGroup };
}
function mergeCategories(input: unknown): Category[] {
  const saved = Array.isArray(input) ? input.filter((item): item is Category => Boolean(item && typeof item.name === 'string' && item.name.trim() && typeof item.icon === 'string' && item.icon.trim() && ['income', 'expense', 'both'].includes(item.type))) : [];
  const result: Category[] = saved.map((item) => ({ ...item, color: /^#[0-9a-f]{6}$/i.test(item.color ?? '') ? item.color : '#6EE7B7' }));
  for (const item of DEFAULT_CATEGORIES) if (!result.some((savedItem) => savedItem.name.toLocaleLowerCase('pt-BR') === item.name.toLocaleLowerCase('pt-BR'))) result.push(item);
  return result;
}

export function normalizeFinanceData(value: unknown): FinanceData {
  const source = value && typeof value === 'object' ? value as Partial<FinanceData> : {};
  const normalizedTransactions = Array.isArray(source.transactions)
    ? source.transactions.filter((item): item is Transaction => Boolean(item && typeof item === 'object')).map(normalizeTransaction).filter(validTransaction)
    : [];
  const transactionIds = new Set<string>();
  const transactions = normalizedTransactions.filter((item) => transactionIds.has(item.id) ? false : (transactionIds.add(item.id), true));
  const rawSeries = Array.isArray(source.recurrenceSeries) ? source.recurrenceSeries.filter(validSeries) : [];
  const seriesIds = new Set<string>();
  const recurrenceSeries = rawSeries.filter((item) => seriesIds.has(item.id) ? false : (seriesIds.add(item.id), true)).map((series) => ({ ...series, initialStatus: ['completed', 'pending', 'cancelled'].includes(series.initialStatus) ? series.initialStatus : 'pending', excludedOccurrences: Array.isArray(series.excludedOccurrences) ? series.excludedOccurrences.filter(Number.isInteger) : [] }));
  const ids = new Set(transactions.map((item) => item.id));
  for (const series of recurrenceSeries) {
    const dates = generateRecurrenceDates(series);
    dates.forEach((date, occurrenceIndex) => {
      const id = `${series.id}:${occurrenceIndex}`;
      if (series.excludedOccurrences.includes(occurrenceIndex) || ids.has(id)) return;
      const dueDate = series.dueDateOffsetDays === undefined ? undefined : (() => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + series.dueDateOffsetDays!); return localDateKey(d); })();
      const row = canonicalTransaction({ id, date, dueDate, description: series.description, category: series.category, amount: centsToMoney(series.amountCents), type: series.type, status: occurrenceIndex === 0 ? series.initialStatus : 'pending', accountId: series.accountId, paymentMethod: series.paymentMethod, notes: series.notes, recurring: true, recurrenceSeriesId: series.id, occurrenceDate: date, occurrenceIndex });
      if (validTransaction(row)) { transactions.push(row); ids.add(id); }
    });
  }
  const data: FinanceData = {
    transactions,
    budgets: Array.isArray(source.budgets) ? source.budgets.filter((item): item is Budget => Boolean(item?.category?.trim() && Number.isFinite(item.limit) && item.limit > 0)) : [],
    goals: Array.isArray(source.goals) ? source.goals.filter((item): item is Goal => Boolean(item?.name?.trim() && Number.isFinite(item.current) && item.current >= 0 && Number.isFinite(item.target) && item.target > 0)) : [],
    accounts: Array.isArray(source.accounts) ? source.accounts.filter((item): item is Account => Boolean(item?.id && item.name?.trim() && Number.isFinite(item.balance) && ['corrente', 'poupanca', 'dinheiro', 'investimento', 'cartao'].includes(item.type))) : [],
    transfers: Array.isArray(source.transfers) ? source.transfers.filter(validTransfer) : [],
    recurring: Array.isArray(source.recurring) ? source.recurring.filter((item): item is Recurring => Boolean(item?.id && item.description?.trim() && Number.isFinite(item.amount) && item.amount > 0 && item.day >= 1 && item.day <= 31 && validDate(item.nextDate) && ['income', 'expense'].includes(item.type))) : [],
    categories: mergeCategories(source.categories),
    recurrenceSeries,
  };
  const referencedCategories = new Map<string, Category['type']>();
  const rememberCategory = (name: string, type: Category['type']) => {
    const previous = referencedCategories.get(name);
    referencedCategories.set(name, previous && previous !== type ? 'both' : type);
  };
  transactions.forEach((item) => rememberCategory(item.category, item.type));
  data.budgets.forEach((item) => rememberCategory(item.category, 'expense'));
  data.recurring.forEach((item) => rememberCategory(item.category, item.type));
  recurrenceSeries.forEach((item) => rememberCategory(item.category, item.type));
  for (const [name, type] of referencedCategories) {
    const existing = data.categories.find((item) => item.name === name);
    if (existing) {
      if (existing.type !== 'both' && existing.type !== type) existing.type = 'both';
    } else data.categories.push({ id: `legacy-${encodeURIComponent(name)}`, name, icon: '◦', color: '#95AA9D', type, archived: false });
  }
  return data;
}

function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function load(): FinanceData {
  const raw = readLocal(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    const normalized = normalizeFinanceData(JSON.parse(raw));
    if (JSON.stringify(normalized) !== raw) writeLocal(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch { return emptyData(); }
}
let state = load();
const listeners = new Set<() => void>();
function publish(next: FinanceData) {
  state = normalizeFinanceData(next);
  writeLocal(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}
export function useFinanceData() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => state, emptyData);
}
export function getFinanceSnapshot() { return state; }
export function addTransaction(input: TransactionDraft) {
  const row = canonicalTransaction({ ...input, id: crypto.randomUUID() });
  if (!validTransaction(row)) throw new Error('Informe os dados obrigatórios e um valor maior que zero.');
  publish({ ...state, transactions: [row, ...state.transactions] });
  return row;
}
export function addTransactions(inputs: TransactionDraft[]) {
  const rows = inputs.map((input) => canonicalTransaction({ ...input, id: crypto.randomUUID() }));
  if (!rows.length || !rows.every(validTransaction)) throw new Error('Confira os dados das transações.');
  publish({ ...state, transactions: [...rows, ...state.transactions] });
  return rows;
}
export function addInstallmentPurchase(input: TransactionDraft, count: number) {
  const totalCents = moneyToCents(input.amount);
  const parts = splitCents(totalCents, count);
  const purchaseId = crypto.randomUUID();
  const start = new Date(`${input.date}T00:00:00`);
  const rows = parts.map((part, index) => {
    const date = new Date(start);
    date.setDate(1);
    date.setMonth(date.getMonth() + index);
    date.setDate(Math.min(start.getDate(), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    const movementDate = localDateKey(date);
    return canonicalTransaction({ ...input, id: `${purchaseId}:${index + 1}`, date: movementDate, dueDate: input.dueDate ? shiftDate(input.dueDate, index) : undefined,
      amount: centsToMoney(part), status: index === 0 ? input.status : 'pending', installmentGroup: purchaseId, purchaseId, purchaseTotalCents: totalCents, installmentNumber: index + 1, installmentCount: count });
  });
  if (!rows.every(validTransaction)) throw new Error('Não foi possível validar as parcelas.');
  publish({ ...state, transactions: [...rows, ...state.transactions] });
  return rows;
}
function shiftDate(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const moved = new Date(year, month - 1 + months, 1);
  moved.setDate(Math.min(day, new Date(moved.getFullYear(), moved.getMonth() + 1, 0).getDate()));
  return localDateKey(moved);
}
function shiftDays(dateKey: string, days: number) { const date = new Date(`${dateKey}T00:00:00`); date.setDate(date.getDate() + days); return localDateKey(date); }
export function updateTransaction(id: string, input: Omit<Transaction, 'id' | 'amountCents'>) {
  const old = state.transactions.find((row) => row.id === id);
  if (!old) throw new Error('Transação não encontrada.');
  const row = canonicalTransaction({ ...old, ...input, id, amount: input.amount });
  if (!validTransaction(row)) throw new Error('Informe os dados obrigatórios e um valor maior que zero.');
  publish({ ...state, transactions: state.transactions.map((item) => item.id === id ? row : item) });
  return row;
}
export function updateTransactionScope(id: string, input: TransactionDraft, scope: SeriesScope) {
  const selected = state.transactions.find((row) => row.id === id);
  if (!selected) throw new Error('Transação não encontrada.');
  if (!selected.recurrenceSeriesId || scope === 'occurrence') return updateTransaction(id, input);
  const dueOffset = input.dueDate ? Math.round((new Date(`${input.dueDate}T00:00:00`).getTime() - new Date(`${input.date}T00:00:00`).getTime()) / 86400000) : undefined;
  const targetRows = state.transactions.filter((row) => row.recurrenceSeriesId === selected.recurrenceSeriesId && (scope === 'series' || (row.occurrenceIndex ?? 0) >= (selected.occurrenceIndex ?? 0)));
  const updated = targetRows.map((row) => canonicalTransaction({ ...row, description: input.description, category: input.category, amount: input.amount,
    type: input.type, status: row.status === 'cancelled' ? 'cancelled' : input.status, accountId: input.accountId, paymentMethod: input.paymentMethod, notes: input.notes,
    dueDate: dueOffset === undefined ? undefined : shiftDays(row.date, dueOffset), date: row.date }));
  const series = state.recurrenceSeries.map((row) => row.id === selected.recurrenceSeriesId ? { ...row, description: input.description, category: input.category,
    amount: centsToMoney(moneyToCents(input.amount)), amountCents: moneyToCents(input.amount), type: input.type, accountId: input.accountId, paymentMethod: input.paymentMethod, notes: input.notes, dueDateOffsetDays: dueOffset, initialStatus: input.status } : row);
  publish({ ...state, recurrenceSeries: series, transactions: state.transactions.map((row) => updated.find((item) => item.id === row.id) ?? row) });
  return updated;
}
export function duplicateTransactionDraft(id: string): TransactionDraft {
  const source = state.transactions.find((row) => row.id === id);
  if (!source) throw new Error('Transação não encontrada.');
  const { id: _id, amountCents: _cents, recurrenceSeriesId: _series, occurrenceDate: _occurrence, occurrenceIndex: _index,
    installmentGroup: _group, purchaseId: _purchase, installmentNumber: _number, installmentCount: _count, recurring: _recurring, ...draft } = source;
  return { ...draft, description: `${source.description} (cópia)`, date: localDateKey(new Date()), dueDate: undefined, status: 'pending' };
}
export function duplicateTransaction(id: string) { return addTransaction(duplicateTransactionDraft(id)); }
export function updateTransactionsStatus(ids: string[], status: TransactionStatus, date = localDateKey(new Date())) {
  const selected = new Set(ids);
  publish({ ...state, transactions: state.transactions.map((row) => selected.has(row.id) ? { ...row, status, ...(status === 'completed' && row.date > date ? { date } : {}) } : row) });
}
export function deleteTransaction(id: string) { deleteTransactions([id]); }
export function deleteTransactions(ids: string[]) {
  const selected = new Set(ids);
  const deleted = state.transactions.filter((row) => selected.has(row.id));
  const series = state.recurrenceSeries.map((item) => ({ ...item, excludedOccurrences: [...new Set([...item.excludedOccurrences, ...deleted.filter((row) => row.recurrenceSeriesId === item.id).map((row) => row.occurrenceIndex ?? 0)])] }));
  publish({ ...state, recurrenceSeries: series, transactions: state.transactions.flatMap((row) => {
    if (!selected.has(row.id)) return [row];
    if (row.installmentGroup || row.purchaseId) return [{ ...row, status: 'cancelled' as const }];
    return [];
  }) });
}
export function addRecurringSeries(input: Omit<RecurrenceSeries, 'id' | 'amountCents' | 'excludedOccurrences' | 'initialStatus'>, initialStatus: TransactionStatus = 'pending') {
  const amountCents = moneyToCents(input.amount);
  const series: RecurrenceSeries = { ...input, id: crypto.randomUUID(), amount: centsToMoney(amountCents), amountCents, initialStatus, excludedOccurrences: [] };
  if (!validSeries(series)) throw new Error('Confira a frequência, o intervalo e a repetição da série.');
  const dates = generateRecurrenceDates(series);
  const dueDateOffsetDays = input.dueDateOffsetDays;
  const transactions = dates.map((date, occurrenceIndex) => {
    const dueDate = dueDateOffsetDays === undefined ? undefined : (() => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + dueDateOffsetDays); return localDateKey(d); })();
    return canonicalTransaction({ id: `${series.id}:${occurrenceIndex}`, date, dueDate, description: series.description, category: series.category,
      amount: series.amount, type: series.type, status: occurrenceIndex === 0 ? initialStatus : 'pending', accountId: series.accountId,
      paymentMethod: series.paymentMethod, notes: series.notes, recurring: true, recurrenceSeriesId: series.id, occurrenceDate: date, occurrenceIndex });
  });
  publish({ ...state, recurrenceSeries: [...state.recurrenceSeries, series], transactions: [...transactions, ...state.transactions] });
  return series;
}
export function replaceTransactions(transactions: Transaction[]) {
  const rows = transactions.map(normalizeTransaction);
  if (!rows.every(validTransaction)) throw new Error('O arquivo contém transações inválidas.');
  publish({ ...state, transactions: [...rows, ...state.transactions] });
}
export function importTransactions(transactions: Transaction[], categories: Category[] = []) {
  const rows = transactions.map(normalizeTransaction);
  if (!rows.length || !rows.every(validTransaction)) throw new Error('O arquivo contém transações inválidas ou está vazio.');
  publish({ ...state, categories: mergeCategories([...state.categories, ...categories]), transactions: [...rows, ...state.transactions] });
}
export function addBudget(category: string, limit: number) { if (!category.trim() || !Number.isFinite(limit) || limit <= 0) throw new Error('Informe uma categoria e um limite maior que zero.'); publish({ ...state, budgets: [...state.budgets.filter((item) => item.category !== category.trim()), { category: category.trim(), limit }] }); }
export function addGoal(name: string, current: number, target: number, deadline?: string) { if (!name.trim() || !Number.isFinite(current) || current < 0 || !Number.isFinite(target) || target <= 0 || (deadline && !validDate(deadline))) throw new Error('Informe valores válidos para a meta.'); publish({ ...state, goals: [...state.goals.filter((item) => item.name !== name.trim()), { name: name.trim(), current, target, color: 'brand.400', deadline: deadline || undefined }] }); }
export function addAccount(name: string, type: Account['type'], balance: number, card?: { creditLimit: number; closingDay: number; dueDay: number }) { if (!name.trim() || !Number.isFinite(balance)) throw new Error('Informe nome e saldo válidos.'); if (type === 'cartao' && (!card || !Number.isFinite(card.creditLimit) || card.creditLimit <= 0 || card.closingDay < 1 || card.closingDay > 31 || card.dueDay < 1 || card.dueDay > 31)) throw new Error('Informe limite, fechamento e vencimento válidos para o cartão.'); publish({ ...state, accounts: [...state.accounts, { id: crypto.randomUUID(), name: name.trim(), type, balance, ...(type === 'cartao' ? card : {}) }] }); }
export function addTransfer(input: Omit<Transfer, 'id'>) { if (!validTransfer({ ...input, id: 'validation' })) throw new Error('Informe contas diferentes e um valor válido para a transferência.'); const from = state.accounts.find((account) => account.id === input.fromAccountId), to = state.accounts.find((account) => account.id === input.toAccountId); if (!from || !to || from.type === 'cartao') throw new Error('A origem deve ser uma conta ou carteira válida.'); publish({ ...state, transfers: [{ ...input, id: crypto.randomUUID() }, ...state.transfers] }); }
export function getAccountBalance(account: Account, transactions = state.transactions, transfers = state.transfers) {
  if (account.type === 'cartao') {
    const charges = transactions.filter((item) => item.accountId === account.id && item.type === 'expense' && ['completed', 'pending'].includes(item.status)).reduce((sum, item) => sum + transactionCents(item), 0);
    const payments = transfers.filter((item) => item.toAccountId === account.id && item.status === 'completed').reduce((sum, item) => sum + moneyToCents(item.amount), 0);
    return centsToMoney(Math.max(0, charges - payments));
  }
  const transactionNet = transactions.filter((item) => item.accountId === account.id && item.status === 'completed').reduce((sum, item) => sum + (item.type === 'income' ? transactionCents(item) : -transactionCents(item)), 0);
  const transferNet = transfers.filter((item) => item.status === 'completed').reduce((sum, item) => sum + (item.toAccountId === account.id ? moneyToCents(item.amount) : item.fromAccountId === account.id ? -moneyToCents(item.amount) : 0), 0);
  return centsToMoney(moneyToCents(account.balance) + transactionNet + transferNet);
}
export function addRecurring(input: Omit<Recurring, 'id'>) { if (!input.description.trim() || !Number.isFinite(input.amount) || input.amount <= 0 || input.day < 1 || input.day > 31) throw new Error('Confira os dados da recorrência.'); publish({ ...state, recurring: [...state.recurring, { ...input, frequency: input.frequency ?? 'monthly', id: crypto.randomUUID() }] }); }
export function addCategory(name: string, icon: string, type: Category['type'], color = '#6EE7B7') {
  const clean = name.trim();
  if (!clean || !icon.trim() || !/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Informe nome, ícone e cor válidos para a categoria.');
  if (state.categories.some((item) => item.name.toLocaleLowerCase('pt-BR') === clean.toLocaleLowerCase('pt-BR'))) throw new Error('Já existe uma categoria com esse nome.');
  const category: Category = { id: crypto.randomUUID(), name: clean, icon: icon.trim(), color, type, archived: false };
  publish({ ...state, categories: [...state.categories, category] });
  return category;
}
export function updateCategory(oldName: string, update: Pick<Category, 'name' | 'icon' | 'color' | 'type'>) {
  const clean = update.name.trim();
  if (!clean || !update.icon.trim() || !/^#[0-9a-f]{6}$/i.test(update.color ?? '')) throw new Error('Informe nome, ícone e cor válidos para a categoria.');
  if (oldName.toLocaleLowerCase('pt-BR') !== clean.toLocaleLowerCase('pt-BR') && state.categories.some((item) => item.name.toLocaleLowerCase('pt-BR') === clean.toLocaleLowerCase('pt-BR'))) throw new Error('Já existe uma categoria com esse nome.');
  publish({ ...state, categories: state.categories.map((item) => item.name === oldName ? { ...item, ...update, name: clean } : item),
    transactions: state.transactions.map((item) => item.category === oldName ? { ...item, category: clean } : item),
    budgets: state.budgets.map((item) => item.category === oldName ? { ...item, category: clean } : item),
    recurring: state.recurring.map((item) => item.category === oldName ? { ...item, category: clean } : item),
    recurrenceSeries: state.recurrenceSeries.map((item) => item.category === oldName ? { ...item, category: clean } : item) });
}
export function archiveCategory(name: string, archived = true) { publish({ ...state, categories: state.categories.map((item) => item.name === name ? { ...item, archived } : item) }); }
export function deleteCategory(name: string) {
  const inUse = state.transactions.some((item) => item.category === name) || state.budgets.some((item) => item.category === name) || state.recurring.some((item) => item.category === name) || state.recurrenceSeries.some((item) => item.category === name);
  if (inUse) throw new Error('Esta categoria está vinculada a lançamentos ou planejamento. Arquive-a para preservar o histórico.');
  publish({ ...state, categories: state.categories.filter((item) => item.name !== name) });
}
export function exportBackup() { return JSON.stringify({ schemaVersion: 3, exportedAt: new Date().toISOString(), ...state }, null, 2); }
export function restoreBackup(raw: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('O arquivo não contém um JSON válido.'); }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Partial<FinanceData>).transactions)) throw new Error('Backup inválido: a lista de transações não foi encontrada.');
  const source = parsed as Partial<FinanceData>, restored = normalizeFinanceData(parsed);
  const lists: Array<[keyof FinanceData, unknown[] | undefined, unknown[]]> = [
    ['transactions', source.transactions, restored.transactions], ['budgets', source.budgets, restored.budgets], ['goals', source.goals, restored.goals],
    ['accounts', source.accounts, restored.accounts], ['transfers', source.transfers, restored.transfers], ['recurring', source.recurring, restored.recurring],
    ['categories', source.categories, restored.categories], ['recurrenceSeries', source.recurrenceSeries, restored.recurrenceSeries],
  ];
  for (const [name, input, normalized] of lists) if (input !== undefined && (!Array.isArray(input) || input.length !== normalized.length)) throw new Error(`Backup inválido: confira a lista “${name}”. Nenhum dado foi alterado.`);
  publish(restored);
}
export function getTotals(transactions = state.transactions) { const totals = completedTotals(transactions); return { income: totals.income, expense: totals.expense }; }
export function getMonthKey(date: string) { return date.slice(0, 7); }
export function currency(value: number) {
  if (readLocal('finance-privacy') === 'true') return '••••••';
  const cents = moneyToCents(Number.isFinite(value) ? value : 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centsToMoney(cents));
}

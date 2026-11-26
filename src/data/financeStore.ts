import { useSyncExternalStore } from 'react';

export type TransactionType = 'income' | 'expense';
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  status: 'completed' | 'pending' | 'failed';
}
export interface Budget { category: string; limit: number }
export interface Goal { name: string; current: number; target: number; color: string }
interface FinanceData { transactions: Transaction[]; budgets: Budget[]; goals: Goal[] }
const STORAGE_KEY = 'finance-dashboard-data-v1';
const initial: FinanceData = { transactions: [], budgets: [], goals: [] };
let state = load();
const listeners = new Set<() => void>();

function load(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<FinanceData>;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions.filter(validTransaction) : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets.filter((x) => Number.isFinite(x.limit) && x.limit >= 0) : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals.filter((x) => Number.isFinite(x.current) && Number.isFinite(x.target) && x.current >= 0 && x.target > 0) : [],
    };
  } catch { return initial; }
}
function validTransaction(x: Transaction) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(x?.date ?? '') ? new Date(`${x.date}T00:00:00Z`) : null;
  const validDate = date !== null && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === x.date;
  return Boolean(x && x.id && x.description?.trim() && x.category?.trim() && validDate && Number.isFinite(x.amount) && x.amount > 0 && ['income', 'expense'].includes(x.type) && ['completed', 'pending', 'failed'].includes(x.status));
}
function publish(next: FinanceData) {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage can be unavailable in private browsing. */ }
  listeners.forEach((listener) => listener());
}
export function useFinanceData() { return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => state, () => initial); }
export function addTransaction(input: Omit<Transaction, 'id'>) {
  if (!validTransaction({ ...input, id: 'validation' })) throw new Error('Informe uma transação válida com valor maior que zero.');
  publish({ ...state, transactions: [{ ...input, id: crypto.randomUUID() }, ...state.transactions] });
}
export function replaceTransactions(transactions: Transaction[]) { publish({ ...state, transactions }); }
export function updateTransaction(id: string, input: Omit<Transaction, 'id'>) {
  if (!validTransaction({ ...input, id })) throw new Error('Informe uma transação válida com valor maior que zero.');
  publish({ ...state, transactions: state.transactions.map((item) => item.id === id ? { ...input, id } : item) });
}
export function deleteTransaction(id: string) {
  publish({ ...state, transactions: state.transactions.filter((item) => item.id !== id) });
}
export function addBudget(category: string, limit: number) {
  if (!category.trim() || !Number.isFinite(limit) || limit <= 0) throw new Error('Informe uma categoria e um limite maior que zero.');
  publish({ ...state, budgets: [...state.budgets.filter((item) => item.category !== category.trim()), { category: category.trim(), limit }] });
}
export function addGoal(name: string, current: number, target: number) {
  if (!name.trim() || !Number.isFinite(current) || current < 0 || !Number.isFinite(target) || target <= 0) throw new Error('Informe um nome, um valor guardado válido e uma meta maior que zero.');
  publish({ ...state, goals: [...state.goals.filter((item) => item.name !== name.trim()), { name: name.trim(), current, target, color: 'brand.400' }] });
}
export function getTotals(transactions = state.transactions) {
  return transactions.reduce((total, item) => {
    if (item.status !== 'completed') return total;
    total[item.type] += item.amount;
    return total;
  }, { income: 0, expense: 0 });
}
export function getMonthKey(date: string) { return date.slice(0, 7); }
export function currency(value: number) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(value) ? value : 0); }

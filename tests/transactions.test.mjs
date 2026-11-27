import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  advanceRecurrenceDate, completedTotals, filterAndSortTransactions, generateRecurrenceDates,
  moneyToCents, splitCents,
} from '../src/data/transactionDomain.ts';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};
globalThis.crypto ??= webcrypto;

let store;
before(async () => { store = await import('../src/data/financeStore.ts'); });

function reset(legacy = {}) {
  values.set(store.STORAGE_KEY, JSON.stringify(legacy));
  store.restoreBackup(JSON.stringify({ transactions: [], ...legacy }));
}
const draft = (overrides = {}) => ({
  date: '2026-01-31', description: 'Mercado', category: 'Alimentação', amount: 10.01,
  type: 'expense', status: 'completed', ...overrides,
});

test('centavos e parcelamento fecham exatamente com distribuição do resto', () => {
  assert.equal(moneyToCents('R$ 10,01'), 1001);
  const parts = splitCents(1001, 3);
  assert.deepEqual(parts, [334, 334, 333]);
  assert.equal(parts.reduce((total, value) => total + value, 0), 1001);
  assert.throws(() => splitCents(100, 61));
});

test('CRUD, duplicação e persistência mantêm os valores em centavos', () => {
  reset();
  const created = store.addTransaction(draft());
  assert.equal(created.amountCents, 1001);
  const updated = store.updateTransaction(created.id, { ...created, description: 'Mercado atualizado', amount: 20.25 });
  assert.equal(updated.amountCents, 2025);
  const duplicate = store.addTransaction(store.duplicateTransactionDraft(updated.id));
  assert.match(duplicate.description, /cópia/);
  assert.equal(JSON.parse(values.get(store.STORAGE_KEY)).transactions.length, 2);
  store.deleteTransaction(updated.id);
  assert.equal(store.getFinanceSnapshot().transactions.length, 1);
});

test('parcelas usam datas de calendário, preservam o total e cancelam sem apagar histórico', () => {
  reset();
  const installments = store.addInstallmentPurchase(draft({ amount: 10.01, status: 'pending' }), 3);
  assert.deepEqual(installments.map((item) => item.date), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.equal(installments.reduce((sum, item) => sum + item.amountCents, 0), 1001);
  assert.ok(installments.every((item) => item.purchaseId === installments[0].purchaseId));
  store.deleteTransaction(installments[0].id);
  assert.equal(store.getFinanceSnapshot().transactions[0].status, 'cancelled');
});

test('recorrência trata meses curtos e ano bissexto sem duplicar ao normalizar novamente', () => {
  const dates = generateRecurrenceDates({ dateStart: '2024-01-31', frequency: 'monthly', repetitions: 3 });
  assert.deepEqual(dates, ['2024-01-31', '2024-02-29', '2024-03-31']);
  const leapYearResult = advanceRecurrenceDate(new Date(2024, 1, 29), 1, 'yearly');
  assert.equal(`${leapYearResult.getFullYear()}-${String(leapYearResult.getMonth() + 1).padStart(2, '0')}-${String(leapYearResult.getDate()).padStart(2, '0')}`, '2025-02-28');
  reset();
  const series = store.addRecurringSeries({ ...draft({ status: undefined }), frequency: 'monthly', dateStart: '2024-01-31', repetitions: 3 });
  const once = store.getFinanceSnapshot();
  const twice = store.normalizeFinanceData(once);
  assert.equal(once.transactions.length, 3);
  assert.equal(twice.transactions.length, 3);
  assert.equal(series.frequency, 'monthly');
});

test('status, filtros e ordenação excluem canceladas dos totais realizados', () => {
  reset();
  const rows = store.addTransactions([
    draft({ description: 'Z mercado', amount: 30, status: 'completed', date: '2026-02-02' }),
    draft({ description: 'A conta', amount: 12, status: 'pending', date: '2026-02-01', dueDate: '2026-02-10' }),
    draft({ description: 'Cancelada', amount: 90, status: 'cancelled', date: '2026-02-03' }),
  ]);
  assert.deepEqual(completedTotals(rows).expenseCents, 3000);
  store.updateTransactionsStatus([rows[1].id], 'completed');
  assert.equal(store.getTotals().expense, 42);
  const result = filterAndSortTransactions(store.getFinanceSnapshot().transactions, { status: 'completed', from: '2026-02-01', to: '2026-02-28' }, 'description', 'asc');
  assert.deepEqual(result.map((row) => row.description), ['A conta', 'Z mercado']);
});

test('migração preserva categorias customizadas e converte valores decimais antigos', () => {
  const migrated = store.normalizeFinanceData({
    transactions: [{ id: 'legacy', date: '2025-03-01', description: 'Legado', category: 'Personalizada', amount: 12.34, type: 'expense', status: 'completed' }],
    categories: [{ name: 'Personalizada', icon: '✨', type: 'expense' }],
  });
  assert.equal(migrated.transactions[0].amountCents, 1234);
  assert.ok(migrated.categories.some((item) => item.name === 'Personalizada'));
  assert.ok(migrated.categories.some((item) => item.name === 'Alimentação'));
  const withoutLegacyCategory = store.normalizeFinanceData({ transactions: [{ id: 'old', date: '2025-03-01', description: 'Legado', category: 'Categoria antiga', amount: 1, type: 'income', status: 'completed' }] });
  assert.ok(withoutLegacyCategory.categories.some((item) => item.name === 'Categoria antiga' && item.type === 'income'));
});

test('transferências afetam saldos das contas sem entrar nos totais de receita e despesa', () => {
  reset();
  store.addAccount('Corrente', 'corrente', 100);
  store.addAccount('Poupança', 'poupanca', 0);
  const [from, to] = store.getFinanceSnapshot().accounts;
  store.addTransfer({ date: '2026-03-01', fromAccountId: from.id, toAccountId: to.id, amount: 25, status: 'completed' });
  assert.equal(store.getAccountBalance(from), 75);
  assert.equal(store.getAccountBalance(to), 25);
  assert.deepEqual(store.getTotals(), { income: 0, expense: 0 });
});

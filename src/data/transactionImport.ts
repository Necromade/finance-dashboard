import type { Account, Category, Transaction, TransactionStatus, TransactionType } from './financeStore';
import { moneyToCents } from './transactionDomain';

export interface ParsedTransactions { transactions: Transaction[]; categories: Category[] }
export interface TransactionImportAdapter {
  extensions: string[];
  parse(content: string, accounts: Account[]): ParsedTransactions;
}

function splitRow(line: string, delimiter: string): string[] {
  const cells: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell);
  return cells;
}
function parseAmount(raw: string): number {
  let value = raw.trim().replace(/[R$\s]/g, '');
  if (value.includes(',') && value.includes('.')) value = value.lastIndexOf(',') > value.lastIndexOf('.') ? value.replace(/\./g, '').replace(',', '.') : value.replace(/,/g, '');
  else if (value.includes(',')) value = value.replace(',', '.');
  return Number(value);
}
function parseDate(raw: string): string {
  const value = raw.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return `${value.slice(6)}-${value.slice(3, 5)}-${value.slice(0, 2)}`;
  return value;
}
const truthy = (value: string | undefined) => ['sim', 'true', '1', 'yes'].includes((value ?? '').trim().toLowerCase());

export const csvTransactionAdapter: TransactionImportAdapter = {
  extensions: ['csv'],
  parse(content, accounts) {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('O CSV precisa conter cabeçalho e ao menos uma transação.');
    const first = lines.shift()!;
    const delimiter = (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ';' : ',';
    const normalizeHeader = (header: string) => header.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const headers = splitRow(first, delimiter).map(normalizeHeader);
    const column = (...names: string[]) => headers.findIndex((header) => names.some((name) => normalizeHeader(name) === header));
    const date = column('data', 'date'), description = column('descrição', 'descricao', 'description'), category = column('categoria', 'category'), type = column('tipo', 'type'), amount = column('valor', 'amount');
    if ([date, description, category, type, amount].some((index) => index < 0)) throw new Error('Cabeçalhos ausentes. Use Data, Descrição, Categoria, Tipo e Valor.');
    const status = column('status'), account = column('conta', 'account'), icon = column('ícone categoria', 'icone categoria', 'category icon'), recurring = column('recorrente', 'recurring'), group = column('grupo parcelas', 'installment group'), installment = column('parcela', 'installment number'), installmentCount = column('total parcelas', 'installment count'), dueDate = column('vencimento', 'due date'), paymentMethod = column('forma de pagamento', 'payment method'), notes = column('observa??es', 'observacoes', 'notes'), centsColumn = column('valor em centavos', 'amount cents');
    const categoryMap = new Map<string, Category>();
    const parsed = lines.map((line, index) => {
      const cells = splitRow(line, delimiter); const value = (index: number) => index < 0 ? undefined : cells[index];
      const rawType = value(type)?.trim().toLowerCase();
      if (!['income', 'receita', 'entrada', 'expense', 'despesa', 'saída', 'saida'].includes(rawType ?? '')) throw new Error(`Tipo inválido na linha ${index + 2}.`);
      const rawStatus = value(status)?.trim().toLowerCase();
      const transactionStatus: TransactionStatus = ['pending', 'pendente'].includes(rawStatus ?? '') ? 'pending' : ['cancelled', 'cancelada'].includes(rawStatus ?? '') ? 'cancelled' : rawStatus?.startsWith('failed') || rawStatus?.startsWith('falhou') ? 'failed' : 'completed';
      const accountName = value(account)?.trim().toLocaleLowerCase('pt-BR');
      const matchedAccount = accounts.find((item) => item.name.toLocaleLowerCase('pt-BR') === accountName);
      const categoryName = value(category)?.trim() ?? '';
      const categoryIcon = value(icon)?.trim() || '📦';
      if (categoryName) categoryMap.set(categoryName.toLocaleLowerCase('pt-BR'), { name: categoryName, icon: categoryIcon, type: 'both' });
      const numericInstallment = Number(value(installment)); const numericCount = Number(value(installmentCount));
      const parsedAmount = parseAmount(value(amount) ?? ''), explicitCents = Number(value(centsColumn));
      const amountCents = Number.isInteger(explicitCents) && explicitCents > 0 ? explicitCents : moneyToCents(parsedAmount);
      return {
        id: crypto.randomUUID(), date: parseDate(value(date) ?? ''), description: value(description)?.trim() ?? '', category: categoryName,
        dueDate: parseDate(value(dueDate) ?? '') || undefined, amount: amountCents / 100, amountCents, type: (['income', 'receita', 'entrada'].includes(rawType ?? '') ? 'income' : 'expense') as TransactionType,
        status: transactionStatus, accountId: matchedAccount?.id, recurring: truthy(value(recurring)) || undefined, paymentMethod: value(paymentMethod)?.trim() || undefined, notes: value(notes)?.trim() || undefined,
        installmentGroup: value(group)?.trim() || undefined, installmentNumber: Number.isInteger(numericInstallment) && numericInstallment > 0 ? numericInstallment : undefined,
        installmentCount: Number.isInteger(numericCount) && numericCount > 0 ? numericCount : undefined,
      };
    });
    const groupTotals = parsed.reduce<Record<string, number>>((totals, item) => { if (item.installmentGroup) totals[item.installmentGroup] = (totals[item.installmentGroup] ?? 0) + (item.amountCents ?? moneyToCents(item.amount)); return totals; }, {});
    return { transactions: parsed.map((item) => item.installmentGroup ? { ...item, purchaseId: item.installmentGroup, purchaseTotalCents: groupTotals[item.installmentGroup] } : item), categories: [...categoryMap.values()] };
  },
};

const importAdapters: TransactionImportAdapter[] = [csvTransactionAdapter];
export function parseTransactionFile(fileName: string, content: string, accounts: Account[]): ParsedTransactions {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const adapter = importAdapters.find((candidate) => candidate.extensions.includes(extension));
  if (!adapter) throw new Error(extension === 'ofx' ? 'A leitura de OFX ainda não está disponível.' : 'Formato de arquivo não suportado.');
  return adapter.parse(content, accounts);
}

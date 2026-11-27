import { useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Box, Button, ButtonGroup, Divider, FormControl, FormLabel,
  Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, Select, SimpleGrid, Text, Textarea, VStack,
} from '@chakra-ui/react';
import { FiArrowDownRight, FiArrowUpRight, FiRepeat } from 'react-icons/fi';
import {
  addInstallmentPurchase, addRecurringSeries, addTransaction, currency, updateTransactionScope,
  updateTransaction, type Account, type Category, type RecurrenceFrequency, type SeriesScope,
  type Transaction, type TransactionDraft, type TransactionStatus, type TransactionType,
} from '../../data/financeStore';
import { moneyToCents, splitCents } from '../../data/transactionDomain';

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const frequencies: Array<[RecurrenceFrequency, string]> = [
  ['daily', 'Diária'], ['weekly', 'Semanal'], ['fortnightly', 'Quinzenal'], ['monthly', 'Mensal'],
  ['bimonthly', 'Bimestral'], ['quarterly', 'Trimestral'], ['semiannual', 'Semestral'], ['yearly', 'Anual'],
];
const paymentMethods: Record<TransactionType, Array<[string, string]>> = {
  expense: [['pix', 'Pix'], ['debit', 'Débito'], ['credit', 'Crédito'], ['cash', 'Dinheiro'], ['boleto', 'Boleto'], ['transfer', 'Transferência'], ['other', 'Outra']],
  income: [['transfer', 'Transferência'], ['pix', 'Pix'], ['cash', 'Dinheiro'], ['other', 'Outra']],
};

interface Props { isOpen: boolean; onClose: () => void; onSaved: (message: string) => void; editing: Transaction | null; prefill?: TransactionDraft | null; categories: Category[]; accounts: Account[]; }
export default function TransactionFormModal({ isOpen, onClose, onSaved, editing, prefill, categories, accounts }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'once' | 'recurring' | 'installments'>('once');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [dateEnd, setDateEnd] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [installmentCount, setInstallmentCount] = useState('3');
  const [scope, setScope] = useState<SeriesScope>('occurrence');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initial = editing ?? prefill;
    setType(initial?.type ?? 'expense');
    setStatus(initial?.status === 'failed' ? 'pending' : initial?.status ?? 'pending');
    setDescription(initial?.description ?? '');
    setAmount(initial ? (editing?.amountCents ?? moneyToCents(initial.amount)) / 100 + '' : '');
    setCategory(initial?.category ?? categories.find((item) => !item.archived && item.type !== 'income')?.name ?? '');
    setDate(initial?.date ?? today());
    setDueDate(initial?.dueDate ?? '');
    setAccountId(initial?.accountId ?? '');
    setPaymentMethod(initial?.paymentMethod ?? '');
    setNotes(initial?.notes ?? '');
    setMode('once'); setFrequency('monthly'); setDateEnd(''); setRepetitions(''); setInstallmentCount('3'); setScope('occurrence'); setError('');
  }, [isOpen, editing, prefill, categories]);

  const activeCategories = useMemo(() => categories.filter((item) => !item.archived && (item.type === type || item.type === 'both')), [categories, type]);
  const installmentParts = useMemo(() => {
    const cents = moneyToCents(amount);
    const count = Number(installmentCount);
    try { return count > 1 && Number.isInteger(cents) ? splitCents(cents, count) : []; } catch { return []; }
  }, [amount, installmentCount]);
  const editingSeries = Boolean(editing?.recurrenceSeriesId);
  const editingInstallment = Boolean(editing?.installmentGroup || editing?.purchaseId);
  const paymentLabel = type === 'expense' ? 'Forma de pagamento' : 'Forma de recebimento';

  const changeType = (next: TransactionType) => {
    setType(next);
    if (next === 'income' && accounts.some((account) => account.id === accountId && account.type === 'cartao')) setAccountId('');
    if (!categories.some((item) => item.name === category && (item.type === next || item.type === 'both') && !item.archived)) setCategory('');
  };

  const previewDate = (index: number) => {
    const start = new Date(`${date}T00:00:00`);
    const day = start.getDate();
    const next = new Date(start.getFullYear(), start.getMonth() + index, 1);
    next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    return next.toLocaleDateString('pt-BR');
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountCents = moneyToCents(amount);
    if (!description.trim() || !category || !Number.isInteger(amountCents) || amountCents < 1 || !date) {
      setError('Preencha descrição, categoria, data e um valor válido maior que zero.'); return;
    }
    if (dueDate && dueDate < date && status === 'pending') { setError('O vencimento de um lançamento pendente deve ser igual ou posterior à data da movimentação.'); return; }
    if (mode === 'installments' && (type !== 'expense' || !Number.isInteger(Number(installmentCount)) || Number(installmentCount) < 2 || Number(installmentCount) > 60)) {
      setError('Parcelamentos estão disponíveis para despesas de 2 a 60 vezes.'); return;
    }
    if (mode === 'recurring' && !editing) {
      const count = repetitions.trim() ? Number(repetitions) : undefined;
      if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > 500)) { setError('Informe de 1 a 500 repetições.'); return; }
      if (!dateEnd && count === undefined) { setError('Informe a quantidade de repetições ou uma data final.'); return; }
    }
    const draft: TransactionDraft = { description: description.trim(), amount: amountCents / 100, type, category, date,
      dueDate: dueDate || undefined, status, accountId: accountId || undefined, paymentMethod: paymentMethod || undefined, notes: notes.trim() || undefined };
    try {
      if (editing) {
        if (editingSeries) updateTransactionScope(editing.id, draft, scope);
        else updateTransaction(editing.id, draft);
      } else if (mode === 'installments') {
        addInstallmentPurchase(draft, Number(installmentCount));
      } else if (mode === 'recurring') {
        const offset = dueDate ? Math.round((new Date(`${dueDate}T00:00:00`).getTime() - new Date(`${date}T00:00:00`).getTime()) / 86400000) : undefined;
        addRecurringSeries({ ...draft, frequency, dateStart: date, dateEnd: dateEnd || undefined, repetitions: repetitions.trim() ? Number(repetitions) : undefined, dueDateOffsetDays: offset }, status);
      } else addTransaction(draft);
      onSaved(editing ? 'Transação atualizada.' : mode === 'recurring' ? 'Série recorrente criada sem duplicar ocorrências.' : mode === 'installments' ? 'Compra parcelada registrada.' : prefill ? 'Transação duplicada.' : 'Transação adicionada.');
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a transação.'); }
  };

  return <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl" scrollBehavior="inside">
    <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
    <ModalContent as="form" onSubmit={submit} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" maxH="92dvh">
      <ModalHeader pb={3}><Text color="brand.300" fontSize="xs" letterSpacing=".12em" textTransform="uppercase">{editing ? 'Editar movimentação' : prefill ? 'Duplicar movimentação' : 'Nova movimentação'}</Text><Text mt={1} fontSize="xl">{editing?.description ?? prefill?.description ?? 'Registre uma transação'}</Text></ModalHeader>
      <ModalCloseButton aria-label="Fechar formulário de transação" />
      <ModalBody><VStack align="stretch" spacing={5}>
        <ButtonGroup isAttached alignSelf="start">
          <Button type="button" leftIcon={<FiArrowUpRight />} colorScheme={type === 'income' ? 'green' : 'gray'} variant={type === 'income' ? 'solid' : 'outline'} aria-pressed={type === 'income'} onClick={() => changeType('income')}>Receita</Button>
          <Button type="button" leftIcon={<FiArrowDownRight />} colorScheme={type === 'expense' ? 'red' : 'gray'} variant={type === 'expense' ? 'solid' : 'outline'} aria-pressed={type === 'expense'} onClick={() => changeType('expense')}>Despesa</Button>
        </ButtonGroup>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl isRequired><FormLabel>Descrição</FormLabel><Input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} maxLength={100} placeholder="Ex.: compra no mercado" /></FormControl>
          <FormControl isRequired><FormLabel>{mode === 'installments' ? 'Valor total da compra (R$)' : 'Valor (R$)'}</FormLabel><Input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} isDisabled={editingInstallment} aria-describedby={editingInstallment ? 'installment-amount-help' : undefined} placeholder="0,00" />{editingInstallment && <Text id="installment-amount-help" color="app.muted" fontSize="xs">Valor bloqueado para preservar a soma total da compra.</Text>}</FormControl>
          <FormControl isRequired><FormLabel>Categoria</FormLabel><Select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Selecione uma categoria</option>{activeCategories.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.icon} {item.name}</option>)}{editing && !activeCategories.some((item) => item.name === editing.category) && <option value={editing.category}>{editing.category} (arquivada)</option>}</Select></FormControl>
          <FormControl isRequired><FormLabel>Data da movimentação</FormLabel><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} isDisabled={editingSeries && scope !== 'occurrence'} /></FormControl>
          <FormControl><FormLabel>Vencimento</FormLabel><Input type="date" value={dueDate} min={status === 'pending' ? date : undefined} onChange={(event) => setDueDate(event.target.value)} isDisabled={editingSeries && scope !== 'occurrence'} /></FormControl>
          <FormControl><FormLabel>Conta ou carteira</FormLabel><Select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">Sem vínculo</option>{accounts.filter((account) => type !== 'income' || account.type !== 'cartao' || account.id === accountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select></FormControl>
          <FormControl><FormLabel>{paymentLabel}</FormLabel><Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="">Não informado</option>{paymentMethods[type].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
          <FormControl><FormLabel>Status</FormLabel><Select value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)}><option value="pending">Pendente</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option>{editing?.status === 'failed' && <option value="failed">Falhou (legado)</option>}</Select></FormControl>
        </SimpleGrid>
        <FormControl><FormLabel>Observações</FormLabel><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} resize="vertical" minH="80px" placeholder="Detalhes opcionais do lançamento" /></FormControl>
        {!editing && <>
          <Divider borderColor="app.border" />
          <ButtonGroup isAttached alignSelf="start" flexWrap="wrap">
            <Button type="button" variant={mode === 'once' ? 'secondary' : 'outline'} onClick={() => setMode('once')}>Única</Button>
            <Button type="button" leftIcon={<FiRepeat />} variant={mode === 'recurring' ? 'secondary' : 'outline'} onClick={() => { setMode('recurring'); setInstallmentCount('1'); }}>Recorrente</Button>
            <Button type="button" variant={mode === 'installments' ? 'secondary' : 'outline'} isDisabled={type !== 'expense'} onClick={() => { setMode('installments'); setRepetitions(''); }}>Parcelada</Button>
          </ButtonGroup>
          {mode === 'recurring' && <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired><FormLabel>Frequência</FormLabel><Select value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}>{frequencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
            <FormControl><FormLabel>Quantidade de repetições</FormLabel><Input type="number" min="1" max="500" value={repetitions} onChange={(event) => setRepetitions(event.target.value)} placeholder="Ex.: 12" /></FormControl>
            <FormControl><FormLabel>Data final (opcional)</FormLabel><Input type="date" min={date} value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} /></FormControl>
            <Text alignSelf="end" color="app.muted" fontSize="sm">Se informar a data final, somente ocorrências até esse dia serão criadas.</Text>
          </SimpleGrid>}
          {mode === 'installments' && <VStack align="stretch" spacing={3}>
            <FormControl><FormLabel>Número de parcelas</FormLabel><Select value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)}>{Array.from({ length: 59 }, (_, index) => index + 2).map((count) => <option key={count} value={count}>{count} parcelas</option>)}</Select></FormControl>
            <Box p={3} bg="app.surfaceRaised" borderRadius="xl"><Text fontSize="sm" fontWeight="700" mb={2}>Prévia das parcelas</Text>{installmentParts.length ? <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={1}>{installmentParts.slice(0, 6).map((part, index) => <Text key={index} fontSize="xs" color="app.muted">{index + 1}/{installmentParts.length} · {previewDate(index)} · {currency(part / 100)}</Text>)}{installmentParts.length > 6 && <Text fontSize="xs" color="app.muted">… e a parcela {installmentParts.length} em {previewDate(installmentParts.length - 1)} · {currency(installmentParts[installmentParts.length - 1] / 100)}</Text>}</SimpleGrid> : <Text color="app.muted" fontSize="sm">Informe o valor total para visualizar o parcelamento.</Text>}<Text color="app.muted" fontSize="xs" mt={2}>A soma das parcelas será exatamente igual ao total da compra.</Text></Box>
          </VStack>}
        </>}
        {editingSeries && <FormControl><FormLabel>Aplicar alteração a</FormLabel><Select value={scope} onChange={(event) => setScope(event.target.value as SeriesScope)}><option value="occurrence">Somente esta ocorrência</option><option value="future">Esta e as próximas</option><option value="series">Toda a série</option></Select></FormControl>}
        {error && <Alert status="error" borderRadius="lg" role="alert"><AlertIcon />{error}</Alert>}
      </VStack></ModalBody>
      <ModalFooter gap={3}><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit">{editing ? 'Salvar alterações' : mode === 'recurring' ? 'Criar recorrência' : mode === 'installments' ? 'Confirmar compra parcelada' : 'Salvar transação'}</Button></ModalFooter>
    </ModalContent>
  </Modal>;
}

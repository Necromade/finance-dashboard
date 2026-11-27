import { useDeferredValue, useMemo, useRef, useState } from 'react';
import {
  Alert, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertIcon,
  AlertDialogOverlay, Badge, Box, Button, ButtonGroup, Checkbox, FormControl, FormLabel,
  HStack, IconButton, Input, Select, SimpleGrid, Table, TableCaption, Tbody, Td, Text,
  Th, Thead, Tooltip, Tr, VStack, useDisclosure,
} from '@chakra-ui/react';
import {
  FiArrowDown, FiArrowUp, FiCopy, FiDownload, FiEdit2, FiGrid, FiList, FiPlus,
  FiSearch, FiTrash2,
} from 'react-icons/fi';
import CategoryManager from '../components/Transactions/CategoryManager';
import TransactionFormModal from '../components/Transactions/TransactionFormModal';
import {
  currency, deleteTransactions, duplicateTransactionDraft, importTransactions,
  updateTransactionsStatus, useFinanceData, type Category, type Transaction, type TransactionDraft, type TransactionStatus,
} from '../data/financeStore';
import { filterAndSortTransactions } from '../data/transactionDomain';
import { parseTransactionFile } from '../data/transactionImport';

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const statusLabel: Record<TransactionStatus, string> = { completed: 'Concluída', pending: 'Pendente', cancelled: 'Cancelada', failed: 'Falhou (legado)' };
const statusColor: Record<TransactionStatus, string> = { completed: 'green', pending: 'yellow', cancelled: 'gray', failed: 'red' };
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');

type BulkAction = { kind: 'complete' | 'cancel' | 'delete'; ids: string[] } | null;

export default function Transactions() {
  const { transactions, accounts, categories: savedCategories } = useFinanceData();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [accountId, setAccountId] = useState('all');
  const [period, setPeriod] = useState('all');
  const [dateField, setDateField] = useState<'date' | 'dueDate'>('date');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'dueDate' | 'amount' | 'description'>('date');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<'table' | 'list'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [prefill, setPrefill] = useState<TransactionDraft | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const modal = useDisclosure();
  const confirm = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo<Category[]>(() => [...new Map([...savedCategories, ...transactions.map((item) => ({ name: item.category, icon: '◦', type: item.type, color: '#95AA9D' }))].map((item) => [item.name, item])).values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [savedCategories, transactions]);
  const periodRange = useMemo(() => {
    const now = new Date();
    if (period === 'month') return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: localDateKey(now) };
    if (period === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: localDateKey(start), to: localDateKey(end) };
    }
    if (period === '90') { const start = new Date(now); start.setDate(start.getDate() - 90); return { from: localDateKey(start), to: localDateKey(now) }; }
    return { from: '', to: '' };
  }, [period]);
  const filters = useMemo(() => ({ search: deferredSearch, category, accountId, type, status, from: from || periodRange.from, to: to || periodRange.to, dateField }), [deferredSearch, category, accountId, type, status, from, to, periodRange, dateField]);
  const visible = useMemo(() => filterAndSortTransactions(transactions, filters, sortBy, direction), [transactions, filters, sortBy, direction]);
  const categoriesForForm = savedCategories;
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selectedIds.includes(row.id));

  const openCreate = () => { setEditing(null); setPrefill(null); modal.onOpen(); };
  const openEdit = (row: Transaction) => { setPrefill(null); setEditing(row); modal.onOpen(); };
  const openDuplicate = (row: Transaction) => { setEditing(null); setPrefill(duplicateTransactionDraft(row.id)); modal.onOpen(); };
  const notify = (typeValue: 'success' | 'error', message: string) => setFeedback({ type: typeValue, message });
  const requestBulk = (action: NonNullable<BulkAction>['kind'], ids = selectedIds) => { if (!ids.length) return; setBulkAction({ kind: action, ids }); confirm.onOpen(); };
  const executeBulk = () => {
    if (!bulkAction) return;
    try {
      if (bulkAction.kind === 'delete') deleteTransactions(bulkAction.ids);
      else updateTransactionsStatus(bulkAction.ids, bulkAction.kind === 'complete' ? 'completed' : 'cancelled');
      setSelectedIds((current) => current.filter((id) => !bulkAction.ids.includes(id)));
      notify('success', bulkAction.kind === 'delete' ? 'Ação concluída. Parcelas foram canceladas para preservar o histórico.' : `${bulkAction.ids.length} transação(ões) atualizada(s).`);
    } catch (reason) { notify('error', reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'); }
    confirm.onClose(); setBulkAction(null);
  };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleVisible = () => setSelectedIds((current) => allVisibleSelected ? current.filter((id) => !visible.some((row) => row.id === id)) : [...new Set([...current, ...visible.map((row) => row.id)])]);

  const exportCsv = () => {
    const csvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Data', 'Vencimento', 'Descrição', 'Categoria', 'Ícone', 'Tipo', 'Valor', 'Valor em centavos', 'Status', 'Conta', 'Forma de pagamento', 'Observações', 'Série recorrente', 'Índice da ocorrência', 'Compra', 'Parcela', 'Total de parcelas'],
      ...visible.map((row) => [row.date, row.dueDate ?? '', row.description, row.category, savedCategories.find((item) => item.name === row.category)?.icon ?? '', row.type, (row.amountCents ?? Math.round(row.amount * 100)) / 100, row.amountCents ?? Math.round(row.amount * 100), row.status, accounts.find((item) => item.id === row.accountId)?.name ?? '', row.paymentMethod ?? '', row.notes ?? '', row.recurrenceSeriesId ?? '', row.occurrenceIndex ?? '', row.purchaseId ?? row.installmentGroup ?? '', row.installmentNumber ?? '', row.installmentCount ?? '']),
    ];
    const blob = new Blob(['\ufeff' + rows.map((row) => row.map(csvValue).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `finance-plus-transacoes-${today()}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importCsv = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseTransactionFile(file.name, await file.text(), accounts);
      importTransactions(parsed.transactions, parsed.categories);
      notify('success', `${parsed.transactions.length} transação(ões) importada(s).`);
    } catch (reason) { notify('error', reason instanceof Error ? reason.message : 'Falha ao importar o arquivo.'); }
  };
  const categoryInfo = (name: string) => savedCategories.find((item) => item.name === name);
  const rowActions = (row: Transaction) => <HStack spacing={0} justify="end">
    <Tooltip label="Duplicar"><IconButton variant="icon" size="sm" aria-label={`Duplicar ${row.description}`} icon={<FiCopy />} onClick={() => { try { openDuplicate(row); } catch (reason) { notify('error', reason instanceof Error ? reason.message : 'Não foi possível duplicar.'); } }} /></Tooltip>
    <Tooltip label="Editar"><IconButton variant="icon" size="sm" aria-label={`Editar ${row.description}`} icon={<FiEdit2 />} onClick={() => openEdit(row)} /></Tooltip>
    <Tooltip label={row.installmentGroup || row.purchaseId ? 'Cancelar parcela' : 'Excluir'}><IconButton variant="icon" size="sm" color="expense.400" aria-label={`${row.installmentGroup || row.purchaseId ? 'Cancelar parcela' : 'Excluir'} ${row.description}`} icon={<FiTrash2 />} onClick={() => requestBulk('delete', [row.id])} /></Tooltip>
  </HStack>;
  const categoryBadge = (name: string) => { const info = categoryInfo(name); return <Badge borderRadius="full" px={2} border="1px solid" borderColor={info?.color ?? 'app.border'}>{info?.icon ?? '◦'} {name}</Badge>; };
  const selectionBox = (row: Transaction) => <Checkbox colorScheme="green" isChecked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} aria-label={`Selecionar ${row.description}`} />;
  const listRow = (row: Transaction) => <HStack key={row.id} p={3} border="1px solid" borderColor="app.border" bg="app.surface" borderRadius="xl" align="start" justify="space-between" spacing={2}>
    <HStack minW={0} align="start" spacing={3}>{selectionBox(row)}<Box w="38px" h="38px" display="grid" placeItems="center" bg="app.surfaceRaised" borderRadius="lg" flex="none" fontSize="lg">{categoryInfo(row.category)?.icon ?? '◦'}</Box><Box minW={0}><Text fontWeight="700" noOfLines={1}>{row.description}</Text><Text color="app.muted" fontSize="xs">{dateLabel(row.date)}{row.dueDate ? ` · vence ${dateLabel(row.dueDate)}` : ''} · {row.category}</Text><HStack mt={2} wrap="wrap"><Badge colorScheme={statusColor[row.status]}>{statusLabel[row.status]}</Badge>{row.installmentNumber && <Badge colorScheme="cyan">Parcela {row.installmentNumber}/{row.installmentCount}</Badge>}{row.recurrenceSeriesId && <Badge colorScheme="purple">Recorrente</Badge>}</HStack></Box></HStack>
    <VStack flex="none" align="end" spacing={1}><Text fontWeight="700" whiteSpace="nowrap" color={row.type === 'income' ? 'income.400' : 'expense.400'}>{row.type === 'income' ? '+' : '−'}{currency(row.amountCents !== undefined ? row.amountCents / 100 : row.amount)}</Text>{rowActions(row)}</VStack>
  </HStack>;

  return <VStack align="stretch" spacing={5} minW={0}>
    <HStack justify="space-between" wrap="wrap" gap={3} align="start">
      <Box><Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".14em" mb={2}>MOVIMENTAÇÕES FINANCEIRAS</Text><Text fontSize="2xl" fontWeight="800" fontFamily="Manrope">Transações</Text><Text color="app.muted">Registre e acompanhe lançamentos, parcelas e recorrências.</Text></Box>
      <HStack wrap="wrap"><CategoryManager categories={savedCategories} /><Button leftIcon={<FiPlus />} onClick={openCreate}>Nova transação</Button></HStack>
    </HStack>
    {feedback && <Alert status={feedback.type} borderRadius="xl" role={feedback.type === 'error' ? 'alert' : 'status'}><AlertIcon />{feedback.message}<Button size="sm" variant="ghost" ml="auto" onClick={() => setFeedback(null)}>Fechar</Button></Alert>}
    <Box bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 4, md: 5 }}>
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3}>
        <FormControl><FormLabel>Buscar</FormLabel><HStack><FiSearch aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Descrição ou categoria" aria-label="Buscar transações" /></HStack></FormControl>
        <FormControl><FormLabel>Período</FormLabel><Select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todo o período</option><option value="month">Este mês</option><option value="lastMonth">Mês anterior</option><option value="90">Últimos 90 dias</option></Select></FormControl>
        <FormControl><FormLabel>Categoria</FormLabel><Select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas</option>{categories.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.icon} {item.name}{item.archived ? ' · arquivada' : ''}</option>)}</Select></FormControl>
        <FormControl><FormLabel>Conta ou carteira</FormLabel><Select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="all">Todas as contas</option><option value="none">Sem vínculo</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormControl>
        <FormControl><FormLabel>Tipo</FormLabel><Select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Receitas e despesas</option><option value="income">Receitas</option><option value="expense">Despesas</option></Select></FormControl>
        <FormControl><FormLabel>Status</FormLabel><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os status</option><option value="pending">Pendente</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option><option value="failed">Falhou (legado)</option></Select></FormControl>
        <FormControl><FormLabel>Filtrar data por</FormLabel><Select value={dateField} onChange={(event) => setDateField(event.target.value as 'date' | 'dueDate')}><option value="date">Movimentação</option><option value="dueDate">Vencimento</option></Select></FormControl>
        <FormControl><FormLabel>Ordenar por</FormLabel><Select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="date">Data da movimentação</option><option value="dueDate">Data de vencimento</option><option value="amount">Valor</option><option value="description">Descrição</option></Select></FormControl>
        <FormControl><FormLabel>Data inicial</FormLabel><Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPeriod('all'); }} /></FormControl>
        <FormControl><FormLabel>Data final</FormLabel><Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPeriod('all'); }} /></FormControl>
      </SimpleGrid>
    </Box>

    <HStack justify="space-between" wrap="wrap" gap={3}>
      <Text fontSize="sm" color="app.muted">{visible.length} de {transactions.length} transações</Text>
      <HStack wrap="wrap" spacing={2}>
        <Button as="label" cursor="pointer" variant="outline" size="sm">Importar CSV<input hidden type="file" accept=".csv,text/csv" onChange={(event) => { void importCsv(event.target.files?.[0]); event.currentTarget.value = ''; }} /></Button>
        <Button leftIcon={<FiDownload />} onClick={exportCsv} variant="outline" size="sm">Exportar CSV</Button>
        <ButtonGroup isAttached size="sm" variant="outline"><Button leftIcon={<FiGrid />} aria-pressed={view === 'table'} colorScheme={view === 'table' ? 'brand' : 'gray'} onClick={() => setView('table')}>Tabela</Button><Button leftIcon={<FiList />} aria-pressed={view === 'list'} colorScheme={view === 'list' ? 'brand' : 'gray'} onClick={() => setView('list')}>Lista</Button></ButtonGroup>
        <Tooltip label={direction === 'desc' ? 'Ordem crescente' : 'Ordem decrescente'}><IconButton variant="icon" aria-label={direction === 'desc' ? 'Ordenação decrescente' : 'Ordenação crescente'} icon={direction === 'desc' ? <FiArrowDown /> : <FiArrowUp />} onClick={() => setDirection((current) => current === 'desc' ? 'asc' : 'desc')} /></Tooltip>
      </HStack>
    </HStack>

    {selectedIds.length > 0 && <HStack p={3} bg="app.surfaceRaised" border="1px solid" borderColor="app.border" borderRadius="xl" wrap="wrap" justify="space-between"><Text fontWeight="600">{selectedIds.length} selecionada(s)</Text><HStack wrap="wrap"><Button size="sm" variant="secondary" onClick={() => requestBulk('complete')}>Marcar como paga/concluída</Button><Button size="sm" variant="outline" onClick={() => requestBulk('cancel')}>Cancelar selecionadas</Button><Button size="sm" variant="danger" leftIcon={<FiTrash2 />} onClick={() => requestBulk('delete')}>Excluir selecionadas</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Limpar seleção</Button></HStack></HStack>}

    {!visible.length ? <Box bg="app.surface" border="1px dashed" borderColor="app.border" borderRadius="2xl" py={14} px={6} textAlign="center"><Text fontSize="lg" fontWeight="700">Nenhuma transação encontrada</Text><Text color="app.muted" mt={2}>{transactions.length ? 'Ajuste os filtros ou limpe a busca.' : 'Comece registrando sua primeira receita ou despesa.'}</Text>{!transactions.length && <Button mt={4} leftIcon={<FiPlus />} onClick={openCreate}>Adicionar transação</Button>}</Box>
      : view === 'table' ? <Box overflowX="auto" bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl"><Table minW="1080px" size="sm" variant="simple"><TableCaption placement="top" srOnly>Lista de transações financeiras</TableCaption><Thead bg="app.surfaceRaised"><Tr><Th><Checkbox aria-label="Selecionar todas as transações visíveis" isChecked={allVisibleSelected} isIndeterminate={selectedIds.length > 0 && !allVisibleSelected} onChange={toggleVisible} /></Th><Th py={4}>Movimentação</Th><Th>Data</Th><Th>Vencimento</Th><Th>Categoria</Th><Th>Conta</Th><Th>Status</Th><Th isNumeric>Valor</Th><Th>Ações</Th></Tr></Thead><Tbody>{visible.map((row) => <Tr key={row.id} _hover={{ bg: 'app.surfaceRaised' }}><Td>{selectionBox(row)}</Td><Td><HStack minW={0}><Box w={9} h={9} flex="none" display="grid" placeItems="center" borderRadius="lg" bg="app.surfaceRaised" border="1px solid" borderColor={categoryInfo(row.category)?.color ?? 'app.border'}>{categoryInfo(row.category)?.icon ?? '◦'}</Box><Box minW={0}><Text fontWeight="600" noOfLines={1}>{row.description}</Text><HStack color="app.muted" fontSize="xs" wrap="wrap">{row.paymentMethod && <Text>{row.paymentMethod}</Text>}{row.recurrenceSeriesId && <Text>Recorrente</Text>}{row.installmentNumber && <Text>Parcela {row.installmentNumber}/{row.installmentCount}</Text>}</HStack></Box></HStack></Td><Td whiteSpace="nowrap">{dateLabel(row.date)}</Td><Td whiteSpace="nowrap" color="app.muted">{row.dueDate ? dateLabel(row.dueDate) : '—'}</Td><Td>{categoryBadge(row.category)}</Td><Td color="app.muted">{accounts.find((item) => item.id === row.accountId)?.name ?? '—'}</Td><Td><Badge colorScheme={statusColor[row.status]}>{statusLabel[row.status]}</Badge></Td><Td isNumeric whiteSpace="nowrap" fontWeight="700" color={row.type === 'income' ? 'income.400' : 'expense.400'}>{row.type === 'income' ? '+' : '−'}{currency(row.amountCents !== undefined ? row.amountCents / 100 : row.amount)}</Td><Td>{rowActions(row)}</Td></Tr>)}</Tbody></Table></Box>
        : <VStack align="stretch" spacing={2}>{visible.map(listRow)}</VStack>}

    <TransactionFormModal key={editing?.id ?? (prefill ? `${prefill.description}-${prefill.date}` : 'new')} isOpen={modal.isOpen} onClose={() => { modal.onClose(); setEditing(null); setPrefill(null); }} onSaved={(message) => notify('success', message)} editing={editing} prefill={prefill} categories={categoriesForForm} accounts={accounts} />
    <AlertDialog isOpen={confirm.isOpen} leastDestructiveRef={cancelRef} onClose={() => { confirm.onClose(); setBulkAction(null); }} isCentered>
      <AlertDialogOverlay><AlertDialogContent bg="app.surface" border="1px solid" borderColor="app.border"><AlertDialogHeader>{bulkAction?.kind === 'delete' ? 'Excluir ou cancelar lançamentos?' : bulkAction?.kind === 'cancel' ? 'Cancelar transações?' : 'Confirmar pagamento?'}</AlertDialogHeader><AlertDialogBody>{bulkAction?.kind === 'delete' ? 'Lançamentos comuns serão excluídos. Parcelas serão canceladas para manter o histórico e o valor total da compra.' : bulkAction?.kind === 'cancel' ? 'As transações selecionadas deixarão de compor os valores realizados.' : 'As transações selecionadas serão concluídas. Itens com data futura passam a contar a partir de hoje.'}</AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} onClick={() => { confirm.onClose(); setBulkAction(null); }}>Voltar</Button><Button ml={3} variant={bulkAction?.kind === 'delete' || bulkAction?.kind === 'cancel' ? 'danger' : 'primary'} onClick={executeBulk}>Confirmar</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay>
    </AlertDialog>
  </VStack>;
}

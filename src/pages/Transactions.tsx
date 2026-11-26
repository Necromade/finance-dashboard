import { useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, FormControl, FormLabel, HStack, Input, Select, Table, Tbody, Td, Th, Thead, Tr, useColorModeValue, VStack, Text, SimpleGrid, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { FiDownload, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { addTransaction, currency, deleteTransaction, updateTransaction, useFinanceData, type Transaction, type TransactionType } from '../data/financeStore';

const Transactions = () => {
  const { transactions } = useFinanceData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [transactionStatus, setTransactionStatus] = useState<Transaction['status']>('completed');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('app.surface', 'app.surface');
  const borderColor = useColorModeValue('app.border', 'app.border');
  const categories = [...new Set(transactions.map((t) => t.category))].sort();
  const visible = useMemo(() => transactions.filter((t) => `${t.description} ${t.category}`.toLowerCase().includes(search.trim().toLowerCase()) && (category === 'all' || t.category === category) && (status === 'all' || t.status === status) && (typeFilter === 'all' || t.type === typeFilter) && (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate)), [transactions, search, category, status, typeFilter, startDate, endDate]);

  const exportCsv = () => {
    const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'], ...visible.map((t) => [t.date, t.description, t.category, t.type, String(t.amount), t.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'finance-plus-transacoes.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!description.trim() || !newCategory.trim() || !Number.isFinite(parsed) || parsed <= 0 || !date) { setError('Preencha os campos e informe um valor maior que zero.'); return; }
    const input = { date, description: description.trim(), category: newCategory.trim(), amount: parsed, type, status: transactionStatus };
    try { if (editing) updateTransaction(editing.id, input); else addTransaction(input); setDescription(''); setAmount(''); setNewCategory(''); setError(''); setEditing(null); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar a transação.'); }
  };
  const openEdit = (item: Transaction) => { setEditing(item); setDescription(item.description); setNewCategory(item.category); setAmount(String(item.amount)); setType(item.type); setTransactionStatus(item.status); setDate(item.date); setError(''); onOpen(); };
  const openAdd = () => { setEditing(null); setDescription(''); setNewCategory(''); setAmount(''); setType('expense'); setTransactionStatus('completed'); setDate(new Date().toISOString().slice(0, 10)); setError(''); onOpen(); };

  return <VStack align="stretch" spacing={6} minW={0}>
    <HStack justify="space-between" wrap="wrap"><Box><Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".14em" mb="2">TRANSACTIONS</Text><Text fontSize="2xl" fontWeight="800" fontFamily="Manrope">Transactions</Text><Text color="app.muted">Search, filter and manage your activity.</Text></Box><Button leftIcon={<FiPlus />} onClick={openAdd} borderRadius="xl">New transaction</Button></HStack>
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={{ base: 4, md: 5 }}>
      <FormControl><FormLabel>Pesquisar</FormLabel><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Descrição ou categoria" /></FormControl>
      <FormControl><FormLabel>Categoria</FormLabel><Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select></FormControl>
      <FormControl><FormLabel>Tipo</FormLabel><Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></Select></FormControl>
      <FormControl><FormLabel>Status</FormLabel><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos</option><option value="completed">Concluídas</option><option value="pending">Pendentes</option><option value="failed">Falhas</option></Select></FormControl>
      <FormControl><FormLabel>De</FormLabel><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></FormControl>
      <FormControl><FormLabel>Até</FormLabel><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></FormControl>
    </SimpleGrid>
    <HStack justify="space-between"><Text fontSize="sm" color="gray.500">{visible.length} transação(ões)</Text><Button leftIcon={<FiDownload />} onClick={exportCsv} variant="outline" size="sm">Exportar CSV</Button></HStack>
    <Box overflowX="auto" bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" overflow="hidden"><Table minW="760px" size="sm"><Thead bg="app.surfaceRaised"><Tr><Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Valor</Th><Th>Status</Th><Th textAlign="right">Ações</Th></Tr></Thead><Tbody>{visible.map((t) => <Tr key={t.id} _hover={{ bg: "app.surfaceRaised" }}><Td>{new Date(`${t.date}T00:00:00`).toLocaleDateString()}</Td><Td fontWeight="medium">{t.description}</Td><Td><Badge borderRadius="full" px={2}>{t.category}</Badge></Td><Td color={t.type === 'income' ? 'income.400' : 'expense.400'} fontWeight="semibold">{t.type === 'income' ? '+' : '−'}{currency(t.amount)}</Td><Td><Badge borderRadius="full" colorScheme={t.status === 'completed' ? 'green' : t.status === 'pending' ? 'yellow' : 'red'}>{t.status === 'completed' ? 'Concluída' : t.status === 'pending' ? 'Pendente' : 'Falhou'}</Badge></Td><Td><HStack justify="end"><IconButton aria-label="Editar transação" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEdit(t)} /><IconButton aria-label="Excluir transação" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => setDeleting(t)} /></HStack></Td></Tr>)}{visible.length === 0 && <Tr><Td colSpan={6} textAlign="center" py={10} color="gray.500">Nenhuma transação encontrada.</Td></Tr>}</Tbody></Table></Box>
    <Modal isOpen={isOpen} onClose={() => { onClose(); setEditing(null); }} isCentered><ModalOverlay /><ModalContent as="form" onSubmit={submit}><ModalHeader>{editing ? 'Editar transação' : 'Adicionar transação'}</ModalHeader><ModalCloseButton /><ModalBody><SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}><FormControl isRequired><FormLabel>Descrição</FormLabel><Input value={description} onChange={(e) => setDescription(e.target.value)} /></FormControl><FormControl isRequired><FormLabel>Categoria</FormLabel><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} /></FormControl><FormControl isRequired><FormLabel>Valor (USD)</FormLabel><Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></FormControl><FormControl><FormLabel>Tipo</FormLabel><Select value={type} onChange={(e) => setType(e.target.value as TransactionType)}><option value="income">Receita</option><option value="expense">Despesa</option></Select></FormControl>{editing && <FormControl><FormLabel>Status</FormLabel><Select value={transactionStatus} onChange={(e) => setTransactionStatus(e.target.value as Transaction['status'])}><option value="completed">Concluída</option><option value="pending">Pendente</option><option value="failed">Falhou</option></Select></FormControl>}<FormControl isRequired><FormLabel>Data</FormLabel><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormControl></SimpleGrid>{error && <Text role="alert" color="red.500" mt={3}>{error}</Text>}</ModalBody><ModalFooter><Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button><Button type="submit">{editing ? 'Salvar alterações' : 'Adicionar'}</Button></ModalFooter></ModalContent></Modal>
    <AlertDialog isOpen={Boolean(deleting)} leastDestructiveRef={cancelDeleteRef} onClose={() => setDeleting(null)} isCentered><AlertDialogOverlay><AlertDialogContent><AlertDialogHeader>Excluir transação?</AlertDialogHeader><AlertDialogBody>Essa ação removerá “{deleting?.description}” dos totais e relatórios.</AlertDialogBody><AlertDialogFooter><Button ref={cancelDeleteRef} onClick={() => setDeleting(null)}>Cancelar</Button><Button colorScheme="red" ml={3} onClick={() => { if (deleting) deleteTransaction(deleting.id); setDeleting(null); }}>Excluir</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay></AlertDialog>
  </VStack>;
};
export default Transactions;

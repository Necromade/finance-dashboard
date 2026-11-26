import { useMemo } from 'react';
import { Box, Grid, Heading, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Text, HStack, Button, SimpleGrid } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { currency, useFinanceData } from '../data/financeStore';

const Analytics = ({ period }: { period: string; onPeriodChange: (value: string) => void }) => {
  const { transactions } = useFinanceData();
  const cardBg = useColorModeValue('app.surface', 'app.surface');
  const borderColor = useColorModeValue('app.border', 'app.border');
  const tooltipBg = useColorModeValue('#ffffff', '#162338');
  const tooltipColor = useColorModeValue('#182436', '#e6edf7');
  const months = period === 'thisMonth' || period === 'lastMonth' ? 1 : Number(period);
  const periodOffset = period === 'lastMonth' ? 1 : 0;
  const data = useMemo(() => Array.from({ length: months }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (months - i - 1) - periodOffset);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rows = transactions.filter((t) => t.date.startsWith(key) && t.status === 'completed');
    return { month: d.toLocaleString('pt-BR', { month: 'short' }), income: rows.filter((t) => t.type === 'income').reduce((n, t) => n + t.amount, 0), expenses: rows.filter((t) => t.type === 'expense').reduce((n, t) => n + t.amount, 0) };
  }), [transactions, months, periodOffset]);
  const rangeKeys = new Set(data.map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (months - i - 1) - periodOffset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }));
  const rangeTransactions = transactions.filter((t) => t.status === 'completed' && rangeKeys.has(t.date.slice(0, 7)));
  const income = rangeTransactions.filter((t) => t.type === 'income').reduce((n, t) => n + t.amount, 0);
  const expenses = rangeTransactions.filter((t) => t.type === 'expense').reduce((n, t) => n + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? balance / income * 100 : 0;
  const categories = Object.values(rangeTransactions.filter((t) => t.type === 'expense').reduce<Record<string, { name: string; value: number }>>((acc, t) => { acc[t.category] ??= { name: t.category, value: 0 }; acc[t.category].value += t.amount; return acc; }, {}));
  const colors = ['#22c7e2', '#10b981', '#f43f5e', '#818cf8', '#f59e0b', '#a78bfa'];
  const exportReport = () => {
    const rows = [['Relatório Finance+', `Últimos ${months} meses`], ['Receitas', String(income)], ['Despesas', String(expenses)], ['Saldo', String(balance)], [], ['Mês', 'Receitas', 'Despesas', 'Saldo'], ...data.map((m) => [m.month, String(m.income), String(m.expenses), String(m.income - m.expenses)]), [], ['Categoria', 'Despesas'], ...categories.map((c) => [c.name, String(c.value)])];
    const csv = rows.map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'finance-plus-relatorio.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const stats = [{ label: 'Receitas', value: currency(income), color: 'income.400' }, { label: 'Despesas', value: currency(expenses), color: 'expense.400' }, { label: 'Saldo do período', value: currency(balance), color: balance >= 0 ? 'brand.300' : 'expense.400' }, { label: 'Taxa de poupança', value: `${savingsRate.toFixed(1)}%`, color: 'brand.300' }];
  return <Box minW={0}>
    <HStack justify="space-between" align="start" wrap="wrap" mb={6}><Box><Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".14em" mb="2">ANALYTICS OVERVIEW</Text><Text color="app.muted" mt={1}>A clear view of your activity: {period === 'lastMonth' ? 'previous month' : period === 'thisMonth' ? 'current month' : `last ${months} months`}.</Text></Box><Button leftIcon={<FiDownload />} onClick={exportReport} variant="outline" borderRadius="xl">Export CSV</Button></HStack>
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4} mb={6}>{stats.map((item) => <Stat key={item.label} minW={0} bg={cardBg} p={5} borderRadius="2xl" border="1px solid" borderColor={borderColor}><StatLabel color="app.muted">{item.label}</StatLabel><StatNumber fontSize={{ base: 'xl', md: '2xl' }} overflowWrap="anywhere" color={item.color} mt={1}>{item.value}</StatNumber><StatHelpText mb={0} color="app.muted">Lançamentos concluídos</StatHelpText></Stat>)}</SimpleGrid>
    <Grid templateColumns={{ base: '1fr', xl: '1.5fr 1fr' }} gap={5}>
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor={borderColor} minW={0}><Heading size="md" mb={1}>Evolução mensal</Heading><Text color="app.muted" fontSize="sm" mb={4}>Comparação entre entradas e saídas</Text><Text position="absolute" left="-10000px">{data.map((m) => `${m.month}: receitas ${currency(m.income)}, despesas ${currency(m.expenses)}`).join('; ')}</Text><Box height={{ base: '280px', md: '340px' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: -18, right: 8 }}><CartesianGrid strokeDasharray="3 6" stroke={borderColor}/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipColor, borderRadius: 12, border: `1px solid ${borderColor}` }} formatter={(value: number) => currency(value)}/><Legend/><Bar dataKey="income" fill="#10b981" name="Receitas" radius={[5, 5, 0, 0]}/><Bar dataKey="expenses" fill="#f43f5e" name="Despesas" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer></Box></Box>
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor={borderColor} minW={0}><Heading size="md" mb={1}>Despesas por categoria</Heading><Text color="app.muted" fontSize="sm" mb={4}>Distribuição no período selecionado</Text>{categories.length ? <><Text position="absolute" left="-10000px">{categories.map((c) => `${c.name}: ${currency(c.value)}`).join('; ')}</Text><Box height={{ base: '280px', md: '340px' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="48%" outerRadius="70%" paddingAngle={3}>{categories.map((entry, i) => <Cell key={entry.name} fill={colors[i % colors.length]}/>)}</Pie><Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipColor, border: `1px solid ${borderColor}`, borderRadius: 12 }} formatter={(value: number) => currency(value)}/><Legend/></PieChart></ResponsiveContainer></Box></> : <Text py={10} color="app.muted">Sem despesas concluídas no período.</Text>}</Box>
    </Grid>
  </Box>;
};
export default Analytics;

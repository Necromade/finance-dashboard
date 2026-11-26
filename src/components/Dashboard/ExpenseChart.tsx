import { Box, Heading, HStack, Badge, useColorModeValue, Text } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { currency, getMonthKey, useFinanceData } from '../../data/financeStore';

const ExpenseChart = ({ timeRange, monthOffset = 0 }: { timeRange: string; monthOffset?: number }) => {
  const { transactions } = useFinanceData();
  const tooltipBg = useColorModeValue('#ffffff', '#162338');
  const tooltipColor = useColorModeValue('#182436', '#e6edf7');
  const grid = useColorModeValue('#e2e8f0', '#25344a');
  const data = useMemo(() => {
    const months = Number(timeRange);
    const current = new Date();
    return Array.from({ length: months }, (_, index) => {
      const date = new Date(current.getFullYear(), current.getMonth() - (months - index - 1) - monthOffset, 1);
      const key = getMonthKey(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
      const rows = transactions.filter((t) => t.date.startsWith(key) && t.status === 'completed');
      return { name: date.toLocaleString('pt-BR', { month: 'short' }), income: rows.filter((t) => t.type === 'income').reduce((n, t) => n + t.amount, 0), expenses: rows.filter((t) => t.type === 'expense').reduce((n, t) => n + t.amount, 0) };
    });
  }, [transactions, timeRange, monthOffset]);
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  return <Box p={{ base: 2, md: 3 }} height={{ base: '360px', md: '390px' }} minW={0}>
    <HStack justify="space-between" mb={4} align="start" wrap="wrap"><Box><Heading size="md">Income vs expenses</Heading><HStack spacing={2} mt={3} wrap="wrap"><Badge colorScheme="green" borderRadius="full" px="2">Income {currency(totalIncome)}</Badge><Badge colorScheme="red" borderRadius="full" px="2">Expenses {currency(totalExpenses)}</Badge><Badge colorScheme="cyan" borderRadius="full" px="2">Savings {savingsRate}%</Badge></HStack></Box>
      <Text color="app.muted" fontSize="xs" pt="1">{monthOffset ? 'Previous month' : timeRange === '1' ? 'Current month' : `Last ${timeRange} months`}</Text>
    </HStack>
    <Text position="absolute" left="-10000px">Gráfico mensal: {data.map((m) => `${m.name}: entradas ${currency(m.income)}, saídas ${currency(m.expenses)}`).join('; ')}</Text>
    <ResponsiveContainer width="100%" height="78%"><AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.24}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 6" stroke={grid}/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipColor, borderRadius: 12, border: `1px solid ${grid}` }} formatter={(value: number) => [currency(value), '']} /><Legend /><Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeFill)" name="Entradas" /><Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#expenseFill)" name="Saídas" /></AreaChart></ResponsiveContainer>
  </Box>;
};
export default ExpenseChart;

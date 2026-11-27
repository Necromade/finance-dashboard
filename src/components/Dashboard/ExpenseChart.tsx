import { Box, Heading, HStack, Badge, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { currency, getMonthKey, useFinanceData } from '../../data/financeStore';
import { centsToMoney, transactionCents } from '../../data/transactionDomain';

const ExpenseChart = ({ timeRange, monthOffset = 0 }: { timeRange: string; monthOffset?: number }) => {
  const { transactions } = useFinanceData();
  const data = useMemo(() => {
    const months = Number(timeRange), current = new Date();
    return Array.from({ length: months }, (_, index) => {
      const date = new Date(current.getFullYear(), current.getMonth() - (months - index - 1) - monthOffset, 1);
      const key = getMonthKey(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
      const rows = transactions.filter((t) => t.date.startsWith(key) && t.status === 'completed');
      return { name: date.toLocaleString('pt-BR', { month: 'short' }), income: centsToMoney(rows.filter((t) => t.type === 'income').reduce((n, t) => n + transactionCents(t), 0)), expenses: centsToMoney(rows.filter((t) => t.type === 'expense').reduce((n, t) => n + transactionCents(t), 0)), count: rows.length };
    });
  }, [transactions, timeRange, monthOffset]);
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0), totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const hasData = data.some((month) => month.count > 0);
  const grid = useColorModeValue('#dce8e0', '#26392f');
  const incomeColor = useColorModeValue('#0d966a', '#10b981');
  const expenseColor = useColorModeValue('#d9445d', '#f87185');
  const tooltipBackground = useColorModeValue('#ffffff', '#15211b');
  const tooltipText = useColorModeValue('#182a22', '#e7eee9');
  const tooltipBorder = useColorModeValue('#dce8e0', '#26392f');
  const axisValue = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);
  return <Box p={{ base: 2, md: 3 }} minW={0}>
    <HStack justify="space-between" mb={4} align="start" wrap="wrap"><Box><Heading size="md">Receitas e despesas</Heading><HStack spacing={2} mt={3} wrap="wrap"><Badge colorScheme="green" borderRadius="full" px="2">Receitas {currency(totalIncome)}</Badge><Badge colorScheme="red" borderRadius="full" px="2">Despesas {currency(totalExpenses)}</Badge><Badge colorScheme="cyan" borderRadius="full" px="2">Poupança {savingsRate}%</Badge></HStack></Box><Text color="app.muted" fontSize="xs" pt="1">{monthOffset ? 'Mês anterior' : timeRange === '1' ? 'Mês atual' : `Últimos ${timeRange} meses`}</Text></HStack>
    <Text position="absolute" left="-10000px">Gráfico mensal: {data.map((m) => `${m.name}: receitas ${currency(m.income)}, despesas ${currency(m.expenses)}`).join('; ')}</Text>
    {hasData ? <Box height={{ base: '290px', md: '320px' }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 8, left: 2, bottom: 0 }}>
      <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={incomeColor} stopOpacity={0.24}/><stop offset="95%" stopColor={incomeColor} stopOpacity={0.01}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={expenseColor} stopOpacity={0.18}/><stop offset="95%" stopColor={expenseColor} stopOpacity={0.01}/></linearGradient></defs>
      <CartesianGrid strokeDasharray="3 7" stroke={grid}/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis width={76} tickFormatter={axisValue} tickLine={false} axisLine={false}/><Tooltip cursor={{ stroke: incomeColor, strokeDasharray: '4 4' }} content={({active,payload,label})=>active&&payload?.length?<Box bg={tooltipBackground} color={tooltipText} border="1px solid" borderColor={tooltipBorder} borderRadius="xl" p={3} boxShadow="soft"><Text fontSize="xs" color="app.muted" mb={2}>{label}</Text>{payload.map((entry)=><HStack key={entry.dataKey} justify="space-between" spacing={5}><Text fontSize="sm" color={String(entry.color)}>{entry.name}</Text><Text fontSize="sm" fontWeight="700">{currency(Number(entry.value))}</Text></HStack>)}</Box>:null}/><Legend wrapperStyle={{fontSize:12,paddingTop:8}}/>
      <Area type="monotone" dataKey="income" stroke={incomeColor} strokeWidth={2.25} fill="url(#incomeFill)" name="Receitas" activeDot={{r:4,strokeWidth:0}} isAnimationActive animationDuration={650}/><Area type="monotone" dataKey="expenses" stroke={expenseColor} strokeWidth={2.25} fill="url(#expenseFill)" name="Despesas" activeDot={{r:4,strokeWidth:0}} isAnimationActive animationDuration={650}/>
    </AreaChart></ResponsiveContainer></Box>:<VStack justify="center" minH={{base:'220px',md:'250px'}} border="1px dashed" borderColor="app.border" borderRadius="xl" px={6} textAlign="center"><Text fontWeight="600">Ainda não há movimentações neste período</Text><Text color="app.muted" fontSize="sm">Cadastre receitas e despesas para visualizar a evolução e comparar os meses.</Text></VStack>}
  </Box>;
};
export default ExpenseChart;

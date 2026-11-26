import { Box, SimpleGrid, Stat, StatLabel, StatNumber, Flex, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiDollarSign, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import ExpenseChart from './ExpenseChart';
import BudgetOverview from './BudgetOverview';
import SavingsGoals from './SavingsGoals';
import RecentTransactions from './RecentTransactions';
import { currency, getTotals, useFinanceData } from '../../data/financeStore';

function StatCard({ title, stat, icon, tone, note }: { title: string; stat: string; icon: React.ElementType; tone: string; note: string }) {
  const border = useColorModeValue('rgba(220,230,241,.95)', 'rgba(49,67,91,.72)');
  return <Stat p={{ base: 4, md: 5 }} bg="app.surface" borderRadius="2xl" border="1px solid" borderColor={border} minW={0} boxShadow="0 10px 26px rgba(1,7,18,.10)" transition="transform .2s, box-shadow .2s" _hover={{ transform: 'translateY(-2px)', boxShadow: 'soft' }}>
    <Flex justify="space-between" align="start" gap={3}><Box minW={0}><StatLabel color="app.muted" fontSize="sm" fontWeight="600">{title}</StatLabel><StatNumber fontFamily="Manrope" fontSize={{ base: '2xl', md: '3xl' }} letterSpacing="-.05em" mt="2" overflowWrap="anywhere">{stat}</StatNumber><Text fontSize="xs" color="app.muted" mt="2">{note}</Text></Box><Flex p="3" bg={tone} color="white" borderRadius="xl"><Icon as={icon} boxSize="5" /></Flex></Flex>
  </Stat>;
}

const DashboardLayout = ({ period }: { period: string }) => {
  const { transactions } = useFinanceData();
  const months = period === 'thisMonth' || period === 'lastMonth' ? 1 : Number(period);
  const current = new Date();
  const periodOffset = period === 'lastMonth' ? 1 : 0;
  const periodStart = new Date(current.getFullYear(), current.getMonth() - (months - 1) - periodOffset, 1);
  const periodKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
  const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const periodEnd = periodOffset ? localDateKey(new Date(current.getFullYear(), current.getMonth(), 0)) : localDateKey(current);
  const periodTransactions = transactions.filter((item) => item.date >= `${periodKey}-01` && item.date <= periodEnd);
  const totals = getTotals(periodTransactions);
  const allTotals = getTotals(transactions);
  const dateLabel = current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const graphMonths = period === 'thisMonth' || period === 'lastMonth' ? '1' : period;
  return <Box>
    <Flex align="center" justify="space-between" mb={5}><Box><Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".12em" textTransform="uppercase">{dateLabel}</Text><Text color="app.muted" fontSize="sm" mt="1">A clear view of your money, all in one place.</Text></Box></Flex>
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={4} mb={6}>
      <StatCard title="Total balance" stat={currency(allTotals.income - allTotals.expense)} icon={FiDollarSign} tone="linear-gradient(145deg,#0785a2,#16c3df)" note="Across completed transactions" />
      <StatCard title="Income" stat={currency(totals.income)} icon={FiTrendingUp} tone="#10a978" note={period === 'lastMonth' ? 'Previous month' : period === 'thisMonth' ? 'Current month' : `In the last ${months} months`} />
      <StatCard title="Expenses" stat={currency(totals.expense)} icon={FiTrendingDown} tone="#e24d66" note={period === 'lastMonth' ? 'Previous month' : period === 'thisMonth' ? 'Current month' : `In the last ${months} months`} />
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={5} mb={5}>
      <Box gridColumn={{ xl: 'span 8' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 3, md: 5 }} minW={0} boxShadow="0 10px 30px rgba(1,7,18,.10)"><ExpenseChart timeRange={graphMonths} monthOffset={periodOffset} /></Box>
      <Box gridColumn={{ xl: 'span 4' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 3, md: 5 }} minW={0}><BudgetOverview /></Box>
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={5}>
      <Box gridColumn={{ xl: 'span 5' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 5, md: 6 }}><SavingsGoals /></Box>
      <Box gridColumn={{ xl: 'span 7' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 5, md: 6 }}><RecentTransactions /></Box>
    </SimpleGrid>
  </Box>;
};
export default DashboardLayout;

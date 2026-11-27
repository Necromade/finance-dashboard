import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import ExpenseChart from './ExpenseChart';
import BudgetOverview from './BudgetOverview';
import SavingsGoals from './SavingsGoals';
import RecentTransactions from './RecentTransactions';
import { FinanceInsights, SummaryCards, DashboardWidgets } from './FinanceWidgets';
import { useFinanceData } from '../../data/financeStore';

const DashboardLayout = ({ period }: { period: string }) => {
  const { transactions } = useFinanceData();
  const offset = period === 'lastMonth' ? 1 : 0;
  const selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' });
  const graphMonths = period === 'thisMonth' || period === 'lastMonth' ? '1' : period;
  return <Box>
    <Flex align="center" justify="space-between" mb={5}><Box><Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".12em" textTransform="uppercase">{dateLabel}</Text><Text color="app.muted" fontSize="sm" mt="1">Seu panorama financeiro, com os próximos passos em foco.</Text></Box></Flex>
    <Box mb={5}><Text color="app.muted" fontSize="xs" fontWeight="600" letterSpacing=".04em" mb={3}>RESUMO MENSAL · {selectedMonth.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</Text><SummaryCards transactions={transactions} month={selectedMonth}/></Box>
    <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={5} mb={5}>
      <Box gridColumn={{ xl: 'span 8' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 3, md: 5 }} minW={0} boxShadow="soft"><ExpenseChart timeRange={graphMonths} monthOffset={offset}/></Box>
      <Box gridColumn={{ xl: 'span 4' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 3, md: 5 }} minW={0}><BudgetOverview /></Box>
    </SimpleGrid>
    <Box mb={5}><FinanceInsights month={selectedMonth}/></Box>
    <Box mb={5}><DashboardWidgets/></Box>
    <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={5}>
      <Box gridColumn={{ xl: 'span 5' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 5, md: 6 }}><SavingsGoals /></Box>
      <Box gridColumn={{ xl: 'span 7' }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl" p={{ base: 5, md: 6 }}><RecentTransactions /></Box>
    </SimpleGrid>
  </Box>;
};
export default DashboardLayout;

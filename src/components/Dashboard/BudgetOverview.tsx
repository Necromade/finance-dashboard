import { useState } from 'react';
import { Box, Text, Progress, VStack, HStack, Spacer, useColorModeValue, Heading, FormControl, FormLabel, Input, Button, SimpleGrid } from '@chakra-ui/react';
import { addBudget, currency, useFinanceData } from '../../data/financeStore';

const BudgetOverview = () => {
  const { transactions, budgets } = useFinanceData();
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState('');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const items = budgets.map((budget) => {
    const spent = transactions.filter((t) => t.type === 'expense' && t.status === 'completed' && t.category === budget.category && t.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, t) => sum + t.amount, 0);
    return { ...budget, spent, percentage: budget.limit > 0 ? Math.min(100, spent / budget.limit * 100) : 0 };
  });
  return <Box p={{ base: 3, md: 5 }} borderRadius="lg"><Heading size="md" mb={4}>Orçamento</Heading>
    <Box as="form" onSubmit={(event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); try { addBudget(category, Number(limit)); setCategory(''); setLimit(''); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Dados inválidos.'); } }} mb={4}><SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} alignItems="end"><FormControl><FormLabel fontSize="sm">Categoria</FormLabel><Input aria-label="Categoria do orçamento" value={category} onChange={(e) => setCategory(e.target.value)} /></FormControl><FormControl><FormLabel fontSize="sm">Limite (USD)</FormLabel><Input aria-label="Limite do orçamento" type="number" min="0.01" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} /></FormControl><Button type="submit">Salvar orçamento</Button></SimpleGrid>{error && <Text role="alert" color="red.500">{error}</Text>}</Box>
    {items.length ? <VStack spacing={4} align="stretch">{items.map((item) => <Box key={item.category}><HStack mb={2}><Text fontSize="sm">{item.category}</Text><Spacer/><Text fontSize="sm">{currency(item.spent)} / {currency(item.limit)}</Text></HStack><Progress aria-label={`${item.category}: ${Math.round(item.percentage)}% do orçamento usado`} value={item.percentage} borderRadius="full" /></Box>)}</VStack> : <Text color={textColor}>Nenhum orçamento cadastrado.</Text>}
  </Box>;
};
export default BudgetOverview;

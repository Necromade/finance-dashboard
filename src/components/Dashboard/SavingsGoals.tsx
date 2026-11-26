import { useState } from 'react';
import { Box, Text, VStack, HStack, useColorModeValue, CircularProgress, CircularProgressLabel, FormControl, FormLabel, Input, Button, SimpleGrid } from '@chakra-ui/react';
import { addGoal, currency, useFinanceData } from '../../data/financeStore';
const SavingsGoals = () => {
  const { goals } = useFinanceData();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [error, setError] = useState('');
  const headingColor = useColorModeValue('gray.900', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  return <Box><Text fontSize="lg" fontWeight="medium" mb="4" color={headingColor}>Metas de poupança</Text><Text fontSize="sm" color={textColor} mb="6">Acompanhe o progresso das suas metas.</Text>
    <Box as="form" onSubmit={(event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); try { addGoal(name, Number(current), Number(target)); setName(''); setTarget(''); setCurrent('0'); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Dados inválidos.'); } }} mb={5}><SimpleGrid columns={{ base: 1, md: 4 }} spacing={2} alignItems="end"><FormControl><FormLabel fontSize="sm">Nome da meta</FormLabel><Input value={name} onChange={(e) => setName(e.target.value)} /></FormControl><FormControl><FormLabel fontSize="sm">Já guardado (USD)</FormLabel><Input type="number" min="0" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} /></FormControl><FormControl><FormLabel fontSize="sm">Valor desejado (USD)</FormLabel><Input type="number" min="0.01" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} /></FormControl><Button type="submit">Salvar meta</Button></SimpleGrid>{error && <Text role="alert" color="red.500">{error}</Text>}</Box>
    {goals.length ? <VStack spacing="4" align="stretch">{goals.map((goal) => { const percentage = goal.target > 0 ? Math.min(100, goal.current / goal.target * 100) : 0; return <Box key={goal.name} p="4" borderRadius="lg" borderWidth="1px"><HStack><CircularProgress value={percentage} color={goal.color} size="60px" aria-label={`${goal.name}: ${percentage.toFixed(0)}%`}><CircularProgressLabel>{percentage.toFixed(0)}%</CircularProgressLabel></CircularProgress><Box><Text fontWeight="medium">{goal.name}</Text><Text fontSize="sm" color={textColor}>{currency(goal.current)} de {currency(goal.target)}</Text></Box></HStack></Box>; })}</VStack> : <Text color={textColor}>Nenhuma meta cadastrada.</Text>}
  </Box>;
};
export default SavingsGoals;

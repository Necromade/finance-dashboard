import { Badge, Box, Button, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, VStack, Heading, useColorModeValue } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { currency, useFinanceData } from '../../data/financeStore';

const RecentTransactions = () => {
  const { transactions } = useFinanceData();
  const header = useColorModeValue('#f4f7fb', '#17253a');
  return <VStack align="stretch" spacing={4}>
    <HStack justify="space-between"><Box><Heading size="md">Recent transactions</Heading><Text color="app.muted" fontSize="sm" mt="1">Latest activity across your accounts</Text></Box><Button as={Link} to="/transactions" size="xs" variant="ghost" colorScheme="brand">View all</Button></HStack>
    <Box overflowX="auto" border="1px solid" borderColor="app.border" borderRadius="xl">
      <Table minW="580px" size="sm" variant="simple">
        <Thead bg={header}><Tr><Th py="3">Transaction</Th><Th>Date</Th><Th>Status</Th><Th isNumeric>Amount</Th></Tr></Thead>
        <Tbody>{transactions.slice(0, 5).map((item) => <Tr key={item.id} _hover={{ bg: 'app.surfaceRaised' }}><Td py="3"><HStack spacing="3"><Box w="2" h="8" borderRadius="full" bg={item.type === 'income' ? 'income.400' : 'expense.400'}/><Box><Text fontWeight="600" fontSize="sm">{item.description}</Text><Text fontSize="xs" color="app.muted">{item.category}</Text></Box></HStack></Td><Td color="app.muted">{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Td><Td><Badge borderRadius="full" colorScheme={item.status === 'completed' ? 'green' : item.status === 'pending' ? 'yellow' : 'red'}>{item.status}</Badge></Td><Td isNumeric fontWeight="700" color={item.type === 'income' ? 'income.400' : 'expense.400'}>{item.type === 'income' ? '+' : '−'}{currency(item.amount)}</Td></Tr>)}
        {!transactions.length && <Tr><Td colSpan={4} textAlign="center" py="8" color="app.muted">No transactions yet.</Td></Tr>}</Tbody>
      </Table>
    </Box>
  </VStack>;
};
export default RecentTransactions;

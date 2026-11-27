import { Badge, Box, Button, HStack, Table, TableCaption, Tbody, Td, Text, Th, Thead, Tr, VStack, Heading } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { currency, useFinanceData } from '../../data/financeStore';

const labels={completed:'Concluída',pending:'Pendente',cancelled:'Cancelada',failed:'Falhou'};
const RecentTransactions=()=>{
 const {transactions}=useFinanceData();
 return <VStack align="stretch" spacing={4}>
  <HStack justify="space-between"><Box><Heading size="md">Transações recentes</Heading><Text color="app.muted" fontSize="sm" mt="1">Atividade mais recente das suas contas</Text></Box><Button as={Link} to="/transactions" size="xs" variant="ghost" colorScheme="brand">Ver todas</Button></HStack>
  <Box overflowX="auto" border="1px solid" borderColor="app.border" borderRadius="xl"><Table minW="580px" size="sm" variant="simple"><TableCaption placement="top" srOnly>Últimas cinco transações registradas</TableCaption><Thead bg="app.surfaceRaised"><Tr><Th py="3">Lançamento</Th><Th>Data</Th><Th>Status</Th><Th isNumeric>Valor</Th></Tr></Thead><Tbody>{transactions.slice(0,5).map(item=><Tr key={item.id} _hover={{bg:'app.surfaceRaised'}}><Td py="3"><HStack spacing="3"><Box w="2" h="8" borderRadius="full" bg={item.type==='income'?'income.400':'expense.400'}/><Box><Text fontWeight="600" fontSize="sm">{item.description}</Text><Text fontSize="xs" color="app.muted">{item.category}</Text></Box></HStack></Td><Td color="app.muted">{new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}</Td><Td><Badge borderRadius="full" colorScheme={item.status==='completed'?'green':item.status==='pending'?'yellow':item.status==='cancelled'?'gray':'red'}>{labels[item.status]}</Badge></Td><Td isNumeric fontWeight="700" color={item.type==='income'?'income.400':'expense.400'}>{item.type==='income'?'+':'−'}{currency(item.amount)}</Td></Tr>)}{!transactions.length&&<Tr><Td colSpan={4} textAlign="center" py="8" color="app.muted">Nenhuma transação ainda. Registre seu primeiro lançamento para ver sua atividade aqui.</Td></Tr>}</Tbody></Table></Box>
 </VStack>;
};
export default RecentTransactions;

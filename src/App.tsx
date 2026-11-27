import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Avatar, Box, Button, Flex, Heading, HStack, IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Text, Tooltip, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMenu } from 'react-icons/fi';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Planning from './pages/Planning';
import Accounts from './pages/Accounts';
import CalendarPage from './pages/Calendar';
import FinancialReport from './pages/FinancialReport';
import ThemeToggle from './theme/ThemeToggle';
import { useFinanceData } from './data/financeStore';
import { readLocal, writeLocal } from './storage.ts';

export const PRIVACY_EVENT = 'finance-privacy-toggle';
function AppFrame() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return readLocal('finance-sidebar-expanded') !== 'false';
  });
  const location = useLocation();
  const data = useFinanceData();
  const hasData = data.transactions.length + data.accounts.length + data.goals.length + data.budgets.length + data.recurring.length > 0;
  const [showOnboarding, setShowOnboarding] = useState(() => readLocal('finance-onboarding-complete') !== 'true' && !hasData);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [period, setPeriod] = useState('6');
  const [privacy, setPrivacy] = useState(() => readLocal('finance-privacy') === 'true');
  const pageTitle = location.pathname === '/transactions' ? 'Transações' : location.pathname === '/planning' ? 'Planejamento' : location.pathname === '/accounts' ? 'Contas e cartões' : location.pathname === '/calendar' ? 'Calendário financeiro' : location.pathname === '/report/pdf' ? 'Relatório financeiro' : location.pathname === '/' ? 'Visão geral' : 'Análises';
  const headerBg = useColorModeValue('rgba(255,255,255,.9)', 'rgba(12,18,16,.92)');
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const finishOnboarding = () => { writeLocal('finance-onboarding-complete', 'true'); setShowOnboarding(false); };
  const toggleSidebar = () => setSidebarExpanded(value => {
    const next = !value;
    writeLocal('finance-sidebar-expanded', String(next));
    return next;
  });
  const showPeriod = ['/', '/analytics', '/reports'].includes(location.pathname);
  return <Flex minH="100dvh" w="full" bg="app.canvas" color="app.text">
    <Sidebar isOpen={isOpen} onClose={onClose} expanded={sidebarExpanded} onToggle={toggleSidebar} />
    <Box as="main" flex="1" ml={{ base: 0, md: sidebarExpanded ? '256px' : '76px' }} minW={0} transition="margin .22s ease">
      <Flex as="header" position="sticky" top="0" zIndex="10" h={{ base: '68px', md: '76px' }} px={{ base: 3, sm: 4, md: 7, xl: 9 }} align="center" justify="space-between" borderBottom="1px solid" borderColor="app.border" bg={headerBg} backdropFilter="blur(18px)" gap={{ base: 2, md: 4 }}>
        <HStack spacing={3} minW={0}>
          <IconButton display={{ base: 'inline-flex', md: 'none' }} aria-label="Abrir menu" icon={<FiMenu />} onClick={onOpen} variant="ghost" />
          <Box minW={0}><Text display={{ base: 'none', md: 'block' }} color="app.muted" fontSize="xs" fontWeight="600" letterSpacing=".12em" textTransform="uppercase">Finance+ / Espaço financeiro</Text><Heading noOfLines={1} fontSize={{ base: 'md', md: 'lg' }} mt={{ base: 0, md: 1 }}>{pageTitle}</Heading></Box>
        </HStack>
        <HStack spacing={{ base: 1, md: 2 }} flex="none">
          {!online&&<Tooltip label="Dados salvos neste dispositivo; conexão indisponível"><Alert display={{base:'none',sm:'flex'}} status="warning" p={{sm:1,md:2}} borderRadius="lg" aria-label="Modo offline"><AlertIcon boxSize={3} mr={1}/><Text fontSize="xs">Offline</Text></Alert></Tooltip>}
          {showPeriod&&<Select value={period} onChange={event=>setPeriod(event.target.value)} size="sm" w={{base:'144px',sm:'150px',md:'156px'}} aria-label={location.pathname==='/'?'Período do gráfico do dashboard':'Período das análises'}><option value="thisMonth">Este mês</option><option value="lastMonth">Mês anterior</option><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">1 ano</option></Select>}
          <Tooltip label={privacy?'Mostrar valores':'Ocultar valores'}><IconButton variant="icon" aria-label={privacy?'Mostrar valores':'Ocultar valores'} icon={privacy?<FiEye/>:<FiEyeOff/>} onClick={()=>{const next=!privacy;setPrivacy(next);writeLocal('finance-privacy',String(next));window.dispatchEvent(new CustomEvent(PRIVACY_EVENT,{detail:next}));}}/></Tooltip><ThemeToggle/>
          <Tooltip label="Perfil · Conta pessoal"><HStack spacing={2} pl={{base:0,sm:1,md:2}}><Avatar display={{base:'none',sm:'flex'}} size="sm" name="Usuário" bg="brand.500" color="#07121d"/><Box display={{base:'none',lg:'block'}}><Text fontSize="sm" fontWeight="700">Usuário</Text><Text fontSize="xs" color="app.muted">Conta pessoal</Text></Box></HStack></Tooltip>
        </HStack>
      </Flex>
      {!online&&<Alert status="warning" borderRadius={0} py={2}><AlertIcon/><Text fontSize="sm">Você está offline. O app segue disponível com os dados salvos neste dispositivo; recursos que exigem internet podem não carregar.</Text></Alert>}
      <Box maxW="1600px" mx="auto" w="full" px={{ base: 4, md: 8, xl: 10 }} py={{ base: 5, md: 8 }}>
        <Routes><Route path="/" element={<DashboardLayout period={period} />} /><Route path="/transactions" element={<Transactions />} /><Route path="/analytics" element={<Analytics period={period} onPeriodChange={setPeriod} />} /><Route path="/reports" element={<Analytics period={period} onPeriodChange={setPeriod} />} /><Route path="/planning" element={<Planning />} /><Route path="/accounts" element={<Accounts />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/report/pdf" element={<FinancialReport />} /><Route path="*" element={<Box role="status" textAlign="center" py={{base:12,md:20}}><Heading size="md">Página não encontrada</Heading><Text color="app.muted" mt={2}>Confira o endereço ou volte para sua visão geral.</Text><Button as={Link} to="/" mt={5}>Ir para o início</Button></Box>} /></Routes>
      </Box>
    </Box>
    <Modal isOpen={showOnboarding} onClose={finishOnboarding} isCentered size="lg"><ModalOverlay/><ModalContent bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl"><ModalHeader><Text color="brand.300" fontSize="xs" letterSpacing=".14em">BEM-VINDO AO FINANCE+</Text><Heading size="lg" mt={2}>Organize seu dinheiro com clareza</Heading></ModalHeader><ModalCloseButton aria-label="Fechar apresentação"/><ModalBody><Text color="app.muted" mb={5}>Um guia rápido para começar. Seus dados ficam salvos neste dispositivo.</Text><SimpleGrid columns={{base:1,sm:2}} spacing={3}><Box p={4} bg="app.surfaceRaised" borderRadius="xl"><Text fontWeight="700">1. Registre</Text><Text color="app.muted" fontSize="sm" mt={1}>Adicione receitas, despesas, recorrências ou parcelas.</Text></Box><Box p={4} bg="app.surfaceRaised" borderRadius="xl"><Text fontWeight="700">2. Planeje</Text><Text color="app.muted" fontSize="sm" mt={1}>Crie orçamentos, metas, contas e cartões.</Text></Box><Box p={4} bg="app.surfaceRaised" borderRadius="xl"><Text fontWeight="700">3. Acompanhe</Text><Text color="app.muted" fontSize="sm" mt={1}>Consulte o calendário, previsões e relatórios.</Text></Box><Box p={4} bg="app.surfaceRaised" borderRadius="xl"><Text fontWeight="700">4. Faça backup</Text><Text color="app.muted" fontSize="sm" mt={1}>Exporte seus dados em Planejamento.</Text></Box></SimpleGrid></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={finishOnboarding}>Agora não</Button><Button as={Link} to="/transactions" onClick={finishOnboarding}>Começar</Button></ModalFooter></ModalContent></Modal>
  </Flex>;
}
function App() { return <Router basename={import.meta.env.BASE_URL}><AppFrame /></Router>; }
export default App;

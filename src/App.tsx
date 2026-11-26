import { useState } from 'react';
import { Avatar, Box, Flex, Heading, HStack, IconButton, Select, Text, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import { FiMenu } from 'react-icons/fi';
import ThemeToggle from './theme/ThemeToggle';

function AppFrame() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const [period, setPeriod] = useState('6');
  const pageTitle = location.pathname === '/transactions' ? 'Transactions' : location.pathname === '/' ? 'Dashboard' : 'Analytics';
  const headerBg = useColorModeValue('rgba(255,255,255,.82)', 'rgba(11,18,32,.82)');
  return <Flex minH="100dvh" w="full" bg="app.canvas" color="app.text">
    <Sidebar isOpen={isOpen} onClose={onClose} />
    <Box as="main" flex="1" ml={{ base: 0, md: '76px' }} minW={0} transition="margin .25s ease">
      <Flex as="header" position="sticky" top="0" zIndex="10" h={{ base: '68px', md: '78px' }} px={{ base: 4, md: 8, xl: 10 }} align="center" justify="space-between" borderBottom="1px solid" borderColor="app.border" bg={headerBg} backdropFilter="blur(18px)">
        <HStack spacing={3}>
          <IconButton display={{ base: 'inline-flex', md: 'none' }} aria-label="Open menu" icon={<FiMenu />} onClick={onOpen} variant="ghost" />
          <Box><Text display={{ base: 'none', md: 'block' }} color="app.muted" fontSize="xs" fontWeight="600" letterSpacing=".12em" textTransform="uppercase">Finance+ / Personal workspace</Text><Heading fontSize={{ base: 'md', md: 'lg' }} mt={{ base: 0, md: 1 }}>{pageTitle}</Heading></Box>
        </HStack>
        <HStack spacing={{ base: 1, md: 3 }}>
          {location.pathname !== '/transactions' && <Select value={period} onChange={(event) => setPeriod(event.target.value)} size="sm" w={{ base: '112px', md: '150px' }} aria-label="Reporting period"><option value="thisMonth">This month</option><option value="lastMonth">Previous month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">1 year</option></Select>}
          <ThemeToggle /><Box display={{ base: 'none', sm: 'block' }} h="8" borderLeft="1px solid" borderColor="app.border" />
          <HStack spacing={3} pl={{ base: 0, sm: 2 }}><Avatar size="sm" name="User" bg="brand.500" color="#07121d"/><Box display={{ base: 'none', lg: 'block' }}><Text fontSize="sm" fontWeight="700">User</Text><Text fontSize="xs" color="app.muted">Personal account</Text></Box></HStack>
        </HStack>
      </Flex>
      <Box maxW="1600px" mx="auto" w="full" px={{ base: 4, md: 8, xl: 10 }} py={{ base: 5, md: 8 }}>
        <Routes><Route path="/" element={<DashboardLayout period={period} />} /><Route path="/transactions" element={<Transactions />} /><Route path="/analytics" element={<Analytics period={period} onPeriodChange={setPeriod} />} /><Route path="/reports" element={<Analytics period={period} onPeriodChange={setPeriod} />} /></Routes>
      </Box>
    </Box>
  </Flex>;
}
function App() { return <Router><AppFrame /></Router>; }
export default App;

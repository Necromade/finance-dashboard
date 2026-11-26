import { Box, Flex, Icon, Text, VStack, HStack, Drawer, DrawerContent, DrawerOverlay, DrawerCloseButton, DrawerHeader, DrawerBody, Tooltip } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiDollarSign, FiPieChart, FiActivity } from 'react-icons/fi';

interface SidebarProps { isOpen: boolean; onClose: () => void }
const navItems = [
  { icon: FiHome, label: 'Dashboard', to: '/' },
  { icon: FiPieChart, label: 'Analytics', to: '/analytics' },
  { icon: FiActivity, label: 'Transactions', to: '/transactions' },
];

function SidebarPanel({ onClose, compact = false }: { onClose: () => void; compact?: boolean }) {
  const location = useLocation();
  const itemList = <VStack align="stretch" spacing="6">{navItems.map(({ icon, label, to }) => {
    const active = location.pathname === to || (to === '/analytics' && location.pathname === '/reports');
    const link = <Flex as={Link} to={to} onClick={onClose} aria-label={label} title={compact ? label : undefined} justify={compact ? 'center' : 'start'} align="center" gap="3" w="full" h="11" px={compact ? 0 : 3} borderRadius="xl" position="relative" color={active ? '#55d6e9' : '#92a2ba'} bg={active ? 'rgba(8,180,210,.14)' : 'transparent'} transition="all .18s" _hover={{ bg: active ? 'rgba(8,180,210,.18)' : 'rgba(255,255,255,.055)', color: 'white' }}>
      {active && <Box position="absolute" left="0" top="2" bottom="2" w="1" bg="brand.400" borderRadius="full" />}<Icon as={icon} boxSize="5"/><Text display={compact ? 'none' : 'block'} fontSize="sm" fontWeight={active ? '700' : '500'}>{label}</Text>
    </Flex>;
    return compact ? <Tooltip key={to} label={label} placement="right" hasArrow>{link}</Tooltip> : <Box key={to}>{link}</Box>;
  })}</VStack>;
  return <Flex direction="column" align="center" w={compact ? '76px' : '64'} h="full" bg="#0e1929" color="white" borderRight="1px solid #1d2b40" px={compact ? 2 : 4} py="5">
    <Flex align="center" justify={compact ? 'center' : 'start'} w="full" mb="8" px={compact ? 0 : 2} gap="3" title="Finance+">
      <Flex flex="none" w="10" h="10" align="center" justify="center" borderRadius="xl" bg="brand.500" color="#07121d" boxShadow="0 0 24px rgba(8,180,210,.22)"><Icon as={FiDollarSign} boxSize="5" strokeWidth="2.6" /></Flex>
      {!compact && <Box><Text fontFamily="Manrope" fontSize="xl" fontWeight="800" letterSpacing="-.06em">Finance<Text as="span" color="#22c7e2">+</Text></Text><Text color="#8192a9" fontSize="10px" letterSpacing=".13em" fontWeight="700">FINANCIAL SUITE</Text></Box>}
    </Flex>
    {!compact && <Text alignSelf="start" px="3" mb="3" color="#71829a" fontSize="10px" fontWeight="700" letterSpacing=".16em">WORKSPACE</Text>}
    {itemList}
    <Box mt="auto" pt="4" w="full" borderTop="1px solid #1d2b40">
      {compact ? <Tooltip label="Personal account" placement="right" hasArrow><Flex as="button" aria-label="Personal account" mx="auto" w="10" h="10" borderRadius="full" bg="#23364e" align="center" justify="center" color="#7ddbeb" fontWeight="700" fontSize="sm">U</Flex></Tooltip> : <HStack px="2"><Flex w="9" h="9" borderRadius="full" bg="#23364e" align="center" justify="center" color="#7ddbeb" fontWeight="700" fontSize="sm">U</Flex><Box><Text fontSize="sm" fontWeight="700">User</Text><Text color="#8192a9" fontSize="xs">Personal account</Text></Box></HStack>}
    </Box>
  </Flex>;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => <>
  <Box display={{ base: 'none', md: 'block' }} position="fixed" insetY="0" left="0" zIndex="20"><SidebarPanel onClose={onClose} compact /></Box>
  <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs"><DrawerOverlay bg="blackAlpha.700"/><DrawerContent bg="#0e1929" maxW="64"><DrawerCloseButton color="white"/><DrawerHeader p="0"/><DrawerBody p="0"><SidebarPanel onClose={onClose} /></DrawerBody></DrawerContent></Drawer>
</>;
export default Sidebar;

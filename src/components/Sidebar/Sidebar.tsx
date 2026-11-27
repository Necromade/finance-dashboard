import {
  Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay,
  Flex, HStack, Icon, IconButton, Text, Tooltip, VStack, useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiActivity, FiCalendar, FiChevronsLeft, FiChevronsRight, FiCreditCard,
  FiDollarSign, FiHome, FiPieChart,
} from 'react-icons/fi';

interface SidebarProps { isOpen: boolean; onClose: () => void; expanded?: boolean; onToggle?: () => void }
const groups = [
  {
    label: 'PRINCIPAL',
    items: [
      { icon: FiHome, label: 'Visão geral', to: '/' },
      { icon: FiPieChart, label: 'Análises', to: '/analytics' },
      { icon: FiActivity, label: 'Transações', to: '/transactions' },
    ],
  },
  {
    label: 'ORGANIZAÇÃO',
    items: [
      { icon: FiCalendar, label: 'Planejamento', to: '/planning' },
      { icon: FiCreditCard, label: 'Contas e cartões', to: '/accounts' },
      { icon: FiCalendar, label: 'Calendário', to: '/calendar' },
    ],
  },
];

function SidebarPanel({ onClose, compact = false, onToggle }: { onClose: () => void; compact?: boolean; onToggle?: () => void }) {
  const location = useLocation();
  const activeColor = useColorModeValue('brand.700', 'brand.300');
  const profileColor = useColorModeValue('brand.700', 'brand.300');
  const width = compact ? '76px' : '256px';

  return (
    <Flex
      as="nav"
      aria-label="Navegação principal"
      direction="column"
      align="stretch"
      w={width}
      h="100dvh"
      bg="app.sidebar"
      color="app.text"
      borderRight="1px solid"
      borderColor="app.border"
      px={compact ? 2 : 4}
      py={4}
      overflow="hidden"
      transition="width .22s ease"
    >
      <Flex align="center" justify={compact ? 'center' : 'start'} minH="48px" mb={5} px={compact ? 0 : 2} gap={3} flex="none">
        <Flex flex="none" w="40px" h="40px" align="center" justify="center" borderRadius="12px" bg="brand.500" color="#062017">
          <Icon as={FiDollarSign} boxSize="20px" strokeWidth={2.4} />
        </Flex>
        {!compact && (
          <Box minW={0}>
            <Text fontFamily="Manrope" fontSize="xl" fontWeight="800" letterSpacing="-.06em" lineHeight="1.1">
              Finance<Text as="span" color="brand.300">+</Text>
            </Text>
            <Text color="app.muted" fontSize="10px" letterSpacing=".13em" fontWeight="700" mt={1}>GESTÃO FINANCEIRA</Text>
          </Box>
        )}
      </Flex>

      <Box flex="1" minH={0} overflowY="auto" overflowX="hidden" aria-label="Seções do menu">
        <VStack align="stretch" spacing={5}>
          {groups.map((group) => (
            <Box key={group.label}>
              {!compact && <Text px={3} mb={2} color="app.muted" opacity={0.76} fontSize="10px" fontWeight="700" letterSpacing=".14em">{group.label}</Text>}
              <VStack align="stretch" spacing="6px">
                {group.items.map(({ icon, label, to }) => {
                  const active = location.pathname === to || (to === '/analytics' && location.pathname === '/reports');
                  const item = (
                    <Flex
                      as={Link}
                      to={to}
                      onClick={onClose}
                      aria-label={label}
                      aria-current={active ? 'page' : undefined}
                      title={compact ? label : undefined}
                      justify={compact ? 'center' : 'start'}
                      align="center"
                      gap={3}
                      w="full"
                      minW={0}
                      minH="44px"
                      px={compact ? 0 : 3}
                      borderRadius="11px"
                      position="relative"
                      color={active ? activeColor : 'app.muted'}
                      bg={active ? 'rgba(16,185,129,.12)' : 'transparent'}
                      transition="background-color .18s ease, color .18s ease"
                      _hover={{ bg: active ? 'rgba(16,185,129,.16)' : 'app.surfaceRaised', color: 'app.text', textDecoration: 'none' }}
                      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.300', outlineOffset: '2px' }}
                    >
                      {active && <Box position="absolute" left="0" top="9px" bottom="9px" w="2px" bg="brand.400" borderRadius="full" />}
                      <Icon as={icon} boxSize="20px" flex="none" />
                      {!compact && <Text noOfLines={1} fontSize="sm" fontWeight={active ? '700' : '500'}>{label}</Text>}
                    </Flex>
                  );
                  return compact ? (
                    <Tooltip key={to} label={label} placement="right" hasArrow>
                      <Box>{item}</Box>
                    </Tooltip>
                  ) : <Box key={to}>{item}</Box>;
                })}
              </VStack>
            </Box>
          ))}
        </VStack>
      </Box>

      <VStack align="stretch" spacing={3} flex="none" pt={3} mt={3} borderTop="1px solid" borderColor="app.border">
        {onToggle && (
          <Tooltip label={compact ? 'Expandir menu' : 'Recolher menu'} placement="right" hasArrow>
            <IconButton
              variant="icon"
              alignSelf={compact ? 'center' : 'stretch'}
              aria-label={compact ? 'Expandir menu' : 'Recolher menu'}
              icon={compact ? <FiChevronsRight /> : <FiChevronsLeft />}
              onClick={onToggle}
            />
          </Tooltip>
        )}
        {compact ? (
          <Tooltip label="Usuário · Conta pessoal" placement="right" hasArrow>
            <Flex aria-label="Perfil: usuário, conta pessoal" mx="auto" w="40px" h="40px" borderRadius="full" bg="app.surfaceRaised" align="center" justify="center" color={profileColor} fontWeight="700" fontSize="sm">U</Flex>
          </Tooltip>
        ) : (
          <HStack px={2} minH="44px" spacing={3}>
            <Flex w="36px" h="36px" flex="none" borderRadius="full" bg="app.surfaceRaised" align="center" justify="center" color={profileColor} fontWeight="700" fontSize="sm">U</Flex>
            <Box minW={0}><Text fontSize="sm" fontWeight="700">Usuário</Text><Text color="app.muted" fontSize="xs">Conta pessoal</Text></Box>
          </HStack>
        )}
      </VStack>
    </Flex>
  );
}

const Sidebar = ({ isOpen, onClose, expanded = false, onToggle }: SidebarProps) => (
  <>
    <Box display={{ base: 'none', md: 'block' }} position="fixed" top="0" bottom="0" left="0" zIndex="20" w={expanded ? '256px' : '76px'} transition="width .22s ease">
      <SidebarPanel onClose={onClose} compact={!expanded} onToggle={onToggle} />
    </Box>
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay bg="blackAlpha.700" />
      <DrawerContent bg="app.sidebar" maxW="256px">
        <DrawerCloseButton aria-label="Fechar menu" color="app.text" />
        <DrawerHeader p="0" />
        <DrawerBody p="0"><SidebarPanel onClose={onClose} /></DrawerBody>
      </DrawerContent>
    </Drawer>
  </>
);

export default Sidebar;

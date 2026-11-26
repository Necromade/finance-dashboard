import { IconButton, useColorMode, Tooltip } from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip label={`Ativar tema ${colorMode === 'light' ? 'escuro' : 'claro'}`}>
      <IconButton
        aria-label="Alternar tema claro e escuro"
        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant="ghost"
        size="sm"
        fontSize="xl"
        color="brand.300"
        _hover={{ color: 'brand.200', bg: 'whiteAlpha.100' }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;

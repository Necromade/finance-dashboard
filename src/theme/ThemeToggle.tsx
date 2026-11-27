import { IconButton, useColorMode, Tooltip } from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip label={`Ativar tema ${colorMode === 'light' ? 'Emerald Dark' : 'claro'}`}>
      <IconButton
        aria-label={`Ativar tema ${colorMode === 'light' ? 'Emerald Dark' : 'claro'}`}
        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant="icon"
        fontSize="xl"
      />
    </Tooltip>
  );
};

export default ThemeToggle;

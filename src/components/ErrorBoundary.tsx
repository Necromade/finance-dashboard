import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertIcon, Box, Button, Heading, Text, VStack } from '@chakra-ui/react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha inesperada na interface Finance+.', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <Box minH="100dvh" display="grid" placeItems="center" bg="app.canvas" color="app.text" p={5}>
      <VStack align="stretch" spacing={4} maxW="lg" w="full" p={{ base: 5, md: 8 }} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl">
        <Text color="brand.300" fontSize="xs" fontWeight="700" letterSpacing=".14em">FINANCE+ · RECUPERAÇÃO</Text>
        <Heading size="lg">Não foi possível exibir esta página</Heading>
        <Text color="app.muted">Seus dados financeiros permanecem neste dispositivo. Recarregue para tentar novamente.</Text>
        <Alert status="error" borderRadius="lg"><AlertIcon />A interface encontrou um erro inesperado.</Alert>
        <Button onClick={() => window.location.reload()}>Recarregar Finance+</Button>
      </VStack>
    </Box>;
  }
}

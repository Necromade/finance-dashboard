import { useRef, useState } from 'react';
import {
  Alert, AlertIcon, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay, Badge, Box, Button, FormControl, FormLabel,
  HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Text, Tooltip, useDisclosure, useToast, VStack,
} from '@chakra-ui/react';
import { FiArchive, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { addCategory, archiveCategory, deleteCategory, updateCategory, type Category } from '../../data/financeStore';

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const categoryList = useDisclosure();
  const categoryForm = useDisclosure();
  const confirm = useDisclosure();
  const toast = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6EE7B7');
  const [type, setType] = useState<Category['type']>('expense');
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const openNew = () => { setEditing(null); setName(''); setIcon('📦'); setColor('#6EE7B7'); setType('expense'); setError(''); categoryForm.onOpen(); };
  const openEdit = (item: Category) => { setEditing(item); setName(item.name); setIcon(item.icon); setColor(item.color ?? '#6EE7B7'); setType(item.type); setError(''); categoryForm.onOpen(); };
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (editing) updateCategory(editing.name, { name, icon, color, type });
      else addCategory(name, icon, type, color);
      toast({ title: editing ? 'Categoria atualizada' : 'Categoria criada', status: 'success', duration: 2500, isClosable: true });
      categoryForm.onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a categoria.'); }
  };
  const remove = () => {
    if (!deleting) return;
    try {
      deleteCategory(deleting.name);
      toast({ title: 'Categoria excluída', status: 'success', duration: 2500, isClosable: true });
    } catch (reason) {
      toast({ title: reason instanceof Error ? reason.message : 'Não foi possível excluir a categoria.', status: 'error', duration: 4500, isClosable: true });
    } finally { confirm.onClose(); setDeleting(null); }
  };
  const shown = categories.filter((category) => Boolean(category.archived) === showArchived).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return <>
    <HStack spacing={2}>
      <Button variant="outline" leftIcon={<FiArchive />} onClick={categoryList.onOpen}>Categorias</Button>
      <Tooltip label="Criar categoria"><IconButton variant="icon" aria-label="Criar categoria" icon={<FiPlus />} onClick={openNew} /></Tooltip>
    </HStack>
    <Modal isOpen={categoryList.isOpen} onClose={categoryList.onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl">
        <ModalHeader>Gerenciar categorias</ModalHeader><ModalCloseButton aria-label="Fechar gerenciamento de categorias" />
        <ModalBody>
          <HStack justify="space-between" mb={4} wrap="wrap">
            <Text color="app.muted" fontSize="sm">Categorias arquivadas continuam identificando o histórico.</Text>
            <HStack><Button size="sm" variant={showArchived ? 'outline' : 'secondary'} onClick={() => setShowArchived(false)}>Ativas</Button><Button size="sm" variant={showArchived ? 'secondary' : 'outline'} onClick={() => setShowArchived(true)}>Arquivadas</Button></HStack>
          </HStack>
          <VStack align="stretch" spacing={2}>
            {shown.map((item) => (
              <HStack key={item.id ?? item.name} p={3} bg="app.surfaceRaised" border="1px solid" borderColor="app.border" borderRadius="xl" justify="space-between">
                <HStack minW={0} spacing={3}>
                  <Box w="38px" h="38px" display="grid" placeItems="center" bg="app.surface" borderRadius="lg" border="1px solid" borderColor={item.color ?? 'app.border'} fontSize="lg">{item.icon}</Box>
                  <Box minW={0}><Text fontWeight="600" noOfLines={1}>{item.name}</Text><HStack><Badge colorScheme={item.type === 'income' ? 'green' : item.type === 'expense' ? 'orange' : 'cyan'}>{item.type === 'both' ? 'Ambos' : item.type === 'income' ? 'Receita' : 'Despesa'}</Badge>{item.id?.startsWith('default-') && <Badge variant="subtle">Padrão</Badge>}</HStack></Box>
                </HStack>
                <HStack flex="none" spacing={0}>
                  <Tooltip label="Editar"><IconButton size="sm" variant="icon" aria-label={`Editar categoria ${item.name}`} icon={<FiEdit2 />} onClick={() => openEdit(item)} /></Tooltip>
                  <Tooltip label={item.archived ? 'Reativar' : 'Arquivar'}><IconButton size="sm" variant="icon" aria-label={`${item.archived ? 'Reativar' : 'Arquivar'} categoria ${item.name}`} icon={<FiArchive />} onClick={() => archiveCategory(item.name, !item.archived)} /></Tooltip>
                  {!item.id?.startsWith('default-') && <Tooltip label="Excluir"><IconButton size="sm" variant="icon" color="expense.400" aria-label={`Excluir categoria ${item.name}`} icon={<FiTrash2 />} onClick={() => { setDeleting(item); confirm.onOpen(); }} /></Tooltip>}
                </HStack>
              </HStack>
            ))}
            {!shown.length && <Text color="app.muted" py={6} textAlign="center">Nenhuma categoria {showArchived ? 'arquivada' : 'ativa'}.</Text>}
          </VStack>
          <Button mt={4} leftIcon={<FiPlus />} onClick={openNew}>Nova categoria</Button>
        </ModalBody>
      </ModalContent>
    </Modal>
    <Modal isOpen={categoryForm.isOpen} onClose={() => { categoryForm.onClose(); setEditing(null); }} size="md" isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={save} bg="app.surface" border="1px solid" borderColor="app.border" borderRadius="2xl">
        <ModalHeader>{editing ? `Editar · ${editing.name}` : 'Nova categoria'}</ModalHeader><ModalCloseButton />
        <ModalBody><VStack align="stretch" spacing={4}>
          <FormControl isRequired><FormLabel>Nome</FormLabel><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={48} /></FormControl>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired><FormLabel>Ícone (emoji)</FormLabel><Input value={icon} onChange={(event) => setIcon(event.target.value)} maxLength={8} placeholder="🛒" /></FormControl>
            <FormControl><FormLabel>Cor</FormLabel><HStack><Input type="color" value={color} onChange={(event) => setColor(event.target.value)} w="56px" p={1} aria-label="Cor da categoria" /><Text color="app.muted" fontSize="sm">{color}</Text></HStack></FormControl>
          </SimpleGrid>
          <FormControl><FormLabel>Aplicar a</FormLabel><Select value={type} onChange={(event) => setType(event.target.value as Category['type'])}><option value="expense">Despesas</option><option value="income">Receitas</option><option value="both">Receitas e despesas</option></Select></FormControl>
          {error && <Alert status="error" borderRadius="lg"><AlertIcon />{error}</Alert>}
        </VStack></ModalBody>
        <ModalFooter gap={3}><Button variant="ghost" onClick={() => { categoryForm.onClose(); setEditing(null); }}>Cancelar</Button><Button type="submit">Salvar categoria</Button></ModalFooter>
      </ModalContent>
    </Modal>
    <AlertDialog isOpen={confirm.isOpen} leastDestructiveRef={cancelDeleteRef} onClose={confirm.onClose} isCentered>
      <AlertDialogOverlay><AlertDialogContent bg="app.surface"><AlertDialogHeader>Excluir categoria?</AlertDialogHeader><AlertDialogBody>Não é possível excluir uma categoria ligada a lançamentos. Nesse caso, arquive-a para preservar as referências.</AlertDialogBody><AlertDialogFooter><Button ref={cancelDeleteRef} onClick={confirm.onClose}>Cancelar</Button><Button variant="danger" ml={3} onClick={remove}>Excluir</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay>
    </AlertDialog>
  </>;
}

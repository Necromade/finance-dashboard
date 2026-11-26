# Finance Dashboard

Painel financeiro desenvolvido com React, TypeScript, Vite e Chakra UI. Permite registrar receitas e despesas, consultar totais e visualizar análises por período. Os dados são armazenados no navegador usando `localStorage`; não existe sincronização com servidor ou conta de usuário.

## Recursos

- Dashboard com saldo total e receitas/despesas do mês.
- Cadastro validado de transações, busca por descrição/categoria e filtros por categoria e status.
- Exportação CSV das transações filtradas.
- Análises mensais e despesas por categoria, com períodos de 3, 6 ou 12 meses.
- Alternância de tema claro/escuro e navegação adaptável a telas menores.
- Áreas de orçamento e metas exibem os registros armazenados; inicialmente ficam vazias.

## Desenvolvimento

Requisitos: Node.js 20 ou superior e npm. As versões travadas de Vite e React Router exigem Node 20 ou superior.

```bash
npm install
npm run dev
```

Verificações disponíveis:

```bash
npm run lint
npm run build
```

## Tecnologias

React, TypeScript, Vite, Chakra UI, React Router e Recharts.

## Créditos

Projeto original Finance Dashboard. Agradecimentos às equipes do React, Chakra UI, Vite e aos mantenedores das bibliotecas listadas no projeto. O aviso de licença MIT original permanece no arquivo [LICENSE](LICENSE); consulte-o para os termos completos.

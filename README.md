# Sistema para Clínica Estética

Aplicação web acadêmica para gestão de uma clínica estética, com frontend React, backend Node.js/Express e persistência centralizada em arquivo JSON no servidor.

## Funcionalidades

- Dashboard com indicadores de clientes, procedimentos, agendamentos e faturamento previsto.
- Cadastro, listagem, edição e exclusão de clientes.
- Cadastro, listagem, edição e exclusão de procedimentos estéticos.
- Cadastro, listagem, edição, exclusão e alteração de status de agendamentos.
- Busca por registros nas telas principais.
- Persistência dos dados em `server/data/db.json`.

## Arquitetura

```txt
client/ React
   |
   | HTTP / API REST
   v
server/ Express
   |
   | Repository
   v
server/data/db.json
```

A persistência foi isolada pela classe `JsonFileRepository`. Para migrar para um banco de dados futuramente, basta criar uma nova implementação da interface base `Repository` mantendo os mesmos métodos: `findAll`, `findById`, `create`, `update` e `remove`.

## Como executar

```bash
npm install
npm run dev
```

Depois acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333/api/health`

## Endpoints principais

```txt
GET    /api/clientes
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id

GET    /api/procedimentos
POST   /api/procedimentos
PUT    /api/procedimentos/:id
DELETE /api/procedimentos/:id

GET    /api/agendamentos
POST   /api/agendamentos
PUT    /api/agendamentos/:id
DELETE /api/agendamentos/:id

GET    /api/relatorio
GET    /api/health
```

## Evidências sugeridas para o relatório

- Print da estrutura de pastas.
- Print do terminal com `npm run dev`.
- Print do dashboard funcionando.
- Print dos cadastros de clientes, procedimentos e agendamentos.
- Print do arquivo `server/data/db.json` após cadastrar registros.
- Print de um teste no navegador acessando `/api/clientes`.

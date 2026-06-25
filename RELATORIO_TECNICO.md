# Relatório Técnico - Sistema para Clínica Estética

## 1. Introdução

Este relatório apresenta o processo de desenvolvimento de uma aplicação web para gestão de uma clínica estética. O sistema foi construído com separação entre frontend e backend, utilizando uma API REST e persistência dos dados em arquivo JSON no servidor.

## 2. Objetivo

Desenvolver um sistema simples para apoiar o cadastro de clientes, procedimentos e agendamentos, permitindo a visualização de indicadores básicos da clínica em um painel administrativo.

## 3. Tecnologias Utilizadas

- React: construção da interface do usuário.
- Vite: ambiente de desenvolvimento e empacotamento do frontend.
- Node.js: execução do backend.
- Express: criação da API REST.
- JSON: persistência dos dados no servidor.
- CSS: estilização responsiva da aplicação.

## 4. Requisitos Funcionais

- RF01: O sistema deve permitir cadastrar clientes.
- RF02: O sistema deve permitir listar, editar e excluir clientes.
- RF03: O sistema deve permitir cadastrar procedimentos estéticos.
- RF04: O sistema deve permitir listar, editar e excluir procedimentos.
- RF05: O sistema deve permitir criar agendamentos.
- RF06: O sistema deve permitir selecionar cliente e procedimento no agendamento.
- RF07: O sistema deve permitir informar data, horário e profissional responsável.
- RF08: O sistema deve permitir alterar o status do agendamento.
- RF09: O sistema deve exibir um painel com indicadores gerais.
- RF10: O sistema deve persistir os dados em um arquivo JSON centralizado no servidor.

## 5. Requisitos Não Funcionais

- RNF01: O sistema deve possuir interface simples e intuitiva.
- RNF02: O sistema deve ser responsivo.
- RNF03: O sistema deve separar frontend, backend e persistência.
- RNF04: O sistema deve disponibilizar uma API REST.
- RNF05: O sistema deve permitir futura substituição do arquivo JSON por banco de dados com baixo impacto.
- RNF06: O sistema deve apresentar mensagens claras em caso de erro.

## 6. Arquitetura da Solução

```txt
Frontend React
      |
      | Requisições HTTP
      v
Backend Node.js + Express
      |
      | Camada Repository
      v
Arquivo JSON no servidor
```

A camada de persistência foi desacoplada por meio da classe `Repository`, que define os métodos esperados para qualquer mecanismo de armazenamento. A implementação atual é `JsonFileRepository`, responsável por ler e escrever os dados no arquivo `server/data/db.json`.

Em uma evolução futura, seria possível criar uma implementação como `DatabaseRepository`, usando MySQL, PostgreSQL, SQLite ou MongoDB, mantendo os mesmos métodos utilizados pelas rotas e serviços.

## 7. Estrutura do Projeto

```txt
client/
  src/
    main.jsx
    styles.css
server/
  data/
    db.json
  repositories/
    Repository.js
    JsonFileRepository.js
  routes/
    createCrudRouter.js
  services/
    appointmentService.js
  index.js
README.md
package.json
vite.config.js
```

## 8. Persistência dos Dados

Os dados são salvos em `server/data/db.json`. O frontend não acessa esse arquivo diretamente. Toda operação passa pela API REST, o que simula uma arquitetura mais próxima de um sistema real.

Coleções persistidas:

- `clientes`
- `procedimentos`
- `agendamentos`

## 9. Endpoints da API

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

## 10. Testes Realizados

- Verificação do build de produção com `npm run build`.
- Verificação da inicialização da API.
- Consulta dos endpoints principais.
- Validação de cadastro com campos obrigatórios.
- Verificação da persistência no arquivo JSON após operações de criação, edição e exclusão.

## 11. Conclusão

O sistema desenvolvido atende ao objetivo acadêmico proposto, oferecendo funcionalidades essenciais para uma clínica estética e utilizando uma arquitetura desacoplada. A escolha de persistência em JSON no servidor simplifica a execução do projeto, mas mantém uma organização que facilita a futura migração para banco de dados.

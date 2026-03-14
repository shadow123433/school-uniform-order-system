# Sistema de Pedidos

Aplicação web **Full Stack** desenvolvida para gerenciamento de pedidos, com autenticação de usuários e integração entre frontend, backend e banco de dados.

---

## Tecnologias utilizadas

- JavaScript
- Node.js
- Express
- HTML
- CSS
- Banco de dados SQL

---

## Funcionalidades

- Cadastro de usuários
- Autenticação de login
- Criação de pedidos
- Listagem de pedidos
- Atualização de pedidos
- Exclusão de pedidos
- API REST para comunicação entre cliente e servidor

---

## Estrutura do projeto

```
/frontend   → Interface da aplicação
/backend    → Servidor e API
/database   → Estrutura do banco de dados
```

---

## Como executar o projeto

Clone o repositório:

```bash
git clone https://github.com/shadow123433/school-uniform-order-system.git
```

Entre na pasta do projeto:

```bash
cd school-uniform-order-system
code .
```

Entre na pasta backend:

```bash
cd backend
```

Instale as dependências dentro da pasta backend:

```bash
npm install
```

---

## Variáveis de ambiente

Este projeto utiliza um arquivo `.env` para armazenar configurações sensíveis.

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=3000
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@gmail.com
JWT_SECRET=sua_chave_secreta
```

---

## Iniciar o servidor

```bash
node server
```

---

## Objetivo do projeto

Este projeto foi desenvolvido com o objetivo de praticar o desenvolvimento de aplicações web completas, envolvendo frontend, backend, API REST e banco de dados.

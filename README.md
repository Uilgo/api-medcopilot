# 🏥 Médico Copilot - Backend

> Sistema de IA para auxiliar médicos durante consultas médicas com transcrição em tempo real e análise inteligente.

## 📋 Sobre o Projeto

O **Médico Copilot Backend** é uma API REST desenvolvida em Node.js + TypeScript que fornece toda a infraestrutura necessária para um assistente médico inteligente. O sistema permite:

- 🎤 Captura e transcrição de áudio em tempo real
- 💬 Chat híbrido (texto + áudio)
- 🧠 Análise médica com IA (diagnósticos, exames, medicamentos)
- 📊 Gerenciamento completo de consultas
- 🔐 Autenticação segura com Supabase
- 💾 Armazenamento seguro de dados e áudios
- 🏢 **Arquitetura Multi-Tenant** (múltiplas clínicas isoladas)
- 👥 **Sistema RBAC** (ADMIN, PROFESSIONAL, STAFF)

## 🚀 Tecnologias

### Core

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express 5.x** - Framework web
- **Supabase** - Backend as a Service (Auth, Database, Storage)

### Integrações

- **OpenAI API** - GPT-4 para análise médica + Whisper para transcrição
- **Zod** - Validação de schemas
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing

### DevOps

- **pnpm** - Gerenciador de pacotes
- **ts-node-dev** - Hot reload em desenvolvimento
- **TypeScript** - Compilação e type checking

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (Supabase, APIs)
│   ├── controllers/     # Lógica de controle das rotas
│   ├── middlewares/     # Auth, validação, error handling
│   ├── routes/          # Definição de rotas da API
│   ├── services/        # Lógica de negócio (IA, transcrição)
│   ├── types/           # Tipos e interfaces TypeScript
│   ├── utils/           # Funções utilitárias
│   └── server.ts        # Ponto de entrada da aplicação
├── .env                 # Variáveis de ambiente (não commitado)
├── .env.example         # Exemplo de variáveis de ambiente
├── tsconfig.json        # Configuração TypeScript
└── package.json         # Dependências e scripts
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Conta no Supabase (gratuita)
- Conta na OpenAI com créditos

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd medcopilot/backend
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sb_publishable_sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# OpenAI
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

**Onde encontrar as credenciais:**

- **Supabase:** https://supabase.com/dashboard/project/_/settings/api
- **OpenAI:** https://platform.openai.com/api-keys

### 4. Configure o Supabase

Execute as migrations SQL no Supabase Dashboard (SQL Editor):

```sql
-- Criar tabelas necessárias
-- (migrations serão fornecidas em /database/migrations)
```

### 5. Inicie o servidor

**Desenvolvimento (com hot reload):**

```bash
pnpm dev
```

**Produção:**

```bash
pnpm build
pnpm start
```

O servidor estará rodando em `http://localhost:3000`

## 📡 API Endpoints

### Autenticação

| Método | Endpoint                    | Descrição                                       | Auth |
| ------ | --------------------------- | ----------------------------------------------- | ---- |
| POST   | `/api/auth/signup`          | Registrar novo usuário (cria ADMIN + Workspace) | ❌   |
| POST   | `/api/auth/login`           | Login (retorna lista de Workspaces)             | ❌   |
| POST   | `/api/auth/logout`          | Logout                                          | ✅   |
| POST   | `/api/auth/forgot-password` | Solicitar reset de senha                        | ❌   |
| POST   | `/api/auth/reset-password`  | Resetar senha com token                         | ❌   |
| GET    | `/api/auth/me`              | Dados do usuário autenticado                    | ✅   |
| GET    | `/api/auth/workspaces`      | Lista Workspaces do usuário                     | ✅   |

### Workspaces

| Método | Endpoint                | Descrição             | Auth | Role  |
| ------ | ----------------------- | --------------------- | ---- | ----- |
| POST   | `/api/workspaces`       | Criar novo Workspace  | ✅   | ADMIN |
| GET    | `/api/workspaces/:slug` | Detalhes do Workspace | ✅   | Todos |
| PATCH  | `/api/workspaces/:slug` | Atualizar Workspace   | ✅   | ADMIN |
| DELETE | `/api/workspaces/:slug` | Deletar Workspace     | ✅   | ADMIN |

### Membros do Workspace

| Método | Endpoint                           | Descrição       | Auth | Role       |
| ------ | ---------------------------------- | --------------- | ---- | ---------- |
| POST   | `/api/:workspace_slug/members`     | Convidar membro | ✅   | ADMIN      |
| GET    | `/api/:workspace_slug/members`     | Listar membros  | ✅   | ADMIN/PROF |
| PATCH  | `/api/:workspace_slug/members/:id` | Atualizar role  | ✅   | ADMIN      |
| DELETE | `/api/:workspace_slug/members/:id` | Remover membro  | ✅   | ADMIN      |

### Consultas (Contexto: Workspace)

**Nota:** Todas as rotas requerem `workspace_slug` no path

| Método | Endpoint                                 | Descrição                             | Auth | Role       |
| ------ | ---------------------------------------- | ------------------------------------- | ---- | ---------- |
| POST   | `/api/:workspace_slug/consultations`     | Criar nova consulta                   | ✅   | ADMIN/PROF |
| GET    | `/api/:workspace_slug/consultations`     | Listar consultas (filtradas por role) | ✅   | Todos      |
| GET    | `/api/:workspace_slug/consultations/:id` | Detalhes de uma consulta              | ✅   | Todos      |
| PATCH  | `/api/:workspace_slug/consultations/:id` | Atualizar consulta (apenas próprias)  | ✅   | ADMIN/PROF |
| DELETE | `/api/:workspace_slug/consultations/:id` | Deletar consulta                      | ✅   | ADMIN/PROF |

### Chat (Mensagens - Contexto: Workspace)

**Nota:** Sistema híbrido - aceita texto e áudio

| Método | Endpoint                                    | Descrição                      | Auth | Role       |
| ------ | ------------------------------------------- | ------------------------------ | ---- | ---------- |
| POST   | `/api/:workspace_slug/chat/message`         | Enviar mensagem de texto       | ✅   | ADMIN/PROF |
| POST   | `/api/:workspace_slug/chat/audio`           | Enviar áudio para transcrição  | ✅   | ADMIN/PROF |
| GET    | `/api/:workspace_slug/chat/:consultationId` | Histórico de mensagens         | ✅   | Todos      |
| WS     | `/api/:workspace_slug/chat/stream`          | Chat em tempo real (WebSocket) | ✅   | ADMIN/PROF |

### IA - Análise Médica

| Método | Endpoint                          | Descrição                    | Auth |
| ------ | --------------------------------- | ---------------------------- | ---- |
| POST   | `/api/ai/analyze`                 | Analisar e gerar diagnóstico | ✅   |
| POST   | `/api/ai/chat`                    | Chat contextual pós-consulta | ✅   |
| GET    | `/api/ai/history/:consultationId` | Histórico de análises        | ✅   |

### Health Check

| Método | Endpoint      | Descrição          | Auth |
| ------ | ------------- | ------------------ | ---- |
| GET    | `/api/health` | Status do servidor | ❌   |

## 🏢 Arquitetura Multi-Tenant

O MedCopilot utiliza um modelo **Micro SaaS Multi-Tenant com Single Sign-On (SSO)**:

### Conceito

- **Um login** para acessar múltiplos Workspaces (Clínicas)
- **Isolamento total** de dados entre Workspaces via RLS
- **Contexto por URL**: `/api/:workspace_slug/...`

### Regras de Responsabilidade

- **ADMIN**: 1 email → 1 Workspace (responsabilidade legal/financeira)
- **PROFESSIONAL/STAFF**: 1 email → N Workspaces (trabalha em múltiplas clínicas)

## 👥 Sistema de Roles (RBAC)

### Permissões por Role

| Role                | Copilot     | Dados Próprios  | Dados da Equipe | Gestão      |
| ------------------- | ----------- | --------------- | --------------- | ----------- |
| **ADMIN** 👑        | ✅ Total    | ✅ Total (CRUD) | ✅ Total (CRUD) | ✅ Total    |
| **PROFESSIONAL** 🩺 | ✅ Total    | ✅ Total (CRUD) | ✅ Leitura      | ❌ Proibido |
| **STAFF** 🗒️        | ❌ Proibido | ❌ Proibido     | ✅ Leitura      | ❌ Proibido |

### Descrição dos Roles

**ADMIN (Administrador)**

- Criador e responsável pelo Workspace
- Acesso total a todas as funcionalidades
- Gerencia usuários, permissões e faturamento

**PROFESSIONAL (Profissional)**

- Operador principal do Copilot
- Cria e gerencia suas próprias consultas
- Visualiza consultas da equipe (somente leitura)

**STAFF (Equipe de Suporte)**

- Acesso apenas para visualização
- Não pode operar o Copilot
- Gerencia dados não-clínicos de pacientes

## 🔐 Autenticação

A API utiliza **JWT tokens** via Supabase Auth. Para acessar rotas protegidas:

1. Faça login via `/api/auth/login`
2. Receba o token JWT e lista de Workspaces na resposta
3. Selecione um Workspace (slug)
4. Inclua o token no header de requisições protegidas:

```http
Authorization: Bearer seu_token_jwt_aqui
```

### Exemplo de Requisição

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Requisição com Workspace Context

```bash
curl -X GET http://localhost:3000/api/clinica-exemplo/consultations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 Exemplos de Uso

### Registrar Usuário

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "medico@exemplo.com",
  "password": "senha_segura_123",
  "name": "Dr. João Silva"
}
```

### Criar Consulta

```bash
POST /api/consultations
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientName": "Maria Santos",
  "patientAge": 45,
  "chiefComplaint": "Dor de cabeça persistente"
}
```

### Enviar Mensagem de Texto

```bash
POST /api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "consultationId": "uuid-da-consulta",
  "content": "Paciente relata dor há 3 dias",
  "type": "text"
}
```

### Enviar Áudio

```bash
POST /api/chat/audio
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "consultationId": "uuid-da-consulta",
  "audio": <arquivo-audio.webm>
}
```

## 🛡️ Segurança

### Implementações de Segurança

- ✅ **Helmet** - Headers de segurança HTTP
- ✅ **CORS** - Configurado para origens permitidas
- ✅ **JWT** - Autenticação stateless
- ✅ **RLS** - Row Level Security no Supabase
- ✅ **Validação** - Zod para validar todos os inputs
- ✅ **Rate Limiting** - Proteção contra abuso de API
- ✅ **Type Guards** - Validação de tipos em runtime

### Boas Práticas

- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Sempre validar inputs do usuário
- Usar HTTPS em produção
- Implementar rate limiting em endpoints sensíveis
- Logs não devem conter informações sensíveis

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes em watch mode
pnpm test:watch
```

## 📊 Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor em modo desenvolvimento
pnpm build        # Compila TypeScript para JavaScript
pnpm start        # Inicia servidor em modo produção
pnpm test         # Executa testes
pnpm lint         # Verifica código com ESLint
pnpm format       # Formata código com Prettier
```

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente do Supabase não configuradas"

**Solução:** Verifique se o arquivo `.env` existe e contém `SUPABASE_URL` e `SUPABASE_KEY`.

### Erro: "OpenAI API key not found"

**Solução:** Adicione `OPENAI_API_KEY` no arquivo `.env`.

### Erro de CORS

**Solução:** Configure as origens permitidas no arquivo `src/server.ts`:

```typescript
app.use(
  cors({
    origin: ["http://localhost:5173", "https://seu-frontend.com"],
  })
);
```

### Porta já em uso

**Solução:** Altere a porta no `.env` ou mate o processo:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## 📚 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contribuindo

Este é um projeto de desafio técnico. Contribuições não são aceitas no momento.

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico para processo seletivo.

## 👨‍💻 Autor

Desenvolvido para o desafio DevClub - HealthTech

---

**Nota:** Este é o backend do projeto Médico Copilot. O frontend está em desenvolvimento separado.

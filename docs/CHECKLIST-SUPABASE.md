# ✅ Checklist - Configuração do Supabase

## 📋 Respostas Rápidas

### ❓ Todas as tabelas têm RLS ativa?

✅ **SIM** - Todas as 8 tabelas terão RLS habilitada automaticamente

### ❓ Os relacionamentos (foreign keys) estão prontos?

✅ **SIM** - Todas as foreign keys estão definidas na criação das tabelas

### ❓ Posso executar tudo de uma vez?

✅ **SIM** - O script está na ordem correta, pode executar tudo junto!

---

## 🚀 Como Executar

### Passo 1: Abrir SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### Passo 2: Colar e Executar

1. Abra o arquivo `docs/supabase-migrations.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Verificar Resultado

Você verá no final:

- ✅ Mensagem de sucesso
- ✅ Lista das 8 tabelas criadas
- ✅ Status de cada tabela

---

## 📊 O que será criado

### Tabelas (8):

1. ✅ `users` - Perfis de usuários
2. ✅ `workspaces` - Clínicas/Consultórios
3. ✅ `workspace_members` - Mapeamento Multi-Tenant
4. ✅ `patients` - Pacientes
5. ✅ `consultations` - Consultas
6. ✅ `transcriptions` - Transcrições de áudio
7. ✅ `analysis_results` - Resultados da IA
8. ✅ `chat_messages` - Mensagens do chat

### Relacionamentos (Foreign Keys):

- ✅ `users.id` → `auth.users.id`
- ✅ `workspaces.owner_id` → `auth.users.id`
- ✅ `workspace_members.workspace_id` → `workspaces.id`
- ✅ `workspace_members.user_id` → `auth.users.id`
- ✅ `patients.workspace_id` → `workspaces.id`
- ✅ `consultations.workspace_id` → `workspaces.id`
- ✅ `consultations.paciente_id` → `patients.id`
- ✅ `consultations.profissional_id` → `auth.users.id`
- ✅ `transcriptions.consulta_id` → `consultations.id`
- ✅ `analysis_results.consulta_id` → `consultations.id`
- ✅ `chat_messages.consulta_id` → `consultations.id`

### Constraints CHECK:

- ✅ `workspaces.status_assinatura` → trial, active, suspended, cancelled
- ✅ `workspace_members.role` → ADMIN, PROFESSIONAL, STAFF
- ✅ `consultations.status` → em_andamento, concluida, cancelada
- ✅ `chat_messages.tipo_mensagem` → texto, audio, sistema

### Triggers:

- ✅ `handle_new_user()` - Auto-cria registro em users quando usuário se registra

### Índices (Performance):

- ✅ 10 índices criados para otimizar queries

### RLS (Row Level Security):

- ✅ Habilitada em todas as 8 tabelas
- ✅ Policies básicas criadas (users, workspaces, workspace_members)

---

## 🧪 Testar Após Criação

### 1. Verificar Tabelas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. Verificar Foreign Keys

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### 3. Verificar RLS

```sql
SELECT
  tablename,
  rowsecurity as "RLS Habilitada"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 4. Testar Trigger

Crie um usuário de teste no Supabase Auth e verifique se o registro é criado automaticamente em `users`.

---

## ⚠️ Problemas Comuns

### Erro: "relation already exists"

**Solução:** As tabelas já existem. Delete-as primeiro ou use `DROP TABLE IF EXISTS` antes.

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando o SQL Editor com permissões de admin.

### Erro: "foreign key constraint"

**Solução:** Não deveria acontecer se executar o script completo. Se acontecer, execute novamente.

### Trigger não funciona

**Solução:** Verifique se o trigger foi criado:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 🎯 Próximos Passos

Após criar as tabelas:

1. ✅ Testar cadastro de usuário
2. ✅ Testar criação de workspace
3. ✅ Testar convite de membro
4. ✅ Configurar variáveis de ambiente (.env)
5. ✅ Testar API do backend

---

**Última atualização:** Checklist criado para setup do Supabase

# 🗄️ Guia de Configuração do Supabase - MedCopilot

## 📋 Ordem de Criação das Tabelas

Siga esta ordem exata para evitar erros de foreign keys:

1. ✅ `users` (depende de auth.users - já existe)
2. ✅ `workspaces`
3. ✅ `workspace_members`
4. ✅ `patients`
5. ✅ `consultations`
6. ✅ `transcriptions`
7. ✅ `analysis_results`
8. ✅ `chat_messages`

---

## 🚀 Passo a Passo

### Preparação Inicial

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá em **Database** → **Tables**
3. Clique em **New Table** para cada tabela abaixo

---

## 1️⃣ Tabela: `users`

**Descrição:** Perfil dos usuários (espelho de auth.users)

### Campos:

| Nome do Campo | Tipo        | Default                | Nullable | Unique | Primary Key |
| ------------- | ----------- | ---------------------- | -------- | ------ | ----------- |
| id            | uuid        | -                      | ❌       | ✅     | ✅          |
| nome          | text        | -                      | ❌       | ❌     | ❌          |
| sobrenome     | text        | -                      | ✅       | ❌     | ❌          |
| nome_completo | text        | GENERATED (ver abaixo) | ✅       | ❌     | ❌          |
| avatar_url    | text        | -                      | ✅       | ❌     | ❌          |
| telefone      | text        | -                      | ✅       | ❌     | ❌          |
| especialidade | text        | -                      | ✅       | ❌     | ❌          |
| crm           | text        | -                      | ✅       | ❌     | ❌          |
| ativo         | boolean     | true                   | ❌       | ❌     | ❌          |
| onboarding    | boolean     | false                  | ❌       | ❌     | ❌          |
| created_at    | timestamptz | now()                  | ❌       | ❌     | ❌          |
| updated_at    | timestamptz | now()                  | ❌       | ❌     | ❌          |

### Foreign Keys:

- `id` → `auth.users(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE

### Após criar a tabela, execute no SQL Editor:

```sql
-- Tornar nome_completo uma coluna gerada
ALTER TABLE users
ADD COLUMN nome_completo text GENERATED ALWAYS AS (nome || ' ' || COALESCE(sobrenome, '')) STORED;

-- Criar trigger para auto-criação quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nome, created_at)
  VALUES (NEW.id, '', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2️⃣ Tabela: `workspaces`

**Descrição:** Workspaces/Clínicas (Tenants)

### Campos:

| Nome do Campo     | Tipo        | Default            | Nullable | Unique | Primary Key |
| ----------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id                | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| slug              | text        | -                  | ❌       | ✅     | ❌          |
| nome              | text        | -                  | ❌       | ❌     | ❌          |
| owner_id          | uuid        | -                  | ❌       | ❌     | ❌          |
| status_assinatura | text        | 'trial'            | ❌       | ❌     | ❌          |
| plano_assinatura  | text        | 'basic'            | ❌       | ❌     | ❌          |
| created_at        | timestamptz | now()              | ❌       | ❌     | ❌          |
| updated_at        | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `owner_id` → `auth.users(id)`
  - ON DELETE: RESTRICT
  - ON UPDATE: CASCADE

### Após criar a tabela, execute no SQL Editor:

```sql
-- Adicionar constraint CHECK para status_assinatura
ALTER TABLE workspaces
ADD CONSTRAINT check_status_assinatura
CHECK (status_assinatura IN ('trial', 'active', 'suspended', 'cancelled'));
```

---

## 3️⃣ Tabela: `workspace_members`

**Descrição:** Mapeamento Multi-Tenant (usuários ↔ workspaces)

### Campos:

| Nome do Campo | Tipo        | Default            | Nullable | Unique | Primary Key |
| ------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id            | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| workspace_id  | uuid        | -                  | ❌       | ❌     | ❌          |
| user_id       | uuid        | -                  | ❌       | ❌     | ❌          |
| role          | text        | -                  | ❌       | ❌     | ❌          |
| convidado_por | uuid        | -                  | ✅       | ❌     | ❌          |
| data_entrada  | timestamptz | now()              | ❌       | ❌     | ❌          |
| ativo         | boolean     | true               | ❌       | ❌     | ❌          |

### Foreign Keys:

- `workspace_id` → `workspaces(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE
- `user_id` → `auth.users(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE
- `convidado_por` → `auth.users(id)`
  - ON DELETE: SET NULL
  - ON UPDATE: CASCADE

### Após criar a tabela, execute no SQL Editor:

```sql
-- Adicionar constraint UNIQUE (workspace_id, user_id)
ALTER TABLE workspace_members
ADD CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id);

-- Adicionar constraint CHECK para role
ALTER TABLE workspace_members
ADD CONSTRAINT check_role
CHECK (role IN ('ADMIN', 'PROFESSIONAL', 'STAFF'));
```

---

## 4️⃣ Tabela: `patients`

**Descrição:** Pacientes

### Campos:

| Nome do Campo   | Tipo        | Default            | Nullable | Unique | Primary Key |
| --------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id              | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| workspace_id    | uuid        | -                  | ❌       | ❌     | ❌          |
| nome            | text        | -                  | ❌       | ❌     | ❌          |
| data_nascimento | date        | -                  | ✅       | ❌     | ❌          |
| cpf             | text        | -                  | ✅       | ✅     | ❌          |
| telefone        | text        | -                  | ✅       | ❌     | ❌          |
| email           | text        | -                  | ✅       | ❌     | ❌          |
| endereco        | text        | -                  | ✅       | ❌     | ❌          |
| observacoes     | text        | -                  | ✅       | ❌     | ❌          |
| created_by      | uuid        | -                  | ✅       | ❌     | ❌          |
| created_at      | timestamptz | now()              | ❌       | ❌     | ❌          |
| updated_at      | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `workspace_id` → `workspaces(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE
- `created_by` → `auth.users(id)`
  - ON DELETE: SET NULL
  - ON UPDATE: CASCADE

---

## 5️⃣ Tabela: `consultations`

**Descrição:** Consultas (Tabela Central)

### Campos:

| Nome do Campo    | Tipo        | Default            | Nullable | Unique | Primary Key |
| ---------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id               | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| workspace_id     | uuid        | -                  | ❌       | ❌     | ❌          |
| paciente_id      | uuid        | -                  | ❌       | ❌     | ❌          |
| profissional_id  | uuid        | -                  | ❌       | ❌     | ❌          |
| queixa_principal | text        | -                  | ✅       | ❌     | ❌          |
| status           | text        | 'em_andamento'     | ❌       | ❌     | ❌          |
| iniciada_em      | timestamptz | now()              | ❌       | ❌     | ❌          |
| concluida_em     | timestamptz | -                  | ✅       | ❌     | ❌          |
| duracao_minutos  | int4        | -                  | ✅       | ❌     | ❌          |
| created_at       | timestamptz | now()              | ❌       | ❌     | ❌          |
| updated_at       | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `workspace_id` → `workspaces(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE
- `paciente_id` → `patients(id)`
  - ON DELETE: RESTRICT
  - ON UPDATE: CASCADE
- `profissional_id` → `auth.users(id)`
  - ON DELETE: RESTRICT
  - ON UPDATE: CASCADE

### Após criar a tabela, execute no SQL Editor:

```sql
-- Adicionar constraint CHECK para status
ALTER TABLE consultations
ADD CONSTRAINT check_status
CHECK (status IN ('em_andamento', 'concluida', 'cancelada'));
```

---

## 6️⃣ Tabela: `transcriptions`

**Descrição:** Transcrições de áudio

### Campos:

| Nome do Campo          | Tipo        | Default            | Nullable | Unique | Primary Key |
| ---------------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id                     | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| consulta_id            | uuid        | -                  | ❌       | ✅     | ❌          |
| texto_completo         | text        | -                  | ❌       | ❌     | ❌          |
| audio_url              | text        | -                  | ✅       | ❌     | ❌          |
| duracao_audio_segundos | int4        | -                  | ✅       | ❌     | ❌          |
| idioma                 | text        | 'pt-BR'            | ❌       | ❌     | ❌          |
| confianca_score        | numeric     | -                  | ✅       | ❌     | ❌          |
| falantes               | jsonb       | -                  | ✅       | ❌     | ❌          |
| created_at             | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `consulta_id` → `consultations(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE

**Nota:** Para `confianca_score`, use tipo `numeric(3,2)` se disponível na UI, senão use `numeric` e ajuste depois.

---

## 7️⃣ Tabela: `analysis_results`

**Descrição:** Resultados da análise de IA

### Campos:

| Nome do Campo          | Tipo        | Default            | Nullable | Unique | Primary Key |
| ---------------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id                     | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| consulta_id            | uuid        | -                  | ❌       | ✅     | ❌          |
| diagnostico            | text        | -                  | ✅       | ❌     | ❌          |
| exames_sugeridos       | jsonb       | -                  | ✅       | ❌     | ❌          |
| medicamentos_sugeridos | jsonb       | -                  | ✅       | ❌     | ❌          |
| notas_clinicas         | text        | -                  | ✅       | ❌     | ❌          |
| nivel_confianca        | text        | -                  | ✅       | ❌     | ❌          |
| modelo_ia              | text        | -                  | ✅       | ❌     | ❌          |
| tempo_processamento_ms | int4        | -                  | ✅       | ❌     | ❌          |
| created_at             | timestamptz | now()              | ❌       | ❌     | ❌          |
| updated_at             | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `consulta_id` → `consultations(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE

---

## 8️⃣ Tabela: `chat_messages`

**Descrição:** Mensagens do chat contextual

### Campos:

| Nome do Campo | Tipo        | Default            | Nullable | Unique | Primary Key |
| ------------- | ----------- | ------------------ | -------- | ------ | ----------- |
| id            | uuid        | uuid_generate_v4() | ❌       | ✅     | ✅          |
| consulta_id   | uuid        | -                  | ❌       | ❌     | ❌          |
| user_id       | uuid        | -                  | ❌       | ❌     | ❌          |
| tipo_mensagem | text        | -                  | ❌       | ❌     | ❌          |
| conteudo      | text        | -                  | ❌       | ❌     | ❌          |
| audio_url     | text        | -                  | ✅       | ❌     | ❌          |
| resposta_ia   | boolean     | false              | ❌       | ❌     | ❌          |
| metadata      | jsonb       | -                  | ✅       | ❌     | ❌          |
| created_at    | timestamptz | now()              | ❌       | ❌     | ❌          |

### Foreign Keys:

- `consulta_id` → `consultations(id)`
  - ON DELETE: CASCADE
  - ON UPDATE: CASCADE
- `user_id` → `auth.users(id)`
  - ON DELETE: SET NULL
  - ON UPDATE: CASCADE

### Após criar a tabela, execute no SQL Editor:

```sql
-- Adicionar constraint CHECK para tipo_mensagem
ALTER TABLE chat_messages
ADD CONSTRAINT check_tipo_mensagem
CHECK (tipo_mensagem IN ('texto', 'audio', 'sistema'));
```

---

## 🔐 Configurar RLS (Row Level Security)

Após criar todas as tabelas, execute no SQL Editor:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

**Nota:** As policies RLS específicas serão criadas depois, quando testarmos o sistema.

---

## 📊 Criar Índices (Performance)

Execute no SQL Editor:

```sql
-- Índices para users
CREATE INDEX idx_users_nome ON users(nome);

-- Índices para workspace_members
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Índices para consultations
CREATE INDEX idx_consultations_workspace ON consultations(workspace_id);
CREATE INDEX idx_consultations_profissional ON consultations(profissional_id);
CREATE INDEX idx_consultations_paciente ON consultations(paciente_id);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Índices para patients
CREATE INDEX idx_patients_workspace ON patients(workspace_id);

-- Índices para chat_messages
CREATE INDEX idx_chat_consulta ON chat_messages(consulta_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
```

---

## ✅ Checklist Final

Após criar tudo, verifique:

- [ ] 8 tabelas criadas
- [ ] Todas as foreign keys configuradas
- [ ] Constraints CHECK adicionadas
- [ ] Trigger `handle_new_user` criado
- [ ] RLS habilitado em todas as tabelas
- [ ] Índices criados

---

## 🆘 Problemas Comuns

**Erro: "relation does not exist"**

- Certifique-se de criar as tabelas na ordem correta

**Erro: "foreign key constraint"**

- Verifique se a tabela referenciada existe
- Verifique se o tipo do campo é o mesmo (uuid → uuid)

**Erro: "permission denied"**

- Use o SQL Editor com permissões de admin
- Não use o Table Editor para comandos SQL complexos

---

**Última atualização:** Guia criado para setup do Supabase

# 🔄 Guia de Reset do Supabase

## ⚠️ ATENÇÃO: Este processo vai DELETAR TODOS OS DADOS!

Execute apenas se tiver certeza de que quer recomeçar do zero.

---

## 📋 Passo a Passo

### 1️⃣ DROPAR TUDO (Limpar Banco)

**Arquivo:** `docs/supabase-drop-all.sql`

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** → **New Query**
3. Copie TODO o conteúdo de `docs/supabase-drop-all.sql`
4. Cole no editor
5. Clique em **Run**

**Resultado esperado:**

```
✅ BANCO DE DADOS LIMPO COM SUCESSO!
```

---

### 2️⃣ CRIAR TUDO NOVAMENTE (Versão em Português)

**Arquivo:** `docs/supabase-migrations-pt-br.sql`

1. No **SQL Editor**, crie uma **New Query**
2. Copie TODO o conteúdo de `docs/supabase-migrations-pt-br.sql`
3. Cole no editor
4. Clique em **Run**

**Resultado esperado:**

```
🎉 MIGRATIONS EXECUTADAS COM SUCESSO!
```

---

## ✅ Verificações

Após executar, você deve ver:

### Tabelas Criadas (8)

- ✅ users
- ✅ workspaces
- ✅ workspace_members
- ✅ patients
- ✅ consultations
- ✅ transcriptions
- ✅ analysis_results
- ✅ chat_messages

### RLS Habilitada

- ✅ Todas as 8 tabelas com RLS ativa

### Trigger Criado

- ✅ trigger_criar_perfil_usuario

### Função Criada

- ✅ criar_perfil_usuario()

### Constraints CHECK (4)

- ✅ validar_status_assinatura
- ✅ validar_role
- ✅ validar_status_consulta
- ✅ validar_tipo_mensagem

---

## 🎯 Diferenças da Nova Versão

### ✅ Melhorias Implementadas:

1. **Nomes em Português Brasileiro:**

   - ❌ `handle_new_user()` → ✅ `criar_perfil_usuario()`
   - ❌ `on_auth_user_created` → ✅ `trigger_criar_perfil_usuario`
   - ❌ `check_status_assinatura` → ✅ `validar_status_assinatura`
   - ❌ `Users can view own profile` → ✅ `usuarios_visualizar_proprio_perfil`

2. **Comentários Descritivos:**

   - Todas as tabelas têm `COMMENT ON TABLE`
   - Colunas importantes têm `COMMENT ON COLUMN`
   - Funções têm `COMMENT ON FUNCTION`
   - Policies têm `COMMENT ON POLICY`

3. **Índices Adicionais:**

   - ✅ `idx_membros_role` - Busca por role
   - ✅ `idx_consultas_data` - Ordenação por data
   - ✅ `idx_pacientes_nome` - Busca por nome
   - ✅ `idx_pacientes_cpf` - Busca por CPF

4. **Organização:**
   - Seções bem definidas e numeradas
   - Comentários explicativos em português
   - Verificações automáticas no final

---

## 🧪 Testar Após Reset

Execute estes testes para garantir que tudo funcionou:

### Teste 1: Criar Usuário de Teste

1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Email: `teste@medcopilot.com`
4. Password: `123456789`
5. Clique em **Create User**

### Teste 2: Verificar Trigger

```sql
-- Verificar se usuário foi criado automaticamente na tabela users
SELECT
  u.id,
  u.nome,
  u.email,
  u.onboarding,
  au.email as "Email Auth"
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'teste@medcopilot.com';
```

**Resultado esperado:** 1 linha com o usuário

### Teste 3: Verificar RLS

```sql
-- Verificar RLS
SELECT
  tablename as "Tabela",
  CASE
    WHEN rowsecurity THEN '✅ Habilitada'
    ELSE '❌ Desabilitada'
  END as "RLS"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado:** Todas com "✅ Habilitada"

---

## 📝 Checklist Final

Após executar o reset:

- [ ] Executei `supabase-drop-all.sql` com sucesso
- [ ] Executei `supabase-migrations-pt-br.sql` com sucesso
- [ ] 8 tabelas foram criadas
- [ ] RLS está habilitada em todas as tabelas
- [ ] Trigger está funcionando (teste de criação de usuário)
- [ ] Constraints CHECK estão ativas
- [ ] Índices foram criados
- [ ] Policies RLS foram criadas

---

## 🆘 Problemas?

### Erro: "relation already exists"

**Solução:** Execute o `supabase-drop-all.sql` novamente

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando o SQL Editor como admin

### Trigger não funciona

**Solução:** Verifique se a função foi criada antes do trigger

---

**Pronto para executar?** Siga os passos 1️⃣ e 2️⃣ acima! 🚀

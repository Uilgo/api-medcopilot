# 🔒 Guia de RPC Functions - Segurança Total

## 📋 Visão Geral

Este guia explica como implementar **segurança total** usando RPC Functions para todas as operações CUD (Create, Update, Delete).

### Estratégia de Segurança:

- ✅ **RLS:** Apenas SELECT permitido
- ✅ **RPC Functions:** Todas as operações CUD
- ✅ **SECURITY DEFINER:** Funções executam com permissões do owner
- ✅ **Validações:** Permissões verificadas dentro de cada função

---

## 🚀 Como Executar

### Passo 1: Executar Parte 1 (Users, Workspaces, Members)

**Arquivo:** `docs/supabase-rpc-part1-users-workspaces.sql`

Execute no SQL Editor do Supabase.

**Resultado esperado:**

```
✅ PARTE 1 CONCLUÍDA - Users, Workspaces, Members
```

---

### Passo 2: Executar Parte 2 (Patients, Consultations, Chat)

**Arquivo:** `docs/supabase-rpc-part2-patients-consultations.sql`

Execute no SQL Editor do Supabase.

**Resultado esperado:**

```
✅ PARTE 2 CONCLUÍDA - Patients, Consultations, Chat
```

---

## 📚 RPC Functions Criadas

### 👤 Users (2 funções)

1. `atualizar_perfil_usuario()` - Atualizar perfil
2. `completar_onboarding()` - Criar workspace inicial

### 🏢 Workspaces (2 funções)

3. `atualizar_workspace()` - Atualizar workspace (ADMIN)
4. `deletar_workspace()` - Deletar workspace (OWNER)

### 👥 Members (3 funções)

5. `convidar_membro()` - Convidar usuário (ADMIN)
6. `alterar_role_membro()` - Alterar role (ADMIN)
7. `remover_membro()` - Remover membro (ADMIN)

### 🏥 Patients (3 funções)

8. `criar_paciente()` - Criar paciente (ADMIN/PROFESSIONAL)
9. `atualizar_paciente()` - Atualizar paciente (ADMIN/PROFESSIONAL)
10. `deletar_paciente()` - Deletar paciente (ADMIN/PROFESSIONAL)

### 📋 Consultations (3 funções)

11. `criar_consulta()` - Criar consulta (ADMIN/PROFESSIONAL)
12. `atualizar_consulta()` - Atualizar consulta (ADMIN/OWNER)
13. `deletar_consulta()` - Deletar consulta (ADMIN/OWNER)

### 💬 Chat (1 função)

14. `criar_mensagem_chat()` - Enviar mensagem (ADMIN/PROFESSIONAL)

---

## 🧪 Como Testar

### Teste 1: Atualizar Perfil

```sql
SELECT public.atualizar_perfil_usuario(
  p_nome := 'João',
  p_sobrenome := 'Silva',
  p_telefone := '11999999999'
);
```

### Teste 2: Criar Paciente

```sql
SELECT public.criar_paciente(
  p_workspace_id := 'uuid-do-workspace',
  p_nome := 'Maria Santos',
  p_cpf := '12345678900',
  p_telefone := '11988888888'
);
```

### Teste 3: Criar Consulta

```sql
SELECT public.criar_consulta(
  p_workspace_id := 'uuid-do-workspace',
  p_paciente_id := 'uuid-do-paciente',
  p_queixa_principal := 'Dor de cabeça'
);
```

---

## 🔐 Segurança Implementada

### Validações em Todas as Funções:

1. ✅ Verificar se usuário está autenticado (`auth.uid()`)
2. ✅ Verificar se usuário pertence ao workspace
3. ✅ Verificar role do usuário (ADMIN, PROFESSIONAL, STAFF)
4. ✅ Validar dados de entrada
5. ✅ Prevenir duplicações (CPF, slug, etc)
6. ✅ Prevenir deleções inválidas (ex: paciente com consultas)

### Permissões por Role:

| Operação              | ADMIN | PROFESSIONAL  | STAFF |
| --------------------- | ----- | ------------- | ----- |
| Atualizar perfil      | ✅    | ✅            | ✅    |
| Gerenciar workspace   | ✅    | ❌            | ❌    |
| Gerenciar membros     | ✅    | ❌            | ❌    |
| CRUD pacientes        | ✅    | ✅            | ❌    |
| CRUD consultas        | ✅    | ✅ (próprias) | ❌    |
| Enviar mensagens chat | ✅    | ✅            | ❌    |

---

## 📊 Verificar Instalação

```sql
-- Listar todas as RPC Functions criadas
SELECT
  routine_name as "Função RPC",
  '✅' as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name LIKE '%_usuario%'
     OR routine_name LIKE '%_workspace%'
     OR routine_name LIKE '%_membro%'
     OR routine_name LIKE '%_paciente%'
     OR routine_name LIKE '%_consulta%'
     OR routine_name LIKE '%_mensagem%'
ORDER BY routine_name;
```

**Resultado esperado:** 14 funções listadas

---

## 🎯 Próximos Passos

Após executar as RPC Functions:

1. ✅ Atualizar o backend (Node.js) para usar as RPC Functions
2. ✅ Remover queries diretas (INSERT, UPDATE, DELETE)
3. ✅ Usar `supabase.rpc('nome_da_funcao', { parametros })`

---

## 📝 Exemplo de Uso no Backend

```typescript
// ❌ ANTES (inseguro - query direta)
const { data } = await supabase
  .from("patients")
  .insert({ nome: "João", workspace_id: workspaceId });

// ✅ DEPOIS (seguro - via RPC)
const { data } = await supabase.rpc("criar_paciente", {
  p_workspace_id: workspaceId,
  p_nome: "João",
  p_cpf: "12345678900",
});
```

---

**Pronto para executar!** 🚀

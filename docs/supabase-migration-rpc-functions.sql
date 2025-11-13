-- ============================================
-- MIGRATION INCREMENTAL - RPC FUNCTIONS
-- ============================================
-- Execute este arquivo para adicionar as RPC Functions
-- SEM precisar dropar tudo
-- ============================================

-- 1. REMOVER POLICY DE UPDATE (não é mais necessária)
DROP POLICY IF EXISTS "usuarios_atualizar_proprio_perfil" ON public.users;

-- 2. CRIAR RPC FUNCTIONS

-- RPC: Atualizar perfil do usuário (apenas campos permitidos)
CREATE OR REPLACE FUNCTION public.atualizar_perfil_usuario(
  p_nome text DEFAULT NULL,
  p_sobrenome text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_especialidade text DEFAULT NULL,
  p_crm text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Atualizar apenas campos permitidos
  UPDATE public.users
  SET
    nome = COALESCE(p_nome, nome),
    sobrenome = COALESCE(p_sobrenome, sobrenome),
    telefone = COALESCE(p_telefone, telefone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    especialidade = COALESCE(p_especialidade, especialidade),
    crm = COALESCE(p_crm, crm),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Retornar perfil atualizado
  SELECT json_build_object(
    'id', id,
    'nome', nome,
    'sobrenome', sobrenome,
    'nome_completo', nome_completo,
    'email', email,
    'telefone', telefone,
    'avatar_url', avatar_url,
    'especialidade', especialidade,
    'crm', crm,
    'updated_at', updated_at
  ) INTO v_result
  FROM public.users
  WHERE id = v_user_id;

  RETURN v_result;
END;
$$;

-- RPC: Completar onboarding (criar workspace)
CREATE OR REPLACE FUNCTION public.completar_onboarding(
  p_workspace_slug text,
  p_workspace_nome text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_result json;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se já completou onboarding
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id AND onboarding = true) THEN
    RAISE EXCEPTION 'Onboarding já foi completado';
  END IF;

  -- Verificar se slug já existe
  IF EXISTS (SELECT 1 FROM public.workspaces WHERE slug = p_workspace_slug) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;

  -- Criar workspace
  INSERT INTO public.workspaces (slug, nome, owner_id)
  VALUES (p_workspace_slug, p_workspace_nome, v_user_id)
  RETURNING id INTO v_workspace_id;

  -- Adicionar usuário como ADMIN do workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'ADMIN');

  -- Marcar onboarding como completo
  UPDATE public.users
  SET onboarding = true, updated_at = NOW()
  WHERE id = v_user_id;

  -- Retornar resultado
  SELECT json_build_object(
    'workspace_id', w.id,
    'workspace_slug', w.slug,
    'workspace_nome', w.nome,
    'user_onboarding', u.onboarding
  ) INTO v_result
  FROM public.workspaces w
  JOIN public.users u ON u.id = v_user_id
  WHERE w.id = v_workspace_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se funções foram criadas
SELECT 
  routine_name as "Função RPC",
  '✅' as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('atualizar_perfil_usuario', 'completar_onboarding')
ORDER BY routine_name;

-- Verificar se policy de UPDATE foi removida
SELECT 
  COUNT(*) as "Policies de UPDATE restantes (deve ser 0)"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND cmd = 'UPDATE';

SELECT '🎉 RPC FUNCTIONS CRIADAS COM SUCESSO!' as resultado;

-- ============================================
-- RPC FUNCTIONS - PARTE 1
-- Users, Workspaces e Members
-- ============================================

-- ============================================
-- 1. DROPAR POLICIES DE CUD
-- ============================================

DROP POLICY IF EXISTS "usuarios_atualizar_proprio_perfil" ON public.users;
DROP POLICY IF EXISTS "membros_criar_workspace" ON public.workspaces;
DROP POLICY IF EXISTS "admin_gerenciar_membros" ON public.workspace_members;

-- ============================================
-- 2. RPC: USERS
-- ============================================

-- Atualizar perfil do usuário
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  UPDATE public.users
  SET
    nome = COALESCE(p_nome, nome),
    sobrenome = COALESCE(p_sobrenome, sobrenome),
    telefone = COALESCE(p_telefone, telefone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    especialidade = COALESCE(p_especialidade, especialidade),
    crm = COALESCE(p_crm, crm)
  WHERE id = v_user_id;

  SELECT json_build_object(
    'id', id, 'nome', nome, 'sobrenome', sobrenome,
    'email', email, 'telefone', telefone
  ) INTO v_result FROM public.users WHERE id = v_user_id;

  RETURN v_result;
END;
$$;

-- Completar onboarding
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id AND onboarding = true) THEN
    RAISE EXCEPTION 'Onboarding já foi completado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE slug = p_workspace_slug) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;

  INSERT INTO public.workspaces (slug, nome, owner_id)
  VALUES (p_workspace_slug, p_workspace_nome, v_user_id)
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'ADMIN');

  UPDATE public.users SET onboarding = true
  WHERE id = v_user_id;

  SELECT json_build_object(
    'workspace_id', w.id, 'workspace_slug', w.slug,
    'workspace_nome', w.nome, 'user_onboarding', u.onboarding
  ) INTO v_result
  FROM public.workspaces w
  JOIN public.users u ON u.id = v_user_id
  WHERE w.id = v_workspace_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- 3. RPC: WORKSPACES
-- ============================================

-- Atualizar workspace (apenas ADMIN)
CREATE OR REPLACE FUNCTION public.atualizar_workspace(
  p_workspace_id uuid,
  p_nome text DEFAULT NULL,
  p_slug text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas ADMIN pode atualizar workspace';
  END IF;

  IF p_slug IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE slug = p_slug AND id != p_workspace_id
  ) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;

  UPDATE public.workspaces
  SET
    nome = COALESCE(p_nome, nome),
    slug = COALESCE(p_slug, slug)
  WHERE id = p_workspace_id;

  SELECT json_build_object(
    'id', id, 'slug', slug, 'nome', nome, 'updated_at', updated_at
  ) INTO v_result FROM public.workspaces WHERE id = p_workspace_id;

  RETURN v_result;
END;
$$;

-- Deletar workspace (apenas ADMIN/OWNER)
CREATE OR REPLACE FUNCTION public.deletar_workspace(
  p_workspace_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
  v_workspace_nome text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT owner_id = v_user_id, nome
  INTO v_is_owner, v_workspace_nome
  FROM public.workspaces
  WHERE id = p_workspace_id;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Apenas o OWNER pode deletar o workspace';
  END IF;

  DELETE FROM public.workspaces WHERE id = p_workspace_id;

  RETURN json_build_object(
    'message', 'Workspace ' || v_workspace_nome || ' deletado com sucesso'
  );
END;
$$;

-- ============================================
-- 4. RPC: WORKSPACE MEMBERS
-- ============================================

-- Convidar membro (apenas ADMIN)
CREATE OR REPLACE FUNCTION public.convidar_membro(
  p_workspace_id uuid,
  p_user_email text,
  p_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_invited_user_id uuid;
  v_is_admin boolean;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas ADMIN pode convidar membros';
  END IF;

  IF p_role NOT IN ('ADMIN', 'PROFESSIONAL', 'STAFF') THEN
    RAISE EXCEPTION 'Role inválido';
  END IF;

  SELECT id INTO v_invited_user_id
  FROM auth.users WHERE email = p_user_email;

  IF v_invited_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = v_invited_user_id
  ) THEN
    RAISE EXCEPTION 'Usuário já é membro deste workspace';
  END IF;

  INSERT INTO public.workspace_members (
    workspace_id, user_id, role, convidado_por
  ) VALUES (
    p_workspace_id, v_invited_user_id, p_role, v_user_id
  );

  SELECT json_build_object(
    'user_id', v_invited_user_id,
    'email', p_user_email,
    'role', p_role,
    'message', 'Membro convidado com sucesso'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Alterar role de membro (apenas ADMIN)
CREATE OR REPLACE FUNCTION public.alterar_role_membro(
  p_member_id uuid,
  p_new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_is_admin boolean;
  v_target_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_new_role NOT IN ('ADMIN', 'PROFESSIONAL', 'STAFF') THEN
    RAISE EXCEPTION 'Role inválido';
  END IF;

  SELECT workspace_id, user_id INTO v_workspace_id, v_target_user_id
  FROM public.workspace_members WHERE id = p_member_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas ADMIN pode alterar roles';
  END IF;

  UPDATE public.workspace_members
  SET role = p_new_role
  WHERE id = p_member_id;

  RETURN json_build_object(
    'member_id', p_member_id,
    'new_role', p_new_role,
    'message', 'Role alterado com sucesso'
  );
END;
$$;

-- Remover membro (apenas ADMIN)
CREATE OR REPLACE FUNCTION public.remover_membro(
  p_member_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_is_admin boolean;
  v_target_user_id uuid;
  v_is_owner boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT workspace_id, user_id INTO v_workspace_id, v_target_user_id
  FROM public.workspace_members WHERE id = p_member_id;

  SELECT owner_id = v_target_user_id INTO v_is_owner
  FROM public.workspaces WHERE id = v_workspace_id;

  IF v_is_owner THEN
    RAISE EXCEPTION 'Não é possível remover o OWNER do workspace';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas ADMIN pode remover membros';
  END IF;

  DELETE FROM public.workspace_members WHERE id = p_member_id;

  RETURN json_build_object(
    'message', 'Membro removido com sucesso'
  );
END;
$$;

-- ============================================
-- VERIFICAÇÃO PARTE 1
-- ============================================

SELECT '✅ PARTE 1 CONCLUÍDA - Users, Workspaces, Members' as status;

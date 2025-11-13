-- ============================================
-- RPC FUNCTIONS - PARTE 2
-- Patients, Consultations e Chat
-- ============================================

-- ============================================
-- 1. RPC: PATIENTS
-- ============================================

-- Criar paciente (ADMIN/PROFESSIONAL)
CREATE OR REPLACE FUNCTION public.criar_paciente(
  p_workspace_id uuid,
  p_nome text,
  p_data_nascimento date DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_endereco text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_has_permission boolean;
  v_patient_id uuid;
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
      AND role IN ('ADMIN', 'PROFESSIONAL')
      AND ativo = true
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Sem permissão para criar pacientes';
  END IF;

  IF p_cpf IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.patients WHERE cpf = p_cpf
  ) THEN
    RAISE EXCEPTION 'CPF já cadastrado';
  END IF;

  INSERT INTO public.patients (
    workspace_id, nome, data_nascimento, cpf,
    telefone, email, endereco, observacoes, created_by
  ) VALUES (
    p_workspace_id, p_nome, p_data_nascimento, p_cpf,
    p_telefone, p_email, p_endereco, p_observacoes, v_user_id
  ) RETURNING id INTO v_patient_id;

  SELECT json_build_object(
    'id', id, 'nome', nome, 'cpf', cpf,
    'telefone', telefone, 'created_at', created_at
  ) INTO v_result FROM public.patients WHERE id = v_patient_id;

  RETURN v_result;
END;
$$;

-- Atualizar paciente (ADMIN/PROFESSIONAL)
CREATE OR REPLACE FUNCTION public.atualizar_paciente(
  p_patient_id uuid,
  p_nome text DEFAULT NULL,
  p_data_nascimento date DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_endereco text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_has_permission boolean;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT workspace_id INTO v_workspace_id
  FROM public.patients WHERE id = p_patient_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role IN ('ADMIN', 'PROFESSIONAL')
      AND ativo = true
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Sem permissão para atualizar pacientes';
  END IF;

  IF p_cpf IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE cpf = p_cpf AND id != p_patient_id
  ) THEN
    RAISE EXCEPTION 'CPF já cadastrado em outro paciente';
  END IF;

  UPDATE public.patients
  SET
    nome = COALESCE(p_nome, nome),
    data_nascimento = COALESCE(p_data_nascimento, data_nascimento),
    cpf = COALESCE(p_cpf, cpf),
    telefone = COALESCE(p_telefone, telefone),
    email = COALESCE(p_email, email),
    endereco = COALESCE(p_endereco, endereco),
    observacoes = COALESCE(p_observacoes, observacoes)
  WHERE id = p_patient_id;

  SELECT json_build_object(
    'id', id, 'nome', nome, 'cpf', cpf,
    'telefone', telefone, 'updated_at', updated_at
  ) INTO v_result FROM public.patients WHERE id = p_patient_id;

  RETURN v_result;
END;
$$;

-- Deletar paciente (ADMIN/PROFESSIONAL)
CREATE OR REPLACE FUNCTION public.deletar_paciente(
  p_patient_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_has_permission boolean;
  v_patient_nome text;
  v_consultations_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT workspace_id, nome INTO v_workspace_id, v_patient_nome
  FROM public.patients WHERE id = p_patient_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role IN ('ADMIN', 'PROFESSIONAL')
      AND ativo = true
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Sem permissão para deletar pacientes';
  END IF;

  SELECT COUNT(*) INTO v_consultations_count
  FROM public.consultations WHERE paciente_id = p_patient_id;

  IF v_consultations_count > 0 THEN
    RAISE EXCEPTION 'Paciente possui % consulta(s). Não é possível deletar.', v_consultations_count;
  END IF;

  DELETE FROM public.patients WHERE id = p_patient_id;

  RETURN json_build_object(
    'message', 'Paciente ' || v_patient_nome || ' deletado com sucesso'
  );
END;
$$;

-- ============================================
-- 2. RPC: CONSULTATIONS
-- ============================================

-- Criar consulta (ADMIN/PROFESSIONAL)
CREATE OR REPLACE FUNCTION public.criar_consulta(
  p_workspace_id uuid,
  p_paciente_id uuid,
  p_queixa_principal text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_has_permission boolean;
  v_consultation_id uuid;
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
      AND role IN ('ADMIN', 'PROFESSIONAL')
      AND ativo = true
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Sem permissão para criar consultas';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_paciente_id AND workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'Paciente não encontrado neste workspace';
  END IF;

  INSERT INTO public.consultations (
    workspace_id, paciente_id, profissional_id, queixa_principal
  ) VALUES (
    p_workspace_id, p_paciente_id, v_user_id, p_queixa_principal
  ) RETURNING id INTO v_consultation_id;

  SELECT json_build_object(
    'id', id, 'paciente_id', paciente_id,
    'profissional_id', profissional_id,
    'status', status, 'iniciada_em', iniciada_em
  ) INTO v_result FROM public.consultations WHERE id = v_consultation_id;

  RETURN v_result;
END;
$$;

-- Atualizar consulta (ADMIN ou PROFESSIONAL dono)
CREATE OR REPLACE FUNCTION public.atualizar_consulta(
  p_consultation_id uuid,
  p_queixa_principal text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_profissional_id uuid;
  v_is_admin boolean;
  v_is_owner boolean;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT workspace_id, profissional_id
  INTO v_workspace_id, v_profissional_id
  FROM public.consultations WHERE id = p_consultation_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  v_is_owner := (v_profissional_id = v_user_id);

  IF NOT (v_is_admin OR v_is_owner) THEN
    RAISE EXCEPTION 'Sem permissão para atualizar esta consulta';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('em_andamento', 'concluida', 'cancelada') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;

  UPDATE public.consultations
  SET
    queixa_principal = COALESCE(p_queixa_principal, queixa_principal),
    status = COALESCE(p_status, status),
    concluida_em = CASE WHEN p_status = 'concluida' THEN NOW() ELSE concluida_em END
  WHERE id = p_consultation_id;

  SELECT json_build_object(
    'id', id, 'status', status,
    'concluida_em', concluida_em, 'updated_at', updated_at
  ) INTO v_result FROM public.consultations WHERE id = p_consultation_id;

  RETURN v_result;
END;
$$;

-- Deletar consulta (ADMIN ou PROFESSIONAL dono)
CREATE OR REPLACE FUNCTION public.deletar_consulta(
  p_consultation_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_profissional_id uuid;
  v_is_admin boolean;
  v_is_owner boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT workspace_id, profissional_id
  INTO v_workspace_id, v_profissional_id
  FROM public.consultations WHERE id = p_consultation_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role = 'ADMIN'
      AND ativo = true
  ) INTO v_is_admin;

  v_is_owner := (v_profissional_id = v_user_id);

  IF NOT (v_is_admin OR v_is_owner) THEN
    RAISE EXCEPTION 'Sem permissão para deletar esta consulta';
  END IF;

  DELETE FROM public.consultations WHERE id = p_consultation_id;

  RETURN json_build_object(
    'message', 'Consulta deletada com sucesso'
  );
END;
$$;

-- ============================================
-- 3. RPC: CHAT MESSAGES
-- ============================================

-- Criar mensagem (ADMIN/PROFESSIONAL)
CREATE OR REPLACE FUNCTION public.criar_mensagem_chat(
  p_consulta_id uuid,
  p_tipo_mensagem text,
  p_conteudo text,
  p_audio_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_has_permission boolean;
  v_message_id uuid;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_tipo_mensagem NOT IN ('texto', 'audio', 'sistema') THEN
    RAISE EXCEPTION 'Tipo de mensagem inválido';
  END IF;

  SELECT workspace_id INTO v_workspace_id
  FROM public.consultations WHERE id = p_consulta_id;

  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = v_workspace_id
      AND user_id = v_user_id
      AND role IN ('ADMIN', 'PROFESSIONAL')
      AND ativo = true
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Sem permissão para enviar mensagens';
  END IF;

  INSERT INTO public.chat_messages (
    consulta_id, user_id, tipo_mensagem, conteudo, audio_url
  ) VALUES (
    p_consulta_id, v_user_id, p_tipo_mensagem, p_conteudo, p_audio_url
  ) RETURNING id INTO v_message_id;

  SELECT json_build_object(
    'id', id, 'consulta_id', consulta_id,
    'tipo_mensagem', tipo_mensagem, 'conteudo', conteudo,
    'created_at', created_at
  ) INTO v_result FROM public.chat_messages WHERE id = v_message_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- VERIFICAÇÃO PARTE 2
-- ============================================

SELECT '✅ PARTE 2 CONCLUÍDA - Patients, Consultations, Chat' as status;

-- ============================================
-- MIGRATIONS SUPABASE - MEDCOPILOT (VERSÃO FINAL)
-- ============================================
-- Execute este arquivo COMPLETO no SQL Editor do Supabase
-- IMPORTANTE: Execute com permissões de ADMIN/SERVICE_ROLE
-- ============================================

-- ============================================
-- 0. GARANTIR PERMISSÕES (EXECUTAR COMO ADMIN)
-- ============================================

-- Garantir que o usuário atual tem permissões no schema public
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- 1.1 Tabela: users (Perfis de Usuários)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  nome text NOT NULL,
  sobrenome text,
  nome_completo text GENERATED ALWAYS AS (nome || ' ' || COALESCE(sobrenome, '')) STORED,
  email text UNIQUE,
  avatar_url text,
  telefone text,
  especialidade text,
  crm text,
  ativo boolean NOT NULL DEFAULT true,
  onboarding boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Tabela: workspaces (Clínicas/Consultórios)
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status_assinatura text NOT NULL DEFAULT 'trial',
  plano_assinatura text NOT NULL DEFAULT 'basic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 Tabela: workspace_members (Membros do Workspace)
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  role text NOT NULL,
  convidado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  data_entrada timestamptz NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  UNIQUE(workspace_id, user_id)
);

-- 1.4 Tabela: patients (Pacientes)
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE,
  nome text NOT NULL,
  data_nascimento date,
  cpf text UNIQUE,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 Tabela: consultations (Consultas)
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  profissional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  queixa_principal text,
  status text NOT NULL DEFAULT 'em_andamento',
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  concluida_em timestamptz,
  duracao_minutos int4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 Tabela: transcriptions (Transcrições)
CREATE TABLE public.transcriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id uuid UNIQUE NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  texto_completo text NOT NULL,
  audio_url text,
  duracao_audio_segundos int4,
  idioma text NOT NULL DEFAULT 'pt-BR',
  confianca_score numeric(3,2),
  falantes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 Tabela: analysis_results (Resultados da IA)
CREATE TABLE public.analysis_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id uuid UNIQUE NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  diagnostico text,
  exames_sugeridos jsonb,
  medicamentos_sugeridos jsonb,
  notas_clinicas text,
  nivel_confianca text,
  modelo_ia text,
  tempo_processamento_ms int4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.8 Tabela: chat_messages (Mensagens do Chat)
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  tipo_mensagem text NOT NULL,
  conteudo text NOT NULL,
  audio_url text,
  resposta_ia boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ADICIONAR CONSTRAINTS CHECK
-- ============================================

ALTER TABLE public.workspaces
ADD CONSTRAINT validar_status_assinatura
CHECK (status_assinatura IN ('trial', 'active', 'suspended', 'cancelled'));

ALTER TABLE public.workspace_members
ADD CONSTRAINT validar_role
CHECK (role IN ('ADMIN', 'PROFESSIONAL', 'STAFF'));

ALTER TABLE public.consultations
ADD CONSTRAINT validar_status_consulta
CHECK (status IN ('em_andamento', 'concluida', 'cancelada'));

ALTER TABLE public.chat_messages
ADD CONSTRAINT validar_tipo_mensagem
CHECK (tipo_mensagem IN ('texto', 'audio', 'sistema'));

-- ============================================
-- 3. CRIAR FUNÇÕES E TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, created_at)
  VALUES (NEW.id, '', NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_criar_perfil_usuario ON auth.users;

CREATE TRIGGER trigger_criar_perfil_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_perfil_usuario();

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_atualizar_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_workspaces
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_patients
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_consultations
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_analysis
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================
-- 4. CRIAR RPC FUNCTIONS (Operações Seguras)
-- ============================================

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
-- 5. CRIAR ÍNDICES (Performance)
-- ============================================

CREATE INDEX idx_usuarios_nome ON public.users(nome);
CREATE INDEX idx_usuarios_email ON public.users(email);
CREATE INDEX idx_membros_usuario ON public.workspace_members(user_id);
CREATE INDEX idx_membros_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_membros_role ON public.workspace_members(role);
CREATE INDEX idx_consultas_workspace ON public.consultations(workspace_id);
CREATE INDEX idx_consultas_profissional ON public.consultations(profissional_id);
CREATE INDEX idx_consultas_paciente ON public.consultations(paciente_id);
CREATE INDEX idx_consultas_status ON public.consultations(status);
CREATE INDEX idx_consultas_data ON public.consultations(iniciada_em DESC);
CREATE INDEX idx_pacientes_workspace ON public.patients(workspace_id);
CREATE INDEX idx_pacientes_nome ON public.patients(nome);
CREATE INDEX idx_pacientes_cpf ON public.patients(cpf);
CREATE INDEX idx_chat_consulta ON public.chat_messages(consulta_id);
CREATE INDEX idx_chat_data ON public.chat_messages(created_at DESC);

-- ============================================
-- 6. HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CRIAR POLICIES RLS
-- ============================================

-- Policies: users
-- APENAS SELECT permitido via RLS
-- CUD (Create, Update, Delete) devem ser feitos via RPC Functions
CREATE POLICY "usuarios_visualizar_proprio_perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policies: workspaces
CREATE POLICY "membros_visualizar_workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Policies: workspace_members
CREATE POLICY "membros_visualizar_outros_membros"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Policies: patients
CREATE POLICY "membros_visualizar_pacientes"
  ON public.patients FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Policies: consultations
CREATE POLICY "admin_acesso_total_consultas"
  ON public.consultations FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'ADMIN' AND ativo = true
    )
  );

CREATE POLICY "profissional_acesso_proprias_consultas"
  ON public.consultations FOR ALL
  USING (
    profissional_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'PROFESSIONAL' AND ativo = true
    )
  );

CREATE POLICY "profissional_visualizar_consultas_equipe"
  ON public.consultations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'PROFESSIONAL' AND ativo = true
    )
  );

CREATE POLICY "staff_visualizar_consultas"
  ON public.consultations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'STAFF' AND ativo = true
    )
  );

-- ============================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================

SELECT '🎉 MIGRATIONS EXECUTADAS COM SUCESSO!' as resultado;

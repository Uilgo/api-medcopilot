/**
 * Tipos TypeScript para as tabelas do banco de dados
 * Baseado na estrutura definida em database-structure.md
 */

/**
 * Workspace (Tenant/Clínica)
 * Representa cada clínica/consultório isolado no sistema multi-tenant
 */
export interface Workspace {
  id: string;
  slug: string;
  nome: string;
  owner_id: string;
  status_assinatura: 'trial' | 'active' | 'suspended' | 'cancelled';
  plano_assinatura: string;
  created_at: string;
  updated_at: string;
}

/**
 * User (Perfil de Usuário)
 * Tabela espelho da auth.users com dados adicionais
 */
export interface User {
  id: string;
  nome: string;
  sobrenome: string | null;
  nome_completo: string;
  email: string | null;
  avatar_url: string | null;
  telefone: string | null;
  especialidade: string | null;
  crm: string | null;
  ativo: boolean;
  onboarding: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * WorkspaceMember (Mapeamento Multi-Tenant)
 * Liga usuários a workspaces e define roles (RBAC)
 */
export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'ADMIN' | 'PROFESSIONAL' | 'STAFF';
  convidado_por: string | null;
  data_entrada: string;
  ativo: boolean;
}

/**
 * Patient (Paciente)
 * Armazena dados cadastrais (não-clínicos) dos pacientes
 */
export interface Patient {
  id: string;
  workspace_id: string;
  nome: string;
  data_nascimento: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Consultation (Consulta)
 * Tabela central - armazena cada consulta realizada
 */
export interface Consultation {
  id: string;
  workspace_id: string;
  paciente_id: string;
  profissional_id: string;
  queixa_principal: string | null;
  status: 'em_andamento' | 'concluida' | 'cancelada';
  iniciada_em: string;
  concluida_em: string | null;
  duracao_minutos: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transcription (Transcrição)
 * Armazena o texto bruto da transcrição automática (Whisper)
 */
export interface Transcription {
  id: string;
  consulta_id: string;
  texto_completo: string;
  audio_url: string | null;
  duracao_audio_segundos: number | null;
  idioma: string;
  confianca_score: number | null;
  falantes: SpeakerIdentification | null;
  created_at: string;
}

/**
 * Estrutura JSONB para identificação de falantes
 */
export interface SpeakerIdentification {
  [key: string]: {
    nome: string;
    segmentos: Array<{
      inicio: number;
      fim: number;
      texto: string;
    }>;
  };
}

/**
 * AnalysisResult (Resultado da IA)
 * Armazena o resultado processado pela IA (GPT-4)
 */
export interface AnalysisResult {
  id: string;
  consulta_id: string;
  diagnostico: string | null;
  exames_sugeridos: ExameSugerido[] | null;
  medicamentos_sugeridos: MedicamentoSugerido[] | null;
  notas_clinicas: string | null;
  nivel_confianca: 'alto' | 'medio' | 'baixo' | null;
  modelo_ia: string | null;
  tempo_processamento_ms: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Estrutura JSONB para exames sugeridos
 */
export interface ExameSugerido {
  nome: string;
  motivo: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

/**
 * Estrutura JSONB para medicamentos sugeridos
 */
export interface MedicamentoSugerido {
  nome: string;
  dosagem: string;
  duracao: string;
  observacoes?: string;
}

/**
 * ChatMessage (Mensagem do Chat)
 * Armazena o histórico de mensagens do chat contextual pós-consulta
 */
export interface ChatMessage {
  id: string;
  consulta_id: string;
  user_id: string | null;
  tipo_mensagem: 'texto' | 'audio' | 'sistema';
  conteudo: string;
  audio_url: string | null;
  resposta_ia: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Tipos auxiliares para relacionamentos
 */

/**
 * Workspace com dados do owner
 */
export interface WorkspaceWithOwner extends Workspace {
  owner: User;
}

/**
 * WorkspaceMember com dados do usuário
 */
export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: User;
}

/**
 * Consultation com dados relacionados
 */
export interface ConsultationWithRelations extends Consultation {
  paciente: Patient;
  profissional: User;
  transcription?: Transcription;
  analysis_result?: AnalysisResult;
  chat_messages?: ChatMessage[];
}

/**
 * Patient com histórico de consultas
 */
export interface PatientWithConsultations extends Patient {
  consultations: Consultation[];
}

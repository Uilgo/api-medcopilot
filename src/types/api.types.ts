/**
 * Tipos para requests e responses da API
 * Define contratos de entrada e saída dos endpoints
 */

import { UserRole } from './enums';
import {
  User,
  Workspace,
  WorkspaceMember,
  Patient,
  Consultation,
  Transcription,
  AnalysisResult,
  ChatMessage,
} from './database.types';

/**
 * ============================================
 * AUTENTICAÇÃO
 * ============================================
 */

/**
 * Request: Cadastro de novo usuário
 */
export interface SignupRequest {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

/**
 * Request: Login de usuário
 */
export interface LoginRequest {
  email: string;
  senha: string;
}

/**
 * Request: Esqueci minha senha
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request: Resetar senha
 */
export interface ResetPasswordRequest {
  token: string;
  nova_senha: string;
}

/**
 * Request: Completar onboarding (criar primeiro workspace)
 */
export interface OnboardingRequest {
  nome_workspace: string;
  slug?: string; // Opcional, será gerado se não fornecido
}

/**
 * Response: Autenticação bem-sucedida
 */
export interface AuthResponse {
  user: User;
  token: string;
  workspaces: WorkspaceListItem[];
  onboarding_completo: boolean;
}

/**
 * Response: Dados do usuário autenticado
 */
export interface MeResponse {
  user: User;
  onboarding_completo: boolean;
}

/**
 * Response: Token de reset de senha (apenas em desenvolvimento)
 */
export interface ForgotPasswordResponse {
  message: string;
  token?: string; // Apenas em desenvolvimento
}

/**
 * ============================================
 * WORKSPACES
 * ============================================
 */

/**
 * Request: Criar novo workspace
 */
export interface CreateWorkspaceRequest {
  nome: string;
  slug?: string; // Opcional, será gerado se não fornecido
}

/**
 * Request: Atualizar workspace
 */
export interface UpdateWorkspaceRequest {
  nome?: string;
  slug?: string;
  plano_assinatura?: string;
}

/**
 * Response: Item da lista de workspaces
 */
export interface WorkspaceListItem {
  id: string;
  slug: string;
  nome: string;
  role: UserRole;
  status_assinatura: string;
}

/**
 * Response: Detalhes completos do workspace
 */
export interface WorkspaceResponse {
  workspace: Workspace;
  role: UserRole;
  members_count: number;
  patients_count: number;
  consultations_count: number;
}

/**
 * ============================================
 * MEMBROS DO WORKSPACE
 * ============================================
 */

/**
 * Request: Convidar membro para workspace
 */
export interface InviteMemberRequest {
  email: string;
  role: UserRole;
}

/**
 * Request: Atualizar role de membro
 */
export interface UpdateMemberRoleRequest {
  role: UserRole;
}

/**
 * Response: Membro do workspace com dados do usuário
 */
export interface MemberResponse {
  id: string;
  user_id: string;
  nome: string;
  sobrenome: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  data_entrada: string;
  ativo: boolean;
  convidado_por: string | null;
}

/**
 * ============================================
 * PACIENTES
 * ============================================
 */

/**
 * Request: Criar paciente
 */
export interface CreatePatientRequest {
  nome: string;
  data_nascimento?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

/**
 * Request: Atualizar paciente
 */
export interface UpdatePatientRequest {
  nome?: string;
  data_nascimento?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

/**
 * Response: Lista de pacientes com paginação
 */
export interface PatientsListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Response: Detalhes do paciente com histórico
 */
export interface PatientDetailResponse {
  patient: Patient;
  consultations_count: number;
  last_consultation?: Consultation;
}

/**
 * ============================================
 * CONSULTAS
 * ============================================
 */

/**
 * Request: Criar consulta
 */
export interface CreateConsultationRequest {
  paciente_id: string;
  queixa_principal?: string;
}

/**
 * Request: Atualizar consulta
 */
export interface UpdateConsultationRequest {
  queixa_principal?: string;
  status?: 'em_andamento' | 'concluida' | 'cancelada';
  concluida_em?: string;
}

/**
 * Response: Lista de consultas com paginação
 */
export interface ConsultationsListResponse {
  consultations: ConsultationListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Item da lista de consultas
 */
export interface ConsultationListItem {
  id: string;
  paciente_nome: string;
  profissional_nome: string;
  queixa_principal: string | null;
  status: string;
  iniciada_em: string;
  duracao_minutos: number | null;
}

/**
 * Response: Detalhes completos da consulta
 */
export interface ConsultationDetailResponse {
  consultation: Consultation;
  paciente: Patient;
  profissional: User;
  transcription?: Transcription;
  analysis_result?: AnalysisResult;
  chat_messages?: ChatMessage[];
}

/**
 * ============================================
 * TRANSCRIÇÃO
 * ============================================
 */

/**
 * Request: Upload de áudio para transcrição
 */
export interface UploadAudioRequest {
  consultation_id: string;
  // File será enviado via multipart/form-data
}

/**
 * Response: Transcrição completa
 */
export interface TranscriptionResponse {
  transcription: Transcription;
}

/**
 * ============================================
 * ANÁLISE DE IA
 * ============================================
 */

/**
 * Request: Analisar transcrição
 */
export interface AnalyzeTranscriptionRequest {
  consultation_id: string;
  transcription_id: string;
}

/**
 * Response: Resultado da análise
 */
export interface AnalysisResponse {
  analysis_result: AnalysisResult;
}

/**
 * ============================================
 * CHAT
 * ============================================
 */

/**
 * Request: Enviar mensagem de texto
 */
export interface SendMessageRequest {
  consultation_id: string;
  conteudo: string;
}

/**
 * Request: Enviar mensagem de áudio
 */
export interface SendAudioMessageRequest {
  consultation_id: string;
  // File será enviado via multipart/form-data
}

/**
 * Response: Histórico de mensagens
 */
export interface ChatHistoryResponse {
  messages: ChatMessage[];
  consultation: Consultation;
}

/**
 * ============================================
 * TIPOS AUXILIARES
 * ============================================
 */

/**
 * Resposta de erro padronizada
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Resposta de sucesso genérica
 */
export interface SuccessResponse {
  message: string;
  data?: unknown;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Parâmetros de filtro para consultas
 */
export interface ConsultationFilters extends PaginationParams {
  status?: string;
  paciente_id?: string;
  profissional_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

/**
 * Parâmetros de filtro para pacientes
 */
export interface PatientFilters extends PaginationParams {
  search?: string; // Busca por nome ou CPF
}

/**
 * Contexto de workspace injetado no request
 */
export interface WorkspaceContext {
  workspace_id: string;
  workspace_slug: string;
  user_role: UserRole;
}

/**
 * Request estendido com contexto de autenticação e workspace
 */
export interface AuthenticatedRequest {
  user_id: string;
  user: User;
  workspace?: WorkspaceContext;
}

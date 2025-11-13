/**
 * Enums para valores restritos no sistema
 * Usados para validação e tipagem forte
 */

/**
 * Roles de usuário no sistema (RBAC)
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
  STAFF = 'STAFF',
}

/**
 * Status da assinatura do workspace
 */
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

/**
 * Status da consulta
 */
export enum ConsultationStatus {
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
}

/**
 * Tipo de mensagem no chat
 */
export enum MessageType {
  TEXTO = 'texto',
  AUDIO = 'audio',
  SISTEMA = 'sistema',
}

/**
 * Nível de confiança da análise de IA
 */
export enum ConfidenceLevel {
  ALTO = 'alto',
  MEDIO = 'medio',
  BAIXO = 'baixo',
}

/**
 * Prioridade de exame
 */
export enum ExamPriority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAIXA = 'baixa',
}

/**
 * Arrays de valores para validação
 * Úteis para schemas Zod e validações
 */
export const USER_ROLES = Object.values(UserRole);
export const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus);
export const CONSULTATION_STATUSES = Object.values(ConsultationStatus);
export const MESSAGE_TYPES = Object.values(MessageType);
export const CONFIDENCE_LEVELS = Object.values(ConfidenceLevel);
export const EXAM_PRIORITIES = Object.values(ExamPriority);

/**
 * Service de Pacientes
 * Gerencia operações relacionadas a pacientes usando RPC Functions
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { CreatePatientInput, UpdatePatientInput, PatientListQuery } from '../schemas/patient.schema';
import type { Patient } from '../types/database.types';

/**
 * Criar novo paciente
 * Usa RPC Function (ADMIN/PROFESSIONAL)
 */
export const createPatient = async (
  workspaceId: string,
  data: CreatePatientInput
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('criar_paciente', {
    p_workspace_id: workspaceId,
    p_nome: data.nome,
    p_data_nascimento: data.data_nascimento || null,
    p_cpf: data.cpf || null,
    p_telefone: data.telefone || null,
    p_email: data.email || null,
    p_endereco: data.endereco || null,
    p_observacoes: data.observacoes || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para criar pacientes', 403);
    }
    if (error.message.includes('CPF já cadastrado')) {
      throw new AppError('CPF já cadastrado', 400);
    }
    throw new AppError(error.message || 'Erro ao criar paciente', 500);
  }

  return result as Patient;
};

/**
 * Listar pacientes do workspace com filtros e paginação
 * Usa SELECT direto (não precisa RPC)
 */
export const getPatients = async (
  workspaceId: string,
  filters: PatientListQuery
) => {
  const { page = 1, limit = 10, search } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  // Aplicar filtro de busca (nome ou CPF)
  if (search) {
    query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
  }

  // Aplicar paginação
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar pacientes', 500);
  }

  return {
    patients: (data || []) as Patient[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Buscar paciente por ID
 * Usa SELECT direto (não precisa RPC)
 */
export const getPatientById = async (patientId: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    throw new AppError('Paciente não encontrado', 404);
  }

  // Buscar número de consultas do paciente
  const { count: consultationsCount } = await supabase
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('paciente_id', patientId);

  // Buscar última consulta
  const { data: lastConsultation } = await supabase
    .from('consultations')
    .select('id, status, iniciada_em')
    .eq('paciente_id', patientId)
    .order('iniciada_em', { ascending: false })
    .limit(1)
    .single();

  return {
    patient: data as Patient,
    consultations_count: consultationsCount || 0,
    last_consultation: lastConsultation || null,
  };
};

/**
 * Atualizar paciente
 * Usa RPC Function (ADMIN/PROFESSIONAL)
 */
export const updatePatient = async (
  patientId: string,
  data: UpdatePatientInput
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('atualizar_paciente', {
    p_patient_id: patientId,
    p_nome: data.nome || null,
    p_data_nascimento: data.data_nascimento || null,
    p_cpf: data.cpf || null,
    p_telefone: data.telefone || null,
    p_email: data.email || null,
    p_endereco: data.endereco || null,
    p_observacoes: data.observacoes || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para atualizar pacientes', 403);
    }
    if (error.message.includes('CPF já cadastrado')) {
      throw new AppError('CPF já cadastrado em outro paciente', 400);
    }
    throw new AppError(error.message || 'Erro ao atualizar paciente', 500);
  }

  return result as Patient;
};

/**
 * Deletar paciente
 * Usa RPC Function (ADMIN/PROFESSIONAL)
 * Verifica se paciente tem consultas antes de deletar
 */
export const deletePatient = async (patientId: string) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('deletar_paciente', {
    p_patient_id: patientId,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para deletar pacientes', 403);
    }
    if (error.message.includes('possui')) {
      throw new AppError(error.message, 400);
    }
    throw new AppError(error.message || 'Erro ao deletar paciente', 500);
  }

  return result || { message: 'Paciente deletado com sucesso' };
};

/**
 * Buscar pacientes por nome ou CPF (para autocomplete)
 * Usa SELECT direto (não precisa RPC)
 */
export const searchPatients = async (
  workspaceId: string,
  query: string,
  limit: number = 10
) => {
  if (!query || query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('patients')
    .select('id, nome, cpf, telefone')
    .eq('workspace_id', workspaceId)
    .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`)
    .order('nome')
    .limit(limit);

  if (error) {
    throw new AppError('Erro ao buscar pacientes', 500);
  }

  return (data || []) as Pick<Patient, 'id' | 'nome' | 'cpf' | 'telefone'>[];
};

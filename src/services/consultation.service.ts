/**
 * Service de Consultas
 * Gerencia operações relacionadas a consultas usando RPC Functions
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { Consultation } from '../types/database.types';

/**
 * Criar nova consulta
 * Usa RPC Function (ADMIN/PROFESSIONAL)
 */
export const createConsultation = async (
  workspaceId: string,
  pacienteId: string,
  queixaPrincipal?: string
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('criar_consulta', {
    p_workspace_id: workspaceId,
    p_paciente_id: pacienteId,
    p_queixa_principal: queixaPrincipal || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para criar consultas', 403);
    }
    if (error.message.includes('não encontrado')) {
      throw new AppError('Paciente não encontrado neste workspace', 404);
    }
    throw new AppError(error.message || 'Erro ao criar consulta', 500);
  }

  return result as Consultation;
};

/**
 * Listar consultas do workspace com filtros e paginação
 * Usa SELECT direto (RLS valida permissões)
 */
export const getConsultations = async (
  workspaceId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: string;
    profissional_id?: string;
    paciente_id?: string;
  }
) => {
  const { page = 1, limit = 10, status, profissional_id, paciente_id } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('consultations')
    .select(`
      *,
      patients!consultations_paciente_id_fkey (
        id,
        nome,
        cpf
      ),
      users!consultations_profissional_id_fkey (
        id,
        nome,
        sobrenome,
        especialidade
      )
    `, { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('iniciada_em', { ascending: false });

  // Aplicar filtros
  if (status) {
    query = query.eq('status', status);
  }
  if (profissional_id) {
    query = query.eq('profissional_id', profissional_id);
  }
  if (paciente_id) {
    query = query.eq('paciente_id', paciente_id);
  }

  // Aplicar paginação
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar consultas', 500);
  }

  return {
    consultations: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};


/**
 * Buscar consulta por ID
 * Usa SELECT direto (RLS valida permissões)
 */
export const getConsultationById = async (consultationId: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from('consultations')
    .select(`
      *,
      patients!consultations_paciente_id_fkey (
        id,
        nome,
        cpf,
        data_nascimento,
        telefone
      ),
      users!consultations_profissional_id_fkey (
        id,
        nome,
        sobrenome,
        especialidade,
        crm
      ),
      transcriptions (
        id,
        texto_completo,
        audio_url,
        duracao_audio_segundos,
        idioma,
        confianca_score
      ),
      analysis_results (
        id,
        diagnostico,
        exames_sugeridos,
        medicamentos_sugeridos,
        notas_clinicas,
        nivel_confianca,
        modelo_ia
      )
    `)
    .eq('id', consultationId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    throw new AppError('Consulta não encontrada', 404);
  }

  return data;
};

/**
 * Atualizar consulta
 * Usa RPC Function (ADMIN ou PROFESSIONAL dono)
 */
export const updateConsultation = async (
  consultationId: string,
  data: {
    queixa_principal?: string;
    status?: 'em_andamento' | 'concluida' | 'cancelada';
  }
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('atualizar_consulta', {
    p_consultation_id: consultationId,
    p_queixa_principal: data.queixa_principal || null,
    p_status: data.status || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para atualizar esta consulta', 403);
    }
    if (error.message.includes('Status inválido')) {
      throw new AppError('Status inválido', 400);
    }
    throw new AppError(error.message || 'Erro ao atualizar consulta', 500);
  }

  return result as Consultation;
};

/**
 * Deletar consulta
 * Usa RPC Function (ADMIN ou PROFESSIONAL dono)
 */
export const deleteConsultation = async (consultationId: string) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('deletar_consulta', {
    p_consultation_id: consultationId,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para deletar esta consulta', 403);
    }
    throw new AppError(error.message || 'Erro ao deletar consulta', 500);
  }

  return result || { message: 'Consulta deletada com sucesso' };
};

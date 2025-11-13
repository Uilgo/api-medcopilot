/**
 * Service de Workspace
 * Gerencia operações relacionadas a workspaces (clínicas)
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '../schemas/workspace.schema';
import type { Workspace } from '../types/database.types';
import { UserRole } from '../types/enums';

/**
 * Criar novo workspace
 * Apenas usuários que já completaram onboarding podem criar workspaces adicionais
 */
export const createWorkspace = async (userId: string, data: CreateWorkspaceInput) => {
  const { nome, slug } = data;

  // Gerar slug se não fornecido
  const workspaceSlug = slug || generateSlug(nome);

  // Verificar se slug já existe
  const { data: existingWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single();

  if (existingWorkspace) {
    throw new AppError('Este slug já está em uso', 400);
  }

  // Criar workspace
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      nome,
      slug: workspaceSlug,
      owner_id: userId,
      status_assinatura: 'trial',
      plano_assinatura: 'basic',
    })
    .select()
    .single();

  if (workspaceError || !workspaceData) {
    throw new AppError('Erro ao criar workspace', 500);
  }

  // Adicionar usuário como ADMIN no workspace
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceData.id,
      user_id: userId,
      role: UserRole.ADMIN,
      ativo: true,
    });

  if (memberError) {
    // Rollback: deletar workspace criado
    await supabase.from('workspaces').delete().eq('id', workspaceData.id);
    throw new AppError('Erro ao adicionar membro ao workspace', 500);
  }

  return workspaceData as Workspace;
};

/**
 * Buscar workspace por slug
 */
export const getWorkspaceBySlug = async (slug: string, userId: string) => {
  // Buscar workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (workspaceError || !workspace) {
    throw new AppError('Workspace não encontrado', 404);
  }

  // Buscar role do usuário no workspace
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) {
    throw new AppError('Você não tem acesso a este workspace', 403);
  }

  // Contar membros, pacientes e consultas
  const [membersCount, patientsCount, consultationsCount] = await Promise.all([
    countWorkspaceMembers(workspace.id),
    countWorkspacePatients(workspace.id),
    countWorkspaceConsultations(workspace.id),
  ]);

  return {
    workspace: workspace as Workspace,
    role: member.role,
    members_count: membersCount,
    patients_count: patientsCount,
    consultations_count: consultationsCount,
  };
};

/**
 * Atualizar workspace
 * Apenas ADMIN pode atualizar (validado pela RPC)
 */
export const updateWorkspace = async (
  workspaceId: string,
  data: UpdateWorkspaceInput
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('atualizar_workspace', {
    p_workspace_id: workspaceId,
    p_nome: data.nome || null,
    p_slug: data.slug || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Apenas ADMIN')) {
      throw new AppError('Apenas ADMIN pode atualizar workspace', 403);
    }
    if (error.message.includes('já está em uso')) {
      throw new AppError('Este slug já está em uso', 400);
    }
    throw new AppError(error.message || 'Erro ao atualizar workspace', 500);
  }

  if (!result) {
    throw new AppError('Erro ao atualizar workspace', 500);
  }

  return result as Workspace;
};

/**
 * Deletar workspace
 * Apenas OWNER pode deletar (validado pela RPC)
 */
export const deleteWorkspace = async (workspaceId: string) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('deletar_workspace', {
    p_workspace_id: workspaceId,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Apenas o OWNER')) {
      throw new AppError('Apenas o OWNER pode deletar o workspace', 403);
    }
    throw new AppError(error.message || 'Erro ao deletar workspace', 500);
  }

  return result || { message: 'Workspace deletado com sucesso' };
};

/**
 * Buscar role do usuário no workspace
 */
export const getUserRole = async (userId: string, workspaceId: string): Promise<UserRole> => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    throw new AppError('Usuário não é membro deste workspace', 403);
  }

  return data.role as UserRole;
};

/**
 * Helpers para contar recursos
 */
const countWorkspaceMembers = async (workspaceId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('ativo', true);

  return error ? 0 : count || 0;
};

const countWorkspacePatients = async (workspaceId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  return error ? 0 : count || 0;
};

const countWorkspaceConsultations = async (workspaceId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  return error ? 0 : count || 0;
};

/**
 * Gerar slug a partir de texto
 */
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

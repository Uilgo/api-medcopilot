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
 * Apenas ADMIN pode atualizar
 */
export const updateWorkspace = async (
  workspaceId: string,
  data: UpdateWorkspaceInput
) => {
  const updateData: any = {};

  if (data.nome) updateData.nome = data.nome;
  if (data.plano_assinatura) updateData.plano_assinatura = data.plano_assinatura;

  // Se slug foi fornecido, verificar se já existe
  if (data.slug) {
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', workspaceId)
      .single();

    if (existingWorkspace) {
      throw new AppError('Este slug já está em uso', 400);
    }

    updateData.slug = data.slug;
  }

  // Atualizar workspace
  const { data: workspaceData, error } = await supabase
    .from('workspaces')
    .update(updateData)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error || !workspaceData) {
    throw new AppError('Erro ao atualizar workspace', 500);
  }

  return workspaceData as Workspace;
};

/**
 * Deletar workspace
 * Apenas ADMIN (owner) pode deletar
 */
export const deleteWorkspace = async (workspaceId: string, userId: string) => {
  // Verificar se usuário é o owner
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw new AppError('Workspace não encontrado', 404);
  }

  if (workspace.owner_id !== userId) {
    throw new AppError('Apenas o owner pode deletar o workspace', 403);
  }

  // Deletar workspace (cascade vai deletar membros, pacientes, consultas, etc.)
  const { error: deleteError } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (deleteError) {
    throw new AppError('Erro ao deletar workspace', 500);
  }

  return { message: 'Workspace deletado com sucesso' };
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

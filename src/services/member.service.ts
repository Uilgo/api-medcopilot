/**
 * Service de Membros
 * Gerencia operações relacionadas a membros de workspaces
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { InviteMemberInput, UpdateMemberRoleInput } from '../schemas/workspace.schema';
import type { WorkspaceMember, User } from '../types/database.types';
import { UserRole } from '../types/enums';

/**
 * Convidar membro para workspace
 * Apenas ADMIN pode convidar (validado pela RPC)
 */
export const inviteMember = async (
  workspaceId: string,
  data: InviteMemberInput
) => {
  const { email, role } = data;

  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('convidar_membro', {
    p_workspace_id: workspaceId,
    p_user_email: email,
    p_role: role,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Apenas ADMIN')) {
      throw new AppError('Apenas ADMIN pode convidar membros', 403);
    }
    if (error.message.includes('não encontrado')) {
      throw new AppError('Usuário não encontrado com este email', 404);
    }
    if (error.message.includes('já é membro')) {
      throw new AppError('Usuário já é membro deste workspace', 400);
    }
    if (error.message.includes('Role inválido')) {
      throw new AppError('Role inválido', 400);
    }
    throw new AppError(error.message || 'Erro ao convidar membro', 500);
  }

  return result;
};

/**
 * Listar membros do workspace
 */
export const getWorkspaceMembers = async (workspaceId: string) => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      role,
      data_entrada,
      ativo,
      convidado_por,
      users!workspace_members_user_id_fkey (
        id,
        nome,
        sobrenome,
        email,
        avatar_url,
        especialidade,
        crm
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('data_entrada', { ascending: false });

  if (error) {
    throw new AppError('Erro ao buscar membros do workspace', 500);
  }

  // Formatar resposta
  return (data || []).map((item: any) => ({
    id: item.id,
    user_id: item.users.id,
    nome: item.users.nome,
    sobrenome: item.users.sobrenome,
    email: item.users.email,
    avatar_url: item.users.avatar_url,
    especialidade: item.users.especialidade,
    crm: item.users.crm,
    role: item.role,
    data_entrada: item.data_entrada,
    ativo: item.ativo,
    convidado_por: item.convidado_por,
  }));
};

/**
 * Buscar membro por ID
 */
export const getMemberById = async (memberId: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      role,
      data_entrada,
      ativo,
      convidado_por,
      users!workspace_members_user_id_fkey (
        id,
        nome,
        sobrenome,
        email,
        avatar_url,
        especialidade,
        crm
      )
    `)
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    throw new AppError('Membro não encontrado', 404);
  }

  const users = data.users as unknown;
  if (typeof users !== 'object' || users === null) {
    throw new Error('Dados de usuário inválidos');
  }

  const userData = users as Record<string, unknown>;

  return {
    id: data.id,
    user_id: typeof userData.id === 'string' ? userData.id : '',
    nome: typeof userData.nome === 'string' ? userData.nome : '',
    sobrenome: typeof userData.sobrenome === 'string' ? userData.sobrenome : null,
    email: typeof userData.email === 'string' ? userData.email : null,
    avatar_url: typeof userData.avatar_url === 'string' ? userData.avatar_url : null,
    especialidade: typeof userData.especialidade === 'string' ? userData.especialidade : null,
    crm: typeof userData.crm === 'string' ? userData.crm : null,
    role: data.role,
    data_entrada: data.data_entrada,
    ativo: data.ativo,
    convidado_por: data.convidado_por,
  };
};

/**
 * Atualizar role de membro
 * Apenas ADMIN pode atualizar (validado pela RPC)
 */
export const updateMemberRole = async (
  memberId: string,
  data: UpdateMemberRoleInput
) => {
  const { role } = data;

  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('alterar_role_membro', {
    p_member_id: memberId,
    p_new_role: role,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Apenas ADMIN')) {
      throw new AppError('Apenas ADMIN pode alterar roles', 403);
    }
    if (error.message.includes('Role inválido')) {
      throw new AppError('Role inválido', 400);
    }
    throw new AppError(error.message || 'Erro ao atualizar role do membro', 500);
  }

  return result;
};

/**
 * Remover membro do workspace
 * Apenas ADMIN pode remover (validado pela RPC)
 * Não pode remover o OWNER
 */
export const removeMember = async (memberId: string) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('remover_membro', {
    p_member_id: memberId,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Apenas ADMIN')) {
      throw new AppError('Apenas ADMIN pode remover membros', 403);
    }
    if (error.message.includes('Não é possível remover o OWNER')) {
      throw new AppError('Não é possível remover o OWNER do workspace', 400);
    }
    throw new AppError(error.message || 'Erro ao remover membro', 500);
  }

  return result || { message: 'Membro removido com sucesso' };
};

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
 * Apenas ADMIN pode convidar
 */
export const inviteMember = async (
  workspaceId: string,
  data: InviteMemberInput,
  invitedBy: string
) => {
  const { email, role } = data;

  // Verificar se usuário existe
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, nome, sobrenome, email')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    throw new AppError('Usuário não encontrado com este email', 404);
  }

  // Verificar se usuário já é membro do workspace
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userData.id)
    .single();

  if (existingMember) {
    throw new AppError('Usuário já é membro deste workspace', 400);
  }

  // Verificar se workspace já tem um ADMIN (apenas 1 ADMIN permitido)
  if (role === UserRole.ADMIN) {
    const { data: adminExists } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('role', UserRole.ADMIN)
      .single();

    if (adminExists) {
      throw new AppError('Este workspace já possui um ADMIN', 400);
    }
  }

  // Adicionar membro ao workspace
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userData.id,
      role,
      convidado_por: invitedBy,
      ativo: true,
    })
    .select()
    .single();

  if (memberError || !memberData) {
    throw new AppError('Erro ao adicionar membro ao workspace', 500);
  }

  return {
    member: memberData as WorkspaceMember,
    user: userData,
  };
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

  return {
    id: data.id,
    user_id: (data.users as any).id,
    nome: (data.users as any).nome,
    sobrenome: (data.users as any).sobrenome,
    email: (data.users as any).email,
    avatar_url: (data.users as any).avatar_url,
    especialidade: (data.users as any).especialidade,
    crm: (data.users as any).crm,
    role: data.role,
    data_entrada: data.data_entrada,
    ativo: data.ativo,
    convidado_por: data.convidado_por,
  };
};

/**
 * Atualizar role de membro
 * Apenas ADMIN pode atualizar
 */
export const updateMemberRole = async (
  memberId: string,
  workspaceId: string,
  data: UpdateMemberRoleInput
) => {
  const { role } = data;

  // Buscar membro atual
  const { data: currentMember, error: memberError } = await supabase
    .from('workspace_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (memberError || !currentMember) {
    throw new AppError('Membro não encontrado', 404);
  }

  // Verificar se está tentando mudar para ADMIN
  if (role === UserRole.ADMIN && currentMember.role !== UserRole.ADMIN) {
    // Verificar se workspace já tem um ADMIN
    const { data: adminExists } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('role', UserRole.ADMIN)
      .neq('id', memberId)
      .single();

    if (adminExists) {
      throw new AppError('Este workspace já possui um ADMIN', 400);
    }
  }

  // Atualizar role
  const { data: updatedMember, error: updateError } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (updateError || !updatedMember) {
    throw new AppError('Erro ao atualizar role do membro', 500);
  }

  return updatedMember as WorkspaceMember;
};

/**
 * Remover membro do workspace
 * Apenas ADMIN pode remover
 * Não pode remover o próprio ADMIN (owner)
 */
export const removeMember = async (
  memberId: string,
  workspaceId: string,
  requestingUserId: string
) => {
  // Buscar membro a ser removido
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (memberError || !member) {
    throw new AppError('Membro não encontrado', 404);
  }

  // Verificar se está tentando remover o ADMIN (owner)
  if (member.role === UserRole.ADMIN) {
    throw new AppError('Não é possível remover o ADMIN do workspace', 400);
  }

  // Verificar se está tentando remover a si mesmo
  if (member.user_id === requestingUserId) {
    throw new AppError('Você não pode remover a si mesmo do workspace', 400);
  }

  // Remover membro
  const { error: deleteError } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (deleteError) {
    throw new AppError('Erro ao remover membro do workspace', 500);
  }

  return { message: 'Membro removido com sucesso' };
};

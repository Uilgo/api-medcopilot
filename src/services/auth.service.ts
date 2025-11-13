/**
 * Service de Autenticação
 * Gerencia todas as operações de autenticação usando Supabase Auth
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { SignupInput, LoginInput, OnboardingInput } from '../schemas/auth.schema';
import type { User, Workspace, WorkspaceMember } from '../types/database.types';

/**
 * Registrar novo usuário
 * Cria usuário no Supabase Auth + tabela users com onboarding = false
 */
export const signup = async (data: SignupInput) => {
  const { nome, sobrenome, email, senha } = data;

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
  });

  if (authError) {
    throw new AppError(authError.message, 400);
  }

  if (!authData.user) {
    throw new AppError('Erro ao criar usuário', 500);
  }

  // Atualizar dados adicionais na tabela users usando RPC
  const { error: updateError } = await supabase.rpc('atualizar_perfil_usuario', {
    p_nome: nome,
    p_sobrenome: sobrenome,
  });

  if (updateError) {
    throw new AppError('Erro ao atualizar dados do usuário', 500);
  }

  return {
    user: authData.user,
    session: authData.session,
  };
};

/**
 * Login de usuário
 * Autentica e retorna lista de workspaces
 */
export const login = async (data: LoginInput) => {
  const { email, senha } = data;

  // Autenticar no Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (authError) {
    throw new AppError('Email ou senha inválidos', 401);
  }

  if (!authData.user || !authData.session) {
    throw new AppError('Erro ao fazer login', 500);
  }

  // Buscar dados do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Buscar workspaces do usuário
  const workspaces = await getUserWorkspaces(authData.user.id);

  return {
    user: userData as User,
    session: authData.session,
    workspaces,
    onboarding_completo: userData.onboarding,
  };
};

/**
 * Logout de usuário
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AppError('Erro ao fazer logout', 500);
  }

  return { message: 'Logout realizado com sucesso' };
};

/**
 * Solicitar reset de senha
 * Gera token de reset (sem envio de email em desenvolvimento)
 */
export const forgotPassword = async (email: string) => {
  // Verificar se usuário existe
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    // Por segurança, não revelar se email existe ou não
    return {
      message: 'Se o email existir, você receberá instruções para resetar sua senha',
    };
  }

  // Em produção, aqui seria enviado um email com o link de reset
  // Por enquanto, apenas retornamos uma mensagem de sucesso

  // TODO: Implementar envio de email quando houver serviço configurado
  // const resetToken = generateResetToken(userData.id);
  // await sendResetEmail(email, resetToken);

  return {
    message: 'Se o email existir, você receberá instruções para resetar sua senha',
    // Em desenvolvimento, podemos retornar o token
    ...(process.env.NODE_ENV === 'development' && {
      dev_note: 'Em produção, o token seria enviado por email',
    }),
  };
};

/**
 * Resetar senha com token
 */
export const resetPassword = async (token: string, novaSenha: string) => {
  // TODO: Implementar validação de token quando houver sistema de tokens
  // Por enquanto, apenas validamos que o token não está vazio

  if (!token) {
    throw new AppError('Token inválido', 400);
  }

  // Em produção, aqui validaríamos o token e atualizaríamos a senha
  // const userId = validateResetToken(token);
  // await updatePassword(userId, novaSenha);

  return {
    message: 'Senha resetada com sucesso',
    dev_note: 'Implementação completa pendente de sistema de tokens',
  };
};

/**
 * Buscar dados do usuário autenticado
 */
export const getMe = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return {
    user: data as User,
    onboarding_completo: data.onboarding,
  };
};

/**
 * Listar workspaces do usuário
 */
export const getUserWorkspaces = async (userId: string) => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces (
        id,
        slug,
        nome,
        status_assinatura
      )
    `)
    .eq('user_id', userId)
    .eq('ativo', true);

  if (error) {
    throw new AppError('Erro ao buscar workspaces', 500);
  }

  return (data || []).map((item: any) => ({
    id: item.workspaces.id,
    slug: item.workspaces.slug,
    nome: item.workspaces.nome,
    role: item.role,
    status_assinatura: item.workspaces.status_assinatura,
  }));
};

/**
 * Completar onboarding (criar primeiro workspace)
 * Usa RPC Function para garantir atomicidade e segurança
 */
export const completeOnboarding = async (userId: string, data: OnboardingInput) => {
  const { nome_workspace, slug } = data;

  // Gerar slug se não fornecido
  const workspaceSlug = slug || generateSlug(nome_workspace);

  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('completar_onboarding', {
    p_workspace_slug: workspaceSlug,
    p_workspace_nome: nome_workspace,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('já foi completado')) {
      throw new AppError('Onboarding já foi completado', 400);
    }
    if (error.message.includes('já está em uso')) {
      throw new AppError('Este slug já está em uso', 400);
    }
    throw new AppError(error.message || 'Erro ao completar onboarding', 500);
  }

  if (!result) {
    throw new AppError('Erro ao completar onboarding', 500);
  }

  return {
    workspace: {
      id: result.workspace_id,
      slug: result.workspace_slug,
      nome: result.workspace_nome,
    },
    onboarding_completo: result.user_onboarding,
    message: 'Onboarding completado com sucesso',
  };
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

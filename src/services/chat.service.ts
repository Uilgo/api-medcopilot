/**
 * Service de Chat
 * Gerencia operações relacionadas a mensagens de chat usando RPC Functions
 */

import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import type { ChatMessage } from '../types/database.types';

/**
 * Criar mensagem de chat
 * Usa RPC Function (ADMIN/PROFESSIONAL)
 */
export const sendMessage = async (
  consultaId: string,
  data: {
    tipo_mensagem: 'texto' | 'audio' | 'sistema';
    conteudo: string;
    audio_url?: string;
  }
) => {
  // Chamar RPC Function do Supabase
  const { data: result, error } = await supabase.rpc('criar_mensagem_chat', {
    p_consulta_id: consultaId,
    p_tipo_mensagem: data.tipo_mensagem,
    p_conteudo: data.conteudo,
    p_audio_url: data.audio_url || null,
  });

  if (error) {
    // Tratar erros específicos da RPC
    if (error.message.includes('Sem permissão')) {
      throw new AppError('Sem permissão para enviar mensagens', 403);
    }
    if (error.message.includes('Tipo de mensagem inválido')) {
      throw new AppError('Tipo de mensagem inválido', 400);
    }
    throw new AppError(error.message || 'Erro ao enviar mensagem', 500);
  }

  return result as ChatMessage;
};

/**
 * Buscar mensagens de uma consulta
 * Usa SELECT direto (RLS valida permissões)
 */
export const getMessages = async (
  consultaId: string,
  filters: {
    page?: number;
    limit?: number;
  } = {}
) => {
  const { page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('chat_messages')
    .select(`
      *,
      users!chat_messages_user_id_fkey (
        id,
        nome,
        sobrenome,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('consulta_id', consultaId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('Erro ao buscar mensagens', 500);
  }

  return {
    messages: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Buscar última mensagem de uma consulta
 */
export const getLastMessage = async (consultaId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('consulta_id', consultaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (não é erro)
    throw new AppError('Erro ao buscar última mensagem', 500);
  }

  return data as ChatMessage | null;
};

/**
 * Controller de Chat
 * Gerencia requisições HTTP relacionadas a mensagens de chat
 */

import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';

/**
 * POST /api/:workspace_slug/chat/message
 * Enviar mensagem de chat
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { consulta_id, tipo_mensagem, conteudo, audio_url } = req.body;

    if (!consulta_id) {
      return res.status(400).json({ message: 'ID da consulta é obrigatório' });
    }

    if (!tipo_mensagem || !conteudo) {
      return res.status(400).json({ message: 'Tipo de mensagem e conteúdo são obrigatórios' });
    }

    const message = await chatService.sendMessage(consulta_id, {
      tipo_mensagem,
      conteudo,
      audio_url,
    });

    res.status(201).json({
      message: 'Mensagem enviada com sucesso',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/chat/:consultationId
 * Buscar mensagens de uma consulta
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { consultationId } = req.params;
    const { page, limit } = req.query;

    const result = await chatService.getMessages(consultationId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.status(200).json({
      data: result.messages,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/chat/:consultationId/last
 * Buscar última mensagem de uma consulta
 */
export const getLastMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { consultationId } = req.params;

    const message = await chatService.getLastMessage(consultationId);

    res.status(200).json({
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

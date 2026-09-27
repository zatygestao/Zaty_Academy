/**
 * Serviço Central de Realtime do ZatyAcademy
 * Gerencia conexões WebSockets unificadas, eventos e canais do Supabase Realtime
 */
import { supabase } from '../config/supabase';

// Armazena referências dos canais ativos para evitar subscrições duplicadas
const activeChannels = new Map();

/**
 * Cria ou recupera uma subscrição Realtime para qualquer tabela do sistema
 * 
 * @param {Object} options
 * @param {string} options.table - Nome da tabela (ex: 'academy_audit_logs', 'academy_payments')
 * @param {string} [options.schema='public'] - Schema do banco (padrão: public)
 * @param {string} [options.event='*'] - Evento: 'INSERT', 'UPDATE', 'DELETE' ou '*'
 * @param {string} [options.filter] - Filtro Postgres opcional (ex: 'conversation_id=eq.123')
 * @param {string} [options.channelName] - Nome customizado do canal (opcional)
 * @param {Function} [options.onInsert] - Callback para novos registos inseridos
 * @param {Function} [options.onUpdate] - Callback para atualizações
 * @param {Function} [options.onDelete] - Callback para eliminações
 * @param {Function} [options.onChange] - Callback genérico para qualquer mudança
 * @param {Function} [options.onStatusChange] - Callback para status da conexão ('SUBSCRIBED', 'TIMED_OUT', etc.)
 * 
 * @returns {Object} { unsubscribe: Function, channel: Object }
 */
export function subscribeToTable({
  table,
  schema = 'public',
  event = '*',
  filter = null,
  channelName = null,
  onInsert = null,
  onUpdate = null,
  onDelete = null,
  onChange = null,
  onStatusChange = null
}) {
  if (!table || !supabase) {
    return { unsubscribe: () => {}, channel: null };
  }

  // Gera um nome único para o canal
  const topic = channelName || `realtime_${table}_${filter ? filter.replace(/[^a-zA-Z0-9]/g, '_') : 'all'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const config = {
    event,
    schema,
    table
  };

  if (filter) {
    config.filter = filter;
  }

  try {
    const channel = supabase.channel(topic);

    channel.on(
      'postgres_changes',
      config,
      (payload) => {
        try {
          if (onChange) onChange(payload);
          if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new, payload);
          if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old, payload);
          if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old, payload);
        } catch (handlerErr) {
          console.warn(`[Realtime ${table}] Erro no processamento do evento:`, handlerErr);
        }
      }
    );

    channel.subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status, err);
      }
      if (err) {
        console.warn(`[Realtime ${table}] Aviso na conexão:`, err);
      }
    });

    activeChannels.set(topic, channel);

    const unsubscribe = () => {
      try {
        if (activeChannels.has(topic)) {
          activeChannels.delete(topic);
          supabase.removeChannel(channel);
        }
      } catch (_) {}
    };

    return { unsubscribe, channel, topic };
  } catch (err) {
    console.warn(`[Realtime ${table}] Falha ao inicializar subscrição:`, err);
    return { unsubscribe: () => {}, channel: null };
  }
}

/**
 * Escuta em tempo real novos registos de Auditoria
 */
export function subscribeToAuditLogs(onNewLog) {
  return subscribeToTable({
    table: 'academy_audit_logs',
    event: 'INSERT',
    onInsert: onNewLog
  });
}

/**
 * Escuta em tempo real mudanças na gestão de Pagamentos e Propinas
 */
export function subscribeToPayments(onPaymentChange, studentId = null) {
  const filter = studentId ? `student_id=eq.${studentId}` : null;
  return subscribeToTable({
    table: 'academy_payments',
    event: '*',
    filter,
    onChange: onPaymentChange
  });
}

/**
 * Escuta em tempo real novas mensagens de Chat na conversa ativa
 */
export function subscribeToChatMessages(conversationId, onNewMessage) {
  if (!conversationId) return { unsubscribe: () => {} };
  return subscribeToTable({
    table: 'academy_chat_messages',
    event: 'INSERT',
    filter: `conversation_id=eq.${conversationId}`,
    onInsert: onNewMessage
  });
}

/**
 * Escuta em tempo real notificações direcionadas a um utilizador
 */
export function subscribeToNotifications(userId, onNotification) {
  if (!userId) return { unsubscribe: () => {} };
  return subscribeToTable({
    table: 'academy_notifications',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`,
    onInsert: onNotification
  });
}

/**
 * Escuta em tempo real atualizações de presença de utilizadores online
 */
export function subscribeToPresence(onPresenceChange) {
  return subscribeToTable({
    table: 'academy_user_presence',
    event: '*',
    onChange: onPresenceChange
  });
}

/**
 * Escuta em tempo real novas mensagens de contacto do site público
 */
export function subscribeToContactMessages(onContactChange) {
  return subscribeToTable({
    table: 'academy_contact_messages',
    event: '*',
    onChange: onContactChange
  });
}

/**
 * Remove todos os canais ativos (útil em logout ou desmontagem global)
 */
export function unsubscribeAllRealtime() {
  activeChannels.forEach((channel) => {
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  });
  activeChannels.clear();
}

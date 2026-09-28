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

let systemBroadcastChannel = null;

function getSystemBroadcastChannel() {
  if (!systemBroadcastChannel) {
    systemBroadcastChannel = supabase.channel('academy_system_broadcasts');
    systemBroadcastChannel.subscribe();
  }
  return systemBroadcastChannel;
}

/**
 * Notifica em tempo real sobre atualizações de curso realizadas por estudantes
 */
export function broadcastCourseUpdate(data) {
  try {
    const ch = getSystemBroadcastChannel();
    ch.send({
      type: 'broadcast',
      event: 'student_course_updated',
      payload: data
    });
  } catch (err) {
    console.warn('[Realtime] Falha no broadcast de atualização de curso:', err);
  }

  // Notificação local imediata para mesma janela/sessão
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaty_course_update', { detail: data }));
  }
}

/**
 * Escuta em tempo real atualizações de curso de estudantes
 */
export function subscribeToCourseUpdates(onCourseUpdate) {
  const ch = getSystemBroadcastChannel();
  
  const handleBroadcast = (payload) => {
    try {
      if (onCourseUpdate && payload?.payload) onCourseUpdate(payload.payload);
    } catch (e) {
      console.warn('[Realtime] Erro ao processar broadcast de curso:', e);
    }
  };

  ch.on('broadcast', { event: 'student_course_updated' }, handleBroadcast);

  const localListener = (e) => {
    if (onCourseUpdate && e?.detail) onCourseUpdate(e.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('zaty_course_update', localListener);
  }

  // Escuta complementar via Postgres changes na tabela de auditoria
  const auditSub = subscribeToTable({
    table: 'academy_audit_logs',
    event: 'INSERT',
    onInsert: (newLog) => {
      if (newLog.action === 'STUDENT_COURSE_UPDATED' || newLog.action === 'COURSE_UPDATE_REQUESTED' || newLog.resource_type === 'course_update') {
        if (onCourseUpdate) onCourseUpdate(newLog.details || newLog);
      }
    }
  });

  return {
    unsubscribe: () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('zaty_course_update', localListener);
        }
        if (auditSub?.unsubscribe) auditSub.unsubscribe();
      } catch (_) {}
    }
  };
}

/**
 * Transmite em tempo real alterações nos requerimentos de certificados
 */
export function broadcastCertificateRequest(data) {
  try {
    const ch = getSystemBroadcastChannel();
    ch.send({
      type: 'broadcast',
      event: 'certificate_request_event',
      payload: data
    });
  } catch (err) {
    console.warn('[Realtime] Falha no broadcast de requerimento de certificado:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaty_certificate_request', { detail: data }));
  }
}

/**
 * Escuta em tempo real alterações nos requerimentos de certificados
 */
export function subscribeToCertificateRequests(onCertRequest) {
  const ch = getSystemBroadcastChannel();

  const handleBroadcast = (payload) => {
    try {
      if (onCertRequest && payload?.payload) onCertRequest(payload.payload);
    } catch (e) {
      console.warn('[Realtime] Erro ao processar broadcast de certificado:', e);
    }
  };

  ch.on('broadcast', { event: 'certificate_request_event' }, handleBroadcast);

  const localListener = (e) => {
    if (onCertRequest && e?.detail) onCertRequest(e.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('zaty_certificate_request', localListener);
  }

  return {
    unsubscribe: () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('zaty_certificate_request', localListener);
        }
      } catch (_) {}
    }
  };
}

/**
 * Transmite notificações em tempo real para o sino e painéis
 */
export function broadcastNotificationEvent(data) {
  try {
    const ch = getSystemBroadcastChannel();
    ch.send({
      type: 'broadcast',
      event: 'system_notification',
      payload: data
    });
  } catch (err) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaty_new_notification', { detail: data }));
  }
}

/**
 * Escuta notificações globais em tempo real para o sino
 */
export function subscribeToGlobalNotifications(onNotification) {
  const ch = getSystemBroadcastChannel();

  const handleBroadcast = (payload) => {
    try {
      if (onNotification && payload?.payload) onNotification(payload.payload);
    } catch (e) {}
  };

  ch.on('broadcast', { event: 'system_notification' }, handleBroadcast);

  const localListener = (e) => {
    if (onNotification && e?.detail) onNotification(e.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('zaty_new_notification', localListener);
  }

  // Também escuta na tabela academy_notifications
  const notifSub = subscribeToTable({
    table: 'academy_notifications',
    event: 'INSERT',
    onInsert: (newNotif) => {
      if (onNotification) onNotification(newNotif);
    }
  });

  return {
    unsubscribe: () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('zaty_new_notification', localListener);
        }
        if (notifSub?.unsubscribe) notifSub.unsubscribe();
      } catch (_) {}
    }
  };
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

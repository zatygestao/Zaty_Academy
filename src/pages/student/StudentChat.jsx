import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { 
  checkChatGuidelinesAccepted, 
  acceptChatGuidelines, 
  checkChatBlocked, 
  submitChatAppeal, 
  getOrCreateSupportConversation, 
  getChatMessages, 
  sendChatMessage,
  getStudentAcademicChannels,
  getOrCreateTeacherStudentConversation,
  getOrCreateClassGroupConversation,
  getOrCreateStudentPeerConversation,
  getUserContactMessages,
  studentReplyToContactMessage
} from '../../services/api';
import { subscribeToChatMessages } from '../../services/realtimeService';
import { formatDateTime } from '../../utils/formatters';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  RefreshCw, 
  CheckCircle2, 
  Headphones, 
  Clock,
  GraduationCap,
  User,
  ChevronRight,
  FileText,
  Mail,
  MessageCircle,
  Copy,
  AlertCircle
} from 'lucide-react';

export default function StudentChat() {
  const { user, profile, student } = useAuth();
  const studentId = student?.id;
  const userId = user?.id;
  const studentName = student?.full_name || profile?.full_name || 'Estudante';

  // Estados de Controle de Acesso
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Termo de Conduta Modal
  const [agreedGuidelines, setAgreedGuidelines] = useState(false);
  const [acceptingGuidelines, setAcceptingGuidelines] = useState(false);

  // Recurso de Desbloqueio
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  // Canais: 'support' (Suporte Oficial) | 'teachers' (Formadores) | 'community' (Minha Turma & Colegas)
  const [activeTab, setActiveTab] = useState('support');

  // Sub-visão do Suporte: 'chat' (Chat em tempo real) | 'tickets' (Minhas Mensagens do Site)
  const [supportSubView, setSupportSubView] = useState('chat');
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [sendingTicketReply, setSendingTicketReply] = useState(false);
  const activeTicket = userTickets.find(t => t.id === selectedTicketId) || (userTickets.length > 0 ? userTickets[0] : null);

  // Dados Académicos
  const [channelsData, setChannelsData] = useState({ classes: [], teachers: [], classmates: [] });
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Conversa Ativa e Mensagens
  const [activeConversation, setActiveConversation] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null); // { type, data }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar mensagens do site/tickets do estudante autenticado
  const loadUserTickets = async () => {
    if (!studentId && !userId && !user?.email) return;
    setLoadingTickets(true);
    try {
      const tickets = await getUserContactMessages({
        studentId,
        userId,
        userEmail: student?.email || user?.email
      });
      setUserTickets(tickets || []);
      if (tickets && tickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(tickets[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens do site do estudante:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Enviar resposta do estudante a um ticket de contacto
  const handleSendTicketReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicketId || sendingTicketReply) return;
    setSendingTicketReply(true);
    try {
      await studentReplyToContactMessage({
        contactId: selectedTicketId,
        studentId,
        studentName,
        userId,
        message: ticketReplyText.trim()
      });
      setTicketReplyText('');
      await loadUserTickets();
      if (activeConversation?.id) {
        const msgs = await getChatMessages(activeConversation.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      alert(err.message || 'Erro ao enviar resposta ao ticket.');
    } finally {
      setSendingTicketReply(false);
    }
  };

  // 1. Verificar Acesso (Diretrizes e Bloqueio)
  const checkAccessAndInit = async () => {
    if (!userId || !studentId) return;
    setCheckingAccess(true);
    try {
      const [accepted, block] = await Promise.all([
        checkChatGuidelinesAccepted(userId),
        checkChatBlocked(studentId, userId)
      ]);

      setGuidelinesAccepted(accepted);
      if (block) {
        setIsBlocked(true);
        setBlockInfo(block);
      } else {
        setIsBlocked(false);
        setBlockInfo(null);
      }

      if (accepted && !block) {
        await Promise.all([
          initSupportChat(),
          loadAcademicChannels(),
          loadUserTickets()
        ]);
      }
    } catch (err) {
      console.error('Erro ao verificar acesso ao chat:', err);
    } finally {
      setCheckingAccess(false);
    }
  };

  // Carregar dados de turmas, formadores e colegas permitidos
  const loadAcademicChannels = async () => {
    if (!studentId) return;
    setLoadingChannels(true);
    try {
      const data = await getStudentAcademicChannels(studentId);
      setChannelsData(data || { classes: [], teachers: [], classmates: [] });
    } catch (err) {
      console.error('Erro ao carregar canais académicos:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Iniciar Conversa de Suporte (padrão)
  const initSupportChat = async () => {
    setLoadingChat(true);
    try {
      const conv = await getOrCreateSupportConversation(studentId, studentName);
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'support',
        title: 'Equipa de Suporte Institucional',
        subtitle: 'Atendimento Oficial • Zaty Academy',
        roleBadge: 'Suporte Zaty'
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Erro ao inicializar chat de suporte:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Selecionar um Formador
  const handleSelectTeacher = async (teacher) => {
    setLoadingChat(true);
    const teacherDisplayName = teacher.name || teacher.full_name || 'Formador';
    try {
      const conv = await getOrCreateTeacherStudentConversation({
        studentId,
        teacherId: teacher.id,
        studentName,
        teacherName: teacherDisplayName
      });
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'teacher',
        title: `Formador ${teacherDisplayName}`,
        subtitle: teacher.specialty || 'Corpo Docente Zaty Academy',
        roleBadge: 'Docente',
        data: teacher
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Erro ao abrir conversa com formador:', err);
      alert('Falha ao conectar ao formador.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Selecionar Sala Coletiva da Turma
  const handleSelectClassGroup = async (cls) => {
    setLoadingChat(true);
    try {
      const conv = await getOrCreateClassGroupConversation({
        classId: cls.id,
        className: cls.name,
        teacherId: cls.teacher_id
      });
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'class_group',
        title: `Sala da Turma: ${cls.name}`,
        subtitle: `${cls.courseTitle || 'Curso'} • Comunidade de Aprendizagem`,
        roleBadge: 'Turma Coletiva',
        data: cls
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Erro ao abrir sala da turma:', err);
      alert('Falha ao aceder à sala da turma.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Selecionar Colega de Turma (1 a 1)
  const handleSelectClassmate = async (classmate) => {
    setLoadingChat(true);
    try {
      const conv = await getOrCreateStudentPeerConversation({
        studentId,
        peerStudentId: classmate.id,
        classId: classmate.sharedClassId,
        studentName,
        peerName: classmate.full_name
      });
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'classmate',
        title: classmate.full_name,
        subtitle: `${classmate.student_code || 'Colega'} • ${classmate.sharedCourseTitle || 'Colega de Turma'}`,
        roleBadge: 'Colega de Turma',
        data: classmate
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Erro ao abrir conversa com colega:', err);
      alert('Falha ao conectar com o colega.');
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    checkAccessAndInit();
  }, [userId, studentId]);

  // Sincronização em Tempo Real (WebSockets) com fallback periódico
  useEffect(() => {
    if (!activeConversation?.id || isBlocked || !guidelinesAccepted) return;

    // Subscrição instantânea via Supabase Realtime
    const sub = subscribeToChatMessages(activeConversation.id, (newMsg) => {
      if (!newMsg) return;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0)) < 3000))) {
          return prev;
        }
        return [...prev, newMsg];
      });
    });

    // Fallback de segurança espaçado (15s) para resiliência contra oscilações de rede
    const interval = setInterval(async () => {
      try {
        const msgs = await getChatMessages(activeConversation.id);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      } catch (_) {}
    }, 15000);

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
      clearInterval(interval);
    };
  }, [activeConversation?.id, isBlocked, guidelinesAccepted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAcceptGuidelines = async () => {
    if (!agreedGuidelines) return;
    setAcceptingGuidelines(true);
    try {
      await acceptChatGuidelines(userId, studentId);
      setGuidelinesAccepted(true);
      await Promise.all([initSupportChat(), loadAcademicChannels()]);
    } catch (err) {
      alert(`Falha ao registar aceite: ${err.message}`);
    } finally {
      setAcceptingGuidelines(false);
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealText.trim() || !blockInfo?.id) return;
    setSubmittingAppeal(true);
    try {
      await submitChatAppeal(blockInfo.id, appealText);
      setAppealSuccess(true);
      setBlockInfo({ ...blockInfo, status: 'em_analise', appeal_text: appealText });
    } catch (err) {
      alert(`Falha ao submeter recurso: ${err.message}`);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeConversation?.id || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sent = await sendChatMessage({
        conversationId: activeConversation.id,
        senderId: userId,
        senderRole: 'estudante',
        senderName: studentName,
        content
      });

      if (sent) {
        setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent]));
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StudentSidebar />
        <main style={{ flex: 1, marginLeft: '240px', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#00C7FD' }} />
            <p>A carregar ambiente de comunicação académica...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* MODAL BLOQUEANTE DE DIRETRIZES INSTITUCIONAIS */}
        {!guidelinesAccepted && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 15, 30, 0.94)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '640px', width: '100%', padding: '2.25rem', border: '1px solid rgba(0, 199, 253, 0.45)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', border: '1px solid #00C7FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Diretrizes de Convivência e Uso do Chat
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Comunidade Zaty Academy</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 30, 60, 0.6)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '8px', padding: '1.15rem', marginBottom: '1.5rem', maxHeight: '280px', overflowY: 'auto', fontSize: '0.875rem', lineHeight: 1.6, color: '#E2E8F0' }}>
                <p style={{ marginTop: 0 }}>
                  Bem-vindo ao espaço de comunicação da <strong>Zaty Academy</strong>. Para manter um ambiente seguro, produtivo e estritamente profissional, todos os participantes devem respeitar as seguintes normas:
                </p>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <li><strong>Respeito e Urbanidade:</strong> É expressamente proibido qualquer tipo de conduta ofensiva, assédio, discriminação ou uso de linguagem inadequada contra colegas ou formadores.</li>
                  <li><strong>Finalidade Estritamente Académica:</strong> O chat destina-se ao esclarecimento de dúvidas sobre cursos, trabalhos e suporte institucional.</li>
                  <li><strong>Proibição de Conteúdo Não Autorizado:</strong> Proibida a divulgação de publicidade, vendas, spam, correntes ou partilha de materiais que violem direitos de autor.</li>
                  <li><strong>Monitorização e Penalidades:</strong> As mensagens são auditadas pelo sistema. A violação das regras resultará em bloqueio imediato do chat e eventual processo disciplinar.</li>
                </ol>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: '#FFFFFF' }}>
                  <input
                    type="checkbox"
                    checked={agreedGuidelines}
                    onChange={e => setAgreedGuidelines(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#00C7FD' }}
                  />
                  <span>
                    Li, compreendi e aceito integralmente os termos de conduta e as diretrizes de convivência do Chat da Zaty Academy.
                  </span>
                </label>
              </div>

              <button
                onClick={handleAcceptGuidelines}
                disabled={!agreedGuidelines || acceptingGuidelines}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
              >
                {acceptingGuidelines ? 'A registar aceite...' : 'Aceitar Diretrizes e Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* TELA DE SUSPENSÃO / BLOQUEIO DE CHAT COM FORMULÁRIO DE RECURSO */}
        {guidelinesAccepted && isBlocked ? (
          <div className="glass-card" style={{ maxWidth: '680px', margin: '2rem auto', padding: '2.5rem', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', margin: '0 auto 1.25rem' }}>
              <ShieldAlert size={28} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Acesso ao Chat Temporariamente Suspenso
            </h2>

            <p style={{ color: '#94A3B8', fontSize: '0.885rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              O seu acesso às salas de chat foi suspenso devido a uma notificação de incumprimento das diretrizes da comunidade.
            </p>

            <div style={{ background: 'rgba(0, 20, 40, 0.6)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#FCA5A5', fontWeight: '700', marginBottom: '0.35rem' }}>
                Motivo Registado:
              </div>
              <div style={{ color: '#E2E8F0' }}>
                {blockInfo?.reason || 'Violação das normas de convivência da Zaty Academy.'}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Data do bloqueio: {formatDateTime(blockInfo?.blocked_at)} • Estado: <strong style={{ color: '#F59E0B' }}>{blockInfo?.status === 'em_analise' ? 'Recurso Sob Análise' : 'Suspenso'}</strong>
              </div>
            </div>

            {blockInfo?.status === 'em_analise' || appealSuccess ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '1.25rem', color: '#A7F3D0', fontSize: '0.875rem' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem', color: '#10B981' }} />
                <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: '0.25rem' }}>O seu recurso foi submetido com sucesso.</strong>
                A direção académica e equipa de suporte estão a rever o seu processo. Receberá atualizações assim que a deliberação for concluída.
              </div>
            ) : (
              <form onSubmit={handleSubmitAppeal} style={{ textAlign: 'left' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Apresentar Justificativa / Pedido de Desbloqueio *</label>
                  <textarea
                    rows={4}
                    value={appealText}
                    onChange={e => setAppealText(e.target.value)}
                    required
                    placeholder="Escreva a sua explicação e compromisso com as regras para análise da administração..."
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAppeal || !appealText.trim()}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  {submittingAppeal ? 'A submeter recurso...' : 'Submeter Recurso à Administração'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* AMBIENTE DE CHAT ATIVO */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 260px' }}>
                <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Comunicação & Chat Académico
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
                  Canal seguro e direto para suporte institucional, contacto com formadores e interação com colegas de turma.
                </p>
              </div>

              {/* Botões de Seleção de Canal / Aba */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'rgba(0, 30, 60, 0.7)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.25)', width: '100%', maxWidth: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('support');
                    initSupportChat();
                  }}
                  className={activeTab === 'support' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', flex: '1 1 auto', justifyContent: 'center' }}
                >
                  <Headphones size={15} />
                  Suporte Zaty
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('teachers');
                    if (channelsData.teachers.length > 0) {
                      handleSelectTeacher(channelsData.teachers[0]);
                    }
                  }}
                  className={activeTab === 'teachers' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', flex: '1 1 auto', justifyContent: 'center' }}
                >
                  <GraduationCap size={15} />
                  Meus Formadores {channelsData.teachers.length > 0 && `(${channelsData.teachers.length})`}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('community');
                    if (channelsData.classes.length > 0) {
                      handleSelectClassGroup(channelsData.classes[0]);
                    } else if (channelsData.classmates.length > 0) {
                      handleSelectClassmate(channelsData.classmates[0]);
                    }
                  }}
                  className={activeTab === 'community' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', flex: '1 1 auto', justifyContent: 'center' }}
                >
                  <Users size={15} />
                  Turma & Colegas {channelsData.classmates.length > 0 && `(${channelsData.classmates.length})`}
                </button>
              </div>
            </div>

            {/* Painel do Chat Dividido em 2 Colunas */}
            <div className="chat-layout-wrapper">
              {/* Coluna Esquerda: Lista de Contactos / Conversas do Canal */}
              <div className="chat-sidebar">
                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeTab === 'support' && 'Linha Institucional'}
                  {activeTab === 'teachers' && 'Corpo Docente Atribuído'}
                  {activeTab === 'community' && 'Salas e Colegas'}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {/* Aba Suporte */}
                  {activeTab === 'support' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Sub-selector entre Chat Direto e Minhas Mensagens do Site */}
                      <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0, 20, 40, 0.6)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSupportSubView('chat');
                            initSupportChat();
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.4rem',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: supportSubView === 'chat' ? '#0071C5' : 'transparent',
                            color: supportSubView === 'chat' ? '#FFFFFF' : '#94A3B8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Headphones size={13} />
                          <span>Chat Direto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSupportSubView('tickets');
                            loadUserTickets();
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.4rem',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: supportSubView === 'tickets' ? '#0071C5' : 'transparent',
                            color: supportSubView === 'tickets' ? '#FFFFFF' : '#94A3B8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <FileText size={13} />
                          <span>Tickets ({userTickets.length})</span>
                        </button>
                      </div>

                      {/* Lista de Canais / Itens de Suporte */}
                      {supportSubView === 'chat' ? (
                        <div
                          onClick={() => {
                            setSupportSubView('chat');
                            initSupportChat();
                          }}
                          style={{
                            padding: '0.75rem 0.85rem',
                            borderRadius: '6px',
                            background: 'rgba(0, 163, 224, 0.18)',
                            border: '1px solid rgba(0, 199, 253, 0.45)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                            <Headphones size={18} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Equipa de Apoio Zaty
                            </div>
                            <div style={{ color: '#10B981', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                              Atendimento Online
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.3rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Minhas Mensagens</span>
                            <button
                              type="button"
                              onClick={loadUserTickets}
                              style={{ background: 'none', border: 'none', color: '#00C7FD', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}
                            >
                              <RefreshCw size={11} className={loadingTickets ? 'animate-spin' : ''} />
                              Atualizar
                            </button>
                          </div>

                          {loadingTickets ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                              <RefreshCw size={14} className="animate-spin" style={{ margin: '0 auto 0.4rem', color: '#00C7FD' }} />
                              A carregar mensagens...
                            </div>
                          ) : userTickets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#94A3B8', fontSize: '0.78rem', background: 'rgba(0, 20, 40, 0.3)', borderRadius: '6px', border: '1px dashed rgba(0, 163, 224, 0.2)' }}>
                              Nenhuma mensagem do site registada para o seu utilizador.
                            </div>
                          ) : (
                            userTickets.map(ticket => {
                              const isSelected = selectedTicketId === ticket.id;
                              const repliesCount = Array.isArray(ticket.replies) ? ticket.replies.length : 0;
                              return (
                                <div
                                  key={ticket.id}
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                  style={{
                                    padding: '0.65rem 0.75rem',
                                    borderRadius: '6px',
                                    background: isSelected ? 'rgba(0, 163, 224, 0.22)' : 'rgba(0, 25, 50, 0.5)',
                                    border: isSelected ? '1px solid rgba(0, 199, 253, 0.55)' : '1px solid rgba(0, 163, 224, 0.15)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.3rem',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                      fontSize: '0.66rem',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontWeight: '700',
                                      background: ticket.status === 'respondido' ? 'rgba(16, 185, 129, 0.2)' : ticket.status === 'em_atendimento' ? 'rgba(0, 199, 253, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                      color: ticket.status === 'respondido' ? '#34D399' : ticket.status === 'em_atendimento' ? '#38BDF8' : '#FCD34D',
                                      border: ticket.status === 'respondido' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 163, 224, 0.3)'
                                    }}>
                                      {ticket.status === 'respondido' ? 'Respondido' : ticket.status === 'em_atendimento' ? 'Em Atendimento' : 'Pendente'}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                      {formatDateTime(ticket.created_at).split(' ')[0]}
                                    </span>
                                  </div>
                                  <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {ticket.subject || 'Atendimento Geral'}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#94A3B8' }}>
                                    <span>#{ticket.id.substring(0, 8)}</span>
                                    {repliesCount > 0 && (
                                      <span style={{ color: '#00C7FD', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <MessageCircle size={10} />
                                        {repliesCount} {repliesCount === 1 ? 'resp.' : 'resps.'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aba Formadores */}
                  {activeTab === 'teachers' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {loadingChannels ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#00C7FD' }} />
                          A carregar formadores...
                        </div>
                      ) : channelsData.teachers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                          <GraduationCap size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                          Nenhum formador atribuído no momento.
                        </div>
                      ) : (
                        channelsData.teachers.map(t => {
                          const tName = t.name || t.full_name || 'Formador';
                          const isSelected = selectedTarget?.data?.id === t.id && selectedTarget?.type === 'teacher';
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleSelectTeacher(t)}
                              style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                background: isSelected ? 'rgba(0, 163, 224, 0.2)' : 'rgba(0, 30, 60, 0.4)',
                                border: isSelected ? '1px solid rgba(0, 199, 253, 0.5)' : '1px solid rgba(0, 163, 224, 0.15)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <UserAvatar
                                photoUrl={t.photo_url}
                                name={tName}
                                size={36}
                                role="formador"
                                borderRadius="8px"
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tName}
                                </div>
                                <div style={{ color: '#F59E0B', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.specialty || 'Docente'}
                                </div>
                              </div>
                              <ChevronRight size={14} color={isSelected ? '#00C7FD' : '#64748B'} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Aba Comunidade / Turma & Colegas */}
                  {activeTab === 'community' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {loadingChannels ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#00C7FD' }} />
                          A carregar ambiente da turma...
                        </div>
                      ) : (
                        <>
                          {/* Salas Coletivas de Turma */}
                          {channelsData.classes.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem', paddingLeft: '0.35rem' }}>
                                Salas de Turma
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {channelsData.classes.map(cls => {
                                  const isSelected = selectedTarget?.data?.id === cls.id && selectedTarget?.type === 'class_group';
                                  return (
                                    <div
                                      key={cls.id}
                                      onClick={() => handleSelectClassGroup(cls)}
                                      style={{
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '6px',
                                        background: isSelected ? 'rgba(0, 163, 224, 0.2)' : 'rgba(0, 30, 60, 0.4)',
                                        border: isSelected ? '1px solid rgba(0, 199, 253, 0.5)' : '1px solid rgba(0, 163, 224, 0.15)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem'
                                      }}
                                    >
                                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                                        <Users size={16} />
                                      </div>
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {cls.name}
                                        </div>
                                        <div style={{ color: '#10B981', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          Sala Coletiva
                                        </div>
                                      </div>
                                      <ChevronRight size={14} color={isSelected ? '#00C7FD' : '#64748B'} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Colegas de Turma */}
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem', paddingLeft: '0.35rem' }}>
                              Colegas Matriculados ({channelsData.classmates.length})
                            </div>
                            {channelsData.classmates.length === 0 ? (
                              <div style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.75rem', textAlign: 'center' }}>
                                Nenhum outro colega matriculado no mesmo curso/turma até o momento.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {channelsData.classmates.map(cm => {
                                  const isSelected = selectedTarget?.data?.id === cm.id && selectedTarget?.type === 'classmate';
                                  return (
                                    <div
                                      key={cm.id}
                                      onClick={() => handleSelectClassmate(cm)}
                                      style={{
                                        padding: '0.6rem 0.85rem',
                                        borderRadius: '6px',
                                        background: isSelected ? 'rgba(0, 163, 224, 0.2)' : 'rgba(0, 30, 60, 0.4)',
                                        border: isSelected ? '1px solid rgba(0, 199, 253, 0.5)' : '1px solid rgba(0, 163, 224, 0.15)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem'
                                      }}
                                    >
                                      <UserAvatar
                                        photoUrl={cm.photo_url}
                                        name={cm.full_name}
                                        size={32}
                                        role="estudante"
                                      />
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {cm.full_name}
                                        </div>
                                        <div style={{ color: '#00C7FD', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {cm.sharedCourseTitle || cm.student_code}
                                        </div>
                                      </div>
                                      <ChevronRight size={14} color={isSelected ? '#00C7FD' : '#64748B'} />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Área de Chat e Mensagens OU Detalhe de Mensagens do Site */}
              <div className="chat-main-area">
                {activeTab === 'support' && supportSubView === 'tickets' ? (
                  /* VISTA DE TICKETS / MENSAGENS DO SITE DO ESTUDANTE */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                    {/* Barra Superior do Ticket */}
                    <div style={{
                      padding: '0.75rem 1.25rem',
                      borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 25, 50, 0.75)',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '0.985rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                              {activeTicket ? activeTicket.subject : 'Minhas Mensagens do Site'}
                            </h3>
                            {activeTicket && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '999px',
                                background: activeTicket.status === 'respondido' ? 'rgba(16, 185, 129, 0.2)' : activeTicket.status === 'em_atendimento' ? 'rgba(0, 199, 253, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: activeTicket.status === 'respondido' ? '#34D399' : activeTicket.status === 'em_atendimento' ? '#38BDF8' : '#FCD34D',
                                border: activeTicket.status === 'respondido' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 163, 224, 0.3)',
                                fontWeight: '700'
                              }}>
                                {activeTicket.status === 'respondido' ? 'Respondido' : activeTicket.status === 'em_atendimento' ? 'Em Atendimento' : 'Pendente'}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {activeTicket ? `Ticket #${activeTicket.id.substring(0, 8)} • Enviado em ${formatDateTime(activeTicket.created_at)}` : 'Histórico institucional de atendimento'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={loadUserTickets}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <RefreshCw size={13} className={loadingTickets ? 'animate-spin' : ''} />
                        <span>Atualizar</span>
                      </button>
                    </div>

                    {/* Conteúdo do Ticket: Mensagem Original + Respostas */}
                    <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {!activeTicket ? (
                        <div style={{ textAlign: 'center', margin: 'auto', color: '#94A3B8', maxWidth: '400px' }}>
                          <FileText size={38} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: '#00C7FD' }} />
                          <p style={{ color: '#FFFFFF', fontWeight: '700', marginBottom: '0.25rem' }}>
                            Nenhuma Mensagem Selecionada
                          </p>
                          <p style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
                            Selecione uma mensagem na lista à esquerda ou utilize o Chat Direto para atendimento imediato.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Mensagem Original Enviada pelo Aluno */}
                          <div style={{
                            background: 'rgba(0, 30, 60, 0.6)',
                            border: '1px solid rgba(0, 163, 224, 0.3)',
                            borderRadius: '8px',
                            padding: '1.15rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <strong style={{ color: '#00C7FD', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <User size={14} /> Minha Mensagem Inicial
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                {formatDateTime(activeTicket.created_at)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#FFFFFF', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                              {activeTicket.message}
                            </div>
                          </div>

                          {/* Histórico Cronológico de Respostas */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Histórico de Respostas ({Array.isArray(activeTicket.replies) ? activeTicket.replies.length : 0})
                            </div>

                            {(!activeTicket.replies || activeTicket.replies.length === 0) ? (
                              <div style={{
                                padding: '1.25rem',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px dashed rgba(245, 158, 11, 0.35)',
                                color: '#FCD34D',
                                fontSize: '0.825rem',
                                textAlign: 'center'
                              }}>
                                <Clock size={20} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                                A sua mensagem está a ser analisada pela Direção. Assim que um administrador responder, a resposta aparecerá aqui e receberá uma notificação.
                              </div>
                            ) : (
                              activeTicket.replies.map((reply, idx) => {
                                const isAdmin = reply.sender_role === 'admin' || reply.sender_role === 'suporte';
                                return (
                                  <div
                                    key={reply.id || idx}
                                    style={{
                                      background: isAdmin ? 'rgba(0, 35, 70, 0.85)' : 'rgba(0, 25, 50, 0.6)',
                                      border: isAdmin ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(0, 163, 224, 0.2)',
                                      borderRadius: '8px',
                                      padding: '1rem 1.15rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isAdmin ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #0072CE, #00C7FD)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '800', fontSize: '0.7rem' }}>
                                          {(reply.sender_name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <strong style={{ fontSize: '0.825rem', color: isAdmin ? '#34D399' : '#00C7FD' }}>
                                          {reply.sender_name || (isAdmin ? 'Administração Zaty Academy' : 'Eu')}
                                        </strong>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        {reply.channel && (
                                          <span style={{
                                            fontSize: '0.65rem',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '4px',
                                            background: reply.channel === 'email' ? 'rgba(0, 163, 224, 0.2)' : reply.channel === 'whatsapp' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                            color: reply.channel === 'email' ? '#38BDF8' : reply.channel === 'whatsapp' ? '#4ADE80' : '#93C5FD',
                                            fontWeight: '700'
                                          }}>
                                            {reply.channel === 'email' ? 'E-mail' : reply.channel === 'whatsapp' ? 'WhatsApp' : 'Sistema'}
                                          </span>
                                        )}
                                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                          {formatDateTime(reply.sent_at)}
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ color: '#F1F5F9', fontSize: '0.885rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                      {reply.message}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Compositor de Resposta ao Ticket */}
                    {activeTicket && (
                      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(0, 163, 224, 0.25)', background: 'rgba(0, 20, 40, 0.85)' }}>
                        <form onSubmit={handleSendTicketReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <textarea
                            rows={3}
                            value={ticketReplyText}
                            onChange={e => setTicketReplyText(e.target.value)}
                            placeholder="Escreva uma resposta ou esclarecimento adicional sobre este assunto..."
                            disabled={sendingTicketReply}
                            className="form-input"
                            style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: '8px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="submit"
                              disabled={sendingTicketReply || !ticketReplyText.trim()}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Send size={14} className={sendingTicketReply ? 'animate-spin' : ''} />
                              <span>{sendingTicketReply ? 'A Enviar...' : 'Enviar Réplica'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Barra Superior da Conversa */}
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 25, 50, 0.75)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {selectedTarget?.type === 'teacher' ? (
                      <UserAvatar
                        photoUrl={selectedTarget.data?.photo_url}
                        name={selectedTarget.title}
                        size={40}
                        role="formador"
                        borderRadius="8px"
                      />
                    ) : selectedTarget?.type === 'classmate' ? (
                      <UserAvatar
                        photoUrl={selectedTarget.data?.photo_url}
                        name={selectedTarget.title}
                        size={40}
                        role="estudante"
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: selectedTarget?.type === 'class_group' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '800', flexShrink: 0 }}>
                        {selectedTarget?.type === 'support' && <Headphones size={20} />}
                        {selectedTarget?.type === 'class_group' && <Users size={20} />}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.985rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                          {selectedTarget?.title || 'Canal de Comunicação'}
                        </h3>
                        {selectedTarget?.roleBadge && (
                          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.3)' }}>
                            {selectedTarget.roleBadge}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {selectedTarget?.subtitle || 'Conversa criptografada e monitorada pelo regulamento'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {loadingChat ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00C7FD' }}>
                        <RefreshCw size={12} className="animate-spin" /> A sincronizar...
                      </span>
                    ) : (
                      <span>{messages.length} mensagens</span>
                    )}
                  </div>
                </div>

                {/* Histórico de Mensagens */}
                <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {loadingChat ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#94A3B8' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#00C7FD' }} />
                      <p style={{ fontSize: '0.85rem' }}>A carregar histórico...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#94A3B8', maxWidth: '380px' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: '#00C7FD' }} />
                      <p style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Nenhuma mensagem trocada ainda
                      </p>
                      <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                        Envie uma mensagem abaixo para iniciar o diálogo seguro e profissional neste canal.
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === userId || (msg.sender_role === 'estudante' && msg.sender_name === studentName);
                      const isTeacher = msg.sender_role === 'formador';
                      const isSupport = msg.sender_role === 'suporte' || msg.sender_role === 'admin';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{
                              color: isMe ? '#00C7FD' : isTeacher ? '#F59E0B' : isSupport ? '#10B981' : '#38BDF8'
                            }}>
                              {isMe ? 'Eu' : (msg.sender_name || (isTeacher ? 'Formador' : 'Suporte'))}
                            </strong>
                            <span>•</span>
                            <span>{formatDateTime(msg.created_at)}</span>
                          </div>

                          <div
                            style={{
                              background: isMe 
                                ? 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)' 
                                : isTeacher 
                                  ? 'rgba(245, 158, 11, 0.15)' 
                                  : 'rgba(0, 30, 60, 0.75)',
                              border: isMe 
                                ? '1px solid rgba(0, 199, 253, 0.4)' 
                                : isTeacher 
                                  ? '1px solid rgba(245, 158, 11, 0.4)' 
                                  : '1px solid rgba(0, 163, 224, 0.25)',
                              color: '#FFFFFF',
                              borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                              padding: '0.75rem 1rem',
                              fontSize: '0.885rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Caixa de Entrada de Mensagem */}
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(0, 163, 224, 0.25)', background: 'rgba(0, 20, 40, 0.85)' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={
                        selectedTarget?.type === 'teacher'
                          ? `Escrever dúvida para o ${selectedTarget.title}...`
                          : selectedTarget?.type === 'class_group'
                            ? `Participar na sala coletiva da turma...`
                            : selectedTarget?.type === 'classmate'
                              ? `Conversar com ${selectedTarget.title}...`
                              : "Escreva a sua mensagem para a equipa de suporte..."
                      }
                      disabled={sending || !activeConversation}
                      className="form-input"
                      style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px' }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim() || !activeConversation}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', flexShrink: 0 }}
                    >
                      <Send size={16} />
                      <span>{sending ? 'A enviar...' : 'Enviar'}</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { 
  getTeacherAcademicChannels,
  getOrCreateClassGroupConversation,
  getOrCreateTeacherStudentConversation,
  getChatMessages,
  sendChatMessage
} from '../../services/api';
import { subscribeToChatMessages } from '../../services/realtimeService';
import { formatDateTime } from '../../utils/formatters';
import { 
  MessageSquare, 
  Send, 
  Users, 
  RefreshCw, 
  User, 
  GraduationCap, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function TeacherChat() {
  const { user, profile, teacher } = useAuth();
  const teacherId = teacher?.id;
  const userId = user?.id;
  const teacherName = teacher?.name || teacher?.full_name || profile?.full_name || 'Formador';

  const [loading, setLoading] = useState(true);
  const [channelsData, setChannelsData] = useState({
    classes: [],
    studentConversations: [],
    groupConversations: [],
    enrolledStudents: []
  });

  const [activeConversation, setActiveConversation] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null); // { type, title, subtitle, roleBadge, data }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const data = await getTeacherAcademicChannels(teacherId);
      setChannelsData(data);

      // Se não houver conversa selecionada e houver classes ou conversas, selecionar a primeira
      if (!activeConversation) {
        if (data.classes.length > 0) {
          handleSelectClassGroup(data.classes[0]);
        } else if (data.studentConversations.length > 0) {
          handleSelectConversation(data.studentConversations[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar canais do formador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  // Sincronização em Tempo Real (WebSockets) com fallback periódico
  useEffect(() => {
    if (!activeConversation?.id) return;

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

    // Fallback de segurança espaçado (15s)
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
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Selecionar sala de grupo da turma
  const handleSelectClassGroup = async (cls) => {
    setLoadingChat(true);
    try {
      const conv = await getOrCreateClassGroupConversation({
        classId: cls.id,
        className: cls.name,
        teacherId
      });
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'class_group',
        title: `Sala da Turma: ${cls.name}`,
        subtitle: `${cls.course?.title || 'Curso'} • Discussão Coletiva`,
        roleBadge: 'Sala de Turma',
        data: cls
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Erro ao abrir sala da turma:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Selecionar conversa existente com estudante
  const handleSelectConversation = async (conv) => {
    setLoadingChat(true);
    const sName = conv.student?.full_name || 'Estudante';
    try {
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'student',
        title: sName,
        subtitle: `${conv.student?.student_code || 'Aluno'} • Atendimento Direto`,
        roleBadge: 'Estudante',
        data: conv.student
      });
      const msgs = await getChatMessages(conv.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Erro ao abrir conversa:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Iniciar conversa direta com um aluno matriculado
  const handleStartChatWithStudent = async (stud) => {
    setLoadingChat(true);
    try {
      const conv = await getOrCreateTeacherStudentConversation({
        studentId: stud.id,
        teacherId,
        studentName: stud.full_name,
        teacherName
      });
      setActiveConversation(conv);
      setSelectedTarget({
        type: 'student',
        title: stud.full_name,
        subtitle: `${stud.student_code || 'Aluno'} • Atendimento Direto`,
        roleBadge: 'Estudante',
        data: stud
      });
      if (conv?.id) {
        const msgs = await getChatMessages(conv.id);
        setMessages(msgs || []);
      }
      // Recarregar lista para incluir nova conversa
      await loadData();
    } catch (err) {
      console.error('Erro ao iniciar chat com estudante:', err);
      alert('Falha ao abrir chat com o estudante.');
    } finally {
      setLoadingChat(false);
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
        senderRole: 'formador',
        senderName: teacherName,
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

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Chat & Comunicação Docente
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Atendimento aos estudantes das suas turmas e moderação das salas coletivas de aprendizagem.
            </p>
          </div>
        </div>

        {/* Painel Principal Dividido em 2 Colunas */}
        <div className="chat-layout-wrapper">
          {/* Coluna Esquerda: Salas de Turma e Alunos */}
          <div className="chat-sidebar">
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Turmas & Estudantes
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#00C7FD' }} />
                  A carregar turmas...
                </div>
              ) : (
                <>
                  {/* Seção 1: Salas Coletivas de Turma */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.25rem' }}>
                      Salas das Minhas Turmas ({channelsData.classes.length})
                    </div>

                    {channelsData.classes.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: '#94A3B8', fontSize: '0.75rem', textAlign: 'center' }}>
                        Nenhuma turma vinculada a si ainda.
                      </div>
                    ) : (
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
                                background: isSelected ? 'rgba(0, 163, 224, 0.25)' : 'rgba(0, 30, 60, 0.4)',
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
                                  {cls.course?.title || 'Sala Coletiva'}
                                </div>
                              </div>
                              <ChevronRight size={14} color={isSelected ? '#00C7FD' : '#64748B'} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seção 2: Conversas com Alunos */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.25rem' }}>
                      Atendimento aos Alunos ({channelsData.studentConversations.length})
                    </div>

                    {channelsData.studentConversations.length === 0 && channelsData.enrolledStudents.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: '#94A3B8', fontSize: '0.75rem', textAlign: 'center' }}>
                        Nenhum aluno contactou este canal ainda.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {/* Conversas ativas */}
                        {channelsData.studentConversations.map(conv => {
                          const sName = conv.student?.full_name || 'Estudante';
                          const isSelected = activeConversation?.id === conv.id;
                          return (
                            <div
                              key={conv.id}
                              onClick={() => handleSelectConversation(conv)}
                              style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                background: isSelected ? 'rgba(0, 163, 224, 0.25)' : 'rgba(0, 30, 60, 0.4)',
                                border: isSelected ? '1px solid rgba(0, 199, 253, 0.5)' : '1px solid rgba(0, 163, 224, 0.15)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem'
                              }}
                            >
                              <UserAvatar
                                photoUrl={conv.student?.photo_url}
                                name={sName}
                                size={32}
                                role="estudante"
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {sName}
                                </div>
                                <div style={{ color: '#94A3B8', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {conv.student?.student_code || 'Estudante'}
                                </div>
                              </div>
                              <ChevronRight size={14} color={isSelected ? '#00C7FD' : '#64748B'} />
                            </div>
                          );
                        })}

                        {/* Alunos matriculados que ainda não têm chat aberto */}
                        {channelsData.enrolledStudents
                          .filter(s => !channelsData.studentConversations.some(c => c.student?.id === s.id))
                          .map(s => (
                            <div
                              key={s.id}
                              onClick={() => handleStartChatWithStudent(s)}
                              style={{
                                padding: '0.55rem 0.85rem',
                                borderRadius: '6px',
                                background: 'rgba(0, 20, 40, 0.4)',
                                border: '1px dashed rgba(0, 163, 224, 0.2)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                opacity: 0.85
                              }}
                            >
                              <UserAvatar
                                photoUrl={s.photo_url}
                                name={s.full_name}
                                size={28}
                                role="estudante"
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ color: '#CBD5E1', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {s.full_name}
                                </div>
                                <div style={{ color: '#64748B', fontSize: '0.65rem' }}>
                                  Iniciar Conversa Direta
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Coluna Direita: Área de Chat e Mensagens */}
          <div className="chat-main-area">
            {/* Barra Superior da Conversa */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 25, 50, 0.75)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedTarget?.type === 'class_group' ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '800', flexShrink: 0 }}>
                    <Users size={20} />
                  </div>
                ) : (
                  <UserAvatar
                    photoUrl={selectedTarget?.data?.photo_url}
                    name={selectedTarget?.title || 'Estudante'}
                    size={40}
                    role="estudante"
                  />
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
                    {selectedTarget?.subtitle || 'Comunicação oficial e monitorada pelo regulamento interno'}
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
                    Nenhuma mensagem neste canal ainda
                  </p>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    Envie uma mensagem abaixo para orientar os estudantes ou responder a dúvidas.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === userId || (msg.sender_role === 'formador' && msg.sender_name === teacherName);
                  const isStudent = msg.sender_role === 'estudante';

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
                          color: isMe ? '#F59E0B' : '#00C7FD'
                        }}>
                          {isMe ? 'Eu (Formador)' : (msg.sender_name || 'Estudante')}
                        </strong>
                        <span>•</span>
                        <span>{formatDateTime(msg.created_at)}</span>
                      </div>

                      <div
                        style={{
                          background: isMe 
                            ? 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)' 
                            : 'rgba(0, 30, 60, 0.75)',
                          border: isMe 
                            ? '1px solid rgba(0, 199, 253, 0.4)' 
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

            {/* Caixa de Envio */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(0, 163, 224, 0.25)', background: 'rgba(0, 20, 40, 0.85)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={
                    selectedTarget?.type === 'class_group'
                      ? `Publicar mensagem para a turma...`
                      : `Responder a ${selectedTarget?.title || 'estudante'}...`
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
          </div>
        </div>
      </main>
    </div>
  );
}

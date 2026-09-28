import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../services/api';
import { subscribeToGlobalNotifications } from '../../services/realtimeService';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Award, 
  RotateCcw, 
  CheckCircle2, 
  CreditCard, 
  MessageSquare, 
  Info, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  X
} from 'lucide-react';

export default function NotificationBell() {
  const { user, profile, student, teacher, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | 'nao_lidas'
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  const userRole = profile?.role || (isAdmin ? 'admin' : isTeacher ? 'formador' : 'student');

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data = await getUserNotifications({
        role: userRole,
        studentId: student?.id,
        teacherId: teacher?.id,
        userId: user?.id
      });
      const list = data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.warn('Aviso ao carregar notificações no sino:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();

    // Escuta novas notificações em tempo real
    const sub = subscribeToGlobalNotifications(() => {
      fetchNotifs();
    });

    const interval = setInterval(fetchNotifs, 15000); // Polling complementar leve a cada 15s

    return () => {
      if (sub?.unsubscribe) sub.unsubscribe();
      clearInterval(interval);
    };
  }, [user?.id, student?.id, teacher?.id, userRole]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifs();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead({
        role: userRole,
        studentId: student?.id,
        teacherId: teacher?.id,
        userId: user?.id
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // Navegação contextual inteligente
    const type = notif.type || '';
    const title = notif.title || '';
    const msg = notif.message || '';

    if (isAdmin) {
      if (type === 'course_updated' || title.includes('Atualização de Curso')) {
        navigate('/admin/solicitacoes-curso');
      } else if (type === 'certificate_ready' || title.includes('Certificado') || msg.includes('certificado')) {
        navigate('/admin/certificados');
      } else if (type.includes('payment') || title.includes('Pagamento')) {
        navigate('/admin/pagamentos');
      } else if (type.includes('contact') || type.includes('support')) {
        navigate('/admin/suporte');
      } else {
        navigate('/admin/estudantes');
      }
    } else if (isTeacher) {
      if (type.includes('chat') || type.includes('message')) {
        navigate('/formador/chat');
      } else {
        navigate('/formador');
      }
    } else {
      // Estudante
      if (type === 'course_updated' || title.includes('Atualização')) {
        navigate('/estudante/atualizar-curso');
      } else if (type === 'certificate_ready' || title.includes('Certificado')) {
        navigate('/estudante/certificados');
      } else if (type.includes('payment') || title.includes('Pagamento')) {
        navigate('/estudante/pagamentos');
      } else if (type === 'enrollment_approved' || title.includes('Aprovada')) {
        navigate('/estudante/cursos');
      } else {
        navigate('/estudante');
      }
    }
  };

  const getNotifIcon = (type = '', title = '') => {
    if (type === 'course_updated' || title.includes('Atualização')) {
      return <RotateCcw size={16} color="#00C7FD" />;
    }
    if (type === 'certificate_ready' || title.includes('Certificado')) {
      return <Award size={16} color="#F59E0B" />;
    }
    if (type === 'enrollment_approved' || title.includes('Aprovada')) {
      return <CheckCircle2 size={16} color="#10B981" />;
    }
    if (type.includes('payment')) {
      return <CreditCard size={16} color="#38BDF8" />;
    }
    if (type.includes('chat') || type.includes('message') || type.includes('contact')) {
      return <MessageSquare size={16} color="#A78BFA" />;
    }
    if (type.includes('reject') || type.includes('warning')) {
      return <AlertCircle size={16} color="#EF4444" />;
    }
    return <Info size={16} color="#00C7FD" />;
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recentemente';
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `Há ${diffDays} dias`;
      return past.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    } catch (_) {
      return 'Recentemente';
    }
  };

  const filteredNotifs = activeTab === 'nao_lidas' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (!user) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* BOTÃO DO SINO */}
      <button
        type="button"
        onClick={handleToggle}
        title={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
        aria-label="Notificações do Sistema"
        style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: isOpen ? 'rgba(0, 199, 253, 0.22)' : 'rgba(0, 24, 48, 0.75)',
          border: isOpen ? '1.5px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadCount > 0 ? '#00C7FD' : '#BAE6FD',
          transition: 'all 0.2s ease',
          outline: 'none',
          padding: 0
        }}
      >
        <Bell size={18} strokeWidth={2.2} />

        {/* BADGE DE NÃO LIDAS */}
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: '800',
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.75)',
              border: '2px solid #001830',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* POPOVER DE NOTIFICAÇÕES */}
      {isOpen && (
        <div 
          className="notification-popover"
        >
          {/* CABEÇALHO DO DROPDOWN */}
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid rgba(0, 163, 224, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 32, 60, 0.65)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} color="#00C7FD" />
              <strong style={{ color: '#FFFFFF', fontSize: '0.92rem' }}>
                Notificações
              </strong>
              {unreadCount > 0 && (
                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00C7FD',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px'
                  }}
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  <span>Marcar lidas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
                title="Fechar Notificações"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ABAS: TODAS / NÃO LIDAS */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(0, 163, 224, 0.15)',
            background: 'rgba(0, 24, 48, 0.4)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: activeTab === 'todas' ? 'rgba(0, 199, 253, 0.12)' : 'transparent',
                borderBottom: activeTab === 'todas' ? '2px solid #00C7FD' : '2px solid transparent',
                color: activeTab === 'todas' ? '#00C7FD' : '#94A3B8',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'todas' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nao_lidas')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: activeTab === 'nao_lidas' ? 'rgba(0, 199, 253, 0.12)' : 'transparent',
                borderBottom: activeTab === 'nao_lidas' ? '2px solid #00C7FD' : '2px solid transparent',
                color: activeTab === 'nao_lidas' ? '#00C7FD' : '#94A3B8',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'nao_lidas' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Não Lidas ({unreadCount})
            </button>
          </div>

          {/* LISTA ROLÁVEL */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 0.5rem auto', opacity: 0.8 }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#E2E8F0', fontWeight: '600' }}>
                  {activeTab === 'nao_lidas' ? 'Nenhuma notificação por ler' : 'Nenhuma notificação no histórico'}
                </p>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Você está totalmente atualizado!
                </span>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isUnread = !notif.is_read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '0.8rem 1rem',
                      borderBottom: '1px solid rgba(0, 163, 224, 0.1)',
                      background: isUnread ? 'rgba(0, 199, 253, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'background 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isUnread ? 'rgba(0, 199, 253, 0.14)' : 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isUnread ? 'rgba(0, 199, 253, 0.08)' : 'transparent';
                    }}
                  >
                    {/* ÍCONE DE TIPO */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(0, 24, 48, 0.85)',
                      border: '1px solid rgba(0, 163, 224, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem'
                    }}>
                      {getNotifIcon(notif.type, notif.title)}
                    </div>

                    {/* CONTEÚDO */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.15rem' }}>
                        <strong style={{
                          color: isUnread ? '#FFFFFF' : '#CBD5E1',
                          fontSize: '0.825rem',
                          fontWeight: isUnread ? '800' : '600',
                          lineHeight: 1.3
                        }}>
                          {notif.title || 'Notificação do Sistema'}
                        </strong>

                        {isUnread && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#00C7FD',
                            flexShrink: 0,
                            boxShadow: '0 0 6px #00C7FD'
                          }} />
                        )}
                      </div>

                      <p style={{
                        color: isUnread ? '#E2E8F0' : '#94A3B8',
                        fontSize: '0.76rem',
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {notif.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                        <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} />
                          {formatRelativeTime(notif.created_at)}
                        </span>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#38BDF8',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title="Marcar como lida"
                          >
                            Marcar lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

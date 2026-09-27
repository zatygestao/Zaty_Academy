import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import FirstLoginPasswordChangeModal from '../../components/teacher/FirstLoginPasswordChangeModal';
import { getClasses, getTeacherAssignments, getTeacherNotifications, markNotificationAsRead } from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Megaphone,
  Bell,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, profile, teacher, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const teacherId = teacher?.id || profile?.id;
  const teacherName = teacher?.name || teacher?.full_name || profile?.full_name || 'Formador';
  const mustChangePassword = Boolean(profile?.must_change_password || teacher?.must_change_password);

  const loadData = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [allClasses, teacherAssignments, notifs] = await Promise.all([
        getClasses(),
        getTeacherAssignments(teacherId),
        getTeacherNotifications(teacherId)
      ]);

      // Filtrar apenas as turmas associadas a este formador
      const myClasses = (allClasses || []).filter(c => c.teacher_id === teacherId);
      setClasses(myClasses);
      setAssignments(teacherAssignments || []);

      let allNotifs = notifs || [];
      const isEnrollmentOpen = settings?.academic?.enrollment_notice_enabled === true;

      if (isEnrollmentOpen) {
        const hasEnrollmentNotif = allNotifs.some(n => n.type === 'enrollment_announcement');
        if (!hasEnrollmentNotif) {
          const autoNotice = {
            id: 'official_enrollment_notice_teacher',
            title: settings.academic.enrollment_notice_title || '📢 Inscrições Abertas — Zaty Academy',
            message: `Estão abertas as inscrições oficiais (${settings.academic.enrollment_period || 'Ano Formativo 2026'}). Consulte o edital institucional para alinhamento pedagógico e abertura de novas turmas.`,
            type: 'enrollment_announcement',
            is_read: false,
            created_at: new Date().toISOString()
          };
          allNotifs = [autoNotice, ...allNotifs];
        }
      } else {
        allNotifs = allNotifs.filter(n => n.type !== 'enrollment_announcement');
      }
      setNotifications(allNotifs);
    } catch (err) {
      console.error('Erro ao carregar dados do painel do formador:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadNotification = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    try {
      await markNotificationAsRead(notifId);
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, [teacherId, settings?.academic?.enrollment_notice_enabled]);

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Modal Bloqueante Obrigatório no Primeiro Acesso */}
      {mustChangePassword && (
        <FirstLoginPasswordChangeModal onPasswordChanged={loadData} />
      )}

      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho da Página */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Painel do Formador
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Bem-vindo, {teacherName}. Faça a gestão pedagógica das suas turmas e trabalhos académicos.
            </p>
          </div>

          <Link to="/formador/trabalhos" className="btn btn-primary mobile-btn-full">
            <FileText size={16} />
            GERIR TRABALHOS ACADÉMICOS
          </Link>
        </div>

        {/* BANNER INSTITUCIONAL DE INSCRIÇÕES ABERTAS - CORPO DOCENTE */}
        {settings?.academic?.enrollment_notice_enabled === true && (
          <div 
            className="glass-card" 
            style={{ 
              marginBottom: '1.75rem', 
              padding: '1.25rem 1.5rem', 
              border: '1px solid rgba(0, 199, 253, 0.45)',
              background: 'linear-gradient(90deg, rgba(0, 114, 206, 0.22) 0%, rgba(0, 24, 48, 0.8) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                <div 
                  style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '8px', 
                    background: 'rgba(0, 199, 253, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 199, 253, 0.4)',
                    flexShrink: 0,
                    marginTop: '0.2rem'
                  }}
                >
                  <Megaphone size={22} color="#00C7FD" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.2)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      COMUNICADO INSTITUCIONAL • CORPO DOCENTE
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Período Oficial: <strong style={{ color: '#00C7FD' }}>{settings.academic.enrollment_period || 'Ano Formativo 2026'}</strong>
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: '0 0 0.35rem 0' }}>
                    {settings.academic.enrollment_notice_title || '📢 Inscrições Abertas — Zaty Academy'}
                  </h3>
                  <p style={{ color: '#CBD5E1', fontSize: '0.85rem', lineHeight: '1.45', margin: 0, maxWidth: '820px' }}>
                    A Direção da Zaty Academy informa ao Corpo Docente que estão oficialmente abertas as inscrições para novas turmas. Consulte o edital público com os cursos disponibilizados, o cronograma e os requisitos de admissão.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', alignSelf: 'center' }}>
                <Link 
                  to="/inscricoes-abertas" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                >
                  <FileText size={15} />
                  <span>CONSULTAR EDITAL OFICIAL</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Indicadores Principais */}
        <div className="grid-3 mobile-metric-grid-2x2" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Turmas Ativas
              </span>
              <Users size={18} color="#00C7FD" />
            </div>
            <div className="stat-val" style={{ color: '#FFFFFF', fontSize: '1.9rem', fontWeight: '900' }}>
              {classes.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#00C7FD', marginTop: '0.2rem' }}>
              Turmas atribuídas sob a sua responsabilidade
            </div>
          </div>

          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Trabalhos Publicados
              </span>
              <FileText size={18} color="#10B981" />
            </div>
            <div className="stat-val" style={{ color: '#10B981', fontSize: '1.9rem', fontWeight: '900' }}>
              {assignments.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              Atividades e tarefas curriculares
            </div>
          </div>

          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Regime de Avaliação
              </span>
              <BookOpen size={18} color="#F59E0B" />
            </div>
            <div className="stat-val" style={{ color: '#F59E0B' }}>
              0 a 20 Val.
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              Escala oficial institucional
            </div>
          </div>
        </div>

        {/* Secção de Turmas Atribuídas */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', fontWeight: '700', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#00C7FD" />
              Minhas Turmas Atribuídas
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{classes.length} {classes.length === 1 ? 'turma' : 'turmas'}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              A carregar turmas...
            </div>
          ) : classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>Nenhuma turma atribuída a si no momento.</p>
              <span style={{ fontSize: '0.8rem' }}>Entre em contacto com a secretaria académica se necessário.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {classes.map(cls => (
                <div 
                  key={cls.id}
                  className="mobile-entity-card"
                  style={{ margin: 0 }}
                >
                  <div className="mobile-card-header">
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                        {cls.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#00C7FD', fontWeight: '600', marginTop: '0.2rem' }}>
                        {cls.course?.title || 'Curso Vinculado'}
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {cls.status || 'Ativa'}
                    </span>
                  </div>

                  <div className="mobile-card-meta">
                    <div>
                      <span className="meta-label">Horário</span>
                      <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} color="#00C7FD" />
                        {cls.schedule || 'A definir'}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Sala</span>
                      <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} color="#00C7FD" />
                        {cls.room || 'Lab TI'}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <Link 
                      to="/formador/trabalhos" 
                      className="btn btn-secondary mobile-action-btn"
                      style={{ fontSize: '0.8rem' }}
                    >
                      Criar Trabalho <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secções Inferiores: Trabalhos Recentes e Avisos da Direção */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Coluna 1: Trabalhos Criados Recentemente */}
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', fontWeight: '700', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#10B981" />
                Trabalhos Criados Recentemente
              </h2>
              <Link to="/formador/trabalhos" style={{ fontSize: '0.8rem', color: '#00C7FD', textDecoration: 'none' }}>
                Ver todos ({assignments.length}) →
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                A carregar trabalhos...
              </div>
            ) : assignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                <FileText size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>Ainda não publicou nenhum trabalho de casa.</p>
                <Link to="/formador/trabalhos" className="btn btn-primary mobile-btn-full" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
                  Criar Primeiro Trabalho
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {assignments.slice(0, 5).map(asg => (
                  <div
                    key={asg.id}
                    className="mobile-entity-card"
                    style={{ margin: 0 }}
                  >
                    <div className="mobile-card-header">
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                          {asg.title}
                        </h4>
                        <div style={{ fontSize: '0.76rem', color: '#00C7FD', marginTop: '0.2rem', fontWeight: '600' }}>
                          Turma: {asg.class?.name || 'Geral'}
                        </div>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {asg.max_points || 20} Val.
                      </span>
                    </div>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Data Limite</span>
                        <span className="meta-value">
                          {formatDateTime(asg.due_date)}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Cotação Máxima</span>
                        <span className="meta-value" style={{ color: '#10B981' }}>
                          {asg.max_points || 20} Valores
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <Link
                        to="/formador/trabalhos"
                        className="btn btn-secondary mobile-action-btn"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Gerir Submissões
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Avisos & Comunicados da Direção */}
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', fontWeight: '700', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#00C7FD" />
                Avisos & Comunicados da Direção
              </h2>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px', fontSize: '0.72rem' }}>
                  {notifications.filter(n => !n.is_read).length} novas
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                  <Bell size={30} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Nenhum comunicado da direção no momento.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.is_read && handleReadNotification(notif.id)}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: '6px',
                      background: notif.is_read ? 'rgba(0, 24, 48, 0.5)' : 'rgba(0, 114, 206, 0.18)',
                      borderLeft: notif.is_read ? '3px solid rgba(0, 163, 224, 0.2)' : '3px solid #00C7FD',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: notif.is_read ? '#FFFFFF' : '#00C7FD', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {notif.type === 'enrollment_announcement' && <Megaphone size={14} color="#00C7FD" />}
                        {notif.title}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: '1.45', margin: 0 }}>
                      {notif.message}
                    </p>
                    {notif.type === 'enrollment_announcement' && (
                      <Link 
                        to="/inscricoes-abertas" 
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          marginTop: '0.6rem', 
                          fontSize: '0.74rem', 
                          padding: '0.25rem 0.65rem', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem',
                          background: 'rgba(0, 199, 253, 0.12)',
                          borderColor: 'rgba(0, 199, 253, 0.35)',
                          color: '#00C7FD'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} />
                        <span>Ver Edital de Inscrições</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

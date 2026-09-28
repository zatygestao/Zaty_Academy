import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getStudentNotifications, getLessonProgress, markNotificationAsRead } from '../../services/api';
import StudentSidebar from '../../components/student/StudentSidebar';
import PaymentModal from '../../components/student/PaymentModal';
import { getStatusBadgeInfo, formatDate } from '../../utils/formatters';
import { 
  BookOpen, 
  CreditCard, 
  Bell, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  MapPin,
  Calendar,
  Award,
  Megaphone,
  FileText,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function StudentDashboard() {
  const { student, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!student?.id) return;
      try {
        const [notifs, progress] = await Promise.all([
          getStudentNotifications(student.id),
          getLessonProgress(student.id)
        ]);

        let allNotifs = notifs || [];
        const isEnrollmentOpen = settings.academic?.enrollment_notice_enabled === true;

        if (isEnrollmentOpen) {
          const hasAnnouncement = allNotifs.some(n => n.type === 'enrollment_announcement');
          if (!hasAnnouncement) {
            allNotifs = [
              {
                id: 'active_enrollment_pinned_notice',
                student_id: student.id,
                title: settings.academic?.enrollment_title || '📢 Inscrições Abertas — Zaty Academy',
                message: `A Direção da Zaty Academy informa que estão abertas as inscrições oficiais (${settings.academic?.enrollment_period || 'Ano 2026'}). Consulte o edital institucional completo e partilhe esta oportunidade!`,
                type: 'enrollment_announcement',
                is_read: false,
                is_pinned: true,
                created_at: new Date().toISOString()
              },
              ...allNotifs
            ];
          }
        } else {
          allNotifs = allNotifs.filter(n => n.type !== 'enrollment_announcement');
        }

        setNotifications(allNotifs);
        setLessonProgress(progress || []);
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student?.id, settings.academic?.enrollment_notice_enabled]);

  const activeEnrollment = student?.enrollments?.[0];
  const activeCourse = activeEnrollment?.course;
  const activeClass = activeEnrollment?.class;

  const totalLessons = activeCourse?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = lessonProgress.filter(p => p.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleReadNotification = async (id) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho de Boas-Vindas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
              Olá, {student?.full_name?.split(' ')[0] || 'Estudante'}!
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Acompanhe aqui o seu percurso académico, pagamentos e materiais de estudo.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => setShowPaymentModal(true)} 
            className="btn btn-primary mobile-btn-full"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <CreditCard size={16} />
            <span>SOLICITAR PAGAMENTO</span>
          </button>
        </div>

        {/* COMUNICADO INSTITUCIONAL: INSCRIÇÕES ABERTAS (QUANDO ATIVADO PELA DIREÇÃO) */}
        {settings.academic?.enrollment_notice_enabled === true && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 114, 181, 0.35) 0%, rgba(0, 199, 253, 0.2) 100%)',
            border: '1.5px solid #00C7FD',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(0, 199, 253, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0072B5, #00C7FD)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Megaphone size={24} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00C7FD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    COMUNICADO INSTITUCIONAL • INSCRIÇÕES ABERTAS
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    Oficial
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {settings.academic?.enrollment_title || 'INSCRIÇÕES ABERTAS - ANO FORMATIVO 2026'}
                </h3>
                <p style={{ color: '#E2E8F0', fontSize: '0.825rem', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  Período: <strong>{settings.academic?.enrollment_period || 'Consulte a secretaria'}</strong>. Partilhe esta oportunidade ou aceda ao edital para conhecer os novos cursos e turnos disponíveis.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link
                to="/inscricoes-abertas"
                className="btn btn-primary"
                style={{ 
                  fontSize: '0.825rem', 
                  padding: '0.55rem 1.15rem', 
                  background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  fontWeight: '700'
                }}
              >
                <FileText size={15} />
                <span>Ver Edital Oficial</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* 0. Alerta de Curso Concluído & Certificado Emitido */}
        {(student?.enrollment_status === 'concluido' || activeEnrollment?.status === 'concluido' || (typeof activeEnrollment?.final_grade === 'string' && activeEnrollment?.final_grade.toUpperCase().includes('APROVADO'))) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(0, 199, 253, 0.15) 100%)',
            border: '2px solid #10B981',
            borderRadius: '10px',
            padding: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.3)',
                border: '1.5px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={26} color="#34D399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#FFFFFF', fontSize: '1.05rem' }}>Curso Concluído & Certificado Emitido!</strong>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Aprovado com Êxito</span>
                </div>
                <p style={{ color: '#D1FAE5', fontSize: '0.885rem', marginTop: '0.25rem', lineHeight: '1.5', fontWeight: '500' }}>
                  “Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.”
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link 
                to="/estudante/certificados" 
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem' }}
              >
                <Award size={16} />
                <span>Ver Meu Certificado</span>
              </Link>
              <Link 
                to="/estudante/atualizar-curso" 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem' }}
              >
                <span>Atualizar Percurso</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* 1. Alerta de Inscrição Aprovada com Acesso Liberado (Apenas se não for concluído) */}
        {student?.enrollment_status !== 'concluido' && activeEnrollment?.status !== 'concluido' && !(typeof activeEnrollment?.final_grade === 'string' && activeEnrollment?.final_grade.toUpperCase().includes('APROVADO')) && (student?.enrollment_status === 'ativo' || student?.status === 'ativo') && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(0, 199, 253, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 260px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} color="#34D399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>Inscrição Aprovada com Sucesso!</strong>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Acesso Liberado</span>
                </div>
                <p style={{ color: '#D1FAE5', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.4' }}>
                  A sua inscrição foi aprovada pela administração. Você já tem acesso total aos módulos, aulas e conteúdos do seu curso.
                </p>
              </div>
            </div>
            <Link 
              to="/estudante/cursos" 
              className="btn btn-primary mobile-btn-full" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem' }}
            >
              <BookOpen size={16} />
              <span>Aceder às Minhas Aulas</span>
            </Link>
          </div>
        )}

        {/* 2. Alerta de Inscrição Pendente de Análise */}
        {(student?.enrollment_status === 'pendente' || student?.status === 'pendente') && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 260px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={22} color="#FCD34D" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>Inscrição Pendente de Aprovação</strong>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', fontWeight: '700' }}>Em Análise</span>
                </div>
                <p style={{ color: '#FEF3C7', fontSize: '0.825rem', marginTop: '0.2rem', lineHeight: '1.4' }}>
                  A nossa equipa está a analisar os seus dados cadastrais. Aguarde até 24 horas para validação ou anexe o comprovativo da taxa de inscrição se aplicável.
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowPaymentModal(true)} 
              className="btn btn-primary btn-sm mobile-btn-full"
              style={{ padding: '0.55rem 1rem' }}
            >
              Enviar Comprovativo
            </button>
          </div>
        )}

        {/* 3. Alerta de Inscrição Rejeitada */}
        {(student?.enrollment_status === 'rejeitado' || student?.status === 'rejeitado') && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={26} color="#F87171" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '1.025rem' }}>Inscrição Não Aprovada</strong>
              <p style={{ color: '#FCA5A5', fontSize: '0.85rem', marginTop: '0.2rem', lineHeight: '1.4' }}>
                A sua inscrição não pôde ser aprovada. Por favor, contacte a secretaria da Zaty Academy para atualizar seus documentos ou verificar pendências cadastrais.
              </p>
            </div>
          </div>
        )}

        {/* Cards de Métricas Rápidas */}
        <div className="mobile-metric-grid-2x2">
          <div className="glass-card mobile-metric-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado da Matrícula</span>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`badge ${getStatusBadgeInfo(student?.enrollment_status).bg}`}>
                {getStatusBadgeInfo(student?.enrollment_status).label}
              </span>
            </div>
          </div>

          <div className="glass-card mobile-metric-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Situação Financeira</span>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`badge ${getStatusBadgeInfo(student?.financial_status).bg}`}>
                {getStatusBadgeInfo(student?.financial_status).label}
              </span>
            </div>
          </div>

          <div className="glass-card mobile-metric-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progresso no Curso</span>
            <div className="stat-val" style={{ fontSize: '1.45rem', fontWeight: '800', color: '#00C7FD', marginTop: '0.2rem' }}>
              {progressPercent}%
            </div>
          </div>

          <div className="glass-card mobile-metric-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aulas Concluídas</span>
            <div className="stat-val" style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem' }}>
              {completedLessons} / {totalLessons}
            </div>
          </div>
        </div>

        {/* Card em Destaque: Minha Turma & Formador Responsável */}
        <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.5rem)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 199, 253, 0.3)'
              }}>
                <Users size={18} color="#00C7FD" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Minha Turma & Formador Responsável
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Dados oficiais da sua turma presencial e laboratório
                </span>
              </div>
            </div>

            {activeClass ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
                  <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Enturmação Ativa
                </span>
                <Link
                  to="/estudante/notas"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Award size={13} /> Ver Minhas Notas
                </Link>
              </div>
            ) : (
              <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: '600' }}>
                Aguardando Alocação
              </span>
            )}
          </div>

          {activeClass ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.85rem'
            }}>
              {/* Turma */}
              <div style={{ background: 'rgba(0, 24, 48, 0.5)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                  Turma
                </span>
                <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', display: 'block', marginTop: '0.2rem' }}>
                  {activeClass.name}
                </strong>
                {activeClass.code && (
                  <span style={{ color: '#00C7FD', fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: '700', display: 'block', marginTop: '0.15rem' }}>
                    Código: {activeClass.code}
                  </span>
                )}
              </div>

              {/* Formador */}
              <div style={{ background: 'rgba(0, 24, 48, 0.5)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                  Formador Responsável
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <UserCheck size={14} color="#10B981" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                    {activeClass.teacher?.full_name || activeClass.teacher?.name || 'Formador Designado'}
                  </strong>
                </div>
                {(activeClass.teacher?.specialty || activeClass.teacher?.email) && (
                  <span style={{ color: '#94A3B8', fontSize: '0.73rem', display: 'block', marginTop: '0.2rem' }}>
                    {activeClass.teacher?.specialty ? `${activeClass.teacher.specialty}` : ''}
                    {activeClass.teacher?.specialty && activeClass.teacher?.email ? ' • ' : ''}
                    {activeClass.teacher?.email || ''}
                  </span>
                )}
              </div>

              {/* Horário */}
              <div style={{ background: 'rgba(0, 24, 48, 0.5)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                  Horário das Aulas
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Clock size={14} color="#00C7FD" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                    {activeClass.schedule || 'A definir'}
                  </strong>
                </div>
              </div>

              {/* Sala / Espaço */}
              <div style={{ background: 'rgba(0, 24, 48, 0.5)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                  Sala / Laboratório
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <MapPin size={14} color="#00C7FD" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                    {activeClass.room || 'Sala 1 - Laboratório TI'}
                  </strong>
                </div>
              </div>

              {/* Data de Início e Término */}
              <div style={{ background: 'rgba(0, 24, 48, 0.5)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#CBD5E1' }}>
                    <Calendar size={14} color="#00C7FD" />
                    <span><strong>Início das Aulas:</strong> {activeClass.start_date ? formatDate(activeClass.start_date) : 'A anunciar brevemente'}</span>
                    {activeClass.end_date && (
                      <span style={{ marginLeft: '0.5rem', color: '#94A3B8' }}>• <strong>Previsão de Término:</strong> {formatDate(activeClass.end_date)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00C7FD', fontSize: '0.78rem' }}>
                    <BookOpen size={14} />
                    <span>Curso: <strong>{activeCourse?.title || 'Curso Vinculado'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(0, 24, 48, 0.4)',
              borderRadius: '6px',
              padding: '1.25rem',
              border: '1px dashed rgba(0, 163, 224, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <AlertCircle size={24} color="#FCD34D" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block' }}>
                  Aguardando designação de turma e formador
                </strong>
                <p style={{ color: '#94A3B8', fontSize: '0.825rem', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                  A sua turma e o respetivo formador responsável estão a ser atribuídos pela secretaria académica. Assim que confirmados, o horário, a sala de aula e os dados de contacto do formador aparecerão aqui automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informações do Curso & Notificações */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Cartão do Curso Ativo */}
          <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Curso Matriculado</span>
                <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', marginTop: '0.2rem' }}>
                  {activeCourse?.title || 'Nenhum curso associado'}
                </h3>
              </div>
              <BookOpen size={22} color="#00C7FD" style={{ flexShrink: 0 }} />
            </div>

            {activeCourse ? (
              <>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.15rem' }}>
                  {activeCourse.description}
                </p>

                <div className="mobile-card-meta" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Carga Horária</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.82rem' }}>{activeCourse.workload_hours} Horas</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Duração</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.82rem' }}>{activeCourse.duration}</strong>
                  </div>
                  {activeClass && (
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(0, 163, 224, 0.15)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Turma / Horário</span>
                      <strong style={{ color: '#00C7FD', fontSize: '0.82rem' }}>{activeClass.name} ({activeClass.schedule})</strong>
                    </div>
                  )}
                </div>

                {/* Barra de Progresso */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94A3B8' }}>Progresso Geral</span>
                    <span style={{ fontWeight: '700', color: '#00C7FD' }}>{progressPercent}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0, 24, 48, 0.9)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #0072CE 0%, #00C7FD 100%)', borderRadius: '3px' }} />
                  </div>
                </div>

                <Link to="/estudante/cursos" className="btn btn-primary" style={{ width: '100%' }}>
                  ACEDER ÀS AULAS & PDFS DIDÁTICOS
                  <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: '0.875rem', padding: '1rem 0' }}>
                Contacte a secretaria para atribuição de um curso.
              </div>
            )}
          </div>

          {/* Notificações Recentes */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#00C7FD" />
                Avisos e Notificações
              </h3>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px' }}>
                  {notifications.filter(n => !n.is_read).length} novas
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '360px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Não possui notificações no momento.
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.is_read && handleReadNotification(notif.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '4px',
                      background: notif.is_read ? 'rgba(0, 24, 48, 0.6)' : 'rgba(0, 114, 206, 0.2)',
                      borderLeft: notif.is_read ? '3px solid rgba(0, 163, 224, 0.2)' : '3px solid #00C7FD',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: notif.is_read ? '#FFFFFF' : '#00C7FD' }}>
                        {notif.title}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                    {notif.type === 'enrollment_announcement' && (
                      <Link 
                        to="/inscricoes-abertas" 
                        className="btn btn-secondary btn-sm" 
                        style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.75rem', 
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
                        <span>Aceder ao Edital de Inscrições</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}

                    {(notif.type === 'support_message' || notif.type === 'contact_message' || notif.link) && (
                      <Link 
                        to={notif.link || '/estudante/chat'} 
                        className="btn btn-primary btn-sm" 
                        style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.65rem', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem',
                          background: 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)',
                          color: '#FFFFFF'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notif.is_read) handleReadNotification(notif.id);
                        }}
                      >
                        <MessageSquare size={12} />
                        <span>Ver Resposta no Suporte</span>
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

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        studentId={student?.id}
        defaultAmount={activeCourse?.registration_fee || ''}
        onPaymentSuccess={refreshProfile}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import { 
  getCourses, 
  getStudentCoursesEligibility, 
  updateStudentCourse,
  checkStudentCourseEnrollmentEligibility 
} from '../../services/api';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
import { 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  User, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Award,
  ChevronRight,
  Info,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StudentCourseUpdate() {
  const { student, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [reason, setReason] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Relógio em tempo real para exibir a data e hora exata da atualização
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEnrollment = student?.enrollments?.[0];
  const currentCourse = activeEnrollment?.course;
  const isCurrentCourseCompleted = activeEnrollment?.status === 'concluido' || 
    (typeof activeEnrollment?.final_grade === 'string' && activeEnrollment?.final_grade.toUpperCase().includes('APROVADO'));

  useEffect(() => {
    async function loadData() {
      if (!student?.id) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const [crs, elig] = await Promise.all([
          getCourses(true),
          getStudentCoursesEligibility(student.id)
        ]);
        setCourses(crs || []);
        setEligibilityMap(elig || {});
      } catch (err) {
        console.error('Erro ao carregar dados de cursos e elegibilidade:', err);
        setErrorMsg('Falha ao carregar lista de formações disponíveis.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student?.id]);

  const selectedCourseData = courses.find(c => c.id === selectedCourseId);

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      return setErrorMsg('Por favor, selecione o novo curso pretendido.');
    }
    if (currentCourse?.id && selectedCourseId === currentCourse.id) {
      return setErrorMsg('O novo curso selecionado não pode ser igual ao seu curso atual.');
    }

    if (isCurrentCourseCompleted) {
      return setErrorMsg('Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.');
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const receipt = await updateStudentCourse({
        studentId: student.id,
        previousCourseId: currentCourse?.id || null,
        newCourseId: selectedCourseId,
        reason: reason.trim()
      });

      setSuccessReceipt(receipt);

      // Atualiza o perfil e sessões em tempo real
      if (refreshProfile) {
        await refreshProfile();
      }

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    } catch (err) {
      console.error('Erro ao atualizar curso:', err);
      setErrorMsg(err.message || 'Falha ao processar a atualização de curso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho da Página */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00C7FD', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            <RotateCcw size={14} />
            <span>Transição Académica Oficial</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.85rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            Atualização de Curso & Percurso Formativo
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginTop: '0.25rem' }}>
            Altere com segurança o seu plano de formação com registo oficial, auditoria institucional e notificação em tempo real à Direção Pedagógica.
          </p>
        </div>

        {/* CENÁRIO 1: CURSO ATUAL JÁ CONCLUÍDO COM CERTIFICADO EMITIDO */}
        {isCurrentCourseCompleted && !successReceipt && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 199, 253, 0.15) 100%)',
            border: '2px solid #10B981',
            borderRadius: '10px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.3)',
                border: '1.5px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={28} color="#34D399" />
              </div>

              <div style={{ flex: 1, minWidth: '260px' }}>
                <span className="badge badge-success" style={{ textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block' }}>
                  Formação Concluída com Sucesso
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                  Curso Concluído & Certificado Emitido
                </h3>
                <p style={{ color: '#D1FAE5', fontSize: '0.925rem', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  “Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.”
                </p>

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <Link to="/estudante/certificados" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Award size={16} />
                    <span>Visualizar Meu Certificado</span>
                  </Link>
                  <Link to="/inscricao" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={16} />
                    <span>Solicitar Nova Matrícula</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CENÁRIO 2: RECIBO DE SUCESSO APÓS A ATUALIZAÇÃO */}
        {successReceipt ? (
          <div className="glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', border: '2px solid #10B981', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '2px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <CheckCircle2 size={36} color="#10B981" />
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operação Registada com Sucesso
              </span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#FFFFFF', marginTop: '0.4rem' }}>
                Curso Atualizado com Êxito!
              </h2>
              <p style={{ color: '#A7F3D0', fontSize: '0.9rem', maxWidth: '580px', margin: '0.35rem auto 0 auto' }}>
                A sua transição de percurso académico foi processada, gravada no histórico permanente do sistema e comunicada à administração em tempo real.
              </p>
            </div>

            {/* TABELA DE DETALHES OBRIGATÓRIOS DO RECIBO */}
            <div style={{
              background: 'rgba(0, 24, 48, 0.85)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 163, 224, 0.3)',
              padding: '1.5rem',
              marginBottom: '1.75rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#00C7FD', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={18} />
                Comprovativo Oficial de Atualização de Curso
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                fontSize: '0.85rem'
              }}>
                {/* 1. Estudante */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Estudante
                  </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', display: 'block', marginTop: '0.15rem' }}>
                    {successReceipt.student?.full_name}
                  </strong>
                  <span style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    Código: {successReceipt.student?.student_code}
                  </span>
                </div>

                {/* 2. Curso Anterior */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Curso Anterior
                  </span>
                  <strong style={{ color: '#CBD5E1', fontSize: '0.95rem', display: 'block', marginTop: '0.15rem' }}>
                    {successReceipt.previousCourse?.title || 'Sem curso anterior'}
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem' }}>
                    Histórico escolar arquivado
                  </span>
                </div>

                {/* 3. Novo Curso */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Novo Curso Selecionado
                  </span>
                  <strong style={{ color: '#34D399', fontSize: '1.05rem', display: 'block', marginTop: '0.15rem' }}>
                    {successReceipt.newCourse?.title}
                  </strong>
                  <span style={{ color: '#6EE7B7', fontSize: '0.74rem' }}>
                    Carga Horária: {successReceipt.newCourse?.workload_hours || 60}h • {successReceipt.newCourse?.duration || '3 Meses'}
                  </span>
                </div>

                {/* 4. Data e Hora da Atualização */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Data & Hora da Atualização
                  </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.925rem', display: 'block', marginTop: '0.15rem' }}>
                    {formatDateTime(successReceipt.updatedAt)}
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem' }}>
                    Horário Oficial de Moçambique (GMT+2)
                  </span>
                </div>

                {/* 5. Estado da Atualização */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Estado da Atualização
                  </span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className="badge badge-success" style={{ fontWeight: '800', fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
                      ✓ Concluída com Sucesso (Ativo)
                    </span>
                  </div>
                </div>

                {/* 6. Protocolo de Auditoria */}
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>
                    Auditoria do Sistema
                  </span>
                  <div style={{ color: '#38BDF8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <ShieldCheck size={14} /> Registado em academy_audit_logs
                  </div>
                </div>
              </div>

              {/* Informação sobre o que acontecerá após a atualização */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(0, 163, 224, 0.2)',
                color: '#E2E8F0',
                fontSize: '0.85rem',
                lineHeight: 1.6
              }}>
                <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.35rem' }}>
                  O que acontecerá a seguir:
                </strong>
                <p style={{ margin: 0 }}>
                  {successReceipt.disclaimer}
                </p>
              </div>
            </div>

            {/* Ações pós-atualização */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/estudante/cursos" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} />
                <span>Aceder às Minhas Novas Aulas</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/estudante" className="btn btn-secondary btn-lg">
                Voltar ao Painel Principal
              </Link>
            </div>
          </div>
        ) : null}

        {/* CENÁRIO 3: FORMULÁRIO DE ATUALIZAÇÃO DE CURSO */}
        {!successReceipt && !isCurrentCourseCompleted && (
          <form onSubmit={handleConfirmUpdate}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#FCA5A5',
                fontSize: '0.885rem'
              }}>
                <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO ESTUDANTE & CURSO ANTERIOR */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="#00C7FD" />
                1. Identificação do Estudante & Curso Atual
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.65)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Estudante</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', display: 'block', marginTop: '0.2rem' }}>
                    {student?.full_name || 'Carregando...'}
                  </strong>
                  <span style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    Código: {student?.student_code || student?.student_number || 'ZA'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.65)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Contactos</span>
                  <div style={{ color: '#FFFFFF', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {student?.email}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    Tel: {student?.phone}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.65)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Curso Anterior (Atual)</span>
                  <strong style={{ color: '#F59E0B', fontSize: '1rem', display: 'block', marginTop: '0.2rem' }}>
                    {currentCourse?.title || 'Nenhum curso ativo no momento'}
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>
                    {currentCourse?.workload_hours ? `${currentCourse.workload_hours}h • ` : ''}Estado: {activeEnrollment?.status || 'Regular'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.65)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Data & Hora Atual (Tempo Real)</span>
                  <strong style={{ color: '#00C7FD', fontSize: '0.925rem', display: 'block', marginTop: '0.2rem' }}>
                    {currentTimestamp.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </strong>
                  <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {currentTimestamp.toLocaleTimeString('pt-PT')} (GMT+2)
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: SELEÇÃO DO NOVO CURSO */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="#00C7FD" />
                2. Seleção da Nova Formação Profissional
              </h2>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.885rem', fontWeight: '700' }}>
                  Escolha o Novo Curso Pretendido *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setErrorMsg('');
                  }}
                  className="form-select"
                  style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
                  required
                >
                  <option value="">-- Selecione o novo curso desejado --</option>
                  {courses.map(course => {
                    const isCurrent = currentCourse?.id === course.id;
                    const elig = eligibilityMap[course.id];
                    const isBlocked = !elig?.eligible;
                    const isReproved = elig?.canReEnrollReproved;

                    let labelExtra = '';
                    if (isCurrent) labelExtra = ' [CURSO ATUAL]';
                    else if (isBlocked) labelExtra = ' [CONCLUÍDO & CERTIFICADO - BLOQUEADO]';
                    else if (isReproved) labelExtra = ' [REPROVAÇÃO PRÉVIA - MATRÍCULA PERMITIDA]';

                    return (
                      <option
                        key={course.id}
                        value={course.id}
                        disabled={isCurrent || isBlocked}
                      >
                        {course.title} ({formatCurrency(course.price)}) {labelExtra}
                      </option>
                    );
                  })}
                </select>
                <span style={{ color: '#94A3B8', fontSize: '0.76rem', marginTop: '0.35rem', display: 'block' }}>
                  * Cursos já concluídos com aprovação e emissão de certificado não podem ser cursados novamente por regra institucional.
                </span>
              </div>

              {/* CARD DE DETALHES DO NOVO CURSO SELECIONADO */}
              {selectedCourseData && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 114, 206, 0.25) 0%, rgba(0, 199, 253, 0.15) 100%)',
                  border: '1.5px solid #00C7FD',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#00C7FD', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        DETALHES DO NOVO CURSO
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: '0.2rem 0' }}>
                        {selectedCourseData.title}
                      </h3>
                      <p style={{ color: '#CBD5E1', fontSize: '0.825rem', maxWidth: '650px', margin: '0.25rem 0 0 0' }}>
                        {selectedCourseData.description || 'Formação profissional com módulos pedagógicos práticos e certificação reconhecida.'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Mensalidade / Valor</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#00C7FD' }}>
                        {formatCurrency(selectedCourseData.price)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    marginTop: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(0, 163, 224, 0.25)',
                    fontSize: '0.825rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#FFFFFF' }}>
                      <Clock size={14} color="#00C7FD" />
                      <span>Carga Horária: <strong>{selectedCourseData.workload_hours || 60} Horas</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#FFFFFF' }}>
                      <Calendar size={14} color="#00C7FD" />
                      <span>Duração Prevista: <strong>{selectedCourseData.duration || '3 Meses'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34D399' }}>
                      <CheckCircle2 size={14} />
                      <span>Elegibilidade Validada pelo Sistema</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Justificativa / Observações (Opcional) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Motivo da Atualização (Opcional — será comunicado à coordenação):
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-textarea"
                  rows="2"
                  placeholder="Ex: Pretendo especializar-me nesta vertente técnica; compatibilidade com novo horário profissional..."
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* SEÇÃO 3: INFORMAÇÃO OBRIGATÓRIA SOBRE O QUE ACONTECERÁ APÓS A ATUALIZAÇÃO */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 32, 60, 0.95) 0%, rgba(0, 24, 48, 0.9) 100%)',
              border: '1.5px solid rgba(0, 199, 253, 0.4)',
              borderRadius: '8px',
              padding: '1.35rem 1.5rem',
              marginBottom: '1.75rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Info size={22} color="#00C7FD" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Informações Institucionais Importantes: O Que Acontece Após a Atualização?
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                    A Zaty Academy assegura conformidade académica e total transparência no processo de transição.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                fontSize: '0.825rem',
                color: '#CBD5E1',
                lineHeight: 1.5
              }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    1. Reorientação Imediata
                  </strong>
                  O seu acesso às aulas, materiais didáticos e módulos pedagógicos será atualizado de imediato para a nova formação escolhida.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    2. Preservação de Histórico
                  </strong>
                  Todo o seu percurso anterior (presenças, testes e notas) permanece registrado com segurança no histórico/auditoria para efeitos de declarações.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    3. Alerta em Tempo Real
                  </strong>
                  A Direção Pedagógica recebe notificação instantânea em tempo real no painel administrativo para designar a sua turma e formador responsável.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    4. Estado da Atualização
                  </strong>
                  Após clicar em confirmar, a sua matrícula passará para o estado <strong>Ativo / Em Curso</strong> sob a nova formação.
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: ESTADO ATUAL & CONFIRMAÇÃO */}
            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Estado da Atualização:</span>
                <span className="badge badge-info" style={{ fontWeight: '700', fontSize: '0.75rem' }}>
                  {submitting ? 'A Processar...' : 'Pronto para Confirmação'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/estudante/cursos')}
                  disabled={submitting}
                  className="btn btn-secondary"
                >
                  Cancelar & Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedCourseId}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}
                >
                  <RotateCcw size={16} />
                  <span>{submitting ? 'A Atualizar Percurso...' : 'Confirmar Atualização de Curso'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

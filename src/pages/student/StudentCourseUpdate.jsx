import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import { 
  getCourses, 
  getStudentEnrollments,
  getStudentCoursesEligibility, 
  requestStudentCourseUpdate,
  getStudentCourseUpdateRequests,
  getStudentCourseUpdateEligibility,
  submitCourseUpdatePaymentProof,
  uploadPrivateDocument
} from '../../services/api';
import { subscribeToCourseUpdates } from '../../services/realtimeService';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
import { validateFile } from '../../utils/validators';
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
  CreditCard,
  Ban,
  Upload,
  Lock,
  ExternalLink,
  Check,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StudentCourseUpdate() {
  const { student, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [updateEligibility, setUpdateEligibility] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [reason, setReason] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Formulário de Pagamento no Módulo
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Relógio em tempo real
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [currentCourseData, setCurrentCourseData] = useState(null);
  const [activeEnrollmentData, setActiveEnrollmentData] = useState(null);

  const activeEnrollment = activeEnrollmentData || student?.enrollments?.[0];
  const currentCourse = currentCourseData || activeEnrollment?.course;

  const loadData = async () => {
    if (!student?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Carregar matrículas atualizadas do estudante
      const enrs = await getStudentEnrollments(student.id);
      const activeEnr = (enrs || []).find(e => e.status === 'ativo') || 
                        (enrs || []).find(e => e.status === 'concluido') || 
                        (enrs || [])[0];
      
      setActiveEnrollmentData(activeEnr || null);
      const activeCrs = activeEnr?.course || null;
      if (activeCrs) {
        setCurrentCourseData(activeCrs);
      }

      // 2. Verificar elegibilidade central e solicitações ativas
      const [crs, reqs, eligCheck] = await Promise.all([
        getCourses(true),
        getStudentCourseUpdateRequests(student.id),
        getStudentCourseUpdateEligibility(student.id)
      ]);

      const currentCourseId = activeCrs?.id || activeEnr?.course_id || null;
      const eligMap = await getStudentCoursesEligibility(student.id, { currentCourseId });

      setCourses(crs || []);
      setEligibilityMap(eligMap || {});
      setRequestHistory(reqs || []);
      setUpdateEligibility(eligCheck || null);

      // Identificar solicitação ativa (pendente, em análise ou aguardando pagamento)
      const pendingReq = (reqs || []).find(r => 
        ['pendente', 'em_analise', 'aprovada_aguardando_pagamento'].includes(r.status)
      );
      setActiveRequest(pendingReq || null);

      if (pendingReq?.status === 'aprovada_aguardando_pagamento') {
        if (pendingReq.payment_status === 'rejeitado' || pendingReq.payment_status === 'pendente') {
          setShowPaymentForm(true);
        } else {
          setShowPaymentForm(false);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de atualização de curso:', err);
      setErrorMsg('Falha ao carregar informações de percurso académico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Escuta em tempo real atualizações da Direção
    const sub = subscribeToCourseUpdates(() => {
      loadData();
      if (refreshProfile) refreshProfile();
    });

    return () => {
      if (sub?.unsubscribe) sub.unsubscribe();
    };
  }, [student?.id]);

  const selectedCourseData = courses.find(c => c.id === selectedCourseId);

  // Submissão de nova solicitação de atualização
  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      return setErrorMsg('Por favor, selecione o novo curso pretendido.');
    }
    const activeCrs = currentCourseData || currentCourse;
    if (activeCrs?.id && selectedCourseId === activeCrs.id) {
      return setErrorMsg('O novo curso selecionado não pode ser igual ao seu curso atual.');
    }

    if (activeRequest && ['pendente', 'em_analise', 'aprovada_aguardando_pagamento'].includes(activeRequest.status)) {
      return setErrorMsg('Já possui uma solicitação de atualização em andamento. Aguarde o parecer da Direção.');
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessBanner('');

    try {
      const newReq = await requestStudentCourseUpdate({
        studentId: student.id,
        previousCourseId: activeCrs?.id || null,
        newCourseId: selectedCourseId,
        reason: reason.trim()
      });

      setActiveRequest(newReq);
      setSelectedCourseId('');
      setReason('');
      setSuccessBanner('A sua solicitação de atualização foi submetida com sucesso e aguarda avaliação da Direção.');

      await loadData();
      if (refreshProfile) await refreshProfile();

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    } catch (err) {
      console.error('Erro ao submeter solicitação:', err);
      setErrorMsg(err.message || 'Falha ao processar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upload e Seleção de Ficheiro de Comprovativo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const val = validateFile(file, { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] });
    if (!val.valid) {
      setErrorMsg(val.error);
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
    setErrorMsg('');
  };

  // Submissão do Comprovativo de Pagamento no Próprio Módulo
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!referenceCode.trim()) {
      return setErrorMsg('Por favor informe a referência, número ou código do recibo de pagamento.');
    }

    setSubmittingPayment(true);
    setErrorMsg('');
    setSuccessBanner('');

    try {
      await submitCourseUpdatePaymentProof({
        requestId: activeRequest.id,
        studentId: student.id,
        amount: activeRequest.new_course_price,
        paymentMethod,
        referenceCode: referenceCode.trim(),
        proofFile,
        notes: paymentNotes.trim()
      });

      setProofFile(null);
      setProofPreview(null);
      setReferenceCode('');
      setPaymentNotes('');
      setShowPaymentForm(false);
      setSuccessBanner('Comprovativo de pagamento submetido com sucesso! A Direção Financeira foi notificada para validação.');

      await loadData();
      if (refreshProfile) await refreshProfile();

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    } catch (err) {
      console.error('Erro ao submeter comprovativo de pagamento:', err);
      setErrorMsg(err.message || 'Falha ao submeter comprovativo de pagamento.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Determinar visualização principal
  const hasPendingRequest = activeRequest && (activeRequest.status === 'pendente' || activeRequest.status === 'em_analise');
  const hasAwaitingPayment = activeRequest && activeRequest.status === 'aprovada_aguardando_pagamento';
  const isLockedByActiveCourse = !activeRequest && (!updateEligibility?.canRequestUpdate && updateEligibility?.reason === 'curso_em_andamento');
  const isFormEligible = !activeRequest && (updateEligibility?.canRequestUpdate || false);

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* CABEÇALHO */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SECRETARIA VIRTUAL
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
              Processo Oficial
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
            Atualização de Curso
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
            Solicite a mudança ou transição do seu percurso formativo com análise direta da Direção Académica.
          </p>
        </div>

        {/* FEEDBACK DE SUCESSO */}
        {successBanner && (
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10B981',
            color: '#A7F3D0',
            fontSize: '0.885rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
            <span>{successBanner}</span>
          </div>
        )}

        {/* FEEDBACK DE ERRO */}
        {errorMsg && (
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid #EF4444',
            color: '#FCA5A5',
            fontSize: '0.885rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CENÁRIO 1: SOLICITAÇÃO PENDENTE DE AVALIAÇÃO */}
        {hasPendingRequest && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(0, 24, 48, 0.9) 100%)',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={26} color="#F59E0B" />
              </div>
              <div>
                <span className="badge badge-warning" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Solicitação em Avaliação Pela Direção
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#FFFFFF', margin: '0.2rem 0 0 0' }}>
                  Pedido de Atualização em Análise
                </h2>
              </div>
            </div>

            <p style={{ color: '#FEF3C7', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              A sua solicitação para o curso <strong>"{activeRequest.new_course_title}"</strong> foi recebida em <strong>{formatDateTime(activeRequest.created_at)}</strong> e encontra-se sob avaliação da Direção Académica. O formulário de seleção permanecerá encerrado até à conclusão desta avaliação.
            </p>

            {/* TABELA DE DETALHES DO PEDIDO PENDENTE */}
            <div style={{
              background: 'rgba(0, 18, 36, 0.85)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.825rem'
            }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Curso Anterior / Atual</span>
                <strong style={{ color: '#CBD5E1', display: 'block', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                  {activeRequest.previous_course_title || 'Sem curso anterior'}
                </strong>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Novo Curso Solicitado</span>
                <strong style={{ color: '#F59E0B', display: 'block', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                  {activeRequest.new_course_title}
                </strong>
                <span style={{ color: '#FDE68A', fontSize: '0.74rem' }}>
                  Carga: {activeRequest.new_course_workload || 60}h • {activeRequest.new_course_duration || '3 Meses'}
                </span>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Data & Hora de Envio</span>
                <strong style={{ color: '#FFFFFF', display: 'block', marginTop: '0.15rem' }}>
                  {formatDateTime(activeRequest.created_at)}
                </strong>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Estado Oficial</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                    Pendente de Avaliação
                  </span>
                </div>
              </div>
            </div>

            {activeRequest.reason && (
              <div style={{ marginTop: '1rem', color: '#CBD5E1', fontSize: '0.82rem' }}>
                <span style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.72rem' }}>Justificativa Apresentada:</span>
                <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic' }}>"{activeRequest.reason}"</p>
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Link to="/estudante/cursos" className="btn btn-secondary btn-sm">
                Voltar aos Meus Cursos
              </Link>
            </div>
          </div>
        )}

        {/* CENÁRIO 2: SOLICITAÇÃO APROVADA - PAGAMENTO DENTRO DO PRÓPRIO MÓDULO (REQUISITO 2) */}
        {hasAwaitingPayment && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(0, 24, 48, 0.96) 100%)',
            border: '2px solid #00C7FD',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 28px rgba(0, 199, 253, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(0, 199, 253, 0.25)',
                border: '1.5px solid #00C7FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CreditCard size={26} color="#00C7FD" />
              </div>
              <div>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Parecer Favorável da Direção Académica
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#FFFFFF', margin: '0.2rem 0 0 0' }}>
                  Solicitação Aprovada! Efetue a Liquidação para Liberar o Curso
                </h2>
              </div>
            </div>

            <p style={{ color: '#BAE6FD', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              A sua solicitação de atualização para o curso <strong>"{activeRequest.new_course_title}"</strong> foi <strong>aprovada pela Direção</strong>. Para concluir a ativação do seu percurso e liberar o acesso total aos módulos, submeta o comprovativo de pagamento abaixo.
            </p>

            {/* CARD COM VALOR E CONTAS OFICIAIS */}
            <div style={{
              background: 'rgba(0, 18, 36, 0.9)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', textTransform: 'uppercase' }}>Novo Curso Solicitado</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '1.1rem', display: 'block' }}>{activeRequest.new_course_title}</strong>
                  <span style={{ color: '#00C7FD', fontSize: '0.76rem' }}>
                    Carga: {activeRequest.new_course_workload || 60}h • {activeRequest.new_course_duration || '3 Meses'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', textTransform: 'uppercase' }}>Valor da Formação</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#00C7FD' }}>
                    {formatCurrency(activeRequest.new_course_price)}
                  </div>
                </div>
              </div>

              {activeRequest.admin_notes && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.25)', marginBottom: '1rem', fontSize: '0.8rem', color: '#BAE6FD' }}>
                  <strong>Observações da Direção:</strong> {activeRequest.admin_notes}
                </div>
              )}

              {/* Contas Institucionais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', fontSize: '0.825rem' }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <span style={{ color: '#EF4444', fontWeight: '700', display: 'block' }}>Vodacom M-Pesa</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>849 301 280</strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', display: 'block' }}>Titular: Zaty Academy</span>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <span style={{ color: '#F59E0B', fontWeight: '700', display: 'block' }}>Movitel e-Mola</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>878 473 060</strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', display: 'block' }}>Titular: Zaty Academy</span>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(0, 199, 253, 0.25)' }}>
                  <span style={{ color: '#00C7FD', fontWeight: '700', display: 'block' }}>Millennium BIM</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>Conta: 4001234567</strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', display: 'block' }}>Titular: Zaty Academy</span>
                </div>
              </div>
            </div>

            {/* ESTADO DO COMPROVATIVO */}
            {activeRequest.payment_status === 'em_analise' && !showPaymentForm && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid #10B981',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1rem',
                color: '#A7F3D0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={24} color="#10B981" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#FFFFFF' }}>
                        Comprovativo Submetido com Sucesso
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#D1FAE5' }}>
                        O seu comprovativo (Ref: <strong>{activeRequest.payment_reference_code || 'Registada'}</strong>) está sob verificação da Secretaria Financeira. Assim que validado, o novo curso será ativado de imediato.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {activeRequest.payment_proof_url && (
                      <a 
                        href={activeRequest.payment_proof_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                      >
                        <ExternalLink size={13} />
                        <span>Ver Recibo Anexado</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Substituir Comprovativo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CASO O PAGAMENTO TENHA SIDO REJEITADO */}
            {activeRequest.payment_status === 'rejeitado' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1.5px solid #EF4444',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                color: '#FCA5A5',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <AlertCircle size={18} color="#EF4444" />
                  <span>Comprovativo de Pagamento Anterior Não Validado</span>
                </div>
                <p style={{ margin: 0, color: '#FEE2E2' }}>
                  A Direção solicitou o reenvio de um comprovativo válido. Por favor anexe novamente abaixo a confirmação de liquidação.
                </p>
              </div>
            )}

            {/* FORMULÁRIO DE ENVIO DO COMPROVATIVO */}
            {(showPaymentForm || activeRequest.payment_status === 'pendente' || activeRequest.payment_status === 'rejeitado') && (
              <form onSubmit={handlePaymentSubmit} style={{
                background: 'rgba(0, 18, 36, 0.85)',
                border: '1px solid rgba(0, 199, 253, 0.25)',
                borderRadius: '8px',
                padding: '1.25rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={17} color="#00C7FD" />
                  Submeter Comprovativo de Pagamento
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {/* Método de Pagamento */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                      Método Utilizado *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-select"
                      style={{ fontSize: '0.85rem' }}
                      required
                    >
                      <option value="mpesa">Vodacom M-Pesa</option>
                      <option value="emola">Movitel e-Mola</option>
                      <option value="bim">Millennium BIM (Transferência)</option>
                      <option value="outro">Outro Banco / Depósito</option>
                    </select>
                  </div>

                  {/* Referência da Transação */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                      Referência / Nº da Transação *
                    </label>
                    <input
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Ex: 849301280 ou TRX-889412"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>

                {/* Upload de Comprovativo */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                    Anexar Comprovativo (Foto, Screenshot ou PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="form-input"
                    style={{ fontSize: '0.825rem', padding: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                    * Formatos suportados: JPG, PNG, WEBP ou PDF (máx. 10 MB).
                  </span>
                </div>

                {proofPreview && (
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <img 
                      src={proofPreview} 
                      alt="Pré-visualização do Comprovativo" 
                      style={{ maxHeight: '180px', borderRadius: '6px', border: '1px solid rgba(0, 199, 253, 0.4)' }} 
                    />
                  </div>
                )}

                {/* Observações Opcionais */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    Observações Adicionais (Opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Pago pelo titular Orlando Orjona às 14:30"
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {activeRequest.payment_status === 'em_analise' && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submittingPayment || !referenceCode.trim()}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}
                  >
                    <Check size={16} />
                    <span>{submittingPayment ? 'A Submeter Comprovativo...' : 'Confirmar e Enviar Comprovativo'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* CENÁRIO 3: BLOQUEIO COM CURSO EM ANDAMENTO (REQUISITOS 3 & 4) */}
        {isLockedByActiveCourse && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 32, 60, 0.95) 0%, rgba(0, 18, 36, 0.98) 100%)',
            border: '2px solid rgba(0, 199, 253, 0.4)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(0, 199, 253, 0.2)',
                border: '1.5px solid #00C7FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <GraduationCap size={26} color="#00C7FD" />
              </div>
              <div>
                <span className="badge badge-success" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  Matrícula Ativa & Em Frequência
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', margin: '0.2rem 0 0 0' }}>
                  Percurso Académico em Andamento
                </h2>
              </div>
            </div>

            {/* CARD DO CURSO ATIVO */}
            <div style={{
              background: 'rgba(0, 24, 48, 0.75)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 163, 224, 0.25)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Curso Ativo</span>
                <strong style={{ color: '#38BDF8', display: 'block', fontSize: '1.1rem', marginTop: '0.2rem' }}>
                  {updateEligibility?.activeCourse?.title || currentCourse?.title || 'Formação em Andamento'}
                </strong>
                <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>
                  Carga Horária: {updateEligibility?.activeCourse?.workload_hours || 60} Horas
                </span>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Estado da Matrícula</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.76rem', fontWeight: '700' }}>
                    Ativo (Regular)
                  </span>
                </div>
                <span style={{ color: '#6EE7B7', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>
                  Aulas e conteúdos liberados
                </span>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Estudante Matriculado</span>
                <strong style={{ color: '#FFFFFF', display: 'block', marginTop: '0.2rem' }}>
                  {student?.full_name}
                </strong>
                <span style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  Código: {student?.student_code || student?.student_number || 'ZA'}
                </span>
              </div>
            </div>

            {/* MENSAGEM PEDAGÓGICA INSTITUCIONAL (REQUISITO 4) */}
            <div style={{
              background: 'rgba(0, 114, 206, 0.12)',
              border: '1px solid rgba(0, 199, 253, 0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              fontSize: '0.885rem',
              color: '#BAE6FD',
              lineHeight: 1.6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', color: '#00C7FD', marginBottom: '0.4rem' }}>
                <ShieldCheck size={18} />
                <span>Norma Académica de Transição Curricular</span>
              </div>
              <p style={{ margin: 0 }}>
                O estudante encontra-se atualmente a frequentar a formação <strong>"{updateEligibility?.activeCourse?.title || currentCourse?.title}"</strong>. Conforme o regulamento pedagógico da Zaty Academy, a atualização ou transição para uma nova formação só é permitida após a <strong>conclusão com aproveitamento e emissão do respetivo certificado oficial</strong> da formação em curso.
              </p>
              <span style={{ display: 'block', marginTop: '0.65rem', fontSize: '0.8rem', color: '#94A3B8' }}>
                * O formulário de solicitação de novos cursos encontra-se encerrado durante a frequência ativa do curso atual.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Link to="/estudante/certificados" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={15} />
                <span>Meus Certificados</span>
              </Link>
              <Link to="/estudante/cursos" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} />
                <span>Aceder às Aulas do Meu Curso</span>
              </Link>
            </div>
          </div>
        )}

        {/* CENÁRIO 4: FORMULÁRIO DE NOVA SOLICITAÇÃO (QUANDO ELEGÍVEL) */}
        {isFormEligible && (
          <form onSubmit={handleConfirmSubmit}>
            {/* ÚLTIMA REJEIÇÃO SE HOUVER */}
            {activeRequest?.status === 'rejeitada' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: '#FCA5A5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  <Ban size={16} color="#EF4444" />
                  <span>A sua solicitação anterior foi indeferida pela Direção</span>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', color: '#FEE2E2' }}>
                  Motivo: {activeRequest.rejection_reason || 'Não cumpre os requisitos curriculares.'}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'block', marginTop: '0.4rem' }}>
                  Você pode selecionar outro curso e submeter uma nova solicitação abaixo.
                </span>
              </div>
            )}

            {/* SEÇÃO 1: IDENTIFICAÇÃO DO ESTUDANTE & CURSO CONCLUÍDO */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="#00C7FD" />
                1. Identificação do Estudante & Percurso Curricular
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
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Formação Anterior Concluída</span>
                  <strong style={{ color: '#34D399', fontSize: '1rem', display: 'block', marginTop: '0.2rem' }}>
                    {currentCourse?.title || 'Formação Zaty Academy'}
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.76rem' }}>
                    Elegível para novo percurso formativo
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.65)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Data & Hora Atual</span>
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
                    const activeCrs = currentCourseData || currentCourse;
                    const isCurrent = activeCrs?.id === course.id;
                    const elig = eligibilityMap[course.id];
                    const isCompleted = elig?.isCompleted || false;

                    let labelExtra = '';
                    if (isCurrent) labelExtra = ' [CURSO ATUAL]';
                    else if (isCompleted) labelExtra = ' [CONCLUÍDO & CERTIFICADO - BLOQUEADO]';

                    return (
                      <option
                        key={course.id}
                        value={course.id}
                        disabled={isCurrent || isCompleted}
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
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Nova Formação Escolhida
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#FFFFFF', marginTop: '0.25rem' }}>
                        {selectedCourseData.title}
                      </h3>
                      <p style={{ color: '#BAE6FD', fontSize: '0.85rem', margin: '0.3rem 0 0 0', maxWidth: '600px' }}>
                        {selectedCourseData.description || 'Formação profissional certificada pela Zaty Academy.'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Valor do Curso</span>
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

              {/* Justificativa / Observações */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Motivo da Atualização (Será avaliado pela Direção Académica):
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

            {/* SEÇÃO 3: INFORMAÇÕES SOBRE O FLUXO INSTITUCIONAL */}
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
                    Como Funciona o Processo de Atualização de Curso?
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                    Processo regulamentar para garantia de rigor pedagógico e histórico curricular.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                fontSize: '0.825rem',
                color: '#CBD5E1',
                lineHeight: 1.5
              }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    1. Envio da Solicitação
                  </strong>
                  Ao submeter o formulário, o seu pedido passa ao estado <strong>Pendente</strong> e a Administração é notificada em tempo real.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    2. Avaliação da Direção
                  </strong>
                  A Direção avalia a sua solicitação. Caso aprovada, se o curso exigir propina, você poderá submeter o comprovativo <strong>aqui mesmo no módulo</strong>.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    3. Liberação Definitiva
                  </strong>
                  Após a validação financeira, a matrícula no novo curso é ativada e você ganha <strong>acesso total aos módulos e aulas</strong>.
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.6)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '0.25rem' }}>
                    4. Encerramento do Formulário
                  </strong>
                  Uma vez matriculado e a frequentar o novo curso, o formulário de atualização é automaticamente encerrado.
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: BOTÕES DE CONFIRMAÇÃO */}
            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Estado:</span>
                <span className="badge badge-info" style={{ fontWeight: '700', fontSize: '0.75rem' }}>
                  {submitting ? 'A Submeter...' : 'Pronto para Enviar'}
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
                  <span>{submitting ? 'A Submeter Solicitação...' : 'Submeter Solicitação de Atualização'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* CENÁRIO 5: HISTÓRICO DE ATUALIZAÇÕES DE CURSO DO ESTUDANTE */}
        {requestHistory.length > 0 && (
          <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#00C7FD" />
              Histórico de Solicitações de Atualização
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 32, 60, 0.85)', textAlign: 'left', borderBottom: '1px solid rgba(0, 163, 224, 0.25)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#BAE6FD', textTransform: 'uppercase', fontSize: '0.72rem' }}>Data & Hora</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#BAE6FD', textTransform: 'uppercase', fontSize: '0.72rem' }}>Curso Solicitado</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#BAE6FD', textTransform: 'uppercase', fontSize: '0.72rem' }}>Valor</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#BAE6FD', textTransform: 'uppercase', fontSize: '0.72rem' }}>Estado</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#BAE6FD', textTransform: 'uppercase', fontSize: '0.72rem' }}>Notas da Direção</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(0, 163, 224, 0.12)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#CBD5E1' }}>
                        {formatDateTime(req.created_at)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#FFFFFF', display: 'block' }}>{req.new_course_title}</strong>
                        {req.previous_course_title && (
                          <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                            Anterior: {req.previous_course_title}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#00C7FD', fontWeight: '700' }}>
                        {Number(req.new_course_price) > 0 ? formatCurrency(req.new_course_price) : 'Gratuito'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {req.status === 'pendente' && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pendente</span>}
                        {req.status === 'aprovada_aguardando_pagamento' && (
                          req.payment_status === 'em_analise' 
                            ? <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Pagamento em Análise</span>
                            : <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Aguardando Pagamento</span>
                        )}
                        {req.status === 'concluido' && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Concluída / Matriculado</span>}
                        {req.status === 'rejeitada' && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Rejeitada</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                        {req.rejection_reason || req.admin_notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

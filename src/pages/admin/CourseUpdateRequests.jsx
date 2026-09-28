import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  getCourseUpdateRequests, 
  reviewCourseUpdateRequest, 
  confirmCourseUpdatePaymentAndActivate 
} from '../../services/api';
import { subscribeToCourseUpdates } from '../../services/realtimeService';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Search, 
  Filter, 
  User, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  X, 
  Check, 
  Ban, 
  ChevronRight,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

export default function CourseUpdateRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');

  // Modal de Avaliação
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'approve' | 'reject' | 'confirm_payment'
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getCourseUpdateRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações de atualização de curso:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();

    // Escuta em tempo real eventos de atualização de curso
    const sub = subscribeToCourseUpdates(() => {
      loadRequests(true);
    });

    const interval = setInterval(() => loadRequests(true), 15000);

    return () => {
      if (sub?.unsubscribe) sub.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleOpenReviewModal = (req, mode = 'view') => {
    setSelectedRequest(req);
    setModalMode(mode);
    setAdminNotes(req.admin_notes || '');
    setRejectionReason(req.rejection_reason || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalMode('view');
    setAdminNotes('');
    setRejectionReason('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleExecuteDecision = async (decision) => {
    if (!selectedRequest) return;
    if (decision === 'rejeitar' && !rejectionReason.trim()) {
      return setErrorMsg('Por favor, informe o motivo institucional da rejeição.');
    }

    setSubmittingDecision(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await reviewCourseUpdateRequest({
        requestId: selectedRequest.id,
        studentId: selectedRequest.student_id,
        decision,
        adminNotes: adminNotes.trim(),
        rejectionReason: rejectionReason.trim(),
        adminUserId: user?.id
      });

      setSuccessMsg(
        decision === 'aprovar' 
          ? (Number(selectedRequest.new_course_price) > 0 ? 'Solicitação aprovada! Aguardando confirmação do pagamento.' : 'Solicitação aprovada e acesso liberado com sucesso!')
          : decision === 'confirmar_pagamento_e_ativar'
          ? 'Pagamento confirmado! Acesso total ao curso liberado para o estudante.'
          : 'Solicitação rejeitada com sucesso.'
      );

      await loadRequests(true);
      setTimeout(() => {
        handleCloseModal();
      }, 1600);
    } catch (err) {
      console.error('Erro ao avaliar solicitação:', err);
      setErrorMsg(err.message || 'Falha ao processar operação.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Estatísticas Rápidas
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pendente' || r.status === 'em_analise').length;
  const awaitingPaymentCount = requests.filter(r => r.status === 'aprovada_aguardando_pagamento').length;
  const completedCount = requests.filter(r => r.status === 'concluido').length;
  const rejectedCount = requests.filter(r => r.status === 'rejeitada').length;

  // Filtragem
  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'todas' || r.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      (r.student_name && r.student_name.toLowerCase().includes(term)) ||
      (r.student_code && r.student_code.toLowerCase().includes(term)) ||
      (r.new_course_title && r.new_course_title.toLowerCase().includes(term)) ||
      (r.previous_course_title && r.previous_course_title.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendente':
      case 'em_analise':
        return <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Pendente</span>;
      case 'aprovada_aguardando_pagamento':
        return <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Aprovada (Aguardando Pagamento)</span>;
      case 'concluido':
        return <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Concluída / Acesso Ativo</span>;
      case 'rejeitada':
        return <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>Rejeitada</span>;
      default:
        return <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>{status}</span>;
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* CABEÇALHO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ADMINISTRAÇÃO ACADÉMICA
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                Tempo Real
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
              Solicitações de Atualização de Curso
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
              Avalie, aprove ou rejeite solicitações de transição de percurso académico feitas pelos estudantes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadRequests(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'A atualizar...' : 'Atualizar Lista'}</span>
          </button>
        </div>

        {/* CARDS DE RESUMO DE KPI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* TOTAL */}
          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' }}>
              Total de Pedidos
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#FFFFFF', marginTop: '0.25rem' }}>
              {totalCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#00C7FD' }}>Registos históricos</span>
          </div>

          {/* PENDENTES */}
          <div className="glass-card" style={{ padding: '1.15rem', borderLeft: '3px solid #F59E0B' }}>
            <span style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: '700' }}>
              Pendentes de Análise
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#F59E0B', marginTop: '0.25rem' }}>
              {pendingCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>Aguardando Direção</span>
          </div>

          {/* AGUARDANDO PAGAMENTO */}
          <div className="glass-card" style={{ padding: '1.15rem', borderLeft: '3px solid #38BDF8' }}>
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: '700' }}>
              Aguardando Pagamento
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#38BDF8', marginTop: '0.25rem' }}>
              {awaitingPaymentCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Aprovadas c/ taxa</span>
          </div>

          {/* CONCLUÍDAS */}
          <div className="glass-card" style={{ padding: '1.15rem', borderLeft: '3px solid #10B981' }}>
            <span style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase', fontWeight: '700' }}>
              Concluídas / Ativas
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#10B981', marginTop: '0.25rem' }}>
              {completedCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#6EE7B7' }}>Acesso liberado</span>
          </div>

          {/* REJEITADAS */}
          <div className="glass-card" style={{ padding: '1.15rem', borderLeft: '3px solid #EF4444' }}>
            <span style={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: '700' }}>
              Rejeitadas
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#EF4444', marginTop: '0.25rem' }}>
              {rejectedCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: '#FCA5A5' }}>Indeferidas</span>
          </div>
        </div>

        {/* BARRA DE PESQUISA & ABAS DE FILTRO */}
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Input de busca */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estudante, código ou curso..."
                className="form-input"
                style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Abas de Filtro */}
            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto' }}>
              {[
                { key: 'todas', label: `Todas (${totalCount})` },
                { key: 'pendente', label: `Pendentes (${pendingCount})` },
                { key: 'aprovada_aguardando_pagamento', label: `Aguardando Pagamento (${awaitingPaymentCount})` },
                { key: 'concluido', label: `Concluídas (${completedCount})` },
                { key: 'rejeitada', label: `Rejeitadas (${rejectedCount})` }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: statusFilter === f.key ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.2)',
                    background: statusFilter === f.key ? 'rgba(0, 199, 253, 0.2)' : 'rgba(0, 24, 48, 0.65)',
                    color: statusFilter === f.key ? '#FFFFFF' : '#94A3B8',
                    fontSize: '0.78rem',
                    fontWeight: statusFilter === f.key ? '700' : '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABELA DE SOLICITAÇÕES */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
              <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(0, 199, 253, 0.2)', borderTopColor: '#00C7FD', borderRadius: '50%', margin: '0 auto 0.75rem auto' }} />
              A carregar solicitações de atualização de curso...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
              <RotateCcw size={36} color="#64748B" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#E2E8F0', fontWeight: '700' }}>
                Nenhuma solicitação encontrada
              </p>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {searchTerm || statusFilter !== 'todas' ? 'Tente alterar os termos da busca ou filtros selecionados.' : 'Nenhum estudante solicitou atualização até ao momento.'}
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 32, 60, 0.85)', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      Estudante
                    </th>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      Curso Anterior
                    </th>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      Novo Curso Solicitado
                    </th>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      Data & Hora
                    </th>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      Estado
                    </th>
                    <th style={{ padding: '0.85rem 1rem', color: '#BAE6FD', fontWeight: '700', fontSize: '0.76rem', textTransform: 'uppercase', textAlign: 'right' }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const isPending = req.status === 'pendente' || req.status === 'em_analise';
                    const isAwaitingPay = req.status === 'aprovada_aguardando_pagamento';

                    return (
                      <tr 
                        key={req.id}
                        style={{ borderBottom: '1px solid rgba(0, 163, 224, 0.12)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 199, 253, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Estudante */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <strong style={{ color: '#FFFFFF', display: 'block', fontSize: '0.9rem' }}>
                            {req.student_name}
                          </strong>
                          <span style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                            Código: {req.student_code}
                          </span>
                          {req.student_phone && (
                            <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>
                              Tel: {req.student_phone}
                            </span>
                          )}
                        </td>

                        {/* Curso Anterior */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{ color: '#CBD5E1', display: 'block' }}>
                            {req.previous_course_title || 'Sem curso anterior'}
                          </span>
                        </td>

                        {/* Novo Curso */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <strong style={{ color: '#34D399', display: 'block' }}>
                            {req.new_course_title}
                          </strong>
                          <span style={{ color: '#94A3B8', fontSize: '0.74rem' }}>
                            Valor: {Number(req.new_course_price) > 0 ? formatCurrency(req.new_course_price) : 'Gratuito / Isento'}
                          </span>
                        </td>

                        {/* Data e Hora */}
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#E2E8F0', display: 'block', fontSize: '0.82rem' }}>
                            {formatDateTime(req.created_at)}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {getStatusBadge(req.status)}
                        </td>

                        {/* Ações */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(req, 'approve')}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                                >
                                  <Check size={13} />
                                  <span>Aprovar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(req, 'reject')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#FCA5A5' }}
                                >
                                  <Ban size={13} />
                                  <span>Rejeitar</span>
                                </button>
                              </>
                            )}

                            {isAwaitingPay && (
                              <button
                                type="button"
                                onClick={() => handleOpenReviewModal(req, 'confirm_payment')}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', background: 'linear-gradient(135deg, #10B981, #059669)', borderColor: '#10B981' }}
                              >
                                <CreditCard size={13} />
                                <span>Confirmar Pagamento</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(req, 'view')}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                              title="Ver Detalhes"
                            >
                              <FileText size={13} />
                              <span>Detalhes</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL DE AVALIAÇÃO / DETALHES */}
        {selectedRequest && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 10, 25, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            zIndex: 1100
          }}>
            <div style={{
              background: 'rgba(0, 24, 48, 0.98)',
              border: '1.5px solid rgba(0, 199, 253, 0.35)',
              borderRadius: '12px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
            }}>
              {/* Topo do Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Dossiê de Atualização de Curso
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFFFF', marginTop: '0.3rem' }}>
                    {modalMode === 'approve' ? 'Aprovar Solicitação de Curso' : 
                     modalMode === 'reject' ? 'Rejeitar Solicitação de Curso' : 
                     modalMode === 'confirm_payment' ? 'Confirmar Pagamento e Liberar Acesso' : 
                     'Detalhes da Solicitação'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mensagens de Feedback */}
              {errorMsg && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {successMsg}
                </div>
              )}

              {/* Dados do Estudante & Curso */}
              <div style={{ background: 'rgba(0, 18, 36, 0.75)', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Estudante</span>
                    <strong style={{ color: '#FFFFFF', display: 'block', fontSize: '0.9rem' }}>{selectedRequest?.student_name || 'Estudante'}</strong>
                    <span style={{ color: '#00C7FD', fontFamily: 'monospace' }}>Código: {selectedRequest?.student_code || 'ZA'}</span>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Data & Hora do Pedido</span>
                    <strong style={{ color: '#FFFFFF', display: 'block' }}>{formatDateTime(selectedRequest?.created_at)}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Curso Anterior</span>
                    <strong style={{ color: '#CBD5E1', display: 'block' }}>{selectedRequest?.previous_course_title || 'Nenhum'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Novo Curso Solicitado</span>
                    <strong style={{ color: '#34D399', display: 'block' }}>{selectedRequest?.new_course_title || 'Curso'}</strong>
                    <span style={{ color: '#6EE7B7', fontSize: '0.74rem' }}>
                      Valor: {Number(selectedRequest?.new_course_price) > 0 ? formatCurrency(selectedRequest?.new_course_price) : 'Gratuito / Isento'}
                    </span>
                  </div>
                </div>

                {selectedRequest?.reason && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 163, 224, 0.15)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Justificativa do Estudante</span>
                    <p style={{ color: '#E2E8F0', fontSize: '0.82rem', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                      "{selectedRequest.reason}"
                    </p>
                  </div>
                )}
              </div>

              {/* FORMULÁRIO DE DECISÃO */}
              {modalMode === 'approve' && (
                <div>
                  <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.3)', marginBottom: '1rem', fontSize: '0.82rem', color: '#BAE6FD', lineHeight: 1.4 }}>
                    <Info size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#00C7FD' }} />
                    {Number(selectedRequest?.new_course_price) > 0 ? (
                      <span>
                        Este curso tem o valor de <strong>{formatCurrency(selectedRequest?.new_course_price)}</strong>. Ao aprovar, o sistema notificará o estudante solicitando o respetivo pagamento. A liberação definitiva do percurso será efetuada após a validação do comprovativo financeiro.
                      </span>
                    ) : (
                      <span>
                        Este curso é isento de custos de propina. Ao aprovar, o estudante receberá imediatamente acesso total aos módulos e aulas.
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      Observações Pedagógicas da Direção (Opcional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ex: Turma da manhã alocada. Contacte a secretaria para entrega de manuais."
                      className="form-textarea"
                      rows={3}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary" disabled={submittingDecision}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecuteDecision('aprovar')}
                      className="btn btn-primary"
                      disabled={submittingDecision}
                    >
                      {submittingDecision ? 'A processar...' : 'Confirmar Aprovação'}
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'reject' && (
                <div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', color: '#FCA5A5' }}>
                      Motivo Oficial da Não Aprovação *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ex: Não cumpre os pré-requisitos curriculares para ingressar neste nível avançado..."
                      className="form-textarea"
                      rows={3}
                      style={{ fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.5)' }}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                      * Esta justificativa será enviada para o painel de notificações do estudante.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary" disabled={submittingDecision}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecuteDecision('rejeitar')}
                      className="btn btn-secondary"
                      style={{ background: '#EF4444', borderColor: '#DC2626', color: '#FFFFFF' }}
                      disabled={submittingDecision}
                    >
                      {submittingDecision ? 'A processar...' : 'Confirmar Rejeição'}
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'confirm_payment' && (
                <div>
                  <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', marginBottom: '1rem', fontSize: '0.82rem', color: '#A7F3D0', lineHeight: 1.4 }}>
                    <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#10B981' }} />
                    Ao confirmar o pagamento da formação ({formatCurrency(selectedRequest?.new_course_price)}), a matrícula anterior será arquivada como "Transferido" e a nova formação será <strong>imediatamente ativada</strong>. O estudante receberá a notificação oficial com acesso total liberado.
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      Nota Financeira ou Recibo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ex: Liquidado via M-Pesa ref. 84930128"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary" disabled={submittingDecision}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecuteDecision('confirmar_pagamento_e_ativar')}
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderColor: '#10B981' }}
                      disabled={submittingDecision}
                    >
                      {submittingDecision ? 'A ativar acesso...' : 'Confirmar Pagamento e Ativar Curso'}
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'view' && (
                <div>
                  {selectedRequest?.admin_notes && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Notas da Administração</span>
                      <p style={{ color: '#E2E8F0', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{selectedRequest.admin_notes}</p>
                    </div>
                  )}

                  {selectedRequest?.rejection_reason && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: '#FCA5A5', fontSize: '0.72rem', textTransform: 'uppercase' }}>Motivo da Rejeição</span>
                      <p style={{ color: '#EF4444', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{selectedRequest.rejection_reason}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    {(selectedRequest?.status === 'pendente' || selectedRequest?.status === 'em_analise') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalMode('approve')}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={14} />
                          <span>Aprovar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalMode('reject')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#FCA5A5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        >
                          <Ban size={14} />
                          <span>Rejeitar</span>
                        </button>
                      </>
                    )}

                    {selectedRequest?.status === 'aprovada_aguardando_pagamento' && (
                      <button
                        type="button"
                        onClick={() => setModalMode('confirm_payment')}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#10B981', borderColor: '#10B981' }}
                      >
                        <CreditCard size={14} />
                        <span>Confirmar Pagamento</span>
                      </button>
                    )}

                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary btn-sm">
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

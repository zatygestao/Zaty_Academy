import { useState, useEffect } from 'react';
import { 
  getStudents, 
  reviewEnrollment, 
  suspendStudent, 
  reactivateStudent,
  deleteStudentPermanently 
} from '../../services/api';
import { subscribeToCourseUpdates } from '../../services/realtimeService';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StudentDetailsModal from '../../components/admin/StudentDetailsModal';
import Modal from '../../components/common/Modal';
import SelectDropdown from '../../components/common/SelectDropdown';
import { formatDate, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  Users, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Check, 
  AlertCircle,
  Filter,
  Ban,
  RotateCcw,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function StudentsManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [count, setCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Estado para modal de rejeição rápida
  const [rejectingStudent, setRejectingStudent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Estado para modal de suspensão
  const [suspendingStudent, setSuspendingStudent] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Estado para modal de remoção permanente
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    const targetName = deletingStudent.full_name;
    setIsDeleting(true);
    try {
      await deleteStudentPermanently(deletingStudent.id);
      showToast(`Estudante ${targetName} e respetiva conta de acesso foram removidos permanentemente.`, 'success');
      setDeletingStudent(null);
      setDeleteConfirmInput('');
      await fetchStudents();
    } catch (err) {
      console.error('Erro ao remover estudante permanentemente:', err);
      showToast('Falha ao remover estudante: ' + (err?.message || 'Erro de integridade'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [res, pendingRes, suspendedRes] = await Promise.all([
        getStudents({
          search: search.trim(),
          status: statusFilter
        }),
        getStudents({ status: 'pendente', limit: 1 }),
        getStudents({ status: 'suspenso', limit: 1 })
      ]);
      setStudents(res.students || []);
      setCount(res.count || 0);
      setPendingCount(pendingRes.count || 0);
      setSuspendedCount(suspendedRes.count || 0);
    } catch (err) {
      console.error('Erro ao buscar estudantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Escuta atualizações de curso em tempo real e atualiza a tabela instantaneamente
  useEffect(() => {
    const unsubscribe = subscribeToCourseUpdates((payload) => {
      fetchStudents();
      if (payload) {
        showToast(
          `O estudante ${payload.studentName || 'Estudante'} atualizou o curso de ${payload.previousCourseTitle || 'curso anterior'} para ${payload.newCourseTitle || 'novo curso'}.`,
          'info'
        );
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Aprovação rápida de inscrição
  const handleQuickApprove = async (student) => {
    if (!window.confirm(`Tem certeza que deseja aprovar a inscrição de ${student.full_name}? O acesso às aulas será liberado.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await reviewEnrollment({
        studentId: student.id,
        enrollmentId: student.enrollments?.[0]?.id,
        status: 'ativo',
        reviewedBy: user?.id
      });
      showToast(`Inscrição de ${student.full_name} aprovada com sucesso!`, 'success');
      await fetchStudents();
    } catch (err) {
      console.error('Erro ao aprovar inscrição:', err);
      showToast('Falha ao aprovar inscrição: ' + (err?.message || 'Erro'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de rejeição
  const handleOpenRejectModal = (student) => {
    setRejectingStudent(student);
    setRejectionReason('');
  };

  // Confirmar rejeição com motivo
  const handleConfirmReject = async () => {
    if (!rejectingStudent) return;
    if (!rejectionReason.trim()) {
      alert('Por favor, indique o motivo da recusa para notificar o estudante.');
      return;
    }
    setActionLoading(true);
    try {
      await reviewEnrollment({
        studentId: rejectingStudent.id,
        enrollmentId: rejectingStudent.enrollments?.[0]?.id,
        status: 'rejeitado',
        rejectionReason: rejectionReason.trim(),
        reviewedBy: user?.id
      });
      showToast(`Inscrição de ${rejectingStudent.full_name} rejeitada. Notificação enviada.`, 'info');
      setRejectingStudent(null);
      setRejectionReason('');
      await fetchStudents();
    } catch (err) {
      console.error('Erro ao rejeitar inscrição:', err);
      showToast('Falha ao rejeitar inscrição: ' + (err?.message || 'Erro'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de suspensão
  const handleOpenSuspendModal = (student) => {
    setSuspendingStudent(student);
    setSuspensionReason('');
  };

  // Confirmar suspensão com motivo
  const handleConfirmSuspend = async () => {
    if (!suspendingStudent) return;
    if (!suspensionReason.trim()) {
      alert('Por favor, indique a justificativa da suspensão de conta.');
      return;
    }
    setActionLoading(true);
    try {
      await suspendStudent({
        studentId: suspendingStudent.id,
        reason: suspensionReason.trim(),
        suspendedBy: user?.id
      });
      showToast(`Conta de ${suspendingStudent.full_name} suspensa com sucesso.`, 'info');
      setSuspendingStudent(null);
      setSuspensionReason('');
      await fetchStudents();
    } catch (err) {
      console.error('Erro ao suspender estudante:', err);
      showToast('Falha ao suspender estudante: ' + (err?.message || 'Erro'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reativação rápida de estudante suspenso
  const handleQuickReactivate = async (student) => {
    if (!window.confirm(`Tem certeza que deseja reativar a conta de ${student.full_name}? O acesso às aulas será restaurado.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await reactivateStudent(student.id, user?.id);
      showToast(`Conta de ${student.full_name} reativada com sucesso!`, 'success');
      await fetchStudents();
    } catch (err) {
      console.error('Erro ao reativar estudante:', err);
      showToast('Falha ao reativar conta: ' + (err?.message || 'Erro'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        
        {/* Toast Notificação */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            background: toastMessage.type === 'success' ? '#10B981' : toastMessage.type === 'error' ? '#EF4444' : '#0072CE',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Gestão de Inscrições & Estudantes
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Validação cadastral, aprovação de novas candidaturas, documentos (BI) e histórico académico.
            </p>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
            Total no filtro: <strong style={{ color: '#00C7FD' }}>{count}</strong>
          </div>
        </div>

        {/* Abas Rápidas por Estado de Inscrição */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <span>Todas as Inscrições</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pendente')}
            className={`btn btn-sm ${statusFilter === 'pendente' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: pendingCount > 0 ? '1px solid rgba(245, 158, 11, 0.6)' : undefined,
              background: statusFilter === 'pendente' ? undefined : (pendingCount > 0 ? 'rgba(245, 158, 11, 0.1)' : undefined)
            }}
          >
            <Clock size={14} color="#F59E0B" />
            <span>Pendentes de Análise</span>
            {pendingCount > 0 && (
              <span style={{
                background: '#F59E0B',
                color: '#000000',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ativo')}
            className={`btn btn-sm ${statusFilter === 'ativo' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <CheckCircle2 size={14} color="#10B981" />
            <span>Aprovadas / Ativas</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejeitado')}
            className={`btn btn-sm ${statusFilter === 'rejeitado' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <XCircle size={14} color="#EF4444" />
            <span>Rejeitadas</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('suspenso')}
            className={`btn btn-sm ${statusFilter === 'suspenso' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              border: suspendedCount > 0 ? '1px solid rgba(239, 68, 68, 0.6)' : undefined,
              background: statusFilter === 'suspenso' ? undefined : (suspendedCount > 0 ? 'rgba(239, 68, 68, 0.1)' : undefined)
            }}
          >
            <Ban size={14} color="#EF4444" />
            <span>Suspensas</span>
            {suspendedCount > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {suspendedCount}
              </span>
            )}
          </button>
        </div>

        {/* Barra de Filtros e Pesquisa */}
        <div className="glass-card" style={{ padding: '1.15rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Pesquisar por nome, código (ZA-...), telefone ou e-mail..." 
              className="form-input" 
            />
          </div>

          <div style={{ width: '220px' }}>
            <SelectDropdown
              options={[
                { value: 'all', label: 'Todos os Estados' },
                { value: 'pendente', label: 'Pendentes' },
                { value: 'ativo', label: 'Ativos' },
                { value: 'rejeitado', label: 'Rejeitados' },
                { value: 'suspenso', label: 'Suspensos' },
                { value: 'concluido', label: 'Concluídos' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Outros Estados"
            />
          </div>
        </div>

        {/* Tabela / Cards de Estudantes */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar inscrições de estudantes...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <Users size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>Nenhuma inscrição encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              {/* Versão Desktop: Tabela */}
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudante</th>
                      <th>Código ID</th>
                      <th>Contacto</th>
                      <th>Curso Inscrito</th>
                      <th>Data Registo</th>
                      <th>Estado</th>
                      <th>Ações de Inscrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const statusInfo = getStatusBadgeInfo(student.enrollment_status);
                      const courseTitle = student.enrollments?.[0]?.course?.title || 'Formação Zaty Academy';
                      const isPending = (student.enrollment_status === 'pendente' || student.status === 'pendente');
                      const isRejected = (student.enrollment_status === 'rejeitado' || student.status === 'rejeitado');
                      const isSuspended = (student.enrollment_status === 'suspenso' || student.status === 'suspenso');

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '4px', overflow: 'hidden', background: '#1E293B', flexShrink: 0, border: '1px solid rgba(0, 163, 224, 0.3)' }}>
                                {student.photo_url ? (
                                  <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700' }}>
                                    {student.full_name?.charAt(0) || 'E'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <strong style={{ color: '#FFFFFF' }}>{student.full_name}</strong>
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                  {student.city}{student.neighborhood ? `, ${student.neighborhood}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD' }}>
                            {student.student_code}
                          </td>
                          <td>
                            <div>{student.phone}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{student.email}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.825rem', color: '#FFFFFF' }}>{courseTitle}</span>
                          </td>
                          <td style={{ fontSize: '0.825rem' }}>{formatDate(student.created_at)}</td>
                          <td>
                            <span className={`badge ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {/* Botão Ver Ficha */}
                              <button 
                                onClick={() => setSelectedStudent(student)} 
                                className="btn btn-secondary btn-sm"
                                title="Consultar ficha cadastral completa, BI e notas"
                                style={{ padding: '0.35rem 0.65rem' }}
                              >
                                <Eye size={13} />
                                <span>Ficha</span>
                              </button>

                              {/* Botão Aprovar Rápido (para pendentes ou reconsiderar rejeitados) */}
                              {(isPending || isRejected) && (
                                <button 
                                  onClick={() => handleQuickApprove(student)} 
                                  disabled={actionLoading}
                                  className="btn btn-sm"
                                  title="Aprovar inscrição imediatamente"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10B981',
                                    color: '#34D399',
                                    padding: '0.35rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Aprovar</span>
                                </button>
                              )}

                              {/* Botão Rejeitar Rápido (para pendentes) */}
                              {isPending && (
                                <button 
                                  onClick={() => handleOpenRejectModal(student)} 
                                  disabled={actionLoading}
                                  className="btn btn-sm"
                                  title="Rejeitar inscrição informando o motivo"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid #EF4444',
                                    color: '#FCA5A5',
                                    padding: '0.35rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <XCircle size={13} />
                                  <span>Rejeitar</span>
                                </button>
                              )}

                              {/* Botão Suspender (para aprovados/ativos) */}
                              {(!isPending && !isRejected && !isSuspended) && (
                                <button 
                                  onClick={() => handleOpenSuspendModal(student)} 
                                  disabled={actionLoading}
                                  className="btn btn-sm"
                                  title="Suspender conta e bloquear acesso do estudante"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#FCA5A5',
                                    padding: '0.35rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <Ban size={13} />
                                  <span>Suspender</span>
                                </button>
                              )}

                              {/* Botão Reativar (para suspensos) */}
                              {isSuspended && (
                                <button 
                                  onClick={() => handleQuickReactivate(student)} 
                                  disabled={actionLoading}
                                  className="btn btn-sm"
                                  title="Reativar acesso do estudante à plataforma"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10B981',
                                    color: '#34D399',
                                    padding: '0.35rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <RotateCcw size={13} />
                                  <span>Reativar</span>
                                </button>
                              )}

                              {/* Botão Remover Permanentemente */}
                              <button 
                                onClick={() => {
                                  setDeletingStudent(student);
                                  setDeleteConfirmInput('');
                                }} 
                                disabled={actionLoading || isDeleting}
                                className="btn btn-sm"
                                title="Remover permanentemente este estudante e sua conta de acesso"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.45)',
                                  color: '#F87171',
                                  padding: '0.35rem 0.65rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Remover</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile: Cards Estruturados */}
              <div className="mobile-only-cards">
                {students.map(student => {
                  const statusInfo = getStatusBadgeInfo(student.enrollment_status);
                  const courseTitle = student.enrollments?.[0]?.course?.title || 'Formação Zaty Academy';
                  const isPending = (student.enrollment_status === 'pendente' || student.status === 'pendente');
                  const isRejected = (student.enrollment_status === 'rejeitado' || student.status === 'rejeitado');
                  const isSuspended = (student.enrollment_status === 'suspenso' || student.status === 'suspenso');

                  return (
                    <div key={student.id} className="mobile-entity-card">
                      <div className="mobile-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', background: '#1E293B', flexShrink: 0, border: '1px solid rgba(0, 163, 224, 0.3)' }}>
                            {student.photo_url ? (
                              <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.85rem', fontWeight: '700' }}>
                                {student.full_name?.charAt(0) || 'E'}
                              </div>
                            )}
                          </div>
                          <div>
                            <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{student.full_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                              {student.city}{student.neighborhood ? `, ${student.neighborhood}` : ''}
                            </div>
                          </div>
                        </div>

                        <span className={`badge ${statusInfo.bg}`} style={{ fontSize: '0.7rem' }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="mobile-card-meta">
                        <div>
                          <span className="meta-label">Código ID</span>
                          <span className="meta-value" style={{ fontFamily: 'monospace', color: '#00C7FD', fontWeight: '700' }}>
                            {student.student_code}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Data de Registo</span>
                          <span className="meta-value">
                            {formatDate(student.created_at)}
                          </span>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span className="meta-label">Curso Inscrito</span>
                          <span className="meta-value" style={{ color: '#FFFFFF' }}>
                            {courseTitle}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Telefone</span>
                          <span className="meta-value">
                            {student.phone || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">E-mail</span>
                          <span className="meta-value" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                            {student.email || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="mobile-card-actions">
                        <button 
                          onClick={() => setSelectedStudent(student)} 
                          className="btn btn-secondary mobile-action-btn"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <Eye size={14} />
                          Ficha Completa
                        </button>

                        {(isPending || isRejected) && (
                          <button 
                            onClick={() => handleQuickApprove(student)} 
                            disabled={actionLoading}
                            className="btn btn-success mobile-action-btn"
                            style={{ fontSize: '0.78rem' }}
                          >
                            <CheckCircle2 size={14} />
                            Aprovar
                          </button>
                        )}

                        {isPending && (
                          <button 
                            onClick={() => handleOpenRejectModal(student)} 
                            disabled={actionLoading}
                            className="btn btn-danger mobile-action-btn"
                            style={{ fontSize: '0.78rem' }}
                          >
                            <XCircle size={14} />
                            Rejeitar
                          </button>
                        )}

                        {(!isPending && !isRejected && !isSuspended) && (
                          <button 
                            onClick={() => handleOpenSuspendModal(student)} 
                            disabled={actionLoading}
                            className="btn btn-outline mobile-action-btn"
                            style={{ fontSize: '0.78rem', color: '#FCA5A5', borderColor: '#EF4444' }}
                          >
                            <Ban size={14} />
                            Suspender
                          </button>
                        )}

                        {isSuspended && (
                          <button 
                            onClick={() => handleQuickReactivate(student)} 
                            disabled={actionLoading}
                            className="btn btn-success mobile-action-btn"
                            style={{ fontSize: '0.78rem' }}
                          >
                            <RotateCcw size={14} />
                            Reativar
                          </button>
                        )}

                        <button 
                          onClick={() => {
                            setDeletingStudent(student);
                            setDeleteConfirmInput('');
                          }} 
                          disabled={actionLoading || isDeleting}
                          className="btn btn-secondary"
                          style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.65rem' }}
                          title="Remover permanentemente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Ficha Completa */}
      <StudentDetailsModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        onUpdated={fetchStudents}
      />

      {/* Modal de Rejeição de Inscrição */}
      {rejectingStudent && (
        <Modal 
          isOpen={true} 
          onClose={() => setRejectingStudent(null)} 
          title="Rejeitar Inscrição de Estudante" 
          maxWidth="520px"
        >
          <div>
            <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginBottom: '1rem', lineHeight: 1.5 }}>
              Você está a rejeitar a inscrição de <strong style={{ color: '#FFFFFF' }}>{rejectingStudent.full_name}</strong> ({rejectingStudent.student_code}).
              O estudante receberá uma notificação no seu painel com a justificativa.
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ color: '#FCA5A5' }}>
                Motivo da Recusa (obrigatório):
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Ex: Documento de identificação (BI) ilegível, dados cadastrais incompletos, ou falta de comprovativo válido."
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setRejectingStudent(null)} 
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmReject} 
                className="btn btn-danger"
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <XCircle size={15} />
                <span>{actionLoading ? 'A processar...' : 'Confirmar Rejeição'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Suspensão de Conta */}
      {suspendingStudent && (
        <Modal 
          isOpen={true} 
          onClose={() => setSuspendingStudent(null)} 
          title="Suspender Acesso de Estudante" 
          maxWidth="520px"
        >
          <div>
            <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginBottom: '1rem', lineHeight: 1.5 }}>
              Você está prestes a suspender a conta de <strong style={{ color: '#FFFFFF' }}>{suspendingStudent.full_name}</strong> ({suspendingStudent.student_code}).
              O estudante será desconectado e impedido de acessar as aulas até que a conta seja reativada.
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ color: '#FCA5A5' }}>
                Justificativa da Suspensão (obrigatório):
              </label>
              <textarea
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Ex: Mensalidades em atraso prolongado ou infração disciplinar."
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setSuspendingStudent(null)} 
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSuspend} 
                className="btn btn-danger"
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Ban size={15} />
                <span>{actionLoading ? 'A processar...' : 'Confirmar Suspensão'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Remoção Permanente (Irreversível) */}
      {deletingStudent && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) {
              setDeletingStudent(null);
              setDeleteConfirmInput('');
            }
          }}
          title="Remover Estudante Permanentemente"
          maxWidth="560px"
        >
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              color: '#FCA5A5'
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                  ATENÇÃO: Operação Definitiva e Irreversível!
                </strong>
                <p style={{ fontSize: '0.825rem', lineHeight: '1.5', margin: 0 }}>
                  A conta de autenticação e todos os dados associados a este estudante serão destruídos permanentemente no banco de dados. O utilizador será desconectado e nunca mais poderá iniciar sessão.
                </p>
              </div>
            </div>

            {/* Informações do Estudante Alvo */}
            <div style={{
              background: 'rgba(0, 24, 48, 0.8)',
              border: '1px solid rgba(0, 163, 224, 0.25)',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.4rem' }}>
                <span style={{ color: '#94A3B8' }}>Estudante:</span>
                <strong style={{ color: '#FFFFFF' }}>{deletingStudent.full_name}</strong>
                <span style={{ color: '#94A3B8' }}>Código:</span>
                <span style={{ color: '#00C7FD', fontFamily: 'monospace', fontWeight: '700' }}>{deletingStudent.student_code}</span>
                <span style={{ color: '#94A3B8' }}>E-mail:</span>
                <span style={{ color: '#E2E8F0' }}>{deletingStudent.email || 'N/A'}</span>
                <span style={{ color: '#94A3B8' }}>Curso:</span>
                <span style={{ color: '#E2E8F0' }}>{deletingStudent.enrollments?.[0]?.course?.title || 'N/A'}</span>
              </div>
            </div>

            {/* Dados que serão destruídos */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Recursos e Dados que Serão Eliminados:
              </div>
              <ul style={{ fontSize: '0.8rem', color: '#CBD5E1', paddingLeft: '1.2rem', lineHeight: '1.6', margin: 0 }}>
                <li>Ficha cadastral e dados biográficos do aluno</li>
                <li>Conta de autenticação e credenciais de acesso no Supabase Auth</li>
                <li>Inscrições em turmas, presenças e histórico curricular</li>
                <li>Histórico de pagamentos, transações e recibos fiscais</li>
                <li>Certificados emitidos e registos de validação pública</li>
                <li>Progresso em aulas e notificações recebidas</li>
              </ul>
            </div>

            {/* Confirmação por Texto */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: '#F87171', fontSize: '0.85rem' }}>
                Para autorizar a remoção, digite <strong>ELIMINAR</strong> ou <strong>{deletingStudent.student_code}</strong>:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value)}
                placeholder="Digite ELIMINAR para confirmar"
                className="form-input"
                style={{
                  borderColor: (deleteConfirmInput.trim().toUpperCase() === 'ELIMINAR' || deleteConfirmInput.trim().toUpperCase() === deletingStudent.student_code?.toUpperCase()) ? '#EF4444' : 'rgba(239, 68, 68, 0.4)',
                  color: '#FFFFFF',
                  fontWeight: '700'
                }}
                disabled={isDeleting}
                autoFocus
              />
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setDeletingStudent(null);
                  setDeleteConfirmInput('');
                }}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={isDeleting || (deleteConfirmInput.trim().toUpperCase() !== 'ELIMINAR' && deleteConfirmInput.trim().toUpperCase() !== deletingStudent.student_code?.toUpperCase())}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
              >
                <Trash2 size={15} />
                <span>{isDeleting ? 'A remover definitivamente...' : 'Sim, Remover Definitivamente'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

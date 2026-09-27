import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { updateStudent, reviewEnrollment, suspendStudent, reactivateStudent } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  User, 
  ExternalLink, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  Ban,
  RotateCcw
} from 'lucide-react';

export default function StudentDetailsModal({ isOpen, onClose, student, onUpdated }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(student?.enrollment_status || 'pendente');
  const [financialStatus, setFinancialStatus] = useState(student?.financial_status || 'pendente');
  const [notes, setNotes] = useState(student?.notes || '');
  const [saving, setSaving] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    if (student) {
      setStatus(student.enrollment_status || student.status || 'pendente');
      setFinancialStatus(student.financial_status || 'pendente');
      setNotes(student.notes || '');
      setShowRejectInput(false);
      setRejectionReason('');
      setShowSuspendInput(false);
      setSuspensionReason('');
      setSuccessMsg('');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleApprove = async () => {
    setReviewLoading(true);
    setSuccessMsg('');
    try {
      await reviewEnrollment({
        studentId: student.id,
        enrollmentId: student.enrollments?.[0]?.id,
        status: 'ativo',
        reviewedBy: user?.id
      });
      setStatus('ativo');
      setFinancialStatus('regular');
      setSuccessMsg('Inscrição aprovada com sucesso! Acesso às aulas liberado.');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Erro ao aprovar inscrição:', err);
      alert('Falha ao aprovar inscrição: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, indique o motivo da recusa para que o estudante seja informado.');
      return;
    }
    setReviewLoading(true);
    setSuccessMsg('');
    try {
      await reviewEnrollment({
        studentId: student.id,
        enrollmentId: student.enrollments?.[0]?.id,
        status: 'rejeitado',
        rejectionReason: rejectionReason.trim(),
        reviewedBy: user?.id
      });
      setStatus('rejeitado');
      setShowRejectInput(false);
      setSuccessMsg('Inscrição rejeitada. O estudante foi notificado no seu painel.');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Erro ao rejeitar inscrição:', err);
      alert('Falha ao rejeitar inscrição: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      alert('Por favor, indique a justificativa da suspensão.');
      return;
    }
    setSuspendLoading(true);
    setSuccessMsg('');
    try {
      await suspendStudent({
        studentId: student.id,
        reason: suspensionReason.trim(),
        suspendedBy: user?.id
      });
      setStatus('suspenso');
      setShowSuspendInput(false);
      setSuccessMsg('Estudante suspenso com sucesso. O seu acesso foi bloqueado.');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao suspender estudante:', err);
      alert('Falha ao suspender estudante: ' + (err?.message || 'Erro'));
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Tem certeza que deseja reativar a conta de ${student.full_name}?`)) return;
    setSuspendLoading(true);
    setSuccessMsg('');
    try {
      await reactivateStudent(student.id, user?.id);
      setStatus('ativo');
      setSuccessMsg('Conta reativada com sucesso! Acesso restabelecido.');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao reativar estudante:', err);
      alert('Falha ao reativar estudante: ' + (err?.message || 'Erro'));
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await updateStudent(student.id, {
        enrollment_status: status,
        status: status,
        financial_status: financialStatus,
        notes: notes.trim()
      });
      setSuccessMsg('Alterações gravadas com sucesso!');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Erro ao actualizar estudante:', err);
      alert('Falha ao gravar alterações: ' + (err?.message || 'Erro'));
    } finally {
      setSaving(false);
    }
  };

  const isPending = (status === 'pendente');
  const isApproved = (status === 'ativo');
  const isRejected = (status === 'rejeitado');
  const isSuspended = (status === 'suspenso' || student.enrollment_status === 'suspenso' || student.status === 'suspenso');
  const enrolledCourse = student.enrollments?.[0]?.course?.title || 'Formação Zaty Academy';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ficha Cadastral do Estudante" maxWidth="740px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Mensagem de Sucesso */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10B981',
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#34D399',
            fontSize: '0.875rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cabeçalho do Perfil */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem',
          padding: '1.15rem',
          background: 'rgba(0, 24, 48, 0.8)',
          borderRadius: '4px',
          border: '1px solid rgba(0, 163, 224, 0.25)'
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', border: '2px solid #00C7FD', flexShrink: 0, background: '#1E293B' }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                <User size={32} />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF' }}>{student.full_name}</h3>
            <div style={{ fontSize: '0.8rem', color: '#00C7FD', fontFamily: 'monospace', fontWeight: '700' }}>
              Código: {student.student_code}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`badge ${getStatusBadgeInfo(status).bg}`}>
                Matrícula: {getStatusBadgeInfo(status).label}
              </span>
              <span className={`badge ${getStatusBadgeInfo(financialStatus).bg}`}>
                Finanças: {getStatusBadgeInfo(financialStatus).label}
              </span>
            </div>
          </div>
        </div>

        {/* Banner de Suspensão de Conta (se suspenso) */}
        {isSuspended ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '6px',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: '700' }}>
                <Ban size={18} />
                <span>CONTA SUSPENSA PELA ADMINISTRAÇÃO</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', marginTop: '0.35rem' }}>
                Motivo: <em>{student.suspension_reason || 'Suspensão administrativa'}</em>
              </div>
              {student.suspended_at && (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Data de suspensão: {formatDate(student.suspended_at)}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleReactivate}
              disabled={suspendLoading}
              className="btn btn-sm"
              style={{ background: '#10B981', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
            >
              <RotateCcw size={15} />
              <span>{suspendLoading ? 'A reativar...' : 'Reativar Conta do Estudante'}</span>
            </button>
          </div>
        ) : (
          /* Banner de Ação de Revisão da Inscrição */
          <div style={{
            background: isPending ? 'rgba(245, 158, 11, 0.12)' : isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isPending ? '#F59E0B' : isApproved ? '#10B981' : '#EF4444'}`,
            borderRadius: '6px',
            padding: '1.15rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: showRejectInput ? '0.75rem' : '0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isPending && <Clock size={18} color="#F59E0B" />}
                  {isApproved && <ShieldCheck size={18} color="#10B981" />}
                  {isRejected && <XCircle size={18} color="#EF4444" />}
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                    {isPending ? 'Inscrição Pendente de Decisão' : isApproved ? 'Inscrição Aprovada' : 'Inscrição Rejeitada'}
                  </strong>
                </div>
                <p style={{ color: '#CBD5E1', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  Curso solicitado: <strong style={{ color: '#00C7FD' }}>{enrolledCourse}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Botão Aprovar */}
                {!isApproved && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={reviewLoading}
                    className="btn btn-sm"
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: '600'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{reviewLoading ? 'A processar...' : 'Aprovar Inscrição'}</span>
                  </button>
                )}

                {/* Botão Rejeitar */}
                {!isRejected && !showRejectInput && (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    disabled={reviewLoading}
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #EF4444',
                      color: '#FCA5A5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: '600'
                    }}
                  >
                    <XCircle size={15} />
                    <span>Rejeitar Inscrição</span>
                  </button>
                )}

                {/* Botão Suspender */}
                <button
                  type="button"
                  onClick={() => setShowSuspendInput(!showSuspendInput)}
                  disabled={reviewLoading || suspendLoading}
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  title="Suspender acesso do estudante"
                >
                  <Ban size={14} />
                  <span>Suspender</span>
                </button>
              </div>
            </div>

            {/* Campo de Justificativa para Rejeição */}
            {showRejectInput && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#FCA5A5', fontWeight: '600', marginBottom: '0.35rem' }}>
                  Motivo da Recusa (será visível para o estudante):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="form-textarea"
                  rows="2"
                  placeholder="Ex: Documento de identificação ilegível. Por favor, submeta um anexo nítido ou contacte a secretaria."
                  style={{ width: '100%', marginBottom: '0.65rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={reviewLoading}
                    className="btn btn-sm"
                    style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', fontWeight: '600' }}
                  >
                    {reviewLoading ? 'A rejeitar...' : 'Confirmar Rejeição'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulário de Suspensão */}
        {showSuspendInput && !isSuspended && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '6px',
            padding: '1rem',
            marginTop: '-0.5rem'
          }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#FCA5A5', fontWeight: '600', marginBottom: '0.35rem' }}>
              Justificativa da Suspensão de Conta (obrigatório):
            </label>
            <textarea
              value={suspensionReason}
              onChange={e => setSuspensionReason(e.target.value)}
              className="form-textarea"
              rows="2"
              placeholder="Ex: Pagamentos em atraso prolongado ou incumprimento do regulamento institucional."
              style={{ width: '100%', marginBottom: '0.65rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowSuspendInput(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                disabled={suspendLoading}
                className="btn btn-danger btn-sm"
              >
                {suspendLoading ? 'A suspender...' : 'Confirmar Suspensão'}
              </button>
            </div>
          </div>
        )}

        {/* Informações Pessoais */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.85rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Data Nasc. / Idade:</span>
            <strong style={{ color: '#FFFFFF' }}>{formatDate(student.birth_date)} ({student.age || '—'} anos)</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Género:</span>
            <strong style={{ color: '#FFFFFF' }}>{student.gender === 'F' ? 'Feminino' : 'Masculino'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Telefone Principal:</span>
            <strong style={{ color: '#FFFFFF' }}>{student.phone}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Telefone Alternativo:</span>
            <strong style={{ color: '#FFFFFF' }}>{student.alternative_phone || '—'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>E-mail:</span>
            <strong style={{ color: '#FFFFFF' }}>{student.email}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Localização:</span>
            <strong style={{ color: '#FFFFFF' }}>{student.neighborhood || ''}{student.neighborhood && student.city ? ', ' : ''}{student.city}</strong>
          </div>
        </div>

        {/* Documento de Identificação (BI) Seguro */}
        <div style={{
          background: 'rgba(0, 24, 48, 0.7)',
          borderRadius: '4px',
          padding: '1.15rem',
          border: '1px solid rgba(0, 163, 224, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Documento de Identificação (BI):</span>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>{student.id_document_number || 'Nº não especificado'}</strong>
            </div>

            {student.id_document_url ? (
              <a 
                href={student.id_document_url} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={15} />
                Consultar Documento Seguro
              </a>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Nenhum ficheiro anexo</span>
            )}
          </div>
        </div>

        {/* Gestão Administrativa de Status */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1.15rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.85rem' }}>Gestão de Situação Académica & Financeira</h4>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Estado da Matrícula</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="form-select">
                <option value="pendente">Pendente</option>
                <option value="ativo">Ativo / Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="suspenso">Suspenso</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Situação Financeira</label>
              <select value={financialStatus} onChange={e => setFinancialStatus(e.target.value)} className="form-select">
                <option value="pendente">Pendente</option>
                <option value="regular">Regular / Em dia</option>
                <option value="atrasado">Em Atraso</option>
                <option value="isento">Isento de Propinas</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Anotações Internas da Administração</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Notas da secretaria ou formadores sobre o estudante..."
              rows="2"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '0.85rem' }}>
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={15} />
              {saving ? 'A gravar...' : 'Gravar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

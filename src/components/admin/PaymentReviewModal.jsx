import { useState } from 'react';
import Modal from '../common/Modal';
import { reviewPayment } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';

export default function PaymentReviewModal({ isOpen, onClose, payment, onReviewed }) {
  const [submitting, setSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !payment) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await reviewPayment({
        paymentId: payment.id,
        status: 'aprovado'
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      console.error('Erro ao aprovar pagamento:', err);
      setErrorMsg(err.message || 'Falha ao aprovar o pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return setErrorMsg('Por favor, especifique o motivo da rejeição para o estudante.');
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await reviewPayment({
        paymentId: payment.id,
        status: 'rejeitado',
        rejectionReason: rejectionReason.trim()
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      console.error('Erro ao rejeitar pagamento:', err);
      setErrorMsg(err.message || 'Falha ao rejeitar o pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !submitting && onClose()} title="Análise e Conferência de Pagamento" maxWidth="660px">
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#FCA5A5',
          fontSize: '0.85rem',
          marginBottom: '1.15rem'
        }}>
          <AlertCircle size={17} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dados do Aluno e do Pagamento */}
      <div style={{
        background: 'rgba(0, 24, 48, 0.8)',
        borderRadius: '4px',
        padding: '1.15rem 1.35rem',
        border: '1px solid rgba(0, 163, 224, 0.25)',
        marginBottom: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '0.85rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Estudante:</span>
          <strong style={{ color: '#FFFFFF' }}>{payment.student?.full_name}</strong>
          <div style={{ fontSize: '0.75rem', color: '#00C7FD', fontFamily: 'monospace' }}>
            {payment.student?.student_code}
          </div>
        </div>

        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Contacto / Telefone:</span>
          <strong style={{ color: '#FFFFFF' }}>{payment.student?.phone || '—'}</strong>
        </div>

        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Valor a Conferir:</span>
          <strong style={{ fontSize: '1.15rem', color: '#00C7FD' }}>{formatCurrency(payment.amount)}</strong>
        </div>

        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Método / Operadora:</span>
          <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.25)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px', textTransform: 'uppercase' }}>
            {payment.payment_method}
          </span>
        </div>

        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Código / Referência Operadora:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#FFFFFF' }}>
            {payment.reference_code || 'Não informado'}
          </span>
        </div>

        <div>
          <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>Data do Envio:</span>
          <span style={{ color: '#FFFFFF' }}>{formatDateTime(payment.created_at)}</span>
        </div>
      </div>

      {/* Visualização do Comprovativo Anexo */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label" style={{ fontWeight: '600', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={15} color="#00C7FD" />
          Comprovativo de Pagamento Anexo
        </label>

        <div style={{
          background: '#070A12',
          borderRadius: '4px',
          padding: '1rem',
          border: '1px solid rgba(0, 163, 224, 0.2)',
          textAlign: 'center',
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          {payment.proof_file_url ? (
            (() => {
              const isPdf = payment.proof_file_name?.toLowerCase().endsWith('.pdf') || 
                            payment.proof_file_url?.split('?')[0]?.toLowerCase().endsWith('.pdf') || 
                            payment.proof_file_url?.toLowerCase().includes('.pdf');

              return isPdf ? (
                <div style={{ padding: '1.5rem 1rem' }}>
                  <FileText size={36} color="#00C7FD" style={{ margin: '0 auto 0.65rem auto' }} />
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.65rem', color: '#FFFFFF' }}>
                    Documento em PDF ({payment.proof_file_name || 'Comprovativo.pdf'})
                  </div>
                  <a href={payment.proof_file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={15} />
                    Abrir PDF numa Nova Janela
                  </a>
                </div>
              ) : (
                <a href={payment.proof_file_url} target="_blank" rel="noreferrer" title="Clique para ampliar">
                  <img 
                    src={payment.proof_file_url} 
                    alt="Comprovativo" 
                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '4px', objectFit: 'contain' }} 
                  />
                </a>
              );
            })()
          ) : (
            <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Nenhum ficheiro anexo encontrado.</span>
          )}
        </div>
      </div>

      {/* Campo de Rejeição */}
      {showRejectInput && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <label className="form-label" style={{ color: '#FCA5A5' }}>
            Motivo da Rejeição (Será enviado ao estudante) *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="form-textarea"
            placeholder="Ex: Valor no SMS não confere com o montante devido / Comprovativo ilegível / Código duplicado..."
            rows="2"
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.65rem' }}>
            <button 
              type="button" 
              onClick={() => setShowRejectInput(false)} 
              className="btn btn-secondary btn-sm"
            >
              Cancelar Rejeição
            </button>
            <button 
              type="button" 
              onClick={handleReject} 
              disabled={submitting} 
              className="btn btn-danger btn-sm"
            >
              {submitting ? 'A rejeitar...' : 'Confirmar Rejeição do Pagamento'}
            </button>
          </div>
        </div>
      )}

      {/* Ações de Aprovação / Rejeição */}
      {!showRejectInput && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setShowRejectInput(true)} 
            disabled={submitting} 
            className="btn btn-danger"
          >
            <XCircle size={16} />
            Rejeitar Pagamento
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting} 
              className="btn btn-secondary"
            >
              Fechar
            </button>
            <button 
              type="button" 
              onClick={handleApprove} 
              disabled={submitting} 
              className="btn btn-success btn-lg"
            >
              <CheckCircle2 size={18} />
              {submitting ? 'A aprovar & emitir recibo...' : 'Aprovar & Gerar Recibo Oficial'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

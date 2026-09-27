import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getStudentPayments } from '../../services/api';
import { subscribeToPayments } from '../../services/realtimeService';
import { generateReceiptPdf, printPdfDoc } from '../../services/pdfService';
import StudentSidebar from '../../components/student/StudentSidebar';
import PaymentModal from '../../components/student/PaymentModal';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDateTime, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  CreditCard, 
  Download, 
  FileText, 
  Plus,
  Eye,
  Printer,
  Clock
} from 'lucide-react';

export default function StudentPayments() {
  const { student } = useAuth();
  const { settings } = useSettings();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  // Estados para orientação prévia e modal de pré-visualização
  const [selectedActionPayment, setSelectedActionPayment] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'visualizar' | 'imprimir' | 'baixar'
  const [previewPayment, setPreviewPayment] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchPayments = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const data = await getStudentPayments(student.id);
      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    if (!student?.id) return;
    const sub = subscribeToPayments(() => {
      fetchPayments();
    }, student.id);

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    };
  }, [student?.id]);

  const getPaymentReceipt = (payment) => {
    if (!payment) return null;
    let rec = payment.receipt;
    if (Array.isArray(rec)) rec = rec[0];
    if (!rec && payment.receipts && payment.receipts.length > 0) rec = payment.receipts[0];
    if (!rec && payment.status === 'aprovado') {
      rec = {
        payment_id: payment.id,
        student_id: payment.student_id,
        transaction_code: payment.reference_code || `TRX-${payment.id?.substring(0, 8).toUpperCase()}`,
        receipt_number: `REC-${new Date(payment.created_at || Date.now()).getFullYear()}-${payment.id?.substring(0, 4).toUpperCase()}`,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        issued_at: payment.updated_at || payment.created_at || new Date().toISOString(),
        security_hash: `SEC-${payment.id?.substring(0, 12).toUpperCase()}`
      };
    }
    return rec;
  };

  // Dispara o modal de orientação da secretaria antes da ação selecionada
  const handleInitiateAction = (payment, action) => {
    setSelectedActionPayment(payment);
    setPendingAction(action);
  };

  // Confirma a ação após o estudante ler a orientação
  const handleConfirmAction = async () => {
    const payment = selectedActionPayment;
    const action = pendingAction;
    setPendingAction(null);
    setSelectedActionPayment(null);

    if (!payment || !action) return;

    if (action === 'visualizar') {
      await executePreviewReceipt(payment);
    } else if (action === 'imprimir') {
      await executePrintReceipt(payment);
    } else if (action === 'baixar') {
      await executeDownloadReceipt(payment);
    }
  };

  const executePreviewReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo ainda não disponível para este pagamento.');

    setPreviewPayment(payment);
    setPreviewLoading(true);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student,
        payment,
        courseTitle: student?.enrollments?.[0]?.course?.title || 'Formação Zaty Academy',
        settings
      });
      const url = doc.output('bloburl');
      setPreviewBlobUrl(url);
    } catch (err) {
      console.error('Erro ao pré-visualizar recibo:', err);
      alert('Falha ao gerar pré-visualização do recibo.');
      setPreviewPayment(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const executePrintReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo ainda não disponível.');

    setGeneratingPdfId(payment.id);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student,
        payment,
        courseTitle: student?.enrollments?.[0]?.course?.title || 'Formação Zaty Academy',
        settings
      });
      printPdfDoc(doc);
    } catch (err) {
      console.error('Erro ao imprimir recibo:', err);
      alert('Falha ao acionar impressão do recibo.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const executeDownloadReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo ainda não disponível.');

    setGeneratingPdfId(payment.id);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student,
        payment,
        courseTitle: student?.enrollments?.[0]?.course?.title || 'Formação Zaty Academy',
        settings
      });

      doc.save(`Recibo_Oficial_${receipt.receipt_number}_${(student?.full_name || 'Estudante').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar recibo em PDF:', err);
      alert('Falha ao descarregar recibo em PDF.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
              Gestão Financeira & Recibos
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Acompanhe os seus pagamentos por carteira móvel e emita os recibos oficiais aprovados.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => setShowPaymentModal(true)} 
            className="btn btn-primary payment-new-btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
          >
            <Plus size={16} />
            <span>SOLICITAR NOVO PAGAMENTO</span>
          </button>
        </div>

        {/* Resumo de Estados Financeiros */}
        <div className="grid-3 payment-summary-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card payment-stat-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Situação da Matrícula</span>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`badge ${getStatusBadgeInfo(student?.financial_status).bg}`} style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                {getStatusBadgeInfo(student?.financial_status).label}
              </span>
            </div>
          </div>

          <div className="glass-card payment-stat-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Confirmado</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem', lineHeight: 1.2 }}>
              {formatCurrency(
                payments
                  .filter(p => p.status === 'aprovado')
                  .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
              )}
            </div>
          </div>

          <div className="glass-card payment-stat-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Em Análise / Pendente</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#00C7FD', marginTop: '0.2rem', lineHeight: 1.2 }}>
              {formatCurrency(
                payments
                  .filter(p => p.status === 'pendente' || p.status === 'em_analise')
                  .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
              )}
            </div>
          </div>
        </div>

        {/* Histórico de Pagamentos & Recibos Emitidos */}
        <div className="glass-card payment-history-card">
          <h2 style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.2rem)', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#00C7FD" />
            <span>Histórico de Pagamentos & Recibos Emitidos</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              A carregar histórico financeiro...
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <CreditCard size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>Não há registos de pagamentos submetidos.</p>
              <button onClick={() => setShowPaymentModal(true)} className="btn btn-secondary btn-sm" style={{ marginTop: '0.85rem' }}>
                Fazer Primeiro Pagamento
              </button>
            </div>
          ) : (
            <>
              {/* VISÃO DESKTOP: Tabela Completa (≥ 769px) */}
              <div className="payments-desktop-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Tipo</th>
                      <th>Método</th>
                      <th>Valor</th>
                      <th>Referência</th>
                      <th>Estado</th>
                      <th>Ações do Recibo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => {
                      const statusInfo = getStatusBadgeInfo(payment.status);
                      const isApproved = payment.status === 'aprovado';

                      return (
                        <tr key={payment.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(payment.created_at)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{payment.payment_type}</td>
                          <td style={{ textTransform: 'uppercase', fontWeight: '600' }}>
                            <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.2)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.3)', borderRadius: '3px' }}>
                              {payment.payment_method}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700', color: '#FFFFFF' }}>{formatCurrency(payment.amount)}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{payment.reference_code || '—'}</td>
                          <td>
                            <span className={`badge ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                            {payment.status === 'rejeitado' && payment.rejection_reason && (
                              <div style={{ fontSize: '0.72rem', color: '#FCA5A5', marginTop: '0.2rem' }}>
                                Motivo: {payment.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td>
                            {isApproved ? (
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateAction(payment, 'visualizar')}
                                  className="btn btn-secondary btn-sm"
                                  title="Visualizar Recibo Oficial"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                                >
                                  <Eye size={13} color="#00C7FD" />
                                  Visualizar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateAction(payment, 'imprimir')}
                                  disabled={generatingPdfId === payment.id}
                                  className="btn btn-outline btn-sm"
                                  title="Imprimir Recibo Oficial"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                                >
                                  <Printer size={13} />
                                  Imprimir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateAction(payment, 'baixar')}
                                  disabled={generatingPdfId === payment.id}
                                  className="btn btn-success btn-sm"
                                  title="Baixar Recibo em PDF"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                                >
                                  <Download size={13} />
                                  Baixar
                                </button>
                              </div>
                            ) : payment.status === 'pendente' || payment.status === 'em_analise' ? (
                              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                                Aguardando aprovação
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                Não disponível
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* VISÃO MOBILE: Cards Otimizados & Alinhados (≤ 768px) */}
              <div className="payments-mobile-cards">
                {payments.map(payment => {
                  const statusInfo = getStatusBadgeInfo(payment.status);
                  const isApproved = payment.status === 'aprovado';

                  return (
                    <div key={payment.id} className="mobile-payment-card">
                      {/* Topo do Card: Método & Tipo + Estado */}
                      <div className="mobile-payment-card-header">
                        <div className="mobile-payment-method-type">
                          <span className="mobile-payment-method-badge">
                            {payment.payment_method}
                          </span>
                          <span className="mobile-payment-type-text">
                            {payment.payment_type}
                          </span>
                        </div>

                        <span className={`badge ${statusInfo.bg} mobile-payment-status-badge`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Corpo do Card: Valor em Destaque e Data de Envio */}
                      <div className="mobile-payment-card-body">
                        <div className="mobile-payment-val-box">
                          <span className="mobile-payment-label">Valor Pago</span>
                          <div className={`mobile-payment-amount ${isApproved ? 'amount-approved' : ''}`}>
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>

                        <div className="mobile-payment-date-box">
                          <span className="mobile-payment-label">Data & Hora</span>
                          <div className="mobile-payment-date">
                            <Clock size={12} color="#00C7FD" style={{ flexShrink: 0 }} />
                            <span>{formatDateTime(payment.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Linha de Referência da Transação */}
                      <div className="mobile-payment-ref-row">
                        <span className="mobile-payment-ref-label">Referência:</span>
                        <span className="mobile-payment-ref-code">
                          {payment.reference_code || '—'}
                        </span>
                      </div>

                      {/* Motivo de Rejeição (se houver) */}
                      {payment.status === 'rejeitado' && payment.rejection_reason && (
                        <div className="mobile-payment-rejection-box">
                          <strong>Motivo:</strong> {payment.rejection_reason}
                        </div>
                      )}

                      {/* Ações do Recibo ou Mensagem Informativa */}
                      <div className="mobile-payment-actions-area">
                        {isApproved ? (
                          <div className="mobile-payment-btn-grid">
                            <button
                              type="button"
                              onClick={() => handleInitiateAction(payment, 'visualizar')}
                              className="btn btn-secondary btn-sm mobile-receipt-btn"
                              title="Visualizar Recibo Oficial"
                            >
                              <Eye size={13} color="#00C7FD" />
                              <span>Visualizar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInitiateAction(payment, 'imprimir')}
                              disabled={generatingPdfId === payment.id}
                              className="btn btn-outline btn-sm mobile-receipt-btn"
                              title="Imprimir Recibo Oficial"
                            >
                              <Printer size={13} />
                              <span>Imprimir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInitiateAction(payment, 'baixar')}
                              disabled={generatingPdfId === payment.id}
                              className="btn btn-success btn-sm mobile-receipt-btn"
                              title="Baixar Recibo em PDF"
                            >
                              <Download size={13} />
                              <span>Baixar</span>
                            </button>
                          </div>
                        ) : payment.status === 'pendente' || payment.status === 'em_analise' ? (
                          <div className="mobile-payment-pending-msg">
                            <Clock size={13} color="#F59E0B" />
                            <span>Aguardando validação da secretaria</span>
                          </div>
                        ) : (
                          <div className="mobile-payment-unavailable-msg">
                            Recibo oficial não disponível
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        studentId={student?.id}
        onPaymentSuccess={fetchPayments}
      />

      {/* Modal de Orientação da Secretaria (Exibido antes de Visualizar/Imprimir/Baixar) */}
      <Modal
        isOpen={!!pendingAction && !!selectedActionPayment}
        onClose={() => { setPendingAction(null); setSelectedActionPayment(null); }}
        title="Instrução Oficial da Secretaria"
        maxWidth="520px"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem 0' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(0, 199, 253, 0.12)',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <Printer size={28} color="#00C7FD" />
          </div>

          <div style={{
            background: 'rgba(0, 24, 48, 0.75)',
            border: '1px solid rgba(0, 163, 224, 0.3)',
            borderRadius: '6px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            color: '#F8FAFC',
            fontSize: '1rem',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            “Imprima este recibo e dirija-se à Secretaria para apresentá-lo como comprovativo de pagamento da matrícula.”
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setPendingAction(null); setSelectedActionPayment(null); }}
              className="btn btn-secondary"
              style={{ minWidth: '100px' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {pendingAction === 'visualizar' && <Eye size={16} />}
              {pendingAction === 'imprimir' && <Printer size={16} />}
              {pendingAction === 'baixar' && <Download size={16} />}
              <span>Continuar para {pendingAction === 'visualizar' ? 'Visualização' : pendingAction === 'imprimir' ? 'Impressão' : 'Download'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Pré-visualização do Recibo Oficial para o Estudante */}
      <Modal
        isOpen={!!previewPayment}
        onClose={() => {
          if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
          setPreviewPayment(null);
          setPreviewBlobUrl(null);
        }}
        title={`Recibo Oficial — ${getPaymentReceipt(previewPayment)?.receipt_number || ''}`}
        maxWidth="750px"
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
            <div style={{ fontSize: '1.1rem', color: '#00C7FD', marginBottom: '0.5rem' }}>A carregar o seu recibo oficial...</div>
            <p style={{ fontSize: '0.85rem' }}>A preparar o documento em alta resolução.</p>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#0B132B',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1.25rem',
              minHeight: '480px'
            }}>
              {previewBlobUrl && (
                <iframe 
                  src={previewBlobUrl} 
                  title="Recibo Oficial do Estudante"
                  style={{ width: '100%', height: '480px', border: 'none' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Código da Transação: <strong style={{ color: '#00C7FD', fontFamily: 'monospace' }}>{getPaymentReceipt(previewPayment)?.transaction_code}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  onClick={() => executePrintReceipt(previewPayment)}
                  className="btn btn-secondary"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={() => executeDownloadReceipt(previewPayment)}
                  className="btn btn-primary"
                >
                  <Download size={16} />
                  Baixar Recibo (PDF)
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                    setPreviewPayment(null);
                    setPreviewBlobUrl(null);
                  }} 
                  className="btn btn-outline"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

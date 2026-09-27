import { useState, useEffect } from 'react';
import { getPayments } from '../../services/api';
import { subscribeToPayments } from '../../services/realtimeService';
import { generateReceiptPdf, printPdfDoc } from '../../services/pdfService';
import { useSettings } from '../../context/SettingsContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import PaymentReviewModal from '../../components/admin/PaymentReviewModal';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDateTime, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  CreditCard, 
  Download, 
  Eye,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  const [previewPayment, setPreviewPayment] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(true);
  const { settings } = useSettings();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPayments({ status: statusFilter });
      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Subscrição em tempo real para pagamentos e comprovativos
    const sub = subscribeToPayments(() => {
      fetchPayments();
      setRealtimeActive(true);
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    };
  }, [statusFilter]);

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

  const handlePreviewReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo ainda não gerado para este pagamento.');

    setPreviewPayment(payment);
    setPreviewLoading(true);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student: payment.student,
        payment,
        courseTitle: 'Formação Zaty Academy',
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

  const handlePrintReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo não disponível.');

    setGeneratingPdfId(payment.id);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student: payment.student,
        payment,
        courseTitle: 'Formação Zaty Academy',
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

  const handleDownloadReceipt = async (payment) => {
    const receipt = getPaymentReceipt(payment);
    if (!receipt) return alert('Recibo não disponível.');

    setGeneratingPdfId(payment.id);
    try {
      const doc = await generateReceiptPdf({
        receipt,
        student: payment.student,
        payment,
        courseTitle: 'Formação Zaty Academy',
        settings
      });

      doc.save(`Recibo_Oficial_${receipt.receipt_number}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar recibo:', err);
      alert('Falha ao gerar recibo em PDF.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const studentName = p.student?.full_name?.toLowerCase() || '';
    const studentCode = p.student?.student_code?.toLowerCase() || '';
    const refCode = p.reference_code?.toLowerCase() || '';
    const method = p.payment_method?.toLowerCase() || '';
    const type = p.payment_type?.toLowerCase() || '';
    return studentName.includes(term) || studentCode.includes(term) || refCode.includes(term) || method.includes(term) || type.includes(term);
  });

  const pendingCount = payments.filter(p => p.status === 'pendente').length;

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FFFFFF' }}>Gestão Financeira & Pagamentos</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem' }}>
              Validação de transferências de M-Pesa, e-Mola e mKesh, controle de transações e emissão de recibos oficiais.
            </p>
          </div>

          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              background: realtimeActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.1)',
              border: realtimeActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)',
              color: realtimeActive ? '#34D399' : '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
            title="Sincronização de pagamentos em tempo real ativa"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: realtimeActive ? '#10B981' : '#94A3B8',
              boxShadow: realtimeActive ? '0 0 8px #10B981' : 'none',
              display: 'inline-block'
            }}></span>
            <span>{realtimeActive ? 'Ao Vivo' : 'Offline'}</span>
          </div>
        </div>

        {/* Barra de Filtros e Pesquisa */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Abas Rápidas */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos os Pagamentos
            </button>

            <button
              onClick={() => setStatusFilter('pendente')}
              className={`btn btn-sm ${statusFilter === 'pendente' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Clock size={14} color="#F59E0B" />
              <span>Pendentes</span>
              {pendingCount > 0 && statusFilter !== 'pendente' && (
                <span style={{ background: '#F59E0B', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('aprovado')}
              className={`btn btn-sm ${statusFilter === 'aprovado' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={14} color="#10B981" />
              <span>Aprovados</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejeitado')}
              className={`btn btn-sm ${statusFilter === 'rejeitado' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <XCircle size={14} color="#EF4444" />
              <span>Rejeitados</span>
            </button>
          </div>

          {/* Campo de Pesquisa */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por aluno, código, ref..."
              className="form-input"
              style={{ paddingLeft: '2.1rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Tabela / Cards de Pagamentos */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar pagamentos...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <CreditCard size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>{searchTerm ? 'Nenhum registo de pagamento encontrado para esta pesquisa.' : 'Nenhum registo de pagamento com este filtro.'}</p>
            </div>
          ) : (
            <>
              {/* Versão Desktop: Tabela */}
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudante</th>
                      <th>Tipo</th>
                      <th>Método</th>
                      <th>Valor</th>
                      <th>Referência</th>
                      <th>Data</th>
                      <th>Estado</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => {
                      const statusInfo = getStatusBadgeInfo(p.status);
                      const receipt = p.receipt?.[0];

                      return (
                        <tr key={p.id}>
                          <td>
                            <strong style={{ color: '#FFFFFF' }}>{p.student?.full_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                              {p.student?.student_code}
                            </div>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{p.payment_type}</td>
                          <td style={{ textTransform: 'uppercase', fontWeight: '700' }}>
                            <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.2)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.3)', borderRadius: '3px' }}>
                              {p.payment_method}
                            </span>
                          </td>
                          <td style={{ fontWeight: '800', color: '#00C7FD' }}>{formatCurrency(p.amount)}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{p.reference_code || '—'}</td>
                          <td style={{ fontSize: '0.825rem' }}>{formatDateTime(p.created_at)}</td>
                          <td>
                            <span className={`badge ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {p.status === 'pendente' ? (
                                <button
                                  onClick={() => setSelectedPayment(p)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Conferir & Aprovar
                                </button>
                              ) : p.status === 'aprovado' ? (
                                <>
                                  <button
                                    onClick={() => handlePreviewReceipt(p)}
                                    className="btn btn-secondary btn-sm"
                                    title="Visualizar Recibo Oficial"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <Eye size={13} color="#00C7FD" />
                                    Visualizar
                                  </button>
                                  <button
                                    onClick={() => handlePrintReceipt(p)}
                                    disabled={generatingPdfId === p.id}
                                    className="btn btn-outline btn-sm"
                                    title="Imprimir Recibo Oficial"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <Printer size={13} />
                                    Imprimir
                                  </button>
                                  <button
                                    onClick={() => handleDownloadReceipt(p)}
                                    disabled={generatingPdfId === p.id}
                                    className="btn btn-success btn-sm"
                                    title="Baixar Recibo em PDF"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <Download size={13} />
                                    {generatingPdfId === p.id ? 'Baixando...' : 'Baixar'}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setSelectedPayment(p)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  <Eye size={14} /> Ver
                                </button>
                              )}
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
                {filteredPayments.map(p => {
                  const statusInfo = getStatusBadgeInfo(p.status);

                  return (
                    <div key={p.id} className="mobile-entity-card">
                      <div className="mobile-card-header">
                        <div>
                          <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                            {p.student?.full_name || 'Estudante'}
                          </strong>
                          <div style={{ fontSize: '0.74rem', color: '#00C7FD', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                            {p.student?.student_code || '—'}
                          </div>
                        </div>
                        <span className={`badge ${statusInfo.bg}`} style={{ fontSize: '0.72rem' }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="mobile-card-meta">
                        <div>
                          <span className="meta-label">Valor do Pagamento</span>
                          <span className="meta-value" style={{ color: '#00C7FD', fontWeight: '800', fontSize: '0.925rem' }}>
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Método / Canal</span>
                          <span className="meta-value" style={{ textTransform: 'uppercase', fontWeight: '700' }}>
                            {p.payment_method}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Tipo</span>
                          <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                            {p.payment_type}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Referência / Código</span>
                          <span className="meta-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {p.reference_code || '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                        Data: {formatDateTime(p.created_at)}
                      </div>

                      <div className="mobile-card-actions">
                        {p.status === 'pendente' ? (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="btn btn-primary mobile-action-btn"
                          >
                            Conferir & Aprovar
                          </button>
                        ) : p.status === 'aprovado' ? (
                          <>
                            <button
                              onClick={() => handlePreviewReceipt(p)}
                              className="btn btn-secondary mobile-action-btn"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Eye size={14} color="#00C7FD" />
                              Visualizar
                            </button>
                            <button
                              onClick={() => handlePrintReceipt(p)}
                              disabled={generatingPdfId === p.id}
                              className="btn btn-outline mobile-action-btn"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Printer size={14} />
                              Imprimir
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(p)}
                              disabled={generatingPdfId === p.id}
                              className="btn btn-success mobile-action-btn"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Download size={14} />
                              {generatingPdfId === p.id ? 'Baixando...' : 'Baixar PDF'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="btn btn-secondary mobile-action-btn"
                          >
                            <Eye size={14} /> Ver Detalhes
                          </button>
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

      <PaymentReviewModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        onReviewed={fetchPayments}
      />

      {/* Modal de Pré-visualização do Recibo Oficial */}
      <Modal
        isOpen={!!previewPayment}
        onClose={() => {
          if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
          setPreviewPayment(null);
          setPreviewBlobUrl(null);
        }}
        title={`Recibo Oficial de Pagamento — ${getPaymentReceipt(previewPayment)?.receipt_number || ''}`}
        maxWidth="750px"
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
            <div style={{ fontSize: '1.1rem', color: '#00C7FD', marginBottom: '0.5rem' }}>A gerar pré-visualização oficial...</div>
            <p style={{ fontSize: '0.85rem' }}>Carregando dados financeiros, carimbos e código de segurança.</p>
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
                  title="Pré-visualização do Recibo"
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
                  onClick={() => handlePrintReceipt(previewPayment)}
                  className="btn btn-secondary"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={() => handleDownloadReceipt(previewPayment)}
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

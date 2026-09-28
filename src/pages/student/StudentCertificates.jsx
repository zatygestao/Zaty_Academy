import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getStudentCertificates, getStudentCertificateRequests } from '../../services/api';
import { generateCertificatePdf, printPdfDoc } from '../../services/pdfService';
import StudentSidebar from '../../components/student/StudentSidebar';
import Modal from '../../components/common/Modal';
import CertificateRequestModal from '../../components/student/CertificateRequestModal';
import { formatDate, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  Award, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Copy, 
  Check,
  CheckCircle2,
  Eye,
  Printer,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Send
} from 'lucide-react';

export default function StudentCertificates() {
  const { student } = useAuth();
  const { settings } = useSettings();
  const [certificates, setCertificates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Preview state
  const [previewCert, setPreviewCert] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadAllData = async () => {
    if (!student?.id) return;
    setLoading(true);
    setLoadingRequests(true);
    try {
      const [certs, reqs] = await Promise.all([
        getStudentCertificates(student.id),
        getStudentCertificateRequests(student.id)
      ]);
      setCertificates(certs || []);
      setRequests(reqs || []);
    } catch (err) {
      console.error('Erro ao carregar dados de certificados e requerimentos:', err);
    } finally {
      setLoading(false);
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [student?.id]);

  const handlePreview = async (cert) => {
    setPreviewCert(cert);
    setPreviewLoading(true);
    try {
      const doc = await generateCertificatePdf({
        certificate: cert,
        student,
        course: cert.course,
        settings
      });
      const url = doc.output('bloburl');
      setPreviewBlobUrl(url);
    } catch (err) {
      console.error('Erro ao pré-visualizar certificado:', err);
      alert('Falha ao gerar pré-visualização do certificado.');
      setPreviewCert(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (cert) => {
    setGeneratingId(cert.id);
    try {
      const doc = await generateCertificatePdf({
        certificate: cert,
        student,
        course: cert.course,
        settings
      });

      doc.save(`Certificado_${cert.certificate_number}_${student.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
      alert('Falha ao gerar o certificado em PDF.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePrint = async (cert) => {
    setGeneratingId(cert.id);
    try {
      const doc = await generateCertificatePdf({
        certificate: cert,
        student,
        course: cert.course,
        settings
      });
      printPdfDoc(doc);
    } catch (err) {
      console.error('Erro ao imprimir certificado:', err);
      alert('Falha ao acionar impressão.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

const getRequestBadgeInfo = (status) => {
  switch (status) {
    case 'pendente':
      return { label: 'Pendente', bg: 'badge-warning', color: '#F59E0B' };
    case 'em_analise':
      return { label: 'Em Análise', bg: 'badge-info', color: '#00C7FD' };
    case 'aprovado':
      return { label: 'Aprovado (Aguardando Pagamento)', bg: 'badge-primary', color: '#38BDF8' };
    case 'concluido':
      return { label: 'Concluído / Emitido', bg: 'badge-success', color: '#10B981' };
    case 'rejeitado':
      return { label: 'Rejeitado', bg: 'badge-danger', color: '#EF4444' };
    default:
      return { label: status || 'Pendente', bg: 'badge-secondary', color: '#94A3B8' };
  }
};

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
              Certificados Digitais Oficiais
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Consulte os seus certificados autenticados ou submeta um requerimento oficial à Direção da Zaty Academy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="btn btn-primary"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
              fontWeight: '700',
              boxShadow: '0 4px 15px rgba(0, 199, 253, 0.3)',
              padding: '0.6rem 1.25rem'
            }}
          >
            <FileText size={16} />
            <span>SOLICITAR CERTIFICADO OFICIAL</span>
          </button>
        </div>

        {/* SEÇÃO: MEUS REQUERIMENTOS DE CERTIFICADO */}
        {requests.length > 0 && (
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem', border: '1px solid rgba(0, 163, 224, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#00C7FD" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Os Meus Requerimentos de Certificado ({requests.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Acompanhe o estado de tramitação do seu pedido junto da Direcção Académica
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {requests.map(req => {
                const badge = getRequestBadgeInfo(req.status);
                const isApproved = req.status === 'aprovado';
                const isRejected = req.status === 'rejeitado';
                const isCompleted = req.status === 'concluido';

                return (
                  <div 
                    key={req.id} 
                    style={{ 
                      background: 'rgba(2, 11, 20, 0.65)', 
                      border: isApproved ? '1px solid rgba(56, 189, 248, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px', 
                      padding: '1rem' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD', fontSize: '0.85rem' }}>
                          {req.request_number || 'REQ-ZA'}
                        </span>
                        <span style={{ color: '#64748B' }}>•</span>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.925rem' }}>
                          {req.course?.name || req.course?.title || 'Curso de Formação Profissional'}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          Submetido a: {formatDate(req.created_at)}
                        </span>
                        <span className={`badge ${badge.bg}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                      <span>Finalidade: <strong style={{ color: '#CBD5E1' }}>{req.purpose || 'Conclusão de Estudos'}</strong></span>
                      {req.notes && (
                        <span style={{ marginLeft: '1rem', color: '#94A3B8' }}>
                          • {req.notes}
                        </span>
                      )}
                    </div>

                    {/* MENSAGEM OFICIAL DE APROVAÇÃO CONFORME REQUISITO DO SISTEMA */}
                    {isApproved && (
                      <div style={{ 
                        background: 'rgba(56, 189, 248, 0.12)', 
                        border: '1px solid rgba(56, 189, 248, 0.35)', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '6px', 
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E0F2FE', fontSize: '0.85rem' }}>
                          <CheckCircle2 size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
                          <span>
                            <strong>O seu pedido de certificado foi aceite. Por favor, efetue o pagamento para levantar o seu certificado.</strong>
                          </span>
                        </div>
                        <Link 
                          to="/estudante/pagamentos" 
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CreditCard size={13} />
                          <span>Efetuar Pagamento</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    )}

                    {/* Feedback se Rejeitado */}
                    {isRejected && req.rejection_reason && (
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        padding: '0.65rem 0.85rem', 
                        borderRadius: '6px', 
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#FCA5A5',
                        fontSize: '0.825rem'
                      }}>
                        <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                        <span><strong>Motivo comunicado pela Direcção:</strong> {req.rejection_reason}</span>
                      </div>
                    )}

                    {/* Feedback se Concluído */}
                    {isCompleted && (
                      <div style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        border: '1px solid rgba(16, 185, 129, 0.3)', 
                        padding: '0.65rem 0.85rem', 
                        borderRadius: '6px', 
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#34D399',
                        fontSize: '0.825rem'
                      }}>
                        <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                        <span>Requerimento finalizado. O seu certificado oficial foi emitido com sucesso e pode ser consultado abaixo.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
            A consultar certificados emitidos...
          </div>
        ) : certificates.length === 0 ? (
          <div className="glass-card cert-empty-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <Award size={44} color="#00C7FD" style={{ margin: '0 auto 0.85rem auto', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Nenhum Certificado Emitido Ainda
            </h3>
            <p style={{ color: '#94A3B8', maxWidth: '500px', margin: '0 auto 1.25rem auto', fontSize: '0.85rem', lineHeight: '1.6' }}>
              O certificado digital de formação profissional é emitido pela coordenação pedagógica da Zaty Academy após conclusão das aulas e aprovação do requerimento oficial.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={16} />
                <span>SOLICITAR CERTIFICADO OFICIAL</span>
              </button>
              <Link to="/estudante/cursos" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                CONTINUAR AULAS DO CURSO
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Resumo de Indicadores dos Certificados */}
            <div className="grid-3 cert-summary-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Certificados Emitidos</span>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginTop: '0.2rem', lineHeight: 1.2 }}>
                  {certificates.length}
                </div>
              </div>

              <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Autenticidade Oficial</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                    {certificates.filter(c => c.status === 'valido').length} Válido{certificates.filter(c => c.status === 'valido').length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Carga Horária Total</span>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#00C7FD', marginTop: '0.2rem', lineHeight: 1.2 }}>
                  {certificates.reduce((acc, c) => acc + Number(c.workload_hours || 0), 0)} Horas
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

            {certificates.map(cert => {
              const statusInfo = getStatusBadgeInfo(cert.status);

              return (
                <div key={cert.id} className="glass-card certificate-card">
                  {/* Cabeçalho do Card: Estado & Registo Oficial */}
                  <div className="cert-card-header">
                    <span className={`badge ${statusInfo.bg} cert-status-badge`}>
                      {statusInfo.label}
                    </span>
                    <span className="cert-reg-number">
                      Registo: <strong>{cert.certificate_number}</strong>
                    </span>
                  </div>

                  {/* Nome do Curso */}
                  <h2 className="cert-course-title">
                    {cert.course?.title}
                  </h2>

                  {/* Bloco de Informações Académicas (Carga Horária & Conclusão) */}
                  <div className="cert-meta-grid">
                    <div className="cert-meta-box">
                      <span className="cert-meta-label">Carga Horária</span>
                      <div className="cert-meta-val">
                        <Clock size={13} color="#00C7FD" style={{ flexShrink: 0 }} />
                        <span>{cert.workload_hours} Horas Lectivas</span>
                      </div>
                    </div>

                    <div className="cert-meta-box">
                      <span className="cert-meta-label">Data de Conclusão</span>
                      <div className="cert-meta-val">
                        <Calendar size={13} color="#00C7FD" style={{ flexShrink: 0 }} />
                        <span>{formatDate(cert.completion_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Ações Principais do Certificado */}
                  <div className="cert-btn-grid">
                    <button
                      type="button"
                      onClick={() => handlePreview(cert)}
                      className="btn btn-secondary btn-sm mobile-cert-action-btn"
                      title="Pré-visualizar Certificado Oficial"
                    >
                      <Eye size={14} color="#00C7FD" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(cert)}
                      disabled={generatingId === cert.id || cert.status !== 'valido'}
                      className="btn btn-primary btn-sm mobile-cert-action-btn"
                      title="Descarregar Certificado em PDF"
                    >
                      <Download size={14} />
                      <span>{generatingId === cert.id ? 'A Gerar...' : 'Baixar PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrint(cert)}
                      disabled={generatingId === cert.id || cert.status !== 'valido'}
                      className="btn btn-outline btn-sm mobile-cert-action-btn"
                      title="Imprimir Certificado Diretamente"
                    >
                      <Printer size={14} />
                      <span>Imprimir</span>
                    </button>
                  </div>

                  {/* Painel de Validação Pública & Anti-Fraude */}
                  <div className="cert-validation-panel">
                    <div className="cert-val-info">
                      <div className="cert-val-title">
                        <ShieldCheck size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                        <span>CÓDIGO DE VALIDAÇÃO ANTI-FRAUDE</span>
                      </div>
                      <div className="cert-val-code">
                        {cert.validation_code}
                      </div>
                      <span className="cert-val-subtext">
                        Partilhe este código para comprovação pública da autenticidade oficial.
                      </span>
                    </div>

                    <div className="cert-val-btn-grid">
                      <button 
                        type="button"
                        onClick={() => handleCopyCode(cert.validation_code)}
                        className="btn btn-secondary btn-sm cert-val-btn"
                        title="Copiar código de validação"
                      >
                        {copiedCode === cert.validation_code ? (
                          <>
                            <Check size={14} color="#10B981" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copiar Código</span>
                          </>
                        )}
                      </button>

                      <Link 
                        to={`/validar/${cert.validation_code}`}
                        target="_blank"
                        className="btn btn-outline btn-sm cert-val-btn"
                        title="Verificar página de validação pública"
                      >
                        <ExternalLink size={14} />
                        <span>Página Pública</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

        {/* MODAL DE PRÉ-VISUALIZAÇÃO DO CERTIFICADO */}
        <Modal 
          isOpen={!!previewCert} 
          onClose={() => {
            if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
            setPreviewCert(null);
            setPreviewBlobUrl(null);
          }} 
          title={`Certificado Oficial: ${previewCert?.certificate_number || ''}`}
          maxWidth="900px"
        >
          {previewLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              <div style={{ fontSize: '1.1rem', color: '#00C7FD', marginBottom: '0.5rem' }}>A gerar pré-visualização oficial...</div>
              <p style={{ fontSize: '0.85rem' }}>Renderizando documento de alta resolução com carimbo e assinaturas.</p>
            </div>
          ) : (
            <div>
              <div style={{
                background: '#0B132B',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1.25rem',
                minHeight: '300px'
              }}>
                {previewBlobUrl && (
                  <iframe 
                    src={previewBlobUrl} 
                    title="Pré-visualização do Certificado"
                    style={{ width: '100%', height: 'clamp(300px, 55vh, 480px)', border: 'none' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                  Código Anti-fraude: <strong style={{ color: '#00C7FD', fontFamily: 'monospace' }}>{previewCert?.validation_code}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePrint(previewCert)}
                    className="btn btn-secondary"
                  >
                    <Printer size={16} />
                    Imprimir
                  </button>
                  <button
                    onClick={() => handleDownload(previewCert)}
                    className="btn btn-primary"
                  >
                    <Download size={16} />
                    Descarregar PDF
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                      setPreviewCert(null);
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

        {/* MODAL DE REQUERIMENTO OFICIAL DE CERTIFICADO */}
        <CertificateRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          student={student}
          onSuccess={loadAllData}
        />
      </main>
    </div>
  );
}

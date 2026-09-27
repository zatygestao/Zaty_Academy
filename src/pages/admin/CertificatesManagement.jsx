import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllCertificates, 
  issueCertificate, 
  revokeCertificate, 
  getStudents, 
  getCourses,
  getAllCertificateRequests,
  updateCertificateRequestStatus
} from '../../services/api';
import { generateCertificatePdf, printPdfDoc } from '../../services/pdfService';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Modal from '../../components/common/Modal';
import { formatDate, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  Award, 
  Plus, 
  Download, 
  ExternalLink, 
  Eye, 
  Printer, 
  Search,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Check,
  Send,
  UserCheck
} from 'lucide-react';

export default function CertificatesManagement() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates' | 'requests'
  const [certificates, setCertificates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestFilter, setRequestFilter] = useState('all');

  // Preview state
  const [previewCert, setPreviewCert] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [revokingCert, setRevokingCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Estados de Revisão de Requerimento
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updatingRequest, setUpdatingRequest] = useState(false);

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    courseId: '',
    workloadHours: 60,
    startDate: '',
    completionDate: new Date().toISOString().split('T')[0],
    finalGrade: '16/20 Valores (Bom com Distinção)',
    classification: 'Apto com Distinção',
    fromRequestId: null
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, stdsRes, crs, reqs] = await Promise.all([
        getAllCertificates(),
        getStudents({ status: 'ativo', limit: 100 }),
        getCourses(true),
        getAllCertificateRequests()
      ]);
      setCertificates(certs || []);
      setStudents(stdsRes.students || []);
      setCourses(crs || []);
      setRequests(reqs || []);

      if (stdsRes.students?.length > 0 && !issueForm.studentId) {
        setIssueForm(prev => ({ ...prev, studentId: stdsRes.students[0].id }));
      }
      if (crs?.length > 0 && !issueForm.courseId) {
        setIssueForm(prev => ({ ...prev, courseId: crs[0].id, workloadHours: crs[0].workload_hours }));
      }
    } catch (err) {
      console.error('Erro ao carregar certificados e requerimentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveCertData = (cert) => {
    const fullStudent = students.find(s => s.id === (cert.student_id || cert.student?.id));
    const student = { ...(fullStudent || {}), ...(cert.student || {}) };
    const fullCourse = courses.find(c => c.id === (cert.course_id || cert.course?.id));
    const course = { ...(fullCourse || {}), ...(cert.course || {}) };
    return {
      certificate: {
        ...cert,
        certificate_number: cert.certificate_number || cert.certificate_code || `CERT-ZA-${new Date().getFullYear()}-0001`,
        validation_code: cert.validation_code || cert.certificate_code || cert.code || 'ZA-VAL-0000-0000',
        workload_hours: cert.workload_hours || course?.workload_hours || 60,
        start_date: cert.start_date,
        final_grade: cert.final_grade || '16/20 Valores (Bom com Distinção)',
        classification: cert.classification || 'Apto com Distinção'
      },
      student,
      course
    };
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.studentId || !issueForm.courseId) return;

    setSubmitting(true);
    try {
      const createdCert = await issueCertificate({
        studentId: issueForm.studentId,
        courseId: issueForm.courseId,
        workloadHours: Number(issueForm.workloadHours),
        startDate: issueForm.startDate || null,
        completionDate: issueForm.completionDate,
        finalGrade: issueForm.finalGrade,
        classification: issueForm.classification,
        issuedBy: user?.id
      });

      // Se a emissão teve origem num Requerimento de Estudante, finaliza o requerimento e notifica
      if (issueForm.fromRequestId && createdCert?.id) {
        try {
          await updateCertificateRequestStatus(issueForm.fromRequestId, {
            status: 'concluido',
            certificateId: createdCert.id,
            adminNotes: 'Certificado oficial emitido com sucesso e vinculado ao requerimento.',
            adminUserId: user?.id
          });
        } catch (errReq) {
          console.warn('Aviso ao vincular requerimento ao certificado:', errReq);
        }
      }

      setShowIssueModal(false);
      setIssueForm(prev => ({ ...prev, fromRequestId: null }));
      await loadData();

      // Imediatamente abre a pré-visualização oficial do certificado gerado
      if (createdCert) {
        handlePreview(createdCert);
      }
    } catch (err) {
      console.error('Erro ao emitir certificado:', err);
      alert('Falha ao emitir certificado: ' + (err?.message || 'Verifique as permissões'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = (req) => {
    setSelectedRequest(req);
    setReviewNotes(req.admin_notes || '');
    setRejectionReason(req.rejection_reason || '');
    setReviewModalOpen(true);
  };

  const handleUpdateRequestStatus = async (newStatus, extra = {}) => {
    if (!selectedRequest) return;
    setUpdatingRequest(true);
    try {
      await updateCertificateRequestStatus(selectedRequest.id, {
        status: newStatus,
        adminNotes: reviewNotes,
        rejectionReason: extra.rejectionReason || rejectionReason,
        adminUserId: user?.id
      });
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      setRejectionReason('');
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar requerimento:', err);
      alert('Erro ao atualizar estado do requerimento: ' + (err?.message || 'Falha de comunicação.'));
    } finally {
      setUpdatingRequest(false);
    }
  };

  const handleOpenIssueFromRequest = (req) => {
    setIssueForm({
      studentId: req.student_id,
      courseId: req.course_id,
      workloadHours: req.course?.workload_hours || 60,
      startDate: '',
      completionDate: new Date().toISOString().split('T')[0],
      finalGrade: '16/20 Valores (Bom com Distinção)',
      classification: 'Apto com Distinção',
      fromRequestId: req.id
    });
    setReviewModalOpen(false);
    setShowIssueModal(true);
  };

  const getAdminRequestBadge = (status) => {
    switch (status) {
      case 'pendente':
        return { label: 'Pendente', bg: 'badge-warning', color: '#F59E0B' };
      case 'em_analise':
        return { label: 'Em Análise', bg: 'badge-info', color: '#00C7FD' };
      case 'aprovado':
        return { label: 'Aprovado (Aguardando Pagamento)', bg: 'badge-primary', color: '#38BDF8' };
      case 'concluido':
        return { label: 'Concluído', bg: 'badge-success', color: '#10B981' };
      case 'rejeitado':
        return { label: 'Rejeitado', bg: 'badge-danger', color: '#EF4444' };
      default:
        return { label: status, bg: 'badge-secondary', color: '#94A3B8' };
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pendente').length;

  const filteredRequests = requests.filter(req => {
    if (requestFilter !== 'all' && req.status !== requestFilter) return false;
    if (!requestSearchTerm.trim()) return true;
    const term = requestSearchTerm.toLowerCase();
    const studentName = req.student?.full_name?.toLowerCase() || '';
    const studentCode = req.student?.student_code?.toLowerCase() || '';
    const courseTitle = (req.course?.name || req.course?.title || '').toLowerCase();
    const reqNum = (req.request_number || '').toLowerCase();
    return studentName.includes(term) || studentCode.includes(term) || courseTitle.includes(term) || reqNum.includes(term);
  });

  const handlePreview = async (rawCert) => {
    const { certificate, student, course } = resolveCertData(rawCert);
    setPreviewCert(certificate);
    setPreviewLoading(true);
    try {
      const doc = await generateCertificatePdf({
        certificate,
        student,
        course,
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

  const handleDownload = async (rawCert) => {
    const { certificate, student, course } = resolveCertData(rawCert);
    setGeneratingId(certificate.id);
    try {
      const doc = await generateCertificatePdf({
        certificate,
        student,
        course,
        settings
      });

      doc.save(`Certificado_${certificate.certificate_number}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
      alert('Falha ao descarregar PDF.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePrint = async (rawCert) => {
    const { certificate, student, course } = resolveCertData(rawCert);
    setGeneratingId(certificate.id);
    try {
      const doc = await generateCertificatePdf({
        certificate,
        student,
        course,
        settings
      });
      printPdfDoc(doc);
    } catch (err) {
      console.error('Erro ao imprimir certificado:', err);
      alert('Falha ao acionar impressão do certificado.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingCert || !revokeReason.trim()) return;
    try {
      await revokeCertificate(revokingCert.id, revokeReason.trim());
      setRevokingCert(null);
      setRevokeReason('');
      loadData();
    } catch (err) {
      console.error('Erro ao revogar certificado:', err);
      alert('Falha ao revogar certificado.');
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const studentName = cert.student?.full_name?.toLowerCase() || '';
    const studentCode = cert.student?.student_code?.toLowerCase() || '';
    const certNum = cert.certificate_number?.toLowerCase() || '';
    const valCode = cert.validation_code?.toLowerCase() || '';
    const courseTitle = cert.course?.title?.toLowerCase() || '';
    return studentName.includes(term) || studentCode.includes(term) || certNum.includes(term) || valCode.includes(term) || courseTitle.includes(term);
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
              Emissão & Validação de Certificados
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Geração de certificados digitais oficiais em PDF com carimbo institucional e QR Code anti-fraude.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => setShowIssueModal(true)} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
          >
            <Plus size={16} />
            <span>EMITIR NOVO CERTIFICADO</span>
          </button>
        </div>

        {/* ABAS PRINCIPAIS: CERTIFICADOS EMITIDOS VS REQUERIMENTOS RECEBIDOS */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            style={{
              background: activeTab === 'certificates' ? 'linear-gradient(135deg, rgba(0, 114, 181, 0.4), rgba(0, 199, 253, 0.2))' : 'rgba(0, 42, 78, 0.4)',
              border: activeTab === 'certificates' ? '1px solid #00C7FD' : '1px solid rgba(255, 255, 255, 0.1)',
              color: activeTab === 'certificates' ? '#FFFFFF' : '#94A3B8',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Award size={16} color={activeTab === 'certificates' ? '#00C7FD' : '#94A3B8'} />
            <span>Certificados Emitidos</span>
            <span style={{ 
              background: 'rgba(0, 199, 253, 0.2)', 
              color: '#00C7FD', 
              fontSize: '0.75rem', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '9999px',
              fontWeight: '800'
            }}>
              {certificates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              background: activeTab === 'requests' ? 'linear-gradient(135deg, rgba(0, 114, 181, 0.4), rgba(0, 199, 253, 0.2))' : 'rgba(0, 42, 78, 0.4)',
              border: activeTab === 'requests' ? '1px solid #00C7FD' : '1px solid rgba(255, 255, 255, 0.1)',
              color: activeTab === 'requests' ? '#FFFFFF' : '#94A3B8',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} color={activeTab === 'requests' ? '#00C7FD' : '#94A3B8'} />
            <span>Requerimentos de Estudantes</span>
            {pendingRequestsCount > 0 ? (
              <span style={{ 
                background: 'rgba(245, 158, 11, 0.25)', 
                color: '#F59E0B', 
                fontSize: '0.75rem', 
                padding: '0.15rem 0.55rem', 
                borderRadius: '9999px',
                fontWeight: '800',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                {pendingRequestsCount} Pendente{pendingRequestsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                color: '#94A3B8', 
                fontSize: '0.75rem', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '9999px' 
              }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* ============================================================
            ABA 1: CERTIFICADOS EMITIDOS
            ============================================================ */}
        {activeTab === 'certificates' && (
          <>
            {/* Resumo de Indicadores Administrativos */}
            {!loading && certificates.length > 0 && (
              <div className="grid-3 cert-summary-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Emitidos</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginTop: '0.2rem', lineHeight: 1.2 }}>
                    {certificates.length}
                  </div>
                </div>

            <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Certificados Ativos</span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {certificates.filter(c => c.status === 'valido').length}
              </div>
            </div>

            <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Certificados Revogados</span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#EF4444', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {certificates.filter(c => c.status === 'revogado').length}
              </div>
            </div>
          </div>
        )}

        {/* Barra de Pesquisa */}
        <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '420px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por estudante, código, registo..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Tabela de Certificados */}
        <div className="glass-card certificate-card" style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              A carregar certificados...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <Award size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>{searchTerm ? 'Nenhum certificado encontrado para esta pesquisa.' : 'Nenhum certificado emitido até ao momento.'}</p>
            </div>
          ) : (
            <>
              {/* VISÃO DESKTOP: Tabela Tradicional (≥ 769px) */}
              <div className="certificates-desktop-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudante</th>
                      <th>Curso</th>
                      <th>Registo / Código</th>
                      <th>Carga</th>
                      <th>Data Emissão</th>
                      <th>Estado</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCertificates.map(cert => {
                      const statusInfo = getStatusBadgeInfo(cert.status);

                      return (
                        <tr key={cert.id}>
                          <td>
                            <strong style={{ color: '#FFFFFF' }}>{cert.student?.full_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                              {cert.student?.student_code}
                            </div>
                          </td>
                          <td>{cert.course?.title}</td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#FFFFFF' }}>
                              {cert.certificate_number}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                              {cert.validation_code}
                            </div>
                          </td>
                          <td>{cert.workload_hours}h</td>
                          <td>{formatDate(cert.issue_date)}</td>
                          <td>
                            <span className={`badge ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {/* Visualizar */}
                              <button
                                type="button"
                                onClick={() => handlePreview(cert)}
                                className="btn btn-secondary btn-sm"
                                title="Visualizar Certificado Oficial"
                              >
                                <Eye size={14} />
                                <span>Ver</span>
                              </button>

                              {/* Baixar PDF */}
                              <button
                                type="button"
                                onClick={() => handleDownload(cert)}
                                disabled={generatingId === cert.id || cert.status !== 'valido'}
                                className="btn btn-primary btn-sm"
                                title="Descarregar Certificado em PDF"
                              >
                                <Download size={14} />
                                <span>{generatingId === cert.id ? '...' : 'PDF'}</span>
                              </button>

                              {/* Imprimir */}
                              <button
                                type="button"
                                onClick={() => handlePrint(cert)}
                                disabled={generatingId === cert.id || cert.status !== 'valido'}
                                className="btn btn-outline btn-sm"
                                title="Imprimir Certificado Diretamente"
                              >
                                <Printer size={14} />
                              </button>

                              {/* Validação Pública */}
                              <Link
                                to={`/validar/${cert.validation_code}`}
                                target="_blank"
                                className="btn btn-outline btn-sm"
                                title="Ver Validação Pública"
                              >
                                <ExternalLink size={14} />
                              </Link>

                              {/* Revogar */}
                              {cert.status === 'valido' && (
                                <button
                                  type="button"
                                  onClick={() => setRevokingCert(cert)}
                                  className="btn btn-danger btn-sm"
                                  title="Revogar Certificado"
                                >
                                  <span>Revogar</span>
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

              {/* VISÃO MOBILE: Cards de Gestão de Certificados (≤ 768px) */}
              <div className="certificates-mobile-cards">
                {filteredCertificates.map(cert => {
                  const statusInfo = getStatusBadgeInfo(cert.status);

                  return (
                    <div key={cert.id} className="mobile-admin-cert-card">
                      {/* Topo: Estudante e Estado */}
                      <div className="mobile-admin-cert-header">
                        <div>
                          <strong style={{ color: '#FFFFFF', fontSize: '0.92rem' }}>
                            {cert.student?.full_name}
                          </strong>
                          <div style={{ fontSize: '0.74rem', color: '#00C7FD', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                            {cert.student?.student_code || 'Estudante'}
                          </div>
                        </div>

                        <span className={`badge ${statusInfo.bg}`} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Curso */}
                      <div style={{ color: '#E2E8F0', fontSize: '0.88rem', fontWeight: '600', borderTop: '1px solid rgba(0, 163, 224, 0.15)', paddingTop: '0.6rem' }}>
                        {cert.course?.title}
                      </div>

                      {/* Metadados: Registo & Código, Carga & Emissão */}
                      <div className="mobile-admin-cert-meta">
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' }}>Registo</span>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#FFFFFF', fontWeight: '700' }}>
                            {cert.certificate_number}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#00C7FD' }}>
                            {cert.validation_code}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' }}>Carga & Emissão</span>
                          <div style={{ fontSize: '0.82rem', color: '#FFFFFF', fontWeight: '600' }}>
                            {cert.workload_hours} Horas
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {formatDate(cert.issue_date)}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação Simétricos no Mobile */}
                      <div className="mobile-admin-cert-actions">
                        <button
                          type="button"
                          onClick={() => handlePreview(cert)}
                          className="btn btn-secondary btn-sm mobile-admin-action-btn"
                          title="Visualizar Certificado Oficial"
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(cert)}
                          disabled={generatingId === cert.id || cert.status !== 'valido'}
                          className="btn btn-primary btn-sm mobile-admin-action-btn"
                          title="Descarregar Certificado em PDF"
                        >
                          <Download size={14} />
                          <span>{generatingId === cert.id ? '...' : 'PDF'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrint(cert)}
                          disabled={generatingId === cert.id || cert.status !== 'valido'}
                          className="btn btn-outline btn-sm mobile-admin-action-btn"
                          title="Imprimir Certificado"
                        >
                          <Printer size={14} />
                          <span>Imprimir</span>
                        </button>

                        <Link
                          to={`/validar/${cert.validation_code}`}
                          target="_blank"
                          className="btn btn-outline btn-sm mobile-admin-action-btn"
                          title="Ver Validação Pública"
                        >
                          <ExternalLink size={14} />
                          <span>Validar</span>
                        </Link>

                        {cert.status === 'valido' && (
                          <button
                            type="button"
                            onClick={() => setRevokingCert(cert)}
                            className="btn btn-danger btn-sm mobile-admin-action-btn"
                            title="Revogar Certificado"
                          >
                            <span>Revogar</span>
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
      </>
    )}

    {/* ============================================================
        ABA 2: REQUERIMENTOS DE CERTIFICADOS RECEBIDOS
        ============================================================ */}
    {activeTab === 'requests' && (
      <div>
        {/* Indicadores de Requerimentos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Requerimentos</span>
            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginTop: '0.2rem' }}>
              {requests.length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendentes de Análise</span>
            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.2rem' }}>
              {requests.filter(r => r.status === 'pendente').length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aprovados (Aguardando Pgto)</span>
            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#38BDF8', marginTop: '0.2rem' }}>
              {requests.filter(r => r.status === 'aprovado').length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Concluídos / Emitidos</span>
            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem' }}>
              {requests.filter(r => r.status === 'concluido').length}
            </div>
          </div>
        </div>

        {/* Barra de Filtros & Pesquisa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Filtros por Estado */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pendente', label: 'Pendentes' },
              { id: 'em_analise', label: 'Em Análise' },
              { id: 'aprovado', label: 'Aprovados' },
              { id: 'concluido', label: 'Concluídos' },
              { id: 'rejeitado', label: 'Rejeitados' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRequestFilter(f.id)}
                style={{
                  background: requestFilter === f.id ? 'linear-gradient(135deg, #0072B5, #00C7FD)' : 'rgba(0, 42, 78, 0.5)',
                  border: requestFilter === f.id ? '1px solid #00C7FD' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: requestFilter === f.id ? '#FFFFFF' : '#94A3B8',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: requestFilter === f.id ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Input de Pesquisa */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              value={requestSearchTerm}
              onChange={e => setRequestSearchTerm(e.target.value)}
              placeholder="Filtrar por estudante, curso..."
              className="form-input"
              style={{ paddingLeft: '2rem', fontSize: '0.825rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Listagem de Requerimentos */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              A carregar requerimentos de estudantes...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <FileText size={40} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>{requestSearchTerm || requestFilter !== 'all' ? 'Nenhum requerimento encontrado para este filtro.' : 'Nenhum requerimento oficial recebido até ao momento.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredRequests.map(req => {
                const badge = getAdminRequestBadge(req.status);
                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(2, 11, 20, 0.7)',
                      border: req.status === 'pendente' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD', fontSize: '0.85rem' }}>
                          {req.request_number || 'REQ-ZA'}
                        </span>
                        <span style={{ color: '#64748B' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          {formatDate(req.created_at)}
                        </span>
                        <span className={`badge ${badge.bg}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                        {req.student?.full_name || 'Estudante não identificado'}
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                          ({req.student?.student_code || '---'})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.825rem', color: '#CBD5E1', marginBottom: '0.25rem' }}>
                        Curso: <strong style={{ color: '#00C7FD' }}>{req.course?.name || req.course?.title || 'Não especificado'}</strong>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        Finalidade: <span style={{ color: '#E2E8F0' }}>{req.purpose || 'Conclusão de Estudos'}</span>
                        {req.notes && <span style={{ marginLeft: '0.75rem', color: '#94A3B8' }}>• {req.notes}</span>}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {req.status === 'aprovado' && (
                        <button
                          type="button"
                          onClick={() => handleOpenIssueFromRequest(req)}
                          className="btn btn-primary btn-sm"
                          style={{ 
                            fontSize: '0.78rem', 
                            padding: '0.45rem 0.85rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.35rem',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none'
                          }}
                        >
                          <Award size={14} />
                          <span>Emitir Certificado</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenReview(req)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FileText size={14} />
                        <span>Tramitar / Analisar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* MODAL DE REVISÃO E TRAMITAÇÃO DE REQUERIMENTO */}
    <Modal
      isOpen={reviewModalOpen}
      onClose={() => {
        setReviewModalOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
      }}
      title={`Tramitação de Requerimento: ${selectedRequest?.request_number || ''}`}
      maxWidth="640px"
    >
      {selectedRequest && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Resumo do Requerimento */}
          <div style={{ 
            background: 'rgba(0, 42, 78, 0.45)', 
            border: '1px solid rgba(0, 163, 224, 0.25)', 
            borderRadius: '8px', 
            padding: '1.1rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Entrada a: <strong>{formatDate(selectedRequest.created_at)}</strong>
              </span>
              <span className={`badge ${getAdminRequestBadge(selectedRequest.status).bg}`} style={{ fontSize: '0.78rem' }}>
                {getAdminRequestBadge(selectedRequest.status).label}
              </span>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Requerente:</span>
                <strong style={{ color: '#FFFFFF' }}>{selectedRequest.student?.full_name}</strong>
                <div style={{ color: '#00C7FD', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {selectedRequest.student?.student_code}
                </div>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Curso a Certificar:</span>
                <strong style={{ color: '#FFFFFF' }}>{selectedRequest.course?.name || selectedRequest.course?.title}</strong>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Finalidade:</span>
                <span style={{ color: '#E2E8F0' }}>{selectedRequest.purpose || 'Conclusão de Estudos'}</span>
              </div>

              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Contacto:</span>
                <span style={{ color: '#E2E8F0' }}>{selectedRequest.student?.phone || selectedRequest.student?.email || '---'}</span>
              </div>
            </div>

            {selectedRequest.notes && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.825rem' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>Observações do Estudante:</span>
                <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>{selectedRequest.notes}</span>
              </div>
            )}
          </div>

          {/* Campo de Notas Administrativas Internas */}
          <div className="form-group">
            <label className="form-label">Notas da Direção / Despacho Interno</label>
            <textarea
              rows="2"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Ex: Parecer favorável emitido pela coordenação pedagógica."
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Alerta Institucional da Mensagem Obrigatória de Aprovação */}
          <div style={{ 
            background: 'rgba(56, 189, 248, 0.1)', 
            border: '1px solid rgba(56, 189, 248, 0.3)', 
            padding: '0.85rem', 
            borderRadius: '6px', 
            fontSize: '0.8rem',
            color: '#BAE6FD',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}>
            <CheckCircle2 size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Notificação Automática de Aprovação:</strong>
              <br />
              Ao clicar em <em>"Aprovar Pedido"</em>, o estudante receberá de imediato no seu painel a mensagem oficial:
              <div style={{ color: '#FFFFFF', fontStyle: 'italic', marginTop: '0.25rem', paddingLeft: '0.5rem', borderLeft: '2px solid #38BDF8' }}>
                «O seu pedido de certificado foi aceite. Por favor, efetue o pagamento para levantar o seu certificado.»
              </div>
            </div>
          </div>

          {/* Opção de Rejeição */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ color: '#FCA5A5' }}>
              Motivo da Rejeição (preencher apenas se recusar o pedido)
            </label>
            <input
              type="text"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ex: Não cumpre a carga horária mínima / Pendência documental..."
              className="form-input"
            />
          </div>

          {/* Botões de Ação do Despacho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selectedRequest.status !== 'rejeitado' && (
                <button
                  type="button"
                  disabled={updatingRequest}
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert('Por favor, informe o motivo da rejeição no campo indicado.');
                      return;
                    }
                    if (window.confirm('Tem certeza de que deseja rejeitar este requerimento?')) {
                      handleUpdateRequestStatus('rejeitado', { rejectionReason });
                    }
                  }}
                  className="btn btn-outline"
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.8rem' }}
                >
                  <XCircle size={14} />
                  <span>Rejeitar</span>
                </button>
              )}

              {selectedRequest.status !== 'em_analise' && selectedRequest.status !== 'aprovado' && selectedRequest.status !== 'concluido' && (
                <button
                  type="button"
                  disabled={updatingRequest}
                  onClick={() => handleUpdateRequestStatus('em_analise')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  <span>Marcar Em Análise</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selectedRequest.status !== 'aprovado' && selectedRequest.status !== 'concluido' && (
                <button
                  type="button"
                  disabled={updatingRequest}
                  onClick={() => handleUpdateRequestStatus('aprovado')}
                  className="btn btn-primary"
                  style={{ 
                    fontSize: '0.8rem', 
                    background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Aprovar Pedido (Aguardando Pagamento)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenIssueFromRequest(selectedRequest)}
                className="btn btn-primary"
                style={{ 
                  fontSize: '0.8rem', 
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Award size={14} />
                <span>Emitir Certificado Agora</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </Modal>

    {/* MODAL DE EMISSÃO DE CERTIFICADO */}
    <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Emitir Certificado Digital de Conclusão" maxWidth="580px">
          <form onSubmit={handleIssue}>
            <div className="form-group">
              <label className="form-label">Selecione o Estudante *</label>
              <select
                value={issueForm.studentId}
                onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                className="form-select"
                required
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Curso Concluído *</label>
              <select
                value={issueForm.courseId}
                onChange={e => {
                  const c = courses.find(course => course.id === e.target.value);
                  setIssueForm({
                    ...issueForm,
                    courseId: e.target.value,
                    workloadHours: c?.workload_hours || 60
                  });
                }}
                className="form-select"
                required
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.workload_hours}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Carga Horária (Horas) *</label>
                <input
                  type="number"
                  value={issueForm.workloadHours}
                  onChange={e => setIssueForm({ ...issueForm, workloadHours: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input
                  type="date"
                  value={issueForm.startDate}
                  onChange={e => setIssueForm({ ...issueForm, startDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Conclusão *</label>
                <input
                  type="date"
                  value={issueForm.completionDate}
                  onChange={e => setIssueForm({ ...issueForm, completionDate: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nota / Classificação Final *</label>
                <input
                  type="text"
                  value={issueForm.finalGrade}
                  onChange={e => setIssueForm({ ...issueForm, finalGrade: e.target.value })}
                  placeholder="Ex: 16/20 Valores (Bom com Distinção)"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mencão Qualitativa</label>
                <input
                  type="text"
                  value={issueForm.classification}
                  onChange={e => setIssueForm({ ...issueForm, classification: e.target.value })}
                  placeholder="Ex: Apto com Distinção"
                  className="form-input"
                />
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 114, 206, 0.15)',
              border: '1px solid rgba(0, 199, 253, 0.3)',
              borderRadius: '4px',
              padding: '0.85rem 1rem',
              fontSize: '0.825rem',
              color: '#BAE6FD',
              marginBottom: '1.25rem'
            }}>
              Ao emitir, o sistema gerará automaticamente o código anti-fraude e o QR Code de validação pública oficial da Zaty Academy.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A emitir certificado...' : 'Emitir Certificado Oficial'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL DE REVOGAÇÃO */}
        <Modal isOpen={!!revokingCert} onClose={() => setRevokingCert(null)} title="Revogar Certificado" maxWidth="480px">
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.15rem' }}>
            A revogação invalida publicamente o certificado <strong>{revokingCert?.certificate_number}</strong>. Ao ler o QR Code, a página de validação exibirá o estado de REVOGADO.
          </p>

          <div className="form-group">
            <label className="form-label">Motivo da Revogação *</label>
            <textarea
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder="Ex: Cancelamento de matrícula / Inconsistência documental..."
              className="form-textarea"
              rows="3"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button type="button" onClick={() => setRevokingCert(null)} className="btn btn-secondary">Cancelar</button>
            <button type="button" onClick={handleRevokeConfirm} className="btn btn-danger">Confirmar Revogação</button>
          </div>
        </Modal>

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
                    type="button"
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
      </main>
    </div>
  );
}

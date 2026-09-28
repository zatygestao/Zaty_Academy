import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import { getStudentAssignments, submitStudentAssignment } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Award, 
  X, 
  MessageSquare, 
  FileCheck,
  RotateCcw
} from 'lucide-react';

export default function StudentAssignments() {
  const { student, user } = useAuth();
  const studentId = student?.id;

  const activeEnrollment = student?.enrollments?.[0];
  const isCourseCompleted = activeEnrollment?.status === 'concluido' || 
    (typeof activeEnrollment?.final_grade === 'string' && activeEnrollment?.final_grade.toUpperCase().includes('APROVADO'));

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de Submissão
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadAssignments = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await getStudentAssignments(studentId);
      setAssignments(data || []);
    } catch (err) {
      console.error('Erro ao carregar trabalhos do estudante:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [studentId]);

  const handleOpenSubmitModal = (asg) => {
    setSelectedAssignment(asg);
    setSelectedFile(null);
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setSubmitError('Apenas ficheiros no formato PDF (.pdf) ou Word (.docx) são aceites.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSubmitError('O ficheiro excede o limite máximo de 20MB.');
      setSelectedFile(null);
      return;
    }

    setSubmitError('');
    setSelectedFile(file);
  };

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setSubmitError('Por favor selecione um ficheiro PDF ou DOCX.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await submitStudentAssignment({
        assignmentId: selectedAssignment.id,
        studentId,
        file: selectedFile
      });

      setSubmitSuccess(true);
      await loadAssignments();
      setTimeout(() => {
        setSelectedAssignment(null);
      }, 1500);
    } catch (err) {
      console.error('Erro ao enviar trabalho:', err);
      setSubmitError(err.message || 'Falha ao enviar o ficheiro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
            Trabalhos e Atividades Académicas
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Consulte as tarefas publicadas pelos seus formadores, envie os seus ficheiros (PDF/DOCX) e acompanhe as notas.
          </p>
        </div>

        {/* BANNER OFICIAL DE CURSO CONCLUÍDO & CERTIFICADO EMITIDO */}
        {isCourseCompleted && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 199, 253, 0.12) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: '8px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 300px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={24} color="#34D399" />
              </div>
              <div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'inline-block' }}>
                  Atividades Encerradas — Curso Concluído
                </span>
                <p style={{ color: '#D1FAE5', fontSize: '0.885rem', lineHeight: 1.5, margin: 0, fontWeight: '600' }}>
                  “Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.”
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link
                to="/estudante/certificados"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Award size={14} />
                <span>Ver Meu Certificado</span>
              </Link>
              <Link
                to="/estudante/atualizar-curso"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={14} />
                <span>Atualizar Percurso</span>
              </Link>
            </div>
          </div>
        )}

        {/* Resumo de Indicadores dos Trabalhos */}
        {!loading && assignments.length > 0 && (
          <div className="grid-3 cert-summary-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total de Trabalhos</span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {assignments.length}
              </div>
            </div>

            <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avaliados / Concluídos</span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {assignments.filter(a => a.submission?.grade !== null && a.submission?.grade !== undefined).length}
              </div>
            </div>

            <div className="glass-card cert-stat-card" style={{ padding: '1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendentes de Entrega</span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#00C7FD', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {assignments.filter(a => !a.submission).length}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Trabalhos */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar os seus trabalhos...
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Nenhum trabalho atribuído de momento
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Quando os seus formadores publicarem trabalhos para as suas turmas, eles serão listados aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {assignments.map(asg => {
                const sub = asg.submission;
                const isOverdue = new Date() > new Date(asg.due_date);
                const isGraded = sub && sub.grade !== null && sub.grade !== undefined;
                const isSubmitted = sub && !isGraded;

                return (
                  <div
                    key={asg.id}
                    className="mobile-entity-card"
                    style={{
                      border: isGraded ? '1px solid rgba(16, 185, 129, 0.4)' : isSubmitted ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(0, 163, 224, 0.25)',
                      padding: '1.15rem'
                    }}
                  >
                    <div className="mobile-card-header">
                      <h3 style={{ fontSize: 'clamp(1.025rem, 3vw, 1.15rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                        {asg.title}
                      </h3>

                      <div>
                        {isGraded ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                            Nota: {sub.grade} / {asg.max_points || 20}
                          </span>
                        ) : isSubmitted ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            Entregue (Aguardando Nota)
                          </span>
                        ) : isOverdue ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                            Prazo Expirado
                          </span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadados Estruturados */}
                    <div className="mobile-card-meta">
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Turma & Curso</span>
                        <div style={{ color: '#FFFFFF', fontSize: '0.82rem', fontWeight: '600' }}>
                          {asg.class?.name || 'Turma'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#00C7FD' }}>
                          {asg.course?.title || 'Formação'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Prazo de Entrega</span>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: isOverdue && !sub ? '#EF4444' : '#FFFFFF' }}>
                          {formatDateTime(asg.due_date)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          Formador: {asg.teacher?.name || asg.teacher?.full_name || 'Corpo Docente'}
                        </div>
                      </div>
                    </div>

                    {/* Descrição e Enunciado */}
                    {asg.description && (
                      <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.6, background: 'rgba(0, 15, 30, 0.4)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                        {asg.description}
                      </div>
                    )}

                    {/* Ficheiro do Formador */}
                    {asg.attachment_url && (
                      <div>
                        <a
                          href={asg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Download size={14} /> Descarregar Enunciado / Guião da Tarefa
                        </a>
                      </div>
                    )}

                    {/* Bloco de Feedback do Formador (se avaliado) */}
                    {isGraded && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '6px',
                        padding: '0.85rem 1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#10B981', fontWeight: '700', fontSize: '0.85rem' }}>
                          <Award size={16} />
                          Classificação Atribuída: {sub.grade} de {asg.max_points || 20} Valores
                        </div>
                        {sub.feedback ? (
                          <div style={{ fontSize: '0.825rem', color: '#E2E8F0', marginTop: '0.35rem' }}>
                            <strong>Comentário do Formador:</strong> "{sub.feedback}"
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            Sem comentários adicionais registados.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rodapé da Atividade com Ação */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(0, 163, 224, 0.15)', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {sub ? (
                          <span>Ficheiro submetido: <strong style={{ color: '#FFFFFF' }}>{sub.file_name}</strong> ({formatDateTime(sub.submitted_at)})</span>
                        ) : (
                          <span>Formatos aceites: <strong>PDF ou Word (.docx)</strong> • Limite: 20MB</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub?.file_url && (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Download size={13} /> Ver Meu Envio
                          </a>
                        )}

                        {isCourseCompleted ? (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}>
                            ✓ Concluído & Certificado
                          </span>
                        ) : (!isGraded || (!isOverdue && isSubmitted)) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmitModal(asg)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Upload size={14} />
                            <span>{sub ? 'Substituir Envio' : 'Submeter Trabalho'}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL DE SUBMISSÃO DE FICHEIRO */}
        {selectedAssignment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 10, 25, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', border: '1px solid rgba(0, 199, 253, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={20} color="#00C7FD" />
                  Submeter Trabalho
                </h2>
                <button onClick={() => setSelectedAssignment(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
                Atividade: <strong style={{ color: '#FFFFFF' }}>{selectedAssignment.title}</strong>
              </p>

              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#10B981' }}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#FFFFFF' }}>Trabalho Submetido com Sucesso!</p>
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>O seu formador irá avaliar e atribuir a sua nota em breve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFile}>
                  {submitError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '0.75rem', color: '#FCA5A5', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                      {submitError}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Selecione o Ficheiro PDF ou Word (.docx) *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      required
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.35rem', display: 'block' }}>
                      Tamanho máximo permitido: 20 Megabytes.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setSelectedAssignment(null)} className="btn btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting || !selectedFile} className="btn btn-primary">
                      {submitting ? 'A enviar ficheiro...' : 'Enviar Submissão'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

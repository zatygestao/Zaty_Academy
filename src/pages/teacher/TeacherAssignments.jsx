import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import { 
  getClasses, 
  getTeacherAssignments, 
  createAssignment, 
  deleteAssignment, 
  getAssignmentSubmissions, 
  gradeAssignmentSubmission 
} from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  Award, 
  Download, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X, 
  Eye, 
  FileCheck, 
  AlertCircle,
  Lock
} from 'lucide-react';

export default function TeacherAssignments() {
  const { teacher, profile } = useAuth();
  const teacherId = teacher?.id || profile?.id;

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Criar Trabalho
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    class_id: '',
    description: '',
    due_date: '',
    max_points: 20
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal de Submissões e Bloqueio de Notas
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadData = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [allClasses, teacherAssignments] = await Promise.all([
        getClasses(),
        getTeacherAssignments(teacherId)
      ]);
      const myClasses = (allClasses || []).filter(c => c.teacher_id === teacherId);
      setClasses(myClasses);
      setAssignments(teacherAssignments || []);
    } catch (err) {
      console.error('Erro ao carregar trabalhos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      class_id: classes.length > 0 ? classes[0].id : '',
      description: '',
      due_date: '',
      max_points: 20
    });
    setAttachmentFile(null);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.class_id) {
      setFormError('Selecione uma turma para vincular o trabalho.');
      return;
    }
    if (!formData.due_date) {
      setFormError('Informe a data e hora limite de entrega.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const selectedClass = classes.find(c => c.id === formData.class_id);
      await createAssignment({
        teacher_id: teacherId,
        class_id: formData.class_id,
        course_id: selectedClass?.course_id || null,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        max_points: Number(formData.max_points) || 20,
        file: attachmentFile
      });

      setIsCreateModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Erro ao criar trabalho:', err);
      setFormError(err.message || 'Falha ao gravar o trabalho.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o trabalho "${title}"? Todas as submissões serão removidas.`)) {
      return;
    }

    try {
      await deleteAssignment(id);
      await loadData();
    } catch (err) {
      alert(`Falha ao eliminar trabalho: ${err.message}`);
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setActiveAssignment(assignment);
    setSelectedSubmission(null);
    setLoadingSubmissions(true);
    try {
      const subs = await getAssignmentSubmissions(assignment.id);
      setSubmissions(subs || []);
    } catch (err) {
      console.error('Erro ao carregar submissões:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSelectSubmissionForGrading = (sub) => {
    // Se a nota já foi lançada, fica bloqueada permanentemente para o formador
    if (sub.grade !== null && sub.grade !== undefined) {
      alert('Esta nota já se encontra confirmada e bloqueada na Pauta Oficial. Apenas o Administrador pode efetuar retificações mediante justificativa.');
      return;
    }

    setSelectedSubmission(sub);
    setGradingData({
      grade: '',
      feedback: sub.feedback || ''
    });
    setGradeError('');
  };

  // Abrir Modal de Confirmação e Bloqueio de Nota
  const handleRequestSaveGrade = (e) => {
    e.preventDefault();
    const val = Number(gradingData.grade);
    if (isNaN(val) || val < 0 || val > 20) {
      setGradeError('A nota deve estar rigorosamente entre 0 e 20 Valores.');
      return;
    }
    setGradeError('');
    setShowLockConfirmModal(true);
  };

  // Confirmar e Bloquear Definitivamente a Nota do Trabalho
  const handleExecuteConfirmGrade = async () => {
    setShowLockConfirmModal(false);
    const val = Number(gradingData.grade);
    setSavingGrade(true);
    setGradeError('');

    try {
      await gradeAssignmentSubmission(selectedSubmission.id, {
        grade: val,
        feedback: gradingData.feedback,
        teacherId
      });

      // Recarregar submissões atualizadas
      const subs = await getAssignmentSubmissions(activeAssignment.id);
      setSubmissions(subs || []);
      setSelectedSubmission(null);
      setSuccessToast(`Nota de ${val} Valores confirmada e bloqueada com sucesso! Lançada na Pauta Oficial de Avaliações.`);
      setTimeout(() => setSuccessToast(''), 6000);
      await loadData();
    } catch (err) {
      console.error('Erro ao avaliar trabalho:', err);
      setGradeError(err.message || 'Falha ao registar e bloquear a nota.');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Trabalhos Académicos
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Crie tarefas, receba ficheiros de estudantes e lance notas pedagógicas (0 a 20 Valores).
            </p>
          </div>

          <button onClick={handleOpenCreateModal} className="btn btn-primary mobile-btn-full">
            <Plus size={16} />
            NOVO TRABALHO
          </button>
        </div>

        {/* Mensagem de Confirmação e Bloqueio com Sucesso */}
        {successToast && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            padding: '0.85rem 1.25rem',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.885rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Lista de Trabalhos */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar trabalhos...
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Nenhum trabalho criado até ao momento
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Publique o seu primeiro trabalho para que os estudantes das suas turmas possam submeter.
              </p>
              <button onClick={handleOpenCreateModal} className="btn btn-primary mobile-btn-full">
                <Plus size={16} /> Criar Trabalho Agora
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {assignments.map(asg => {
                const isOverdue = new Date() > new Date(asg.due_date);
                return (
                  <div
                    key={asg.id}
                    className="mobile-entity-card"
                    style={{ margin: 0 }}
                  >
                    <div className="mobile-card-header">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                          {asg.title}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: '#00C7FD', marginTop: '0.2rem', fontWeight: '600' }}>
                          Turma: {asg.class?.name || 'Geral'}
                        </div>
                      </div>
                      {isOverdue ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Prazo Encerrado</span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>A Decorrer</span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.825rem', color: '#CBD5E1', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.5 }}>
                      {asg.description || 'Sem descrição adicional.'}
                    </p>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Data Limite</span>
                        <span className="meta-value">
                          {formatDateTime(asg.due_date)}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Cotação Máxima</span>
                        <span className="meta-value" style={{ color: '#F59E0B' }}>
                          {asg.max_points || 20} Valores
                        </span>
                      </div>
                    </div>

                    {asg.attachment_url && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <a 
                          href={asg.attachment_url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#00C7FD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                        >
                          <Download size={13} /> Descarregar Enunciado / Anexo
                        </a>
                      </div>
                    )}

                    <div className="mobile-card-actions">
                      <button
                        onClick={() => handleOpenSubmissions(asg)}
                        className="btn btn-primary mobile-action-btn"
                        style={{ fontSize: '0.825rem' }}
                      >
                        <Users size={15} />
                        Submissões & Avaliar
                      </button>

                      <button
                        onClick={() => handleDelete(asg.id, asg.title)}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.75rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Eliminar Trabalho"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL 1: CRIAR NOVO TRABALHO */}
        {isCreateModalOpen && (
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
            <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', border: '1px solid rgba(0, 199, 253, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#00C7FD" />
                  Criar Novo Trabalho Académico
                </h2>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '0.75rem', color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Turma Destinatária *</label>
                  <select 
                    value={formData.class_id} 
                    onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                    required
                    className="form-input"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.course?.title || 'Curso'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Título da Atividade / Tarefa *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="Ex.: Trabalho Prático 01 — Redes de Computadores"
                    required 
                    className="form-input" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Enunciado / Instruções aos Estudantes</label>
                  <textarea 
                    rows={4}
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Descreva detalhadamente o que deve ser elaborado e critérios de avaliação..."
                    className="form-input" 
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Prazo Limite de Entrega *</label>
                    <input 
                      type="datetime-local" 
                      value={formData.due_date} 
                      onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cotação Máxima (Valores) *</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={20} 
                      value={formData.max_points} 
                      onChange={e => setFormData({ ...formData, max_points: e.target.value })} 
                      required 
                      className="form-input" 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Ficheiro de Apoio / Enunciado em PDF/Word (Opcional)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={e => setAttachmentFile(e.target.files[0] || null)}
                    className="form-input"
                    style={{ padding: '0.4rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'A publicar...' : 'Publicar Trabalho'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: GESTÃO DE SUBMISSÕES E LANÇAMENTO DE NOTAS */}
        {activeAssignment && (
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
            <div className="glass-card" style={{ maxWidth: '840px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 199, 253, 0.4)' }}>
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Submissões: {activeAssignment.title}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Turma: {activeAssignment.class?.name || 'Turma'} • Escala Oficial: 0 a {activeAssignment.max_points || 20} Valores
                  </span>
                </div>
                <button onClick={() => setActiveAssignment(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                {loadingSubmissions ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    A carregar submissões dos estudantes...
                  </div>
                ) : submissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.25rem' }}>Nenhum trabalho submetido ainda</p>
                    <p style={{ fontSize: '0.8rem' }}>Assim que os estudantes enviarem os seus ficheiros, aparecerão listados aqui para avaliação.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#00C7FD', fontWeight: '600' }}>
                      {submissions.length} {submissions.length === 1 ? 'submissão recebida' : 'submissões recebidas'}
                    </div>

                    {submissions.map(sub => (
                      <div
                        key={sub.id}
                        className="mobile-entity-card"
                        style={{
                          margin: 0,
                          background: selectedSubmission?.id === sub.id ? 'rgba(0, 199, 253, 0.12)' : 'rgba(0, 30, 60, 0.5)',
                          border: selectedSubmission?.id === sub.id ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.2)'
                        }}
                      >
                        <div className="mobile-card-header">
                          <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                            {sub.student?.full_name || 'Estudante'}
                          </strong>
                          {sub.grade !== null && sub.grade !== undefined ? (
                            <span className="badge" style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <Lock size={12} /> Nota Bloqueada: {sub.grade} / {activeAssignment.max_points || 20} Val.
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              Aguarda Avaliação
                            </span>
                          )}
                        </div>

                        <div className="mobile-card-meta">
                          <div>
                            <span className="meta-label">Código</span>
                            <span className="meta-value" style={{ fontFamily: 'monospace', color: '#00C7FD' }}>
                              {sub.student?.student_code || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="meta-label">Data de Envio</span>
                            <span className="meta-value">
                              {formatDateTime(sub.submitted_at)}
                            </span>
                          </div>
                        </div>

                        {sub.feedback && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(0, 20, 40, 0.6)', padding: '0.45rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                            <strong style={{ color: '#00C7FD' }}>Comentário:</strong> {sub.feedback}
                          </div>
                        )}

                        <div className="mobile-card-actions">
                          {sub.file_url && (
                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary mobile-action-btn"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <Download size={14} /> Ficheiro
                            </a>
                          )}

                          {sub.grade !== null && sub.grade !== undefined ? (
                            <button
                              disabled
                              className="btn btn-secondary mobile-action-btn"
                              style={{ fontSize: '0.75rem', opacity: 0.65, cursor: 'not-allowed', color: '#94A3B8' }}
                              title="Nota bloqueada permanentemente na Pauta Oficial. Para retificações, contacte a Administração."
                            >
                              <Lock size={13} /> Bloqueada (Pauta)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectSubmissionForGrading(sub)}
                              className="btn btn-primary mobile-action-btn"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <FileCheck size={14} /> Lançar Nota
                            </button>
                          )}
                        </div>

                        {sub.grade !== null && sub.grade !== undefined && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lock size={11} color="#00C7FD" />
                            <span>Nota bloqueada de forma definitiva. Retificações apenas pelo Administrador.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* FORMULÁRIO DE LANÇAMENTO DE NOTA */}
                {selectedSubmission && (
                  <div style={{
                    marginTop: '1.5rem',
                    background: 'rgba(0, 20, 45, 0.85)',
                    border: '1px solid #00C7FD',
                    borderRadius: '8px',
                    padding: '1.25rem'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: '0 0 0.75rem 0' }}>
                      Lançamento de Avaliação — {selectedSubmission.student?.full_name}
                    </h3>

                    {gradeError && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '0.6rem', color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                        {gradeError}
                      </div>
                    )}

                    <form onSubmit={handleRequestSaveGrade}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Nota (0 - 20) *</label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={20}
                            value={gradingData.grade}
                            onChange={e => setGradingData({ ...gradingData, grade: e.target.value })}
                            required
                            placeholder="0 a 20"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Feedback Pedagógico / Observações</label>
                          <input
                            type="text"
                            value={gradingData.feedback}
                            onChange={e => setGradingData({ ...gradingData, feedback: e.target.value })}
                            placeholder="Ex.: Muito bom domínio técnico. Atenção à formatação da conclusão."
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(null)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingGrade}
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                        >
                          {savingGrade ? 'A validar...' : 'Confirmar e Bloquear Nota'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* MODAL DE CONFIRMAÇÃO E BLOQUEIO DE NOTA */}
                {showLockConfirmModal && selectedSubmission && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 10, 25, 0.92)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '1.25rem'
                  }}>
                    <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#FBBF24' }}>
                        <AlertCircle size={24} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                          Confirmação & Bloqueio Definitivo da Nota
                        </h3>
                      </div>

                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '0.85rem', color: '#FEF3C7', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>
                          <strong>Atenção, Formador:</strong> A nota de <strong>{gradingData.grade} / {activeAssignment.max_points || 20} Valores</strong> atribuída ao estudante <strong>{selectedSubmission.student?.full_name}</strong> para o trabalho "{activeAssignment.title}" será gravada e <strong>BLOQUEADA PERMANENTEMENTE</strong>.
                        </p>
                        <p style={{ margin: 0 }}>
                          Após esta confirmação, você <strong>não poderá mais alterar</strong> esta nota. O resultado integrará automaticamente a <strong>Pauta Oficial da Turma</strong> e o <strong>Boletim do Estudante</strong>. Apenas o Administrador poderá efetuar eventuais retificações mediante justificativa oficial em auditoria.
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowLockConfirmModal(false)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.825rem' }}
                        >
                          Cancelar e Rever
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteConfirmGrade}
                          disabled={savingGrade}
                          className="btn btn-primary"
                          style={{ fontSize: '0.825rem', background: '#F59E0B', borderColor: '#D97706', color: '#000000', fontWeight: '750' }}
                        >
                          {savingGrade ? 'A bloquear e gravar...' : 'Sim, Confirmar e Bloquear Nota'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveAssignment(null)} className="btn btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

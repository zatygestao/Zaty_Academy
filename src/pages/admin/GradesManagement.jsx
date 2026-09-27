import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  getCourses, 
  getClasses, 
  getClassGradesOverview, 
  adminUpdateGrade, 
  getGradeAuditHistory 
} from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { 
  Award, 
  Search, 
  Edit, 
  History, 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  RotateCcw, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Filter,
  Printer
} from 'lucide-react';
import PautaPrintModal from '../../components/admin/PautaPrintModal';

export default function GradesManagement() {
  const { user, profile } = useAuth();

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Modais de Edição e Auditoria
  const [editingGradeData, setEditingGradeData] = useState(null);
  const [newScore, setNewScore] = useState('');
  const [justificationReason, setJustificationReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [auditGradeHistory, setAuditGradeHistory] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [showPautaPrintModal, setShowPautaPrintModal] = useState(false);

  // Mensagens
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Carregar Cursos e Turmas
  useEffect(() => {
    async function initData() {
      try {
        const [crs, cls] = await Promise.all([
          getCourses(),
          getClasses()
        ]);
        setCourses(crs || []);
        setClasses(cls || []);
        if (cls && cls.length > 0) {
          setSelectedClassId(cls[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais de turmas:', err);
      }
    }
    initData();
  }, []);

  // 2. Carregar Pauta da Turma Selecionada
  const loadClassOverview = async (classId) => {
    if (!classId) return;
    setLoadingOverview(true);
    setErrorMsg('');
    try {
      const data = await getClassGradesOverview(classId);
      setOverviewData(data);
    } catch (err) {
      console.error('Erro ao carregar pauta da turma:', err);
      setErrorMsg('Falha ao carregar a pauta da turma selecionada.');
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadClassOverview(selectedClassId);
    }
  }, [selectedClassId]);

  // Filtrar Turmas pelo Curso
  const filteredClasses = classes.filter(cls => {
    if (selectedCourseId === 'all') return true;
    return cls.course_id === selectedCourseId;
  });

  // Abrir Modal de Retificação Administrativa
  const handleOpenEditModal = (student, gradeItem) => {
    setEditingGradeData({
      student,
      gradeItem,
      classId: selectedClassId
    });
    setNewScore(gradeItem.score !== null ? String(gradeItem.score) : '');
    setJustificationReason('');
    setErrorMsg('');
  };

  // Submeter Retificação com Auditoria
  const handleSaveAdminGrade = async (e) => {
    e.preventDefault();
    if (!justificationReason.trim()) {
      setErrorMsg('A justificativa da retificação é estritamente obrigatória.');
      return;
    }

    const val = Number(newScore);
    if (isNaN(val) || val < 0 || val > 20) {
      setErrorMsg('A nota deve estar rigorosamente entre 0 e 20 Valores.');
      return;
    }

    setSavingEdit(true);
    setErrorMsg('');

    try {
      await adminUpdateGrade({
        gradeId: editingGradeData.gradeItem.grade_id,
        evaluationId: editingGradeData.gradeItem.evaluation_id,
        studentId: editingGradeData.student.id,
        classId: selectedClassId,
        newScore: val,
        reason: justificationReason.trim(),
        adminUser: {
          id: user?.id,
          name: profile?.full_name || user?.email?.split('@')[0] || 'Administrador'
        }
      });

      setSuccessMsg(`Nota do estudante ${editingGradeData.student.full_name} retificada com sucesso para ${val} Valores.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setEditingGradeData(null);
      loadClassOverview(selectedClassId);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao guardar alteração de nota.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Abrir Histórico de Auditoria
  const handleOpenAuditHistory = async (student, gradeItem) => {
    setAuditGradeHistory({ student, gradeItem });
    setLoadingAudit(true);
    try {
      const logs = await getGradeAuditHistory(gradeItem.grade_id);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Erro ao consultar auditoria da nota:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Filtrar alunos por pesquisa
  const filteredStudentsRows = (overviewData?.studentsRows || []).filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (row.student.full_name || '').toLowerCase();
    const code = (row.student.student_code || '').toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Gestão Global de Notas & Pautas
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginTop: '0.25rem' }}>
              Supervisão de todas as avaliações, testes práticos/teóricos, exames, médias e retificação com auditoria obrigatória.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {selectedClassId && overviewData && (
              <button
                type="button"
                onClick={() => setShowPautaPrintModal(true)}
                className="btn btn-primary btn-sm mobile-btn-full"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: '800' }}
                title="Visualizar, imprimir ou exportar a Pauta Oficial desta turma em A4 Paisagem"
              >
                <Printer size={15} />
                IMPRIMIR PAUTA OFICIAL
              </button>
            )}

            {selectedClassId && (
              <button
                onClick={() => loadClassOverview(selectedClassId)}
                className="btn btn-secondary btn-sm mobile-btn-full"
              >
                Atualizar Pauta
              </button>
            )}
          </div>
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {successMsg && (
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
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#F87171',
            padding: '0.85rem 1.25rem',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.885rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filtros de Seleção de Curso e Turma */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ color: '#BAE6FD' }}>Filtrar por Curso:</label>
              <select
                value={selectedCourseId}
                onChange={e => {
                  setSelectedCourseId(e.target.value);
                  const firstOfCourse = classes.find(c => e.target.value === 'all' || c.course_id === e.target.value);
                  if (firstOfCourse) setSelectedClassId(firstOfCourse.id);
                }}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="all">Todos os Cursos</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ color: '#BAE6FD' }}>Turma a Inspecionar:</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="form-select"
                style={{ width: '100%', fontWeight: '600' }}
              >
                {filteredClasses.length === 0 ? (
                  <option value="">Nenhuma turma disponível</option>
                ) : (
                  filteredClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.schedule})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ color: '#BAE6FD' }}>Pesquisar Estudante:</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Nome ou código..."
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>
          </div>

          {overviewData?.classInfo && (
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(0, 163, 224, 0.15)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#94A3B8' }}>
              <span>Curso: <strong style={{ color: '#FFFFFF' }}>{overviewData.classInfo.course?.title || '—'}</strong></span>
              <span>Formador Responsável: <strong style={{ color: '#00C7FD' }}>{overviewData.classInfo.teacher?.name || overviewData.classInfo.teacher?.full_name || 'Não atribuído'}</strong></span>
              <span>Horário: <strong style={{ color: '#FFFFFF' }}>{overviewData.classInfo.schedule}</strong></span>
              <span>Estudantes Matriculados: <strong style={{ color: '#FFFFFF' }}>{overviewData.studentsRows?.length || 0}</strong></span>
              <span>Avaliações Registadas: <strong style={{ color: '#00C7FD', fontSize: '1rem', fontWeight: '800' }}>{overviewData.evaluations?.length || 0}</strong></span>
            </div>
          )}
        </div>

        {/* Tabela da Pauta Geral com Ações Administrativas */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Pauta Oficial e Histórico de Avaliações
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                Clique no botão de edição de qualquer nota para retificar com justificativa obrigatória registrada em auditoria.
              </p>
            </div>
          </div>

          {loadingOverview ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              A carregar pauta da turma...
            </div>
          ) : !overviewData || filteredStudentsRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              Nenhum estudante ou avaliação encontrada para esta turma.
            </div>
          ) : (
            <>
              {/* Tabela Desktop */}
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '190px' }}>Estudante</th>
                      {overviewData.evaluations.map(ev => (
                        <th key={ev.id} style={{ textAlign: 'center', minWidth: '125px' }}>
                          <div style={{ fontWeight: '700', color: '#BAE6FD', fontSize: '0.82rem' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            {ev.is_recovery ? '🔄 Recuperação' : (ev.evaluation_type === 'trabalho_casa' ? '📝 TPC' : ev.evaluation_type.replace('_', ' '))} (P: {ev.weight})
                          </div>
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', minWidth: '95px' }}>Média Final</th>
                      <th style={{ textAlign: 'center', minWidth: '115px' }}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentsRows.map(row => (
                      <tr key={row.student.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              background: '#002C54',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              color: '#00C7FD',
                              fontSize: '0.8rem',
                              border: '1px solid rgba(0, 199, 253, 0.3)'
                            }}>
                              {row.student.full_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <strong style={{ color: '#FFFFFF', fontSize: '0.885rem', display: 'block' }}>
                                {row.student.full_name}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                                {row.student.student_code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {row.grades.map(g => (
                          <td key={g.evaluation_id} style={{ textAlign: 'center' }}>
                            {g.score !== null ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div>
                                  <span style={{
                                    fontWeight: '800',
                                    fontSize: '0.95rem',
                                    color: g.effectiveScore >= 10 ? '#34D399' : '#F87171'
                                  }}>
                                    {g.effectiveScore}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>/20</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <button
                                    onClick={() => handleOpenEditModal(row.student, g)}
                                    title="Retificar Nota (Admin)"
                                    style={{ background: 'transparent', border: 'none', color: '#00C7FD', cursor: 'pointer', padding: '0.1rem' }}
                                  >
                                    <Edit size={12} />
                                  </button>

                                  <button
                                    onClick={() => handleOpenAuditHistory(row.student, g)}
                                    title="Ver Histórico de Alterações"
                                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.1rem' }}
                                  >
                                    <History size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        ))}

                        <td style={{ textAlign: 'center' }}>
                          {row.finalAverage !== null ? (
                            <strong style={{
                              fontSize: '1.05rem',
                              color: row.finalAverage >= 10.0 ? '#34D399' : '#F87171',
                              fontWeight: '850'
                            }}>
                              {row.finalAverage}
                            </strong>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Pendente</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {row.finalStatus === 'APROVADO' ? (
                            <span className="badge badge-success" style={{ fontWeight: '800', padding: '0.3rem 0.65rem' }}>
                              ✓ APROVADO
                            </span>
                          ) : row.finalStatus === 'REPROVADO' ? (
                            <span className="badge badge-danger" style={{ fontWeight: '800', padding: '0.3rem 0.65rem' }}>
                              ✕ REPROVADO
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.25)', color: '#00C7FD' }}>
                              EM CURSO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile: Cards Estruturados */}
              <div className="mobile-only-cards">
                {filteredStudentsRows.map(row => (
                  <div key={row.student.id} className="mobile-entity-card">
                    <div className="mobile-card-header">
                      <div>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                          {row.student.full_name}
                        </strong>
                        <div style={{ fontSize: '0.74rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                          {row.student.student_code}
                        </div>
                      </div>
                      <div>
                        {row.finalStatus === 'APROVADO' ? (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>✓ Aprovado</span>
                        ) : row.finalStatus === 'REPROVADO' ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>✕ Reprovado</span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>Em Curso</span>
                        )}
                      </div>
                    </div>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Média Calculada</span>
                        <span className="meta-value" style={{ color: row.finalAverage >= 10 ? '#34D399' : '#F87171', fontWeight: '850' }}>
                          {row.finalAverage !== null ? `${row.finalAverage} / 20 Val.` : 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Provas Concluídas</span>
                        <span className="meta-value">
                          {row.totalEvaluationsDone} de {overviewData.evaluations.length}
                        </span>
                      </div>
                    </div>

                    {/* Notas do Aluno no Card Mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.35rem' }}>
                      {row.grades.map(g => (
                        <div key={g.evaluation_id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.45rem 0.65rem',
                          background: 'rgba(0, 20, 44, 0.45)',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 163, 224, 0.15)',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#CBD5E1' }}>{g.evaluation_title}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: g.score >= 10 ? '#34D399' : '#F87171' }}>
                              {g.score !== null ? `${g.effectiveScore} Val.` : '—'}
                            </strong>
                            {g.score !== null && (
                              <button
                                onClick={() => handleOpenEditModal(row.student, g)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                              >
                                Retificar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODAL: RETIFICAÇÃO ADMINISTRATIVA COM JUSTIFICATIVA OBRIGATÓRIA */}
        {editingGradeData && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 16, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '1.75rem', border: '1px solid #00C7FD' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#00C7FD" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Retificação de Nota (Administrador)
                  </h3>
                </div>
                <button
                  onClick={() => setEditingGradeData(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{
                background: 'rgba(0, 28, 54, 0.65)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '6px',
                padding: '0.85rem',
                marginBottom: '1.25rem',
                fontSize: '0.825rem'
              }}>
                <div style={{ color: '#94A3B8', marginBottom: '0.2rem' }}>Estudante: <strong style={{ color: '#FFFFFF' }}>{editingGradeData.student.full_name}</strong> ({editingGradeData.student.student_code})</div>
                <div style={{ color: '#94A3B8', marginBottom: '0.2rem' }}>Avaliação: <strong style={{ color: '#00C7FD' }}>{editingGradeData.gradeItem.evaluation_title}</strong></div>
                <div style={{ color: '#94A3B8' }}>Nota Atual: <strong style={{ color: editingGradeData.gradeItem.score >= 10 ? '#34D399' : '#F87171' }}>{editingGradeData.gradeItem.score} Valores</strong></div>
              </div>

              <form onSubmit={handleSaveAdminGrade}>
                <div className="form-group">
                  <label className="form-label">Nova Nota Atribuída (0 a 20 Valores) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    required
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                    placeholder="Ex: 14.5"
                    className="form-input"
                    style={{ fontWeight: '800', fontSize: '1.1rem', color: '#00C7FD' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FBBF24' }}>
                    <AlertCircle size={14} />
                    Justificativa Obrigatória da Alteração *
                  </label>
                  <textarea
                    required
                    value={justificationReason}
                    onChange={e => setJustificationReason(e.target.value)}
                    placeholder="Ex: Retificação após revisão formal de prova solicitada pelo formador responsável. Questão prática 2 foi reconsiderada..."
                    className="form-textarea"
                    style={{ minHeight: '90px' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                    Esta justificativa será permanentemente registrada no livro de auditoria e associada ao seu usuário.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingGradeData(null)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !justificationReason.trim()}
                    className="btn btn-primary"
                  >
                    {savingEdit ? 'A Gravar...' : 'Gravar Retificação & Registar Auditoria'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: HISTÓRICO DE AUDITORIA DA NOTA */}
        {auditGradeHistory && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 16, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} color="#00C7FD" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Histórico de Auditoria da Nota
                  </h3>
                </div>
                <button
                  onClick={() => setAuditGradeHistory(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Aluno: <strong style={{ color: '#FFFFFF' }}>{auditGradeHistory.student.full_name}</strong> | Prova: <strong style={{ color: '#00C7FD' }}>{auditGradeHistory.gradeItem.evaluation_title}</strong>
              </div>

              {loadingAudit ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                  A carregar registros de auditoria...
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                  Nenhuma alteração administrativa registrada para esta nota. O valor permanece como lançado originalmente pelo formador.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {auditLogs.map(log => (
                    <div key={log.id} style={{
                      background: 'rgba(0, 24, 48, 0.75)',
                      border: '1px solid rgba(0, 163, 224, 0.25)',
                      borderRadius: '6px',
                      padding: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ color: '#BAE6FD', fontSize: '0.85rem' }}>
                          {log.changed_by_name || 'Administrador'}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
                        <span>Nota Anterior: <strong style={{ color: '#F87171' }}>{log.previous_score}</strong></span>
                        <span>→</span>
                        <span>Nova Nota: <strong style={{ color: '#34D399' }}>{log.new_score} Valores</strong></span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#CBD5E1', background: 'rgba(0, 16, 32, 0.5)', padding: '0.45rem 0.65rem', borderRadius: '4px' }}>
                        <strong>Justificativa:</strong> "{log.reason}"
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  onClick={() => setAuditGradeHistory(null)}
                  className="btn btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Impressão e Exportação da Pauta Oficial */}
        <PautaPrintModal
          isOpen={showPautaPrintModal}
          onClose={() => setShowPautaPrintModal(false)}
          classInfo={overviewData?.classInfo}
          course={courses.find(c => c.id === overviewData?.classInfo?.course_id) || overviewData?.classInfo?.course}
          evaluations={overviewData?.evaluations || []}
          studentsRows={filteredStudentsRows}
          academicYear={overviewData?.classInfo?.academic_year || '2026'}
        />
      </main>
    </div>
  );
}

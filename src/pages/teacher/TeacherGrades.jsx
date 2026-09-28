import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import { 
  getTeacherClassesWithStudents, 
  getEvaluationsByClass, 
  createEvaluation, 
  getGradesByEvaluation, 
  saveGradesBatch, 
  createRecoveryEvaluation,
  getClassGradesOverview,
  deleteEvaluation
} from '../../services/api';
import { 
  Award, 
  Plus, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  BookOpen, 
  RotateCcw, 
  Trash2, 
  Clock, 
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Wrench,
  GraduationCap,
  Printer
} from 'lucide-react';
import PautaPrintModal from '../../components/admin/PautaPrintModal';

export default function TeacherGrades() {
  const { teacher, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Avaliações da Turma
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvalId, setSelectedEvalId] = useState('');
  const [loadingEvals, setLoadingEvals] = useState(false);

  // Notas da Avaliação Ativa
  const [gradesMap, setGradesMap] = useState({});
  const [obsMap, setObsMap] = useState({});
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Visão Geral / Pauta
  const [activeTab, setActiveTab] = useState('lancamento'); // 'lancamento' | 'pauta'
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Modais
  const [showCreateEvalModal, setShowCreateEvalModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showConfirmLockModal, setShowConfirmLockModal] = useState(false);
  const [showPautaPrintModal, setShowPautaPrintModal] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [creatingEval, setCreatingEval] = useState(false);

  // Mensagens
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Formulário de Nova Avaliação
  const [newEvalForm, setNewEvalForm] = useState({
    title: '',
    evaluation_type: 'teste_teorico',
    evaluation_date: new Date().toISOString().split('T')[0],
    weight: '1',
    max_score: '20',
    description: ''
  });

  // Formulário de Recuperação
  const [recoveryForm, setRecoveryForm] = useState({
    title: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    selectedStudents: []
  });

  // 1. Carregar turmas do formador
  useEffect(() => {
    async function loadClasses() {
      if (!teacher?.id) {
        setLoadingClasses(false);
        return;
      }
      try {
        setLoadingClasses(true);
        const data = await getTeacherClassesWithStudents(teacher.id);
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, [teacher]);

  // 2. Carregar avaliações quando seleciona uma turma
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadClassData() {
      setLoadingEvals(true);
      setFeedbackError('');
      try {
        const evals = await getEvaluationsByClass(selectedClassId);
        setEvaluations(evals || []);
        if (evals && evals.length > 0) {
          setSelectedEvalId(evals[0].id);
        } else {
          setSelectedEvalId('');
        }
      } catch (err) {
        console.error('Erro ao carregar avaliações da turma:', err);
      } finally {
        setLoadingEvals(false);
      }
    }

    loadClassData();
    if (activeTab === 'pauta') {
      loadOverview();
    }
  }, [selectedClassId]);

  // 3. Carregar notas da avaliação selecionada
  useEffect(() => {
    if (!selectedEvalId) {
      setGradesMap({});
      setObsMap({});
      setIsLocked(false);
      return;
    }

    async function loadEvaluationGrades() {
      setLoadingGrades(true);
      try {
        const currentEval = evaluations.find(e => e.id === selectedEvalId);
        const grades = await getGradesByEvaluation(selectedEvalId);

        const gMap = {};
        const oMap = {};
        let locked = false;

        grades.forEach(g => {
          gMap[g.student_id] = g.score !== null && g.score !== undefined ? String(g.score) : '';
          oMap[g.student_id] = g.observations || '';
          if (g.is_locked) locked = true;
        });

        setGradesMap(gMap);
        setObsMap(oMap);
        setIsLocked(locked || currentEval?.status === 'concluida');
      } catch (err) {
        console.error('Erro ao carregar notas:', err);
      } finally {
        setLoadingGrades(false);
      }
    }

    loadEvaluationGrades();
  }, [selectedEvalId, evaluations]);

  // Carregar Pauta Completa
  const loadOverview = async () => {
    if (!selectedClassId) return;
    setLoadingOverview(true);
    try {
      const data = await getClassGradesOverview(selectedClassId);
      setOverviewData(data);
    } catch (err) {
      console.error('Erro ao carregar pauta da turma:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedEval = evaluations.find(e => e.id === selectedEvalId);
  const enrolledStudents = selectedClass?.students || [];

  // Submeter Criação de Avaliação (com proteção estrita contra duplicações)
  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    if (creatingEval) return;
    if (!newEvalForm.title.trim()) {
      setFeedbackError('Por favor informe o título da avaliação.');
      return;
    }

    setCreatingEval(true);
    setFeedbackError('');

    try {
      const created = await createEvaluation({
        class_id: selectedClassId,
        course_id: selectedClass?.course_id,
        teacher_id: teacher?.id,
        title: newEvalForm.title,
        evaluation_type: newEvalForm.evaluation_type,
        evaluation_date: newEvalForm.evaluation_date,
        weight: newEvalForm.weight,
        max_score: newEvalForm.max_score,
        passing_grade: 10.0,
        description: newEvalForm.description
      });

      // Recarregar lista completa, limpa e desduplicada
      const freshEvals = await getEvaluationsByClass(selectedClassId);
      setEvaluations(freshEvals || []);
      setSelectedEvalId(created.id);
      setShowCreateEvalModal(false);
      setFeedbackSuccess(`Avaliação "${created.title}" criada com sucesso!`);
      setTimeout(() => setFeedbackSuccess(''), 4000);

      setNewEvalForm({
        title: '',
        evaluation_type: 'teste_teorico',
        evaluation_date: new Date().toISOString().split('T')[0],
        weight: '1',
        max_score: '20',
        description: ''
      });
    } catch (err) {
      setFeedbackError(err.message || 'Falha ao criar avaliação.');
    } finally {
      setCreatingEval(false);
    }
  };

  // Abrir Modal de Confirmação e Bloqueio
  const handleRequestLock = () => {
    setFeedbackError('');
    // Validar se pelo menos um aluno tem nota inserida
    const hasAnyGrade = Object.values(gradesMap).some(v => v !== '' && v !== null && v !== undefined);
    if (!hasAnyGrade) {
      setFeedbackError('Por favor insira as notas dos estudantes antes de confirmar o lançamento.');
      return;
    }
    setShowConfirmLockModal(true);
  };

  // Confirmar e Bloquear Notas definitivamente
  const handleConfirmGrades = async () => {
    setShowConfirmLockModal(false);
    setSavingGrades(true);
    setFeedbackError('');

    try {
      const gradesToSave = enrolledStudents
        .filter(st => gradesMap[st.id] !== undefined && gradesMap[st.id] !== '')
        .map(st => ({
          student_id: st.id,
          class_id: selectedClassId,
          score: Number(gradesMap[st.id]),
          observations: obsMap[st.id] || null,
          is_recovery: selectedEval?.is_recovery || false,
          original_grade_id: selectedEval?.recovery_for_evaluation_id || null
        }));

      await saveGradesBatch(selectedEvalId, gradesToSave, teacher?.id);

      setIsLocked(true);
      setEvaluations(prev => prev.map(ev => ev.id === selectedEvalId ? { ...ev, status: 'concluida' } : ev));
      setFeedbackSuccess('Notas confirmadas e bloqueadas com sucesso! A média da turma foi atualizada.');
      setTimeout(() => setFeedbackSuccess(''), 5000);
      loadOverview();
    } catch (err) {
      setFeedbackError(err.message || 'Falha ao gravar e bloquear notas.');
    } finally {
      setSavingGrades(false);
    }
  };

  // Abrir Modal de Teste de Recuperação
  const handleOpenRecoveryModal = () => {
    if (!selectedEval) return;
    // Identificar alunos que tiraram menos de 10
    const failingStudentIds = enrolledStudents
      .filter(st => {
        const score = Number(gradesMap[st.id]);
        return gradesMap[st.id] !== '' && !isNaN(score) && score < (selectedEval.passing_grade || 10);
      })
      .map(st => st.id);

    setRecoveryForm({
      title: `Recuperação: ${selectedEval.title}`,
      evaluation_date: new Date().toISOString().split('T')[0],
      selectedStudents: failingStudentIds
    });
    setShowRecoveryModal(true);
  };

  // Submeter Teste de Recuperação
  const handleCreateRecovery = async (e) => {
    e.preventDefault();
    if (recoveryForm.selectedStudents.length === 0) {
      setFeedbackError('Selecione pelo menos um estudante para realizar a recuperação.');
      return;
    }

    try {
      const created = await createRecoveryEvaluation({
        originalEvaluationId: selectedEvalId,
        classId: selectedClassId,
        courseId: selectedClass?.course_id,
        teacherId: teacher?.id,
        title: recoveryForm.title,
        evaluation_date: recoveryForm.evaluation_date,
        description: `Teste de Recuperação referente a: ${selectedEval.title}`
      });

      setEvaluations(prev => [...prev, created]);
      setSelectedEvalId(created.id);
      setShowRecoveryModal(false);
      setFeedbackSuccess(`Teste de Recuperação "${created.title}" criado com sucesso! Lançamento de notas liberado.`);
      setTimeout(() => setFeedbackSuccess(''), 5000);
    } catch (err) {
      setFeedbackError(err.message || 'Falha ao agendar recuperação.');
    }
  };

  // Excluir avaliação aberta
  const handleDeleteEvaluation = async (evalId) => {
    if (!window.confirm('Tem a certeza que deseja excluir esta avaliação?')) return;
    try {
      await deleteEvaluation(evalId, teacher?.id);
      setEvaluations(prev => prev.filter(e => e.id !== evalId));
      setSelectedEvalId(evaluations.find(e => e.id !== evalId)?.id || '');
      setFeedbackSuccess('Avaliação excluída com sucesso.');
      setTimeout(() => setFeedbackSuccess(''), 3000);
    } catch (err) {
      setFeedbackError(err.message || 'Falha ao excluir avaliação.');
    }
  };

  // Função para formatar o badge de tipo de avaliação
  const getEvalTypeBadge = (type, isRecovery) => {
    if (isRecovery) {
      return (
        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          <RotateCcw size={12} /> Teste de Recuperação
        </span>
      );
    }
    switch (type) {
      case 'teste_teorico':
        return (
          <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.35)' }}>
            <BookOpen size={12} /> Teste Teórico
          </span>
        );
      case 'teste_pratico':
        return (
          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
            <Wrench size={12} /> Teste Prático
          </span>
        );
      case 'trabalho_casa':
        return (
          <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#FACC15', border: '1px solid rgba(234, 179, 8, 0.35)' }}>
            <FileCheck size={12} /> Trabalho de Casa (TPC)
          </span>
        );
      case 'exame_teorico':
        return (
          <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
            <GraduationCap size={12} /> Exame Teórico
          </span>
        );
      case 'exame_pratico':
        return (
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
            <Award size={12} /> Exame Prático
          </span>
        );
      default:
        return (
          <span className="badge badge-info">
            <FileCheck size={12} /> Avaliação Contínua
          </span>
        );
    }
  };

  // Contagem de alunos reprovados nesta avaliação
  const failingCount = enrolledStudents.filter(st => {
    const score = Number(gradesMap[st.id]);
    return gradesMap[st.id] !== '' && !isNaN(score) && score < (selectedEval?.passing_grade || 10);
  }).length;

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Gestão de Notas & Avaliações
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginTop: '0.25rem' }}>
              Lançamento pedagógico seguro com bloqueio definitivo, suporte a testes teóricos/práticos, exames e recuperação.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setActiveTab(activeTab === 'lancamento' ? 'pauta' : 'lancamento');
                if (activeTab === 'lancamento') loadOverview();
              }}
              className="btn btn-secondary mobile-btn-full"
            >
              {activeTab === 'lancamento' ? 'Ver Pauta Geral da Turma' : 'Voltar ao Lançamento'}
            </button>

            <button
              onClick={() => setShowCreateEvalModal(true)}
              disabled={!selectedClassId}
              className="btn btn-primary mobile-btn-full"
            >
              <Plus size={16} /> Nova Avaliação
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedbackSuccess && (
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
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {feedbackError && (
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
            <span>{feedbackError}</span>
          </div>
        )}

        {/* Barra de Seleção de Turma */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#BAE6FD' }}>
                <Users size={15} color="#00C7FD" />
                Turma Sob Sua Responsabilidade:
              </label>
              {loadingClasses ? (
                <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>A carregar turmas...</div>
              ) : classes.length === 0 ? (
                <div style={{ color: '#F87171', fontSize: '0.85rem' }}>Não possui turmas associadas a si no momento.</div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', fontWeight: '600' }}
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} — {cls.course?.title || 'Curso'} ({cls.students?.length || 0} alunos)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedClass && (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderLeft: '1px solid rgba(0, 163, 224, 0.2)', paddingLeft: '1.5rem' }}>
                <div>
                  <span className="meta-label">Horário / Turno</span>
                  <span className="meta-value">{selectedClass.schedule}</span>
                </div>
                <div>
                  <span className="meta-label">Total de Alunos</span>
                  <span className="meta-value">{enrolledStudents.length} matriculado(s)</span>
                </div>
                <div>
                  <span className="meta-label">Avaliações Criadas</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <strong style={{ fontSize: '1.6rem', fontWeight: '900', color: '#00C7FD', lineHeight: 1 }}>
                      {evaluations.length}
                    </strong>
                    <span style={{ fontSize: '0.825rem', fontWeight: '600', color: '#94A3B8' }}>etapa(s)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ABA: PAUTA GERAL DA TURMA */}
        {activeTab === 'pauta' ? (
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Pauta Oficial de Notas da Turma
                  </h2>
                  {overviewData && (
                    <span style={{
                      background: 'rgba(0, 199, 253, 0.15)',
                      border: '1px solid rgba(0, 199, 253, 0.35)',
                      color: '#00C7FD',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}>
                      Total de Avaliações: <strong style={{ fontSize: '1.25rem', fontWeight: '900', color: '#BAE6FD', lineHeight: 1 }}>{overviewData.evaluations?.length || 0}</strong>
                    </span>
                  )}
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                  Resumo geral de testes teóricos, testes práticos, exames, médias ponderadas e aprovações.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowPautaPrintModal(true)}
                  disabled={!overviewData || overviewData.studentsRows?.length === 0}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Printer size={15} />
                  <span>Imprimir Pauta Oficial</span>
                </button>
                <button onClick={loadOverview} className="btn btn-secondary btn-sm">
                  Atualizar Pauta
                </button>
              </div>
            </div>

            {loadingOverview ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                A calcular e estruturar a pauta geral...
              </div>
            ) : !overviewData || overviewData.studentsRows?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                Nenhum estudante matriculado ou nenhuma nota lançada nesta turma.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '180px' }}>Estudante</th>
                      {overviewData.evaluations.map(ev => (
                        <th key={ev.id} style={{ textAlign: 'center', fontSize: '0.78rem', minWidth: '110px' }}>
                          <div style={{ fontWeight: '700', color: '#BAE6FD' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            Peso: {ev.weight} | {ev.is_recovery ? '🔄 Recuperação' : (ev.evaluation_type === 'trabalho_casa' ? '📝 TPC' : ev.evaluation_type.replace('_', ' '))}
                          </div>
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', minWidth: '100px' }}>Média Final</th>
                      <th style={{ textAlign: 'center', minWidth: '120px' }}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.studentsRows.map(row => (
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
                              <div>
                                <span style={{
                                  fontWeight: '800',
                                  fontSize: '0.92rem',
                                  color: g.effectiveScore >= 10 ? '#34D399' : '#F87171'
                                }}>
                                  {g.effectiveScore}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#64748B' }}> / 20</span>
                                {g.is_recovery && (
                                  <div style={{ fontSize: '0.65rem', color: '#FBBF24', fontWeight: '600' }}>
                                    Recuperação
                                  </div>
                                )}
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
                              fontWeight: '800'
                            }}>
                              {row.finalAverage}
                            </strong>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Pendente</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {row.finalStatus === 'APROVADO' ? (
                            <span className="badge badge-success" style={{ fontWeight: '700', padding: '0.3rem 0.65rem' }}>
                              ✓ APROVADO
                            </span>
                          ) : row.finalStatus === 'REPROVADO' ? (
                            <span className="badge badge-danger" style={{ fontWeight: '700', padding: '0.3rem 0.65rem' }}>
                              ✕ REPROVADO
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.2)', color: '#00C7FD' }}>
                              EM CURSO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ABA: LANÇAMENTO DE NOTAS */
          <div>
            {/* Lista de Avaliações / Abas Rápidas */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
              {evaluations.map(ev => {
                const isActive = ev.id === selectedEvalId;
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvalId(ev.id)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.25)',
                      background: isActive ? 'rgba(0, 199, 253, 0.15)' : 'rgba(0, 24, 48, 0.6)',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ev.status === 'concluida' ? (
                      <Lock size={14} color="#10B981" title="Notas Bloqueadas" />
                    ) : (
                      <Clock size={14} color="#00C7FD" title="Lançamento Aberto" />
                    )}
                    <span style={{ fontWeight: isActive ? '700' : '500', fontSize: '0.85rem' }}>
                      {ev.title}
                    </span>
                    {ev.is_recovery && (
                      <span style={{ fontSize: '0.68rem', color: '#FBBF24', background: 'rgba(245, 158, 11, 0.2)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        Recup.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cartão de Detalhes da Avaliação Ativa */}
            {selectedEval ? (
              <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                        {selectedEval.title}
                      </h2>
                      {getEvalTypeBadge(selectedEval.evaluation_type, selectedEval.is_recovery)}
                      {isLocked ? (
                        <span className="badge badge-success" style={{ gap: '0.35rem' }}>
                          <Lock size={12} /> Notas Bloqueadas (Confirmadas)
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ gap: '0.35rem' }}>
                          <Clock size={12} /> Aberto para Lançamento
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '0.825rem', marginTop: '0.4rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <span>Data: <strong>{selectedEval.evaluation_date}</strong></span>
                      <span>Peso na Média: <strong>{selectedEval.weight}</strong></span>
                      <span>Nota Máxima: <strong>{selectedEval.max_score} Valores</strong></span>
                      <span>Média Mínima: <strong>{selectedEval.passing_grade || 10} Valores</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!isLocked && (
                      <button
                        onClick={() => handleDeleteEvaluation(selectedEval.id)}
                        className="btn btn-danger btn-sm"
                        title="Excluir Avaliação Aberta"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    )}
                  </div>
                </div>

                {/* ALERTA DE REGRAS E BLOQUEIO */}
                {isLocked ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '6px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.825rem',
                    color: '#BAE6FD'
                  }}>
                    <Lock size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                        Notas Bloqueadas Definitivamente
                      </strong>
                      Conforme a política de integridade da Zaty Academy, as notas confirmadas pelo formador estão trancadas para edição direta.
                      Para retificar uma nota já confirmada, solicite a alteração ao Administrador com a respetiva justificativa.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0, 199, 253, 0.08)',
                    border: '1px solid rgba(0, 199, 253, 0.3)',
                    borderRadius: '6px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.825rem',
                    color: '#BAE6FD'
                  }}>
                    <HelpCircle size={18} color="#00C7FD" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                        Instruções de Lançamento de Notas (Escala de 0 a 20 Valores)
                      </strong>
                      Preencha a nota de cada estudante e observações pertinentes. Ao clicar em <strong>"Confirmar e Bloquear Notas"</strong>,
                      a operação será registada com garantia de integridade e a pauta será trancada contra alterações acidentais.
                    </div>
                  </div>
                )}

                {/* BANNER DE RECUPERAÇÃO SE HOUVER ALUNOS REPROVADOS */}
                {isLocked && !selectedEval.is_recovery && failingCount > 0 && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '6px',
                    padding: '0.85rem 1.15rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <AlertTriangle size={18} color="#FBBF24" />
                      <div>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.88rem' }}>
                          {failingCount} estudante(s) com nota inferior a 10 Valores nesta avaliação.
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                          Pode criar um Teste de Recuperação específico. A nota original será preservada no histórico.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenRecoveryModal}
                      className="btn btn-secondary btn-sm"
                      style={{ borderColor: '#FBBF24', color: '#FBBF24' }}
                    >
                      <RotateCcw size={14} /> Criar Teste de Recuperação
                    </button>
                  </div>
                )}

                {/* Tabela de Lançamento de Estudantes */}
                {loadingGrades ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    A carregar lista de estudantes e notas...
                  </div>
                ) : enrolledStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    Nenhum estudante matriculado nesta turma.
                  </div>
                ) : (
                  <div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>Foto</th>
                            <th>Estudante</th>
                            <th>Código</th>
                            <th style={{ width: '160px' }}>Nota (0 - 20)</th>
                            <th>Observações do Formador</th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudents.map(st => {
                            const currentScore = gradesMap[st.id] !== undefined ? gradesMap[st.id] : '';
                            const numScore = Number(currentScore);
                            const hasValidScore = currentScore !== '' && !isNaN(numScore);
                            const isPassed = hasValidScore && numScore >= (selectedEval.passing_grade || 10);

                            return (
                              <tr key={st.id}>
                                <td>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '4px',
                                    background: '#002244',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0, 199, 253, 0.3)'
                                  }}>
                                    {st.photo_url ? (
                                      <img src={st.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', fontWeight: '700' }}>
                                        {st.full_name?.charAt(0) || 'E'}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td>
                                  <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block' }}>
                                    {st.full_name}
                                  </strong>
                                  <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{st.email || 'Sem email'}</span>
                                </td>

                                <td>
                                  <span style={{ fontFamily: 'monospace', color: '#00C7FD', fontWeight: '700', fontSize: '0.85rem' }}>
                                    {st.student_code}
                                  </span>
                                </td>

                                <td>
                                  {isLocked ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{
                                        fontWeight: '800',
                                        fontSize: '1.05rem',
                                        color: isPassed ? '#34D399' : '#F87171'
                                      }}>
                                        {currentScore !== '' ? currentScore : '—'}
                                      </span>
                                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>/ 20</span>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        value={currentScore}
                                        onChange={e => setGradesMap({ ...gradesMap, [st.id]: e.target.value })}
                                        placeholder="Ex: 15.5"
                                        className="form-input"
                                        style={{ width: '90px', padding: '0.4rem 0.5rem', fontWeight: '700' }}
                                      />
                                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>/ 20</span>
                                    </div>
                                  )}
                                </td>

                                <td>
                                  {isLocked ? (
                                    <span style={{ fontSize: '0.825rem', color: obsMap[st.id] ? '#CBD5E1' : '#64748B', fontStyle: obsMap[st.id] ? 'normal' : 'italic' }}>
                                      {obsMap[st.id] || 'Nenhuma observação'}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={obsMap[st.id] || ''}
                                      onChange={e => setObsMap({ ...obsMap, [st.id]: e.target.value })}
                                      placeholder="Observação pedagógica (opcional)..."
                                      className="form-input"
                                      style={{ padding: '0.4rem 0.65rem' }}
                                    />
                                  )}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                  {hasValidScore ? (
                                    <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                                      {isPassed ? 'Aprovado' : 'Insuficiente'}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Pendente</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Ações de Envio */}
                    {!isLocked && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1.25rem' }}>
                        <button
                          onClick={handleRequestLock}
                          disabled={savingGrades}
                          className="btn btn-primary"
                          style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                        >
                          <Lock size={16} />
                          {savingGrades ? 'A Bloquear e Confirmar...' : 'Confirmar & Bloquear Notas'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                <Award size={48} color="#00C7FD" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                  Nenhuma avaliação criada para esta turma ainda.
                </h3>
                <p style={{ maxWidth: '480px', margin: '0 auto 1.25rem auto', fontSize: '0.885rem' }}>
                  Crie o primeiro teste teórico, teste prático ou exame para iniciar o lançamento de notas dos estudantes.
                </p>
                <button
                  onClick={() => setShowCreateEvalModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> Criar Primeira Avaliação
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODAL: CRIAR NOVA AVALIAÇÃO */}
        {showCreateEvalModal && (
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
            <div className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Nova Avaliação Académica
                </h3>
                <button
                  onClick={() => setShowCreateEvalModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateEvaluation}>
                <div className="form-group">
                  <label className="form-label">Título da Avaliação *</label>
                  <input
                    type="text"
                    required
                    value={newEvalForm.title}
                    onChange={e => setNewEvalForm({ ...newEvalForm, title: e.target.value })}
                    placeholder="Ex: 1º Teste Teórico: Redes e Protocolos"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo de Avaliação *</label>
                    <select
                      value={newEvalForm.evaluation_type}
                      onChange={e => setNewEvalForm({ ...newEvalForm, evaluation_type: e.target.value })}
                      className="form-select"
                    >
                      <option value="teste_teorico">📘 Teste Teórico</option>
                      <option value="teste_pratico">🛠️ Teste Prático</option>
                      <option value="trabalho_casa">📝 Trabalho de Casa (TPC)</option>
                      <option value="exame_teorico">📜 Exame Teórico</option>
                      <option value="exame_pratico">🔬 Exame Prático</option>
                      <option value="outro">📋 Avaliação Contínua</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Data de Realização *</label>
                    <input
                      type="date"
                      required
                      value={newEvalForm.evaluation_date}
                      onChange={e => setNewEvalForm({ ...newEvalForm, evaluation_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Peso na Média Final</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={newEvalForm.weight}
                      onChange={e => setNewEvalForm({ ...newEvalForm, weight: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nota Máxima (Valores)</label>
                    <input
                      type="number"
                      disabled
                      value="20"
                      className="form-input"
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Objetivos da Prova (Opcional)</label>
                  <textarea
                    value={newEvalForm.description}
                    onChange={e => setNewEvalForm({ ...newEvalForm, description: e.target.value })}
                    placeholder="Conteúdo programático avaliado, competências exigidas..."
                    className="form-textarea"
                    style={{ minHeight: '70px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateEvalModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingEval}
                    className="btn btn-primary"
                  >
                    {creatingEval ? 'A criar avaliação...' : 'Criar Avaliação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRMAR E BLOQUEAR NOTAS */}
        {showConfirmLockModal && (
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
            <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', border: '1px solid #10B981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <Lock size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Confirmar e Bloquear Lançamento de Notas?
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{selectedEval?.title}</span>
                </div>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                fontSize: '0.825rem',
                color: '#FECACA',
                marginBottom: '1.25rem',
                lineHeight: 1.4
              }}>
                <strong>⚠️ Aviso Crítico de Bloqueio:</strong>
                <p style={{ margin: '0.35rem 0 0 0' }}>
                  Após a confirmação, estas notas ficarão <strong>bloqueadas de forma definitiva</strong> e você não terá permissão para as alterar.
                  Qualquer retificação posterior deverá ser formalmente solicitada à Direção/Administração com a respetiva justificativa.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmLockModal(false)}
                  className="btn btn-secondary"
                >
                  Voltar e Rever
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGrades}
                  className="btn btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981', color: '#001830', fontWeight: '800' }}
                >
                  Sim, Bloquear e Confirmar Notas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CRIAR TESTE DE RECUPERAÇÃO */}
        {showRecoveryModal && (
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
            <div className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '1.75rem', border: '1px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <RotateCcw size={20} color="#FBBF24" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Agendar Teste de Recuperação
                  </h3>
                </div>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateRecovery}>
                <div className="form-group">
                  <label className="form-label">Título da Avaliação de Recuperação</label>
                  <input
                    type="text"
                    required
                    value={recoveryForm.title}
                    onChange={e => setRecoveryForm({ ...recoveryForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data da Realização do Teste</label>
                  <input
                    type="date"
                    required
                    value={recoveryForm.evaluation_date}
                    onChange={e => setRecoveryForm({ ...recoveryForm, evaluation_date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                    Estudantes Elegíveis Selecionados ({recoveryForm.selectedStudents.length}):
                  </label>
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'rgba(0, 16, 32, 0.6)',
                    border: '1px solid rgba(0, 163, 224, 0.25)',
                    borderRadius: '6px',
                    padding: '0.75rem'
                  }}>
                    {enrolledStudents.map(st => {
                      const score = Number(gradesMap[st.id]);
                      const isFailing = gradesMap[st.id] !== '' && !isNaN(score) && score < (selectedEval?.passing_grade || 10);
                      const isSelected = recoveryForm.selectedStudents.includes(st.id);

                      return (
                        <label
                          key={st.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.4rem 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: isFailing ? '#FFFFFF' : '#94A3B8'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setRecoveryForm({ ...recoveryForm, selectedStudents: [...recoveryForm.selectedStudents, st.id] });
                              } else {
                                setRecoveryForm({ ...recoveryForm, selectedStudents: recoveryForm.selectedStudents.filter(id => id !== st.id) });
                              }
                            }}
                            style={{ accentColor: '#00C7FD' }}
                          />
                          <span style={{ fontWeight: isFailing ? '700' : '400' }}>{st.full_name}</span>
                          <span style={{ fontSize: '0.72rem', color: isFailing ? '#F87171' : '#64748B', marginLeft: 'auto' }}>
                            Nota Atual: {gradesMap[st.id] || '—'} / 20
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  ℹ️ <strong>Nota Histórica:</strong> Ao lançar as notas da recuperação, a nota original de {selectedEval?.title} continuará registrada no sistema.
                  Para a média final, a maior pontuação obtida pelo aluno será considerada.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#001830', fontWeight: '800' }}
                  >
                    Criar Teste de Recuperação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE IMPRESSÃO / EXPORTAÇÃO DA PAUTA OFICIAL */}
        {showPautaPrintModal && (
          <PautaPrintModal
            isOpen={showPautaPrintModal}
            onClose={() => setShowPautaPrintModal(false)}
            classInfo={selectedClass}
            course={selectedClass?.course}
            evaluations={overviewData?.evaluations || evaluations}
            studentsRows={overviewData?.studentsRows || []}
            academicYear="2026"
          />
        )}
      </main>
    </div>
  );
}

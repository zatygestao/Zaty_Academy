import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  getLessonProgress, 
  toggleLessonProgress, 
  getCourseBySlug,
  getStudentCertificates,
  getStudentGradesReport,
  deduplicateEnrollments
} from '../../services/api';
import { generateCertificatePdf, printPdfDoc } from '../../services/pdfService';
import StudentSidebar from '../../components/student/StudentSidebar';
import LessonViewerModal from '../../components/student/LessonViewerModal';
import Modal from '../../components/common/Modal';
import { 
  formatDate, 
  getRemainingDays, 
  isLessonExpired 
} from '../../utils/formatters';
import { 
  BookOpen, 
  Circle, 
  Download, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Play, 
  FileText, 
  Video, 
  ArrowRight,
  UserCheck,
  Users,
  MapPin,
  RotateCcw,
  Award,
  Sparkles,
  Eye,
  Printer,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export default function StudentCourses() {
  const { student } = useAuth();
  const { settings } = useSettings();

  const [courseData, setCourseData] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEnrollmentIndex, setSelectedEnrollmentIndex] = useState(0);

  // Certificados e Avaliações do Estudante
  const [certificates, setCertificates] = useState([]);
  const [gradesReport, setGradesReport] = useState([]);
  const [previewCert, setPreviewCert] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const enrollments = useMemo(() => {
    const list = deduplicateEnrollments(student?.enrollments || []);
    return [...list].sort((a, b) => {
      const order = { ativo: 1, pendente: 2, concluido: 3, transferido: 4, trancado: 5, cancelado: 6 };
      return (order[a.status] || 99) - (order[b.status] || 99);
    });
  }, [student?.enrollments]);
  const validIndex = (selectedEnrollmentIndex >= 0 && selectedEnrollmentIndex < enrollments.length) ? selectedEnrollmentIndex : 0;
  const activeEnrollment = enrollments[validIndex] || enrollments[0];
  const activeCourse = activeEnrollment?.course;
  const activeClass = activeEnrollment?.class;
  const isCourseCompleted = activeEnrollment?.status === 'concluido' || 
    (typeof activeEnrollment?.final_grade === 'string' && activeEnrollment?.final_grade.toUpperCase().includes('APROVADO'));

  useEffect(() => {
    async function loadCourseAndProgress() {
      if (!student?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [progressList, certsList, gradesList] = await Promise.all([
          getLessonProgress(student.id),
          getStudentCertificates(student.id),
          getStudentGradesReport(student.id)
        ]);

        const map = {};
        (progressList || []).forEach(p => {
          map[p.lesson_id] = p.completed;
        });
        setProgressMap(map);
        setCertificates(certsList || []);
        setGradesReport(gradesList || []);

        const courseIdentifier = activeCourse?.id || activeCourse?.slug;
        if (courseIdentifier) {
          try {
            const fullCourse = await getCourseBySlug(courseIdentifier);
            if (fullCourse) {
              setCourseData(fullCourse);
            } else {
              setCourseData(activeCourse);
            }
          } catch (cErr) {
            console.warn('Não foi possível obter curso completo via getCourseBySlug, usando dados da sessão:', cErr);
            setCourseData(activeCourse);
          }
        } else {
          setCourseData(activeCourse);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do percurso do estudante:', err);
        setCourseData(activeCourse);
      } finally {
        setLoading(false);
      }
    }
    loadCourseAndProgress();
  }, [student?.id, activeCourse?.id, activeCourse?.slug]);

  const displayCourse = courseData || activeCourse;

  // Filtrar apenas módulos e aulas publicadas (is_published !== false)
  const modules = useMemo(() => {
    return (displayCourse?.modules || [])
      .slice()
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(mod => ({
        ...mod,
        lessons: (mod.lessons || [])
          .filter(l => l.is_published !== false)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }));
  }, [displayCourse]);

  // Lista plana de todas as aulas ordenadas para navegação contínua
  const allLessons = useMemo(() => {
    const list = [];
    modules.forEach(mod => {
      (mod.lessons || []).forEach(l => {
        list.push({ ...l, moduleTitle: mod.title });
      });
    });
    return list;
  }, [modules]);

  const totalLessons = allLessons.length;
  // Se o curso estiver oficialmente concluído, o progresso é 100%
  const completedCount = isCourseCompleted ? totalLessons : allLessons.filter(l => progressMap[l.id]).length;
  const percent = isCourseCompleted ? 100 : (totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0);

  // Certificado oficial existente no banco para este curso
  const matchingCertificate = useMemo(() => {
    if (!activeCourse?.id) return null;
    return certificates.find(c => c.course_id === activeCourse.id && c.status !== 'revogado') || null;
  }, [certificates, activeCourse?.id]);

  // Notas e pauta do estudante neste curso
  const courseGrades = useMemo(() => {
    if (!gradesReport || !activeEnrollment) return [];
    const rep = gradesReport.find(r => r.course_id === activeCourse?.id || r.class_id === activeEnrollment?.class_id);
    return rep?.grades || [];
  }, [gradesReport, activeCourse?.id, activeEnrollment?.class_id]);

  // Ações de Certificado Único Oficial (Visualizar, Baixar, Imprimir)
  const handlePreviewCertificate = async () => {
    if (!matchingCertificate) return;
    setPreviewLoading(true);
    try {
      const doc = await generateCertificatePdf({
        certificate: matchingCertificate,
        student,
        course: matchingCertificate.course || activeCourse,
        settings
      });
      const url = doc.output('bloburl');
      setPreviewBlobUrl(url);
      setPreviewCert(matchingCertificate);
    } catch (err) {
      console.error('Erro ao pré-visualizar certificado:', err);
      alert('Falha ao gerar pré-visualização do certificado.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!matchingCertificate) return;
    setActionLoading(true);
    try {
      const doc = await generateCertificatePdf({
        certificate: matchingCertificate,
        student,
        course: matchingCertificate.course || activeCourse,
        settings
      });
      doc.save(`Certificado_${matchingCertificate.certificate_number}_${student.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao baixar certificado:', err);
      alert('Falha ao baixar o arquivo PDF do certificado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintCertificate = async () => {
    if (!matchingCertificate) return;
    setActionLoading(true);
    try {
      const doc = await generateCertificatePdf({
        certificate: matchingCertificate,
        student,
        course: matchingCertificate.course || activeCourse,
        settings
      });
      printPdfDoc(doc);
    } catch (err) {
      console.error('Erro ao imprimir certificado:', err);
      alert('Falha ao acionar a impressão do certificado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLesson = async (lessonId) => {
    if (isCourseCompleted) return; // Curso concluído é imutável
    const currentState = !!progressMap[lessonId];
    const newState = !currentState;

    setProgressMap(prev => ({ ...prev, [lessonId]: newState }));

    try {
      await toggleLessonProgress(student.id, lessonId, newState);
    } catch (err) {
      console.error('Erro ao atualizar estado da aula:', err);
      setProgressMap(prev => ({ ...prev, [lessonId]: currentState }));
    }
  };

  const openLesson = (lesson, modTitle = '') => {
    setCurrentLesson(lesson);
    setCurrentModuleTitle(modTitle || lesson.moduleTitle || '');
  };

  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleNext = nextLesson ? () => {
    setCurrentLesson(nextLesson);
    setCurrentModuleTitle(nextLesson.moduleTitle || '');
  } : null;

  const handlePrev = prevLesson ? () => {
    setCurrentLesson(prevLesson);
    setCurrentModuleTitle(prevLesson.moduleTitle || '');
  } : null;

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Seletor de Cursos caso esteja matriculado em mais de um */}
        {enrollments.length > 1 && (
          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.35rem' }}>
            {enrollments.map((enr, idx) => (
              <button
                key={enr.id || idx}
                onClick={() => setSelectedEnrollmentIndex(idx)}
                style={{
                  padding: '0.55rem 0.95rem',
                  borderRadius: '6px',
                  border: idx === selectedEnrollmentIndex ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.25)',
                  background: idx === selectedEnrollmentIndex ? 'rgba(0, 199, 253, 0.18)' : 'rgba(0, 24, 48, 0.65)',
                  color: idx === selectedEnrollmentIndex ? '#FFFFFF' : '#94A3B8',
                  fontWeight: idx === selectedEnrollmentIndex ? '700' : '500',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <BookOpen size={14} color={idx === selectedEnrollmentIndex ? '#00C7FD' : '#94A3B8'} />
                <span>{enr.course?.title || 'Curso'}</span>
                {enr.status === 'concluido' && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Concluído</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* DOSSIÊ COMPLETO DE CURSO CONCLUÍDO (REQUISITO 4) */}
        {isCourseCompleted ? (
          <div style={{ marginBottom: '2rem' }}>
            {/* 1. BANNER INSTITUCIONAL OFICIAL */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 199, 253, 0.12) 100%)',
              border: '1.5px solid #10B981',
              borderRadius: '10px',
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
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1.5px solid #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={26} color="#34D399" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      Estado: Concluído & Aprovado
                    </span>
                    {activeEnrollment?.final_grade && (
                      <span style={{ fontSize: '0.76rem', color: '#6EE7B7', fontWeight: '700' }}>
                        • {activeEnrollment.final_grade}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#D1FAE5', fontSize: '0.885rem', lineHeight: 1.5, margin: 0, fontWeight: '600' }}>
                    “Este curso já foi concluído. O seu certificado foi emitido. Para continuar os seus estudos, solicite uma nova matrícula noutro curso ou atualize o seu percurso académico.”
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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

            {/* 2. CARD DO DOSSIÊ DE CONCLUSÃO */}
            <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid rgba(0, 199, 253, 0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '1.15rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DOSSIÊ ACADÉMICO OFICIAL
                  </span>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#FFFFFF', marginTop: '0.2rem', lineHeight: 1.25 }}>
                    {displayCourse?.title}
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
                    Histórico escolar de conclusão de percurso com aproveitamento pedagógico reconhecido.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    ✓ 100% de Progresso
                  </span>
                  <div style={{ fontSize: '0.74rem', color: '#A7F3D0', marginTop: '0.35rem' }}>
                    {totalLessons} de {totalLessons} aulas concluídas
                  </div>
                </div>
              </div>

              {/* GRID COM METADADOS DO DOSSIÊ */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* Período / Turma */}
                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={13} color="#00C7FD" />
                    Turma & Período
                  </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.92rem', display: 'block', marginTop: '0.25rem' }}>
                    {activeClass?.name || 'Turma Geral'} {activeClass?.code ? `(${activeClass.code})` : ''}
                  </strong>
                  <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                    Horário: {activeClass?.schedule || 'Laboratório Presencial'}
                  </span>
                </div>

                {/* Formador */}
                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <GraduationCap size={13} color="#00C7FD" />
                    Formador Responsável
                  </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.92rem', display: 'block', marginTop: '0.25rem' }}>
                    {activeClass?.teacher?.name || activeClass?.teacher?.full_name || 'Corpo Docente Zaty Academy'}
                  </strong>
                  <span style={{ color: '#00C7FD', fontSize: '0.75rem' }}>
                    Formador Certificado
                  </span>
                </div>

                {/* Carga Horária & Duração */}
                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} color="#00C7FD" />
                    Carga Horária & Duração
                  </span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.92rem', display: 'block', marginTop: '0.25rem' }}>
                    {displayCourse?.workload_hours || 60} Horas Académicas
                  </strong>
                  <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                    Duração: {displayCourse?.duration || '3 Meses'}
                  </span>
                </div>

                {/* Nota Final & Menção */}
                <div style={{ background: 'rgba(0, 24, 48, 0.75)', padding: '0.9rem', borderRadius: '8px', border: '1.5px solid #10B981' }}>
                  <span style={{ color: '#10B981', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700' }}>
                    <Award size={13} color="#10B981" />
                    Aproveitamento Final
                  </span>
                  <strong style={{ color: '#34D399', fontSize: '1rem', display: 'block', marginTop: '0.25rem' }}>
                    {activeEnrollment?.final_grade || '16/20 Valores (Aprovado com Distinção)'}
                  </strong>
                  <span style={{ color: '#A7F3D0', fontSize: '0.75rem' }}>
                    Situação: Homologado & Aprovado
                  </span>
                </div>
              </div>

              {/* AVALIAÇÕES E NOTAS OBTIDAS */}
              {courseGrades.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(0, 18, 36, 0.65)', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.15)', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#00C7FD', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} />
                    Pauta de Avaliações Contínuas
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(0, 163, 224, 0.2)', color: '#94A3B8' }}>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Avaliação</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Tipo</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Peso</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Nota Obtida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseGrades.map((g, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0, 163, 224, 0.08)' }}>
                            <td style={{ padding: '0.5rem 0.6rem', color: '#FFFFFF', fontWeight: '600' }}>{g.evaluation_title || `Avaliação ${idx + 1}`}</td>
                            <td style={{ padding: '0.5rem 0.6rem', color: '#CBD5E1' }}>{g.evaluation_type || 'Teste'}</td>
                            <td style={{ padding: '0.5rem 0.6rem', color: '#94A3B8' }}>{g.weight ? `${g.weight}%` : '—'}</td>
                            <td style={{ padding: '0.5rem 0.6rem', color: '#34D399', fontWeight: '700' }}>{g.grade_value}/20</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CARD DE CERTIFICADO OFICIAL ÚNICO & AÇÕES (VISUALIZAR / BAIXAR / IMPRIMIR) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
                border: '1.5px solid #F59E0B',
                borderRadius: '10px',
                padding: '1.35rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.25)',
                    border: '1.5px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Award size={24} color="#F59E0B" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#FDE68A', textTransform: 'uppercase', fontWeight: '700' }}>
                      Certificado Oficial Único Emitido
                    </span>
                    <strong style={{ color: '#FFFFFF', fontSize: '1rem', display: 'block', marginTop: '0.1rem' }}>
                      Nº {matchingCertificate?.certificate_number || 'CERT-ZA-2026-OFICIAL'}
                    </strong>
                    <span style={{ color: '#BAE6FD', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      Código de Validação: {matchingCertificate?.validation_code || 'ZA-AUTENTICADO'}
                    </span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO: VISUALIZAR, BAIXAR, IMPRIMIR (Reutiliza certificado existente sem duplicar) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePreviewCertificate}
                    disabled={previewLoading || !matchingCertificate}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
                  >
                    <Eye size={14} color="#00C7FD" />
                    <span>{previewLoading ? 'A Carregar...' : 'Visualizar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    disabled={actionLoading || !matchingCertificate}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
                  >
                    <Download size={14} />
                    <span>Baixar PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    disabled={actionLoading || !matchingCertificate}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
                  >
                    <Printer size={14} color="#CBD5E1" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FLUXO NORMAL DE CURSO EM ANDAMENTO */
          <>
            {/* Cabeçalho do Curso em Andamento */}
            <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      FORMAÇÃO ACADÉMICA
                    </span>
                    <Link
                      to="/estudante/atualizar-curso"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <RotateCcw size={12} />
                      <span>Atualizar Curso</span>
                    </Link>
                  </div>
                  <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.85rem)', fontWeight: '800', color: '#FFFFFF', marginTop: '0.2rem', lineHeight: 1.25 }}>
                    {displayCourse?.title || (loading ? 'Carregando curso...' : 'Nenhum curso matriculado')}
                  </h1>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Progresso do Curso</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#10B981', lineHeight: 1.2 }}>{percent}%</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {completedCount} de {totalLessons} aulas
                  </div>
                </div>
              </div>

              <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.15rem', maxWidth: '800px' }}>
                {displayCourse?.description || 'Aceda aos módulos pedagógicos, vídeo-aulas e materiais de apoio didático do seu curso.'}
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: 'rgba(0, 24, 48, 0.7)',
                borderRadius: '6px',
                border: '1px solid rgba(0, 163, 224, 0.2)',
                fontSize: '0.825rem'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                    <Clock size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                    <span><strong>Carga Horária:</strong> {displayCourse?.workload_hours || 60} Horas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                    <Calendar size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                    <span><strong>Duração:</strong> {displayCourse?.duration || '3 Meses'}</span>
                  </div>
                  {activeClass && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                      <Users size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                      <span><strong>Turma:</strong> {activeClass.name} ({activeClass.schedule})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* LISTAGEM DE MÓDULOS & AULAS */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="#00C7FD" />
            <span>Estrutura Curricular & Conteúdo das Aulas</span>
          </h2>

          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
              <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(0, 199, 253, 0.2)', borderTopColor: '#00C7FD', borderRadius: '50%', margin: '0 auto 0.75rem auto' }} />
              A carregar módulos e aulas...
            </div>
          ) : modules.length === 0 ? (
            <div className="glass-card" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
              <BookOpen size={36} color="#64748B" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ margin: 0, fontWeight: '600' }}>Nenhum módulo disponibilizado para este curso.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modules.map((mod, mIdx) => {
                const lessons = mod.lessons || [];
                const modCompleted = isCourseCompleted 
                  ? lessons.length 
                  : lessons.filter(l => progressMap[l.id]).length;
                const modPercent = lessons.length > 0 ? Math.round((modCompleted / lessons.length) * 100) : 0;

                return (
                  <div key={mod.id || mIdx} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase' }}>
                          Módulo {mIdx + 1}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF', margin: '0.15rem 0 0 0' }}>
                          {mod.title}
                        </h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: modPercent === 100 ? '#10B981' : '#94A3B8', fontWeight: '700' }}>
                          {modCompleted} de {lessons.length} aulas ({modPercent}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {lessons.map((lesson) => {
                        const isDone = isCourseCompleted || !!progressMap[lesson.id];
                        return (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.65rem 0.85rem',
                              background: 'rgba(0, 24, 48, 0.5)',
                              borderRadius: '6px',
                              border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 163, 224, 0.15)'
                            }}
                          >
                            <div 
                              onClick={() => openLesson(lesson, mod.title)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, cursor: 'pointer' }}
                            >
                              {lesson.video_url ? (
                                <Video size={16} color={isDone ? '#10B981' : '#00C7FD'} />
                              ) : (
                                <FileText size={16} color={isDone ? '#10B981' : '#00C7FD'} />
                              )}
                              <span style={{ color: isDone ? '#CBD5E1' : '#FFFFFF', fontSize: '0.85rem', fontWeight: isDone ? '500' : '600' }}>
                                {lesson.title}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleLesson(lesson.id)}
                              disabled={isCourseCompleted}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: isCourseCompleted ? 'default' : 'pointer',
                                padding: '0.2rem',
                                color: isDone ? '#10B981' : '#64748B'
                              }}
                              title={isDone ? 'Aula Concluída' : 'Marcar como Concluída'}
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL DE PRÉ-VISUALIZAÇÃO DE CERTIFICADO */}
        {previewCert && (
          <Modal
            isOpen={!!previewCert}
            onClose={() => {
              setPreviewCert(null);
              setPreviewBlobUrl(null);
            }}
            title={`Certificado Oficial: ${matchingCertificate?.certificate_number || 'Oficial'}`}
            maxWidth="920px"
          >
            <div style={{ height: '70vh', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px' }}
                  title="Certificado Digital"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94A3B8' }}>
                  A preparar certificado oficial...
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)' }}>
                <span style={{ color: '#10B981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} />
                  Documento Oficial Único emitido pela Zaty Academy
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={14} />
                    <span>Baixar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    disabled={actionLoading}
                    className="btn btn-secondary btn-sm"
                  >
                    <Printer size={14} />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL DE VISUALIZADOR DE AULAS */}
        {currentLesson && (
          <LessonViewerModal
            lesson={currentLesson}
            moduleTitle={currentModuleTitle}
            courseTitle={displayCourse?.title}
            onClose={() => setCurrentLesson(null)}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={!!nextLesson}
            hasPrev={!!prevLesson}
          />
        )}
      </main>
    </div>
  );
}

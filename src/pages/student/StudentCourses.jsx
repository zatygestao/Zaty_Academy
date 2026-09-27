import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLessonProgress, toggleLessonProgress, getCourseBySlug } from '../../services/api';
import StudentSidebar from '../../components/student/StudentSidebar';
import LessonViewerModal from '../../components/student/LessonViewerModal';
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
  MapPin
} from 'lucide-react';

export default function StudentCourses() {
  const { student } = useAuth();
  const [courseData, setCourseData] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const activeEnrollment = student?.enrollments?.[0];
  const activeCourse = activeEnrollment?.course;
  const activeClass = activeEnrollment?.class;

  useEffect(() => {
    async function loadCourseAndProgress() {
      if (!student?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const progressList = await getLessonProgress(student.id);
        const map = {};
        (progressList || []).forEach(p => {
          map[p.lesson_id] = p.completed;
        });
        setProgressMap(map);

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
        console.error('Erro ao buscar progresso do estudante:', err);
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
  const completedCount = allLessons.filter(l => progressMap[l.id]).length;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Encontrar próxima aula a ser realizada
  const nextUpLesson = useMemo(() => {
    return allLessons.find(l => !progressMap[l.id]) || allLessons[0] || null;
  }, [allLessons, progressMap]);

  const handleToggleLesson = async (lessonId) => {
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
        {/* Cabeçalho do Curso */}
        <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                FORMAÇÃO ACADÉMICA
              </span>
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
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                    <Users size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                    <span><strong>Turma:</strong> {activeClass.name} {activeClass.code ? `(${activeClass.code})` : ''} ({activeClass.schedule})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                    <UserCheck size={15} color="#10B981" style={{ flexShrink: 0 }} />
                    <span><strong>Formador:</strong> {activeClass.teacher?.full_name || activeClass.teacher?.name || 'A definir'}</span>
                  </div>
                  {activeClass.room && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                      <MapPin size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
                      <span><strong>Sala:</strong> {activeClass.room}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {nextUpLesson && (
              <button
                type="button"
                onClick={() => openLesson(nextUpLesson, nextUpLesson.moduleTitle)}
                className="btn btn-primary btn-sm mobile-btn-full"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: '700' }}
              >
                <Play size={15} />
                <span>{completedCount === 0 ? 'Iniciar Curso' : 'Continuar Estudos'}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* MÓDULOS E AULAS COM VISUALIZADOR INTEGRADO */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#00C7FD" />
            Módulos de Formação & Aulas Disponíveis
          </h2>

          {modules.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94A3B8' }}>
              <BookOpen size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.5, color: '#00C7FD' }} />
              <p>Os módulos e materiais didáticos estão a ser organizados pela coordenação pedagógica.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {modules.map((mod, mIndex) => (
                <div key={mod.id} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: 'rgba(0, 114, 206, 0.35)',
                      border: '1px solid rgba(0, 199, 253, 0.4)',
                      color: '#00C7FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.9rem'
                    }}>
                      {mIndex + 1}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF' }}>{mod.title}</h3>
                      {mod.description && (
                        <p style={{ fontSize: '0.825rem', color: '#94A3B8' }}>{mod.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Lista de Aulas do Módulo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {mod.lessons.length === 0 ? (
                      <div style={{ fontSize: '0.825rem', color: '#64748B', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        Nenhuma aula publicada neste módulo até o momento.
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lIndex) => {
                        const isCompleted = !!progressMap[lesson.id];
                        const isExpired = isLessonExpired(lesson.expires_at);
                        const daysLeft = getRemainingDays(lesson.expires_at);
                        const hasVideo = !!lesson.video_url;
                        const hasPdf = !!lesson.pdf_url;

                        return (
                          <div 
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.85rem',
                              padding: '0.9rem 1.15rem',
                              borderRadius: '6px',
                              background: isCompleted ? 'rgba(16, 185, 129, 0.07)' : 'rgba(0, 24, 48, 0.75)',
                              border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 163, 224, 0.2)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {/* Checkbox de Conclusão e Título da Aula */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: '1 1 200px', minWidth: '0' }}>
                              <button
                                onClick={() => handleToggleLesson(lesson.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0',
                                  marginTop: '3px',
                                  color: isCompleted ? '#10B981' : '#64748B'
                                }}
                                title={isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
                              >
                                {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                              </button>

                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: '0.925rem',
                                  fontWeight: '600',
                                  color: isCompleted ? '#A7F3D0' : '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap'
                                }}>
                                  <span 
                                    onClick={() => openLesson(lesson, mod.title)}
                                    style={{ cursor: 'pointer' }}
                                    className="hover:underline"
                                  >
                                    Aula {lIndex + 1}: {lesson.title}
                                  </span>

                                  {hasVideo && (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.68rem',
                                      color: '#00C7FD',
                                      background: 'rgba(0, 199, 253, 0.12)',
                                      border: '1px solid rgba(0, 199, 253, 0.3)',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '3px'
                                    }}>
                                      <Video size={11} /> Vídeo
                                    </span>
                                  )}

                                  {hasPdf && (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.68rem',
                                      color: '#38BDF8',
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.25)',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '3px'
                                    }}>
                                      <FileText size={11} /> PDF
                                    </span>
                                  )}

                                  {isExpired && (
                                    <span style={{ fontSize: '0.68rem', color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                                      Prazo Expirado
                                    </span>
                                  )}
                                </div>

                                {lesson.description && (
                                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem', lineHeight: '1.4' }}>
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Ações da Aula (Aceder ao Visualizador Integrado) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {lesson.duration_minutes && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#94A3B8', marginRight: '0.25rem' }}>
                                  <Clock size={13} color="#00C7FD" />
                                  {lesson.duration_minutes} min
                                </span>
                              )}

                              {hasPdf && lesson.expires_at && !isExpired && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.72rem',
                                  color: '#00C7FD',
                                  background: 'rgba(0, 199, 253, 0.1)',
                                  border: '1px solid rgba(0, 199, 253, 0.25)',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px'
                                }}>
                                  <Clock size={12} /> {daysLeft}d restantes
                                </span>
                              )}

                              <button
                                onClick={() => openLesson(lesson, mod.title)}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
                                title="Abrir aula no visualizador integrado"
                              >
                                <Play size={14} />
                                <span>Aceder à Aula</span>
                              </button>

                              {hasPdf && !isExpired && (
                                <a
                                  href={lesson.pdf_url}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline btn-sm"
                                  title="Baixar ficheiro PDF diretamente"
                                >
                                  <Download size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Visualizador de Aula Integrado no Painel (Vídeo + PDF + Conteúdo + Navegação) */}
      <LessonViewerModal
        isOpen={!!currentLesson}
        onClose={() => setCurrentLesson(null)}
        lesson={currentLesson}
        moduleTitle={currentModuleTitle}
        isCompleted={!!progressMap[currentLesson?.id]}
        onToggleComplete={handleToggleLesson}
        onPrevLesson={handlePrev}
        onNextLesson={handleNext}
      />
    </div>
  );
}

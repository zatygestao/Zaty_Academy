import { useState, useEffect } from 'react';
import { 
  getCourses, 
  getCourseBySlug, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  createModule, 
  deleteModule,
  createLesson, 
  updateLesson,
  deleteLesson,
  uploadPublicFile,
  deletePublicFile 
} from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Modal from '../../components/common/Modal';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getRemainingDays, 
  isLessonExpired 
} from '../../utils/formatters';
import { 
  Plus, 
  Edit2, 
  FileText, 
  Layers,
  Trash2,
  Clock,
  AlertTriangle,
  Calendar,
  Infinity,
  CheckCircle2
} from 'lucide-react';

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Curso
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    duration: '3 Meses',
    workload_hours: 60,
    price: '',
    registration_fee: '500',
    requirements: '',
    is_active: true,
    featured: false
  });

  // Modal Módulos e Aulas
  const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
  const [activeCourseDetails, setActiveCourseDetails] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  
  // Modal Adicionar / Editar Aula
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    pdfFile: null,
    existingPdfUrl: null,
    existingPdfName: null,
    availableDays: '0',
    customDays: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getCourses(true);
      setCourses(data || []);
    } catch (err) {
      console.error('Erro ao buscar cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openNewCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      slug: '',
      description: '',
      duration: '3 Meses',
      workload_hours: 60,
      price: '',
      registration_fee: '500',
      requirements: '',
      is_active: true,
      featured: false
    });
    setShowCourseModal(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      duration: course.duration || '3 Meses',
      workload_hours: course.workload_hours || 60,
      price: course.price,
      registration_fee: course.registration_fee || '500',
      requirements: course.requirements || '',
      is_active: course.is_active,
      featured: course.featured
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: courseForm.title.trim(),
        slug: courseForm.slug.trim() || courseForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: courseForm.description.trim(),
        duration: courseForm.duration.trim(),
        workload_hours: Number(courseForm.workload_hours),
        price: Number(courseForm.price),
        registration_fee: Number(courseForm.registration_fee || 0),
        requirements: courseForm.requirements.trim(),
        is_active: courseForm.is_active,
        featured: courseForm.featured
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
      } else {
        await createCourse(payload);
      }

      setShowCourseModal(false);
      fetchCourses();
    } catch (err) {
      console.error('Erro ao salvar curso:', err);
      alert(err.message || 'Falha ao salvar curso.');
    } finally {
      setSubmitting(false);
    }
  };

  const openContentManager = async (course) => {
    setSelectedCourseForContent(course);
    try {
      const identifier = course.slug || course.id;
      const full = await getCourseBySlug(identifier);
      setActiveCourseDetails(full || course);
    } catch (e) {
      console.error('Erro ao abrir módulos do curso:', e);
      setActiveCourseDetails(course);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim() || !activeCourseDetails) return;
    setSubmitting(true);
    try {
      await createModule({
        course_id: activeCourseDetails.id,
        title: moduleTitle.trim(),
        order_index: (activeCourseDetails.modules?.length || 0) + 1
      });
      const identifier = activeCourseDetails.slug || activeCourseDetails.id;
      const full = await getCourseBySlug(identifier);
      setActiveCourseDetails(full);
      setModuleTitle('');
      setShowModuleModal(false);
    } catch (err) {
      console.error('Erro ao criar módulo:', err);
      alert(err.message || 'Falha ao criar módulo. Verifique se o banco de dados tem a tabela academy_course_modules.');
    } finally {
      setSubmitting(false);
    }
  };

  const openNewLesson = (moduleId) => {
    setTargetModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm({
      title: '',
      description: '',
      pdfFile: null,
      existingPdfUrl: null,
      existingPdfName: null,
      availableDays: '0',
      customDays: ''
    });
    setShowLessonModal(true);
  };

  const openEditLesson = (moduleId, lesson) => {
    setTargetModuleId(moduleId);
    setEditingLesson(lesson);
    const days = lesson.available_days || 0;
    const isPreset = ['0', '1', '3', '7', '15', '30'].includes(String(days));
    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      pdfFile: null,
      existingPdfUrl: lesson.pdf_url || null,
      existingPdfName: lesson.pdf_name || null,
      availableDays: isPreset ? String(days) : 'custom',
      customDays: isPreset ? '' : String(days)
    });
    setShowLessonModal(true);
  };

  const handleDeleteLesson = async (lesson) => {
    const confirmMsg = lesson.pdf_url
      ? `Tem a certeza que deseja apagar definitivamente a aula "${lesson.title}"?\n\n⚠️ O ficheiro PDF "${lesson.pdf_name || 'anexo'}" e todos os dados serão removidos permanentemente do servidor e do banco de dados.`
      : `Tem a certeza que deseja apagar a aula "${lesson.title}" do sistema?`;

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      await deleteLesson(lesson.id, lesson.pdf_url);
      const identifier = activeCourseDetails.slug || activeCourseDetails.id;
      const full = await getCourseBySlug(identifier);
      setActiveCourseDetails(full);
      alert('Aula e material didático excluídos definitivamente com sucesso!');
    } catch (err) {
      console.error('Erro ao apagar aula:', err);
      alert(err.message || 'Falha ao apagar aula.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (mod) => {
    const count = mod.lessons?.length || 0;
    const confirmMsg = count > 0
      ? `Tem a certeza que deseja apagar o módulo "${mod.title}" e todas as suas ${count} aula(s)?\n\n⚠️ Todos os ficheiros PDF anexos serão removidos permanentemente do armazenamento.`
      : `Tem a certeza que deseja apagar o módulo "${mod.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      await deleteModule(mod.id);
      const identifier = activeCourseDetails.slug || activeCourseDetails.id;
      const full = await getCourseBySlug(identifier);
      setActiveCourseDetails(full);
      alert('Módulo e conteúdos removidos com sucesso!');
    } catch (err) {
      console.error('Erro ao apagar módulo:', err);
      alert(err.message || 'Falha ao apagar módulo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim() || !targetModuleId || !activeCourseDetails) return;
    setSubmitting(true);
    try {
      let pdfUrl = lessonForm.existingPdfUrl || null;
      let pdfName = lessonForm.existingPdfName || null;

      if (lessonForm.pdfFile) {
        if (editingLesson?.pdf_url) {
          await deletePublicFile(editingLesson.pdf_url, 'academy_public');
        }
        pdfUrl = await uploadPublicFile(lessonForm.pdfFile, 'lesson_materials');
        pdfName = lessonForm.pdfFile.name;
      }

      let days = 0;
      if (lessonForm.availableDays === 'custom') {
        days = parseInt(lessonForm.customDays, 10) || 0;
      } else {
        days = parseInt(lessonForm.availableDays, 10) || 0;
      }

      const lessonPayload = {
        module_id: targetModuleId,
        course_id: activeCourseDetails.id,
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        pdf_url: pdfUrl,
        pdf_name: pdfName,
        is_published: true,
        available_days: days > 0 ? days : null,
        expires_at: days > 0 
          ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
          : null
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, lessonPayload);
      } else {
        await createLesson(lessonPayload);
      }

      const identifier = activeCourseDetails.slug || activeCourseDetails.id;
      const full = await getCourseBySlug(identifier);
      setActiveCourseDetails(full);
      setShowLessonModal(false);
      setEditingLesson(null);
    } catch (err) {
      console.error('Erro ao salvar aula:', err);
      alert(err.message || 'Falha ao salvar aula.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Cursos, Módulos & Aulas
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Estruturação da grade de formações, mensalidades e disponibilização de materiais didáticos em PDF.
            </p>
          </div>

          <button onClick={openNewCourse} className="btn btn-primary mobile-btn-full">
            <Plus size={16} />
            CRIAR NOVO CURSO
          </button>
        </div>

        {/* Lista de Cursos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            A carregar cursos...
          </div>
        ) : (
          <div className="grid-2">
            {courses.map(course => (
              <div key={course.id} className="mobile-entity-card" style={{ margin: 0, justifyContent: 'space-between' }}>
                <div>
                  <div className="mobile-card-header" style={{ marginBottom: '0.65rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      {course.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {course.featured && (
                        <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px', fontSize: '0.68rem' }}>Destaque</span>
                      )}
                      <span className={`badge ${course.is_active ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.68rem' }}>
                        {course.is_active ? 'Ativo' : 'Oculto'}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 0.85rem 0' }}>
                    {course.description}
                  </p>

                  <div className="mobile-card-meta" style={{ marginBottom: '1rem' }}>
                    <div>
                      <span className="meta-label">Duração</span>
                      <span className="meta-value">{course.duration}</span>
                    </div>
                    <div>
                      <span className="meta-label">Carga Horária</span>
                      <span className="meta-value">{course.workload_hours}h</span>
                    </div>
                    <div>
                      <span className="meta-label">Mensalidade</span>
                      <span className="meta-value" style={{ color: '#00C7FD', fontWeight: '700' }}>
                        {formatCurrency(course.price)}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Taxa Inscrição</span>
                      <span className="meta-value">
                        {formatCurrency(course.registration_fee || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button onClick={() => openEditCourse(course)} className="btn btn-secondary mobile-action-btn" style={{ fontSize: '0.8rem' }}>
                    <Edit2 size={14} />
                    Editar Curso
                  </button>

                  <button onClick={() => openContentManager(course)} className="btn btn-primary mobile-action-btn" style={{ fontSize: '0.8rem' }}>
                    <Layers size={14} />
                    Gerir Aulas & PDFs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL EDITAR / CRIAR CURSO */}
        <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title={editingCourse ? 'Editar Curso' : 'Criar Novo Curso'} maxWidth="620px">
          <form onSubmit={handleSaveCourse}>
            <div className="form-group">
              <label className="form-label">Título do Curso *</label>
              <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} required className="form-input" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Duração *</label>
                <input type="text" value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} placeholder="Ex: 3 Meses" required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Carga Horária (Horas) *</label>
                <input type="number" value={courseForm.workload_hours} onChange={e => setCourseForm({ ...courseForm, workload_hours: e.target.value })} required className="form-input" />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Preço Total do Curso (MT) *</label>
                <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Taxa de Matrícula (MT) *</label>
                <input type="number" step="0.01" value={courseForm.registration_fee} onChange={e => setCourseForm({ ...courseForm, registration_fee: e.target.value })} required className="form-input" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição Geral</label>
              <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="form-textarea" rows="3" />
            </div>

            <div className="form-group">
              <label className="form-label">Requisitos de Ingresso</label>
              <input type="text" value={courseForm.requirements} onChange={e => setCourseForm({ ...courseForm, requirements: e.target.value })} placeholder="Ex: Informática básica necessária" className="form-input" />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={courseForm.is_active} onChange={e => setCourseForm({ ...courseForm, is_active: e.target.checked })} />
                Curso Ativo e Visível
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={courseForm.featured} onChange={e => setCourseForm({ ...courseForm, featured: e.target.checked })} />
                Destaque na Página Inicial
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setShowCourseModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A gravar...' : 'Gravar Curso'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL GERENCIADOR DE MÓDULOS E AULAS COM PDFs */}
        <Modal 
          isOpen={!!selectedCourseForContent} 
          onClose={() => setSelectedCourseForContent(null)} 
          title={`Conteúdos: ${selectedCourseForContent?.title || ''}`} 
          maxWidth="820px"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.825rem' }}>
              Organize os módulos e faça upload das apostilas em PDF para os alunos.
            </p>
            <button onClick={() => setShowModuleModal(true)} className="btn btn-primary btn-sm">
              <Plus size={15} />
              Novo Módulo
            </button>
          </div>

          {activeCourseDetails?.modules?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Nenhum módulo criado ainda. Clique em "Novo Módulo" para começar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {activeCourseDetails?.modules?.map((mod, idx) => (
                <div key={mod.id} style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '4px', padding: '1.15rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>
                      Módulo {idx + 1}: {mod.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button 
                        onClick={() => openNewLesson(mod.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Plus size={13} />
                        Adicionar Aula / PDF
                      </button>
                      <button 
                        onClick={() => handleDeleteModule(mod)}
                        className="btn btn-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.4rem 0.5rem' }}
                        title="Excluir módulo e suas aulas definitivamente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {mod.lessons?.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                      Nenhuma aula adicionada a este módulo.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {mod.lessons?.map((l, lIdx) => {
                        const expired = isLessonExpired(l.expires_at);
                        const daysLeft = getRemainingDays(l.expires_at);

                        return (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 0.85rem', background: 'rgba(0, 20, 40, 0.85)', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.15)' }}>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: '600' }}>
                                  Aula {lIdx + 1}: {l.title}
                                </span>

                                {/* Badge de Expiração / Disponibilidade */}
                                {!l.expires_at ? (
                                  <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', border: '1px solid rgba(100, 116, 139, 0.3)', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.45rem' }}>
                                    <Infinity size={11} /> Permanente
                                  </span>
                                ) : expired ? (
                                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.35)', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.45rem' }}>
                                    <AlertTriangle size={11} /> Expirado ({formatDate(l.expires_at)})
                                  </span>
                                ) : (
                                  <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.12)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.35)', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.45rem' }}>
                                    <Clock size={11} /> Até {formatDate(l.expires_at)} ({daysLeft}d restantes)
                                  </span>
                                )}
                              </div>

                              {l.description && (
                                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem', marginBottom: '0.2rem' }}>
                                  {l.description}
                                </p>
                              )}

                              {l.pdf_url ? (
                                <span style={{ fontSize: '0.72rem', color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                  <FileText size={12} /> {l.pdf_name || 'Material didático em PDF'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.15rem' }}>
                                  Sem PDF anexo
                                </span>
                              )}
                            </div>

                            {/* Botões de Ação */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {l.pdf_url && (
                                <a href={l.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" title="Abrir PDF">
                                  <FileText size={13} /> PDF
                                </a>
                              )}

                              <button 
                                onClick={() => openEditLesson(mod.id, l)}
                                className="btn btn-secondary btn-sm" 
                                title="Editar aula e alterar prazo de expiração"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button 
                                onClick={() => handleDeleteLesson(l)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.4rem 0.5rem' }}
                                title="Apagar definitivamente aula e arquivo PDF"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* MODAL ADICIONAR MÓDULO */}
        <Modal isOpen={showModuleModal} onClose={() => setShowModuleModal(false)} title="Adicionar Novo Módulo" maxWidth="460px">
          <form onSubmit={handleCreateModule}>
            <div className="form-group">
              <label className="form-label">Título do Módulo / Disciplina *</label>
              <input type="text" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="Ex: Módulo 1: Introdução ao Windows" required className="form-input" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" onClick={() => setShowModuleModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A criar...' : 'Criar Módulo'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL ADICIONAR / EDITAR AULA COM PDF E EXPIRAÇÃO */}
        <Modal 
          isOpen={showLessonModal} 
          onClose={() => { setShowLessonModal(false); setEditingLesson(null); }} 
          title={editingLesson ? 'Editar Aula & Expiração do PDF' : 'Adicionar Aula e Material em PDF'} 
          maxWidth="520px"
        >
          <form onSubmit={handleSaveLesson}>
            <div className="form-group">
              <label className="form-label">Título da Aula *</label>
              <input 
                type="text" 
                value={lessonForm.title} 
                onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} 
                placeholder="Ex: Aula 1: Atalhos e Painel de Controlo" 
                required 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resumo dos Tópicos</label>
              <textarea 
                value={lessonForm.description} 
                onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} 
                placeholder="Breve descrição dos tópicos abordados nesta aula..."
                className="form-textarea" 
                rows="2" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Material Didático em PDF (Opcional)</label>
              
              {lessonForm.existingPdfUrl && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0, 199, 253, 0.08)', borderRadius: '4px', border: '1px solid rgba(0, 199, 253, 0.25)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#E0F2FE', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} color="#00C7FD" />
                    PDF Atual: <strong>{lessonForm.existingPdfName || 'documento.pdf'}</strong>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setLessonForm({ ...lessonForm, existingPdfUrl: null, existingPdfName: null })}
                    className="btn btn-sm" 
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', color: '#EF4444', background: 'transparent' }}
                  >
                    Remover
                  </button>
                </div>
              )}

              <input 
                type="file" 
                accept="application/pdf" 
                onChange={e => setLessonForm({ ...lessonForm, pdfFile: e.target.files[0] })}
                className="form-input" 
              />
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {lessonForm.existingPdfUrl 
                  ? 'Selecione um novo arquivo caso queira substituir o PDF atual.' 
                  : 'O estudante poderá abrir este PDF no leitor integrado e descarregá-lo.'}
              </span>
            </div>

            {/* SELEÇÃO DE DISPONIBILIDADE / EXPIRAÇÃO */}
            <div className="form-group" style={{ marginTop: '1.15rem', padding: '0.95rem', background: 'rgba(0, 30, 60, 0.5)', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.25)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00C7FD', fontWeight: '700' }}>
                <Clock size={16} />
                Disponibilidade da Aula / PDF para os Alunos
              </label>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                Escolha por quantos dias este conteúdo ficará disponível para os alunos a partir de hoje.
              </p>

              <select 
                value={lessonForm.availableDays} 
                onChange={e => setLessonForm({ ...lessonForm, availableDays: e.target.value })}
                className="form-input"
              >
                <option value="0">♾️ Permanente (Sem expiração / Disponível sempre)</option>
                <option value="1">⏱️ 1 Dia (24 horas de acesso)</option>
                <option value="3">📅 3 Dias de acesso</option>
                <option value="7">📅 7 Dias (1 Semana de acesso)</option>
                <option value="15">📅 15 Dias de acesso</option>
                <option value="30">📅 30 Dias (1 Mês de acesso)</option>
                <option value="custom">✏️ Personalizado (definir quantidade de dias)</option>
              </select>

              {lessonForm.availableDays === 'custom' && (
                <div style={{ marginTop: '0.65rem' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Quantidade de dias de acesso:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={lessonForm.customDays} 
                    onChange={e => setLessonForm({ ...lessonForm, customDays: e.target.value })}
                    placeholder="Ex: 5, 10, 45..." 
                    className="form-input"
                    required={lessonForm.availableDays === 'custom'}
                  />
                </div>
              )}

              {/* Pré-visualização do Prazo */}
              <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: '#CBD5E1', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', background: 'rgba(0, 20, 40, 0.6)', padding: '0.6rem 0.75rem', borderRadius: '4px' }}>
                <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {(() => {
                    const days = lessonForm.availableDays === 'custom' ? parseInt(lessonForm.customDays, 10) : parseInt(lessonForm.availableDays, 10);
                    if (!days || days <= 0) {
                      return 'Esta aula e o PDF ficarão sempre visíveis para os alunos sem qualquer bloqueio temporal.';
                    }
                    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                    return `A aula e o PDF ficarão disponíveis até ${formatDate(targetDate)}. Após essa data, o PDF sumirá automaticamente para os alunos.`;
                  })()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => { setShowLessonModal(false); setEditingLesson(null); }} 
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A salvar...' : editingLesson ? 'Gravar Alterações' : 'Adicionar Aula'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  getClasses, 
  createClass, 
  updateClass, 
  deleteClass, 
  getCourses, 
  getTeachers,
  removeStudentFromClass
} from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Modal from '../../components/common/Modal';
import UserAvatar from '../../components/common/UserAvatar';
import AssignStudentsToClassModal from '../../components/admin/AssignStudentsToClassModal';
import { generateClassCode } from '../../utils/formatters';
import { 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  MapPin, 
  UserCheck, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  BookOpen,
  UserPlus,
  UserMinus
} from 'lucide-react';

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [detailsClass, setDetailsClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignClassId, setAssignClassId] = useState(null);
  const [removingStudentId, setRemovingStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    course_id: '',
    teacher_id: '',
    schedule: 'Segunda a Sexta: 08h00 - 10h00',
    room: 'Sala 1 - Laboratório TI',
    start_date: '',
    end_date: '',
    max_students: 20,
    status: 'aberta'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregamento independente para garantir que falhas em uma tabela não bloqueiem as outras
      const [crsRes, tchsRes, clsRes] = await Promise.allSettled([
        getCourses(true),
        getTeachers(),
        getClasses()
      ]);

      const crs = crsRes.status === 'fulfilled' ? (crsRes.value || []) : [];
      const tchs = tchsRes.status === 'fulfilled' ? (tchsRes.value || []) : [];
      const cls = clsRes.status === 'fulfilled' ? (clsRes.value || []) : [];

      setCourses(crs);
      setTeachers(tchs);
      setClasses(cls);

      if (crs.length > 0 && !form.course_id) {
        setForm(prev => ({ ...prev, course_id: crs[0].id }));
      }
    } catch (err) {
      console.error('Erro ao buscar dados das turmas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setErrorMsg('');
    setForm({
      name: '',
      code: generateClassCode(),
      course_id: courses.length > 0 ? courses[0].id : '',
      teacher_id: '',
      schedule: 'Segunda a Sexta: 08h00 - 10h00',
      room: 'Sala 1 - Laboratório TI',
      start_date: '',
      end_date: '',
      max_students: 20,
      status: 'aberta'
    });
    setShowModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setErrorMsg('');
    setForm({
      name: cls.name || '',
      code: cls.code || '',
      course_id: cls.course_id || (courses.length > 0 ? courses[0].id : ''),
      teacher_id: cls.teacher_id || '',
      schedule: cls.schedule || 'Segunda a Sexta: 08h00 - 10h00',
      room: cls.room || 'Sala 1 - Laboratório TI',
      start_date: cls.start_date || '',
      end_date: cls.end_date || '',
      max_students: cls.max_students || 20,
      status: cls.status || 'aberta'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.course_id) {
      setErrorMsg('Preencha o nome da turma e seleccione o curso vinculado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingClass) {
        await updateClass(editingClass.id, {
          ...form,
          name: form.name.trim(),
          code: form.code ? form.code.trim().toUpperCase() : undefined,
          max_students: Number(form.max_students)
        });
        setSuccessMsg('Turma atualizada com sucesso!');
      } else {
        await createClass({
          ...form,
          name: form.name.trim(),
          code: form.code ? form.code.trim().toUpperCase() : generateClassCode(),
          max_students: Number(form.max_students)
        });
        setSuccessMsg('Nova turma criada com sucesso!');
      }

      setShowModal(false);
      setEditingClass(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Erro ao guardar turma:', err);
      setErrorMsg(err.message || 'Falha ao guardar turma.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await deleteClass(deletingClass.id);
      setDeletingClass(null);
      setSuccessMsg('Turma eliminada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Erro ao eliminar turma:', err);
      alert(err.message || 'Falha ao eliminar turma.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (student, classId) => {
    if (!window.confirm(`Tem a certeza que deseja desvincular o estudante "${student.full_name}" desta turma?`)) {
      return;
    }
    setRemovingStudentId(student.id);
    try {
      await removeStudentFromClass({
        enrollmentId: student.enrollment_id,
        studentId: student.id,
        classId
      });
      setSuccessMsg(`Estudante "${student.full_name}" desvinculado com sucesso.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
      setDetailsClass(prev => {
        if (!prev) return null;
        return {
          ...prev,
          students: (prev.students || []).filter(s => s.id !== student.id),
          student_count: Math.max(0, (prev.student_count || 1) - 1)
        };
      });
    } catch (err) {
      console.error('Erro ao remover aluno da turma:', err);
      alert(err.message || 'Falha ao desvincular aluno da turma.');
    } finally {
      setRemovingStudentId(null);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Gestão de Turmas & Horários
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Criação de turmas, alocação de formadores, salas de laboratório e controle de vagas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }} className="mobile-header-actions">
            <button 
              onClick={() => {
                setAssignClassId(null);
                setShowAssignModal(true);
              }}
              className="btn btn-secondary mobile-action-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderColor: '#00C7FD',
                color: '#00C7FD'
              }}
              title="Adicionar e associar múltiplos alunos a uma turma"
            >
              <UserPlus size={16} />
              <span>Enturmação / Atribuir Alunos</span>
            </button>
            <button onClick={openCreateModal} className="btn btn-primary mobile-action-btn">
              <Plus size={16} />
              <span>CRIAR NOVA TURMA</span>
            </button>
          </div>
        </div>

        {/* Mensagens de Sucesso */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '4px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#6EE7B7',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Lista de Turmas */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar turmas...
            </div>
          ) : classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>Nenhuma turma configurada ainda.</p>
              <button onClick={openCreateModal} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                <Plus size={14} /> Criar a Primeira Turma
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {classes.map(cls => (
                <div key={cls.id} className="mobile-entity-card" style={{ margin: 0, justifyContent: 'space-between' }}>
                  <div>
                    <div className="mobile-card-header" style={{ marginBottom: '0.65rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                          {cls.name}
                        </h3>
                        {cls.code && (
                          <div style={{ fontSize: '0.74rem', color: '#00C7FD', fontFamily: 'monospace', fontWeight: '700', marginTop: '0.15rem' }}>
                            {cls.code}
                          </div>
                        )}
                      </div>
                      <span className="badge" style={{ 
                        background: cls.status === 'aberta' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: cls.status === 'aberta' ? '#34D399' : '#FCA5A5', 
                        border: `1px solid ${cls.status === 'aberta' ? '#10B981' : '#EF4444'}`, 
                        borderRadius: '3px', 
                        textTransform: 'capitalize',
                        fontSize: '0.7rem'
                      }}>
                        {cls.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#00C7FD', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BookOpen size={14} />
                      Curso: {cls.course?.title || 'Curso Vinculado'}
                    </div>

                    <div className="mobile-card-meta" style={{ marginBottom: '1rem' }}>
                      <div>
                        <span className="meta-label">Horário</span>
                        <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} color="#00C7FD" />
                          {cls.schedule}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Sala</span>
                        <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={12} color="#00C7FD" />
                          {cls.room || 'Lab TI'}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Formador</span>
                        <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <UserCheck size={12} color="#10B981" />
                          {cls.teacher?.name || 'A definir'}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Alunos / Capacidade</span>
                        <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={12} color="#38BDF8" />
                          {cls.student_count || cls.students?.length || 0} / {cls.max_students}
                        </span>
                      </div>
                    </div>

                    {cls.start_date && (
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '0.5rem' }}>
                        Período: {cls.start_date} {cls.end_date ? `| Término: ${cls.end_date}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Ações da Turma */}
                  <div className="mobile-card-actions">
                    <button 
                      onClick={() => {
                        setAssignClassId(cls.id);
                        setShowAssignModal(true);
                      }}
                      className="btn btn-secondary mobile-action-btn"
                      title="Adicionar Alunos a Esta Turma"
                      style={{ fontSize: '0.78rem', color: '#00C7FD', borderColor: 'rgba(0, 199, 253, 0.4)' }}
                    >
                      <UserPlus size={14} />
                      Alunos
                    </button>
                    <button 
                      onClick={() => setDetailsClass(cls)}
                      className="btn btn-secondary mobile-action-btn"
                      title="Ver Detalhes da Turma"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Eye size={14} />
                      Detalhes
                    </button>
                    <button 
                      onClick={() => openEditModal(cls)}
                      className="btn btn-secondary mobile-action-btn"
                      title="Editar Turma"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button 
                      onClick={() => setDeletingClass(cls)}
                      className="btn btn-danger mobile-action-btn"
                      title="Eliminar Turma"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL CRIAR / EDITAR TURMA */}
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={editingClass ? "Editar Dados da Turma" : "Criar Nova Turma"} 
          maxWidth="580px"
        >
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '4px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#FCA5A5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nome de Identificação da Turma *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="Ex: Turma A - Manhã 2026.1" 
                  required 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Código da Turma *</label>
                <input 
                  type="text" 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  placeholder="Ex: TUR-2026-1001" 
                  required 
                  className="form-input" 
                  style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.04em' }}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Curso Vinculado *</label>
                <select 
                  value={form.course_id} 
                  onChange={e => setForm({ ...form, course_id: e.target.value })} 
                  className="form-select" 
                  required
                >
                  <option value="">-- Selecione o Curso Vinculado --</option>
                  {courses.length === 0 ? (
                    <option value="" disabled>Nenhum curso cadastrado no sistema</option>
                  ) : (
                    courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Formador Responsável</label>
                <select 
                  value={form.teacher_id} 
                  onChange={e => setForm({ ...form, teacher_id: e.target.value })} 
                  className="form-select"
                >
                  <option value="">A designar posteriormente</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Horário das Aulas *</label>
                <input 
                  type="text" 
                  value={form.schedule} 
                  onChange={e => setForm({ ...form, schedule: e.target.value })} 
                  placeholder="Ex: Seg a Sex, 08h00 - 10h00" 
                  required 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sala / Laboratório</label>
                <input 
                  type="text" 
                  value={form.room} 
                  onChange={e => setForm({ ...form, room: e.target.value })} 
                  className="form-input" 
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Data Prevista Término</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Vagas Máximas</label>
                <input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} className="form-input" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estado da Turma</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select">
                <option value="aberta">Aberta para Inscrições</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A guardar...' : editingClass ? 'Guardar Alterações' : 'Criar Turma'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL DETALHES DA TURMA */}
        <Modal 
          isOpen={!!detailsClass} 
          onClose={() => setDetailsClass(null)} 
          title={`Detalhes da Turma: ${detailsClass?.name || ''}`} 
          maxWidth="560px"
        >
          {detailsClass && (
            <div>
              <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '1.25rem', border: '1px solid rgba(0, 163, 224, 0.2)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                  {detailsClass.name}
                </div>
                {detailsClass.code && (
                  <div style={{ fontSize: '0.8rem', color: '#00C7FD', fontFamily: 'monospace', fontWeight: '700', marginBottom: '0.75rem' }}>
                    Código Oficial: {detailsClass.code}
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: '1rem' }}>
                  Curso: <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{detailsClass.course?.title || 'Curso Vinculado'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Formador:</span>
                    <div style={{ color: '#FFFFFF', fontWeight: '600' }}>{detailsClass.teacher?.name || 'A designar'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Horário:</span>
                    <div style={{ color: '#FFFFFF', fontWeight: '600' }}>{detailsClass.schedule}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Sala / Laboratório:</span>
                    <div style={{ color: '#FFFFFF', fontWeight: '600' }}>{detailsClass.room || 'Sala 1'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Capacidade Máxima:</span>
                    <div style={{ color: '#38BDF8', fontWeight: '600' }}>{detailsClass.max_students} alunos</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Início das Aulas:</span>
                    <div style={{ color: '#FFFFFF' }}>{detailsClass.start_date || 'A definir'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Previsão de Término:</span>
                    <div style={{ color: '#FFFFFF' }}>{detailsClass.end_date || 'A definir'}</div>
                  </div>
                </div>
              </div>

              {/* Secção de Estudantes Matriculados */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Users size={16} color="#00C7FD" />
                    <span>Estudantes Matriculados ({detailsClass.students?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const clsId = detailsClass.id;
                      setDetailsClass(null);
                      setAssignClassId(clsId);
                      setShowAssignModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', color: '#00C7FD', borderColor: 'rgba(0, 199, 253, 0.4)' }}
                  >
                    <UserPlus size={13} />
                    Adicionar Alunos
                  </button>
                </div>

                {(!detailsClass.students || detailsClass.students.length === 0) ? (
                  <div style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'rgba(0, 24, 48, 0.4)',
                    borderRadius: '6px',
                    border: '1px dashed rgba(0, 163, 224, 0.2)',
                    color: '#94A3B8',
                    fontSize: '0.85rem'
                  }}>
                    Nenhum estudante matriculado nesta turma ainda.
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    background: 'rgba(0, 24, 48, 0.4)',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 163, 224, 0.15)'
                  }}>
                    {detailsClass.students.map(st => (
                      <div
                        key={st.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(0, 24, 48, 0.6)',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 163, 224, 0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <UserAvatar name={st.full_name} photoUrl={st.photo_url} size={28} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: '600' }}>
                              {st.full_name}
                            </div>
                            <div style={{ color: '#00C7FD', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                              {st.student_code} {st.email ? `• ${st.email}` : ''}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st, detailsClass.id)}
                          disabled={removingStudentId === st.id}
                          className="btn btn-danger btn-sm"
                          title="Remover estudante desta turma"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <UserMinus size={13} />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button onClick={() => setDetailsClass(null)} className="btn btn-secondary">Fechar</button>
                <button 
                  onClick={() => {
                    const cls = detailsClass;
                    setDetailsClass(null);
                    openEditModal(cls);
                  }} 
                  className="btn btn-primary"
                >
                  <Edit size={15} /> Editar Esta Turma
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
        <Modal 
          isOpen={!!deletingClass} 
          onClose={() => setDeletingClass(null)} 
          title="Eliminar Turma" 
          maxWidth="460px"
        >
          {deletingClass && (
            <div>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Tem a certeza que deseja eliminar permanentemente a turma <strong>"{deletingClass.name}"</strong>? Esta operação não pode ser revertida.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button onClick={() => setDeletingClass(null)} className="btn btn-secondary">Cancelar</button>
                <button onClick={handleDeleteConfirm} disabled={submitting} className="btn btn-danger">
                  {submitting ? 'A eliminar...' : 'Confirmar Eliminação'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL DE ENTURMAÇÃO E ATRIBUIÇÃO DE FORMADOR */}
        <AssignStudentsToClassModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssignClassId(null);
          }}
          initialClassId={assignClassId}
          onSuccess={async () => {
            await loadData();
            setSuccessMsg('Estudantes associados à turma com sucesso!');
            setTimeout(() => setSuccessMsg(''), 4000);
          }}
        />
      </main>
    </div>
  );
}

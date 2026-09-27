import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import UserAvatar from '../common/UserAvatar';
import { 
  getClasses, 
  getTeachers, 
  getAvailableStudentsForClass, 
  assignStudentsToClass 
} from '../../services/api';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Check, 
  Info, 
  Layers, 
  X 
} from 'lucide-react';

export default function AssignStudentsToClassModal({
  isOpen,
  onClose,
  initialClassId = null,
  onSuccess
}) {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  
  const [step, setStep] = useState(1); // 1: Turma & Formador, 2: Estudantes, 3: Confirmação
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('course'); // 'course' | 'unassigned' | 'all'
  
  const [loadingData, setLoadingData] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const handleModalClose = () => {
    setStep(1);
    setErrorMsg('');
    setSuccessResult(null);
    setSelectedStudentIds(new Set());
    setSearchTerm('');
    onClose();
  };

  // Carregar turmas e formadores ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    async function loadInitial() {
      setLoadingData(true);
      setErrorMsg('');
      setStep(1);
      setSuccessResult(null);
      setSelectedStudentIds(new Set());
      setSearchTerm('');
      try {
        const [cls, tchs] = await Promise.all([
          getClasses(),
          getTeachers()
        ]);
        setClasses(cls || []);
        setTeachers(tchs || []);

        const targetClassId = initialClassId || (cls && cls.length > 0 ? cls[0].id : '');
        setSelectedClassId(targetClassId);

        if (targetClassId) {
          const targetCls = (cls || []).find(c => c.id === targetClassId);
          if (targetCls?.teacher_id) {
            setSelectedTeacherId(targetCls.teacher_id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar turmas e formadores:', err);
        setErrorMsg('Não foi possível carregar a lista de turmas e formadores.');
      } finally {
        setLoadingData(false);
      }
    }

    loadInitial();
  }, [isOpen, initialClassId]);

  // Turma atualmente selecionada
  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Atualiza o formador pré-selecionado quando muda a turma
  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId);
    const cls = classes.find(c => c.id === newClassId);
    if (cls?.teacher_id) {
      setSelectedTeacherId(cls.teacher_id);
    } else {
      setSelectedTeacherId('');
    }
    // Limpa a lista de selecionados ao trocar de turma
    setSelectedStudentIds(new Set());
  };

  // Carregar estudantes disponíveis quando a turma estiver definida e o utilizador avançar para o passo 2
  useEffect(() => {
    if (!isOpen || !selectedClassId || step < 2) return;

    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const stdList = await getAvailableStudentsForClass(selectedClassId, selectedClass?.course_id);
        setStudents(stdList || []);
        
        // Se houver estudantes inscritos no curso, define filtro para 'course', senão 'all'
        const hasCourseStudents = stdList.some(s => s.is_enrolled_in_course && !s.is_in_this_class);
        if (!hasCourseStudents) {
          setFilterType('all');
        }
      } catch (err) {
        console.error('Erro ao carregar estudantes:', err);
        setErrorMsg('Falha ao consultar a lista de estudantes disponíveis.');
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchStudents();
  }, [isOpen, selectedClassId, selectedClass?.course_id, step]);

  // Formador selecionado
  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // Filtragem de estudantes para a lista
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Filtro rápido
    if (filterType === 'course' && selectedClass?.course_id) {
      list = list.filter(s => s.is_enrolled_in_course);
    } else if (filterType === 'unassigned') {
      list = list.filter(s => !s.has_any_class);
    }

    // Busca textual
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(s => 
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.student_code || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
      );
    }

    return list;
  }, [students, filterType, searchTerm, selectedClass?.course_id]);

  // Alternar seleção de um estudante
  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Selecionar todos os disponíveis da filtragem atual (que ainda não pertençam à turma)
  const handleSelectAll = () => {
    const selectable = filteredStudents.filter(s => !s.is_in_this_class);
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      selectable.forEach(s => next.add(s.id));
      return next;
    });
  };

  // Desmarcar todos
  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Lista dos estudantes selecionados com dados completos
  const selectedStudentsList = useMemo(() => {
    return students.filter(s => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds]);

  // Submissão final
  const handleConfirmSubmit = async () => {
    if (!selectedClassId) {
      setErrorMsg('Por favor, selecione uma turma.');
      return;
    }
    if (selectedStudentIds.size === 0) {
      setErrorMsg('Selecione pelo menos um estudante para adicionar.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const result = await assignStudentsToClass({
        classId: selectedClassId,
        teacherId: selectedTeacherId || null,
        studentIds: Array.from(selectedStudentIds)
      });

      setSuccessResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Erro ao associar estudantes:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao guardar as associações.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTeacherName = selectedTeacher?.full_name || selectedTeacher?.name || selectedClass?.teacher?.name || 'Formador a designar';
  const currentClassName = selectedClass?.name || 'Turma selecionada';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Enturmação & Atribuição de Formador"
      maxWidth="720px"
    >
      {/* Barra de Progresso em Etapas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(0, 24, 48, 0.6)',
        borderRadius: '6px',
        border: '1px solid rgba(0, 163, 224, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step >= 1 ? '#00C7FD' : '#64748B', fontWeight: step === 1 ? '700' : '500', fontSize: '0.85rem' }}>
          <span style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: step >= 1 ? '#0072CE' : 'rgba(100, 116, 139, 0.2)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>1</span>
          <span>Turma & Formador</span>
        </div>

        <ChevronRight size={16} color="#64748B" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step >= 2 ? '#00C7FD' : '#64748B', fontWeight: step === 2 ? '700' : '500', fontSize: '0.85rem' }}>
          <span style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: step >= 2 ? '#0072CE' : 'rgba(100, 116, 139, 0.2)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>2</span>
          <span>Selecionar Estudantes</span>
        </div>

        <ChevronRight size={16} color="#64748B" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step >= 3 ? '#00C7FD' : '#64748B', fontWeight: step === 3 ? '700' : '500', fontSize: '0.85rem' }}>
          <span style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: step >= 3 ? '#10B981' : 'rgba(100, 116, 139, 0.2)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>3</span>
          <span>Confirmação</span>
        </div>
      </div>

      {/* Alerta de Erro */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#FCA5A5',
          fontSize: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TELA DE SUCESSO APÓS CONFIRMAÇÃO */}
      {successResult ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '2px solid #10B981'
          }}>
            <CheckCircle2 size={32} color="#10B981" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Enturmação Concluída com Sucesso!
          </h3>

          <p style={{ color: '#94A3B8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            {successResult.count} estudante(s) associado(s) à Turma <strong>{currentClassName}</strong> sob a responsabilidade do Formador <strong>{currentTeacherName}</strong>.
          </p>

          <div style={{
            background: 'rgba(0, 24, 48, 0.7)',
            borderRadius: '6px',
            padding: '1rem',
            border: '1px solid rgba(0, 163, 224, 0.2)',
            maxWidth: '480px',
            margin: '0 auto 1.5rem auto',
            textAlign: 'left',
            fontSize: '0.825rem'
          }}>
            <div style={{ color: '#00C7FD', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={15} /> Notificações & Atualização Automática:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>O painel de cada estudante selecionado foi atualizado em tempo real.</li>
              <li>Os horários, sala e dados do formador estão agora visíveis no perfil dos alunos.</li>
              <li>Uma notificação oficial foi enviada a cada estudante.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            Concluir & Fechar
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* PASSO 1: SELEÇÃO DE TURMA & FORMADOR */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Defina a turma que irá receber os novos estudantes e confirme ou atribua o formador responsável.
                </p>
              </div>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.9rem' }}>
                  A carregar dados das turmas e formadores...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Campo 1: Selecionar Turma */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}>
                      <Layers size={15} color="#00C7FD" />
                      1. Selecione a Turma Pretendida *
                    </label>
                    <select
                      className="form-input"
                      value={selectedClassId}
                      onChange={e => handleClassChange(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    >
                      <option value="">-- Selecione uma turma --</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.code ? `(${cls.code})` : ''} — Curso: {cls.course?.title || 'Geral'} ({cls.student_count || cls.students?.length || 0}/{cls.max_students || 20} alunos)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Resumo visual da Turma Selecionada */}
                  {selectedClass && (
                    <div style={{
                      background: 'rgba(0, 24, 48, 0.7)',
                      borderRadius: '6px',
                      padding: '1rem',
                      border: '1px solid rgba(0, 163, 224, 0.25)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                      fontSize: '0.825rem'
                    }}>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Curso Vinculado</span>
                        <strong style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <BookOpen size={13} color="#00C7FD" />
                          {selectedClass.course?.title || 'Curso Vinculado'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Horário das Aulas</span>
                        <strong style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Clock size={13} color="#00C7FD" />
                          {selectedClass.schedule}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Sala / Laboratório</span>
                        <strong style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <MapPin size={13} color="#00C7FD" />
                          {selectedClass.room || 'Sala 1 - Laboratório TI'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Ocupação da Turma</span>
                        <strong style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Users size={13} color="#38BDF8" />
                          {selectedClass.student_count || selectedClass.students?.length || 0} / {selectedClass.max_students || 20} matriculados
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Campo 2: Selecionar Formador Responsável */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}>
                      <UserCheck size={15} color="#10B981" />
                      2. Selecione o Formador Responsável *
                    </label>
                    <select
                      className="form-input"
                      value={selectedTeacherId}
                      onChange={e => setSelectedTeacherId(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    >
                      <option value="">-- Selecione o formador --</option>
                      {teachers.map(tch => (
                        <option key={tch.id} value={tch.id}>
                          {tch.full_name || tch.name} {tch.specialty ? `— Especialidade: ${tch.specialty}` : ''} {tch.email ? `(${tch.email})` : ''}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                      {selectedClass?.teacher?.name 
                        ? `Formador atualmente designado nesta turma: ${selectedClass.teacher.name}. Pode manter ou alterar o responsável.`
                        : 'Selecione o formador responsável que ministrará as aulas desta turma.'
                      }
                    </small>
                  </div>
                </div>
              )}

              {/* Ações do Passo 1 */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(0, 163, 224, 0.2)'
              }}>
                <button type="button" onClick={handleModalClose} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedClassId || !selectedTeacherId}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>Avançar para Seleção de Alunos</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 2: SELEÇÃO MÚLTIPLA DE ESTUDANTES */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div>
              {/* Barra de resumo da turma & formador escolhidos */}
              <div style={{
                background: 'rgba(0, 24, 48, 0.65)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                border: '1px solid rgba(0, 163, 224, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.825rem'
              }}>
                <div>
                  <span style={{ color: '#94A3B8' }}>Turma: </span>
                  <strong style={{ color: '#FFFFFF' }}>{currentClassName}</strong>
                  {selectedClass?.code && <span style={{ color: '#00C7FD', marginLeft: '0.35rem' }}>({selectedClass.code})</span>}
                </div>
                <div>
                  <span style={{ color: '#94A3B8' }}>Formador: </span>
                  <strong style={{ color: '#34D399' }}>{currentTeacherName}</strong>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Filtros rápidos */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setFilterType('course')}
                      className="btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '4px',
                        background: filterType === 'course' ? '#0072CE' : 'rgba(0, 24, 48, 0.6)',
                        color: filterType === 'course' ? '#FFFFFF' : '#94A3B8',
                        border: '1px solid rgba(0, 163, 224, 0.3)'
                      }}
                    >
                      Inscritos no Curso ({students.filter(s => s.is_enrolled_in_course).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('unassigned')}
                      className="btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '4px',
                        background: filterType === 'unassigned' ? '#0072CE' : 'rgba(0, 24, 48, 0.6)',
                        color: filterType === 'unassigned' ? '#FFFFFF' : '#94A3B8',
                        border: '1px solid rgba(0, 163, 224, 0.3)'
                      }}
                    >
                      Sem Turma ({students.filter(s => !s.has_any_class).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('all')}
                      className="btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '4px',
                        background: filterType === 'all' ? '#0072CE' : 'rgba(0, 24, 48, 0.6)',
                        color: filterType === 'all' ? '#FFFFFF' : '#94A3B8',
                        border: '1px solid rgba(0, 163, 224, 0.3)'
                      }}
                    >
                      Todos os Alunos ({students.length})
                    </button>
                  </div>

                  {/* Ações em massa */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{
                        fontSize: '0.72rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#00C7FD',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Selecionar Todos
                    </button>
                    <span style={{ color: '#64748B' }}>|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      style={{
                        fontSize: '0.72rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      Limpar Seleção
                    </button>
                  </div>
                </div>

                {/* Input de Busca */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar estudante por nome, código ZA-, e-mail ou telefone..."
                    style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Contador de selecionados */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.75rem',
                background: selectedStudentIds.size > 0 ? 'rgba(0, 199, 253, 0.12)' : 'rgba(0, 24, 48, 0.4)',
                border: selectedStudentIds.size > 0 ? '1px solid rgba(0, 199, 253, 0.35)' : '1px solid rgba(0, 163, 224, 0.15)',
                borderRadius: '4px',
                marginBottom: '0.75rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: selectedStudentIds.size > 0 ? '#00C7FD' : '#94A3B8', fontWeight: '600' }}>
                  {selectedStudentIds.size} estudante(s) selecionado(s)
                </span>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                  A mostrar {filteredStudents.length} de {students.length} estudantes
                </span>
              </div>

              {/* Lista Interativa de Estudantes */}
              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                  A carregar lista de estudantes...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: '#94A3B8',
                  background: 'rgba(0, 24, 48, 0.4)',
                  borderRadius: '6px',
                  border: '1px dashed rgba(0, 163, 224, 0.2)'
                }}>
                  <Users size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4, color: '#00C7FD' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhum estudante encontrado para os filtros selecionados.</p>
                </div>
              ) : (
                <div style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  paddingRight: '0.25rem'
                }}>
                  {filteredStudents.map(student => {
                    const isSelected = selectedStudentIds.has(student.id);
                    const alreadyInClass = student.is_in_this_class;

                    return (
                      <div
                        key={student.id}
                        onClick={() => !alreadyInClass && toggleStudent(student.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          background: alreadyInClass 
                            ? 'rgba(0, 24, 48, 0.35)' 
                            : isSelected 
                            ? 'rgba(0, 114, 206, 0.25)' 
                            : 'rgba(0, 24, 48, 0.6)',
                          border: isSelected 
                            ? '1px solid #00C7FD' 
                            : alreadyInClass 
                            ? '1px solid rgba(100, 116, 139, 0.2)' 
                            : '1px solid rgba(0, 163, 224, 0.15)',
                          cursor: alreadyInClass ? 'not-allowed' : 'pointer',
                          opacity: alreadyInClass ? 0.65 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Checkbox e Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelected || alreadyInClass}
                            disabled={alreadyInClass}
                            onChange={() => !alreadyInClass && toggleStudent(student.id)}
                            style={{ width: '16px', height: '16px', cursor: alreadyInClass ? 'not-allowed' : 'pointer', accentColor: '#00C7FD' }}
                          />

                          <UserAvatar
                            name={student.full_name}
                            photoUrl={student.photo_url}
                            size={34}
                          />

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '0.85rem' }}>
                                {student.full_name}
                              </span>
                              <span style={{ color: '#00C7FD', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                                {student.student_code}
                              </span>
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {student.email || student.phone || 'Sem contacto adicional'}
                            </div>
                          </div>
                        </div>

                        {/* Badges de Estado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          {alreadyInClass ? (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#34D399',
                              border: '1px solid #10B981',
                              fontWeight: '600'
                            }}>
                              Já nesta turma
                            </span>
                          ) : student.current_class_name ? (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#FCD34D',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }} title={`Matriculado em: ${student.current_class_name}`}>
                              Outra Turma
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(56, 189, 248, 0.12)',
                              color: '#38BDF8',
                              border: '1px solid rgba(56, 189, 248, 0.25)'
                            }}>
                              Sem turma
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ações do Passo 2 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(0, 163, 224, 0.2)'
              }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ChevronLeft size={16} />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedStudentIds.size === 0}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>Avançar para Confirmação ({selectedStudentIds.size})</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 3: CONFIRMAÇÃO CLARA E RESUMO ANTES DE GUARDAR */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div>
              {/* CARD DE DESTAQUE COM A PERGUNTA EXATA DE CONFIRMAÇÃO */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 114, 206, 0.25) 0%, rgba(0, 199, 253, 0.15) 100%)',
                border: '2px solid #00C7FD',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 15px rgba(0, 199, 253, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <ShieldCheck size={26} color="#00C7FD" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{
                      fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      margin: '0 0 0.35rem 0',
                      lineHeight: 1.35
                    }}>
                      “Adicionar {selectedStudentIds.size} estudante{selectedStudentIds.size > 1 ? 's' : ''} à Turma {currentClassName}, sob responsabilidade do Formador {currentTeacherName}?”
                    </h4>
                    <p style={{ color: '#CBD5E1', fontSize: '0.825rem', margin: 0, lineHeight: 1.4 }}>
                      Por favor, reveja as informações abaixo antes de confirmar. O sistema gravará as associações no banco de dados e atualizará imediatamente o painel de cada estudante.
                    </p>
                  </div>
                </div>
              </div>

              {/* RESUMO DOS DADOS DA TURMA */}
              <div style={{
                background: 'rgba(0, 24, 48, 0.7)',
                borderRadius: '6px',
                padding: '1rem',
                border: '1px solid rgba(0, 163, 224, 0.2)',
                marginBottom: '1rem',
                fontSize: '0.825rem'
              }}>
                <div style={{ fontWeight: '700', color: '#00C7FD', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={14} /> Resumo dos Detalhes da Turma:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Turma:</span>
                    <div style={{ color: '#FFFFFF', fontWeight: '600' }}>{currentClassName}</div>
                  </div>
                  {selectedClass?.code && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Código:</span>
                      <div style={{ color: '#00C7FD', fontWeight: '700', fontFamily: 'monospace' }}>{selectedClass.code}</div>
                    </div>
                  )}
                  <div>
                    <span style={{ color: '#94A3B8' }}>Formador:</span>
                    <div style={{ color: '#34D399', fontWeight: '600' }}>{currentTeacherName}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Horário:</span>
                    <div style={{ color: '#FFFFFF' }}>{selectedClass?.schedule}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Sala:</span>
                    <div style={{ color: '#FFFFFF' }}>{selectedClass?.room || 'Sala 1 - Laboratório TI'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Início das Aulas:</span>
                    <div style={{ color: '#FFFFFF' }}>{selectedClass?.start_date || 'A anunciar'}</div>
                  </div>
                </div>
              </div>

              {/* LISTA DOS ESTUDANTES QUE SERÃO ADICIONADOS */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} color="#00C7FD" />
                    Estudantes a Adicionar ({selectedStudentsList.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ fontSize: '0.75rem', color: '#00C7FD', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Alterar lista
                  </button>
                </div>

                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: 'rgba(0, 24, 48, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 163, 224, 0.2)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem'
                }}>
                  {selectedStudentsList.map(student => (
                    <div
                      key={student.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(0, 114, 206, 0.3)',
                        border: '1px solid rgba(0, 199, 253, 0.4)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.78rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <UserAvatar name={student.full_name} photoUrl={student.photo_url} size={20} />
                      <span>{student.full_name}</span>
                      <span style={{ color: '#00C7FD', fontSize: '0.7rem', fontFamily: 'monospace' }}>({student.student_code})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações do Passo 3 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(0, 163, 224, 0.2)'
              }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ChevronLeft size={16} />
                  <span>Voltar e Ajustar</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(90deg, #10B981 0%, #0072CE 100%)',
                    borderColor: '#10B981',
                    fontWeight: '700',
                    padding: '0.65rem 1.25rem'
                  }}
                >
                  {submitting ? (
                    <span>A guardar associações...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirmar e Guardar Associações</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { getTeacherClassesWithStudents } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Mail,
  Phone,
  Award
} from 'lucide-react';

export default function TeacherClasses() {
  const { teacher, profile } = useAuth();
  const teacherId = teacher?.id || profile?.id;

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const data = await getTeacherClassesWithStudents(teacherId);
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0] || null;

  const filteredStudents = (selectedClass?.students || []).filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.student_code || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Minhas Turmas & Alunos
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Consulte as turmas atribuídas sob a sua responsabilidade e a lista de estudantes matriculados.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '380px' }}>
            <Link to="/formador/trabalhos" className="btn btn-secondary mobile-action-btn" style={{ flex: '1 1 140px', justifyContent: 'center' }}>
              <FileText size={15} />
              Criar Trabalho
            </Link>
            <Link to="/formador/chat" className="btn btn-primary mobile-action-btn" style={{ flex: '1 1 140px', justifyContent: 'center' }}>
              <MessageSquare size={15} />
              Abrir Chat Académico
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            A carregar as suas turmas...
          </div>
        ) : classes.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: '#00C7FD' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Nenhuma turma atribuída
            </h3>
            <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
              Ainda não possui turmas vinculadas ao seu perfil de formador. Caso lecione alguma disciplina, solicite a vinculação junto à secretaria académica.
            </p>
          </div>
        ) : (
          <div className="two-col-split">
            {/* Coluna Esquerda: Lista de Turmas */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(0, 163, 224, 0.15)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Calendar size={16} color="#00C7FD" />
                  Turmas Atribuídas
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  {classes.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classes.map(cls => {
                  const isSelected = cls.id === selectedClass?.id;
                  const count = cls.students?.length || 0;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 199, 253, 0.15)' : 'rgba(0, 30, 60, 0.35)',
                        border: isSelected ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: isSelected ? '#FFFFFF' : '#E2E8F0' }}>
                          {cls.name}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          {cls.status || 'Ativa'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#00C7FD', fontWeight: '500', marginBottom: '0.35rem' }}>
                        {cls.course?.title || 'Curso Vinculado'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span>{cls.schedule || 'Horário regular'}</span>
                        <span style={{ color: '#E2E8F0', fontWeight: '600' }}>
                          {count} {count === 1 ? 'aluno' : 'alunos'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita: Detalhes da Turma e Lista de Estudantes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedClass ? (
                <>
                  {/* Resumo da Turma Selecionada */}
                  <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', marginBottom: '0.25rem' }}>
                          {selectedClass.course?.title || 'Curso Profissional'}
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.4rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                          {selectedClass.name}
                        </h2>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          {selectedClass.students?.length || 0} Estudantes
                        </span>
                        <Link
                          to="/formador/notas"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Award size={14} /> Lançar / Ver Notas
                        </Link>
                      </div>
                    </div>

                    <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 163, 224, 0.15)' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        <div style={{ color: '#64748B', fontSize: '0.7rem' }}>HORÁRIO DE AULAS</div>
                        <strong style={{ color: '#FFFFFF' }}>{selectedClass.schedule || 'A definir'}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        <div style={{ color: '#64748B', fontSize: '0.7rem' }}>SALA / LABORATÓRIO</div>
                        <strong style={{ color: '#FFFFFF' }}>{selectedClass.room || 'Laboratório TI'}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        <div style={{ color: '#64748B', fontSize: '0.7rem' }}>PERÍODO LECTIVO</div>
                        <strong style={{ color: '#FFFFFF' }}>
                          {selectedClass.start_date ? formatDate(selectedClass.start_date) : 'Início'} — {selectedClass.end_date ? formatDate(selectedClass.end_date) : 'Fim'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Tabela / Cards de Estudantes */}
                  <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.1rem)', fontWeight: '700', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="#00C7FD" />
                        Estudantes da Turma
                      </h3>

                      <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="Filtrar por nome ou código..."
                          className="form-input"
                          style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 32px', width: '100%' }}
                        />
                      </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                        {searchTerm ? 'Nenhum estudante encontrado para a pesquisa.' : 'Nenhum estudante matriculado nesta turma ainda.'}
                      </div>
                    ) : (
                      <>
                        {/* Versão Desktop: Tabela */}
                        <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(0, 163, 224, 0.2)', fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Estudante</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Contacto</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Data Matrícula</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStudents.map(st => (
                                <tr 
                                  key={st.id || st.student_code}
                                  style={{
                                    borderBottom: '1px solid rgba(0, 163, 224, 0.1)',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <UserAvatar 
                                        photoUrl={st.photo_url} 
                                        name={st.full_name || 'Estudante'} 
                                        size={36} 
                                        role="estudante" 
                                      />
                                      <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.885rem', color: '#FFFFFF' }}>
                                          {st.full_name}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                          {st.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD', fontSize: '0.825rem' }}>
                                    {st.student_code || '—'}
                                  </td>

                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#E2E8F0' }}>
                                    {st.phone || '—'}
                                  </td>

                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                                    {st.enrolled_at ? formatDate(st.enrolled_at) : '—'}
                                  </td>

                                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                    <Link
                                      to="/formador/chat"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                      title="Conversar com o estudante"
                                    >
                                      <MessageSquare size={13} />
                                      Mensagem
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Versão Mobile: Cards Estruturados */}
                        <div className="mobile-only-cards">
                          {filteredStudents.map(st => (
                            <div key={st.id || st.student_code} className="mobile-entity-card">
                              <div className="mobile-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <UserAvatar 
                                    photoUrl={st.photo_url} 
                                    name={st.full_name || 'Estudante'} 
                                    size={40} 
                                    role="estudante" 
                                  />
                                  <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.925rem', color: '#FFFFFF' }}>
                                      {st.full_name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                      {st.email}
                                    </div>
                                  </div>
                                </div>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD', fontSize: '0.78rem', background: 'rgba(0, 199, 253, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(0, 199, 253, 0.25)' }}>
                                  {st.student_code || '—'}
                                </span>
                              </div>

                              <div className="mobile-card-meta">
                                <div>
                                  <span className="meta-label">Contacto Telefónico</span>
                                  <span className="meta-value">
                                    {st.phone || 'Não informado'}
                                  </span>
                                </div>
                                <div>
                                  <span className="meta-label">Data de Matrícula</span>
                                  <span className="meta-value">
                                    {st.enrolled_at ? formatDate(st.enrolled_at) : '—'}
                                  </span>
                                </div>
                              </div>

                              <div className="mobile-card-actions">
                                <Link
                                  to="/formador/chat"
                                  className="btn btn-secondary mobile-action-btn"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <MessageSquare size={14} />
                                  Conversar no Chat
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

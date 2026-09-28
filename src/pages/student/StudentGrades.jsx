import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import { getStudentGradesReport } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  BookOpen, 
  RotateCcw, 
  User, 
  Clock, 
  GraduationCap, 
  Wrench, 
  HelpCircle, 
  FileText, 
  FileCheck 
} from 'lucide-react';

export default function StudentGrades() {
  const { student, profile } = useAuth();
  const studentId = student?.id || profile?.id;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);

  useEffect(() => {
    async function loadGrades() {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getStudentGradesReport(studentId);
        setReports(data || []);
      } catch (err) {
        console.error('Erro ao carregar notas do estudante:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, [studentId]);

  const activeReport = reports[selectedReportIndex] || null;
  const isReportCompleted = activeReport?.finalStatus === 'APROVADO' || 
    activeReport?.enrollment_status === 'concluido' ||
    student?.enrollments?.some(e => e.id === activeReport?.enrollment_id && e.status === 'concluido');

  const getEvalBadge = (type, isRecovery) => {
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
            <FileText size={12} /> Avaliação Contínua
          </span>
        );
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            Meu Boletim de Notas & Avaliações
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginTop: '0.25rem' }}>
            Acompanhe o seu desempenho académico oficial, notas de testes, exames e estado final de aprovação.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>
            A carregar o seu boletim de notas...
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
            <BookOpen size={48} color="#00C7FD" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Nenhuma pauta ou nota disponível no momento.
            </h3>
            <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.885rem' }}>
              Assim que o seu formador responsável cadastrar e confirmar as notas de testes ou exames da sua turma, elas serão apresentadas aqui em tempo real.
            </p>
          </div>
        ) : (
          <div>
            {/* Seletor de Cursos / Turmas caso esteja matriculado em mais de um */}
            {reports.length > 1 && (
              <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.35rem' }}>
                {reports.map((rep, idx) => (
                  <button
                    key={rep.enrollment_id}
                    onClick={() => setSelectedReportIndex(idx)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '6px',
                      border: idx === selectedReportIndex ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.25)',
                      background: idx === selectedReportIndex ? 'rgba(0, 199, 253, 0.15)' : 'rgba(0, 24, 48, 0.6)',
                      color: idx === selectedReportIndex ? '#FFFFFF' : '#94A3B8',
                      fontWeight: idx === selectedReportIndex ? '700' : '500',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {rep.course?.title || 'Curso'} ({rep.class?.name || 'Turma'})
                  </button>
                ))}
              </div>
            )}

            {activeReport && (
              <>
                {/* BANNER OFICIAL DE CONCLUSÃO & CERTIFICADO */}
                {isReportCompleted && (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Aprovação Concluída
                          </span>
                          {activeReport?.finalAverage !== null && (
                            <span style={{ fontSize: '0.74rem', color: '#6EE7B7' }}>
                              • Média Oficial: {activeReport.finalAverage}/20
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

                {/* CARTÃO DE RESUMO ACADÉMICO / MÉDIA FINAL */}
                <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.6rem)', marginBottom: '1.5rem', border: '1px solid rgba(0, 199, 253, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', marginBottom: '0.25rem' }}>
                        {activeReport.course?.title || 'Formação Profissional'}
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.45rem)', fontWeight: '850', color: '#FFFFFF', margin: 0 }}>
                        {activeReport.class?.name || 'Turma'}
                      </h2>
                      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.65rem', fontSize: '0.825rem', color: '#94A3B8' }}>
                        <span>Horário: <strong style={{ color: '#E2E8F0' }}>{activeReport.class?.schedule || 'Regular'}</strong></span>
                        {activeReport.class?.teacher && (
                          <span>Formador: <strong style={{ color: '#00C7FD' }}>{activeReport.class.teacher.name || activeReport.class.teacher.full_name}</strong></span>
                        )}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: 'rgba(0, 24, 48, 0.75)',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 163, 224, 0.3)'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Avaliações Concluídas:</span>
                          <strong style={{ fontSize: '1.45rem', fontWeight: '900', color: '#00C7FD', lineHeight: 1 }}>
                            {activeReport.totalCompleted}
                          </strong>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#64748B' }}>/</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#E2E8F0', lineHeight: 1 }}>
                            {activeReport.evaluations.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco de Média e Aprovação */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      background: 'rgba(0, 20, 44, 0.75)',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 163, 224, 0.3)'
                    }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                          Média Geral
                        </span>
                        <strong style={{
                          fontSize: '1.75rem',
                          fontWeight: '900',
                          color: activeReport.finalAverage !== null ? (activeReport.finalAverage >= 10.0 ? '#34D399' : '#F87171') : '#94A3B8'
                        }}>
                          {activeReport.finalAverage !== null ? activeReport.finalAverage : '—'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}> / 20</span>
                      </div>

                      <div style={{ borderLeft: '1px solid rgba(0, 163, 224, 0.25)', paddingLeft: '1.25rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                          Classificação
                        </span>
                        {activeReport.finalStatus === 'APROVADO' ? (
                          <span className="badge badge-success" style={{ fontWeight: '800', fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                            ✓ APROVADO
                          </span>
                        ) : activeReport.finalStatus === 'REPROVADO' ? (
                          <span className="badge badge-danger" style={{ fontWeight: '800', fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                            ✕ REPROVADO
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.25)', color: '#00C7FD', fontWeight: '700', fontSize: '0.825rem' }}>
                            EM CURSO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABELA DE AVALIAÇÕES INDIVIDUAIS */}
                <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                        Discriminação das Provas & Avaliações
                      </h3>
                      <p style={{ color: '#94A3B8', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                        Notas obtidas em testes teóricos, testes práticos, exames e eventuais testes de recuperação.
                      </p>
                    </div>

                    {activeReport.evaluations.length > 0 && (
                      <div style={{
                        background: 'rgba(0, 199, 253, 0.12)',
                        border: '1px solid rgba(0, 199, 253, 0.35)',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Etapas Registadas:</span>
                        <strong style={{ fontSize: '1.4rem', fontWeight: '900', color: '#00C7FD', lineHeight: 1 }}>
                          {activeReport.evaluations.length}
                        </strong>
                      </div>
                    )}
                  </div>

                  {activeReport.evaluations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                      Nenhuma avaliação registada nesta turma até ao momento.
                    </div>
                  ) : (
                    <>
                      {/* Versão Desktop: Tabela */}
                      <div className="desktop-only-table table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Avaliação</th>
                              <th>Tipo de Prova</th>
                              <th>Data</th>
                              <th style={{ textAlign: 'center' }}>Peso</th>
                              <th style={{ textAlign: 'center' }}>Nota Obtida</th>
                              <th style={{ textAlign: 'center' }}>Resultado</th>
                              <th>Observações do Formador</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeReport.evaluations.map(ev => {
                              const hasScore = ev.score !== null;
                              return (
                                <tr key={ev.evaluation_id}>
                                  <td>
                                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block' }}>
                                      {ev.title}
                                    </strong>
                                    {ev.recoveryGrade && (
                                      <div style={{ fontSize: '0.72rem', color: '#FBBF24', marginTop: '0.2rem' }}>
                                        Nota de Recuperação: <strong>{ev.recoveryGrade.score}/20</strong> em {ev.recoveryGrade.date}
                                      </div>
                                    )}
                                  </td>

                                  <td>{getEvalBadge(ev.type, ev.is_recovery)}</td>

                                  <td style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                                    {formatDate(ev.date)}
                                  </td>

                                  <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#CBD5E1' }}>
                                    {ev.weight}
                                  </td>

                                  <td style={{ textAlign: 'center' }}>
                                    {hasScore ? (
                                      <div>
                                        <strong style={{
                                          fontSize: '1.25rem',
                                          fontWeight: '900',
                                          color: ev.effectiveScore >= 10 ? '#34D399' : '#F87171',
                                          lineHeight: 1
                                        }}>
                                          {ev.effectiveScore}
                                        </strong>
                                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}> / {ev.max_score || 20}</span>
                                        {ev.recoveryGrade && (
                                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                                            Original: {ev.score}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span style={{ color: '#64748B', fontSize: '0.78rem' }}>Pendente</span>
                                    )}
                                  </td>

                                  <td style={{ textAlign: 'center' }}>
                                    {hasScore ? (
                                      <span className={`badge ${ev.is_passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                                        {ev.is_passed ? 'Aprovado' : 'Insuficiente'}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>A aguardar</span>
                                    )}
                                  </td>

                                  <td>
                                    <span style={{ fontSize: '0.825rem', color: ev.observations ? '#CBD5E1' : '#64748B', fontStyle: ev.observations ? 'normal' : 'italic' }}>
                                      {ev.observations || 'Sem observações'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Versão Mobile: Cards Estruturados */}
                      <div className="mobile-only-cards">
                        {activeReport.evaluations.map(ev => {
                          const hasScore = ev.score !== null;
                          return (
                            <div key={ev.evaluation_id} className="mobile-entity-card">
                              <div className="mobile-card-header">
                                <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                                  {ev.title}
                                </strong>
                                {getEvalBadge(ev.type, ev.is_recovery)}
                              </div>

                              <div className="mobile-card-meta">
                                <div>
                                  <span className="meta-label">Nota Obtida</span>
                                  <span className="meta-value" style={{ color: hasScore ? (ev.effectiveScore >= 10 ? '#34D399' : '#F87171') : '#94A3B8', fontWeight: '900', fontSize: '1.25rem' }}>
                                    {hasScore ? `${ev.effectiveScore}` : 'Pendente'}
                                    {hasScore && <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8' }}> / {ev.max_score || 20} Val.</span>}
                                  </span>
                                </div>
                                <div>
                                  <span className="meta-label">Resultado</span>
                                  <span className="meta-value">
                                    {hasScore ? (
                                      <span className={`badge ${ev.is_passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                        {ev.is_passed ? 'Aprovado' : 'Insuficiente'}
                                      </span>
                                    ) : 'A aguardar'}
                                  </span>
                                </div>
                                <div>
                                  <span className="meta-label">Data da Prova</span>
                                  <span className="meta-value">{formatDate(ev.date)}</span>
                                </div>
                                <div>
                                  <span className="meta-label">Peso na Média</span>
                                  <span className="meta-value">{ev.weight}</span>
                                </div>
                              </div>

                              {ev.recoveryGrade && (
                                <div style={{
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  borderRadius: '6px',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.78rem',
                                  color: '#FBBF24'
                                }}>
                                  🔄 <strong>Teste de Recuperação Realizado:</strong> {ev.recoveryGrade.score}/20 Valores (Nota original: {ev.score}/20).
                                </div>
                              )}

                              {ev.observations && (
                                <div style={{ fontSize: '0.8rem', color: '#BAE6FD', background: 'rgba(0, 24, 48, 0.5)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                                  💬 <strong>Feedback do Formador:</strong> {ev.observations}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

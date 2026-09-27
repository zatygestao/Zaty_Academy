import React, { useRef, useState } from 'react';
import Modal from '../common/Modal';
import { generatePautaPdf } from '../../services/pautaPdfService';
import { printPdfDoc } from '../../services/pdfService';
import { useSettings } from '../../context/SettingsContext';
import { formatDateTime } from '../../utils/formatters';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award,
  Building2,
  Users
} from 'lucide-react';

export default function PautaPrintModal({
  isOpen,
  onClose,
  classInfo,
  course,
  evaluations = [],
  studentsRows = [],
  academicYear = '2026'
}) {
  const { settings } = useSettings();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const printContentRef = useRef(null);

  if (!isOpen) return null;

  const institutionName = settings?.institution?.name || 'ZATY ACADEMY';
  const tagline = settings?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia';
  const address = settings?.institution?.address || 'Namicopo – Nampula, Moçambique';
  const phone = settings?.institution?.phone || '+258 834 847 306';
  const email = settings?.institution?.email || 'contacto@zatyacademy.co.mz';
  const directorName = settings?.institution?.director_name || 'Direção Pedagógica Zaty Academy';

  const courseTitle = course?.title || classInfo?.course?.title || 'Formação Profissional em TI';
  const className = classInfo?.name || 'Turma';
  const classCode = classInfo?.code || 'TURMA';
  const schedule = classInfo?.schedule || 'Horário Regular';
  const teacherName = classInfo?.teacher?.name || classInfo?.teacher?.full_name || 'Corpo Docente Zaty Academy';

  // Cálculos estatísticos
  const totalStudents = studentsRows.length;
  const approvedCount = studentsRows.filter(r => r.finalStatus === 'APROVADO').length;
  const failedCount = studentsRows.filter(r => r.finalStatus === 'REPROVADO').length;
  const inProgressCount = studentsRows.filter(r => r.finalStatus !== 'APROVADO' && r.finalStatus !== 'REPROVADO').length;

  const validAverages = studentsRows
    .map(r => Number(r.finalAverage))
    .filter(val => !isNaN(val) && val !== null && val > 0);
  const classAverage = validAverages.length > 0 
    ? (validAverages.reduce((acc, v) => acc + v, 0) / validAverages.length).toFixed(1)
    : '—';
  const approvalRate = totalStudents > 0 
    ? `${((approvedCount / totalStudents) * 100).toFixed(0)}%` 
    : '0%';

  // Gerar e Descarregar PDF
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const doc = await generatePautaPdf({
        classInfo,
        course,
        evaluations,
        studentsRows,
        academicYear,
        settings
      });
      const fileName = `Pauta_Oficial_${classCode.replace(/\s+/g, '_')}_${academicYear}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Erro ao gerar PDF da pauta:', err);
      alert('Falha ao exportar a pauta em PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Disparar Impressão Direta em Paisagem
  const handlePrint = async () => {
    setPrinting(true);
    try {
      const doc = await generatePautaPdf({
        classInfo,
        course,
        evaluations,
        studentsRows,
        academicYear,
        settings
      });
      printPdfDoc(doc);
    } catch (err) {
      console.error('Erro ao acionar impressão da pauta:', err);
      // Fallback para impressão direta da janela
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pauta Oficial de Notas — ${className} (${classCode})`}
      maxWidth="1100px"
    >
      <div>
        {/* Barra de Ações Superiores */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Turma: <strong style={{ color: '#00C7FD' }}>{className}</strong> | Curso: <strong style={{ color: '#FFFFFF' }}>{courseTitle}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
              Formato padronizado para arquivo institucional A4 Paisagem (Landscape).
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Printer size={15} />
              {printing ? 'A imprimir...' : 'Imprimir Pauta (A4 Paisagem)'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Download size={15} />
              {downloading ? 'A exportar...' : 'Baixar Pauta em PDF'}
            </button>
          </div>
        </div>

        {/* ÁREA DE PRÉ-VISUALIZAÇÃO DA PAUTA (ESTILO DOCUMENTO FÍSICO) */}
        <div 
          ref={printContentRef}
          className="pauta-official-document-view"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            padding: '1.5rem',
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflowX: 'auto',
            fontFamily: "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif"
          }}
        >
          {/* 1. CABEÇALHO INSTITUCIONAL */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #004D80',
            paddingBottom: '0.85rem',
            marginBottom: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img 
                src="/logo.png" 
                alt="Logo Zaty Academy" 
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#002B49', margin: 0, letterSpacing: '0.02em' }}>
                  {institutionName}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#0072B5', fontWeight: '700', textTransform: 'uppercase' }}>
                  {tagline}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.1rem' }}>
                  {address} | Tel: {phone} | {email}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A' }}>
                PAUTA OFICIAL DE AVALIAÇÃO ACADÉMICA
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0072B5', fontWeight: '700', marginTop: '0.15rem' }}>
                Ano Formativo: {academicYear}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                Emitido em: {formatDateTime(new Date())}
              </div>
            </div>
          </div>

          {/* 2. METADADOS DA TURMA */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.6rem',
            fontSize: '0.78rem'
          }}>
            <div>
              <span style={{ color: '#64748B' }}>Curso: </span>
              <strong style={{ color: '#0F172A' }}>{courseTitle}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Turma: </span>
              <strong style={{ color: '#0F172A' }}>{className} ({classCode})</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Horário: </span>
              <strong style={{ color: '#0F172A' }}>{schedule}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Formador: </span>
              <strong style={{ color: '#0072B5' }}>{teacherName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Estudantes: </span>
              <strong style={{ color: '#0F172A' }}>{totalStudents} inscritos</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Avaliações: </span>
              <strong style={{ color: '#0F172A' }}>{evaluations.length} instrumentos</strong>
            </div>
          </div>

          {/* 3. TABELA DE NOTAS */}
          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.78rem',
              color: '#0F172A'
            }}>
              <thead>
                <tr style={{ background: '#003C73', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.45rem 0.35rem', textAlign: 'center', width: '30px', border: '1px solid #002B49' }}>Nº</th>
                  <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', width: '90px', border: '1px solid #002B49' }}>Código</th>
                  <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left', minWidth: '180px', border: '1px solid #002B49' }}>Nome do Estudante</th>
                  {evaluations.map(ev => (
                    <th key={ev.id} style={{ padding: '0.35rem 0.4rem', textAlign: 'center', minWidth: '75px', border: '1px solid #002B49' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: '800' }}>{ev.title}</div>
                      <div style={{ fontSize: '0.62rem', color: '#BAE6FD', fontWeight: '600' }}>
                        ({ev.is_recovery ? 'REC' : (ev.evaluation_type === 'trabalho_casa' ? 'TPC' : 'TESTE')} P:{ev.weight || 1})
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', width: '70px', border: '1px solid #002B49' }}>Média (0-20)</th>
                  <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', width: '95px', border: '1px solid #002B49' }}>Resultado</th>
                  <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', width: '95px', border: '1px solid #002B49' }}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {studentsRows.length === 0 ? (
                  <tr>
                    <td colSpan={6 + evaluations.length} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                      Nenhum registo de notas disponível para esta turma.
                    </td>
                  </tr>
                ) : (
                  studentsRows.map((row, idx) => {
                    const avg = row.finalAverage;
                    const isPassed = row.finalStatus === 'APROVADO';
                    const isFailed = row.finalStatus === 'REPROVADO';
                    const isEven = idx % 2 === 0;

                    let obs = 'Regular';
                    if (avg >= 16.0) obs = 'Excelente';
                    else if (avg >= 14.0) obs = 'Bom';
                    else if (isFailed) obs = 'Recuperação';
                    else if (row.finalStatus === 'EM_CURSO') obs = 'Em Curso';

                    return (
                      <tr key={row.student.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center', border: '1px solid #E2E8F0', fontWeight: '600' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: '700' }}>
                          {row.student.student_code || '—'}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #E2E8F0', fontWeight: '700' }}>
                          {row.student.full_name}
                        </td>
                        {evaluations.map(ev => {
                          const g = (row.grades || []).find(item => item.evaluation_id === ev.id);
                          const score = g?.effectiveScore ?? g?.score;
                          const hasScore = score !== null && score !== undefined && !isNaN(score);
                          const val = hasScore ? Number(score) : null;
                          return (
                            <td key={ev.id} style={{
                              padding: '0.4rem 0.35rem',
                              textAlign: 'center',
                              border: '1px solid #E2E8F0',
                              fontWeight: val !== null && val < 10 ? '800' : '600',
                              color: val !== null ? (val >= 10 ? '#0F172A' : '#DC2626') : '#94A3B8'
                            }}>
                              {val !== null ? val.toFixed(1) : '—'}
                            </td>
                          );
                        })}
                        <td style={{
                          padding: '0.4rem 0.45rem',
                          textAlign: 'center',
                          border: '1px solid #E2E8F0',
                          fontWeight: '800',
                          color: avg !== null ? (avg >= 10.0 ? '#059669' : '#DC2626') : '#64748B'
                        }}>
                          {avg !== null ? Number(avg).toFixed(1) : 'Pendente'}
                        </td>
                        <td style={{
                          padding: '0.4rem 0.45rem',
                          textAlign: 'center',
                          border: '1px solid #E2E8F0',
                          fontWeight: '800',
                          fontSize: '0.7rem',
                          color: isPassed ? '#059669' : (isFailed ? '#DC2626' : '#D97706')
                        }}>
                          {isPassed ? '✓ APROVADO' : (isFailed ? '✕ REPROVADO' : 'EM CURSO')}
                        </td>
                        <td style={{
                          padding: '0.4rem 0.45rem',
                          textAlign: 'center',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.72rem',
                          color: '#475569'
                        }}>
                          {obs}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. QUADRO ESTATÍSTICO RESUMIDO */}
          <div style={{
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '0.55rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.75rem'
          }}>
            <div><strong>Total de Estudantes:</strong> {totalStudents}</div>
            <div style={{ color: '#059669', fontWeight: '800' }}>✓ Aprovados: {approvedCount}</div>
            <div style={{ color: '#DC2626', fontWeight: '800' }}>✕ Reprovados: {failedCount}</div>
            <div style={{ color: '#D97706', fontWeight: '700' }}>Em Curso: {inProgressCount}</div>
            <div style={{ color: '#0072B5', fontWeight: '800' }}>Taxa de Aproveitamento: {approvalRate}</div>
            <div><strong>Média da Turma:</strong> {classAverage} Val.</div>
          </div>

          {/* 5. ASSINATURAS E VALIDAÇÃO OFICIAL */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            marginTop: '0.5rem',
            fontSize: '0.75rem'
          }}>
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ borderBottom: '1px solid #64748B', width: '180px', margin: '0 auto 0.35rem auto' }}></div>
              <div style={{ fontWeight: '800', color: '#0F172A' }}>O Formador / Docente Responsável</div>
              <div style={{ color: '#64748B', fontSize: '0.68rem' }}>{teacherName}</div>
            </div>

            <div style={{
              border: '1.5px solid #0072B5',
              borderRadius: '4px',
              padding: '0.35rem 0.85rem',
              textAlign: 'center',
              color: '#0072B5',
              fontSize: '0.65rem',
              fontWeight: '800',
              textTransform: 'uppercase'
            }}>
              <div>SELO & CARIMBO INSTITUCIONAL</div>
              <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 'normal', marginTop: '0.15rem' }}>Zaty Academy — Secretaria Académica</div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ borderBottom: '1px solid #64748B', width: '180px', margin: '0 auto 0.35rem auto' }}></div>
              <div style={{ fontWeight: '800', color: '#0F172A' }}>A Direção Pedagógica</div>
              <div style={{ color: '#64748B', fontSize: '0.68rem' }}>{directorName}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

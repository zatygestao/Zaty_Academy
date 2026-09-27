import jsPDFDefault, { jsPDF as jsPDFNamed } from 'jspdf';
const jsPDF = jsPDFNamed || jsPDFDefault;
import { formatDateTime } from '../utils/formatters.js';
import { getDocumentLogoData } from './pdfService.js';

/**
 * Gera a Pauta Oficial de Avaliação Académica da Zaty Academy em formato PDF A4 Paisagem (Landscape).
 * Documento formal pronto para arquivamento institucional, impressão em alta resolução e assinatura.
 */
export async function generatePautaPdf({
  classInfo,
  course,
  evaluations = [],
  studentsRows = [],
  academicYear = '2026',
  settings = null
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // 297mm x 210mm
  });

  const institutionName = settings?.institution?.name || 'ZATY ACADEMY';
  const tagline = settings?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia';
  const address = settings?.institution?.address || 'Namicopo – Nampula, Moçambique';
  const phone = settings?.institution?.phone || '+258 834 847 306';
  const email = settings?.institution?.email || 'contacto@zatyacademy.co.mz';
  const directorName = settings?.institution?.director_name || 'Direção Pedagógica Zaty Academy';

  // Obter logotipo oficial
  let logoData = null;
  try {
    logoData = await getDocumentLogoData(settings);
  } catch (_) {}

  // Dimensões da página A4 Landscape
  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 269mm

  // Cores institucionais sóbrias para arquivo oficial
  const primaryColor = [0, 60, 115]; // Azul institucional escuro
  const darkColor = [15, 23, 42];     // Preto/Slate escuro
  const grayColor = [71, 85, 105];    // Slate médio
  const lightGray = [241, 245, 249];  // Fundo suave de cabeçalho
  const borderColor = [203, 213, 225];

  // 1. Barra superior decorativa
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Cabeçalho Institucional
  let textStartX = marginX;
  if (logoData && logoData.dataUrl) {
    const logoW = 16;
    const logoH = 16;
    try {
      doc.addImage(logoData.dataUrl, 'PNG', marginX, 8, logoW, logoH);
      textStartX = marginX + logoW + 4;
    } catch (_) {}
  }

  // Nome da Instituição e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(institutionName, textStartX, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(tagline, textStartX, 17.5);
  doc.setFontSize(7.2);
  doc.text(`${address} | Contacto: ${phone} | ${email}`, textStartX, 21.5);

  // Lado direito do cabeçalho: Título oficial e data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('PAUTA OFICIAL DE AVALIAÇÃO ACADÉMICA', pageWidth - marginX, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(`Ano Formativo: ${academicYear} | Emitido em: ${formatDateTime(new Date())}`, pageWidth - marginX, 17, { align: 'right' });
  doc.text('Documento Original — Registo Oficial da Secretaria Académica', pageWidth - marginX, 21.5, { align: 'right' });

  // Linha separadora do cabeçalho
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6);
  doc.line(marginX, 25, pageWidth - marginX, 25);

  // 3. Bloco de Metadados da Turma e Disciplina
  doc.setFillColor(...lightGray);
  doc.rect(marginX, 27, contentWidth, 14, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.rect(marginX, 27, contentWidth, 14, 'D');

  const courseTitle = course?.title || classInfo?.course?.title || 'Formação Profissional em TI';
  const className = classInfo?.name || 'Turma Única';
  const classCode = classInfo?.code || 'TURMA-2026';
  const schedule = classInfo?.schedule || 'Horário Regular';
  const teacherName = classInfo?.teacher?.name || classInfo?.teacher?.full_name || 'Corpo Docente Zaty Academy';

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);

  // Linha 1 de Metadados
  doc.text('CURSO:', marginX + 3, 31.5);
  doc.setFont('helvetica', 'normal');
  doc.text(courseTitle, marginX + 17, 31.5);

  doc.setFont('helvetica', 'bold');
  doc.text('TURMA:', marginX + 120, 31.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${className} (${classCode})`, marginX + 135, 31.5);

  doc.setFont('helvetica', 'bold');
  doc.text('HORÁRIO:', marginX + 205, 31.5);
  doc.setFont('helvetica', 'normal');
  doc.text(schedule, marginX + 221, 31.5);

  // Linha 2 de Metadados
  doc.setFont('helvetica', 'bold');
  doc.text('FORMADOR:', marginX + 3, 37.5);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherName, marginX + 24, 37.5);

  doc.setFont('helvetica', 'bold');
  doc.text('ESTUDANTES:', marginX + 120, 37.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${studentsRows.length} matriculados`, marginX + 144, 37.5);

  doc.setFont('helvetica', 'bold');
  doc.text('AVALIAÇÕES:', marginX + 205, 37.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${evaluations.length} instrumentos aplicados`, marginX + 228, 37.5);

  // 4. Desenho da Tabela de Classificações
  // Calcular larguras das colunas
  const colOrderW = 8;
  const colCodeW = 24;
  const colNameW = 62;
  const colAverageW = 19;
  const colStatusW = 24;
  const colObsW = 26;

  const fixedColsWidth = colOrderW + colCodeW + colNameW + colAverageW + colStatusW + colObsW; // 163mm
  const remainingForEvals = contentWidth - fixedColsWidth; // 106mm

  const evalCount = Math.max(evaluations.length, 1);
  const colEvalW = Math.min(Math.max(remainingForEvals / evalCount, 14), 28);

  const startY = 44;
  const rowHeight = 6.2;
  const headerHeight = 9.5;

  // Cabeçalho da Tabela
  doc.setFillColor(...primaryColor);
  doc.rect(marginX, startY, contentWidth, headerHeight, 'F');
  doc.setDrawColor(...primaryColor);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let curX = marginX;

  // Nº
  doc.text('Nº', curX + (colOrderW / 2), startY + 5.8, { align: 'center' });
  curX += colOrderW;

  // Código
  doc.text('CÓDIGO', curX + (colCodeW / 2), startY + 5.8, { align: 'center' });
  curX += colCodeW;

  // Nome Completo
  doc.text('NOME DO ESTUDANTE', curX + 2, startY + 5.8);
  curX += colNameW;

  // Colunas de Avaliações
  evaluations.forEach((ev) => {
    // Título truncado se for longo
    let title = ev.title || 'Avaliação';
    if (title.length > 13) title = title.substring(0, 11) + '..';
    const typeLabel = ev.is_recovery ? 'REC' : (ev.evaluation_type === 'trabalho_casa' ? 'TPC' : 'TESTE');
    
    doc.setFontSize(6.5);
    doc.text(title, curX + (colEvalW / 2), startY + 4.2, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(186, 230, 253); // Azul claro
    doc.text(`(${typeLabel} P:${ev.weight || 1})`, curX + (colEvalW / 2), startY + 7.8, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    curX += colEvalW;
  });

  // Média Final
  doc.setFontSize(7);
  doc.text('MÉDIA', curX + (colAverageW / 2), startY + 4.2, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setTextColor(186, 230, 253);
  doc.text('(0-20)', curX + (colAverageW / 2), startY + 7.8, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  curX += colAverageW;

  // Resultado
  doc.setFontSize(7);
  doc.text('RESULTADO', curX + (colStatusW / 2), startY + 5.8, { align: 'center' });
  curX += colStatusW;

  // Observações
  doc.text('OBSERVAÇÕES', curX + (colObsW / 2), startY + 5.8, { align: 'center' });

  // 5. Linhas dos Alunos
  let currentY = startY + headerHeight;
  let approvedCount = 0;
  let failedCount = 0;
  let inProgressCount = 0;
  let sumAverages = 0;
  let countedAverages = 0;

  studentsRows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    
    // Fundo zebrado suave
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');

    // Linha de contorno inferior suave
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.15);
    doc.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    let cellX = marginX;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...darkColor);

    // Nº de ordem
    doc.text(String(idx + 1).padStart(2, '0'), cellX + (colOrderW / 2), currentY + 4.2, { align: 'center' });
    cellX += colOrderW;

    // Código
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.text(row.student.student_code || '—', cellX + (colCodeW / 2), currentY + 4.2, { align: 'center' });
    cellX += colCodeW;

    // Nome
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    let name = row.student.full_name || 'Estudante';
    if (name.length > 34) name = name.substring(0, 32) + '...';
    doc.text(name, cellX + 2, currentY + 4.2);
    cellX += colNameW;

    // Notas de cada avaliação
    evaluations.forEach(ev => {
      const g = (row.grades || []).find(item => item.evaluation_id === ev.id);
      const score = g?.effectiveScore ?? g?.score;

      if (score !== null && score !== undefined && !isNaN(score)) {
        const val = Number(score);
        doc.setFont('helvetica', val >= 10 ? 'normal' : 'bold');
        if (val < 10) {
          doc.setTextColor(220, 38, 38); // Vermelho
        } else {
          doc.setTextColor(...darkColor);
        }
        doc.text(val.toFixed(1), cellX + (colEvalW / 2), currentY + 4.2, { align: 'center' });
      } else {
        doc.setTextColor(...grayColor);
        doc.text('—', cellX + (colEvalW / 2), currentY + 4.2, { align: 'center' });
      }
      cellX += colEvalW;
    });

    // Média Final
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (row.finalAverage !== null && row.finalAverage !== undefined && !isNaN(row.finalAverage)) {
      const avg = Number(row.finalAverage);
      sumAverages += avg;
      countedAverages++;

      if (avg >= 10.0) {
        doc.setTextColor(16, 120, 60); // Verde aprovado
      } else {
        doc.setTextColor(220, 38, 38); // Vermelho reprovado
      }
      doc.text(avg.toFixed(1), cellX + (colAverageW / 2), currentY + 4.2, { align: 'center' });
    } else {
      doc.setTextColor(...grayColor);
      doc.text('Pendente', cellX + (colAverageW / 2), currentY + 4.2, { align: 'center' });
    }
    cellX += colAverageW;

    // Resultado
    doc.setFontSize(6.8);
    if (row.finalStatus === 'APROVADO') {
      approvedCount++;
      doc.setTextColor(16, 120, 60);
      doc.text('APROVADO', cellX + (colStatusW / 2), currentY + 4.2, { align: 'center' });
    } else if (row.finalStatus === 'REPROVADO') {
      failedCount++;
      doc.setTextColor(220, 38, 38);
      doc.text('REPROVADO', cellX + (colStatusW / 2), currentY + 4.2, { align: 'center' });
    } else {
      inProgressCount++;
      doc.setTextColor(180, 100, 0); // Amarelo/âmbar
      doc.text('EM CURSO', cellX + (colStatusW / 2), currentY + 4.2, { align: 'center' });
    }
    cellX += colStatusW;

    // Observações
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...grayColor);
    let obs = 'Regular';
    if (row.finalAverage >= 16.0) obs = 'Excelente';
    else if (row.finalAverage >= 14.0) obs = 'Bom';
    else if (row.finalStatus === 'REPROVADO') obs = 'Recuperação';
    else if (row.finalStatus === 'EM_CURSO') obs = 'Em Avaliação';
    doc.text(obs, cellX + (colObsW / 2), currentY + 4.2, { align: 'center' });

    currentY += rowHeight;

    // Se ultrapassar o limite da página, cria nova página com cabeçalho
    if (currentY > pageHeight - 45 && idx < studentsRows.length - 1) {
      doc.addPage('a4', 'landscape');
      // Repetir topo rápido
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 5, 'F');
      currentY = 15;
    }
  });

  // Linha final da tabela
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  // 6. Resumo Estatístico da Turma
  const summaryY = currentY + 3.5;
  const classAverage = countedAverages > 0 ? (sumAverages / countedAverages).toFixed(1) : '—';
  const approvalRate = studentsRows.length > 0 
    ? `${((approvedCount / studentsRows.length) * 100).toFixed(0)}%` 
    : '0%';

  doc.setFillColor(...lightGray);
  doc.rect(marginX, summaryY, contentWidth, 10, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.rect(marginX, summaryY, contentWidth, 10, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('RESUMO ESTATÍSTICO DA TURMA:', marginX + 3, summaryY + 6.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(`Total de Estudantes: ${studentsRows.length}`, marginX + 68, summaryY + 6.2);

  doc.setTextColor(16, 120, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`Aprovados: ${approvedCount}`, marginX + 115, summaryY + 6.2);

  doc.setTextColor(220, 38, 38);
  doc.text(`Reprovados: ${failedCount}`, marginX + 148, summaryY + 6.2);

  doc.setTextColor(180, 100, 0);
  doc.text(`Em Curso: ${inProgressCount}`, marginX + 182, summaryY + 6.2);

  doc.setTextColor(...primaryColor);
  doc.text(`Taxa de Aproveitamento: ${approvalRate}`, marginX + 215, summaryY + 6.2);
  doc.text(`Média da Turma: ${classAverage} Val.`, marginX + 258, summaryY + 6.2);

  // 7. Termo de Validação e Assinaturas Oficiais
  const signY = Math.min(summaryY + 16, pageHeight - 24);

  // Assinatura do Docente / Formador
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(marginX + 20, signY + 10, marginX + 90, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('O FORMADOR / DOCENTE RESPONSÁVEL', marginX + 55, signY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...grayColor);
  doc.text(teacherName, marginX + 55, signY + 17.5, { align: 'center' });

  // Carimbo Institucional ao Centro
  doc.setDrawColor(0, 102, 178);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX + 115, signY + 1, 40, 18, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(0, 102, 178);
  doc.text('SELO / CARIMBO OFICIAL', marginX + 135, signY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text('ZATY ACADEMY', marginX + 135, signY + 11, { align: 'center' });
  doc.text('DEPARTAMENTO ACADÉMICO', marginX + 135, signY + 14.5, { align: 'center' });

  // Assinatura da Direção Pedagógica
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(marginX + 180, signY + 10, marginX + 250, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('A DIREÇÃO PEDAGÓGICA', marginX + 215, signY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...grayColor);
  doc.text(directorName, marginX + 215, signY + 17.5, { align: 'center' });

  // Rodapé da Pauta
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Pauta oficial gerada pelo sistema de gestão académica Zaty Academy. Documento autêntico para arquivo escolar institucional.', pageWidth / 2, pageHeight - 1.5, { align: 'center' });

  return doc;
}

import jsPDFDefault, { jsPDF as jsPDFNamed } from 'jspdf';
const jsPDF = jsPDFNamed || jsPDFDefault;
import { generateQrCodeDataUrl } from './qrCodeService.js';
import { formatCurrency, formatDateLong, formatDateTime } from '../utils/formatters.js';
import { convertSvgToPngDataUrl } from '../utils/imageUtils.js';

/**
 * Converte com segurança qualquer URL de imagem (data URL, http, https, blob ou svg relativo)
 * para DataURL base64 com dimensões preservadas para uso no jsPDF
 */
async function loadImageDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Caso seja SVG (ficheiro .svg, data URL SVG ou XML string)
  const isSvg = trimmed.includes('.svg') || trimmed.startsWith('data:image/svg+xml') || trimmed.trim().startsWith('<svg');
  if (isSvg) {
    try {
      let svgInput = trimmed;
      if (!trimmed.startsWith('data:image/svg+xml') && !trimmed.trim().startsWith('<svg')) {
        const fetchTarget = (typeof window === 'undefined' && trimmed.startsWith('/')) ? 'http://localhost:5173' + trimmed : trimmed;
        const res = await fetch(fetchTarget, { mode: 'cors' });
        if (res.ok) {
          svgInput = await res.text();
        }
      }
      const converted = await convertSvgToPngDataUrl(svgInput, 1200);
      if (converted?.pngDataUrl) {
        return {
          dataUrl: converted.pngDataUrl,
          width: converted.width,
          height: converted.height,
          ratio: converted.ratio
        };
      }
    } catch (svgErr) {
      console.warn('Conversão dedicada de SVG falhou, tentando canais alternativos:', svgErr);
    }
  }

  // 2. Caso já seja data URL raster (PNG ou JPEG)
  if (trimmed.startsWith('data:image/png') || trimmed.startsWith('data:image/jpeg')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 100;
        const h = img.naturalHeight || 100;
        resolve({ dataUrl: trimmed, width: w, height: h, ratio: w / (h || 1) });
      };
      img.onerror = () => resolve({ dataUrl: trimmed, width: 100, height: 100, ratio: 1 });
      img.src = trimmed;
    });
  }

  // 2. Carregar via Image + Canvas (funciona no browser para imagens com CORS e SVGs)
  try {
    const canvasRes = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let nw = img.naturalWidth || img.width || 300;
          let nh = img.naturalHeight || img.height || 300;

          // Se for SVG, renderizar a alta resolução para que a impressão e PDF fiquem 100% nítidos
          const isSvg = trimmed.includes('.svg') || trimmed.startsWith('data:image/svg+xml');
          if (isSvg) {
            const ratio = (nw && nh) ? (nw / nh) : 1;
            const targetW = 1200;
            nw = targetW;
            nh = Math.round(targetW / ratio);
          }

          canvas.width = nw;
          canvas.height = nh;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, nw, nh);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ dataUrl, width: nw, height: nh, ratio: nw / (nh || 1) });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = trimmed;
    });
    if (canvasRes) return canvasRes;
  } catch (_) {}

  // 3. Fallback via fetch (para URLs do Supabase Storage ou ficheiros locais)
  try {
    const fetchTarget = (typeof window === 'undefined' && trimmed.startsWith('/')) ? 'http://localhost:5173' + trimmed : trimmed;
    const res = await fetch(fetchTarget, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      let rawDataUrl = null;
      if (typeof FileReader !== 'undefined') {
        rawDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } else if (typeof Buffer !== 'undefined') {
        const arrayBuf = await blob.arrayBuffer();
        rawDataUrl = `data:${blob.type || 'image/png'};base64,${Buffer.from(arrayBuf).toString('base64')}`;
      }
      if (rawDataUrl) {
        if (typeof Image === 'undefined') {
          return { dataUrl: rawDataUrl, width: 300, height: 300, ratio: 1 };
        }
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            try {
              let nw = img.naturalWidth || img.width || 300;
              let nh = img.naturalHeight || img.height || 300;
              const isSvg = trimmed.includes('.svg') || rawDataUrl.startsWith('data:image/svg+xml');
              if (isSvg) {
                const ratio = (nw && nh) ? (nw / nh) : 1;
                const targetW = 1200;
                nw = targetW;
                nh = Math.round(targetW / ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = nw;
              canvas.height = nh;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, nw, nh);
              const pngDataUrl = canvas.toDataURL('image/png');
              resolve({ dataUrl: pngDataUrl, width: nw, height: nh, ratio: nw / (nh || 1) });
            } catch (_) {
              resolve({ dataUrl: rawDataUrl, width: 100, height: 100, ratio: 1 });
            }
          };
          img.onerror = () => resolve({ dataUrl: rawDataUrl, width: 100, height: 100, ratio: 1 });
          img.src = rawDataUrl;
        });
      }
    }
  } catch (err) {
    console.warn('Não foi possível carregar imagem do logotipo via fetch:', err);
  }

  return null;
}

/**
 * Obtém os dados de imagem do logotipo a utilizar nos documentos (recibos, certificados e declarações)
 * Prioridade:
 * 1. Logotipo de documentos configurado nas definições (document_logo_url)
 * 2. Logotipo estático na pasta public (/logo-documentos.svg)
 * 3. Logotipo geral configurado da instituição (logo_url)
 * 4. Logotipo padrão (/logo.png)
 */
export async function getDocumentLogoData(settings) {
  // 1. Configurado nas definições para documentos
  const docUrl = settings?.institution?.document_logo_url;
  if (docUrl && typeof docUrl === 'string' && docUrl.trim()) {
    const data = await loadImageDataUrl(docUrl);
    if (data) return data;
  }

  // 2. Logotipo geral configurado da instituição (logo_url)
  const generalUrl = settings?.institution?.logo_url;
  if (generalUrl && typeof generalUrl === 'string' && generalUrl.trim()) {
    const data = await loadImageDataUrl(generalUrl);
    if (data) return data;
  }

  // 3. Logotipo oficial padrão (/logo.png)
  return await loadImageDataUrl('/logo.png');
}

/**
 * Redimensiona proporcionalmente para caber dentro de uma caixa máxima (maxW x maxH)
 */
function fitDimensions(origW, origH, maxW, maxH) {
  const ratio = (origW && origH) ? origW / origH : 1;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

/**
 * Gera o Recibo Oficial da Zaty Academy em formato PDF profissional (Portrait A4)
 * Inclui o logotipo institucional oficial, cabeçalho desobstruído, borda arredondada com margem inferior de 2 mm
 * e indicadores vetoriais 100% seguros contra corrupção de caracteres (%Ï)
 */
export async function generateReceiptPdf({
  receipt,
  student,
  payment,
  courseTitle = 'Curso de Informática & Tecnologia',
  settings = null
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const institutionName = settings?.institution?.name || 'ZATY ACADEMY';
  const tagline = settings?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia';
  const phone = settings?.institution?.phone || '+258 834 847 306';
  const email = settings?.institution?.email || 'contacto@zatyacademy.co.mz';
  const rawAddress = settings?.institution?.address || 'Namicopo - Nampula, Moçambique (Próximo à 3ª Esquadra)';
  // Substituir travessões unicode por hífens ASCII seguros
  const address = rawAddress.replace(/[—–]/g, '-');

  // Carregar logotipo oficial da instituição
  const logoData = await getDocumentLogoData(settings);

  // Cores institucionais
  const primaryColor = [0, 102, 178]; // Intel Blue #0066B2
  const darkColor = [15, 23, 42];     // Slate 900
  const grayColor = [100, 116, 139];  // Slate 500

  // =========================================================================
  // BORDA PROFISSIONAL: 100% PRETA, SEM PREENCHIMENTO, CANTOS ARREDONDADOS
  // Margem inferior segura e equilibrada para impressão sem cortes:
  // A4: 210mm x 297mm.
  // Left: 9.5mm | Right: 200.5mm (Largura = 191mm)
  // Top: 9.5mm | Bottom: 274.5mm (Altura = 265mm)
  // Margem inferior da folha: 297mm - 274.5mm = 22.5 mm (área 100% segura de impressão)
  // =========================================================================
  doc.setDrawColor(0, 0, 0); // 100% preta, sem qualquer outra cor
  doc.setLineWidth(0.65);
  doc.roundedRect(9.5, 9.5, 191, 265, 3.5, 3.5, 'D'); // Apenas contorno preto, sem fundo/preenchimento

  // 1. Cabeçalho com Logotipo Oficial & Dados da Instituição (Coluna Esquerda)
  let textStartX = 18;
  if (logoData?.dataUrl) {
    const { w: logoW, h: logoH } = fitDimensions(logoData.width, logoData.height, 22, 22);
    const logoY = 15 + ((22 - logoH) / 2);
    try {
      doc.addImage(logoData.dataUrl, 'PNG', 18, logoY, logoW, logoH);
      textStartX = 18 + logoW + 5;
    } catch (e) {
      console.warn('Falha ao renderizar logo no recibo:', e);
      textStartX = 18;
    }
  }

  // Largura máxima para a coluna esquerda garantir 0% sobreposição com a direita
  const maxLeftWidth = 98;

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text(institutionName, textStartX, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(tagline, textStartX, 24.5, { maxWidth: maxLeftWidth });

  doc.setFontSize(7.5);
  doc.text(address, textStartX, 29, { maxWidth: maxLeftWidth });
  doc.text(`Tel: ${phone}  |  ${email}`, textStartX, 33.5, { maxWidth: maxLeftWidth });

  // Coluna Direita: Metadados do Recibo Oficial (Alinhamento rigoroso à Direita em X=192)
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RECIBO OFICIAL', 192, 19.5, { align: 'right' });

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(receipt?.receipt_number || 'REC-XXXX-XXXX', 192, 25, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(formatDateTime(receipt?.issued_at || new Date()), 192, 29.5, { align: 'right' });

  // Confirmação de Quitação / Autenticidade com Ponto Vetorial (100% livre de %Ï ou erros de encoding)
  const statusLabel = 'PAGAMENTO CONFIRMADO';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // Verde de validação
  doc.text(statusLabel, 192, 34, { align: 'right' });

  // Círculo vetorial desenhado via coordenadas nativas (evita caracteres unicode corrompidos)
  const statusW = doc.getTextWidth(statusLabel);
  doc.setFillColor(16, 185, 129);
  doc.circle(192 - statusW - 2.5, 33.2, 1.15, 'F');

  // Linha divisória fina e elegante
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(18, 38.5, 192, 38.5);

  // 2. Dados do Estudante & Matrícula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('DADOS DO ESTUDANTE', 18, 46);

  // Cartão com design moderno e limpo, sem fundo cinza escuro
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, 49, 174, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text('Nome Completo:', 23, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(student?.full_name || 'Estudante Zaty Academy', 56, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Código Aluno:', 23, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(student?.student_code || student?.student_number || 'ZA-2026-XXXX', 56, 63);

  doc.setFont('helvetica', 'bold');
  doc.text('Contacto / Tel:', 23, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(student?.phone || 'N/A', 56, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Curso:', 115, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(courseTitle, 130, 56, { maxWidth: 58 });

  // 3. Detalhes do Pagamento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('DISCRIMINAÇÃO DO PAGAMENTO', 18, 84);

  // Cabeçalho da Tabela
  doc.setFillColor(...primaryColor);
  doc.rect(18, 88, 174, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('Descrição / Finalidade', 23, 93.5);
  doc.text('Método', 115, 93.5);
  doc.text('Valor Pago', 165, 93.5);

  const paymentDesc = payment?.payment_type === 'matricula' ? 'Taxa de Matrícula e Inscrição' :
                      payment?.payment_type === 'mensalidade' ? 'Mensalidade do Curso' :
                      payment?.payment_type === 'certificado' ? 'Emissão de Certificado Digital' : 'Serviços de Formação Pedagógica';

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(paymentDesc, 23, 104);
  doc.text(String(payment?.payment_method || receipt?.payment_method || 'M-Pesa').toUpperCase(), 115, 104);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(receipt?.amount || payment?.amount || 0), 165, 104);

  doc.setDrawColor(226, 232, 240);
  doc.line(18, 110, 192, 110);

  // Caixa de Total Confirmado - Design moderno e limpo sem fundo cinza
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.65);
  doc.roundedRect(120, 115, 72, 12, 1.5, 1.5, 'D');

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL CONFIRMADO:', 124, 122.5);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11.5);
  doc.text(formatCurrency(receipt?.amount || payment?.amount || 0), 165, 122.5);

  // 4. Dados da Transação e Autenticidade
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text('Identificador Único da Transação:', 18, 138);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(receipt?.transaction_code || `TRX-${receipt?.id?.substring(0, 8).toUpperCase() || '2026-OK'}`, 83, 138);

  if (payment?.reference_code) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...grayColor);
    doc.text(`Ref. Operadora: ${payment.reference_code}`, 18, 145);
  }

  // Hash de Segurança
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`Hash de Validação: ${receipt?.security_hash || `SEC-${receipt?.id?.substring(0, 14).toUpperCase() || 'ZA-HASH-VALID'}`}`, 18, 152);

  // QR Code do Recibo (Para validação rápida da transação)
  const validationUrl = `${window.location.origin}/validar-recibo?rec=${receipt?.receipt_number || ''}`;
  const qrDataUrl = await generateQrCodeDataUrl(validationUrl, { width: 120 });
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 154, 136, 32, 32);
  }

  // 5. Carimbo e Assinatura Oficial do Departamento Financeiro
  doc.setDrawColor(203, 213, 225);
  doc.line(25, 198, 95, 198);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text('DEPARTAMENTO FINANCEIRO', 33, 203);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(`${institutionName} - Emitido Eletronicamente`, 26, 208);

  // 6. Rodapé Institucional Seguro (Espaço amplo de 19mm em relação à borda inferior)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, 248, 182, 13, 2, 2, 'D');

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Este documento comprova a quitação dos valores especificados. Válido sem emendas ou rasuras.', 105, 253.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(`${institutionName} - Secretaria Académica & Financeira - Namicopo, Nampula`, 105, 258, { align: 'center' });

  return doc;
}

export const DEFAULT_COURSE_CURRICULUM = {
  informatica: [
    { name: 'Introdução à Informática', grade: '12 Valores' },
    { name: 'Microsoft Office Word 2003/7', grade: '16 Valores' },
    { name: 'Microsoft Office Excel 2003/7', grade: '12 Valores' },
    { name: 'Microsoft Office PowerPoint 2003/7', grade: '10 Valores' },
    { name: 'Microsoft Office Publisher 2003/7', grade: '13 Valores' },
    { name: 'Organização de Documentos Digitais', grade: '14 Valores' },
    { name: 'Ética Profissional', grade: '14 Valores' },
    { name: 'Comportamento', grade: 'Bom' },
  ],
  design: [
    { name: 'Fundamentos do Design Visual & Teoria das Cores', grade: '16 Valores' },
    { name: 'Edição & Tratamento de Imagem (Photoshop)', grade: '17 Valores' },
    { name: 'Desenho Vectorial & Identidade Visual (Illustrator)', grade: '17 Valores' },
    { name: 'Diagramação Editorial & Fecho de Arte (InDesign)', grade: '16 Valores' },
    { name: 'Tipografia, Composição & Criatividade Publicitária', grade: '16 Valores' },
    { name: 'Criação de Conteúdos para Redes Sociais & Web', grade: '18 Valores' },
    { name: 'Pré-impressão, Fecho de Ficheiros & Produção Gráfica', grade: '16 Valores' },
    { name: 'Ética e Prática Profissional em Design', grade: '17 Valores' },
  ],
  redes: [
    { name: 'Arquitectura de Computadores & Manutenção Hardware', grade: '16 Valores' },
    { name: 'Instalação e Optimização de Sistemas Operativos', grade: '17 Valores' },
    { name: 'Topologias de Redes & Cablagem Estruturada', grade: '16 Valores' },
    { name: 'Endereçamento IPv4/IPv6, Roteamento & Sub-redes', grade: '15 Valores' },
    { name: 'Configuração de Routers, Switches & Redes Wi-Fi', grade: '16 Valores' },
    { name: 'Segurança de Redes, Firewalls & Políticas de Backup', grade: '17 Valores' },
    { name: 'Diagnóstico Avançado e Resolução de Avarias', grade: '17 Valores' },
    { name: 'Ética e Conduta Técnica em Suporte de TI', grade: '16 Valores' },
  ],
  web: [
    { name: 'Fundamentos de Lógica e Estrutura Web', grade: '16 Valores' },
    { name: 'Desenvolvimento Frontend com HTML5 Semântico', grade: '17 Valores' },
    { name: 'Estilização Responsiva e CSS Moderno (Flexbox/Grid)', grade: '17 Valores' },
    { name: 'Programação JavaScript Interativa & Manipulação DOM', grade: '16 Valores' },
    { name: 'Consumo de APIs REST & Armazenamento Local', grade: '16 Valores' },
    { name: 'Controlo de Versões com Git & Plataforma GitHub', grade: '17 Valores' },
    { name: 'Publicação, Domínios & Hospedagem na Nuvem', grade: '18 Valores' },
    { name: 'Boas Práticas de Segurança e Desempenho Web', grade: '17 Valores' },
  ],
  padrao: [
    { name: 'Módulo I: Fundamentos Teóricos e Práticos do Curso', grade: '16 Valores' },
    { name: 'Módulo II: Ferramentas Técnicas & Metodologias', grade: '17 Valores' },
    { name: 'Módulo III: Aplicações Práticas e Projectos Aplicados', grade: '16 Valores' },
    { name: 'Módulo IV: Tecnologias Digitais Aplicadas', grade: '16 Valores' },
    { name: 'Módulo V: Avaliação de Competências Técnicas', grade: '17 Valores' },
    { name: 'Módulo VI: Ética Profissional e Gestão de Qualidade', grade: '16 Valores' },
  ]
};

/**
 * Determina a sigla institucional do curso para numeração automática da pauta
 */
export function getCourseCodePrefix(courseTitle = '') {
  const norm = (courseTitle || '').toLowerCase();
  if (norm.includes('design') || norm.includes('gráfico') || norm.includes('visual')) return 'DSG';
  if (norm.includes('rede') || norm.includes('manutenção') || norm.includes('hardware') || norm.includes('suporte')) return 'RED';
  if (norm.includes('web') || norm.includes('programação') || norm.includes('desenvolvimento') || norm.includes('software')) return 'WEB';
  if (norm.includes('contabilidade') || norm.includes('gestão') || norm.includes('administração')) return 'GES';
  if (norm.includes('inglês') || norm.includes('ingles')) return 'ING';
  if (norm.includes('secretariado')) return 'SEC';
  if (norm.includes('multimédia') || norm.includes('audiovisual')) return 'MED';
  if (norm.includes('informática') || norm.includes('informatica')) return 'INF';
  const clean = (courseTitle || '').replace(/[^A-Za-z]/g, '');
  return clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'INF';
}

/**
 * Gera automaticamente o número oficial da pauta no formato Opção 1: [SIGLA]-[SEQUENCIAL]/[ANO]
 * Exemplo: INF-003/2026
 */
export function generateAutoPautaNumber({ certificate, course, student }) {
  if (certificate?.pauta_number && typeof certificate.pauta_number === 'string' && certificate.pauta_number.includes('-')) {
    return certificate.pauta_number;
  }

  const courseTitle = course?.title || course?.name || certificate?.course?.title || certificate?.course?.name || 'INFORMATICA';
  const prefix = getCourseCodePrefix(courseTitle);

  // Ano de referência da conclusão ou emissão
  const dateStr = certificate?.completion_date || certificate?.issue_date || '';
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();

  // Determinar sequencial automático da pauta
  let seq = '003';
  if (certificate?.pauta_sequence) {
    seq = String(certificate.pauta_sequence).padStart(3, '0');
  } else if (certificate?.pauta_number && !isNaN(Number(certificate.pauta_number))) {
    seq = String(certificate.pauta_number).padStart(3, '0');
  } else if (certificate?.report_number && !isNaN(Number(certificate.report_number))) {
    seq = String(certificate.report_number).padStart(3, '0');
  } else if (student?.enrollments?.[0]?.class?.code) {
    const match = student.enrollments[0].class.code.match(/\d+$/);
    if (match) {
      seq = String(parseInt(match[0], 10) % 99 + 1).padStart(3, '0');
    }
  }

  return `${prefix}-${seq}/${year}`;
}

/**
 * Renderiza um parágrafo formatado com quebra natural de linha, preservação de estilos
 * (bold, italic, normal), justificação suave sem rios de espaço e SEM traços artificiais no fim.
 */
function renderNaturalFormattedParagraph(doc, segments, options = {}) {
  const {
    startX = 25,
    startY = 60,
    maxWidth = 246,
    lineHeight = 5.3,
    fontSize = 12,
    fontName = 'times',
    defaultColor = [15, 23, 42],
    justify = true,
    maxSpaceExpansion = 1.25
  } = options;

  const words = [];
  segments.forEach(seg => {
    const segText = seg.text || '';
    if (!segText) return;
    const segStyle = seg.style || 'normal';
    const segFont = seg.font || fontName;
    const segSize = seg.size || fontSize;
    const segColor = seg.color || defaultColor;

    doc.setFont(segFont, segStyle);
    doc.setFontSize(segSize);

    const parts = segText.split(' ');
    parts.forEach((p, idx) => {
      if (p.length > 0) {
        const w = doc.getTextWidth(p);
        words.push({
          text: p,
          width: w,
          font: segFont,
          style: segStyle,
          size: segSize,
          color: segColor
        });
      }
    });
  });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(fontSize);
  const standardSpaceW = doc.getTextWidth(' ');

  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;

  words.forEach(word => {
    const addedWidth = currentLine.length === 0 ? word.width : (standardSpaceW + word.width);
    if (currentLine.length > 0 && (currentLineWidth + addedWidth > maxWidth)) {
      lines.push(currentLine);
      currentLine = [word];
      currentLineWidth = word.width;
    } else {
      currentLine.push(word);
      currentLineWidth += addedWidth;
    }
  });
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  let curY = startY;
  lines.forEach((lineWords, lineIdx) => {
    const isLastLine = (lineIdx === lines.length - 1);
    const wordsWidth = lineWords.reduce((sum, w) => sum + w.width, 0);
    const spaceCount = lineWords.length - 1;

    let spaceW = standardSpaceW;
    if (justify && !isLastLine && spaceCount > 0) {
      const neededSpace = (maxWidth - wordsWidth) / spaceCount;
      if (neededSpace <= standardSpaceW * maxSpaceExpansion && neededSpace >= standardSpaceW * 0.8) {
        spaceW = neededSpace;
      }
    }

    let curX = startX;
    lineWords.forEach((w, wIdx) => {
      doc.setFont(w.font, w.style);
      doc.setFontSize(w.size);
      doc.setTextColor(...w.color);
      doc.text(w.text, curX, curY);
      curX += w.width + (wIdx < spaceCount ? spaceW : 0);
    });

    curY += lineHeight;
  });

  return curY;
}

/**
 * Gera o Certificado Oficial de Habilitação Profissional da Zaty Academy (Landscape A4)
 * Réplica fiel 1:1 do modelo CorelDRAW de alta precisão
 * - Direção Geral, Formando, Naturalidade e Filiação
 * - Curso, Qualificação e Período
 * - Disciplinas curriculares em duas colunas sem tabela com notas em azul
 * - QR Code dinâmico anti-fraude, pauta oficial e assinaturas
 */
export async function generateCertificatePdf({
  certificate,
  student,
  course,
  settings = null
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Dados do Aluno com fallbacks idênticos ao modelo ajustado em CorelDRAW
  const studentName = student?.full_name || certificate?.student?.full_name || 'Silva De Sousa Lúis';
  const naturalidade = student?.naturalidade || student?.birthplace || student?.city || certificate?.student?.naturalidade || certificate?.student?.city || 'Nampula';
  const distrito = student?.distrito || student?.district || certificate?.student?.distrito || certificate?.student?.district || naturalidade || 'Nampula';
  const provincia = student?.provincia || student?.province || certificate?.student?.provincia || certificate?.student?.province || 'Nampula';
  const fatherName = student?.father_name || student?.father || certificate?.student?.father_name || certificate?.student?.father || 'Sousa Lúis';
  const motherName = student?.mother_name || student?.mother || certificate?.student?.mother_name || certificate?.student?.mother || 'Hawa Alfane';

  // Dados do Curso e Qualificação
  const courseTitle = course?.title || course?.name || certificate?.course?.title || certificate?.course?.name || 'DESIGN GRÁFICO & COMUNICAÇÃO VISUAL';
  const specialty = course?.specialty || course?.subtitle || certificate?.specialty || '';
  const specialtyText = specialty ? `, (${specialty})` : '';
  const completionDate = certificate?.completion_date ? formatDateLong(certificate.completion_date) : formatDateLong(new Date());
  const startDate = certificate?.start_date ? formatDateLong(certificate.start_date) : null;
  const classification = certificate?.classification || 'Apto com Distinção';
  const validationCode = certificate?.validation_code || certificate?.certificate_code || 'ZA-VAL-AFNB-SHSE';
  const certNumber = certificate?.certificate_number || certificate?.certificate_code || 'CERT-ZA-2026-1742';

  // Determinar número e data da pauta
  const rawPautaNumber = generateAutoPautaNumber({ certificate, course, student });
  let pautaNumberStr = rawPautaNumber;
  if (pautaNumberStr.includes('/')) {
    const [codeSeq] = pautaNumberStr.split('/');
    const parts = codeSeq.split('-');
    if (parts.length === 2) {
      pautaNumberStr = `${parts[0].trim()} - ${parts[1].trim()}`;
    }
  } else if (pautaNumberStr.includes('-') && !pautaNumberStr.includes(' - ')) {
    pautaNumberStr = pautaNumberStr.replace('-', ' - ');
  }

  const compDateObj = certificate?.completion_date ? new Date(certificate.completion_date) : (certificate?.issue_date ? new Date(certificate.issue_date) : new Date());
  const validCompDate = isNaN(compDateObj.getTime()) ? new Date() : compDateObj;
  const pautaMonth = String(validCompDate.getMonth() + 1).padStart(2, '0');
  const pautaYear = validCompDate.getFullYear();
  const certPautaDate = certificate?.pauta_date || `${pautaMonth}, ${pautaYear}`;

  const institutionName = settings?.institution?.name || 'ZATY ACADEMY';
  const tagline = settings?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia';
  const directorName = settings?.institution?.director_name || 'Eng. Carlos Alberto';
  const directorRole = settings?.institution?.director_role || 'Diretor Geral';
  const stampUrl = settings?.institution?.stamp_url || '';
  const signatureUrl = settings?.institution?.signature_url || '';

  // Formatação da Filiação
  let filiationText = '';
  if (fatherName && motherName) {
    filiationText = `, Filho de ${fatherName} e de ${motherName}`;
  } else if (fatherName) {
    filiationText = `, Filho de ${fatherName}`;
  } else if (motherName) {
    filiationText = `, Filho de ${motherName}`;
  } else {
    filiationText = `, Filho de Sousa Lúis e de Hawa Alfane`;
  }

  // Formatação do Período
  const periodStr = certificate?.period || (startDate ? `no período de ${startDate} a ${completionDate}` : `nos Meses de Dezembro, Janeiro e Fevereiro`);

  // Formatação da Data e Localidade Institucional
  const issueCity = settings?.institution?.city || 'Nampula';
  const issueDateObj = certificate?.issue_date ? new Date(certificate.issue_date) : (certificate?.completion_date ? new Date(certificate.completion_date) : new Date());
  const validDate = isNaN(issueDateObj.getTime()) ? new Date() : issueDateObj;
  const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const formattedOfficialDate = `${issueCity}, aos ${validDate.getDate()} de ${monthsPt[validDate.getMonth()]} de ${validDate.getFullYear()}`;

  // Resolução dos módulos curriculares e competências
  let modulesToRender = [];
  if (Array.isArray(certificate?.modules) && certificate.modules.length > 0) {
    modulesToRender = certificate.modules;
  } else if (Array.isArray(course?.syllabus) && course.syllabus.length > 0) {
    modulesToRender = course.syllabus.map(m => typeof m === 'string' ? { name: m, grade: '16 Valores' } : m);
  } else {
    const normTitle = courseTitle.toLowerCase();
    if (normTitle.includes('design') || normTitle.includes('gráfico') || normTitle.includes('visual')) {
      modulesToRender = DEFAULT_COURSE_CURRICULUM.design;
    } else if (normTitle.includes('rede') || normTitle.includes('manutenção') || normTitle.includes('hardware')) {
      modulesToRender = DEFAULT_COURSE_CURRICULUM.redes;
    } else if (normTitle.includes('web') || normTitle.includes('programação') || normTitle.includes('desenvolvimento') || normTitle.includes('software')) {
      modulesToRender = DEFAULT_COURSE_CURRICULUM.web;
    } else {
      modulesToRender = DEFAULT_COURSE_CURRICULUM.informatica;
    }
  }

  const logoData = await getDocumentLogoData(settings);

  // 1. Marca d'Água Central da Zaty Academy (Suave no fundo)
  if (logoData?.dataUrl) {
    try {
      doc.saveGraphicsState();
      if (typeof doc.setGState === 'function' && typeof doc.GState === 'function') {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
      }
      doc.addImage(logoData.dataUrl, 'PNG', 148.5 - 60, 105 - 45, 120, 90);
      doc.restoreGraphicsState();
    } catch (_) {}
  }

  // 2. Moldura de Prestígio Fiel ao Modelo CorelDRAW
  // Moldura Externa Azul Royal / Deep Navy [0, 51, 153]
  doc.setDrawColor(0, 51, 153);
  doc.setLineWidth(2.2);
  doc.rect(8.5, 8.5, 280, 193);

  // Cantos ornamentais exteriores (Quadrados Azuis 7x7mm)
  doc.setFillColor(0, 51, 153);
  doc.rect(8.5, 8.5, 7, 7, 'F');
  doc.rect(281.5, 8.5, 7, 7, 'F');
  doc.rect(8.5, 194.5, 7, 7, 'F');
  doc.rect(281.5, 194.5, 7, 7, 'F');

  // Moldura Interna Dourada / Ouro Nobre [230, 115, 0]
  const goldTopY = 11.5;
  const goldBottomY = 198.5;
  doc.setDrawColor(230, 115, 0);
  doc.setLineWidth(0.8);
  doc.rect(11.5, goldTopY, 274, 187);

  // Cantos ornamentais interiores (Quadrados Dourados 3.5x3.5mm)
  doc.setFillColor(230, 115, 0);
  doc.rect(11.5, 11.5, 3.5, 3.5, 'F');
  doc.rect(282, 11.5, 3.5, 3.5, 'F');
  doc.rect(11.5, 195, 3.5, 3.5, 'F');
  doc.rect(282, 195, 3.5, 3.5, 'F');

  // Resolução de conversão de pixels do CorelDRAW (300 DPI - standard de impressão)
  // 130px = 11.01 mm | 54px = 4.57 mm | 82px = 6.94 mm | 110px = 9.31 mm | 123px = 10.41 mm | 213px = 18.03 mm | 46px = 3.89 mm
  const PX_TO_MM = 25.4 / 300;
  const SPACING_GOLD_TO_LOGO_MM = 130 * PX_TO_MM;        // 130px -> ~11.01 mm
  const SPACING_LOGO_TO_TITLE_MM = 54 * PX_TO_MM;         // 54px  -> ~4.57 mm
  const SPACING_SUBTITLE_TO_CERT_MM = 82 * PX_TO_MM;      // 82px  -> ~6.94 mm
  const SPACING_DATE_TO_SIG_MM = 110 * PX_TO_MM;          // 110px -> ~9.31 mm
  const SPACING_SELO_TO_GOLD_BOTTOM_MM = 123 * PX_TO_MM;  // 123px -> ~10.41 mm
  const SPACING_SIG_TO_GOLD_BOTTOM_MM = 213 * PX_TO_MM;   // 213px -> ~18.03 mm
  const SPACING_FOOTER_TO_GOLD_MM = 46 * PX_TO_MM;        // 46px  -> ~3.89 mm

  // 3. Cabeçalho Institucional: Logotipo & Títulos
  // Moldura Interna Dourado/Âmbar -> Logo: 130px (11.01 mm)
  // Aumento ligeiro e proporcional do logotipo no cabeçalho (19.5 x 14.5 mm)
  const logoTopY = goldTopY + SPACING_GOLD_TO_LOGO_MM;
  const logoMaxH = 14.5;
  const logoMaxW = 19.5;
  let logoActualH = logoMaxH;

  if (logoData?.dataUrl) {
    const { w: logoW, h: logoH } = fitDimensions(logoData.width, logoData.height, logoMaxW, logoMaxH);
    logoActualH = logoH;
    const logoX = 148.5 - (logoW / 2);
    const logoY = logoTopY + ((logoMaxH - logoH) / 2);
    try {
      doc.addImage(logoData.dataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch (_) {}
  }

  const logoBottomY = logoTopY + logoActualH;

  // Logo -> “ZATY ACADEMY”: 54px (4.57 mm)
  const zatyTopY = logoBottomY + SPACING_LOGO_TO_TITLE_MM;
  const zatyBaselineY = zatyTopY + 3.8;

  // Nome da Instituição Emissora: azul institucional, Times New Roman Bold, 14pt, centralizado
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 153); // Azul institucional Corel [0, 51, 153]
  doc.text(institutionName.toUpperCase(), 148.5, zatyBaselineY, { align: 'center' });

  // Subtítulo / Tagline da Instituição: preto profundo, Times New Roman Bold, 12pt, centralizado
  const subtitleBaselineY = zatyBaselineY + 5.0;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Preto profundo [0, 0, 0]
  doc.text(tagline.toUpperCase(), 148.5, subtitleBaselineY, { align: 'center' });

  // Título Oficial do Certificado: exatamente 82px (6.94 mm) de espaçamento abaixo do subtítulo
  const subtitleTextBottom = subtitleBaselineY + 0.6;
  const certTextTop = subtitleTextBottom + SPACING_SUBTITLE_TO_CERT_MM;
  const certTitleY = certTextTop + 5.3;
  doc.setFont('times', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(230, 115, 0); // Ouro / Âmbar vibrante Corel
  doc.text('CERTIFICADO', 148.5, certTitleY, { align: 'center' });

  // Linhas divisórias decorativas com ponto central sob CERTIFICADO
  // Duas linhas horizontais em Preto (#000000) mais finas e elegantes (0.35 mm)
  // No centro: círculo preenchido em Dourado/Âmbar (#E67300 / [230, 115, 0])
  const divY = certTitleY + 3.5;
  doc.setDrawColor(0, 0, 0); // Linhas pretas
  doc.setLineWidth(0.35); // Linhas mais finas e elegantes
  doc.line(76, divY, 145.5, divY);
  doc.line(151.5, divY, 221, divY);
  doc.setFillColor(230, 115, 0); // Ponto âmbar/dourado mantido
  doc.circle(148.5, divY, 1.4, 'F');

  // 4. Fórmula de Abertura (12pt, espaçamento exato de 80px = 6.77 mm do divisor ao texto)
  const SPACING_DIV_TO_TEXT_MM = 80 * PX_TO_MM; // 80px -> ~6.77 mm
  const directorY = divY + SPACING_DIV_TO_TEXT_MM;
  renderNaturalFormattedParagraph(doc, [
    { text: 'Eu ', style: 'normal' },
    { text: directorName, style: 'bold' },
    { text: `, ${directorRole} da ${institutionName}, em ${issueCity},`, style: 'normal' }
  ], {
    startX: 25,
    startY: directorY,
    maxWidth: 246,
    fontSize: 12,
    lineHeight: 5.3,
    justify: false
  });

  // 5. Parágrafo de Certificação, Qualificação e Competências (12pt, quebra natural, sem rios de espaço)
  const certParagraphY = directorY + 5.3;
  const endCertY = renderNaturalFormattedParagraph(doc, [
    { text: 'Certifico, em cumprimento do despacho exarado em requerimento que fica arquivado na secretaria desta instituição que: ' },
    { text: studentName, style: 'bold' },
    { text: `, Natural de ${naturalidade}, Distrito de ${distrito}, Província de ${provincia}${filiationText}. ` },
    { text: 'Concluiu com ' },
    { text: classification, style: 'normal' },
    { text: ' o Curso Técnico de ' },
    { text: `${courseTitle.toUpperCase()}${specialtyText}`, style: 'bold' },
    { text: `, que decorreu ${periodStr}, que lhe confere as seguintes competências:` }
  ], {
    startX: 25,
    startY: certParagraphY,
    maxWidth: 246,
    fontSize: 12,
    lineHeight: 5.3,
    justify: true
  });

  // 6. Disciplinas / Módulos Curriculares: Times New Roman Italic, 11pt (Duas Colunas Limpas)
  const col1Left = 25;
  const col1Right = 145;
  const col2Left = 152;
  const col2Right = 271;
  const modulesStartY = endCertY + 3.0;
  const moduleRowHeight = 5.0;

  const totalModules = modulesToRender.slice(0, 8);
  const halfCount = Math.ceil(totalModules.length / 2);

  totalModules.forEach((mod, idx) => {
    const isCol2 = idx >= halfCount;
    const rowIdx = isCol2 ? idx - halfCount : idx;
    const rowY = modulesStartY + (rowIdx * moduleRowHeight);

    const leftX = isCol2 ? col2Left : col1Left;
    const rightX = isCol2 ? col2Right : col1Right;

    const modName = typeof mod === 'string' ? mod : mod.name;
    const modGrade = typeof mod === 'object' && mod.grade ? mod.grade : '16 Valores';

    // Nome da disciplina com marcador em Itálico 11pt
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const bulletText = `• ${modName}`;
    doc.text(bulletText, leftX, rowY);
    const textWidth = doc.getTextWidth(bulletText);

    // Nota da disciplina em Negrito Itálico Preto 11pt (contraste total 100%)
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Preto puro para máxima legibilidade
    doc.text(modGrade, rightX, rowY, { align: 'right' });
    const gradeWidth = doc.getTextWidth(modGrade);

    // Linha pontilhada conectora em preto nítido
    const startDotX = leftX + textWidth + 1.5;
    const endDotX = rightX - gradeWidth - 1.5;
    if (endDotX > startDotX) {
      doc.setDrawColor(0, 0, 0); // Traço pontilhado preto
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([0.8, 1.2], 0);
      doc.line(startDotX, rowY - 0.4, endDotX, rowY - 0.4);
      doc.setLineDashPattern([], 0);
    }
  });

  // 7. Pauta e Cláusula de Fé Pública (12pt, sem traços pontilhados no fim)
  const pautaY = modulesStartY + (halfCount * moduleRowHeight) + 3.0;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Consta na pauta de relatórios do curso nº ${pautaNumberStr}, de ${certPautaDate}.`, 25, pautaY);

  const fePublicaY = pautaY + 5.2;
  renderNaturalFormattedParagraph(doc, [
    { text: 'E por ser verdade mandei passar o presente certificado que só é válido se estiver apresentado devidamente assinado por mim e autenticado com carimbo em uso nesta instituição e selo de verificação digital.' }
  ], {
    startX: 25,
    startY: fePublicaY,
    maxWidth: 246,
    fontSize: 12,
    lineHeight: 5.2,
    justify: true
  });

  // 8. Assinaturas Oficiais & Validação Digital
  // Regra prioritária de posicionamento:
  // - Espaçamento entre os campos de assinatura e a Moldura Interna Dourada: exatamente 213px (18.03 mm)
  // - Espaçamento entre a Data Oficial e os campos de assinatura: exatamente 110px (9.31 mm)
  const sigInfoBottomY = goldBottomY - SPACING_SIG_TO_GOLD_BOTTOM_MM; // 198.5 - 18.03 = 180.47 mm
  const sigLineY = sigInfoBottomY - 8.5; // ~171.97 mm
  const dateOfficialY = sigLineY - SPACING_DATE_TO_SIG_MM; // 171.97 - 9.31 = 162.66 mm

  // Data Oficial e Localidade Centralizada (Times Bold 12pt)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(formattedOfficialDate, 148.5, dateOfficialY, { align: 'center' });

  // A. Selo de Verificação Digital (Esquerda)
  // Espaçamento entre o selo com as respetivas informações e a Moldura Interna Dourada: exatamente 123px (10.41 mm)
  // Tipografia em Arial (helvetica)
  const seloBottomTextY = goldBottomY - SPACING_SELO_TO_GOLD_BOTTOM_MM; // 198.5 - 10.41 = 188.09 mm
  const qrSize = 20.0;
  const qrX = 25;
  const qrY = (seloBottomTextY - 6.8 - 3.3) - qrSize; // ~157.99 mm
  const qrCenterX = qrX + (qrSize / 2);

  const validationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/validar/${validationCode}`
    : `https://zatyacademy.co.mz/validar/${validationCode}`;

  const qrDataUrl = await generateQrCodeDataUrl(validationUrl, { width: 140, margin: 1 });
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (_) {}
  }

  // Informações do Selo em Arial (helvetica):
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('VALIDAÇÃO DIGITAL', qrCenterX, seloBottomTextY - 6.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(29, 78, 216); // Azul royal
  doc.text(validationCode, qrCenterX, seloBottomTextY - 3.4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text('Verificar em /validar', qrCenterX, seloBottomTextY, { align: 'center' });

  // B. Assinatura da Coordenação Pedagógica (Centro-Esquerda)
  const sig1StartX = 75;
  const sig1EndX = 138;
  const sig1CenterX = (sig1StartX + sig1EndX) / 2;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4); // Reduzido para exatamente 0,4 mm
  doc.line(sig1StartX, sigLineY, sig1EndX, sigLineY);

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Coordenação Pedagógica', sig1CenterX, sigLineY + 4.5, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(institutionName, sig1CenterX, sigLineY + 8.5, { align: 'center' });

  // C. Assinatura da Direção Geral (Centro-Direita)
  const sig2StartX = 168;
  const sig2EndX = 231;
  const sig2CenterX = (sig2StartX + sig2EndX) / 2;

  if (signatureUrl) {
    const sigData = await loadImageDataUrl(signatureUrl);
    if (sigData) {
      try {
        doc.addImage(sigData.dataUrl, 'PNG', sig2CenterX - 20, sigLineY - 14, 40, 13);
      } catch (_) {}
    }
  }

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4); // Reduzido para exatamente 0,4 mm
  doc.line(sig2StartX, sigLineY, sig2EndX, sigLineY);

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(directorName, sig2CenterX, sigLineY + 4.5, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(directorRole, sig2CenterX, sigLineY + 8.5, { align: 'center' });

  // Carimbo Oficial (renderizado sobre a área de assinaturas se configurado nas definições)
  if (stampUrl) {
    const stampData = await loadImageDataUrl(stampUrl);
    if (stampData) {
      try {
        doc.addImage(stampData.dataUrl, 'PNG', 137, sigLineY - 12, 24, 24);
      } catch (_) {}
    }
  }

  // 9. Rodapé Institucional e Registo Oficial
  // Rodapé Oficial → Moldura Interna Dourado/Âmbar: 46px (3.89 mm)
  // Tipografia em Arial (helvetica)
  const footerBaselineY = goldBottomY - SPACING_FOOTER_TO_GOLD_MM; // 198.5 - 3.89 = 194.61 mm
  const footerLineY = footerBaselineY - 3.5;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(25, footerLineY, 271, footerLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Registo Oficial Nº: ${certNumber}  |  Documento Válido Emitido Sob Responsabilidade Exclusiva da ${institutionName}`, 148.5, footerBaselineY, { align: 'center' });

  return doc;
}

/**
 * Dispara a impressão direta de um documento PDF jsPDF via iframe oculto
 */
export function printPdfDoc(doc) {
  const blobUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Fallback para janela de impressão:', e);
      window.open(blobUrl, '_blank')?.print();
    }
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // cleanup silencioso
      }
    }, 60000);
  };
}

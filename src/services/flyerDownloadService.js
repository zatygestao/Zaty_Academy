import html2canvas from 'html2canvas';
import jsPDFDefault, { jsPDF as jsPDFNamed } from 'jspdf';
const jsPDF = jsPDFNamed || jsPDFDefault;

/**
 * Realiza o corte proporcional (cover crop centralizado) de uma imagem num canvas de alta definição,
 * preservando com exatidão matemática a proporção e enquadramento originais sem esticar nem achatar.
 * 
 * @param {HTMLImageElement} img Elemento de imagem original carregado
 * @param {number} targetWidth Largura de destino do container em pixels
 * @param {number} targetHeight Altura de destino do container em pixels
 * @param {number} renderScale Fator de escala para alta definição (padrão 3 para 300 DPI)
 * @returns {string|null} Data URL da imagem recortada proporcionalmente em JPEG de alta qualidade
 */
function createProportionalCoverCrop(img, targetWidth, targetHeight, renderScale = 3, verticalAlign = 0.5) {
  if (!img || !img.naturalWidth || !img.naturalHeight || !targetWidth || !targetHeight) {
    return null;
  }

  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  const targetRatio = targetWidth / targetHeight;
  const imgRatio = natW / natH;

  let sWidth, sHeight, sx, sy;

  if (imgRatio > targetRatio) {
    // Imagem mais larga que o container:
    // Preserva a altura total da imagem original e recorta proporcionalmente as laterais (centralizado)
    sHeight = natH;
    sWidth = natH * targetRatio;
    sx = (natW - sWidth) / 2;
    sy = 0;
  } else {
    // Imagem mais alta que o container:
    // Preserva a largura total da imagem original e recorta proporcionalmente o topo e a base conforme alinhamento vertical
    sWidth = natW;
    sHeight = natW / targetRatio;
    sx = 0;
    sy = (natH - sHeight) * verticalAlign;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth * renderScale));
  canvas.height = Math.max(1, Math.round(targetHeight * renderScale));
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  try {
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.96);
  } catch (err) {
    // Falha por restrição de CORS em origens externas sem cabeçalhos
    return null;
  }
}

/**
 * Captura o elemento do folheto A5 com escala para alta resolução (300 DPI aprox.)
 * e preserva rigorosamente todos os estilos, textos, imagens e dimensões A5 (140 x 198 mm).
 * 
 * @param {HTMLElement|string} elementOrId
 * @param {number} scale Escala de renderização (padrão 3 para alta definição)
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function captureFlyerCanvas(elementOrId, scale = 3) {
  let targetElement = typeof elementOrId === 'string'
    ? document.querySelector(elementOrId) || document.getElementById(elementOrId)
    : elementOrId;

  if (!targetElement) {
    const allFlyers = Array.from(document.querySelectorAll('.a5-flyer-instance'));
    targetElement = allFlyers.find(el => el.offsetParent !== null) || allFlyers[0];
  }

  if (!targetElement) {
    throw new Error('Elemento do folheto A5 não foi encontrado para geração do download.');
  }

  // Se o elemento contiver a classe .a5-flyer-instance em um descendente, captura o nó do folheto
  const flyerNode = targetElement.classList?.contains('a5-flyer-instance')
    ? targetElement
    : targetElement.querySelector('.a5-flyer-instance') || targetElement;

  // 1. Aguardar carregamento completo de todas as fontes tipográficas
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Aviso ao aguardar fontes:', e);
    }
  }

  // 2. Aguardar carregamento de todas as imagens presentes no folheto original
  const originalImages = Array.from(flyerNode.querySelectorAll('img'));
  await Promise.all(
    originalImages.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // 3. Pré-calcular cortes proporcionais das imagens para garantir proporção 100% perfeita
  // Mapeia cada imagem pelo seu índice exato baseado no tamanho do seu container imediato (frame)
  const imageCrops = new Map();
  originalImages.forEach((img, idx) => {
    img.setAttribute('data-flyer-img-idx', String(idx));

    // O container da imagem é o seu elemento pai direto
    const container = img.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width || container.clientWidth;
    const h = rect.height || container.clientHeight;

    const isCoverImg = img.classList.contains('flyer-cover-image') ||
      img.classList.contains('flyer-hero-bg-img') ||
      window.getComputedStyle(img).objectFit === 'cover' ||
      img.style.objectFit === 'cover';

    if (isCoverImg && w > 0 && h > 0 && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const vAlign = img.classList.contains('flyer-hero-bg-img') ? 0.35 : 0.5;
      const croppedDataUrl = createProportionalCoverCrop(img, w, h, scale, vAlign);
      if (croppedDataUrl) {
        imageCrops.set(String(idx), croppedDataUrl);
      }
    }
  });

  return await html2canvas(flyerNode, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    imageTimeout: 15000,
    windowWidth: 1280,
    windowHeight: 1800,
    onclone: (clonedDoc) => {
      const clonedFlyer = clonedDoc.querySelector('.a5-flyer-instance');
      if (clonedFlyer) {
        clonedFlyer.style.width = '140mm';
        clonedFlyer.style.height = '198mm';
        clonedFlyer.style.minWidth = '140mm';
        clonedFlyer.style.maxWidth = '140mm';
        clonedFlyer.style.minHeight = '198mm';
        clonedFlyer.style.maxHeight = '198mm';
        clonedFlyer.style.transform = 'none';
        clonedFlyer.style.boxShadow = 'none';
        clonedFlyer.style.margin = '0';
        clonedFlyer.style.boxSizing = 'border-box';
      }

      // 4. Aplicar os recortes proporcionais perfeitos nas imagens clonadas pelo índice exato
      const clonedImages = Array.from(clonedDoc.querySelectorAll('img[data-flyer-img-idx]'));
      clonedImages.forEach((clonedImg) => {
        const idx = clonedImg.getAttribute('data-flyer-img-idx');
        const croppedUrl = imageCrops.get(idx);
        if (croppedUrl) {
          clonedImg.src = croppedUrl;
          clonedImg.style.width = '100%';
          clonedImg.style.height = '100%';
          clonedImg.style.maxWidth = '100%';
          clonedImg.style.maxHeight = '100%';
          clonedImg.style.minWidth = '0';
          clonedImg.style.minHeight = '0';
          clonedImg.style.transform = 'none';
          clonedImg.style.objectFit = 'cover';
          if (clonedImg.classList.contains('flyer-hero-bg-img')) {
            clonedImg.style.position = 'absolute';
            clonedImg.style.top = '0';
            clonedImg.style.left = '0';
          }
        }
      });

      // 5. Garantir renderização e visibilidade do botão de inscrição online
      const badges = clonedDoc.querySelectorAll('.btn-inscricao-online, [data-badge="inscricao"]');
      badges.forEach((el) => {
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.backgroundColor = '#FACC15';
        el.style.color = '#002B49';
      });
    }
  });
}

/**
 * Baixa o folheto A5 em imagem PNG de alta resolução (perfeito para publicação em redes sociais)
 * Preserva exatamente os 140mm x 198mm em alta definição.
 * 
 * @param {HTMLElement|string} elementOrId
 * @param {string} filename Nome base do ficheiro (sem extensão)
 * @returns {Promise<string>} Data URL da imagem gerada
 */
export async function downloadFlyerAsPng(elementOrId, filename = 'Folheto-Inscricoes-Zaty-Academy-A5') {
  const canvas = await captureFlyerCanvas(elementOrId, 3);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

/**
 * Baixa o folheto em documento PDF em página única A5 vertical (140mm x 198mm)
 * 
 * @param {HTMLElement|string} elementOrId
 * @param {string} filename Nome base do ficheiro (sem extensão)
 * @returns {Promise<jsPDF>} Instância do documento PDF
 */
export async function downloadFlyerAsPdf(elementOrId, filename = 'Folheto-Inscricoes-Zaty-Academy-A5') {
  const canvas = await captureFlyerCanvas(elementOrId, 3);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [140, 198]
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 140, 198, undefined, 'FAST');
  pdf.save(`${filename}.pdf`);

  return pdf;
}

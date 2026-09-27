/**
 * Utilitários de processamento e manipulação de imagem via HTML5 Canvas
 * Zaty Academy
 */

/**
 * Remove automaticamente fundos azuis e fundos sólidos dominantes de um ficheiro de imagem,
 * convertendo-os em transparência real (canal alfa) e preservando nitidez e proporções.
 *
 * @param {File|Blob} imageFile - Ficheiro de imagem original
 * @param {Object} options
 * @param {boolean} options.removeBlue - Se deve remover tons de azul (default: true)
 * @param {number} options.maxDimension - Largura/altura máxima para otimização de performance (default: 800)
 * @param {number} options.tolerance - Tolerância de cor (0-100, default: 38)
 * @returns {Promise<File>} - Ficheiro PNG com fundo transparente
 */
export function processLogoBackground(imageFile, options = {}) {
  const {
    removeBlue = true,
    maxDimension = 800,
    tolerance = 38
  } = options;

  return new Promise((resolve, reject) => {
    if (!imageFile) return reject(new Error('Nenhum ficheiro fornecido.'));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Redimensionamento proporcional para otimizar carregamento e desempenho
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          // Desenhar imagem no canvas
          ctx.drawImage(img, 0, 0, width, height);

          if (!removeBlue) {
            // Apenas exportar como PNG otimizado mantendo o formato original
            canvas.toBlob((blob) => {
              const cleanFile = new File([blob], imageFile.name.replace(/\.[^.]+$/, '.png'), {
                type: 'image/png'
              });
              resolve(cleanFile);
            }, 'image/png', 0.95);
            return;
          }

          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Amostrar os 4 cantos para identificar a cor do fundo
          const corners = [
            getPixel(data, width, 2, 2),
            getPixel(data, width, width - 3, 2),
            getPixel(data, width, 2, height - 3),
            getPixel(data, width, width - 3, height - 3)
          ];

          // Calcular cor média de fundo dos cantos
          const bgCorner = {
            r: Math.round(corners.reduce((acc, c) => acc + c.r, 0) / 4),
            g: Math.round(corners.reduce((acc, c) => acc + c.g, 0) / 4),
            b: Math.round(corners.reduce((acc, c) => acc + c.b, 0) / 4)
          };

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 10) continue; // Já é transparente

            // 1. Verificar distância de cor em relação à média dos cantos
            const dist = Math.sqrt(
              Math.pow(r - bgCorner.r, 2) +
              Math.pow(g - bgCorner.g, 2) +
              Math.pow(b - bgCorner.b, 2)
            );

            // 2. Verificar se o pixel é dominantemente azul (paleta Intel/Zaty: #00223E, #003865, #004b87, #0072CE, etc.)
            const isBlueDominant = b > 55 && (b > r + 18) && (b > g + 8);
            const isDarkBlueNavy = b > 35 && r < 45 && g < 75 && (b >= r && b >= g);
            const isCornerMatch = dist < tolerance * 1.5;

            if (isCornerMatch || isBlueDominant || isDarkBlueNavy) {
              // Aplicar suavização nos limites para contornos perfeitos (feathering)
              if (dist > tolerance && dist < tolerance * 1.5) {
                const alphaFactor = (dist - tolerance) / (tolerance * 0.5);
                data[i + 3] = Math.min(a, Math.round(255 * alphaFactor));
              } else {
                data[i + 3] = 0; // 100% transparente
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Falha ao gerar imagem com fundo transparente.'));
            const cleanName = imageFile.name.replace(/\.[^.]+$/, '') + '_transparent.png';
            const cleanFile = new File([blob], cleanName, { type: 'image/png' });
            resolve(cleanFile);
          }, 'image/png', 0.95);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Não foi possível ler os dados da imagem.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Erro ao carregar o arquivo.'));
    reader.readAsDataURL(imageFile);
  });
}

function getPixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3]
  };
}

/**
 * Otimiza e redimensiona fotos de perfil (avatar) para carregamento instantâneo
 *
 * @param {File|Blob} imageFile - Ficheiro de imagem original
 * @param {number} size - Dimensão máxima quadrada (default: 320px)
 * @returns {Promise<File>}
 */
export function resizeAvatarImage(imageFile, size = 320) {
  return new Promise((resolve, reject) => {
    if (!imageFile) return reject(new Error('Nenhum ficheiro fornecido.'));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Corte quadrado centralizado proporcional (center crop)
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Falha ao processar avatar.'));
            const cleanName = `avatar_${Date.now()}.jpg`;
            const cleanFile = new File([blob], cleanName, { type: 'image/jpeg' });
            resolve(cleanFile);
          }, 'image/jpeg', 0.88);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Falha ao ler avatar.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Converte um ficheiro SVG, código SVG em string ou Data URL SVG para um PNG de alta definição (300+ DPI)
 * usando Blob local para evitar qualquer erro de Canvas contaminado (tainted canvas) no jsPDF.
 *
 * @param {File|Blob|string} fileOrText - Ficheiro SVG, string XML ou data URL
 * @param {number} targetWidth - Largura de destino para renderização nítida (default: 1200)
 * @returns {Promise<{ pngDataUrl: string, pngBlob: Blob, pngFile: File, width: number, height: number, ratio: number }>}
 */
export async function convertSvgToPngDataUrl(fileOrText, targetWidth = 1200) {
  let svgString = '';
  if (typeof fileOrText === 'string') {
    const trimmed = fileOrText.trim();
    if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg')) {
      svgString = trimmed;
    } else if (trimmed.startsWith('data:image/svg+xml')) {
      const base64Index = trimmed.indexOf(';base64,');
      if (base64Index !== -1) {
        svgString = atob(trimmed.slice(base64Index + 8));
      } else {
        svgString = decodeURIComponent(trimmed.split(',')[1] || '');
      }
    }
  } else if (fileOrText instanceof Blob || fileOrText instanceof File) {
    svgString = await fileOrText.text();
  }

  if (!svgString) {
    throw new Error('Conteúdo SVG vazio ou formato inválido.');
  }

  // Analisar o SVG para obter atributos e viewBox
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = xmlDoc.querySelector('svg');
  if (!svgEl) {
    throw new Error('Elemento <svg> não encontrado no ficheiro.');
  }

  // Extrair dimensões
  let w = parseFloat(svgEl.getAttribute('width'));
  let h = parseFloat(svgEl.getAttribute('height'));
  const viewBox = svgEl.getAttribute('viewBox');

  if (viewBox && (!w || !h || isNaN(w) || isNaN(h))) {
    const parts = viewBox.split(/[\s,]+/).filter(Boolean).map(parseFloat);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      w = parts[2];
      h = parts[3];
    }
  }

  if (!w || isNaN(w) || w <= 0) w = 400;
  if (!h || isNaN(h) || h <= 0) h = 400;
  const ratio = w / h;

  const finalWidth = targetWidth;
  const finalHeight = Math.round(targetWidth / ratio);

  // Garantir dimensões no elemento SVG para rasterização nítida
  svgEl.setAttribute('width', String(finalWidth));
  svgEl.setAttribute('height', String(finalHeight));

  const serializedSvg = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, finalWidth, finalHeight);
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        URL.revokeObjectURL(blobUrl);

        const pngDataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((pngBlob) => {
          const fileName = `logo_documentos_${Date.now()}.png`;
          const pngFile = new File([pngBlob || blob], fileName, { type: 'image/png' });
          resolve({
            pngDataUrl,
            pngBlob,
            pngFile,
            width: finalWidth,
            height: finalHeight,
            ratio
          });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Não foi possível renderizar o arquivo SVG.'));
    };
    img.src = blobUrl;
  });
}

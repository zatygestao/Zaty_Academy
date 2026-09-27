/**
 * Utilitários de validação para o sistema Zaty Academy
 */

export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

export function isValidMozPhone(phone) {
  if (!phone) return false;
  // Limpar espaços, traços e parênteses
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  // Moçambique: 82, 83, 84, 85, 86, 87 seguido de 7 dígitos (ou prefixado com 258)
  return /^(258)?(82|83|84|85|86|87)\d{7}$/.test(clean);
}

export function validateFile(file, { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = {}) {
  if (!file) return { valid: false, error: 'Nenhum ficheiro seleccionado.' };
  
  // Validar tamanho
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `O ficheiro excede o tamanho máximo permitido de ${maxSizeMB} MB.` };
  }

  // Validar tipo
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato de ficheiro não suportado. Utilize JPG, PNG ou PDF.' };
  }

  return { valid: true };
}

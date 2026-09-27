/**
 * Utilitários de formatação para o sistema Zaty Academy
 */

export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '0,00 MT';
  const num = Number(value);
  return new Intl.NumberFormat('pt-MZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' MT';
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDateLong(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function generateStudentCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZA-${year}-${rand}`;
}

export function generateTransactionCode() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const year = new Date().getFullYear();
  return `TRX-${year}-${rand}`;
}

export function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `REC-${year}-${rand}`;
}

export function generateValidationCode() {
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZA-VAL-${p1}-${p2}`;
}

export function generateClassCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TUR-${year}-${rand}`;
}

export function getStatusBadgeInfo(status) {
  switch (status?.toLowerCase()) {
    case 'aprovado':
    case 'ativo':
      return { label: 'Aprovado / Ativo', color: 'success', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'regular':
    case 'valido':
    case 'concluido':
      return { label: 'Regular', color: 'success', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'pendente':
    case 'aberta':
      return { label: 'Pendente', color: 'warning', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'em_analise':
    case 'em_andamento':
      return { label: 'Em Análise', color: 'info', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'rejeitado':
      return { label: 'Rejeitado', color: 'danger', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    case 'cancelado':
    case 'suspenso':
    case 'revogado':
      return { label: 'Suspenso', color: 'danger', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    default:
      return { label: status || '—', color: 'default', bg: 'bg-slate-700/50 text-slate-300 border-slate-600/30' };
  }
}

export function isLessonExpired(expiresAt) {
  if (!expiresAt) return false;
  try {
    const exp = new Date(expiresAt);
    return !isNaN(exp.getTime()) && exp < new Date();
  } catch {
    return false;
  }
}

export function getRemainingDays(expiresAt) {
  if (!expiresAt) return null;
  try {
    const exp = new Date(expiresAt);
    if (isNaN(exp.getTime())) return null;
    const diffMs = exp.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}


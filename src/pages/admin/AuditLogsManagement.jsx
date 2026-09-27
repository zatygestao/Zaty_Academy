import { useState, useEffect, useMemo } from 'react';
import { getAuditLogs, recordAuditLog } from '../../services/api';
import { subscribeToAuditLogs } from '../../services/realtimeService';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { formatDateTime } from '../../utils/formatters';
import { 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  GraduationCap, 
  Lock, 
  Eye, 
  X, 
  Copy, 
  Check,
  Calendar,
  Sparkles,
  Info,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  MapPin,
  Wifi,
  Monitor,
  Cpu,
  Radio
} from 'lucide-react';
import { formatLocationLabel, formatDeviceLabel } from '../../utils/deviceTracker';

export default function AuditLogsManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [testingLog, setTestingLog] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [realtimeActive, setRealtimeActive] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(200);
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Subscrição Realtime via WebSockets para a trilha de auditoria
    const sub = subscribeToAuditLogs((newLog) => {
      if (!newLog) return;
      setLogs((prev) => {
        if (prev.some((item) => item.id === newLog.id)) {
          return prev;
        }
        return [newLog, ...prev];
      });
      setRealtimeActive(true);
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    };
  }, []);

  // Mapeamento visual das ações para badges e ícones temáticos
  const getActionBadge = (action = '') => {
    const act = String(action).toUpperCase();
    if (act.includes('PAYMENT_APPROVED')) return { bg: 'badge-success', label: 'Pagamento Aprovado', category: 'finance' };
    if (act.includes('PAYMENT_REJECTED')) return { bg: 'badge-danger', label: 'Pagamento Rejeitado', category: 'finance' };
    if (act.includes('PAYMENT')) return { bg: 'badge-info', label: 'Operação de Pagamento', category: 'finance' };
    if (act.includes('CERTIFICATE_ISSUED')) return { bg: 'badge-success', label: 'Certificado Emitido', category: 'academic' };
    if (act.includes('CERTIFICATE_REVOKED')) return { bg: 'badge-danger', label: 'Certificado Revogado', category: 'academic' };
    if (act.includes('GRADE_MODIFIED')) return { bg: 'badge-warning', label: 'Nota Retificada', category: 'academic' };
    if (act.includes('STUDENT_SUSPENDED')) return { bg: 'badge-warning', label: 'Estudante Suspenso', category: 'student' };
    if (act.includes('STUDENT_REACTIVATED')) return { bg: 'badge-success', label: 'Estudante Reativado', category: 'student' };
    if (act.includes('STUDENT_DELETED')) return { bg: 'badge-danger', label: 'Estudante Eliminado', category: 'student' };
    if (act.includes('STUDENT_REGISTERED')) return { bg: 'badge-info', label: 'Novo Registo Aluno', category: 'student' };
    if (act.includes('ENROLLMENT_APPROVED')) return { bg: 'badge-success', label: 'Matrícula Aprovada', category: 'student' };
    if (act.includes('ENROLLMENT_REJECTED')) return { bg: 'badge-danger', label: 'Matrícula Rejeitada', category: 'student' };
    if (act.includes('CLASS_CREATED')) return { bg: 'badge-info', label: 'Turma Criada', category: 'academic' };
    if (act.includes('CLASS_UPDATED')) return { bg: 'badge-info', label: 'Turma Atualizada', category: 'academic' };
    if (act.includes('CLASS_DELETED')) return { bg: 'badge-danger', label: 'Turma Eliminada', category: 'academic' };
    if (act.includes('COURSE_CREATED')) return { bg: 'badge-info', label: 'Curso Criado', category: 'academic' };
    if (act.includes('COURSE_UPDATED')) return { bg: 'badge-info', label: 'Curso Atualizado', category: 'academic' };
    if (act.includes('COURSE_DELETED')) return { bg: 'badge-danger', label: 'Curso Eliminado', category: 'academic' };
    if (act.includes('TEACHER_CREATED') || act.includes('TEACHER_ACCOUNT')) return { bg: 'badge-info', label: 'Formador Registado', category: 'teacher' };
    if (act.includes('TEACHER_UPDATED')) return { bg: 'badge-info', label: 'Formador Atualizado', category: 'teacher' };
    if (act.includes('TEACHER_DELETED')) return { bg: 'badge-danger', label: 'Formador Eliminado', category: 'teacher' };
    if (act.includes('TEACHER_CREDENTIALS')) return { bg: 'badge-warning', label: 'Credenciais Formador', category: 'security' };
    if (act.includes('PASSWORD_RESET')) return { bg: 'badge-warning', label: 'Recuperação de Senha', category: 'security' };
    if (act.includes('ADMIN_LOGIN') || act.includes('USER_LOGIN') || act.includes('TEACHER_LOGIN')) return { bg: 'badge-info', label: 'Início de Sessão', category: 'security' };
    if (act.includes('USER_HEARTBEAT')) return { bg: 'badge-info', label: 'Presença do Utilizador', category: 'security' };
    if (act.includes('SETTINGS_UPDATED')) return { bg: 'badge-success', label: 'Configurações Gravadas', category: 'system' };
    if (act.includes('ENROLLMENT_NOTICE_BROADCAST')) return { bg: 'badge-info', label: 'Divulgação em Massa', category: 'system' };
    if (act.includes('AUDIT_INTEGRITY_CHECK') || act.includes('SYSTEM_AUDIT')) return { bg: 'badge-success', label: 'Verificação de Integridade', category: 'system' };
    if (act.includes('TEST_INSERT') || act.includes('TEST_AUTH')) return { bg: 'badge-warning', label: 'Teste de Autenticação Técnica', category: 'system' };

    // Formatação elegante para ações técnicas não catalogadas
    const formatted = String(action || 'Operação Registada')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
    return { bg: 'badge-info', label: formatted, category: 'general' };
  };

  // Resumo amigável de dispositivo e localização para apresentação na tabela e cartões
  const formatDeviceLocationSummary = (log) => {
    const tel = log.telemetry || log.details?.telemetry;
    const ip = log.ip_address || tel?.ip;
    
    if (tel) {
      const devSummary = tel.device?.brand ? `${tel.device.brand} ${tel.device.model || ''}`.trim() : (tel.device?.device_type || 'Dispositivo');
      const locSummary = tel.location?.city ? `${tel.location.country_flag ? tel.location.country_flag + ' ' : ''}${tel.location.city}` : (tel.location?.country || '');
      const parts = [devSummary];
      if (locSummary) parts.push(locSummary);
      else if (ip && ip !== 'Acesso Direto') parts.push(ip);
      return parts.join(' • ');
    }
    
    if (ip && ip !== 'Acesso Direto' && ip !== 'Local / Desconhecido') return `IP: ${ip}`;
    return null;
  };

  // Deduplicação estrita na camada de visualização (garante zero repetições)
  const deduplicatedLogs = useMemo(() => {
    const seenIds = new Set();
    const seenSignatures = new Set();
    return (logs || []).filter(log => {
      if (log.id && seenIds.has(log.id)) return false;
      if (log.id) seenIds.add(log.id);

      const timeMs = log.created_at ? new Date(log.created_at).getTime() : 0;
      const timeBlock = Math.floor(timeMs / 3500);
      const sig = `${log.action}|${log.user_email || log.user_name || ''}|${log.resource_type || log.entity || ''}|${log.resource_id || log.entity_id || ''}|${timeBlock}`;
      if (seenSignatures.has(sig)) return false;
      seenSignatures.add(sig);

      return true;
    });
  }, [logs]);

  // Estatísticas calculadas
  const metrics = useMemo(() => {
    let financeCount = 0;
    let academicCount = 0;
    let studentCount = 0;
    let securityCount = 0;

    deduplicatedLogs.forEach(l => {
      const act = String(l.action || '').toUpperCase();
      if (act.includes('PAYMENT') || act.includes('RECEIPT')) financeCount++;
      else if (act.includes('GRADE') || act.includes('CLASS') || act.includes('COURSE') || act.includes('CERTIFICATE')) academicCount++;
      else if (act.includes('STUDENT') || act.includes('ENROLLMENT')) studentCount++;
      else if (act.includes('PASSWORD') || act.includes('LOGIN') || act.includes('TEACHER_CREDENTIALS') || act.includes('HEARTBEAT')) securityCount++;
    });

    return {
      total: deduplicatedLogs.length,
      finance: financeCount,
      academic: academicCount,
      student: studentCount,
      security: securityCount
    };
  }, [deduplicatedLogs]);

  // Filtragem e ordenação
  const filteredLogs = useMemo(() => {
    return deduplicatedLogs
      .filter(log => {
        // Filtro por Categoria de Ação
        if (actionFilter !== 'all') {
          const act = String(log.action || '').toUpperCase();
          if (actionFilter === 'PAYMENT' && !act.includes('PAYMENT') && !act.includes('RECEIPT')) return false;
          if (actionFilter === 'STUDENT' && !act.includes('STUDENT') && !act.includes('ENROLLMENT')) return false;
          if (actionFilter === 'GRADE' && !act.includes('GRADE') && !act.includes('EVALUATION')) return false;
          if (actionFilter === 'CERTIFICATE' && !act.includes('CERTIFICATE')) return false;
          if (actionFilter === 'CLASS' && !act.includes('CLASS')) return false;
          if (actionFilter === 'COURSE' && !act.includes('COURSE')) return false;
          if (actionFilter === 'TEACHER' && !act.includes('TEACHER')) return false;
          if (actionFilter === 'SETTINGS' && !act.includes('SETTINGS') && !act.includes('BROADCAST')) return false;
          if (actionFilter === 'SECURITY' && !act.includes('PASSWORD') && !act.includes('LOGIN') && !act.includes('AUTH') && !act.includes('HEARTBEAT')) return false;
        }

        // Filtro por Status
        if (statusFilter !== 'all') {
          const isError = log.status === 'erro' || log.status === 'falha';
          if (statusFilter === 'sucesso' && isError) return false;
          if (statusFilter === 'erro' && !isError) return false;
        }

        // Pesquisa de Texto
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const actionStr = (log.action || '').toLowerCase();
          const descStr = (log.description || '').toLowerCase();
          const userStr = (log.user_name || '').toLowerCase();
          const emailStr = (log.user_email || '').toLowerCase();
          const resStr = (log.resource_type || log.entity || '').toLowerCase();
          const resIdStr = (log.resource_id || log.entity_id || '').toLowerCase();

          const matchesSearch = 
            actionStr.includes(term) || 
            descStr.includes(term) || 
            userStr.includes(term) || 
            emailStr.includes(term) || 
            resStr.includes(term) ||
            resIdStr.includes(term);

          if (!matchesSearch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, actionFilter, statusFilter, searchTerm, sortOrder]);

  // Exportação para ficheiro CSV com suporte a UTF-8 para Excel
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Nenhum registo disponível para exportação.');
      return;
    }

    const headers = [
      'Data e Hora',
      'Autor da Ação',
      'Email do Autor',
      'Ação Executada',
      'Descrição do Evento',
      'Endereço IP',
      'Dispositivo (Marca/Modelo)',
      'Sistema Operativo & Navegador',
      'Localização (Cidade/País)',
      'Operadora (ISP)',
      'Fuso Horário',
      'Entidade / Recurso',
      'ID do Recurso',
      'Status da Operação',
      'Detalhes Técnicos'
    ];

    const rows = filteredLogs.map(l => {
      const detailsStr = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '';
      const tel = l.telemetry || l.details?.telemetry;
      const ip = l.ip_address || tel?.ip || '—';
      const devStr = tel?.device ? `${tel.device.brand || ''} ${tel.device.model || ''} (${tel.device.device_type || ''})`.trim() : '—';
      const osBrowser = tel?.device ? `${tel.device.os || ''} / ${tel.device.browser || ''}`.trim() : '—';
      const locStr = tel?.location ? `${tel.location.city || ''}, ${tel.location.country || ''}`.trim() : '—';
      const ispStr = tel?.location?.isp || '—';
      const tzStr = tel?.timezone ? `${tel.timezone.timezone} (${tel.timezone.utc_offset})` : '—';

      return [
        `"${formatDateTime(l.created_at)}"`,
        `"${(l.user_name || 'Administrador').replace(/"/g, '""')}"`,
        `"${(l.user_email || '—').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${ip}"`,
        `"${devStr.replace(/"/g, '""')}"`,
        `"${osBrowser.replace(/"/g, '""')}"`,
        `"${locStr.replace(/"/g, '""')}"`,
        `"${ispStr.replace(/"/g, '""')}"`,
        `"${tzStr.replace(/"/g, '""')}"`,
        `"${(l.resource_type || l.entity || 'system').replace(/"/g, '""')}"`,
        `"${(l.resource_id || l.entity_id || '—').replace(/"/g, '""')}"`,
        `"${l.status === 'erro' ? 'Falha' : 'Sucesso'}"`,
        `"${detailsStr}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_zatyacademy_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Disparo de teste para verificar gravação em tempo real
  const handleCreateTestLog = async () => {
    setTestingLog(true);
    try {
      const res = await recordAuditLog({
        action: 'AUDIT_INTEGRITY_CHECK',
        description: 'Verificação periódica de integridade da trilha de auditoria executada com sucesso.',
        resourceType: 'system_audit',
        resourceId: `check_${Date.now()}`,
        status: 'sucesso',
        details: {
          timestamp: new Date().toISOString(),
          navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconhecido',
          integridade: '100% OK'
        }
      });

      setToastMsg('Registo de teste gravado na trilha de auditoria com sucesso!');
      setTimeout(() => setToastMsg(''), 4500);
      await fetchLogs();
    } catch (err) {
      alert('Falha ao registar teste: ' + err.message);
    } finally {
      setTestingLog(false);
    }
  };

  const handleCopyDetails = (details) => {
    if (!details) return;
    navigator.clipboard.writeText(typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        
        {/* CABEÇALHO DO MÓDULO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{
                background: 'rgba(0, 199, 253, 0.15)',
                border: '1px solid rgba(0, 199, 253, 0.35)',
                borderRadius: '8px',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00C7FD'
              }}>
                <History size={22} />
              </div>
              <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Trilha de Auditoria & Segurança
              </h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem', margin: 0 }}>
              Registo cronológico e imutável de todas as ações administrativas, financeiras, pedagógicas e de autenticação.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '999px',
                background: realtimeActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                border: realtimeActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)',
                color: realtimeActive ? '#34D399' : '#94A3B8',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
              title="Sincronização em tempo real via WebSockets ativa"
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: realtimeActive ? '#10B981' : '#94A3B8',
                boxShadow: realtimeActive ? '0 0 8px #10B981' : 'none',
                display: 'inline-block'
              }}></span>
              <span>{realtimeActive ? 'Ao Vivo' : 'Offline'}</span>
            </div>

            <button 
              onClick={handleCreateTestLog} 
              disabled={testingLog || loading} 
              className="btn btn-secondary mobile-btn-full"
              style={{ fontSize: '0.825rem', padding: '0.55rem 0.95rem' }}
              title="Gera um registo de integridade para confirmar o funcionamento em tempo real"
            >
              <Sparkles size={15} color="#00C7FD" />
              <span>{testingLog ? 'A Registar...' : 'Verificar Trilha'}</span>
            </button>

            <button 
              onClick={handleExportCSV} 
              disabled={filteredLogs.length === 0} 
              className="btn btn-secondary mobile-btn-full"
              style={{ fontSize: '0.825rem', padding: '0.55rem 0.95rem' }}
              title="Baixar ficheiro CSV com os dados filtrados"
            >
              <Download size={15} />
              <span>Exportar CSV</span>
            </button>

            <button 
              onClick={fetchLogs} 
              disabled={loading} 
              className="btn btn-primary mobile-btn-full"
              style={{ fontSize: '0.825rem', padding: '0.55rem 1.15rem' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'A Atualizar...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK DE SUCESSO / TOAST */}
        {toastMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '6px',
            padding: '0.8rem 1.15rem',
            color: '#34D399',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* CARTÕES DE MÉTRICAS RÁPIDAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Card 1: Total de Logs */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(0, 199, 253, 0.15)',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00C7FD',
              flexShrink: 0
            }}>
              <History size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                {metrics.total}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                Total de Registos
              </div>
            </div>
          </div>

          {/* Card 2: Finanças */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
              flexShrink: 0
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                {metrics.finance}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                Operações Financeiras
              </div>
            </div>
          </div>

          {/* Card 3: Académico & Alunos */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24',
              flexShrink: 0
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                {metrics.academic + metrics.student}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                Atividades Pedagógicas
              </div>
            </div>
          </div>

          {/* Card 4: Segurança & Acesso */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C084FC',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
                {metrics.security}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                Segurança & Sessões
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS E BUSCA AVANÇADA */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Campo de Busca Rápida */}
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por autor, e-mail, ação, descrição ou ID..."
                className="form-input"
                style={{ paddingLeft: '2.35rem', fontSize: '0.85rem' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filtro por Categoria */}
            <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">Todas as Categorias</option>
                <option value="PAYMENT">💳 Pagamentos & Finanças</option>
                <option value="STUDENT">🎓 Estudantes & Matrículas</option>
                <option value="GRADE">📊 Notas & Avaliações</option>
                <option value="CERTIFICATE">📜 Certificados Digitais</option>
                <option value="CLASS">👥 Turmas & Horários</option>
                <option value="COURSE">💻 Cursos Formativos</option>
                <option value="TEACHER">👨‍🏫 Formadores & Acessos</option>
                <option value="SETTINGS">⚙️ Configurações do Sistema</option>
                <option value="SECURITY">🛡️ Segurança & Autenticação</option>
              </select>
            </div>

            {/* Filtro por Status */}
            <div style={{ flex: '0 1 140px', minWidth: '130px' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">Status: Todos</option>
                <option value="sucesso">✓ Sucesso</option>
                <option value="erro">✗ Falhas</option>
              </select>
            </div>

            {/* Ordenação por Data */}
            <div style={{ flex: '0 1 150px', minWidth: '140px' }}>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="desc">Mais Recentes</option>
                <option value="asc">Mais Antigos</option>
              </select>
            </div>

            {/* Botão Limpar Filtros */}
            {(searchTerm || actionFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('all');
                  setStatusFilter('all');
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
              >
                <X size={14} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* TABELA PRINCIPAL DE AUDITORIA */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
              <RefreshCw size={28} color="#00C7FD" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.85rem auto' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>A sincronizar trilha de auditoria...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
              <History size={40} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <h3 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '0.35rem' }}>Nenhum registo encontrado</h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {searchTerm || actionFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Nenhum registo coincide com os filtros selecionados.' 
                  : 'Ainda não existem registos de auditoria nesta conta.'}
              </p>
            </div>
          ) : (
            <>
              {/* Visualização em Tabela para Desktop */}
              <div className="desktop-only-table table-responsive">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Data / Hora</th>
                      <th style={{ width: '220px' }}>Autor da Ação</th>
                      <th style={{ width: '180px' }}>Ação Executada</th>
                      <th>Descrição do Evento</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => {
                      const badge = getActionBadge(log.action);
                      const authorName = log.user_name || 'Administrador';
                      const authorEmail = log.user_email || 'admin@zatyacademy.co.mz';
                      const isError = log.status === 'erro' || log.status === 'falha';

                      return (
                        <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: '#CBD5E1' }}>
                            <div style={{ fontWeight: '600' }}>{formatDateTime(log.created_at)}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <div style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                background: 'rgba(0, 114, 206, 0.25)', 
                                border: '1px solid rgba(0, 199, 253, 0.35)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#00C7FD', 
                                fontSize: '0.75rem', 
                                fontWeight: '700',
                                flexShrink: 0
                              }}>
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {authorName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {authorEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${badge.bg}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.84rem' }}>
                            <div style={{ color: '#E2E8F0', fontWeight: '600', lineHeight: 1.35 }}>
                              {log.description && log.description !== log.action ? log.description : badge.label}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#00C7FD', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ textTransform: 'capitalize' }}>Recurso: {log.resource_type || log.entity || 'sistema'}</span>
                              {(log.resource_id || log.entity_id) && (
                                <span style={{ color: '#64748B' }}>
                                  (ID: {String(log.resource_id || log.entity_id).substring(0, 8)}...)
                                </span>
                              )}
                              {formatDeviceLocationSummary(log) && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  background: 'rgba(0, 199, 253, 0.12)',
                                  border: '1px solid rgba(0, 199, 253, 0.25)',
                                  color: '#38BDF8',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: '600'
                                }}>
                                  {formatDeviceLocationSummary(log)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: isError ? '#F87171' : '#34D399',
                              background: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                            }}>
                              {isError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                              {isError ? 'Falha' : 'Sucesso'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Eye size={13} color="#00C7FD" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Visualização em Cartões para Mobile */}
              <div className="mobile-only-cards">
                {filteredLogs.map(log => {
                  const badge = getActionBadge(log.action);
                  const authorName = log.user_name || 'Administrador';
                  const authorEmail = log.user_email || 'admin@zatyacademy.co.mz';
                  const isError = log.status === 'erro' || log.status === 'falha';

                  return (
                    <div 
                      key={log.id} 
                      className="mobile-entity-card" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span className={`badge ${badge.bg}`} style={{ fontSize: '0.72rem' }}>
                          {badge.label}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: isError ? '#F87171' : '#34D399',
                          background: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                        }}>
                          {isError ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                          {isError ? 'Falha' : 'Sucesso'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                        {log.description && log.description !== log.action ? log.description : badge.label}
                      </div>

                      <div className="mobile-card-meta">
                        <div>
                          <span className="meta-label">Autor</span>
                          <span className="meta-value">{authorName}</span>
                        </div>
                        <div>
                          <span className="meta-label">Data / Hora</span>
                          <span className="meta-value">{formatDateTime(log.created_at)}</span>
                        </div>
                        <div>
                          <span className="meta-label">Recurso</span>
                          <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                            {log.resource_type || log.entity || 'Sistema'}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">E-mail</span>
                          <span className="meta-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{authorEmail}</span>
                        </div>
                        {formatDeviceLocationSummary(log) && (
                          <div style={{ gridColumn: '1 / -1', background: 'rgba(0, 199, 253, 0.08)', padding: '0.4rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(0, 199, 253, 0.2)' }}>
                            <span className="meta-label">Dispositivo & Origem</span>
                            <span className="meta-value" style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: '600' }}>
                              {formatDeviceLocationSummary(log)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={13} color="#00C7FD" />
                          <span>Ver Detalhes Completos</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* MODAL INTERATIVO DE DETALHES TÉCNICOS */}
        {selectedLog && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 10, 20, 0.8)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setSelectedLog(null)}
          >
            <div 
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
                border: '1px solid rgba(0, 199, 253, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Cabeçalho do Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(0, 199, 253, 0.15)',
                    border: '1px solid rgba(0, 199, 253, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00C7FD'
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                      Registo de Auditoria
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                      ID Único: <code style={{ color: '#00C7FD' }}>{selectedLog.id}</code>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#CBD5E1',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Informações Centrais em Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                    Ação Executada
                  </span>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#00C7FD' }}>
                    {selectedLog.action}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                    Data & Hora
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#FFFFFF' }}>
                    {formatDateTime(selectedLog.created_at)}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                    Status da Operação
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: selectedLog.status === 'erro' ? '#F87171' : '#34D399'
                  }}>
                    {selectedLog.status === 'erro' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    {selectedLog.status === 'erro' ? 'Falha / Erro' : 'Executado com Sucesso'}
                  </span>
                </div>
              </div>

              {/* Informações do Autor e Recurso */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                    👤 Autor da Ação
                  </span>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFFFFF' }}>
                    {selectedLog.user_name || 'Administrador'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                    {selectedLog.user_email || '—'}
                  </div>
                  {selectedLog.user_id && (
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem' }}>
                      UID: {selectedLog.user_id}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                    🎯 Recurso Afetado
                  </span>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFFFFF', textTransform: 'capitalize' }}>
                    Entidade: {selectedLog.resource_type || selectedLog.entity || 'Sistema'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#00C7FD', marginTop: '0.15rem', wordBreak: 'break-all' }}>
                    ID: {selectedLog.resource_id || selectedLog.entity_id || 'Global'}
                  </div>
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(0, 163, 224, 0.2)', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                  📝 Descrição da Operação
                </span>
                <div style={{ fontSize: '0.88rem', color: '#FFFFFF', lineHeight: 1.45 }}>
                  {selectedLog.description || selectedLog.action}
                </div>
              </div>

              {/* RASTREIO E TELEMETRIA FORENSE DE ACESSO */}
              {(() => {
                const tel = selectedLog.telemetry || selectedLog.details?.telemetry || null;
                const ip = selectedLog.ip_address || tel?.ip || null;
                const dev = tel?.device || null;
                const loc = tel?.location || null;
                const tz = tel?.timezone || null;
                const hasInfo = !!(tel || (ip && ip !== 'Acesso Direto' && ip !== 'Local / Desconhecido'));

                if (!hasInfo) return null;

                return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 24, 48, 0.95), rgba(0, 40, 80, 0.85))',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid rgba(0, 199, 253, 0.35)',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <ShieldCheck size={18} color="#00C7FD" />
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Rastreio de Acesso e Telemetria Forense
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {/* 1. Aparelho e Hardware */}
                      <div style={{ background: 'rgba(0, 10, 20, 0.55)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          <Smartphone size={14} />
                          <span>Aparelho & Ecrã</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#FFFFFF' }}>
                          {dev ? `${dev.brand} ${dev.model || ''}`.trim() : 'Dispositivo Web'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Tipo: <span style={{ color: '#E2E8F0' }}>{dev?.device_type || 'N/A'}</span>
                        </div>
                        {dev?.screen_resolution && dev.screen_resolution !== 'N/A' && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                            Resolução: {dev.screen_resolution} {dev.orientation ? `(${dev.orientation})` : ''}
                          </div>
                        )}
                      </div>

                      {/* 2. Sistema & Navegador */}
                      <div style={{ background: 'rgba(0, 10, 20, 0.55)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          <Laptop size={14} />
                          <span>Sistema & Navegador</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#FFFFFF' }}>
                          {dev?.os || 'Sistema Operativo'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Navegador: <span style={{ color: '#E2E8F0' }}>{dev?.browser || 'Browser Web'}</span>
                        </div>
                        {tz?.language && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                            Idioma: {tz.language}
                          </div>
                        )}
                      </div>

                      {/* 3. Localização Geográfica */}
                      <div style={{ background: 'rgba(0, 10, 20, 0.55)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          <MapPin size={14} />
                          <span>Localização Geográfica (IP)</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{loc?.country_flag || '🇲🇿'}</span>
                          <span>{loc?.city ? `${loc.city}, ${loc.country || 'Moçambique'}` : (loc?.country || 'Moçambique')}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Província/Região: <span style={{ color: '#E2E8F0' }}>{loc?.region || 'Província de Maputo'}</span>
                        </div>
                        {loc?.latitude && loc?.longitude && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                            Coordenadas: {Number(loc.latitude).toFixed(2)}, {Number(loc.longitude).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* 4. Rede, Conexão e Fuso Horário */}
                      <div style={{ background: 'rgba(0, 10, 20, 0.55)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          <Wifi size={14} />
                          <span>Conexão & Fuso Horário</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#FFFFFF' }}>
                          IP: <code style={{ color: '#00C7FD', fontSize: '0.82rem' }}>{ip || 'Local / Protegido'}</code>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Operadora (ISP): <span style={{ color: '#E2E8F0' }}>{loc?.isp || 'Rede Local'}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                          Fuso: {tz?.timezone || 'Africa/Maputo'} ({tz?.utc_offset || 'GMT+2'})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Detalhes Técnicos JSON */}
              {selectedLog.details && (
                <div style={{ background: 'rgba(0, 15, 30, 0.85)', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(0, 163, 224, 0.25)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#00C7FD', textTransform: 'uppercase', fontWeight: '700' }}>
                      ⚙️ Dados Técnicos Estruturados (JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyDetails(selectedLog.details)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {copiedJson ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedJson ? 'Copiado!' : 'Copiar JSON'}</span>
                    </button>
                  </div>

                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.76rem',
                    color: '#93C5FD',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    maxHeight: '180px',
                    lineHeight: '1.4'
                  }}>
                    {typeof selectedLog.details === 'object' ? JSON.stringify(selectedLog.details, null, 2) : String(selectedLog.details)}
                  </pre>
                </div>
              )}

              {/* Rodapé do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

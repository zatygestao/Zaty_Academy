import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { getAdminDashboardStats, getPayments, getPasswordResetHistory } from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import PaymentReviewModal from '../../components/admin/PaymentReviewModal';
import OnlineStudentsModal from '../../components/admin/OnlineStudentsModal';
import { formatCurrency, formatDateTime, getStatusBadgeInfo } from '../../utils/formatters';
import { 
  Users, 
  CreditCard, 
  Award, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  Activity,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  Megaphone,
  FileText,
  ArrowRight,
  ExternalLink,
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingStudents: 0,
    onlineStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalClasses: 0,
    openClasses: 0,
    pendingPaymentsCount: 0,
    approvedPaymentsCount: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    issuedCertificates: 0,
    totalPasswordResets: 0,
    pendingPasswordResets: 0,
    totalEvaluations: 0,
    totalGradesCount: 0
  });

  const [pendingPayments, setPendingPayments] = useState([]);
  const [resetHistory, setResetHistory] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, paymentsData, resetsData] = await Promise.all([
        getAdminDashboardStats(),
        getPayments({ status: 'pendente' }),
        getPasswordResetHistory(6)
      ]);
      if (statsData) setStats(statsData);
      setPendingPayments(paymentsData || []);
      setResetHistory(resetsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Atualização automática ao retornar o foco ou quando houver alterações em outras abas
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleFocus);
    };
  }, []);

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Painel de Controlo Administrativo
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Gestão centralizada de estudantes, formações, finanças e certificações da Zaty Academy.
            </p>
          </div>

          <Link to="/admin/pagamentos" className="btn btn-primary mobile-btn-full">
            <CreditCard size={16} />
            VER TODOS OS PAGAMENTOS
          </Link>
        </div>

        {/* BANNER DE INSCRIÇÕES ABERTAS - STATUS ADMINISTRATIVO */}
        {(() => {
          const isEnrollmentOpen = settings?.academic?.enrollment_notice_enabled === true;
          if (!isEnrollmentOpen) return null;

          const enrollmentTitle = settings?.academic?.enrollment_notice_title || 'Inscrições Abertas';
          const enrollmentPeriod = settings?.academic?.enrollment_period || 'Consulte o edital oficial';

          return (
            <div 
              className="glass-card" 
              style={{ 
                marginBottom: '1.5rem', 
                padding: '1.15rem 1.4rem', 
                border: isEnrollmentOpen ? '1px solid rgba(0, 199, 253, 0.45)' : '1px dashed rgba(148, 163, 184, 0.25)',
                background: isEnrollmentOpen 
                  ? 'linear-gradient(90deg, rgba(0, 114, 206, 0.18) 0%, rgba(0, 24, 48, 0.75) 100%)' 
                  : 'rgba(0, 24, 48, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', flex: 1 }}>
                <div 
                  style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '8px', 
                    background: isEnrollmentOpen ? 'rgba(0, 199, 253, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: isEnrollmentOpen ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                    flexShrink: 0
                  }}
                >
                  <Megaphone size={20} color={isEnrollmentOpen ? '#00C7FD' : '#94A3B8'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: isEnrollmentOpen ? '#00C7FD' : '#94A3B8', fontSize: '0.9rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      {isEnrollmentOpen ? '📢 Inscrições Abertas no Portal: ATIVAS' : '⚪ Inscrições Abertas: DESATIVADAS'}
                    </strong>
                    {isEnrollmentOpen ? (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        Visível no Portal & Painel dos Estudantes
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' }}>
                        Inativo
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '0.84rem', marginTop: '0.2rem' }}>
                    {isEnrollmentOpen ? (
                      <span><strong>{enrollmentTitle}</strong> &bull; Período Oficial: <span style={{ color: '#00C7FD' }}>{enrollmentPeriod}</span></span>
                    ) : (
                      <span>O edital e os avisos de inscrições abertas estão desativados. Ative nas configurações para publicar no portal.</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {isEnrollmentOpen && (
                  <Link 
                    to="/inscricoes-abertas" 
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
                  >
                    <ExternalLink size={14} />
                    <span>Ver Edital Público</span>
                  </Link>
                )}
                <Link 
                  to="/admin/configuracoes" 
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
                >
                  <Settings size={14} />
                  <span>{isEnrollmentOpen ? 'Configurar / Transmitir' : 'Ativar Inscrições'}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* CARDS DE INDICADORES PRINCIPAIS */}
        <div className="grid-4 mobile-metric-grid-2x2" style={{ marginBottom: '1.25rem' }}>
          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Estudantes</span>
              <Users size={18} color="#00C7FD" />
            </div>
            <div className="stat-val" style={{ color: '#FFFFFF' }}>{stats.totalStudents}</div>
            <div style={{ fontSize: '0.74rem', color: '#10B981', marginTop: '0.2rem' }}>
              {stats.activeStudents} ativos | {stats.pendingStudents} pendentes
            </div>
          </div>

          {/* NOVO CARD: ESTUDANTES COM SESSÃO ATIVA / ONLINE */}
          <div 
            className="glass-card mobile-metric-card" 
            onClick={() => setIsOnlineModalOpen(true)}
            style={{ 
              cursor: 'pointer',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}
            title="Clique para visualizar os estudantes online em tempo real"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sessões Ativas</span>
              <Activity size={18} color="#10B981" />
            </div>
            <div className="stat-val" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
              {stats.onlineStudents}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#00C7FD', marginTop: '0.2rem' }}>
              Ver lista em tempo real →
            </div>
          </div>

          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pag. Pendentes</span>
              <Clock size={18} color="#00C7FD" />
            </div>
            <div className="stat-val" style={{ color: '#00C7FD' }}>{stats.pendingPaymentsCount}</div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              {formatCurrency(stats.pendingRevenue)} a conferir
            </div>
          </div>

          <div className="glass-card mobile-metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Receita Total</span>
              <DollarSign size={18} color="#10B981" />
            </div>
            <div className="stat-val" style={{ color: '#10B981' }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              {stats.approvedPaymentsCount} pagamentos
            </div>
          </div>
        </div>

        {/* CARDS SECUNDÁRIOS: AVALIAÇÕES ACADÉMICAS, CERTIFICADOS & RECUPERAÇÃO DE SENHA */}
        <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
          {/* AVALIAÇÕES ACADÉMICAS REGISTADAS */}
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                Avaliações Registadas
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#00C7FD' }}>
                {stats.totalEvaluations}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                {stats.totalGradesCount} nota(s) lançada(s) nas pautas
              </div>
            </div>
            <Link 
              to="/admin/notas" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '6px', 
                background: 'rgba(0, 199, 253, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                textDecoration: 'none'
              }}
              title="Aceder à Gestão Global de Notas & Pautas"
            >
              <ClipboardList size={26} color="#00C7FD" />
            </Link>
          </div>

          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                Certificados Digitais Emitidos
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38BDF8' }}>{stats.issuedCertificates}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>Com autenticação pública por QR Code</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={26} color="#38BDF8" />
            </div>
          </div>

          {/* HISTÓRICO DE PEDIDOS DE RECUPERAÇÃO DE SENHA */}
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                Pedidos de Recuperação de Senha
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#F59E0B' }}>{stats.totalPasswordResets}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                {stats.pendingPasswordResets} pendente(s) | Registro seguro de tokens
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <KeyRound size={26} color="#F59E0B" />
            </div>
          </div>
        </div>

        {/* FILA DE PAGAMENTOS PENDENTES DE APROVAÇÃO */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.05rem, 3vw, 1.2rem)', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Clock size={18} color="#00C7FD" />
                Fila de Pagamentos Pendentes
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                Conferência de comprovativos para emissão do recibo oficial.
              </p>
            </div>

            <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.25)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px' }}>
              {pendingPayments.length} aguardando
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
              A carregar pagamentos...
            </div>
          ) : pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 0.65rem auto' }} />
              <p>Nenhum pagamento pendente no momento. Todos os comprovativos foram processados.</p>
            </div>
          ) : (
            <>
              {/* Versão Desktop: Tabela */}
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudante</th>
                      <th>Contacto</th>
                      <th>Tipo</th>
                      <th>Método</th>
                      <th>Valor</th>
                      <th>Data de Envio</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map(p => (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: '#FFFFFF' }}>{p.student?.full_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#00C7FD', fontFamily: 'monospace' }}>
                            {p.student?.student_code}
                          </div>
                        </td>
                        <td>{p.student?.phone}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.payment_type}</td>
                        <td style={{ textTransform: 'uppercase', fontWeight: '600' }}>
                          <span className="badge" style={{ background: 'rgba(0, 114, 206, 0.2)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.3)', borderRadius: '3px' }}>
                            {p.payment_method}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: '#00C7FD' }}>{formatCurrency(p.amount)}</td>
                        <td>{formatDateTime(p.created_at)}</td>
                        <td>
                          <button 
                            onClick={() => setSelectedPayment(p)}
                            className="btn btn-primary btn-sm"
                          >
                            Conferir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile: Cards Estruturados */}
              <div className="mobile-only-cards">
                {pendingPayments.map(p => (
                  <div key={p.id} className="mobile-entity-card">
                    <div className="mobile-card-header">
                      <div>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                          {p.student?.full_name || 'Estudante'}
                        </strong>
                        <div style={{ fontSize: '0.74rem', color: '#00C7FD', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                          {p.student?.student_code || '—'}
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        Pendente
                      </span>
                    </div>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Valor do Pagamento</span>
                        <span className="meta-value" style={{ color: '#00C7FD', fontWeight: '800', fontSize: '0.925rem' }}>
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Método / Canal</span>
                        <span className="meta-value" style={{ textTransform: 'uppercase', fontWeight: '700' }}>
                          {p.payment_method}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Tipo</span>
                        <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                          {p.payment_type}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Contacto</span>
                        <span className="meta-value">
                          {p.student?.phone || '—'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                      Enviado em: {formatDateTime(p.created_at)}
                    </div>

                    <div className="mobile-card-actions">
                      <button 
                        onClick={() => setSelectedPayment(p)}
                        className="btn btn-primary mobile-action-btn"
                      >
                        Conferir & Validar Pagamento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SECÇÃO: HISTÓRICO RECENTE DE RECUPERAÇÃO DE SENHA */}
        {resetHistory.length > 0 && (
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 'clamp(1.05rem, 3vw, 1.15rem)', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <KeyRound size={17} color="#F59E0B" />
                Histórico de Pedidos de Recuperação de Senha
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                Monitoramento de solicitações de redefinição de credenciais efetuadas no portal.
              </p>
            </div>

            {/* Versão Desktop: Tabela */}
            <div className="desktop-only-table table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>E-mail Solicitante</th>
                    <th>Data / Hora da Solicitação</th>
                    <th>Estado do Pedido</th>
                    <th>Auditoria de Segurança</th>
                  </tr>
                </thead>
                <tbody>
                  {resetHistory.map((rh, idx) => (
                    <tr key={rh.id || idx}>
                      <td>
                        <strong style={{ color: '#FFFFFF' }}>{rh.email}</strong>
                      </td>
                      <td style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(rh.requested_at || rh.created_at)}
                      </td>
                      <td>
                        <span className={`badge ${rh.status === 'concluido' ? 'badge-success' : 'badge-warning'}`}>
                          {rh.status === 'concluido' ? 'Senha Redefinida' : 'Link Enviado'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#38BDF8' }}>
                          <ShieldCheck size={13} /> Token Seguro Supabase
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile: Cards */}
            <div className="mobile-only-cards">
              {resetHistory.map((rh, idx) => (
                <div key={rh.id || idx} className="mobile-entity-card">
                  <div className="mobile-card-header">
                    <strong style={{ color: '#FFFFFF', fontSize: '0.885rem', wordBreak: 'break-all' }}>
                      {rh.email}
                    </strong>
                    <span className={`badge ${rh.status === 'concluido' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {rh.status === 'concluido' ? 'Redefinida' : 'Link Enviado'}
                    </span>
                  </div>

                  <div className="mobile-card-meta">
                    <div>
                      <span className="meta-label">Data e Hora</span>
                      <span className="meta-value">
                        {formatDateTime(rh.requested_at || rh.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Segurança</span>
                      <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38BDF8' }}>
                        <ShieldCheck size={12} /> Token Seguro
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <PaymentReviewModal 
        isOpen={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)} 
        payment={selectedPayment} 
        onReviewed={loadData} 
      />

      {isOnlineModalOpen && (
        <OnlineStudentsModal onClose={() => setIsOnlineModalOpen(false)} />
      )}
    </div>
  );
}

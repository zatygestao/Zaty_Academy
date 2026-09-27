import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getTeachers, 
  createTeacher, 
  createTeacherWithAccount, 
  updateTeacher, 
  deleteTeacher,
  suspendTeacher,
  reactivateTeacher,
  regenerateTeacherCredentials,
  getTeacherPendingCredentials
} from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Modal from '../../components/common/Modal';
import TeacherCredentialsModal from '../../components/admin/TeacherCredentialsModal';
import { 
  UserCheck, 
  Plus, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  AlertTriangle,
  Ban
} from 'lucide-react';

export default function TeachersManagement() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais & Estados
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [suspendingTeacher, setSuspendingTeacher] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados de Credenciais
  const [autoGenerateCredentials, setAutoGenerateCredentials] = useState(true);
  const [credentialsModalData, setCredentialsModalData] = useState(null);
  const [generatingForTeacherId, setGeneratingForTeacherId] = useState(null);
  const [confirmRegenerateTeacher, setConfirmRegenerateTeacher] = useState(null);
  const [loadingCredentialsId, setLoadingCredentialsId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    is_active: true
  });

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await getTeachers();
      setTeachers(data || []);
    } catch (err) {
      console.error('Erro ao carregar formadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setErrorMsg('');
    setAutoGenerateCredentials(true);
    setForm({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      bio: '',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setErrorMsg('');
    setForm({
      name: t.name || t.full_name || '',
      email: t.email || '',
      phone: t.phone || '',
      specialty: t.specialty || '',
      bio: t.bio || '',
      is_active: t.is_active !== undefined ? t.is_active : true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || (!autoGenerateCredentials && !editingTeacher && !form.email.trim()) || (editingTeacher && !form.email.trim()) || !form.specialty.trim()) {
      setErrorMsg('Por favor preencha o Nome e Especialidade do formador.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          name: form.name.trim(),
          full_name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          specialty: form.specialty.trim(),
          bio: form.bio.trim() || null,
          is_active: form.is_active
        });
        setSuccessMsg('Dados do formador atualizados com sucesso!');
        setShowModal(false);
        setEditingTeacher(null);
      } else {
        if (autoGenerateCredentials) {
          const result = await createTeacherWithAccount({
            name: form.name.trim(),
            full_name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim() || null,
            specialty: form.specialty.trim(),
            bio: form.bio.trim() || null,
            is_active: form.is_active
          });
          setShowModal(false);
          setEditingTeacher(null);
          setCredentialsModalData({
            teacherName: form.name.trim(),
            credentials: result.credentials
          });
          setSuccessMsg('Formador registado e credenciais temporárias de 48h geradas com sucesso!');
        } else {
          await createTeacher({
            name: form.name.trim(),
            full_name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim() || null,
            specialty: form.specialty.trim(),
            bio: form.bio.trim() || null,
            is_active: form.is_active
          });
          setShowModal(false);
          setEditingTeacher(null);
          setSuccessMsg('Formador registado com sucesso no sistema!');
        }
      }

      setTimeout(() => setSuccessMsg(''), 4000);
      await loadTeachers();
    } catch (err) {
      console.error('Erro ao salvar formador:', err);
      setErrorMsg(err.message || 'Falha ao guardar formador.');
    } finally {
      setSubmitting(false);
    }
  };

  // Visualizar as credenciais temporárias existentes sem gerar outra senha
  const handleViewCredentials = async (t) => {
    const teacherName = t.name || t.full_name || 'Formador';
    setLoadingCredentialsId(t.id);
    try {
      const res = await getTeacherPendingCredentials(t.id);
      if (res && res.isPending) {
        setCredentialsModalData({
          teacherName,
          credentials: res
        });
      } else if (res && res.isConfigured) {
        alert(`A conta do formador "${teacherName}" já foi configurada pelo próprio utilizador. A senha definitiva está protegida e não pode ser visualizada pelo administrador.`);
      } else {
        if (window.confirm(`O formador "${teacherName}" não possui credenciais temporárias pendentes ativas. Deseja gerar novas credenciais provisórias de 48 horas agora?`)) {
          handleRegenerateClick(t);
        }
      }
    } catch (err) {
      console.error('Erro ao consultar credenciais:', err);
      alert('Falha ao consultar credenciais pendentes.');
    } finally {
      setLoadingCredentialsId(null);
    }
  };

  // Abrir diálogo de confirmação explícita para regeneração
  const handleRegenerateClick = (t) => {
    setConfirmRegenerateTeacher(t);
  };

  // Executar regeneração após confirmação explícita
  const executeRegenerateCredentials = async () => {
    if (!confirmRegenerateTeacher) return;
    const t = confirmRegenerateTeacher;
    const teacherName = t.name || t.full_name || 'Formador';

    setGeneratingForTeacherId(t.id);
    setConfirmRegenerateTeacher(null);

    try {
      const res = await regenerateTeacherCredentials(t.id);
      setCredentialsModalData({
        teacherName,
        credentials: res
      });
      setSuccessMsg(`Novas credenciais provisórias de 48 horas geradas para ${teacherName}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await loadTeachers();
    } catch (err) {
      console.error('Erro ao regenerar credenciais:', err);
      alert(`Falha ao regenerar credenciais: ${err.message}`);
    } finally {
      setGeneratingForTeacherId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeacher) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await deleteTeacher(deletingTeacher.id);
      setDeletingTeacher(null);
      setSuccessMsg('Formador removido com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadTeachers();
    } catch (err) {
      console.error('Erro ao eliminar formador:', err);
      alert(err.message || 'Falha ao eliminar formador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSuspendModal = (t) => {
    setSuspendingTeacher(t);
    setSuspensionReason('');
    setErrorMsg('');
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingTeacher) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await suspendTeacher({
        teacherId: suspendingTeacher.id,
        reason: suspensionReason,
        suspendedBy: user?.id
      });
      setSuccessMsg(`Conta do formador ${suspendingTeacher.name || suspendingTeacher.full_name} suspensa com sucesso.`);
      setSuspendingTeacher(null);
      setSuspensionReason('');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadTeachers();
    } catch (err) {
      console.error('Erro ao suspender formador:', err);
      setErrorMsg('Falha ao suspender formador: ' + (err?.message || 'Erro'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickReactivate = async (t) => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      await reactivateTeacher({
        teacherId: t.id,
        reactivatedBy: user?.id
      });
      setSuccessMsg(`Conta do formador ${t.name || t.full_name} reativada com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadTeachers();
    } catch (err) {
      console.error('Erro ao reativar formador:', err);
      setErrorMsg('Falha ao reativar formador: ' + (err?.message || 'Erro'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (t.name || t.full_name || '').toLowerCase();
    const email = (t.email || '').toLowerCase();
    const spec = (t.specialty || '').toLowerCase();
    return name.includes(term) || email.includes(term) || spec.includes(term);
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Corpo Docente & Formadores
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
              Gestão de instrutores especializados em informática e tecnologia da Zaty Academy.
            </p>
          </div>

          <button onClick={openCreateModal} className="btn btn-primary mobile-btn-full">
            <Plus size={16} />
            REGISTAR FORMADOR
          </button>
        </div>

        {/* Mensagens de Sucesso */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '4px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#6EE7B7',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Barra de Pesquisa */}
        <div style={{ marginBottom: '1.25rem', position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, especialidade ou email..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Lista de Formadores */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar corpo docente...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <GraduationCap size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>{searchTerm ? 'Nenhum formador encontrado para esta pesquisa.' : 'Nenhum formador registado ainda.'}</p>
              {!searchTerm && (
                <button onClick={openCreateModal} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  <Plus size={14} /> Registar Primeiro Formador
                </button>
              )}
            </div>
          ) : (
            <div className="grid-3">
              {filteredTeachers.map(t => {
                const displayName = t.name || t.full_name || 'Formador';

                return (
                  <div key={t.id} className="mobile-entity-card" style={{ margin: 0, justifyContent: 'space-between' }}>
                    <div>
                      <div className="mobile-card-header" style={{ marginBottom: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontSize: '1.025rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                              {displayName}
                            </h3>
                            <div style={{ fontSize: '0.78rem', color: '#00C7FD', fontWeight: '600', marginTop: '0.15rem' }}>{t.specialty}</div>
                          </div>
                        </div>
                      </div>

                      {t.bio && (
                        <p style={{ fontSize: '0.825rem', color: '#94A3B8', lineHeight: '1.5', margin: '0 0 0.85rem 0' }}>
                          {t.bio}
                        </p>
                      )}

                      <div className="mobile-card-meta" style={{ marginBottom: '0.75rem' }}>
                        <div>
                          <span className="meta-label">E-mail</span>
                          <span className="meta-value" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
                            {t.email}
                          </span>
                        </div>
                        <div>
                          <span className="meta-label">Telefone</span>
                          <span className="meta-value">
                            {t.phone || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Status de Acesso e Credenciais */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', fontSize: '0.74rem', flexWrap: 'wrap' }}>
                        {(() => {
                          const isSuspended = t.status === 'suspenso' || t.is_active === false || t.is_blocked === true;
                          if (isSuspended) {
                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.18)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.45)', fontWeight: '700' }} title={t.suspension_reason ? `Motivo: ${t.suspension_reason}` : 'Conta suspensa pela administração'}>
                                <Ban size={12} /> Conta Suspensa
                              </span>
                            );
                          }
                          if (t.user_id && !t.must_change_password) {
                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: '600' }}>
                                <ShieldCheck size={12} /> Conta Definitiva Ativa
                              </span>
                            );
                          }
                          if (t.must_change_password) {
                            const isExpired = t.temporary_credentials_expires_at && (new Date() > new Date(t.temporary_credentials_expires_at));
                            return isExpired ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: '700' }} title="Prazo de 48h expirou. Clique em Regenerar para emitir novo prazo.">
                                <AlertTriangle size={12} /> Expirado (48h)
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(0, 163, 224, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 163, 224, 0.35)', fontWeight: '600' }}>
                                <KeyRound size={11} /> Provisório Ativo (48h)
                              </span>
                            );
                          }
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: '600' }}>
                              <Clock size={12} /> Sem Conta Vinculada
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Ações do Formador */}
                    <div className="mobile-card-actions">
                      {/* Se estiver pendente: Ver Credenciais */}
                      {t.must_change_password && (
                        <button 
                          onClick={() => handleViewCredentials(t)}
                          disabled={loadingCredentialsId === t.id}
                          className="btn btn-secondary mobile-action-btn"
                          title="Visualizar a senha temporária pendente atual"
                          style={{ fontSize: '0.78rem', color: '#00C7FD', borderColor: 'rgba(0, 199, 253, 0.4)' }}
                        >
                          <Eye size={13} />
                          {loadingCredentialsId === t.id ? 'A carregar...' : 'Ver Credenciais'}
                        </button>
                      )}

                      {/* Botão Suspender ou Reativar */}
                      {(t.status === 'suspenso' || t.is_active === false || t.is_blocked === true) ? (
                        <button 
                          onClick={() => handleQuickReactivate(t)}
                          disabled={submitting}
                          className="btn btn-secondary mobile-action-btn"
                          title="Reativar acesso do formador ao sistema"
                          style={{ fontSize: '0.78rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Reativar</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenSuspendModal(t)}
                          disabled={submitting}
                          className="btn btn-secondary mobile-action-btn"
                          title="Suspender acesso do formador ao sistema"
                          style={{ fontSize: '0.78rem', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                        >
                          <Ban size={13} />
                          <span>Suspender</span>
                        </button>
                      )}

                      {/* Botão Regenerar Credenciais */}
                      <button 
                        onClick={() => handleRegenerateClick(t)}
                        disabled={generatingForTeacherId === t.id}
                        className="btn btn-secondary mobile-action-btn"
                        title={t.must_change_password ? "Invalidar a senha temporária atual e gerar uma nova" : "Gerar novo acesso temporário de 48 horas"}
                        style={{ fontSize: '0.78rem', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        <RefreshCw size={13} className={generatingForTeacherId === t.id ? 'animate-spin' : ''} />
                        {generatingForTeacherId === t.id ? 'A processar...' : (t.user_id ? 'Regenerar' : 'Criar Acesso')}
                      </button>

                      <button 
                        onClick={() => openEditModal(t)}
                        className="btn btn-secondary mobile-action-btn"
                        title="Editar Formador"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => setDeletingTeacher(t)}
                        className="btn btn-danger mobile-action-btn"
                        title="Remover Formador"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL CRIAR / EDITAR FORMADOR */}
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={editingTeacher ? "Editar Dados do Formador" : "Registar Novo Formador"} 
          maxWidth="520px"
        >
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '4px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#FCA5A5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome Completo do Formador *</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Ex: Engenheiro Carlos Manjate"
                required 
                className="form-input" 
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  {autoGenerateCredentials && !editingTeacher ? 'E-mail Provisório (Opcional)' : 'E-mail Institucional / Pessoal *'}
                </label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  placeholder={autoGenerateCredentials && !editingTeacher ? "Opcional (gerado automaticamente se vazio)" : "formador@zatyacademy.co.mz"}
                  required={!autoGenerateCredentials || !!editingTeacher} 
                  className="form-input" 
                />
                {autoGenerateCredentials && !editingTeacher && (
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                    Se não preencher, o sistema gerará um e-mail institucional provisório.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Contacto Telefónico</label>
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                  placeholder="+258 84 000 0000"
                  className="form-input" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Especialidade Principal de Ensino *</label>
              <input 
                type="text" 
                value={form.specialty} 
                onChange={e => setForm({ ...form, specialty: e.target.value })} 
                placeholder="Ex: Redes de Computadores, Design Gráfico, Programação Web..." 
                required 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resumo Biográfico / Formação</label>
              <textarea 
                value={form.bio} 
                onChange={e => setForm({ ...form, bio: e.target.value })} 
                rows="3" 
                placeholder="Breve resumo da experiência académica e profissional..."
                className="form-textarea" 
              />
            </div>

            {!editingTeacher && (
              <div style={{
                background: 'rgba(0, 163, 224, 0.08)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <input
                  type="checkbox"
                  id="autoCredentials"
                  checked={autoGenerateCredentials}
                  onChange={e => setAutoGenerateCredentials(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="autoCredentials" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                  <strong style={{ color: '#00C7FD', display: 'block', marginBottom: '2px' }}>
                    Gerar automaticamente credenciais de acesso provisórias
                  </strong>
                  Cria a conta do formador com uma senha temporária (válida por 48h) para o seu primeiro login e disponibiliza os dados para partilha rápida por WhatsApp ou E-mail.
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A guardar...' : editingTeacher ? 'Guardar Alterações' : 'Registar Formador'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
        <Modal 
          isOpen={!!deletingTeacher} 
          onClose={() => setDeletingTeacher(null)} 
          title="Eliminar Formador" 
          maxWidth="460px"
        >
          {deletingTeacher && (
            <div>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Tem a certeza que deseja eliminar o formador <strong>"{deletingTeacher.name || deletingTeacher.full_name}"</strong>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button onClick={() => setDeletingTeacher(null)} className="btn btn-secondary">Cancelar</button>
                <button onClick={handleDeleteConfirm} disabled={submitting} className="btn btn-danger">
                  {submitting ? 'A eliminar...' : 'Confirmar Eliminação'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL DE SUSPENSÃO DE FORMADOR */}
        <Modal
          isOpen={!!suspendingTeacher}
          onClose={() => setSuspendingTeacher(null)}
          title="Suspender Acesso de Formador"
          maxWidth="480px"
        >
          {suspendingTeacher && (
            <div>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                margin: '0 auto 1rem'
              }}>
                <Ban size={26} />
              </div>

              <p style={{ color: '#E2E8F0', fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', marginBottom: '1.25rem' }}>
                Você está prestes a suspender a conta de <strong style={{ color: '#FFFFFF' }}>{suspendingTeacher.name || suspendingTeacher.full_name}</strong>.
                <br />
                <span style={{ color: '#F87171', fontSize: '0.84rem' }}>
                  O formador terá a sessão revogada imediatamente e não poderá iniciar sessão enquanto a conta estiver suspensa.
                </span>
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Motivo da Suspensão (opcional)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  placeholder="Ex: Licença temporária, revisão pedagógica, pendência cadastral..."
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setSuspendingTeacher(null)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={submitting}
                  className="btn btn-danger"
                  style={{ background: '#DC2626' }}
                >
                  {submitting ? 'A suspender...' : 'Confirmar Suspensão'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL DE CONFIRMAÇÃO PARA REGENERAR CREDENCIAIS */}
        <Modal
          isOpen={!!confirmRegenerateTeacher}
          onClose={() => setConfirmRegenerateTeacher(null)}
          title="Confirmar Regeneração de Credenciais"
          maxWidth="480px"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Invalidar senha anterior e gerar nova?
            </h3>

            <p style={{ color: '#94A3B8', fontSize: '0.885rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Tem a certeza de que deseja regenerar as credenciais para <strong style={{ color: '#FFFFFF' }}>{confirmRegenerateTeacher?.name || confirmRegenerateTeacher?.full_name}</strong>?
              <br />
              <span style={{ color: '#F59E0B' }}>A senha temporária anterior deixará de funcionar imediatamente</span> e será emitida uma nova credencial provisória válida por 48 horas.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmRegenerateTeacher(null)}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRegenerateCredentials}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', background: '#F59E0B', borderColor: '#D97706', color: '#000000', fontWeight: '700' }}
              >
                Sim, Regenerar Credenciais
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DE CREDENCIAIS PROVISÓRIAS DO FORMADOR */}
        {credentialsModalData && (
          <TeacherCredentialsModal
            isOpen={!!credentialsModalData}
            onClose={() => setCredentialsModalData(null)}
            teacherName={credentialsModalData.teacherName}
            credentials={credentialsModalData.credentials}
          />
        )}
      </main>
    </div>
  );
}

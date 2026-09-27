import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import SelectDropdown from '../../components/common/SelectDropdown';
import { 
  getTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember, 
  uploadTeamPhoto 
} from '../../services/api';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Search,
  Award
} from 'lucide-react';

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    category: 'formador',
    specialty: '',
    experience: '',
    education: '',
    bio: '',
    photo_url: '',
    display_order: 0,
    is_active: true,
    show_on_home: true
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers();
      setMembers(data);
    } catch (err) {
      console.error('Erro ao carregar equipa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      full_name: '',
      role: '',
      category: 'formador',
      specialty: '',
      experience: '',
      education: '',
      bio: '',
      photo_url: '',
      display_order: members.length + 1,
      is_active: true,
      show_on_home: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name || '',
      role: member.role || '',
      category: member.category || 'formador',
      specialty: member.specialty || '',
      experience: member.experience || '',
      education: member.education || '',
      bio: member.bio || '',
      photo_url: member.photo_url || '',
      display_order: member.display_order || 0,
      is_active: member.is_active !== undefined ? member.is_active : true,
      show_on_home: member.show_on_home !== undefined ? member.show_on_home : true
    });
    setSelectedFile(null);
    setPreviewUrl(member.photo_url || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação de formato e tamanho (máx 5MB)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Formato inválido. Por favor envie uma imagem nos formatos JPG, JPEG ou PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem não pode ultrapassar 5MB.');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (!formData.full_name.trim()) throw new Error('O nome completo é obrigatório.');
      if (!formData.role.trim()) throw new Error('O cargo/função é obrigatório.');

      let photoUrl = formData.photo_url;
      if (selectedFile) {
        photoUrl = await uploadTeamPhoto(selectedFile);
      }

      const payload = {
        ...formData,
        photo_url: photoUrl
      };

      if (editingMember) {
        await updateTeamMember(editingMember.id, payload);
        setSuccessMsg('Membro da equipa atualizado com sucesso!');
      } else {
        await createTeamMember(payload);
        setSuccessMsg('Novo membro adicionado com sucesso!');
      }

      setIsModalOpen(false);
      await loadTeam();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao guardar membro:', err);
      setErrorMsg(err.message || 'Erro ao processar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover "${name}" da equipa?`)) return;
    try {
      await deleteTeamMember(id);
      setSuccessMsg('Membro removido com sucesso.');
      await loadTeam();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      alert('Não foi possível remover o membro.');
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await updateTeamMember(member.id, { is_active: !member.is_active });
      await loadTeam();
    } catch (err) {
      console.error('Erro ao alterar estado:', err);
    }
  };

  const handleToggleHome = async (member) => {
    try {
      await updateTeamMember(member.id, { show_on_home: !member.show_on_home });
      await loadTeam();
    } catch (err) {
      console.error('Erro ao alterar exibição na home:', err);
    }
  };

  const categoryOptions = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'direcao', label: 'Direção Geral' },
    { value: 'coordenacao', label: 'Coordenação Pedagógica' },
    { value: 'formador', label: 'Formadores & Docentes' },
    { value: 'tecnico', label: 'Técnicos & Laboratório' },
    { value: 'administrativo', label: 'Administrativo' }
  ];

  const filteredMembers = members.filter(m => {
    const matchSearch = m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()) ||
      m.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF' }}>Gestão da Equipa Institucional</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem' }}>
              Cadastre formadores, coordenadores e diretores apresentados na Zaty Academy e na Página Inicial.
            </p>
          </div>

          <button onClick={openAddModal} className="btn btn-primary mobile-btn-full">
            <Plus size={16} />
            ADICIONAR MEMBRO
          </button>
        </div>

        {/* Mensagens de Sucesso */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            padding: '0.85rem 1.25rem',
            borderRadius: '4px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.885rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Barra de Filtros e Busca no Estilo Intel Command Center */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.25rem)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0, position: 'relative' }}>
            <Search size={16} color="#00C7FD" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou especialidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <SelectDropdown
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Filtrar Categoria"
            />
          </div>
        </div>

        {/* Tabela de Membros */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              A carregar membros da equipa...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              Nenhum membro encontrado com os filtros selecionados.
            </div>
          ) : (
            <>
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Ordem</th>
                      <th style={{ width: '70px' }}>Foto</th>
                      <th>Nome & Função</th>
                      <th>Especialidade & Formação</th>
                      <th style={{ textAlign: 'center' }}>Página Inicial</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td style={{ fontWeight: '700', color: '#00C7FD', fontFamily: 'monospace' }}>
                          #{member.display_order}
                        </td>

                        <td>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 163, 224, 0.4)',
                            background: '#001830'
                          }}>
                            <img
                              src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80'}
                              alt={member.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </td>

                        <td>
                          <strong style={{ fontSize: '0.925rem', color: '#FFFFFF', display: 'block' }}>
                            {member.full_name}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#00C7FD' }}>
                            {member.role}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
                            {member.specialty || 'Não especificada'}
                          </div>
                          {member.education && (
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                              {member.education}
                            </div>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleHome(member)}
                            title={member.show_on_home ? 'Visível na Home (clique para ocultar)' : 'Oculto na Home (clique para exibir)'}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: member.show_on_home ? '#00C7FD' : '#64748B'
                            }}
                          >
                            {member.show_on_home ? (
                              <span className="badge badge-info" style={{ gap: '0.35rem' }}>
                                <Eye size={13} /> Visível
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                                <EyeOff size={13} /> Oculto
                              </span>
                            )}
                          </button>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleActive(member)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {member.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </button>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => openEditModal(member)}
                              className="btn btn-secondary btn-sm"
                              title="Editar Dados"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id, member.full_name)}
                              className="btn btn-danger btn-sm"
                              title="Remover Membro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only-cards" style={{ padding: '1rem' }}>
                {filteredMembers.map((member) => (
                  <div key={member.id} className="mobile-entity-card">
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 163, 224, 0.4)',
                        background: '#001830',
                        flexShrink: 0
                      }}>
                        <img
                          src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80'}
                          alt={member.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', fontWeight: '700' }}>
                            {member.full_name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00C7FD', fontWeight: '700' }}>
                            #{member.display_order}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#00C7FD', marginTop: '0.15rem' }}>
                          {member.role}
                        </div>
                      </div>
                    </div>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Especialidade</span>
                        <span className="meta-value">{member.specialty || 'Não especificada'}</span>
                      </div>
                      <div>
                        <span className="meta-label">Formação</span>
                        <span className="meta-value">{member.education || 'N/D'}</span>
                      </div>
                      <div>
                        <span className="meta-label">Página Inicial</span>
                        <span className="meta-value">
                          <button
                            onClick={() => handleToggleHome(member)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {member.show_on_home ? (
                              <span className="badge badge-info" style={{ gap: '0.25rem', fontSize: '0.7rem' }}>
                                <Eye size={11} /> Visível
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8', fontSize: '0.7rem' }}>
                                <EyeOff size={11} /> Oculto
                              </span>
                            )}
                          </button>
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Estado</span>
                        <span className="meta-value">
                          <button
                            onClick={() => handleToggleActive(member)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                              {member.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </button>
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <button
                        onClick={() => openEditModal(member)}
                        className="btn btn-secondary mobile-action-btn"
                      >
                        <Edit size={13} /> Editar Dados
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.full_name)}
                        className="btn btn-danger mobile-action-btn"
                      >
                        <Trash2 size={13} /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal de Adição / Edição de Membro da Equipa */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 16, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF' }}>
                  {editingMember ? 'Editar Membro da Equipa' : 'Adicionar Novo Membro'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem'
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Ex: Eng. Mário Silva"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cargo / Função *</label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Formador Sénior de Redes"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Categoria Institucional</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="form-select"
                    >
                      <option value="direcao">Direção Geral</option>
                      <option value="coordenacao">Coordenação Pedagógica</option>
                      <option value="formador">Formador / Professor</option>
                      <option value="tecnico">Técnico de Laboratório</option>
                      <option value="administrativo">Administrativo / Secretaria</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ordem de Apresentação</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.display_order}
                      onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Especialidade / Áreas de Domínio</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Ex: Cibersegurança, Cisco CCNA, Python, Hardware"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Experiência Profissional</label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={e => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="Ex: 8 anos no setor de Telecomunicações"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Formação Académica / Certificações</label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={e => setFormData({ ...formData, education: e.target.value })}
                      placeholder="Ex: Licenciatura em Engenharia Informática"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição Profissional / Biografia Curta</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Breve descrição da carreira, paixão pelo ensino e diferenciais..."
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                {/* Upload de Fotografia */}
                <div className="form-group" style={{ background: 'rgba(0, 24, 48, 0.65)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '4px', padding: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.65rem' }}>Fotografia do Membro (JPG, JPEG, PNG)</label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '2px solid #00C7FD',
                      background: '#001830',
                      flexShrink: 0
                    }}>
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
                          <Users size={24} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        id="photoUploadInput"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="photoUploadInput" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        <Upload size={14} />
                        {previewUrl ? 'Alterar Fotografia' : 'Carregar Imagem'}
                      </label>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                        Proporção quadrada recomendada (ex: 400x400px), máx 5MB.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Opções de Visibilidade */}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: '1.25rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.885rem', color: '#FFFFFF' }}>
                    <input
                      type="checkbox"
                      checked={formData.show_on_home}
                      onChange={e => setFormData({ ...formData, show_on_home: e.target.checked })}
                      style={{ accentColor: '#00C7FD', width: '16px', height: '16px' }}
                    />
                    <span>Exibir na Página Inicial</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.885rem', color: '#FFFFFF' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
                    />
                    <span>Membro Ativo</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? 'A guardar...' : editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  getCourses, 
  getStudents, 
  uploadPublicFile 
} from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Modal from '../../components/common/Modal';
import OpenAIArticleView from '../../components/articles/OpenAIArticleView';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { 
  Newspaper, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Bold, 
  Italic, 
  Underline,
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Video,
  Globe,
  BookOpen,
  User,
  Quote,
  RotateCcw,
  RotateCw,
  AlignCenter,
  AlignLeft,
  AlignRight
} from 'lucide-react';

export default function ArticlesManagement() {
  const [articles, setArticles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('todos'); // 'todos' | 'publico' | 'interno' | 'rascunho'

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [readingArticle, setReadingArticle] = useState(null);
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const contentRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    video_url: '',
    status: 'publicado',
    target_audience: 'geral',
    target_course_id: '',
    target_student_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [arts, crs, stdsRes] = await Promise.allSettled([
        getArticles({ includeDrafts: true }),
        getCourses(true),
        getStudents({ limit: 100 })
      ]);

      setArticles(arts.status === 'fulfilled' ? (arts.value || []) : []);
      setCourses(crs.status === 'fulfilled' ? (crs.value || []) : []);
      setStudents(stdsRes.status === 'fulfilled' ? (stdsRes.value?.students || []) : []);
    } catch (err) {
      console.error('Erro ao carregar artigos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Histórico de alterações de conteúdo para Desfazer / Refazer (Undo/Redo)
  const [contentHistory, setContentHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const openCreateModal = () => {
    setEditingArticle(null);
    setErrorMsg('');
    const initialForm = {
      title: '',
      excerpt: '',
      content: '',
      cover_image_url: '',
      video_url: '',
      status: 'publicado',
      target_audience: 'geral',
      target_course_id: '',
      target_student_id: ''
    };
    setForm(initialForm);
    setContentHistory(['']);
    setHistoryIndex(0);
    setShowModal(true);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    setErrorMsg('');
    const initialContent = article.content || '';
    setForm({
      title: article.title || '',
      excerpt: article.excerpt || '',
      content: initialContent,
      cover_image_url: article.cover_image_url || '',
      video_url: article.video_url || '',
      status: article.status || 'publicado',
      target_audience: article.target_audience || 'geral',
      target_course_id: article.target_course_id || '',
      target_student_id: article.target_student_id || ''
    });
    setContentHistory([initialContent]);
    setHistoryIndex(0);
    setShowModal(true);
  };

  // Atualiza conteúdo salvando no histórico do editor
  const applyContentChange = (newContent) => {
    setForm(prev => ({ ...prev, content: newContent }));
    setContentHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newContent];
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevContent = contentHistory[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      setForm(prev => ({ ...prev, content: prevContent }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < contentHistory.length - 1) {
      const nextContent = contentHistory[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      setForm(prev => ({ ...prev, content: nextContent }));
    }
  };

  // Barra de ferramentas de formatação rica
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = form.content;
    const selectedText = currentText.substring(start, end) || 'texto';

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    applyContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Inserção interativa de vídeo do YouTube
  const handleInsertYouTube = () => {
    const url = prompt('Insira a ligação do vídeo do YouTube (ex: https://youtu.be/... ou https://www.youtube.com/watch?v=...):');
    if (!url || !url.trim()) return;
    insertFormatting(`\n@[youtube](${url.trim()})\n`);
  };

  // Inserção interativa de Link
  const handleInsertLink = () => {
    const textarea = contentRef.current;
    const selected = textarea ? textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) : '';
    const text = selected || prompt('Texto do link a exibir:', 'Clique aqui');
    if (!text) return;
    const url = prompt('Endereço do link (URL):', 'https://');
    if (!url || !url.trim()) return;
    insertFormatting(`[${text}](${url.trim()})`);
  };

  // Inserção interativa de Imagem no texto
  const handleInsertImageInText = () => {
    const url = prompt('Insira a URL da imagem (ou faça upload da capa ao lado):', 'https://');
    if (!url || !url.trim()) return;
    const alt = prompt('Descrição/Legenda da imagem:', 'Imagem explicativa') || 'Imagem';
    insertFormatting(`\n![${alt}](${url.trim()})\n`);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg('');
    try {
      const publicUrl = await uploadPublicFile(file, 'articles');
      setForm(prev => ({ ...prev, cover_image_url: publicUrl }));
    } catch (err) {
      console.error('Erro ao carregar imagem de capa:', err);
      setErrorMsg('Falha ao carregar imagem de capa.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('O título e o conteúdo do artigo são obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        ...form,
        target_course_id: form.target_audience === 'curso' ? form.target_course_id || null : null,
        target_student_id: form.target_audience === 'estudante' ? form.target_student_id || null : null
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, payload);
        setSuccessMsg('Artigo atualizado com sucesso!');
      } else {
        await createArticle(payload);
        setSuccessMsg('Novo artigo publicado com sucesso!');
      }

      setShowModal(false);
      setEditingArticle(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Erro ao gravar artigo:', err);
      setErrorMsg(err.message || 'Falha ao guardar artigo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticle) return;
    setSubmitting(true);
    try {
      await deleteArticle(deletingArticle.id);
      setDeletingArticle(null);
      setSuccessMsg('Artigo eliminado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err) {
      console.error('Erro ao eliminar artigo:', err);
      alert(err.message || 'Falha ao eliminar artigo.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArticles = articles.filter(art => {
    // 1. Filtro por separação de público vs estudante vs rascunho
    if (filterTab === 'publico') {
      if (art.target_audience !== 'publico' && art.target_audience !== 'geral') return false;
      if (art.status !== 'publicado') return false;
    } else if (filterTab === 'interno') {
      if (art.target_audience !== 'curso' && art.target_audience !== 'estudante') return false;
      if (art.status !== 'publicado') return false;
    } else if (filterTab === 'rascunho') {
      if (art.status !== 'rascunho') return false;
    }

    // 2. Filtro por termo de pesquisa
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (art.title || '').toLowerCase();
    const excerpt = (art.excerpt || '').toLowerCase();
    return title.includes(term) || excerpt.includes(term);
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF' }}>Artigos & Notícias da Instituição</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem' }}>
              Publicação de comunicados, artigos técnicos, tutoriais e avisos pedagógicos direcionados.
            </p>
          </div>

          <button onClick={openCreateModal} className="btn btn-primary mobile-btn-full">
            <Plus size={16} />
            NOVO ARTIGO
          </button>
        </div>

        {/* Notificações de Sucesso */}
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

        {/* Separador de Abas de Conteúdo: Públicos vs Internos */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: 'Todos os Conteúdos', count: articles.length },
            { id: 'publico', label: 'Públicos do Site (Notícias)', count: articles.filter(a => (a.target_audience === 'publico' || a.target_audience === 'geral' || !a.target_audience) && a.status === 'publicado').length },
            { id: 'interno', label: 'Internos dos Estudantes', count: articles.filter(a => (a.target_audience === 'curso' || a.target_audience === 'estudante') && a.status === 'publicado').length },
            { id: 'rascunho', label: 'Rascunhos', count: articles.filter(a => a.status === 'rascunho').length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                border: filterTab === tab.id ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.2)',
                background: filterTab === tab.id ? 'rgba(0, 199, 253, 0.15)' : 'rgba(0, 28, 54, 0.5)',
                color: filterTab === tab.id ? '#00C7FD' : '#94A3B8',
                fontWeight: filterTab === tab.id ? '700' : '500',
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label} <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Barra de Pesquisa */}
        <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '420px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar artigos por título ou resumo..."
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Tabela de Artigos */}
        <div className="glass-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar artigos...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <Newspaper size={36} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4, color: '#00C7FD' }} />
              <p>{searchTerm ? 'Nenhum artigo encontrado.' : 'Nenhum artigo publicado ainda.'}</p>
              {!searchTerm && (
                <button onClick={openCreateModal} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  <Plus size={14} /> Publicar Primeiro Artigo
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="desktop-only-table table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Artigo / Título</th>
                      <th>Público-Alvo</th>
                      <th>Estado</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map(art => (
                      <tr key={art.id}>
                        <td style={{ maxWidth: '340px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {art.cover_image_url ? (
                              <img 
                                src={art.cover_image_url} 
                                alt="" 
                                style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '36px', background: 'rgba(0, 114, 206, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                                <Newspaper size={18} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.title}
                              </strong>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.excerpt || 'Sem resumo'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.35rem', 
                            fontSize: '0.78rem', 
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: art.target_audience === 'publico' ? 'rgba(0, 199, 253, 0.15)' :
                                        art.target_audience === 'curso' ? 'rgba(168, 85, 247, 0.15)' :
                                        art.target_audience === 'estudante' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: art.target_audience === 'publico' ? '#00C7FD' :
                                   art.target_audience === 'curso' ? '#C084FC' :
                                   art.target_audience === 'estudante' ? '#FBBF24' : '#6EE7B7',
                            border: `1px solid ${
                              art.target_audience === 'publico' ? 'rgba(0, 199, 253, 0.35)' :
                              art.target_audience === 'curso' ? 'rgba(168, 85, 247, 0.35)' :
                              art.target_audience === 'estudante' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'
                            }`
                          }}>
                            {art.target_audience === 'curso' ? <BookOpen size={12} /> :
                             art.target_audience === 'estudante' ? <User size={12} /> :
                             <Globe size={12} />}
                            <span>
                              {art.target_audience === 'publico' ? 'Público (Site)' :
                               art.target_audience === 'curso' ? 'Curso' :
                               art.target_audience === 'estudante' ? 'Estudante' : 'Geral (Site & Aluno)'}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${art.status === 'publicado' ? 'badge-success' : 'badge-warning'}`}>
                            {art.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(art.created_at)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              onClick={() => setReadingArticle(art)} 
                              className="btn btn-secondary btn-sm"
                              title="Ler Artigo"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              onClick={() => openEditModal(art)} 
                              className="btn btn-secondary btn-sm"
                              title="Editar Artigo"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => setDeletingArticle(art)} 
                              className="btn btn-danger btn-sm"
                              title="Eliminar Artigo"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only-cards">
                {filteredArticles.map(art => (
                  <div key={art.id} className="mobile-entity-card">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      {art.cover_image_url ? (
                        <img 
                          src={art.cover_image_url} 
                          alt="" 
                          style={{ width: '56px', height: '44px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} 
                        />
                      ) : (
                        <div style={{ width: '56px', height: '44px', background: 'rgba(0, 114, 206, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                          <Newspaper size={20} />
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#FFFFFF', fontWeight: '700', lineHeight: 1.3 }}>
                            {art.title}
                          </h4>
                          <span className={`badge ${art.status === 'publicado' ? 'badge-success' : 'badge-warning'}`} style={{ flexShrink: 0, fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {art.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        {art.excerpt && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#94A3B8', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                            {art.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mobile-card-meta">
                      <div>
                        <span className="meta-label">Público-Alvo</span>
                        <span className="meta-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {art.target_audience === 'curso' ? <BookOpen size={11} /> :
                           art.target_audience === 'estudante' ? <User size={11} /> :
                           <Globe size={11} />}
                          {art.target_audience === 'publico' ? 'Público (Site)' :
                           art.target_audience === 'curso' ? 'Curso' :
                           art.target_audience === 'estudante' ? 'Estudante' : 'Geral (Site & Aluno)'}
                        </span>
                      </div>
                      <div>
                        <span className="meta-label">Data</span>
                        <span className="meta-value">{formatDate(art.created_at)}</span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <button 
                        onClick={() => setReadingArticle(art)} 
                        className="btn btn-secondary mobile-action-btn"
                      >
                        <Eye size={13} /> Visualizar
                      </button>
                      <button 
                        onClick={() => openEditModal(art)} 
                        className="btn btn-secondary mobile-action-btn"
                      >
                        <Edit size={13} /> Editar
                      </button>
                      <button 
                        onClick={() => setDeletingArticle(art)} 
                        className="btn btn-danger mobile-action-btn"
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODAL CRIAR / EDITAR ARTIGO COM TOOLBAR RICA */}
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={editingArticle ? "Editar Artigo Institucional" : "Publicar Novo Artigo"} 
          maxWidth="720px"
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
              <label className="form-label">Título do Artigo *</label>
              <input 
                type="text" 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
                placeholder="Ex: Abertura das Novas Inscrições para Cursos de Tecnologia 2026" 
                required 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resumo / Subtítulo (Excerpt)</label>
              <textarea 
                value={form.excerpt} 
                onChange={e => setForm({ ...form, excerpt: e.target.value })} 
                rows="2" 
                placeholder="Breve introdução que aparecerá na lista de artigos..." 
                className="form-textarea" 
              />
            </div>

            {/* Imagem de Capa e Vídeo Embed */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Imagem de Capa (URL ou Upload)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="url" 
                    value={form.cover_image_url} 
                    onChange={e => setForm({ ...form, cover_image_url: e.target.value })} 
                    placeholder="https://exemplo.com/imagem.jpg" 
                    className="form-input" 
                  />
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <Upload size={14} />
                    {uploadingImage ? '...' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vídeo Incorporado (YouTube / Vimeo / MP4)</label>
                <input 
                  type="url" 
                  value={form.video_url} 
                  onChange={e => setForm({ ...form, video_url: e.target.value })} 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="form-input" 
                />
              </div>
            </div>

            {/* Público-Alvo e Estado */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Público-Alvo do Artigo *</label>
                <select 
                  value={form.target_audience} 
                  onChange={e => setForm({ ...form, target_audience: e.target.value })} 
                  className="form-select"
                >
                  <option value="publico">Notícia Pública do Site (Avisos, Eventos, Institucional)</option>
                  <option value="geral">Geral (Site Público & Portal do Aluno)</option>
                  <option value="curso">Interno (Apenas Alunos de Curso Específico)</option>
                  <option value="estudante">Interno (Apenas Estudante Específico)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado de Publicação *</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value })} 
                  className="form-select"
                >
                  <option value="publicado">Publicado (Visível aos leitores)</option>
                  <option value="rascunho">Rascunho (Apenas administradores)</option>
                </select>
              </div>
            </div>

            {/* Seleção condicional de curso ou estudante */}
            {form.target_audience === 'curso' && (
              <div className="form-group">
                <label className="form-label">Selecione o Curso Vinculado *</label>
                <select 
                  value={form.target_course_id} 
                  onChange={e => setForm({ ...form, target_course_id: e.target.value })} 
                  className="form-select"
                  required
                >
                  <option value="">-- Selecione o Curso --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}

            {form.target_audience === 'estudante' && (
              <div className="form-group">
                <label className="form-label">Selecione o Estudante Vinculado *</label>
                <select 
                  value={form.target_student_id} 
                  onChange={e => setForm({ ...form, target_student_id: e.target.value })} 
                  className="form-select"
                  required
                >
                  <option value="">-- Selecione o Estudante --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.student_code || s.phone})</option>
                  ))}
                </select>
              </div>
            )}

            {/* BARRA DE FORMATAÇÃO RICA */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Conteúdo Completo do Artigo *</label>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Markdown / Texto Rico Suportado</span>
              </div>

              {/* Botões de Formatação Completa */}
              <div style={{
                display: 'flex',
                gap: '0.3rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: 'rgba(0, 24, 48, 0.95)',
                padding: '0.5rem 0.65rem',
                border: '1px solid rgba(0, 163, 224, 0.35)',
                borderRadius: '6px 6px 0 0',
                borderBottom: 'none'
              }}>
                {/* Desfazer / Refazer */}
                <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', opacity: historyIndex <= 0 ? 0.4 : 1 }} title="Desfazer (Undo)">
                  <RotateCcw size={13} />
                </button>
                <button type="button" onClick={handleRedo} disabled={historyIndex >= contentHistory.length - 1} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', opacity: historyIndex >= contentHistory.length - 1 ? 0.4 : 1 }} title="Refazer (Redo)">
                  <RotateCw size={13} />
                </button>

                <span style={{ width: '1px', height: '16px', background: 'rgba(0, 163, 224, 0.3)', margin: '0 0.2rem' }} />

                {/* Estilos Básicos: Negrito, Itálico, Sublinhado */}
                <button type="button" onClick={() => insertFormatting('**', '**')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Negrito (**texto**)">
                  <Bold size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('*', '*')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Itálico (*texto*)">
                  <Italic size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('<u>', '</u>')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Sublinhado (<u>texto</u>)">
                  <Underline size={13} />
                </button>

                <span style={{ width: '1px', height: '16px', background: 'rgba(0, 163, 224, 0.3)', margin: '0 0.2rem' }} />

                {/* Títulos H2 e H3 */}
                <button type="button" onClick={() => insertFormatting('## ')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Título Principal de Seção (H2)">
                  <Heading1 size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('### ')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Subtítulo (H3)">
                  <Heading2 size={13} />
                </button>

                <span style={{ width: '1px', height: '16px', background: 'rgba(0, 163, 224, 0.3)', margin: '0 0.2rem' }} />

                {/* Listas */}
                <button type="button" onClick={() => insertFormatting('- ')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Lista com Marcadores (- item)">
                  <List size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('1. ')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Lista Numerada (1. item)">
                  <ListOrdered size={13} />
                </button>

                <span style={{ width: '1px', height: '16px', background: 'rgba(0, 163, 224, 0.3)', margin: '0 0.2rem' }} />

                {/* Alinhamento */}
                <button type="button" onClick={() => insertFormatting('<div align="left">\n', '\n</div>')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Alinhar à Esquerda">
                  <AlignLeft size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('<div align="center">\n', '\n</div>')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Centralizar Texto">
                  <AlignCenter size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('<div align="right">\n', '\n</div>')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Alinhar à Direita">
                  <AlignRight size={13} />
                </button>

                <span style={{ width: '1px', height: '16px', background: 'rgba(0, 163, 224, 0.3)', margin: '0 0.2rem' }} />

                {/* Mídia e Elementos Avançados */}
                <button type="button" onClick={handleInsertLink} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Inserir Link com Endereço URL">
                  <LinkIcon size={13} />
                </button>
                <button type="button" onClick={handleInsertImageInText} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Inserir Imagem no Conteúdo">
                  <ImageIcon size={13} />
                </button>
                <button type="button" onClick={handleInsertYouTube} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', color: '#EF4444' }} title="Inserir Vídeo do YouTube Incorporado">
                  <Video size={13} />
                </button>
                <button type="button" onClick={() => insertFormatting('> "', '"\n— Autor / Formador')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', color: '#00C7FD' }} title="Inserir Caixa de Citação / Destaque">
                  <Quote size={13} />
                </button>
              </div>

              <textarea 
                ref={contentRef}
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })} 
                rows="8" 
                placeholder="Escreva aqui o artigo completo. Você pode usar títulos (##), listas (-), negrito (**) e links..." 
                required 
                className="form-textarea" 
                style={{ borderRadius: '0 0 4px 4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A guardar...' : editingArticle ? 'Guardar Alterações' : 'Publicar Artigo'}
              </button>
            </div>
          </form>
        </Modal>

        {/* VISUALIZAÇÃO EDITORIAL PADRÃO OPENAI EM TELA CHEIA */}
        {readingArticle && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              overflowY: 'auto',
              background: 'var(--intel-bg-gradient, linear-gradient(180deg, #004880 0%, #003865 35%, #00203a 100%))'
            }}
          >
            <OpenAIArticleView
              article={readingArticle}
              relatedArticles={articles}
              onBack={() => setReadingArticle(null)}
              onSelectArticle={(rel) => {
                setReadingArticle(rel);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
        <Modal 
          isOpen={!!deletingArticle} 
          onClose={() => setDeletingArticle(null)} 
          title="Eliminar Artigo" 
          maxWidth="460px"
        >
          {deletingArticle && (
            <div>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Tem a certeza que deseja eliminar o artigo <strong>"{deletingArticle.title}"</strong>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button onClick={() => setDeletingArticle(null)} className="btn btn-secondary">Cancelar</button>
                <button onClick={handleDeleteConfirm} disabled={submitting} className="btn btn-danger">
                  {submitting ? 'A eliminar...' : 'Confirmar Eliminação'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}

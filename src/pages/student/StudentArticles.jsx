import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentArticles, getStudentByUserId } from '../../services/api';
import StudentSidebar from '../../components/student/StudentSidebar';
import OpenAIArticleView from '../../components/articles/OpenAIArticleView';
import { formatDate } from '../../utils/formatters';
import { 
  Newspaper, 
  Search, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, rgba(0, 75, 135, 0.9) 0%, rgba(0, 199, 253, 0.7) 50%, rgba(0, 34, 62, 0.9) 100%)',
  'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(99, 102, 241, 0.7) 50%, rgba(14, 165, 233, 0.8) 100%)',
  'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(14, 116, 144, 0.75) 50%, rgba(56, 189, 248, 0.75) 100%)'
];

export default function StudentArticles() {
  const { user, student } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [readingArticle, setReadingArticle] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let studentRecord = student;
        if (!studentRecord && user?.id) {
          studentRecord = await getStudentByUserId(user.id);
        }

        const courseIds = (studentRecord?.enrollments || []).map(e => e.course_id || e.course?.id).filter(Boolean);
        const data = await getStudentArticles(studentRecord?.id, courseIds);
        setArticles(data || []);
      } catch (err) {
        console.error('Erro ao buscar artigos para o estudante:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, student]);

  // Se o aluno estiver a ler um artigo específico, apresenta a visualização editorial padrão OpenAI com o fundo do sistema
  if (readingArticle) {
    return (
      <OpenAIArticleView
        article={readingArticle}
        relatedArticles={articles}
        onBack={() => setReadingArticle(null)}
        onSelectArticle={(rel) => {
          setReadingArticle(rel);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  const filteredArticles = articles.filter(art => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (art.title || '').toLowerCase();
    const excerpt = (art.excerpt || '').toLowerCase();
    return title.includes(term) || excerpt.includes(term);
  });

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>Artigos & Notícias Académicas</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Publicações oficiais, tutoriais técnicos, comunicados e artigos exclusivos para os estudantes da Zaty Academy.
            </p>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '440px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por artigos ou temas..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Grade de Artigos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>
            A carregar publicações da academia...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
            <Newspaper size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4, color: '#00C7FD' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {searchTerm ? 'Nenhum artigo encontrado para esta busca.' : 'Nenhum artigo disponível no momento.'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>Fique atento a novas publicações e novidades pedagógicas.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filteredArticles.map((art, idx) => {
              const gradientBg = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

              return (
                <div 
                  key={art.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '0', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: '1px solid rgba(0, 163, 224, 0.25)',
                    borderRadius: '16px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setReadingArticle(art);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(0, 199, 253, 0.55)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 199, 253, 0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(0, 163, 224, 0.25)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    {/* Capa com Imagem ou Gradiente Estilo Editorial */}
                    {art.cover_image_url ? (
                      <img 
                        src={art.cover_image_url} 
                        alt={art.title} 
                        style={{ width: '100%', height: '175px', objectFit: 'cover', display: 'block' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '175px', background: gradientBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                        <Sparkles size={32} opacity={0.8} />
                      </div>
                    )}

                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#00C7FD', marginBottom: '0.6rem' }}>
                        <Calendar size={13} />
                        <span>{formatDate(art.created_at)}</span>
                        <span>•</span>
                        <span>{art.author_name || 'Zaty Academy'}</span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                        {art.title}
                      </h3>

                      {art.excerpt && (
                        <p style={{ 
                          fontSize: '0.835rem', 
                          color: '#94A3B8', 
                          lineHeight: 1.55, 
                          marginBottom: '0.85rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {art.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                    <button 
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', fontSize: '0.825rem', borderRadius: '8px' }}
                    >
                      <span>Ler Artigo Completo</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

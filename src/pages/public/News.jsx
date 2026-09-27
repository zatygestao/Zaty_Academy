import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicArticles } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import SEO from '../../components/common/SEO';
import { 
  Newspaper, 
  Calendar, 
  Clock, 
  Search, 
  ArrowRight, 
  Sparkles,
  Tag,
  Share2
} from 'lucide-react';

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getPublicArticles({ limit: 40 });
        setArticles(data || []);
      } catch (err) {
        console.error('Erro ao carregar notícias públicas:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = articles.filter(art => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (art.title || '').toLowerCase();
    const excerpt = (art.excerpt || '').toLowerCase();
    return title.includes(term) || excerpt.includes(term);
  });

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)' }}>
      <SEO 
        title="Notícias & Comunicados" 
        description="Acompanhe as últimas notícias, comunicados institucionais, eventos e artigos tecnológicos da Zaty Academy em Nampula."
      />

      {/* Hero */}
      <section style={{
        padding: '4.5rem 1.5rem 3.5rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0, 40, 75, 0.5) 0%, rgba(0, 18, 36, 0.95) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.95rem', borderRadius: '999px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.35)', color: '#00C7FD', fontSize: '0.825rem', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
            <Sparkles size={15} />
            Imprensa & Atualizações Institucionais
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '1rem' }}>
            Notícias & <span style={{ color: '#00C7FD' }}>Artigos Oficiais</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#A5CBEA', lineHeight: '1.7', margin: '0 auto 2rem auto', maxWidth: '640px' }}>
            Fique por dentro das novidades, comunicados pedagógicos, abertura de turmas e tendências do setor tecnológico em Moçambique.
          </p>

          <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Pesquisar publicações por título..." 
              className="form-input" 
              style={{ paddingLeft: '3rem', height: '46px', fontSize: '0.95rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      </section>

      {/* Grid de Notícias */}
      <section style={{ padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0, 163, 224, 0.2)', borderTopColor: '#00C7FD', margin: '0 auto 1rem auto', animation: 'zatySpin 0.75s linear infinite' }} />
              <span>A carregar notícias...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
              <Newspaper size={44} style={{ margin: '0 auto 1rem auto', color: '#00C7FD', opacity: 0.4 }} />
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum artigo disponível</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto' }}>
                {searchTerm ? 'Nenhum resultado para a sua pesquisa.' : 'Ainda não existem artigos públicos publicados. Volte em breve!'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2rem'
            }}>
              {filtered.map(art => (
                <article 
                  key={art.id} 
                  className="glass-card" 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0, 163, 224, 0.25)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(0, 199, 253, 0.5)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0, 163, 224, 0.25)'}
                >
                  {/* Capa */}
                  <div style={{ height: '190px', background: 'linear-gradient(135deg, #00284D 0%, #001428 100%)', position: 'relative', overflow: 'hidden' }}>
                    {art.cover_image_url ? (
                      <img 
                        src={art.cover_image_url} 
                        alt={art.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
                        <Newspaper size={48} opacity={0.35} />
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      background: 'rgba(0, 18, 36, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0, 199, 253, 0.35)',
                      color: '#00C7FD',
                      fontSize: '0.725rem',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      Notícia Institucional
                    </div>
                  </div>

                  {/* Informações */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94A3B8', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="#00C7FD" />
                        {formatDate(art.created_at || art.published_at)}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} color="#00C7FD" />
                        3 min de leitura
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.35', marginBottom: '0.75rem' }}>
                      <Link 
                        to={`/artigos/${art.id}`} 
                        style={{ color: '#FFFFFF', textDecoration: 'none', transition: 'color 0.15s ease' }}
                        onMouseOver={e => e.target.style.color = '#00C7FD'}
                        onMouseOut={e => e.target.style.color = '#FFFFFF'}
                      >
                        {art.title}
                      </Link>
                    </h2>

                    <p style={{ color: '#94A3B8', fontSize: '0.885rem', lineHeight: '1.6', marginBottom: '1.5rem', flex: 1 }}>
                      {art.excerpt || (art.content ? art.content.replace(/<[^>]*>?/gm, '').slice(0, 130) + '...' : 'Sem resumo')}
                    </p>

                    <Link 
                      to={`/artigos/${art.id}`} 
                      className="btn btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
                    >
                      <span>Ler Artigo Completo</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

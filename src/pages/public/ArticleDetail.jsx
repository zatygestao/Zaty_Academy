import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleById, getArticles } from '../../services/api';
import OpenAIArticleView from '../../components/articles/OpenAIArticleView';
import SEO from '../../components/common/SEO';
import { Newspaper, ArrowLeft } from 'lucide-react';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [artData, allArticles] = await Promise.all([
          getArticleById(id),
          getArticles({ limit: 10 })
        ]);

        if (!artData) {
          setError('Artigo não encontrado ou indisponível.');
        } else {
          setArticle(artData);
          setRelatedArticles(allArticles || []);
        }
      } catch (err) {
        console.error('Erro ao carregar artigo:', err);
        setError('Ocorreu um erro ao carregar o artigo.');
      } finally {
        setLoading(false);
      }
    }

    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div 
        style={{
          background: 'var(--intel-bg-gradient, linear-gradient(180deg, #004880 0%, #003865 35%, #00203a 100%))',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: '#A5CBEA'
        }}
      >
        <div 
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 163, 224, 0.2)',
            borderTopColor: '#00C7FD',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
        <span style={{ fontSize: '0.9rem' }}>A carregar artigo editorial...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div 
        style={{
          background: 'var(--intel-bg-gradient, linear-gradient(180deg, #004880 0%, #003865 35%, #00203a 100%))',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <div 
          className="glass-card" 
          style={{ 
            maxWidth: '500px', 
            padding: '3rem 2rem', 
            border: '1px solid rgba(0, 163, 224, 0.3)' 
          }}
        >
          <Newspaper size={44} style={{ margin: '0 auto 1rem auto', color: '#00C7FD', opacity: 0.6 }} />
          <h2 style={{ color: '#FFFFFF', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
            Artigo não Encontrado
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {error || 'O artigo que procura pode ter sido movido, arquivado ou o link está incorreto.'}
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={article?.title} 
        description={article?.excerpt || (article?.content ? article.content.replace(/<[^>]*>?/gm, '').slice(0, 150) : '')}
        image={article?.cover_image_url || '/og-image.png'}
        type="article"
      />
      <OpenAIArticleView
        article={article}
        relatedArticles={relatedArticles}
        onBack={() => navigate(-1)}
        onSelectArticle={(rel) => navigate(`/artigos/${rel.id}`)}
      />
    </>
  );
}

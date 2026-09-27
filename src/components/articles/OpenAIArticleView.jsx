import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Share2, 
  ArrowLeft, 
  Check, 
  BookOpen, 
  Newspaper, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Quote as QuoteIcon
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

// Gradientes artísticos para artigos sem imagem de capa (harmonizados com a identidade do sistema)
const ARTISTIC_GRADIENTS = [
  'linear-gradient(135deg, rgba(0, 75, 135, 0.95) 0%, rgba(0, 199, 253, 0.75) 50%, rgba(0, 34, 62, 0.95) 100%)',
  'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(99, 102, 241, 0.75) 50%, rgba(14, 165, 233, 0.85) 100%)',
  'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(14, 116, 144, 0.8) 50%, rgba(56, 189, 248, 0.8) 100%)',
  'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(217, 70, 239, 0.7) 50%, rgba(59, 130, 246, 0.8) 100%)'
];

/**
 * Calcula o tempo estimado de leitura (média de 200 palavras por minuto)
 */
function estimateReadingTime(text = '') {
  if (!text) return '1 min de leitura';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de leitura`;
}

/**
 * Converte qualquer URL de vídeo do YouTube (normal, youtu.be, shorts, mobile, embed)
 * para uma URL de incorporação oficial e segura do YouTube.
 */
export function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // Regex universal para extrair o ID de 11 caracteres do YouTube
  const match = trimmed.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:.*[?&]v=|v\/|e(?:mbed)?\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`;
  }
  return null;
}

/**
 * Parser inteligente de conteúdo editorial com suporte a Markdown,
 * títulos H2/H3, listas, citações estilizadas (OpenAI Quote Cards), links e vídeos do YouTube.
 */
function renderEditorialContent(content = '') {
  if (!content) return null;

  // Normalizar quebras de linha e separar em blocos
  const rawBlocks = content.split(/\n\s*\n/);
  const renderedElements = [];

  rawBlocks.forEach((block, bIndex) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // 0. VÍDEO DO YOUTUBE INCORPORADO NO CORPO DO ARTIGO
    const cleanYtCandidate = trimmed
      .replace(/^@?\[(youtube|video)\]\(/i, '')
      .replace(/\)$/, '')
      .trim();
    const ytEmbedUrl = getYouTubeEmbedUrl(cleanYtCandidate);

    if (ytEmbedUrl && (trimmed.startsWith('@[youtube](') || trimmed.startsWith('[video](') || trimmed.startsWith('http'))) {
      renderedElements.push(
        <div 
          key={`yt-body-${bIndex}`}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 163, 224, 0.35)',
            margin: '2.5rem 0',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
            background: '#000000'
          }}
        >
          <iframe 
            src={ytEmbedUrl} 
            title="Vídeo Incorporado do Artigo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      );
      return;
    }

    // 0.1. BLOCOS DE ALINHAMENTO DE TEXTO (<div align="..."> ou <center>)
    if (trimmed.startsWith('<div align=') || trimmed.startsWith('<center>')) {
      const isRight = trimmed.includes('right');
      const isCenter = trimmed.includes('center') || trimmed.startsWith('<center>');
      const align = isRight ? 'right' : isCenter ? 'center' : 'left';
      const cleanText = trimmed.replace(/<\/?(div|center)[^>]*>/gi, '').trim();
      renderedElements.push(
        <div 
          key={`align-${bIndex}`} 
          style={{ 
            textAlign: align, 
            margin: '1.75rem 0', 
            color: '#CBD5E1', 
            fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)', 
            lineHeight: 1.9 
          }}
        >
          {renderInlineFormatting(cleanText)}
        </div>
      );
      return;
    }

    // 1. Títulos H2 (## )
    if (trimmed.startsWith('## ') || trimmed.startsWith('****2.') || trimmed.startsWith('****3.') || trimmed.startsWith('****4.') || trimmed.startsWith('****5.')) {
      const headingText = trimmed.replace(/^##\s*/, '').replace(/^\*{2,4}/, '').replace(/\*{2,4}$/, '').trim();
      renderedElements.push(
        <h2 
          key={`h2-${bIndex}`}
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 1.95rem)',
            fontWeight: '700',
            color: '#FFFFFF',
            marginTop: '3.25rem',
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}
        >
          {headingText}
        </h2>
      );
      return;
    }

    // 2. Títulos H3 (### )
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s*/, '').trim();
      renderedElements.push(
        <h3 
          key={`h3-${bIndex}`}
          style={{
            fontSize: 'clamp(1.25rem, 2.5vw, 1.45rem)',
            fontWeight: '700',
            color: '#00C7FD',
            marginTop: '2.5rem',
            marginBottom: '1rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.35
          }}
        >
          {headingText}
        </h3>
      );
      return;
    }

    // 3. CARDS DE CITAÇÃO ESTILIZADOS (Padrão OpenAI Quote Boxes)
    const isQuoteBlock = 
      trimmed.startsWith('>') || 
      trimmed.startsWith('“') || 
      trimmed.startsWith('"') ||
      trimmed.includes('\n—') ||
      trimmed.includes('\n--');

    if (isQuoteBlock) {
      let quoteText = trimmed.replace(/^>\s*/gm, '').trim();
      let quoteAuthor = '';

      // Separar autor caso exista linha iniciada por "—" ou "--"
      const authorMatch = quoteText.match(/(\n|\r\n)[—\-]{1,2}\s*(.+)$/);
      if (authorMatch) {
        quoteAuthor = authorMatch[2].trim();
        quoteText = quoteText.substring(0, authorMatch.index).trim();
      }

      quoteText = quoteText.replace(/^[“"']\s*/, '').replace(/\s*[”"']$/, '');

      renderedElements.push(
        <div 
          key={`quote-${bIndex}`}
          style={{
            background: 'rgba(0, 24, 48, 0.85)',
            border: '1px solid rgba(0, 163, 224, 0.35)',
            borderRadius: '16px',
            padding: '1.75rem 2rem',
            margin: '2.5rem 0',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Luz sutil ciano no topo do card */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 199, 253, 0.6), transparent)'
          }} />

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.18rem)',
            fontStyle: 'italic',
            lineHeight: 1.8,
            color: '#F1F5F9',
            margin: 0,
            letterSpacing: '0.01em'
          }}>
            “{quoteText}”
          </p>

          {quoteAuthor && (
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(0, 163, 224, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              color: '#00C7FD',
              fontWeight: '600'
            }}>
              <span>— {quoteAuthor}</span>
              <QuoteIcon size={16} style={{ opacity: 0.4 }} />
            </div>
          )}
        </div>
      );
      return;
    }

    // 4. Listas (com marcadores ou numeradas)
    const lines = trimmed.split(/\n/);
    const isList = lines.every(l => {
      const sl = l.trim();
      return sl.startsWith('- ') || sl.startsWith('* ') || /^\d+\.\s/.test(sl) || sl === '';
    });

    if (isList && lines.length > 0) {
      const isNumbered = /^\d+\.\s/.test(lines[0].trim());
      const ListTag = isNumbered ? 'ol' : 'ul';

      renderedElements.push(
        <ListTag 
          key={`list-${bIndex}`}
          style={{
            paddingLeft: '1.5rem',
            margin: '0 0 1.75rem 0',
            color: '#CBD5E1',
            fontSize: '1.085rem',
            lineHeight: 1.85
          }}
        >
          {lines.filter(l => l.trim()).map((line, lIndex) => {
            const cleanLine = line.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
            return (
              <li key={`li-${bIndex}-${lIndex}`} style={{ marginBottom: '0.65rem' }}>
                {renderInlineFormatting(cleanLine)}
              </li>
            );
          })}
        </ListTag>
      );
      return;
    }

    // 5. Parágrafo padrão de leitura editorial
    renderedElements.push(
      <p 
        key={`p-${bIndex}`}
        style={{
          fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)',
          lineHeight: 1.9,
          color: '#CBD5E1',
          marginBottom: '1.75rem',
          letterSpacing: '0.01em'
        }}
      >
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });

  return renderedElements;
}

/**
 * Processa formatação em linha simples (**negrito**, *itálico*, links e imagens)
 */
function renderInlineFormatting(text) {
  if (!text) return '';

  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Imagem: ![alt](url)
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      parts.push(
        <img 
          key={`img-${keyIdx++}`}
          src={imgMatch[2]} 
          alt={imgMatch[1] || 'Imagem do Artigo'} 
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '1px solid rgba(0, 163, 224, 0.3)',
            margin: '1.5rem 0',
            maxHeight: '440px',
            objectFit: 'cover'
          }}
        />
      );
      remaining = remaining.substring(imgMatch[0].length);
      continue;
    }

    // Link: [texto](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a 
          key={`link-${keyIdx++}`}
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#00C7FD',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            fontWeight: '500',
            transition: 'color 0.2s ease'
          }}
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.substring(linkMatch[0].length);
      continue;
    }

    // Negrito: **texto**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={`b-${keyIdx++}`} style={{ color: '#FFFFFF', fontWeight: '700' }}>
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.substring(boldMatch[0].length);
      continue;
    }

    // Itálico: *texto*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(
        <em key={`i-${keyIdx++}`} style={{ color: '#E2E8F0', fontStyle: 'italic' }}>
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.substring(italicMatch[0].length);
      continue;
    }

    // Sublinhado HTML: <u>texto</u>
    const underlineHtmlMatch = remaining.match(/^<u(?:\s+[^>]*)?>([\s\S]*?)<\/u>/i);
    if (underlineHtmlMatch) {
      parts.push(
        <u key={`u-html-${keyIdx++}`} style={{ textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#00C7FD' }}>
          {underlineHtmlMatch[1]}
        </u>
      );
      remaining = remaining.substring(underlineHtmlMatch[0].length);
      continue;
    }

    // Sublinhado Markdown: __texto__
    const underlineMdMatch = remaining.match(/^__([^_]+)__/);
    if (underlineMdMatch) {
      parts.push(
        <u key={`u-md-${keyIdx++}`} style={{ textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#00C7FD' }}>
          {underlineMdMatch[1]}
        </u>
      );
      remaining = remaining.substring(underlineMdMatch[0].length);
      continue;
    }

    // Próximo caractere de controle
    const nextSpecial = remaining.search(/(\!\[|\[|\*\*|\*|<u|__)/i);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.substring(1);
    } else {
      parts.push(remaining.substring(0, nextSpecial));
      remaining = remaining.substring(nextSpecial);
    }
  }

  return parts;
}

/**
 * Componente Principal OpenAIArticleView
 * Estrutura 100% fiel à imagem da OpenAI com a paleta de fundo e identidade da Zaty Academy.
 */
export default function OpenAIArticleView({
  article,
  relatedArticles = [],
  onBack,
  onSelectArticle,
  isEmbedded = false
}) {
  const [copied, setCopied] = useState(false);

  const readingTime = useMemo(() => estimateReadingTime(article?.content), [article?.content]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator?.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt || article?.title,
          url
        });
        return;
      } catch (_) {}
    }

    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const categoryLabel = useMemo(() => {
    if (article?.target_audience === 'curso') return 'FORMAÇÃO TÉCNICA & CURSOS';
    if (article?.target_audience === 'estudante') return 'COMUNICADO EXCLUSIVO';
    return 'NOTÍCIAS & INFORMAÇÃO ACADÉMICA';
  }, [article?.target_audience]);

  const relatedList = useMemo(() => {
    return (relatedArticles || [])
      .filter(a => a.id !== article?.id && a.status === 'publicado')
      .slice(0, 3);
  }, [relatedArticles, article?.id]);

  if (!article) return null;

  return (
    <div 
      style={{
        background: 'var(--intel-bg-gradient, linear-gradient(180deg, #004880 0%, #003865 35%, #00203a 100%))',
        color: '#FFFFFF',
        minHeight: isEmbedded ? 'auto' : '100vh',
        width: '100%',
        paddingBottom: '5rem',
        position: 'relative'
      }}
    >
      {/* 1. BARRA SUPERIOR DE NAVEGAÇÃO & AÇÕES */}
      <header 
        style={{
          borderBottom: '1px solid rgba(0, 163, 224, 0.2)',
          background: 'rgba(0, 24, 48, 0.75)',
          backdropFilter: 'blur(12px)',
          position: isEmbedded ? 'relative' : 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Botão Voltar */}
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CBD5E1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#00C7FD';
                e.currentTarget.style.background = 'rgba(0, 163, 224, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#CBD5E1';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar aos Artigos</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img src="/logo.png" alt="Zaty Academy Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.04em', color: '#FFFFFF' }}>
                Zaty Academy <span style={{ color: '#00C7FD', fontWeight: '400' }}>| Editorial</span>
              </span>
            </div>
          )}

          {/* Ações: Compartilhar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleShare}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 163, 224, 0.15)',
                border: `1px solid ${copied ? '#10B981' : 'rgba(0, 163, 224, 0.35)'}`,
                color: copied ? '#34D399' : '#00C7FD',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Copiar ligação do artigo"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Ligação Copiada!' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO / CABEÇALHO DO ARTIGO (Inspirado exatamente no topo da OpenAI) */}
      <section 
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '4rem 1.5rem 2.5rem 1.5rem',
          textAlign: 'center'
        }}
      >
        {/* Tag de Categoria Superior */}
        <div style={{
          display: 'inline-block',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.14em',
          color: '#00C7FD',
          textTransform: 'uppercase',
          marginBottom: '1.25rem'
        }}>
          {categoryLabel}
        </div>

        {/* Título Principal Monumental */}
        <h1 
          style={{
            fontSize: 'clamp(2.1rem, 4.5vw, 3.5rem)',
            fontWeight: '600',
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            margin: '0 auto 1.75rem auto',
            maxWidth: '920px'
          }}
        >
          {article.title}
        </h1>

        {/* Resumo / Excerpt como texto de introdução (Lead) */}
        {article.excerpt && (
          <p 
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.28rem)',
              lineHeight: 1.65,
              color: '#A5CBEA',
              maxWidth: '820px',
              margin: '0 auto 2.25rem auto',
              fontWeight: '400'
            }}
          >
            {article.excerpt}
          </p>
        )}

        {/* Linha de Metadados Centrais */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            fontSize: '0.875rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} style={{ color: '#00C7FD' }} />
            <span>{formatDate(article.created_at)}</span>
          </div>

          <span>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} style={{ color: '#00C7FD' }} />
            <span>{readingTime}</span>
          </div>

          <span>•</span>

          <span style={{ color: '#CBD5E1' }}>
            Por <strong style={{ color: '#FFFFFF' }}>{article.author_name || 'Zaty Academy'}</strong>
          </span>
        </div>
      </section>

      {/* 3. CORPO EDITORIAL */}
      <div 
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* COLUNA CENTRAL DE LEITURA (Largura otimizada para legibilidade profunda) */}
        <main style={{ maxWidth: '760px', width: '100%' }}>

          {/* Imagem de Capa em Destaque */}
          {article.cover_image_url && (
            <div 
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 163, 224, 0.28)',
                marginBottom: '3rem',
                boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
                background: 'rgba(0, 24, 48, 0.6)'
              }}
            >
              <img 
                src={article.cover_image_url} 
                alt={article.title} 
                style={{
                  width: '100%',
                  maxHeight: '480px',
                  objectFit: 'cover',
                  display: 'block'
                }} 
              />
            </div>
          )}

          {/* Reprodutor de Vídeo Incorporado Principal (Suporte Universal YouTube e MP4) */}
          {article.video_url && (() => {
            const ytEmbed = getYouTubeEmbedUrl(article.video_url);
            return (
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 163, 224, 0.35)',
                  marginBottom: '3rem',
                  background: '#000000',
                  boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)'
                }}
              >
                {ytEmbed ? (
                  <iframe 
                    src={ytEmbed} 
                    title={article.title || 'Vídeo Incorporado do Artigo'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  />
                ) : (
                  <video 
                    controls 
                    src={article.video_url} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
                  />
                )}
              </div>
            );
          })()}

          {/* Conteúdo Renderizado (Parágrafos, H2, H3, Cards de Citação, Listas) */}
          <article style={{ color: '#CBD5E1', fontSize: '1.1rem' }}>
            {renderEditorialContent(article.content)}
          </article>

          {/* BLOCO INSTITUCIONAL DE RODAPÉ (Sobre a Zaty Academy) */}
          <div 
            style={{
              background: 'rgba(0, 24, 48, 0.85)',
              border: '1px solid rgba(0, 163, 224, 0.3)',
              borderRadius: '16px',
              padding: '2rem 2.25rem',
              margin: '4rem 0 3rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img 
                src="/logo.png" 
                alt="Zaty Academy Logo" 
                style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0, 199, 253, 0.4))' }} 
              />
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#FFFFFF', fontWeight: '700' }}>
                  Zaty Academy — Publicações & Inovação
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#00C7FD' }}>
                  Centro de Excelência em Formação Tecnológica e Profissional
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.925rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Artigo oficial publicado pela coordenação pedagógica da Zaty Academy. Acompanhe as novidades, avisos de turmas e tutoriais técnicos para acelerar o seu desenvolvimento profissional.
            </p>
          </div>
        </main>
      </div>

      {/* 4. SECÇÃO "HISTÓRIAS RELACIONADAS" (Exatamente como a grelha da imagem da OpenAI) */}
      {relatedList.length > 0 && (
        <section 
          style={{
            maxWidth: '1120px',
            margin: '4rem auto 0 auto',
            padding: '2rem 1.5rem 0 1.5rem',
            borderTop: '1px solid rgba(0, 163, 224, 0.2)'
          }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Histórias relacionadas
            </h3>

            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00C7FD',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <span>Ver tudo</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Grelha de 3 Cards com Gradientes/Imagens Estilo OpenAI */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {relatedList.map((rel, idx) => {
              const gradientBg = ARTISTIC_GRADIENTS[idx % ARTISTIC_GRADIENTS.length];

              return (
                <div 
                  key={rel.id}
                  onClick={() => {
                    if (onSelectArticle) {
                      onSelectArticle(rel);
                    } else if (typeof window !== 'undefined') {
                      window.location.href = `/artigos/${rel.id}`;
                    }
                  }}
                  style={{
                    background: 'rgba(0, 24, 48, 0.6)',
                    border: '1px solid rgba(0, 163, 224, 0.25)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column'
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
                  {/* Banner visual superior */}
                  {rel.cover_image_url ? (
                    <img 
                      src={rel.cover_image_url} 
                      alt={rel.title} 
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    <div 
                      style={{
                        width: '100%',
                        height: '180px',
                        background: gradientBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <Sparkles size={28} style={{ color: '#FFFFFF', opacity: 0.7 }} />
                    </div>
                  )}

                  {/* Informações do Artigo */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          lineHeight: 1.4,
                          marginBottom: '0.65rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {rel.title}
                      </h4>

                      {rel.excerpt && (
                        <p 
                          style={{
                            fontSize: '0.85rem',
                            color: '#94A3B8',
                            lineHeight: 1.5,
                            marginBottom: '0.85rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {rel.excerpt}
                        </p>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.785rem',
                      color: '#00C7FD',
                      marginTop: '0.5rem'
                    }}>
                      <span>Notícias</span>
                      <span>•</span>
                      <span style={{ color: '#94A3B8' }}>{formatDate(rel.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

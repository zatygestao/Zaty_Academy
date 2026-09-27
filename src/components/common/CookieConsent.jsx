import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X, ChevronRight } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Verifica se o utilizador já deu o seu consentimento
    try {
      const consent = localStorage.getItem('zaty_cookie_consent');
      if (!consent) {
        // Pequeno atraso para entrada suave após a renderização inicial
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback em caso de bloqueio estrito de armazenamento local no navegador
      setIsVisible(true);
    }

    // Ouvinte para reabrir o banner caso o utilizador clique em 'Definições de Cookies' no rodapé
    const handleReopen = () => {
      setIsClosing(false);
      setIsVisible(true);
    };
    window.addEventListener('zaty_open_cookie_banner', handleReopen);
    return () => window.removeEventListener('zaty_open_cookie_banner', handleReopen);
  }, []);

  const saveConsent = (type) => {
    setIsClosing(true);
    try {
      localStorage.setItem(
        'zaty_cookie_consent',
        JSON.stringify({
          type, // 'all' | 'essential'
          timestamp: new Date().toISOString(),
          version: '1.0'
        })
      );
    } catch (e) {
      console.warn('Não foi possível gravar a preferência de cookies no localStorage:', e);
    }

    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 280);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Consentimento de Cookies e Privacidade"
      role="region"
      className={`zaty-cookie-banner ${isClosing ? 'is-closing' : ''}`}
    >
      {/* Botão de Fecho Rápido (X) */}
      <button
        type="button"
        onClick={() => saveConsent('essential')}
        title="Fechar e manter apenas essenciais"
        aria-label="Fechar notificação de cookies"
        className="zaty-cookie-close-btn"
      >
        <X size={17} />
      </button>

      <div className="zaty-cookie-content">
        {/* CABEÇALHO: ÍCONE + TÍTULO + BADGE */}
        <div className="zaty-cookie-header">
          <div className="zaty-cookie-icon-wrapper">
            <Cookie size={20} />
          </div>
          <div className="zaty-cookie-title-area">
            <div className="zaty-cookie-heading-row">
              <h3 className="zaty-cookie-heading">
                A sua privacidade e uso de cookies
              </h3>
              <span className="zaty-cookie-badge">
                Segurança Zaty
              </span>
            </div>
            <p className="zaty-cookie-description">
              A <strong>Zaty Academy</strong> utiliza cookies essenciais para garantir autenticação segura de sessões,
              proteger o portal e preservar as suas preferências académicas.
            </p>
          </div>
        </div>

        {/* RODAPÉ DO BANNER: CONFORMIDADE + BOTÕES DE AÇÃO */}
        <div className="zaty-cookie-actions-row">
          <div className="zaty-cookie-privacy-link-area">
            <ShieldCheck size={15} color="#00C7FD" style={{ flexShrink: 0 }} />
            <span className="zaty-cookie-compliance-text">Dados protegidos.</span>
            <Link
              to="/privacidade"
              className="zaty-cookie-policy-link"
              onClick={() => {
                // Mantém o banner ou permite navegação fluida
              }}
            >
              <span>Política de Privacidade</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="zaty-cookie-buttons-group">
            <button
              type="button"
              onClick={() => saveConsent('essential')}
              className="zaty-cookie-btn-secondary"
            >
              Apenas Essenciais
            </button>

            <button
              type="button"
              onClick={() => saveConsent('all')}
              className="zaty-cookie-btn-primary"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* BANNER GLOBAL INTEL COMMAND CENTER */
        .zaty-cookie-banner {
          position: fixed;
          bottom: max(1.25rem, env(safe-area-inset-bottom, 1.25rem));
          left: 1.25rem;
          right: 1.25rem;
          max-width: 860px;
          margin: 0 auto;
          z-index: 99999;
          background: linear-gradient(135deg, rgba(4, 18, 36, 0.97) 0%, rgba(2, 10, 22, 0.99) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 199, 253, 0.35);
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 199, 253, 0.16);
          padding: 1.25rem 1.45rem;
          color: #F8FAFC;
          opacity: 1;
          transform: translateY(0) scale(1);
          transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          animation: zatyCookieSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1);
          word-break: normal;
          overflow-wrap: break-word;
          hyphens: none;
        }

        .zaty-cookie-banner.is-closing {
          opacity: 0;
          transform: translateY(16px) scale(0.97);
          pointer-events: none;
        }

        /* BOTÃO DE FECHO (X) */
        .zaty-cookie-close-btn {
          position: absolute;
          top: 0.85rem;
          right: 0.85rem;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          z-index: 2;
        }
        .zaty-cookie-close-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        /* CONTEÚDO INTERNO */
        .zaty-cookie-content {
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
        }

        .zaty-cookie-header {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding-right: 1.75rem; /* Espaço para não colidir com o botão X */
        }

        .zaty-cookie-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(0, 199, 253, 0.12);
          border: 1px solid rgba(0, 199, 253, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00C7FD;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .zaty-cookie-title-area {
          flex: 1;
          min-width: 0;
        }

        .zaty-cookie-heading-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .zaty-cookie-heading {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          line-height: 1.35;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .zaty-cookie-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: rgba(0, 199, 253, 0.15);
          color: #00C7FD;
          border: 1px solid rgba(0, 199, 253, 0.25);
          white-space: nowrap;
          display: inline-block;
        }

        .zaty-cookie-description {
          margin: 0.35rem 0 0 0;
          font-size: 0.85rem;
          line-height: 1.45;
          color: #94A3B8;
          word-break: normal;
          overflow-wrap: break-word;
        }

        /* LINHA DE AÇÕES INFERIOR */
        .zaty-cookie-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.85rem;
          padding-top: 0.65rem;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .zaty-cookie-privacy-link-area {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          color: #64748B;
          flex-wrap: wrap;
        }

        .zaty-cookie-compliance-text {
          white-space: nowrap;
        }

        .zaty-cookie-policy-link {
          color: #00C7FD;
          text-decoration: none;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        .zaty-cookie-policy-link:hover {
          text-decoration: underline;
        }

        .zaty-cookie-buttons-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        /* BOTÃO SECUNDÁRIO */
        .zaty-cookie-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #E2E8F0;
          padding: 0.52rem 0.95rem;
          border-radius: 8px;
          font-size: 0.835rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          text-align: center;
          transition: all 0.15s ease;
        }
        .zaty-cookie-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.28);
          color: #FFFFFF;
        }

        /* BOTÃO PRIMÁRIO */
        .zaty-cookie-btn-primary {
          background: linear-gradient(135deg, #00C7FD 0%, #0072C6 100%);
          border: none;
          color: #001224;
          padding: 0.52rem 1.15rem;
          border-radius: 8px;
          font-size: 0.835rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 199, 253, 0.3);
          transition: all 0.15s ease;
        }
        .zaty-cookie-btn-primary:hover {
          box-shadow: 0 4px 16px rgba(0, 199, 253, 0.5);
          transform: translateY(-1px);
        }

        /* KEYFRAME DE ENTRADA SUAVE */
        @keyframes zatyCookieSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* =====================================================
           ADAPTAÇÃO ESPECÍFICA PARA MOBILE (TELAS ATÉ 640PX)
           Sem corte de texto, sem palavras quebradas e 100% fluido
           ===================================================== */
        @media (max-width: 640px) {
          .zaty-cookie-banner {
            bottom: max(0.65rem, env(safe-area-inset-bottom, 0.65rem));
            left: 0.65rem;
            right: 0.65rem;
            max-width: calc(100vw - 1.3rem);
            padding: 0.95rem 0.95rem 0.85rem 0.95rem;
            border-radius: 14px;
          }

          .zaty-cookie-close-btn {
            top: 0.65rem;
            right: 0.65rem;
            padding: 0.3rem;
          }

          .zaty-cookie-content {
            gap: 0.75rem;
          }

          .zaty-cookie-header {
            gap: 0.7rem;
            padding-right: 1.85rem;
          }

          .zaty-cookie-icon-wrapper {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }

          .zaty-cookie-heading-row {
            gap: 0.4rem;
          }

          .zaty-cookie-heading {
            font-size: 0.92rem;
            line-height: 1.3;
          }

          .zaty-cookie-badge {
            font-size: 0.65rem;
            padding: 0.1rem 0.45rem;
          }

          .zaty-cookie-description {
            font-size: 0.795rem;
            line-height: 1.4;
            margin-top: 0.3rem;
          }

          .zaty-cookie-actions-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.7rem;
            padding-top: 0.55rem;
          }

          .zaty-cookie-privacy-link-area {
            justify-content: center;
            font-size: 0.76rem;
            gap: 0.35rem;
          }

          /* BOTÕES NO MOBILE: GRID 2 COLUNAS (LADO A LADO) PERFEITO */
          .zaty-cookie-buttons-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            width: 100%;
          }

          .zaty-cookie-btn-secondary,
          .zaty-cookie-btn-primary {
            width: 100%;
            padding: 0.6rem 0.4rem;
            font-size: 0.8rem;
            border-radius: 8px;
            box-sizing: border-box;
          }

          body:has(.mobile-bottom-nav) .zaty-cookie-banner {
            bottom: calc(64px + var(--safe-area-bottom, 0.65rem)) !important;
          }
        }

        /* AJUSTE PARA TELAS ULTRA COMPACTAS (≤ 360PX) */
        @media (max-width: 360px) {
          .zaty-cookie-heading {
            font-size: 0.875rem;
          }
          .zaty-cookie-btn-secondary,
          .zaty-cookie-btn-primary {
            font-size: 0.75rem;
            padding: 0.55rem 0.25rem;
          }
        }
      `}</style>
    </aside>
  );
}

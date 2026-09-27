import React from 'react';

/**
 * Indicador oficial de carregamento da ZATY ACADEMY
 * Substitui o antigo ícone genérico de chapéu de graduação pelo logótipo real da instituição
 * com animação suave de pulso, halo de brilho e mensagem discreta.
 */
export default function ZatyLoadingScreen({ message = 'A carregar dados do sistema...' }) {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      padding: '2rem 1rem'
    }}>
      {/* Logótipo Oficial da Zaty Academy com animação suave de pulso e brilho */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        {/* Halo de Brilho Ciano/Azul Suave */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 199, 253, 0.25) 0%, rgba(0, 114, 181, 0.05) 70%, transparent 100%)',
          filter: 'blur(16px)',
          animation: 'zatyGlow 2.5s ease-in-out infinite alternate'
        }} />

        {/* Logótipo Oficial Real da Instituição */}
        <img 
          src="/logo.png" 
          alt="ZATY ACADEMY" 
          style={{
            height: 'clamp(48px, 8vw, 64px)',
            maxWidth: '220px',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            animation: 'zatyPulse 2.4s ease-in-out infinite alternate'
          }} 
        />
      </div>

      {/* Indicador de Progresso Circular Discreto e Mensagem */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: 'rgba(0, 24, 48, 0.6)',
        border: '1px solid rgba(0, 163, 224, 0.25)',
        padding: '0.45rem 1rem',
        borderRadius: '9999px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 199, 253, 0.25)',
          borderTopColor: '#00C7FD',
          animation: 'zatySpin 0.85s linear infinite'
        }} />
        <span style={{ color: '#E2E8F0', fontSize: '0.85rem', letterSpacing: '0.02em', fontWeight: '500' }}>
          {message}
        </span>
      </div>

      <style>{`
        @keyframes zatyPulse {
          0% { transform: scale(0.96); opacity: 0.88; }
          100% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes zatyGlow {
          0% { opacity: 0.35; transform: scale(0.85); }
          100% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes zatySpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

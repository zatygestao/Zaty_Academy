import React from 'react';
import { useSettings } from '../../context/SettingsContext';

/**
 * Componente unificado do Logotipo Oficial da Zaty Academy.
 * Utiliza a logo oficial carregada nas configurações ou o ficheiro estático /logo.png.
 */
export default function BrandLogo({ 
  size = 38, 
  showText = false, 
  subtitle = false, 
  style = {},
  imgStyle = {},
  glow = false
}) {
  const settingsContext = useSettings();
  const settings = settingsContext?.settings;

  const logoUrl = settings?.institution?.logo_url || '/logo.png';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', ...style }}>
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          filter: glow ? 'drop-shadow(0 4px 14px rgba(0, 199, 253, 0.45))' : 'none'
        }}
      >
        <img 
          src={logoUrl} 
          alt="Zaty Academy Logo" 
          onError={(e) => {
            if (!e.target.src.endsWith('/logo.png')) {
              e.target.src = '/logo.png';
            }
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            ...imgStyle
          }} 
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div 
            className="brand-title-text"
            style={{ 
              fontWeight: '800', 
              fontSize: size > 42 ? '1.3rem' : 'clamp(0.92rem, 3.8vw, 1.1rem)', 
              letterSpacing: '-0.02em', 
              lineHeight: '1.1', 
              whiteSpace: 'nowrap' 
            }}
          >
            <span style={{ color: '#FFFFFF' }}>ZATY </span>
            <span style={{ color: 'var(--intel-cyan, #00C7FD)' }}>ACADEMY</span>
          </div>
          {subtitle && (
            <div 
              className="brand-subtitle-responsive"
              style={{ 
                fontSize: '0.7rem', 
                color: 'var(--intel-text-secondary, #A5CBEA)', 
                fontWeight: '400', 
                letterSpacing: '0.02em', 
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '220px'
              }}
            >
              {settings?.institution?.tagline || 'Centro de Formação em Informática e Tecnologia'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

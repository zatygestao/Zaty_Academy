import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { Megaphone, ArrowRight, X, Sparkles, Calendar, Laptop } from 'lucide-react';

export default function EnrollmentFloatingBanner() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(false);
  const [bannerImageIndex, setBannerImageIndex] = useState(0);

  // Exclusivamente controlado pelo Administrador via configurações académicas
  const isEnabled = settings.academic?.enrollment_notice_enabled === true;

  // Rotação Automática da Imagem do Banner (Muda a cada 4.5s)
  useEffect(() => {
    if (!isEnabled || settings.academic?.enrollment_flyer_image) return;

    const timer = setInterval(() => {
      setBannerImageIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isEnabled, settings.academic?.enrollment_flyer_image]);

  if (!isEnabled) {
    return null;
  }

  const title = settings.academic?.enrollment_title || 'INSCRIÇÕES ABERTAS!';
  const period = settings.academic?.enrollment_period || 'Ano Formativo 2026';

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        title="Ver Aviso de Inscrições Abertas"
        style={{
          position: 'fixed',
          right: '1.5rem',
          bottom: '1.5rem',
          zIndex: 999,
          background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50px',
          padding: '0.65rem 1.15rem',
          boxShadow: '0 8px 24px rgba(0, 199, 253, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '0.85rem',
          animation: 'bounce 2s infinite'
        }}
      >
        <Megaphone size={16} />
        <span>Inscrições Abertas</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '1.5rem',
        bottom: '1.5rem',
        zIndex: 999,
        maxWidth: '360px',
        width: 'calc(100% - 3rem)',
        background: 'rgba(4, 22, 40, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid #00C7FD',
        borderRadius: '12px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 199, 253, 0.25)',
        overflow: 'hidden',
        animation: 'slideInRight 0.35s ease-out'
      }}
    >
      {/* Faixa Superior de Destaque */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0072B5 0%, #00C7FD 100%)',
          padding: '0.4rem 0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <Sparkles size={13} />
          <span>COMUNICADO OFICIAL</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(true);
          }}
          title="Minimizar aviso"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.85
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Mini-Banner Fotográfico em Rotação Automática */}
      <div 
        onClick={() => navigate('/inscricoes-abertas')}
        style={{ 
          height: '92px', 
          position: 'relative', 
          overflow: 'hidden', 
          cursor: 'pointer',
          background: '#041628' 
        }}
      >
        {DEFAULT_IT_STUDY_IMAGES.map((imgUrl, i) => {
          const isActive = settings.academic?.enrollment_flyer_image 
            ? settings.academic?.enrollment_flyer_image === imgUrl 
            : bannerImageIndex === i;
          return (
            <img
              key={i}
              src={imgUrl}
              alt="Laboratório de Informática Zaty Academy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out'
              }}
            />
          );
        })}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(4, 22, 40, 0.95) 0%, rgba(4, 22, 40, 0.2) 60%, transparent 100%)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '6px',
          left: '10px',
          background: 'rgba(0, 51, 102, 0.88)',
          border: '1px solid rgba(0, 199, 253, 0.35)',
          color: '#FFFFFF',
          fontSize: '0.62rem',
          fontWeight: '700',
          padding: '2px 7px',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Laptop size={11} color="#00C7FD" />
          <span>Aulas Práticas no Laboratório</span>
        </div>
      </div>

      {/* Conteúdo Central */}
      <div 
        onClick={() => navigate('/inscricoes-abertas')}
        style={{ 
          padding: '0.85rem 1rem 1rem 1rem', 
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(0, 199, 253, 0.15)',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00C7FD',
              flexShrink: 0
            }}
          >
            <Megaphone size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: '0.92rem',
                fontWeight: '800',
                color: '#FFFFFF',
                margin: '0 0 0.25rem 0',
                lineHeight: 1.3
              }}
            >
              {title}
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#34D399', marginBottom: '0.5rem' }}>
              <Calendar size={12} />
              <span>{period}</span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              Consulte o edital com requisitos, cursos disponíveis e garanta a sua vaga online.
            </p>
          </div>
        </div>

        {/* Botão de Ação */}
        <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#00C7FD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Ver Edital e Informações</span>
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

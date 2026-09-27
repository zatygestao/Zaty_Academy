import { useState } from 'react';
import { User } from 'lucide-react';

export default function UserAvatar({
  photoUrl,
  name = 'Utilizador',
  size = 38,
  borderRadius = '50%',
  role = 'estudante',
  showOnlineDot = false,
  isOnline = true
}) {
  const [imgError, setImgError] = useState(false);

  // Determinar cores de fundo do avatar de fallback com base no perfil
  const getGradient = () => {
    switch (role) {
      case 'formador':
        return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
      case 'suporte':
      case 'admin':
      case 'super_admin':
        return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
      case 'estudante':
      default:
        return 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)';
    }
  };

  const initial = (name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius,
            objectFit: 'cover',
            display: 'block',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius,
            background: getGradient(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: size <= 32 ? '0.78rem' : size <= 44 ? '0.95rem' : '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          title={name}
        >
          {initial || <User size={Math.round(size * 0.55)} />}
        </div>
      )}

      {/* Ponto verde de presença online em tempo real */}
      {showOnlineDot && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(9, Math.round(size * 0.26)) + 'px',
            height: Math.max(9, Math.round(size * 0.26)) + 'px',
            borderRadius: '50%',
            background: isOnline ? '#10B981' : '#64748B',
            border: '2px solid #001A33',
            boxShadow: isOnline ? '0 0 8px #10B981' : 'none'
          }}
          title={isOnline ? 'Online agora' : 'Offline'}
        />
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { X } from 'lucide-react';

let activeModalsCount = 0;

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }) {
  useEffect(() => {
    if (!isOpen) return;

    activeModalsCount++;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid rgba(0, 163, 224, 0.2)'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: '600' }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--intel-text-secondary)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#FFFFFF'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--intel-text-secondary)'}
          >
            <X size={20} />
          </button>
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

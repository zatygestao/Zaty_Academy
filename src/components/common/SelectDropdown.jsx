import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Componente SelectDropdown de alta fidelidade no padrão Intel Command Center (Imagem 1).
 * Fundo azul translúcido, cantos suaves, item selecionado com barra sólida escura.
 */
export default function SelectDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  label,
  disabled = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label className="form-label" style={{ marginBottom: '0.35rem' }}>
          {label}
        </label>
      )}

      {/* Botão Gatilho / Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 0.95rem',
          background: 'rgba(0, 24, 48, 0.85)',
          border: isOpen ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.28)',
          boxShadow: isOpen ? '0 0 0 2px rgba(0, 199, 253, 0.25)' : 'none',
          borderRadius: '4px',
          color: selectedOption ? '#FFFFFF' : '#94A3B8',
          fontSize: '0.885rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseOver={e => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = 'rgba(0, 199, 253, 0.5)';
            e.currentTarget.style.background = 'rgba(0, 32, 64, 0.95)';
          }
        }}
        onMouseOut={e => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = 'rgba(0, 163, 224, 0.28)';
            e.currentTarget.style.background = 'rgba(0, 24, 48, 0.85)';
          }
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          color="#00C7FD" 
          style={{ 
            flexShrink: 0, 
            marginLeft: '0.5rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {/* Menu Flutuante no Padrão da Imagem 1 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'rgba(0, 34, 66, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 163, 224, 0.35)',
            borderRadius: '6px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 199, 253, 0.4)',
            overflow: 'hidden',
            padding: '0.4rem 0',
            maxHeight: '260px',
            overflowY: 'auto'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center' }}>
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(0, 18, 38, 0.95)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    fontWeight: isSelected ? '600' : '400',
                    borderLeft: isSelected ? '2px solid #00C7FD' : '2px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#CBD5E1';
                    }
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={15} color="#00C7FD" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

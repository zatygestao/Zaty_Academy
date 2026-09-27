import { useState } from 'react';
import { KeyRound, Copy, Check, Eye, EyeOff, Clock, ShieldAlert, X, Send } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export default function TeacherCredentialsModal({ isOpen, onClose, teacherName, credentials }) {
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [copiedFull, setCopiedFull] = useState(false);

  if (!isOpen || !credentials) return null;

  const email = credentials.email || '';
  const tempPassword = credentials.temporaryPassword || credentials.tempPassword || '';
  const expiresAt = credentials.expiresAt;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz';

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullMessage = () => {
    const formattedExpiry = expiresAt ? formatDateTime(expiresAt) : '48 horas';
    const message = `🏛️ *ZATY ACADEMY — Credenciais Provisórias do Formador*

Olá, *${teacherName || 'Formador'}*! A sua conta docente foi criada no portal oficial da Zaty Academy com credenciais de acesso provisórias.

🔗 *Portal de Login:* ${origin}/login
📧 *E-mail Provisório:* ${email}
🔑 *Senha Provisória:* ${tempPassword}
⏳ *Prazo de Validade:* 48 Horas (expira em ${formattedExpiry})

⚠️ *Aviso de Segurança:* Por motivos de proteção institucional, o sistema solicitará que informe o seu e-mail pessoal definitivo e defina uma nova palavra-passe logo no seu primeiro acesso.`;

    navigator.clipboard.writeText(message);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 10, 25, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.25rem'
    }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          padding: '2.25rem',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0
            }}>
              <KeyRound size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Credenciais de Acesso do Formador
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Geradas com segurança para {teacherName}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerta de Validade de 48 Horas */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          color: '#FEF3C7',
          display: 'flex',
          gap: '0.65rem',
          alignItems: 'flex-start'
        }}>
          <Clock size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Credenciais Provisórias Válidas por 48 Horas:</strong> O formador deverá fazer o primeiro login e definir a sua senha pessoal definitiva dentro deste prazo.
          </div>
        </div>

        {/* Caixas dos Dados de Acesso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* E-mail */}
          <div style={{
            background: 'rgba(0, 20, 40, 0.65)',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                E-mail de Acesso
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF' }}>
                {email}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(email, 'email')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              {copiedField === 'email' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Senha Temporária */}
          <div style={{
            background: 'rgba(0, 20, 40, 0.65)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Senha Provisória do Sistema
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: showPassword ? '0.02em' : '0.15em', fontFamily: 'monospace' }}>
                {showPassword ? tempPassword : '••••••••••••'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.5rem' }}
                title={showPassword ? 'Ocultar' : 'Visualizar'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(tempPassword, 'pass')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                {copiedField === 'pass' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{copiedField === 'pass' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Botão de Envio Formatado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={copyFullMessage}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.885rem' }}
          >
            {copiedFull ? <Check size={16} color="#10B981" /> : <Send size={16} />}
            <span>
              {copiedFull ? 'Mensagem Copiada com Sucesso!' : 'Copiar Mensagem Pronta para WhatsApp / E-mail'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

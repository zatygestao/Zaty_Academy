import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/api';
import BrandLogo from '../../components/common/BrandLogo';
import { GraduationCap, Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await requestPasswordReset(email.trim());
      setFeedbackMessage(res.message);
      setSubmitted(true);
    } catch (err) {
      console.error('Erro na solicitação de recuperação:', err);
      // Mensagem neutra mesmo em caso de erro para segurança contra enumeração
      setFeedbackMessage('Se o e-mail estiver registado no sistema, enviámos as instruções com link seguro para definir uma nova palavra-passe.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'clamp(2rem, 6vw, 4.5rem) 1.25rem', maxWidth: '460px' }}>
      <div className="glass-card" style={{ padding: 'clamp(1.5rem, 5vw, 2.25rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <BrandLogo size={58} glow={true} style={{ justifyContent: 'center', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'clamp(1.3rem, 4.5vw, 1.55rem)', fontWeight: '800', marginBottom: '0.35rem', color: '#FFFFFF' }}>
            Recuperação de Acesso
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            Insira o seu e-mail de acesso para receber um link seguro de redefinição de palavra-passe.
          </p>
        </div>

        {submitted ? (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '4px',
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={32} color="#10B981" />
              <div style={{ color: '#A7F3D0', fontSize: '0.885rem', lineHeight: 1.5 }}>
                {feedbackMessage}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Caso não encontre a mensagem na sua caixa de entrada, verifique a pasta de Spam ou Lixo Eletrónico.
              </div>
            </div>

            <Link 
              to="/login" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Voltar ao Início de Sessão
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: '#FCA5A5',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Endereço de E-mail Registado</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="form-input" 
                placeholder="exemplo@zatyacademy.co.mz" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {loading ? 'A ENVIAR LINK SEGURO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
            </button>

            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem', fontSize: '0.825rem' }}>
              <Link to="/login" style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

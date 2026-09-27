import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPasswordWithToken } from '../../services/api';
import { supabase } from '../../config/supabase';
import BrandLogo from '../../components/common/BrandLogo';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se existe sessão activa de recuperação de senha
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se não houver sessão nem hash de recuperação, alerta sobre link expirado
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('type=recovery') && !window.location.search.includes('code=')) {
          setErrorMsg('O link de recuperação parece inválido ou já expirou. Por favor solicite um novo link.');
        }
      }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação da palavra-passe não coincide.');
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithToken(password);
      setSuccess(true);
      // Desconectar sessão temporária para forçar novo login com a nova senha
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 2000);
    } catch (err) {
      console.error('Erro ao redefinir palavra-passe:', err);
      setErrorMsg(err.message || 'Falha ao redefinir palavra-passe. O token pode ter expirado.');
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
            Definir Nova Senha
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            Crie uma nova palavra-passe segura para a sua conta.
          </p>
        </div>

        {success ? (
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
              <div style={{ color: '#A7F3D0', fontSize: '0.95rem', fontWeight: '700' }}>
                Palavra-passe Redefinida!
              </div>
              <div style={{ fontSize: '0.825rem', color: '#CBD5E1' }}>
                A sua nova palavra-passe foi atualizada com sucesso. Já pode aceder à sua conta com as novas credenciais.
              </div>
            </div>

            <Link 
              to="/login" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Ir para o Início de Sessão
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

            <div className="form-group">
              <label className="form-label">Nova Palavra-passe *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Mínimo 6 caracteres" 
                  required 
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--intel-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Confirmar Nova Palavra-passe *</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="form-input" 
                placeholder="Repita a nova palavra-passe" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {loading ? 'A GUARDAR NOVA PALAVRA-PASSE...' : 'GUARDAR NOVA PALAVRA-PASSE'}
            </button>

            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem', fontSize: '0.825rem' }}>
              <Link to="/login" style={{ color: '#00C7FD', fontWeight: '600', textDecoration: 'none' }}>
                Voltar ao Início de Sessão
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

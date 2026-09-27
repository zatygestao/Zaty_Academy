import { useState } from 'react';
import { changeTeacherTemporaryPassword } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validators';
import { Lock, ShieldAlert, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';

export default function FirstLoginPasswordChangeModal({ onPasswordChanged }) {
  const { user, refreshProfile } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanConfirmEmail = confirmEmail.trim().toLowerCase();
    const currentEmail = (user?.email || '').trim().toLowerCase();

    // 1. Validação do novo e-mail real
    if (!cleanEmail) {
      setErrorMsg('Por favor, introduza o seu novo e-mail pessoal ou definitivo.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('O endereço de e-mail introduzido não é válido. Exemplo: seu.nome@gmail.com');
      return;
    }
    if (currentEmail && cleanEmail === currentEmail) {
      setErrorMsg('O novo e-mail deve ser o seu e-mail pessoal ou definitivo real, diferente do e-mail provisório institucional atual.');
      return;
    }
    if (cleanEmail !== cleanConfirmEmail) {
      setErrorMsg('Os endereços de e-mail introduzidos não coincidem.');
      return;
    }

    // 2. Validação das senhas
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas introduzidas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await changeTeacherTemporaryPassword(newPassword, cleanEmail);
      
      // Re-autenticar imediatamente a sessão com as novas credenciais reais definitivas
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: newPassword
        });
      } catch (_) {}

      if (refreshProfile) await refreshProfile();
      if (onPasswordChanged) onPasswordChanged();
    } catch (err) {
      console.error('Erro ao atualizar credenciais do formador:', err);
      setErrorMsg(err.message || 'Falha ao atualizar as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 15, 30, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.25rem',
      overflowY: 'auto'
    }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          padding: '2.25rem',
          border: '1px solid rgba(0, 199, 253, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          margin: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '8px',
            background: 'rgba(0, 199, 253, 0.15)',
            border: '1px solid #00C7FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C7FD',
            flexShrink: 0
          }}>
            <Lock size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Primeiro Acesso — Configuração Obrigatória
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Segurança da Conta do Formador</span>
          </div>
        </div>

        {/* Mensagem Informativa Oficial Exigida */}
        <div style={{
          background: 'rgba(0, 114, 206, 0.15)',
          border: '1px solid rgba(0, 199, 253, 0.35)',
          borderRadius: '8px',
          padding: '1.15rem',
          marginBottom: '1.5rem',
          fontSize: '0.885rem',
          lineHeight: '1.6',
          color: '#E2E8F0',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={22} color="#00C7FD" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            Por motivos de segurança, as credenciais de acesso foram geradas automaticamente pelo sistema. Altere o seu e-mail e a sua senha provisórios para as suas credenciais pessoais antes de continuar a utilizar o sistema.
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            color: '#FCA5A5',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Novo E-mail */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              Novo E-mail Pessoal / Corporativo Definitivo *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                placeholder="ex: seu.nome@gmail.com" 
                required 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail 
                size={16} 
                color="#94A3B8" 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
            <span style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              E-mail provisório atual: {user?.email || 'carregando...'}
            </span>
          </div>

          {/* Confirmar Novo E-mail */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              Confirmar Novo E-mail *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                value={confirmEmail} 
                onChange={e => setConfirmEmail(e.target.value)} 
                placeholder="Repita o novo e-mail" 
                required 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail 
                size={16} 
                color="#94A3B8" 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
          </div>

          {/* Nova Senha */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              Nova Senha Pessoal Definitiva *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres" 
                required 
                minLength={6}
                className="form-input" 
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
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              Confirmar Nova Senha *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Repita a nova senha" 
                required 
                minLength={6}
                className="form-input" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem', fontWeight: '700' }}
          >
            {loading ? 'A configurar credenciais...' : 'Guardar Credenciais e Aceder ao Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { updateStudent } from '../../services/api';
import StudentSidebar from '../../components/student/StudentSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { formatDate } from '../../utils/formatters';
import { 
  User, 
  Lock, 
  Save 
} from 'lucide-react';

export default function StudentProfile() {
  const { student, user, refreshProfile } = useAuth();

  const [phone, setPhone] = useState(student?.phone || '');
  const [altPhone, setAltPhone] = useState(student?.alternative_phone || '');
  const [neighborhood, setNeighborhood] = useState(student?.neighborhood || '');
  const [city, setCity] = useState(student?.city || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [msgInfo, setMsgInfo] = useState({ type: '', text: '' });
  const [msgPass, setMsgPass] = useState({ type: '', text: '' });

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setMsgInfo({ type: '', text: '' });

    try {
      await updateStudent(student.id, {
        phone: phone.trim(),
        alternative_phone: altPhone.trim() || null,
        neighborhood: neighborhood.trim(),
        city: city.trim()
      });

      await refreshProfile();
      setMsgInfo({ type: 'success', text: 'Dados de contacto actualizados com sucesso!' });
    } catch (err) {
      console.error('Erro ao actualizar perfil:', err);
      setMsgInfo({ type: 'error', text: 'Falha ao gravar alterações. Tente novamente.' });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSavingPass(true);
    setMsgPass({ type: '', text: '' });

    if (newPassword.length < 6) {
      setSavingPass(false);
      return setMsgPass({ type: 'error', text: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    if (newPassword !== confirmPassword) {
      setSavingPass(false);
      return setMsgPass({ type: 'error', text: 'As palavras-passe não coincidem.' });
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMsgPass({ type: 'success', text: 'Palavra-passe alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      setMsgPass({ type: 'error', text: err.message || 'Falha ao atualizar a palavra-passe.' });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <StudentSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>Meu Perfil & Segurança</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Consulte os seus dados cadastrais e gira a sua palavra-passe de acesso.
          </p>
        </div>

        <div className="grid-2">
          {/* Dados Pessoais & Contactos */}
          <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#00C7FD" />
              Informações Cadastrais
            </h3>

            {/* Avatar e Resumo do Estudante */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.15)' }}>
              <UserAvatar 
                photoUrl={student?.photo_url} 
                name={student?.full_name || 'Estudante'} 
                size={60} 
                role="estudante" 
              />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  {student?.full_name || 'Estudante'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#00C7FD', margin: '0.2rem 0 0 0', fontWeight: '600' }}>
                  {student?.student_code ? `Código: ${student.student_code}` : student?.email}
                </p>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Perfil de Aluno • Zaty Academy
                </span>
              </div>
            </div>

            {msgInfo.text && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                marginBottom: '1.15rem',
                fontSize: '0.825rem',
                background: msgInfo.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: msgInfo.type === 'success' ? '#34D399' : '#FCA5A5',
                border: msgInfo.type === 'success' ? '1px solid #10B981' : '1px solid #EF4444'
              }}>
                {msgInfo.text}
              </div>
            )}

            <form onSubmit={handleUpdateContact}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" value={student?.full_name || ''} disabled className="form-input" style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Para alterar o nome legal, solicite à secretaria.</span>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail de Acesso</label>
                <input type="email" value={student?.email || user?.email || ''} disabled className="form-input" style={{ opacity: 0.7 }} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Nascimento</label>
                  <input type="text" value={formatDate(student?.birth_date)} disabled className="form-input" style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Código Único de Estudante</label>
                  <input type="text" value={student?.student_code || '—'} disabled className="form-input" style={{ opacity: 0.7, fontFamily: 'monospace', fontWeight: '700', color: '#00C7FD' }} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Telefone Principal *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone Alternativo</label>
                  <input type="tel" value={altPhone} onChange={e => setAltPhone(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bairro de Residência</label>
                  <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="form-input" />
                </div>
              </div>

              <button type="submit" disabled={savingInfo} className="btn btn-primary mobile-btn-full" style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                <Save size={15} />
                <span>{savingInfo ? 'A GRAVAR...' : 'ACTUALIZAR CONTACTOS'}</span>
              </button>
            </form>
          </div>

          {/* Segurança & Palavra-passe */}
          <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#00C7FD" />
              Segurança & Senha
            </h3>

            {msgPass.text && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                marginBottom: '1.15rem',
                fontSize: '0.825rem',
                background: msgPass.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: msgPass.type === 'success' ? '#34D399' : '#FCA5A5',
                border: msgPass.type === 'success' ? '1px solid #10B981' : '1px solid #EF4444'
              }}>
                {msgPass.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">Nova Palavra-passe</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Mínimo 6 caracteres"
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirmar Nova Palavra-passe</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Repita a nova palavra-passe"
                  required 
                />
              </div>

              <button type="submit" disabled={savingPass} className="btn btn-secondary mobile-btn-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                <Lock size={15} />
                <span>{savingPass ? 'A ACTUALIZAR...' : 'ALTERAR PALAVRA-PASSE'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

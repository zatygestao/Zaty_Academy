import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { updateTeacherSelfProfile, uploadPublicFile } from '../../services/api';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { 
  GraduationCap, 
  Lock, 
  Save, 
  Camera, 
  Phone, 
  FileText, 
  Mail, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function TeacherProfile() {
  const { teacher, profile, user, refreshProfile } = useAuth();
  const teacherId = teacher?.id;

  const [phone, setPhone] = useState(teacher?.phone || profile?.phone || '');
  const [bio, setBio] = useState(teacher?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(teacher?.photo_url || profile?.avatar_url || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [msgInfo, setMsgInfo] = useState({ type: '', text: '' });
  const [msgPass, setMsgPass] = useState({ type: '', text: '' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (teacher) {
      setPhone(teacher.phone || profile?.phone || '');
      setBio(teacher.bio || '');
      setPhotoUrl(teacher.photo_url || profile?.avatar_url || '');
    }
  }, [teacher, profile]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMsgInfo({ type: 'error', text: 'A imagem deve ter no máximo 3MB.' });
      return;
    }

    setUploadingPhoto(true);
    setMsgInfo({ type: '', text: '' });

    try {
      const uploadedUrl = await uploadPublicFile(file, 'avatars');
      setPhotoUrl(uploadedUrl);

      if (teacherId) {
        await updateTeacherSelfProfile(teacherId, { photo_url: uploadedUrl });
        await refreshProfile();
      }

      setMsgInfo({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
    } catch (err) {
      console.error('Erro no upload da foto:', err);
      setMsgInfo({ type: 'error', text: 'Falha ao carregar fotografia. Tente novamente.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!teacherId) return;

    setSavingInfo(true);
    setMsgInfo({ type: '', text: '' });

    try {
      await updateTeacherSelfProfile(teacherId, {
        phone: phone.trim(),
        bio: bio.trim(),
        photo_url: photoUrl
      });

      await refreshProfile();
      setMsgInfo({ type: 'success', text: 'Informações de perfil atualizadas com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar perfil do formador:', err);
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

      // Se o formador ainda tinha flag de troca obrigatória, remover
      if (teacherId) {
        await supabase
          .from('academy_teachers')
          .update({
            must_change_password: false,
            specialties: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', teacherId);
      }

      await refreshProfile();
      setMsgPass({ type: 'success', text: 'Palavra-passe alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      setMsgPass({ type: 'error', text: err.message || 'Falha ao atualizar palavra-passe.' });
    } finally {
      setSavingPass(false);
    }
  };

  const teacherName = teacher?.full_name || teacher?.name || profile?.full_name || 'Formador';
  const teacherEmail = teacher?.email || user?.email || '';
  const specialty = teacher?.specialty || 'Corpo Docente Zaty Academy';

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <TeacherSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            Meu Perfil & Segurança
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 'clamp(0.8rem, 2.5vw, 0.885rem)', marginTop: '0.25rem' }}>
            Consulte e atualize os seus dados docentes e faça a gestão da sua palavra-passe de acesso.
          </p>
        </div>

        <div className="grid-2">
          {/* Card: Informações Docentes & Contacto */}
          <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} color="#00C7FD" />
              Informações do Formador
            </h3>

            {/* Cabeçalho com Avatar e Upload de Foto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.15)' }}>
              <div style={{ position: 'relative' }}>
                <UserAvatar 
                  photoUrl={photoUrl} 
                  name={teacherName} 
                  size={68} 
                  role="formador" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#00C7FD',
                    border: '2px solid #001830',
                    color: '#001428',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 199, 253, 0.4)'
                  }}
                  title="Alterar Fotografia de Perfil"
                >
                  <Camera size={13} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  {teacherName}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#00C7FD', margin: '0.2rem 0 0 0', fontWeight: '600' }}>
                  {specialty}
                </p>
                <span className="badge badge-info" style={{ fontSize: '0.68rem', marginTop: '0.35rem', display: 'inline-block' }}>
                  Docente Zaty Academy
                </span>
              </div>
            </div>

            {msgInfo.text && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                marginBottom: '1.15rem',
                fontSize: '0.825rem',
                background: msgInfo.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: msgInfo.type === 'success' ? '#34D399' : '#FCA5A5',
                border: msgInfo.type === 'success' ? '1px solid #10B981' : '1px solid #EF4444'
              }}>
                {msgInfo.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input 
                  type="text" 
                  value={teacherName} 
                  disabled 
                  className="form-input" 
                  style={{ opacity: 0.7 }} 
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Para alterar o nome cadastrado na instituição, contacte a secretaria.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>E-mail Definitivo da Conta</span>
                  <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.3)' }}>
                    Bloqueado para Edição
                  </span>
                </label>
                <input 
                  type="email" 
                  value={teacherEmail} 
                  disabled 
                  className="form-input" 
                  style={{ opacity: 0.8, fontFamily: 'monospace', cursor: 'not-allowed', background: 'rgba(0, 20, 40, 0.4)' }} 
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  Por segurança institucional, o seu e-mail definitivo não pode ser alterado diretamente. Caso necessite de atualização, contacte o Administrador.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Especialidade / Área de Ensino</label>
                <input 
                  type="text" 
                  value={specialty} 
                  disabled 
                  className="form-input" 
                  style={{ opacity: 0.7 }} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone de Contacto *</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  className="form-input" 
                  placeholder="Ex: +258 84 000 0000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biografia / Apresentação Docente</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  className="form-input" 
                  rows={4}
                  placeholder="Descreva a sua formação, experiência e métodos pedagógicos..."
                />
              </div>

              <button 
                type="submit" 
                disabled={savingInfo} 
                className="btn btn-primary" 
                style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                <Save size={15} />
                {savingInfo ? 'A GRAVAR...' : 'GUARDAR ALTERAÇÕES'}
              </button>
            </form>
          </div>

          {/* Card: Segurança & Palavra-passe */}
          <div className="glass-card" style={{ padding: 'clamp(1.15rem, 3.5vw, 1.75rem)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#00C7FD" />
              Segurança & Senha
            </h3>

            <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              A sua palavra-passe é pessoal e intransmissível. Defina uma combinação segura com pelo menos 6 caracteres.
            </p>

            {msgPass.text && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
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
                  required 
                  placeholder="Mínimo de 6 caracteres"
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Nova Palavra-passe</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Repita a nova palavra-passe"
                  className="form-input" 
                />
              </div>

              <button 
                type="submit" 
                disabled={savingPass || !newPassword} 
                className="btn btn-secondary" 
                style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                <Lock size={15} />
                {savingPass ? 'A ATUALIZAR...' : 'ALTERAR PALAVRA-PASSE'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

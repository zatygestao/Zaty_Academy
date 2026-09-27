import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { confirmUserEmail, recordAuditLog } from '../../services/api';
import BrandLogo from '../../components/common/BrandLogo';
import { GraduationCap, LogIn, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

export default function Login() {
  const { signIn, signOut, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }

    try {
      const flash = sessionStorage.getItem('zaty_auth_flash');
      if (flash) {
        sessionStorage.removeItem('zaty_auth_flash');
        const parsed = JSON.parse(flash);
        if (parsed?.message) {
          setErrorMsg(parsed.message);
          return;
        }
      }
    } catch (_) {}

    if (location.state?.reason === 'account_suspended') {
      setErrorMsg(location.state?.message || 'A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.');
    } else if (location.state?.reason === 'account_deleted') {
      setErrorMsg(location.state?.message || 'Esta conta não existe mais ou foi desativada permanentemente pela administração.');
    } else if (location.state?.reason === 'teacher_credentials_expired') {
      setErrorMsg('O prazo de 48 horas para ativação das suas credenciais provisórias de formador expirou. Por motivos de segurança, solicite ao Administrador da Zaty Academy a regeneração do seu acesso.');
    }
  }, [user, location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 0. Verificação preliminar: Bloquear na origem caso seja um e-mail provisório já invalidado
      try {
        const { data: invTeacher } = await supabase
          .from('academy_teachers')
          .select('id, full_name, email, must_change_password, specialties')
          .ilike('specialties', `%__INVALIDATED_PROVISIONAL_EMAIL__::${cleanEmail}%`)
          .maybeSingle();

        if (invTeacher && !invTeacher.must_change_password && invTeacher.email.toLowerCase() !== cleanEmail) {
          setErrorMsg('Este e-mail provisório foi permanentemente desativado após o seu primeiro acesso. Por favor, utilize o seu novo e-mail definitivo para aceder ao sistema.');
          setLoading(false);
          return;
        }
      } catch (_) {}

      let authData = null;

      try {
        authData = await signIn(cleanEmail, cleanPassword);
      } catch (authErr) {
        // Se der erro de e-mail não confirmado, tentar auto-confirmação via RPC e re-tentar autenticação
        if (authErr?.message?.includes('Email not confirmed')) {
          const confirmed = await confirmUserEmail(cleanEmail);
          if (confirmed) {
            authData = await signIn(cleanEmail, cleanPassword);
          } else {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      if (!authData?.user?.id) {
        throw new Error('Falha ao autenticar utilizador.');
      }

      // 1. Verificação Imediata de Segurança no Perfil Geral (academy_profiles)
      const { data: prof } = await supabase
        .from('academy_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (prof && prof.is_active === false) {
        await signOut();
        if (typeof window !== 'undefined') sessionStorage.clear();
        setErrorMsg('A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.');
        setLoading(false);
        return;
      }
      
      // Buscar perfil e verificar tabelas para determinar destino e papel correto
      let userRole = prof?.role || 'student';

      // 2. Verificar se é Formador em academy_teachers
      const { data: teacherCheck } = await supabase
        .from('academy_teachers')
        .select('*')
        .or(`user_id.eq.${authData.user.id},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (prof?.role === 'formador' && !teacherCheck) {
        // Conta de formador foi eliminada da instituição
        await signOut();
        if (typeof window !== 'undefined') sessionStorage.clear();
        setErrorMsg('Esta conta não existe mais ou foi desativada permanentemente pela administração.');
        setLoading(false);
        return;
      }

      if (teacherCheck) {
        userRole = 'formador';

        // A. Verificar se a conta do formador está suspensa ou bloqueada
        if (teacherCheck.is_active === false || teacherCheck.is_blocked === true || teacherCheck.status === 'suspenso') {
          await signOut();
          if (typeof window !== 'undefined') sessionStorage.clear();
          setErrorMsg('A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.');
          setLoading(false);
          return;
        }

        // C. O e-mail provisório não pode continuar funcionando como credencial alternativa após configuração
        if (!teacherCheck.must_change_password && teacherCheck.email.toLowerCase() !== cleanEmail) {
          await signOut();
          setErrorMsg(`Acesso recusado: As credenciais provisórias desta conta foram permanentemente invalidadas. Utilize exclusivamente o seu novo e-mail definitivo (${teacherCheck.email}).`);
          setLoading(false);
          return;
        }

        // D. Verificar regra estrita de 48 horas nas credenciais provisórias ainda pendentes
        if (teacherCheck.must_change_password && teacherCheck.temporary_credentials_expires_at) {
          if (new Date() > new Date(teacherCheck.temporary_credentials_expires_at)) {
            await signOut();
            setErrorMsg('O prazo de 48 horas para a ativação inicial das suas credenciais provisórias expirou. Solicite um novo acesso ao Administrador da Zaty Academy.');
            setLoading(false);
            return;
          }
        }
      }

      // 3. Redirecionamento EXCLUSIVO para Formadores
      if (userRole === 'formador') {
        // Garantir que nenhuma sessão administrativa fique activa no navegador
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('zaty_admin_session_active');
        }
        recordAuditLog({
          action: 'TEACHER_LOGIN',
          description: `Início de sessão do formador (${cleanEmail})`,
          resourceType: 'auth',
          resourceId: authData?.user?.id,
          userId: authData?.user?.id,
          userEmail: cleanEmail,
          userName: authData?.user?.user_metadata?.full_name || teacherCheck?.name || teacherCheck?.full_name || 'Formador',
          details: { role: 'formador' }
        }).catch(() => {});

        const from = location.state?.from?.pathname;
        if (from && from.startsWith('/formador')) {
          navigate(from, { replace: true });
        } else {
          navigate('/formador', { replace: true });
        }
        return;
      }

      // 4. Redirecionamento para Cargos Administrativos Legítimos
      const isAdminRole = ['super_admin', 'admin', 'financeiro', 'secretaria'].includes(userRole) && userRole !== 'formador';
      
      if (isAdminRole) {
        // Activar sessão administrativa no sessionStorage estritamente para administradores
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('zaty_admin_session_active', 'true');
        }
        recordAuditLog({
          action: 'ADMIN_LOGIN',
          description: `Acesso administrativo ao painel (${cleanEmail})`,
          resourceType: 'auth',
          resourceId: authData?.user?.id,
          userId: authData?.user?.id,
          userEmail: cleanEmail,
          userName: authData?.user?.user_metadata?.full_name || 'Administrador',
          details: { role: userRole }
        }).catch(() => {});

        const from = location.state?.from?.pathname;
        if (from && from.startsWith('/admin')) {
          navigate(from, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
        return;
      }

      // 5. Redirecionamento para Estudantes (com verificação rigorosa de suspensão e exclusão)
      const { data: studentRecord } = await supabase
        .from('academy_students')
        .select('id, status, enrollment_status, suspension_reason, full_name, student_code')
        .or(`user_id.eq.${authData.user.id},email.eq.${cleanEmail}`)
        .maybeSingle();

      // Verificar se a conta do estudante foi excluída
      if (!studentRecord || studentRecord.status === 'excluido' || studentRecord.enrollment_status === 'removida') {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') sessionStorage.clear();
        setErrorMsg('Esta conta não existe mais ou foi desativada permanentemente pela administração.');
        setLoading(false);
        return;
      }

      // Verificar se a conta do estudante está suspensa
      const isSuspended = studentRecord.enrollment_status === 'suspenso' || studentRecord.status === 'suspenso';
      if (isSuspended) {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') sessionStorage.clear();
        setErrorMsg('A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.');
        setLoading(false);
        return;
      }

      recordAuditLog({
        action: 'USER_LOGIN',
        description: `Início de sessão do estudante (${cleanEmail})`,
        resourceType: 'auth',
        resourceId: authData?.user?.id,
        userId: authData?.user?.id,
        userEmail: cleanEmail,
        userName: studentRecord?.full_name || authData?.user?.user_metadata?.full_name || 'Estudante',
        details: { role: 'student', student_code: studentRecord?.student_code }
      }).catch(() => {});

      const from = location.state?.from?.pathname;
      if (from && !from.startsWith('/admin') && !from.startsWith('/formador')) {
        navigate(from, { replace: true });
      } else {
        navigate('/estudante', { replace: true });
      }
    } catch (err) {
      console.error('Falha de login:', err);
      if (err?.message?.includes('Email not confirmed')) {
        setErrorMsg('O seu e-mail ainda aguarda confirmação automática. Por favor, tente entrar novamente em instantes.');
      } else if (err?.message?.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou palavra-passe incorretos. Toque no ícone de olho para ver a senha digitada.');
      } else {
        setErrorMsg(err?.message || 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'clamp(2rem, 6vw, 4.5rem) 1.25rem', maxWidth: '460px' }}>
      <div className="glass-card" style={{ padding: 'clamp(1.5rem, 5vw, 2.25rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <BrandLogo size={58} glow={true} style={{ justifyContent: 'center', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.6rem)', fontWeight: '800', marginBottom: '0.35rem', color: '#FFFFFF' }}>Iniciar Sessão</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            Acesso à Área do Estudante e Painel Administrativo
          </p>
        </div>

        {location.state?.reason === 'admin_reauth' && !errorMsg && (
          <div style={{
            background: 'rgba(0, 199, 253, 0.12)',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#7DD3FC',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            <Shield size={18} style={{ flexShrink: 0, color: '#00C7FD' }} />
            <span>Por motivos de segurança, autentique-se novamente para aceder ao Painel Administrativo.</span>
          </div>
        )}

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

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Endereço de E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="form-input" 
              placeholder="seu.email@exemplo.com" 
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Palavra-passe</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="••••••••" 
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
                title={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.45rem' }}>
              <Link to="/recuperar-senha" style={{ color: '#00C7FD', fontSize: '0.82rem', textDecoration: 'none', fontWeight: '500' }}>
                Esqueceu a palavra-passe?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginBottom: '1.25rem' }}
          >
            {loading ? (
              'A AUTENTICAR...'
            ) : (
              <>
                <LogIn size={17} />
                ENTRAR NO SISTEMA
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1rem', fontSize: '0.825rem', color: '#94A3B8' }}>
          Ainda não é aluno da Zaty Academy?{' '}
          <Link to="/inscricao" style={{ color: '#00C7FD', fontWeight: '700' }}>
            Inscreva-se aqui
          </Link>
        </div>
      </div>
    </div>
  );
}

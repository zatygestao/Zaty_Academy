import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ZatyLoadingScreen from './ZatyLoadingScreen';

export default function ProtectedRoute({ children, allowedRoles = null, requireStudent = false }) {
  const { user, profile, student, teacher, loading, hasRole, isStudent, isCredentialsExpired, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <ZatyLoadingScreen message="A carregar dados do sistema..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Verificação de contas de formadores expiradas (prazo de 48 horas)
  const isTeacher = profile?.role === 'formador';
  const expiryDate = profile?.temporary_credentials_expires_at || teacher?.temporary_credentials_expires_at;
  const isExpired = isCredentialsExpired || (isTeacher && (profile?.must_change_password || teacher?.must_change_password) && expiryDate && (new Date() > new Date(expiryDate)));

  if (isExpired) {
    signOut();
    return <Navigate to="/login" state={{ reason: 'teacher_credentials_expired' }} replace />;
  }

  // 2. Verificação estrita de rotas administrativas (/admin)
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    // Formadores NUNCA têm acesso ao painel administrativo — redirecionar imediatamente para o Painel do Formador
    if (isTeacher || profile?.role === 'formador') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('zaty_admin_session_active');
      }
      return <Navigate to="/formador" replace />;
    }

    // Estudantes são redirecionados para a Área do Estudante
    if (isStudent || profile?.role === 'student' || profile?.role === 'estudante') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('zaty_admin_session_active');
      }
      return <Navigate to="/estudante" replace />;
    }

    // Apenas papéis administrativos legítimos são permitidos em /admin
    const allowedAdminRoles = ['super_admin', 'admin', 'financeiro', 'secretaria'];
    if (!allowedAdminRoles.includes(profile?.role)) {
      return <Navigate to="/login" replace />;
    }

    // Papel administrativo específico para a rota deve ser autorizado
    if (allowedRoles && !hasRole(allowedRoles)) {
      return <Navigate to="/admin" replace />;
    }

    // Sessão administrativa activa no sessionStorage
    const isAdminSessionActive = typeof window !== 'undefined' && sessionStorage.getItem('zaty_admin_session_active') === 'true';
    if (!isAdminSessionActive) {
      return <Navigate to="/login" state={{ from: location, reason: 'admin_reauth' }} replace />;
    }
  }

  // 3. Verificação de rotas exclusivas para formadores (/formador)
  const isTeacherRoute = location.pathname.startsWith('/formador');
  if (isTeacherRoute) {
    if (!isTeacher && profile?.role !== 'super_admin') {
      return <Navigate to={isStudent ? "/estudante" : "/admin"} replace />;
    }
  }

  // 4. Verificação de rotas exclusivas para estudantes (/estudante)
  const isStudentRoute = location.pathname.startsWith('/estudante');
  if (isStudentRoute) {
    if (isTeacher) {
      return <Navigate to="/formador" replace />;
    }
    if (requireStudent && !isStudent && profile?.role !== 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
  }

  // 5. Bloqueio imediato de contas suspensas ou excluídas
  if (profile?.status === 'excluido' || teacher?.status === 'excluido' || student?.status === 'excluido' || student?.enrollment_status === 'removida') {
    signOut();
    return <Navigate to="/login" state={{ reason: 'account_deleted', message: 'Esta conta não existe mais ou foi desativada permanentemente pela administração.' }} replace />;
  }

  if (profile?.status === 'suspenso' || profile?.is_active === false ||
      (isTeacher && (teacher?.status === 'suspenso' || teacher?.is_active === false || teacher?.is_blocked === true)) ||
      (isStudent && (student?.enrollment_status === 'suspenso' || student?.status === 'suspenso'))) {
    signOut();
    return <Navigate to="/login" state={{ reason: 'account_suspended', message: 'A sua conta foi suspensa. O acesso ao sistema está temporariamente bloqueado. Contacte a Administração para mais informações.' }} replace />;
  }

  return children;
}

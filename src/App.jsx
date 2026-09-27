import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Layouts & Nav
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CookieConsent from './components/common/CookieConsent';
import ProtectedRoute from './components/common/ProtectedRoute';
import StudentBottomNav from './components/student/StudentBottomNav';

// Public Pages (Carregadas sob demanda para alta velocidade no Android)
const Home = lazy(() => import('./pages/public/Home'));
const Register = lazy(() => import('./pages/public/Register'));
const Login = lazy(() => import('./pages/public/Login'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const CertificateValidation = lazy(() => import('./pages/public/CertificateValidation'));
const ArticleDetail = lazy(() => import('./pages/public/ArticleDetail'));
const AboutUs = lazy(() => import('./pages/public/AboutUs'));
const CoursesPublic = lazy(() => import('./pages/public/CoursesPublic'));
const News = lazy(() => import('./pages/public/News'));
const Contact = lazy(() => import('./pages/public/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/public/TermsOfUse'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const OpenEnrollmentNotice = lazy(() => import('./pages/public/OpenEnrollmentNotice'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const StudentChat = lazy(() => import('./pages/student/StudentChat'));
const StudentPayments = lazy(() => import('./pages/student/StudentPayments'));
const StudentCertificates = lazy(() => import('./pages/student/StudentCertificates'));
const StudentArticles = lazy(() => import('./pages/student/StudentArticles'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherClasses = lazy(() => import('./pages/teacher/TeacherClasses'));
const TeacherGrades = lazy(() => import('./pages/teacher/TeacherGrades'));
const TeacherAssignments = lazy(() => import('./pages/teacher/TeacherAssignments'));
const TeacherChat = lazy(() => import('./pages/teacher/TeacherChat'));
const TeacherProfile = lazy(() => import('./pages/teacher/TeacherProfile'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentsManagement = lazy(() => import('./pages/admin/StudentsManagement'));
const CoursesManagement = lazy(() => import('./pages/admin/CoursesManagement'));
const ClassesManagement = lazy(() => import('./pages/admin/ClassesManagement'));
const GradesManagement = lazy(() => import('./pages/admin/GradesManagement'));
const TeachersManagement = lazy(() => import('./pages/admin/TeachersManagement'));
const TeamManagement = lazy(() => import('./pages/admin/TeamManagement'));
const PaymentsManagement = lazy(() => import('./pages/admin/PaymentsManagement'));
const CertificatesManagement = lazy(() => import('./pages/admin/CertificatesManagement'));
const ArticlesManagement = lazy(() => import('./pages/admin/ArticlesManagement'));
const SupportManagement = lazy(() => import('./pages/admin/SupportManagement'));
const SettingsManagement = lazy(() => import('./pages/admin/SettingsManagement'));
const AuditLogsManagement = lazy(() => import('./pages/admin/AuditLogsManagement'));

import ZatyLoadingScreen from './components/common/ZatyLoadingScreen';

// Skeleton Loader com Logótipo Oficial da Zaty Academy
function PageSkeletonLoader() {
  return <ZatyLoadingScreen message="A carregar Zaty Academy..." />;
}

// Navegação Inferior Móvel Condicional para Estudantes
function ConditionalBottomNav() {
  const location = useLocation();
  if (location.pathname.startsWith('/estudante')) {
    return <StudentBottomNav />;
  }
  return null;
}

// Rodapé Condicional: apenas páginas institucionais públicas
function ConditionalFooter() {
  const location = useLocation();
  const isInternal = location.pathname.startsWith('/admin') || 
                     location.pathname.startsWith('/estudante') || 
                     location.pathname.startsWith('/formador');
  if (isInternal) {
    return null;
  }
  return <Footer />;
}

// Vigilante de Segurança: Ao navegar para fora do painel administrativo (/admin),
// revoga a chave da sessão administrativa activa no sessionStorage para exigir
// nova autenticação caso alguém tente voltar pelo histórico do navegador ou URL directo.
function AdminSecurityWatcher() {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith('/admin') && location.pathname !== '/login') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('zaty_admin_session_active');
      }
    }
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AdminSecurityWatcher />
      <SettingsProvider>
        <AuthProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{ flex: 1 }}>
              <Suspense fallback={<PageSkeletonLoader />}>
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/" element={<Home />} />
                  <Route path="/inscricao" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/recuperar-senha" element={<ForgotPassword />} />
                  <Route path="/redefinir-senha" element={<ResetPassword />} />
                  <Route path="/validar" element={<CertificateValidation />} />
                  <Route path="/validar/:codigo" element={<CertificateValidation />} />
                  <Route path="/artigos/:id" element={<ArticleDetail />} />
                  <Route path="/artigo/:id" element={<ArticleDetail />} />
                  <Route path="/sobre" element={<AboutUs />} />
                  <Route path="/cursos" element={<CoursesPublic />} />
                  <Route path="/noticias" element={<News />} />
                  <Route path="/artigos" element={<News />} />
                  <Route path="/contactos" element={<Contact />} />
                  <Route path="/contacto" element={<Contact />} />
                  <Route path="/privacidade" element={<PrivacyPolicy />} />
                  <Route path="/termos" element={<TermsOfUse />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/cookies" element={<FAQ />} />
                  <Route path="/inscricoes-abertas" element={<OpenEnrollmentNotice />} />
                  <Route path="/edital-inscricoes" element={<OpenEnrollmentNotice />} />

                  {/* Rotas da Área do Estudante */}
                  <Route
                    path="/estudante"
                    element={
                      <ProtectedRoute>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/cursos"
                    element={
                      <ProtectedRoute>
                        <StudentCourses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/artigos"
                    element={
                      <ProtectedRoute>
                        <StudentArticles />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/artigos/:id"
                    element={
                      <ProtectedRoute>
                        <ArticleDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/pagamentos"
                    element={
                      <ProtectedRoute>
                        <StudentPayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/certificados"
                    element={
                      <ProtectedRoute>
                        <StudentCertificates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/trabalhos"
                    element={
                      <ProtectedRoute requireStudent={true}>
                        <StudentAssignments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/chat"
                    element={
                      <ProtectedRoute requireStudent={true}>
                        <StudentChat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/perfil"
                    element={
                      <ProtectedRoute>
                        <StudentProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estudante/notas"
                    element={
                      <ProtectedRoute requireStudent={true}>
                        <StudentGrades />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rotas Exclusivas do Formador */}
                  <Route
                    path="/formador"
                    element={
                      <ProtectedRoute>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/formador/turmas"
                    element={
                      <ProtectedRoute>
                        <TeacherClasses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/formador/notas"
                    element={
                      <ProtectedRoute>
                        <TeacherGrades />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/formador/trabalhos"
                    element={
                      <ProtectedRoute>
                        <TeacherAssignments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/formador/chat"
                    element={
                      <ProtectedRoute>
                        <TeacherChat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/formador/perfil"
                    element={
                      <ProtectedRoute>
                        <TeacherProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rotas do Painel Administrativo */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'financeiro', 'secretaria']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/estudantes"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <StudentsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/cursos"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <CoursesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/turmas"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <ClassesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notas"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <GradesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/formadores"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <TeachersManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/equipa"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <TeamManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/pagamentos"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'financeiro']}>
                        <PaymentsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/certificados"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <CertificatesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/artigos"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <ArticlesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/suporte"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'secretaria']}>
                        <SupportManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/configuracoes"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <SettingsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/auditoria"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <AuditLogsManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>

            {/* Barra de Navegação Inferior para Estudantes no Mobile */}
            <ConditionalBottomNav />

            <ConditionalFooter />

            {/* Banner de Notificação e Gestão de Cookies */}
            <CookieConsent />
          </div>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
}

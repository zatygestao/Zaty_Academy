import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from './BrandLogo';
import NotificationBell from './NotificationBell';
import { 
  GraduationCap, 
  X, 
  User, 
  Shield, 
  LogOut, 
  CheckCircle2, 
  BookOpen, 
  UserPlus, 
  LogIn,
  Newspaper,
  Phone,
  Info,
  HelpCircle,
  Home,
  Sparkles
} from 'lucide-react';

function StaggeredHamburgerIcon() {
  return (
    <svg 
      width="24" 
      height="19" 
      viewBox="0 0 24 19" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {/* Traço 1: largura 22px */}
      <line x1="1" y1="2.5" x2="23" y2="2.5" stroke="#00C7FD" strokeWidth="2.2" strokeLinecap="round" />
      {/* Traço 2: largura 22px */}
      <line x1="1" y1="9.5" x2="23" y2="9.5" stroke="#00C7FD" strokeWidth="2.2" strokeLinecap="round" />
      {/* Traço 3: metade da largura dos dois primeiros (11px), com a mesma espessura */}
      <line x1="1" y1="16.5" x2="12" y2="16.5" stroke="#00C7FD" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const { user, profile, isAdmin, isTeacher, isStudent, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determina se o utilizador está atualmente dentro de um painel interno do sistema
  const isInternal = location.pathname.startsWith('/admin') || 
                     location.pathname.startsWith('/formador') || 
                     location.pathname.startsWith('/estudante');

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Fecha o menu público móvel sempre que houver alteração de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Bloqueia rolagem do body quando o menu suspenso público estiver aberto
  useEffect(() => {
    if (mobileMenuOpen && !isInternal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, isInternal]);

  // Fecha o menu público com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manipulador inteligente do botão hambúrguer mobile
  const handleHamburgerClick = () => {
    if (isInternal) {
      // DENTRO DO SISTEMA: Dispara abertura do menu hambúrguer interno do módulo ativo (Admin, Formador ou Aluno)
      window.dispatchEvent(new CustomEvent('zaty_open_sidebar_drawer'));
    } else {
      // PÁGINA INICIAL / PÚBLICO: Alterna a abertura do menu hambúrguer de navegação pública
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  const panelRoute = isAdmin ? '/admin' : isTeacher ? '/formador' : '/estudante';
  const panelLabel = isAdmin ? 'Painel Administrativo' : isTeacher ? 'Painel do Formador' : 'Área do Estudante';
  const PanelIcon = isAdmin ? Shield : isTeacher ? GraduationCap : User;

  return (
    <header style={{
      background: 'rgba(0, 24, 48, 0.98)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div 
        className="container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: '64px',
          gap: '0.75rem'
        }}
      >
        {/* Canto Esquerdo: Botão Hambúrguer Mobile (à esquerda) + Logotipo Zaty Academy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flexShrink: 0 }}>
          <button 
            type="button"
            className="mobile-hamburger-btn"
            onClick={handleHamburgerClick}
            aria-label={isInternal ? 'Abrir Menu do Sistema' : (mobileMenuOpen ? 'Fechar Menu' : 'Abrir Menu da Página Inicial')}
            aria-expanded={isInternal ? false : mobileMenuOpen}
            title={isInternal ? 'Menu do Sistema' : 'Menu Principal'}
          >
            {isInternal ? (
              <StaggeredHamburgerIcon />
            ) : (
              mobileMenuOpen ? <X size={22} color="#00C7FD" strokeWidth={2.2} /> : <StaggeredHamburgerIcon />
            )}
          </button>

          <Link 
            to="/" 
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }} 
            onClick={() => setMobileMenuOpen(false)}
            title="Zaty Academy - Página Inicial"
          >
            <BrandLogo size={36} showText={true} subtitle={false} glow={false} />
          </Link>
        </div>

        {/* Links Centrais Desktop (min-width: 900px) */}
        <nav 
          style={{ display: 'none', alignItems: 'center', gap: '1.25rem' }} 
          className="desktop-nav"
          aria-label="Navegação Principal"
        >
          <Link 
            to="/" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/') && location.pathname === '/' ? '700' : '500', 
              color: isActive('/') && location.pathname === '/' ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/') && location.pathname === '/' ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Início
          </Link>

          <Link 
            to="/cursos" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/cursos') ? '700' : '500', 
              color: isActive('/cursos') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/cursos') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Cursos
          </Link>

          <Link 
            to="/inscricao" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/inscricao') ? '700' : '500', 
              color: isActive('/inscricao') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/inscricao') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Inscrição Online
          </Link>

          <Link 
            to="/noticias" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/noticias') || isActive('/artigos') ? '700' : '500', 
              color: isActive('/noticias') || isActive('/artigos') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/noticias') || isActive('/artigos') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Notícias
          </Link>

          <Link 
            to="/sobre" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/sobre') ? '700' : '500', 
              color: isActive('/sobre') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/sobre') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sobre Nós
          </Link>

          <Link 
            to="/validar" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/validar') ? '700' : '500', 
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: isActive('/validar') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/validar') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCircle2 size={14} color="#00C7FD" />
            <span>Validar Certificado</span>
          </Link>

          <Link 
            to="/contactos" 
            style={{ 
              fontSize: '0.88rem', 
              fontWeight: isActive('/contactos') ? '700' : '500', 
              color: isActive('/contactos') ? '#00C7FD' : '#BAE6FD',
              borderBottom: isActive('/contactos') ? '2px solid #00C7FD' : '2px solid transparent',
              padding: '0.35rem 0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Contactos
          </Link>
        </nav>

        {/* Canto Direito Desktop: Sessão e Ações (min-width: 900px) */}
        <div style={{ display: 'none', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }} className="desktop-nav">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <NotificationBell />

              <Link 
                to={panelRoute} 
                className="btn btn-primary btn-sm" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.85rem' }}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #FFFFFF' }} 
                  />
                ) : (
                  <PanelIcon size={16} />
                )}
                <span>{panelLabel}</span>
              </Link>

              <button 
                onClick={handleSignOut} 
                className="btn btn-secondary btn-sm" 
                title="Terminar Sessão"
                style={{ padding: '0.45rem 0.65rem' }}
                aria-label="Terminar Sessão"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
                <LogIn size={15} />
                <span>Entrar</span>
              </Link>
              <Link to="/inscricao" className="btn btn-primary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
                <UserPlus size={15} />
                <span>Inscrever-se</span>
              </Link>
            </div>
          )}
        </div>

        {/* Canto Direito Mobile: Ações do Utilizador */}
        <div className="mobile-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {user ? (
            <>
              <NotificationBell />
              {/* Profile Pill Executivo Mobile */}
              <Link 
                to={panelRoute}
                title={panelLabel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(0, 199, 253, 0.14)',
                  border: '1px solid rgba(0, 199, 253, 0.35)',
                  color: '#00C7FD',
                  textDecoration: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  minHeight: '36px'
                }}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Perfil" 
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #00C7FD' }} 
                  />
                ) : (
                  <PanelIcon size={15} />
                )}
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAdmin ? 'Admin' : isTeacher ? 'Formador' : 'Aluno'}
                </span>
              </Link>

              {/* Botão de Terminar Sessão Direto no Mobile */}
              <button
                onClick={handleSignOut}
                title="Terminar Sessão"
                style={{
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  color: '#EF4444',
                  padding: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '36px'
                }}
                aria-label="Terminar Sessão"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.38rem 0.8rem',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.14)',
                border: '1px solid rgba(0, 199, 253, 0.4)',
                color: '#00C7FD',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: '700',
                minHeight: '36px'
              }}
            >
              <LogIn size={15} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================================================
          MENU HAMBÚRGUER DA PÁGINA INICIAL / PÚBLICO (EXCLUSIVO PARA PÁGINAS PÚBLICAS)
          Apresenta APENAS páginas e opções externas/públicas, perfeitamente organizado.
          ========================================================================= */}
      {!isInternal && mobileMenuOpen && (
        <>
          {/* Fundo escurecido que fecha o menu ao tocar fora */}
          <div 
            className="public-mobile-dropdown-overlay" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <nav 
            className="public-mobile-dropdown"
            aria-label="Menu de Navegação da Página Inicial"
          >
            <div className="public-mobile-dropdown-inner">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '0.85rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(0, 163, 224, 0.15)'
              }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  color: '#00C7FD', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.06em' 
                }}>
                  Módulos & Navegação Pública
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Zaty Academy
                </span>
              </div>

              <div className="public-nav-grid">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <Home size={17} color={isActive('/') && location.pathname === '/' ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Página Inicial</span>
                  </div>
                  {isActive('/') && location.pathname === '/' && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/cursos" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/cursos') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <BookOpen size={17} color={isActive('/cursos') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Nossos Cursos</span>
                  </div>
                  {isActive('/cursos') && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/inscricao" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/inscricao') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <UserPlus size={17} color={isActive('/inscricao') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Inscrição Online</span>
                  </div>
                  <span className="public-badge-open">Aberto</span>
                </Link>

                <Link 
                  to="/inscricoes-abertas" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/inscricoes-abertas') || isActive('/edital-inscricoes') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <Sparkles size={17} color={isActive('/inscricoes-abertas') || isActive('/edital-inscricoes') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Edital & Inscrições</span>
                  </div>
                  {(isActive('/inscricoes-abertas') || isActive('/edital-inscricoes')) && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/noticias" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/noticias') || isActive('/artigos') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <Newspaper size={17} color={isActive('/noticias') || isActive('/artigos') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Notícias & Comunicados</span>
                  </div>
                  {(isActive('/noticias') || isActive('/artigos')) && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/sobre" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/sobre') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <Info size={17} color={isActive('/sobre') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Sobre a Instituição</span>
                  </div>
                  {isActive('/sobre') && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/validar" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/validar') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <CheckCircle2 size={17} color={isActive('/validar') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Validar Certificado</span>
                  </div>
                  {isActive('/validar') && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/contactos" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/contactos') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <Phone size={17} color={isActive('/contactos') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Contactos & Apoio</span>
                  </div>
                  {isActive('/contactos') && <span className="active-dot" />}
                </Link>

                <Link 
                  to="/faq" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-item ${isActive('/faq') ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="public-nav-icon-box">
                      <HelpCircle size={17} color={isActive('/faq') ? '#00C7FD' : '#BAE6FD'} />
                    </div>
                    <span>Perguntas Frequentes (FAQ)</span>
                  </div>
                  {isActive('/faq') && <span className="active-dot" />}
                </Link>
              </div>

              <div className="public-nav-divider" />

              {/* Ações Rápidas de Acesso no Menu Público */}
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <Link 
                    to={panelRoute} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '46px' }}
                  >
                    <PanelIcon size={18} />
                    <span>Ir para o {panelLabel}</span>
                  </Link>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '44px' }}
                  >
                    <LogOut size={16} />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', minHeight: '46px' }}
                  >
                    <LogIn size={16} />
                    <span>Iniciar Sessão</span>
                  </Link>
                  <Link 
                    to="/inscricao" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', minHeight: '46px' }}
                  >
                    <UserPlus size={16} />
                    <span>Inscrição Online</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </>
      )}

      <style>{`
        @media (min-width: 1100px) {
          .desktop-nav { display: flex !important; }
          .mobile-actions { display: none !important; }
          .mobile-hamburger-btn { display: none !important; }
        }
        @media (max-width: 1099px) {
          .desktop-nav { display: none !important; }
          .mobile-actions { display: flex !important; }
          .mobile-hamburger-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

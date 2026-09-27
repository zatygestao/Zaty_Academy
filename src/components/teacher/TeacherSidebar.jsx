import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut,
  GraduationCap, 
  MessageSquare, 
  User, 
  X, 
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function TeacherSidebar() {
  const { user, profile, teacher, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredPath, setHoveredPath] = useState(null);
  const navRef = useRef(null);

  // Escuta comando do hambúrguer no cabeçalho para abrir o menu do formador
  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true);
    window.addEventListener('zaty_open_sidebar_drawer', handleOpen);
    return () => window.removeEventListener('zaty_open_sidebar_drawer', handleOpen);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Painel do Formador', path: '/formador', icon: LayoutDashboard },
    { label: 'Minhas Turmas & Alunos', path: '/formador/turmas', icon: Users },
    { label: 'Notas & Avaliações', path: '/formador/notas', icon: Award },
    { label: 'Trabalhos Académicos', path: '/formador/trabalhos', icon: FileText },
    { label: 'Chat & Turmas', path: '/formador/chat', icon: MessageSquare },
    { label: 'Meu Perfil & Senha', path: '/formador/perfil', icon: User },
  ];

  const teacherName = teacher?.name || teacher?.full_name || profile?.full_name || 'Formador Oficial';
  const specialty = teacher?.specialty || 'Corpo Docente Zaty Academy';
  const photoUrl = teacher?.photo_url || profile?.avatar_url;

  const isActive = (itemPath) => {
    if (itemPath === '/formador') {
      return location.pathname === '/formador';
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  const handleMouseEnter = (e, path) => {
    if (!navRef.current) return;
    setHoveredPath(path);
    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    setHoveredBox({
      top: itemRect.top - navRect.top,
      height: itemRect.height,
    });
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeaveNav = () => {
    setHoveredBox(null);
    setHoveredPath(null);
  };

  return (
    <>
      {/* DRAWER MOBILE OVERLAY & CONTEÚDO (Acionado pelo hambúrguer do cabeçalho) */}
      <div
        className={`mobile-drawer-overlay ${drawerOpen ? 'active' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`mobile-drawer-content ${drawerOpen ? 'active' : ''}`}>
        <div>
          {/* Topo do Drawer com Logo e Fechar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 163, 224, 0.2)',
            paddingBottom: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img 
                src="/logo.png" 
                alt="Zaty Academy Logo" 
                style={{ width: '30px', height: '30px', objectFit: 'contain' }} 
              />
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                  ZATY ACADEMY
                </div>
                <div style={{ fontSize: '0.68rem', color: '#00C7FD' }}>
                  Portal do Formador
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Fechar Menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* CARD DE PERFIL EXECUTIVO PROFISSIONAL NO MOBILE */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 60, 115, 0.35) 0%, rgba(2, 18, 36, 0.95) 100%)',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(0, 199, 253, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ position: 'relative' }}>
                <UserAvatar 
                  photoUrl={photoUrl} 
                  name={teacherName} 
                  size={46} 
                  role="formador" 
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid #001c36',
                    boxShadow: '0 0 6px #10B981'
                  }}
                  title="Sessão Ativa"
                />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em'
                }}>
                  {teacherName}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  marginTop: '0.2rem',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  color: '#00C7FD',
                  background: 'rgba(0, 199, 253, 0.15)',
                  padding: '0.12rem 0.5rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(0, 199, 253, 0.25)'
                }}>
                  <GraduationCap size={12} />
                  <span>Docência Zaty</span>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#94A3B8',
                  marginTop: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {specialty}
                </div>
              </div>
            </div>

            <Link
              to="/formador/perfil"
              onClick={() => setDrawerOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '0.85rem',
                padding: '0.45rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#BAE6FD',
                textDecoration: 'none',
                fontSize: '0.76rem',
                fontWeight: '600',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={13} />
              <span>Gerir Meu Perfil & Senha</span>
            </Link>
          </div>

          {/* LISTA DE NAVEGAÇÃO NO DRAWER */}
          <div style={{
            fontSize: '0.7rem',
            color: '#00C7FD',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
            paddingLeft: '0.5rem'
          }}>
            Módulos Pedagógicos
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    minHeight: '46px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: active ? 'rgba(0, 199, 253, 0.15)' : 'transparent',
                    border: active ? '1px solid rgba(0, 199, 253, 0.35)' : '1px solid transparent',
                    color: active ? '#FFFFFF' : '#CBD5E1',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} color={active ? '#00C7FD' : '#94A3B8'} />
                    <span style={{ fontSize: active ? '0.98rem' : '0.9rem', fontWeight: active ? '700' : '500' }}>
                      {item.label}
                    </span>
                  </div>
                  {active ? (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00C7FD', boxShadow: '0 0 8px #00C7FD' }} />
                  ) : (
                    <ChevronRight size={15} color="#64748B" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RODAPÉ DO DRAWER COM LOGOUT */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.85rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              width: '100%',
              padding: '0.7rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: '600',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* 3. BARRA LATERAL DESKTOP (> 860px) */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '240px',
          background: 'rgba(0, 20, 40, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(0, 163, 224, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)',
          position: 'fixed',
          top: '64px',
          left: 0,
          zIndex: 40,
          overflowY: 'auto'
        }}
      >
        {/* Cabeçalho do Formador Desktop */}
        <div style={{ padding: '1.25rem 1.15rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <UserAvatar 
                photoUrl={photoUrl} 
                name={teacherName} 
                size={40} 
                role="formador" 
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '1.5px solid #001c36',
                  boxShadow: '0 0 6px #10B981'
                }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {teacherName}
              </div>
              <div style={{ fontSize: '0.71rem', color: '#00C7FD', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {specialty}
              </div>
            </div>
          </div>
        </div>

        {/* Navegação Desktop */}
        <nav
          ref={navRef}
          onMouseLeave={handleMouseLeaveNav}
          style={{ padding: '1rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0.65rem',
              right: '0.65rem',
              top: hoveredBox ? `${hoveredBox.top}px` : 0,
              height: hoveredBox ? `${hoveredBox.height}px` : 0,
              opacity: hoveredBox ? 1 : 0,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              pointerEvents: 'none',
              transition: 'top 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease',
              zIndex: 1
            }}
          />

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isHovered = hoveredPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={(e) => handleMouseEnter(e, item.path)}
                onMouseMove={handleMouseMove}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  color: active ? '#FFFFFF' : (isHovered ? '#FFFFFF' : '#94A3B8'),
                  background: active && !hoveredBox ? 'rgba(0, 163, 224, 0.18)' : 'transparent',
                  border: active ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: active ? '600' : '400',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={17} color={active ? '#00C7FD' : '#94A3B8'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Barra Lateral Desktop */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)' }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}

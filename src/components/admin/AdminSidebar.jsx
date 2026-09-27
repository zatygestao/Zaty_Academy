import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  LogOut, 
  X, 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  CreditCard, 
  Award, 
  Settings, 
  FileText, 
  UserCheck, 
  ChevronRight,
  Globe,
  Newspaper,
  Headphones,
  FileCheck
} from 'lucide-react';

export default function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredPath, setHoveredPath] = useState(null);
  const navRef = useRef(null);

  // Escuta comando do hambúrguer no cabeçalho para abrir o menu interno
  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true);
    window.addEventListener('zaty_open_sidebar_drawer', handleOpen);
    return () => window.removeEventListener('zaty_open_sidebar_drawer', handleOpen);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const userRole = profile?.role || 'admin';

  const navGroups = [
    {
      groupTitle: 'Principal',
      items: [
        { label: 'Painel Geral', path: '/admin', roles: ['super_admin', 'admin', 'financeiro', 'secretaria'], icon: Home }
      ]
    },
    {
      groupTitle: 'Académico',
      items: [
        { label: 'Estudantes', path: '/admin/estudantes', roles: ['super_admin', 'admin', 'secretaria'], icon: Users },
        { label: 'Cursos & aulas', path: '/admin/cursos', roles: ['super_admin', 'admin'], icon: BookOpen },
        { label: 'Turmas', path: '/admin/turmas', roles: ['super_admin', 'admin', 'secretaria'], icon: Calendar },
        { label: 'Notas & Pautas', path: '/admin/notas', roles: ['super_admin', 'admin', 'secretaria'], icon: FileCheck },
        { label: 'Formadores', path: '/admin/formadores', roles: ['super_admin', 'admin'], icon: GraduationCap },
        { label: 'Certificados', path: '/admin/certificados', roles: ['super_admin', 'admin', 'secretaria'], icon: Award },
        { label: 'Artigos & Notícias', path: '/admin/artigos', roles: ['super_admin', 'admin', 'secretaria'], icon: Newspaper }
      ]
    },
    {
      groupTitle: 'Gestão & Finanças',
      items: [
        { label: 'Pagamentos', path: '/admin/pagamentos', roles: ['super_admin', 'admin', 'financeiro'], icon: CreditCard },
        { label: 'Suporte & Chat', path: '/admin/suporte', roles: ['super_admin', 'admin', 'secretaria'], icon: Headphones },
        { label: 'Equipa', path: '/admin/equipa', roles: ['super_admin', 'admin'], icon: UserCheck }
      ]
    },
    {
      groupTitle: 'Sistema',
      items: [
        { label: 'Configurações', path: '/admin/configuracoes', roles: ['super_admin', 'admin'], icon: Settings },
        { label: 'Auditoria', path: '/admin/auditoria', roles: ['super_admin', 'admin'], icon: FileText }
      ]
    }
  ];

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrador';
      case 'admin': return 'Administrador';
      case 'financeiro': return 'Departamento Financeiro';
      case 'formador': return 'Formador / Professor';
      case 'secretaria': return 'Secretaria Académica';
      default: return 'Equipa Administrativa';
    }
  };

  const isActive = (itemPath) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin';
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

  const allFilteredItems = navGroups.flatMap(g => 
    g.items.filter(item => userRole === 'super_admin' || item.roles.includes(userRole))
  );

  const renderNavList = (isMobileDrawer = false) => {
    if (isMobileDrawer) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => userRole === 'super_admin' || item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle}>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#00C7FD',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.4rem',
                  paddingLeft: '0.5rem'
                }}>
                  {group.groupTitle}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {visibleItems.map((item) => {
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
                          borderRadius: '4px',
                          textDecoration: 'none',
                          background: active ? 'rgba(0, 199, 253, 0.14)' : 'transparent',
                          border: active ? '1px solid rgba(0, 199, 253, 0.35)' : '1px solid transparent',
                          color: active ? '#FFFFFF' : '#CBD5E1',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Icon size={18} color={active ? '#00C7FD' : '#94A3B8'} />
                          <span style={{ fontSize: active ? '1.05rem' : '0.92rem', fontWeight: active ? '700' : '500' }}>
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
            );
          })}
        </div>
      );
    }

    // Navegação Desktop Intel Command Center
    return (
      <nav
        ref={navRef}
        onMouseLeave={handleMouseLeaveNav}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: hoveredBox ? `${hoveredBox.top}px` : 0,
            height: hoveredBox ? `${hoveredBox.height}px` : 0,
            opacity: hoveredBox ? 1 : 0,
            background: 'rgba(255, 255, 255, 0.09)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            pointerEvents: 'none',
            transition: 'top 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease',
            zIndex: 1,
            boxShadow: 'inset 0 0 14px rgba(0, 163, 224, 0.08)'
          }}
        />

        {allFilteredItems.map((item) => {
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
                gap: '0.65rem',
                padding: active ? '0.65rem 0.75rem' : '0.55rem 0.75rem',
                minHeight: active ? '44px' : '36px',
                borderRadius: '2px',
                textDecoration: 'none',
                background: isHovered
                  ? 'radial-gradient(circle 120px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.12), transparent 80%)'
                  : (active && !hoveredBox ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
                transition: 'background 0.15s ease, min-height 0.15s ease, padding 0.15s ease'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '3.5px',
                  backgroundColor: '#00C7FD',
                  borderRadius: '2px',
                  opacity: active ? 1 : 0,
                  boxShadow: active ? '0 0 10px rgba(0, 199, 253, 0.9)' : 'none',
                  transition: 'opacity 0.15s ease',
                  flexShrink: 0
                }}
              />

              <span
                style={{
                  fontSize: active ? '1.32rem' : '0.92rem',
                  fontWeight: active ? '600' : '400',
                  color: active ? '#FFFFFF' : (isHovered ? '#FFFFFF' : '#A0B4CA'),
                  letterSpacing: active ? '-0.01em' : '0.01em',
                  lineHeight: 1.25,
                  transition: 'font-size 0.16s ease, color 0.15s ease, font-weight 0.15s ease'
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
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
                  Painel de Administração
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
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Foto de Perfil" 
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #00C7FD',
                      boxShadow: '0 0 10px rgba(0, 199, 253, 0.3)'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0072CE 0%, #00C7FD 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(0, 199, 253, 0.3)'
                  }}>
                    <Shield size={22} color="#001224" />
                  </div>
                )}
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
                  {profile?.full_name || user?.email?.split('@')[0]}
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
                  <Shield size={12} />
                  <span>{getRoleLabel(userRole)}</span>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#94A3B8',
                  marginTop: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email || 'admin@zatyacademy.co.mz'}
                </div>
              </div>
            </div>

            <Link
              to="/admin/configuracoes"
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
              <Settings size={13} />
              <span>Configurações do Sistema</span>
            </Link>
          </div>

          {/* Módulos do Menu Agrupados */}
          {renderNavList(true)}
        </div>

        {/* Ações Inferiores no Drawer */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.85rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => { setDrawerOpen(false); signOut(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* 3. BARRA LATERAL FIXA DESKTOP (> 860px) */}
      <aside className="desktop-sidebar" style={{
        width: '240px',
        background: 'rgba(0, 28, 54, 0.98)',
        backdropFilter: 'blur(14px)',
        borderRight: '1px solid rgba(0, 163, 224, 0.25)',
        padding: '1.15rem 0.65rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: '64px',
        bottom: 0,
        left: 0,
        height: 'calc(100vh - 64px)',
        flexShrink: 0,
        overflowY: 'auto',
        userSelect: 'none',
        zIndex: 90
      }}>
        <div>
          {/* Identificação do Administrador Desktop */}
          <div style={{
            background: 'rgba(0, 42, 78, 0.7)',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            borderRadius: '4px',
            padding: '0.75rem 0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Foto de Perfil" 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  border: '1px solid #00C7FD',
                  flexShrink: 0
                }} 
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={16} color="#00C7FD" />
              </div>
            )}

            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {profile?.full_name || user?.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#00C7FD', fontWeight: '600' }}>
                {getRoleLabel(userRole)}
              </div>
            </div>
          </div>

          {/* Navegação Desktop */}
          {renderNavList(false)}
        </div>

        {/* Ações Inferiores Desktop */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: '4px',
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={15} />
            <span>Sair do painel</span>
          </button>
        </div>
      </aside>
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeInfo } from '../../utils/formatters';
import { 
  LogOut, 
  GraduationCap, 
  X, 
  Home, 
  BookOpen, 
  CreditCard, 
  Award, 
  User, 
  ChevronRight,
  Newspaper,
  FileText,
  MessageSquare
} from 'lucide-react';

export default function StudentSidebar() {
  const { student, user, profile, signOut } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredPath, setHoveredPath] = useState(null);
  const navRef = useRef(null);

  // Escuta comando do hambúrguer no cabeçalho para abrir o menu do estudante
  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true);
    window.addEventListener('zaty_open_sidebar_drawer', handleOpen);
    return () => window.removeEventListener('zaty_open_sidebar_drawer', handleOpen);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const photoUrl = student?.photo_url || profile?.avatar_url;

  // Módulos agrupados logicamente para experiência móvel de excelência
  const navGroups = [
    {
      groupTitle: 'Principal',
      items: [
        { label: 'Página inicial', path: '/estudante', icon: Home }
      ]
    },
    {
      groupTitle: 'Académico',
      items: [
        { label: 'Meus cursos', path: '/estudante/cursos', icon: BookOpen },
        { label: 'Notas & Avaliações', path: '/estudante/notas', icon: GraduationCap },
        { label: 'Trabalhos', path: '/estudante/trabalhos', icon: FileText },
        { label: 'Chat & Suporte', path: '/estudante/chat', icon: MessageSquare },
        { label: 'Artigos & Notícias', path: '/estudante/artigos', icon: Newspaper },
        { label: 'Certificados', path: '/estudante/certificados', icon: Award }
      ]
    },
    {
      groupTitle: 'Financeiro',
      items: [
        { label: 'Pagamentos', path: '/estudante/pagamentos', icon: CreditCard }
      ]
    },
    {
      groupTitle: 'Conta',
      items: [
        { label: 'Meu perfil', path: '/estudante/perfil', icon: User }
      ]
    }
  ];

  const allNavItems = navGroups.flatMap(g => g.items);
  const statusBadge = getStatusBadgeInfo(student?.enrollment_status || 'pendente');

  const isActive = (itemPath) => {
    if (itemPath === '/estudante') {
      return location.pathname === '/estudante';
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

  // Renderizador comum de links
  const renderNavList = (isMobileDrawer = false) => {
    if (isMobileDrawer) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navGroups.map((group) => (
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
                {group.items.map((item) => {
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
          ))}
        </div>
      );
    }

    // Navegação Desktop Clássica Intel Command Center
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

        {allNavItems.map((item) => {
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
      {/* DRAWER OVERLAY E CONTEÚDO PARA MOBILE (Acionado pelo hambúrguer do cabeçalho) */}
      <div
        className={`mobile-drawer-overlay ${drawerOpen ? 'active' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`mobile-drawer-content ${drawerOpen ? 'active' : ''}`}>
        <div>
          {/* Cabeçalho do Drawer com Botão Fechar */}
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
                  Portal do Estudante
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

          {/* CARD DE PERFIL EXECUTIVO DO ESTUDANTE NO MOBILE */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 60, 115, 0.35) 0%, rgba(2, 18, 36, 0.95) 100%)',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(0, 199, 253, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
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
                    <GraduationCap size={24} color="#001224" />
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
                  title="Estudante Ativo"
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
                  {student?.full_name || user?.email?.split('@')[0]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusBadge.bg}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {statusBadge.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#00C7FD',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  marginTop: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {student?.student_code || 'ID: Em processamento'}
                </div>
              </div>
            </div>

            <Link
              to="/estudante/perfil"
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
              <span>Meu Perfil & Documentos</span>
            </Link>
          </div>

          {/* Módulos do Menu Agrupados */}
          {renderNavList(true)}
        </div>

        {/* Botão Sair no Drawer */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.85rem', marginTop: '1rem' }}>
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
            <span>Sair da Conta</span>
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
          {/* Perfil Compacto do Estudante */}
          <div style={{
            background: 'rgba(0, 42, 78, 0.7)',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            borderRadius: '4px',
            padding: '0.85rem 0.75rem',
            textAlign: 'center',
            marginBottom: '1.25rem'
          }}>
            <div style={{ position: 'relative', width: '50px', height: '50px', margin: '0 auto 0.5rem auto' }}>
              {student?.photo_url ? (
                <img 
                  src={student.photo_url} 
                  alt={student.full_name} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00C7FD' }} 
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00C7FD'
                }}>
                  <GraduationCap size={24} />
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '0.85rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700' }}>
              {student?.full_name || user?.email?.split('@')[0]}
            </h4>
            <div style={{ fontSize: '0.7rem', color: '#00C7FD', fontFamily: 'monospace', fontWeight: '700', marginTop: '0.15rem' }}>
              {student?.student_code || 'ID: Em processamento'}
            </div>

            <div style={{ marginTop: '0.45rem' }}>
              <span className={`badge ${statusBadge.bg}`} style={{ fontSize: '0.66rem', borderRadius: '3px', textTransform: 'uppercase' }}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Navegação Desktop */}
          {renderNavList(false)}
        </div>

        {/* Sair da conta Desktop */}
        <div style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.75rem' }}>
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
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}

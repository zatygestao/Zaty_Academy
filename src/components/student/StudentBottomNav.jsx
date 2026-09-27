import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, CreditCard, Award, User } from 'lucide-react';

export default function StudentBottomNav() {
  const location = useLocation();

  const items = [
    { label: 'Início', path: '/estudante', icon: Home },
    { label: 'Cursos', path: '/estudante/cursos', icon: BookOpen },
    { label: 'Pagamentos', path: '/estudante/pagamentos', icon: CreditCard },
    { label: 'Certificados', path: '/estudante/certificados', icon: Award },
    { label: 'Perfil', path: '/estudante/perfil', icon: User },
  ];

  const isActive = (itemPath) => {
    if (itemPath === '/estudante') {
      return location.pathname === '/estudante';
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação Inferior do Estudante">
      {items.map((item) => {
        const active = isActive(item.path);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '6px 0',
              textDecoration: 'none',
              color: active ? '#00C7FD' : '#94A3B8',
              transition: 'color 0.15s ease',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent size={20} strokeWidth={active ? 2.3 : 1.8} />
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#00C7FD',
                    boxShadow: '0 0 6px #00C7FD'
                  }}
                />
              )}
            </div>

            <span style={{
              fontSize: '0.68rem',
              fontWeight: active ? '700' : '500',
              letterSpacing: '0.01em',
              lineHeight: 1
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

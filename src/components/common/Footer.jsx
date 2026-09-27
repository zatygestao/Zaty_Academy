import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import BrandLogo from './BrandLogo';
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Bell,
  ArrowRight
} from 'lucide-react';

export default function Footer() {
  const { settings } = useSettings();
  const inst = settings.institution || {};

  return (
    <footer style={{ marginTop: 'auto', background: 'rgba(0, 18, 36, 0.98)', borderTop: '1px solid rgba(0, 163, 224, 0.25)' }}>
      {/* Seção Principal de Conteúdo e Links */}
      <div className="container" style={{ padding: '3.5rem 1.5rem 2rem 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Identidade */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <BrandLogo size={38} showText={true} />
            </div>
            <p style={{ color: 'var(--intel-text-secondary, #94A3B8)', fontSize: '0.885rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              {inst.tagline || 'Centro de Formação em Informática e Tecnologia'}. Formação prática de alta qualificação com foco no mercado de trabalho e excelência tecnológica.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00C7FD', fontSize: '0.825rem', fontWeight: '600' }}>
              <ShieldCheck size={16} />
              Certificação Profissional com QR Code Anti-Fraude
            </div>
          </div>

          {/* Académico & Cursos */}
          <div>
            <h4 style={{ fontSize: '0.925rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              Formação & Cursos
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.885rem', color: 'var(--intel-text-secondary, #94A3B8)' }}>
              <li>
                <Link to="/cursos" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Catálogo de Cursos
                </Link>
              </li>
              <li>
                <Link to="/inscricao" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Inscrição Online de Estudantes
                </Link>
              </li>
              <li>
                <Link to="/validar" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Validação de Certificados
                </Link>
              </li>
              <li>
                <Link to="/noticias" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Notícias & Comunicados
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Portal do Estudante & Formador
                </Link>
              </li>
            </ul>
          </div>

          {/* Institucional & Legal */}
          <div>
            <h4 style={{ fontSize: '0.925rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              Institucional & Ajuda
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.885rem', color: 'var(--intel-text-secondary, #94A3B8)' }}>
              <li>
                <Link to="/sobre" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Sobre a Instituição
                </Link>
              </li>
              <li>
                <Link to="/contactos" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Localização & Contactos
                </Link>
              </li>
              <li>
                <Link to="/faq" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Perguntas Frequentes (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/privacidade" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
                  Termos de Uso & Regulamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Contactos Oficiais */}
          <div>
            <h4 style={{ fontSize: '0.925rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              Localização & Sede
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.885rem', color: 'var(--intel-text-secondary, #94A3B8)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <MapPin size={17} color="#00C7FD" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{inst.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Phone size={17} color="#00C7FD" style={{ flexShrink: 0 }} />
                <span>{inst.phone || '+258 834 847 306'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Mail size={17} color="#00C7FD" style={{ flexShrink: 0 }} />
                <span>{inst.email || 'contacto@zatyacademy.co.mz'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR COM DIREITOS E LINKS LEGAIS */}
      <div className="intel-bottom-bar" style={{ borderTop: '1px solid rgba(0, 163, 224, 0.2)', padding: '1.25rem 0', background: 'rgba(0, 12, 24, 0.95)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem', color: '#94A3B8' }}>
          <div>
            &copy; {new Date().getFullYear()} <strong>{inst.name || 'ZATY ACADEMY'}</strong>. Todos os direitos reservados.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link to="/privacidade" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
              Privacidade
            </Link>
            <Link to="/termos" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
              Termos
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('zaty_open_cookie_banner'))}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'inherit',
                font: 'inherit',
                fontSize: 'inherit',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.color='#00C7FD'}
              onMouseOut={e => e.currentTarget.style.color='inherit'}
            >
              Definições de Cookies
            </button>
            <Link to="/faq" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
              FAQ
            </Link>
            <Link to="/contactos" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='#00C7FD'} onMouseOut={e => e.target.style.color='inherit'}>
              Contactos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

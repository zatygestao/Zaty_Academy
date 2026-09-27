import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import SEO from '../../components/common/SEO';
import BrandLogo from '../../components/common/BrandLogo';
import { 
  ShieldCheck, 
  Target, 
  Eye, 
  Award, 
  Cpu, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Mail,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function AboutUs() {
  const { settings } = useSettings();
  const inst = settings.institution || {};

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)' }}>
      <SEO 
        title="Sobre a Instituição" 
        description="Conheça a Zaty Academy, centro de excelência em formação profissional de Informática e Tecnologia em Namicopo, Nampula. Saiba mais sobre a nossa missão, valores e infraestrutura."
      />

      {/* Hero Section */}
      <section style={{
        padding: '5rem 1.5rem 4rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0, 40, 75, 0.55) 0%, rgba(0, 18, 36, 0.95) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.95rem', borderRadius: '999px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.35)', color: '#00C7FD', fontSize: '0.825rem', fontWeight: '700', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={15} />
            Excelência Tecnológica em Moçambique
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '1.25rem' }}>
            Transformando Vidas Através da <span style={{ color: '#00C7FD' }}>Tecnologia Prática</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#A5CBEA', lineHeight: '1.7', margin: '0 auto 2rem auto', maxWidth: '700px' }}>
            {inst.tagline || 'Centro de Formação em Informática e Tecnologia'}. Capacitamos jovens e profissionais com habilidades reais e aplicáveis no mercado de trabalho nacional e internacional.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/cursos" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} />
              <span>Conhecer Nossos Cursos</span>
            </Link>
            <Link to="/inscricao" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Fazer Inscrição</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quem Somos */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: '#00C7FD', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Nossa Identidade
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#FFFFFF', margin: '0.5rem 0 1.25rem 0', lineHeight: 1.3 }}>
                Uma Academia Construída para o Futuro Digital
              </h2>
              <p style={{ color: '#E2E8F0', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Fundada com o propósito de suprir a crescente demanda por profissionais qualificados em TI, a <strong>Zaty Academy</strong> destaca-se pela metodologia de ensino moderna, orientada à prática intensiva em computadores e laboratórios preparados.
              </p>
              <p style={{ color: '#94A3B8', lineHeight: '1.8', fontSize: '0.925rem', marginBottom: '1.75rem' }}>
                Acreditamos que aprender tecnologia exige prática constante. Por isso, os nossos cursos equilibram fundamentos essenciais com oficinas práticas de resolução de problemas do mundo corporativo.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(0, 42, 78, 0.4)', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#00C7FD' }}>100%</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Aulas Práticas & Laboratórios</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(0, 42, 78, 0.4)', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#00C7FD' }}>QR Code</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Certificados Verificáveis</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(0, 199, 253, 0.35)', position: 'relative' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <BrandLogo size={46} showText={true} subtitle={false} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {[
                  { title: 'Certificação Profissional', desc: 'Certificados impressos e digitais com código de autenticidade criptográfico e validação pública instantânea.' },
                  { title: 'Formadores Certificados', desc: 'Profissionais atuantes na indústria, garantindo ensino alinhado aos padrões e tendências de mercado.' },
                  { title: 'Ambiente Tecnológico Intel', desc: 'Máquinas de alto desempenho e softwares atualizados para uma formação de ponta a ponta.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(0, 199, 253, 0.15)',
                      border: '1px solid #00C7FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00C7FD',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <strong style={{ color: '#FFFFFF', fontSize: '0.925rem', display: 'block' }}>{item.title}</strong>
                      <span style={{ color: '#94A3B8', fontSize: '0.835rem', lineHeight: '1.5', display: 'block', marginTop: '2px' }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'rgba(0, 20, 40, 0.65)', borderTop: '1px solid rgba(0, 163, 224, 0.15)', borderBottom: '1px solid rgba(0, 163, 224, 0.15)' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#00C7FD', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Nossos Fundamentos
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#FFFFFF', marginTop: '0.5rem' }}>
              Missão, Visão & Princípios Institucionais
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Missão */}
            <div className="glass-card" style={{ padding: '2.25rem', border: '1px solid rgba(0, 163, 224, 0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(0, 114, 206, 0.2)', border: '1px solid #0072CE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', marginBottom: '1.25rem' }}>
                <Target size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.75rem' }}>Nossa Missão</h3>
              <p style={{ color: '#A5CBEA', fontSize: '0.9rem', lineHeight: '1.7' }}>
                Democratizar o acesso ao conhecimento tecnológico de qualidade, capacitando cidadãos moçambicanos com formação técnica prática para gerarem valor no mercado e impulsionarem a economia digital.
              </p>
            </div>

            {/* Visão */}
            <div className="glass-card" style={{ padding: '2.25rem', border: '1px solid rgba(0, 199, 253, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(0, 199, 253, 0.2)', border: '1px solid #00C7FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', marginBottom: '1.25rem' }}>
                <Eye size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.75rem' }}>Nossa Visão</h3>
              <p style={{ color: '#A5CBEA', fontSize: '0.9rem', lineHeight: '1.7' }}>
                Ser o centro de formação de referência na província de Nampula e no país, reconhecido pela alta taxa de empregabilidade dos formandos, inovação pedagógica e rigor profissional.
              </p>
            </div>

            {/* Valores */}
            <div className="glass-card" style={{ padding: '2.25rem', border: '1px solid rgba(0, 163, 224, 0.25)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6EE7B7', marginBottom: '1.25rem' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.75rem' }}>Nossos Valores</h3>
              <p style={{ color: '#A5CBEA', fontSize: '0.9rem', lineHeight: '1.7' }}>
                Ética profissional, rigor técnico, transparência total com estudantes, respeito à diversidade, integridade e inovação contínua nas metodologias de ensino.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Onde Estamos */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '840px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(0, 199, 253, 0.15)', border: '2px solid #00C7FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', margin: '0 auto 1.25rem auto' }}>
            <MapPin size={28} />
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.85rem' }}>
            Instalações em Namicopo, Nampula
          </h2>
          <p style={{ color: '#A5CBEA', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '640px', margin: '0 auto 1.75rem auto' }}>
            Estamos localizados em <strong>{inst.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'}</strong>. Venha conhecer a nossa estrutura física e falar diretamente com a nossa coordenação pedagógica.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', color: '#FFFFFF', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="#00C7FD" />
              <span>{inst.phone || '+258 834 847 306'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="#00C7FD" />
              <span>{inst.email || 'contacto@zatyacademy.co.mz'}</span>
            </div>
          </div>

          <Link to="/contactos" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Ver Informações de Contacto Completas</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

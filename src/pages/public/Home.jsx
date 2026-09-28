import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getSettings, getTeamMembers } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import SEO from '../../components/common/SEO';
import BrandLogo from '../../components/common/BrandLogo';
import EnrollmentFloatingBanner from '../../components/common/EnrollmentFloatingBanner';
import EnrollmentFlyerPost from '../../components/common/EnrollmentFlyerPost';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles,
  MessageSquare,
  CreditCard,
  UserPlus
} from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, sData] = await Promise.all([
          getCourses(),
          getSettings()
        ]);
        setCourses(cData || []);
        if (sData) setSettings(sData);
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadTeamData() {
      try {
        const tData = await getTeamMembers({ homeOnly: true });
        setTeamMembers(tData || []);
      } catch (err) {
        console.error('Erro ao carregar equipa:', err);
      } finally {
        setLoadingTeam(false);
      }
    }

    loadData();
    loadTeamData();
  }, []);

  const inst = settings.institution || {};

  return (
    <div>
      <SEO 
        title="Centro de Formação em Informática e Tecnologia" 
        description="Centro de Formação Profissional de Informática e Tecnologia em Namicopo, Nampula. Inscrições abertas para cursos práticos de alta qualificação com certificação validada por QR Code."
      />

      {/* =========================================================
          HERO SECTION DE ÚLTIMA GERAÇÃO
          Design executivo, iluminação ambiente sutil e tipografia balanceada
          ========================================================= */}
      <section style={{
        padding: '5.5rem 0 4.5rem 0',
        background: 'radial-gradient(1100px 520px at 50% -10%, rgba(0, 199, 253, 0.16) 0%, rgba(0, 75, 135, 0.08) 50%, transparent 100%), linear-gradient(180deg, rgba(0, 42, 78, 0.65) 0%, rgba(0, 18, 36, 0.85) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.22)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Bloco Central do Hero (Texto, Badge e Ações) */}
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px', position: 'relative', zIndex: 2 }}>
          {/* Logotipo Central com Brilho Suave */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <BrandLogo size={78} glow={true} />
          </div>

          {/* Badge Executivo de Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1.15rem',
            borderRadius: '999px',
            background: 'rgba(0, 199, 253, 0.12)',
            border: '1px solid rgba(0, 199, 253, 0.4)',
            color: '#00C7FD',
            fontSize: '0.825rem',
            fontWeight: '700',
            letterSpacing: '0.04em',
            marginBottom: '1.75rem',
            boxShadow: '0 0 20px rgba(0, 199, 253, 0.14)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px #10B981',
              display: 'inline-block'
            }} />
            <Sparkles size={16} />
            <span>INSCRIÇÕES ABERTAS 2026 — VAGAS LIMITADAS</span>
          </div>

          {/* Título Principal de Alto Impacto */}
          <h1 style={{
            fontSize: 'clamp(2.3rem, 5.2vw, 3.8rem)',
            fontWeight: '800',
            lineHeight: '1.16',
            marginBottom: '1.25rem',
            color: '#FFFFFF',
            letterSpacing: '-0.02em'
          }}>
            Formação Profissional em{' '}
            <span style={{ 
              background: 'linear-gradient(135deg, #00C7FD 0%, #38BDF8 60%, #BAE6FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Informática & Tecnologia
            </span>
          </h1>

          {/* Descrição Lead */}
          <p style={{
            fontSize: '1.15rem',
            color: '#BAE6FD',
            lineHeight: '1.65',
            marginBottom: '2.25rem',
            maxWidth: '700px',
            margin: '0 auto 2.25rem auto'
          }}>
            Desenvolva habilidades práticas de alta demanda com cursos modulares, laboratórios equipados e certificação profissional validada por QR Code oficial anti-fraude.
          </p>

          {/* Botões de Ação Principais (CTAs) */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.25rem' }}>
            <Link 
              to="/inscricao" 
              className="btn btn-primary btn-lg"
              style={{
                boxShadow: '0 4px 24px rgba(0, 199, 253, 0.35)',
                minHeight: '48px',
                fontWeight: '700',
                letterSpacing: '0.03em',
                padding: '0.75rem 1.85rem'
              }}
            >
              <span>FAZER INSCRIÇÃO ONLINE</span>
              <ArrowRight size={18} />
            </Link>

            <a 
              href="#cursos" 
              className="btn btn-secondary btn-lg"
              style={{
                minHeight: '48px',
                fontWeight: '600',
                border: '1px solid rgba(0, 199, 253, 0.35)',
                padding: '0.75rem 1.85rem'
              }}
            >
              <BookOpen size={18} color="#00C7FD" />
              <span>EXPLORAR CURSOS</span>
            </a>
          </div>

          {/* Micro-Indicadores de Confiança */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            fontSize: '0.84rem',
            color: '#94A3B8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Laboratórios Práticos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Certificado com QR Code</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Formadores Qualificados</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Inscrição 100% Online</span>
            </div>
          </div>
        </div>

        {/* 4 Destaques Rápidos Amplos (Container 1280px) */}
        <div className="container hero-highlights-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-highlights-grid">
            <div className="glass-card hero-highlights-card tech-card-hover" style={{ background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.7) 0%, rgba(0, 24, 48, 0.8) 100%)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.12)',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#00C7FD'
              }}>
                <Award size={22} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1.02rem', color: '#FFFFFF', marginBottom: '0.3rem', fontWeight: '700' }}>
                Certificação Válida
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.45' }}>
                QR Code oficial para validação pública e verificação anti-fraude.
              </span>
            </div>

            <div className="glass-card hero-highlights-card tech-card-hover" style={{ background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.7) 0%, rgba(0, 24, 48, 0.8) 100%)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.12)',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#00C7FD'
              }}>
                <Users size={22} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1.02rem', color: '#FFFFFF', marginBottom: '0.3rem', fontWeight: '700' }}>
                Formadores Especialistas
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.45' }}>
                Profissionais qualificados e ativos no mercado tecnológico.
              </span>
            </div>

            <div className="glass-card hero-highlights-card tech-card-hover" style={{ background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.7) 0%, rgba(0, 24, 48, 0.8) 100%)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.12)',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#00C7FD'
              }}>
                <BookOpen size={22} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1.02rem', color: '#FFFFFF', marginBottom: '0.3rem', fontWeight: '700' }}>
                Prática em Laboratório
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.45' }}>
                Aulas práticas presenciais com computadores e softwares dedicados.
              </span>
            </div>

            <div className="glass-card hero-highlights-card tech-card-hover" style={{ background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.7) 0%, rgba(0, 24, 48, 0.8) 100%)', border: '1px solid rgba(0, 163, 224, 0.25)', borderRadius: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.12)',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#00C7FD'
              }}>
                <ShieldCheck size={22} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1.02rem', color: '#FFFFFF', marginBottom: '0.3rem', fontWeight: '700' }}>
                Portal do Estudante
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.45' }}>
                Área digital integrada com manuais em PDF, notas e horários.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PUBLICAÇÃO OFICIAL DO FOLHETO DE INSCRIÇÕES ABERTAS
          ========================================================= */}
      {settings.academic?.enrollment_notice_enabled === true && (
        <section style={{ padding: '4.5rem 0', background: 'rgba(0, 18, 36, 0.65)', borderBottom: '1px solid rgba(0, 163, 224, 0.18)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
              <span style={{ 
                color: '#00C7FD', 
                fontSize: '0.8rem', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em',
                background: 'rgba(0, 199, 253, 0.1)',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'inline-block',
                marginBottom: '0.75rem'
              }}>
                COMUNICADO OFICIAL INSTITUCIONAL
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Inscrições Abertas — Ano Formativo 2026
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.94rem', marginTop: '0.5rem', lineHeight: '1.55' }}>
                Consulte a nossa publicação oficial com os cursos práticos disponíveis e realize a sua candidatura online com total segurança.
              </p>
            </div>

            <EnrollmentFlyerPost />
          </div>
        </section>
      )}

      {/* =========================================================
          COMO FUNCIONA O PROCESSO (ETAPAS OBJETIVAS)
          Layout responsivo balanceado: 4 colunas desktop, 2 colunas tablet, 1 coluna mobile
          ========================================================= */}
      <section style={{ padding: '4.5rem 0', background: 'rgba(0, 20, 42, 0.55)', borderBottom: '1px solid rgba(0, 163, 224, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <span style={{ 
              color: '#00C7FD', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em',
              background: 'rgba(0, 199, 253, 0.1)',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid rgba(0, 199, 253, 0.3)',
              display: 'inline-block',
              marginBottom: '0.75rem'
            }}>
              FLUXO SIMPLIFICADO & TRANSPARENTE
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Como Ingressar na Zaty Academy
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.94rem', marginTop: '0.5rem' }}>
              Passo a passo rápido e objetivo para iniciar a sua qualificação profissional:
            </p>
          </div>

          <div className="process-steps-grid">
            {[
              { 
                step: '01', 
                title: 'Inscrição Online', 
                desc: 'Preencha o formulário com os seus dados pessoais e selecione o curso pretendido.',
                Icon: UserPlus
              },
              { 
                step: '02', 
                title: 'Pagamento Seguro', 
                desc: 'Efetue a taxa via M-Pesa, e-Mola ou mKesh e submeta o comprovativo no sistema.',
                Icon: CreditCard
              },
              { 
                step: '03', 
                title: 'Acesso às Aulas', 
                desc: 'Aceda à Área do Estudante com manuais em PDF, horários de turma e conteúdos práticos.',
                Icon: GraduationCap
              },
              { 
                step: '04', 
                title: 'Certificação Oficial', 
                desc: 'Conclua a formação e receba o certificado profissional com QR Code de autenticidade.',
                Icon: Award
              },
            ].map((s, index) => {
              const StepIcon = s.Icon;
              return (
                <div 
                  key={index} 
                  className="glass-card tech-card-hover" 
                  style={{ 
                    padding: '1.75rem 1.35rem', 
                    textAlign: 'center', 
                    position: 'relative',
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, rgba(0, 32, 60, 0.7) 0%, rgba(0, 20, 42, 0.8) 100%)',
                    border: '1px solid rgba(0, 163, 224, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Número de Etapa Executivo */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    background: 'rgba(0, 199, 253, 0.15)',
                    border: '1px solid #00C7FD',
                    color: '#00C7FD',
                    fontWeight: '800',
                    fontSize: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.15rem',
                    boxShadow: '0 0 16px rgba(0, 199, 253, 0.18)'
                  }}>
                    {s.step}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                    <StepIcon size={18} color="#00C7FD" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF' }}>{s.title}</h3>
                  </div>

                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: '1.55', marginTop: '0.25rem' }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          CATÁLOGO DE CURSOS PROFISSIONAIS
          Cards refinados com preço destacado, metadados e botão de matrícula
          ========================================================= */}
      <section id="cursos" style={{ padding: '4.5rem 0' }}>
        <div className="container">
          {/* Cabeçalho do Catálogo com Layout Adaptável */}
          <div className="catalog-header-grid" style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1.5rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ 
                color: '#00C7FD', 
                fontSize: '0.8rem', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em',
                background: 'rgba(0, 199, 253, 0.1)',
                padding: '0.28rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid rgba(0, 199, 253, 0.3)',
                display: 'inline-block',
                marginBottom: '0.65rem'
              }}>
                FORMAÇÕES PROFISSIONAIS DISPONÍVEIS
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                Catálogo de Cursos Práticos
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.925rem', marginTop: '0.45rem', maxWidth: '560px' }}>
                Metodologias focadas em laboratório e competências aplicadas no mercado de Moçambique.
              </p>
            </div>

            <div style={{ flexShrink: 0 }}>
              <Link 
                to="/inscricao" 
                className="btn btn-primary" 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.35rem',
                  fontWeight: '700'
                }}
              >
                <span>INSCREVER-SE AGORA</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              <div style={{ marginBottom: '1rem', color: '#00C7FD' }}>
                <Clock size={32} />
              </div>
              <p>A carregar cursos disponíveis...</p>
            </div>
          ) : (
            <div className="courses-catalog-grid">
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className="glass-card tech-card-hover" 
                  style={{ 
                    padding: '2rem 1.85rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.75) 0%, rgba(0, 22, 44, 0.85) 100%)',
                    border: '1px solid rgba(0, 163, 224, 0.24)'
                  }}
                >
                  <div>
                    {/* Cabeçalho do Card: Título + Badge de Destaque */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#FFFFFF', lineHeight: '1.3' }}>
                        {course.title}
                      </h3>
                      {course.featured ? (
                        <span className="badge" style={{ 
                          background: 'rgba(0, 199, 253, 0.15)', 
                          color: '#00C7FD', 
                          border: '1px solid rgba(0, 199, 253, 0.45)', 
                          borderRadius: '999px', 
                          flexShrink: 0,
                          padding: '0.2rem 0.65rem',
                          fontWeight: '700'
                        }}>
                          DESTAQUE
                        </span>
                      ) : (
                        <span className="badge" style={{ 
                          background: 'rgba(255, 255, 255, 0.06)', 
                          color: '#BAE6FD', 
                          border: '1px solid rgba(255, 255, 255, 0.15)', 
                          borderRadius: '999px', 
                          flexShrink: 0,
                          padding: '0.2rem 0.65rem'
                        }}>
                          MODULAR
                        </span>
                      )}
                    </div>

                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                      {course.description}
                    </p>

                    {/* Metadados do Curso: Duração e Carga Horária */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem 1.25rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 20, 40, 0.75)',
                      border: '1px solid rgba(0, 163, 224, 0.18)',
                      marginBottom: '1.35rem',
                      fontSize: '0.84rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFFFFF' }}>
                        <Clock size={16} color="#00C7FD" />
                        <span><strong>Duração:</strong> {course.duration}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFFFFF' }}>
                        <BookOpen size={16} color="#00C7FD" />
                        <span><strong>Carga Horária:</strong> {course.workload_hours} Horas</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFFFFF' }}>
                        <Award size={16} color="#00C7FD" />
                        <span><strong>Certificado:</strong> Incluso</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Preço e Botão de Matrícula */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderTop: '1px solid rgba(0, 163, 224, 0.22)',
                    paddingTop: '1.15rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                        Investimento
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#00C7FD' }}>
                        {formatCurrency(course.price)}
                      </div>
                      {course.registration_fee > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                          + {formatCurrency(course.registration_fee)} taxa de matrícula
                        </div>
                      )}
                    </div>

                    <Link 
                      to={`/inscricao?curso=${course.id}`} 
                      className="btn btn-primary"
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontWeight: '700',
                        fontSize: '0.88rem'
                      }}
                    >
                      <span>MATRICULAR-SE</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          SEÇÃO NOSSA EQUIPA DE ESPECIALISTAS
          Grid responsivo: 4 colunas desktop, 2 colunas tablet, 1 coluna mobile
          ========================================================= */}
      <section id="equipa" style={{ padding: '4.5rem 0', background: 'rgba(0, 20, 42, 0.55)', borderTop: '1px solid rgba(0, 163, 224, 0.2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
            <span style={{ 
              color: '#00C7FD', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em',
              background: 'rgba(0, 199, 253, 0.1)',
              padding: '0.28rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid rgba(0, 199, 253, 0.3)',
              display: 'inline-block',
              marginBottom: '0.65rem'
            }}>
              CORPO DOCENTE & ESPECIALISTAS
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Nossa Equipa de Especialistas
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.94rem', marginTop: '0.5rem', lineHeight: '1.55' }}>
              Conheça os formadores, coordenadores e líderes dedicados a orientar o seu sucesso profissional em informática e tecnologia.
            </p>
          </div>

          {loadingTeam ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
              A carregar membros da equipa...
            </div>
          ) : teamMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              Informações da equipa em atualização.
            </div>
          ) : (
            <div className="team-members-grid">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="glass-card tech-card-hover" 
                  style={{ 
                    padding: '1.75rem 1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, rgba(0, 32, 60, 0.7) 0%, rgba(0, 20, 42, 0.8) 100%)',
                    border: '1px solid rgba(0, 163, 224, 0.22)'
                  }}
                >
                  {/* Fotografia Uniforme com Proporções 100% Preservadas */}
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    margin: '0 auto 1.15rem auto',
                    border: '2px solid rgba(0, 199, 253, 0.5)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
                    background: '#001830',
                    flexShrink: 0
                  }}>
                    <img
                      src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80'}
                      alt={member.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                    {member.full_name}
                  </h3>

                  <div style={{ fontSize: '0.84rem', color: '#00C7FD', fontWeight: '600', marginBottom: '0.75rem' }}>
                    {member.role}
                  </div>

                  {member.specialty && (
                    <div style={{ 
                      fontSize: '0.78rem', 
                      color: '#E0F2FE', 
                      background: 'rgba(0, 24, 48, 0.75)', 
                      border: '1px solid rgba(0, 163, 224, 0.25)', 
                      borderRadius: '6px', 
                      padding: '0.4rem 0.65rem',
                      marginBottom: '0.85rem' 
                    }}>
                      <strong>Especialidade:</strong> {member.specialty}
                    </div>
                  )}

                  {member.bio && (
                    <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: '1.5', marginTop: 'auto', marginBottom: '0.85rem' }}>
                      {member.bio}
                    </p>
                  )}

                  {member.education && (
                    <div style={{ fontSize: '0.76rem', color: '#64748B', borderTop: '1px solid rgba(0, 163, 224, 0.18)', paddingTop: '0.65rem' }}>
                      {member.education}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CARD DE COMUNIDADE CONFORME PADRÃO EXECUTIVO */}
          <div style={{ marginTop: '3.5rem' }}>
            <div className="intel-feature-card tech-card-hover" style={{ borderRadius: '10px', background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.75) 0%, rgba(0, 22, 44, 0.85) 100%)', border: '1px solid rgba(0, 199, 253, 0.35)' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '8px',
                background: 'rgba(0, 199, 253, 0.15)',
                border: '1px solid #00C7FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={26} color="#00C7FD" />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.35rem' }}>
                  Participe na nossa comunidade académica
                </h3>
                <p style={{ color: '#BAE6FD', fontSize: '0.925rem', lineHeight: '1.55' }}>
                  Contacte os nossos formadores e outros estudantes para trocar ideias, tirar dúvidas sobre as formações ou obter esclarecimentos curriculares.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BANNER DE VALIDAÇÃO DE CERTIFICADOS
          ========================================================= */}
      <section style={{ padding: '3.5rem 0', background: 'rgba(0, 24, 48, 0.65)', borderTop: '1px solid rgba(0, 163, 224, 0.22)' }}>
        <div className="container">
          <div className="glass-card tech-card-hover" style={{ 
            padding: '2.5rem 2.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '1.75rem',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, rgba(0, 36, 68, 0.8) 0%, rgba(0, 20, 42, 0.9) 100%)',
            border: '1px solid rgba(0, 199, 253, 0.35)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: '#00C7FD', 
                fontWeight: '700', 
                fontSize: '0.85rem', 
                marginBottom: '0.5rem', 
                letterSpacing: '0.05em' 
              }}>
                <CheckCircle2 size={18} />
                <span>SISTEMA DE VERIFICAÇÃO ANTI-FRAUDE</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.65rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Recebeu um Certificado da Zaty Academy?
              </h2>
              <p style={{ color: '#BAE6FD', fontSize: '0.94rem', lineHeight: '1.6' }}>
                Qualquer entidade, empresa ou recrutador pode verificar instantaneamente a autenticidade do documento através do código único ou lendo o QR Code do certificado.
              </p>
            </div>

            <Link 
              to="/validar" 
              className="btn btn-primary btn-lg" 
              style={{ 
                flexShrink: 0,
                minHeight: '48px',
                fontWeight: '700',
                padding: '0.75rem 1.75rem'
              }}
            >
              <CheckCircle2 size={18} />
              <span>ACEDER AO VALIDADOR</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Notificação Lateral de Inscrições Abertas (Ativada pelo Administrador) */}
      <EnrollmentFloatingBanner />
    </div>
  );
}

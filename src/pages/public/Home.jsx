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
  MessageSquare
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
      {/* HERO SECTION */}
      <section style={{
        padding: '5.5rem 0 4.5rem 0',
        background: 'linear-gradient(180deg, rgba(0, 56, 101, 0.6) 0%, rgba(0, 32, 58, 0) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.18)'
      }}>
        {/* Bloco Central do Hero (Texto e Ações) */}
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <BrandLogo size={74} glow={true} />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            background: 'rgba(0, 114, 206, 0.25)',
            border: '1px solid rgba(0, 199, 253, 0.4)',
            color: '#00C7FD',
            fontSize: '0.825rem',
            fontWeight: '700',
            letterSpacing: '0.04em',
            marginBottom: '1.75rem'
          }}>
            <Sparkles size={16} />
            INSCRIÇÕES ABERTAS 2026 — VAGAS LIMITADAS
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: '800',
            lineHeight: '1.15',
            marginBottom: '1.25rem',
            color: '#FFFFFF'
          }}>
            Formação Profissional em <span style={{ color: 'var(--intel-cyan)' }}>Informática & Tecnologia</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#A5CBEA',
            lineHeight: '1.6',
            marginBottom: '2.5rem',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto'
          }}>
            Aprenda habilidades práticas e tecnológicas com cursos modulares, laboratórios reais e certificados digitais com validação pública anti-fraude.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscricao" className="btn btn-primary btn-lg">
              FAZER INSCRIÇÃO ONLINE
              <ArrowRight size={18} />
            </Link>
            <a href="#cursos" className="btn btn-secondary btn-lg">
              <BookOpen size={18} />
              EXPLORAR CURSOS
            </a>
          </div>
        </div>

        {/* Destaques Rápidos Amplos (Largura Total da Página - Container 1280px) */}
        <div className="container hero-highlights-container">
          <div className="hero-highlights-grid">
            <div className="glass-card hero-highlights-card">
              <div className="highlight-icon" style={{ color: '#00C7FD', marginBottom: '0.45rem' }}>
                <Award size={24} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                Certificação Válida
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: '1.4' }}>
                QR Code para verificação oficial
              </span>
            </div>

            <div className="glass-card hero-highlights-card">
              <div className="highlight-icon" style={{ color: '#00C7FD', marginBottom: '0.45rem' }}>
                <Users size={24} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                Formadores Qualificados
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: '1.4' }}>
                Profissionais ativos no mercado
              </span>
            </div>

            <div className="glass-card hero-highlights-card">
              <div className="highlight-icon" style={{ color: '#00C7FD', marginBottom: '0.45rem' }}>
                <BookOpen size={24} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                Prática em Laboratório
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: '1.4' }}>
                Aulas práticas focadas em resultados
              </span>
            </div>

            <div className="glass-card hero-highlights-card">
              <div className="highlight-icon" style={{ color: '#00C7FD', marginBottom: '0.45rem' }}>
                <ShieldCheck size={24} />
              </div>
              <strong className="highlight-title" style={{ display: 'block', fontSize: '1rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                Portal do Estudante
              </strong>
              <span className="highlight-desc" style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: '1.4' }}>
                Acesso a materiais e PDFs das aulas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLICAÇÃO OFICIAL DO FOLHETO DE INSCRIÇÕES ABERTAS */}
      {settings.academic?.enrollment_notice_enabled === true && (
        <section style={{ padding: '4.5rem 0', background: 'rgba(0, 18, 36, 0.45)', borderBottom: '1px solid rgba(0, 163, 224, 0.18)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
              <span style={{ color: '#00C7FD', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                COMUNICADO OFICIAL
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF' }}>
                Inscrições Abertas — Ano Formativo 2026
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.925rem', marginTop: '0.4rem' }}>
                Consulte a nossa publicação oficial com os cursos práticos disponíveis e realize a sua candidatura online.
              </p>
            </div>

            <EnrollmentFlyerPost />
          </div>
        </section>
      )}

      {/* COMO FUNCIONA O PROCESSO */}
      <section style={{ padding: '4.5rem 0', background: 'rgba(0, 20, 40, 0.4)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <span style={{ color: '#00C7FD', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FLUXO TRANSPARENTE
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF' }}>Como Ingressar na Zaty Academy</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Passo a passo simples para iniciar sua qualificação profissional.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Inscrição Online', desc: 'Preencha os seus dados e anexe os documentos necessários com validação imediata.' },
              { step: '02', title: 'Pagamento Seguro', desc: 'Pague a taxa via M-Pesa, e-Mola ou mKesh e envie o comprovativo no portal.' },
              { step: '03', title: 'Acesso às Aulas', desc: 'Aceda à Área do Estudante com manuais em PDF, horários de turma e conteúdos.' },
              { step: '04', title: 'Certificação Oficial', desc: 'Conclua o curso e receba o certificado em PDF com QR Code de autenticidade.' },
            ].map((s, index) => (
              <div key={index} className="glass-card" style={{ padding: '1.5rem 1.15rem', textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '4px',
                  background: 'rgba(0, 114, 206, 0.3)',
                  border: '1px solid #00C7FD',
                  color: '#00C7FD',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE CURSOS */}
      <section id="cursos" style={{ padding: '4.5rem 0' }}>
        <div className="container">
          {/* Cabeçalho do Catálogo: Estritamente 2 Linhas e 2 Colunas */}
          <div className="catalog-header-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '0.6rem 2.5rem',
            alignItems: 'center',
            marginBottom: '2.5rem'
          }}>
            {/* Linha 1 */}
            <div>
              <span style={{ color: '#00C7FD', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CATÁLOGO DE CURSOS
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0, maxWidth: '520px' }}>
                Formação prática com laboratórios e metodologias focadas no mercado de Moçambique.
              </p>
            </div>

            {/* Linha 2 */}
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Cursos Profissionais Disponíveis
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Link to="/inscricao" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                INSCREVER-SE AGORA
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar cursos disponíveis...
            </div>
          ) : (
            <div className="courses-catalog-grid">
              {courses.map(course => (
                <div key={course.id} className="glass-card" style={{ padding: '2rem 1.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '6px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', lineHeight: '1.3' }}>{course.title}</h3>
                      {course.featured && (
                        <span className="badge" style={{ background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', border: '1px solid rgba(0, 199, 253, 0.4)', borderRadius: '3px', flexShrink: 0 }}>
                          DESTAQUE
                        </span>
                      )}
                    </div>

                    <p style={{ color: '#94A3B8', fontSize: '0.885rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                      {course.description}
                    </p>

                    {/* Metadados do Curso */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '4px',
                      background: 'rgba(0, 24, 48, 0.6)',
                      border: '1px solid rgba(0, 163, 224, 0.15)',
                      marginBottom: '1.25rem',
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                        <Clock size={15} color="#00C7FD" />
                        <span><strong>Duração:</strong> {course.duration}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                        <BookOpen size={15} color="#00C7FD" />
                        <span><strong>Carga Horária:</strong> {course.workload_hours} Horas</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderTop: '1px solid rgba(0, 163, 224, 0.2)',
                    paddingTop: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Investimento</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#00C7FD' }}>
                        {formatCurrency(course.price)}
                      </div>
                      {course.registration_fee > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          + {formatCurrency(course.registration_fee)} matrícula
                        </div>
                      )}
                    </div>

                    <Link to={`/inscricao?curso=${course.id}`} className="btn btn-primary">
                      MATRICULAR-SE
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO NOSSA EQUIPA DE ESPECIALISTAS */}
      <section id="equipa" style={{ padding: '4.5rem 0', background: 'rgba(0, 20, 42, 0.5)', borderTop: '1px solid rgba(0, 163, 224, 0.2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
            <span style={{ color: '#00C7FD', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CORPO DOCENTE & ESPECIALISTAS
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.35rem', color: '#FFFFFF' }}>
              Nossa Equipa de Especialistas
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.925rem', marginTop: '0.5rem' }}>
              Conheça os formadores, coordenadores e líderes dedicados a orientar o seu sucesso profissional em informática e tecnologia.
            </p>
          </div>

          {loadingTeam ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              A carregar membros da equipa...
            </div>
          ) : teamMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              Informações da equipa em atualização.
            </div>
          ) : (
            <div className="grid-4" style={{ gap: '1.5rem' }}>
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    textAlign: 'center'
                  }}
                >
                  {/* Fotografia Uniforme com Proporções Preservadas */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    margin: '0 auto 1.15rem auto',
                    border: '2px solid rgba(0, 199, 253, 0.4)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    background: '#001830'
                  }}>
                    <img
                      src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80'}
                      alt={member.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {member.full_name}
                  </h3>

                  <div style={{ fontSize: '0.825rem', color: '#00C7FD', fontWeight: '600', marginBottom: '0.75rem' }}>
                    {member.role}
                  </div>

                  {member.specialty && (
                    <div style={{ 
                      fontSize: '0.78rem', 
                      color: '#E0F2FE', 
                      background: 'rgba(0, 24, 48, 0.65)', 
                      border: '1px solid rgba(0, 163, 224, 0.2)', 
                      borderRadius: '4px', 
                      padding: '0.4rem 0.6rem',
                      marginBottom: '0.75rem' 
                    }}>
                      <strong>Especialidade:</strong> {member.specialty}
                    </div>
                  )}

                  {member.bio && (
                    <p style={{ fontSize: '0.825rem', color: '#94A3B8', lineHeight: '1.5', marginTop: 'auto', marginBottom: '0.75rem' }}>
                      {member.bio}
                    </p>
                  )}

                  {member.education && (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px solid rgba(0, 163, 224, 0.15)', paddingTop: '0.65rem' }}>
                      {member.education}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CARD DE COMUNIDADE CONFORME IMAGEM 2 */}
          <div style={{ marginTop: '3.5rem' }}>
            <div className="intel-feature-card">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '6px',
                background: 'rgba(0, 114, 206, 0.3)',
                border: '1px solid #00C7FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={24} color="#FFFFFF" />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.35rem' }}>
                  Participe na nossa comunidade
                </h3>
                <p style={{ color: '#A5CBEA', fontSize: '0.925rem', lineHeight: '1.5' }}>
                  Contacte os nossos formadores e outros estudantes para trocar ideias, tirar dúvidas sobre as formações ou obter assistência curricular.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER DE VALIDAÇÃO DE CERTIFICADOS */}
      <section style={{ padding: '3.5rem 0', background: 'rgba(0, 24, 48, 0.5)', borderTop: '1px solid rgba(0, 163, 224, 0.2)' }}>
        <div className="container">
          <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.75rem' }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00C7FD', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                <CheckCircle2 size={18} />
                SISTEMA DE VERIFICAÇÃO ANTI-FRAUDE
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.65rem', color: '#FFFFFF' }}>Recebeu um Certificado da Zaty Academy?</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.925rem', lineHeight: '1.6' }}>
                Qualquer entidade, empresa ou recrutador pode verificar instantaneamente a autenticidade do documento através do código único ou lendo o QR Code do certificado.
              </p>
            </div>
            <Link to="/validar" className="btn btn-primary btn-lg" style={{ flexShrink: 0 }}>
              <CheckCircle2 size={18} />
              ACEDER AO VALIDADOR
            </Link>
          </div>
        </div>
      </section>

      {/* Notificação Lateral de Inscrições Abertas (Ativada pelo Administrador) */}
      <EnrollmentFloatingBanner />
    </div>
  );
}

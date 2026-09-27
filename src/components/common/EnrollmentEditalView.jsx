import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  FileCheck, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Printer, 
  Sparkles,
  ShieldCheck,
  FileText,
  ExternalLink
} from 'lucide-react';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { OFFICIAL_ENROLLMENT_COURSES } from '../../constants/enrollmentCourses';

/**
 * Componente do Edital Completo de Inscrições Abertas da ZATY ACADEMY
 * Apresenta o edital completo de forma organizada, ocupando uma largura ampla (1240px)
 * e equilibrada com todas as informações oficiais necessárias para o candidato.
 */
export default function EnrollmentEditalView({
  onViewFlyer = null,
  showTopNav = true,
  isHomePage = false,
  onPrint = null
}) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  const { settings } = useSettings();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const inst = settings?.institution || {};
  const academic = settings?.academic || {};
  const isEnabled = academic?.enrollment_notice_enabled === true;

  if (!isEnabled) {
    return null;
  }

  // Rotação Automática Contínua das Fotografias Oficiais (Muda a cada 4 segundos)
  useEffect(() => {
    if (academic.enrollment_flyer_image || !isAutoPlaying) return;

    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [academic.enrollment_flyer_image, isAutoPlaying]);

  const requirementsList = (academic.enrollment_requirements || '')
    .split(/[\n;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const conditionsList = (academic.enrollment_conditions || '')
    .split(/[\n;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const DEFAULT_PROCEDURES = [
    'Escolha o seu curso pretendido e preencha a inscrição online ou dirija-se à secretaria da academia.',
    'Efetue o pagamento da taxa de inscrição através de M-Pesa, e-Mola ou na secretaria.',
    'Anexe o comprovativo de pagamento no portal do estudante ou entregue na secretaria.',
    'Receba a confirmação da sua matrícula, turma, horário das aulas e credenciais de acesso ao portal.'
  ];

  const rawProcedures = (academic.enrollment_procedures || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const proceduresList = rawProcedures.length > 0 ? rawProcedures : DEFAULT_PROCEDURES;

  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="enrollment-edital-wrapper" style={{ width: '100%' }}>
      {/* 1. BARRA SUPERIOR DE AÇÕES RÁPIDAS COM O BOTÃO "VER FOLHETO PUBLICITÁRIO" */}
      {showTopNav && (
        <div 
          className="no-print" 
          style={{ 
            maxWidth: '1240px', 
            margin: '0 auto 1.5rem auto', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '0.85rem' 
          }}
        >
          {/* Botão Oficial: Ver Folheto Publicitário */}
          {onViewFlyer && (
            <button
              type="button"
              onClick={onViewFlyer}
              title="Visualizar o Folheto Publicitário Oficial em Alta Resolução"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'linear-gradient(135deg, rgba(0, 114, 181, 0.45) 0%, rgba(0, 199, 253, 0.25) 100%)',
                border: '1.4px solid #00C7FD',
                color: '#FFFFFF',
                padding: '0.6rem 1.35rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 199, 253, 0.25)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em'
              }}
            >
              <FileText size={17} color="#00C7FD" />
              <span>Ver Folheto Publicitário</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Se estiver na Página Inicial, permite abrir a página dedicada do Edital */}
            {isHomePage && (
              <Link
                to="/inscricoes-abertas"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(0, 32, 64, 0.8)',
                  border: '1px solid rgba(0, 163, 224, 0.35)',
                  color: '#BAE6FD',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>Edital em Página Dedicada</span>
                <ExternalLink size={14} color="#00C7FD" />
              </Link>
            )}

            {/* Botão de Impressão Administrativa (2x A5 em A4) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handlePrintAction}
                title="Acesso Administrativo: Imprimir folha A4 com 2 folhetos A5 lado a lado"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 199, 253, 0.25)'
                }}
              >
                <Printer size={16} />
                <span>Imprimir Folheto (A4)</span>
              </button>
            )}

            {/* Botão Principal de Inscrição Online */}
            <Link
              to="/inscricao"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>Fazer Inscrição Online</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* 2. CONTENTOR PRINCIPAL DO EDITAL COMPLETO (Largura Ampla: 1240px) */}
      <div 
        className="screen-document-container"
        style={{ 
          maxWidth: '1240px', 
          margin: '0 auto', 
          background: '#041628', 
          border: '1px solid rgba(0, 163, 224, 0.3)', 
          borderRadius: '12px', 
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: 'clamp(1.5rem, 3.5vw, 2.75rem)' }}>
          {/* Cabeçalho Institucional do Documento */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1.5rem',
            borderBottom: '2px solid rgba(0, 163, 224, 0.35)',
            paddingBottom: '1.75rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img 
                src={inst.logo_url || '/logo.png'} 
                alt="Logotipo Zaty Academy" 
                style={{ maxHeight: '72px', maxWidth: '180px', objectFit: 'contain' }}
              />
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.02em', margin: 0 }}>
                  {inst.name || 'ZATY ACADEMY'}
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#00C7FD', margin: '0.2rem 0 0 0', fontWeight: '600' }}>
                  {inst.tagline || 'Centro de Formação em Informática e Tecnologia'}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0.2rem 0 0 0' }}>
                  Centro de Excelência em Formação Profissional &bull; Secretaria Académica
                </p>
              </div>
            </div>

            <div className="header-contact-info" style={{ textAlign: 'right', fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.5 }}>
              <div>{inst.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'}</div>
              <div>Tel: <strong style={{ color: '#E2E8F0' }}>{inst.phone || '+258 834 847 306'}</strong></div>
              <div>Email: <strong style={{ color: '#00C7FD' }}>{inst.email || 'contacto@zatyacademy.co.mz'}</strong></div>
            </div>
          </div>

          {/* Banner de Status Oficial com Acesso Rápido ao Folheto */}
          <div style={{ 
            background: isEnabled ? 'linear-gradient(135deg, rgba(0, 114, 181, 0.25) 0%, rgba(0, 199, 253, 0.15) 100%)' : 'rgba(239, 68, 68, 0.1)', 
            border: isEnabled ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '1.25rem 1.5rem', 
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Sparkles size={16} color="#00C7FD" />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00C7FD', fontWeight: '700' }}>
                  INFORMAÇÃO OFICIAL
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {academic.enrollment_title || 'INSCRIÇÕES ABERTAS - ANO FORMATIVO 2026'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#E2E8F0' }}>
                <Calendar size={15} color="#34D399" />
                <span><strong>Período Oficial:</strong> {academic.enrollment_period || 'Ano Formativo 2026'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0.4rem 0.85rem', 
                borderRadius: '9999px', 
                fontSize: '0.8rem', 
                fontWeight: '700',
                background: isEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                color: isEnabled ? '#34D399' : '#F87171',
                border: isEnabled ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.4)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isEnabled ? '#10B981' : '#EF4444' }}></span>
                {isEnabled ? 'Inscrições Abertas' : 'Inscrições Suspensas'}
              </span>
            </div>
          </div>

          {/* Destaque Fotográfico dos Cursos com Rotação Automática de Imagens */}
          <div 
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            style={{
              marginBottom: '2.5rem',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              position: 'relative',
              height: '340px',
              background: '#041628',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Camada das 4 Fotografias Oficiais com Transição Suave */}
            {DEFAULT_IT_STUDY_IMAGES.map((imgUrl, idx) => {
              const isActive = academic.enrollment_flyer_image 
                ? academic.enrollment_flyer_image === imgUrl 
                : selectedImageIndex === idx;
              return (
                <img 
                  key={idx}
                  src={imgUrl} 
                  alt={`Laboratório de Informática Zaty Academy ${idx + 1}`} 
                  style={{ 
                    position: 'absolute',
                    inset: 0,
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    display: 'block',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(1.03)',
                    transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s ease-out',
                    pointerEvents: isActive ? 'auto' : 'none'
                  }} 
                />
              );
            })}

            {/* Gradiente de Legibilidade e Título */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(2, 11, 20, 0.92) 0%, rgba(2, 11, 20, 0.35) 50%, rgba(2, 11, 20, 0.05) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '1.5rem',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              zIndex: 3
            }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Aulas 100% Práticas em Computadores Individuais
                </h3>
                <p style={{ color: '#E2E8F0', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>
                  Laboratórios modernos equipados com computadores individuais e formadores qualificados.
                </p>
              </div>

              {/* Indicadores das Fotos */}
              {!academic.enrollment_flyer_image && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', zIndex: 4 }}>
                  {DEFAULT_IT_STUDY_IMAGES.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setSelectedImageIndex(dotIdx)}
                      style={{
                        width: selectedImageIndex === dotIdx ? '22px' : '7px',
                        height: '7px',
                        borderRadius: '4px',
                        background: selectedImageIndex === dotIdx ? '#00C7FD' : 'rgba(255, 255, 255, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.3s ease'
                      }}
                      title={`Foto ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isEnabled && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '8px', 
              padding: '1.25rem', 
              marginBottom: '2rem',
              color: '#FCA5A5',
              fontSize: '0.9rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Atenção:</strong> As inscrições públicas para novas turmas encontram-se temporariamente suspensas ou a aguardar abertura do próximo ciclo formativo. Poderá entrar em contacto com a nossa secretaria académica para reserva de vaga ou esclarecimento de dúvidas.
              </div>
            </div>
          )}

          {/* Seção 1: Cursos Disponíveis (4 Colunas em Telas Amplas de 1240px) */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', paddingBottom: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={22} color="#00C7FD" />
                1. Cursos Disponíveis para o Ciclo Formativo
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#00C7FD', fontWeight: '700' }}>
                4 Cursos Profissionais Especializados (60h cada)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {OFFICIAL_ENROLLMENT_COURSES.map((course) => (
                <div 
                  key={course.id}
                  style={{ 
                    background: 'rgba(0, 42, 78, 0.45)', 
                    border: '1px solid rgba(0, 163, 224, 0.25)', 
                    borderRadius: '10px', 
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {/* Faixa superior de destaque */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: course.color }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <h4 style={{ fontSize: '1.02rem', fontWeight: '800', color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                        {course.name}
                      </h4>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: '800', 
                        background: `${course.color}25`, 
                        color: course.color === '#059669' ? '#34D399' : course.color === '#D97706' ? '#FBBF24' : '#38BDF8',
                        border: `1px solid ${course.color}60`,
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {course.workload}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '0.84rem', 
                      color: '#CBD5E1', 
                      lineHeight: 1.55, 
                      marginBottom: '1rem',
                      background: 'rgba(0, 20, 40, 0.35)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <strong style={{ color: '#00C7FD', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                        O que irá aprender:
                      </strong>
                      {course.fullDescription}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.84rem', 
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
                      paddingTop: '0.75rem', 
                      marginBottom: '0.85rem',
                      color: '#E2E8F0' 
                    }}>
                      <span>Duração: <strong style={{ color: '#FFFFFF' }}>{course.duration}</strong></span>
                      <span style={{ fontSize: '1.05rem', color: '#10B981', fontWeight: '800' }}>
                        {course.price}
                      </span>
                    </div>

                    <Link
                      to={`/inscricao?curso=${encodeURIComponent(course.name)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(0, 163, 224, 0.15)',
                        border: '1px solid rgba(0, 163, 224, 0.4)',
                        color: '#00C7FD',
                        fontSize: '0.84rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>Candidatar-se a Este Curso</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Requisitos de Acesso & Documentação */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} color="#00C7FD" />
              2. Requisitos de Acesso e Documentos Necessários
            </h3>
            <div style={{ background: 'rgba(0, 42, 78, 0.3)', border: '1px solid rgba(0, 163, 224, 0.2)', borderRadius: '8px', padding: '1.25rem' }}>
              {requirementsList.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {requirementsList.map((req, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: '#E2E8F0' }}>
                      <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                  Consulte os requisitos específicos no ato da inscrição.
                </p>
              )}
            </div>
          </div>

          {/* Seção 3: Procedimento de Candidatura (Passo a Passo) */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#00C7FD" />
              3. Procedimentos de Inscrição e Validação
            </h3>
            <div className="procedures-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {proceduresList.map((step, idx) => {
                const cleanStep = step.replace(/^\d+[\.\-\)]\s*/, '');
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'rgba(0, 42, 78, 0.35)', 
                      border: '1px solid rgba(0, 163, 224, 0.22)', 
                      borderRadius: '10px', 
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #0072B5, #00C7FD)', 
                      color: '#fff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '800',
                      fontSize: '1rem',
                      flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(0, 199, 253, 0.35)'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.88rem', color: '#E2E8F0', margin: 0, lineHeight: 1.55 }}>
                        {cleanStep}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 4: Turnos, Horários & Condições Gerais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'rgba(0, 42, 78, 0.3)', border: '1px solid rgba(0, 163, 224, 0.2)', borderRadius: '8px', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="#00C7FD" />
                Turnos e Horários de Aulas
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                {academic.enrollment_schedule_info || 'Manhã (08h-11h) | Tarde (14h-17h) | Noite (17h30-20h) | Sábados Intensivos'}
              </p>
            </div>

            <div style={{ background: 'rgba(0, 42, 78, 0.3)', border: '1px solid rgba(0, 163, 224, 0.2)', borderRadius: '8px', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#00C7FD" />
                Condições Gerais e Vagas
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {conditionsList.map((cond, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '0.4rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ color: '#00C7FD' }}>•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bloco de Chamada para Ação (CTA) com Acesso Duplo ao Folheto e à Inscrição */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 114, 181, 0.3) 0%, rgba(0, 199, 253, 0.2) 100%)', 
            border: '2px solid #00C7FD', 
            borderRadius: '12px', 
            padding: '2.25rem', 
            textAlign: 'center',
            marginBottom: '2.5rem',
            boxShadow: '0 10px 30px rgba(0, 199, 253, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Garanta a Sua Vaga na Zaty Academy
            </h3>
            <p style={{ color: '#E2E8F0', fontSize: '0.92rem', maxWidth: '640px', margin: '0 auto 1.5rem auto' }}>
              As vagas são estritamente limitadas por turma para garantir excelência formativa e 1 computador por formando. Submeta a sua candidatura oficial agora mesmo.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/inscricao"
                className="btn btn-primary"
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: '800', 
                  padding: '0.85rem 2.25rem', 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  borderRadius: '8px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.2s'
                }}
              >
                <span>REALIZAR INSCRIÇÃO ONLINE</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Rodapé Oficial e Assinaturas */}
          <div style={{ 
            borderTop: '1px solid rgba(0, 163, 224, 0.25)', 
            paddingTop: '1.75rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            flexWrap: 'wrap', 
            gap: '1.5rem',
            fontSize: '0.82rem',
            color: '#94A3B8'
          }}>
            <div>
              <div style={{ fontWeight: '700', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                {inst.name || 'ZATY ACADEMY'} — Direcção Académica
              </div>
              <div>{inst.director_name || 'Direcção Geral Zaty Academy'}</div>
              <div>{inst.director_role || 'Diretor Geral'}</div>
            </div>

            <div className="footer-valid-date-info" style={{ textAlign: 'right' }}>
              <div>Nampula, {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div style={{ color: '#00C7FD', fontWeight: '600', marginTop: '0.2rem' }}>
                Documento Institucional Válido
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

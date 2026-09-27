import React, { useState, useEffect, useMemo } from 'react';
import { OFFICIAL_ENROLLMENT_COURSES } from '../../constants/enrollmentCourses';
import { getFlyerModel } from '../../constants/flyerTemplates';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { generateQrCodeDataUrl } from '../../services/qrCodeService';

/**
 * Exemplar Oficial do Folheto A5 da ZATY ACADEMY
 * Dimensões calibradas: 140mm x 198mm (proporção A5 exata com margens seguras para impressão 2x por folha A4)
 * 
 * Suporta 6 modelos com estruturas de layout e composições visuais claramente distintas:
 * 1. 'enrollment' - Inscrições Abertas (Admissões, fotos lab, grelha 2x2, turnos e QR code)
 * 2. 'courses'    - Divulgação de Cursos (Faixas horizontais completas com ementa de módulos e competências)
 * 3. 'workshop'   - Workshops & Bootcamps (Imersão intensiva de fim-de-semana, estética dark tech, 3 módulos focados)
 * 4. 'campaign'   - Campanhas & Descontos (Oferta comercial, selos circulares de desconto, pacotes promocionais)
 * 5. 'event'      - Eventos & Seminários (Jornada tecnológica, portas abertas com cronograma e credenciamento)
 * 6. 'notice'     - Comunicado Oficial (Formato de Despacho Administrativo formal com artigos numerados e assinaturas)
 */
export default function A5Flyer({
  instanceKey = 'a5-flyer',
  template: propModel,
  purpose: legacyPurpose,
  inst = {},
  academic = {},
  officialFlyerImage = '/flyer/student-computer-1.jpg',
  qrCodeUrl: propQrCodeUrl = '',
  customData = null
}) {
  // Resolução do modelo: aceita o prop novo ou legado
  const activeModelId = propModel || academic.flyer_template || legacyPurpose || academic.flyer_purpose || 'enrollment';
  const modelConfig = getFlyerModel(activeModelId);

  const flyerTitle = customData?.title || academic.enrollment_title || modelConfig.defaultTitle;
  const flyerPeriod = customData?.period || academic.enrollment_period || modelConfig.defaultTag;
  const flyerBadge = customData?.badge || academic.flyer_badge || modelConfig.defaultBadge;
  const flyerCourses = customData?.courses || OFFICIAL_ENROLLMENT_COURSES;
  const flyerPhone = customData?.phone || inst.phone || '+258 834 847 306';
  const flyerAddress = customData?.address || inst.address || 'Namicopo - Nampula (Próx. 3ª Esquadra)';
  const flyerEmail = customData?.email || inst.email || 'contacto@zatyacademy.co.mz';
  const flyerHeroImg = customData?.heroImage || officialFlyerImage || '/flyer/student-computer-1.jpg';
  const portalHost = typeof window !== 'undefined' ? window.location.host : 'zatyacademy.co.mz';

  // URL de destino real do sistema para o QR Code (dinâmica com base no modelo ou configuração)
  const resolvedTargetUrl = useMemo(() => {
    if (customData?.targetUrl) return customData.targetUrl;
    if (academic?.flyer_target_url) return academic.flyer_target_url;

    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseOrigin = isLocal
      ? (inst?.website || 'https://zatyacademy.co.mz')
      : (typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz');

    const cleanOrigin = baseOrigin.replace(/\/+$/, '');

    switch (activeModelId) {
      case 'courses':
        return `${cleanOrigin}/cursos`;
      case 'workshop':
        return `${cleanOrigin}/workshops`;
      case 'campaign':
        return `${cleanOrigin}/desconto`;
      case 'notice':
        return `${cleanOrigin}/validar`;
      case 'event':
      case 'enrollment':
      case 'classic':
      default:
        return `${cleanOrigin}/inscricao`;
    }
  }, [customData?.targetUrl, academic?.flyer_target_url, inst?.website, activeModelId]);

  // Texto legível da URL para exibição nos rodapés
  const resolvedDisplayUrl = useMemo(() => {
    return resolvedTargetUrl.replace(/^https?:\/\//i, '');
  }, [resolvedTargetUrl]);

  // Gerador dinâmico de QR Code nativo do sistema
  const [internalQrCode, setInternalQrCode] = useState(propQrCodeUrl || '');

  useEffect(() => {
    let isMounted = true;
    if (propQrCodeUrl) {
      setInternalQrCode(propQrCodeUrl);
      return;
    }

    async function generateDynamicQr() {
      try {
        const qrData = await generateQrCodeDataUrl(resolvedTargetUrl, {
          width: 300,
          margin: 1,
          color: { dark: '#002B49', light: '#FFFFFF' }
        });
        if (isMounted && qrData) {
          setInternalQrCode(qrData);
        }
      } catch (e) {
        console.warn('Aviso: falha ao gerar QR code dinâmico no A5Flyer:', e);
      }
    }

    generateDynamicQr();
    return () => { isMounted = false; };
  }, [propQrCodeUrl, resolvedTargetUrl]);

  const activeQrCode = propQrCodeUrl || internalQrCode;

  // =========================================================================
  // MODELO 1: INSCRIÇÕES ABERTAS (Fiel à Imagem de Referência Oficial)
  // Estrutura: Topo Institucional + Faixa Edital + Hero com Polaroids +
  // Cursos em Grelha 2x2 com Ícones Circulares + Barra Turnos/Requisitos +
  // Colagem Inferior de Estudantes (Aprende Hoje/Constrói Futuro/Transforma) +
  // Rodapé CTA Escuro + Sub-rodapé Institucional
  // =========================================================================
  if (activeModelId === 'enrollment' || activeModelId === 'classic') {
    return (
      <div 
        key={instanceKey}
        className="a5-flyer-instance flyer-model-enrollment"
        style={{
          width: '140mm',
          height: '198mm',
          boxSizing: 'border-box',
          padding: '2.8mm 3.6mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          color: '#0F172A',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Topo / Cabeçalho e Conteúdo Principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* 1. Header Oficial: Logo + Nome + Contactos */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: '0.8mm', marginBottom: '0.8mm'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                <img src={inst.logo_url || '/logo.png'} alt="Logo" crossOrigin="anonymous" style={{ height: '11mm', width: 'auto', objectFit: 'contain' }} />
                <div style={{ borderLeft: '1.4px solid #002B49', paddingLeft: '2mm' }}>
                  <div style={{ fontSize: '11.8pt', fontWeight: '900', color: '#002B49', letterSpacing: '0.02em', lineHeight: 1 }}>
                    {inst.name || 'ZATY ACADEMY'}
                  </div>
                  <div style={{ fontSize: '5.2pt', color: '#0066B2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '0.3mm' }}>
                    CENTRO DE FORMAÇÃO EM INFORMÁTICA & TECNOLOGIA
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5mm', fontSize: '5.1pt', color: '#002B49', fontWeight: '700' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2mm' }}>
                  <div style={{ width: '3.4mm', height: '3.4mm', borderRadius: '50%', background: '#0066B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                    <svg width="6.5" height="6.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
                  </div>
                  <span>Tel/WhatsApp: {flyerPhone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2mm' }}>
                  <div style={{ width: '3.4mm', height: '3.4mm', borderRadius: '50%', background: '#0066B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                    <svg width="6.5" height="6.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                  </div>
                  <span>{flyerAddress}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2mm' }}>
                  <div style={{ width: '3.4mm', height: '3.4mm', borderRadius: '50%', background: '#0066B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                    <svg width="6.5" height="6.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <span>{flyerEmail}</span>
                </div>
              </div>
            </div>

            {/* 2. Faixa do Edital Oficial */}
            <div style={{
              background: 'linear-gradient(90deg, #003B6F 0%, #00508F 50%, #002B49 100%)',
              color: '#FFFFFF', padding: '1.2mm 2mm', borderRadius: '3px', textAlign: 'center', marginBottom: '1mm',
              position: 'relative', borderTop: '1.2px solid #00C7FD'
            }}>
              <div style={{ fontSize: '10.2pt', fontWeight: '900', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {flyerTitle || 'EDITAL OFICIAL DE INSCRIÇÕES & MATRÍCULAS'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2mm', marginTop: '0.4mm' }}>
                <span style={{
                  background: '#FACC15', color: '#002B49', fontWeight: '900', fontSize: '5.4pt', padding: '0.3mm 2mm', borderRadius: '999px', letterSpacing: '0.02em'
                }}>
                  PERÍODO: {flyerPeriod || 'Ano Letivo 2026 • Inscrições Abertas'}
                </span>
                <span style={{
                  background: '#DC2626', color: '#FFFFFF', fontWeight: '900', fontSize: '5.4pt', padding: '0.3mm 2mm', borderRadius: '999px', letterSpacing: '0.02em'
                }}>
                  {flyerBadge || 'VAGAS LIMITADAS'}
                </span>
              </div>
            </div>

            {/* 3. Hero Fotográfico com Polaroids & Destaques com as Imagens Reais do Sistema */}
            <div 
              className="flyer-hero-container"
              style={{
                position: 'relative',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '1mm',
                height: '40.5mm',
                minHeight: '40.5mm',
                maxHeight: '40.5mm',
                background: '#041628',
                border: '1px solid #0072B5',
                boxSizing: 'border-box'
              }}
            >
              {/* Imagem Principal do Folheto (Enquadramento Proporcional e Sem Super Zoom) */}
              <img 
                src={flyerHeroImg || DEFAULT_IT_STUDY_IMAGES[0]} 
                alt="Fotografia Principal Zaty Academy" 
                crossOrigin="anonymous" 
                className="flyer-hero-bg-img flyer-cover-image"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 35%',
                  display: 'block'
                }} 
              />
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, rgba(0, 43, 73, 0.45) 0%, rgba(0, 43, 73, 0.08) 45%, rgba(0, 43, 73, 0.7) 100%)',
                pointerEvents: 'none'
              }} />

              {/* Badge Superior Esquerdo: Formação Profissional Certificada */}
              <div style={{
                position: 'absolute',
                top: '2mm',
                left: '2.5mm',
                background: 'rgba(0, 43, 73, 0.92)',
                border: '1px solid rgba(0, 199, 253, 0.75)',
                color: '#FFFFFF',
                padding: '0.4mm 2mm',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1mm',
                fontSize: '5.2pt',
                fontWeight: '800',
                zIndex: 3,
                boxShadow: '0 2px 5px rgba(0,0,0,0.35)'
              }}>
                <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                </svg>
                <span>Formação Profissional Certificada</span>
              </div>

              {/* Polaroid 1: PRÁTICA Real com a foto oficial do sistema student-computer-2.jpg */}
              <div style={{
                position: 'absolute',
                left: '4mm',
                bottom: '2.5mm',
                background: '#FFFFFF',
                padding: '1mm 1mm 2.8mm 1mm',
                borderRadius: '3px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
                transform: 'rotate(-4deg)',
                zIndex: 1,
                width: '27mm',
                boxSizing: 'border-box'
              }}>
                <div style={{ position: 'relative', width: '100%', height: '20mm', overflow: 'hidden', borderRadius: '2px', background: '#002B49' }}>
                  <img 
                    src="/flyer/student-computer-2.jpg" 
                    alt="PRÁTICA Real" 
                    crossOrigin="anonymous" 
                    className="flyer-cover-image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} 
                    onError={(e) => { e.currentTarget.src = '/flyer/student-computer-1.jpg'; }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(90deg, #0284C7 0%, #0369A1 100%)',
                    color: '#FFFFFF',
                    fontSize: '5.2pt',
                    fontWeight: '900',
                    padding: '0.4mm 0',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.3)'
                  }}>
                    <span>PRÁTICA </span>
                    <span style={{ color: '#FACC15', fontStyle: 'italic', fontWeight: '900' }}>Real</span>
                  </div>
                </div>
              </div>

              {/* Polaroid 2: Apoio Direto com a foto oficial do sistema student-computer-3.jpg */}
              <div style={{
                position: 'absolute',
                left: '29mm',
                bottom: '2.2mm',
                background: '#FFFFFF',
                padding: '1mm 1mm 2.8mm 1mm',
                borderRadius: '3px',
                boxShadow: '0 6px 14px rgba(0, 0, 0, 0.5)',
                transform: 'rotate(2.5deg)',
                zIndex: 2,
                width: '28mm',
                boxSizing: 'border-box'
              }}>
                <div style={{ position: 'relative', width: '100%', height: '21mm', overflow: 'hidden', borderRadius: '2px', background: '#002B49' }}>
                  <img 
                    src="/flyer/student-computer-3.jpg" 
                    alt="Apoio Direto" 
                    crossOrigin="anonymous" 
                    className="flyer-cover-image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} 
                    onError={(e) => { e.currentTarget.src = '/flyer/student-computer-1.jpg'; }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: '#FACC15',
                    color: '#002B49',
                    fontSize: '5.4pt',
                    fontWeight: '900',
                    padding: '0.4mm 0',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.2)'
                  }}>
                    Apoio Direto
                  </div>
                </div>
              </div>

              {/* Badge Inferior Direito: Aulas 100% Práticas + 1 Computador por Formando */}
              <div style={{
                position: 'absolute',
                bottom: '2.5mm',
                right: '2.5mm',
                background: 'rgba(0, 43, 73, 0.95)',
                border: '1.2px solid #00C7FD',
                borderRadius: '3.5px',
                padding: '1mm 2.2mm',
                display: 'flex',
                alignItems: 'center',
                gap: '1.6mm',
                zIndex: 3,
                boxShadow: '0 3px 8px rgba(0,0,0,0.45)'
              }}>
                <div style={{ color: '#00C7FD', display: 'flex', alignItems: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: '6.4pt', fontWeight: '900', color: '#FACC15', letterSpacing: '0.02em' }}>
                    AULAS 100% PRÁTICAS
                  </div>
                  <div style={{ fontSize: '5.1pt', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    1 COMPUTADOR POR FORMANDO
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Cabeçalho da Seção de Cursos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8mm' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.4mm' }}>
                <div style={{ width: '4mm', height: '4mm', background: '#0284C7', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <svg width="8.5" height="8.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <div style={{ fontSize: '7.2pt', fontWeight: '900', color: '#002B49', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  CURSOS DISPONÍVEIS <span style={{ fontWeight: '700', color: '#334155' }}>(LABORAL & PÓS-LABORAL)</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1mm', background: '#FACC15', color: '#002B49', fontWeight: '900', fontSize: '5.2pt', padding: '0.3mm 2mm', borderRadius: '999px' }}>
                <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <span>CERTIFICADO RECONHECIDO</span>
              </div>
            </div>

            {/* 5. Grelha 2x2 dos Cursos com Ícones Circulares Temáticos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2mm', marginBottom: '1mm' }}>
              {flyerCourses.slice(0, 4).map((c, idx) => {
                const colors = ['#0284C7', '#EA580C', '#10B981', '#8B5CF6'];
                const cardColor = c.color || colors[idx % 4];
                
                const getCourseIcon = (id, i) => {
                  if (id?.includes('info') || i === 0) {
                    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
                  }
                  if (id?.includes('design') || i === 1) {
                    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z"/></svg>;
                  }
                  if (id?.includes('rede') || i === 2) {
                    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>;
                  }
                  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
                };

                return (
                  <div 
                    key={c.id || idx}
                    style={{
                      background: '#FFFFFF',
                      border: `1.2px solid ${cardColor}`,
                      borderRadius: '3.5px',
                      padding: '1.2mm 1.6mm',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '14.5mm'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1mm' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2mm' }}>
                          <div style={{ width: '4.2mm', height: '4.2mm', borderRadius: '50%', background: cardColor, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getCourseIcon(c.id, idx)}
                          </div>
                          <div style={{ fontSize: '6.6pt', fontWeight: '900', color: '#002B49', lineHeight: 1.15 }}>
                            {c.name}
                          </div>
                        </div>
                        <div style={{ background: cardColor, color: '#FFFFFF', fontSize: '4.8pt', fontWeight: '900', padding: '0.25mm 1.4mm', borderRadius: '2px', flexShrink: 0 }}>
                          {c.workload || (idx % 2 === 0 ? 'Edit' : '6m')}
                        </div>
                      </div>
                      <div style={{ fontSize: '5.2pt', color: '#475569', lineHeight: 1.25, marginTop: '0.4mm' }}>
                        {c.flyerDescription}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5mm', paddingTop: '0.3mm' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8mm', fontSize: '5.4pt', color: '#475569', fontWeight: '700' }}>
                        <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{c.duration}</span>
                      </div>
                      <div style={{ background: cardColor, color: '#FFFFFF', fontWeight: '900', fontSize: '6.6pt', padding: '0.3mm 1.8mm', borderRadius: '2.5px' }}>
                        {c.price}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 6. Barra de Turnos e Requisitos */}
            <div style={{
              background: '#FFFFFF',
              border: '1.2px solid #14B8A6',
              borderRadius: '3px',
              padding: '1mm 1.8mm',
              display: 'grid',
              gridTemplateColumns: '1.18fr 0.82fr',
              gap: '1.6mm',
              marginBottom: '1mm',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.4mm' }}>
                <div style={{ width: '4mm', height: '4mm', borderRadius: '2px', background: '#0D9488', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ fontSize: '5.1pt', lineHeight: 1.25 }}>
                  <div style={{ color: '#002B49', fontWeight: '800' }}>
                    <strong>Turnos:</strong> Manhã (08h - 11h) | Tarde (14h - 17h) | Noite (17h30 - 20h) | Sábados
                  </div>
                  <div style={{ color: '#059669', fontWeight: '800', marginTop: '0.2mm' }}>
                    ✓ 1 PC por Aluno &nbsp; ✓ Formadores Qualificados &nbsp; ✓ Estágios
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #99F6E4', paddingLeft: '1.6mm', display: 'flex', alignItems: 'center', gap: '1.4mm' }}>
                <div style={{ width: '4mm', height: '4mm', borderRadius: '2px', background: '#0D9488', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div style={{ fontSize: '5.1pt', color: '#002B49', fontWeight: '700', lineHeight: 1.25 }}>
                  <strong>Requisitos:</strong> Cópia de BI/Passaporte &bull; 1 Foto tipo passe
                </div>
              </div>
            </div>

            {/* 7. Colagem Inferior de Estudantes (Polaroids Dinâmicas) */}
            <div 
              className="flyer-hero-container"
              style={{
                position: 'relative', borderRadius: '3px', overflow: 'hidden', marginBottom: '1mm',
                height: '41.5mm', minHeight: '41.5mm', maxHeight: '41.5mm', background: '#0072B5', border: '1px solid #0284C7', boxShadow: '0 2px 6px rgba(0, 43, 73, 0.15)'
              }}
            >
              <img 
                src="/flyer/flyer-student-collage.jpg" 
                alt="Estudantes Zaty Academy" 
                crossOrigin="anonymous" 
                className="flyer-cover-image"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }} 
              />
            </div>
          </div>
        </div>

        {/* 8. Rodapé Oficial Escuro e Seguro */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            background: '#002B49', border: '1.2px solid #00C7FD', borderRadius: '3px',
            padding: '1.5mm 2.2mm', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2mm', marginBottom: '0.6mm'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.6mm', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {activeQrCode ? (
                <img src={activeQrCode} alt="QR Code Oficial de Inscrição" crossOrigin="anonymous" style={{ width: '14.5mm', height: '14.5mm', display: 'block' }} />
              ) : (
                <div style={{ width: '14.5mm', height: '14.5mm', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#002B49' }}>QR</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div 
                className="btn-inscricao-online"
                data-badge="inscricao"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.2mm',
                  background: '#FACC15',
                  backgroundColor: '#FACC15',
                  color: '#002B49',
                  padding: '0.4mm 2.2mm',
                  borderRadius: '2.5px',
                  marginBottom: '0.5mm',
                  lineHeight: 1,
                  boxSizing: 'border-box',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#002B49" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </span>
                <span style={{
                  color: '#002B49',
                  fontWeight: 900,
                  fontSize: '6.6pt',
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                  lineHeight: 1,
                  display: 'inline-block',
                  letterSpacing: '0.015em'
                }}>
                  INSCRIÇÃO ONLINE DISPONÍVEL
                </span>
              </div>
              <div style={{ fontSize: '5.4pt', color: '#E0F2FE' }}>Aponte a câmara do QR Code ou aceda ao portal:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1mm', marginTop: '0.2mm' }}>
                <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span style={{ fontSize: '7.2pt', color: '#38BDF8', fontWeight: '900' }}>{resolvedDisplayUrl}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '5.2pt', color: '#E2E8F0', flexShrink: 0, borderLeft: '0.8px solid rgba(255, 255, 255, 0.25)', paddingLeft: '2mm' }}>
              <div style={{ fontSize: '4.8pt', color: '#BAE6FD', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.04em' }}>LINHA DIRECTA:</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.2mm', marginTop: '0.3mm' }}>
                <div style={{ width: '3.8mm', height: '3.8mm', borderRadius: '50%', background: '#22C55E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.96 11.96 0 0 0 5.85 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.43zM12.06 21.88h-.01c-1.79 0-3.55-.48-5.08-1.39l-.36-.22-3.77.99 1.01-3.68-.24-.38a9.92 9.92 0 0 1-1.53-5.23c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.92a9.93 9.93 0 0 1 2.92 7.04c0 5.49-4.47 9.96-9.95 9.96zm5.46-7.46c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.52-.08-.15-.68-1.63-.92-2.24-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.8.38-.28.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z"/></svg>
                </div>
                <div style={{ fontSize: '8pt', fontWeight: '900', color: '#FDE047', letterSpacing: '0.02em' }}>{flyerPhone}</div>
              </div>
              <div style={{ fontSize: '5.1pt', color: '#BAE6FD', marginTop: '0.2mm' }}>Nampula &bull; Moçambique</div>
            </div>
          </div>

          {/* 9. Sub-rodapé Institucional */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '5.4pt', padding: '0.2mm 0.8mm' }}>
            <div style={{ fontWeight: '800', color: '#002B49' }}>
              {inst.name || 'ZATY ACADEMY'} - Secretaria Académica Oficial
            </div>
            <div style={{ fontStyle: 'italic', color: '#334155' }}>
              Excelência e Inovação no Ensino de Tecnologia
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODELO 2: DIVULGAÇÃO DE CURSOS (Catálogo em Faixas Horizontais com Ementas)
  // =========================================================================
  if (activeModelId === 'courses') {
    return (
      <div 
        key={instanceKey}
        className="a5-flyer-instance flyer-model-courses"
        style={{
          width: '140mm',
          height: '198mm',
          boxSizing: 'border-box',
          padding: '3.6mm 4.6mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          color: '#0F172A',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '1.8mm', left: '1.8mm', right: '1.8mm', bottom: '1.8mm', border: '1.2px solid #0284C7', borderRadius: '3px', pointerEvents: 'none' }} />

        {/* Topo / Cabeçalho e Conteúdo do Catálogo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1.6px solid #0284C7', paddingBottom: '1.4mm', marginBottom: '1.4mm'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
                <img src={inst.logo_url || '/logo.png'} alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '10.5mm', maxWidth: '28mm', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#002B49', lineHeight: 1.05 }}>
                    {inst.name || 'ZATY ACADEMY'}
                  </div>
                  <div style={{ fontSize: '6.2pt', color: '#0284C7', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    CATÁLOGO OFICIAL DE FORMAÇÕES PROFISSIONAIS
                  </div>
                </div>
              </div>
              <div style={{ background: '#0284C7', color: '#FFFFFF', padding: '1mm 2.4mm', borderRadius: '2px', textAlign: 'right' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: '900' }}>ANO FORMATIVO 2026</div>
                <div style={{ fontSize: '5.2pt', color: '#BAE6FD' }}>CURRÍCULO 100% PRÁTICO</div>
              </div>
            </div>

            {/* Hero Dividido: Foto + Apresentação do Método */}
            <div style={{
              display: 'grid', gridTemplateColumns: '48mm 1fr', gap: '2.2mm', marginBottom: '1.8mm',
              background: '#FFFFFF', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '3px', padding: '1.6mm'
            }}>
              <div 
                className="flyer-hero-container"
                style={{ height: '22mm', minHeight: '22mm', maxHeight: '22mm', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}
              >
                <img 
                  src={flyerHeroImg} 
                  alt="Estudantes" 
                  crossOrigin="anonymous" 
                  className="flyer-hero-bg-img flyer-cover-image"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block'
                  }} 
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0, 43, 73, 0.9)', color: '#38BDF8', fontSize: '4.8pt', fontWeight: '800', textAlign: 'center', padding: '0.4mm 0', zIndex: 2 }}>
                  Laboratórios Equipados
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '8.4pt', fontWeight: '900', color: '#002B49', lineHeight: 1.15 }}>
                  Domine as Ferramentas Mais Exigidas pelo Mercado
                </div>
                <div style={{ fontSize: '6pt', color: '#475569', marginTop: '0.4mm', lineHeight: 1.3 }}>
                  Metodologia orientada a projetos reais com 1 computador por formando, mentoria de formadores experientes e certificação reconhecida.
                </div>
                <div style={{ display: 'flex', gap: '1.6mm', marginTop: '0.8mm' }}>
                  <span style={{ fontSize: '5.4pt', background: '#E0F2FE', color: '#0369A1', padding: '0.3mm 1.4mm', borderRadius: '2px', fontWeight: '800' }}>✓ 1 PC / ALUNO</span>
                  <span style={{ fontSize: '5.4pt', background: '#DCFCE7', color: '#15803D', padding: '0.3mm 1.4mm', borderRadius: '2px', fontWeight: '800' }}>✓ ESTÁGIOS RECOMENDADOS</span>
                </div>
              </div>
            </div>

            {/* 4 Faixas Horizontais Completas de Cursos - Design moderno, sem fundo cinza e com fontes aumentadas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6mm', marginBottom: '1.8mm' }}>
              {[
                {
                  id: 'inf',
                  name: 'Informática na Óptica do Utilizador',
                  workload: '120 Horas • 3 Meses',
                  price: '1.800 MT/Mês',
                  color: '#0072B5',
                  modules: 'Windows 11, MS Word, Excel, PowerPoint, Publisher, Internet & Técnicas de Digitação Profissional.',
                  highlight: 'Essencial para Escritórios e Empresas'
                },
                {
                  id: 'des',
                  name: 'Design Gráfico & Comunicação Visual',
                  workload: '120 Horas • 3 Meses',
                  price: '2.500 MT/Mês',
                  color: '#EA580C',
                  modules: 'Adobe Photoshop, Illustrator, InDesign, Identidade Visual, Vetorização, Banners & Fecho de Ficheiros.',
                  highlight: 'Publicidade, Agências e Freelance'
                },
                {
                  id: 'red',
                  name: 'Redes de Computadores & Hardware',
                  workload: '120 Horas • 3 Meses',
                  price: '2.200 MT/Mês',
                  color: '#059669',
                  modules: 'Montagem de PCs, Manutenção Preventiva, Cabeamento Estruturado, Roteadores Wi-Fi, Switches & Suporte TI.',
                  highlight: 'Técnico de Infraestrutura e Reparação'
                },
                {
                  id: 'web',
                  name: 'Desenvolvimento Web & Programação',
                  workload: '120 Horas • 3 Meses',
                  price: '2.800 MT/Mês',
                  color: '#7C3AED',
                  modules: 'HTML5 Semântico, CSS3 Flexbox/Grid, JavaScript Interativo, Consumo de APIs, Git/GitHub & Hospedagem Nuvem.',
                  highlight: 'Criação de Websites e Sistemas Web'
                }
              ].map(item => (
                <div 
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(2, 132, 199, 0.22)',
                    borderLeft: `3.8mm solid ${item.color}`,
                    borderRadius: '2.5px',
                    padding: '1.8mm 2.4mm',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '2.2mm'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                      <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#0F172A' }}>{item.name}</div>
                      <span style={{ fontSize: '5.4pt', background: '#F0F9FF', color: item.color, border: `0.5px solid ${item.color}`, padding: '0.2mm 1.4mm', borderRadius: '2px', fontWeight: '800' }}>
                        {item.highlight}
                      </span>
                    </div>
                    <div style={{ fontSize: '6.2pt', color: '#334155', marginTop: '0.3mm', lineHeight: 1.25 }}>
                      <strong style={{ color: '#0F172A' }}>Ementa:</strong> {item.modules}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, borderLeft: '0.8px dashed rgba(2, 132, 199, 0.3)', paddingLeft: '2.4mm' }}>
                    <div style={{ fontSize: '5.8pt', fontWeight: '700', color: '#64748B' }}>{item.workload}</div>
                    <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#002B49', marginTop: '0.2mm' }}>{item.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Faixa de Benefícios Exclusivos */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '2.5px',
              padding: '1.4mm 2.2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6pt', color: '#0369A1'
            }}>
              <div><strong>Horários:</strong> Manhã (08h-11h) | Tarde (14h-17h) | Noite (17h30-20h) | Sábados (08h-13h)</div>
              <div><strong>Incluso:</strong> Certificado Registado &bull; Apostilas &bull; Laboratório</div>
            </div>
          </div>
        </div>

        {/* Rodapé e Link de Inscrição Snug (Com flexShrink: 0 e integração perfeita) */}
        <div style={{ flexShrink: 0, marginTop: '1.4mm' }}>
          <div style={{
            background: '#002B49', border: '1.2px solid #0284C7', borderRadius: '3px', padding: '1.8mm 2.4mm',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2.4mm', marginBottom: '1.2mm'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.7mm', borderRadius: '2px', flexShrink: 0 }}>
              {activeQrCode ? <img src={activeQrCode} alt="QR Code Oficial" crossOrigin="anonymous" style={{ width: '15mm', height: '15mm', display: 'block' }} /> : <div style={{ width: '15mm', height: '15mm', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#002B49' }}>QR</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '6.8pt', fontWeight: '900', color: '#38BDF8', letterSpacing: '0.04em' }}>
                CONSULTE O PLANO CURRICULAR DETALHADO:
              </div>
              <div style={{ fontSize: '5.8pt', color: '#BAE6FD', marginTop: '0.2mm' }}>
                Faça o download do conteúdo programático ou inscreva-se online:
              </div>
              <div style={{ fontSize: '7.5pt', color: '#FDE047', fontWeight: '900', marginTop: '0.2mm' }}>
                {resolvedDisplayUrl}
              </div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '0.8px solid rgba(255, 255, 255, 0.25)', paddingLeft: '2mm', fontSize: '5.8pt', color: '#E2E8F0' }}>
              <div style={{ color: '#94A3B8' }}>Secretaria Académica:</div>
              <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#34D399' }}>{flyerPhone}</div>
              <div style={{ color: '#CBD5E1' }}>{flyerAddress}</div>
            </div>
          </div>
          <div style={{ borderTop: '0.8px solid #CBD5E1', paddingTop: '1mm', display: 'flex', justifyContent: 'space-between', fontSize: '6.2pt', color: '#475569' }}>
            <div><strong style={{ color: '#002B49' }}>{inst.name || 'ZATY ACADEMY'}</strong> &bull; Centro de Formação em Informática e Tecnologia</div>
            <div style={{ color: '#0284C7', fontWeight: '700' }}>{flyerEmail}</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODELO 3: WORKSHOPS & BOOTCAMPS (Imersão Intensiva, Estética Dark Tech)
  // =========================================================================
  if (activeModelId === 'workshop') {
    return (
      <div 
        key={instanceKey}
        className="a5-flyer-instance flyer-model-workshop"
        style={{
          width: '140mm',
          height: '198mm',
          boxSizing: 'border-box',
          padding: '3.6mm 4.6mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#030D1A',
          color: '#F8FAFC',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '1.8mm', left: '1.8mm', right: '1.8mm', bottom: '1.8mm', border: '1.2px solid #00C7FD', borderRadius: '3px', boxShadow: '0 0 10px rgba(0, 199, 253, 0.2)', pointerEvents: 'none' }} />

        {/* Topo e Conteúdo Dark Tech */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1.4px solid rgba(0, 199, 253, 0.4)', paddingBottom: '1.4mm', marginBottom: '1.4mm'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
                <div style={{ background: '#FFFFFF', padding: '0.8mm', borderRadius: '2px' }}>
                  <img src={inst.logo_url || '/logo.png'} alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '10.5mm', maxWidth: '28mm', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    {inst.name || 'ZATY ACADEMY'}
                  </div>
                  <div style={{ fontSize: '6.2pt', color: '#00C7FD', fontWeight: '900', letterSpacing: '0.08em' }}>
                    // TECH BOOTCAMP // MASTERCLASS INTENSIVA
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(0, 199, 253, 0.15)', border: '1px solid #00C7FD', padding: '1mm 2.4mm', borderRadius: '2px', textAlign: 'right' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: '900', color: '#00E5FF' }}>VAGAS: MÁXIMO 15</div>
                <div style={{ fontSize: '5.2pt', color: '#CBD5E1' }}>100% PRÁTICO NO LAB</div>
              </div>
            </div>

            {/* Banner de Destaque da Imersão */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 43, 73, 0.95) 0%, rgba(0, 114, 181, 0.8) 100%)',
              border: '1.2px solid #00C7FD', borderRadius: '3px', padding: '2.2mm 2.8mm', textAlign: 'center', marginBottom: '1.8mm',
              boxShadow: '0 0 12px rgba(0, 199, 253, 0.25)'
            }}>
              <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#FFFFFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {flyerTitle}
              </div>
              <div style={{ fontSize: '6.4pt', fontWeight: '800', color: '#FDE047', marginTop: '0.4mm', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2mm' }}>
                <span>FINS-DE-SEMANA (SÁBADO & DOMINGO)</span>
                <span>&bull;</span>
                <span style={{ background: '#DC2626', color: '#FFFFFF', padding: '0.3mm 1.8mm', borderRadius: '2px', fontSize: '5.6pt', fontWeight: '900' }}>
                  CERTIFICADO EMITIDO NO MESMO DIA
                </span>
              </div>
            </div>

            {/* Os 3 Workshops de Alta Intensidade em Cartões Tecnológicos Amplos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm', marginBottom: '1.8mm' }}>
              {[
                {
                  id: 'ws1',
                  title: 'Workshop 1: Master em Excel & Dashboard Financeiro',
                  duration: '16 Horas • 2 Fins-de-Semana',
                  price: '1.500 MT',
                  color: '#10B981',
                  badge: 'Gestão & Negócios',
                  content: 'Fórmulas complexas (XLOOKUP, INDEX/MATCH), Tabelas Dinâmicas, Automação de Tarefas, Design de Dashboards Executivos e Relatórios para tomada de decisões.'
                },
                {
                  id: 'ws2',
                  title: 'Workshop 2: Bootcamp Design de Marcas & Social Media',
                  duration: '20 Horas • 2 Fins-de-Semana',
                  price: '1.800 MT',
                  color: '#F59E0B',
                  badge: 'Marketing & Publicidade',
                  content: 'Criação de identidades visuais de impacto no Illustrator, manipulação de posters para WhatsApp e Instagram no Photoshop e fecho de ficheiros para impressão rápida.'
                },
                {
                  id: 'ws3',
                  title: 'Workshop 3: Manutenção Rápida de PCs & Redes Wi-Fi',
                  duration: '16 Horas • 2 Fins-de-Semana',
                  price: '1.600 MT',
                  color: '#00C7FD',
                  badge: 'Técnico Hardware & TI',
                  content: 'Formatação segura com backup, diagnóstico avançado de avarias em hardware, instalação de SSDs, crimpagem de cabos de rede e configuração de routers Wi-Fi.'
                }
              ].map(ws => (
                <div
                  key={ws.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(0, 199, 253, 0.35)',
                    borderLeft: `3.2mm solid ${ws.color}`,
                    borderRadius: '3px',
                    padding: '2.2mm 2.8mm',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '2.4mm'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
                      <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#FFFFFF' }}>{ws.title}</div>
                      <span style={{ fontSize: '5.4pt', background: 'rgba(0, 199, 253, 0.15)', color: ws.color, border: `0.5px solid ${ws.color}`, padding: '0.25mm 1.4mm', borderRadius: '2px', fontWeight: '800' }}>
                        {ws.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '6.3pt', color: '#E2E8F0', marginTop: '0.5mm', lineHeight: 1.35 }}>
                      {ws.content}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, borderLeft: '0.8px solid rgba(255,255,255,0.18)', paddingLeft: '2.4mm' }}>
                    <div style={{ fontSize: '6pt', color: '#94A3B8', fontWeight: '700' }}>{ws.duration}</div>
                    <div style={{ fontSize: '8.2pt', fontWeight: '900', color: '#FDE047', marginTop: '0.3mm' }}>{ws.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vantagens do Bootcamp */}
            <div style={{
              background: 'rgba(0, 43, 73, 0.65)', border: '1px solid rgba(0, 199, 253, 0.3)', borderRadius: '2.5px',
              padding: '1.6mm 2.4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.2pt', color: '#BAE6FD'
            }}>
              <div><strong>Incluso:</strong> 1 Computador por Aluno &bull; Coffee Break &bull; Projetos Práticos de Portfólio</div>
              <div style={{ color: '#34D399', fontWeight: '800' }}>✓ Certificado de Participação Oficial</div>
            </div>
          </div>
        </div>

        {/* Rodapé Tech Snug e Seguro */}
        <div style={{ flexShrink: 0, marginTop: '1.4mm' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 24, 48, 0.95) 0%, rgba(0, 114, 181, 0.5) 100%)',
            border: '1.2px solid #00C7FD', borderRadius: '3.5px', padding: '1.8mm 2.4mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2.4mm', marginBottom: '1.2mm'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.7mm', borderRadius: '2px', flexShrink: 0 }}>
              {activeQrCode ? <img src={activeQrCode} alt="QR Code Oficial" crossOrigin="anonymous" style={{ width: '15mm', height: '15mm', display: 'block' }} /> : <div style={{ width: '15mm', height: '15mm', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#002B49' }}>QR</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', background: '#00C7FD', color: '#01060D', fontWeight: '900', fontSize: '7.2pt', padding: '0.6mm 2mm', borderRadius: '2px', letterSpacing: '0.04em', marginBottom: '0.4mm' }}>
                ⚡ RESERVE O SEU LUGAR NO BOOTCAMP
              </div>
              <div style={{ fontSize: '6pt', color: '#CBD5E1' }}>Vagas preenchidas por ordem rigorosa de confirmação:</div>
              <div style={{ fontSize: '7.5pt', color: '#00E5FF', fontWeight: '900', marginTop: '0.3mm' }}>{resolvedDisplayUrl}</div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '0.8px solid rgba(255,255,255,0.2)', paddingLeft: '2mm', fontSize: '5.8pt', color: '#E2E8F0' }}>
              <div style={{ color: '#94A3B8' }}>Hotline Inscrições:</div>
              <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#34D399' }}>{flyerPhone}</div>
              <div style={{ color: '#94A3B8' }}>Auditório & Lab Zaty</div>
            </div>
          </div>
          <div style={{ borderTop: '0.8px solid rgba(255,255,255,0.15)', paddingTop: '0.8mm', display: 'flex', justifyContent: 'space-between', fontSize: '6.2pt', color: '#94A3B8' }}>
            <div><strong style={{ color: '#00C7FD' }}>{inst.name || 'ZATY ACADEMY'}</strong> &bull; Divisão de Formações Avançadas</div>
            <div>{flyerEmail}</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODELO 4: CAMPANHAS & DESCONTOS (Comercial, Selos de Desconto, Pacotes)
  // =========================================================================
  if (activeModelId === 'campaign') {
    return (
      <div 
        key={instanceKey}
        className="a5-flyer-instance flyer-model-campaign"
        style={{
          width: '140mm',
          height: '198mm',
          boxSizing: 'border-box',
          padding: '3.6mm 4.6mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          color: '#0F172A',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '1.8mm', left: '1.8mm', right: '1.8mm', bottom: '1.8mm', border: '1.2px solid #DC2626', borderRadius: '3px', pointerEvents: 'none' }} />

        {/* Topo e Conteúdo da Campanha Promocional */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              background: 'linear-gradient(90deg, #DC2626 0%, #EA580C 50%, #DC2626 100%)',
              color: '#FFFFFF', textAlign: 'center', padding: '1.2mm 0', fontSize: '6.4pt', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.6mm', borderRadius: '2px'
            }}>
              ⚡ OFERTA PROMOCIONAL EXCLUSIVA &bull; ATÉ 25% DE DESCONTO NAS MATRÍCULAS ⚡
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1.4px solid #DC2626', paddingBottom: '1.4mm', marginBottom: '1.6mm'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                <img src={inst.logo_url || '/logo.png'} alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '11mm', maxWidth: '30mm', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#002B49', lineHeight: 1.05 }}>
                    {inst.name || 'ZATY ACADEMY'}
                  </div>
                  <div style={{ fontSize: '6.2pt', color: '#DC2626', fontWeight: '900', textTransform: 'uppercase' }}>
                    Campanha Oficial de Bolsas e Descontos
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '999px', fontSize: '6pt', fontWeight: '900', padding: '0.8mm 2.2mm' }}>
                  📞 WHATSAPP: {flyerPhone}
                </span>
              </div>
            </div>

            {/* Hero com Selo Circular de Desconto */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 45mm', gap: '2.4mm', marginBottom: '2mm',
              background: '#FFFFFF', border: '1px solid #FDA4AF', borderRadius: '3px', padding: '2.2mm'
            }}>
              <div>
                <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#9F1239', lineHeight: 1.1, textTransform: 'uppercase' }}>
                  {flyerTitle}
                </div>
                <div style={{ fontSize: '6.4pt', color: '#881337', marginTop: '0.8mm', lineHeight: 1.35 }}>
                  Matricule-se este mês e garanta condições financeiras especiais. Válido para estudantes do ensino secundário, universitários e profissionais.
                </div>
                <div style={{ display: 'flex', gap: '1.6mm', marginTop: '1.2mm' }}>
                  <span style={{ fontSize: '5.6pt', background: '#DC2626', color: '#FFFFFF', padding: '0.4mm 1.6mm', borderRadius: '2px', fontWeight: '900' }}>
                    VAGAS LIMITADAS
                  </span>
                  <span style={{ fontSize: '5.6pt', background: '#FFF1F2', color: '#9F1239', border: '0.5px solid #FDA4AF', padding: '0.4mm 1.6mm', borderRadius: '2px', fontWeight: '800' }}>
                    {flyerPeriod}
                  </span>
                </div>
              </div>

              {/* Selo Circular Promocional */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '34mm', height: '34mm', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                  color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.4)', border: '2px dashed #FFFFFF', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '6.4pt', fontWeight: '800', color: '#FEF08A' }}>POUPE ATÉ</div>
                  <div style={{ fontSize: '13pt', fontWeight: '900', lineHeight: 1 }}>25%</div>
                  <div style={{ fontSize: '5.2pt', fontWeight: '700' }}>NA MATRÍCULA</div>
                </div>
              </div>
            </div>

            {/* Tabela Comparativa de Pacotes Promocionais - Sem fundo cinza, moderna e espaçosa */}
            <div style={{ marginBottom: '2mm' }}>
              <div style={{ fontSize: '7.4pt', fontWeight: '900', color: '#9F1239', textTransform: 'uppercase', marginBottom: '1.2mm' }}>
                ESCOLHA O SEU PACOTE PROMOCIONAL:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.6mm' }}>
                {[
                  {
                    name: 'Pacote Individual',
                    discount: '10% OFF',
                    desc: 'Qualquer 1 curso completo com desconto imediato na taxa e mensalidades.',
                    tag: 'Ideal para Início',
                    color: '#0284C7'
                  },
                  {
                    name: 'Combo Carreira TI',
                    discount: '25% OFF',
                    desc: '2 Cursos combinados (ex: Informática + Design) com dupla certificação.',
                    tag: 'Mais Popular',
                    color: '#DC2626'
                  },
                  {
                    name: 'Pacote Grupo / Amigo',
                    discount: '20% OFF',
                    desc: 'Inscreva-se com um colega e ambos ganham redução em todas as propinas.',
                    tag: 'Economia em Parceria',
                    color: '#059669'
                  }
                ].map((pkg, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF', border: '1px solid rgba(220, 38, 38, 0.22)', borderTop: `3.5mm solid ${pkg.color}`,
                      borderRadius: '3px', padding: '2mm 1.8mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '34mm', textAlign: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '5.8pt', fontWeight: '800', color: pkg.color, textTransform: 'uppercase' }}>{pkg.tag}</div>
                      <div style={{ fontSize: '7.6pt', fontWeight: '900', color: '#0F172A', marginTop: '0.4mm' }}>{pkg.name}</div>
                      <div style={{ fontSize: '11pt', fontWeight: '900', color: pkg.color, margin: '0.8mm 0' }}>{pkg.discount}</div>
                      <div style={{ fontSize: '6.4pt', color: '#334155', lineHeight: 1.35 }}>{pkg.desc}</div>
                    </div>
                    <div style={{ marginTop: '0.8mm', paddingTop: '0.6mm', borderTop: '0.6px dashed rgba(220, 38, 38, 0.2)', fontSize: '5.8pt', fontWeight: '800', color: '#10B981' }}>
                      ✓ Certificado Incluído
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Prazo da Campanha */}
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '2.5px',
              padding: '1.6mm 2.4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.2pt', color: '#991B1B'
            }}>
              <div><strong>⚠️ Condições:</strong> Desconto concedido por ordem de submissão documental e confirmação.</div>
              <div><strong>Regime:</strong> Diurno, Pós-Laboral e Sábados</div>
            </div>
          </div>
        </div>

        {/* Rodapé Promocional Snug e Seguro */}
        <div style={{ flexShrink: 0, marginTop: '1.4mm' }}>
          <div style={{
            background: 'linear-gradient(135deg, #002B49 0%, #004D80 100%)',
            border: '1.4px solid #DC2626', borderRadius: '3.5px', padding: '1.8mm 2.4mm',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2.4mm', marginBottom: '1.2mm'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.7mm', borderRadius: '2px', flexShrink: 0 }}>
              {activeQrCode ? <img src={activeQrCode} alt="QR Code Oficial" crossOrigin="anonymous" style={{ width: '15mm', height: '15mm', display: 'block' }} /> : <div style={{ width: '15mm', height: '15mm', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#002B49' }}>QR</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#DC2626', color: '#FFFFFF', fontWeight: '900', fontSize: '7.2pt', padding: '0.6mm 2mm', borderRadius: '2px', display: 'inline-block', marginBottom: '0.4mm' }}>
                👉 SOLICITE SEU DESCONTO VIA WHATSAPP OU QR CODE
              </div>
              <div style={{ fontSize: '6pt', color: '#E2E8F0' }}>Envie a palavra "QUERO DESCONTO" para o atendimento:</div>
              <div style={{ fontSize: '7.5pt', color: '#FDE047', fontWeight: '900' }}>{resolvedDisplayUrl}</div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '0.8px solid rgba(255,255,255,0.2)', paddingLeft: '2mm' }}>
              <div style={{ fontSize: '5.2pt', color: '#94A3B8' }}>LIGUE AGORA:</div>
              <div style={{ fontSize: '7.8pt', color: '#34D399', fontWeight: '900' }}>{flyerPhone}</div>
              <div style={{ fontSize: '5.2pt', color: '#E2E8F0' }}>Nampula &bull; Namicopo</div>
            </div>
          </div>
          <div style={{ borderTop: '0.8px solid #CBD5E1', paddingTop: '0.8mm', display: 'flex', justifyContent: 'space-between', fontSize: '6.2pt', color: '#64748B' }}>
            <div><strong>{inst.name || 'ZATY ACADEMY'}</strong> &bull; Secretaria Financeira e de Matrículas</div>
            <div>{flyerEmail}</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODELO 5: EVENTOS & SEMINÁRIOS (Jornada Tecnológica, Portas Abertas, Agenda)
  // =========================================================================
  if (activeModelId === 'event') {
    return (
      <div 
        key={instanceKey}
        className="a5-flyer-instance flyer-model-event"
        style={{
          width: '140mm',
          height: '198mm',
          boxSizing: 'border-box',
          padding: '3.6mm 4.6mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAF5FF',
          color: '#1E1B4B',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '1.8mm', left: '1.8mm', right: '1.8mm', bottom: '1.8mm', border: '1.2px solid #7C3AED', borderRadius: '3px', pointerEvents: 'none' }} />

        {/* Topo e Conteúdo da Jornada Tecnológica */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1.4px solid #7C3AED', paddingBottom: '1.4mm', marginBottom: '1.6mm'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
                <img src={inst.logo_url || '/logo.png'} alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '11mm', maxWidth: '30mm', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '11.5pt', fontWeight: '900', color: '#4C1D95', lineHeight: 1.05 }}>
                    {inst.name || 'ZATY ACADEMY'}
                  </div>
                  <div style={{ fontSize: '6.2pt', color: '#7C3AED', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    JORNADA TECNOLÓGICA & EVENTO INSTITUCIONAL
                  </div>
                </div>
              </div>
              <div style={{ background: '#7C3AED', color: '#FFFFFF', padding: '1mm 2.4mm', borderRadius: '2px', textAlign: 'center' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: '900' }}>ENTRADA LIVRE</div>
                <div style={{ fontSize: '5.2pt', color: '#E9D5FF' }}>REGISTO PRÉVIO</div>
              </div>
            </div>

            {/* Bloco de Título do Evento */}
            <div style={{
              background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
              color: '#FFFFFF', padding: '2.2mm 2.8mm', borderRadius: '3px', textAlign: 'center', marginBottom: '1.8mm',
              border: '1px solid #A78BFA', boxShadow: '0 2px 8px rgba(109, 40, 217, 0.25)'
            }}>
              <div style={{ fontSize: '11.5pt', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {flyerTitle}
              </div>
              <div style={{ fontSize: '6.6pt', color: '#FDE047', fontWeight: '800', marginTop: '0.4mm' }}>
                O Futuro da Tecnologia em Moçambique: Carreiras em TI, IA e Empreendedorismo Digital
              </div>
            </div>

            {/* Destaque em 3 Colunas: Data, Hora e Local */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.6mm', marginBottom: '1.8mm' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '2.5px', padding: '1.8mm 1.5mm', textAlign: 'center' }}>
                <div style={{ fontSize: '5.6pt', fontWeight: '800', color: '#7C3AED' }}>📅 DATA OFICIAL</div>
                <div style={{ fontSize: '7.6pt', fontWeight: '900', color: '#1E1B4B', marginTop: '0.3mm' }}>Sábado</div>
                <div style={{ fontSize: '6pt', color: '#4B5563' }}>{flyerPeriod}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '2.5px', padding: '1.8mm 1.5mm', textAlign: 'center' }}>
                <div style={{ fontSize: '5.6pt', fontWeight: '800', color: '#7C3AED' }}>⏰ HORÁRIO</div>
                <div style={{ fontSize: '7.6pt', fontWeight: '900', color: '#1E1B4B', marginTop: '0.3mm' }}>08h30 - 13h00</div>
                <div style={{ fontSize: '6pt', color: '#4B5563' }}>Manhã Completa</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '2.5px', padding: '1.8mm 1.5mm', textAlign: 'center' }}>
                <div style={{ fontSize: '5.6pt', fontWeight: '800', color: '#7C3AED' }}>📍 LOCALIZAÇÃO</div>
                <div style={{ fontSize: '7.6pt', fontWeight: '900', color: '#1E1B4B', marginTop: '0.3mm' }}>Auditório Zaty</div>
                <div style={{ fontSize: '6pt', color: '#4B5563' }}>Nampula, Namicopo</div>
              </div>
            </div>

            {/* Cronograma / Agenda do Evento - Sem fundo cinza, limpo e profissional */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '3px', padding: '2mm 2.6mm', marginBottom: '1.8mm',
              boxShadow: '0 1px 4px rgba(124, 58, 237, 0.05)'
            }}>
              <div style={{ fontSize: '7.2pt', fontWeight: '900', color: '#4C1D95', textTransform: 'uppercase', marginBottom: '1.2mm', display: 'flex', justifyContent: 'space-between' }}>
                <span>AGENDA DO PROGRAMA:</span>
                <span style={{ color: '#7C3AED', fontSize: '5.8pt' }}>SESSÕES PRÁTICAS & NETWORKING</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6mm' }}>
                {[
                  { time: '08h30 - 09h00', title: 'Credenciamento, Acolhimento & Café de Boas-Vindas' },
                  { time: '09h00 - 10h15', title: 'Painel Principal: Carreiras em TI e Oportunidades de Emprego em Moçambique' },
                  { time: '10h15 - 11h30', title: 'Laboratório Aberto: Demonstração ao Vivo de Design, Redes e Criação de Websites' },
                  { time: '11h30 - 12h30', title: 'Mesa Redonda com Formadores e Ex-Alunos: Experiências e Casos de Sucesso' },
                  { time: '12h30 - 13h00', title: 'Encerramento, Sorteio de Bolsas Parciais e Entrega de Brindes Institucionais' }
                ].map((slot, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2.2mm', fontSize: '6.4pt' }}>
                    <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '0.4mm 1.6mm', borderRadius: '2px', fontWeight: '800', flexShrink: 0, fontSize: '5.8pt' }}>
                      {slot.time}
                    </span>
                    <span style={{ color: '#1E293B', fontWeight: '600', lineHeight: 1.35 }}>
                      {slot.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Público-Alvo e Vantagens */}
            <div style={{
              background: '#F3E8FF', border: '1px solid #D8B4FE', borderRadius: '2.5px',
              padding: '1.6mm 2.4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.2pt', color: '#581C87'
            }}>
              <div><strong>Público:</strong> Estudantes, recém-graduados, profissionais e entusiastas de informática.</div>
              <div style={{ color: '#7C3AED', fontWeight: '800' }}>✓ Certificado de Participação Digital</div>
            </div>
          </div>
        </div>

        {/* Rodapé e Credenciamento Snug e Seguro */}
        <div style={{ flexShrink: 0, marginTop: '1.4mm' }}>
          <div style={{
            background: '#2E1065', border: '1.2px solid #7C3AED', borderRadius: '3.5px', padding: '1.8mm 2.4mm',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2.4mm', marginBottom: '1.2mm'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.7mm', borderRadius: '2px', flexShrink: 0 }}>
              {activeQrCode ? <img src={activeQrCode} alt="QR Code Oficial" crossOrigin="anonymous" style={{ width: '15mm', height: '15mm', display: 'block' }} /> : <div style={{ width: '15mm', height: '15mm', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#002B49' }}>QR</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '7.2pt', fontWeight: '900', color: '#FDE047', letterSpacing: '0.04em' }}>
                CONFIRME A SUA PRESENÇA GRATUITA:
              </div>
              <div style={{ fontSize: '6pt', color: '#E9D5FF', marginTop: '0.3mm' }}>
                Escaneie o QR Code ou confirme por mensagem no WhatsApp:
              </div>
              <div style={{ fontSize: '7.5pt', color: '#38BDF8', fontWeight: '900', marginTop: '0.3mm' }}>
                {resolvedDisplayUrl}
              </div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '0.8px solid rgba(255, 255, 255, 0.25)', paddingLeft: '2mm', fontSize: '5.8pt', color: '#E9D5FF' }}>
              <div style={{ color: '#C4B5FD' }}>Linha do Evento:</div>
              <div style={{ fontSize: '7.8pt', fontWeight: '900', color: '#34D399' }}>{flyerPhone}</div>
              <div style={{ color: '#C4B5FD' }}>{flyerAddress}</div>
            </div>
          </div>
          <div style={{ borderTop: '0.8px solid #CBD5E1', paddingTop: '0.8mm', display: 'flex', justifyContent: 'space-between', fontSize: '6.2pt', color: '#64748B' }}>
            <div><strong>{inst.name || 'ZATY ACADEMY'}</strong> &bull; Organização de Eventos e Extensão Comunitária</div>
            <div>{flyerEmail}</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODELO 6: COMUNICADO OFICIAL (Diretiva Formal Administrativa em Artigos)
  // =========================================================================
  return (
    <div 
      key={instanceKey}
      className="a5-flyer-instance flyer-model-notice"
      style={{
        width: '140mm',
        height: '198mm',
        boxSizing: 'border-box',
        padding: '3.8mm 4.8mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Georgia, serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Moldura Dupla Formal de Despacho */}
      <div style={{ position: 'absolute', top: '1.8mm', left: '1.8mm', right: '1.8mm', bottom: '1.8mm', border: '1.2px solid #002B49', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '2.5mm', left: '2.5mm', right: '2.5mm', bottom: '2.5mm', border: '0.6px solid #94A3B8', pointerEvents: 'none' }} />

      {/* Topo Formal e Artigos Oficiais */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ textAlign: 'center', borderBottom: '1.4px solid #002B49', paddingBottom: '1.4mm', marginBottom: '1.6mm' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8mm' }}>
              <img src={inst.logo_url || '/logo.png'} alt="Emblema Zaty" crossOrigin="anonymous" style={{ maxHeight: '11mm', maxWidth: '32mm', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '11pt', fontWeight: '900', color: '#002B49', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {inst.name || 'ZATY ACADEMY'}
            </div>
            <div style={{ fontSize: '6.2pt', color: '#0072B5', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3mm' }}>
              DIREÇÃO ACADÉMICA & SECRETARIA GERAL
            </div>
            <div style={{ fontSize: '5.6pt', color: '#64748B', marginTop: '0.3mm' }}>
              Registo Institucional &bull; Província de Nampula, República de Moçambique
            </div>
          </div>

          {/* Metadados Formais do Despacho - Design limpo e moderno sem fundo cinza */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FFFFFF', border: '1px solid rgba(0, 43, 73, 0.2)', padding: '1.4mm 2.2mm', marginBottom: '1.8mm', fontSize: '6pt', borderRadius: '2.5px'
          }}>
            <div><strong>REF:</strong> COMUNICADO OFICIAL Nº 01/ZA-DIR/{new Date().getFullYear()}</div>
            <div><strong>EMISSÃO:</strong> Nampula, {flyerPeriod}</div>
            <div style={{ background: '#002B49', color: '#FFFFFF', padding: '0.3mm 1.6mm', borderRadius: '2px', fontWeight: '800', fontSize: '5.6pt' }}>
              PUBLICADO
            </div>
          </div>

          {/* Título e Assunto Formal */}
          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <div style={{ fontSize: '9.2pt', fontWeight: '900', color: '#002B49', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>
              {flyerTitle}
            </div>
            <div style={{ fontSize: '6.2pt', color: '#475569', fontStyle: 'italic', marginTop: '0.4mm' }}>
              Assunto: Disposições e Normas Regulamentares para Estudantes, Formadores e Candidatos
            </div>
          </div>

          {/* Corpo do Comunicado em Artigos Oficiais - Sem fundo cinza, tipografia legível e ampla ocupação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            {[
              {
                art: 'Artigo 1º',
                title: 'Início do Ano Formativo e Confirmação de Matrículas',
                desc: 'Ficam abertas as confirmações de matrícula para todas as turmas dos turnos laboral, pós-laboral e fins-de-semana. As inscrições são formalizadas mediante preenchimento da ficha e quitação da respetiva taxa.'
              },
              {
                art: 'Artigo 2º',
                title: 'Regime de Assiduidade e Pontualidade nos Laboratórios',
                desc: 'É obrigatória a frequência mínima de 80% da carga horária para elegibilidade à certificação. A política institucional garante rigorosamente 1 computador individual por cada formando durante todas as aulas práticas.'
              },
              {
                art: 'Artigo 3º',
                title: 'Regularização de Propinas e Emissão de Recibo Oficial',
                desc: 'Os pagamentos das mensalidades devem ser efetuados até ao dia 10 de cada mês através dos canais móveis autorizados (M-Pesa, e-Mola ou mKesh), sendo emitido o respetivo recibo eletrónico oficial de quitação.'
              },
              {
                art: 'Artigo 4º',
                title: 'Certificação Digital e Validação de Competências',
                desc: 'No termo com aproveitamento positivo (média mínima de 10 valores), o formando tem direito ao Certificado Profissional com selo institucional e código QR de verificação de autenticidade anti-fraude.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{ background: '#FFFFFF', border: '1px solid rgba(0, 114, 181, 0.22)', borderLeft: '3.2mm solid #002B49', padding: '1.8mm 2.4mm', borderRadius: '2.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: '900', color: '#0F172A' }}>
                  <span style={{ color: '#0072B5' }}>{item.art}</span> ({item.title}):
                </div>
                <div style={{ fontSize: '6.3pt', color: '#1E293B', lineHeight: 1.35, marginTop: '0.4mm' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bloco de Assinaturas, Carimbo e Rodapé Formal Seguro */}
      <div style={{ flexShrink: 0, marginTop: '1.4mm' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2mm',
          borderTop: '0.8px solid #CBD5E1', paddingTop: '1.8mm', marginBottom: '1.2mm'
        }}>
          {/* Assinatura da Direção */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '7mm', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ width: '48mm', borderBottom: '0.8px solid #002B49' }}></div>
            </div>
            <div style={{ fontSize: '6.2pt', fontWeight: '900', color: '#002B49', marginTop: '0.4mm' }}>
              A Direção Geral da Zaty Academy
            </div>
            <div style={{ fontSize: '5.4pt', color: '#64748B' }}>
              Despacho Homologado &bull; Nampula
            </div>
          </div>

          {/* Carimbo Oficial e QR de Validação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2mm' }}>
            <div style={{ textAlign: 'right', fontSize: '5.6pt', color: '#475569' }}>
              <div>Validação Digital:</div>
              <div style={{ fontWeight: '900', color: '#0072B5', fontSize: '6.4pt' }}>{resolvedDisplayUrl}</div>
              <div style={{ color: '#64748B' }}>Tel: {flyerPhone}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.6mm', border: '1px solid #002B49', borderRadius: '2px', flexShrink: 0 }}>
              {activeQrCode ? <img src={activeQrCode} alt="QR Code Oficial" crossOrigin="anonymous" style={{ width: '14mm', height: '14mm', display: 'block' }} /> : <div style={{ width: '14mm', height: '14mm', background: '#E2E8F0', fontSize: '4.5pt', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002B49' }}>QR</div>}
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '0.6px solid #CBD5E1', paddingTop: '0.8mm', display: 'flex', justifyContent: 'space-between',
          fontSize: '5.8pt', color: '#64748B'
        }}>
          <div><strong>{inst.name || 'ZATY ACADEMY'}</strong> &bull; Secretaria Geral & Registo Académico Oficial</div>
          <div>{flyerAddress} &bull; {flyerEmail}</div>
        </div>
      </div>
    </div>
  );
}

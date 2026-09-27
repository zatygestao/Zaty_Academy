import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { generateQrCodeDataUrl } from '../../services/qrCodeService';
import { downloadFlyerAsPng, downloadFlyerAsPdf } from '../../services/flyerDownloadService';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { FLYER_TEMPLATES } from '../../constants/flyerTemplates';
import A5Flyer from './A5Flyer';
import { 
  WhatsAppIcon, 
  FacebookIcon, 
  InstagramIcon, 
  TikTokIcon 
} from './SocialBrandIcons';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText, 
  Printer,
  Download,
  FileDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

/**
 * Componente de Publicação Oficial do Folheto de Inscrições Abertas
 * Apresenta o folheto como uma publicação institucional moderna (estilo post/comunicado oficial)
 * com marcas oficiais para redes sociais (WhatsApp, Facebook, Instagram, TikTok)
 * e opção de download exclusivo para o Administrador em página única A5 vertical (PNG e PDF).
 */
export default function EnrollmentFlyerPost({ 
  showViewEditalButton = true,
  onViewEdital = null,
  compact = false 
}) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  const { settings } = useSettings();
  const navigate = useNavigate();

  const flyerRef = useRef(null);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const inst = settings.institution || {};
  const academic = settings.academic || {};
  const isEnabled = academic.enrollment_notice_enabled === true;

  // Estado do Modelo Visual Selecionado para o Folheto
  const getInitialTemplate = (tmpl) => (!tmpl || tmpl === 'classic' ? 'enrollment' : tmpl);
  const [selectedTemplate, setSelectedTemplate] = useState(() => getInitialTemplate(academic.flyer_template));

  useEffect(() => {
    if (academic.flyer_template) {
      setSelectedTemplate(getInitialTemplate(academic.flyer_template));
    }
  }, [academic.flyer_template]);

  if (!isEnabled) {
    return null;
  }

  const officialFlyerImage = academic.enrollment_flyer_image || DEFAULT_IT_STUDY_IMAGES[0];

  // Gerar QR Code dinâmico para o modelo de folheto selecionado
  useEffect(() => {
    async function createQrCode() {
      const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const origin = isLocal
        ? (inst?.website || 'https://zatyacademy.co.mz')
        : (typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz');
      const cleanOrigin = origin.replace(/\/+$/, '');
      
      let targetPath = '/inscricao';
      if (selectedTemplate === 'courses') targetPath = '/cursos';
      else if (selectedTemplate === 'workshop') targetPath = '/workshops';
      else if (selectedTemplate === 'campaign') targetPath = '/desconto';
      else if (selectedTemplate === 'notice') targetPath = '/validar';

      const registrationUrl = academic?.enrollment_custom_url || academic?.flyer_target_url || `${cleanOrigin}${targetPath}`;
      try {
        const url = await generateQrCodeDataUrl(registrationUrl, { width: 300, margin: 1 });
        if (url) setQrCodeUrl(url);
      } catch (e) {
        console.warn('Falha ao gerar QR Code para folheto:', e);
      }
    }
    createQrCode();
  }, [selectedTemplate, academic?.enrollment_custom_url, academic?.flyer_target_url, inst?.website]);

  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/inscricoes-abertas` : 'https://zatyacademy.co.mz/inscricoes-abertas';
  const shareTitle = academic.enrollment_title || '📢 Inscrições Abertas — ZATY ACADEMY';
  const shareText = `🎓 ${shareTitle} (${academic.enrollment_period || 'Ano Formativo 2026'})\n\nEstão abertas as inscrições oficiais para novas turmas com formação prática e certificação reconhecida na ZATY ACADEMY!\n\n🔗 Saiba mais e inscreva-se online:\n${pageUrl}`;

  // 1. Partilha Oficial no WhatsApp
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. Partilha Oficial no Facebook
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 3. Partilha Oficial no Instagram
  const handleShareInstagram = async () => {
    const isMobile = typeof navigator !== 'undefined' && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '');
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Partilha nativa cancelada ou indisponível:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${pageUrl}`);
      setShareToast('Texto e link copiados! A abrir o Instagram...');
    } catch {
      setShareToast('A abrir o Instagram...');
    }
    setTimeout(() => setShareToast(''), 4500);
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
  };

  // 4. Partilha Oficial no TikTok
  const handleShareTikTok = async () => {
    const isMobile = typeof navigator !== 'undefined' && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '');
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Partilha nativa cancelada ou indisponível:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${pageUrl}`);
      setShareToast('Texto e link copiados! A abrir o TikTok...');
    } catch {
      setShareToast('A abrir o TikTok...');
    }
    setTimeout(() => setShareToast(''), 4500);
    window.open('https://www.tiktok.com', '_blank', 'noopener,noreferrer');
  };

  // Copiar Link Oficial
  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopiedLink(true);
    setShareToast('Link oficial copiado!');
    setTimeout(() => {
      setCopiedLink(false);
      setShareToast('');
    }, 2500);
  };

  // Impressão A4 (2x A5) exclusiva para Admin
  const handlePrint = () => {
    if (!isAdmin) return;
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/inscricoes-abertas') {
        window.print();
      } else {
        window.open('/inscricoes-abertas?print=a5', '_blank');
      }
    }
  };

  // Download Exclusivo do Admin: Folheto A5 em Imagem PNG (Pronto para Redes Sociais)
  const handleDownloadFlyerPng = async () => {
    if (!isAdmin || isDownloading) return;
    setIsDownloading(true);
    setShareToast('A processar imagem A5 em alta resolução (300 DPI) para redes sociais...');
    try {
      const target = flyerRef.current || document.getElementById('publication-flyer-capture');
      await downloadFlyerAsPng(target, `Folheto-${selectedTemplate}-Zaty-Academy-A5`);
      setShareToast('Folheto A5 descarregado com sucesso em PNG! Pronto para publicação.');
    } catch (err) {
      console.error('Erro ao descarregar imagem do folheto:', err);
      setShareToast('Erro ao processar imagem do folheto. Tente novamente.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setShareToast(''), 4500);
    }
  };

  // Download Exclusivo do Admin: Folheto A5 em Documento PDF (Página Única A5 Vertical)
  const handleDownloadFlyerPdf = async () => {
    if (!isAdmin || isDownloading) return;
    setIsDownloading(true);
    setShareToast('A gerar documento PDF em página única A5 vertical...');
    try {
      const target = flyerRef.current || document.getElementById('publication-flyer-capture');
      await downloadFlyerAsPdf(target, `Folheto-${selectedTemplate}-Zaty-Academy-A5`);
      setShareToast('Folheto A5 descarregado com sucesso em PDF!');
    } catch (err) {
      console.error('Erro ao descarregar PDF do folheto:', err);
      setShareToast('Erro ao processar PDF do folheto. Tente novamente.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setShareToast(''), 4500);
    }
  };

  const handleGoToEdital = () => {
    if (onViewEdital) {
      onViewEdital();
    } else {
      navigate('/inscricoes-abertas?view=notice');
    }
  };

  return (
    <article 
      className="enrollment-publication-card"
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        background: 'rgba(0, 24, 48, 0.65)',
        border: '1px solid rgba(0, 163, 224, 0.28)',
        borderRadius: '14px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 199, 253, 0.15)',
        overflow: 'hidden',
        color: '#F8FAFC'
      }}
    >
      {/* 1. CABEÇALHO DA PUBLICAÇÃO (Identificação Oficial) */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(0, 163, 224, 0.18)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'linear-gradient(180deg, rgba(0, 42, 78, 0.35) 0%, rgba(0, 24, 48, 0.1) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img 
            src={inst.logo_url || '/logo.png'} 
            alt="Logo Zaty Academy" 
            crossOrigin="anonymous"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              objectFit: 'contain',
              background: '#FFFFFF',
              padding: '3px',
              border: '2px solid #00C7FD',
              boxShadow: '0 2px 8px rgba(0, 199, 253, 0.35)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                {inst.name || 'ZATY ACADEMY'}
              </span>
              <CheckCircle2 size={16} color="#00C7FD" style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '1px' }}>
              Publicação Oficial &bull; Secretaria Académica &bull; {academic.enrollment_period || 'Ano Formativo 2026'}
            </div>
          </div>
        </div>

        {/* Badge Institucional Oficial */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          background: isEnabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
          border: isEnabled ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.45)',
          color: isEnabled ? '#34D399' : '#F87171',
          fontSize: '0.76rem',
          fontWeight: '700'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isEnabled ? '#10B981' : '#EF4444' }} />
          <span>{isEnabled ? 'Inscrições Abertas' : 'Inscrições Suspensas'}</span>
        </div>
      </div>

      {/* 2. LEGENDA DA PUBLICAÇÃO (Texto Institucional Claro) */}
      <div style={{ padding: '1.25rem 1.5rem 0.75rem 1.5rem' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: '0.5rem',
          lineHeight: 1.3
        }}>
          {academic.enrollment_title || '📢 Inscrições Abertas para o Novo Ciclo Formativo!'}
        </h2>
        <p style={{
          fontSize: '0.92rem',
          color: '#CBD5E1',
          lineHeight: 1.6,
          margin: 0
        }}>
          Estão oficialmente abertas as inscrições na <strong>ZATY ACADEMY</strong>. Garanta a sua vaga em cursos 100% práticos com 1 computador por formando, formadores qualificados e certificação digital reconhecida com verificação anti-fraude. Veja o folheto oficial e faça a sua inscrição:
        </p>
      </div>

      {/* 2.1. SELETOR DE MODELOS VISUAIS DE FOLHETO (Interativo) */}
      <div style={{
        padding: '0.4rem 1.5rem 0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: '600', marginRight: '0.2rem' }}>
          Estilo do Folheto:
        </span>
        {FLYER_TEMPLATES.map(t => {
          const isSel = selectedTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                border: isSel ? `1.5px solid ${t.accentColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                background: isSel 
                  ? 'linear-gradient(135deg, rgba(0, 199, 253, 0.22) 0%, rgba(0, 102, 178, 0.35) 100%)' 
                  : 'rgba(15, 23, 42, 0.6)',
                color: isSel ? '#FFFFFF' : '#CBD5E1',
                fontSize: '0.78rem',
                fontWeight: isSel ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSel ? `0 2px 10px ${t.accentColor}33` : 'none'
              }}
              title={t.description}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.accentColor, boxShadow: `0 0 6px ${t.accentColor}` }} />
              <span>{t.name}</span>
              {isSel && (
                <span style={{
                  fontSize: '0.62rem',
                  background: t.accentColor,
                  color: '#01060D',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  fontWeight: '800'
                }}>
                  {t.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MÍDIA DA PUBLICAÇÃO (O Folheto A5 Limpo e Centralizado com Ref para Captura) */}
      <div style={{
        padding: '0.75rem 1.25rem 1.5rem 1.25rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div 
          ref={flyerRef}
          id="publication-flyer-capture"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 199, 253, 0.25)',
            borderRadius: '4px',
            background: '#FFFFFF',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <A5Flyer 
            instanceKey={`publication-flyer-${selectedTemplate}`}
            template={selectedTemplate}
            inst={inst}
            academic={academic}
            officialFlyerImage={officialFlyerImage}
            qrCodeUrl={qrCodeUrl}
          />
        </div>
      </div>

      {/* 4. BARRA DE AÇÕES E INTERAÇÕES DA PUBLICAÇÃO */}
      <div style={{
        padding: '1.15rem 1.5rem',
        borderTop: '1px solid rgba(0, 163, 224, 0.2)',
        background: 'rgba(0, 18, 36, 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Ações Primárias do Candidato e do Administrador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            to="/inscricao"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
          >
            <span>FAZER INSCRIÇÃO ONLINE</span>
            <ArrowRight size={16} />
          </Link>

          {/* BOTÕES DE AÇÃO COMPACTOS (APENAS ÍCONES COM TOOLTIPS) */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {/* 1. Ver Edital Completo (Apenas Ícone) */}
            {showViewEditalButton && (
              <button
                type="button"
                onClick={handleGoToEdital}
                title="Ver Edital Completo"
                aria-label="Ver Edital Completo"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: 'rgba(0, 114, 181, 0.22)',
                  border: '1.2px solid rgba(0, 199, 253, 0.45)',
                  color: '#BAE6FD',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                }}
              >
                <FileText size={18} color="#00C7FD" />
              </button>
            )}

            {/* AÇÕES EXCLUSIVAS DO ADMIN (APENAS ÍCONES) */}
            {isAdmin && (
              <>
                {/* 2. Baixar Imagem A5 para Redes Sociais (Apenas Ícone) */}
                <button
                  type="button"
                  onClick={handleDownloadFlyerPng}
                  disabled={isDownloading}
                  title="Baixar Imagem A5 (Redes Sociais)"
                  aria-label="Baixar Imagem A5 (Redes Sociais)"
                  style={{
                    width: '38px',
                    height: '38px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: isDownloading ? 'wait' : 'pointer',
                    padding: 0,
                    boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)',
                    opacity: isDownloading ? 0.7 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  {isDownloading ? <RefreshCw size={17} className="animate-spin" /> : <Download size={18} />}
                </button>

                {/* 3. Baixar PDF A5 em Página Única Vertical (Apenas Ícone) */}
                <button
                  type="button"
                  onClick={handleDownloadFlyerPdf}
                  disabled={isDownloading}
                  title="PDF A5 (Página Única Vertical)"
                  aria-label="PDF A5"
                  style={{
                    width: '38px',
                    height: '38px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'rgba(0, 42, 78, 0.85)',
                    color: '#00C7FD',
                    border: '1.2px solid rgba(0, 199, 253, 0.5)',
                    cursor: isDownloading ? 'wait' : 'pointer',
                    padding: 0,
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s'
                  }}
                >
                  <FileDown size={18} />
                </button>

                {/* 4. Imprimir (A4 - 2 Folhetos A5) (Apenas Ícone) */}
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Imprimir (A4 — 2 Folhetos A5)"
                  aria-label="Imprimir (A4)"
                  style={{
                    width: '38px',
                    height: '38px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: '0 3px 10px rgba(0, 199, 253, 0.3)',
                    transition: 'all 0.15s'
                  }}
                >
                  <Printer size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 5. PARTILHA SOCIAL COM OS LOGÓTIPOS E MARCAS OFICIAIS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8', marginRight: '0.2rem', fontWeight: '600' }}>
            Partilhar:
          </span>

          {/* WhatsApp Oficial */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            title="Partilhar no WhatsApp com mensagem e link oficiais"
            style={{
              background: 'rgba(37, 211, 102, 0.14)',
              border: '1px solid rgba(37, 211, 102, 0.45)',
              color: '#25D366',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
            }}
          >
            <WhatsAppIcon size={18} />
          </button>

          {/* Facebook Oficial */}
          <button
            type="button"
            onClick={handleShareFacebook}
            title="Partilhar no Facebook"
            style={{
              background: 'rgba(24, 119, 242, 0.14)',
              border: '1px solid rgba(24, 119, 242, 0.45)',
              color: '#1877F2',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
            }}
          >
            <FacebookIcon size={18} />
          </button>

          {/* Instagram Oficial */}
          <button
            type="button"
            onClick={handleShareInstagram}
            title="Partilhar no Instagram"
            style={{
              background: 'rgba(225, 48, 108, 0.14)',
              border: '1px solid rgba(225, 48, 108, 0.45)',
              color: '#E1306C',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
            }}
          >
            <InstagramIcon size={18} />
          </button>

          {/* TikTok Oficial */}
          <button
            type="button"
            onClick={handleShareTikTok}
            title="Partilhar no TikTok"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
            }}
          >
            <TikTokIcon size={18} />
          </button>

          {/* Copiar Link Oficial */}
          <button
            type="button"
            onClick={handleCopyLink}
            title={copiedLink ? 'Link oficial copiado!' : 'Copiar link oficial'}
            style={{
              background: 'rgba(0, 199, 253, 0.12)',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              color: '#00C7FD',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
            }}
          >
            {copiedLink ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {shareToast && (
        <div style={{
          padding: '0.65rem 1.5rem',
          background: 'rgba(0, 42, 78, 0.95)',
          borderTop: '1px solid rgba(0, 199, 253, 0.4)',
          fontSize: '0.82rem',
          color: '#E0F2FE',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.3)'
        }}>
          <CheckCircle2 size={16} color="#00C7FD" style={{ flexShrink: 0 }} />
          <span>{shareToast}</span>
        </div>
      )}
    </article>
  );
}

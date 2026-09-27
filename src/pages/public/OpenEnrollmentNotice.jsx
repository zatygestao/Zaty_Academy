import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getCourses } from '../../services/api';
import { generateQrCodeDataUrl } from '../../services/qrCodeService';
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  FileCheck, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  RefreshCw,
  FileText,
  Layers,
  Download,
  Lock
} from 'lucide-react';
import { downloadFlyerAsPng, downloadFlyerAsPdf } from '../../services/flyerDownloadService';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { OFFICIAL_ENROLLMENT_COURSES } from '../../constants/enrollmentCourses';
import A5Flyer from '../../components/common/A5Flyer';
import EnrollmentFlyerPost from '../../components/common/EnrollmentFlyerPost';
import EnrollmentEditalView from '../../components/common/EnrollmentEditalView';

export default function OpenEnrollmentNotice() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const { settings, loading: settingsLoading } = useSettings();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToast, setShareToast] = useState('');
  // Modos de visualização na tela: 'notice' (Edital detalhado - Principal) | 'flyer' (Folheto A5) | 'sheet' (A4 dupla 2x A5)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'flyer') return 'flyer';
      if (params.get('view') === 'sheet') return 'sheet';
    }
    return 'notice';
  });

  // Modo de impressão administrativa A5 ativado via URL (?print=a5)
  const isPrintA5Mode = typeof window !== 'undefined' && window.location.search.includes('print=a5');

  const handlePrintFlyer = () => {
    if (!isAdmin) return;
    window.print();
  };

  // Se não for administrador, restringir exclusivamente para os modos públicos ('flyer' ou 'notice')
  useEffect(() => {
    if (!isAdmin && viewMode === 'sheet') {
      setViewMode('flyer');
    }
  }, [isAdmin, viewMode]);

  useEffect(() => {
    if (isPrintA5Mode && isAdmin) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPrintA5Mode, isAdmin]);

  const inst = settings?.institution || {};
  const academic = settings?.academic || {};
  const contact = settings?.contact || {};

  const isEnabled = academic?.enrollment_notice_enabled === true;

  if (settingsLoading) {
    return null;
  }

  if (!isEnabled) {
    return <Navigate to="/" replace />;
  }

  const officialFlyerImage = academic.enrollment_flyer_image || DEFAULT_IT_STUDY_IMAGES[selectedImageIndex];

  useEffect(() => {
    async function loadActiveCourses() {
      try {
        const data = await getCourses(true);
        setCourses(data || []);
      } catch (err) {
        console.error('Erro ao carregar cursos para edital:', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadActiveCourses();
  }, []);

  // Gerar QR Code dinâmico para a inscrição online do folheto
  useEffect(() => {
    async function createQrCode() {
      const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const origin = isLocal
        ? (inst?.website || 'https://zatyacademy.co.mz')
        : (typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz');
      const cleanOrigin = origin.replace(/\/+$/, '');
      const registrationUrl = academic?.enrollment_custom_url || academic?.flyer_target_url || `${cleanOrigin}/inscricao`;
      try {
        const url = await generateQrCodeDataUrl(registrationUrl, { width: 300, margin: 1 });
        if (url) setQrCodeUrl(url);
      } catch (e) {
        console.warn('Falha ao gerar QR Code para folheto:', e);
      }
    }
    createQrCode();
  }, [academic?.enrollment_custom_url, academic?.flyer_target_url, inst?.website]);

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

  // Links e Partilhas Oficiais
  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://zatyacademy.co.mz/inscricoes-abertas';
  const shareTitle = academic.enrollment_title || '📢 Inscrições Abertas — Zaty Academy';
  const sharePeriod = academic.enrollment_period || 'Ano Formativo 2026';
  const shareText = `🎓 ${shareTitle} (${sharePeriod})\n\nA Direção da Zaty Academy informa que estão abertas as inscrições oficiais para novas turmas com formação prática em computadores individuais e certificação reconhecida!\n\n🔗 Consulte o Edital Oficial e faça a sua Inscrição Online:\n${pageUrl}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareText);
    setShareToast('Legenda e link oficial copiados! Abra o Instagram e cole na sua publicação, bio ou story.');
    setTimeout(() => setShareToast(''), 4500);
    window.open('https://www.instagram.com/', '_blank');
  };

  const handleShareTikTok = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareText);
    setShareToast('Legenda institucional copiada! Abra o TikTok para publicar o vídeo de divulgação com o link.');
    setTimeout(() => setShareToast(''), 4500);
    window.open('https://www.tiktok.com/', '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Rotação Automática Contínua das Fotografias Oficiais (Muda a cada 4 segundos)
  useEffect(() => {
    if (academic.enrollment_flyer_image || !isAutoPlaying) return;

    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [academic.enrollment_flyer_image, isAutoPlaying]);

  // Alternar imagem manual
  const cycleImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + DEFAULT_IT_STUDY_IMAGES.length) % DEFAULT_IT_STUDY_IMAGES.length);
  };

  // Renderizador do Exemplar A5 Individual Oficial (140mm x 198mm com margens de segurança para A4)
  const renderA5Flyer = (instanceKey) => (
    <A5Flyer
      instanceKey={instanceKey}
      template={academic.flyer_template || 'enrollment'}
      purpose={academic.flyer_purpose || 'enrollment'}
      inst={inst}
      academic={academic}
      officialFlyerImage={officialFlyerImage}
      qrCodeUrl={qrCodeUrl}
    />
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020b14', color: '#F8FAFC', padding: '1.5rem 1rem' }}>

      {/* ESTILOS DE IMPRESSÃO ESPECÍFICOS (A4 HORIZONTAL COM 2x A5 LADO A LADO) */}
      <style>{`
        @page {
          size: A4 landscape !important;
          margin: 0mm !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            width: 297mm !important;
            height: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }

          /* Ocultar rigorosamente todos os elementos de tela e navegação */
          .no-print, header, nav, footer, .sidebar-layout, button, a[href^="#"], .modal-overlay,
          .screen-document-container, .screen-flyer-preview-container, .screen-sheet-preview-container {
            display: none !important;
          }

          /* Exibir exclusivamente a folha A4 contendo os 2 folhetos A5 lado a lado com margens de segurança */
          .print-sheet-a4-dual-a5 {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            width: 297mm !important;
            height: 210mm !important;
            max-width: 297mm !important;
            max-height: 210mm !important;
            margin: 0 auto !important;
            padding: 6mm 8.5mm !important;
            background: #FFFFFF !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          .a5-flyer-instance {
            width: 140mm !important;
            height: 198mm !important;
            max-width: 140mm !important;
            max-height: 198mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .btn-inscricao-online {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #FACC15 !important;
            background: #FACC15 !important;
            color: #002B49 !important;
            padding: 0.4mm 2.2mm !important;
            line-height: 1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .btn-inscricao-online * {
            color: #002B49 !important;
            line-height: 1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Garantir proporção e enquadramento exatos das fotos na impressão sem esticar */
          .flyer-hero-container {
            position: relative !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          .flyer-hero-bg-img {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center 35% !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .flyer-cover-image {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        @media screen {
          .print-sheet-a4-dual-a5 {
            display: none !important;
          }
        }

        .procedures-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .procedures-grid {
            grid-template-columns: 1fr;
          }
        }
        .header-contact-info {
          text-align: right;
          font-size: 0.8rem;
          color: #94A3B8;
        }
        @media (max-width: 640px) {
          .header-contact-info {
            width: 100% !important;
            text-align: right !important;
            margin-left: auto !important;
          }
        }
        .footer-valid-date-info {
          text-align: right;
        }
        @media (max-width: 640px) {
          .footer-valid-date-info {
            width: 100% !important;
            text-align: right !important;
            margin-left: auto !important;
          }
        }
      `}</style>

      {/* FOLHA A4 COM 2 EXEMPLARES A5 LADO A LADO COM MARGENS DE SEGURANÇA (Renderizado no Print Nativamente) */}
      <div className="print-sheet-a4-dual-a5">
        {/* Exemplar A5 Esquerdo */}
        {renderA5Flyer('print-copy-1')}

        {/* Guia Central de Corte (Linha tracejada fina e limpa) */}
        <div 
          style={{
            width: '0px',
            height: '198mm',
            borderLeft: '1px dashed #CBD5E1',
            position: 'relative',
            zIndex: 20,
            flexShrink: 0
          }}
        />

        {/* Exemplar A5 Direito */}
        {renderA5Flyer('print-copy-2')}
      </div>

      {/* 3.1 VISUALIZAÇÃO EM TELA: PUBLICAÇÃO INSTITUCIONAL DO FOLHETO */}
      {viewMode === 'flyer' && (
        <div className="no-print" style={{ maxWidth: '860px', margin: '0.5rem auto 3rem auto' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('notice')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'rgba(0, 32, 64, 0.85)',
                border: '1px solid rgba(0, 163, 224, 0.4)',
                color: '#00C7FD',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Edital Completo</span>
            </button>

            <Link
              to="/inscricao"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>Fazer Inscrição Online</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <EnrollmentFlyerPost 
            showViewEditalButton={true}
            onViewEdital={() => setViewMode('notice')} 
          />
        </div>
      )}

      {/* 3.2 VISUALIZAÇÃO EM TELA: FOLHA A4 HORIZONTAL (2x A5 LADO A LADO) - APENAS ADMINISTRADOR */}
      {isAdmin && viewMode === 'sheet' && (
        <div className="screen-sheet-preview-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Barra Informativa da Folha A4 */}
          <div style={{
            background: 'rgba(0, 32, 64, 0.7)',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="#00C7FD" />
                <span>Folha de Impressão A4 Horizontal (297 × 210 mm) — 2 Exemplares A5 com Margens Seguras</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Exemplares A5 reduzidos para 140 × 198 mm com margens de segurança (6mm sup/inf, 8.5mm laterais) contra cortes na impressão.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadFlyerAsPng('.screen-sheet-preview-container .a5-flyer-instance', 'Folheto-Inscricoes-Zaty-Academy-A5');
                  } catch (e) {
                    console.error('Erro ao baixar PNG:', e);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                title="Baixar imagem A5 vertical em alta resolução para redes sociais"
              >
                <Download size={15} />
                <span>Baixar Folheto A5 (PNG)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadFlyerAsPdf('.screen-sheet-preview-container .a5-flyer-instance', 'Folheto-Inscricoes-Zaty-Academy-A5');
                  } catch (e) {
                    console.error('Erro ao baixar PDF:', e);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(0, 42, 78, 0.85)',
                  color: '#BAE6FD',
                  border: '1.2px solid rgba(0, 199, 253, 0.5)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                title="Baixar folheto em página única A5 (PDF)"
              >
                <FileText size={15} color="#00C7FD" />
                <span>PDF A5</span>
              </button>

              <button
                type="button"
                onClick={handlePrintFlyer}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                <span>Imprimir Agora (A4 Paisagem)</span>
              </button>
            </div>
          </div>

          {/* Pré-visualização da Folha A4 Completa com Rolagem Suave */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            overflowX: 'auto',
            padding: '0.5rem 0 2rem 0'
          }}>
            <div 
              className="screen-sheet-preview-container"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 199, 253, 0.3)',
              borderRadius: '4px',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              width: '297mm',
              height: '210mm',
              padding: '6mm 8.5mm',
              boxSizing: 'border-box',
              flexShrink: 0
            }}>
              {renderA5Flyer('screen-sheet-copy-1')}

              {/* Linha Central de Corte (Linha tracejada fina e limpa) */}
              <div 
                style={{
                  width: '0px',
                  height: '198mm',
                  borderLeft: '1px dashed #CBD5E1',
                  position: 'relative',
                  zIndex: 20,
                  flexShrink: 0
                }}
              />

              {renderA5Flyer('screen-sheet-copy-2')}
            </div>
          </div>
        </div>
      )}

      {/* 3.3 VISUALIZACAO EM TELA: EDITAL ACADEMICO COMPLETO */}
      {viewMode === 'notice' && (
        <EnrollmentEditalView 
          onViewFlyer={() => setViewMode('flyer')}
          showTopNav={true}
          isHomePage={false}
          onPrint={handlePrintFlyer}
        />
      )}

    </div>
  );
}

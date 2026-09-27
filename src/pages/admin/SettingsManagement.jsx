import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { saveSettings, uploadPublicFile, uploadAvatar, broadcastEnrollmentNotification } from '../../services/api';
import { processLogoBackground, resizeAvatarImage, convertSvgToPngDataUrl } from '../../utils/imageUtils';
import { generateQrCodeDataUrl } from '../../services/qrCodeService';
import { downloadFlyerAsPng, downloadFlyerAsPdf } from '../../services/flyerDownloadService';
import AdminSidebar from '../../components/admin/AdminSidebar';
import A5Flyer from '../../components/common/A5Flyer';
import { 
  Smartphone, 
  Building2, 
  Save, 
  CheckCircle2, 
  GraduationCap, 
  Headphones, 
  UserCheck, 
  Camera, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Shield,
  ExternalLink,
  Megaphone,
  FileText,
  Bell,
  Share2,
  Copy,
  Check,
  Image as ImageIcon,
  Printer,
  Palette,
  Layers,
  Flame,
  Download,
  BookOpen
} from 'lucide-react';
import { DEFAULT_IT_STUDY_IMAGES } from '../../constants/flyerImages';
import { FLYER_TEMPLATES, FLYER_PURPOSES } from '../../constants/flyerTemplates';

export default function SettingsManagement() {
  const { user, profile, updateAdminProfile } = useAuth();
  const { settings, refreshSettings } = useSettings();

  // 1. Estados da Instituição
  const [instForm, setInstForm] = useState({
    name: settings.institution?.name || 'ZATY ACADEMY',
    tagline: settings.institution?.tagline || 'Centro de Formação em Informática e Tecnologia',
    email: settings.institution?.email || 'contacto@zatyacademy.co.mz',
    phone: settings.institution?.phone || '+258 84 000 0000',
    alternative_phone: settings.institution?.alternative_phone || '+258 86 000 0000',
    address: settings.institution?.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)',
    website: settings.institution?.website || 'https://zatyacademy.co.mz',
    director_name: settings.institution?.director_name || 'Direcção Geral Zaty Academy',
    director_role: settings.institution?.director_role || 'Diretor Geral',
    nuit: settings.institution?.nuit || '400123456',
    logo_url: settings.institution?.logo_url || '/logo.png',
    document_logo_url: settings.institution?.document_logo_url || '',
    signature_url: settings.institution?.signature_url || '',
    stamp_url: settings.institution?.stamp_url || ''
  });

  // 2. Estados dos Métodos de Pagamento
  const [paymentForm, setPaymentForm] = useState({
    mpesa: {
      enabled: settings.payment_methods?.mpesa?.enabled ?? true,
      name: 'M-Pesa',
      number: settings.payment_methods?.mpesa?.number || '84 000 0000',
      holder: settings.payment_methods?.mpesa?.holder || 'ZATY ACADEMY',
      instructions: settings.payment_methods?.mpesa?.instructions || 'Envie o montante por M-Pesa e anexe o comprovativo.'
    },
    emola: {
      enabled: settings.payment_methods?.emola?.enabled ?? true,
      name: 'e-Mola',
      number: settings.payment_methods?.emola?.number || '86 000 0000',
      holder: settings.payment_methods?.emola?.holder || 'ZATY ACADEMY',
      instructions: settings.payment_methods?.emola?.instructions || 'Envie o montante por e-Mola (*898#) e anexe o comprovativo.'
    },
    mkesh: {
      enabled: settings.payment_methods?.mkesh?.enabled ?? true,
      name: 'mKesh',
      number: settings.payment_methods?.mkesh?.number || '82 000 0000',
      holder: settings.payment_methods?.mkesh?.holder || 'ZATY ACADEMY',
      instructions: settings.payment_methods?.mkesh?.instructions || 'Envie o montante por mKesh e anexe o comprovativo.'
    }
  });

  // 3. Estados das Configurações Académicas & Inscrições Abertas
  const [academicForm, setAcademicForm] = useState({
    registration_fee: settings.academic?.registration_fee ?? 500,
    allow_online_registration: settings.academic?.allow_online_registration ?? true,
    max_installments: settings.academic?.max_installments ?? 3,
    academic_year: settings.academic?.academic_year || '2026',
    passing_grade: settings.academic?.passing_grade ?? 10,
    enrollment_notice_enabled: settings.academic?.enrollment_notice_enabled ?? false,
    enrollment_title: settings.academic?.enrollment_title || 'INSCRIÇÕES ABERTAS - ANO FORMATIVO 2026',
    enrollment_period: settings.academic?.enrollment_period || 'De 15 de Janeiro a 28 de Fevereiro de 2026',
    enrollment_requirements: settings.academic?.enrollment_requirements || 'Idade mínima de 14 anos; Cópia do B.I. ou Passaporte ou Cédula Pessoal; Certificado de habilitações literárias (mínimo 7ª classe); 2 Fotografias tipo passe.',
    enrollment_conditions: settings.academic?.enrollment_conditions || 'Pagamento da taxa de inscrição no ato da submissão; Vagas limitadas por turma (máximo 20 formandos); Regime presencial e b-learning conforme a especialidade.',
    enrollment_procedures: settings.academic?.enrollment_procedures || '1. Preenchimento do formulário de inscrição online;\n2. Pagamento da taxa de matrícula e envio do comprovativo;\n3. Validação institucional pela Direção Académica;\n4. Confirmação da turma e início das aulas.',
    enrollment_schedule_info: settings.academic?.enrollment_schedule_info || 'Manhã (08h - 11h) | Tarde (14h - 17h) | Pós-laboral / Noite (17h30 - 20h) | Aulas de Sábado (08h - 13h)',
    enrollment_flyer_image: settings.academic?.enrollment_flyer_image || '',
    flyer_template: settings.academic?.flyer_template || 'enrollment',
    flyer_purpose: settings.academic?.flyer_purpose || 'enrollment',
    flyer_badge: settings.academic?.flyer_badge || 'VAGAS LIMITADAS'
  });

  // 4. Estados dos Canais de Suporte
  const [contactForm, setContactForm] = useState({
    whatsapp_number: settings.contact?.whatsapp_number || '+258 84 000 0000',
    support_hours: settings.contact?.support_hours || 'Segunda a Sexta, das 08h às 17h | Sábados das 08h às 13h',
    terms_notice: settings.contact?.terms_notice || 'Ao matricular-se, o aluno concorda com o regulamento interno e pedagógico da Zaty Academy.'
  });

  // Utilitários de carregamento e mensagens
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Estados específicos para o Logotipo
  const [removeBlueBg, setRemoveBlueBg] = useState(true);
  const [logoProcessing, setLogoProcessing] = useState(false);
  const [docLogoProcessing, setDocLogoProcessing] = useState(false);

  // Estados específicos para a Foto do Administrador
  const [adminPhotoUploading, setAdminPhotoUploading] = useState(false);
  const [adminPhotoMsg, setAdminPhotoMsg] = useState('');
  const [adminPhotoError, setAdminPhotoError] = useState('');

  // Estados para Flyer e Kit de Redes Sociais
  const [flyerUploading, setFlyerUploading] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState(null);
  const [adminFlyerPreviewIndex, setAdminFlyerPreviewIndex] = useState(0);

  // Navegação em Categorias / Abas (suporta query param na URL)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (['institution', 'academic', 'enrollment', 'payments', 'support', 'profile'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'institution';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Ref para auto-rolagem suave da categoria ativa no mobile
  const activeTabBtnRef = useRef(null);
  useEffect(() => {
    if (activeTabBtnRef.current) {
      activeTabBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeTab]);

  // QR Code para pré-visualização em alta fidelidade do Folheto no Painel de Definições
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState('');
  useEffect(() => {
    async function genQr() {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz';
      try {
        const url = await generateQrCodeDataUrl(`${origin}/inscricao`, { width: 140, margin: 1 });
        if (url) setAdminQrCodeUrl(url);
      } catch (_) {}
    }
    genQr();
  }, []);

  // Rotação Automática da Pré-visualização do Folheto no Painel do Admin
  useEffect(() => {
    if (academicForm.enrollment_flyer_image) return;

    const timer = setInterval(() => {
      setAdminFlyerPreviewIndex((prev) => (prev + 1) % DEFAULT_IT_STUDY_IMAGES.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [academicForm.enrollment_flyer_image]);

  // Sincronizar quando os settings forem atualizados
  useEffect(() => {
    if (settings.institution) {
      setInstForm(prev => ({
        ...prev,
        name: settings.institution.name || prev.name,
        tagline: settings.institution.tagline || prev.tagline,
        email: settings.institution.email || prev.email,
        phone: settings.institution.phone || prev.phone,
        alternative_phone: settings.institution.alternative_phone || prev.alternative_phone,
        address: settings.institution.address || prev.address,
        website: settings.institution.website || prev.website,
        director_name: settings.institution.director_name || prev.director_name,
        director_role: settings.institution.director_role || prev.director_role,
        nuit: settings.institution.nuit || prev.nuit,
        logo_url: settings.institution.logo_url || prev.logo_url,
        document_logo_url: settings.institution.document_logo_url !== undefined ? settings.institution.document_logo_url : prev.document_logo_url,
        signature_url: settings.institution.signature_url || prev.signature_url,
        stamp_url: settings.institution.stamp_url || prev.stamp_url
      }));
    }

    if (settings.payment_methods) {
      setPaymentForm(prev => ({
        mpesa: { ...prev.mpesa, ...(settings.payment_methods.mpesa || {}) },
        emola: { ...prev.emola, ...(settings.payment_methods.emola || {}) },
        mkesh: { ...prev.mkesh, ...(settings.payment_methods.mkesh || {}) }
      }));
    }

    if (settings.academic) {
      setAcademicForm(prev => ({
        ...prev,
        registration_fee: settings.academic.registration_fee ?? prev.registration_fee,
        allow_online_registration: settings.academic.allow_online_registration ?? prev.allow_online_registration,
        max_installments: settings.academic.max_installments ?? prev.max_installments,
        academic_year: settings.academic.academic_year || prev.academic_year,
        passing_grade: settings.academic.passing_grade ?? prev.passing_grade,
        enrollment_notice_enabled: settings.academic.enrollment_notice_enabled ?? prev.enrollment_notice_enabled,
        enrollment_title: settings.academic.enrollment_title || prev.enrollment_title,
        enrollment_period: settings.academic.enrollment_period || prev.enrollment_period,
        enrollment_requirements: settings.academic.enrollment_requirements || prev.enrollment_requirements,
        enrollment_conditions: settings.academic.enrollment_conditions || prev.enrollment_conditions,
        enrollment_procedures: settings.academic.enrollment_procedures || prev.enrollment_procedures,
        enrollment_schedule_info: settings.academic.enrollment_schedule_info || prev.enrollment_schedule_info,
        enrollment_flyer_image: settings.academic.enrollment_flyer_image !== undefined ? settings.academic.enrollment_flyer_image : prev.enrollment_flyer_image,
        flyer_template: settings.academic.flyer_template || prev.flyer_template,
        flyer_purpose: settings.academic.flyer_purpose || prev.flyer_purpose,
        flyer_badge: settings.academic.flyer_badge || prev.flyer_badge
      }));
    }

    if (settings.contact) {
      setContactForm(prev => ({
        ...prev,
        whatsapp_number: settings.contact.whatsapp_number || prev.whatsapp_number,
        support_hours: settings.contact.support_hours || prev.support_hours,
        terms_notice: settings.contact.terms_notice || prev.terms_notice
      }));
    }
  }, [settings]);

  // Upload de Logotipo com remoção automática de fundo azul / sólido (ou conversão de SVG)
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoProcessing(true);
    try {
      let fileToUpload = file;
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');

      if (isSvg) {
        const converted = await convertSvgToPngDataUrl(file, 1200);
        fileToUpload = converted.pngFile;
      } else if (removeBlueBg) {
        fileToUpload = await processLogoBackground(file, {
          removeBlue: true,
          tolerance: 38,
          maxDimension: 800
        });
      }

      const url = await uploadPublicFile(fileToUpload, 'institutional_assets');
      setInstForm(prev => ({ ...prev, logo_url: url }));
    } catch (err) {
      console.error('Falha ao processar e carregar logotipo:', err);
      alert('Não foi possível processar o logotipo: ' + (err?.message || 'Verifique o formato do arquivo.'));
    } finally {
      setLogoProcessing(false);
    }
  };

  // Upload do Logotipo Exclusivo para Documentos (SVG / PNG)
  const handleDocumentLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocLogoProcessing(true);
    try {
      let fileToUpload = file;
      let localDataUrl = null;
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');

      if (isSvg) {
        const converted = await convertSvgToPngDataUrl(file, 1200);
        fileToUpload = converted.pngFile;
        localDataUrl = converted.pngDataUrl;
      }

      let finalUrl = localDataUrl;
      try {
        const publicUrl = await uploadPublicFile(fileToUpload, 'institutional_assets');
        if (publicUrl) finalUrl = publicUrl;
      } catch (uploadErr) {
        console.warn('Upload de arquivo falhou, mantendo Data URL local nítida:', uploadErr);
      }

      setInstForm(prev => ({ ...prev, document_logo_url: finalUrl }));
    } catch (err) {
      console.error('Falha ao carregar logotipo de documentos:', err);
      alert('Não foi possível carregar o logotipo de documentos: ' + (err?.message || 'Arquivo inválido.'));
    } finally {
      setDocLogoProcessing(false);
    }
  };

  // Upload de outros documentos (Assinatura, Carimbo)
  const handleFileUpload = async (file, field) => {
    if (!file) return;
    try {
      const url = await uploadPublicFile(file, 'institutional_assets');
      setInstForm(prev => ({ ...prev, [field]: url }));
    } catch (e) {
      console.error('Falha no upload do ativo institucional:', e);
      alert('Erro no envio do ficheiro.');
    }
  };

  // Upload da Foto de Perfil do Administrador
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAdminPhotoUploading(true);
    setAdminPhotoError('');
    setAdminPhotoMsg('');

    try {
      const optimizedFile = await resizeAvatarImage(file, 320);

      let publicUrl = null;
      try {
        publicUrl = await uploadAvatar(user.id, optimizedFile);
      } catch (storageErr) {
        console.warn('Tentando fallback com uploadPublicFile:', storageErr);
        publicUrl = await uploadPublicFile(optimizedFile, 'avatars');
      }

      if (updateAdminProfile) {
        await updateAdminProfile({ avatar_url: publicUrl });
      }

      setAdminPhotoMsg('Foto de perfil atualizada com sucesso!');
      setTimeout(() => setAdminPhotoMsg(''), 4500);
    } catch (err) {
      console.error('Erro ao atualizar foto de perfil:', err);
      setAdminPhotoError(err.message || 'Falha ao atualizar foto de perfil.');
    } finally {
      setAdminPhotoUploading(false);
    }
  };

  // Remoção da Foto de Perfil do Administrador
  const handleAvatarRemove = async () => {
    if (!window.confirm('Tem a certeza de que deseja remover a sua foto de perfil?')) return;
    setAdminPhotoUploading(true);
    setAdminPhotoError('');
    setAdminPhotoMsg('');

    try {
      if (updateAdminProfile) {
        await updateAdminProfile({ avatar_url: null });
      }
      setAdminPhotoMsg('Foto de perfil removida com sucesso.');
      setTimeout(() => setAdminPhotoMsg(''), 4500);
    } catch (err) {
      console.error('Erro ao remover foto:', err);
      setAdminPhotoError('Erro ao remover foto de perfil.');
    } finally {
      setAdminPhotoUploading(false);
    }
  };

  // Gravação global de configurações
  const handleSaveAll = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await saveSettings({
        institution: instForm,
        payment_methods: paymentForm,
        academic: academicForm,
        contact: contactForm
      });

      await refreshSettings();
      setSuccessMsg('Todas as configurações foram gravadas e atualizadas com sucesso em todo o sistema!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      alert(err?.message || 'Falha ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  // Disparo manual ou sob demanda de Notificação de Inscrições Abertas para Alunos e Formadores
  const handleBroadcastEnrollment = async () => {
    if (!window.confirm('Deseja enviar uma notificação institucional de "Inscrições Abertas" para todos os estudantes e formadores registados no sistema?')) {
      return;
    }

    setBroadcasting(true);
    setBroadcastMsg('');
    try {
      const res = await broadcastEnrollmentNotification(user?.id, {
        title: academicForm.enrollment_title || '📢 Inscrições Abertas - Zaty Academy',
        period: academicForm.enrollment_period || 'Ano Formativo em curso'
      });
      setBroadcastMsg(`Notificação enviada com sucesso para ${res?.notifiedCount ?? res?.count ?? 0} utilizadores!`);
      setTimeout(() => setBroadcastMsg(''), 6000);
    } catch (err) {
      console.error('Erro ao disparar notificações:', err);
      alert('Erro ao disparar notificações: ' + (err?.message || 'Falha de comunicação.'));
    } finally {
      setBroadcasting(false);
    }
  };

  // Upload de Imagem Personalizada de Informática para Folheto A5
  const handleFlyerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerUploading(true);
    try {
      const url = await uploadPublicFile(file, 'institutional_assets');
      setAcademicForm(prev => ({ ...prev, enrollment_flyer_image: url }));
    } catch (err) {
      console.error('Erro ao enviar imagem de informática para o folheto:', err);
      alert('Falha ao carregar a fotografia do folheto.');
    } finally {
      setFlyerUploading(false);
    }
  };

  const handleRemoveFlyerImage = () => {
    setAcademicForm(prev => ({ ...prev, enrollment_flyer_image: '' }));
  };

  // Ref e Estados para Download dos Folhetos no Painel de Definições
  const adminFlyerRef = useRef(null);
  const [adminDownloading, setAdminDownloading] = useState(false);
  const [adminDownloadToast, setAdminDownloadToast] = useState('');

  const handleAdminDownloadPng = async () => {
    if (adminDownloading) return;
    setAdminDownloading(true);
    setAdminDownloadToast('A gerar imagem PNG do folheto em alta resolução (300 DPI)...');
    try {
      const target = adminFlyerRef.current || document.getElementById('admin-settings-flyer-capture');
      await downloadFlyerAsPng(target, `Folheto-${academicForm.flyer_template || 'enrollment'}-Zaty-Academy-A5`);
      setAdminDownloadToast('Folheto A5 descarregado com sucesso em PNG!');
    } catch (err) {
      console.error(err);
      setAdminDownloadToast('Erro ao exportar imagem do folheto.');
    } finally {
      setAdminDownloading(false);
      setTimeout(() => setAdminDownloadToast(''), 4000);
    }
  };

  const handleAdminDownloadPdf = async () => {
    if (adminDownloading) return;
    setAdminDownloading(true);
    setAdminDownloadToast('A gerar documento PDF em página única A5...');
    try {
      const target = adminFlyerRef.current || document.getElementById('admin-settings-flyer-capture');
      await downloadFlyerAsPdf(target, `Folheto-${academicForm.flyer_template || 'enrollment'}-Zaty-Academy-A5`);
      setAdminDownloadToast('Folheto A5 descarregado com sucesso em PDF!');
    } catch (err) {
      console.error(err);
      setAdminDownloadToast('Erro ao exportar PDF do folheto.');
    } finally {
      setAdminDownloading(false);
      setTimeout(() => setAdminDownloadToast(''), 4000);
    }
  };

  // Kit de Divulgação Oficial & Redes Sociais
  const getSocialShareData = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zatyacademy.co.mz';
    const officialUrl = `${origin}/inscricoes-abertas`;
    const title = academicForm.enrollment_title || 'INSCRIÇÕES ABERTAS - ZATY ACADEMY';
    const period = academicForm.enrollment_period || 'Ano Formativo 2026';
    const caption = `🎓 ${title}\n\n📅 Período Oficial: ${period}\n\n🚀 Venha construir o seu futuro connosco! Formações práticas em Informática na Óptica do Utilizador, Design Gráfico, Redes de Computadores e Desenvolvimento Web com certificação oficial Zaty Academy.\n\n🔗 Consulte todas as informações e garanta a sua vaga online:\n${officialUrl}\n\n#ZatyAcademy #InscricoesAbertas #CursosProfissionais #Tecnologia #Mozambique`;
    return { officialUrl, caption, title };
  };

  const handleCopySocialText = (platform, text) => {
    navigator.clipboard.writeText(text);
    setCopiedSocial(platform);
    setTimeout(() => setCopiedSocial(null), 3000);
  };

  // Definição das Abas de Configurações
  const SETTINGS_TABS = [
    { 
      id: 'institution', 
      label: 'Instituição & Marca', 
      icon: Building2, 
      desc: 'Identidade, logotipos oficiais, assinaturas e carimbo'
    },
    { 
      id: 'academic', 
      label: 'Académico & Matrículas', 
      icon: GraduationCap, 
      desc: 'Taxas, parcelamento de propinas e nota mínima de aprovação'
    },
    { 
      id: 'enrollment', 
      label: 'Inscrições & Divulgação', 
      icon: Megaphone, 
      desc: 'Edital oficial, folheto publicitário A5 e redes sociais',
      badge: academicForm.enrollment_notice_enabled ? 'Activo' : null
    },
    { 
      id: 'payments', 
      label: 'Pagamentos Móveis', 
      icon: Smartphone, 
      desc: 'Carteiras digitais M-Pesa, e-Mola e mKesh para propinas'
    },
    { 
      id: 'support', 
      label: 'Atendimento & Termos', 
      icon: Headphones, 
      desc: 'WhatsApp de atendimento, horários e termos de inscrição'
    },
    { 
      id: 'profile', 
      label: 'Perfil do Administrador', 
      icon: UserCheck, 
      desc: 'Fotografia de exibição, nome e credenciais de acesso'
    }
  ];

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, overflowY: 'auto' }}>
        
        {/* CABEÇALHO PRINCIPAL DA PÁGINA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{
                background: 'rgba(0, 199, 253, 0.15)',
                border: '1px solid rgba(0, 199, 253, 0.35)',
                borderRadius: '8px',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00C7FD'
              }}>
                <Building2 size={22} />
              </div>
              <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Configurações do Sistema
              </h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem', margin: 0 }}>
              Gestão centralizada da identidade institucional, regras académicas, canais de cobrança e divulgação oficial.
            </p>
          </div>

          <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-lg mobile-btn-full" style={{ boxShadow: '0 4px 14px rgba(0, 199, 253, 0.3)' }}>
            <Save size={17} />
            {saving ? 'A GRAVAR ALTERAÇÕES...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
          </button>
        </div>

        {/* FEEDBACK DE GRAVAÇÃO COM SUCESSO */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '6px',
            padding: '0.9rem 1.25rem',
            color: '#34D399',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.885rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: '600' }}>{successMsg}</span>
          </div>
        )}

        {/* BARRA DE NAVEGAÇÃO EM CATEGORIAS / ABAS (DESKTOP E MOBILE STICKY) */}
        <div className="settings-tab-nav-wrapper">
          <div className="settings-tab-nav">
            {SETTINGS_TABS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabBtnRef : null}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                  title={tab.desc}
                >
                  <TabIcon size={17} color={isActive ? '#00C7FD' : '#94A3B8'} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="settings-tab-badge">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            CONTEÚDO DINÂMICO DA ABA ATIVA
            ============================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ============================================================
              ABA 1: INSTITUIÇÃO & IDENTIDADE VISUAL
              ============================================================ */}
          {activeTab === 'institution' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <Building2 size={20} color="#00C7FD" />
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Identidade Institucional & Logotipo Oficial
                </h2>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                Informações oficiais que constam no cabeçalho do sistema, nos Recibos Oficiais e Certificados Digitais com QR Code.
              </p>

              {/* Sub-bloco 1: Dados Gerais da Instituição */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.85rem' }}>
                  1. Dados Oficiais de Cadastro
                </span>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome Oficial da Instituição *</label>
                    <input 
                      type="text" 
                      value={instForm.name} 
                      onChange={e => setInstForm({ ...instForm, name: e.target.value })} 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subtítulo / Descrição Curta *</label>
                    <input 
                      type="text" 
                      value={instForm.tagline} 
                      onChange={e => setInstForm({ ...instForm, tagline: e.target.value })} 
                      required 
                      className="form-input" 
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">E-mail Oficial da Academia</label>
                    <input 
                      type="email" 
                      value={instForm.email} 
                      onChange={e => setInstForm({ ...instForm, email: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone Principal</label>
                    <input 
                      type="text" 
                      value={instForm.phone} 
                      onChange={e => setInstForm({ ...instForm, phone: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone Alternativo</label>
                    <input 
                      type="text" 
                      value={instForm.alternative_phone} 
                      onChange={e => setInstForm({ ...instForm, alternative_phone: e.target.value })} 
                      className="form-input" 
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Endereço Físico</label>
                    <input 
                      type="text" 
                      value={instForm.address} 
                      onChange={e => setInstForm({ ...instForm, address: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website Oficial</label>
                    <input 
                      type="url" 
                      value={instForm.website} 
                      onChange={e => setInstForm({ ...instForm, website: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">NUIT da Entidade</label>
                    <input 
                      type="text" 
                      value={instForm.nuit} 
                      onChange={e => setInstForm({ ...instForm, nuit: e.target.value })} 
                      className="form-input" 
                    />
                  </div>
                </div>
              </div>

              {/* Sub-bloco 2: Direção Geral */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.85rem' }}>
                  2. Representação Legal & Assinatura nos Certificados
                </span>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome do Diretor Geral (Assinatura do Certificado)</label>
                    <input 
                      type="text" 
                      value={instForm.director_name} 
                      onChange={e => setInstForm({ ...instForm, director_name: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cargo do Responsável</label>
                    <input 
                      type="text" 
                      value={instForm.director_role} 
                      onChange={e => setInstForm({ ...instForm, director_role: e.target.value })} 
                      className="form-input" 
                    />
                  </div>
                </div>
              </div>

              {/* Sub-bloco 3: Ativos Gráficos e Logotipos */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      3. Logotipos, Assinatura Digital & Carimbo Oficial
                    </span>
                    <p style={{ color: '#94A3B8', fontSize: '0.785rem', margin: '0.2rem 0 0 0' }}>
                      Remoção automática de fundo azul e conversão em alta resolução para ecrãs e impressão PDF.
                    </p>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 114, 206, 0.2)', border: '1px solid rgba(0, 199, 253, 0.3)', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#E2E8F0' }}>
                    <input 
                      type="checkbox" 
                      checked={removeBlueBg} 
                      onChange={e => setRemoveBlueBg(e.target.checked)} 
                    />
                    <span>Remover fundo azul/sólido automaticamente</span>
                  </label>
                </div>

                <div className="grid-3">
                  {/* Upload do Logotipo Principal */}
                  <div className="form-group">
                    <label className="form-label">Logotipo Principal (Web & Sistema)</label>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                      onChange={handleLogoUpload} 
                      disabled={logoProcessing}
                      className="form-input" 
                    />
                    {logoProcessing && (
                      <div style={{ marginTop: '0.5rem', color: '#00C7FD', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RefreshCw size={14} className="spin-animation" />
                        <span>A processar transparência do logotipo...</span>
                      </div>
                    )}

                    {instForm.logo_url && (
                      <div style={{
                        marginTop: '0.75rem',
                        background: 'rgba(0, 20, 40, 0.65)',
                        border: '1px solid rgba(0, 199, 253, 0.25)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '4px',
                          background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 10px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0
                        }}>
                          <img 
                            src={instForm.logo_url} 
                            alt="Logotipo Zaty Academy" 
                            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
                          />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34D399' }}>
                            Logotipo Ativo ✓
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                            Fundo Transparente
                          </div>
                          <button
                            type="button"
                            onClick={() => setInstForm(prev => ({ ...prev, logo_url: '' }))}
                            style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={12} /> Remover Logotipo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload de Assinatura Digital */}
                  <div className="form-group">
                    <label className="form-label">Assinatura Digital (Certificados)</label>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg" 
                      onChange={e => handleFileUpload(e.target.files[0], 'signature_url')} 
                      className="form-input" 
                    />
                    {instForm.signature_url && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#10B981' }}>
                        <CheckCircle2 size={14} />
                        <span>Assinatura Digital Carregada</span>
                      </div>
                    )}
                  </div>

                  {/* Upload de Carimbo Institucional */}
                  <div className="form-group">
                    <label className="form-label">Carimbo Institucional (Selo Oficial)</label>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg" 
                      onChange={e => handleFileUpload(e.target.files[0], 'stamp_url')} 
                      className="form-input" 
                    />
                    {instForm.stamp_url && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#10B981' }}>
                        <CheckCircle2 size={14} />
                        <span>Carimbo Oficial Carregado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logotipo Exclusivo de Documentos */}
                <div style={{
                  marginTop: '1.25rem',
                  background: 'rgba(0, 30, 60, 0.45)',
                  border: '1px solid rgba(0, 199, 253, 0.25)',
                  borderRadius: '8px',
                  padding: '1.15rem'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={16} color="#00C7FD" />
                      Logotipo Exclusivo para Documentos Oficiais & Certificados (SVG / PNG)
                    </strong>
                    <p style={{ color: '#94A3B8', fontSize: '0.785rem', marginTop: '0.2rem' }}>
                      Opcional. Se configurado, este logotipo será usado exclusivamente na emissão de Recibos, Certificados e Declarações em PDF sem alterar o logotipo da barra de navegação do site. Suporta ficheiros vectoriais <strong style={{ color: '#00C7FD' }}>.svg</strong> (com renderização de alta definição 300+ DPI para impressão) e ficheiros <strong style={{ color: '#00C7FD' }}>.png</strong>. Se não configurado, o sistema usa automaticamente <code style={{ color: '#00C7FD' }}>/logo-documentos.svg</code> (se existir) ou o Logotipo Principal.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <label className="form-label">Carregar Logotipo dos Documentos (.svg, .png, .jpg)</label>
                      <input 
                        type="file" 
                        accept="image/svg+xml,image/png,image/jpeg,image/webp" 
                        onChange={handleDocumentLogoUpload} 
                        disabled={docLogoProcessing}
                        className="form-input" 
                      />
                      {docLogoProcessing && (
                        <div style={{ marginTop: '0.5rem', color: '#00C7FD', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <RefreshCw size={14} className="spin-animation" />
                          <span>A enviar logotipo de documentos...</span>
                        </div>
                      )}
                    </div>

                    {instForm.document_logo_url && (
                      <div style={{
                        background: 'rgba(0, 20, 40, 0.65)',
                        border: '1px solid rgba(0, 199, 253, 0.25)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '4px',
                          background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 10px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0
                        }}>
                          <img 
                            src={instForm.document_logo_url} 
                            alt="Logotipo de Documentos" 
                            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34D399' }}>
                            Logotipo de Documentos Ativo ✓
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                            Aplicado aos Certificados e Recibos PDF
                          </div>
                          <button
                            type="button"
                            onClick={() => setInstForm(prev => ({ ...prev, document_logo_url: '' }))}
                            style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={12} /> Remover Logotipo de Documentos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              ABA 2: ACADÉMICO & MATRÍCULAS
              ============================================================ */}
          {activeTab === 'academic' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <GraduationCap size={20} color="#00C7FD" />
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Políticas Académicas & Matrículas
                </h2>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                Defina as taxas de inscrição padrão, limite de parcelamento de propinas, nota mínima de aprovação e acesso público.
              </p>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Taxa de Matrícula Padrão (MT) *</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="50"
                    value={academicForm.registration_fee} 
                    onChange={e => setAcademicForm({ ...academicForm, registration_fee: Number(e.target.value) || 0 })} 
                    className="form-input" 
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Cobrada aos novos alunos na inscrição.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Número Máximo de Parcelas de Propinas</label>
                  <select 
                    value={academicForm.max_installments} 
                    onChange={e => setAcademicForm({ ...academicForm, max_installments: Number(e.target.value) || 1 })} 
                    className="form-input" 
                  >
                    <option value="1">1 Parcela (Pagamento Único)</option>
                    <option value="2">Até 2 Parcelas</option>
                    <option value="3">Até 3 Parcelas (Recomendado)</option>
                    <option value="4">Até 4 Parcelas</option>
                    <option value="6">Até 6 Parcelas</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Permite o pagamento fracionado das mensalidades.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Ano Formativo / Letivo Corrente</label>
                  <input 
                    type="text" 
                    value={academicForm.academic_year} 
                    onChange={e => setAcademicForm({ ...academicForm, academic_year: e.target.value })} 
                    className="form-input" 
                    placeholder="Ex: 2026"
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Ano de referência para pautas, certificados e turmas.
                  </span>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Nota Mínima para Aprovação e Certificação (0 a 20)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    step="0.5"
                    value={academicForm.passing_grade} 
                    onChange={e => setAcademicForm({ ...academicForm, passing_grade: Number(e.target.value) || 10 })} 
                    className="form-input" 
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Estudantes com nota final igual ou superior têm direito ao Certificado com QR Code.
                  </span>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label">Inscrições Públicas Abertas no Portal</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0, 42, 78, 0.7)', border: '1px solid rgba(0, 163, 224, 0.25)', padding: '0.75rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#FFFFFF', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={academicForm.allow_online_registration} 
                      onChange={e => setAcademicForm({ ...academicForm, allow_online_registration: e.target.checked })} 
                      style={{ width: '16px', height: '16px', accentColor: '#00C7FD' }}
                    />
                    <span>Permitir que novos estudantes se inscrevam livremente pelo website</span>
                  </label>
                </div>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              ABA 3: INSCRIÇÕES ABERTAS & DIVULGAÇÃO (EDITAL, FOLHETO & REDES)
              ============================================================ */}
          {activeTab === 'enrollment' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)', border: academicForm.enrollment_notice_enabled ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
              
              {/* Cabeçalho do Edital com Ações Rápidas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Megaphone size={20} color={academicForm.enrollment_notice_enabled ? '#10B981' : '#00C7FD'} />
                    <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      Aviso & Edital de Inscrições Abertas
                    </h2>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      fontWeight: '700',
                      background: academicForm.enrollment_notice_enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                      color: academicForm.enrollment_notice_enabled ? '#34D399' : '#94A3B8',
                      border: academicForm.enrollment_notice_enabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)'
                    }}>
                      {academicForm.enrollment_notice_enabled ? 'ATIVO NO PORTAL' : 'DESATIVADO'}
                    </span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginTop: '0.35rem', marginBottom: 0 }}>
                    Controle de visibilidade do banner público, edição dos textos do edital, seleção da fotografia do folheto A5 e kit para redes sociais.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <a
                    href="/inscricoes-abertas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <FileText size={14} />
                    <span>Ver Página do Edital</span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href="/inscricoes-abertas?print=a5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(0, 199, 253, 0.4)' }}
                    title="Abre a visualização e diálogo de impressão de 2 panfletos A5 por folha A4"
                  >
                    <Printer size={14} color="#00C7FD" />
                    <span>Imprimir Folheto A5 (2 por A4)</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleBroadcastEnrollment}
                    disabled={broadcasting}
                    className="btn btn-primary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.45rem 0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem',
                      background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
                      border: 'none',
                      color: '#fff',
                      cursor: broadcasting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Bell size={14} />
                    <span>{broadcasting ? 'Enviando...' : 'Notificar Estudantes & Formadores'}</span>
                  </button>
                </div>
              </div>

              {broadcastMsg && (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.4)', 
                  padding: '0.65rem 1rem', 
                  borderRadius: '6px', 
                  marginBottom: '1.25rem', 
                  color: '#34D399', 
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{broadcastMsg}</span>
                </div>
              )}

              {/* Switch Master: Ativar / Desativar */}
              <div style={{ 
                background: academicForm.enrollment_notice_enabled ? 'rgba(0, 199, 253, 0.08)' : 'rgba(0, 42, 78, 0.4)', 
                border: '1px solid rgba(0, 163, 224, 0.25)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', display: 'block' }}>
                    Ativação Geral do Banner & Notificação de "INSCRIÇÕES ABERTAS"
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                    Quando ativado, os visitantes verão a notificação dinâmica na página inicial e poderão acessar o edital oficial com 1 clique.
                  </span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={academicForm.enrollment_notice_enabled}
                    onChange={e => setAcademicForm({ ...academicForm, enrollment_notice_enabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    cursor: 'pointer', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: academicForm.enrollment_notice_enabled ? '#10B981' : '#334155', 
                    borderRadius: '26px', 
                    transition: '0.3s' 
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      content: '""', 
                      height: '20px', 
                      width: '20px', 
                      left: academicForm.enrollment_notice_enabled ? '26px' : '3px', 
                      bottom: '3px', 
                      backgroundColor: 'white', 
                      borderRadius: '50%', 
                      transition: '0.3s' 
                    }} />
                  </span>
                </label>
              </div>

              {/* Sub-bloco 1: Diretrizes Textuais do Edital */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.85rem' }}>
                  1. Informações Oficiais do Edital
                </span>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Título Oficial do Edital / Aviso *</label>
                    <input 
                      type="text" 
                      value={academicForm.enrollment_title} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_title: e.target.value })} 
                      className="form-input" 
                      placeholder="Ex: INSCRIÇÕES ABERTAS - ANO FORMATIVO 2026"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Período de Inscrição & Prazos *</label>
                    <input 
                      type="text" 
                      value={academicForm.enrollment_period} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_period: e.target.value })} 
                      className="form-input" 
                      placeholder="Ex: De 15 de Janeiro a 28 de Fevereiro de 2026"
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Requisitos de Acesso & Documentos Necessários</label>
                    <textarea 
                      rows="3"
                      value={academicForm.enrollment_requirements} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_requirements: e.target.value })} 
                      className="form-input" 
                      placeholder="Documentos obrigatórios, escolaridade mínima, idade..."
                      style={{ resize: 'vertical' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                      Separe os tópicos por ponto e vírgula ou parágrafos para melhor legibilidade.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Condições Gerais & Vagas Disponíveis</label>
                    <textarea 
                      rows="3"
                      value={academicForm.enrollment_conditions} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_conditions: e.target.value })} 
                      className="form-input" 
                      placeholder="Vagas por turma, condições de admissão, regras de frequência..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Procedimento de Inscrição Passo-a-Passo</label>
                    <textarea 
                      rows="3"
                      value={academicForm.enrollment_procedures} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_procedures: e.target.value })} 
                      className="form-input" 
                      placeholder="1. Inscrição online; 2. Pagamento; 3. Validação..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horários, Turnos e Regime de Aulas</label>
                    <textarea 
                      rows="3"
                      value={academicForm.enrollment_schedule_info} 
                      onChange={e => setAcademicForm({ ...academicForm, enrollment_schedule_info: e.target.value })} 
                      className="form-input" 
                      placeholder="Turnos manhã, tarde, pós-laboral, sábados..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-bloco 2: Modelos Visuais de Folhetos & Finalidades Oficiais */}
              <div style={{
                background: 'rgba(0, 32, 64, 0.45)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={18} color="#00C7FD" />
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      2. Modelos Visuais de Folhetos Publicitários & Finalidades Oficiais
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700' }}>
                    6 Modelos Estruturais Oficiais &bull; Padrão A5 Vertical (140mm x 198mm)
                  </span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  Cada um dos 6 modelos possui uma arquitetura visual, distribuição de blocos, composição gráfica e finalidade institucional completamente distintas. O modelo selecionado é aplicado na página pública de divulgação, nas descargas para redes sociais (PNG a 300 DPI) e na impressão em folha A4 (2 exemplares por página).
                </p>

                {/* Seleção Visual dos 6 Modelos de Folhetos */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Palette size={14} color="#00C7FD" />
                    <span>Selecione o Modelo Estrutural Desejado:</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                    {FLYER_TEMPLATES.map(tmpl => {
                      const isSelected = (academicForm.flyer_template || 'enrollment') === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => setAcademicForm(prev => ({
                            ...prev,
                            flyer_template: tmpl.id,
                            flyer_purpose: tmpl.id,
                            flyer_badge: tmpl.defaultBadge,
                            enrollment_title: (!prev.enrollment_title || prev.enrollment_title.startsWith('📢') || prev.enrollment_title.startsWith('🚀') || prev.enrollment_title.startsWith('⚡') || prev.enrollment_title.startsWith('🔥') || prev.enrollment_title.startsWith('🎯') || prev.enrollment_title.startsWith('📋')) ? tmpl.defaultTitle : prev.enrollment_title,
                            enrollment_period: (!prev.enrollment_period || prev.enrollment_period === 'Ano Formativo 2026' || prev.enrollment_period.includes('Oficial') || prev.enrollment_period.includes('Fins-de-Semana') || prev.enrollment_period.includes('Limitado') || prev.enrollment_period.includes('Auditório') || prev.enrollment_period.includes('Secretaria')) ? tmpl.defaultTag : prev.enrollment_period
                          }))}
                          style={{
                            cursor: 'pointer',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: isSelected ? `2px solid ${tmpl.accentColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                            background: isSelected 
                              ? 'linear-gradient(135deg, rgba(0, 199, 253, 0.16) 0%, rgba(0, 114, 206, 0.28) 100%)' 
                              : 'rgba(0, 24, 48, 0.55)',
                            boxShadow: isSelected ? `0 4px 20px ${tmpl.accentColor}33` : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '125px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: tmpl.accentColor, boxShadow: `0 0 8px ${tmpl.accentColor}` }} />
                                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#FFFFFF' }}>{tmpl.name}</span>
                              </div>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: '800',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '999px',
                                background: tmpl.accentColor,
                                color: tmpl.id === 'notice' ? '#FFFFFF' : '#01060D'
                              }}>
                                {tmpl.badgeText}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: tmpl.accentColor === '#0F172A' ? '#94A3B8' : tmpl.accentColor, fontWeight: '700', marginBottom: '0.35rem' }}>
                              {tmpl.tagline}
                            </div>
                            <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                              {tmpl.description}
                            </p>
                          </div>

                          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: isSelected ? '#34D399' : '#64748B', fontWeight: isSelected ? '700' : '500' }}>
                              {isSelected ? '✓ Modelo Ativo' : 'Clique para selecionar'}
                            </span>
                            {isSelected && <CheckCircle2 size={16} color="#34D399" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ação rápida para aplicar textos sugeridos do modelo selecionado */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                      Modelo selecionado: <strong style={{ color: '#00C7FD' }}>{FLYER_TEMPLATES.find(t => t.id === (academicForm.flyer_template || 'enrollment'))?.name || 'Inscrições Abertas'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = FLYER_TEMPLATES.find(t => t.id === (academicForm.flyer_template || 'enrollment'));
                        if (cur) {
                          setAcademicForm(prev => ({
                            ...prev,
                            enrollment_title: cur.defaultTitle,
                            flyer_badge: cur.defaultBadge,
                            enrollment_period: cur.defaultTag
                          }));
                        }
                      }}
                      style={{
                        fontSize: '0.72rem',
                        color: '#BAE6FD',
                        background: 'rgba(0, 199, 253, 0.1)',
                        border: '1px solid rgba(0, 199, 253, 0.3)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ↺ Restaurar Textos Recomendados Deste Modelo
                    </button>
                  </div>
                </div>

                {/* 2.3 Badge de Destaque / Alerta */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>
                        Etiqueta de Destaque / Urgência (Exibida no Topo do Folheto)
                      </label>
                      <input 
                        type="text" 
                        value={academicForm.flyer_badge || ''} 
                        onChange={e => setAcademicForm({ ...academicForm, flyer_badge: e.target.value })} 
                        className="form-input" 
                        placeholder="Ex: VAGAS LIMITADAS, INSCRIÇÕES ABERTAS, 100% PRÁTICO"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        💡 Sugestões:
                      </span>
                      {['VAGAS LIMITADAS', '100% PRÁTICO', 'DESCONTOS ESPECIAIS', 'CERTIFICADO OFICIAL'].map(badge => (
                        <button
                          key={badge}
                          type="button"
                          onClick={() => setAcademicForm(prev => ({ ...prev, flyer_badge: badge }))}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(0, 199, 253, 0.1)',
                            border: '1px solid rgba(0, 199, 253, 0.3)',
                            color: '#BAE6FD',
                            cursor: 'pointer'
                          }}
                        >
                          {badge}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2.4 Pré-visualização Real do Folheto A5 e Botões de Download */}
                <div style={{
                  background: 'rgba(2, 11, 20, 0.85)',
                  border: '1px solid rgba(0, 199, 253, 0.35)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Sparkles size={16} color="#00C7FD" />
                        <span>Pré-Visualização do Folheto Selecionado (Modelo: {FLYER_TEMPLATES.find(t => t.id === (academicForm.flyer_template || 'enrollment'))?.name || 'Inscrições Abertas'})</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        Fidelidade gráfica exata para impressão e redes sociais (A5: 140mm x 198mm)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAdminDownloadPng}
                        disabled={adminDownloading}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        title="Baixar imagem A5 de alta definição pronta para Instagram, Facebook e WhatsApp"
                      >
                        <Download size={14} color="#00C7FD" />
                        <span>Baixar Imagem PNG (300 DPI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAdminDownloadPdf}
                        disabled={adminDownloading}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        title="Baixar documento em página única A5 vertical"
                      >
                        <FileText size={14} color="#10B981" />
                        <span>Baixar Documento PDF</span>
                      </button>

                      <a
                        href="/inscricoes-abertas?print=a5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        title="Imprimir folha A4 com 2 panfletos A5"
                      >
                        <Printer size={14} color="#F59E0B" />
                        <span>Imprimir 2x A5 em A4</span>
                      </a>
                    </div>
                  </div>

                  {adminDownloadToast && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.85rem',
                      color: '#34D399',
                      fontSize: '0.8rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <CheckCircle2 size={15} />
                      <span>{adminDownloadToast}</span>
                    </div>
                  )}

                  {/* Moldura de Exibição do Folheto */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1rem 0.5rem',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <div
                      ref={adminFlyerRef}
                      id="admin-settings-flyer-capture"
                      style={{
                        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 199, 253, 0.25)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: '#FFFFFF'
                      }}
                    >
                      <A5Flyer 
                        instanceKey={`admin-preview-${academicForm.flyer_template || 'enrollment'}`}
                        template={academicForm.flyer_template || 'enrollment'}
                        purpose={academicForm.flyer_purpose || 'enrollment'}
                        inst={instForm}
                        academic={academicForm}
                        officialFlyerImage={academicForm.enrollment_flyer_image || DEFAULT_IT_STUDY_IMAGES[adminFlyerPreviewIndex]}
                        qrCodeUrl={adminQrCodeUrl}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-bloco 3: Fotografia de Informática para Folheto A5 */}
              <div style={{
                background: 'rgba(0, 32, 64, 0.45)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ImageIcon size={18} color="#00C7FD" />
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    Fotografia de Informática para o Folheto A5 & Materiais Impressos
                  </h3>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  A imagem carregada será integrada aos folhetos oficiais em formato A5 (impressos aos pares numa folha A4). Se o Administrador não carregar uma imagem personalizada, o sistema selecionará automaticamente fotografias de alta resolução de pessoas a estudar informática do catálogo integrado.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Visualizador com Rotação */}
                  <div style={{
                    width: '140px',
                    height: '95px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: '#0B192C',
                    border: '1px solid rgba(0, 199, 253, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0
                  }}>
                    {academicForm.enrollment_flyer_image ? (
                      <img 
                        src={academicForm.enrollment_flyer_image} 
                        alt="Folheto A5 Informática" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {DEFAULT_IT_STUDY_IMAGES.map((imgUrl, i) => (
                          <img 
                            key={i}
                            src={imgUrl} 
                            alt="Foto em rotação"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: adminFlyerPreviewIndex === i ? 1 : 0,
                              transition: 'opacity 0.75s ease-in-out'
                            }}
                          />
                        ))}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          insetInline: 0,
                          background: 'rgba(0, 24, 48, 0.9)',
                          fontSize: '0.62rem',
                          color: '#00C7FD',
                          padding: '2px 4px',
                          textAlign: 'center',
                          fontWeight: '700',
                          borderTop: '1px solid rgba(0, 199, 253, 0.3)'
                        }}>
                          Rotativo ({adminFlyerPreviewIndex + 1}/4)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles de Upload e Remoção */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      {academicForm.enrollment_flyer_image ? 'Substituir Imagem do Folheto:' : 'Carregar Imagem Personalizada (Opcional):'}
                    </label>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/webp" 
                      onChange={handleFlyerImageUpload} 
                      disabled={flyerUploading}
                      className="form-input" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {academicForm.enrollment_flyer_image ? (
                        <button
                          type="button"
                          onClick={handleRemoveFlyerImage}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          <Trash2 size={13} />
                          <span>Restaurar Modo Automático / Rotativo</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#10B981' }}>
                          ✓ Modo Automático Zaty Academy activado (rotativo entre as 4 fotografias oficiais)
                        </span>
                      )}

                      {flyerUploading && (
                        <span style={{ fontSize: '0.75rem', color: '#00C7FD' }}>
                          A carregar imagem...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Galeria das 4 Fotografias Oficiais */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#E2E8F0' }}>
                      Fotografias Oficiais Aprovadas (Clique para fixar uma ou deixe no Modo Rotativo):
                    </span>
                    {!academicForm.enrollment_flyer_image && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        Modo Rotativo Activo
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { url: DEFAULT_IT_STUDY_IMAGES[0], label: '1. Laboratório Informática' },
                      { url: DEFAULT_IT_STUDY_IMAGES[1], label: '2. Prática em Computador' },
                      { url: DEFAULT_IT_STUDY_IMAGES[2], label: '3. Elaboração de Documentos' },
                      { url: DEFAULT_IT_STUDY_IMAGES[3], label: '4. Formador com Estudante' }
                    ].map((item, idx) => {
                      const isSelected = academicForm.enrollment_flyer_image === item.url;
                      const isAutoRotatingActive = !academicForm.enrollment_flyer_image && adminFlyerPreviewIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveFlyerImage();
                            } else {
                              setAcademicForm(prev => ({ ...prev, enrollment_flyer_image: item.url }));
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: isSelected 
                              ? '2px solid #00C7FD' 
                              : (isAutoRotatingActive ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)'),
                            background: '#0B192C',
                            transition: 'all 0.25s ease',
                            boxShadow: isSelected 
                              ? '0 0 12px rgba(0, 199, 253, 0.5)' 
                              : (isAutoRotatingActive ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'),
                            position: 'relative'
                          }}
                          title={isSelected ? 'Clique para desmarcar (voltar ao modo rotativo automático)' : `Fixar ${item.label}`}
                        >
                          <div style={{ height: '70px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                            <img 
                              src={item.url} 
                              alt={item.label} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            {isAutoRotatingActive && (
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                background: 'rgba(16, 185, 129, 0.9)',
                                color: '#FFFFFF',
                                fontSize: '0.6rem',
                                fontWeight: '800',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                letterSpacing: '0.02em'
                              }}>
                                A EXIBIR
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            padding: '0.35rem 0.45rem', 
                            fontSize: '0.68rem', 
                            color: isSelected ? '#00C7FD' : (isAutoRotatingActive ? '#34D399' : '#CBD5E1'), 
                            fontWeight: isSelected || isAutoRotatingActive ? '700' : '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: isSelected ? 'rgba(0, 199, 253, 0.1)' : (isAutoRotatingActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent')
                          }}>
                            {item.label}
                          </div>
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: '#00C7FD',
                              color: '#001E3D',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-bloco 3: Kit de Redes Sociais */}
              <div style={{
                background: 'rgba(0, 42, 78, 0.45)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '8px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} color="#00C7FD" />
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      Kit de Divulgação Oficial & Redes Sociais
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Link Directo para o Edital & Inscrição Online
                  </span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Dispare campanhas oficiais nas redes sociais institucionais (WhatsApp, Facebook, Instagram e TikTok) orientando o público para a página de edital com o botão destacado de <strong>INSCRIÇÃO ONLINE</strong>.
                </p>

                {/* Botões de Ação Rápida por Plataforma */}
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={() => {
                      const { caption } = getSocialShareData();
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ background: '#25D366', color: '#FFFFFF', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>WhatsApp</span>
                    <ExternalLink size={12} />
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => {
                      const { officialUrl } = getSocialShareData();
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(officialUrl)}`, '_blank');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ background: '#1877F2', color: '#FFFFFF', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Facebook</span>
                    <ExternalLink size={12} />
                  </button>

                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => {
                      const { caption } = getSocialShareData();
                      handleCopySocialText('instagram', caption);
                      window.open('https://www.instagram.com', '_blank');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)', color: '#FFFFFF', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>{copiedSocial === 'instagram' ? 'Legenda Copiada!' : 'Instagram (Copiar + Abrir)'}</span>
                  </button>

                  {/* TikTok */}
                  <button
                    type="button"
                    onClick={() => {
                      const { caption } = getSocialShareData();
                      handleCopySocialText('tiktok', caption);
                      window.open('https://www.tiktok.com', '_blank');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ background: '#000000', color: '#FFFFFF', border: '1px solid #334155', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>{copiedSocial === 'tiktok' ? 'Texto Copiado!' : 'TikTok (Copiar + Abrir)'}</span>
                  </button>

                  {/* Copiar Link Oficial */}
                  <button
                    type="button"
                    onClick={() => {
                      const { officialUrl } = getSocialShareData();
                      handleCopySocialText('link', officialUrl);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {copiedSocial === 'link' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copiedSocial === 'link' ? 'Link Copiado!' : 'Copiar Link Oficial'}</span>
                  </button>
                </div>

                {/* Caixa de Texto Padronizado */}
                <div style={{
                  background: 'rgba(0, 24, 48, 0.7)',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 163, 224, 0.2)',
                  padding: '0.85rem 1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>
                      Mensagem Oficial Pré-formatada para Redes Sociais:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const { caption } = getSocialShareData();
                        handleCopySocialText('caption', caption);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                    >
                      {copiedSocial === 'caption' ? '✓ Copiado!' : 'Copiar Mensagem'}
                    </button>
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#CBD5E1',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4',
                    maxHeight: '110px',
                    overflowY: 'auto'
                  }}>
                    {getSocialShareData().caption}
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              ABA 4: PAGAMENTOS MÓVEIS (M-PESA, E-MOLA, MKESH)
              ============================================================ */}
          {activeTab === 'payments' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <Smartphone size={20} color="#00C7FD" />
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Configuração dos Canais de Pagamento Móvel (M-Pesa, e-Mola, mKesh)
                </h2>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                Estes números e instruções são exibidos dinamicamente aos alunos no ato do pagamento de matrículas e propinas.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* M-Pesa */}
                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '8px', padding: '1.25rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: paymentForm.mpesa.enabled ? '#EF4444' : '#64748B' }} />
                      <strong style={{ color: '#EF4444', fontSize: '1.05rem' }}>Vodacom M-Pesa</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', color: paymentForm.mpesa.enabled ? '#34D399' : '#94A3B8', fontWeight: '600' }}>
                      <input 
                        type="checkbox" 
                        checked={paymentForm.mpesa.enabled} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mpesa: { ...paymentForm.mpesa, enabled: e.target.checked }
                        })} 
                        style={{ width: '15px', height: '15px', accentColor: '#EF4444' }}
                      />
                      {paymentForm.mpesa.enabled ? 'Activo para Recebimento' : 'Desactivado'}
                    </label>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Número Oficial M-Pesa *</label>
                      <input 
                        type="text" 
                        value={paymentForm.mpesa.number} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mpesa: { ...paymentForm.mpesa, number: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nome do Titular da Conta *</label>
                      <input 
                        type="text" 
                        value={paymentForm.mpesa.holder} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mpesa: { ...paymentForm.mpesa, holder: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Instruções de Pagamento Exibidas ao Aluno</label>
                    <textarea 
                      value={paymentForm.mpesa.instructions} 
                      onChange={e => setPaymentForm({
                        ...paymentForm,
                        mpesa: { ...paymentForm.mpesa, instructions: e.target.value }
                      })} 
                      className="form-textarea" 
                      rows="2" 
                    />
                  </div>
                </div>

                {/* e-Mola */}
                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '8px', padding: '1.25rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: paymentForm.emola.enabled ? '#F59E0B' : '#64748B' }} />
                      <strong style={{ color: '#F59E0B', fontSize: '1.05rem' }}>Movitel e-Mola</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', color: paymentForm.emola.enabled ? '#34D399' : '#94A3B8', fontWeight: '600' }}>
                      <input 
                        type="checkbox" 
                        checked={paymentForm.emola.enabled} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          emola: { ...paymentForm.emola, enabled: e.target.checked }
                        })} 
                        style={{ width: '15px', height: '15px', accentColor: '#F59E0B' }}
                      />
                      {paymentForm.emola.enabled ? 'Activo para Recebimento' : 'Desactivado'}
                    </label>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Número Oficial e-Mola *</label>
                      <input 
                        type="text" 
                        value={paymentForm.emola.number} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          emola: { ...paymentForm.emola, number: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nome do Titular da Conta *</label>
                      <input 
                        type="text" 
                        value={paymentForm.emola.holder} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          emola: { ...paymentForm.emola, holder: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Instruções de Pagamento Exibidas ao Aluno</label>
                    <textarea 
                      value={paymentForm.emola.instructions} 
                      onChange={e => setPaymentForm({
                        ...paymentForm,
                        emola: { ...paymentForm.emola, instructions: e.target.value }
                      })} 
                      className="form-textarea" 
                      rows="2" 
                    />
                  </div>
                </div>

                {/* mKesh */}
                <div style={{ background: 'rgba(0, 24, 48, 0.7)', borderRadius: '8px', padding: '1.25rem', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: paymentForm.mkesh.enabled ? '#00C7FD' : '#64748B' }} />
                      <strong style={{ color: '#00C7FD', fontSize: '1.05rem' }}>Tmcel mKesh</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', color: paymentForm.mkesh.enabled ? '#34D399' : '#94A3B8', fontWeight: '600' }}>
                      <input 
                        type="checkbox" 
                        checked={paymentForm.mkesh.enabled} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mkesh: { ...paymentForm.mkesh, enabled: e.target.checked }
                        })} 
                        style={{ width: '15px', height: '15px', accentColor: '#00C7FD' }}
                      />
                      {paymentForm.mkesh.enabled ? 'Activo para Recebimento' : 'Desactivado'}
                    </label>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Número Oficial mKesh *</label>
                      <input 
                        type="text" 
                        value={paymentForm.mkesh.number} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mkesh: { ...paymentForm.mkesh, number: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nome do Titular da Conta *</label>
                      <input 
                        type="text" 
                        value={paymentForm.mkesh.holder} 
                        onChange={e => setPaymentForm({
                          ...paymentForm,
                          mkesh: { ...paymentForm.mkesh, holder: e.target.value }
                        })} 
                        required 
                        className="form-input" 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Instruções de Pagamento Exibidas ao Aluno</label>
                    <textarea 
                      value={paymentForm.mkesh.instructions} 
                      onChange={e => setPaymentForm({
                        ...paymentForm,
                        mkesh: { ...paymentForm.mkesh, instructions: e.target.value }
                      })} 
                      className="form-textarea" 
                      rows="2" 
                    />
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              ABA 5: ATENDIMENTO & TERMOS LEGAIS
              ============================================================ */}
          {activeTab === 'support' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <Headphones size={20} color="#00C7FD" />
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Canais Oficiais de Atendimento & Termos ao Aluno
                </h2>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                Facilite a comunicação com os formandos fornecendo contacto direto de WhatsApp, horários de atendimento e regulamento de matrícula.
              </p>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Número do WhatsApp de Suporte Académico</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={contactForm.whatsapp_number} 
                      onChange={e => setContactForm({ ...contactForm, whatsapp_number: e.target.value })} 
                      className="form-input" 
                      placeholder="+258 84 000 0000"
                    />
                    {contactForm.whatsapp_number && (
                      <a
                        href={`https://wa.me/${contactForm.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        title="Testar Link do WhatsApp"
                        style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                      >
                        <ExternalLink size={14} />
                        <span>Testar</span>
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Utilizado no botão de WhatsApp do portal público e nas mensagens automáticas.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Horário de Funcionamento / Atendimento</label>
                  <input 
                    type="text" 
                    value={contactForm.support_hours} 
                    onChange={e => setContactForm({ ...contactForm, support_hours: e.target.value })} 
                    className="form-input" 
                    placeholder="Segunda a Sexta, das 08h às 17h"
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    Exibido no rodapé do website e nos comprovativos de inscrição.
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                <label className="form-label">Termos e Condições / Aviso Legal para Inscrição</label>
                <textarea 
                  rows="3"
                  value={contactForm.terms_notice} 
                  onChange={e => setContactForm({ ...contactForm, terms_notice: e.target.value })} 
                  className="form-textarea" 
                  placeholder="Exibido na etapa final do formulário de inscrição aos formandos..."
                />
                <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Texto do termo de responsabilidade e aceitação dos regulamentos no ato da inscrição.
                </span>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              ABA 6: PERFIL DO ADMINISTRADOR & FOTO
              ============================================================ */}
          {activeTab === 'profile' && (
            <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <UserCheck size={20} color="#00C7FD" />
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Perfil do Administrador & Foto de Exibição
                </h2>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                Esta fotografia representa a sua conta no menu lateral (Sidebar), barra superior e nas auditorias de ações. O carregamento é ultra rápido e otimizado.
              </p>

              {adminPhotoMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px', padding: '0.6rem 0.9rem', color: '#34D399', marginBottom: '1.25rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{adminPhotoMsg}</span>
                </div>
              )}

              {adminPhotoError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', padding: '0.6rem 0.9rem', color: '#F87171', marginBottom: '1.25rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{adminPhotoError}</span>
                </div>
              )}

              <div style={{ 
                background: 'rgba(0, 24, 48, 0.7)', 
                border: '1px solid rgba(0, 163, 224, 0.25)', 
                borderRadius: '8px', 
                padding: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.75rem', 
                flexWrap: 'wrap' 
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #002D5A 0%, #001A33 100%)',
                    border: '2px solid #00C7FD',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0, 199, 253, 0.25)'
                  }}>
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Foto de perfil" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Shield size={40} color="#00C7FD" />
                    )}
                  </div>

                  {adminPhotoUploading && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 20, 40, 0.75)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <RefreshCw size={24} color="#00C7FD" className="spin-animation" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF' }}>
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    {user?.email}
                  </div>
                  <div style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'rgba(0, 199, 253, 0.15)', border: '1px solid rgba(0, 199, 253, 0.35)', color: '#00C7FD', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                    {profile?.role === 'super_admin' ? 'Super Administrador' : (profile?.role || 'Administrador')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Camera size={14} />
                      <span>{profile?.avatar_url ? 'Alterar Foto de Perfil' : 'Carregar Nova Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp" 
                        onChange={handleAvatarUpload}
                        disabled={adminPhotoUploading}
                        style={{ display: 'none' }} 
                      />
                    </label>

                    {profile?.avatar_url && (
                      <button 
                        type="button" 
                        onClick={handleAvatarRemove}
                        disabled={adminPhotoUploading}
                        className="btn btn-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Trash2 size={14} />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÃO DA ABA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ✓ As alterações gravadas sincronizam todo o sistema Zaty Academy em tempo real.
                </span>
                <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-md mobile-btn-full">
                  <Save size={16} />
                  {saving ? 'A GRAVAR...' : 'GRAVAR TODAS AS CONFIGURAÇÕES'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .settings-tab-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

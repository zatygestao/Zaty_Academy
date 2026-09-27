import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import { 
  getSupportConversationsList, 
  getChatMessages, 
  sendChatMessage, 
  manageChatBlock,
  getStudents,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  replyToContactMessage,
  markContactMessageReadStatus,
  updateContactMessagePriority,
  deduplicateReplies
} from '../../services/api';
import { subscribeToChatMessages, subscribeToContactMessages } from '../../services/realtimeService';
import { supabase } from '../../config/supabase';
import { formatDateTime } from '../../utils/formatters';
import { formatLocationLabel, formatDeviceLabel } from '../../utils/deviceTracker';
import { 
  Headphones, 
  MessageSquare, 
  ShieldAlert, 
  ShieldCheck, 
  Send, 
  User, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  X,
  Lock,
  Unlock,
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  Archive,
  CheckCircle,
  FileText,
  MapPin,
  Laptop,
  Check,
  Eye,
  EyeOff,
  Flag,
  Reply,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CornerDownRight,
  MessageCircle,
  Shield
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    id: 'cursos',
    label: 'Cursos & Inscrições',
    subject: 'Informações sobre Cursos e Inscrições na Zaty Academy',
    body: 'Olá! Agradecemos o seu contacto com a Zaty Academy.\n\nInformamos que as inscrições para os nossos cursos práticos de Informática, Redes de Computadores, Design Gráfico e Programação encontram-se abertas. Dispomos de turmas presenciais nos períodos da manhã, tarde e pós-laboral (noite).\n\nPode consultar o plano de cursos em https://zatyacademy.co.mz/cursos ou visitar a nossa secretaria em Namicopo, Nampula (próximo à 3ª Esquadra).\n\nEstamos à sua inteira disposição!'
  },
  {
    id: 'horarios',
    label: 'Horários & Turmas',
    subject: 'Horários e Disponibilidade de Turmas - Zaty Academy',
    body: 'Olá! As nossas turmas contam com metodologia 100% prática e postos de trabalho individuais com computadores modernos.\n\nHorários habituais:\n- Manhã: 08h00 às 10h00 / 10h00 às 12h00\n- Tarde: 14h00 às 16h00 / 16h00 às 18h00\n- Noturno: 18h00 às 20h00\n\nGostaria de reservar a sua vaga em qual destes períodos?'
  },
  {
    id: 'precos',
    label: 'Propinas & Pagamento',
    subject: 'Condições de Pagamento e Propinas - Zaty Academy',
    body: 'Olá! As propinas dos nossos cursos podem ser liquidadas em prestações mensais flexíveis.\n\nFormas de pagamento aceites:\n- M-Pesa\n- E-Mola\n- Transferência / Depósito Bancário\n- Pagamento direto na Secretaria\n\nPodemos emitir a fatura pró-forma ou orientar na sua matrícula imediata.'
  },
  {
    id: 'telefone',
    label: 'Tentativa de Chamada',
    subject: 'Tentativa de Contacto Telefónico - Zaty Academy',
    body: 'Olá! Tentámos entrar em contacto telefónico consigo através do número indicado no formulário de contacto.\n\nFicamos inteiramente ao seu dispor para esclarecer dúvidas. Se preferir, pode também falar connosco diretamente pelo nosso WhatsApp institucional (+258 834 847 306).'
  }
];

export default function SupportManagement() {
  const { user, profile } = useAuth();
  const adminId = user?.id;
  const userRole = profile?.role || 'admin';
  const isAuthorized = ['super_admin', 'admin', 'secretaria'].includes(userRole);
  const adminUserName = profile?.full_name || profile?.name || user?.email || 'Administração Zaty Academy';

  const [activeTab, setActiveTab] = useState('support'); // 'support', 'contacts' ou 'moderation'

  // Aba de Suporte
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Aba de Mensagens do Site
  const [contactMessages, setContactMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('todos');
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContactModal, setSelectedContactModal] = useState(null);
  const [savingContactStatus, setSavingContactStatus] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [contactReplyText, setContactReplyText] = useState('');
  const [contactReplySubject, setContactReplySubject] = useState('');
  const [contactReplyChannel, setContactReplyChannel] = useState('sistema');
  const [sendingContactReply, setSendingContactReply] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showMobileContactDetail, setShowMobileContactDetail] = useState(false);

  // Aba de Moderação
  const [chatBlocks, setChatBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [blockForm, setBlockForm] = useState({ student_id: '', reason: '' });
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [blockError, setBlockError] = useState('');

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const loadSupportConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await getSupportConversationsList();
      setConversations(data || []);
      if (data && data.length > 0 && !selectedConversation) {
        handleSelectConversation(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas de suporte:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadContactMessages = async () => {
    setLoadingContacts(true);
    try {
      const data = await getContactMessages();
      const list = data || [];
      setContactMessages(list);
      if (list.length > 0 && !selectedContactId && typeof window !== 'undefined' && window.innerWidth > 768) {
        setSelectedContactId(list[0].id);
        setContactReplySubject(list[0].subject ? `Re: ${list[0].subject}` : 'Re: Contacto Zaty Academy');
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens de contacto:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadStudentsData = async () => {
    setLoadingStudents(true);
    try {
      const res = await getStudents({ limit: 500 });
      const studs = Array.isArray(res) ? res : (res?.students || []);
      setStudentsList(studs);
    } catch (err) {
      console.warn('Aviso ao carregar lista de estudantes:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadModerationData = async () => {
    setLoadingBlocks(true);
    try {
      const { data, error } = await supabase
        .from('academy_chat_blocks')
        .select('*, student:academy_students(id, full_name, email, student_code)')
        .order('blocked_at', { ascending: false });

      if (!error && data) {
        setChatBlocks(data);
      }
    } catch (err) {
      console.error('Erro ao carregar bloqueios de chat:', err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  useEffect(() => {
    loadSupportConversations();
    loadModerationData();
    loadContactMessages();
    loadStudentsData();

    // Subscrição em Tempo Real para mensagens do formulário de contacto do site
    const contactSub = subscribeToContactMessages(() => {
      loadContactMessages();
    });

    return () => {
      if (contactSub?.unsubscribe) contactSub.unsubscribe();
    };
  }, []);

  const getMatchedStudent = (msg) => {
    if (!msg || !Array.isArray(studentsList) || studentsList.length === 0) return null;
    const cleanMsgPhone = (msg.phone || '').replace(/\D/g, '');
    const cleanMsgEmail = (msg.email || '').toLowerCase().trim();

    return studentsList.find(s => {
      const sEmail = (s.email || '').toLowerCase().trim();
      if (cleanMsgEmail && sEmail && sEmail === cleanMsgEmail) return true;
      const sPhone = (s.phone || '').replace(/\D/g, '');
      if (cleanMsgPhone && sPhone) {
        if (sPhone === cleanMsgPhone) return true;
        if (cleanMsgPhone.endsWith(sPhone) || sPhone.endsWith(cleanMsgPhone)) return true;
      }
      return false;
    });
  };

  const handleSelectContactMessage = (msg) => {
    setSelectedContactId(msg.id);
    setShowMobileContactDetail(true);
    setContactReplySubject(msg.subject ? `Re: ${msg.subject}` : 'Re: Contacto Zaty Academy');
    setSelectedTemplateId('');
    if (!msg.is_read) {
      handleToggleReadStatus(msg.id, false, false);
    }
  };

  const handleToggleReadStatus = async (contactId, currentIsRead, notify = true) => {
    const nextState = !currentIsRead;
    setContactMessages(prev => prev.map(m => m.id === contactId ? {
      ...m,
      is_read: nextState,
      read_at: nextState ? new Date().toISOString() : null
    } : m));

    try {
      await markContactMessageReadStatus(contactId, nextState, adminId);
      if (notify) {
        showToast(nextState ? 'Mensagem marcada como lida' : 'Mensagem marcada como não lida', 'info');
      }
    } catch (err) {
      console.error('Erro ao alternar estado de leitura:', err);
    }
  };

  const handlePriorityChange = async (contactId, newPriority) => {
    setContactMessages(prev => prev.map(m => m.id === contactId ? { ...m, priority: newPriority } : m));
    try {
      await updateContactMessagePriority(contactId, newPriority, adminId);
      showToast(`Prioridade definida como ${newPriority.toUpperCase()}`, 'info');
    } catch (err) {
      console.error('Erro ao atualizar prioridade:', err);
      showToast('Falha ao atualizar prioridade.', 'error');
    }
  };

  const handleSendInAppReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAuthorized) {
      showToast('Não tem autorização para enviar respostas.', 'error');
      return;
    }
    const activeMsg = contactMessages.find(m => m.id === selectedContactId);
    if (!activeMsg || sendingContactReply) return;

    const trimmedMsg = (contactReplyText || '').trim();
    if (!trimmedMsg) {
      showToast('Por favor, escreva a sua mensagem antes de enviar.', 'error');
      return;
    }
    if (trimmedMsg.length < 3) {
      showToast('A resposta deve ter pelo menos 3 caracteres.', 'error');
      return;
    }

    setSendingContactReply(true);
    try {
      const subject = (contactReplySubject || '').trim() || `Re: ${activeMsg.subject || 'Contacto Zaty Academy'}`;
      const updated = await replyToContactMessage({
        contactId: activeMsg.id,
        message: trimmedMsg,
        subject,
        channel: contactReplyChannel || 'sistema',
        adminUserId: adminId,
        adminUserName,
        adminUserRole: userRole
      });

      // Atualiza o estado da lista garantindo ausência de duplicatas
      const nextReplies = deduplicateReplies(
        (updated && Array.isArray(updated.replies) && updated.replies.length > 0)
          ? updated.replies
          : activeMsg.replies || []
      );

      setContactMessages(prev => prev.map(m => m.id === activeMsg.id ? {
        ...m,
        ...updated,
        replies: nextReplies,
        status: 'respondido',
        is_read: true,
        responded_at: updated?.responded_at || new Date().toISOString()
      } : m));

      // Se o canal escolhido for email e houver email válido, disparar Gmail Web também para conveniência
      if (contactReplyChannel === 'email' && activeMsg.email) {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(activeMsg.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmedMsg)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      }

      setContactReplyText('');
      setSelectedTemplateId('');
      showToast('Resposta registada e enviada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
      showToast(`Falha ao registar resposta: ${err.message}`, 'error');
    } finally {
      setSendingContactReply(false);
    }
  };

  const handleOpenEmailGmail = async (msg, replyBody = null, replySubject = null) => {
    if (!msg?.email) {
      showToast('Endereço de e-mail não disponível para este contacto.', 'error');
      return;
    }
    const subject = replySubject || contactReplySubject || `Re: ${msg.subject || 'Contacto Zaty Academy'}`;
    const rawBody = (replyBody || contactReplyText || '').trim();
    const body = rawBody || (
      `Olá ${msg.name || ''},\n\n` +
      `Agradecemos o seu contacto através da plataforma da Zaty Academy.\n\n` +
      `Em resposta à sua solicitação sobre "${msg.subject || 'Informações'}":\n` +
      `"${msg.message || ''}"\n\n` +
      `[Escreva aqui a sua resposta]\n\n` +
      `Com os melhores cumprimentos,\n` +
      `Equipa Zaty Academy\n` +
      `Namicopo – Nampula, Moçambique\n` +
      `+258 834 847 306 | info@zatyacademy.co.mz\n` +
      `https://zatyacademy.co.mz`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    showToast('A abrir composição no Gmail...', 'info');

    // Se o admin redigiu uma resposta, registar automaticamente no sistema, histórico e notificar o utilizador
    if (rawBody && rawBody.length >= 3) {
      try {
        const updated = await replyToContactMessage({
          contactId: msg.id,
          message: rawBody,
          subject,
          channel: 'email',
          adminUserId: adminId,
          adminUserName,
          adminUserRole: userRole
        });

        const nextReplies = deduplicateReplies(
          (updated && Array.isArray(updated.replies) && updated.replies.length > 0)
            ? updated.replies
            : msg.replies || []
        );

        setContactMessages(prev => prev.map(m => m.id === msg.id ? {
          ...m,
          ...updated,
          replies: nextReplies,
          status: 'respondido',
          is_read: true,
          responded_at: updated?.responded_at || new Date().toISOString()
        } : m));

        setContactReplyText('');
        setSelectedTemplateId('');
        showToast('Cópia da resposta por e-mail registada no histórico do utilizador!', 'success');
      } catch (err) {
        console.warn('Aviso ao registar histórico de resposta por e-mail:', err);
      }
    }
  };

  const handleOpenEmailClient = async (msg, replyBody = null, replySubject = null) => {
    if (!msg?.email) {
      showToast('Endereço de e-mail não disponível para este contacto.', 'error');
      return;
    }
    const subject = replySubject || contactReplySubject || `Re: ${msg.subject || 'Contacto Zaty Academy'}`;
    const rawBody = (replyBody || contactReplyText || '').trim();
    const body = rawBody || (
      `Olá ${msg.name || ''},\n\n` +
      `Agradecemos o seu contacto com a Zaty Academy.\n\n` +
      `Em resposta à sua questão sobre "${msg.subject || 'Informações'}":\n\n` +
      `[Escreva aqui a sua resposta]\n\n` +
      `Com os melhores cumprimentos,\n` +
      `Equipa Zaty Academy\n` +
      `Namicopo – Nampula, Moçambique\n` +
      `+258 834 847 306`
    );

    // Usa âncora temporária sem _blank para disparar o mailto para o cliente local do sistema sem abrir uma página em branco no navegador
    const mailtoUri = `mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const anchor = document.createElement('a');
    anchor.href = mailtoUri;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 500);
    showToast('A iniciar cliente de e-mail do dispositivo...', 'info');

    // Se o admin redigiu uma resposta, registar automaticamente no sistema, histórico e notificar o utilizador
    if (rawBody && rawBody.length >= 3) {
      try {
        const updated = await replyToContactMessage({
          contactId: msg.id,
          message: rawBody,
          subject,
          channel: 'email',
          adminUserId: adminId,
          adminUserName,
          adminUserRole: userRole
        });

        const nextReplies = deduplicateReplies(
          (updated && Array.isArray(updated.replies) && updated.replies.length > 0)
            ? updated.replies
            : msg.replies || []
        );

        setContactMessages(prev => prev.map(m => m.id === msg.id ? {
          ...m,
          ...updated,
          replies: nextReplies,
          status: 'respondido',
          is_read: true,
          responded_at: updated?.responded_at || new Date().toISOString()
        } : m));

        setContactReplyText('');
        setSelectedTemplateId('');
        showToast('Cópia da resposta por e-mail registada no histórico do utilizador!', 'success');
      } catch (err) {
        console.warn('Aviso ao registar histórico de resposta por e-mail:', err);
      }
    }
  };

  const openWhatsAppContact = (msg, customText = null) => {
    let cleanPhone = (msg.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 9) cleanPhone = '258' + cleanPhone;
    const defaultText = `Olá ${msg.name}! Sou da Direção / Atendimento da Zaty Academy em Nampula. Entramos em contacto a respeito da sua mensagem no nosso site sobre "${msg.subject}". Em que podemos ajudar?`;
    const text = encodeURIComponent(customText || contactReplyText || defaultText);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    showToast('A abrir WhatsApp...', 'info');
  };

  const handleApplyTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setContactReplySubject(tpl.subject);
    setContactReplyText(tpl.body);
    showToast(`Modelo "${tpl.label}" carregado no editor`, 'info');
  };

  const handleCopyText = (text, label = 'Conteúdo') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado com sucesso!`, 'success');
  };

  const handleUpdateContactStatus = async (contactId, newStatus, notes = null) => {
    setSavingContactStatus(true);
    try {
      await updateContactMessageStatus(contactId, {
        status: newStatus,
        adminNotes: notes,
        adminUserId: adminId
      });
      await loadContactMessages();
      if (selectedContactModal && selectedContactModal.id === contactId) {
        setSelectedContactModal(prev => ({
          ...prev,
          status: newStatus,
          admin_notes: notes !== null ? notes : prev?.admin_notes
        }));
      }
      showToast(`Estado atualizado para "${newStatus.replace('_', ' ')}"`, 'success');
    } catch (err) {
      showToast(`Falha ao atualizar estado: ${err.message}`, 'error');
    } finally {
      setSavingContactStatus(false);
    }
  };

  const handleSaveContactNotes = async (contactId) => {
    setSavingContactStatus(true);
    try {
      await updateContactMessageStatus(contactId, {
        adminNotes: adminNotesDraft,
        adminUserId: adminId
      });
      await loadContactMessages();
      if (selectedContactModal) {
        setSelectedContactModal(prev => ({ ...prev, admin_notes: adminNotesDraft }));
      }
      showToast('Nota interna guardada com sucesso!', 'success');
    } catch (err) {
      showToast(`Erro ao guardar nota: ${err.message}`, 'error');
    } finally {
      setSavingContactStatus(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Tem a certeza de que deseja eliminar esta mensagem de contacto?')) return;
    try {
      await deleteContactMessage(contactId, adminId);
      if (selectedContactModal?.id === contactId) {
        setSelectedContactModal(null);
      }
      if (selectedContactId === contactId) {
        setSelectedContactId(null);
      }
      await loadContactMessages();
      showToast('Mensagem eliminada com sucesso.', 'info');
    } catch (err) {
      showToast(`Erro ao eliminar mensagem: ${err.message}`, 'error');
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const msgs = await getChatMessages(conv.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  // Sincronização em Tempo Real (WebSockets) com fallback periódico
  useEffect(() => {
    if (!selectedConversation?.id) return;

    // Subscrição instantânea via Supabase Realtime
    const sub = subscribeToChatMessages(selectedConversation.id, (newMsg) => {
      if (!newMsg) return;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0)) < 3000))) {
          return prev;
        }
        return [...prev, newMsg];
      });
    });

    // Fallback de segurança (15s)
    const interval = setInterval(async () => {
      try {
        const msgs = await getChatMessages(selectedConversation.id);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      } catch (_) {}
    }, 15000);

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
      clearInterval(interval);
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation?.id || sendingReply) return;

    const content = replyText.trim();
    setReplyText('');
    setSendingReply(true);

    try {
      const sent = await sendChatMessage({
        conversationId: selectedConversation.id,
        senderId: adminId,
        senderRole: 'admin',
        senderName: 'Suporte Zaty Academy',
        content
      });

      if (sent) {
        setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent]));
      }
      await loadSupportConversations();
    } catch (err) {
      console.error('Erro ao responder ticket:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleOpenBlockModal = async () => {
    setIsBlockModalOpen(true);
    setBlockError('');
    setBlockForm({ student_id: '', reason: '' });
    setLoadingStudents(true);
    try {
      const res = await getStudents({ limit: 200 });
      const studs = Array.isArray(res) ? res : (res?.students || []);
      setStudentsList(studs);
      if (studs && studs.length > 0) {
        setBlockForm({ student_id: studs[0].id, reason: '' });
      }
    } catch (err) {
      console.error('Erro ao carregar lista de estudantes:', err);
      setBlockError('Falha ao carregar lista de estudantes para suspensão.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    if (!blockForm.student_id || !blockForm.reason.trim()) {
      setBlockError('Selecione um estudante e forneça o motivo da suspensão.');
      return;
    }

    setSubmittingBlock(true);
    setBlockError('');

    try {
      await manageChatBlock({
        action: 'bloquear',
        studentId: blockForm.student_id,
        reason: blockForm.reason,
        adminId
      });

      setIsBlockModalOpen(false);
      await loadModerationData();
    } catch (err) {
      console.error('Erro ao bloquear estudante:', err);
      setBlockError(err.message || 'Falha ao aplicar suspensão.');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleReactivateBlock = async (blockId) => {
    if (!window.confirm('Confirma a reativação do acesso ao chat para este estudante?')) return;
    try {
      await manageChatBlock({
        blockId,
        action: 'reativar',
        notes: 'Chat desbloqueado após análise administrativa.',
        adminId
      });
      await loadModerationData();
    } catch (err) {
      alert(`Falha ao reativar: ${err.message}`);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = (c.student?.full_name || '').toLowerCase();
    const code = (c.student?.student_code || '').toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  const filteredContacts = (contactMessages || []).filter(msg => {
    if (contactStatusFilter === 'nao_lidos') {
      if (msg.is_read) return false;
    } else if (contactStatusFilter !== 'todos' && msg.status !== contactStatusFilter) {
      return false;
    }
    if (!contactSearch || !contactSearch.trim()) return true;
    const term = contactSearch.toLowerCase().trim();
    return (
      (msg.name || '').toLowerCase().includes(term) ||
      (msg.email || '').toLowerCase().includes(term) ||
      (msg.phone || '').toLowerCase().includes(term) ||
      (msg.subject || '').toLowerCase().includes(term) ||
      (msg.message || '').toLowerCase().includes(term)
    );
  });

  const unreadContactsCount = (contactMessages || []).filter(m => !m.is_read).length;
  const pendingContactsCount = (contactMessages || []).filter(m => m.status === 'pendente').length;
  const activeContact = contactMessages.find(m => m.id === selectedContactId) || (filteredContacts.length > 0 ? filteredContacts[0] : null);

  return (
    <div className="sidebar-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <AdminSidebar />

      <main style={{ flex: 1, marginLeft: '240px', padding: '1.75rem 2rem', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Central de Atendimento & Moderação de Chat
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginTop: '0.25rem' }}>
              Responda às dúvidas dos estudantes e faça a gestão das suspensões e diretrizes de convivência.
            </p>
          </div>

          {/* Abas */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 30, 60, 0.6)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(0, 163, 224, 0.25)', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={activeTab === 'support' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.825rem', padding: '0.5rem 1rem', flex: 1, minWidth: '150px', textAlign: 'center', justifyContent: 'center' }}
            >
              <Headphones size={15} />
              Suporte Alunos ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={activeTab === 'contacts' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                fontSize: '0.825rem',
                padding: '0.5rem 1rem',
                flex: 1,
                minWidth: '170px',
                textAlign: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Mail size={15} />
              <span>Mensagens do Site</span>
              {unreadContactsCount > 0 ? (
                <span style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '999px',
                  marginLeft: '0.35rem'
                }}>
                  {unreadContactsCount} nova{unreadContactsCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                  ({contactMessages.length})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('moderation')}
              className={activeTab === 'moderation' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.825rem', padding: '0.5rem 1rem', flex: 1, minWidth: '160px', textAlign: 'center', justifyContent: 'center' }}
            >
              <ShieldAlert size={15} />
              Moderação & Recursos ({chatBlocks.filter(b => b.status === 'em_analise').length})
            </button>
          </div>
        </div>

        {/* ABA 1: SUPORTE OFICIAL */}
        {activeTab === 'support' && (
          <div className="chat-layout-wrapper" style={{ minHeight: '560px' }}>
            {/* Coluna Esquerda: Lista de Conversas */}
            <div className="chat-sidebar">
              <div style={{ padding: '1rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar estudante..."
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', padding: '0.45rem 0.65rem 0.45rem 2rem' }}
                  />
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {loadingConversations ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.8rem' }}>A carregar pedidos...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                    Nenhuma conversa encontrada.
                  </div>
                ) : (
                  filteredConversations.map(conv => {
                    const isSelected = selectedConversation?.id === conv.id;
                    const stName = conv.student?.full_name || 'Estudante';
                    const stCode = conv.student?.student_code;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.85rem 1rem',
                          background: isSelected ? 'rgba(0, 199, 253, 0.15)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(0, 163, 224, 0.12)',
                          borderLeft: isSelected ? '3px solid #00C7FD' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <UserAvatar 
                          photoUrl={conv.student?.photo_url} 
                          name={stName} 
                          size={38} 
                          role="estudante" 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem', color: isSelected ? '#FFFFFF' : '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {stName}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94A3B8', flexShrink: 0 }}>
                              {formatDateTime(conv.last_message_at).split(' ')[1] || ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#00C7FD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stCode ? `Código: ${stCode}` : (conv.student?.email || 'Canal de Suporte')}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna Direita: Janela de Atendimento */}
            <div className="chat-main-area">
              {selectedConversation ? (
                <>
                  {/* Cabeçalho do Atendimento */}
                  <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.25)', background: 'rgba(0, 25, 50, 0.7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <UserAvatar 
                        photoUrl={selectedConversation.student?.photo_url} 
                        name={selectedConversation.student?.full_name || 'Estudante'} 
                        size={42} 
                        role="estudante" 
                      />
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                          {selectedConversation.student?.full_name || 'Estudante'}
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {selectedConversation.student?.student_code ? `Cód: ${selectedConversation.student.student_code} • ` : ''}{selectedConversation.student?.email}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                      ● Atendimento Ativo
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', color: '#94A3B8', fontSize: '0.85rem' }}>
                        Nenhuma mensagem registada nesta conversa ainda.
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isAdminMsg = msg.sender_role === 'admin' || msg.sender_id === adminId;
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                              alignSelf: isAdminMsg ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem' }}>
                              <strong style={{ color: isAdminMsg ? '#00C7FD' : '#10B981' }}>
                                {isAdminMsg ? 'Suporte Zaty Academy' : msg.sender_name}
                              </strong>
                              <span>• {formatDateTime(msg.created_at)}</span>
                            </div>

                            <div
                              style={{
                                background: isAdminMsg ? 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)' : 'rgba(0, 30, 60, 0.75)',
                                border: isAdminMsg ? '1px solid rgba(0, 199, 253, 0.4)' : '1px solid rgba(0, 163, 224, 0.25)',
                                color: '#FFFFFF',
                                borderRadius: isAdminMsg ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                padding: '0.65rem 0.95rem',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Formulário de Resposta */}
                  <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(0, 163, 224, 0.25)', background: 'rgba(0, 20, 40, 0.85)' }}>
                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Responder em nome do Suporte Zaty Academy..."
                        disabled={sendingReply}
                        className="form-input"
                        style={{ flex: 1, padding: '0.65rem 0.95rem', borderRadius: '8px' }}
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="btn btn-primary"
                        style={{ padding: '0.65rem 1.15rem', borderRadius: '8px', flexShrink: 0 }}
                      >
                        <Send size={15} />
                        <span>Responder</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#94A3B8' }}>
                  <Headphones size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>Selecione um estudante na coluna esquerda para atender.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: MODERAÇÃO DE CHAT E RECURSOS */}
        {activeTab === 'moderation' && (
          <div className="glass-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.5rem)', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Suspensões e Recursos de Moderação
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Histórico de estudantes bloqueados por violação das regras e análise de recursos.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
                <button onClick={loadModerationData} className="btn btn-secondary mobile-action-btn" style={{ fontSize: '0.75rem' }}>
                  <RefreshCw size={14} className={loadingBlocks ? 'animate-spin' : ''} />
                  Atualizar
                </button>
                <button onClick={handleOpenBlockModal} className="btn btn-primary mobile-action-btn" style={{ fontSize: '0.75rem' }}>
                  <Lock size={14} />
                  Suspender Estudante
                </button>
              </div>
            </div>

            {loadingBlocks ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                A carregar registos de moderação...
              </div>
            ) : chatBlocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
                <ShieldCheck size={36} style={{ margin: '0 auto 0.75rem', color: '#10B981' }} />
                <p style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                  Nenhum estudante suspenso no momento
                </p>
                <p style={{ fontSize: '0.8rem' }}>
                  Todos os estudantes com aceite de diretrizes possuem acesso regular ao chat.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {chatBlocks.map(block => (
                  <div
                    key={block.id}
                    className="mobile-entity-card"
                    style={{
                      border: block.status === 'em_analise' ? '1px solid #F59E0B' : block.status === 'bloqueado' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#FFFFFF' }}>
                            {block.student?.full_name || 'Estudante'}
                          </strong>
                          {block.status === 'bloqueado' && (
                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Bloqueado</span>
                          )}
                          {block.status === 'em_analise' && (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Recurso Sob Análise</span>
                          )}
                          {block.status === 'reativado' && (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Reativado</span>
                          )}
                        </div>

                        <div className="mobile-card-meta" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                          <div>
                            <span className="meta-label">Estudante</span>
                            <span className="meta-value">{block.student?.student_code ? `Cód: ${block.student.student_code}` : (block.student?.email || 'N/D')}</span>
                          </div>
                          <div>
                            <span className="meta-label">Bloqueado em</span>
                            <span className="meta-value">{formatDateTime(block.blocked_at)}</span>
                          </div>
                        </div>
                      </div>

                      {block.status !== 'reativado' && (
                        <button
                          onClick={() => handleReactivateBlock(block.id)}
                          className="btn btn-secondary mobile-btn-full"
                          style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        >
                          <Unlock size={14} />
                          Reativar Acesso
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.825rem', background: 'rgba(0, 15, 30, 0.5)', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                      <strong style={{ color: '#FCA5A5' }}>Motivo do Bloqueio:</strong> {block.reason}
                    </div>

                    {block.appeal_text && (
                      <div style={{ fontSize: '0.825rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.4rem' }}>
                        <strong style={{ color: '#F59E0B' }}>Recurso do Estudante ({formatDateTime(block.appeal_submitted_at)}):</strong>
                        <div style={{ color: '#E2E8F0', marginTop: '0.25rem' }}>"{block.appeal_text}"</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 3: MENSAGENS DO SITE PÚBLICO */}
        {activeTab === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0 }}>
            {/* Verificação de Permissão / Segurança */}
            {!isAuthorized && (
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShieldAlert size={32} color="#EF4444" style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#FCA5A5', margin: '0 0 0.25rem 0' }}>
                    Acesso Restrito à Gestão de Comunicações
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: 0 }}>
                    Apenas os perfis com permissões de <strong>Super Administrador</strong>, <strong>Administrador</strong> ou <strong>Secretaria</strong> têm autorização para ler e responder a mensagens de contacto institucional.
                  </p>
                </div>
              </div>
            )}

            {/* Cards de Métricas (KPIs) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div className="glass-card" style={{ padding: '1rem 1.15rem', border: '1px solid rgba(0, 163, 224, 0.3)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 163, 224, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' }}>Total Mensagens</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF' }}>{contactMessages.length}</div>
                </div>
              </div>

              <div 
                className="glass-card" 
                onClick={() => setContactStatusFilter('nao_lidos')}
                style={{ 
                  padding: '1rem 1.15rem', 
                  border: unreadContactsCount > 0 ? '1px solid rgba(0, 199, 253, 0.5)' : '1px solid rgba(0, 163, 224, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.85rem', 
                  background: unreadContactsCount > 0 ? 'rgba(0, 199, 253, 0.08)' : 'rgba(0, 20, 40, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Clique para filtrar apenas não lidas"
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', position: 'relative' }}>
                  <EyeOff size={20} />
                  {unreadContactsCount > 0 && (
                    <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '9px', height: '9px', borderRadius: '50%', background: '#EF4444' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#00C7FD', textTransform: 'uppercase', fontWeight: '700' }}>Não Lidas</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: unreadContactsCount > 0 ? '#38BDF8' : '#FFFFFF' }}>
                    {unreadContactsCount}
                  </div>
                </div>
              </div>

              <div 
                className="glass-card" 
                onClick={() => setContactStatusFilter('pendente')}
                style={{ padding: '1rem 1.15rem', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(245, 158, 11, 0.05)', cursor: 'pointer' }}
                title="Clique para filtrar pendentes"
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: '700' }}>Pendentes / Novas</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FDE68A' }}>
                    {pendingContactsCount}
                  </div>
                </div>
              </div>

              <div 
                className="glass-card" 
                onClick={() => setContactStatusFilter('em_atendimento')}
                style={{ padding: '1rem 1.15rem', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(59, 130, 246, 0.05)', cursor: 'pointer' }}
                title="Clique para filtrar em atendimento"
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#93C5FD', textTransform: 'uppercase', fontWeight: '700' }}>Em Atendimento</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF' }}>
                    {contactMessages.filter(m => m.status === 'em_atendimento').length}
                  </div>
                </div>
              </div>

              <div 
                className="glass-card" 
                onClick={() => setContactStatusFilter('respondido')}
                style={{ padding: '1rem 1.15rem', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(16, 185, 129, 0.05)', cursor: 'pointer' }}
                title="Clique para filtrar respondidas"
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6EE7B7', textTransform: 'uppercase', fontWeight: '700' }}>Respondidas</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF' }}>
                    {contactMessages.filter(m => m.status === 'respondido').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Filtros e Pesquisa */}
            <div className="glass-card" style={{ padding: '0.85rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Pesquisar por nome, telefone, assunto..."
                  className="form-input"
                  style={{ paddingLeft: '2.3rem', fontSize: '0.825rem', width: '100%', paddingRight: contactSearch ? '2rem' : '0.75rem' }}
                />
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                {contactSearch && (
                  <button 
                    onClick={() => setContactSearch('')}
                    style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(0, 20, 40, 0.6)', padding: '0.2rem', borderRadius: '6px', border: '1px solid rgba(0, 163, 224, 0.2)', flexWrap: 'wrap', gap: '2px' }}>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'nao_lidos', label: `● Não Lidas ${unreadContactsCount > 0 ? `(${unreadContactsCount})` : ''}`, color: '#00C7FD' },
                    { id: 'pendente', label: 'Pendentes' },
                    { id: 'em_atendimento', label: 'Em Atendimento' },
                    { id: 'respondido', label: 'Respondidos' },
                    { id: 'arquivado', label: 'Arquivados' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setContactStatusFilter(f.id)}
                      style={{
                        background: contactStatusFilter === f.id ? 'var(--intel-blue, #0071C5)' : 'transparent',
                        color: contactStatusFilter === f.id ? '#FFFFFF' : (f.color || '#94A3B8'),
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '4px',
                        fontSize: '0.76rem',
                        fontWeight: contactStatusFilter === f.id ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadContactMessages}
                  disabled={loadingContacts}
                  className="btn btn-secondary btn-sm"
                  title="Atualizar lista em tempo real"
                  style={{ padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.785rem' }}
                >
                  <RefreshCw size={13} className={loadingContacts ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Layout Dividido Master-Detail (Inbox Lista à Esquerda / Detalhes & Compositor à Direita) */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              minHeight: '620px', 
              flex: 1, 
              alignItems: 'stretch',
              position: 'relative'
            }}>
              {/* Painel Esquerdo: Lista de Mensagens */}
              <div style={{
                width: '360px',
                flexShrink: 0,
                display: (showMobileContactDetail && typeof window !== 'undefined' && window.innerWidth <= 920) ? 'none' : 'flex',
                flexDirection: 'column',
                background: 'rgba(0, 20, 40, 0.45)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(0, 163, 224, 0.2)',
                  background: 'rgba(0, 30, 60, 0.6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Caixa de Entrada ({filteredContacts.length})
                  </span>
                  {unreadContactsCount > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700' }}>
                      {unreadContactsCount} não lida{unreadContactsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {loadingContacts && contactMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#00C7FD' }} />
                      <p style={{ fontSize: '0.85rem' }}>A carregar mensagens do site...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94A3B8' }}>
                      <Mail size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.925rem', marginBottom: '0.25rem' }}>
                        Nenhuma mensagem encontrada
                      </div>
                      <p style={{ fontSize: '0.785rem', lineHeight: '1.4' }}>
                        {contactSearch ? 'Nenhum resultado corresponde à pesquisa.' : 'Não há mensagens para o filtro selecionado.'}
                      </p>
                    </div>
                  ) : (
                    filteredContacts.map(msg => {
                      const isSelected = activeContact?.id === msg.id;
                      const matchedStudent = getMatchedStudent(msg);
                      const isUnread = !msg.is_read;
                      const repliesCount = deduplicateReplies(msg.replies).length;

                      return (
                        <div
                          key={msg.id}
                          onClick={() => handleSelectContactMessage(msg)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid rgba(0, 163, 224, 0.12)',
                            background: isSelected 
                              ? 'rgba(0, 199, 253, 0.12)' 
                              : isUnread 
                              ? 'rgba(0, 199, 253, 0.04)' 
                              : 'transparent',
                            borderLeft: isSelected 
                              ? '3px solid #00C7FD' 
                              : isUnread 
                              ? '3px solid #38BDF8' 
                              : '3px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            position: 'relative'
                          }}
                        >
                          {/* Linha 1: Nome, Data e Indicador Não Lido */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                              {isUnread && (
                                <span 
                                  title="Mensagem não lida"
                                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00C7FD', flexShrink: 0, boxShadow: '0 0 6px #00C7FD' }} 
                                />
                              )}
                              <span style={{ 
                                fontWeight: isUnread ? '800' : '600', 
                                fontSize: '0.875rem', 
                                color: isSelected ? '#FFFFFF' : isUnread ? '#FFFFFF' : '#E2E8F0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {msg.name}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                {formatDateTime(msg.created_at).split(' ')[0]}
                              </span>
                              {/* Botão rápido de leitura */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReadStatus(msg.id, msg.is_read);
                                }}
                                title={msg.is_read ? 'Marcar como não lida' : 'Marcar como lida'}
                                style={{ background: 'none', border: 'none', color: msg.is_read ? '#64748B' : '#00C7FD', cursor: 'pointer', padding: '2px', display: 'flex' }}
                              >
                                {msg.is_read ? <Eye size={13} /> : <EyeOff size={13} />}
                              </button>
                            </div>
                          </div>

                          {/* Linha 2: Assunto */}
                          <div style={{ 
                            fontSize: '0.825rem', 
                            fontWeight: isUnread ? '700' : '500', 
                            color: isSelected ? '#38BDF8' : '#CBD5E1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {msg.subject}
                          </div>

                          {/* Linha 3: Pré-visualização do texto */}
                          <div style={{
                            fontSize: '0.76rem',
                            color: '#94A3B8',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.35'
                          }}>
                            {msg.message}
                          </div>

                          {/* Linha 4: Badges (Status, Prioridade, Respostas, Estudante) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                            {msg.status === 'pendente' && (
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontSize: '0.68rem', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                Pendente
                              </span>
                            )}
                            {msg.status === 'em_atendimento' && (
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '0.68rem', fontWeight: '700', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                Atendimento
                              </span>
                            )}
                            {msg.status === 'respondido' && (
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '0.68rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                Respondido
                              </span>
                            )}
                            {msg.status === 'arquivado' && (
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', fontSize: '0.68rem', fontWeight: '600' }}>
                                Arquivado
                              </span>
                            )}

                            {msg.priority && msg.priority !== 'normal' && (
                              <span style={{
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                background: msg.priority === 'urgente' ? 'rgba(239, 68, 68, 0.2)' : msg.priority === 'alta' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                color: msg.priority === 'urgente' ? '#F87171' : msg.priority === 'alta' ? '#FB923C' : '#94A3B8',
                                border: msg.priority === 'urgente' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(249, 115, 22, 0.4)'
                              }}>
                                {msg.priority.toUpperCase()}
                              </span>
                            )}

                            {repliesCount > 0 && (
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(0, 199, 253, 0.15)', color: '#00C7FD', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <MessageCircle size={10} />
                                {repliesCount} {repliesCount === 1 ? 'resp.' : 'resps.'}
                              </span>
                            )}

                            {matchedStudent && (
                              <span title={`Estudante: ${matchedStudent.full_name}`} style={{ padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <GraduationCap size={10} />
                                Aluno
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Painel Direito: Detalhes da Mensagem, Histórico de Respostas e Compositor */}
              <div style={{
                flex: 1,
                minWidth: 0,
                display: (!showMobileContactDetail && typeof window !== 'undefined' && window.innerWidth <= 920) ? 'none' : 'flex',
                flexDirection: 'column',
                background: 'rgba(0, 20, 40, 0.45)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                {activeContact ? (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Barra Superior de Controlo do Contacto */}
                    <div style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid rgba(0, 163, 224, 0.2)',
                      background: 'rgba(0, 25, 50, 0.7)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      {/* Botão voltar para telas móveis */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowMobileContactDetail(false)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                        >
                          <span>← Voltar à Lista</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0071C5, #00C7FD)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {(activeContact.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF' }}>
                              {activeContact.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                              <a href={`mailto:${activeContact.email}`} style={{ color: '#00C7FD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Mail size={12} />
                                {activeContact.email}
                              </a>
                              <a href={`tel:${activeContact.phone}`} style={{ color: '#34D399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={12} />
                                {activeContact.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações de Estado, Prioridade e Lida */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Alternar Leitura */}
                        <button
                          type="button"
                          onClick={() => handleToggleReadStatus(activeContact.id, activeContact.is_read)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title={activeContact.is_read ? 'Marcar como não lida' : 'Marcar como lida'}
                        >
                          {activeContact.is_read ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{activeContact.is_read ? 'Não Lida' : 'Marcar Lida'}</span>
                        </button>

                        {/* Seletor de Prioridade */}
                        <select
                          value={activeContact.priority || 'normal'}
                          onChange={e => handlePriorityChange(activeContact.id, e.target.value)}
                          className="form-input"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'rgba(0, 30, 60, 0.7)',
                            borderColor: activeContact.priority === 'urgente' ? '#EF4444' : 'rgba(0, 163, 224, 0.3)',
                            color: activeContact.priority === 'urgente' ? '#FCA5A5' : '#E2E8F0',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="baixa">Prioridade: Baixa</option>
                          <option value="normal">Prioridade: Normal</option>
                          <option value="alta">Prioridade: Alta</option>
                          <option value="urgente">Prioridade: Urgente 🔥</option>
                        </select>

                        {/* Seletor de Estado */}
                        <select
                          value={activeContact.status || 'pendente'}
                          onChange={e => handleUpdateContactStatus(activeContact.id, e.target.value)}
                          disabled={savingContactStatus}
                          className="form-input"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'rgba(0, 30, 60, 0.7)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: activeContact.status === 'respondido' ? '#6EE7B7' : activeContact.status === 'pendente' ? '#FDE68A' : '#93C5FD'
                          }}
                        >
                          <option value="pendente">Estado: Pendente</option>
                          <option value="em_atendimento">Estado: Em Atendimento</option>
                          <option value="respondido">Estado: Respondido</option>
                          <option value="arquivado">Estado: Arquivado</option>
                        </select>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(activeContact.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#F87171',
                            padding: '0.45rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Eliminar esta mensagem"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Metadados / Telemetria e Aluno Associado */}
                    {(() => {
                      const matched = getMatchedStudent(activeContact);
                      const telemetry = (activeContact.details && typeof activeContact.details === 'object') ? activeContact.details.telemetry : null;
                      const locationText = telemetry ? formatLocationLabel(telemetry) : null;
                      const deviceText = telemetry ? formatDeviceLabel(telemetry) : null;

                      return (
                        <div style={{
                          padding: '0.65rem 1.25rem',
                          background: 'rgba(0, 15, 30, 0.6)',
                          borderBottom: '1px solid rgba(0, 163, 224, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          fontSize: '0.76rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={12} />
                              Recebido em {formatDateTime(activeContact.created_at)}
                            </span>

                            {locationText && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0, 30, 60, 0.8)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.2)', color: '#93C5FD' }}>
                                <MapPin size={11} />
                                {locationText}
                              </span>
                            )}

                            {deviceText && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0, 30, 60, 0.8)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.2)', color: '#94A3B8' }}>
                                <Laptop size={11} />
                                {deviceText}
                              </span>
                            )}

                            {activeContact.ip_address && (
                              <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                IP: {activeContact.ip_address}
                              </span>
                            )}
                          </div>

                          {matched && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', padding: '0.25rem 0.65rem', borderRadius: '4px', color: '#C4B5FD', fontWeight: '700' }}>
                              <GraduationCap size={13} />
                              <span>Estudante Matriculado: {matched.full_name} ({matched.student_code ? `Cód: ${matched.student_code}` : matched.email})</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Conteúdo: Mensagem Original, Histórico de Respostas e Editor */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* 1. MENSAGEM ORIGINAL RECEBIDA */}
                      <div style={{
                        background: 'rgba(0, 12, 24, 0.75)',
                        border: '1px solid rgba(0, 163, 224, 0.2)',
                        borderRadius: '8px',
                        padding: '1.15rem 1.35rem',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#00C7FD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Mensagem Original do Solicitante
                            </span>
                            <span style={{ background: 'rgba(0, 163, 224, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.725rem', color: '#E2E8F0', fontWeight: '600' }}>
                              Assunto: {activeContact.subject}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyText(activeContact.message, 'Mensagem')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Copiar mensagem original"
                          >
                            <Copy size={12} />
                            <span>Copiar</span>
                          </button>
                        </div>

                        <div style={{
                          color: '#F8FAFC',
                          fontSize: '0.92rem',
                          lineHeight: '1.7',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          borderLeft: '3px solid #00C7FD',
                          paddingLeft: '0.85rem'
                        }}>
                          {activeContact.message}
                        </div>
                      </div>

                      {/* 2. HISTÓRICO DE RESPOSTAS / CONVERSAÇÃO (THREAD) */}
                      {(() => {
                        const cleanReplies = deduplicateReplies(activeContact.replies);
                        return (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <MessageSquare size={14} color="#00C7FD" />
                                Histórico de Respostas Registadas ({cleanReplies.length})
                              </h4>
                              {cleanReplies.length > 0 && (
                                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: '600' }}>
                                  ✓ Atendimento com acompanhamento
                                </span>
                              )}
                            </div>

                            {cleanReplies.length === 0 ? (
                              <div style={{
                                background: 'rgba(0, 20, 40, 0.3)',
                                border: '1px dashed rgba(0, 163, 224, 0.25)',
                                borderRadius: '8px',
                                padding: '1.25rem',
                                textAlign: 'center',
                                color: '#94A3B8',
                                fontSize: '0.825rem'
                              }}>
                                Ainda não foi registada nenhuma resposta oficial a esta mensagem no sistema. Utilize o compositor abaixo para responder e registar o histórico institucional.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {cleanReplies.map((reply, idx) => (
                              <div
                                key={reply.id || idx}
                                style={{
                                  background: 'rgba(0, 30, 60, 0.55)',
                                  border: '1px solid rgba(0, 163, 224, 0.25)',
                                  borderRadius: '8px',
                                  padding: '1rem 1.25rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '800', fontSize: '0.75rem' }}>
                                      {(reply.sender_name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#FFFFFF' }}>
                                        {reply.sender_name || 'Administração Zaty Academy'}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                        {formatDateTime(reply.sent_at)} • Canal: <strong style={{ color: '#00C7FD', textTransform: 'capitalize' }}>{reply.channel || 'sistema'}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <span style={{
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: '700',
                                      background: reply.channel === 'whatsapp' ? 'rgba(37, 211, 102, 0.2)' : reply.channel === 'email' ? 'rgba(0, 163, 224, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                      color: reply.channel === 'whatsapp' ? '#4ADE80' : reply.channel === 'email' ? '#38BDF8' : '#93C5FD',
                                      border: '1px solid rgba(0, 163, 224, 0.2)'
                                    }}>
                                      {reply.channel === 'whatsapp' ? 'WhatsApp' : reply.channel === 'email' ? 'E-mail' : 'Sistema'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(reply.message, 'Resposta')}
                                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                      title="Copiar texto da resposta"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>

                                {reply.subject && (
                                  <div style={{ fontSize: '0.785rem', fontWeight: '700', color: '#00C7FD' }}>
                                    Assunto: {reply.subject}
                                  </div>
                                )}

                                <div style={{
                                  fontSize: '0.875rem',
                                  color: '#F1F5F9',
                                  lineHeight: '1.65',
                                  whiteSpace: 'pre-wrap',
                                  background: 'rgba(0, 15, 30, 0.4)',
                                  padding: '0.75rem 0.95rem',
                                  borderRadius: '6px'
                                }}>
                                  {reply.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                      {/* 3. NOTAS INTERNAS DA EQUIPA (SE HOUVER) */}
                      {activeContact.admin_notes && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '8px',
                          padding: '0.85rem 1.15rem',
                          fontSize: '0.825rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <strong style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FileText size={13} />
                              Nota Interna da Secretaria:
                            </strong>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContactModal(activeContact);
                                setAdminNotesDraft(activeContact.admin_notes || '');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                            >
                              Editar
                            </button>
                          </div>
                          <div style={{ color: '#FDE68A' }}>
                            {activeContact.admin_notes}
                          </div>
                        </div>
                      )}

                      {/* 4. COMPOSITOR COMPLETO PARA ESCREVER, RESPONDER E ENVIAR MENSAGENS */}
                      <div className="glass-card" style={{
                        padding: '1.25rem',
                        border: '1px solid rgba(0, 163, 224, 0.4)',
                        background: 'rgba(0, 25, 50, 0.8)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.925rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Reply size={16} color="#00C7FD" />
                            Compor Resposta & Envio
                          </h4>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                            <span>Canal:</span>
                            <div style={{ display: 'inline-flex', background: 'rgba(0, 15, 30, 0.6)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.2)' }}>
                              {[
                                { id: 'sistema', label: 'Sistema' },
                                { id: 'email', label: 'E-mail' },
                                { id: 'whatsapp', label: 'WhatsApp' }
                              ].map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setContactReplyChannel(c.id)}
                                  style={{
                                    background: contactReplyChannel === c.id ? '#0071C5' : 'transparent',
                                    color: contactReplyChannel === c.id ? '#FFFFFF' : '#94A3B8',
                                    border: 'none',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '3px',
                                    fontSize: '0.72rem',
                                    fontWeight: contactReplyChannel === c.id ? '700' : '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Modelos Rápidos de Resposta Institucional */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Sparkles size={12} color="#00C7FD" />
                            <span>Modelos Rápidos Pré-configurados:</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {QUICK_TEMPLATES.map(tpl => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => handleApplyTemplate(tpl)}
                                style={{
                                  background: selectedTemplateId === tpl.id ? 'rgba(0, 199, 253, 0.25)' : 'rgba(0, 30, 60, 0.6)',
                                  border: selectedTemplateId === tpl.id ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.25)',
                                  color: selectedTemplateId === tpl.id ? '#FFFFFF' : '#93C5FD',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {tpl.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Campo de Assunto */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.785rem', marginBottom: '0.3rem' }}>
                            Assunto da Resposta:
                          </label>
                          <input
                            type="text"
                            value={contactReplySubject}
                            onChange={e => setContactReplySubject(e.target.value)}
                            placeholder="Ex: Re: Informações sobre Cursos Zaty Academy"
                            className="form-input"
                            style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
                          />
                        </div>

                        {/* Campo Completo da Mensagem de Resposta */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <label className="form-label" style={{ fontSize: '0.785rem', margin: 0 }}>
                              Mensagem de Resposta:
                            </label>
                            <span style={{ fontSize: '0.7rem', color: contactReplyText.length > 0 ? '#38BDF8' : '#64748B' }}>
                              {contactReplyText.length} caracteres
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            value={contactReplyText}
                            onChange={e => setContactReplyText(e.target.value)}
                            placeholder="Escreva a resposta completa para enviar ao utilizador..."
                            className="form-input"
                            style={{
                              fontSize: '0.875rem',
                              lineHeight: '1.6',
                              padding: '0.75rem 0.95rem',
                              borderRadius: '8px',
                              background: 'rgba(0, 15, 30, 0.6)',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        {/* Barra de Ações: Enviar e Registar, Gmail Direto, App E-mail, WhatsApp */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.65rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(0, 163, 224, 0.2)'
                        }}>
                          {/* Botão Principal de Envio e Registo no Sistema */}
                          <button
                            type="button"
                            onClick={handleSendInAppReply}
                            disabled={sendingContactReply || !contactReplyText.trim()}
                            className="btn btn-primary"
                            style={{
                              padding: '0.6rem 1.25rem',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(0, 113, 197, 0.4)'
                            }}
                          >
                            <Send size={15} className={sendingContactReply ? 'animate-spin' : ''} />
                            <span>{sendingContactReply ? 'A Enviar & Registar...' : 'Enviar & Registar no Sistema'}</span>
                          </button>

                          {/* Canais Externos Diretos (Sem abas em branco) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Gmail Web Compose (Nova Janela sem aba em branco) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEmailGmail(activeContact, contactReplyText, contactReplySubject)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '0.55rem 0.85rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: 'rgba(234, 67, 53, 0.15)',
                                borderColor: 'rgba(234, 67, 53, 0.4)',
                                color: '#FCA5A5'
                              }}
                              title="Abre o Gmail diretamente no navegador com texto pré-preenchido"
                            >
                              <Mail size={14} />
                              <span>Gmail Web</span>
                            </button>

                            {/* Aplicação Local de E-mail (Mailto seguro via âncora) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEmailClient(activeContact, contactReplyText, contactReplySubject)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '0.55rem 0.85rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                              title="Abre a aplicação de e-mail padrão do computador/telefone"
                            >
                              <ExternalLink size={14} />
                              <span>App de E-mail</span>
                            </button>

                            {/* WhatsApp Oficial */}
                            <button
                              type="button"
                              onClick={() => openWhatsAppContact(activeContact, contactReplyText)}
                              style={{
                                background: '#25D366',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.55rem 0.95rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                              }}
                              title="Abre o WhatsApp com o texto pré-digitado"
                            >
                              <MessageSquare size={14} />
                              <span>WhatsApp</span>
                            </button>

                            {/* Copiar Resposta */}
                            {contactReplyText.trim() && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(contactReplyText, 'Resposta')}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem' }}
                                title="Copiar resposta para colar em qualquer aplicativo"
                              >
                                <Copy size={14} />
                              </button>
                            )}

                            {/* Anotação Interna */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContactModal(activeContact);
                                setAdminNotesDraft(activeContact.admin_notes || '');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem' }}
                              title="Adicionar anotações privadas da secretaria"
                            >
                              <FileText size={14} />
                              <span>Notas</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', margin: 'auto', padding: '3rem', color: '#94A3B8' }}>
                    <Mail size={48} style={{ margin: '0 auto 1rem', opacity: 0.35, color: '#00C7FD' }} />
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.4rem' }}>
                      Selecione uma mensagem para atender
                    </h3>
                    <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto' }}>
                      Escolha uma mensagem na lista à esquerda para consultar os dados do solicitante, verificar o histórico e responder diretamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NOTAS INTERNAS DE MENSAGEM DO SITE */}
        {selectedContactModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 10, 25, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '1.75rem', border: '1px solid rgba(0, 163, 224, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#00C7FD" />
                  Registo & Acompanhamento de Contacto
                </h2>
                <button onClick={() => setSelectedContactModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: 'rgba(0, 15, 30, 0.5)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ color: '#FFFFFF', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {selectedContactModal.name} — <span style={{ color: '#00C7FD' }}>{selectedContactModal.subject}</span>
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                  Recebida em: {formatDateTime(selectedContactModal.created_at)} • Telefone: {selectedContactModal.phone}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Estado do Atendimento</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'pendente', label: 'Pendente' },
                    { id: 'em_atendimento', label: 'Em Atendimento' },
                    { id: 'respondido', label: 'Respondido' },
                    { id: 'arquivado', label: 'Arquivado' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleUpdateContactStatus(selectedContactModal.id, st.id)}
                      disabled={savingContactStatus}
                      style={{
                        background: selectedContactModal.status === st.id ? 'var(--intel-blue, #0071C5)' : 'rgba(0, 30, 60, 0.6)',
                        border: '1px solid rgba(0, 163, 224, 0.3)',
                        color: selectedContactModal.status === st.id ? '#FFFFFF' : '#94A3B8',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Anotações Internas da Secretaria / Atendimento</label>
                <textarea
                  rows={4}
                  value={adminNotesDraft}
                  onChange={e => setAdminNotesDraft(e.target.value)}
                  placeholder="Ex: Contactado por WhatsApp pelo Eng. Carlos. Demonstrou interesse no curso de Redes de Computadores noturno..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSelectedContactModal(null)} className="btn btn-secondary">
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveContactNotes(selectedContactModal.id)}
                  disabled={savingContactStatus}
                  className="btn btn-primary"
                >
                  {savingContactStatus ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SUSPENDER ESTUDANTE */}
        {isBlockModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 10, 25, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem'
          }}>
            <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={20} color="#EF4444" />
                  Suspender Estudante do Chat
                </h2>
                <button onClick={() => setIsBlockModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {blockError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '0.65rem', color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {blockError}
                </div>
              )}

              <form onSubmit={handleCreateBlock}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Selecionar Estudante *</label>
                  {loadingStudents ? (
                    <div style={{ padding: '0.65rem', background: 'rgba(0, 20, 40, 0.5)', borderRadius: '6px', color: '#94A3B8', fontSize: '0.85rem' }}>
                      A carregar lista de estudantes...
                    </div>
                  ) : (
                    <select
                      value={blockForm.student_id}
                      onChange={e => setBlockForm({ ...blockForm, student_id: e.target.value })}
                      required
                      className="form-input"
                    >
                      <option value="">Selecione o estudante a suspender...</option>
                      {(Array.isArray(studentsList) ? studentsList : []).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.student_code ? `Cód: ${s.student_code}` : (s.email || 'Estudante')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Motivo da Suspensão *</label>
                  <textarea
                    rows={3}
                    value={blockForm.reason}
                    onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                    required
                    placeholder="Ex.: Envio de mensagens ofensivas / violação das regras da comunidade."
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setIsBlockModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submittingBlock} className="btn btn-danger" style={{ background: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }}>
                    {submittingBlock ? 'A suspender...' : 'Confirmar Suspensão'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notificação de Feedback */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toastMessage.type === 'success' ? '#059669' : toastMessage.type === 'error' ? '#DC2626' : '#0284C7',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10000,
            fontSize: '0.85rem',
            fontWeight: '600',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {toastMessage.type === 'success' && <CheckCircle2 size={18} />}
            {toastMessage.type === 'error' && <AlertCircle size={18} />}
            {toastMessage.type === 'info' && <Sparkles size={18} />}
            <span>{toastMessage.text}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0, marginLeft: '0.5rem', display: 'flex', opacity: 0.8 }}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

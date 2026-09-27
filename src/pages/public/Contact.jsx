import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/common/SEO';
import { submitContactMessage } from '../../services/api';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function Contact() {
  const { settings } = useSettings();
  const inst = settings.institution || {};
  const contact = settings.contact || {};
  const auth = useAuth();
  const user = auth?.user;
  const profile = auth?.profile;
  const student = auth?.student;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user || profile || student) {
      setForm(prev => ({
        ...prev,
        name: prev.name || student?.full_name || profile?.full_name || user?.user_metadata?.full_name || '',
        email: prev.email || student?.email || user?.email || '',
        phone: prev.phone || student?.phone || profile?.phone || ''
      }));
    }
  }, [user, profile, student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        userId: user?.id || null,
        studentId: student?.id || null
      });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Erro ao submeter mensagem de contacto:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar a sua mensagem. Por favor, tente novamente ou fale connosco pelo WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)' }}>
      <SEO 
        title="Contactos & Localização" 
        description="Entre em contacto com a Zaty Academy em Namicopo, Nampula. Telefones, WhatsApp, e-mail e formulário de atendimento pedagógico e institucional."
      />

      {/* Hero */}
      <section style={{
        padding: '4.5rem 1.5rem 3.5rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0, 40, 75, 0.5) 0%, rgba(0, 18, 36, 0.95) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.95rem', borderRadius: '999px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.35)', color: '#00C7FD', fontSize: '0.825rem', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
            <Sparkles size={15} />
            Atendimento Institucional & Suporte
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '1rem' }}>
            Fale Conosco na <span style={{ color: '#00C7FD' }}>Zaty Academy</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#A5CBEA', lineHeight: '1.7', margin: '0 auto', maxWidth: '640px' }}>
            Estamos à sua disposição para esclarecer dúvidas sobre cursos, inscrições, horários, pagamentos e certificados.
          </p>
        </div>
      </section>

      {/* Seção Principal */}
      <section style={{ padding: '4rem 1.5rem 5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            {/* Informações de Contacto & Horário */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(0, 163, 224, 0.25)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} color="#00C7FD" />
                  Nossos Canais Diretos
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Endereço */}
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' }}>Endereço Físico</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: '500', marginTop: '2px' }}>
                        {inst.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'}
                      </div>
                    </div>
                  </div>

                  {/* Telefone / WhatsApp */}
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' }}>Telefone & WhatsApp</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: '500', marginTop: '2px' }}>
                        {inst.phone || '+258 834 847 306'}
                      </div>
                    </div>
                  </div>

                  {/* E-mail */}
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' }}>Correio Eletrónico</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: '500', marginTop: '2px' }}>
                        {inst.email || 'contacto@zatyacademy.co.mz'}
                      </div>
                    </div>
                  </div>

                  {/* Horário de Atendimento */}
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD', flexShrink: 0 }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' }}>Horário de Funcionamento</div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.925rem', fontWeight: '500', marginTop: '2px' }}>
                        {contact.support_hours || 'Segunda a Sexta: 08h às 17h | Sábados: 08h às 13h'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Apoio Rápido WhatsApp */}
              <div style={{
                padding: '1.5rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#6EE7B7', fontSize: '0.95rem' }}>Atendimento Instantâneo via WhatsApp</div>
                  <div style={{ fontSize: '0.825rem', color: '#A7F3D0' }}>Tire dúvidas pedagógicas com a nossa equipa.</div>
                </div>
                <a 
                  href={`https://wa.me/258834847306?text=${encodeURIComponent('Olá! Gostaria de obter mais informações sobre os cursos da Zaty Academy.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                  style={{ background: '#10B981', color: '#FFFFFF', fontWeight: '700', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                >
                  Abrir WhatsApp
                </a>
              </div>
            </div>

            {/* Formulário de Mensagem */}
            <div className="glass-card" style={{ padding: '2.25rem', border: '1px solid rgba(0, 199, 253, 0.35)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                Envie uma Mensagem
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.885rem', marginBottom: '1.5rem' }}>
                Preencha o formulário abaixo e a nossa equipa entrará em contacto com a maior brevidade.
              </p>

              {submitted ? (
                <div style={{
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px'
                }}>
                  <CheckCircle2 size={44} color="#6EE7B7" style={{ margin: '0 auto 1rem auto' }} />
                  <h4 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Mensagem Enviada com Sucesso!</h4>
                  <p style={{ color: '#A7F3D0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Obrigado por nos contactar. Responderemos para o seu e-mail ou telefone em breve.
                    {user && (
                      <span style={{ display: 'block', marginTop: '0.65rem', color: '#FFFFFF' }}>
                        A resposta da administração estará também disponível no seu{' '}
                        <Link to="/estudante/chat" style={{ color: '#00C7FD', fontWeight: '700', textDecoration: 'underline' }}>
                          Suporte Oficial
                        </Link>.
                      </span>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {user && (
                      <Link 
                        to="/estudante/chat" 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <MessageSquare size={16} />
                        Ir para o Meu Chat / Suporte
                      </Link>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setSubmitted(false)} 
                      className="btn btn-secondary btn-sm"
                    >
                      Enviar Outra Mensagem
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {user && (
                    <div style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: '6px',
                      background: 'rgba(0, 199, 253, 0.08)',
                      border: '1px solid rgba(0, 199, 253, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.825rem',
                      color: '#A5CBEA'
                    }}>
                      <ShieldCheck size={16} color="#00C7FD" style={{ flexShrink: 0 }} />
                      <span>
                        Autenticado como <strong style={{ color: '#FFFFFF' }}>{student?.full_name || profile?.full_name || user?.email}</strong>. As respostas da administração serão sincronizadas com o seu <Link to="/estudante/chat" style={{ color: '#00C7FD', textDecoration: 'underline' }}>Chat de Suporte</Link>.
                      </span>
                    </div>
                  )}
                  {errorMessage && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      color: '#FCA5A5',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}>
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm({ ...form, name: e.target.value })} 
                      placeholder="Ex: Alberto Chissano" 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Correio Eletrónico *</label>
                      <input 
                        type="email" 
                        value={form.email} 
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                        placeholder="seu.email@exemplo.com" 
                        required 
                        className="form-input" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contacto Telefónico *</label>
                      <input 
                        type="tel" 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                        placeholder="84 / 82 / 86 / 87..." 
                        required 
                        className="form-input" 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assunto *</label>
                    <input 
                      type="text" 
                      value={form.subject} 
                      onChange={e => setForm({ ...form, subject: e.target.value })} 
                      placeholder="Ex: Informações sobre Turmas Noturnas de Programação" 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mensagem *</label>
                    <textarea 
                      value={form.message} 
                      onChange={e => setForm({ ...form, message: e.target.value })} 
                      rows="4" 
                      placeholder="Escreva aqui a sua dúvida ou mensagem detalhada..." 
                      required 
                      className="form-textarea" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontWeight: '700' }}
                  >
                    <Send size={16} />
                    <span>{submitting ? 'A enviar mensagem...' : 'Enviar Mensagem Institucional'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

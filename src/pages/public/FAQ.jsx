import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Cookie, 
  ShieldCheck, 
  BookOpen, 
  CreditCard,
  Sparkles
} from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(prev => prev === idx ? null : idx);
  };

  const faqs = [
    {
      category: 'Inscrições & Requisitos',
      question: 'Quais são os documentos necessários para fazer a inscrição?',
      answer: 'Para se inscrever é necessário apresentar uma cópia do Bilhete de Identidade (BI), DIRE ou Passaporte válido, uma fotografia tipo passe recente (pode tirar pelo telemóvel no formulário online) e o comprovativo de pagamento da taxa de inscrição.'
    },
    {
      category: 'Inscrições & Requisitos',
      question: 'Como funciona a inscrição online?',
      answer: 'Basta aceder à página de "Inscrição Online", selecionar o curso desejado, preencher os seus dados pessoais, carregar a fotografia e documento de identificação e definir a sua palavra-passe de acesso ao portal. A nossa secretaria analisa os dados e aprova a sua vaga com rapidez.'
    },
    {
      category: 'Cursos & Metodologia',
      question: 'Preciso ter computador próprio para frequentar os cursos?',
      answer: 'Não! Os laboratórios da Zaty Academy estão equipados com computadores modernos para todos os alunos durante as aulas práticas. Se tiver computador portátil pessoal, pode também utilizá-lo para praticar fora dos horários de aula.'
    },
    {
      category: 'Cursos & Metodologia',
      question: 'Quais são os turnos disponíveis para as aulas?',
      answer: 'Dispomos de vários turnos flexíveis: Turno da Manhã (08h às 10h / 10h às 12h), Turno da Tarde (14h às 16h / 16h às 18h) e Turno Pós-Laboral / Noturno para trabalhadores e estudantes do ensino superior.'
    },
    {
      category: 'Pagamentos & Propinas',
      question: 'Quais são os métodos de pagamento aceites?',
      answer: 'Aceitamos pagamentos instantâneos via M-Pesa (Vodacom), e-Mola (Movitel), mKesh e também diretamente na secretaria da instituição. No portal do estudante, pode anexar o comprovativo e acompanhar o estado da sua mensalidade.'
    },
    {
      category: 'Certificação & QR Code',
      question: 'Como é validado o certificado emitido pela Zaty Academy?',
      answer: 'Todos os nossos certificados possuem um código alfanumérico único e um QR Code criptográfico impresso. Ao apontar a câmara de qualquer telemóvel ou digitar o código na página "Validar Certificado", é exibida a autenticidade oficial emitida pela nossa direção.'
    }
  ];

  // Schema.org FAQPage JSON-LD para SEO do Google
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.answer
      }
    }))
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)', paddingBottom: '5rem' }}>
      <SEO 
        title="Perguntas Frequentes (FAQ) & Cookies" 
        description="Tire todas as suas dúvidas sobre inscrições, turmas, cursos, mensalidades M-Pesa/e-Mola, certificados com QR Code e Política de Cookies da Zaty Academy."
        schema={faqSchema}
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
            <HelpCircle size={15} />
            Central de Dúvidas & Transparência
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '1rem' }}>
            Perguntas Frequentes (<span style={{ color: '#00C7FD' }}>FAQ</span>)
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#A5CBEA', lineHeight: '1.7', margin: '0 auto', maxWidth: '640px' }}>
            Respostas claras e imediatas sobre o funcionamento dos nossos cursos, inscrições, certificações e pagamentos.
          </p>
        </div>
      </section>

      {/* Acordeão de Perguntas */}
      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div 
                  key={idx}
                  className="glass-card"
                  style={{
                    border: isOpen ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.725rem', color: '#00C7FD', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
                        {faq.category}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', margin: '0.25rem 0 0 0' }}>
                        {faq.question}
                      </h3>
                    </div>
                    <div style={{ color: isOpen ? '#00C7FD' : '#94A3B8', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.35rem 1.5rem', color: '#CBD5E1', fontSize: '0.925rem', lineHeight: '1.7', borderTop: '1px solid rgba(0, 163, 224, 0.15)', paddingTop: '1rem' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Seção Política de Cookies */}
          <div className="glass-card" style={{ marginTop: '4rem', padding: '2.25rem', border: '1px solid rgba(0, 199, 253, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', border: '1px solid #00C7FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
                <Cookie size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Política de Cookies & Armazenamento Local
              </h2>
            </div>

            <div style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p>
                A Zaty Academy utiliza cookies e armazenamento local estritamente necessários para o funcionamento seguro da aplicação:
              </p>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li><strong>Cookies de Autenticação:</strong> Guardam a sessão segura de estudantes, formadores e administradores sem transmitir senhas.</li>
                <li><strong>Preferências de Sessão:</strong> Memorizam opções de visualização, formulários em andamento e preferências do utilizador.</li>
                <li><strong>Sem Rastreio Invasivo:</strong> Não vendemos dados nem utilizamos cookies de rastreio de terceiros para publicidade não autorizada.</li>
              </ul>
              <p style={{ marginTop: '0.5rem' }}>
                Pode gerir ou desativar os cookies diretamente nas configurações do seu navegador web, ciente de que algumas funcionalidades autenticadas podem exigir cookies de sessão para operar corretamente.
              </p>
            </div>
          </div>

          {/* Contacto adicional */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.925rem', marginBottom: '1rem' }}>
              Ainda tem alguma dúvida que não foi respondida aqui?
            </p>
            <Link to="/contactos" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Fale Diretamente com a Secretaria</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

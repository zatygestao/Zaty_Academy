import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import SEO from '../../components/common/SEO';
import { Shield, Lock, FileText, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const inst = settings.institution || {};

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)', padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
      <SEO 
        title="Política de Privacidade" 
        description="Consulte a Política de Privacidade da Zaty Academy. Saiba como recolhemos, tratamos e protegemos os seus dados pessoais e académicos com rigor e segurança."
      />

      <div className="container" style={{ maxWidth: '860px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#00C7FD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
            <ArrowLeft size={16} />
            <span>Voltar à Página Inicial</span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(0, 163, 224, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(0, 199, 253, 0.15)', border: '1px solid #00C7FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
              <Shield size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Política de Privacidade</h1>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Última atualização: Setembro de 2026 | ZATY ACADEMY</span>
            </div>
          </div>

          <div style={{ color: '#E2E8F0', lineHeight: '1.8', fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                1. Introdução e Compromisso
              </h2>
              <p>
                A <strong>{inst.name || 'ZATY ACADEMY'}</strong>, com sede em {inst.address || 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)'}, reconhece a importância fundamental da privacidade e da confidencialidade dos dados pessoais e académicos de todos os seus estudantes, formadores, colaboradores e visitantes.
              </p>
              <p>
                Esta Política de Privacidade descreve de forma clara e transparente as nossas práticas relativas à recolha, utilização, armazenamento, partilha e proteção dos seus dados, em conformidade com as melhores práticas internacionais e a legislação moçambicana aplicável.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                2. Dados Pessoais que Recolhemos
              </h2>
              <p>No âmbito da inscrição e frequência dos nossos cursos, recolhemos os seguintes dados:</p>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li><strong>Identificação pessoal:</strong> Nome completo, data de nascimento, género e fotografia tipo passe.</li>
                <li><strong>Documentos oficiais:</strong> Número e cópia do Bilhete de Identidade (BI), DIRE ou Passaporte para emissão do certificado.</li>
                <li><strong>Dados de contacto:</strong> Número de telefone principal, número alternativo, endereço de e-mail e cidade/bairro de residência.</li>
                <li><strong>Dados académicos:</strong> Cursos matriculados, turmas, notas de avaliações, presença nas aulas e certificados emitidos.</li>
                <li><strong>Dados financeiros:</strong> Comprovativos de pagamento de propinas e taxas (M-Pesa, e-Mola, mKesh ou numerário). Não armazenamos senhas de contas bancárias ou PINs móveis.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                3. Finalidade do Tratamento de Dados
              </h2>
              <p>Os dados recolhidos destinam-se exclusivamente às seguintes finalidades:</p>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Processamento de matrículas e gestão do percurso formativo do estudante;</li>
                <li>Emissão e validação pública de certificados profissionais com QR Code de autenticidade;</li>
                <li>Comunicação institucional sobre horários, turmas, notas e avisos pedagógicos;</li>
                <li>Cumprimento de obrigações legais, regulamentares e estatísticas educacionais.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                4. Segurança e Armazenamento dos Dados
              </h2>
              <p>
                Adotamos medidas técnicas e organizativas rigorosas para proteger os seus dados contra acessos não autorizados, perda, destruição ou alteração ilícita. O acesso ao banco de dados é restrito a administradores credenciados e protegido por chaves criptográficas, Row Level Security (RLS) e protocolos SSL/TLS em todas as comunicações.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                5. Validação Pública de Certificados
              </h2>
              <p>
                Para combater a falsificação documental e valorizar o formando no mercado de trabalho, a Zaty Academy disponibiliza um sistema de verificação pública por QR Code. Ao validar o código impresso no certificado, qualquer empregador poderá confirmar apenas o nome do formando, curso concluído, carga horária e data de emissão.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                6. Direitos do Titular dos Dados
              </h2>
              <p>
                O titular dos dados tem o direito de consultar os seus registos, solicitar a retificação de dados incorretos ou desatualizados, e requerer esclarecimentos sobre o tratamento das suas informações através dos nossos contactos oficiais.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                7. Contacto para Dúvidas de Privacidade
              </h2>
              <p>
                Para qualquer questão relativa à sua privacidade ou ao tratamento dos seus dados, entre em contacto connosco através do e-mail: <strong>{inst.email || 'contacto@zatyacademy.co.mz'}</strong> ou pelo telefone: <strong>{inst.phone || '+258 834 847 306'}</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import SEO from '../../components/common/SEO';
import { FileText, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TermsOfUse() {
  const { settings } = useSettings();
  const inst = settings.institution || {};

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)', padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
      <SEO 
        title="Termos de Uso & Regulamento" 
        description="Termos de Uso e Regulamento Pedagógico da Zaty Academy. Conheça as condições gerais de matrícula, frequência, avaliação, pagamento e certificação profissional."
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
              <FileText size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Termos de Uso & Condições Gerais</h1>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Regulamento Pedagógico Oficial | ZATY ACADEMY</span>
            </div>
          </div>

          <div style={{ color: '#E2E8F0', lineHeight: '1.8', fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                1. Objeto e Âmbito de Aplicação
              </h2>
              <p>
                Os presentes Termos de Uso e Regulamento Geral regem a prestação de serviços de formação profissional e tecnológica ministrados pela <strong>{inst.name || 'ZATY ACADEMY'}</strong> aos seus formandos, assim como as regras de utilização do portal web e da plataforma de aprendizagem.
              </p>
              <p>
                Ao efetuar a inscrição em qualquer curso ou navegar no website da Zaty Academy, o formando ou utilizador declara que leu, compreendeu e aceita integralmente as disposições aqui estabelecidas.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                2. Inscrição, Matrícula e Documentação
              </h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li>A inscrição online é confirmada apenas após a validação da documentação obrigatória (BI/DIRE) pela Secretaria Académica e a confirmação do pagamento da taxa de matrícula.</li>
                <li>O formando é responsável pela veracidade e autenticidade de todos os dados e documentos submetidos no momento da inscrição.</li>
                <li>A inscrição é pessoal e intransmissível, ficando vinculada ao número de estudante atribuído pelo sistema.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                3. Regime de Aulas, Frequência e Assiduidade
              </h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li>Para ter direito à avaliação final e à emissão do certificado, o formando deve cumprir uma frequência mínima obrigatória de <strong>75%</strong> das aulas práticas e teóricas ministradas.</li>
                <li>Faltas justificadas devem ser comunicadas à coordenação pedagógica com o devido comprovativo no prazo máximo de 48 horas após a ausência.</li>
                <li>O formando deve zelar pelo bom estado dos equipamentos informáticos e periféricos dos laboratórios.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                4. Pagamentos, Propinas e Prazos
              </h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li>As propinas devem ser liquidadas até ao dia 10 de cada mês, através dos canais oficiais indicados (M-Pesa, e-Mola, mKesh ou na Secretaria).</li>
                <li>O não pagamento pontual poderá implicar a suspensão temporária do acesso ao portal do estudante e às aulas práticas até à regularização da situação financeira.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                5. Avaliação Pedagógica e Certificação
              </h2>
              <p>
                A aprovação nos cursos exige nota final igual ou superior a <strong>10 valores</strong> (em escala de 0 a 20), obtida através de testes práticos, trabalhos e projeto final. Formandos com aproveitamento positivo recebem o Certificado Profissional com selo oficial e QR Code anti-fraude verificável publicamente.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.5rem' }}>
                6. Código de Conduta e Disciplina
              </h2>
              <p>
                É expressamente proibido no recinto da instituição e nas plataformas digitais qualquer comportamento discriminatório, assédio, uso indevido de equipamentos ou cópia fraudulenta de trabalhos académicos (plágio). Infrações graves poderão culminar em expulsão sem direito a reembolso.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

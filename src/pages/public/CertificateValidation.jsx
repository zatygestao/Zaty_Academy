import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { verifyCertificateByCode } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import SEO from '../../components/common/SEO';

export default function CertificateValidation() {
  const { codigo } = useParams();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('codigo') || codigo || '';

  const [inputCode, setInputCode] = useState(queryCode);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const handleVerify = async (codeToVerify) => {
    const code = (codeToVerify || inputCode).trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await verifyCertificateByCode(code);
      setCertificateData(data);
    } catch (err) {
      console.error('Erro na validação do certificado:', err);
      setCertificateData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryCode) {
      setInputCode(queryCode);
      handleVerify(queryCode);
    }
  }, [queryCode]);

  return (
    <div className="container" style={{ padding: 'clamp(1.5rem, 4.5vw, 3.5rem) 1rem clamp(2rem, 5vw, 5rem) 1rem', maxWidth: '720px' }}>
      <SEO 
        title="Validação Pública de Certificados" 
        description="Validação pública oficial de autenticidade de certificados com QR Code e código alfanumérico da Zaty Academy."
      />
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {/* Contentor de Alinhamento Centralizado da Logo Oficial */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
          <BrandLogo 
            size={64} 
            glow={false} 
            style={{ margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
            imgStyle={{ width: 'auto', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '4px',
          background: 'rgba(0, 114, 206, 0.25)',
          border: '1px solid rgba(0, 199, 253, 0.4)',
          color: '#00C7FD',
          fontSize: 'clamp(0.68rem, 2.2vw, 0.8rem)',
          fontWeight: '700',
          letterSpacing: '0.04em',
          marginBottom: '0.85rem',
          maxWidth: '100%',
          textAlign: 'center'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>PORTAL PÚBLICO DE VALIDAÇÃO ANTI-FRAUDE</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.35rem, 4.5vw, 2.1rem)', fontWeight: '800', marginBottom: '0.45rem', color: '#FFFFFF', lineHeight: 1.25 }}>
          Autenticação de Certificados Digitais
        </h1>
        <p style={{ color: '#94A3B8', maxWidth: '580px', margin: '0 auto', fontSize: 'clamp(0.825rem, 2.5vw, 0.9rem)', lineHeight: '1.5' }}>
          Insira o código de validação único impresso no documento ou contido no QR Code para comprovar a sua autenticidade oficial.
        </p>
      </div>

      {/* Caixa de Busca */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
        className="glass-card" 
        style={{ padding: 'clamp(1rem, 3.5vw, 1.5rem)', marginBottom: '1.75rem' }}
      >
        <label className="form-label" style={{ fontSize: '0.825rem' }}>
          Código de Validação do Certificado
        </label>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            value={inputCode} 
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Ex: ZA-VAL-8F92-K109" 
            className="form-input" 
            style={{ flex: '1 1 200px', minWidth: '0', fontFamily: 'monospace', fontWeight: '700', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', letterSpacing: '0.05em' }}
            required
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: '120px', flex: '1 1 auto' }}>
            <Search size={16} />
            {loading ? 'A VERIFICAR...' : 'VERIFICAR'}
          </button>
        </div>
      </form>

      {/* RESULTADO DA VALIDAÇÃO */}
      {searched && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              A consultar registos oficiais da Zaty Academy...
            </div>
          ) : certificateData ? (
            <div className="glass-card" style={{ padding: 'clamp(1.2rem, 3.5vw, 2.25rem)', border: certificateData.status === 'valido' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)' }}>
              {/* Badge Superior */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                {certificateData.status === 'valido' ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    borderRadius: '4px',
                    color: '#34D399',
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.925rem)',
                    fontWeight: '800',
                    letterSpacing: '0.03em',
                    lineHeight: 1.3
                  }}>
                    <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>CERTIFICADO VÁLIDO E AUTÊNTICO</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #EF4444',
                    borderRadius: '4px',
                    color: '#F87171',
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.925rem)',
                    fontWeight: '800',
                    letterSpacing: '0.03em',
                    lineHeight: 1.3
                  }}>
                    <XCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>CERTIFICADO REVOGADO / INATIVO</span>
                  </div>
                )}
              </div>

              {certificateData.status === 'revogado' && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '4px',
                  padding: '0.75rem 0.9rem',
                  color: '#FCA5A5',
                  marginBottom: '1.25rem',
                  fontSize: '0.84rem',
                  lineHeight: '1.4'
                }}>
                  <strong>Motivo da Revogação:</strong> {certificateData.revocation_reason || 'Determinação administrativa da instituição.'}
                </div>
              )}

              {/* Informações Públicas Seguras */}
              <div style={{
                background: 'rgba(0, 24, 48, 0.7)',
                borderRadius: '6px',
                padding: 'clamp(1rem, 3vw, 1.75rem)',
                border: '1px solid rgba(0, 163, 224, 0.2)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.15rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Titular do Certificado
                  </span>
                  <h3 style={{ fontSize: 'clamp(1.15rem, 4vw, 1.45rem)', color: '#00C7FD', marginTop: '0.2rem', fontWeight: '800', wordBreak: 'break-word', lineHeight: 1.25 }}>
                    {certificateData.student?.full_name}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Curso Formado</span>
                    <strong style={{ color: '#FFFFFF', wordBreak: 'break-word' }}>{certificateData.course?.title}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Carga Horária</span>
                    <strong style={{ color: '#FFFFFF' }}>{certificateData.workload_hours} Horas Lectivas</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Data de Conclusão</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatDate(certificateData.completion_date)}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Data de Emissão</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatDate(certificateData.issue_date)}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Número de Registo</span>
                    <span style={{ fontFamily: 'monospace', color: '#00C7FD', fontWeight: '700', wordBreak: 'break-all' }}>
                      {certificateData.certificate_number}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Código de Validação</span>
                    <span style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: '700', wordBreak: 'break-all' }}>
                      {certificateData.validation_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aviso de Confidencialidade e Segurança */}
              <div style={{
                fontSize: '0.78rem',
                color: '#64748B',
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                <ShieldCheck size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Em cumprimento às normas de privacidade e proteção de dados, informações pessoais sensíveis (como número de BI, endereço, telefone ou registos financeiros) não são expostas nesta página pública.
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2.5rem 1.75rem', textAlign: 'center' }}>
              <AlertTriangle size={42} color="#F59E0B" style={{ margin: '0 auto 0.85rem auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.45rem', color: '#FFFFFF' }}>Certificado Não Encontrado</h3>
              <p style={{ color: '#94A3B8', maxWidth: '480px', margin: '0 auto 1.25rem auto', fontSize: '0.875rem' }}>
                Não foi localizado nenhum registo correspondente ao código <strong>{inputCode}</strong> nos nossos arquivos. Verifique se o código foi digitado corretamente ou contacte a secretaria da Zaty Academy.
              </p>
              <button onClick={() => setSearched(false)} className="btn btn-secondary">
                Tentar Outro Código
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

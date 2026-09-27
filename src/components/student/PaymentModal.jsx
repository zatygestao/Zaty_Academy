import { useState } from 'react';
import Modal from '../common/Modal';
import { useSettings } from '../../context/SettingsContext';
import { submitPayment, uploadPrivateDocument } from '../../services/api';
import { validateFile } from '../../utils/validators';
import { 
  Smartphone, 
  Upload, 
  AlertCircle 
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, studentId, defaultAmount = '', onPaymentSuccess }) {
  const { settings } = useSettings();
  const paymentMethods = settings.payment_methods || {};

  const [paymentType, setPaymentType] = useState('matricula');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [amount, setAmount] = useState(defaultAmount || '');
  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentMethodConfig = paymentMethods[paymentMethod] || {
    name: paymentMethod.toUpperCase(),
    number: 'Não configurado',
    holder: 'ZATY ACADEMY',
    instructions: 'Efetue o pagamento e anexe o comprovativo.'
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const val = validateFile(file, { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] });
    if (!val.valid) {
      setErrorMsg(val.error);
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || Number(amount) <= 0) {
      return setErrorMsg('Por favor, informe um valor de pagamento válido.');
    }
    if (!proofFile) {
      return setErrorMsg('É obrigatório anexar o comprovativo (screenshot ou PDF da transação).');
    }

    setSubmitting(true);
    try {
      const proofUrl = await uploadPrivateDocument(proofFile, 'payment_proofs');

      await submitPayment({
        studentId,
        amount: Number(amount),
        paymentType,
        paymentMethod,
        referenceCode: referenceCode.trim() || null,
        proofFileUrl: proofUrl,
        proofFileName: proofFile.name,
        notes: notes.trim()
      });

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao submeter pagamento:', err);
      setErrorMsg(err.message || 'Falha ao registar o pagamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !submitting && onClose()} title="Solicitar Pagamento" maxWidth="600px">
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#FCA5A5',
          fontSize: '0.85rem',
          marginBottom: '1.15rem'
        }}>
          <AlertCircle size={17} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          {/* Tipo de Pagamento */}
          <div className="form-group">
            <label className="form-label">Tipo de Pagamento *</label>
            <select 
              value={paymentType} 
              onChange={(e) => setPaymentType(e.target.value)} 
              className="form-select"
            >
              <option value="matricula">Taxa de Matrícula</option>
              <option value="mensalidade">Mensalidade do Curso</option>
              <option value="certificado">Emissão de Certificado</option>
              <option value="outro">Outro Pagamento</option>
            </select>
          </div>

          {/* Método de Pagamento */}
          <div className="form-group">
            <label className="form-label">Método / Carteira Móvel *</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)} 
              className="form-select"
            >
              <option value="mpesa">Vodacom M-Pesa</option>
              <option value="emola">Movitel e-Mola</option>
              <option value="mkesh">Tmcel mKesh</option>
            </select>
          </div>
        </div>

        {/* BOX DE INSTRUÇÕES OFICIAIS DINÂMICAS */}
        <div style={{
          background: 'rgba(0, 114, 206, 0.15)',
          border: '1px solid rgba(0, 199, 253, 0.3)',
          borderRadius: '4px',
          padding: '1.15rem',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.65rem' }}>
            <Smartphone size={16} />
            Instruções Oficiais para Pagamento ({currentMethodConfig.name})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Número Oficial:</span>
              <strong style={{ fontSize: '1.05rem', color: '#00C7FD', letterSpacing: '0.05em' }}>
                {currentMethodConfig.number}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Nome do Titular:</span>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                {currentMethodConfig.holder}
              </strong>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.5', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.5rem' }}>
            {currentMethodConfig.instructions}
          </p>
        </div>

        <div className="grid-2">
          {/* Valor */}
          <div className="form-group">
            <label className="form-label">Valor Pago (MT) *</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="form-input" 
              placeholder="Ex: 2500" 
              required 
            />
          </div>

          {/* Código / Referência da Transação */}
          <div className="form-group">
            <label className="form-label">Código de Transação / SMS Operadora</label>
            <input 
              type="text" 
              value={referenceCode} 
              onChange={(e) => setReferenceCode(e.target.value)} 
              className="form-input" 
              placeholder="Ex: MP240912.1832..." 
            />
          </div>
        </div>

        {/* Upload do Comprovativo */}
        <div className="form-group">
          <label className="form-label">Comprovativo de Pagamento (Screenshot / Imagem / PDF) *</label>
          <div style={{
            border: '2px dashed rgba(0, 163, 224, 0.3)',
            borderRadius: '4px',
            padding: '1.25rem',
            textAlign: 'center',
            background: 'rgba(0, 24, 48, 0.7)'
          }}>
            {proofPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <img src={proofPreview} alt="Comprovativo" style={{ maxHeight: '110px', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.3)' }} />
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  Trocar Ficheiro
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={28} color="#00C7FD" />
                <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: '600' }}>
                  {proofFile ? proofFile.name : 'Carregar Screenshot ou Ficheiro PDF'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  O pagamento ficará PENDENTE até confirmação da administração
                </span>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="form-group">
          <label className="form-label">Observações Adicionais (Opcional)</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="form-textarea" 
            placeholder="Alguma nota explicativa sobre este pagamento..."
            rows="2"
          />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '1.15rem' }}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={submitting} 
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="btn btn-primary"
          >
            {submitting ? 'A ENVIAR COMPROVATIVO...' : 'ENVIAR COMPROVATIVO'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

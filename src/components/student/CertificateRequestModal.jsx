import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { createCertificateRequest, getCourses } from '../../services/api';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  GraduationCap, 
  Building2, 
  HelpCircle,
  FileCheck
} from 'lucide-react';

export default function CertificateRequestModal({ isOpen, onClose, student, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Enrolled courses from student object
  const enrolledCourses = (student?.enrollments || [])
    .map(e => e.course)
    .filter(Boolean);

  const [form, setForm] = useState({
    courseId: '',
    purpose: 'Apresentação a Entidade Empregadora',
    deliveryType: 'Digital (PDF Autenticado com QR Code)',
    notes: '',
    declaredTerms: false
  });

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      return;
    }

    // Set default course from student enrollments if available
    if (enrolledCourses.length > 0) {
      setForm(prev => ({
        ...prev,
        courseId: enrolledCourses[0].id
      }));
    } else {
      // Fallback: load active courses
      async function loadAll() {
        setLoadingCourses(true);
        try {
          const list = await getCourses(true);
          setCourses(list || []);
          if (list?.length > 0) {
            setForm(prev => ({ ...prev, courseId: list[0].id }));
          }
        } catch (err) {
          console.error('Erro ao carregar cursos:', err);
        } finally {
          setLoadingCourses(false);
        }
      }
      loadAll();
    }
  }, [isOpen, student]);

  const availableCourses = enrolledCourses.length > 0 ? enrolledCourses : courses;
  const selectedCourse = availableCourses.find(c => String(c.id) === String(form.courseId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!student?.id) {
      setErrorMsg('Sessão inválida. Por favor, inicie sessão novamente.');
      return;
    }

    if (!form.courseId) {
      setErrorMsg('Por favor, selecione o curso que concluiu.');
      return;
    }

    if (!form.declaredTerms) {
      setErrorMsg('É necessário confirmar o termo de responsabilidade pedagógica para submeter o requerimento.');
      return;
    }

    setSubmitting(true);

    try {
      await createCertificateRequest({
        studentId: student.id,
        courseId: form.courseId,
        purpose: form.purpose,
        notes: `[Formato de Levantamento: ${form.deliveryType}]\n${form.notes || ''}`.trim()
      });

      setSuccessMsg('Requerimento submetido com sucesso à Direcção Académica! O seu pedido encontra-se agora em análise.');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Erro ao submeter requerimento:', err);
      setErrorMsg(err.message || 'Falha ao registar o requerimento oficial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Requerimento Oficial de Certificado de Habilitações"
      maxWidth="760px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Cabeçalho do Requerimento Institucional */}
        <div style={{ 
          background: 'rgba(0, 42, 78, 0.45)', 
          border: '1px solid rgba(0, 163, 224, 0.3)', 
          borderRadius: '8px', 
          padding: '1.25rem',
          borderLeft: '4px solid #00C7FD'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Building2 size={18} color="#00C7FD" />
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', color: '#00C7FD', textTransform: 'uppercase' }}>
              DIRECÇÃO GERAL & ACADÉMICA • ZATY ACADEMY
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#F1F5F9', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            «Exmo(a). Sr(a). Diretor(a) Geral da Zaty Academy, venho por este meio requerer respeitosamente a V. Excia. a emissão e homologação do meu Certificado Oficial de Conclusão de Formação Profissional.»
          </p>
        </div>

        {errorMsg && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.4)', 
            padding: '0.85rem 1rem', 
            borderRadius: '6px', 
            color: '#FCA5A5', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.15)', 
            border: '1px solid rgba(16, 185, 129, 0.4)', 
            padding: '0.85rem 1rem', 
            borderRadius: '6px', 
            color: '#34D399', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dados Pré-Estruturados do Requerente (Estudante) */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} color="#00C7FD" />
            1. Identificação do(a) Formando(a) Requerente
          </h4>
          <div style={{ 
            background: 'rgba(2, 11, 20, 0.6)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '6px', 
            padding: '0.85rem 1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.825rem'
          }}>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Nome Completo:</span>
              <strong style={{ color: '#FFFFFF' }}>{student?.full_name || 'Não identificado'}</strong>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Código de Estudante:</span>
              <strong style={{ color: '#00C7FD', fontFamily: 'monospace' }}>{student?.student_code || '---'}</strong>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Documento de Identificação:</span>
              <strong style={{ color: '#E2E8F0' }}>{student?.id_number || student?.bi_number || 'Conforme registo'}</strong>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Contacto Telefónico:</span>
              <strong style={{ color: '#E2E8F0' }}>{student?.phone || '---'}</strong>
            </div>
          </div>
        </div>

        {/* Seleção do Curso Concluído */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <GraduationCap size={15} color="#00C7FD" />
            2. Curso de Formação Profissional a Certificar *
          </h4>

          {loadingCourses ? (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>A carregar cursos disponíveis...</div>
          ) : (
            <select
              value={form.courseId}
              onChange={e => setForm({ ...form, courseId: e.target.value })}
              className="form-input"
              required
              style={{ width: '100%' }}
            >
              <option value="">-- Selecione o Curso Concluído --</option>
              {availableCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name || course.title} {course.duration ? `(${course.duration})` : ''}
                </option>
              ))}
            </select>
          )}

          {selectedCourse && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#94A3B8' }}>
              Carga horária estimada: <strong style={{ color: '#00C7FD' }}>{selectedCourse.workload_hours || selectedCourse.duration || 'Conforme Plano Curricular'}</strong>
            </div>
          )}
        </div>

        {/* Motivo e Formato de Entrega */}
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Finalidade / Motivo da Solicitação *</label>
            <select
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              className="form-input"
            >
              <option value="Apresentação a Entidade Empregadora">Apresentação a Entidade Empregadora</option>
              <option value="Candidatura a Emprego / Concurso Público">Candidatura a Emprego / Concurso Público</option>
              <option value="Ingresso / Equivalência no Ensino Superior">Ingresso / Equivalência no Ensino Superior</option>
              <option value="Progressão de Carreira / Promoção">Progressão de Carreira / Promoção</option>
              <option value="Arquivo Pessoal / Comprovação de Habilitações">Arquivo Pessoal / Comprovação de Habilitações</option>
              <option value="Outro Motivo">Outro Motivo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Formato de Levantamento Pretendido</label>
            <select
              value={form.deliveryType}
              onChange={e => setForm({ ...form, deliveryType: e.target.value })}
              className="form-input"
            >
              <option value="Digital (PDF Autenticado com QR Code)">Digital (PDF Autenticado com QR Code)</option>
              <option value="Presencial na Secretaria + Cópia Digital">Presencial na Secretaria + Cópia Digital</option>
            </select>
          </div>
        </div>

        {/* Observações Opcionais */}
        <div className="form-group">
          <label className="form-label">Observações Adicionais (Opcional)</label>
          <textarea
            rows="2"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="form-input"
            placeholder="Ex: Urgência para concurso até 30 do corrente mês, especificação de média, etc."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Declaração de Responsabilidade Pedagógica */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '0.65rem', 
          background: 'rgba(0, 42, 78, 0.4)', 
          border: '1px solid rgba(0, 163, 224, 0.25)', 
          padding: '0.85rem', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '0.825rem',
          color: '#CBD5E1'
        }}>
          <input
            type="checkbox"
            checked={form.declaredTerms}
            onChange={e => setForm({ ...form, declaredTerms: e.target.checked })}
            style={{ marginTop: '0.2rem' }}
          />
          <span>
            Declaro sob compromisso de honra que assisti com aproveitamento à formação indicada e concordo que o levantamento do certificado fica sujeito à liquidação da respectiva taxa administrativa e validação da Direção Geral da Zaty Academy.
          </span>
        </label>

        {/* Ações do Rodapé */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-outline"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting || !form.declaredTerms}
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #0072B5 0%, #00C7FD 100%)',
              border: 'none',
              padding: '0.6rem 1.4rem',
              fontWeight: '700'
            }}
          >
            <Send size={16} />
            <span>{submitting ? 'A Submeter Requerimento...' : 'SUBMETER REQUERIMENTO'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}

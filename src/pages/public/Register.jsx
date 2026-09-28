import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  getCourses, 
  registerStudentWithEnrollment, 
  uploadPublicFile, 
  uploadPrivateDocument, 
  checkStudentDuplicates, 
  enrollAdditionalCourse,
  getStudentCoursesEligibility 
} from '../../services/api';
import { calculateAge, formatCurrency } from '../../utils/formatters';
import { isValidMozPhone, isValidEmail, validateFile } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import SEO from '../../components/common/SEO';
import { 
  GraduationCap, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  User, 
  BookOpen, 
  ShieldCheck, 
  PlusCircle,
  LogIn,
  Camera,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Sparkles,
  Clock,
  Shield,
  RotateCcw,
  Ban
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Register() {
  const [searchParams] = useSearchParams();
  const { student, isAdmin, isTeacher, profile, loading: authLoading, refreshProfile } = useAuth();
  const preselectedCourseId = searchParams.get('curso');

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateAccountError, setDuplicateAccountError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Etapa atual do fluxo multi-etapas (1: Curso, 2: Pessoal, 3: Contacto, 4: Documentos, 5: Acesso & Revisão)
  const [currentStep, setCurrentStep] = useState(1);

  // Estado para aluno já inscrito solicitando novo curso
  const [showAdditionalCourseForm, setShowAdditionalCourseForm] = useState(false);
  const [selectedAdditionalCourse, setSelectedAdditionalCourse] = useState('');
  const [submittingAdditional, setSubmittingAdditional] = useState(false);
  const [additionalSuccess, setAdditionalSuccess] = useState(null);
  const [eligibilityMap, setEligibilityMap] = useState({});

  // Visibilidade de senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    course_id: '',
    full_name: '',
    birth_date: '',
    gender: 'M',
    id_document_number: '',
    naturalidade: 'Nampula',
    distrito: 'Nampula',
    provincia: 'Nampula',
    father_name: '',
    mother_name: '',
    phone: '',
    alternative_phone: '',
    email: '',
    city: 'Nampula',
    neighborhood: '',
    password: '',
    confirm_password: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docFile, setDocFile] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await getCourses();
        setCourses(data || []);
        if (preselectedCourseId) {
          setFormData(prev => ({ ...prev, course_id: preselectedCourseId }));
          setSelectedAdditionalCourse(preselectedCourseId);
        } else if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, course_id: data[0].id }));
          setSelectedAdditionalCourse(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    fetchCourses();
  }, [preselectedCourseId]);

  // Carrega mapa de elegibilidade académica para o estudante logado
  useEffect(() => {
    if (!student?.id) return;
    let isMounted = true;
    getStudentCoursesEligibility(student.id).then(map => {
      if (isMounted && map) {
        setEligibilityMap(map);
      }
    }).catch(err => {
      console.warn('Erro ao carregar elegibilidade de cursos:', err);
    });
    return () => { isMounted = false; };
  }, [student?.id]);

  const age = calculateAge(formData.birth_date);
  const selectedCourse = courses.find(c => c.id === formData.course_id);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setDuplicateAccountError(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const val = validateFile(file, { maxSizeMB: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] });
    if (!val.valid) {
      setErrorMsg(val.error);
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const val = validateFile(file, { maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'] });
    if (!val.valid) {
      setErrorMsg(val.error);
      return;
    }

    setDocFile(file);
    setErrorMsg('');
  };

  const handleRemoveDoc = () => {
    setDocFile(null);
  };

  // Navegação e validação entre etapas
  const handleNextStep = async () => {
    setErrorMsg('');

    if (currentStep === 1) {
      if (!formData.course_id) {
        return setErrorMsg('Por favor, selecione o curso pretendido.');
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      if (!formData.full_name.trim()) {
        return setErrorMsg('Por favor, informe o seu nome completo.');
      }
      if (!formData.birth_date) {
        return setErrorMsg('Por favor, indique a sua data de nascimento.');
      }
      if (!formData.naturalidade?.trim()) {
        return setErrorMsg('Por favor, indique a sua naturalidade (local de nascimento).');
      }
      if (!formData.distrito?.trim()) {
        return setErrorMsg('Por favor, indique o seu distrito.');
      }
      if (!formData.father_name?.trim() || !formData.mother_name?.trim()) {
        return setErrorMsg('Por favor, informe a filiação completa (nome do pai e da mãe) para emissão de certificados oficiais.');
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      if (!formData.phone.trim()) {
        return setErrorMsg('Por favor, informe o seu número de telefone.');
      }
      if (!isValidMozPhone(formData.phone)) {
        return setErrorMsg('Número de telefone inválido. Insira um número moçambicano válido (ex: 84 123 4567).');
      }
      if (!formData.email.trim() || !isValidEmail(formData.email)) {
        return setErrorMsg('Por favor, insira um endereço de e-mail válido.');
      }
      if (!formData.city.trim() || !formData.neighborhood.trim()) {
        return setErrorMsg('Por favor, indique a sua cidade e bairro de residência.');
      }

      // Verificação ativa de duplicados antes de avançar para documentos
      try {
        const dupCheck = await checkStudentDuplicates({
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          idDocumentNumber: formData.id_document_number.trim()
        });

        if (dupCheck.duplicate) {
          setDuplicateAccountError({
            field: dupCheck.field,
            studentCode: dupCheck.student.student_code,
            fullName: dupCheck.student.full_name
          });
          return;
        }
      } catch (err) {
        console.warn('Verificação de duplicados em segundo plano:', err);
      }

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 4) {
      // Documentos e foto são opcionais no primeiro momento (podem ser anexados depois)
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submissão final do cadastro
  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setDuplicateAccountError(null);

    if (!formData.password || formData.password.length < 6) {
      return setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
    }
    if (formData.password !== formData.confirm_password) {
      return setErrorMsg('As palavras-passe não coincidem.');
    }

    setSubmitting(true);
    try {
      let photoUrl = null;
      let docUrl = null;

      if (photoFile) {
        try {
          photoUrl = await uploadPublicFile(photoFile, 'student_photos');
        } catch (e) {
          console.warn('Upload de foto ignorado ou em fallback:', e);
        }
      }

      if (docFile) {
        try {
          docUrl = await uploadPrivateDocument(docFile, 'identification_docs');
        } catch (e) {
          console.warn('Upload de documento ignorado ou em fallback:', e);
        }
      }

      const studentPayload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        birth_date: formData.birth_date,
        age: age || 18,
        gender: formData.gender,
        phone: formData.phone.trim(),
        alternative_phone: formData.alternative_phone.trim() || null,
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim(),
        id_document_number: formData.id_document_number.trim() || null,
        naturalidade: formData.naturalidade?.trim() || 'Nampula',
        distrito: formData.distrito?.trim() || 'Nampula',
        provincia: formData.provincia?.trim() || 'Nampula',
        father_name: formData.father_name?.trim() || null,
        mother_name: formData.mother_name?.trim() || null,
        id_document_url: docUrl,
        photo_url: photoUrl
      };

      const result = await registerStudentWithEnrollment({
        studentData: studentPayload,
        courseId: formData.course_id,
        password: formData.password
      });

      setSuccessData(result);
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      console.error('Erro ao submeter inscrição:', err);
      if (err.message && err.message.includes('já está registado')) {
        setDuplicateAccountError({
          field: 'Dados Cadastrais',
          studentCode: 'Conta Existente',
          fullName: formData.full_name
        });
      } else {
        setErrorMsg(err.message || 'Falha ao processar a inscrição. Verifique os dados e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submissão de Curso Adicional por Estudante Existente
  const handleEnrollAdditional = async (e) => {
    e.preventDefault();
    if (!selectedAdditionalCourse) {
      return setErrorMsg('Por favor, selecione o curso que deseja adicionar.');
    }

    setSubmittingAdditional(true);
    setErrorMsg('');

    try {
      const enr = await enrollAdditionalCourse({
        studentId: student.id,
        courseId: selectedAdditionalCourse
      });

      setAdditionalSuccess(enr);
      if (refreshProfile) await refreshProfile();
      try {
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error('Erro ao matricular em curso adicional:', err);
      setErrorMsg(err.message || 'Não foi possível solicitar o novo curso.');
    } finally {
      setSubmittingAdditional(false);
    }
  };

  // 0. A CARREGAR SESSÃO DO UTILIZADOR
  if (authLoading) {
    return (
      <div className="container" style={{ padding: '4.5rem 1rem', maxWidth: '680px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2rem' }}>
          <div style={{ color: '#00C7FD', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.6rem' }}>
            A carregar portal de inscrições...
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>A verificar credenciais e disponibilidade do sistema.</p>
        </div>
      </div>
    );
  }

  // 1. CASO UM FORMADOR ACESSE A PÁGINA DE INSCRIÇÃO ONLINE
  if (isTeacher || profile?.role === 'formador') {
    return (
      <div className="container" style={{ padding: '4.5rem 1rem', maxWidth: '680px' }}>
        <div className="glass-card" style={{ padding: '2.75rem 2rem', textAlign: 'center', border: '1px solid rgba(0, 199, 253, 0.45)' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0, 114, 206, 0.25) 0%, rgba(0, 199, 253, 0.15) 100%)',
            border: '2px solid #00C7FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 8px 24px rgba(0, 199, 253, 0.25)'
          }}>
            <GraduationCap size={36} color="#00C7FD" />
          </div>

          <span className="badge badge-info" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Acesso Restrito — Formador
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem' }}>
            Inscrição Online Bloqueada
          </h2>

          <p style={{ color: '#E2E8F0', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
            Você está atualmente autenticado com o perfil de <strong>Formador</strong> da Zaty Academy. Os formadores não realizam inscrição online de estudantes. Esta área destina-se exclusivamente a novos estudantes e candidatos.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/formador" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} />
              <span>Aceder ao Painel do Formador</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. CASO UM ADMINISTRADOR ACESSE A PÁGINA DE INSCRIÇÃO
  if (isAdmin) {
    return (
      <div className="container" style={{ padding: '4.5rem 1rem', maxWidth: '680px' }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0072CE 0%, #005A9E 100%)',
            border: '2px solid #00C7FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 4px 18px rgba(0, 199, 253, 0.3)'
          }}>
            <Shield size={32} color="#FFFFFF" />
          </div>

          <span className="badge badge-info" style={{ marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Acesso Administrativo
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem' }}>
            Painel de Gestão Ativo
          </h2>

          <p style={{ color: '#E2E8F0', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
            Você está autenticado como administrador e não precisa realizar uma inscrição de estudante.
          </p>

          <Link to="/admin" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} />
            <span>Voltar para o Painel Administrativo</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. CASO O ESTUDANTE JÁ ESTEJA AUTENTICADO
  if (student) {
    const isSuspended = (student.enrollment_status === 'suspenso' || student.status === 'suspenso');
    const isPending = (student.enrollment_status === 'pendente' || student.status === 'pendente');
    const isRejected = (student.enrollment_status === 'rejeitado' || student.status === 'rejeitado');

    // Cenário: Conta Suspensa
    if (isSuspended) {
      return (
        <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '720px' }}>
          <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Ban size={32} color="#EF4444" />
            </div>

            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '0.75rem'
            }}>
              Conta Suspensa
            </span>

            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem', lineHeight: 1.4 }}>
              A sua conta encontra-se suspensa. Entre em contacto com a administração para obter mais informações.
            </h2>

            {student.suspension_reason && (
              <p style={{ color: '#FCA5A5', fontSize: '0.88rem', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
                Motivo: {student.suspension_reason}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Voltar ao Login
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Cenário: Inscrição Rejeitada
    if (isRejected) {
      return (
        <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '720px' }}>
          <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertCircle size={32} color="#EF4444" />
            </div>

            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '0.75rem'
            }}>
              Inscrição Recusada
            </span>

            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem' }}>
              Inscrição Não Aprovada
            </h2>

            <p style={{ color: '#E2E8F0', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              A sua inscrição foi analisada pela coordenação pedagógica e não pôde ser aprovada.
            </p>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '6px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#FCA5A5', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Motivo da Recusa:
              </div>
              <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontStyle: 'italic' }}>
                "{student.rejection_reason || student.enrollments?.[0]?.rejection_reason || 'Documentação não legível ou requisitos incompletos. Pode submeter uma nova solicitação.'}"
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/estudante" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Ir para o Painel</span>
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={() => setShowAdditionalCourseForm(true)}
                className="btn btn-primary btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RotateCcw size={18} />
                <span>Submeter Nova Inscrição</span>
              </button>
            </div>

            {showAdditionalCourseForm && (
              <form onSubmit={handleEnrollAdditional} style={{
                background: 'rgba(0, 32, 60, 0.9)',
                border: '1px solid rgba(0, 199, 253, 0.35)',
                borderRadius: '6px',
                padding: '1.5rem',
                marginTop: '1.75rem',
                textAlign: 'left'
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.35rem' }}>
                  Submeter Nova Solicitação de Inscrição
                </h3>
                <p style={{ color: '#A5CBEA', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Selecione o curso para re-submissão pedagógica.
                </p>

                <div className="form-group">
                  <label className="form-label">Curso Pretendido *</label>
                  <select
                    value={selectedAdditionalCourse}
                    onChange={(e) => {
                      setSelectedAdditionalCourse(e.target.value);
                      setErrorMsg('');
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">-- Escolha um Curso --</option>
                    {courses.map(c => {
                      const elig = eligibilityMap[c.id];
                      const isBlocked = elig && !elig.eligible;
                      const isReproved = elig && elig.canReEnrollReproved;
                      return (
                        <option 
                          key={c.id} 
                          value={c.id}
                          disabled={isBlocked}
                        >
                          {c.title} ({formatCurrency(c.price)})
                          {isBlocked ? ' — [CONCLUÍDO & CERTIFICADO - BLOQUEADO]' : isReproved ? ' — [REPROVAÇÃO PRÉVIA - MATRÍCULA PERMITIDA]' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse] && !eligibilityMap[selectedAdditionalCourse].eligible && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      {eligibilityMap[selectedAdditionalCourse].message}
                    </div>
                  )}

                  {selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse]?.canReEnrollReproved && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid #0EA5E9', color: '#7DD3FC', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      {eligibilityMap[selectedAdditionalCourse].message}
                    </div>
                  )}

                  {errorMsg && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      {errorMsg}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdditionalCourseForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdditional || (selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse]?.eligible === false)}
                    className="btn btn-primary"
                  >
                    {submittingAdditional ? 'A submeter...' : 'Confirmar Nova Inscrição'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    // Cenário 2: Inscrição Pendente
    if (isPending) {
      return (
        <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '720px' }}>
          <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Clock size={32} color="#F59E0B" />
            </div>

            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FCD34D',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '0.75rem'
            }}>
              Inscrição em Análise Pedagógica
            </span>

            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem' }}>
              Inscrição Pendente de Aprovação
            </h2>

            <p style={{ color: '#E2E8F0', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Sua inscrição está pendente de aprovação. A nossa equipe irá analisar os seus dados. Aguarde até 24 horas e volte mais tarde para consultar o estado da sua inscrição.
            </p>

            {/* Cartão de Detalhes da Inscrição */}
            <div style={{
              background: 'rgba(0, 24, 48, 0.85)',
              border: '1px solid rgba(0, 163, 224, 0.25)',
              borderRadius: '6px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Código de Estudante:</span>
                  <strong style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '1rem' }}>{student.student_code}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Nome do Estudante:</span>
                  <strong style={{ color: '#FFFFFF' }}>{student.full_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Curso Solicitado:</span>
                  <span style={{ color: '#CBD5E1' }}>{student.enrollments?.[0]?.course?.title || 'Formação Zaty Academy'}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Estado da Candidatura:</span>
                  <span style={{ color: '#FCD34D', fontWeight: '700' }}>Aguardando Análise</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/estudante" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Ir para o Painel</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Cenário 1: Estudante Já Inscrito e Aprovado
    return (
      <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '720px' }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <CheckCircle2 size={32} color="#10B981" />
          </div>

          <span className="badge badge-success" style={{ marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Inscrição Ativa
          </span>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem' }}>
            Você já possui uma inscrição no sistema!
          </h2>

          <p style={{ color: '#E2E8F0', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Você já possui uma inscrição no sistema. Deseja acessar o seu Painel de Estudante?
          </p>

          <div style={{
            background: 'rgba(0, 24, 48, 0.85)',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            borderRadius: '6px',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Código de Estudante:</span>
                <strong style={{ color: '#00C7FD', fontFamily: 'monospace', fontSize: '1rem' }}>{student.student_code}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Nome Completo:</span>
                <strong style={{ color: '#FFFFFF' }}>{student.full_name}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>E-mail:</span>
                <span style={{ color: '#CBD5E1' }}>{student.email}</span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>Telefone:</span>
                <span style={{ color: '#CBD5E1' }}>{student.phone}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/estudante" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Ir para o Painel</span>
              <ArrowRight size={18} />
            </Link>
            <button 
              onClick={() => setShowAdditionalCourseForm(!showAdditionalCourseForm)} 
              className="btn btn-secondary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} />
              <span>Solicitar Outro Curso</span>
            </button>
          </div>

          {/* Formulário de Curso Adicional */}
          {showAdditionalCourseForm && (
            <form onSubmit={handleEnrollAdditional} style={{
              background: 'rgba(0, 32, 60, 0.9)',
              border: '1px solid rgba(0, 199, 253, 0.35)',
              borderRadius: '6px',
              padding: '1.5rem',
              marginTop: '1.75rem',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.35rem' }}>
                Matricular em Mais um Curso
              </h3>
              <p style={{ color: '#A5CBEA', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Selecione a nova formação. O curso será adicionado ao seu histórico escolar.
              </p>

              <div className="form-group">
                <label className="form-label">Selecione o Curso Adicional *</label>
                <select
                  value={selectedAdditionalCourse}
                  onChange={(e) => {
                    setSelectedAdditionalCourse(e.target.value);
                    setErrorMsg('');
                  }}
                  className="form-select"
                  required
                >
                  <option value="">-- Escolha um Curso --</option>
                  {courses.map(c => {
                    const elig = eligibilityMap[c.id];
                    const isBlocked = elig && !elig.eligible;
                    const isReproved = elig && elig.canReEnrollReproved;
                    return (
                      <option 
                        key={c.id} 
                        value={c.id}
                        disabled={isBlocked}
                      >
                        {c.title} ({formatCurrency(c.price)})
                        {isBlocked ? ' — [CONCLUÍDO & CERTIFICADO - BLOQUEADO]' : isReproved ? ' — [REPROVAÇÃO PRÉVIA - MATRÍCULA PERMITIDA]' : ''}
                      </option>
                    );
                  })}
                </select>

                {selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse] && !eligibilityMap[selectedAdditionalCourse].eligible && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    {eligibilityMap[selectedAdditionalCourse].message}
                  </div>
                )}

                {selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse]?.canReEnrollReproved && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid #0EA5E9', color: '#7DD3FC', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    {eligibilityMap[selectedAdditionalCourse].message}
                  </div>
                )}

                {errorMsg && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    {errorMsg}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAdditionalCourseForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAdditional || (selectedAdditionalCourse && eligibilityMap[selectedAdditionalCourse]?.eligible === false)}
                  className="btn btn-primary"
                >
                  {submittingAdditional ? 'A registar matrícula...' : 'Confirmar Solicitação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. ECRÃ DE SUCESSO APÓS INSCRIÇÃO
  if (successData) {
    return (
      <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '680px' }}>
        <div className="glass-card" style={{ padding: '2.5rem 1.75rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <CheckCircle2 size={36} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.35rem', color: '#FFFFFF' }}>
            Inscrição Realizada com Sucesso!
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
            Bem-vindo à <strong>Zaty Academy</strong>. O seu cadastro foi concluído com sucesso.
          </p>

          <div style={{
            background: 'rgba(0, 24, 48, 0.85)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 163, 224, 0.25)',
            padding: '1.35rem',
            textAlign: 'left',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código do Aluno</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#00C7FD', fontFamily: 'monospace' }}>
                {successData.studentCode}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.74rem' }}>Nome Completo:</span>
                <strong style={{ color: '#FFFFFF' }}>{successData.student?.full_name}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.74rem' }}>Curso Inscrito:</span>
                <strong style={{ color: '#FFFFFF' }}>{selectedCourse?.title}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.74rem' }}>Estado da Matrícula:</span>
                <span className="badge badge-warning" style={{ display: 'inline-block', marginTop: '0.2rem' }}>Pendente</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '380px', margin: '0 auto' }}>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              <LogIn size={18} />
              Entrar na Área do Estudante
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>
              Voltar à Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Definição dos Passos do Assistente
  const steps = [
    { num: 1, label: 'Curso' },
    { num: 2, label: 'Pessoal' },
    { num: 3, label: 'Contacto' },
    { num: 4, label: 'Documentos' },
    { num: 5, label: 'Revisão' }
  ];

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '780px' }}>
      <SEO 
        title="Inscrição Online de Estudantes" 
        description="Inscrições abertas para cursos práticos de tecnologia na Zaty Academy. Preencha a sua inscrição online rápida e segura."
      />
      {/* Cabeçalho da Ficha */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <BrandLogo size={58} glow={true} style={{ justifyContent: 'center', marginBottom: '0.85rem' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem', color: '#FFFFFF' }}>
          Inscrição Online
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
          ZATY ACADEMY — Centro de Formação em Informática e Tecnologia
        </p>
      </div>

      {/* BARRA DE PROGRESSO MULTI-ETAPAS MOBILE-FRIENDLY */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 24, 48, 0.85)',
        border: '1px solid rgba(0, 163, 224, 0.25)',
        borderRadius: '6px',
        padding: '0.85rem 1rem',
        marginBottom: '1.75rem'
      }}>
        {steps.map((s, idx) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <div 
              key={s.num} 
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: idx < steps.length - 1 ? 1 : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: isDone ? '#10B981' : (isCurrent ? '#0066B2' : 'rgba(0, 42, 78, 0.6)'),
                  border: isCurrent ? '2px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.3)',
                  color: isDone || isCurrent ? '#FFFFFF' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  boxShadow: isCurrent ? '0 0 10px rgba(0, 199, 253, 0.6)' : 'none'
                }}>
                  {isDone ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: isCurrent ? '700' : '500',
                  color: isCurrent ? '#00C7FD' : (isDone ? '#10B981' : '#64748B'),
                  display: 'block',
                  textAlign: 'center'
                }}>
                  {s.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: isDone ? '#10B981' : 'rgba(0, 163, 224, 0.25)',
                  margin: '0 0.4rem',
                  marginBottom: '1rem'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Alerta de Conta Duplicada Existente */}
      {duplicateAccountError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          borderRadius: '6px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <AlertCircle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Conta Existente Detetada
              </h3>
              <p style={{ color: '#FECACA', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                Os dados informados para <strong>{duplicateAccountError.field}</strong> já estão associados a uma conta de estudante existente (Código: <strong>{duplicateAccountError.studentCode}</strong> — {duplicateAccountError.fullName}).
              </p>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary btn-sm">
                  <LogIn size={15} />
                  Iniciar Sessão
                </Link>
                <button
                  type="button"
                  onClick={() => setDuplicateAccountError(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Corrigir Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de Erro Geral */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#F87171',
          padding: '0.85rem 1.15rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.75rem 1.35rem' }}>
        {/* ===================================================
            ETAPA 1: ESCOLHA DO CURSO
           =================================================== */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <BookOpen size={22} color="#00C7FD" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>
                  Etapa 1: Formação Pretendida
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Selecione a área profissional que deseja aprender
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Selecione o Curso *</label>
              {loadingCourses ? (
                <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>A carregar catálogo de cursos...</div>
              ) : (
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Escolha um Curso --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {formatCurrency(c.price)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCourse && (
              <div style={{
                background: 'rgba(0, 32, 60, 0.8)',
                border: '1px solid rgba(0, 163, 224, 0.25)',
                borderRadius: '6px',
                padding: '1.25rem',
                marginTop: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF' }}>{selectedCourse.title}</h4>
                  <span className="badge badge-info" style={{ flexShrink: 0 }}>Oficial</span>
                </div>

                <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {selectedCourse.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.825rem', borderTop: '1px solid rgba(0, 163, 224, 0.2)', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Duração:</span>
                    <strong style={{ color: '#FFFFFF' }}>{selectedCourse.duration}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Carga Horária:</span>
                    <strong style={{ color: '#FFFFFF' }}>{selectedCourse.workload_hours} Horas</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Mensalidade:</span>
                    <strong style={{ color: '#00C7FD', fontSize: '1rem' }}>{formatCurrency(selectedCourse.price)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', maxWidth: '280px' }}
              >
                <span>Avançar para Dados Pessoais</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ETAPA 2: DADOS PESSOAIS
           =================================================== */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <User size={22} color="#00C7FD" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>
                  Etapa 2: Identificação Pessoal
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Informe os seus dados cadastrais oficiais
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ex: Alberto João Mabunda"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Data de Nascimento *</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
                {age !== null && (
                  <span style={{ fontSize: '0.75rem', color: '#00C7FD', marginTop: '0.2rem', display: 'block' }}>
                    Idade calculada: {age} anos
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Género *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Número do B.I. ou Passaporte (Opcional)</label>
              <input
                type="text"
                name="id_document_number"
                value={formData.id_document_number}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ex: 110100234567M"
              />
            </div>

            {/* Dados Civis para Emissão de Certificados e Documentos Oficiais */}
            <div style={{
              margin: '1.25rem 0 0.5rem 0',
              padding: '1.15rem',
              background: 'rgba(0, 32, 60, 0.5)',
              border: '1px solid rgba(0, 163, 224, 0.25)',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <ShieldCheck size={18} color="#00C7FD" />
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#00C7FD',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Dados Civis para Certificados e Documentos Oficiais
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Naturalidade (Localidade/Cidade) *</label>
                  <input
                    type="text"
                    name="naturalidade"
                    value={formData.naturalidade}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ex: Nampula"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Distrito de Naturalidade *</label>
                  <input
                    type="text"
                    name="distrito"
                    value={formData.distrito}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ex: Distrito de Nampula"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Província *</label>
                  <select
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="Nampula">Nampula</option>
                    <option value="Cabo Delgado">Cabo Delgado</option>
                    <option value="Niassa">Niassa</option>
                    <option value="Zambézia">Zambézia</option>
                    <option value="Tete">Tete</option>
                    <option value="Manica">Manica</option>
                    <option value="Sofala">Sofala</option>
                    <option value="Inhambane">Inhambane</option>
                    <option value="Gaza">Gaza</option>
                    <option value="Maputo Província">Maputo Província</option>
                    <option value="Maputo Cidade">Maputo Cidade</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome do Pai (Filiação) *</label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ex: Denito Graciano"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome da Mãe (Filiação) *</label>
                  <input
                    type="text"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ex: Lidia Maria da Conceição"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '130px' }}
              >
                <ArrowLeft size={17} />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '160px' }}
              >
                <span>Avançar para Contacto</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ETAPA 3: CONTACTOS & RESIDÊNCIA
           =================================================== */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <Phone size={22} color="#00C7FD" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>
                  Etapa 3: Contactos & Residência
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Canais para envio de notificações e comunicações
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Número de Telefone (Principal) *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: 84 123 4567"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone Alternativo</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="alternative_phone"
                  value={formData.alternative_phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: 82 987 6543"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Endereço de E-mail *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Cidade *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: Nampula"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bairro de Residência *</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: Polana Caniço B"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '130px' }}
              >
                <ArrowLeft size={17} />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '160px' }}
              >
                <span>Avançar para Documentos</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ETAPA 4: FOTOGRAFIA & DOCUMENTOS
           =================================================== */}
        {currentStep === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <Camera size={22} color="#00C7FD" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>
                  Etapa 4: Fotografia & Documento
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Foto para o cartão de estudante e cópia do B.I. (Opcionais no ato)
                </span>
              </div>
            </div>

            {/* Upload de Foto */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Fotografia Tipo Passe (Galeria ou Câmara)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(0, 42, 78, 0.7)',
                  border: '2px dashed #00C7FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={26} color="#00C7FD" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <input
                    type="file"
                    id="photo-upload-input"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label htmlFor="photo-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      <Camera size={15} />
                      <span>{photoFile ? 'Alterar Foto' : 'Tirar ou Escolher Foto'}</span>
                    </label>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        title="Remover Foto"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.35rem', display: 'block' }}>
                    {photoFile ? photoFile.name : 'Formatos: JPG, PNG ou WEBP até 5 MB.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload do Documento de Identificação */}
            <div className="form-group">
              <label className="form-label">Cópia do B.I. ou Passaporte (PDF ou Imagem)</label>
              <input
                type="file"
                id="doc-upload-input"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleDocChange}
                style={{ display: 'none' }}
              />
              <div style={{
                background: 'rgba(0, 24, 48, 0.6)',
                border: '1px dashed rgba(0, 163, 224, 0.35)',
                borderRadius: '4px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={22} color="#00C7FD" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#FFFFFF' }}>
                      {docFile ? docFile.name : 'Nenhum ficheiro selecionado'}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                      {docFile ? `${(docFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Cópia digitalizada do documento (Máx: 10 MB)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label htmlFor="doc-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={15} />
                    <span>{docFile ? 'Substituir' : 'Selecionar'}</span>
                  </label>
                  {docFile && (
                    <button
                      type="button"
                      onClick={handleRemoveDoc}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '130px' }}
              >
                <ArrowLeft size={17} />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '160px' }}
              >
                <span>Avançar para Conclusão</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ETAPA 5: ACESSO, REVISÃO & CONFIRMAÇÃO
           =================================================== */}
        {currentStep === 5 && (
          <form onSubmit={handleFinalSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <Lock size={22} color="#00C7FD" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>
                  Etapa 5: Palavra-passe & Revisão
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Crie a sua palavra-passe de acesso ao Portal do Estudante
                </span>
              </div>
            </div>

            {/* Criação da Senha */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Palavra-passe de Acesso *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Palavra-passe *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Repita a palavra-passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Cartão de Resumo e Revisão */}
            <div style={{
              background: 'rgba(0, 24, 48, 0.85)',
              border: '1px solid rgba(0, 163, 224, 0.25)',
              borderRadius: '6px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#00C7FD', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resumo dos Dados da Inscrição
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Curso Selecionado:</span>
                  <strong style={{ color: '#FFFFFF' }}>{selectedCourse?.title}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Investimento:</span>
                  <strong style={{ color: '#00C7FD' }}>{formatCurrency(selectedCourse?.price || 0)}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Nome Completo:</span>
                  <strong style={{ color: '#FFFFFF' }}>{formData.full_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Contacto Telefónico:</span>
                  <strong style={{ color: '#FFFFFF' }}>{formData.phone}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>E-mail:</span>
                  <span style={{ color: '#CBD5E1' }}>{formData.email}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Localização:</span>
                  <span style={{ color: '#CBD5E1' }}>{formData.neighborhood}, {formData.city}</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Naturalidade / Origem:</span>
                  <span style={{ color: '#CBD5E1' }}>{formData.naturalidade} ({formData.distrito} - {formData.provincia})</span>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}>Filiação:</span>
                  <span style={{ color: '#CBD5E1' }}>{formData.father_name} e {formData.mother_name}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '130px' }}
              >
                <ArrowLeft size={17} />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ flex: 2, minWidth: '220px' }}
              >
                {submitting ? (
                  <span>A processar inscrição...</span>
                ) : (
                  <>
                    <Sparkles size={17} />
                    <span>Concluir Inscrição Oficial</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

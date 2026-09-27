import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import SEO from '../../components/common/SEO';
import { 
  BookOpen, 
  Clock, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Laptop, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function CoursesPublic() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCourses(true);
        setCourses(data || []);
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = [
    { id: 'todos', label: 'Todos os Cursos' },
    { id: 'informatica', label: 'Informática & Escritório' },
    { id: 'programacao', label: 'Programação & Web' },
    { id: 'design', label: 'Design Gráfico & Multimédia' },
    { id: 'redes', label: 'Redes & Manutenção' }
  ];

  const filteredCourses = courses.filter(c => {
    // Filtro por pesquisa
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (c.title || '').toLowerCase().includes(term);
      const matchDesc = (c.description || '').toLowerCase().includes(term);
      if (!matchTitle && !matchDesc) return false;
    }
    // Filtro por categoria (se definido)
    if (selectedCategory !== 'todos') {
      const cat = (c.category || '').toLowerCase();
      if (selectedCategory === 'informatica' && !cat.includes('info') && !cat.includes('office') && !cat.includes('básic')) return false;
      if (selectedCategory === 'programacao' && !cat.includes('prog') && !cat.includes('web') && !cat.includes('dev')) return false;
      if (selectedCategory === 'design' && !cat.includes('design') && !cat.includes('graf') && !cat.includes('mult')) return false;
      if (selectedCategory === 'redes' && !cat.includes('rede') && !cat.includes('manut') && !cat.includes('hard')) return false;
    }
    return true;
  });

  const toggleExpand = (courseId) => {
    setExpandedCourseId(prev => prev === courseId ? null : courseId);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--intel-bg-dark, #001224)' }}>
      <SEO 
        title="Nossos Cursos Profissionais" 
        description="Explore o catálogo completo de cursos práticos da Zaty Academy em Informática, Programação, Redes e Design. Inscrições abertas em Namicopo, Nampula com certificação validada por QR Code."
      />

      {/* Hero dos Cursos */}
      <section style={{
        padding: '4.5rem 1.5rem 3.5rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0, 40, 75, 0.5) 0%, rgba(0, 18, 36, 0.95) 100%)',
        borderBottom: '1px solid rgba(0, 163, 224, 0.25)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.95rem', borderRadius: '999px', background: 'rgba(0, 199, 253, 0.1)', border: '1px solid rgba(0, 199, 253, 0.35)', color: '#00C7FD', fontSize: '0.825rem', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
            <Sparkles size={15} />
            Inscrições Abertas — Ano Letivo 2026
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '1rem' }}>
            Cursos Práticos de <span style={{ color: '#00C7FD' }}>Alta Qualificação</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#A5CBEA', lineHeight: '1.7', margin: '0 auto 2rem auto', maxWidth: '650px' }}>
            Aulas intensivas em laboratórios com computadores individuais, metodologia 100% prática e certificados profissionais com QR Code de autenticidade.
          </p>

          {/* Barra de Pesquisa */}
          <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Pesquisar por curso, habilidade ou tecnologia..." 
              className="form-input" 
              style={{ paddingLeft: '3rem', paddingRight: '1rem', height: '48px', fontSize: '0.95rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      </section>

      {/* Lista de Cursos */}
      <section style={{ padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          {/* Filtro por Categorias */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  border: selectedCategory === cat.id ? '1px solid #00C7FD' : '1px solid rgba(0, 163, 224, 0.25)',
                  background: selectedCategory === cat.id ? 'rgba(0, 199, 253, 0.18)' : 'rgba(0, 28, 54, 0.6)',
                  color: selectedCategory === cat.id ? '#00C7FD' : '#94A3B8',
                  fontWeight: selectedCategory === cat.id ? '700' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0, 163, 224, 0.2)', borderTopColor: '#00C7FD', margin: '0 auto 1rem auto', animation: 'zatySpin 0.75s linear infinite' }} />
              <span>A carregar catálogo de cursos...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
              <BookOpen size={42} style={{ margin: '0 auto 1rem auto', color: '#00C7FD', opacity: 0.4 }} />
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum curso encontrado</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto' }}>Não encontramos nenhum curso para a pesquisa informada. Tente utilizar termos mais genéricos.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2rem'
            }}>
              {filteredCourses.map(course => {
                const isExpanded = expandedCourseId === course.id;
                const modules = course.modules || [];

                return (
                  <div 
                    key={course.id} 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      borderRadius: '10px', 
                      overflow: 'hidden', 
                      border: '1px solid rgba(0, 163, 224, 0.25)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(0, 199, 253, 0.5)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0, 163, 224, 0.25)'}
                  >
                    {/* Imagem de Capa do Curso */}
                    <div style={{ height: '175px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #00284D 0%, #001830 100%)' }}>
                      {course.cover_image_url || course.image_url ? (
                        <img 
                          src={course.cover_image_url || course.image_url} 
                          alt={course.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C7FD' }}>
                          <Laptop size={54} opacity={0.4} />
                        </div>
                      )}

                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 18, 36, 0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0, 199, 253, 0.35)',
                        color: '#00C7FD',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {course.category || 'Tecnologia'}
                      </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.65rem', lineHeight: '1.3' }}>
                        {course.title}
                      </h3>

                      <p style={{ color: '#94A3B8', fontSize: '0.885rem', lineHeight: '1.6', marginBottom: '1.25rem', flex: 1 }}>
                        {course.description || 'Formação profissional prática com laboratórios, materiais didáticos e preparação para o mercado.'}
                      </p>

                      {/* Metadados: Duração e Preço */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        background: 'rgba(0, 24, 48, 0.6)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 163, 224, 0.15)',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#A5CBEA', fontSize: '0.825rem' }}>
                          <Clock size={15} color="#00C7FD" />
                          <span>{course.duration_hours || 40} horas</span>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', textAlign: 'right' }}>Mensalidade</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#00C7FD' }}>
                            {formatCurrency(course.price || course.monthly_fee || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Lista de Módulos (se existirem) */}
                      {modules.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpand(course.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#00C7FD',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.4rem 0',
                              cursor: 'pointer',
                              fontSize: '0.825rem',
                              fontWeight: '600'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Layers size={14} />
                              {modules.length} Módulos Curriculares
                            </span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {isExpanded && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                              {modules.map((mod, idx) => (
                                <div key={mod.id || idx} style={{ fontSize: '0.8rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <CheckCircle2 size={12} color="#10B981" />
                                  <span>{mod.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão de Inscrição */}
                      <Link 
                        to={`/inscricao?curso=${course.id}`} 
                        className="btn btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: '700' }}
                      >
                        <span>Inscrever-se Neste Curso</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

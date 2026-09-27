import { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { 
  Play, 
  FileText, 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  Clock, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle 
} from 'lucide-react';
import { formatDate, getRemainingDays, isLessonExpired } from '../../utils/formatters';

export default function LessonViewerModal({
  isOpen,
  onClose,
  lesson,
  moduleTitle = '',
  isCompleted = false,
  onToggleComplete,
  onPrevLesson = null,
  onNextLesson = null
}) {
  const [activeTab, setActiveTab] = useState('auto');
  const [pdfZoom, setPdfZoom] = useState(100);

  const videoData = useMemo(() => {
    if (!lesson?.video_url) return null;
    const url = lesson.video_url.trim();

    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
      };
    }

    const vmMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vmMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vmMatch[1]}`
      };
    }

    return {
      type: 'direct',
      url
    };
  }, [lesson?.video_url]);

  if (!isOpen || !lesson) return null;

  const hasVideo = !!videoData;
  const hasPdf = !!lesson.pdf_url;
  const hasContent = !!(lesson.content || lesson.description);
  const isExpired = isLessonExpired(lesson.expires_at);
  const daysLeft = getRemainingDays(lesson.expires_at);

  const currentTab = activeTab === 'auto' 
    ? (hasVideo ? 'video' : hasPdf ? 'pdf' : 'content')
    : activeTab;

  const handlePrintPdf = () => {
    if (!lesson.pdf_url) return;
    const iframe = document.getElementById('lesson-pdf-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.open(lesson.pdf_url, '_blank');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={lesson.title} 
      maxWidth="960px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'rgba(0, 24, 48, 0.75)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 163, 224, 0.25)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {moduleTitle || 'Módulo do Curso'}
            </span>
            <div style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {lesson.duration_minutes && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <Clock size={13} color="#00C7FD" />
                  {lesson.duration_minutes} min
                </span>
              )}
              {hasPdf && lesson.expires_at && (
                <span style={{
                  fontSize: '0.72rem',
                  color: isExpired ? '#EF4444' : '#00C7FD',
                  background: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 199, 253, 0.1)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '3px'
                }}>
                  {isExpired ? 'Material expirado' : `PDF disponível por ${daysLeft} dias`}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onToggleComplete && onToggleComplete(lesson.id)}
              className={isCompleted ? 'btn btn-success btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Aula Concluída</span>
                </>
              ) : (
                <>
                  <Circle size={16} />
                  <span>Marcar como Concluída</span>
                </>
              )}
            </button>
          </div>
        </div>

        {(hasVideo + hasPdf + (hasContent ? 1 : 0)) > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(0, 163, 224, 0.2)', paddingBottom: '0.5rem' }}>
            {hasVideo && (
              <button
                onClick={() => setActiveTab('video')}
                className={`btn btn-sm ${currentTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Play size={14} />
                <span>Vídeo da Aula</span>
              </button>
            )}

            {hasPdf && (
              <button
                onClick={() => setActiveTab('pdf')}
                className={`btn btn-sm ${currentTab === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={14} />
                <span>Material Didático (PDF)</span>
              </button>
            )}

            {hasContent && (
              <button
                onClick={() => setActiveTab('content')}
                className={`btn btn-sm ${currentTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={14} />
                <span>Conteúdo & Instruções</span>
              </button>
            )}
          </div>
        )}

        <div style={{ minHeight: '380px', maxHeight: '68vh', overflowY: 'auto', borderRadius: '6px' }}>
          {currentTab === 'video' && hasVideo && (
            <div style={{ background: '#000000', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {videoData.type === 'youtube' || videoData.type === 'vimeo' ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={videoData.embedUrl}
                    title={lesson.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  src={videoData.url}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '520px', display: 'block' }}
                >
                  O seu navegador não suporta reprodução direta deste formato de vídeo.
                </video>
              )}
            </div>
          )}

          {currentTab === 'pdf' && hasPdf && (
            <div>
              {isExpired ? (
                <div style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  color: '#FCA5A5'
                }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 0.75rem auto' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>Prazo de Acesso Expirado</h4>
                  <p style={{ fontSize: '0.85rem' }}>
                    O período de acesso configurado para este material didático expirou em {formatDate(lesson.expires_at)}. Contacte a coordenação caso necessite de prorrogação.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0, 24, 48, 0.85)',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 163, 224, 0.2)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => setPdfZoom(prev => Math.max(prev - 15, 60))}
                        className="btn btn-secondary btn-sm"
                        title="Diminuir Zoom"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8', minWidth: '40px', textAlign: 'center', fontFamily: 'monospace' }}>
                        {pdfZoom}%
                      </span>
                      <button
                        onClick={() => setPdfZoom(prev => Math.min(prev + 15, 180))}
                        className="btn btn-secondary btn-sm"
                        title="Aumentar Zoom"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handlePrintPdf}
                        className="btn btn-secondary btn-sm"
                        title="Imprimir Material"
                      >
                        <Printer size={14} />
                        <span>Imprimir</span>
                      </button>
                      <a
                        href={lesson.pdf_url}
                        download
                        className="btn btn-primary btn-sm"
                        title="Baixar PDF no dispositivo"
                      >
                        <Download size={14} />
                        <span>Baixar Ficheiro</span>
                      </a>
                    </div>
                  </div>

                  <div style={{
                    background: '#0B132B',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '520px'
                  }}>
                    <iframe
                      id="lesson-pdf-iframe"
                      src={`${lesson.pdf_url}#zoom=${pdfZoom}`}
                      title="Documento Didático Integrado"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {(currentTab === 'content' || (!hasVideo && !hasPdf)) && (
            <div style={{
              background: 'rgba(0, 24, 48, 0.7)',
              borderRadius: '6px',
              padding: '1.5rem',
              border: '1px solid rgba(0, 163, 224, 0.2)',
              color: '#E2E8F0',
              lineHeight: '1.7',
              fontSize: '0.925rem'
            }}>
              {lesson.description && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Resumo da Aula
                  </h4>
                  <p style={{ color: '#94A3B8' }}>{lesson.description}</p>
                </div>
              )}

              {lesson.content ? (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#00C7FD', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Material e Instruções da Aula
                  </h4>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#F1F5F9' }}>
                    {lesson.content}
                  </div>
                </div>
              ) : (
                !lesson.description && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                    Esta aula contém instruções e orientações em desenvolvimento pelo formador.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderTop: '1px solid rgba(0, 163, 224, 0.2)',
          paddingTop: '0.85rem'
        }}>
          <button
            onClick={onPrevLesson}
            disabled={!onPrevLesson}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ChevronLeft size={16} />
            <span>Aula Anterior</span>
          </button>

          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
          >
            Fechar Aula
          </button>

          <button
            onClick={onNextLesson}
            disabled={!onNextLesson}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Próxima Aula</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

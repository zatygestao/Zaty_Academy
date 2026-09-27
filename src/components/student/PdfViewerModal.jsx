import { useState } from 'react';
import Modal from '../common/Modal';
import { Download, Printer, ZoomIn, ZoomOut, ExternalLink, FileText } from 'lucide-react';

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title = 'Material Didático' }) {
  const [zoom, setZoom] = useState(100);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="900px">
      <div style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
        {/* Barra de Ferramentas Otimizada para Toque */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 0.85rem',
          background: 'rgba(0, 24, 48, 0.9)',
          borderRadius: '4px',
          marginBottom: '0.75rem',
          border: '1px solid rgba(0, 163, 224, 0.25)',
          flexWrap: 'wrap',
          gap: '0.6rem'
        }}>
          {/* Controles de Zoom (Desktop / Tablet) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 15, 60))}
              className="btn btn-secondary btn-sm"
              title="Diminuir Zoom"
              style={{ minHeight: '38px', minWidth: '38px', padding: '0 8px' }}
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', minWidth: '44px', textAlign: 'center', fontFamily: 'monospace' }}>
              {zoom}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 15, 180))}
              className="btn btn-secondary btn-sm"
              title="Aumentar Zoom"
              style={{ minHeight: '38px', minWidth: '38px', padding: '0 8px' }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Ações de Download e Abertura Externa para Android */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              title="Imprimir Material"
              style={{ minHeight: '38px' }}
            >
              <Printer size={15} />
              <span className="hide-mobile">Imprimir</span>
            </button>

            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-secondary btn-sm"
              title="Abrir em Nova Aba"
              style={{ minHeight: '38px' }}
            >
              <ExternalLink size={15} />
              <span>Nova Aba</span>
            </a>

            <a 
              href={pdfUrl} 
              download 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary btn-sm"
              title="Baixar PDF"
              style={{ minHeight: '38px' }}
            >
              <Download size={15} />
              <span>Baixar PDF</span>
            </a>
          </div>
        </div>

        {/* Visualizador Embutido com Suporte a Android Fallback */}
        <div style={{
          flex: 1,
          background: '#070A12',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(0, 163, 224, 0.2)'
        }}>
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&zoom=${zoom}`} 
              title={title}
              style={{
                width: `${zoom}%`,
                height: '100%',
                border: 'none',
                margin: '0 auto',
                display: 'block',
                transition: 'width 0.2s ease'
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '0.5rem' }}>
              <FileText size={32} color="#00C7FD" />
              <span>Nenhum ficheiro PDF disponível para visualização.</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

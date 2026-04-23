import React from 'react';
import { FileText, Presentation, Image } from 'lucide-react';

export default function OriginalContent({ module }) {
  return (
    <div className="original-content animate-fade-in-up">
      {/* File badges */}
      <div className="file-badges">
        {module.files?.map((file, i) => (
          <span key={i} className="file-badge">
            {file.type === 'pdf' ? <FileText size={12} /> : <Presentation size={12} />}
            {file.name}
          </span>
        ))}
      </div>

      {/* Render pages/slides */}
      {module.files?.map((file, fi) => (
        <div key={fi}>
          {/* PDF pages with images */}
          {file.type === 'pdf' && file.pages?.map((page, pi) => (
            <div key={pi} className="original-page" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="original-page-header" style={{ padding: '12px 20px', margin: 0 }}>
                {file.name} — Page {page.pageNum}
              </div>
              
              {/* Rendered page image */}
              {page.imageDataUrl && (
                <div style={{ 
                  background: '#fff', 
                  display: 'flex', 
                  justifyContent: 'center',
                  borderBottom: page.text ? '1px solid var(--glass-border)' : 'none'
                }}>
                  <img
                    src={page.imageDataUrl}
                    alt={`Page ${page.pageNum}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Text content (collapsed by default if image exists) */}
              {page.text && !page.imageDataUrl && (
                <div className="original-page-text" style={{ padding: '16px 20px' }}>
                  {page.text}
                </div>
              )}
            </div>
          ))}

          {/* PPTX slides with images */}
          {file.type === 'pptx' && file.slides?.map((slide, si) => (
            <div key={si} className="original-page" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="original-page-header" style={{ padding: '12px 20px', margin: 0 }}>
                {file.name} — Slide {slide.slideNum}
              </div>
              
              {/* Slide text */}
              {slide.text && (
                <div className="original-page-text" style={{ padding: '16px 20px' }}>
                  {slide.text}
                </div>
              )}

              {/* Slide images */}
              {slide.images && slide.images.length > 0 && (
                <div style={{
                  padding: '12px 20px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderTop: slide.text ? '1px solid var(--glass-border)' : 'none',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    width: '100%',
                    fontSize: 'var(--font-xs)', 
                    color: 'var(--accent-cyan-light)', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '4px',
                  }}>
                    <Image size={12} /> Embedded Images
                  </div>
                  {slide.images.map((imgSrc, imgIdx) => (
                    <div
                      key={imgIdx}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--glass-border)',
                        maxWidth: '400px',
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt={`Slide ${slide.slideNum} image ${imgIdx + 1}`}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}

              {!slide.text && (!slide.images || slide.images.length === 0) && (
                <div className="original-page-text" style={{ padding: '16px 20px' }}>
                  (No content on this slide)
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {(!module.files || module.files.length === 0) && (
        <div className="empty-state">
          <p>No original content available.</p>
        </div>
      )}
    </div>
  );
}

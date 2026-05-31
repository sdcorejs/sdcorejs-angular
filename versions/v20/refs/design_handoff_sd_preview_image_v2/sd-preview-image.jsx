/* sd-preview-image v2 mockup — modernized image gallery viewer */

const previewTokens = {
  // Dark gallery shell — image viewer should be dark to focus on imagery
  shellBg:    '#0d0e10',
  shellBg2:   '#17191c',
  panelBg:    'rgba(15, 17, 20, 0.92)',
  divider:    'rgba(255,255,255,0.08)',
  fg:         '#f5f6f7',
  fgMuted:    'rgba(255,255,255,0.6)',
  fgSubtle:   'rgba(255,255,255,0.4)',
  accent:     '#3b82f6',
  accentSoft: 'rgba(59, 130, 246, 0.2)',
  danger:     '#ef4444',
  success:    '#22c55e',
};

const PreviewIcon = ({ name, size = 20, outlined = true, color, style }) => (
  <span
    className={outlined ? 'material-icons-outlined' : 'material-icons'}
    style={{ fontSize: size, lineHeight: 1, color, userSelect: 'none', verticalAlign: 'middle', ...style }}
  >{name}</span>
);

// ─── Sample images ─────────────────────────────────────────────────
const SAMPLE_IMAGES = [
  { id: '1', name: 'mat-tien-toa-nha-A.jpg',   size: 2_134_000, dim: '4032×3024', src: 'https://picsum.photos/seed/sd-arch-01/1600/1100' },
  { id: '2', name: 'phong-hop-tang-12.jpg',     size: 1_487_000, dim: '3000×2000', src: 'https://picsum.photos/seed/sd-arch-02/1600/1100' },
  { id: '3', name: 'hanh-lang-noi-bo.jpg',      size: 1_902_000, dim: '4032×3024', src: 'https://picsum.photos/seed/sd-arch-03/1600/1100' },
  { id: '4', name: 'khu-vuc-tiep-tan.jpg',      size: 2_456_000, dim: '4032×3024', src: 'https://picsum.photos/seed/sd-arch-04/1600/1100' },
  { id: '5', name: 'phong-lam-viec-mo.jpg',     size: 1_678_000, dim: '3500×2400', src: 'https://picsum.photos/seed/sd-arch-05/1600/1100' },
  { id: '6', name: 'pantry-tang-trecet.jpg',    size: 1_211_000, dim: '3000×2000', src: 'https://picsum.photos/seed/sd-arch-06/1600/1100' },
  { id: '7', name: 'bai-do-xe-tang-ham.jpg',    size: 1_823_000, dim: '4032×3024', src: 'https://picsum.photos/seed/sd-arch-07/1600/1100' },
  { id: '8', name: 'san-thuong.jpg',            size: 2_001_000, dim: '4032×3024', src: 'https://picsum.photos/seed/sd-arch-08/1600/1100' },
  { id: '9', name: 'thang-may.jpg',             size:   894_000, dim: '2400×1600', src: 'https://picsum.photos/seed/sd-arch-09/1600/1100' },
  { id: '10', name: 'cua-an-toan.jpg',          size: 1_345_000, dim: '3000×2000', src: 'https://picsum.photos/seed/sd-arch-10/1600/1100' },
  { id: '11', name: 'cau-thang-bo.jpg',         size: 1_502_000, dim: '3000×2000', src: 'https://picsum.photos/seed/sd-arch-11/1600/1100' },
  { id: '12', name: 'mat-bang-tong-the.jpg',    size: 3_211_000, dim: '5000×3500', src: 'https://picsum.photos/seed/sd-arch-12/1600/1100' },
];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// ─── Toolbar buttons ───────────────────────────────────────────────

function ToolBtn({ icon, label, onClick, active, color, danger }) {
  const [hover, setHover] = React.useState(false);
  const bg = danger && hover ? 'rgba(239,68,68,0.18)' : (active || hover ? 'rgba(255,255,255,0.1)' : 'transparent');
  const fg = danger ? (hover ? '#fca5a5' : previewTokens.fg) : (color || previewTokens.fg);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        appearance: 'none', border: 'none',
        background: bg, color: fg,
        height: 36, minWidth: 36, padding: label ? '0 12px 0 10px' : 0,
        borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        transition: '120ms',
        fontSize: 13, fontWeight: 500,
        fontFamily: 'inherit',
      }}
    >
      <PreviewIcon name={icon} size={20} color={fg} />
      {label && <span>{label}</span>}
    </button>
  );
}

function NavArrow({ side, onClick, disabled }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        top: '50%', transform: 'translateY(-50%)',
        [side]: 16,
        width: 48, height: 48, borderRadius: 999,
        border: 'none',
        background: disabled ? 'rgba(255,255,255,0.04)' : (hover ? 'rgba(255,255,255,0.18)' : 'rgba(20,20,22,0.6)'),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        transition: '120ms',
        zIndex: 5,
      }}
    >
      <PreviewIcon name={side === 'left' ? 'chevron_left' : 'chevron_right'} size={28} outlined={false} />
    </button>
  );
}

// ─── Header bar (top of modal) ────────────────────────────────────

function HeaderBar({ image, index, total, dense, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: dense ? '10px 16px' : '14px 20px',
      background: previewTokens.panelBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${previewTokens.divider}`,
      color: previewTokens.fg,
      flexShrink: 0,
      position: 'relative',
      zIndex: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <PreviewIcon name="image" size={20} color={previewTokens.fgMuted} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 360,
          }} title={image?.name}>
            {image?.name || 'Xem ảnh'}
          </div>
          {image && (
            <div style={{ fontSize: 12, color: previewTokens.fgMuted, marginTop: 2 }}>
              {image.dim} · {formatFileSize(image.size)}
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 13, color: previewTokens.fgMuted,
        background: 'rgba(255,255,255,0.08)',
        padding: '4px 12px', borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500,
      }}>
        {index + 1} / {total}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ToolBtn icon="close" label="Đóng" onClick={onClose} danger />
      </div>
    </div>
  );
}

// ─── Bottom toolbar (zoom / rotate / download) ──────────────────────

function BottomToolbar({ zoom = 100, onZoomIn, onZoomOut, onFit, onRotate, onDownload, onFullscreen, image }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: previewTokens.panelBg,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${previewTokens.divider}`,
      borderRadius: 12,
      padding: '6px 8px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      zIndex: 6,
    }}>
      <ToolBtn icon="zoom_out" label="" onClick={onZoomOut} />
      <div style={{
        minWidth: 56, textAlign: 'center', fontSize: 13, fontVariantNumeric: 'tabular-nums',
        color: previewTokens.fg, fontWeight: 500,
      }}>{zoom}%</div>
      <ToolBtn icon="zoom_in" label="" onClick={onZoomIn} />
      <div style={{ width: 1, height: 20, background: previewTokens.divider, margin: '0 4px' }}></div>
      <ToolBtn icon="fit_screen" label="Vừa khung" onClick={onFit} />
      <ToolBtn icon="rotate_right" label="" onClick={onRotate} />
      <div style={{ width: 1, height: 20, background: previewTokens.divider, margin: '0 4px' }}></div>
      <ToolBtn icon="download" label="" onClick={onDownload} />
      <ToolBtn icon="fullscreen" label="" onClick={onFullscreen} />
    </div>
  );
}

// ─── Thumbnail strip ────────────────────────────────────────────────

function ThumbnailStrip({ images, activeIndex, onSelect, orientation = 'horizontal', showMeta }) {
  const isHorizontal = orientation === 'horizontal';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isHorizontal ? 'row' : 'column',
      gap: 8,
      padding: 12,
      background: previewTokens.shellBg2,
      borderTop: isHorizontal ? `1px solid ${previewTokens.divider}` : 'none',
      borderLeft: !isHorizontal ? `1px solid ${previewTokens.divider}` : 'none',
      overflow: 'auto',
      flexShrink: 0,
      width: isHorizontal ? '100%' : 132,
      maxHeight: isHorizontal ? 116 : 'auto',
    }}>
      {images.map((img, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={img.id}
            onClick={() => onSelect(i)}
            style={{
              appearance: 'none',
              padding: 0,
              border: 'none',
              borderRadius: 8,
              outline: active ? `2px solid ${previewTokens.accent}` : `1px solid ${previewTokens.divider}`,
              outlineOffset: active ? -2 : -1,
              background: '#000',
              flexShrink: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              width: isHorizontal ? 120 : 108,
              height: 76,
              opacity: active ? 1 : 0.7,
              transition: '120ms',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '0.7'; }}
          >
            <img src={img.src} alt={img.name} style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            }} />
            {active && (
              <div style={{
                position: 'absolute', inset: 0,
                boxShadow: 'inset 0 0 0 2px ' + previewTokens.accent,
                pointerEvents: 'none',
              }}></div>
            )}
            <div style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: 10, fontWeight: 600,
              padding: '1px 5px', borderRadius: 4,
              fontVariantNumeric: 'tabular-nums',
            }}>{i + 1}</div>
            {showMeta && (
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                padding: '12px 6px 4px',
                color: '#fff',
                fontSize: 10,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {img.name}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Dots indicator (alternative for few images) ────────────────────

function DotsIndicator({ count, activeIndex, onSelect }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 24, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: 6,
      zIndex: 4,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            appearance: 'none', border: 'none',
            width: i === activeIndex ? 24 : 8, height: 8,
            borderRadius: 999,
            background: i === activeIndex ? previewTokens.fg : 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            transition: '180ms',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main viewer component ──────────────────────────────────────────

function SdPreviewImage({
  images = SAMPLE_IMAGES,
  activeIndex = 0,
  variant = 'bottom',          // 'bottom' | 'right' | 'dots' | 'minimal'
  zoomed = false,
  state = 'ready',             // 'ready' | 'loading' | 'error' | 'empty'
  showBottomToolbar = true,
  showHeaderBar = true,
  loadingProgress = 65,
  rotation = 0,
}) {
  const safeIndex = Math.min(activeIndex, images.length - 1);
  const current = images[safeIndex];
  const isHorizontal = variant === 'bottom';
  const isRight = variant === 'right';
  const isDots = variant === 'dots';
  const isMinimal = variant === 'minimal';

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: previewTokens.shellBg,
      color: previewTokens.fg,
      fontFamily: 'inherit',
      overflow: 'hidden',
      borderRadius: 12,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
      position: 'relative',
    }}>
      {showHeaderBar && state !== 'empty' && (
        <HeaderBar image={current} index={safeIndex} total={images.length} onClose={() => {}} />
      )}

      <div style={{
        flex: 1, display: 'flex', minHeight: 0,
        flexDirection: isRight ? 'row' : 'column',
      }}>
        {/* Stage */}
        <div style={{
          flex: 1, position: 'relative',
          background: previewTokens.shellBg,
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {state === 'empty' && <EmptyState />}
          {state === 'loading' && <LoadingState progress={loadingProgress} />}
          {state === 'error' && <ErrorState />}
          {state === 'ready' && current && (
            <>
              <img
                src={current.src}
                alt={current.name}
                style={{
                  maxWidth: zoomed ? 'none' : '100%',
                  maxHeight: zoomed ? 'none' : '100%',
                  width: zoomed ? '180%' : 'auto',
                  height: zoomed ? 'auto' : 'auto',
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 200ms',
                  cursor: zoomed ? 'grab' : 'zoom-in',
                  userSelect: 'none',
                }}
                draggable={false}
              />
              <NavArrow side="left" onClick={() => {}} disabled={safeIndex === 0} />
              <NavArrow side="right" onClick={() => {}} disabled={safeIndex === images.length - 1} />
              {!isMinimal && showBottomToolbar && (
                <BottomToolbar zoom={zoomed ? 180 : 100} />
              )}
              {isDots && images.length <= 8 && (
                <DotsIndicator count={images.length} activeIndex={safeIndex} onSelect={() => {}} />
              )}
            </>
          )}

          {/* Keyboard hint - subtle */}
          {state === 'ready' && !isMinimal && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              display: 'flex', gap: 6,
              fontSize: 11, color: previewTokens.fgSubtle,
              alignItems: 'center',
            }}>
              <Kbd>←</Kbd><Kbd>→</Kbd>
              <span style={{ marginLeft: 4 }}>chuyển ảnh</span>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
              <Kbd>Esc</Kbd>
              <span>đóng</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {state === 'ready' && !isDots && !isMinimal && (
          <ThumbnailStrip
            images={images}
            activeIndex={safeIndex}
            onSelect={() => {}}
            orientation={isHorizontal ? 'horizontal' : 'vertical'}
            showMeta={isRight}
          />
        )}
      </div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 20, height: 20, padding: '0 5px',
      borderRadius: 4,
      border: `1px solid ${previewTokens.divider}`,
      background: 'rgba(255,255,255,0.04)',
      color: previewTokens.fgMuted,
      fontSize: 11, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    }}>{children}</span>
  );
}

// ─── Special states ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 16, color: previewTokens.fgMuted, textAlign: 'center',
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${previewTokens.divider}`,
      }}>
        <PreviewIcon name="image_not_supported" size={48} color={previewTokens.fgSubtle} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: previewTokens.fg, marginBottom: 4 }}>
          Không có thông tin ảnh
        </div>
        <div style={{ fontSize: 13, color: previewTokens.fgMuted }}>
          Chưa có ảnh nào để hiển thị
        </div>
      </div>
    </div>
  );
}

function LoadingState({ progress = 50 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: previewTokens.fgMuted }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        border: `3px solid ${previewTokens.divider}`,
        borderTopColor: previewTokens.accent,
        animation: 'sd-spin 0.9s linear infinite',
      }}></div>
      <div style={{ fontSize: 13, color: previewTokens.fgMuted, fontVariantNumeric: 'tabular-nums' }}>
        Đang tải ảnh... {progress}%
      </div>
      <div style={{ width: 200, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: progress + '%', height: '100%', background: previewTokens.accent, transition: '200ms' }}></div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: previewTokens.fgMuted, textAlign: 'center' }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid rgba(239,68,68,0.3)`,
      }}>
        <PreviewIcon name="broken_image" size={48} color={previewTokens.danger} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: previewTokens.fg, marginBottom: 4 }}>
          Không tải được ảnh
        </div>
        <div style={{ fontSize: 13, color: previewTokens.fgMuted, maxWidth: 320 }}>
          File ảnh có thể đã bị xóa hoặc đường dẫn không hợp lệ
        </div>
      </div>
      <button style={{
        appearance: 'none',
        background: previewTokens.accent, color: '#fff',
        border: 'none', height: 36, padding: '0 16px', borderRadius: 8,
        fontWeight: 500, fontSize: 13, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'inherit',
      }}>
        <PreviewIcon name="refresh" size={16} color="#fff" />
        Thử lại
      </button>
    </div>
  );
}

Object.assign(window, {
  SdPreviewImage,
  PreviewIcon,
  SAMPLE_IMAGES,
  previewTokens,
  formatFileSize,
});

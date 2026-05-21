/* sd-preview-pdf mockup — multi-page document viewer */

const pdfTokens = {
  shellBg:    '#1a1c1f',
  sidebarBg:  '#22252a',
  toolbarBg:  'rgba(20, 22, 25, 0.94)',
  pageBg:     '#ffffff',
  pageShadow: '0 4px 16px rgba(0,0,0,0.4)',
  divider:    'rgba(255,255,255,0.08)',
  fg:         '#f5f6f7',
  fgMuted:    'rgba(255,255,255,0.6)',
  fgSubtle:   'rgba(255,255,255,0.4)',
  accent:     '#3b82f6',
  accentSoft: 'rgba(59, 130, 246, 0.2)',
  searchHi:   'rgba(250, 204, 21, 0.55)',
  searchHiActive: 'rgba(250, 204, 21, 0.9)',
  danger:     '#ef4444',
};

const PdfIcon = ({ name, size = 20, outlined = true, color, style }) => (
  <span
    className={outlined ? 'material-icons-outlined' : 'material-icons'}
    style={{ fontSize: size, lineHeight: 1, color, userSelect: 'none', verticalAlign: 'middle', ...style }}
  >{name}</span>
);

// ─── Sample document data ───────────────────────────────────────────

const DOC_META = {
  filename: 'hop-dong-thue-van-phong-2025.pdf',
  size: 2_840_000,
  totalPages: 24,
  author: 'OneMount Legal',
  modifiedAt: '12/05/2026',
};

const OUTLINE = [
  { id: 'o1', label: 'Điều 1 — Bên tham gia',           page: 1 },
  { id: 'o2', label: 'Điều 2 — Đối tượng hợp đồng',     page: 3 },
  { id: 'o3', label: 'Điều 3 — Thời hạn & Gia hạn',     page: 5,
    children: [
      { id: 'o3-1', label: '3.1 Thời hạn cơ bản',         page: 5 },
      { id: 'o3-2', label: '3.2 Điều kiện gia hạn',       page: 6 },
    ] },
  { id: 'o4', label: 'Điều 4 — Giá thuê & Phương thức thanh toán', page: 8 },
  { id: 'o5', label: 'Điều 5 — Tiền đặt cọc',           page: 11 },
  { id: 'o6', label: 'Điều 6 — Quyền & Nghĩa vụ Bên A',  page: 13 },
  { id: 'o7', label: 'Điều 7 — Quyền & Nghĩa vụ Bên B',  page: 16 },
  { id: 'o8', label: 'Điều 8 — Sửa chữa & Bảo trì',     page: 19 },
  { id: 'o9', label: 'Điều 9 — Chấm dứt hợp đồng',      page: 21 },
  { id: 'o10', label: 'Điều 10 — Điều khoản chung',     page: 23 },
];

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

// ─── Page renderer (mocked PDF page content) ────────────────────────
// Renders a recognizable "document page" without an actual PDF.

function MockPage({ pageNumber, width = 612, scale = 1, highlightTerm, isLandscape = false, type = 'text' }) {
  // 612 × 792 is US Letter at 72 DPI — common PDF page size
  const w = isLandscape ? 792 : 612;
  const h = isLandscape ? 612 : 792;
  return (
    <div style={{
      width: w * scale, height: h * scale,
      background: pdfTokens.pageBg,
      boxShadow: pdfTokens.pageShadow,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 2,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        width: w, height: h,
        padding: '64px 72px',
        color: '#222',
      }}>
        {type === 'cover' ? (
          <CoverPage />
        ) : type === 'table' ? (
          <TablePage pageNumber={pageNumber} highlightTerm={highlightTerm} />
        ) : (
          <TextPage pageNumber={pageNumber} highlightTerm={highlightTerm} />
        )}
        <PageFooter pageNumber={pageNumber} />
      </div>
    </div>
  );
}

function CoverPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 120 }}>
      <div style={{ width: 80, height: 80, borderRadius: 12, background: '#1657d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>OM</span>
      </div>
      <div style={{ fontSize: 14, color: '#666', letterSpacing: '0.2em', marginBottom: 16 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 64 }}>Độc lập — Tự do — Hạnh phúc</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.05em' }}>HỢP ĐỒNG THUÊ VĂN PHÒNG</h1>
      <div style={{ fontSize: 14, color: '#666', marginBottom: 120 }}>Số: HĐ-2026/05/004</div>
      <div style={{ width: '60%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13, textAlign: 'left' }}>
        <div style={{ color: '#666' }}>Bên cho thuê:</div>
        <div style={{ fontWeight: 500 }}>Công ty CP OneMount Group</div>
        <div style={{ color: '#666' }}>Bên thuê:</div>
        <div style={{ fontWeight: 500 }}>Công ty TNHH ABC Việt Nam</div>
        <div style={{ color: '#666' }}>Địa chỉ thuê:</div>
        <div style={{ fontWeight: 500 }}>Tầng 12, Tòa nhà Capital Place</div>
        <div style={{ color: '#666' }}>Ngày lập:</div>
        <div style={{ fontWeight: 500 }}>12/05/2026</div>
      </div>
    </div>
  );
}

function TextPage({ pageNumber, highlightTerm }) {
  const lines = [
    { kind: 'h2', text: `ĐIỀU ${Math.ceil(pageNumber / 2)}. QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN` },
    { kind: 'p', text: 'Hai bên đồng ý ký kết hợp đồng thuê văn phòng theo các điều khoản và điều kiện được nêu chi tiết bên dưới. Các bên cam kết tuân thủ đầy đủ những quy định đã thỏa thuận.' },
    { kind: 'h3', text: '1. Quyền của Bên A (Bên cho thuê)' },
    { kind: 'li', text: 'Yêu cầu Bên B thanh toán đầy đủ và đúng hạn tiền thuê hàng tháng theo điều khoản đã quy định tại Điều 4.' },
    { kind: 'li', text: 'Đơn phương chấm dứt hợp đồng nếu Bên B vi phạm các điều khoản cơ bản như chậm thanh toán quá 30 ngày hoặc sử dụng sai mục đích.' },
    { kind: 'li', text: 'Kiểm tra định kỳ tình trạng văn phòng cho thuê, có thông báo trước ít nhất 48 giờ làm việc.' },
    { kind: 'h3', text: '2. Nghĩa vụ của Bên A (Bên cho thuê)' },
    { kind: 'p', text: 'Bàn giao văn phòng theo đúng diện tích, hiện trạng và thời điểm đã cam kết. Đảm bảo các hệ thống điện, nước, điều hòa, internet hoạt động ổn định trong suốt thời gian thuê.' },
    { kind: 'li', text: 'Cung cấp đầy đủ giấy tờ pháp lý liên quan đến quyền sở hữu và quyền cho thuê đối với mặt bằng văn phòng.' },
    { kind: 'li', text: 'Hỗ trợ kịp thời các vấn đề kỹ thuật, sửa chữa hư hỏng không do lỗi của Bên B trong vòng 72 giờ kể từ khi nhận được thông báo.' },
    { kind: 'h3', text: '3. Quyền của Bên B (Bên thuê)' },
    { kind: 'p', text: 'Bên B có toàn quyền sử dụng văn phòng đã thuê cho hoạt động kinh doanh hợp pháp của mình theo đúng giấy phép kinh doanh đã đăng ký với cơ quan có thẩm quyền.' },
  ];
  return (
    <div>
      {lines.map((l, i) => <Line key={i} {...l} highlightTerm={highlightTerm} />)}
    </div>
  );
}

function TablePage({ pageNumber, highlightTerm }) {
  return (
    <div>
      <Line kind="h2" text={`ĐIỀU ${pageNumber - 7}. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN`} highlightTerm={highlightTerm} />
      <Line kind="p" text="Hai bên thống nhất giá thuê và phương thức thanh toán như được nêu trong bảng dưới đây. Mọi điều chỉnh phải được thỏa thuận bằng văn bản giữa các bên." highlightTerm={highlightTerm} />
      <div style={{ marginTop: 24, marginBottom: 24, border: '1px solid #d4d4d8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1fr 1.4fr', background: '#f4f4f5', borderBottom: '1px solid #d4d4d8', fontWeight: 600, fontSize: 11 }}>
          <div style={cellPad}>STT</div>
          <div style={cellPad}>Khoản mục</div>
          <div style={{ ...cellPad, textAlign: 'right' }}>Đơn giá (VNĐ)</div>
          <div style={cellPad}>Phương thức</div>
        </div>
        {[
          ['01', 'Tiền thuê văn phòng',          '185.000.000', 'Chuyển khoản hàng tháng'],
          ['02', 'Phí dịch vụ (vệ sinh, lễ tân)','24.500.000',  'Chuyển khoản hàng tháng'],
          ['03', 'Phí điện',                      'Theo công tơ', 'Theo hóa đơn EVN'],
          ['04', 'Phí gửi xe ô tô (5 chỗ)',      '1.800.000',  'Chuyển khoản hàng tháng'],
          ['05', 'Phí làm thêm ngoài giờ',       'Tính riêng',  'Báo trước ≥ 24h'],
        ].map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '50px 2fr 1fr 1.4fr',
            borderBottom: i < 4 ? '1px solid #e4e4e7' : 'none', fontSize: 11,
            background: i % 2 ? '#fafafa' : '#fff',
          }}>
            <div style={cellPad}>{row[0]}</div>
            <div style={cellPad}>{row[1]}</div>
            <div style={{ ...cellPad, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{row[2]}</div>
            <div style={cellPad}>{row[3]}</div>
          </div>
        ))}
      </div>
      <Line kind="p" text="Tổng giá trị hợp đồng tính cho 36 tháng thuê là 7.621.200.000 VNĐ (Bằng chữ: Bảy tỷ sáu trăm hai mươi mốt triệu hai trăm nghìn đồng), chưa bao gồm thuế giá trị gia tăng." highlightTerm={highlightTerm} />
      <Line kind="li" text="Thanh toán được thực hiện trước ngày 05 hàng tháng vào tài khoản do Bên A chỉ định." highlightTerm={highlightTerm} />
      <Line kind="li" text="Mọi khoản chậm trả sẽ chịu lãi phạt 0,05%/ngày tính trên số tiền chậm." highlightTerm={highlightTerm} />
    </div>
  );
}

const cellPad = { padding: '7px 10px' };

function Line({ kind, text, highlightTerm }) {
  const styles = {
    h2: { fontSize: 16, fontWeight: 700, margin: '20px 0 12px', letterSpacing: '0.02em' },
    h3: { fontSize: 13, fontWeight: 600, margin: '16px 0 6px' },
    p:  { fontSize: 11, lineHeight: 1.65, margin: '6px 0', textAlign: 'justify' },
    li: { fontSize: 11, lineHeight: 1.65, margin: '4px 0 4px 20px', textAlign: 'justify', position: 'relative' },
  };
  const content = highlightTerm ? renderHighlighted(text, highlightTerm) : text;
  return (
    <div style={styles[kind]}>
      {kind === 'li' && <span style={{ position: 'absolute', left: -16 }}>•</span>}
      {content}
    </div>
  );
}

function renderHighlighted(text, term) {
  if (!term) return text;
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(re);
  let activeShown = false;
  return parts.map((p, i) => {
    if (re.test(p) || p.toLowerCase() === term.toLowerCase()) {
      const isActive = !activeShown;
      activeShown = true;
      return <mark key={i} style={{
        background: isActive ? pdfTokens.searchHiActive : pdfTokens.searchHi,
        color: '#000',
        padding: '0 1px',
        borderRadius: 2,
      }}>{p}</mark>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

function PageFooter({ pageNumber }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 32, left: 72, right: 72,
      display: 'flex', justifyContent: 'space-between',
      fontSize: 9, color: '#9ca3af',
      borderTop: '1px solid #e4e4e7',
      paddingTop: 8,
    }}>
      <span>Hợp đồng thuê văn phòng — HĐ-2026/05/004</span>
      <span>Trang {pageNumber} / 24</span>
    </div>
  );
}

// ─── Toolbar buttons ────────────────────────────────────────────────

function PdfBtn({ icon, label, onClick, active, color, danger, badge }) {
  const [hover, setHover] = React.useState(false);
  const bg = danger && hover ? 'rgba(239,68,68,0.18)'
           : active ? pdfTokens.accentSoft
           : hover ? 'rgba(255,255,255,0.1)' : 'transparent';
  const fg = danger ? (hover ? '#fca5a5' : pdfTokens.fg)
           : active ? pdfTokens.accent
           : (color || pdfTokens.fg);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        appearance: 'none', border: 'none',
        background: bg, color: fg,
        height: 32, minWidth: 32, padding: label ? '0 10px 0 8px' : 0,
        borderRadius: 6,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        transition: '120ms',
        fontSize: 13, fontWeight: 500,
        fontFamily: 'inherit',
        position: 'relative',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <PdfIcon name={icon} size={18} color={fg} />
      {label && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
      {badge != null && (
        <span style={{
          minWidth: 16, height: 16, padding: '0 5px', marginLeft: 2,
          borderRadius: 999, background: pdfTokens.accent, color: '#fff',
          fontSize: 10, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Header bar ─────────────────────────────────────────────────────

function PdfHeader({ meta, sidebarOpen, sidebarMode, onToggleSidebar, onSidebarMode, onSearchToggle, searchOpen, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
      padding: '10px 16px',
      background: pdfTokens.toolbarBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${pdfTokens.divider}`,
      color: pdfTokens.fg,
      flexShrink: 0, zIndex: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <PdfBtn icon="menu" label="" active={sidebarOpen} onClick={onToggleSidebar} />
        <div style={{ width: 1, height: 20, background: pdfTokens.divider, margin: '0 4px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <PdfFileIcon />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 320,
            }} title={meta.filename}>{meta.filename}</div>
            <div style={{ fontSize: 11, color: pdfTokens.fgMuted, marginTop: 1 }}>
              {meta.totalPages} trang · {formatSize(meta.size)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PdfBtn icon="search" active={searchOpen} onClick={onSearchToggle} />
        <PdfBtn icon="print" />
        <PdfBtn icon="download" />
        <PdfBtn icon="fullscreen" />
        <div style={{ width: 1, height: 20, background: pdfTokens.divider, margin: '0 4px' }}></div>
        <PdfBtn icon="close" label="Đóng" onClick={onClose} danger />
      </div>
    </div>
  );
}

function PdfFileIcon() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6,
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#f87171', fontSize: 10, fontWeight: 700,
      flexShrink: 0,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    }}>PDF</div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────

function Sidebar({ mode, onMode, currentPage, onPageSelect, searchResults }) {
  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: pdfTokens.sidebarBg,
      borderRight: `1px solid ${pdfTokens.divider}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        padding: 8, gap: 4,
        borderBottom: `1px solid ${pdfTokens.divider}`,
      }}>
        {[
          { id: 'thumbnails', icon: 'view_carousel', label: 'Trang' },
          { id: 'outline',    icon: 'list',           label: 'Mục lục' },
          { id: 'search',     icon: 'search',         label: 'Tìm' },
        ].map(opt => (
          <button key={opt.id}
            onClick={() => onMode && onMode(opt.id)}
            style={{
              flex: 1, height: 32,
              border: 'none', borderRadius: 6,
              background: mode === opt.id ? pdfTokens.accentSoft : 'transparent',
              color: mode === opt.id ? pdfTokens.accent : pdfTokens.fgMuted,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            <PdfIcon name={opt.icon} size={14} color={mode === opt.id ? pdfTokens.accent : pdfTokens.fgMuted} />
            <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: mode === 'thumbnails' ? 12 : 6 }}>
        {mode === 'thumbnails' && <ThumbnailList currentPage={currentPage} total={DOC_META.totalPages} onSelect={onPageSelect} />}
        {mode === 'outline' && <OutlineList items={OUTLINE} currentPage={currentPage} onSelect={onPageSelect} />}
        {mode === 'search' && <SearchList results={searchResults} />}
      </div>
    </div>
  );
}

function ThumbnailList({ currentPage, total, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: total }).map((_, i) => {
        const p = i + 1;
        const active = p === currentPage;
        return (
          <button key={p}
            onClick={() => onSelect && onSelect(p)}
            style={{
              appearance: 'none', border: 'none', background: 'transparent',
              padding: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 152, aspectRatio: '612 / 792',
              background: '#fff',
              outline: active ? `2px solid ${pdfTokens.accent}` : `1px solid ${pdfTokens.divider}`,
              outlineOffset: active ? -2 : -1,
              borderRadius: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              padding: 14,
              overflow: 'hidden',
            }}>
              <MiniPage page={p} />
            </div>
            <div style={{
              fontSize: 11, color: active ? pdfTokens.accent : pdfTokens.fgMuted,
              fontWeight: active ? 600 : 400,
              fontVariantNumeric: 'tabular-nums',
            }}>{p}</div>
          </button>
        );
      })}
    </div>
  );
}

function MiniPage({ page }) {
  // tiny representation of page content for thumbnails
  const isCover = page === 1;
  const isTable = page === 8 || page === 9;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {isCover && <div style={{ height: 16, background: '#1657d4', borderRadius: 2, marginBottom: 6, alignSelf: 'center', width: 16 }}></div>}
      {isCover && <div style={{ height: 5, background: '#222', borderRadius: 1, alignSelf: 'center', width: '70%', marginBottom: 12 }}></div>}
      {!isCover && <div style={{ height: 5, background: '#333', borderRadius: 1, width: '60%', marginBottom: 4 }}></div>}
      {Array.from({ length: isTable ? 4 : 14 }).map((_, i) => (
        <div key={i} style={{ height: 2, background: '#c4c4c8', borderRadius: 1, width: `${80 - (i % 4) * 12}%` }}></div>
      ))}
      {isTable && (
        <div style={{ marginTop: 4, height: 38, background: '#f4f4f5', border: '1px solid #ddd', borderRadius: 1, padding: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 1.5, background: '#bbb', margin: '2px 0' }}></div>)}
        </div>
      )}
    </div>
  );
}

function OutlineList({ items, currentPage, onSelect, depth = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map(item => {
        const active = currentPage >= item.page && (
          !item.children?.length || currentPage < item.children[0].page
        );
        return (
          <React.Fragment key={item.id}>
            <button onClick={() => onSelect && onSelect(item.page)} style={{
              appearance: 'none', border: 'none',
              background: active ? pdfTokens.accentSoft : 'transparent',
              color: active ? pdfTokens.accent : pdfTokens.fg,
              padding: '7px 8px', paddingLeft: 8 + depth * 16,
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              fontSize: 12, fontWeight: active ? 500 : 400,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <span style={{ fontSize: 11, color: pdfTokens.fgMuted, fontVariantNumeric: 'tabular-nums' }}>{item.page}</span>
            </button>
            {item.children && <OutlineList items={item.children} currentPage={currentPage} onSelect={onSelect} depth={depth + 1} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SearchList({ results = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ padding: '8px 8px 4px', fontSize: 11, color: pdfTokens.fgMuted }}>
        {results.length} kết quả cho "<span style={{ color: pdfTokens.fg, fontWeight: 500 }}>thanh toán</span>"
      </div>
      {results.map((r, i) => (
        <button key={i} style={{
          appearance: 'none', border: 'none',
          background: i === 0 ? pdfTokens.accentSoft : 'transparent',
          color: pdfTokens.fg,
          padding: '8px 10px', borderRadius: 6,
          display: 'flex', flexDirection: 'column', gap: 4,
          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: pdfTokens.fgMuted }}>
            <span>Trang {r.page}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}/{results.length}</span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            ...{r.before}<mark style={{ background: pdfTokens.searchHi, color: '#000', padding: '0 2px', borderRadius: 2 }}>{r.term}</mark>{r.after}...
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Floating page toolbar (bottom) ─────────────────────────────────

function PageToolbar({ currentPage, totalPages, zoom, zoomMode, onZoom, scrollMode }) {
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 4,
      background: pdfTokens.toolbarBg,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${pdfTokens.divider}`,
      borderRadius: 10,
      padding: '5px 6px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      zIndex: 5,
    }}>
      {/* Page nav */}
      <PdfBtn icon="first_page" />
      <PdfBtn icon="chevron_left" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 4px',
        fontSize: 13, color: pdfTokens.fg, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
      }}>
        <input
          defaultValue={currentPage}
          style={{
            width: 36, height: 24, textAlign: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${pdfTokens.divider}`,
            borderRadius: 4,
            color: pdfTokens.fg, fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            outline: 'none',
          }}
        />
        <span style={{ color: pdfTokens.fgMuted }}>/ {totalPages}</span>
      </div>
      <PdfBtn icon="chevron_right" />
      <PdfBtn icon="last_page" />

      <div style={{ width: 1, height: 18, background: pdfTokens.divider, margin: '0 6px' }}></div>

      {/* Zoom */}
      <PdfBtn icon="remove" />
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 4px',
        minWidth: 64,
        height: 24,
        background: 'rgba(255,255,255,0.08)',
        border: `1px solid ${pdfTokens.divider}`,
        borderRadius: 4,
        fontSize: 12, color: pdfTokens.fg, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
        justifyContent: 'space-between',
      }}>
        <span>{zoom}%</span>
        <PdfIcon name="arrow_drop_down" size={16} color={pdfTokens.fgMuted} />
      </div>
      <PdfBtn icon="add" />

      <div style={{ width: 1, height: 18, background: pdfTokens.divider, margin: '0 6px' }}></div>

      <PdfBtn icon="fit_screen" label="Vừa trang" active={zoomMode === 'page-fit'} />
      <PdfBtn icon="swap_horiz" label="Vừa rộng" active={zoomMode === 'page-width'} />

      <div style={{ width: 1, height: 18, background: pdfTokens.divider, margin: '0 6px' }}></div>

      <PdfBtn icon="rotate_right" />
      <PdfBtn icon={scrollMode === 'continuous' ? 'view_day' : 'description'} label={scrollMode === 'continuous' ? 'Cuộn liên tục' : 'Từng trang'} />
    </div>
  );
}

// ─── Search bar (top, when active) ──────────────────────────────────

function SearchBar({ term = 'thanh toán', current = 1, total = 18, caseSensitive = false, wholeWord = false, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      background: pdfTokens.toolbarBg,
      borderBottom: `1px solid ${pdfTokens.divider}`,
      color: pdfTokens.fg,
      flexShrink: 0,
    }}>
      <PdfIcon name="search" size={16} color={pdfTokens.fgMuted} />
      <div style={{
        display: 'flex', alignItems: 'center', flex: 1, gap: 8,
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${pdfTokens.divider}`,
        borderRadius: 6, padding: '0 8px', height: 30,
        maxWidth: 360,
      }}>
        <input defaultValue={term} placeholder="Tìm trong tài liệu..." style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: pdfTokens.fg, fontSize: 13, fontFamily: 'inherit',
        }} />
        <span style={{ fontSize: 11, color: pdfTokens.fgMuted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {current} / {total}
        </span>
      </div>
      <PdfBtn icon="keyboard_arrow_up" />
      <PdfBtn icon="keyboard_arrow_down" />
      <div style={{ width: 1, height: 18, background: pdfTokens.divider, margin: '0 4px' }}></div>
      <PdfBtn icon="match_case" active={caseSensitive} label="Aa" />
      <PdfBtn icon="text_fields" active={wholeWord} label="Từ nguyên" />
      <div style={{ flex: 1 }}></div>
      <PdfBtn icon="close" onClick={onClose} />
    </div>
  );
}

// ─── Empty / Loading / Error ───────────────────────────────────────

function PdfEmpty() {
  return (
    <CenterStack iconBg="rgba(255,255,255,0.05)" border={pdfTokens.divider} iconColor={pdfTokens.fgSubtle}
      icon="picture_as_pdf" title="Không có tài liệu" subtitle="Chưa có file PDF nào để hiển thị" />
  );
}

function PdfLoading({ progress = 45 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: pdfTokens.fgMuted }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        border: `3px solid ${pdfTokens.divider}`,
        borderTopColor: pdfTokens.accent,
        animation: 'sd-spin 0.9s linear infinite',
      }}></div>
      <div style={{ fontSize: 13, color: pdfTokens.fgMuted, fontVariantNumeric: 'tabular-nums' }}>
        Đang tải tài liệu... {progress}%
      </div>
      <div style={{ width: 240, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: progress + '%', height: '100%', background: pdfTokens.accent, transition: '200ms' }}></div>
      </div>
      <div style={{ fontSize: 11, color: pdfTokens.fgSubtle, marginTop: 4 }}>
        Đang xử lý trang 11 / 24
      </div>
    </div>
  );
}

function PdfError() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: pdfTokens.fgMuted, textAlign: 'center', maxWidth: 380 }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(239,68,68,0.3)',
      }}>
        <PdfIcon name="error_outline" size={48} color={pdfTokens.danger} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: pdfTokens.fg, marginBottom: 4 }}>
          Không tải được tài liệu
        </div>
        <div style={{ fontSize: 13, color: pdfTokens.fgMuted }}>
          File PDF có thể bị hỏng, mật khẩu bảo vệ hoặc đường dẫn không hợp lệ. Vui lòng kiểm tra lại.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          background: pdfTokens.accent, color: '#fff',
          border: 'none', height: 36, padding: '0 16px', borderRadius: 8,
          fontWeight: 500, fontSize: 13, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}>
          <PdfIcon name="refresh" size={16} color="#fff" />
          Thử lại
        </button>
        <button style={{
          background: 'transparent', color: pdfTokens.fg,
          border: `1px solid ${pdfTokens.divider}`,
          height: 36, padding: '0 16px', borderRadius: 8,
          fontWeight: 500, fontSize: 13, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}>
          <PdfIcon name="download" size={16} color={pdfTokens.fg} />
          Tải file gốc
        </button>
      </div>
    </div>
  );
}

function CenterStack({ icon, title, subtitle, iconBg, border, iconColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: pdfTokens.fgMuted, textAlign: 'center' }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: iconBg,
        border: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PdfIcon name={icon} size={48} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: pdfTokens.fg, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: pdfTokens.fgMuted }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── The main viewer ────────────────────────────────────────────────

function SdPreviewPdf({
  state = 'ready',           // 'ready' | 'loading' | 'error' | 'empty'
  currentPage = 1,
  zoom = 100,
  zoomMode = 'page-fit',     // 'page-fit' | 'page-width' | 'custom'
  sidebarOpen = true,
  sidebarMode = 'thumbnails',// 'thumbnails' | 'outline' | 'search' | null
  scrollMode = 'page',       // 'page' | 'continuous'
  searchOpen = false,
  searchTerm = '',
  searchResults = [],
  loadingProgress = 45,
}) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: pdfTokens.shellBg,
      color: pdfTokens.fg,
      fontFamily: 'inherit',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column',
    }}>
      {state !== 'empty' && (
        <PdfHeader
          meta={DOC_META}
          sidebarOpen={sidebarOpen}
          sidebarMode={sidebarMode}
          searchOpen={searchOpen}
        />
      )}
      {searchOpen && state === 'ready' && (
        <SearchBar term={searchTerm} current={1} total={searchResults.length} />
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {sidebarOpen && state === 'ready' && (
          <Sidebar mode={sidebarMode} currentPage={currentPage} searchResults={searchResults} />
        )}
        <div style={{
          flex: 1, position: 'relative',
          background: pdfTokens.shellBg,
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.015) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.015) 75%)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
          overflow: 'auto',
          display: 'flex',
          alignItems: state === 'ready' ? 'flex-start' : 'center',
          justifyContent: 'center',
        }}>
          {state === 'empty' && <PdfEmpty />}
          {state === 'loading' && <PdfLoading progress={loadingProgress} />}
          {state === 'error' && <PdfError />}
          {state === 'ready' && (
            <PdfStage
              currentPage={currentPage}
              zoom={zoom}
              scrollMode={scrollMode}
              highlightTerm={searchOpen && searchTerm ? searchTerm : null}
            />
          )}

          {state === 'ready' && <PageToolbar
            currentPage={currentPage} totalPages={DOC_META.totalPages}
            zoom={zoom} zoomMode={zoomMode} scrollMode={scrollMode} />}
        </div>
      </div>
    </div>
  );
}

function PdfStage({ currentPage, zoom, scrollMode, highlightTerm }) {
  // Scale-down factor so a 612-wide page looks reasonable in the artboard
  const baseScale = 0.78 * (zoom / 100);

  if (scrollMode === 'continuous') {
    // Show 2-3 consecutive pages vertically
    return (
      <div style={{ padding: '32px 24px 96px', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        {[currentPage - 1, currentPage, currentPage + 1].filter(p => p >= 1 && p <= DOC_META.totalPages).map(p => (
          <div key={p} style={{ position: 'relative' }}>
            <MockPage pageNumber={p} scale={baseScale * 0.85} type={p === 1 ? 'cover' : (p === 8 || p === 9) ? 'table' : 'text'} highlightTerm={highlightTerm} />
            <PageBadge page={p} active={p === currentPage} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px 96px', display: 'flex', justifyContent: 'center', minWidth: '100%' }}>
      <MockPage
        pageNumber={currentPage}
        scale={baseScale}
        type={currentPage === 1 ? 'cover' : (currentPage === 8 || currentPage === 9) ? 'table' : 'text'}
        highlightTerm={highlightTerm}
      />
    </div>
  );
}

function PageBadge({ page, active }) {
  return (
    <div style={{
      position: 'absolute', top: 8, left: -36,
      width: 28, height: 28, borderRadius: 999,
      background: active ? pdfTokens.accent : 'rgba(255,255,255,0.1)',
      color: active ? '#fff' : pdfTokens.fgMuted,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      border: `1px solid ${pdfTokens.divider}`,
    }}>{page}</div>
  );
}

// ─── Exports ────────────────────────────────────────────────────────

Object.assign(window, {
  SdPreviewPdf,
  PdfIcon,
  DOC_META,
  OUTLINE,
  pdfTokens,
});

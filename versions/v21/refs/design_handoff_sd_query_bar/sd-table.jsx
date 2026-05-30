/* sd-table mockup — matches sd-angular/components/table */

const SORT_NONE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 0 24 24' width='24px'%3E%3Cpath fill='%237A7A7A' d='M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z'/%3E%3C/svg%3E")`;
const SORT_ASC = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 0 24 24' width='24px'%3E%3Cpath fill='%237A7A7A' d='M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z'/%3E%3C/svg%3E")`;
const SORT_DESC = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 0 24 24' width='24px'%3E%3Cpath fill='%237A7A7A' d='M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z'/%3E%3C/svg%3E")`;

const tableTokens = {
  headerBg: '#f2f3f4',
  border: '#f2f2f2',
  rowHover: '#f5f5f5',
  rowSelected: '#eef2ff',
  rowActivated: '#e5ecff',
  text: '#212121',
  textSecondary: '#5f6368',
  textMuted: '#7a7a7a',
  primary: '#1657d4',
  primaryFaint: '#e8efff',
  success: '#16a34a',
  successFaint: '#e7f6ec',
  warn: '#d97706',
  warnFaint: '#fdf1d8',
  danger: '#dc2626',
  panelShadow: '0 2px 8px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)',
};

const MAT_ICONS_LINK = 'https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined';

function MatIcon({ name, outlined = false, size = 20, color, style }) {
  return (
    <span
      className={outlined ? 'material-icons-outlined' : 'material-icons'}
      style={{ fontSize: size, lineHeight: 1, color, verticalAlign: 'middle', userSelect: 'none', ...style }}
    >
      {name}
    </span>
  );
}

function Checkbox({ checked, indeterminate, disabled, color = tableTokens.primary }) {
  const filled = checked || indeterminate;
  return (
    <span style={{
      display: 'inline-flex',
      width: 18,
      height: 18,
      borderRadius: 2,
      border: `2px solid ${filled ? color : '#9aa0a6'}`,
      background: filled ? color : '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.4 : 1,
      transition: '120ms',
    }}>
      {checked && !indeterminate && <MatIcon name="check" size={14} color="#fff" />}
      {indeterminate && <span style={{ width: 10, height: 2, background: '#fff', borderRadius: 1 }}></span>}
    </span>
  );
}

function Radio({ checked, color = tableTokens.primary }) {
  return (
    <span style={{
      display: 'inline-flex',
      width: 18,
      height: 18,
      borderRadius: 999,
      border: `2px solid ${checked ? color : '#9aa0a6'}`,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {checked && <span style={{ width: 10, height: 10, borderRadius: 999, background: color }}></span>}
    </span>
  );
}

function Badge({ color = 'default', icon, title }) {
  const palette = {
    success: { fg: '#0f7c3a', bg: tableTokens.successFaint, border: '#bfe5ca' },
    warn:    { fg: '#a45a06', bg: tableTokens.warnFaint, border: '#f3d59b' },
    error:   { fg: '#b3261e', bg: '#fde7e7', border: '#f5c7c5' },
    info:    { fg: '#1657d4', bg: tableTokens.primaryFaint, border: '#c8d8f7' },
    default: { fg: '#3c4043', bg: '#eceff1', border: '#dadce0' },
  }[color] || { fg: '#3c4043', bg: '#eceff1', border: '#dadce0' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 999,
      background: palette.bg,
      color: palette.fg,
      border: `1px solid ${palette.border}`,
      fontSize: 12,
      fontWeight: 500,
      lineHeight: '18px',
      whiteSpace: 'nowrap',
    }}>
      {icon && <MatIcon name={icon} size={12} color={palette.fg} />}
      {title}
    </span>
  );
}

function IconBtn({ icon, color, tooltip, onClick }) {
  return (
    <button
      title={tooltip}
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        width: 32, height: 32, borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: color || tableTokens.textSecondary,
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#0000000a'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <MatIcon name={icon} size={20} outlined />
    </button>
  );
}

function SortHeader({ children, sort, align }) {
  const bg = sort === 'asc' ? SORT_ASC : sort === 'desc' ? SORT_DESC : sort === 'none' ? SORT_NONE : 'none';
  return (
    <div
      className="c-header-title"
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align === 'right' ? 'right' : 'left',
        paddingRight: sort ? 24 : 0,
        backgroundImage: bg,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right center',
        backgroundSize: '16px 16px',
        fontSize: 14,
        fontWeight: 500,
        color: tableTokens.text,
        cursor: sort ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

function InlineFilter({ kind = 'string', value, placeholder = '', operator = 'CONTAIN', align }) {
  // Operator dropdown + input control
  const opLabel = {
    CONTAIN: 'Chứa', EQUAL: '=', NOT_EQUAL: '≠', GREATER: '>', LESS: '<',
    BETWEEN: 'Trong khoảng', IN: 'Trong', START_WITH: 'Bắt đầu',
  }[operator] || 'Chứa';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      borderRadius: 6,
      border: `1px solid ${value ? tableTokens.primary : '#d6d8db'}`,
      background: '#fff',
      height: 28,
      overflow: 'hidden',
      width: '100%',
    }}>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        padding: '0 6px',
        background: '#f5f6f7',
        border: 'none',
        borderRight: `1px solid #e2e4e7`,
        fontSize: 11,
        color: tableTokens.textSecondary,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }} title={opLabel}>
        {opLabel}
        <MatIcon name="arrow_drop_down" size={14} color="#a6a6a6" />
      </button>
      {kind === 'select' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: 12, color: value ? tableTokens.text : '#9aa0a6', gap: 4, justifyContent: 'space-between' }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || placeholder}</span>
          <MatIcon name="arrow_drop_down" size={16} color="#a6a6a6" />
        </div>
      ) : kind === 'daterange' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: 12, color: value ? tableTokens.text : '#9aa0a6', gap: 4 }}>
          <MatIcon name="calendar_today" size={14} color="#9aa0a6" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        </div>
      ) : (
        <input
          defaultValue={value || ''}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '0 6px',
            fontSize: 12,
            color: tableTokens.text,
            textAlign: align === 'right' ? 'right' : 'left',
            background: 'transparent',
            minWidth: 0,
          }}
        />
      )}
    </div>
  );
}

// =====================================================================

const COLUMNS = [
  { field: 'code',       title: 'Mã NV',      width: 110, sortable: true, fixed: true, sort: 'none', filter: { kind: 'string', placeholder: '...' } },
  { field: 'fullName',   title: 'Họ và tên',  width: 200, sortable: true, sort: 'asc', filter: { kind: 'string', placeholder: '...' } },
  { field: 'dept',       title: 'Phòng ban',  width: 170, filter: { kind: 'select', placeholder: 'Chọn...' } },
  { field: 'position',   title: 'Vị trí',     width: 160, filter: { kind: 'string', placeholder: '...' } },
  { field: 'status',     title: 'Trạng thái', width: 130, filter: { kind: 'select', placeholder: 'Chọn...' } },
  { field: 'salary',     title: 'Lương',      width: 130, sortable: true, sort: 'none', align: 'right', filter: { kind: 'string', placeholder: '...' } },
  { field: 'hiredAt',    title: 'Ngày vào',   width: 150, sortable: true, sort: 'none', filter: { kind: 'daterange', placeholder: 'Khoảng ngày' } },
];

const ROWS = [
  { code: 'NV-00128', fullName: 'Nguyễn Hoài An',   dept: 'Kỹ thuật',     position: 'Senior Engineer', status: { label: 'Hoạt động', color: 'success' }, salary: 32500000, hiredAt: '12/03/2021' },
  { code: 'NV-00131', fullName: 'Trần Minh Khôi',    dept: 'Sản phẩm',     position: 'Product Manager', status: { label: 'Hoạt động', color: 'success' }, salary: 41200000, hiredAt: '04/06/2020' },
  { code: 'NV-00145', fullName: 'Lê Thị Phương Linh',dept: 'Nhân sự',      position: 'HR Business Partner', status: { label: 'Thử việc', color: 'warn' }, salary: 18500000, hiredAt: '15/01/2024' },
  { code: 'NV-00152', fullName: 'Phạm Quốc Việt',    dept: 'Tài chính',    position: 'Kế toán trưởng', status: { label: 'Hoạt động', color: 'success' }, salary: 28900000, hiredAt: '02/09/2019' },
  { code: 'NV-00164', fullName: 'Hoàng Diệu My',     dept: 'Kinh doanh',   position: 'Account Executive', status: { label: 'Nghỉ phép', color: 'info' }, salary: 22100000, hiredAt: '21/11/2022' },
  { code: 'NV-00170', fullName: 'Đặng Trung Hiếu',   dept: 'Kỹ thuật',     position: 'Tech Lead', status: { label: 'Hoạt động', color: 'success' }, salary: 47500000, hiredAt: '07/07/2018' },
  { code: 'NV-00188', fullName: 'Bùi Nhật Hạ',       dept: 'Marketing',    position: 'Content Lead', status: { label: 'Ngưng', color: 'error' }, salary: 24200000, hiredAt: '30/04/2020' },
  { code: 'NV-00194', fullName: 'Vũ Thiên Bảo',      dept: 'Kỹ thuật',     position: 'QA Engineer', status: { label: 'Hoạt động', color: 'success' }, salary: 19800000, hiredAt: '14/08/2023' },
  { code: 'NV-00203', fullName: 'Ngô Thu Trang',     dept: 'Sản phẩm',     position: 'UX Designer', status: { label: 'Hoạt động', color: 'success' }, salary: 26700000, hiredAt: '02/02/2022' },
];

function vnCurrency(n) { return (n ?? 0).toLocaleString('vi-VN'); }

// =====================================================================

function PageHeader({ title = 'Quản lý nhân viên', count = 1234 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: tableTokens.textSecondary, marginBottom: 4 }}>
          Nhân sự / Quản lý nhân viên
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, lineHeight: '28px', margin: 0, color: tableTokens.text }}>{title}</h1>
          <span style={{ fontSize: 13, color: tableTokens.textSecondary, padding: '2px 8px', background: '#eceff1', borderRadius: 4 }}>{count.toLocaleString('vi-VN')} bản ghi</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btnSecondary}>
          <MatIcon name="upload_file" size={18} outlined />
          Nhập Excel
        </button>
        <button style={btnPrimary}>
          <MatIcon name="add" size={18} />
          Tạo mới
        </button>
      </div>
    </div>
  );
}

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '0 14px', height: 36,
  background: tableTokens.primary, color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 14, fontWeight: 500,
  boxShadow: '0 1px 2px rgba(22, 87, 212, 0.25)',
};
const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '0 14px', height: 36,
  background: '#fff', color: tableTokens.text,
  border: '1px solid #d6d8db', borderRadius: 6, cursor: 'pointer',
  fontSize: 14, fontWeight: 500,
};
const btnLink = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '0 10px', height: 32,
  background: 'transparent', color: tableTokens.primary,
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 14, fontWeight: 500,
};

function ExternalFilter({ values = {} }) {
  return (
    <div style={{
      background: '#fff',
      padding: '14px 16px',
      borderRadius: 8,
      marginBottom: 16,
      boxShadow: tableTokens.panelShadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MatIcon name="filter_list" size={18} color={tableTokens.text} />
          <span style={{ fontSize: 14, fontWeight: 500, color: tableTokens.text }}>Bộ lọc</span>
          {Object.keys(values).length > 0 && (
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: tableTokens.primary, color: '#fff' }}>
              {Object.keys(values).length}
            </span>
          )}
        </div>
        <button style={btnLink}>
          <MatIcon name="restart_alt" size={16} />
          Xóa lọc
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Từ khóa', placeholder: 'Tên, mã NV, email...', value: values.q, icon: 'search' },
          { label: 'Phòng ban', placeholder: 'Tất cả phòng ban', value: values.dept, kind: 'select' },
          { label: 'Trạng thái', placeholder: 'Tất cả trạng thái', value: values.status, kind: 'select' },
          { label: 'Ngày vào', placeholder: 'dd/mm/yyyy - dd/mm/yyyy', value: values.hiredAt, kind: 'daterange' },
        ].map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: 12, color: tableTokens.textSecondary, marginBottom: 4 }}>{f.label}</div>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1px solid ${f.value ? tableTokens.primary : '#d6d8db'}`,
              borderRadius: 6, height: 36, padding: '0 10px',
              background: '#fff', gap: 6,
            }}>
              {f.icon && <MatIcon name={f.icon} size={16} color="#9aa0a6" />}
              {f.kind === 'daterange' && <MatIcon name="calendar_today" size={14} color="#9aa0a6" />}
              <span style={{ flex: 1, fontSize: 13, color: f.value ? tableTokens.text : '#9aa0a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.value || f.placeholder}
              </span>
              {f.kind === 'select' && <MatIcon name="arrow_drop_down" size={16} color="#a6a6a6" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================

function SdTable({
  rows = ROWS,
  selectedIndices = [],
  selectAll = false,
  expandedIndices = [],
  showInlineFilter = true,
  state = 'data', // 'data' | 'empty' | 'no-results' | 'loading'
  showGroup = false,
  showResize = false,
  showReorder = false,
  showFooter = false,
  total = 1234,
  pageSize = 10,
}) {
  // Build flat row list with optional group headers
  const groups = {};
  if (showGroup) {
    rows.forEach((r) => {
      (groups[r.dept] = groups[r.dept] || []).push(r);
    });
  }
  const flat = showGroup
    ? Object.entries(groups).flatMap(([g, items]) => [{ __group: g, count: items.length }, ...items])
    : rows;

  const isSelected = (i) => selectAll || selectedIndices.includes(i);
  const hasSelection = selectAll || selectedIndices.length > 0;
  const totalCols = COLUMNS.length;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      boxShadow: tableTokens.panelShadow,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Bulk action bar */}
      {hasSelection && state === 'data' && (
        <div style={{
          background: tableTokens.primary,
          color: '#fff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MatIcon name="check_circle" size={18} color="#fff" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              Đã chọn {selectAll ? rows.length : selectedIndices.length} nhân viên
            </span>
            <button style={{ ...btnLink, color: '#fff', textDecoration: 'underline', padding: 0 }}>Xóa chọn</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ ...btnSecondary, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              <MatIcon name="check_circle" size={16} outlined />
              Kích hoạt
            </button>
            <button style={{ ...btnSecondary, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              <MatIcon name="block" size={16} outlined />
              Khóa
            </button>
            <button style={{ ...btnSecondary, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              <MatIcon name="file_download" size={16} outlined />
              Xuất chọn
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', maxHeight: 560, position: 'relative' }}>
        {state === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, bottom: 56,
            background: 'rgba(0,0,0,0.15)', zIndex: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Spinner />
          </div>
        )}

        <table style={{
          borderCollapse: 'separate',
          width: '100%',
          tableLayout: 'fixed',
          fontSize: 14,
          color: tableTokens.text,
        }}>
          <colgroup>
            {showReorder && <col style={{ width: 40 }} />}
            <col style={{ width: 50 }} />
            {COLUMNS.map((c) => <col key={c.field} style={{ width: c.width }} />)}
            <col style={{ width: 96 }} />
          </colgroup>

          {/* HEADER */}
          <thead>
            <tr style={{ height: 40 }}>
              {showReorder && (
                <th style={{ ...headerCellStyle, padding: 0 }}></th>
              )}
              <th style={{ ...headerCellStyle, position: 'sticky', left: 0, zIndex: 3, padding: 0, textAlign: 'center', boxShadow: '2px 0 0 -1px rgba(0,0,0,0.04)' }}>
                <Checkbox checked={selectAll} indeterminate={!selectAll && selectedIndices.length > 0} />
              </th>
              {COLUMNS.map((col, ci) => (
                <th
                  key={col.field}
                  style={{
                    ...headerCellStyle,
                    position: col.fixed ? 'sticky' : 'static',
                    left: col.fixed ? 50 : undefined,
                    zIndex: col.fixed ? 3 : 1,
                    boxShadow: col.fixed ? '2px 0 0 -1px rgba(0,0,0,0.04)' : undefined,
                    padding: '0 8px',
                    position: 'relative',
                  }}
                >
                  <SortHeader sort={col.sortable ? col.sort : null} align={col.align}>
                    {col.title}
                  </SortHeader>
                  {showInlineFilter && (
                    <div style={{ paddingBottom: 6, paddingTop: 0 }}>
                      <InlineFilter
                        kind={col.filter?.kind}
                        placeholder={col.filter?.placeholder}
                        value={col._filterValue}
                        align={col.align}
                      />
                    </div>
                  )}
                  {showResize && ci < COLUMNS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 0, right: 0, width: 6, height: '100%',
                      cursor: 'col-resize',
                      background: ci === 1 ? 'rgba(0,0,0,0.08)' : 'transparent',
                    }}></div>
                  )}
                </th>
              ))}
              <th style={{ ...headerCellStyle, position: 'sticky', right: 0, zIndex: 3, boxShadow: '-2px 0 0 -1px rgba(0,0,0,0.04)' }}></th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {(state === 'empty' || state === 'no-results') && (
              <tr>
                <td colSpan={totalCols + 2 + (showReorder ? 1 : 0)} style={{ padding: 0 }}>
                  <EmptyState kind={state} />
                </td>
              </tr>
            )}

            {state !== 'empty' && state !== 'no-results' && flat.map((row, idx) => {
              if (row.__group) {
                return (
                  <tr key={`g${idx}`} style={{ background: '#fafbfc', borderBottom: `1px solid ${tableTokens.border}` }}>
                    <td colSpan={totalCols + 2 + (showReorder ? 1 : 0)} style={{ padding: '8px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: tableTokens.text }}>
                        <MatIcon name="folder" size={14} color={tableTokens.textMuted} style={{ marginRight: 6 }} />
                        {row.__group}
                      </span>
                      <span style={{ fontSize: 12, color: tableTokens.textSecondary, marginLeft: 8 }}>
                        ({row.count} nhân viên)
                      </span>
                    </td>
                  </tr>
                );
              }
              // index of data row within rows (for selection lookup)
              const dataIdx = rows.indexOf(row);
              const selected = isSelected(dataIdx);
              const expanded = expandedIndices.includes(dataIdx);
              return (
                <React.Fragment key={row.code}>
                  <tr style={{
                    background: selected ? tableTokens.rowSelected : '#fff',
                    height: 44,
                    transition: '120ms',
                  }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = tableTokens.rowHover; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = '#fff'; }}
                  >
                    {showReorder && (
                      <td style={{ ...cellStyle, padding: 0, textAlign: 'center', color: '#9aa0a6' }}>
                        <MatIcon name="drag_indicator" size={18} color="#9aa0a6" />
                      </td>
                    )}
                    <td style={{
                      ...cellStyle, padding: 0, textAlign: 'center',
                      position: 'sticky', left: 0, zIndex: 2,
                      background: selected ? tableTokens.rowSelected : '#fff',
                      boxShadow: '2px 0 0 -1px rgba(0,0,0,0.04)',
                    }}>
                      <Checkbox checked={selected} />
                    </td>
                    {COLUMNS.map((col) => {
                      const sticky = col.fixed;
                      let body;
                      if (col.field === 'fullName') {
                        body = (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={row.fullName} />
                            <div>
                              <a style={{ color: tableTokens.primary, fontWeight: 500, cursor: 'pointer' }}>{row.fullName}</a>
                              <div style={{ fontSize: 12, color: tableTokens.textSecondary }}>{row.fullName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}@onemount.com</div>
                            </div>
                          </div>
                        );
                      } else if (col.field === 'status') {
                        body = <Badge color={row.status.color} title={row.status.label} />;
                      } else if (col.field === 'salary') {
                        body = <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{vnCurrency(row.salary)} ₫</span>;
                      } else if (col.field === 'dept') {
                        body = (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: deptColor(row.dept) }}></span>
                            {row.dept}
                          </span>
                        );
                      } else {
                        body = row[col.field];
                      }
                      return (
                        <td key={col.field} style={{
                          ...cellStyle,
                          padding: '0 8px',
                          textAlign: col.align === 'right' ? 'right' : 'left',
                          position: sticky ? 'sticky' : 'static',
                          left: sticky ? 50 : undefined,
                          zIndex: sticky ? 2 : 1,
                          background: sticky ? (selected ? tableTokens.rowSelected : 'inherit') : undefined,
                          boxShadow: sticky ? '2px 0 0 -1px rgba(0,0,0,0.04)' : undefined,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontWeight: col.field === 'code' ? 500 : 400,
                        }}>
                          {body}
                        </td>
                      );
                    })}
                    <td style={{
                      ...cellStyle, padding: '0 4px',
                      position: 'sticky', right: 0, zIndex: 2,
                      background: selected ? tableTokens.rowSelected : '#fff',
                      boxShadow: '-2px 0 0 -1px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 0 }}>
                        <IconBtn icon="visibility" tooltip="Xem" />
                        <IconBtn icon="edit" tooltip="Sửa" />
                        <IconBtn icon="more_vert" tooltip="Thêm" />
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr style={{ background: '#fafbfc' }}>
                      <td colSpan={totalCols + 2 + (showReorder ? 1 : 0)} style={{ padding: '14px 24px', borderBottom: `1px solid ${tableTokens.border}` }}>
                        <ExpandPanel row={row} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {showFooter && state === 'data' && (
              <tr style={{ background: '#fafbfc', borderTop: `1px solid ${tableTokens.border}`, height: 40 }}>
                {showReorder && <td style={cellStyle}></td>}
                <td style={cellStyle}></td>
                {COLUMNS.map((col) => (
                  <td key={col.field} style={{ ...cellStyle, padding: '0 8px', textAlign: col.align === 'right' ? 'right' : 'left', fontWeight: 600 }}>
                    {col.field === 'code' && 'Tổng'}
                    {col.field === 'salary' && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{vnCurrency(rows.reduce((s, r) => s + r.salary, 0))} ₫</span>}
                  </td>
                ))}
                <td style={cellStyle}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATOR */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 8px',
        background: '#fff',
        borderTop: `1px solid ${tableTokens.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={btnLink} title="Tải lại">
            <MatIcon name="refresh" size={18} />
            Tải lại
          </button>
          <button style={btnLink} title="Xuất">
            <MatIcon name="get_app" size={18} outlined />
            Xuất file
          </button>
          <button style={btnLink} title="Thiết lập">
            <MatIcon name="settings" size={18} outlined />
            Thiết lập
          </button>
        </div>
        <Paginator total={total} pageSize={pageSize} />
      </div>
    </div>
  );
}

const headerCellStyle = {
  background: tableTokens.headerBg,
  borderBottom: 0,
  fontSize: 14,
  fontWeight: 500,
  color: tableTokens.text,
  textAlign: 'left',
  verticalAlign: 'top',
  paddingTop: 8,
  paddingBottom: 8,
};

const cellStyle = {
  borderBottom: `1px solid ${tableTokens.border}`,
  fontSize: 14,
  color: tableTokens.text,
  verticalAlign: 'middle',
};

function Avatar({ name }) {
  const initials = name.split(' ').slice(-2).map(s => s[0]).join('').toUpperCase();
  const hue = (name.charCodeAt(0) * 47 + name.length * 13) % 360;
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 999,
      background: `hsl(${hue} 60% 90%)`,
      color: `hsl(${hue} 50% 30%)`,
      fontSize: 12, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{initials}</span>
  );
}

function deptColor(dept) {
  const map = {
    'Kỹ thuật': '#1657d4',
    'Sản phẩm': '#7c3aed',
    'Nhân sự': '#d97706',
    'Tài chính': '#16a34a',
    'Kinh doanh': '#dc2626',
    'Marketing': '#0891b2',
  };
  return map[dept] || '#94a3b8';
}

function ExpandPanel({ row }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 13 }}>
      {[
        { label: 'Mã NV', value: row.code },
        { label: 'Phòng ban', value: row.dept },
        { label: 'Vị trí', value: row.position },
        { label: 'Quản lý trực tiếp', value: 'Trần Minh Khôi' },
        { label: 'Số điện thoại', value: '+84 909 123 456' },
        { label: 'Địa chỉ', value: '12 Lê Lợi, Q.1, TP.HCM' },
        { label: 'Ngày sinh', value: '15/08/1992' },
        { label: 'Hợp đồng', value: 'Toàn thời gian — Vô thời hạn' },
      ].map((f, i) => (
        <div key={i}>
          <div style={{ fontSize: 11, color: tableTokens.textSecondary, marginBottom: 2 }}>{f.label}</div>
          <div style={{ color: tableTokens.text }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ kind }) {
  const isResults = kind === 'no-results';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 999,
        background: isResults ? '#fdf1d8' : '#eceff1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <MatIcon name={isResults ? 'search_off' : 'inbox'} size={48} color={isResults ? tableTokens.warn : tableTokens.textMuted} outlined />
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: tableTokens.text }}>
        {isResults ? 'Không có kết quả phù hợp' : 'Chưa có dữ liệu'}
      </div>
      {isResults && (
        <div style={{ fontSize: 14, color: tableTokens.textSecondary }}>
          Vui lòng tìm kiếm hoặc lọc theo tiêu chí khác
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 40, height: 40, position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        border: '4px solid #cef',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'sd-spin 1.2s linear infinite',
      }}></div>
    </div>
  );
}

function Paginator({ total, pageSize }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: tableTokens.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: tableTokens.textSecondary }}>Số dòng / trang</span>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          border: '1px solid #d6d8db', borderRadius: 4, padding: '2px 4px 2px 8px',
          background: '#fff',
        }}>
          <span>{pageSize}</span>
          <MatIcon name="arrow_drop_down" size={18} color="#a6a6a6" />
        </div>
      </div>
      <span>1 – {pageSize} trong {total.toLocaleString('vi-VN')}</span>
      <div style={{ display: 'flex', gap: 0 }}>
        <IconBtn icon="first_page" />
        <IconBtn icon="chevron_left" />
        <IconBtn icon="chevron_right" />
        <IconBtn icon="last_page" />
      </div>
    </div>
  );
}

// =====================================================================

Object.assign(window, {
  SdTable, PageHeader, ExternalFilter,
  COLUMNS, ROWS, MAT_ICONS_LINK,
  tableTokens, MatIcon,
});

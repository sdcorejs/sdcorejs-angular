/* sd-query-bar — Jira-style unified filter row.
 *
 * Mô hình filter & operator dùng chung với sd-table (utils):
 *   Filter   = { field, operator, value }
 *   Operator = CONTAIN | EQUAL | NOT_EQUAL | GREATER | LESS | BETWEEN | IN | NOT_IN | START_WITH | IS_EMPTY | IS_NOT_EMPTY
 *
 * Một chip = một Filter. Operator mặc định ẩn, chỉ hiện khi user mở popover.
 * Logic global AND (mặc định) — toggle được sang OR.
 */

const qbTokens = {
  primary:        '#1657d4',
  primaryFaint:   '#e8efff',
  primaryHover:   '#0f47b8',
  text:           '#212121',
  textSecondary:  '#5f6368',
  textMuted:      '#7a7a7a',
  border:         '#d6d8db',
  borderSoft:     '#e2e4e7',
  bg:             '#ffffff',
  bgSoft:         '#f5f6f7',
  bgActive:       '#eef2ff',
  success:        '#16a34a',
  warn:           '#d97706',
  danger:         '#dc2626',
  shadow:         '0 6px 20px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
};

/* ---------------------------- Operator metadata --------------------------- */

const OPERATOR_LABEL = {
  EQUAL:        'là',
  NOT_EQUAL:    'không là',
  CONTAIN:      'chứa',
  NOT_CONTAIN:  'không chứa',
  START_WITH:   'bắt đầu bằng',
  IN:           'thuộc',
  NOT_IN:       'không thuộc',
  GREATER:      '>',
  GREATER_EQ:   '≥',
  LESS:         '<',
  LESS_EQ:      '≤',
  BETWEEN:      'trong khoảng',
  IS_EMPTY:     'trống',
  IS_NOT_EMPTY: 'có giá trị',
};

const OPERATORS_BY_KIND = {
  string:    ['CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  number:    ['EQUAL', 'NOT_EQUAL', 'GREATER', 'GREATER_EQ', 'LESS', 'LESS_EQ', 'BETWEEN'],
  select:    ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  date:      ['EQUAL', 'BETWEEN', 'GREATER', 'LESS'],
  boolean:   ['EQUAL'],
};

/* ---------------------------- Sample field config ------------------------- */

const QB_FIELDS = [
  { key: 'q',        label: 'Từ khóa',     kind: 'string', icon: 'search' },
  { key: 'dept',     label: 'Phòng ban',   kind: 'select', icon: 'business',
    options: ['Kỹ thuật', 'Sản phẩm', 'Nhân sự', 'Tài chính', 'Kinh doanh', 'Marketing'] },
  { key: 'status',   label: 'Trạng thái',  kind: 'select', icon: 'flag',
    options: ['Hoạt động', 'Thử việc', 'Nghỉ phép', 'Ngưng'] },
  { key: 'position', label: 'Vị trí',      kind: 'string', icon: 'work' },
  { key: 'salary',   label: 'Lương',       kind: 'number', icon: 'payments' },
  { key: 'hiredAt',  label: 'Ngày vào',    kind: 'date',   icon: 'event' },
  { key: 'manager',  label: 'Quản lý',     kind: 'select', icon: 'supervisor_account',
    options: ['Trần Minh Khôi', 'Đặng Trung Hiếu', 'Bùi Nhật Hạ'] },
  { key: 'tags',     label: 'Tags',        kind: 'select', icon: 'sell',
    options: ['VIP', 'Remote', 'Probation', 'Senior', 'Junior'] },
];

/* ---------------------------- Small icon helper --------------------------- */

/* Fallback icon theo kind khi field.icon không được set.
 * Giữ minimal & mặc định trung tính — user có thể override bằng field.icon. */
const KIND_ICON = {
  string:  'text_fields',
  number:  'tag',
  select:  'list',
  date:    'event',
  boolean: 'toggle_on',
};

function iconFor(field) {
  if (field && field.icon) return field.icon;
  if (field && field.kind && KIND_ICON[field.kind]) return KIND_ICON[field.kind];
  return 'tune';
}

function QBIcon({ name, size = 16, color, style }) {
  return (
    <span
      className="material-icons-outlined"
      style={{ fontSize: size, lineHeight: 1, color, verticalAlign: 'middle', userSelect: 'none', ...style }}
    >
      {name}
    </span>
  );
}

/* ----------------------------- Filter chip -------------------------------- */
/* A chip = { field, operator, value }.
 * - "Inactive" look: outlined gray, used when field is picked but no value yet.
 * - "Active" look: primary-tinted background when value exists.
 * - "Open" look: solid blue ring (when popover is open).
 * Operator is rendered ONLY when chipStyle config says so or when chip is open. */

function ChipBody({
  field,
  operator,
  value,
  state = 'active',          // 'inactive' | 'active' | 'open'
  density = 'compact',       // 'compact' | 'comfortable'
  showOperator = false,      // operator visible on chip face
  onClick,
  onRemove,
}) {
  const h = density === 'comfortable' ? 32 : 28;
  const hasValue = value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);

  // border + bg combo per state
  let border = qbTokens.border;
  let bg = qbTokens.bg;
  let labelColor = qbTokens.textSecondary;
  let valueColor = qbTokens.text;
  let shadow = 'none';

  if (state === 'open') {
    border = qbTokens.primary;
    bg = qbTokens.bg;
    shadow = `0 0 0 2px ${qbTokens.primaryFaint}`;
  } else if (state === 'active' && hasValue) {
    border = '#c8d8f7';
    bg = qbTokens.primaryFaint;
    labelColor = qbTokens.primary;
    valueColor = '#0b3a8a';
  } else if (state === 'inactive') {
    border = qbTokens.border;
    bg = qbTokens.bg;
    labelColor = qbTokens.textSecondary;
  }

  // Value display
  let valueText = '';
  if (Array.isArray(value)) {
    if (value.length === 0) valueText = '';
    else if (value.length === 1) valueText = value[0];
    else valueText = `${value[0]} +${value.length - 1}`;
  } else if (value !== undefined && value !== null) {
    valueText = String(value);
  }

  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: h, paddingLeft: 10, paddingRight: hasValue ? 4 : 10,
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        cursor: 'pointer',
        fontSize: 13,
        color: valueColor,
        whiteSpace: 'nowrap',
        boxShadow: shadow,
        transition: '120ms',
      }}
    >
      <QBIcon name={iconFor(field)} size={14} color={labelColor} />
      <span style={{ color: labelColor, fontWeight: 500 }}>{field.label}</span>
      {showOperator && operator && hasValue && (
        <span style={{ color: qbTokens.textMuted, fontWeight: 400, fontSize: 12 }}>
          {OPERATOR_LABEL[operator] || operator}
        </span>
      )}
      {hasValue && (
        <>
          {!showOperator && <span style={{ color: qbTokens.textMuted }}>:</span>}
          <span style={{ color: valueColor, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {valueText}
          </span>
        </>
      )}
      <QBIcon name="arrow_drop_down" size={18} color={labelColor} style={{ marginLeft: hasValue ? 0 : -2 }} />
      {hasValue && onRemove && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 999,
            marginLeft: 0, color: labelColor, cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <QBIcon name="close" size={14} color={labelColor} />
        </span>
      )}
    </button>
  );
}

/* ---------------------------- AddFilter button ---------------------------- */

function AddFilterChip({ density = 'compact', onClick, label = 'Thêm filter', state = 'idle' }) {
  const h = density === 'comfortable' ? 32 : 28;
  const open = state === 'open';
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: h, padding: '0 10px 0 8px',
        borderRadius: 999,
        border: `1px dashed ${open ? qbTokens.primary : qbTokens.border}`,
        background: open ? qbTokens.primaryFaint : 'transparent',
        cursor: 'pointer',
        fontSize: 13, fontWeight: 500,
        color: open ? qbTokens.primary : qbTokens.textSecondary,
        transition: '120ms',
      }}
      onMouseEnter={(e) => { if (!open) { e.currentTarget.style.borderColor = qbTokens.primary; e.currentTarget.style.color = qbTokens.primary; }}}
      onMouseLeave={(e) => { if (!open) { e.currentTarget.style.borderColor = qbTokens.border; e.currentTarget.style.color = qbTokens.textSecondary; }}}
    >
      <QBIcon name="add" size={16} />
      {label}
    </button>
  );
}

/* ----------------------------- Popovers ----------------------------------- */

/* Field picker popover — shown when user clicks "+ Thêm filter". */
function FieldPickerPopover({ fields, usedKeys = [], style }) {
  return (
    <div style={{
      position: 'absolute', top: '100%', marginTop: 6, left: 0, zIndex: 30,
      background: qbTokens.bg, borderRadius: 8,
      boxShadow: qbTokens.shadow,
      minWidth: 240, padding: 6, ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px 8px', borderBottom: `1px solid ${qbTokens.borderSoft}`,
        marginBottom: 4,
      }}>
        <QBIcon name="search" size={16} color={qbTokens.textMuted} />
        <input
          autoFocus
          placeholder="Tìm trường..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: qbTokens.text, background: 'transparent' }}
        />
      </div>
      <div style={{ maxHeight: 280, overflow: 'auto' }}>
        {fields.map((f) => {
          const used = usedKeys.includes(f.key);
          return (
            <div
              key={f.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', borderRadius: 6,
                cursor: used ? 'default' : 'pointer',
                opacity: used ? 0.45 : 1,
                fontSize: 13, color: qbTokens.text,
              }}
              onMouseEnter={(e) => { if (!used) e.currentTarget.style.background = qbTokens.bgSoft; }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <QBIcon name={iconFor(f)} size={16} color={qbTokens.textSecondary} />
              <span style={{ flex: 1 }}>{f.label}</span>
              <span style={{ fontSize: 11, color: qbTokens.textMuted, fontFamily: 'Roboto Mono, monospace' }}>{f.kind}</span>
              {used && <QBIcon name="check" size={14} color={qbTokens.primary} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Operator + value popover — opens when chip is clicked.
 * Layout: operator row at top, then value control. Bottom: clear/apply. */
function ChipPopover({ field, operator, value, style }) {
  const opLabel = OPERATOR_LABEL[operator] || operator;
  const ops = OPERATORS_BY_KIND[field.kind] || ['EQUAL'];

  return (
    <div style={{
      position: 'absolute', top: '100%', marginTop: 6, left: 0, zIndex: 30,
      background: qbTokens.bg, borderRadius: 8,
      boxShadow: qbTokens.shadow,
      width: 280, ...style,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderBottom: `1px solid ${qbTokens.borderSoft}`,
      }}>
        <QBIcon name={iconFor(field)} size={16} color={qbTokens.primary} />
        <span style={{ fontSize: 13, fontWeight: 500, color: qbTokens.text, flex: 1 }}>{field.label}</span>
        <QBIcon name="push_pin" size={14} color={qbTokens.textMuted} style={{ opacity: 0.5, cursor: 'pointer' }} />
      </div>

      {/* Operator row */}
      <div style={{ padding: '10px 12px 6px' }}>
        <div style={{ fontSize: 11, color: qbTokens.textMuted, marginBottom: 4 }}>ĐIỀU KIỆN</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 32, padding: '0 10px',
          border: `1px solid ${qbTokens.border}`, borderRadius: 6,
          background: qbTokens.bg, fontSize: 13, color: qbTokens.text, cursor: 'pointer',
        }}>
          <span>{opLabel}</span>
          <QBIcon name="arrow_drop_down" size={18} color={qbTokens.textMuted} />
        </div>
      </div>

      {/* Value control */}
      <div style={{ padding: '6px 12px 10px' }}>
        <div style={{ fontSize: 11, color: qbTokens.textMuted, marginBottom: 4 }}>GIÁ TRỊ</div>
        {field.kind === 'select' && field.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflow: 'auto' }}>
            {field.options.map((opt) => {
              const selected = Array.isArray(value) ? value.includes(opt) : value === opt;
              return (
                <div key={opt} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 4, fontSize: 13, color: qbTokens.text,
                  background: selected ? qbTokens.primaryFaint : 'transparent',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 2,
                    border: `1.5px solid ${selected ? qbTokens.primary : '#9aa0a6'}`,
                    background: selected ? qbTokens.primary : 'transparent',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <QBIcon name="check" size={10} color="#fff" />}
                  </span>
                  {opt}
                </div>
              );
            })}
          </div>
        )}
        {field.kind === 'string' && (
          <input
            defaultValue={value || ''}
            autoFocus
            placeholder="Nhập từ khóa..."
            style={{
              width: '100%', height: 32, padding: '0 10px',
              border: `1px solid ${qbTokens.border}`, borderRadius: 6,
              fontSize: 13, color: qbTokens.text, outline: 'none', fontFamily: 'inherit',
            }}
          />
        )}
        {field.kind === 'number' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input defaultValue={Array.isArray(value) ? value[0] : value || ''} placeholder="Từ"
              style={{ flex: 1, height: 32, padding: '0 10px', border: `1px solid ${qbTokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}/>
            {operator === 'BETWEEN' && (
              <>
                <span style={{ color: qbTokens.textMuted }}>—</span>
                <input defaultValue={Array.isArray(value) ? value[1] : ''} placeholder="Đến"
                  style={{ flex: 1, height: 32, padding: '0 10px', border: `1px solid ${qbTokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}/>
              </>
            )}
          </div>
        )}
        {field.kind === 'date' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 10px',
            border: `1px solid ${qbTokens.border}`, borderRadius: 6,
            fontSize: 13, color: qbTokens.textMuted,
          }}>
            <QBIcon name="calendar_today" size={14} />
            <span>dd/mm/yyyy</span>
            {operator === 'BETWEEN' && (
              <>
                <span style={{ marginLeft: 'auto' }}>→</span>
                <span>dd/mm/yyyy</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderTop: `1px solid ${qbTokens.borderSoft}`,
      }}>
        <button style={{
          appearance: 'none', border: 'none', background: 'transparent',
          fontSize: 12, color: qbTokens.danger, cursor: 'pointer', padding: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
        }}>
          <QBIcon name="delete_outline" size={14} />
          Xóa filter
        </button>
        <button style={{
          appearance: 'none', border: 'none', background: qbTokens.primary, color: '#fff',
          fontSize: 13, fontWeight: 500, padding: '0 14px', height: 28, borderRadius: 6,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Áp dụng
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Logic toggle -------------------------------- */

function LogicToggle({ value = 'AND', density = 'compact' }) {
  const h = density === 'comfortable' ? 32 : 28;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: h, borderRadius: 6, padding: 2,
      background: qbTokens.bgSoft, border: `1px solid ${qbTokens.borderSoft}`,
    }}>
      {['AND', 'OR'].map((op) => (
        <span key={op} style={{
          padding: '0 10px', height: h - 6,
          display: 'inline-flex', alignItems: 'center',
          borderRadius: 4,
          fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
          fontFamily: 'Roboto Mono, monospace',
          background: value === op ? qbTokens.bg : 'transparent',
          color: value === op ? qbTokens.primary : qbTokens.textSecondary,
          boxShadow: value === op ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
          cursor: 'pointer',
        }}>
          {op}
        </span>
      ))}
    </div>
  );
}

/* --------------------------- Saved views menu ----------------------------- */

function SavedViewsMenu({ density = 'compact', current = 'Tất cả' }) {
  const h = density === 'comfortable' ? 32 : 28;
  return (
    <button style={{
      appearance: 'none', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: h, padding: '0 10px',
      borderRadius: 6,
      border: `1px solid ${qbTokens.border}`,
      background: qbTokens.bg,
      fontSize: 13, color: qbTokens.text, cursor: 'pointer',
    }}>
      <QBIcon name="bookmark_border" size={14} color={qbTokens.textSecondary} />
      <span style={{ fontWeight: 500 }}>{current}</span>
      <QBIcon name="arrow_drop_down" size={18} color={qbTokens.textMuted} />
    </button>
  );
}

/* ----------------------------- QueryBar shell ----------------------------- */

function SdQueryBar({
  filters = [],            // [{field: 'dept', operator: 'IN', value: ['Kỹ thuật']}]
  logic = 'AND',
  density = 'compact',
  showSearch = false,
  showLogic = false,
  showSavedViews = false,
  showClearAll = true,
  showOperatorOnChip = false,
  editingIndex = null,     // index of chip with open popover
  addOpen = false,         // field picker popover open
  fields = QB_FIELDS,
  align = 'left',
}) {
  const usedKeys = filters.map((f) => f.field);
  const h = density === 'comfortable' ? 32 : 28;
  const activeCount = filters.filter((f) => {
    const v = f.value;
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
  }).length;

  return (
    <div style={{
      background: qbTokens.bg,
      border: `1px solid ${qbTokens.borderSoft}`,
      borderRadius: 8,
      padding: density === 'comfortable' ? 10 : 8,
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      position: 'relative',
    }}>
      {/* Optional left search */}
      {showSearch && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: h, padding: '0 10px',
          borderRadius: 6, border: `1px solid ${qbTokens.border}`,
          background: qbTokens.bg, minWidth: 220,
        }}>
          <QBIcon name="search" size={16} color={qbTokens.textMuted} />
          <input
            placeholder="Tìm kiếm..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: qbTokens.text, background: 'transparent' }}
          />
          <span style={{ fontSize: 10, fontFamily: 'Roboto Mono, monospace', color: qbTokens.textMuted, padding: '1px 4px', border: `1px solid ${qbTokens.borderSoft}`, borderRadius: 3 }}>/</span>
        </div>
      )}

      {showSearch && (filters.length > 0 || true) && (
        <span style={{ width: 1, height: 16, background: qbTokens.borderSoft, margin: '0 2px' }}></span>
      )}

      {/* Chips */}
      {filters.map((f, i) => {
        const field = fields.find((x) => x.key === f.field);
        if (!field) return null;
        const isOpen = editingIndex === i;
        const state = isOpen ? 'open' : (f.value === undefined || f.value === null || f.value === '' || (Array.isArray(f.value) && !f.value.length) ? 'inactive' : 'active');
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && showLogic && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
                fontFamily: 'Roboto Mono, monospace',
                color: qbTokens.textMuted,
                padding: '0 2px',
              }}>
                {logic}
              </span>
            )}
            <ChipBody
              field={field}
              operator={f.operator}
              value={f.value}
              state={state}
              density={density}
              showOperator={showOperatorOnChip}
            />
            {isOpen && <ChipPopover field={field} operator={f.operator} value={f.value} />}
          </span>
        );
      })}

      {/* Add filter */}
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <AddFilterChip density={density} state={addOpen ? 'open' : 'idle'} />
        {addOpen && <FieldPickerPopover fields={fields} usedKeys={usedKeys} />}
      </span>

      {/* Spacer */}
      <span style={{ flex: 1 }}></span>

      {/* Right cluster */}
      {showLogic && activeCount > 1 && <LogicToggle value={logic} density={density} />}
      {showSavedViews && <SavedViewsMenu density={density} />}

      {showClearAll && activeCount > 0 && (
        <button style={{
          appearance: 'none', border: 'none', background: 'transparent',
          fontFamily: 'inherit', fontSize: 12, color: qbTokens.textSecondary,
          height: h, padding: '0 8px', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <QBIcon name="close" size={14} />
          Xóa tất cả ({activeCount})
        </button>
      )}
    </div>
  );
}

/* --------------------------- Mode toggle (vs inline) ---------------------- */

function ModeToggle({ value = 'bar' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: 32, borderRadius: 6,
      border: `1px solid ${qbTokens.border}`,
      background: qbTokens.bg, overflow: 'hidden',
    }}>
      {[
        { v: 'bar',    label: 'Filter Bar',    icon: 'view_agenda' },
        { v: 'inline', label: 'Inline Header', icon: 'view_column' },
      ].map((o, i) => (
        <span key={o.v} style={{
          padding: '0 10px', height: '100%',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 500,
          color: value === o.v ? qbTokens.primary : qbTokens.textSecondary,
          background: value === o.v ? qbTokens.primaryFaint : 'transparent',
          borderLeft: i > 0 ? `1px solid ${qbTokens.borderSoft}` : 'none',
          cursor: 'pointer',
        }}>
          <QBIcon name={o.icon} size={14} />
          {o.label}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------- Export ------------------------------------- */

Object.assign(window, {
  SdQueryBar,
  ChipBody,
  ChipPopover,
  FieldPickerPopover,
  AddFilterChip,
  LogicToggle,
  SavedViewsMenu,
  ModeToggle,
  QB_FIELDS,
  OPERATOR_LABEL,
  OPERATORS_BY_KIND,
  KIND_ICON,
  iconFor,
  qbTokens,
  QBIcon,
});

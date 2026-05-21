/* eslint-disable */
// builder-mock.jsx — reusable visual primitives + the 3-panel mock shell

// Material Symbol render (variable font, weight 300 default)
function Sym({ name, size = 18, fill = 0, weight = 300, style }) {
  return (
    <span
      className={'msi' + (fill ? ' filled' : '')}
      style={{ fontSize: size, fontVariationSettings: `'wght' ${weight}, 'FILL' ${fill}, 'opsz' ${size <= 20 ? 20 : 24}, 'GRAD' 0`, ...style }}>
      {name}
    </span>
  );
}

// Component-type → Material Symbol mapping (single source of truth)
const COMPONENT_ICONS = {
  textfield:     { sym: 'text_fields',           label: 'Text field' },
  textarea:      { sym: 'notes',                 label: 'Text area' },
  'chip-string': { sym: 'label',                 label: 'Chip string' },
  'chip-calendar':{sym: 'event_note',            label: 'Chip calendar' },
  number:        { sym: '123',                   label: 'Number' },
  datetime:      { sym: 'calendar_month',        label: 'Date / time' },
  select:        { sym: 'arrow_drop_down_circle',label: 'Select' },
  radio:         { sym: 'radio_button_checked',  label: 'Radio' },
  checkbox:      { sym: 'check_box',             label: 'Check box' },
  html:          { sym: 'code_blocks',           label: 'HTML' },
  upload:        { sym: 'upload_file',           label: 'Upload' },
  table:         { sym: 'table_rows',            label: 'Table' },
  group:         { sym: 'category',              label: 'Group' },
};

const PALETTE_GROUPS = [
  { label: 'Basic',    items: ['textfield', 'textarea', 'number', 'datetime'] },
  { label: 'Choice',   items: ['select', 'radio', 'checkbox'] },
  { label: 'Advanced', items: ['chip-string', 'chip-calendar', 'upload', 'table'] },
  { label: 'Layout',   items: ['group', 'html'] },
];

function PaletteSearch() {
  return (
    <div className="fb-palette__search">
      <Sym name="search" size={18} />
      <span style={{ flex: 1 }}>Search components…</span>
      <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>⌘K</span>
    </div>
  );
}

function PaletteItem({ type, hoverState }) {
  const def = COMPONENT_ICONS[type];
  return (
    <div className="fb-palette-item" style={hoverState ? { background: 'color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)' } : undefined}>
      <span className="fb-palette-item__icon"><Sym name={def.sym} size={16} /></span>
      <span className="fb-palette-item__name">{def.label}</span>
      <span className="fb-palette-item__drag" style={hoverState ? { opacity: 1 } : undefined}>
        <Sym name="drag_indicator" size={16} />
      </span>
    </div>
  );
}

function Palette({ hoverType }) {
  return (
    <div className="fb-palette">
      <div className="fb-panel-header">
        <span className="fb-panel-header__title">Components</span>
        <div className="fb-panel-header__actions">
          <button className="fb-icon-btn" title="Collapse"><Sym name="left_panel_close" size={16} /></button>
        </div>
      </div>
      <PaletteSearch />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {PALETTE_GROUPS.map((g) => (
          <React.Fragment key={g.label}>
            <div className="fb-palette__group-label">{g.label}</div>
            <div className="fb-palette__list">
              {g.items.map((t) => <PaletteItem key={t} type={t} hoverState={t === hoverType} />)}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ────── Faux fields rendered inside canvas ──────
function Field({ label, required, helper, children, status }) {
  return (
    <div className="faux-field">
      <div className="faux-field__label">
        {label}{required && <span className="req">*</span>}
        {status === 'optional' && <span style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 400 }}>Optional</span>}
      </div>
      {children}
      {helper && <div className="faux-field__hint">{helper}</div>}
    </div>
  );
}

function FauxTextField({ label, required, value, placeholder, helper }) {
  return (
    <Field label={label} required={required} helper={helper}>
      <div className={'faux-input ' + (value ? 'has-value' : 'empty')}>{value || placeholder || ''}</div>
    </Field>
  );
}
function FauxTextArea({ label, required, value }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-textarea">{value}</div>
    </Field>
  );
}
function FauxSelect({ label, required, value, placeholder }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-input" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <span style={value ? {} : { color: 'var(--md-sys-color-on-surface-variant)' }}>{value || placeholder}</span>
        <Sym name="arrow_drop_down" size={20} />
      </div>
    </Field>
  );
}
function FauxRadio({ label, required, value, options }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-radio-group">
        {options.map((o) => (
          <span key={o} className="faux-radio">
            <span className={'faux-radio__dot' + (o === value ? ' on' : '')}></span>{o}
          </span>
        ))}
      </div>
    </Field>
  );
}
function FauxCheckbox({ label, required, values, options }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-check-group">
        {options.map((o) => (
          <span key={o} className="faux-check">
            <span className={'faux-check__box' + (values.includes(o) ? ' on' : '')}>
              {values.includes(o) && <Sym name="check" size={12} weight={400} />}
            </span>{o}
          </span>
        ))}
      </div>
    </Field>
  );
}
function FauxNumber({ label, required, value }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-input" style={{ justifyContent: 'space-between' }}>
        <span>{value}</span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
          <Sym name="arrow_drop_up" size={14} />
          <Sym name="arrow_drop_down" size={14} />
        </span>
      </div>
    </Field>
  );
}
function FauxDateTime({ label, required, value }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-input" style={{ justifyContent: 'space-between' }}>
        <span className={value ? '' : 'empty'} style={value ? {} : { color: 'var(--md-sys-color-on-surface-variant)' }}>{value || 'dd/mm/yyyy hh:mm'}</span>
        <Sym name="calendar_month" size={16} />
      </div>
    </Field>
  );
}
function FauxChips({ label, required, chips }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-input" style={{ height: 'auto', minHeight: 32, padding: 4 }}>
        <div className="faux-chip-row">
          {chips.map((c) => (
            <span key={c} className="faux-chip">{c}<Sym name="close" size={14} /></span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', alignSelf: 'center', paddingLeft: 4 }}>Add…</span>
        </div>
      </div>
    </Field>
  );
}
function FauxUpload({ label, required }) {
  return (
    <Field label={label} required={required}>
      <div className="faux-upload">
        <Sym name="cloud_upload" size={28} />
        <div style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface)' }}>Drop files or <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 500 }}>browse</span></div>
        <div style={{ fontSize: 10 }}>PDF, PNG, JPG · max 10MB</div>
      </div>
    </Field>
  );
}
function FauxTable({ label }) {
  return (
    <Field label={label}>
      <div className="faux-table">
        <div className="faux-table__row header">
          <div className="faux-table__cell">Item</div>
          <div className="faux-table__cell">Quantity</div>
          <div className="faux-table__cell">Price</div>
          <div className="faux-table__cell"></div>
        </div>
        <div className="faux-table__row">
          <div className="faux-table__cell">Macbook Air M3</div>
          <div className="faux-table__cell">1</div>
          <div className="faux-table__cell">$1,099</div>
          <div className="faux-table__cell" style={{ textAlign: 'center' }}><Sym name="delete" size={14} /></div>
        </div>
        <div className="faux-table__row">
          <div className="faux-table__cell">Magic Mouse</div>
          <div className="faux-table__cell">2</div>
          <div className="faux-table__cell">$198</div>
          <div className="faux-table__cell" style={{ textAlign: 'center' }}><Sym name="delete" size={14} /></div>
        </div>
      </div>
    </Field>
  );
}

// ────── Canvas item with actions/states ──────
function ItemActions({ readonly, hidden }) {
  return (
    <div className="fb-actions">
      <button className={'fb-icon-btn warning' + (readonly ? ' on' : '')} title={readonly ? 'Unset read-only' : 'Set read-only'}>
        <Sym name="edit_off" size={16} />
      </button>
      <button className="fb-icon-btn" title="Duplicate">
        <Sym name="content_copy" size={16} />
      </button>
      <button className={'fb-icon-btn' + (hidden ? ' on' : '')} title={hidden ? 'Show' : 'Hide'}>
        <Sym name={hidden ? 'visibility_off' : 'visibility'} size={16} />
      </button>
      <button className="fb-icon-btn danger" title="Delete">
        <Sym name="delete" size={16} />
      </button>
    </div>
  );
}

function CanvasItem({ children, selected, hidden, readonly, dragging, showResize, statusChip, width = '100%' }) {
  const cls = ['fb-item'];
  if (selected) cls.push('is-selected');
  if (hidden) cls.push('is-hidden');
  if (readonly) cls.push('is-readonly');
  if (dragging) cls.push('is-dragging');
  return (
    <div className={cls.join(' ')} style={{ width, flex: width === '100%' ? 1 : undefined }}>
      {statusChip}
      <ItemActions readonly={readonly} hidden={hidden} />
      {children}
      {showResize && <div className="fb-resize"></div>}
    </div>
  );
}

// ────── Attribute panel ──────
function Section({ title, icon, open, children }) {
  return (
    <div className={'fb-section' + (open ? ' is-open' : '')}>
      <div className="fb-section__head">
        <Sym name={icon} size={16} />
        <span>{title}</span>
        <Sym name="chevron_right" size={16} style={{ marginLeft: 'auto', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.16s' }} />
      </div>
      {open && <div className="fb-section__body">{children}</div>}
    </div>
  );
}
function AttrField({ label, value, placeholder, focused, suffix }) {
  return (
    <div className="fb-field">
      <div className="fb-field__label">{label}</div>
      <div className={'fb-field__input' + (focused ? ' focused' : '') + (value ? '' : ' placeholder')}>
        <span>{value || placeholder || ''}</span>
        {suffix}
      </div>
    </div>
  );
}
function AttrRow({ label, control }) {
  return (
    <div className="fb-field-row">
      <span className="fb-field__label" style={{ marginBottom: 0 }}>{label}</span>
      {control}
    </div>
  );
}
function Switch({ on }) { return <span className={'fb-switch' + (on ? ' on' : '')}><span className="fb-switch__thumb"></span></span>; }

function ExprInput({ tokens, placeholder }) {
  return (
    <div className="fb-expr">
      <span className="fb-expr__badge">FEEL</span>
      {tokens ? (
        <span className="fb-expr__code">
          {tokens.map((t, i) => <span key={i} className={t.type}>{t.text}</span>)}
        </span>
      ) : (
        <span className="empty">{placeholder || 'Empty'}</span>
      )}
      <Sym name="functions" size={14} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
    </div>
  );
}

function AttributePanelFull() {
  return (
    <div className="fb-attrs">
      <div className="fb-panel-header">
        <span className="fb-panel-header__title">Attributes</span>
      </div>
      <div className="fb-attrs__selection">
        <span className="fb-attrs__sel-icon"><Sym name="text_fields" size={18} /></span>
        <div className="fb-attrs__sel-meta">
          <span className="fb-attrs__sel-name">Customer email</span>
          <span className="fb-attrs__sel-key mono">customerEmail · textfield</span>
        </div>
      </div>
      <div className="fb-attrs__body">
        <Section title="General" icon="info" open>
          <AttrField label="Template" value="" placeholder="Choose template…" suffix={<Sym name="bookmark" size={14} />} />
          <AttrField label="Field key" value="customerEmail" />
          <AttrField label="Label" value="Customer email" focused />
          <AttrField label="Hint" value="We'll only use this to send the receipt" />
          <AttrField label="Default value" value="" placeholder="Empty" />
        </Section>
        <Section title="Display" icon="visibility" open>
          <AttrRow label="Disabled" control={<Switch on={false} />} />
          <div className="fb-field">
            <div className="fb-field__label">Visible when</div>
            <ExprInput tokens={[
              { text: 'paymentMethod', type: 'var' },
              { text: ' = ', type: 'op' },
              { text: '"email"', type: 'lit' },
            ]} />
          </div>
          <div className="fb-field">
            <div className="fb-field__label">Hidden when</div>
            <ExprInput placeholder="Add expression" />
          </div>
          <div className="fb-field">
            <div className="fb-field__label">Disabled when</div>
            <ExprInput placeholder="Add expression" />
          </div>
        </Section>
        <Section title="Validation" icon="verified" open>
          <AttrRow label="Required" control={<Switch on />} />
          <AttrField label="Max length" value="120" />
          <AttrField label="Pattern" value="^[\\w.-]+@[\\w.-]+$" />
          <AttrField label="Pattern message" value="Must be a valid email" />
        </Section>
        <Section title="Layout" icon="view_quilt" open={false} />
      </div>
    </div>
  );
}

// ────── Canvas header ──────
function CanvasHeader({ mode = 'design' }) {
  return (
    <div className="fb-panel-header">
      <div className="fb-canvas__title">
        <Sym name="dashboard_customize" size={14} />
        <span>Customer onboarding</span>
        <span className="breadcrumb-sep">/</span>
        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Layout</span>
      </div>
      <div className="fb-panel-header__actions" style={{ gap: 8 }}>
        <button className="fb-icon-btn" title="Undo"><Sym name="undo" size={16} /></button>
        <button className="fb-icon-btn" title="Redo"><Sym name="redo" size={16} /></button>
        <span style={{ width: 1, height: 18, background: 'var(--md-sys-color-outline-variant)', margin: '0 4px' }}></span>
        <button className="fb-icon-btn" title="View JSON"><Sym name="data_object" size={16} /></button>
        <button className="fb-icon-btn" title="Variables"><Sym name="data_array" size={16} /></button>
        <button className="fb-icon-btn" title="Validations"><Sym name="rule" size={16} /></button>
        <span style={{ width: 1, height: 18, background: 'var(--md-sys-color-outline-variant)', margin: '0 4px' }}></span>
        <div className="fb-mode-toggle">
          <button className={mode === 'design' ? 'is-active' : ''}><Sym name="edit" size={14} />Design</button>
          <button className={mode === 'preview' ? 'is-active' : ''}><Sym name="play_arrow" size={14} />Preview</button>
        </div>
      </div>
    </div>
  );
}

// Export everything
Object.assign(window, {
  Sym, COMPONENT_ICONS, PALETTE_GROUPS,
  Palette, PaletteItem, PaletteSearch,
  Field, FauxTextField, FauxTextArea, FauxSelect, FauxRadio, FauxCheckbox, FauxNumber, FauxDateTime, FauxChips, FauxUpload, FauxTable,
  ItemActions, CanvasItem,
  Section, AttrField, AttrRow, Switch, ExprInput, AttributePanelFull,
  CanvasHeader,
});

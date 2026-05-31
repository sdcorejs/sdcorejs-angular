/* eslint-disable */
// artboards.jsx — composes all artboards into the DesignCanvas

// ────────────────────────────────────────────────────────────
// Artboard 1 — Overall 3-panel layout (1440 × 880)
// ────────────────────────────────────────────────────────────
function ArtboardOverall() {
  return (
    <div className="fb-shell" style={{ width: 1440, height: 880 }}>
      <Palette />
      <div className="fb-canvas">
        <CanvasHeader mode="design" />
        <div className="fb-canvas__body">
          {/* Row 1: full-width text */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem selected width="100%">
              <FauxTextField label="Customer email" required value="jane@onemount.com" helper="We'll only use this to send the receipt" />
            </CanvasItem>
          </div>
          {/* Row 2: 6 + 6 */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="calc(50% - 4px)">
              <FauxTextField label="First name" required value="Jane" />
            </CanvasItem>
            <CanvasItem width="calc(50% - 4px)">
              <FauxTextField label="Last name" required value="Doe" />
            </CanvasItem>
          </div>
          {/* Row 3: 4+4+4 */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="calc(33.333% - 6px)">
              <FauxSelect label="Country" required value="Vietnam" />
            </CanvasItem>
            <CanvasItem width="calc(33.333% - 6px)">
              <FauxDateTime label="Birth date" value="14/03/1992" />
            </CanvasItem>
            <CanvasItem width="calc(33.333% - 6px)" readonly statusChip={<span className="fb-status-chip readonly"><Sym name="edit_off" size={11} />Read only</span>}>
              <FauxNumber label="Customer ID" value="C-2046" />
            </CanvasItem>
          </div>
          {/* Row 4: radio */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="100%">
              <FauxRadio label="Plan" required value="Pro" options={['Free', 'Pro', 'Enterprise']} />
            </CanvasItem>
          </div>
          {/* Row 5: chips */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="100%">
              <FauxChips label="Interests" chips={['Product', 'Design', 'Engineering']} />
            </CanvasItem>
          </div>
          {/* Row 6: textarea hidden */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="100%" hidden statusChip={<span className="fb-status-chip hidden"><Sym name="visibility_off" size={11} />Hidden</span>}>
              <FauxTextArea label="Internal notes" value="Only visible to admins" />
            </CanvasItem>
          </div>
          {/* Row 7: upload */}
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem width="100%">
              <FauxUpload label="Identity document" required />
            </CanvasItem>
          </div>
        </div>
      </div>
      <AttributePanelFull />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 2 — Empty state (1200 × 720)
// ────────────────────────────────────────────────────────────
function ArtboardEmptyState() {
  return (
    <div className="fb-shell" style={{ width: 1200, height: 720 }}>
      <Palette hoverType="textfield" />
      <div className="fb-canvas">
        <CanvasHeader mode="design" />
        <div className="fb-canvas__body">
          <div className="fb-empty">
            <div className="fb-empty__art">
              <Sym name="dashboard_customize" size={48} />
            </div>
            <div className="fb-empty__title">Drag components here to start</div>
            <div className="fb-empty__hint">
              Build your form by dragging fields from the left panel, or press
              <span className="fb-empty__kbd"><Sym name="keyboard" size={12} />⌘ K</span>
              to search.
            </div>
          </div>
        </div>
      </div>
      <div className="fb-attrs">
        <div className="fb-panel-header">
          <span className="fb-panel-header__title">Attributes</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: 24, fontSize: 12, lineHeight: 1.5 }}>
          <div>
            <Sym name="ads_click" size={32} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--md-sys-color-outline)' }} />
            Select a component to edit its attributes.
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 3 — Palette detail (full vertical list, 280 × 720)
// ────────────────────────────────────────────────────────────
function ArtboardPaletteDetail() {
  return (
    <div style={{ width: 280, height: 720, display: 'flex' }}>
      <Palette hoverType="datetime" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 4 — Canvas item states (920 × 880)
// ────────────────────────────────────────────────────────────
function StateCard({ title, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--md-sys-color-on-surface)' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>{hint}</span>
      </div>
      <div style={{ background: 'var(--md-sys-color-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--md-sys-color-outline-variant)' }}>
        {children}
      </div>
    </div>
  );
}
function ArtboardItemStates() {
  return (
    <div style={{ width: 920, padding: 24, background: 'var(--md-sys-color-surface-container-low)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Item states</h2>
        <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>Hover-only chrome (actions, resize, drag) so the canvas reads as the final form</span>
      </div>

      <StateCard title="Default" hint="Resting state, chrome hidden">
        <div className="fb-row" style={{ outlineColor: 'transparent' }}>
          <div className="fb-item">
            <FauxTextField label="Field label" placeholder="placeholder" />
          </div>
        </div>
      </StateCard>

      <StateCard title="Hover" hint="Dashed primary border + floating action pill + drag grip + resize handle">
        <div className="fb-row" style={{ outline: '1px dashed var(--md-sys-color-outline-variant)', background: 'color-mix(in srgb, var(--md-sys-color-primary) 3%, transparent)' }}>
          <div className="fb-row__drag" style={{ opacity: 1 }}><Sym name="drag_indicator" size={14} /></div>
          <div className="fb-item" style={{ borderColor: 'color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent)' }}>
            <ItemActions />
            <FauxTextField label="Field label" value="Sample value" />
            <div className="fb-resize" style={{ opacity: 1 }}></div>
          </div>
        </div>
      </StateCard>

      <StateCard title="Selected" hint="Solid primary border, action pill pinned, attribute panel populated">
        <div className="fb-row">
          <div className="fb-item is-selected">
            <ItemActions />
            <FauxTextField label="Customer email" required value="jane@onemount.com" />
          </div>
        </div>
      </StateCard>

      <StateCard title="Read-only" hint="Hatched overlay + amber chip; bypasses validation/dirty-check">
        <div className="fb-row">
          <div className="fb-item is-readonly">
            <span className="fb-status-chip readonly"><Sym name="edit_off" size={11} />Read only</span>
            <FauxTextField label="Customer ID" value="C-2046" />
          </div>
        </div>
      </StateCard>

      <StateCard title="Hidden" hint="45% opacity + chip; still in DOM so author can edit but won't render at runtime">
        <div className="fb-row">
          <div className="fb-item is-hidden">
            <span className="fb-status-chip hidden"><Sym name="visibility_off" size={11} />Hidden</span>
            <FauxTextField label="Internal notes" value="Only visible to admins" />
          </div>
        </div>
      </StateCard>

      <StateCard title="Conditional" hint="Lightning chip when visibleWhen / hiddenWhen / disabledWhen expression is set">
        <div className="fb-row">
          <div className="fb-item">
            <span className="fb-status-chip" style={{ color: 'var(--md-sys-color-primary)', background: 'var(--md-sys-color-primary-container)', borderColor: 'transparent' }}>
              <Sym name="bolt" size={11} />Visible when <span className="mono" style={{ fontSize: 10 }}>plan = "pro"</span>
            </span>
            <FauxTextField label="Tax ID" placeholder="Required for Pro accounts" />
          </div>
        </div>
      </StateCard>

      <StateCard title="Validation error" hint="Red border + inline error helper">
        <div className="fb-row">
          <div className="fb-item" style={{ borderColor: 'var(--md-sys-color-error)', borderStyle: 'solid' }}>
            <ItemActions />
            <div className="faux-field">
              <div className="faux-field__label">Customer email <span className="req">*</span></div>
              <div className="faux-input" style={{ borderColor: 'var(--md-sys-color-error)' }}>jane@</div>
              <div className="faux-field__hint" style={{ color: 'var(--md-sys-color-error)' }}>Must be a valid email</div>
            </div>
          </div>
        </div>
      </StateCard>

      <StateCard title="Dragging" hint="Lift + tilt + elevation; drop hint stays in source row">
        <div className="fb-row">
          <div className="fb-item is-dragging">
            <FauxTextField label="First name" value="Jane" />
          </div>
        </div>
        <div className="fb-drop-hint"><Sym name="south" size={14} />Drop here</div>
        <div className="fb-row">
          <div className="fb-item"><FauxTextField label="Last name" value="Doe" /></div>
        </div>
      </StateCard>

      <StateCard title="Resizing — 12-col ruler" hint="Faint primary grid appears while dragging the right edge">
        <div className="fb-row" style={{ position: 'relative', padding: 16 }}>
          <div className="fb-ruler" style={{ position: 'absolute', inset: 0, padding: 16 }}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="fb-ruler__cell" style={{ opacity: i < 7 ? 0.9 : 0.35 }}></div>)}
          </div>
          <div className="fb-item is-selected" style={{ width: 'calc(58.333% - 4px)', position: 'relative' }}>
            <FauxTextField label="First name" value="Jane" />
            <div className="fb-resize" style={{ opacity: 1 }}></div>
          </div>
        </div>
      </StateCard>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 5 — Attribute panel close-up (360 × 880)
// ────────────────────────────────────────────────────────────
function ArtboardAttrPanel() {
  return (
    <div style={{ width: 360, height: 880, display: 'flex', background: 'var(--md-sys-color-surface-container-low)' }}>
      <AttributePanelFull />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 6 — Preview mode (1280 × 720)
// ────────────────────────────────────────────────────────────
function ArtboardPreview() {
  return (
    <div className="fb-shell" style={{ width: 1280, height: 720 }}>
      <Palette />
      <div className="fb-canvas">
        <CanvasHeader mode="preview" />
        <div className="fb-canvas__body" style={{ padding: 32, background: 'var(--md-sys-color-surface-container-low)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', background: 'var(--md-sys-color-surface-container-lowest)', borderRadius: 16, padding: 32, boxShadow: 'var(--elev-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sym name="play_circle" size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--md-sys-color-primary)' }}>Preview · runtime</span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 500 }}>Customer onboarding</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>Fill in the form below to create your account.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FauxTextField label="First name" required value="Jane" />
              <FauxTextField label="Last name" required value="Doe" />
              <div style={{ gridColumn: '1 / -1' }}><FauxTextField label="Customer email" required value="jane@onemount.com" helper="We'll only use this to send the receipt" /></div>
              <FauxSelect label="Country" required value="Vietnam" />
              <FauxDateTime label="Birth date" value="14/03/1992" />
              <div style={{ gridColumn: '1 / -1' }}><FauxRadio label="Plan" required value="Pro" options={['Free', 'Pro', 'Enterprise']} /></div>
              <div style={{ gridColumn: '1 / -1' }}><FauxChips label="Interests" chips={['Product', 'Design', 'Engineering']} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button style={{ height: 40, padding: '0 24px', borderRadius: 20, border: '1px solid var(--md-sys-color-outline)', background: 'transparent', color: 'var(--md-sys-color-primary)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button style={{ height: 40, padding: '0 24px', borderRadius: 20, border: 'none', background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Sym name="check" size={16} />Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 7 — Icon set spec (1040 × 720)
// ────────────────────────────────────────────────────────────
const OLD_SVGS = {
  textfield:    '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M45 16a3 3 0 013 3v16a3 3 0 01-3 3H9a3 3 0 01-3-3V19a3 3 0 013-3h36zm0 2H9a1 1 0 00-1 1v16a1 1 0 001 1h36a1 1 0 001-1V19a1 1 0 00-1-1zm-32 4v10h-2V22h2z"/></svg>',
  textarea:     '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M45 13a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3zm0 2H9a1 1 0 0 0-1 1v22a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1V16a1 1 0 0 0-1-1m-1.136 15.5.849.849-6.364 6.364-.849-.849zm.264 3.5.849.849-2.828 2.828-.849-.849zM13 19v10h-2V19z"/></svg>',
  'chip-string':'<svg viewBox="0 -960 960 960" fill="currentcolor"><path d="M160-240q-33 0-56.5-23.5T80-320v-320q0-33 23.5-56.5T160-720h640q33 0 56.5 23.5T880-640v320q0 33-23.5 56.5T800-240H160Zm0-80h640v-320H160v320Zm130-40h60v-90h90v-60h-90v-90h-60v90h-90v60h90v90Zm-130 40v-320 320Z"/></svg>',
  'chip-calendar':'<svg viewBox="0 -960 960 960" fill="currentcolor"><path d="M160-240q-33 0-56.5-23.5T80-320v-320q0-33 23.5-56.5T160-720h640q33 0 56.5 23.5T880-640v320q0 33-23.5 56.5T800-240H160Zm0-80h640v-320H160v320Zm130-40h60v-90h90v-60h-90v-90h-60v90h-90v60h90v90Zm-130 40v-320 320Z"/></svg>',
  number:       '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M45 16a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3zm0 2H9a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1V19a1 1 0 0 0-1-1M35 28.444h7l-3.5 4zM35 26h7l-3.5-4z"/></svg>',
  datetime:     '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M37.908 13.418h-5.004v-2.354h-1.766v2.354H21.13v-2.354h-1.766v2.354H14.36a2.07 2.07 0 0 0-2.06 2.06v23.549a2.07 2.07 0 0 0 2.06 2.06h6.77v-1.766h-6.358a.707.707 0 0 1-.706-.706V15.89c0-.39.316-.707.706-.707h4.592v2.355h1.766v-2.355h10.008v2.355h1.766v-2.355h4.592a.71.71 0 0 1 .707.707v6.358h1.765v-6.77c0-1.133-.927-2.06-2.06-2.06"/></svg>',
  select:       '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M45 16a3 3 0 013 3v16a3 3 0 01-3 3H9a3 3 0 01-3-3V19a3 3 0 013-3h36zm0 2H9a1 1 0 00-1 1v16a1 1 0 001 1h36a1 1 0 001-1V19a1 1 0 00-1-1zm-12 7h9l-4.5 6-4.5-6z"/></svg>',
  radio:        '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M27 22c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5m0-5c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10m0 18a8 8 0 1 1 0-16 8 8 0 1 1 0 16"/></svg>',
  checkbox:     '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M34 18H20a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V20a2 2 0 0 0-2-2m-9 14-5-5 1.41-1.41L25 29.17l7.59-7.59L34 23z"/></svg>',
  html:         '<svg viewBox="0 0 24 24" fill="currentcolor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z"/></svg>',
  upload:       '<svg viewBox="0 0 54 54" fill="currentcolor"><path fill-rule="evenodd" d="M15 13a2 2 0 00-2 2v24a2 2 0 002 2h24a2 2 0 002-2V15a2 2 0 00-2-2H15zm24 2H15v12.45l4.71-4.709a1.91 1.91 0 012.702 0l6.695 6.695 2.656-1.77a1.91 1.91 0 012.411.239L39 32.73V15z"/></svg>',
  table:        '<svg viewBox="0 0 24 24" fill="currentcolor"><path d="M3 5h18v2H3V5m0 4h18v2H3V9m0 4h18v2H3v-2m0 4h18v2H3v-2Z"/></svg>',
};
function IconSpecCard({ type }) {
  const def = COMPONENT_ICONS[type];
  return (
    <div className="icon-spec-card">
      <div className="icon-spec-card__head">
        <span className="icon-spec-card__icon"><Sym name={def.sym} size={24} /></span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="icon-spec-card__title">{def.label}</span>
          <span className="icon-spec-card__symbol">{def.sym}</span>
        </div>
      </div>
      <div className="icon-spec-card__cmp">
        <span className="old" dangerouslySetInnerHTML={{ __html: OLD_SVGS[type] ? OLD_SVGS[type].replace('<svg ', '<svg width="18" height="18" ') : '<span>?</span>' }} />
        <span className="arrow"><Sym name="trending_flat" size={14} /></span>
        <span className="new"><Sym name={def.sym} size={18} /></span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'Roboto Mono, monospace', color: 'var(--md-sys-color-on-surface-variant)' }}>type: {type}</span>
      </div>
    </div>
  );
}
function ArtboardIconSpec() {
  const types = ['textfield','textarea','chip-string','chip-calendar','number','datetime','select','radio','checkbox','html','upload','table'];
  return (
    <div style={{ width: 1040, background: 'var(--md-sys-color-surface)', padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>Icon set · before → after</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 500 }}>Material Symbols Rounded · wght 300 · opsz 24</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 720 }}>
          One variable font replaces 12 hand-drawn SVGs in three different styles. <span className="mono" style={{ fontSize: 11 }}>fontVariationSettings</span> lets you tune weight / fill / optical-size per context (palette = 16px wght 300, attribute icon = 18px, status chip = 12px, etc.) without re-exporting.
        </p>
      </div>
      <div className="icon-spec-grid">
        {types.map((t) => <IconSpecCard key={t} type={t} />)}
      </div>
      <div style={{ marginTop: 8, padding: 16, borderRadius: 12, background: 'var(--md-sys-color-surface-container-low)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 6 }}>Toolbar (canvas item)</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['edit_off','content_copy','visibility_off','delete'].map(s => <span key={s} className="fb-icon-btn" style={{ pointerEvents:'none' }}><Sym name={s} size={16} /></span>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 6 }}>Header (canvas)</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['undo','redo','data_object','data_array','rule','play_arrow'].map(s => <span key={s} className="fb-icon-btn" style={{ pointerEvents:'none' }}><Sym name={s} size={16} /></span>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 6 }}>Attribute sections</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['info','visibility','verified','view_quilt','functions','rule'].map(s => <span key={s} className="fb-icon-btn" style={{ pointerEvents:'none' }}><Sym name={s} size={16} /></span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 8 — Tokens reference (1040 × 720)
// ────────────────────────────────────────────────────────────
function Swatch({ token, hex, varName }) {
  return (
    <div className="tokens-swatch">
      <div className="tokens-swatch__chip" style={{ background: `var(${varName})` }}></div>
      <div className="tokens-swatch__name">{token}</div>
      <div className="tokens-swatch__hex">{hex}</div>
    </div>
  );
}
function ArtboardTokens() {
  const surfaceSwatches = [
    ['surface', '#FBFAFC', '--md-sys-color-surface'],
    ['surface-container-low', '#F6F4F8', '--md-sys-color-surface-container-low'],
    ['surface-container', '#F1EEF3', '--md-sys-color-surface-container'],
    ['surface-container-high', '#EBE8EE', '--md-sys-color-surface-container-high'],
    ['outline-variant', '#D6D2DA', '--md-sys-color-outline-variant'],
    ['outline', '#79747E', '--md-sys-color-outline'],
  ];
  const accentSwatches = [
    ['primary', '#6750A4', '--md-sys-color-primary'],
    ['primary-container', '#EADDFF', '--md-sys-color-primary-container'],
    ['secondary-container', '#E8DEF8', '--md-sys-color-secondary-container'],
    ['error', '#B3261E', '--md-sys-color-error'],
    ['warning', '#8A5400', '--md-sys-color-warning'],
    ['success', '#1F6F43', '--md-sys-color-success'],
  ];
  return (
    <div style={{ width: 1040, background: 'var(--md-sys-color-surface)', padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>Design tokens</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 500 }}>M3 sys tokens · compact · brand = primary</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>Swap the 4 primary tokens to rebrand the entire builder.</p>
      </div>

      <div className="tokens-grid">
        <div>
          <div className="tokens-group__title">Surface · neutral</div>
          <div className="tokens-swatches">{surfaceSwatches.map(([t, h, v]) => <Swatch key={t} token={t} hex={h} varName={v} />)}</div>
        </div>
        <div>
          <div className="tokens-group__title">Accent · brand &amp; semantic</div>
          <div className="tokens-swatches">{accentSwatches.map(([t, h, v]) => <Swatch key={t} token={t} hex={h} varName={v} />)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className="tokens-group__title">Typescale</div>
            <div className="tokens-type">
              <div className="tokens-type__row"><span className="label">title-medium</span><span style={{ fontSize: 16, fontWeight: 500 }}>Customer onboarding</span></div>
              <div className="tokens-type__row"><span className="label">title-small</span><span style={{ fontSize: 14, fontWeight: 500 }}>Personal details</span></div>
              <div className="tokens-type__row"><span className="label">body-medium</span><span style={{ fontSize: 14 }}>jane@onemount.com</span></div>
              <div className="tokens-type__row"><span className="label">body-small</span><span style={{ fontSize: 12 }}>We'll only use this to send the receipt</span></div>
              <div className="tokens-type__row"><span className="label">label-medium</span><span style={{ fontSize: 12, fontWeight: 500 }}>Required</span></div>
              <div className="tokens-type__row"><span className="label">label-small</span><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Components</span></div>
              <div className="tokens-type__row"><span className="label">code · mono</span><span className="mono" style={{ fontSize: 11 }}>customerEmail · textfield</span></div>
            </div>
          </div>
          <div>
            <div className="tokens-group__title">Spacing · 4-base</div>
            <div className="tokens-spacing">
              {[4, 8, 12, 16, 24, 32, 48].map((s) => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div className="tokens-spacing__bar" style={{ width: s, height: s }}></div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="tokens-group__title" style={{ marginTop: 24 }}>Radius</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              {[['xs',4],['sm',8],['md',12],['lg',16],['xl',28]].map(([t, r]) => (
                <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: r, background: 'var(--md-sys-color-primary-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}></div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>{t} · {r}</span>
                </div>
              ))}
            </div>
            <div className="tokens-group__title" style={{ marginTop: 24 }}>Compact heights</div>
            <div style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-palette</span> 36px <span style={{ opacity:0.6 }}>· palette item</span></div>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-header</span> 36px <span style={{ opacity:0.6 }}>· panel header</span></div>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-field</span> 32px <span style={{ opacity:0.6 }}>· form field</span></div>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-row</span> 28px <span style={{ opacity:0.6 }}>· attribute control</span></div>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-section</span> 28px <span style={{ opacity:0.6 }}>· section title</span></div>
              <div><span className="mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>--h-action-btn</span> 24px <span style={{ opacity:0.6 }}>· toolbar icon</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 9 — Table component · column editor (1440 × 880)
// ────────────────────────────────────────────────────────────
const COL_TYPE_ICON = {
  string:   'text_fields',
  number:   '123',
  bool:     'check_box',
  date:     'event',
  datetime: 'calendar_month',
  radio:    'radio_button_checked',
  values:   'arrow_drop_down_circle',
  image:    'image',
  file:     'attach_file',
};
const COL_TYPE_LABEL = {
  string: 'String', number: 'Number', bool: 'Boolean', date: 'Date',
  datetime: 'Datetime', radio: 'Radio', values: 'Select', image: 'Image', file: 'File',
};
function ColumnRow({ col, active }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '16px 24px 1fr 18px',
      alignItems: 'center', gap: 8,
      padding: '6px 10px',
      borderRadius: 8,
      background: active ? 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)' : 'var(--md-sys-color-surface-container-lowest)',
      border: active ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
      marginBottom: 4,
    }}>
      <Sym name="drag_indicator" size={14} style={{ color: 'var(--md-sys-color-outline)' }} />
      <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sym name={COL_TYPE_ICON[col.type]} size={14} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{col.label}</span>
          {col.required && <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--md-sys-color-error)' }}>REQ</span>}
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>{col.key} · {COL_TYPE_LABEL[col.type]}</span>
      </div>
      <Sym name="more_vert" size={14} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
    </div>
  );
}
function ArtboardTableEditor() {
  const cols = [
    { key: 'item',     label: 'Item',     type: 'string',   required: true },
    { key: 'qty',      label: 'Quantity', type: 'number',   required: true },
    { key: 'unitPrice',label: 'Unit price',type: 'number',  required: true },
    { key: 'unit',     label: 'Unit',     type: 'values',   required: false },
    { key: 'deliverBy',label: 'Deliver by',type: 'date',    required: false },
    { key: 'inStock',  label: 'In stock', type: 'bool',     required: false },
    { key: 'attachment',label:'Attachment',type:'file',     required: false },
  ];
  const activeCol = cols[3];
  return (
    <div className="fb-shell" style={{ width: 1440, height: 880 }}>
      <Palette />
      <div className="fb-canvas">
        <CanvasHeader mode="design" />
        <div className="fb-canvas__body">
          <div className="fb-row">
            <div className="fb-row__drag"><Sym name="drag_indicator" size={14} /></div>
            <CanvasItem selected width="100%">
              <div className="faux-field">
                <div className="faux-field__label">Order line items <span className="req">*</span></div>
                <div className="faux-table">
                  <div className="faux-table__row header" style={{ gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.6fr 0.9fr 0.6fr 28px' }}>
                    {cols.map((c) => <div key={c.key} className="faux-table__cell" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Sym name={COL_TYPE_ICON[c.type]} size={12} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />{c.label}{c.required && <span className="req">*</span>}
                    </div>)}
                    <div className="faux-table__cell"></div>
                  </div>
                  {[
                    ['Macbook Air M3', '1', '$1,099', 'pcs', '12/06/2026', '✓', ''],
                    ['Magic Mouse',     '2', '$99',   'pcs', '12/06/2026', '✓', ''],
                    ['USB-C Hub',       '3', '$59',   'pcs', '20/06/2026', '—', ''],
                  ].map((r, i) => (
                    <div key={i} className="faux-table__row" style={{ gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.6fr 0.9fr 0.6fr 28px' }}>
                      {r.map((v, j) => <div key={j} className="faux-table__cell">{v}</div>)}
                      <div className="faux-table__cell" style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}><Sym name="delete" size={14} /></div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-sys-color-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  <Sym name="add" size={14} /> Add row
                </div>
              </div>
            </CanvasItem>
          </div>
        </div>
      </div>
      {/* Right: column editor */}
      <div className="fb-attrs" style={{ width: 360 }}>
        <div className="fb-panel-header">
          <span className="fb-panel-header__title">Attributes</span>
        </div>
        <div className="fb-attrs__selection">
          <span className="fb-attrs__sel-icon"><Sym name="table_rows" size={18} /></span>
          <div className="fb-attrs__sel-meta">
            <span className="fb-attrs__sel-name">Order line items</span>
            <span className="fb-attrs__sel-key mono">orderLines · table</span>
          </div>
        </div>
        <div className="fb-attrs__body">
          <Section title="General" icon="info" open>
            <AttrField label="Field key" value="orderLines" />
            <AttrField label="Label" value="Order line items" />
          </Section>
          <Section title="Columns" icon="view_column" open>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 4 }}>
              <span>{cols.length} columns</span>
              <button className="fb-icon-btn" title="Add column" style={{ width: 22, height: 22 }}>
                <Sym name="add" size={14} />
              </button>
            </div>
            {cols.map((c) => <ColumnRow key={c.key} col={c} active={c.key === activeCol.key} />)}

            {/* Inline editor for selected column */}
            <div style={{
              marginTop: 8,
              borderRadius: 12,
              padding: 12,
              background: 'var(--md-sys-color-surface-container)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sym name={COL_TYPE_ICON[activeCol.type]} size={14} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Editing · {activeCol.label}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>{activeCol.key}</span>
                </div>
                <button className="fb-icon-btn danger" style={{ marginLeft: 'auto', width: 22, height: 22 }}><Sym name="delete" size={14} /></button>
              </div>

              <AttrField label="Column key" value="unit" />
              <AttrField label="Column header" value="Unit" />
              <div className="fb-field">
                <div className="fb-field__label">Type</div>
                <div className="fb-field__input" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Sym name={COL_TYPE_ICON.values} size={14} />Select (values)
                  </span>
                  <Sym name="arrow_drop_down" size={16} />
                </div>
              </div>
              <AttrField label="Source key" value="unitOptions" />
              <AttrRow label="Required" control={<Switch on={false} />} />
              <AttrRow label="Sortable" control={<Switch on />} />
              <AttrRow label="Filterable" control={<Switch on />} />
              <AttrField label="Width" value="0.6fr" />
            </div>
          </Section>
          <Section title="Display" icon="visibility" open={false} />
          <Section title="Validation" icon="verified" open={false} />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Artboard 10 — Group component · drag children into it (1440 × 880)
// ────────────────────────────────────────────────────────────
function GroupSection({ title, icon, color, hidden, hovered, children, conditional, dropHint }) {
  // M3-ish "outlined card" with color-tinted header
  const tint = color || 'primary';
  const tintMap = {
    primary:   ['var(--md-sys-color-primary)', 'var(--md-sys-color-primary-container)'],
    success:   ['var(--md-sys-color-success)', 'var(--md-sys-color-success-container)'],
    warning:   ['var(--md-sys-color-warning)', 'var(--md-sys-color-warning-container)'],
    error:     ['var(--md-sys-color-error)',   'var(--md-sys-color-error-container)'],
    secondary: ['var(--md-sys-color-on-secondary-container)', 'var(--md-sys-color-secondary-container)'],
  };
  const [fg, bg] = tintMap[tint] || tintMap.primary;
  return (
    <div className="fb-row" style={{ outlineColor: hovered ? 'var(--md-sys-color-outline-variant)' : 'transparent' }}>
      <div className="fb-row__drag" style={{ opacity: hovered ? 1 : 0 }}><Sym name="drag_indicator" size={14} /></div>
      <div className="fb-item is-selected" style={{
        borderRadius: 14,
        padding: 0,
        background: 'var(--md-sys-color-surface-container-lowest)',
        opacity: hidden ? 0.55 : 1,
        width: '100%',
      }}>
        <ItemActions hidden={hidden} />
        {/* Group header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: bg,
          color: fg,
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid color-mix(in srgb, ' + fg + ' 20%, transparent)',
          position: 'relative', zIndex: 2,
        }}>
          <Sym name={icon} size={18} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
          {conditional && (
            <span className="mono" style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 999,
              background: 'color-mix(in srgb, ' + fg + ' 15%, transparent)',
              border: '1px solid color-mix(in srgb, ' + fg + ' 30%, transparent)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Sym name="bolt" size={11} />visible when <span style={{ marginLeft: 2 }}>{conditional}</span>
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.75 }}>{React.Children.count(children)} fields</span>
        </div>
        {/* Group body — drop target */}
        <div style={{
          padding: 12,
          display: 'flex', flexDirection: 'column', gap: 6,
          borderRadius: '0 0 12px 12px',
          background: 'var(--md-sys-color-surface-container-lowest)',
          position: 'relative',
          minHeight: 56,
        }}>
          {children}
          {dropHint && (
            <div className="fb-drop-hint">
              <Sym name="south" size={14} />Drop a field here to add it to <strong style={{ marginLeft: 4 }}>{title}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function GroupChild({ children, status }) {
  return (
    <div style={{
      position: 'relative',
      padding: 8,
      borderRadius: 8,
      border: '1.5px dashed transparent',
    }}>
      {status}
      {children}
    </div>
  );
}
function ArtboardGroupComponent() {
  return (
    <div className="fb-shell" style={{ width: 1440, height: 880 }}>
      <Palette hoverType="textfield" />
      <div className="fb-canvas">
        <CanvasHeader mode="design" />
        <div className="fb-canvas__body">

          {/* Group 1 — Personal info (primary) */}
          <GroupSection title="Personal information" icon="badge" color="primary">
            <GroupChild>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FauxTextField label="First name" required value="Jane" />
                <FauxTextField label="Last name" required value="Doe" />
              </div>
            </GroupChild>
            <GroupChild>
              <FauxTextField label="Customer email" required value="jane@onemount.com" />
            </GroupChild>
          </GroupSection>

          {/* Group 2 — Billing (secondary) with active drop hint */}
          <GroupSection title="Billing address" icon="home" color="secondary" dropHint>
            <GroupChild>
              <FauxSelect label="Country" required value="Vietnam" />
            </GroupChild>
            <GroupChild>
              <FauxTextField label="Street address" required value="72 Trần Hưng Đạo, Q.1" />
            </GroupChild>
          </GroupSection>

          {/* Group 3 — Pro perks (warning, conditional) */}
          <GroupSection title="Pro perks" icon="workspace_premium" color="warning" conditional="plan = &quot;pro&quot;">
            <GroupChild>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FauxTextField label="Tax ID" value="0301234567" />
                <FauxTextField label="Company" value="OneMount" />
              </div>
            </GroupChild>
          </GroupSection>

          {/* Group 4 — Hidden / admin only */}
          <GroupSection title="Admin only" icon="admin_panel_settings" color="secondary" hidden>
            <GroupChild>
              <FauxTextArea label="Internal notes" value="Renewal at risk — flagged by support" />
            </GroupChild>
          </GroupSection>

        </div>
      </div>

      {/* Right: Group attributes */}
      <div className="fb-attrs" style={{ width: 320 }}>
        <div className="fb-panel-header">
          <span className="fb-panel-header__title">Attributes</span>
        </div>
        <div className="fb-attrs__selection">
          <span className="fb-attrs__sel-icon" style={{ background: 'var(--md-sys-color-warning-container)', color: 'var(--md-sys-color-warning)' }}>
            <Sym name="workspace_premium" size={18} />
          </span>
          <div className="fb-attrs__sel-meta">
            <span className="fb-attrs__sel-name">Pro perks</span>
            <span className="fb-attrs__sel-key mono">group · 2 children</span>
          </div>
        </div>
        <div className="fb-attrs__body">
          <Section title="General" icon="info" open>
            <AttrField label="Label" value="Pro perks" />

            {/* Icon picker */}
            <div className="fb-field">
              <div className="fb-field__label">Icon</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="fb-field__input" style={{ flex: 1, justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Sym name="workspace_premium" size={16} /> workspace_premium
                  </span>
                  <Sym name="arrow_drop_down" size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {['workspace_premium', 'badge', 'home', 'inventory_2', 'paid', 'admin_panel_settings'].map((s, i) => (
                  <span key={s} className="fb-icon-btn" style={{ width: 26, height: 26, background: i === 0 ? 'var(--md-sys-color-primary-container)' : 'transparent', color: i === 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>
                    <Sym name={s} size={16} />
                  </span>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="fb-field">
              <div className="fb-field__label">Accent color</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  ['primary', 'var(--md-sys-color-primary)'],
                  ['secondary', 'var(--md-sys-color-secondary)'],
                  ['success', 'var(--md-sys-color-success)'],
                  ['warning', 'var(--md-sys-color-warning)'],
                  ['error', 'var(--md-sys-color-error)'],
                ].map(([name, c], i) => (
                  <span key={name} style={{
                    width: 26, height: 26, borderRadius: 999,
                    background: c,
                    border: i === 3 ? '2px solid var(--md-sys-color-on-surface)' : '2px solid transparent',
                    boxShadow: '0 0 0 1px var(--md-sys-color-outline-variant) inset',
                    cursor: 'pointer',
                  }} title={name}></span>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Children" icon="account_tree" open>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { sym: 'text_fields', label: 'Tax ID',  key: 'taxId' },
                { sym: 'text_fields', label: 'Company', key: 'company' },
              ].map((c) => (
                <div key={c.key} style={{
                  display: 'grid', gridTemplateColumns: '16px 22px 1fr 18px',
                  gap: 8, alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'var(--md-sys-color-surface-container-lowest)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                }}>
                  <Sym name="drag_indicator" size={14} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sym name={c.sym} size={12} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 12 }}>{c.label}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--md-sys-color-on-surface-variant)' }}>{c.key}</span>
                  </div>
                  <Sym name="more_vert" size={14} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-sys-color-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '4px 8px' }}>
                <Sym name="add" size={14} /> Add field
              </div>
            </div>
          </Section>

          <Section title="Display" icon="visibility" open>
            <div className="fb-field">
              <div className="fb-field__label">Visible when</div>
              <ExprInput tokens={[
                { text: 'plan', type: 'var' },
                { text: ' = ', type: 'op' },
                { text: '"pro"', type: 'lit' },
              ]} />
            </div>
            <div className="fb-field">
              <div className="fb-field__label">Hidden when</div>
              <ExprInput placeholder="Add expression" />
            </div>
          </Section>

          <Section title="Layout" icon="view_quilt" open={false} />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Root — the design canvas wiring it all together
// ────────────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas>
      <DCSection id="layout" title="Layout" subtitle="Three-panel shell · M3 expressive · compact density">
        <DCArtboard id="overall" label="A · Builder · authoring" width={1440} height={880}>
          <ArtboardOverall />
        </DCArtboard>
        <DCArtboard id="empty" label="B · Empty state" width={1200} height={720}>
          <ArtboardEmptyState />
        </DCArtboard>
        <DCArtboard id="preview" label="C · Preview mode" width={1280} height={720}>
          <ArtboardPreview />
        </DCArtboard>
      </DCSection>

      <DCSection id="components" title="Components &amp; states" subtitle="Palette · canvas item states · attribute panel">
        <DCArtboard id="palette" label="Palette · vertical list with categories" width={280} height={720}>
          <ArtboardPaletteDetail />
        </DCArtboard>
        <DCArtboard id="states" label="Canvas item states · default → resize" width={920} height={1900}>
          <ArtboardItemStates />
        </DCArtboard>
        <DCArtboard id="attrs" label="Attribute panel · Text field selected" width={360} height={880}>
          <ArtboardAttrPanel />
        </DCArtboard>
      </DCSection>

      <DCSection id="composite" title="Composite components" subtitle="Table column editor &amp; nested Group container">
        <DCArtboard id="table" label="Table · column editor + inline column form" width={1440} height={880}>
          <ArtboardTableEditor />
        </DCArtboard>
        <DCArtboard id="group" label="Group · 4 nested containers, color tints, drop hint, conditional" width={1440} height={880}>
          <ArtboardGroupComponent />
        </DCArtboard>
      </DCSection>

      <DCSection id="system" title="System" subtitle="Icon mapping &amp; design tokens">
        <DCArtboard id="icons" label="Icon set · 12 field types · before → after" width={1040} height={920}>
          <ArtboardIconSpec />
        </DCArtboard>
        <DCArtboard id="tokens" label="Tokens · colors · type · spacing · radius" width={1040} height={780}>
          <ArtboardTokens />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

�# `<sd-section>` & `<sd-section-item>`

**Type**: Component (two related components, documented together � they are typically used as a pair)
**Selectors**: `sd-section`, `sd-section-item`
**Import path**: `@sdcorejs/angular/components/section` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdSection extends SdBaseSecureComponent`, `SdSectionItem`
**Standalone**: yes
**Change detection**: default (signals-driven)

---

## `<sd-section>`

### One-line purpose
Card-style content panel with a header (icon + title + sub-title), optional collapse toggle, and a slot-based body � the standard wrapper for grouping fields, tables, or any sub-section on detail / form pages.

### When to use
- Any "block" of related content on a detail page (`Thông tin chung`, `Thông tin liên h�!`, `L�9ch sử`, ...)
- Collapsible groups in long forms so users can hide what they don't need
- Cards with a header right-side action button (e.g. "Edit", "Add", "Filter")
- Wrapping a `<sd-table>` so the table sits inside a card with a title
- Grouping multiple `<sd-section-item>` rows into a labeled panel

### When NOT to use
- When you need a slide-out panel �  use `<sd-side-drawer>`
- When you need a modal / dialog �  use `<sd-modal>`
- For a single `label : value` row �  use `<sd-section-item>` directly
- For a hint + action row �  use `<sd-quick-action>`
- When you need tabs �  use `<sd-tab-router>`

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string \| null \| undefined` | `undefined` | Header title. When set, the native `title` attribute is removed from the host (avoids duplicate browser tooltip). |
| `subTitle` | `string \| null \| undefined` | `undefined` | Smaller second-line text under the title (`T12R text-secondary`). |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name shown left of the title (only renders when no `[sdHeaderLeft]` slot content overrides it). |
| `iconColor` | `Color` (`'primary' \| 'secondary' \| 'error' \| 'warning' \| 'success' \| ...`) | `'primary'` | Icon color token. Maps to `text-primary` / `text-secondary` / `text-error` / `text-warning` / `text-success` classes. |
| `collapsed` | `boolean` (model � two-way) | `false` | Two-way bindable via `[(collapsed)]`. When true and `collapsable` is true, hides the body. |
| `collapsable` | `boolean` | `false` | Bare attribute = true. Enables the click-to-collapse behavior on the header and shows the chevron icon (`expand_more` / `expand_less`). |
| `hideHeader` | `boolean` | `false` | Bare attribute = true. Hides the entire header row; body renders without a top border. |
| `noPaddingBody` | `boolean` | `false` | Bare attribute = true. Removes the default `p-16` padding from the body (use when embedding a full-width table). |

> **Coerce note**: `collapsable`, `hideHeader`, `noPaddingBody` use `booleanAttribute` transform.

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `collapsedChange` | `boolean` | Emitted by the `collapsed` signal model whenever the user toggles via clicking the header. |

### Public API
| Method | Signature | Notes |
| --- | --- | --- |
| `toggleCollapse()` | `() => void` | Flips `collapsed` if `collapsable()` is true. If `collapsable` is false but the section is collapsed, forces it back to `false`. Safe to call programmatically (e.g. from a toolbar button or keyboard shortcut). |

### Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdHeaderLeft]` | Override the default title block (icon + title + subTitle). Use for richer headers (e.g. avatar + name). |
| `[sdHeaderRight]` | Right-side header content � typically `<sd-button>`s ("Edit", "Add", filter chips). Sits left of the chevron when collapsable. |
| (default) | The body content. Wrapped in a div with `p-16` padding (unless `noPaddingBody`) and a 1px top border (unless `hideHeader`). |

### Visual cues (helps agent map screenshots �  component)
- A white rounded card (`rounded-8 bg-white`) with a soft shadow (`c-shadow-section`, only when expanded)
- Header row: 16px horizontal / 8px vertical padding, flex row with title block on the left, action area on the right
- Title: 16px medium (`T16M`); sub-title (if set): 12px regular gray (`T12R text-secondary`)
- Icon: a Material outlined icon (`material-icons-outlined`), 8px right margin, color from `iconColor`
- Chevron: when `collapsable`, a Material `expand_more` (collapsed) / `expand_less` (expanded) icon at the far right
- Body: 1px top border (`#e6e6e6`) separating header from content, 16px padding by default
- Collapsed state: shadow disappears (so collapsed sections feel "thinner") and body is removed from DOM
- Header is `cursor: pointer` only when `collapsable` is true (still clickable structurally either way, but click toggles only when allowed)

### Behaviors / quirks
- Clicking the header calls `toggleCollapse()` � but only flips `collapsed` if `collapsable()` is true (otherwise it forces `collapsed` to `false`)
- When `hideHeader` is true, the body is always rendered regardless of `collapsed` (header click is impossible)
- Custom `[sdHeaderLeft]` slot completely replaces the default icon + title block

### Examples

#### 1. Standard collapsible info section
```html
<sd-section
  icon="info"
  iconColor="primary"
  title="Thông tin chung"
  subTitle="Thông tin cơ bản của nhân viên"
  [collapsable]="true">
  <sd-section-item label="Họ và tên">Nguy�&n VĒn A</sd-section-item>
  <sd-section-item label="Email">a.nv@onemount.com</sd-section-item>
  <sd-section-item label="Phòng ban">Sales</sd-section-item>
</sd-section>
```

#### 2. Section with right-side action
```html
<sd-section icon="group" title="Thành viên dự án">
  <sd-button sdHeaderRight
    type="fill" color="primary" size="sm" prefixIcon="add"
    title="Thêm thành viên" (click)="onAddMember()">
  </sd-button>
  <sd-table [data]="members" [columns]="memberCols"></sd-table>
</sd-section>
```

#### 3. Section wrapping a table � full width, no padding
```html
<sd-section title="L�9ch sử thao tác" [noPaddingBody]="true">
  <sd-table [data]="history" [columns]="historyCols"></sd-table>
</sd-section>
```

#### 4. Headerless section as a plain padded card
```html
<sd-section [hideHeader]="true">
  <p>N�"i dung tự do, không có header. Card vẫn có padding 16px và bo góc.</p>
</sd-section>
```

#### 5. Two-way bound collapsed state (controlled from parent)
```html
<sd-section
  title="Lọc nâng cao"
  [collapsable]="true"
  [(collapsed)]="advancedFilterCollapsed">
  <sd-query-builder [group]="filter"></sd-query-builder>
</sd-section>
```

### Anti-patterns
- �R Nesting `<sd-section>` inside `<sd-section>` � visually heavy; prefer flat structure with multiple sibling sections
- �R Setting `collapsed="true"` without `collapsable="true"` � the section will be expanded and never collapsible (the toggle silently re-opens it)
- �R Adding margin to the host instead of letting the page layout handle spacing � sections are designed to stack with parent `gap-*`
- �R Placing `<sd-section-item>` outside `<sd-section>` � it works but looks orphaned; design intent is grouped rows
- �R Using as a modal substitute � modals need backdrop, focus-trap, escape; use `<sd-modal>`

---

## `<sd-section-item>`

### One-line purpose
A single `label : value` row meant to live inside a `<sd-section>` body � used for compact info display on detail pages.

### When to use
- Read-only `label : value` display rows inside a `<sd-section>` (employee detail, contract info, etc.)
- Any two-column info layout where labels share a consistent fixed width
- Rows whose value side can contain rich content: chips, anchors, badges, formatted text

### When NOT to use
- For editable inputs � use a labeled `<sd-input>`, `<sd-select>`, etc. directly inside the section
- For message + action rows �  use `<sd-quick-action>`
- As a standalone row outside any `<sd-section>` � it works, but it looks orphaned without the card wrapper

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` (REQUIRED, signal input) | � | The left-column label text. Rendered with `T14R text-black400` typography. |
| `labelWidth` | `string` | `'150px'` | Fixed width of the label column. Falsy values (`null`, `undefined`, `''`) coerce back to `'150px'`. |

> **Coerce note**: `labelWidth` transform: `(val) => val || '150px'` � any falsy value resets to the default.

### Outputs
None.

### Public API
None.

### Content projection
| Slot selector | Purpose |
| --- | --- |
| (default) | The value side. Renders inside a `flex: 1` div so it expands to fill the remaining row width. Accepts plain text, inline elements, badges, anchors, or any Angular component. |

### Visual cues (helps agent map screenshots �  component)
- Single horizontal row (`c-item`), label on the left at `labelWidth` wide, value on the right
- Label typography: `T14R text-black400` � 14px regular, muted 400-tone gray
- Value area: `flex: 1`, inherits parent typography; no padding imposed � value content controls its own spacing
- No border between items � spacing between rows comes from the parent container (`<sd-section>` body)

### Behaviors / quirks
- `label` is a required signal input � Angular will throw `NG0950` at runtime if omitted
- `labelWidth` coerces falsy values (`null`, `undefined`, empty string) back to `'150px'` automatically
- The component has no collapse, loading, disabled, or selection state � it is purely presentational

### Examples
```html
<sd-section title="Thông tin liên h�!">
  <sd-section-item label="Email">a.nv@onemount.com</sd-section-item>
  <sd-section-item label="S� �i�!n thoại">0901 234 567</sd-section-item>
  <sd-section-item label="Phòng ban" labelWidth="200px">
    <sd-badge title="Sales" color="primary"></sd-badge>
  </sd-section-item>
</sd-section>
```

### Anti-patterns
- �R Forgetting `label` � it is required and Angular will throw at runtime
- �R Mixing `<sd-section-item>`s with very different `labelWidth`s in the same section � labels won't visually align
- �R Using for editable form rows � section-item is a read-only display pattern; for forms use a labeled `<sd-input>` directly
- �R Passing a reactive expression as `label` without using `[label]` binding syntax � `label` is a signal input, not a plain attribute

---

## Related
- `<sd-quick-action>` � single message + action row (different pattern; sits inside section bodies)
- `<sd-modal>`, `<sd-side-drawer>` � when you need an overlay instead of an inline card
- `<sd-tab-router>` � when sections should be split across tabs


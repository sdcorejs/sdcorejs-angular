# `<sd-tab-group>` & `<sd-tab>`

**Type**: Component (two related components, documented together â€” used as a pair)
**Selectors**: `sd-tab-group`, `sd-tab`
**Import path**: `@sdcorejs/angular/components/tab`
**Classes**: `SdTabGroup extends SdBaseSecureComponent`, `SdTab`
**Standalone**: yes
**Change detection**: `OnPush` on both

---

## `<sd-tab-group>`

### One-line purpose
Declarative tab container that wraps Angular Material's `mat-tab-group` with a signals-first API. Renders projected `<sd-tab>` children as `<mat-tab>` entries with icon + badge + closable + lazy-load support.

### When to use
- Switch between several views within the same route (no URL change)
- Group a long detail page into sections that don't all need to be visible at once
- Editor-like surfaces where the user opens / closes tabs (use `[closable]`)
- Any place where you'd reach for `<mat-tab-group>` but want a consistent `sd-*` API

### When NOT to use
- Tabs that should change the URL â€” use `<sd-tab-router>` instead (each tab is a route)
- Wizard / stepper flows â€” use a stepper component
- A small number of mutually exclusive options on a form â€” use `<sd-radio>` or a segmented control
- Vertical-rail navigation (sidebar of links) â€” use `<sd-anchor>` or a custom sidebar layout

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selectedIndex` | `number` (model â€” two-way) | `0` | Index of the active tab. Two-way bindable via `[(selectedIndex)]`. Auto-clamped to `[0, tabs.length-1]` when the tab count shrinks. |
| `variant` | `'line' \| 'pills' \| 'segmented'` | `'line'` | Visual skin. `'line'` is Material's default underline ink-bar. `'pills'` renders each tab as a rounded pill with a filled active state (no underline) â€” useful for nested tab groups and filter bars where the default underline competes with the parent's. `'segmented'` renders a single bordered container with flush tabs (iOS segmented-control style). |
| `color` | `SdColor` (`'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`) | `'primary'` | Drives the active-tab + indicator + badge colors via the Core CSS vars (`--sd-<color>`, `--sd-<color>-light`). Same palette as `<sd-button>`, `<sd-badge>` â€” pick `'warning'` for filter bars surfacing pending items, `'success'` for confirmed flows, etc. |
| `headerPosition` | `'above' \| 'below'` | `'above'` | Forwarded to `mat-tab-group.headerPosition`. |
| `alignTabs` | `'start' \| 'center' \| 'end'` | `'start'` | Forwarded to `mat-tab-group`'s `[mat-align-tabs]` input. **Only takes effect when `stretchTabs` is `false`** â€” otherwise tabs fill the row evenly and there's nothing to align. |
| `stretchTabs` | `boolean` | `true` | `booleanAttribute` transform. Forwarded to `mat-tab-group.stretchTabs`. When `true` (default, Material default behavior), labels fill the available width evenly. Set to `false` to make labels size to their content; pair with `alignTabs` to push them to the left, center, or right. |
| `animationDuration` | `string` | `'500ms'` | Forwarded to `mat-tab-group.animationDuration` (CSS time, e.g. `'200ms'`, `'0ms'`). |
| `disableRipple` | `boolean` | `false` | `booleanAttribute` transform. Forwarded to `mat-tab-group.disableRipple`. |
| `dynamicHeight` | `boolean` | `false` | `booleanAttribute` transform. Forwarded to `mat-tab-group.dynamicHeight`. |
| `autoId` | `string \| undefined` | `undefined` | Emitted as `data-autoId` on the host element for e2e selectors. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `selectedIndexChange` | `number` | Emitted by the `selectedIndex` model when the active tab changes (programmatic or user). |
| `tabClosed` | `SdTabClosedEvent` (`{ index: number; tab: SdTab }`) | Emitted when the user clicks the close icon on a `[closable]` tab. Parent is responsible for removing the tab from its data source. |

### Public API
| Method | Signature | Notes |
| --- | --- | --- |
| `selectTab(index: number)` | `(number) => void` | Programmatically activate a tab. Clamps `index` to `[0, tabs.length-1]`; safe to call with out-of-range values. |
| `realignInkBar()` | `() => void` | Forwards to `mat-tab-group.realignInkBar()`. Call when the container size changes externally (e.g. after a layout swap) and the indicator drifts. |

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | One or more `<sd-tab>` children. The group discovers them via a `contentChildren` signal and re-renders if the list changes. |

### Visual cues
- Material's standard tab bar (underline indicator on the active tab) with a primary-themed indicator color overridden via CSS vars
- Tabs render label + optional leading icon + optional trailing badge + optional trailing close icon, inline-flex aligned with `gap: 4px`
- Badge: small rounded pill (`min-width: 18px`, height `18px`, font-size `11px`) with primary-light background
- Close icon: 16px Material `close` icon, 60% opacity â†’ 100% on hover, hover color from `--sd-tab-close-hover-color`

### Behaviors / quirks
- **Lazy content**: each tab body uses `matTabContent` + `ngTemplateOutlet` against a `viewChild` template ref on the child `<sd-tab>`. Body DOM is created only when that tab is first activated.
- **Closable tab is parent-driven**: clicking the close icon emits `(tabClosed)` and the child `<sd-tab>`'s `(close)`. The component does NOT remove the tab from the DOM. The parent must splice its data source.
- **Bounds clamping**: when the parent removes the active tab, an internal effect clamps `selectedIndex` to the last valid index so MatTabGroup doesn't render with a stale selection.
- **`badge=0` renders**: zero is treated as a meaningful value. Pass `null` / `undefined` to hide the badge.
- **Close click doesn't select**: the close icon calls `stopPropagation()`, so clicking X on a non-active tab does NOT switch to that tab.
- **Close on disabled is no-op**: the close handler short-circuits when the tab is `[disabled]`.

### Examples

#### 1. Basic text-only tabs
```html
<sd-tab-group [(selectedIndex)]="activeIdx">
  <sd-tab label="ThÃ´ng tin">
    <p>Form fields here</p>
  </sd-tab>
  <sd-tab label="Lá»‹ch sá»­">
    <sd-table [data]="auditRows" [columns]="auditCols"></sd-table>
  </sd-tab>
  <sd-tab label="Quyá»n truy cáº­p">
    <p>Permission settings</p>
  </sd-tab>
</sd-tab-group>
```

#### 2. Icon + badge + disabled
```html
<sd-tab-group>
  <sd-tab label="Há»“ sÆ¡" icon="person">
    â€¦
  </sd-tab>
  <sd-tab label="ThÃ´ng bÃ¡o" icon="notifications" [badge]="unreadCount()">
    â€¦
  </sd-tab>
  <sd-tab label="Äang khoÃ¡" icon="lock" [disabled]="true">
    â€¦
  </sd-tab>
</sd-tab-group>
```

#### 3. Closable tabs (parent removes from array)
```ts
@Component({
  selector: 'editor-tabs',
  standalone: true,
  imports: [SdTabGroup, SdTab],
  template: `
    <sd-tab-group (tabClosed)="onClose($event)">
      @for (file of files(); track file.id) {
        <sd-tab [label]="file.name" [closable]="true">
          <code-editor [file]="file"></code-editor>
        </sd-tab>
      }
    </sd-tab-group>
  `,
})
export class EditorTabs {
  files = signal<File[]>([â€¦]);

  onClose(ev: SdTabClosedEvent) {
    this.files.update(arr => arr.filter((_, i) => i !== ev.index));
  }
}
```

#### 4. Lazy content (heavy child only mounts when active)
```html
<sd-tab-group>
  <sd-tab label="Tá»•ng quan">
    <overview-panel></overview-panel>
  </sd-tab>
  <sd-tab label="Biá»ƒu Ä‘á»“">
    <!-- chart-panel runs ngOnInit only when this tab is first opened -->
    <chart-panel></chart-panel>
  </sd-tab>
</sd-tab-group>
```

#### 5. Two-way `[(selectedIndex)]` with external buttons
```html
<button (click)="idx.set(idx() - 1)">Prev</button>
<button (click)="idx.set(idx() + 1)">Next</button>
<span>Äang xem tab #{{ idx() }}</span>

<sd-tab-group [(selectedIndex)]="idxValue">
  <sd-tab label="A">â€¦</sd-tab>
  <sd-tab label="B">â€¦</sd-tab>
  <sd-tab label="C">â€¦</sd-tab>
</sd-tab-group>
```

```ts
idx = signal(0);
get idxValue() { return this.idx(); }
set idxValue(v: number) { this.idx.set(v); }
```

#### 6. Layout knobs â€” header below, centered, no animation
```html
<sd-tab-group
  headerPosition="below"
  alignTabs="center"
  animationDuration="0ms">
  <sd-tab label="A">â€¦</sd-tab>
  <sd-tab label="B">â€¦</sd-tab>
</sd-tab-group>
```

### Anti-patterns
- âŒ Using `<sd-tab-group>` for navigation that should change the URL â€” that's `<sd-tab-router>`
- âŒ Forgetting `track` on a dynamic `@for` over tabs â€” `contentChildren` will churn when the array reference changes between renders
- âŒ Expecting `(tabClosed)` to remove the tab automatically â€” it doesn't; the parent must update its data
- âŒ Passing `0` as `[badge]` thinking it will hide â€” it renders "0"; pass `null` to hide
- âŒ Heavy DOM in every tab without relying on lazy-load â€” `matTabContent` already lazy-loads via this component; don't pre-render via `[hidden]` tricks

---

## `<sd-tab>`

### One-line purpose
A child of `<sd-tab-group>` that declares one tab â€” its label, icon, badge, disabled / closable state, and projected body. The body is captured into a `viewChild` template ref so `<sd-tab-group>` can render it lazily inside `matTabContent`.

### When to use
- Always inside `<sd-tab-group>`. Has no standalone visual output.

### When NOT to use
- Outside `<sd-tab-group>` â€” the component renders no UI on its own; placing it elsewhere is a no-op
- For navigation (route-driven) â€” use `<sd-tab-router-item>` if that fits the router pattern

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` (REQUIRED, signal input) | â€” | Tab label text. Caller is responsible for i18n â€” pass `i18n.t('core.tab.info')` directly. |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name shown left of the label. |
| `badge` | `string \| number \| null \| undefined` | `undefined` | Badge text shown right of the label. `0` renders (treated as meaningful); `null` / `undefined` hides. |
| `disabled` | `boolean` | `false` | `booleanAttribute` transform. Disables the tab â€” `mat-mdc-tab-disabled` class + `aria-disabled="true"`, no click / keyboard activation. |
| `closable` | `boolean` | `false` | `booleanAttribute` transform. Renders a close icon next to the label. Click emits `(close)` on the tab and `(tabClosed)` on the group. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `close` | `void` | Emitted when the user clicks the close icon on this tab. Only emitted while the tab is not disabled. |

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | The tab body. Captured into a `viewChild('body')` `TemplateRef` and rendered lazily by the parent `<sd-tab-group>`. |

### Behaviors / quirks
- The component's own template is just `<ng-template #body><ng-content></ng-content></ng-template>` â€” the host element renders nothing.
- `label` is a required signal input â€” reading `label()` without a value throws at runtime.
- `disabled` / `closable` accept the standard Angular `booleanAttribute` coerce: bare attribute, `"true"`, `"false"`, empty string, real boolean.

### Anti-patterns
- âŒ Omitting `[label]` â€” required input, throws on first read
- âŒ Trying to add behavior on the `<sd-tab>` host element (click handlers, classes) â€” it renders nothing; put DOM in the projected body instead
- âŒ Using `<sd-tab>` outside `<sd-tab-group>` â€” it works structurally but produces no UI

---

## Related
- `<sd-tab-router>` â€” route-driven tabs (each tab is an Angular route)
- `<sd-section>` â€” when you need a single bordered card, not switchable views
- `<sd-anchor>` â€” when you need a vertical jump-to-section nav instead of horizontal tabs


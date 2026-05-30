# `<sd-stepper>` & `<sd-step>`

**Type**: Component (two related components, documented together â€” used as a pair)
**Selectors**: `sd-stepper`, `sd-step`
**Import path**: `@sdcorejs/angular/components/stepper`
**Classes**: `SdStepper extends SdBaseSecureComponent`, `SdStep`
**Standalone**: yes
**Change detection**: `OnPush` on both

---

## `<sd-stepper>`

### One-line purpose
Declarative wizard / stepper container wrapping Angular Material's `mat-stepper`. Drives sequential or non-linear progress through steps, with optional `FormGroup` gating per step, horizontal / vertical orientation, error state override, and the Core color palette.

### When to use
- Multi-step forms where each step has its own `FormGroup` and must validate before advancing (linear mode)
- Onboarding flows, KYC, contract signing, payment wizards
- Long forms split into digestible sections (vertical orientation)
- Any sequential UX where users see "where they are" relative to a known endpoint

### When NOT to use
- Parallel views that can be switched in any order â€” use `<sd-tab-group>` instead
- Route-driven sequence where each step is its own URL â€” use `<sd-tab-router>` with linear navigation logic in the parent
- Pure progress display (no editing) â€” a plain progress bar / breadcrumb is lighter

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selectedIndex` | `number` (model â€” two-way) | `0` | Index of the active step. Two-way bindable via `[(selectedIndex)]`. Auto-clamped to `[0, steps.length-1]` when the step count shrinks. |
| `linear` | `boolean` | `false` | `booleanAttribute` transform. When `true`, the user can only advance past a step if that step's `stepControl` (a `FormGroup` or `FormControl`) reports `valid`. Forwarded to `mat-stepper.linear`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Forwarded to `mat-stepper.orientation`. Horizontal renders step headers in a row; vertical stacks them with a connector line on the left. |
| `labelPosition` | `'end' \| 'bottom'` | `'end'` | Only meaningful for horizontal orientation. `'end'` puts the label to the right of the indicator; `'bottom'` puts it under the indicator. |
| `headerPosition` | `'top' \| 'bottom'` | `'top'` | Only meaningful for horizontal orientation. `'top'` (default) shows headers above the content, `'bottom'` flips it. |
| `animationDuration` | `string` | `'500ms'` | CSS time string forwarded to `mat-stepper.animationDuration`. Pass `'0ms'` to disable animation. |
| `disableRipple` | `boolean` | `false` | `booleanAttribute` transform. Disables the ripple on step header click. |
| `color` | `SdColor` (`'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`) | `'primary'` | Drives the active indicator, completed indicator, and active connector color via the Core CSS vars (`--sd-<color>`). Same palette as `<sd-tab-group>` and `<sd-badge>`. |
| `autoId` | `string \| undefined` | `undefined` | Emitted as `data-autoId` on the host element for e2e selectors. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `selectionChange` | `StepperSelectionEvent` (from `@angular/cdk/stepper`) | Emitted whenever the active step changes. Payload: `{ selectedIndex, previouslySelectedIndex, selectedStep, previouslySelectedStep }`. Use to react to a step entering (eg fetch data lazily). |

### Public API
| Method | Signature | Notes |
| --- | --- | --- |
| `next()` | `() => void` | Move to the next step. In linear mode, no-op if current step's `stepControl` is invalid. |
| `previous()` | `() => void` | Move to the previous step. Always allowed. |
| `reset()` | `() => void` | Reset to step 0. Marks all steps incomplete; for steps holding a `stepControl`, also resets the form. |
| `goTo(index: number)` | `(number) => void` | Programmatically activate a step. Clamps to `[0, steps.length-1]`; safe to call with out-of-range values. |

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | One or more `<sd-step>` children. The stepper discovers them via a `contentChildren` signal and re-renders if the list changes. |

### Visual cues
- Numbered circular indicator per step (1, 2, 3 â€¦); replaced with a check icon when completed, an edit icon when revisited, or a close icon when in error state
- Connector line between indicators turns from gray to active color as the user progresses
- Active step indicator is filled with the chosen color; pending steps render gray (`#e0e0e0` background)
- Label text bolds on the active step and uses the active color
- Horizontal orientation: header row at the top, content panel below; vertical orientation: header + content stacked per step, with a left-side vertical connector

### Behaviors / quirks
- **Lazy content**: each step's body is captured into a `viewChild('body')` `TemplateRef` on the child `<sd-step>` and rendered inside `mat-step`'s `matStepContent` slot. The body DOM is created only when the step is first activated.
- **Linear gating**: when `linear="true"` and a step has a `stepControl` (e.g. a `FormGroup`), the user cannot click forward to a later step until the current step's control is valid. `next()` is also blocked. Use the form-aware buttons in the demo for proper UX.
- **State override**: pass an explicit `state` on a `<sd-step>` to override the auto-derived state â€” useful for async server-side validation that lands on a step after the user has moved on.
- **Editable=false**: once the user passes a non-editable step, clicking its header does NOT bring them back. Use for steps that mutate server state irreversibly.
- **Bounds clamping**: when the active step is removed (e.g. parent splices the steps array), `selectedIndex` clamps to the last valid index so MatStepper doesn't render an empty selection.
- **Color**: all stepper visuals (indicator + connector + active label) use the chosen `color` via host CSS vars. Override individual vars on the host element for finer control.

### Examples

#### 1. Basic 3-step horizontal
```html
<sd-stepper [(selectedIndex)]="idx">
  <sd-step label="Chá»n dá»‹ch vá»¥" icon="storefront">
    <p>KhÃ¡ch hÃ ng chá»n dá»‹ch vá»¥.</p>
    <button (click)="idx.set(1)">Tiáº¿p tá»¥c</button>
  </sd-step>
  <sd-step label="Cung cáº¥p thÃ´ng tin" icon="person">
    <p>Form thÃ´ng tin liÃªn há»‡.</p>
  </sd-step>
  <sd-step label="XÃ¡c nháº­n" icon="check_circle">
    <p>Kiá»ƒm tra trÆ°á»›c khi gá»­i.</p>
  </sd-step>
</sd-stepper>
```

#### 2. Linear wizard with FormGroup gating
```ts
accountForm = new FormGroup({
  username: new FormControl('', [Validators.required, Validators.minLength(3)]),
  email: new FormControl('', [Validators.required, Validators.email]),
});
profileForm = new FormGroup({
  fullName: new FormControl('', Validators.required),
  phone: new FormControl('', Validators.required),
});
```

```html
<sd-stepper #stepper linear="true">
  <sd-step label="TÃ i khoáº£n" [stepControl]="accountForm">
    <form [formGroup]="accountForm">
      <input formControlName="username" placeholder="username" />
      <input formControlName="email" placeholder="email" />
      <button (click)="stepper.next()" [disabled]="accountForm.invalid">Tiáº¿p tá»¥c</button>
    </form>
  </sd-step>
  <sd-step label="Há»“ sÆ¡" [stepControl]="profileForm">
    <form [formGroup]="profileForm">
      <input formControlName="fullName" />
      <input formControlName="phone" />
      <button (click)="stepper.previous()">Quay láº¡i</button>
      <button (click)="stepper.next()" [disabled]="profileForm.invalid">Tiáº¿p tá»¥c</button>
    </form>
  </sd-step>
  <sd-step label="HoÃ n táº¥t">
    <p>ÄÄƒng kÃ½ thÃ nh cÃ´ng.</p>
    <button (click)="stepper.reset()">Báº¯t Ä‘áº§u láº¡i</button>
  </sd-step>
</sd-stepper>
```

#### 3. Vertical orientation
```html
<sd-stepper orientation="vertical">
  <sd-step label="Táº¡o tÃ i khoáº£n" icon="account_circle">â€¦</sd-step>
  <sd-step label="LiÃªn káº¿t ngÃ¢n hÃ ng" icon="account_balance">â€¦</sd-step>
  <sd-step label="HoÃ n táº¥t" icon="done_all">â€¦</sd-step>
</sd-stepper>
```

#### 4. Optional step (can be skipped in linear mode)
```html
<sd-stepper linear="true">
  <sd-step label="CÆ¡ báº£n" [stepControl]="basicForm">â€¦</sd-step>
  <sd-step label="Khuyáº¿n mÃ£i" [optional]="true">â€¦</sd-step>
  <sd-step label="HoÃ n táº¥t">â€¦</sd-step>
</sd-stepper>
```

#### 5. Error state override
```html
<sd-stepper>
  <sd-step label="Step 1">â€¦</sd-step>
  <sd-step label="Validate fail" state="error" errorMessage="MÃ£ Ä‘Æ¡n khÃ´ng há»£p lá»‡">
    <p>Sai dá»¯ liá»‡u â€” kiá»ƒm tra láº¡i.</p>
  </sd-step>
  <sd-step label="Step 3">â€¦</sd-step>
</sd-stepper>
```

#### 6. Color palette
```html
<sd-stepper color="success">â€¦</sd-stepper>
<sd-stepper color="warning">â€¦</sd-stepper>
<sd-stepper color="error">â€¦</sd-stepper>
```

#### 7. External controls
```html
<button (click)="stepper.previous()">Prev</button>
<button (click)="stepper.next()">Next</button>
<button (click)="stepper.reset()">Reset</button>

<sd-stepper #stepper>
  <sd-step label="A">â€¦</sd-step>
  <sd-step label="B">â€¦</sd-step>
  <sd-step label="C">â€¦</sd-step>
</sd-stepper>
```

### Anti-patterns
- âŒ Using as a tab group when steps are not actually sequential â€” confusing to users who expect linear progress
- âŒ Forgetting `track` on a dynamic `@for` over steps â€” `contentChildren` will churn when the array reference changes between renders
- âŒ Skipping `stepControl` in linear mode â€” without it, `linear="true"` falls back to "no gating", defeating the purpose
- âŒ Putting heavy DOM in every step without relying on lazy mount â€” `matStepContent` already lazy-loads via this component; don't pre-render via `[hidden]` tricks
- âŒ Overriding `state` permanently from the parent â€” `state` is meant as a transient override (async validation, server error); long-lived states should flow through `stepControl` validation

---

## `<sd-step>`

### One-line purpose
A child of `<sd-stepper>` that declares one step â€” its label, icon, optional/editable flags, `stepControl`, and projected body. The body is captured into a `viewChild` template ref so `<sd-stepper>` can render it lazily inside `mat-step`'s `matStepContent` slot.

### When to use
- Always inside `<sd-stepper>`. Has no standalone visual output.

### When NOT to use
- Outside `<sd-stepper>` â€” the component renders no UI on its own; placing it elsewhere is a no-op

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` (REQUIRED, signal input) | â€” | Step label text. Caller is responsible for i18n â€” pass `i18n.t('core.step.account')` directly. |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name shown inside the step indicator when in the `pending` state. When the step is `completed` / `editable` / `error`, Material's auto-derived icons (check / edit / close) replace this. |
| `optional` | `boolean` | `false` | `booleanAttribute` transform. In linear mode, optional steps can be skipped without filling their `stepControl`. |
| `editable` | `boolean` | `true` | `booleanAttribute` transform. When `false`, the user cannot return to this step after it's been completed. |
| `stepControl` | `AbstractControl \| null \| undefined` | `undefined` | A `FormGroup` or `FormControl` whose validity gates step advancement in linear mode. |
| `state` | `'pending' \| 'active' \| 'completed' \| 'error' \| custom string \| undefined` | `undefined` | Override the auto-derived state. Set `'error'` to render the close icon + `errorMessage`. |
| `errorMessage` | `string \| undefined` | `undefined` | Error text rendered next to the step header when state is `'error'`. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `selectChange` | `void` | Emitted when this step transitions to selected. Useful for lazy data fetch when entering the step. |

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | The step body. Captured into a `viewChild('body')` `TemplateRef` and rendered lazily by the parent `<sd-stepper>`. |

### Behaviors / quirks
- The component's own template is just `<ng-template #body><ng-content></ng-content></ng-template>` â€” the host element renders nothing.
- `label` is a required signal input â€” reading `label()` without a value throws at runtime (`NG0950`).
- `optional` / `editable` accept the standard Angular `booleanAttribute` coerce.
- `stepControl` accepts any `AbstractControl`, but the most common use is a `FormGroup` collecting the entire step's fields.

### Anti-patterns
- âŒ Omitting `[label]` â€” required input, throws on first read
- âŒ Trying to add DOM on the `<sd-step>` host element â€” it renders nothing; put markup in the projected body instead
- âŒ Using `<sd-step>` outside `<sd-stepper>` â€” works structurally but produces no UI
- âŒ Setting `state="error"` permanently from a constant â€” instead, derive it reactively from validation state so it clears on retry

---

## Related
- `<sd-tab-group>` â€” for parallel views (non-sequential)
- `<sd-tab-router>` â€” for route-driven sequences (each step owns a URL)
- `<sd-input>`, `<sd-select>`, `<sd-checkbox>` â€” common form controls inside step bodies
- `@angular/cdk/stepper.StepperSelectionEvent` â€” the type emitted by `selectionChange`


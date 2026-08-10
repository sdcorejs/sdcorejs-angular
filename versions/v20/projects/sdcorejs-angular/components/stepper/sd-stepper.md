# `<sd-stepper>` & `<sd-step>`

**Type**: Component (two related components, documented together — used as a pair)
**Selectors**: `sd-stepper`, `sd-step`
**Import path**: `@sdcorejs/angular/components/stepper`
**Classes**: `SdStepper`, `SdStep`
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
- Parallel views that can be switched in any order — use `<sd-tab-group>` instead
- Route-driven sequence where each step is its own URL — use `<sd-tab-router>` with linear navigation logic in the parent
- Pure progress display (no editing) — a plain progress bar / breadcrumb is lighter

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selectedIndex` | `number` (model — two-way) | `0` | Index of the active step. Two-way bindable via `[(selectedIndex)]`. Auto-clamped to `[0, steps.length-1]` when the step count shrinks. |
| `linear` | `boolean` | `false` | `booleanAttribute` transform. When `true`, the user can only advance past a step if that step's `stepControl` (a `FormGroup` or `FormControl`) reports `valid`. Forwarded to `mat-stepper.linear`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Forwarded to `mat-stepper.orientation`. Horizontal renders step headers in a row; vertical stacks them with a connector line on the left. |
| `labelPosition` | `'end' \| 'bottom'` | `'end'` | Only meaningful for horizontal orientation. `'end'` puts the label to the right of the indicator; `'bottom'` puts it under the indicator. |
| `headerPosition` | `'top' \| 'bottom'` | `'top'` | Only meaningful for horizontal orientation. `'top'` (default) shows headers above the content, `'bottom'` flips it. |
| `animationDuration` | `string` | `'500ms'` | CSS time string forwarded to `mat-stepper.animationDuration`. Pass `'0ms'` to disable animation. |
| `disableRipple` | `boolean` | `false` | `booleanAttribute` transform. Disables the ripple on step header click. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`) | `'primary'` | Drives the active indicator, completed indicator, and active connector color via the Core CSS vars (`--sd-<color>`). Same palette as `<sd-tab-group>` and `<sd-badge>`. |
| `autoId` | `string \| undefined` | `undefined` | Emitted as `data-autoId` on the host element for e2e selectors. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdSelectionChange` | `StepperSelectionEvent` (from `@angular/cdk/stepper`) | Emitted whenever the active step changes. Payload: `{ selectedIndex, previouslySelectedIndex, selectedStep, previouslySelectedStep }`. Use to react to a step entering (eg fetch data lazily). |

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
- Numbered circular indicator per step (1, 2, 3 …); replaced with a check icon when completed, an edit icon when revisited, or a close icon when in error state
- Connector line between indicators turns from gray to active color as the user progresses
- Active step indicator is filled with the chosen color; pending steps render gray (`#e0e0e0` background)
- Label text bolds on the active step and uses the active color
- Horizontal orientation: header row at the top, content panel below; vertical orientation: header + content stacked per step, with a left-side vertical connector

### Behaviors / quirks
- **Lazy content**: each step's body is captured into a `viewChild('body')` `TemplateRef` on the child `<sd-step>` and rendered inside `mat-step`'s `matStepContent` slot. The body DOM is created only when the step is first activated.
- **Linear gating**: when `linear="true"` and a step has a `stepControl` (e.g. a `FormGroup`), the user cannot click forward to a later step until the current step's control is valid. `next()` is also blocked. Use the form-aware buttons in the demo for proper UX.
- **State override**: pass an explicit `state` on a `<sd-step>` to override the auto-derived state — useful for async server-side validation that lands on a step after the user has moved on.
- **Editable=false**: once the user passes a non-editable step, clicking its header does NOT bring them back. Use for steps that mutate server state irreversibly.
- **Bounds clamping**: when the active step is removed (e.g. parent splices the steps array), `selectedIndex` clamps to the last valid index so MatStepper doesn't render an empty selection.
- **Color**: all stepper visuals (indicator + connector + active label) use the chosen `color` via host CSS vars. Override individual vars on the host element for finer control.

### Examples

#### 1. Basic 3-step horizontal
```html
<sd-stepper [(selectedIndex)]="idx">
  <sd-step label="Chọn dịch vụ" icon="storefront">
    <p>Khách hàng chọn dịch vụ.</p>
    <button (click)="idx.set(1)">Tiếp tục</button>
  </sd-step>
  <sd-step label="Cung cấp thông tin" icon="person">
    <p>Form thông tin liên hệ.</p>
  </sd-step>
  <sd-step label="Xác nhận" icon="check_circle">
    <p>Kiểm tra trước khi gửi.</p>
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
  <sd-step label="Tài khoản" [stepControl]="accountForm">
    <form [formGroup]="accountForm">
      <input formControlName="username" placeholder="username" />
      <input formControlName="email" placeholder="email" />
      <button (click)="stepper.next()" [disabled]="accountForm.invalid">Tiếp tục</button>
    </form>
  </sd-step>
  <sd-step label="Hồ sơ" [stepControl]="profileForm">
    <form [formGroup]="profileForm">
      <input formControlName="fullName" />
      <input formControlName="phone" />
      <button (click)="stepper.previous()">Quay lại</button>
      <button (click)="stepper.next()" [disabled]="profileForm.invalid">Tiếp tục</button>
    </form>
  </sd-step>
  <sd-step label="Hoàn tất">
    <p>Đăng ký thành công.</p>
    <button (click)="stepper.reset()">Bắt đầu lại</button>
  </sd-step>
</sd-stepper>
```

#### 3. Vertical orientation
```html
<sd-stepper orientation="vertical">
  <sd-step label="Tạo tài khoản" icon="account_circle">…</sd-step>
  <sd-step label="Liên kết ngân hàng" icon="account_balance">…</sd-step>
  <sd-step label="Hoàn tất" icon="done_all">…</sd-step>
</sd-stepper>
```

#### 4. Optional step (can be skipped in linear mode)
```html
<sd-stepper linear="true">
  <sd-step label="Cơ bản" [stepControl]="basicForm">…</sd-step>
  <sd-step label="Khuyến mãi" [optional]="true">…</sd-step>
  <sd-step label="Hoàn tất">…</sd-step>
</sd-stepper>
```

#### 5. Error state override
```html
<sd-stepper>
  <sd-step label="Step 1">…</sd-step>
  <sd-step label="Validate fail" state="error" errorMessage="Mã đơn không hợp lệ">
    <p>Sai dữ liệu — kiểm tra lại.</p>
  </sd-step>
  <sd-step label="Step 3">…</sd-step>
</sd-stepper>
```

#### 6. Color palette
```html
<sd-stepper color="success">…</sd-stepper>
<sd-stepper color="warning">…</sd-stepper>
<sd-stepper color="error">…</sd-stepper>
```

#### 7. External controls
```html
<button (click)="stepper.previous()">Prev</button>
<button (click)="stepper.next()">Next</button>
<button (click)="stepper.reset()">Reset</button>

<sd-stepper #stepper>
  <sd-step label="A">…</sd-step>
  <sd-step label="B">…</sd-step>
  <sd-step label="C">…</sd-step>
</sd-stepper>
```

### Anti-patterns
- ❌ Using as a tab group when steps are not actually sequential — confusing to users who expect linear progress
- ❌ Forgetting `track` on a dynamic `@for` over steps — `contentChildren` will churn when the array reference changes between renders
- ❌ Skipping `stepControl` in linear mode — without it, `linear="true"` falls back to "no gating", defeating the purpose
- ❌ Putting heavy DOM in every step without relying on lazy mount — `matStepContent` already lazy-loads via this component; don't pre-render via `[hidden]` tricks
- ❌ Overriding `state` permanently from the parent — `state` is meant as a transient override (async validation, server error); long-lived states should flow through `stepControl` validation

---

## `<sd-step>`

### One-line purpose
A child of `<sd-stepper>` that declares one step — its label, icon, optional/editable flags, `stepControl`, and projected body. The body is captured into a `viewChild` template ref so `<sd-stepper>` can render it lazily inside `mat-step`'s `matStepContent` slot.

### When to use
- Always inside `<sd-stepper>`. Has no standalone visual output.

### When NOT to use
- Outside `<sd-stepper>` — the component renders no UI on its own; placing it elsewhere is a no-op

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` (REQUIRED, signal input) | — | Step label text. Caller is responsible for i18n — pass `i18n.t('core.step.account')` directly. |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name shown inside the step indicator when in the `pending` state. When the step is `completed` / `editable` / `error`, Material's auto-derived icons (check / edit / close) replace this. |
| `optional` | `boolean` | `false` | `booleanAttribute` transform. In linear mode, optional steps can be skipped without filling their `stepControl`. |
| `editable` | `boolean` | `true` | `booleanAttribute` transform. When `false`, the user cannot return to this step after it's been completed. |
| `stepControl` | `AbstractControl \| null \| undefined` | `undefined` | A `FormGroup` or `FormControl` whose validity gates step advancement in linear mode. |
| `state` | `'pending' \| 'active' \| 'completed' \| 'error' \| custom string \| undefined` | `undefined` | Override the auto-derived state. Set `'error'` to render the close icon + `errorMessage`. |
| `errorMessage` | `string \| undefined` | `undefined` | Error text rendered next to the step header when state is `'error'`. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdSelectChange` | `void` | Emitted when this step transitions to selected. Useful for lazy data fetch when entering the step. |

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | The step body. Captured into a `viewChild('body')` `TemplateRef` and rendered lazily by the parent `<sd-stepper>`. |

### Behaviors / quirks
- The component's own template is just `<ng-template #body><ng-content></ng-content></ng-template>` — the host element renders nothing.
- `label` is a required signal input — reading `label()` without a value throws at runtime (`NG0950`).
- `optional` / `editable` accept the standard Angular `booleanAttribute` coerce.
- `stepControl` accepts any `AbstractControl`, but the most common use is a `FormGroup` collecting the entire step's fields.

### Anti-patterns
- ❌ Omitting `[label]` — required input, throws on first read
- ❌ Trying to add DOM on the `<sd-step>` host element — it renders nothing; put markup in the projected body instead
- ❌ Using `<sd-step>` outside `<sd-stepper>` — works structurally but produces no UI
- ❌ Setting `state="error"` permanently from a constant — instead, derive it reactively from validation state so it clears on retry

---

## Related
- `<sd-tab-group>` — for parallel views (non-sequential)
- `<sd-tab-router>` — for route-driven sequences (each step owns a URL)
- `<sd-input>`, `<sd-select>`, `<sd-checkbox>` — common form controls inside step bodies
- `@angular/cdk/stepper.StepperSelectionEvent` — the type emitted by `sdSelectionChange`

# `<sd-chip>`

**Type**: Component (form input)
**Selector**: `sd-chip`
**Import path**: `@sdcorejs/angular/forms/chip` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdChip`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Multi-value tag input: the user types and presses Enter or comma (or leaves the field, or pastes a list) to add chips, and removes them one by one or all at once. Built on Material `mat-chip-grid` and integrated with SDCoreJS forms (`[form]+[name]`, validators, `[viewed]` read-only).

## When to use

- Free-text multi-value fields: keywords, tags, e-mail recipients, hashtags
- Bulk entry of short string/number values where order is not significant
- A DETAIL state that renders the same values read-only via `[viewed]`

## When NOT to use

- Picking from a fixed list of options → use `<sd-select [multiple]="true">`
- Multi-date selection → use `<sd-chip-calendar>`
- Single tag/value → use `<sd-input>` or `<sd-autocomplete>`

## Inputs

| Name              | Type                                                    | Default          | Notes |
| ----------------- | ------------------------------------------------------- | ---------------- | ----- |
| `autoId`          | `string \| undefined`                                   | `undefined`      | E2E hook, rendered as `data-autoid="forms-chip-<autoId>"` on the chip `<input>` (see E2E test attributes). |
| `name`            | `string \| undefined`                                   | random uuid      | Control name registered into `[form]`. |
| `appearance`      | `MatFormFieldAppearance`                                | `'outline'`      | Material form-field style. |
| `floatLabel`      | `FloatLabelType`                                        | `'auto'`         | When the label floats (`auto \| always`). |
| `labelPlacement`  | `'float' \| 'top'`                                      | `'float'`        | `'float'` keeps the Material floating label. `'top'` renders `label` above the field as a real `<label for>` bound to the chip `<input>`. Used by `<sd-form-render>`. |
| `size`            | `Size` (`'sm' \| 'md' \| 'lg'`)                         | `'md'`           | One-line field of 32 / 40 / 48px with 20 / 24 / 28px chips (see Visual cues). Use `size="sm"` inside `<sd-table>` cells and filters. |
| `form`            | `NgForm \| FormGroup \| undefined`                      | `undefined`      | Parent form; NgForm auto-unwrapped. |
| `label`           | `string`                                                | `''`             | Field label. |
| `placeholder`     | `string \| undefined`                                   | `undefined`      | Placeholder for the typing area. Without it: `core.form.chip.placeholder` (“Nhập rồi nhấn Enter”), never the label. Once `maxCount` is reached: “Đã đủ {max} giá trị”. |
| `model`           | `(string \| number)[] \| undefined`                     | `undefined`      | Two-way (`[(model)]`, a `model()` signal). `null` / `undefined` clears the chips and sets `formControl` to `[]`. Every item except `null`, `undefined` and `''` is a chip, `0` included. |
| `removable`       | `boolean \| ((item: any) => boolean)`                   | `true`           | `true` / `false` for every chip, or a per-item predicate. Applied on every removal path: the ✕ button, Backspace / Delete on a chip, the clear-all button and `onRemove`. A chip it keeps is locked: lighter background, a lock icon with the tooltip “Không xoá được”, and an accessible name that ends with “, Không xoá được”. |
| `minCount`        | `number \| undefined`                                   | `undefined`      | Fewest chips; > 0 adds `Validators.minLength`. |
| `maxCount`        | `number \| undefined`                                   | `undefined`      | Most chips; > 0 adds `Validators.maxLength` (for a model set from outside) and stops adding once reached: an `n/max` counter shows under the field, the placeholder says the field is full, and typing or pasting more is announced instead of added. |
| `min`             | `number`                                                | `0`              | **Deprecated**, use `minCount`. Still adds `Validators.minLength`; `minCount` wins when both are set. Warns once per instance in dev mode. |
| `max`             | `number`                                                | `0`              | **Deprecated**, use `maxCount`. Still adds `Validators.maxLength`; `maxCount` wins when both are set. Warns once per instance in dev mode. |
| `addable`         | `boolean`                                               | `true`           | `false`: nothing can be typed or pasted. The input stays (mat-chip-grid needs it) but is read-only, out of the Tab order and has no placeholder. Existing chips stay. |
| `addOnBlur`       | `boolean`                                               | `true`           | Leaving the field turns the typed text into a chip. `false` drops the text instead. |
| `separators`      | `string[]`                                              | `['Enter', ',']` | Keys that commit the typed text, compared with `KeyboardEvent.key`. A paste also splits on these characters, new lines and tabs. Add `';'` for e-mail lists. |
| `chipTransform`   | `(raw: string) => string \| number \| null`             | trim             | Normalises typed or pasted text before it is compared and stored. `null` or `''` drops it. |
| `chipValidator`   | `((value: string \| number) => string \| null) \| null` | `null`           | Checks a normalised value. Return an i18n key (or the message itself) to refuse it: it does not become a chip, its text stays in the input and the message shows under the field until the text changes. |
| `clearable`       | `boolean`                                               | `false`          | Shows a clear-all button (`.sd-clear-btn`, like `<sd-date>`) on hover or focus, always on touch screens. It removes every chip `removable` allows in one change and keeps its place while there is nothing to clear. Not shown when `required` or `disabled`. |
| `maxVisible`      | `number \| null`                                        | `null`           | Chips shown while the field is not focused; the rest fold into a “+N” button that moves focus to the input, where every chip shows. While folded, the input only fills the rest of the line and shows no placeholder, so the field stays one line. Use `2` inside `<sd-table>` cells. |
| `required`        | `boolean`                                               | `false`          | Adds `Validators.required`. |
| `disabled`        | `boolean`                                               | `false`          | Disables the chips and the input; no ✕, lock or clear button. |
| `viewed`          | `boolean \| 'inline'`                                   | `false`          | Display mode. `false` = edit. `true` = static read-only `<sd-view>`; `<ng-template sdViewDef>` (if present) overrides the rendering. `'inline'` = the editable chip field stays mounted (chips are already compact, so there is no separate read-only face), but a **disabled** `'inline'` falls back to `true`. |
| `hideInlineError` | `boolean`                                               | `false`          | Hides the error row under the field. The field shows an error icon with a tooltip, and the input points `aria-describedby` at a visually hidden copy of the message. |
| `hyperlink`       | `string \| null \| undefined`                           | `undefined`      | Used in static `[viewed]` mode to link the value. |

> **Coerce**: `addable`, `addOnBlur`, `clearable`, `required`, `disabled`, `hideInlineError` use `booleanAttribute` — bare attribute = `true`. `viewed` uses the shared `sdViewedTransform` (accepts `'' | true | false | null | undefined` plus the literal `'inline'`); computed `isViewed()` (`true`, or disabled `'inline'`) drives the static `<sd-view>` branch and the host `.sd-viewed` class.

## Outputs

| Name          | Type    | Notes |
| ------------- | ------- | ----- |
| `modelChange` | `any[]` | Emits the new chip array once per change (add, paste, remove, clear). |
| `sdChange`    | `any[]` | SDCoreJS-standard change event, same payload and timing as `modelChange`. |

## Host classes

Applied automatically on `<sd-chip>` for styling hooks:

| Class          | Condition                                                           | Effect |
| -------------- | ------------------------------------------------------------------- | ------ |
| `sd-has-label` | `[label]` is truthy                                                 | Adds `padding-top: 4px` so the floating label has room and is not clipped. Absent → no top padding. |
| `sd-label-top` | `labelPlacement="top"`                                              | Removes the top padding; the label sits above the field. |
| `sd-viewed`    | `isViewed()` — `[viewed]="true"`, or disabled `[viewed]="'inline'"` | Removes top padding (read-only text only). Overrides `sd-has-label` when both are set (source order). |

## Content projection (slots)

- `#sdLabel` template / `<ng-template sdLabelDef>` — custom label. In edit mode it replaces the label only with `labelPlacement="top"`, as on `<sd-date>` and `<sd-select>`; a floating label is the plain `label` text. In static `[viewed]` mode `<sd-view>` uses it.
- `#sdValue` template — value template of the static `[viewed]` `<sd-view>`; the chips themselves are not templated.
- `<ng-template sdViewDef>` — display template: used in `[viewed]` mode, and in edit mode as the face shown until the field opens. In edit mode the face is a `role="button"` that a click, Enter or Space opens; it leaves the Tab order when `[disabled]`. The wrapper around the field is layout only (no role, no `tabindex`).

## Model and value

- Values are primitives — `string` or `number`. Object chips are not supported; normalise to a string key first.
- **One path for every addition** — typed text (separator key, blur, `onAdd`) and pasted text go through `chipTransform`, then the duplicate check, the `maxCount` limit and `chipValidator`, and every change writes one new array once to `formControl`, `model` and `sdChange`.
- **Duplicate guard** — values compare as strings after `chipTransform`, so a model `[1]` and a typed `1` are the same chip. The comparison is case-sensitive: “Tag” and “tag” are two chips, unless `chipTransform` lower-cases them (see the e-mail example). A duplicate highlights the chip it repeats for 1.4s (`--sd-chip-duplicate-bg`, warning outline) and is announced as “{value} đã có”.
- **Paste a list** — a paste that holds a separator, a new line or a tab adds every value in one change. Duplicates are skipped, refused values and values past `maxCount` stay in the input for fixing, and the result is announced (“Đã thêm 3 · bỏ 1 trùng”). A paste without a separator is left to the browser.
- **The model array is replaced, never mutated** — the array you pass into `[model]` is never written to, and because the reference always changes, `modelChange` fires reliably (signal equality is `Object.is`, so an in-place `push` would have been swallowed).
- **Long values** — the chip text stops at 240px with an ellipsis, and a chip that is cut shows its whole value in a tooltip.

## Form integration

- **Does NOT implement `ControlValueAccessor`.** Standard SDCoreJS form pattern: provide `[form]` + `name`, the component registers its `formControl` into the group and removes it when destroyed.
- **`formControlName` and `[(ngModel)]` are NOT supported.** Use `[(model)]` and `[form]+[name]`.
- **Validators (additive)**: `[required]`, `[minCount]` (`minLength`), `[maxCount]` (`maxLength`); the deprecated `[min]` / `[max]` still work. They are signal inputs routed through the shared form connector, which **adds and removes only the validators this component owns**; validators you attach yourself to the public `formControl` are preserved. Messages: required → “Vui lòng nhập thông tin”; minlength → “Vui lòng nhập ít nhất N giá trị”; maxlength → “Vui lòng nhập tối đa N giá trị”.
- **When the error shows** — one rule for the red outline, `<mat-error>` (or the `hideInlineError` icon) and `aria-invalid`: the control is invalid and either touched or its parent `NgForm` / `FormGroupDirective` was submitted. A field that is only dirty, or untouched before a submit, shows nothing. The field becomes touched when focus leaves it; moving between the typing input and the chips does not count. Leaving the field never rewrites `formControl` (number items stay numbers, a reset stays a reset).
- **`[disabled]` reactive** — toggling `disabled` disables / enables `formControl` and `inputControl` together.
- **`[viewed]="true"`** = DETAIL read-only mode: the values display without ✕ or input; honours `<ng-template sdViewDef>` and `hyperlink`.

```html
<!-- 1. Model binding only (no FormGroup) -->
<sd-chip label="Tags" [(model)]="model.tags"></sd-chip>

<!-- 2. Reactive FormGroup (self-registers) -->
<form [formGroup]="form">
  <sd-chip label="Tags" name="tags" [form]="form" required [(model)]="model.tags"></sd-chip>
</form>

<!-- 3. NgForm (template-driven group) -->
<form #f="ngForm">
  <sd-chip label="Tags" name="tags" [form]="f" required [(model)]="model.tags"></sd-chip>
</form>
```

## Keyboard

- The keys in `separators` (default Enter and comma) commit the typed text; typing in an IME composition never commits. Leaving the field commits too (`addOnBlur`).
- On a chip, Backspace / Delete remove it when `removable` allows; on a locked chip a polite live region says “Không xoá được”.
- “+N” and the clear-all button are buttons in the Tab order; “+N” moves focus to the input, where every chip shows.

## Public API

| Member        | Signature                             | Notes |
| ------------- | ------------------------------------- | ----- |
| `onAdd`       | `(event: MatChipInputEvent) => void`  | Called by `(matChipInputTokenEnd)` (blur with `addOnBlur`); runs the one addition path above. |
| `onRemove`    | `(item: any) => void`                 | Removes the item into a new array and emits once, then focuses the input. Skips an item `removable` keeps. |
| `onClear`     | `(event?: any) => void`               | Removes every chip `removable` allows in one change; emits nothing when no chip goes. From a click it returns focus to the input. |
| `focus`       | `() => void`                          | Focuses the typing input after 100 ms (guards against the blur race). |
| `onFocus`     | `() => void`                          | Sets `isFocused`; the typed text stays. |
| `onBlur`      | `() => void`                          | Clears `isFocused` after 150 ms (blur-race guard); with `[addOnBlur]="false"` it also drops the typed text. |
| `onClickChip` | `(event: Event, item: any) => void`   | Stops propagation and focuses the input unless disabled. |
| `onClick`     | `() => void`                          | With `sdViewDef`: opens the field; `onViewKeydown` does the same for Enter / Space. |
| `isFocused`   | `Signal<boolean>`                     | `true` while the field is being edited (the `sdViewDef` face is hidden). |
| `formControl` | `SdFormControl`                       | The control registered into `[form]`. |
| `errorId`     | `string`                              | Stable id of the error text the input points `aria-describedby` at. |

## Visual cues (helps agent map screenshots → component)

- Outlined field with the chips in a row (wrapping when needed, 4px apart) and the typing area after them, which wraps to a new line when less than 80px is left. One line is 32 / 40 / 48px at `sm` / `md` / `lg`, with 20 / 24 / 28px chips centred in it.
- Chip: 6px radius, 1px `--sd-border` outline, `--sd-surface` background, 12 / 13 / 14px text with tabular digits, text cut at 240px with “…”. A ✕ after the text (12 / 14 / 16px, round hover background).
- Locked chip (`removable` keeps it): lighter background (`--sd-chip-locked-bg`) and a lock icon where the ✕ would be.
- With `maxVisible`: a borderless “+N” button as tall as a chip after the visible chips.
- With `maxCount`: an `n/max` counter under the field, warning colour when full.
- With `clearable`: a square ✕ button (24 / 28 / 32px) in the suffix, on hover or focus.
- A chip that a typed value duplicates flashes a warning background and outline for 1.4s.
- In `[viewed]` mode: plain text of the values, no input or ✕.

The chip look is shared with `<sd-chip-calendar>` through the `sd-chip-row()` mixin of `assets/scss/core/form.scss` (applied to `mat-form-field.sd-chip-field`); tokens are listed in `THEME.md` (“Chip tokens”).

## Standalone imports and table-cell usage

Every standalone host that uses `<sd-chip>` must import `SdChip`. Projected label/view templates require their directives in `imports`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdChip } from '@sdcorejs/angular/forms';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdChip, SdLabelDefDirective, SdViewDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="tags" let-row>
        <sd-chip size="sm" hideInlineError [maxVisible]="2" [(model)]="row.tags"></sd-chip>
      </ng-template>
    </sd-table>
  `,
})
export class ChipTableComponent {
  tableOption!: SdTableOption<unknown>;
}
```

Inside `<sd-table>` custom cells, always use `size="sm"`, `hideInlineError` and `[maxVisible]="2"`, so ten tags or a long URL do not make the row three times taller. For read-only primitive arrays, prefer the lightweight `sdView` pipe: `{{ row.tags | sdView }}`.

## Dense dashboard/filter usage

When this control is rendered in dashboard cards, filter bars, external filter panels, table toolbars, query bars, or other compact non-form surfaces, prefer `hideInlineError` so Material does not reserve the inline error/subscript row under the field. Pair it with `size="sm"`. Validation remains visible through the compact error icon/tooltip without increasing the control height, and the message is also exposed to assistive tech through a screen-reader-only element (`span.sd-visually-hidden`) referenced by `aria-describedby`.

```html
<sd-chip size="sm" hideInlineError [(model)]="filter.tags"></sd-chip>
```

## Examples

### 1. Tag/keyword input

```html
<sd-chip [form]="form" name="tags" label="Tags" [(model)]="model.tags" [minCount]="1" [maxCount]="10" required></sd-chip>
```

### 2. E-mail recipients: normalise, validate, limit, lock the sender

```html
<sd-chip
  [form]="form"
  name="recipients"
  label="Người nhận"
  [(model)]="model.recipients"
  [separators]="['Enter', ',', ';']"
  [chipTransform]="toEmail"
  [chipValidator]="checkEmail"
  [maxCount]="5"
  [removable]="canRemoveRecipient"
  clearable>
</sd-chip>
```

```ts
// why: the duplicate check is case-sensitive, so lower-case e-mails before they are compared and stored.
toEmail = (raw: string) => raw.trim().toLowerCase();
checkEmail = (email: string | number) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email)) ? null : 'Email không hợp lệ');
// The current user's address stays: its chip shows a lock and the clear-all button keeps it.
canRemoveRecipient = (email: string) => email !== this.currentUserEmail;
```

### 3. DETAIL read-only display

```html
<sd-chip label="Tags" [model]="model.tags" [viewed]="true"></sd-chip>
```

## E2E test attributes

Rendered on the chip `<input class="sd-chip-input">` element (same anchor as `data-autoid`):

| Attribute            | Value                 | Source |
| -------------------- | --------------------- | ------ |
| `data-autoid`        | `forms-chip-<autoId>` | input `autoId` |
| `data-disabled`      | `"true"` / `"false"`  | `formControl.disabled` |
| `data-empty`         | `"true"` / `"false"`  | `sdIsEmpty(formControl.value)` |
| `data-value`         | string                | `sdSerializeDataValue(formControl.value)` |
| `data-count`         | number as string      | number of items in `formControl.value` |
| `data-required`      | `"true"` / `"false"`  | `required` input; always present |
| `data-error-message` | string                | present only when the control has an error message |

> **Note**: there is no `data-invalid`; use `aria-invalid="true"` on the same input, or `data-error-message`. There are no `data-maxlength`, `data-minlength` or `data-pattern` attributes.

Other hooks (when `autoId` is set, `<id>` = `forms-chip-<autoId>`):

| Element          | Hook                                        |
| ---------------- | ------------------------------------------- |
| Clear-all button | `data-autoid="<id>-clear"`, `.sd-chip__clear` |
| “+N” button      | `data-autoid="<id>-more"`, `.sd-chip__more` |
| A chip           | `mat-chip-row.sd-chip__chip`; locked: `.sd-chip__chip--locked` |

Selector example:

```ts
const el = page.locator('[data-autoid="forms-chip-tags"]');
await expect(el).toHaveAttribute('data-count', '2');
await expect(el).toHaveAttribute('data-required', 'false');
```

## Accessibility

- The ✕ button of a chip is named `core.form.chip.remove` (“Xoá {value}”), the clear-all button `core.form.chip.clear` (“Xoá tất cả”), the “+N” button `core.form.chip.more` (“Xem thêm {count}”). A locked chip is named “{value}, Không xoá được”. All follow the `I18nService` language.
- A polite live region reads the duplicate, full and paste messages, and “Không xoá được” when Backspace / Delete reaches a locked chip.
- The chip input gets `aria-invalid="true"` whenever the error shows; with `hideInlineError` it points `aria-describedby` at a screen-reader-only copy of the message.
- When an `sdViewDef` face is shown it is `role="button" tabindex="0"` with Enter / Space handlers that mirror the click. No `aria-label` is set there on purpose: the projected content is the visible label.
- Hover only adds: the clear-all button also shows on focus and always on touch screens (`pointer: coarse`), where the chip ✕ keeps a 24×24px hit area. Transitions are off under `prefers-reduced-motion`.

## Anti-patterns

- ❌ Using `formControlName` / `[(ngModel)]` — not wired; use `[(model)]` + `[form]+[name]`.
- ❌ Pushing onto the `model` array in place — pass a new array reference.
- ❌ Storing complex objects per chip — values must be primitive (string/number).
- ❌ Using `<sd-chip>` to pick from a fixed option list — prefer `<sd-select [multiple]>`.
- ❌ Using `min` / `max` in new code — use `minCount` / `maxCount`.
- ❌ Using `[disabled]` instead of `[viewed]` for DETAIL state.

## Related

- `<sd-chip-calendar>` — multi-date chip input, same chip look
- `<sd-autocomplete>` — single-select with typeahead
- `<sd-select>` — closed-set picker (with `[multiple]`)
- `<sd-input>` — single-value free text

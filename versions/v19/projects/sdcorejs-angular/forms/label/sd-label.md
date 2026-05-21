# `<sd-label>`

**Type**: Component (presentational â€” NOT a form control)
**Selector**: `sd-label`
**Import path**: `@sdcorejs/angular/forms/label` (or barrel: `@sdcorejs/angular/forms`)
**Class**: `SdLabel`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Tiny presentational label primitive â€” renders the standard SDCoreJS field label row: `<text> [info-icon-with-tooltip] [*]` plus an optional description. Used internally by every `<sd-input>` / `<sd-select>` / `<sd-autocomplete>` / `<sd-date>` / etc. â€” and exposed for places where you need the same label styling without a form field.

## When to use
- Custom layouts where you need the canonical SDCoreJS label styling (font size T14M, required asterisk, helper-text info icon) but no input control follows it
- Mixing label + custom DOM (e.g. label above a manually-built read-only block, or above a non-form widget)
- Inside a form-field replacement where you want to keep label-area markup consistent with other form controls

## When NOT to use
- As a form control â€” `<sd-label>` does NOT take input from the user, has no `[form]`/`[name]`/`[(model)]`, and registers nothing on a parent FormGroup
- For section headings â€” use a normal heading element with the appropriate typography class
- For inline form fields that already render their own label â€” passing `[label]` to `<sd-input>` etc. is enough; do not stack a separate `<sd-label>`
- For tooltips that aren't tied to a label â€” use Material `matTooltip` directly

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string \| null \| undefined` | `undefined` | The label text. If empty/null, the entire component renders nothing. |
| `description` | `string \| null \| undefined` | `undefined` | Optional description line shown below the label in muted (`text-black400 T12R`) style. |
| `helperText` | `string \| undefined` | `undefined` | When set, renders an `info_outline` icon next to the label; tooltip on hover shows this text. |
| `required` | `boolean \| ''` | `false` | Renders a red `*` after the label. Bare attribute (`required`) and string `''` both coerce to `true`. |

> **Coerce**: `required` is treated as `true` for empty-string or any truthy value (custom setter â€” NOT `booleanAttribute`).

## Outputs
None.

## Content projection (slots)
None â€” all rendering is driven by the four inputs.

## Form integration
- **Not a form control. No CVA, no `[form]+[name]` pattern, no model.** Pure presentation.
- Internally consumed by `<sd-input>`, `<sd-input-number>`, `<sd-select>`, `<sd-autocomplete>`, `<sd-chip>`, `<sd-checkbox>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>`, `<sd-textarea>` â€” those components forward their `[label]`, `[helperText]`, `[required]` props to an internal `<sd-label>`.
- For the rare case you build a hand-rolled "field" outside the standard form components, use this directly so the label area matches everything else on the page.

## Visual cues (helps agent map screenshots â†’ component)
- Single line: `<bold-ish T14M label text> [info â“˜] *` â€” required asterisk in error/red color (`text-error`)
- The info icon is small (1rem Ã— 1rem), `info_outline` from Material font set; tooltip appears below on hover
- If `description` is set, a second line below the label in muted gray small text (`T12R`)
- Renders nothing at all when `label` is empty â€” safe to use defensively without `*ngIf`

## Examples

### 0. Import vÃ o component

```ts
import { SdLabel } from '@sdcorejs/angular/forms/label';
// hoáº·c barrel:
// import { SdLabel } from '@sdcorejs/angular/forms';

@Component({
  standalone: true,
  imports: [SdLabel],
  templateUrl: './my.component.html',
})
export class MyComponent {
  required = true;
  helperText = 'Giáº£i thÃ­ch thÃªm vá» trÆ°á»ng nÃ y';
}
```

### 1. Standalone label above a read-only computed value

`helperText` hiá»ƒn thá»‹ icon â“˜; hover vÃ o sáº½ tháº¥y tooltip phÃ­a dÆ°á»›i.

```html
<div class="form-field">
  <sd-label
    label="Sá»‘ dÆ° kháº£ dá»¥ng"
    helperText="ÄÃ£ trá»« cÃ¡c giao dá»‹ch Ä‘ang chá» duyá»‡t">
  </sd-label>
  <div class="T16M">{{ availableBalance | sdFormatNumber }} Ä‘</div>
</div>
```

### 2. Required + description

`required` cÃ³ thá»ƒ truyá»n dÆ°á»›i dáº¡ng bare attribute (khÃ´ng cáº§n `[required]="true"`). `description` xuáº¥t hiá»‡n á»Ÿ dÃ²ng thá»© hai bÃªn dÆ°á»›i label, dÃ¹ng style muted `T12R`.

```html
<sd-label
  label="MÃ£ khÃ¡ch hÃ ng"
  description="Tá»± Ä‘á»™ng sinh náº¿u Ä‘á»ƒ trá»‘ng"
  required>
</sd-label>
```

### 3. Inside a custom widget panel

DÃ¹ng `<sd-label>` Ä‘á»ƒ Ä‘á»“ng nháº¥t styling vá»›i cÃ¡c form control khÃ¡c trÃªn cÃ¹ng trang, dÃ¹ khÃ´ng cÃ³ input ngay bÃªn dÆ°á»›i.

```html
<div class="panel">
  <sd-label label="TÃ i liá»‡u Ä‘Ã­nh kÃ¨m" helperText="Tá»‘i Ä‘a 10 file, má»—i file â‰¤ 10MB"></sd-label>
  <app-attachment-uploader [(files)]="files"></app-attachment-uploader>
</div>
```

## Anti-patterns
- âŒ Wrapping `<sd-input [label]="...">` inside its own `<sd-label>` â€” duplicate labels.
- âŒ Trying `[(model)]` / `[form]` / `[name]` â€” none exist on this component.
- âŒ Using `<sd-label>` as a section heading â€” it is for FIELD labels (T14M); use proper headings with appropriate typography for sections.
- âŒ Hard-coding the same markup elsewhere â€” use `<sd-label>` so future label-style tweaks apply globally.
- âŒ Passing translated text via interpolation when you also want a tooltip â€” `helperText` IS the tooltip content; do not also wrap the component in `matTooltip`.

## Related
- `<sd-input>`, `<sd-input-number>`, `<sd-textarea>`, `<sd-select>`, `<sd-autocomplete>`, `<sd-chip>`, `<sd-checkbox>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>` â€” all use `<sd-label>` internally
- `SdLabelDefDirective` â€” used by some form components (e.g. `<sd-date-range>`) when you need to project a custom label template


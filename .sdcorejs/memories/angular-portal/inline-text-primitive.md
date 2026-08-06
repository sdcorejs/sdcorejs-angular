---
name: inline-text-primitive
description: Inline-edit input in @sdcorejs/angular is the <sd-inline-text> primitive (forms/inline-text); content-hug via native [size]; consumed by sd-input/sd-input-number inline + query-bar chip.
metadata:
  type: project
---

`@sdcorejs/angular` inline-edit text input = the shared primitive **`<sd-inline-text>`** at `forms/inline-text`.

- Renders a **raw `<input>`** (NOT `mat-form-field`); width hugs content via the native `size` attribute (clamped, floor `minSize` default 2). This is why it can sit inside a chip — `mat-form-field` cannot hug content, which is the original reason query-bar built its own seamless chip.
- Two binding modes: uncontrolled `[(value)]` (chip drafts) or controlled `[control]` (external `SdFormControl`, used by form controls).
- Unopinionated about commit/parse/format — it **forwards DOM events** (`sdFocus`/`sdBlur`/`sdKeydown`/`sdPaste`/`sdCompositionStart`/`sdCompositionEnd`/`keyupEnter`/`keydownEscape` + `cleared`) and exposes `focus()`/`blur()`. Each consumer keeps its own logic (e.g. sd-input-number's vi-VN formatting).
- `chrome`: `standalone` (own hover bg + focus ring — sd-input inline) vs `seamless` (transparent, host pill owns chrome — chips). `state` input drives `data-state` (pending/active/focus/error); seamless colours the input text per state since encapsulation blocks the chip pill from reaching the inner input.

**Why:** before this, `sd-input`/`sd-input-number` `viewed='inline'` went through `mat-form-field` with `width:100%`, so the hover/click band stretched full-width regardless of content. The old `sd-inline-input` SCSS mixin (mat `::ng-deep` flatten) was removed.

**How to apply:** for any new inline-edit / chip value field, consume `<sd-inline-text>` — do NOT re-flatten `mat-form-field`. Future query-builder value editor should use it too.

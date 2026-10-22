# Form template directives

**Type**: Structural directives (four, documented together — they share one purpose and one entry point)
**Selectors**: `sdSuffixDef`, `sdLabelDef`, `sdViewDef`, `sdItemDef`
**Import path**: `@sdcorejs/angular/forms/directives`
**Classes**: `SdSuffixDefDirective`, `SdLabelDefDirective`, `SdViewDefDirective`, `SdItemDefDefDirective`
**Standalone**: yes (all four)

## One-line purpose

Four marker directives that let a consumer hand a custom `TemplateRef` to an SDCoreJS form control — a suffix, a label, a read-only value renderer, or a dropdown-item renderer — without the control having to expose a separate input for each.

## How they work

Each directive does exactly one thing: it injects the `TemplateRef` of the element it sits on and exposes it as a public `templateRef` field. The host control finds the directive with `contentChild()` and renders `templateRef` where it needs it. There are no inputs, no outputs and no methods.

```ts
@Directive({ selector: '[sdViewDef]', standalone: true })
export class SdViewDefDirective<TValue = unknown, TItem = unknown> {
  readonly templateRef: TemplateRef<Context<TValue, TItem>>;
}
```

Because they are plain markers, you import the directive into the **consuming** component (the one whose template contains the `<ng-template>`), not into the form control.

## The four directives

| Directive | Selector | Generic | Template context | Rendered where |
| --- | --- | --- | --- | --- |
| `SdSuffixDefDirective` | `sdSuffixDef` | — | none (`Record<string, never>`) | Trailing slot of the form field, after the built-in clear / error affordances. |
| `SdLabelDefDirective` | `sdLabelDef` | — | none (`Record<string, never>`) | In place of the plain-string `[label]`. |
| `SdViewDefDirective` | `sdViewDef` | `<TValue, TItem>` | `{ value?, selectedItem?, selectedItems? }` | The `<sd-view>` value slot — i.e. `[viewed]="true"` and the text face of `[viewed]="'inline'"`. |
| `SdItemDefDefDirective` | `sdItemDef` | `<T>` | `{ $implicit?: T, item: T }` | Each option row inside a picker panel. |

> **Class name**: the item directive really is called `SdItemDefDef**Directive**` — the doubled `Def` is in the source, not a typo here. The selector is the single-`Def` `sdItemDef`.

`sdViewDef` and `sdItemDef` declare a static `ngTemplateContextGuard`, so `let-` variables in the template are typed. `sdSuffixDef` and `sdLabelDef` take no context — their `let-` bindings would be `never`.

`sdViewDef` is rendered through `<sd-view>`'s `[valueTemplate]`, which supplies one extra key beyond the declared `Context`: `$implicit` is the formatted **display** string. So `let-x` gives you the display text, `let-v="value"` the raw value, and `let-item="selectedItem"` / `let-items="selectedItems"` the resolved option object(s).

## Which control reads which

Not every control reads every directive — projecting one a control ignores silently does nothing.

| Control | `sdSuffixDef` | `sdLabelDef` | `sdViewDef` | `sdItemDef` |
| --- | :---: | :---: | :---: | :---: |
| `<sd-input>` | ✅ | — | ✅ | — |
| `<sd-input-number>` | ✅ | — | ✅ | — |
| `<sd-input-color>` | ✅ | — | — | — |
| `<sd-textarea>` | ✅ | ✅ | ✅ | — |
| `<sd-radio>` | ✅ | ✅ | ✅ | — |
| `<sd-select>` | — | — | ✅ | ✅ |
| `<sd-autocomplete>` | — | — | ✅ | ✅ |
| `<sd-chip>` | — | ✅ | ✅ | — |
| `<sd-chip-calendar>` | — | ✅ | ✅ | — |
| `<sd-date>` | — | ✅ | ✅ | — |
| `<sd-date-range>` | — | ✅ | — | — |
| `<sd-datetime>` | — | — | ✅ | — |
| `<sd-time>` | — | — | ✅ | — |
| `<sd-time-range>` | — | — | ✅ | — |
| `<sd-upload-file>` | — | ✅ | — | — |
| `<sd-query-builder>` | — | — | — | ✅ |

## Usage forms

`sdSuffixDef`, `sdLabelDef` and `sdViewDef` are written on an `<ng-template>` (attribute form). `sdItemDef` is normally written as a structural directive with `*`, because it binds a per-item context:

```html
<!-- attribute form: no context -->
<ng-template sdSuffixDef>…</ng-template>

<!-- structural form: per-item context -->
<ng-container *sdItemDef="let item">…</ng-container>
```

Both spellings work for either; `*sdItemDef="let item"` is just sugar for an `<ng-template sdItemDef let-item>`.

## Examples

### 1. Custom suffix on an input, custom label on a textarea

`<sd-input>` reads `sdSuffixDef` but **not** `sdLabelDef` — use its plain `[label]` input. `<sd-textarea>` reads both.

```ts
import { Component } from '@angular/core';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdSuffixDefDirective, SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';

@Component({
  selector: 'app-amount',
  imports: [SdInput, SdTextarea, SdSuffixDefDirective, SdLabelDefDirective],
  template: `
    <sd-input label="Số tiền" [(model)]="amount">
      <ng-template sdSuffixDef>
        <span class="unit">VND</span>
      </ng-template>
    </sd-input>

    <sd-textarea [(model)]="note">
      <ng-template sdLabelDef>
        Ghi chú <a href="/help/note" target="_blank">(hướng dẫn)</a>
      </ng-template>
    </sd-textarea>
  `,
})
export class AmountComponent {
  amount?: string;
  note?: string;
}
```

### 2. Custom read-only rendering with `sdViewDef`

`sdViewDef` overrides only the **view** path. The editor is untouched, so the same template serves `[viewed]="true"` and the text face of `[viewed]="'inline'"`.

```html
<sd-select [(model)]="statusCode" [items]="statuses" [viewed]="true">
  <ng-template sdViewDef let-value="value" let-item="selectedItem">
    <sd-badge [color]="item?.color">{{ item?.display ?? value }}</sd-badge>
  </ng-template>
</sd-select>
```

Multi-select gets the whole array:

```html
<sd-select multiple [(model)]="tags" [items]="allTags" [viewed]="true">
  <ng-template sdViewDef let-items="selectedItems">
    @for (t of items ?? []; track t.value) {
      <sd-chip [title]="t.display"></sd-chip>
    }
  </ng-template>
</sd-select>
```

### 3. Custom option rows with `sdItemDef`

```html
<sd-select [(model)]="userId" [items]="users">
  <ng-container *sdItemDef="let user">
    <sd-avatar [src]="user.data?.avatarUrl || user.display" [name]="user.display" [size]="24"></sd-avatar>
    <span class="name">{{ user.display }}</span>
    <span class="email">{{ user.data?.email }}</span>
  </ng-container>
</sd-select>
```

## Anti-patterns

- ❌ Projecting a directive the control does not read — check the table above. Nothing errors; the template is simply never rendered.
- ❌ Using `sdViewDef` to change the editor. It only feeds the view/`<sd-view>` path; to change the editable field use the control's own inputs.
- ❌ Expecting a context from `sdSuffixDef` / `sdLabelDef`. Their context type is `Record<string, never>`; read component state from the surrounding template instead.
- ❌ Rendering focusable controls inside `sdItemDef`. The row itself is the click target of the picker panel; nested interactive elements swallow the selection click.
- ❌ Projecting two of the same directive into one control — each is read with `contentChild()`, so only the first is used.

## Internal (ɵ): search field primitive

The entry point also exports `ɵSdSearchField` (selector `sd-search-field`), the directive `ɵSdSearchFieldInputDirective` (selector `input[sdSearchFieldInput]`) and the type `ɵSdSearchFieldSize`. **Everything with a `ɵ` prefix is internal and is NOT covered by SemVer**: it can be renamed, changed or removed in any release, including a patch. Application code must not import it. It is listed here only so maintainers can find it.

It draws the library's self-built search boxes the same way: the `sd-kanban` board search, the `sd-table` quick-search keyword, the form builder palette search and the filter box of the `sd-select` panel. The primitive owns only the frame. Each consumer keeps its own logic (debounce, Enter to apply, Escape to clear), bindings, key handling, accessible name, `aria-describedby` and `data-autoid` on its real `<input>`.

```html
<sd-search-field size="sm" clearable [clearLabel]="clearLabel" [autoId]="autoId" (cleared)="clear()">
  <input sdSearchFieldInput type="text" [attr.aria-label]="label" [value]="term" (input)="onInput($event)" />
  <span sdSearchFieldEnd aria-hidden="true">↵</span>
</sd-search-field>
```

| Member | Kind | Notes |
| --- | --- | --- |
| `size` | `'sm' \| 'md'`, default `'md'` | sm: `--sd-control-height-sm` (32px) high, 8px padding, 6px gap, 18px icon. md: `--sd-control-height-md` (40px), 12px padding, 8px gap, 20px icon. Text is 14px. |
| `clearable` | `boolean`, default `false` | Shows a clear `<button>` after the input while the input holds a value: 24px with a 16px icon (sm), 28px with an 18px icon (md). |
| `clearLabel` | `string` | Accessible name of the clear button. Default: key `core.form.search-field.clear`. |
| `autoId` | `string` | The clear button gets `data-autoid="<autoId>-clear"`. |
| `cleared` | output `void` | Emitted by the clear button. The primitive does not change the value; the consumer clears it (and moves focus if it wants). |
| `[sdSearchFieldEnd]` | content slot | Trailing content after the clear button, for example the ↵ hint of the table quick search. |

- **Frame**: the host is the box. It uses the control tokens (see `assets/THEME.md`, "Control tokens"): `--sd-control-radius`, a 1px `--sd-control-border`, `--sd-control-border-hover` on hover, and on `:focus-within` `--sd-control-border-focus` plus `--sd-control-ring`. With forced colors the ring is a `Highlight` outline. Background `--sd-surface`; icon and placeholder `--sd-text-secondary`. Consumers set width, margin or background on the host with their own class.
- **Disabled** follows the projected input: background `--sd-surface-muted`, text `--sd-disabled-text`, border `--sd-control-border-disabled`; the clear button is disabled too.
- **Coarse pointer**: at least `--sd-control-height-coarse` (44px) high, 16px text (no iOS zoom on focus) and a 40px clear button. A context that switches to touch size on its own condition sets `min-height` and `font-size` on the host and the local variable `--sd-search-field-clear-size` (the table quick search does this at container widths of 550px or less).
- Clicking the icon or the padding focuses the input, as the former `<label>` wrappers did.
- **Accessibility**: the search icon is `aria-hidden`; the input and the frame never are. The input must carry its own accessible name.

## Related

- `<sd-select>`, `<sd-autocomplete>`, `<sd-query-builder>` — read `sdItemDef`.
- `<sd-view>` — the read-only renderer that `sdViewDef` feeds; it also accepts a `#sdValue` template projected directly, which is the fallback when no `[valueTemplate]` is supplied.
- `<sd-label>` — the label primitive that `sdLabelDef` replaces.
- `@sdcorejs/angular/forms` — the barrel that re-exports all four directives alongside the controls.

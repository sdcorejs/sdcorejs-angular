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
    <sd-avatar [name]="user.display" size="sm"></sd-avatar>
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

## Related

- `<sd-select>`, `<sd-autocomplete>`, `<sd-query-builder>` — read `sdItemDef`.
- `<sd-view>` — the read-only renderer that `sdViewDef` feeds; it also accepts a `#sdValue` template projected directly, which is the fallback when no `[valueTemplate]` is supplied.
- `<sd-label>` — the label primitive that `sdLabelDef` replaces.
- `@sdcorejs/angular/forms` — the barrel that re-exports all four directives alongside the controls.

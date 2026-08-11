# `<sd-ckeditor-styles>`

**Type**: Component (styles-only, renders nothing)
**Selector**: `sd-ckeditor-styles`
**Import path**: `@sdcorejs/angular/components/ckeditor-styles`
**Class**: `SdCKEditorStyles`
**Standalone**: yes
**Change detection**: `OnPush`
**View encapsulation**: `None` (deliberate — see below)

## One-line purpose

A no-render component whose only job is to carry the global CKEditor 5 stylesheet, so the editor components can load that CSS on demand without giving up their own style scoping.

## Why it exists

CKEditor renders a lot of its UI — balloons, dropdowns, dialogs — into `document.body`, outside the host component's view. Styling that requires `ViewEncapsulation.None`. If `<sd-editor>` or `<sd-mini-editor>` set `encapsulation: None` themselves, **all** of their own component styles would leak globally too.

So the global CSS is parked on this one empty component instead. The editors embed `<sd-ckeditor-styles />` at the top of their templates and keep `ViewEncapsulation.Emulated` for everything else.

Two consequences worth knowing:

- **Loaded once.** Angular deduplicates styles per component class, so the `<style>` tag is injected into `<head>` on first mount no matter how many editors are on the page.
- **Travels with the lazy chunk.** When the host editor is lazy-loaded, this component and its CSS are in the same chunk — no eager global stylesheet for apps that never open an editor.

The entry point is listed in the package's `sideEffects` array (`./fesm2022/sdcorejs-angular-components-ckeditor-styles.mjs`) precisely because importing it *is* the side effect; without that, a bundler could tree-shake the stylesheet away.

## Public API

None. No inputs, no outputs, no methods, no content projection. The template is the empty string.

## When to use it directly

Almost never. `<sd-editor>` and `<sd-mini-editor>` already embed it.

Use it directly only when you mount CKEditor yourself — for example rendering CKEditor-produced HTML in a viewer that must match the editor's typography, or wiring `@ckeditor/ckeditor5-angular` without the SDCoreJS wrappers:

```ts
import { Component } from '@angular/core';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';

@Component({
  selector: 'app-article-view',
  imports: [SdCKEditorStyles],
  template: `
    <sd-ckeditor-styles />
    <div class="ck-content" [innerHTML]="safeHtml"></div>
  `,
})
export class ArticleViewComponent {
  safeHtml = '';
}
```

## Anti-patterns

- ❌ Adding it next to an `<sd-editor>` you already render — the editor embeds it; a second instance is harmless but pointless.
- ❌ Putting it in the root `AppComponent` "so the styles are always there". That pulls the CKEditor stylesheet into the initial bundle for every user, including those who never open an editor. Let it ride the lazy chunk.
- ❌ Copying its `styleUrl` into your own `ViewEncapsulation.None` component. You would ship a second copy of the same CSS with no deduplication.

## Related

- `<sd-editor>` — full CKEditor wrapper; embeds this component.
- `<sd-mini-editor>` — compact editor; embeds this component.
- `assets/scss/ckeditor5.scss` — the stylesheet this component owns.

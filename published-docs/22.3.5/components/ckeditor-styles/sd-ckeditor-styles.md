# `<sd-ckeditor-styles>`

**Selector:** `sd-ckeditor-styles`

**Import:** `@sdcorejs/angular/components/ckeditor-styles`

**Class:** `SdCKEditorStyles` (deprecated compatibility name)

This empty standalone component loads the shared Core editor content stylesheet with `ViewEncapsulation.None`. Both editor variants already mount it through their shared surface. Angular deduplicates the component stylesheet; it follows the editor's lazy chunk.

The retained name and `assets/scss/ckeditor5.scss` path are migration aliases. They load `editor-content.scss`; they no longer import or style a CKEditor distribution. Consumers that mount CKEditor separately must provide that engine's own stylesheet.

There are no inputs, outputs or public methods. Existing imports of this component remain valid, and it remains listed in the package's `sideEffects` metadata. New application code normally needs only `SdEditor` or `SdMiniEditor`.

Shared content rules are scoped to the actual Core editor surface and sanitized import preview. The mention popup has its own Core class. Adding a second styles component next to an editor is unnecessary.

Related: [Editor](../editor/sd-editor.md), [Mini Editor](../mini-editor/sd-mini-editor.md), `assets/scss/editor-content.scss`.

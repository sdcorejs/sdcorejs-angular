# `<sd-document-builder>`

**Type**: Component
**Selector**: `sd-document-builder`
**Import path**: `@sdcorejs/angular/components/document-builder` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdDocumentBuilder`
**Standalone**: yes
**Change detection**: default

## One-line purpose
Full-featured WYSIWYG document composer (CKEditor 5 ClassicEditor) for authoring printable templates with headings, tables, images, page orientation, draggable variable placeholders, and inline comments â€” plus DOCX export.

## When to use
- Author legal/contract templates with `{{variables}}` (full_name, address, ...) that get bound at runtime
- Compose printable / exportable documents (offer letters, invoices, decisions, reports) with portrait/landscape control
- Templates that need a TOC by H1/H2/H3 headings, with click-to-scroll
- Documents that need inline reviewer comments anchored to text ranges
- Anywhere you want a near-Word-like authoring surface with DOCX export

## When NOT to use
- For short rich-text fields on a form â†’ use `<sd-editor>`
- For comments / messages with mentions â†’ use `<sd-mini-editor>`
- For plain text â†’ use `<sd-input type="textarea">`
- For PDF generation pipelines that don't need user editing â†’ use a server-side PDF library

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdDocumentBuilderOption` | â€” | **Required.** Drives variable handlers, comment config, paste/orientation/selection callbacks. See type below. |
| `disabled` | `boolean \| ''` | `false` | Bare attribute = true. Toggles read-only mode + disables page-orientation button. |

### `SdDocumentBuilderOption`
```ts
interface SdDocumentBuilderOption {
  onDropVariable?: (variable: SdDocumentBuilderVariable)
    => boolean | Promise<boolean | SdDocumentBuilderVariable>;     // pre-insert validate/transform; return false to block
  onAfterDropVariable?: (variable: SdDocumentBuilderVariable) => void;  // post-insert hook (refresh list, ...)
  onPasteVariable?: (display: string)
    => SdDocumentBuilderVariable | null | Promise<...>;            // resolve {{display}} on paste
  comment?: CkCommentConfig;                                       // inline-comment plugin config
  onSelection?: (selection, $event) => void;                       // editor selection changed
  onOrientation?: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void; // orientation toggle hook
  onPaste?: (data: SdPasteEventData) => void | Promise<void>;      // paste from word/excel/google-docs
  orientation?: 'PORTRAIT' | 'LANDSCAPE';                          // initial orientation
}

interface SdDocumentBuilderVariable<T = any> {
  id: string; uuid?: string;
  value: string;        // e.g. {{full_name}}
  display: string;
  bindingValue?: string; // runtime-bound value
  data?: T;
}

interface SdDocumentBuilderHeading {
  id: string; text: string; level: number; type: string;
}
```

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `contentChange` | `string` | HTML content. Throttled to 500ms (leading + trailing) and normalized. |

## Public methods
- `setContent(html: string)` â€” load HTML into the editor.
- `getContent(): string` â€” return current HTML.
- `setOrientation('PORTRAIT' \| 'LANDSCAPE')` â€” programmatic orientation toggle.
- `getOrientation(): 'PORTRAIT' \| 'LANDSCAPE'` â€” current orientation.
- `scrollToTop()` â€” smooth-scroll the editor canvas to top.
- `heading.all(): SdDocumentBuilderHeading[]` â€” enumerate all H1/H2/... in document, building a TOC.
- `heading.scroll(id)` â€” scroll to a heading and highlight it for 5s.
- `getCommentPluginAPI()` â€” access the inline-comment plugin (add/remove/list/setConfig).
- `getVariablePluginAPI(): VariablePlugin | null` â€” typed handle to the variable plugin.
- `exportDocx({ fileName?, header?, footer? })` â€” export to `.doc` (Word HTML) with optional header/footer + correct page size for current orientation.
- `hightSelectRange(range)` / `removeHighlightSeclectRange()` â€” visually highlight an arbitrary model range without touching content (markers).

## Content projection
None â€” content is fully driven by editor data + plugins.

## Visual cues
- A document-style editor wrapped in a `.builder-container` with its own scroll
- Top toolbar (very wide): Page orientation | Heading | Font family | Font size | Font color | Background color | Bold | Italic | Underline | Subscript | Superscript | Alignment | Bulleted list | Numbered list | Insert table | Image upload | Page break | Undo | Redo
- Content area styled like a page (Times New Roman 13pt, 2cm margins on export)
- Variables render as small blue pills (`.variable-widget`, light blue bg, blue border) that the user can drag in or paste with `{{display}}`
- Headings can be visited from a TOC; selected headings flash with a `highlightMarker` for 5s
- Inline comments highlight ranges with `.ck-comment-marker`
- DOCX export: produces a Word-compatible `.doc` blob with `@page` rules, optional repeating header & footer (HTML), and orientation-aware page size (A4 portrait 21x29.7cm, landscape 29.7x21cm)

## Examples

### 1. Basic template authoring
```html
<sd-document-builder
  [option]="{ orientation: 'PORTRAIT' }"
  (contentChange)="onChange($event)">
</sd-document-builder>
```

### 2. With variable drop validation
```ts
option: SdDocumentBuilderOption = {
  onDropVariable: async (v) => {
    if (!this.allowedVarIds.has(v.id)) {
      this.notify.warning(`Biáº¿n ${v.display} khÃ´ng Ä‘Æ°á»£c phÃ©p chÃ¨n`);
      return false;
    }
    return { ...v, value: `{{${v.id}}}` }; // transform before insert
  },
  onAfterDropVariable: () => this.refreshUsedVariables(),
  onPasteVariable: (display) => this.api.findVariableByDisplay(display),
};
```
```html
<sd-document-builder #builder [option]="option"></sd-document-builder>
<sd-button title="Xuáº¥t DOCX" prefixIcon="download"
  (click)="builder.exportDocx({ fileName: 'hop_dong.doc' })"></sd-button>
```

### 3. TOC sidebar
```ts
@ViewChild(SdDocumentBuilder) builder!: SdDocumentBuilder;
toc = signal<SdDocumentBuilderHeading[]>([]);

refreshToc() { this.toc.set(this.builder.heading.all()); }
goTo(id: string) { this.builder.heading.scroll(id); }
```
```html
<aside>
  <a *ngFor="let h of toc()" [class]="'lvl-' + h.level" (click)="goTo(h.id)">{{ h.text }}</a>
</aside>
<sd-document-builder #builder [option]="option" (contentChange)="refreshToc()"></sd-document-builder>
```

### 4. Export DOCX with header/footer
```ts
this.builder.exportDocx({
  fileName: 'quyet_dinh.doc',
  header: '<p style="text-align:center;font-weight:bold">CÃ”NG TY ABC</p>',
  footer: '<p style="text-align:right;font-size:10pt">Trang <span style="mso-field-code: PAGE"></span>/<span style="mso-field-code: NUMPAGES"></span></p>',
});
```

## Anti-patterns
- DON'T use `<sd-document-builder>` as a generic input on small forms â€” its toolbar is huge; use `<sd-editor>` instead
- DON'T `setContent(html)` on every keystroke â€” use it once on load; rely on `contentChange` for outbound updates
- DON'T forget `option.onDropVariable` validation â€” without it, any variable in the side panel can be dropped, even ones the document type forbids
- DON'T expect `exportDocx` to produce a true `.docx` â€” output is Word-compatible HTML (`application/msword`); ext should be `.doc` or use a server pipeline for true `.docx`
- DON'T mutate the editor model directly from outside â€” go through the public methods or plugin APIs
- DON'T mix raw `[(model)]` two-way binding â€” this component uses `(contentChange)` + `setContent`, not CVA

## Related
- `<sd-editor>` â€” single-field rich text with form integration
- `<sd-mini-editor>` â€” comment-style mini editor with mentions
- `VariablePlugin` / `CkCommentPlugin` / `PageOrientation` â€” internal plugins exposed via `getVariablePluginAPI()` / `getCommentPluginAPI()` / `setOrientation()`


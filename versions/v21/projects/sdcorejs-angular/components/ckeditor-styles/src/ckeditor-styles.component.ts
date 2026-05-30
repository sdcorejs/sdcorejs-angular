import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Styles-only component that loads the global CKEditor 5 stylesheet on demand.
 *
 * Why this exists:
 * - CKEditor's CSS must be global (applies to body-rendered overlays, dialogs, balloons),
 *   which means whichever Angular component declares it must use ViewEncapsulation.None.
 * - Switching encapsulation on the main editor components (`<sd-editor>`, `<sd-mini-editor>`,
 *   `<sd-document-builder>`) would un-scope all their local styles too.
 * - Instead, this tiny no-render component owns the global CSS. The editor components embed
 *   `<sd-ckeditor-styles>` at the top of their template; the CSS is injected once into <head>
 *   the first time any editor instance mounts. Editor components themselves keep
 *   ViewEncapsulation.Emulated.
 *
 * Behavior:
 * - Renders nothing in the DOM (empty template).
 * - Angular dedupes styles per component class — multiple instances inject the <style> tag
 *   only once.
 * - When the host editor component is lazy-loaded, this component's chunk and its CSS travel
 *   with it.
 */
@Component({
  selector: 'sd-ckeditor-styles',
  standalone: true,
  template: '',
  styleUrls: ['../../../assets/scss/ckeditor5.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCKEditorStyles {}

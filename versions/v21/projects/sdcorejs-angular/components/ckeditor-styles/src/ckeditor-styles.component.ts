import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Compatibility stylesheet loader for Core Editor and MiniEditor.
 * @deprecated The CKEditor engine was removed. Editors load their content styles automatically;
 * this selector/export is retained only for existing templates and no longer loads CKEditor CSS.
 */
@Component({
  selector: 'sd-ckeditor-styles',
  standalone: true,
  template: '',
  styleUrl: '../../../assets/scss/ckeditor5.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCKEditorStyles {}

import { EditorConfig } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorImageConfig } from './image-upload.plugin.model';

export interface SdEditorOption {
  imageConfig?: SdEditorImageConfig;
  // i18n service Ä‘Æ°á»£c Angular component inject vÃ o option Ä‘á»ƒ CKEditor plugin (ngoÃ i DI tree) cÃ³ thá»ƒ dá»‹ch
  _i18n?: I18nService;
}

export type EditorOption = EditorConfig & {
  getOption?: () => SdEditorOption;
};


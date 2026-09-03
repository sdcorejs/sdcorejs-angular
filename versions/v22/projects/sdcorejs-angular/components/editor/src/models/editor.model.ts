import { EditorConfig } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorImageConfig } from './image-upload.plugin.model';

export interface SdEditorOption {
  imageConfig?: SdEditorImageConfig;
  // i18n service được Angular component inject vào option để CKEditor plugin (ngoài DI tree) có thể dịch
  _i18n?: I18nService;
}

export type EditorOption = EditorConfig & {
  getOption?: () => SdEditorOption;
};

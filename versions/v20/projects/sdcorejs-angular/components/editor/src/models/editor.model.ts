import { EditorConfig } from 'ckeditor5';
import { SdEditorImageConfig } from './image-upload.plugin.model';

export interface SdEditorOption {
  imageConfig?: SdEditorImageConfig;
}

export type EditorOption = EditorConfig & {
  getOption?: () => SdEditorOption;
};

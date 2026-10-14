import { SdEditorEngineOptions } from '@sdcorejs/angular/components/editor-engine';
export type { SdEditorImportDiagnostic } from '@sdcorejs/angular/components/editor-engine';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorImageConfig } from './image-upload.plugin.model';

export interface SdEditorOption {
  imageConfig?: SdEditorImageConfig;
  /** @deprecated Internal legacy injection field; the component injects localization itself. */
  _i18n?: I18nService;
}

/** @deprecated Use SdEditorOption. CK plugins/config/licenseKey are unsupported. */
export type EditorOption = SdEditorEngineOptions;

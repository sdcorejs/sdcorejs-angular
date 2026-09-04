import { InjectionToken } from '@angular/core';

export interface SdEditorUploadFileDetail {
  idOrKey: string;
  cdn: string;
  name?: string;
}

export type SdEditorUploadFileFuncUpload = (files: File[]) => Promise<SdEditorUploadFileDetail[]>;

export interface ISdEditorConfiguration {
  key?: string;
  upload: SdEditorUploadFileFuncUpload;
}

export const SD_EDITOR_CONFIGURATION = new InjectionToken<ISdEditorConfiguration>('sd.editor.configuration');

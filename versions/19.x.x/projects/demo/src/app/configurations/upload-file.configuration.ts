import { Injectable } from '@angular/core';
import { ISdUploadFileConfiguration, SdUploadFileFuncDetails, SdUploadFileFuncUpload } from '@sdcorejs/angular/components';

@Injectable({
  providedIn: 'root',
})
export class UploadFileConfiguration implements ISdUploadFileConfiguration {
  constructor() {}
  upload: SdUploadFileFuncUpload<undefined> = async files => {
    return [];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: SdUploadFileFuncDetails<any> = async idOrKey => {
    return idOrKey?.map(key => ({
      idOrKey: key as string,
      cdn: key as string,
    }));
  };
}


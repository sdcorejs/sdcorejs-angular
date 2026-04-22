import { Inject, Injectable, Optional } from '@angular/core';
import { SdApiService } from '@sdcorejs/angular/services/api';
import { ISdFirebaseConfiguration, SD_FIREBASE_CONFIG } from './firebase.model';

@Injectable({
  providedIn: 'root',
})
export class SdFirebaseService {
  constructor(
    private apiService: SdApiService,
    @Inject(SD_FIREBASE_CONFIG)
    @Optional()
    private firebaseConfiguration: ISdFirebaseConfiguration
  ) {}

  excel = {
    uploadFile: () => {},
    removeFile: () => {},
  };
}


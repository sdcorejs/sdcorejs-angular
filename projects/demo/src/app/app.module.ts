import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SdTabRouterOutletComponent } from '@sdcorejs/angular/components/tab-router';
import { SdApiModule } from '@sdcorejs/angular/services';
import { AppComponent } from './app.component';
import { SD_UPLOAD_FILE_CONFIGURATION, SD_WORKFLOW_CONFIGURATION, SdButton, SdFormBuilder, SdModal } from '@sdcorejs/angular/components';
import { RouterModule } from '@angular/router';
import { SdDateRange, SdDatetime, SdFormsModule, SdInput, SdSelect, SdSuffixDefDirective } from '@sdcorejs/angular/forms';
import { WorkflowConfiguration } from './configurations/workflow.configuration';
import { SdHoverCopyDirective } from '@sdcorejs/angular/directives';
import { routes } from './app.routes';
import { UploadFileConfiguration } from './configurations/upload-file.configuration';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    SdApiModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    SdTabRouterOutletComponent,
    SdFormBuilder,
    SdInput,
    SdSelect,
    SdDatetime,
    SdDateRange,
    SdButton,
    SdFormsModule,
    SdModal,
    SdSuffixDefDirective,
    SdHoverCopyDirective,
  ],
  providers: [
    { provide: SD_WORKFLOW_CONFIGURATION, useClass: WorkflowConfiguration },
    { provide: SD_UPLOAD_FILE_CONFIGURATION, useClass: UploadFileConfiguration },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}


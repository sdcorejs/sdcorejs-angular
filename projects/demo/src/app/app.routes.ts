import { Routes } from '@angular/router';
import { SidebarMobileDemoComponent } from './pages/sidebar-mobile/sidebar-mobile-demo.component';
import { DemoCodeEditorComponent } from './pages/demo-code-editor.component';
import { DemoInputComponent } from './pages/demo-input.component';
import { FormBuilderComponent } from './pages/form-builder/form-builder.component';
import { SdAnchorDemoV2Component } from './pages/sd-anchor-v2/sd-anchor-demo-v2.component';
import { SdBadgeDemoComponent } from './pages/sd-badge/sd-badge-demo.component';
import { SdButtonDemoComponent } from './pages/sd-button/sd-button.component';
import { SdChipCalendarDemoComponent } from './pages/sd-chip-calendar/sd-chip-calendar.component';
import { SdChipDemoComponent } from './pages/sd-chip/sd-chip-demo.component';
import { SdConfirmServiceDemoComponent } from './pages/sd-confirm-service/sd-confirm-service.component';
import { SdDateDemoComponent } from './pages/sd-date/sd-date-demo.component';
import { DocumentBuilderDemoComponent } from './pages/sd-document-builder/sd-document-builder-demo.component';
import { DemoImportComponent } from './pages/sd-import-excel/import-excel.component';
import { SdInputNumberDemoComponent } from './pages/sd-input-number/sd-input-number-demo.component';
import { SdInputDemoComponent } from './pages/sd-input/sd-input-demo.component';
import { SdMiniEditorDemoComponent } from './pages/sd-mini-editor/sd-mini-editor-demo.component';
import { SdNotifyComponent } from './pages/sd-notify/sd-notify.component';
import { SdQueryBuilderComponent } from './pages/sd-query-builder/sd-query-builder.component';
import { SdSectionDemoComponent } from './pages/sd-section/sd-section.component';
import { SdSelectDemoComponent } from './pages/sd-select/sd-select-demo.component';
import { SdTextAreaDemoComponent } from './pages/sd-textarea/sd-textarea-demo.component';
import { SdUploadFileDemoComponent } from './pages/sd-upload-file/sd-upload-file-demo.component';
import { SdTableDemoComponent } from './pages/sd-table/sd-table-demo.component';
import { SdTableServerDemoComponent } from './pages/sd-table-server/sd-table-server-demo.component';
import { SdChartDemoComponent } from './pages/sd-chart/sd-chart-demo.component';
import { SdEditorDemoComponent } from './pages/sd-editor/sd-editor-demo.component';
import { SdModalDemoComponent } from './pages/sd-modal/sd-modal-demo.component';

export const routes: Routes = [
  {
    path: 'sidebar-mobile',
    component: SidebarMobileDemoComponent,
  },
  {
    path: 'form-builder',
    component: FormBuilderComponent,
  },
  {
    path: 'sd-anchor-v2',
    component: SdAnchorDemoV2Component,
  },
  {
    path: 'sd-badge',
    component: SdBadgeDemoComponent,
  },
  {
    path: 'sd-date',
    component: SdDateDemoComponent,
  },
  {
    path: 'sd-textarea',
    component: SdTextAreaDemoComponent,
  },
  {
    path: 'sd-chip-calendar',
    component: SdChipCalendarDemoComponent,
  },
  {
    path: 'sd-input',
    component: SdInputDemoComponent,
  },
  {
    path: 'sd-upload-file',
    component: SdUploadFileDemoComponent,
  },
  {
    path: 'sd-select',
    component: SdSelectDemoComponent,
  },
  {
    path: 'sd-notify',
    component: SdNotifyComponent,
  },
  {
    path: 'sd-query-builder',
    component: SdQueryBuilderComponent,
  },
  {
    path: 'sd-button',
    component: SdButtonDemoComponent,
  },
  {
    path: 'sd-import-excel',
    component: DemoImportComponent,
  },
  {
    path: 'sd-document-builder',
    component: DocumentBuilderDemoComponent,
  },
  {
    path: 'sd-chip',
    component: SdChipDemoComponent,
  },
  {
    path: 'sd-input-number',
    component: SdInputNumberDemoComponent,
  },
  {
    path: 'sd-section',
    component: SdSectionDemoComponent,
  },
  {
    path: 'sd-confirm-service',
    component: SdConfirmServiceDemoComponent,
  },
  {
    path: 'sd-mini-editor',
    component: SdMiniEditorDemoComponent,
  },
  {
    path: 'demo-input',
    component: DemoInputComponent,
  },
  {
    path: 'demo-code-editor',
    component: DemoCodeEditorComponent,
  },
  {
    path: 'sd-table-demo',
    component: SdTableDemoComponent,
  },
  {
    path: 'sd-table-server',
    component: SdTableServerDemoComponent,
  },
  {
    path: 'sd-chart',
    component: SdChartDemoComponent,
  },
  {
    path: 'sd-editor',
    component: SdEditorDemoComponent,
  },
  {
    path: 'sd-modal',
    component: SdModalDemoComponent,
  },
];

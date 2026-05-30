/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectionList } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdConfirmService, SdExcelColumn, SdExcelService, SdLoadingService, SdNotifyService } from '@sdcorejs/angular/services';
// import hash from 'object-hash';
import { SdTableColumn, SdTableOption } from '../../models';
import { ConfiguredTableResult } from '../../models/table-option-config.model';
import { SdTableOptionExportDefault } from '../../models/table-option-export.model';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdExcelSheet } from '@sdcorejs/angular/services/excel';

@Component({
  selector: 'sd-popup-export',
  templateUrl: './popup-export.component.html',
  styleUrls: ['./popup-export.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatChipsModule, SdButton, SdInput, SdModal],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class SdPopupExport {
  tableOption!: SdTableOption;
  columns: SdExcelColumn[] = [];
  templateName?: string | null;
  enableCreating = false;
  @ViewChild('modal') modal?: SdModal;
  @ViewChild('listGroups') listGroups?: MatSelectionList;

  selected: Record<string, boolean> = {};
  files: any[] = [];

  @Output() export = new EventEmitter<{
    file: any | null;
    columns: SdExcelColumn[];
    isCSV?: boolean;
  }>();
  form = new FormGroup({});

  exportOption?: SdTableOptionExportDefault;
  @Input('tableOption') set _tableOption(option: SdTableOption) {
    this.tableOption = option;
    if (option.export?.type === 'default') {
      this.exportOption = option.export;
    }
    this.columns = this.#getExportableColumns();
  }
  @Input() configuration?: ConfiguredTableResult;
  private get key(): string | null {
    const prefix = '93889e78-f971-4a1d-8c73-fe2321af9233';
    if (!this.exportOption?.key) {
      return null;
    }
    return Utilities.hash({
      prefix,
      key: this.exportOption?.key,
    });
  }

  private get tableColumns() {
    const columns: SdExcelColumn[] = [];
    this.tableOption.columns
      .filter(e => !e.export?.disabled)
      .forEach(column => {
        if (column.type === 'children') {
          column.children
            ?.filter(e => !e.export?.disabled)
            .forEach(childColumn => {
              columns.push({
                title: typeof childColumn.title === 'string' ? childColumn.title : childColumn.title?.title,
                field: childColumn.field,
                width: childColumn.width,
              });
            });
          return;
        }
        columns.push({
          title: typeof column.title === 'string' ? column.title : column.title?.title,
          field: column.field,
          width: column.width,
        });
      });
    return columns.map(e => ({
      field: e.field,
      title: e.title,
      description: e.description,
      width: e.width,
    }));
  }
  private get additionalColumns() {
    return (this.exportOption?.columns?.filter(e => !e.export?.disabled) || []).map(e => ({
      field: e.field,
      title: e.title,
      description: e.description,
      width: e.width,
    }));
  }

  #getExportableColumns = (): SdExcelColumn[] => {
    return [...this.tableColumns, ...this.additionalColumns];
  };

  readonly #i18n = inject(I18nService);
  constructor(
    private ref: ChangeDetectorRef,
    private loadingService: SdLoadingService,
    private excelService: SdExcelService,
    private notifyService: SdNotifyService,
    private confirmService: SdConfirmService
  ) {}

  open = async () => {
    if (!this.key) {
      this.exportDefault();
      return;
    }
    this.loadFiles();
    this.selected = {};
    this.modal?.open();
    this.ref.detectChanges();
  };

  #getExportColumns = (): SdExcelColumn[] => {
    if (this.configuration) {
      const columns = [...this.tableColumns];
      const { firstColumns, secondColumns } = this.configuration;
      const displayColumns: SdTableColumn[] = [...firstColumns, ...secondColumns].reduce<SdTableColumn[]>((first, next) => {
        const column = this.tableOption.columns.find(e => e.field === next.field);
        if (!column) {
          return first;
        }
        if (column.type !== 'children') {
          return [...first, column];
        }
        return [...first, ...column.children];
      }, []);
      const results = displayColumns
        .map(e => ({
          ...e,
          data: columns.find(e1 => e1.field === e.field),
        }))
        .filter(e => !!e.data)
        .map(e => e.data!);
      return [...results, ...this.additionalColumns];
    } else {
      return this.columns;
    }
  };

  exportDefault = () => {
    this.export.emit({
      file: null,
      columns: this.#getExportColumns(),
      isCSV: false,
    });
  };

  exportCSV = () => {
    this.export.emit({
      file: null,
      columns: this.#getExportColumns(),
      isCSV: true,
    });
  };

  loadFiles = async (group: string | undefined = undefined) => {
    // TODO: Fix
    // this.files = await this.exportService.filesInFolder({
    //   key: this.key!,
    //   group,
    // });
    // this.ref.markForCheck();
  };

  #initTemplate = async (fileName?: string) => {
    const sheets: SdExcelSheet[] = [];
    if (Array.isArray(this.exportOption?.sheets)) {
      for (const sheet of this.exportOption.sheets) {
        if (sheet.name && sheet.items && sheet.headers) {
          if (Array.isArray(sheet.items)) {
            sheets.push({
              name: sheet.name,
              items: sheet.items,
              headers: sheet.headers,
            });
          } else {
            sheets.push({
              name: sheet.name,
              items: await sheet.items(),
              headers: sheet.headers,
            });
          }
        }
      }
    }
    return await this.excelService.generateTemplate({
      fileName: fileName || this.exportOption?.fileName,
      columns: this.columns,
      sheets,
    });
  };

  generateTemplate = async () => {
    this.loadingService.start();
    await this.#initTemplate().finally(this.loadingService.stop);
  };

  generateAndUploadTemplate = async (fileName?: string) => {
    const sheets: SdExcelSheet[] = [];
    if (Array.isArray(this.exportOption?.sheets)) {
      for (const sheet of this.exportOption?.sheets) {
        if (sheet.name && sheet.items && sheet.headers) {
          if (Array.isArray(sheet.items)) {
            sheets.push({
              name: sheet.name,
              items: sheet.items,
              headers: sheet.headers,
            });
          } else {
            sheets.push({
              name: sheet.name,
              items: await sheet.items(),
              headers: sheet.headers,
            });
          }
        }
      }
    }
    // TODO: Fix
    // return await this.exportService.generateUploadTemplate({
    //   key: this.key!,
    //   template: {
    //     fileName: fileName || this.tableOption?.export?.fileName,
    //     columns: this.columns.filter(e => this.selected[e.field]),
    //     sheets,
    //   },
    // });
  };

  onExport = (file: any) => {
    this.export.emit({
      file,
      columns: this.columns,
    });
    this.ref.detectChanges();
  };

  uploadTemplate = async () => {
    // TODO: Fix
    // const file = await this.exportService.uploadTemplate({
    //   key: this.key!,
    // });
    // if (file) {
    //   this.files = [...this.files, file];
    //   this.ref.detectChanges();
    // }
  };

  removeFile = (file: any) => {
    this.confirmService.confirm('Remove template').then(() => {
      // TODO: Fix
      // this.exportService.removeFile({
      //   key: this.key!,
      //   fileName: file.fileName,
      // });
      const idx = this.files.indexOf(file);
      this.files.splice(idx, 1);
      this.files = [...this.files];
      this.ref.detectChanges();
    });
  };

  createTemplate = async () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.columns.some(e => this.selected[e.field])) {
      this.notifyService.warning(this.#i18n.t('core.component.table.popup-export.select-columns'));
      return;
    }
    this.loadingService.start();
    const fileName = this.templateName + '.xlsx';
    try {
      const result = await this.generateAndUploadTemplate(fileName);
      // TODO: Fix
      // if (result?.filePath) {
      //   const file: SdExportFile = {
      //     filePath: result.filePath,
      //     fileName: result.fileName,
      //   };
      //   this.onExport(file);
      //   this.templateName = null;
      //   this.enableCreating = false;
      //   this.files = [...this.files, file];
      //   this.ref.detectChanges();
      // }
    } finally {
      this.loadingService.stop();
    }
  };

  templateNameValidator = (val: string): string => {
    const regex = /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/;
    if (!val) {
      return 'Please enter your template name';
    }
    if (val.length > 50) {
      return 'Template name is too long';
    }
    if (!regex.test(val)) {
      return 'Template name only contains letters, numbers and spaces';
    }
    return '';
  };
}


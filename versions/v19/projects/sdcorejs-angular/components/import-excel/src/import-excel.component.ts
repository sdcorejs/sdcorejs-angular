import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { ColumnHiddenPipe } from './pipes/columm-hidden.pipe';
import { SdImportExcelItem, SdImportExcelOption, SdImportExcelValidation } from './import-excel.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdExcelService, SdExcelSheet, SdExcelTemplate, SdExcelTemplateColumn } from '@sdcorejs/angular/services/excel';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { DateUtilities, NumberUtilities } from '@sdcorejs/angular/utilities';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { ColumnTransformPipe } from './pipes/column-transform.pipe';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'sd-import-excel',
  templateUrl: './import-excel.component.html',
  styleUrls: ['./import-excel.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    SdButton,
    SdModal,
    ColumnTransformPipe,
    ColumnHiddenPipe,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinner,
    SdBadge,
    TranslatePipe,
  ],
  providers: [ColumnHiddenPipe],
})
export class SdImportExcel implements OnInit, OnDestroy {
  @Input({ required: true }) option!: SdImportExcelOption;
  @ViewChild(SdModal) modal!: SdModal;
  excelItems: SdImportExcelItem[] = [];
  // originItems: SdExcelItem[] = [];
  hasDescription = false;

  showing: 'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'ALL';
  filteredItems: SdImportExcelItem[] = [];
  viewItems: SdImportExcelItem[] = [];
  numberOfSuccess = 0;
  numberOfError = 0;
  numberOfWarning = 0;
  file?: File;
  #paginator!: MatPaginator;
  #paginatorSub?: Subscription;
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator && this.#paginator !== paginator) {
      this.#paginator = paginator;
      this.#paginatorSub?.unsubscribe(); // Clear cũ
      this.#paginatorSub = paginator.page.subscribe(this.#reload);
      this.#subscription.add(this.#paginatorSub);
    }
  }
  #subscription = new Subscription();
  uploading = false;
  isUploaded = false;
  isDownloadTemplate = false;
  @Output() sdClosed = new EventEmitter();
  readonly #i18n = inject(I18nService);
  constructor(
    private ref: ChangeDetectorRef,
    private excelService: SdExcelService,
    private notifyService: SdNotifyService,
    private columnHiddenPipe: ColumnHiddenPipe,
    private loadingService: SdLoadingService
  ) {}

  ngOnInit() {
    this.isUploaded = false;
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  open = () => {
    this.#reset();
    this.modal.open();
  };

  close = () => {
    this.modal.close();
  };

  #reset = () => {
    this.excelItems = [];
    this.filteredItems = [];
    this.viewItems = [];
    this.numberOfSuccess = 0;
    this.numberOfError = 0;
    this.numberOfWarning = 0;
    this.showing = 'ALL';
  };

  #reload = () => {
    const pageIndex = this.#paginator.pageIndex;
    const pageSize = this.#paginator.pageSize;
    this.filteredItems = this.excelItems.filter(item => {
      const { errorMessages, warningMessages } = item.meta;
      if (this.showing === 'SUCCESS') {
        return !errorMessages.length && !warningMessages.length;
      } else if (this.showing === 'WARNING') {
        return !!warningMessages.length && !errorMessages.length;
      } else if (this.showing === 'ERROR') {
        return !!errorMessages.length;
      }
      return true;
    });
    this.viewItems = this.filteredItems.filter((item, index) => index >= pageIndex * pageSize && index < (pageIndex + 1) * pageSize);

    this.numberOfSuccess = this.excelItems.filter(this.#filterSuccess).length;
    this.numberOfError = this.excelItems.filter(this.#filterError).length;
    this.numberOfWarning = this.excelItems.filter(this.#filterWarning).length;
  };

  #filterError = (item: SdImportExcelItem) => !!item.meta.errorMessages.length;
  #filterWarning = (item: SdImportExcelItem) => item.meta.warningMessages.length && !item.meta.errorMessages.length;
  #filterSuccess = (item: SdImportExcelItem) => !item.meta.errorMessages.length && !item.meta.warningMessages.length;

  upload = async () => {
    try {
      const { transform, validateItem, validateItems } = this.option;
      const { items, file } = await this.excelService.upload();
      this.hasDescription = this.option.columns.some(e => !!e.description);
      const offset = this.hasDescription ? 2 : 1;
      items.splice(0, offset);
      if (items.length === 0) {
        this.notifyService.warning(this.#i18n.t('core.component.import-excel.no-data-in-file'));
        return;
      }
      const limit = this.option.limit || 1000;
      if (items.length > limit) {
        this.notifyService.warning(this.#i18n.t('core.component.import-excel.row-limit', { limit }));
        return;
      }
      this.#reset();
      this.excelItems = items.map<SdImportExcelItem>((data, idx) => ({
        data,
        meta: {
          excelIndex: idx + (this.hasDescription ? 4 : 3),
          origin: { ...data },
          error: {},
          warning: {},
          errorMessages: [],
          warningMessages: [],
        },
      }));

      if (transform) {
        const mappedItems = transform(this.excelItems);
        if (mappedItems instanceof Promise) {
          this.uploading = true;
          this.excelItems = await mappedItems.finally(() => (this.uploading = false));
        } else {
          this.excelItems = mappedItems || this.excelItems;
        }
      }
      this.file = file!;
      this.loadingService.start();
      const validatePromises = this.excelItems.map((item, idx) => this.#validate(item, idx));
      await Promise.all(validatePromises);

      // Nếu không có error thì tiếp tục validate từ option validate truyền vào

      if (!this.excelItems.some(this.#filterError) && validateItems) {
        const results = await validateItems(this.excelItems.map(e => e.data));
        results
          .filter(result => result.idx >= 0)
          .forEach(result => {
            if (result?.errorMessage) {
              this.excelItems[result.idx].meta.errorMessages.push(result.errorMessage);
            }
            if (result?.warningMessage) {
              this.excelItems[result.idx].meta.warningMessages.push(result.warningMessage);
            }
          });
      }

      this.#paginator.pageIndex = 0;
      this.#reload();
      this.ref.detectChanges();

      this.isUploaded = false;
    } catch (err: any) {
      this.notifyService.error(err);
    } finally {
      this.loadingService.stop();
    }
  };

  #validate = async (excelItem: SdImportExcelItem, idx: number) => {
    const {
      data: item,
      meta: { error, errorMessages },
    } = excelItem;
    const { validateItem } = this.option;
    for (const column of this.option.columns) {
      if (!this.columnHiddenPipe.transform(column)) {
        continue;
      }
      try {
        if (column.defaultValue !== undefined) {
          item[column.field] = item[column.field] ?? column.defaultValue;
        } else if (column.required && !item[column.field] && item[column.field] !== 0) {
          error[column.field] = this.#i18n.t('core.component.import-excel.required');
          errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
          continue;
        }
        if (column.type === 'string') {
          const value = (item[column.field] || '').toString();
          if (column.minlength !== undefined && value.length < column.minlength) {
            error[column.field] = this.#i18n.t('core.component.import-excel.min-length', { min: column.minlength });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
          if (column.maxlength !== undefined && value.length > column.maxlength) {
            error[column.field] = this.#i18n.t('core.component.import-excel.max-length', { max: column.maxlength });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
          item[column.field] = value;
        } else if (column.type === 'number') {
          if (item[column.field]) {
            const value = +item[column.field];
            if (!NumberUtilities.isNumber(item[column.field])) {
              error[column.field] = this.#i18n.t('core.component.import-excel.not-a-number', { value: item[column.field] });
              errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
              continue;
            }
            item[column.field] = value;
          }
          if (!item[column.field] && item[column.field] !== 0) {
            item[column.field] = undefined;
          }
          if (column.min !== undefined && item[column.field] < column.min) {
            error[column.field] = this.#i18n.t('core.component.import-excel.below-min', { value: item[column.field], min: column.min });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
          if (column.max !== undefined && item[column.field] > column.max) {
            error[column.field] = this.#i18n.t('core.component.import-excel.above-max', { value: item[column.field], max: column.max });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
        } else if (column.type === 'bool') {
          if (
            item[column.field] === 0 ||
            item[column.field] === '0' ||
            item[column.field] === false ||
            item[column.field]?.toString()?.toLowerCase()?.trim() === 'false'
          ) {
            item[column.field] = false;
          } else if (
            item[column.field] === 1 ||
            item[column.field] === '1' ||
            item[column.field] === true ||
            item[column.field]?.toString()?.toLowerCase()?.trim() === 'true'
          ) {
            item[column.field] = true;
          } else if (item[column.field] === '') item[column.field] = undefined;

          if (typeof item[column.field] !== 'boolean' && item[column.field] !== undefined && item[column.field] !== null) {
            error[column.field] = this.#i18n.t('core.component.import-excel.invalid-bool');
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
          }
        } else if (column.type === 'values') {
          if (item[column.field] && typeof item[column.field] !== 'number' && typeof item[column.field] !== 'string') {
            error[column.field] = this.#i18n.t('core.component.import-excel.invalid-value', { value: item[column.field] });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
          if (column.checkValueInArray && item[column.field] && !column.values.some(e => e.toString() === item[column.field].toString())) {
            error[column.field] = this.#i18n.t('core.component.import-excel.value-not-in-list', {
              value: item[column.field],
              list: column.values.join(),
            });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
        } else if (column.type === 'date' || column.type === 'datetime' || column.type === 'time') {
          const { type, format } = column;
          const val = item[column.field];
          if (val instanceof Date) {
            item[column.field] = val.toISOString();
            continue;
          }
          if (format && item[column.field]) {
            if (typeof val !== 'string') {
              error[column.field] = this.#i18n.t('core.component.import-excel.invalid-date-format', {
                value: val ?? '',
                format: column.format ?? '',
              });
              errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
              continue;
            }
            if (type === 'date' && !this.#isValidDate(format, val)) {
              error[column.field] = this.#i18n.t('core.component.import-excel.invalid-date-format', {
                value: val ?? '',
                format: column.format ?? '',
              });
              errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
              continue;
            }
            if (type === 'time' && !this.#isValidTime(format, val)) {
              error[column.field] = this.#i18n.t('core.component.import-excel.invalid-date-format', {
                value: val ?? '',
                format: column.format ?? '',
              });
              errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
              continue;
            }
            if (type === 'datetime' && !this.#isValidDateTime(format, val)) {
              error[column.field] = this.#i18n.t('core.component.import-excel.invalid-date-format', {
                value: val ?? '',
                format: column.format ?? '',
              });
              errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
              continue;
            }
            item[column.field] = DateUtilities.parseFrom(val, format);
          }
          if (item[column.field] && !DateUtilities.isDate(item[column.field])) {
            error[column.field] = this.#i18n.t('core.component.import-excel.invalid-date-format', {
              value: val ?? '',
              format: column.format ?? '',
            });
            errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
            continue;
          }
        }

        // Nếu pass validation từng column, kiểm tra validation theo hàm validateItem
        if (!errorMessages.length && validateItem) {
          const validation = await validateItem(
            item,
            idx,
            this.excelItems.map(e => e.data)
          );
          if (validation.errorMessage) excelItem.meta.errorMessages.push(validation.errorMessage);
          if (validation.warningMessage) excelItem.meta.warningMessages.push(validation.warningMessage);
        }
      } catch (ex: any) {
        error[column.field] = `${ex?.message || ex?.error || ex || this.#i18n.t('core.component.import-excel.generic-error')}`;
        errorMessages.push(`<strong>[${column.title || column.field}]</strong> ${error[column.field]}`);
      }
    }
  };

  #mapItem = (item: SdImportExcelItem) => {
    const { data } = item;
    return data;
  };

  accept = () => {
    this.option!.accept(
      this.excelItems.map(e => e.data),
      { file: this.file! }
    );
    this.isUploaded = true;
  };

  setValidation = (validations: SdImportExcelValidation[]) => {
    this.excelItems.forEach(e => {
      e.meta.errorMessages = [];
      e.meta.warningMessages = [];
    });
    if (Array.isArray(validations)) {
      validations.forEach(validation => {
        if (validation.errorMessage) {
          this.excelItems[validation.idx].meta.errorMessages = [validation.errorMessage];
        }
        if (validation.warningMessage) {
          this.excelItems[validation.idx].meta.warningMessages = [validation.warningMessage];
        }
      });
    }
    this.#reload();
    this.ref.detectChanges();
  };

  view = (showing: 'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'ALL') => {
    this.showing = showing;
    this.#paginator.pageIndex = 0;
    this.#reload();
  };

  downloadTemplate = async () => {
    const sheets: SdExcelSheet[] = [];
    if (Array.isArray(this.option?.sheets)) {
      for (const sheet of this.option.sheets) {
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
    const columnNotHiddens = this.option.columns.filter(column => this.columnHiddenPipe.transform(column));
    const excelTemplate: SdExcelTemplate = {
      fileName: this.option.fileName || 'Template',
      columns: columnNotHiddens.map(column => {
        return {
          field: column.field,
          title: column.title,
          width: column.width,
          required: column.required,
          description: column.description,
          fontColor: column.fontColor,
          fill: column.fill,
        };
      }),
      sheets,
    };
    this.isDownloadTemplate = true;
    await this.excelService.generateTemplate(excelTemplate).finally(() => {
      this.isDownloadTemplate = false;
    });
  };

  export = async () => {
    this.loadingService.start();
    const columns: SdExcelTemplateColumn[] = [
      {
        field: 'sdMessage',
        title: this.#i18n.t('core.component.import-excel.message-column'),
        width: '250px',
        required: false,
      },
      ...this.option.columns.filter(column => this.columnHiddenPipe.transform(column)),
    ];
    await this.excelService
      .export({
        columns,
        items: this.filteredItems.map(e => {
          let result = {};
          for (const column of columns) {
            result = {
              ...result,
              [column.field]: e.meta.origin?.[column.field],
            };
          }
          return {
            ...result,
            sdMessage: (
              e.meta.errorMessages.join(', ') ||
              e.meta.warningMessages.join(', ') ||
              this.#i18n.t('core.component.import-excel.success')
            )
              ?.replace(/<strong>/g, '')
              .replace(/<\/strong>/g, '')
              .replace(/<br>/g, '\n'),
          };
        }),
      })
      .finally(this.loadingService.stop);
  };

  #isValidDate = (format: string, value: string) => {
    if (value?.length !== format?.length) {
      return false;
    }
    const regex =
      /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
    return regex.test(value);
  };

  #isValidTime = (format: string, value: string) => {
    if (value?.length !== format?.length) {
      return false;
    }
    return true;
  };

  #isValidDateTime = (format: string, value: string) => {
    if (value?.length !== format?.length) {
      return false;
    }
    const dates = value?.split(' ');
    if (dates.length !== 2) {
      return false;
    }
    const date = dates[0];
    if (!this.#isValidDate('dd/MM/yyyy', date)) {
      return false;
    }
    const time = dates[1];
    const regex = /^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[0-5][0-9])$/;
    return regex.test(time);
  };
  onClosed = () => {
    this.sdClosed.emit();
  };
}

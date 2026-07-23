import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdTableCellDefDirective, SdTable, SdTableColumn, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { SdAutocomplete, SdInput, SdInputNumber, SdRadio, SdSearch } from '@sdcorejs/angular/forms';
import { filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericTableColumn, SdFormGenericSelectionItem, SdFormGenericTable } from '../../../../../../models';
import { FormGenericService } from '../../../../../../services';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'lib-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdInput,
    SdInputNumber,
    SdAutocomplete,
    SdUploadFile,
    SdTable,
    SdTableCellDefDirective,
    SdSideDrawer,
    SdButton,
    SdUploadFile,
    SdRadio,
    SdDate,
    SdDatetime,
    // Pipe cho phần viewed
    TranslatePipe,
  ],
})
export class TableComponent implements AfterViewInit, OnDestroy, OnInit {
  private ref = inject(ChangeDetectorRef);
  private readonly formGenericService = inject(FormGenericService);

  @ViewChildren(SdUploadFile) uploadFiles?: QueryList<SdUploadFile>;
  @ViewChild(SdTable) table?: SdTable;
  @ViewChild(SdSideDrawer) sideDrawer?: SdSideDrawer;
  readonly setVariables = input.required<
    Subject<{
      key: string;
      value: any;
    }>
  >();
  readonly form = input(new FormGroup({}));
  component?: SdFormGenericTable;
  col = 'col-6 px-8';
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericTable) {
    this.component = val;
    this.col = `col-${this.component?.layout?.columns || '6'} px-8`;
  }

  required = false;
  @Input('required') set _required(val: boolean | '') {
    this.required = val === '' || val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
    this.#tableChanges.next();
  }

  model: any[] = [];
  @Input('model') set _model(val: any[] | undefined | null) {
    val = val || [];
    if (this.model !== val) {
      this.model = val;
      this.#modelChanges.next(val);
    }
  }
  readonly modelChange = output<any[]>();

  #tableChanges = new Subject<void>();
  #modelChanges = new Subject<string[]>();
  #subscription = new Subscription();
  tableOption?: SdTableOption;
  row: any = {};
  columnValues: Record<string, SdFormGenericSelectionItem[] | SdSearch> = {};
  formRenderColumn: Record<string, SdFormGenericTableColumn> = {};
  // Lấy những fileColumns để định nghĩa cellDef tương ứng
  fileKeys: string[] = [];
  imageKeys: string[] = [];

  #selectedIndex = -1;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit() {
    this.#subscription.add(
      this.setVariables()
        .pipe(filter(variable => variable.key === this.component?.key))
        .subscribe(variable => {
          this.model = variable.value;
          this.#modelChanges.next(this.model);
          this.ref.markForCheck();
        })
    );
  }

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#tableChanges.pipe(startWith('')).subscribe(async () => {
        await this.#initTable();
        this.ref.markForCheck();
      })
    );
    // Khi giá trị thay đổi thì reload lại
    this.#subscription.add(
      this.#modelChanges.pipe(startWith(this.model)).subscribe(async () => {
        await this.#reload();
        this.ref.markForCheck();
      })
    );
  }

  #initTable = async () => {
    // Xử lý columns
    const columns: SdTableColumn[] = [];
    for (const column of this.component?.columns || []) {
      // Ghi nhận lại vào object formRenderColumn để có thể xử lý customType hoặc một vài thuộc tính khác khi render UI
      this.formRenderColumn[column.key] = column;
      const { type, key, label, width } = column;
      if (type === 'string') {
        columns.push({
          type: 'string',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'number') {
        columns.push({
          type: 'number',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'boolean') {
        columns.push({
          type: 'boolean',
          field: key,
          title: label,
          width,
          option: {
            displayOnTrue: column.displayOnTrue,
            displayOnFalse: column.displayOnFalse,
          },
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'date') {
        columns.push({
          type: 'date',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'datetime') {
        columns.push({
          type: 'datetime',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'radio') {
        const { values } = column;
        columns.push({
          type: 'values',
          field: key,
          title: label,
          width: width,
          filter: {
            disabled: true, // Không cần filter
          },
          option: {
            items: values || [],
            valueField: 'value',
            displayField: 'display',
          },
        });
      } else if (type === 'values') {
        const { valuesKey } = column;
        this.columnValues[key] = await this.formGenericService.selection.items(valuesKey, {
          component: this.component,
          column,
          entity: this.form().value,
        });
        if (this.columnValues[key]) {
          if (Array.isArray(this.columnValues[key])) {
            const items = this.columnValues[key];
            columns.push({
              type: 'values',
              field: key,
              title: label,
              width: width,
              filter: {
                disabled: true, // Không cần filter
              },
              option: {
                items: this.columnValues[key],
                valueField: 'value',
                displayField: 'display',
              },
              transform: value => {
                return items.find(t => t.value === value)?.display || '--';
              },
            });
          } else {
            columns.push({
              type: 'lazy-values',
              field: key,
              title: label,
              width: width,
              filter: {
                disabled: true, // Không cần filter
              },
              option: {
                items: this.columnValues[key],
                valueField: 'value',
                displayField: 'display',
              },
            });
          }
        }
      } else if (type === 'image') {
        // Ảnh hay file thì đều là string, nhưng sẽ dùng cellDef để can thiệp hiển thị
        this.imageKeys.push(key); // Ghi nhận lại cột nào là image để can thiệp cellDef
        columns.push({
          type: 'string',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      } else if (type === 'file') {
        // Ảnh hay file thì đều là string, nhưng sẽ dùng cellDef để can thiệp hiển thị
        this.fileKeys.push(key); // Ghi nhận lại cột nào là file để can thiệp cellDef
        columns.push({
          type: 'string',
          field: key,
          title: label,
          width,
          filter: {
            disabled: true, // Không cần filter
          },
        });
      }
    }
    // await this.#onLoaded();
    this.tableOption = {
      type: 'local',
      key: this.component?.key,
      reload: { visible: false },
      config: { visible: false },
      paginate: {
        hidden: true,
        pageSize: 100,
      },
      style: {
        maxHeight: '400px',
      },
      filter: {
        disabled: true,
      },
      items: () => {
        return this.model || [];
      },
      commands: [
        {
          icon: 'edit',
          click: rowData => {
            this.onDetail(rowData);
          },
          hidden: !!this.viewed || !!this.component?.properties?.viewed,
        },
        {
          icon: 'delete',
          click: rowData => {
            const idx = this.model?.indexOf(rowData);
            this.model?.splice(idx, 1);
            this.table?.reload().then(() => this.ref.markForCheck());
          },
          hidden: !!this.viewed || !!this.component?.properties?.viewed,
        },
      ],
      columns,
    };
  };

  #reload = () => {
    return this.table?.reload?.();
  };

  // #onLoaded = async () => {
  //   for (const item of this.model || []) {
  //     for (const column of this.fileColumns) {
  //       const values = item?.[column.key];
  //       if (Array.isArray(values) && values.length) {
  //         const res = await this.documentService.downloadUrls(values);
  //         item[column.key] = res.map((e) => e.pre_signed_url);
  //       }
  //     }
  //   }
  // };

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onDetail = (row?: any) => {
    if (row) {
      this.#selectedIndex = this.model.indexOf(row);
      this.row = row;
    } else {
      this.#selectedIndex = -1;
      this.row = {};
    }
    this.form().markAsUntouched();
    this.form().markAsPristine();
    this.sideDrawer?.open();
  };

  onCancel = () => {
    this.sideDrawer?.close();
  };

  onAccept = (addable?: boolean) => {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    // Nếu là cập nhật thì cập nhật vào trường tương ứng
    if (this.#selectedIndex >= 0) {
      this.model[this.#selectedIndex] = this.row;
    } else {
      this.model = [...(this.model || []), this.row];
    }

    this.modelChange.emit(this.model);
    this.table?.reload();
    this.ref.markForCheck();
    if (!addable) {
      // Nếu không thêm dòng nữa thì đóng luôn
      this.sideDrawer?.close();
    } else {
      // Thêm dòng nữa nhanh
      this.onDetail();
    }
  };

  onFileUploadChange(item: any, key: string, newValue: any) {
    item[key] = newValue;
    this.modelChange.emit(this.model);
  }

  getArgs(key: string): Record<string, any> | undefined {
    const col = this.formRenderColumn[key];
    if (col?.type === 'file' || col?.type === 'image') {
      return col.args;
    }
    return undefined;
  }

  upload = async () => {
    if (this.uploadFiles?.length) {
      // Thực hiện upload tất cả các file đã chọn
      await Promise.all(this.uploadFiles.map(uploadFile => uploadFile.upload()));
    }
  };
}

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
// import * as hash from 'object-hash';
import { Router } from '@angular/router';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdSchema, SdRegister } from '../../models';
import { SdGenericService } from '../../services';
import { ArrayUtilities } from '@sdcorejs/angular/utilities';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-generic-select',
  templateUrl: './generic-select.component.html',
  styleUrl: 'generic-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdAutocomplete, SdSelect, TranslatePipe],
})
export class SelectItemComponent<T> implements OnInit, AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private router = inject(Router);
  private genericService = inject(SdGenericService);

  @ViewChild(SdAutocomplete) autocomplete?: SdAutocomplete;
  @ViewChild(SdSelect) select?: SdSelect;
  @Input() label?: string;
  @Input() name?: string;

  hideInlineError = false;

  @Input('hideInlineError') set _hideInlineError(hideInlineError: boolean | '' | undefined | null) {
    this.hideInlineError = hideInlineError === '' || !!hideInlineError;
  }

  register?: SdRegister<T>;
  schema?: SdSchema<T>;

  module?: string;
  @Input('module') set _module(val: string) {
    this.module = val;
    this.#changes.next();
  }

  typeCode?: string;
  @Input('typeCode') set _typeCode(val: string) {
    this.typeCode = val;
    this.#changes.next();
  }

  #changes = new Subject<void>();
  model: any | any[];

  @Input('model') set _model(val: any) {
    if (this.model !== val) {
      this.model = val;
      this.#modelChanges.next(val);
    }
  }

  #modelChanges = new Subject<string[]>();
  currentItems: any[];

  @Input() form?: FormGroup;

  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  multiple = false;
  @Input('multiple') set _multiple(val: boolean | '' | undefined | null) {
    this.multiple = val === '' || !!val;
  }

  // Khi sử dụng multiple trong form detail, sẽ cần truyền để biết nó đang multiple theo key nào
  relationMappedTo: string;
  @Input('relationMappedTo') set _relationMappedTo(val: string) {
    this.relationMappedTo = val;
    this.#queryChanges.next(Utilities.generateUuid());
  }

  // Khi sử dụng multiple trong form detail, sẽ cần truyền nếu là update, nếu tạo mới thì để trống
  relationType: PropertyRelationType;

  @Input('relationType') set _relationType(val: PropertyRelationType) {
    this.relationType = val;
    this.#queryChanges.next(Utilities.generateUuid());
  }

  #multipleRelationValue: string;

  @Input('multipleRelationValue') set _multipleRelationValue(val: string) {
    this.#multipleRelationValue = val;
    this.#queryChanges.next(Utilities.generateUuid());
  }

  valueField?: string;
  @Input('valueField') set _valueField(val: string | undefined | null) {
    this.valueField = val ?? undefined;
  }

  displayField?: string;
  @Input('displayField') set _displayField(val: string | undefined | null) {
    this.displayField = val ?? undefined;
  }

  moreFields: string[];

  @Input('moreFields') set _moreFields(val: string[]) {
    this.moreFields = val;
  }

  displayTransform: string;

  @Input('displayTransform') set _displayTransform(val: string) {
    this.displayTransform = val;
  }

  query: Record<string, any> = {};

  @Input('query') set _query(val: Record<string, any>) {
    this.query = val || {};
    this.#queryChanges.next(Utilities.generateUuid());
  }

  addable = false;
  @Input('addable') set _addable(val: boolean | '' | undefined | null) {
    this.addable = val === '' || !!val;
  }

  editable = false;
  @Input('editable') set _editable(val: boolean | '' | undefined | null) {
    this.editable = val === '' || !!val;
  }

  viewable = false;
  @Input('viewable') set _viewable(viewable: boolean | '' | undefined | null) {
    this.viewable = viewable === '' || !!viewable;
  }

  @ViewChild(PopupDetailComponent) popupDetail: PopupDetailComponent;
  @ViewChild(PopupSelectItemComponent) popupSelectItem: PopupSelectItemComponent;
  @Output() modelChange = new EventEmitter<any>();
  @Output() sdChange = new EventEmitter<any>();
  @Output() sdSelection = new EventEmitter<T[]>();
  #queryChanges = new Subject<string>();
  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.#subscription.add(
      this.#changes.pipe(startWith('')).subscribe(async () => {
        if (this.module && this.typeCode) {
          this.register = this.genericService.getRegister(this.module, this.typeCode);
          this.schema = await this.register.schema();
          // Mặc định lấy valueField là primaryKey của model
          this.valueField = this.valueField ?? this.schema.valueField ?? this.schema.primaryKey;
          this.displayField = this.displayField ?? this.schema.displayField ?? this.schema.primaryKey;
        }
      })
    );
    this.#subscription.add(
      this.#queryChanges.pipe(startWith(Utilities.generateUuid())).subscribe(prefix => {
        if (this.relationMappedTo && this.#multipleRelationValue && this.relationType === 'OneToMany') {
          this.cacheChecksum = Utilities.hash({
            prefix,
            ...this.query,
            [this.relationMappedTo]: this.#multipleRelationValue,
          });
        } else {
          this.cacheChecksum = Utilities.hash({
            prefix,
            ...this.query,
          });
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#modelChanges.pipe(startWith(this.model)).subscribe(val => {
        if (val) {
          if (this.multiple) {
            const hasObject = val?.some(i => typeof i !== 'string' && typeof i !== 'number');
            if (hasObject) {
              this.model = val?.map?.(item => item[this.valueField]);
            }
          } else {
            if (typeof val !== 'string' && typeof val !== 'number') {
              this.model = val[this.valueField];
            }
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onModelChange = (val: any) => {
    this.model = val;
    this.modelChange.emit(val);
    this.sdChange.emit(val);
  };

  getSelectedItems = () => {
    return (
      this.currentItems?.filter(t =>
        Array.isArray(this.model) ? this.model.includes(t[this.valueField]) : [this.model].includes(t[this.valueField])
      ) || []
    );
  };

  onAutocompleteChange = (item: any) => {
    this.sdSelection.emit(item);
  };

  onSelectChange = (args: { value: any | any[]; item?: any; items?: any[] }) => {
    if (this.multiple) {
      this.sdSelection.emit(args?.items || []);
    } else {
      this.sdSelection.emit(args?.item);
    }
    this.ref.markForCheck();
  };

  onPopupSelectChange = async (items: Record<string, any>[]) => {
    if (this.multiple) {
      this.model = ArrayUtilities.distinct([...(this.model || []), ...(items || []).map(item => item[this.valueField])]);
      this.sdChange.emit(this.model);
      this.modelChange.emit(this.model);
      this.sdSelection.emit(items || []);
    } else {
      if (items.length) {
        this.model = items?.[0]?.[this.valueField];
        this.modelChange.emit(this.model);
        this.sdChange.emit(this.model);
        this.sdSelection.emit(items?.[0]);
      }
    }
  };

  // Thêm element mới
  onAdd = async (entity: BaseEntity) => {
    if (this.multiple) {
      this.onModelChange([...(this.model || []), entity[this.valueField]]);
      // TODO: Submit selected
    } else {
      this.onModelChange(entity[this.valueField]);
      // TODO: Submit selected
    }
    // Update cache checksum
    this.#queryChanges.next(Utilities.generateUuid());
    await this.items();
    this.ref.markForCheck();
    // if (entity?.sdNew && !this.newEntities.some(e => e[this.valueField] === entity[this.valueField])) {
    //   this.newEntities.push(entity);
    //   // Set giá trị cho model sau khi add entity mới
    //   if (this.multiple) {
    //     this.onModelChange([...(this.model || []), entity[this.valueField]]);
    //     // TODO: Submit selected
    //     // this.sdSelection.emit(this.model);
    //   } else {
    //     this.onModelChange(entity[this.valueField]);
    //     this.sdSelection.emit(entity);
    //   }
    //   // Update cache checksum
    //   this.#queryChanges.next(Utilities.generateUuid());
    //   await this.items();
    //   this.ref.markForCheck();
    // }
  };

  onUpdate = async (entity: BaseEntity) => {
    // if (!entity?.[this.valueField]) {
    //   return;
    // }
    // const foundEntity = this.newEntities.find(e => e[this.valueField] === entity[this.valueField]);
    // if (foundEntity) {
    //   Object.assign(foundEntity, entity);
    // }
  };

  items = async (searchText?: any | any[], isFormValue?: boolean): Promise<any[]> => {
    const query = {
      ...this.query,
      // Nếu là multiple thì chỉ load giá trị
      ...(this.relationMappedTo &&
        this.#multipleRelationValue &&
        this.relationType === 'OneToMany' && {
          [this.relationMappedTo]: [this.#multipleRelationValue],
        }),
    };
    // Nếu là multiple và là tạo mới thì không load dữ liệu
    // if (this.multiple && this.#isCreate) {
    //   return [...this.newEntities].map(e => ({
    //     ...e,
    //     displayTransform: this.displayTransform ? String.templateToDisplay(this.displayTransform, e) : undefined,
    //   }));
    // }
    if (isFormValue) {
      // Xử lý không gửi lên giá trị các newEntities
      searchText = Array.isArray(searchText) ? searchText : [searchText];
      // searchText = searchText.filter((text: string) => text && this.newEntities.every(entity => entity[this.valueField] !== text));
      this.currentItems = [
        ...(await this.register.search({
          searchText,
          field: this.valueField,
          isFormValue,
          query,
        })),
        // ...this.newEntities,
      ].map(e => ({
        ...e,
        displayTransform: this.displayTransform ? String.templateToDisplay(this.displayTransform, e) : undefined,
      }));
      // TODO: andn1 đặt tạm dòng này để lấy đc full thông tin những item đc chọn khi vào trang detail/edit
      this.sdSelection.emit(this.currentItems?.filter(t => searchText.includes(t.code)) || []);
      return this.currentItems;
    }
    this.currentItems = [
      ...(await this.register.search({
        searchText,
        field: [this.valueField, this.displayField, ...(this.moreFields || [])],
        isFormValue,
        query,
      })),
      // ...this.newEntities,
    ].map(e => ({
      ...e,
      displayTransform: this.displayTransform ? String.templateToDisplay(this.displayTransform, e) : undefined,
    }));
    return this.currentItems;
  };
  onAddItem = () => {
    this.popupDetail.open({
      module: this.module,
      typeCode: this.typeCode,
      relationMappedTo: this.relationMappedTo,
      action: 'create',
    });
  };

  onViewDetail = async ($event: Event, item) => {
    $event.stopPropagation();
    $event?.preventDefault();
    if (!this.permission.detail) {
      return;
    }
    this.popupDetail.open({
      module: this.module,
      typeCode: this.typeCode,
      item,
      action: 'view',
    });
  };

  onSearch = async (event?: Event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    this.popupSelectItem.open(this.query);
  };

  navigateDetail = async ($event: Event, item: any) => {
    $event?.stopPropagation();
    $event?.preventDefault();
    if (!this.permission.detail) {
      return;
    }
    this.autocomplete?.autocompleteTrigger?.closePanel();
    this.selectEditor?.matSelect?.close();
    const menuId = await this.menuService.getMenuId(this.module, this.typeCode);
    this.router.navigate(['core-commerce', 'main', menuId, 'detail', item.id]);
  };

  navigate = async () => {
    const menuId = await this.menuService.getMenuId(this.module, this.typeCode);
    this.router.navigate(['core-commerce', 'main', menuId, 'detail', this.model]);
  };
}

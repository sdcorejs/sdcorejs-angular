/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CdkDragDrop, CdkDragMove, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { debounceTime, startWith, Subject, Subscription } from 'rxjs';
import {
  FormBuilderComponent,
  FormBuilderComponents,
  GenerateId,
  GenerateKey,
  SdFormGenericComponent,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../models';
import { SdFormGenericValidation } from '../../models/form-generic-validation.model';
import { SdFormGeneric } from '../../models/form-generic.model';
import { SdFormRender } from '../form-render/form-render.component';
import {
  CheckboxAttribute,
  CheckboxControl,
  ChipCalendarAttribute,
  ChipCalendarControl,
  ChipStringAttribute,
  ChipStringControl,
  DatetimeAttribute,
  DatetimeControl,
  HtmlAttribute,
  HtmlControl,
  NumberAttribute,
  NumberControl,
  RadioAttribute,
  RadioControl,
  SelectAttribute,
  SelectControl,
  TableAttribute,
  TableControl,
  TextareaAttribute,
  TextareaControl,
  TextfieldAttribute,
  TextFieldControl,
  UploadAttribute,
  UploadControl,
} from './components';
import { ConfigureValidationComponent } from './components/configure-validation/configure-validation.component';
import { BuilderService } from './services';

interface DragDropRowItem {
  items: (SdFormGenericComponent | SdFormGenericGroup)[];
  rowIndex?: number;
}

@Component({
  selector: 'sd-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    DragDropModule,
    // Core Pipes
    SdSafeHtmlPipe,
    // Controls
    TextFieldControl,
    TextfieldAttribute,
    TextareaControl,
    TextareaAttribute,
    ChipStringControl,
    ChipStringAttribute,
    ChipCalendarControl,
    ChipCalendarAttribute,
    NumberControl,
    NumberAttribute,
    SelectControl,
    SelectAttribute,
    DatetimeControl,
    DatetimeAttribute,
    RadioControl,
    RadioAttribute,
    CheckboxControl,
    CheckboxAttribute,
    HtmlControl,
    HtmlAttribute,
    UploadControl,
    UploadAttribute,
    TableControl,
    TableAttribute,
    SdModal,
    SdInput,
    SdTextarea,
    SdButton,
    SdFormRender,
    ConfigureValidationComponent,
  ],
})
export class SdFormBuilder extends SdBaseSecureComponent {
  @ViewChild('popupViewJSON') popupViewJSON?: SdModal;
  @ViewChild('popupConfigureVariables') popupConfigureVariables?: SdModal;
  @ViewChild(ConfigureValidationComponent) configureValidation?: ConfigureValidationComponent;
  @ViewChild(SdFormRender) formRender?: SdFormRender;
  form = new FormGroup({});
  constructor(
    private ref: ChangeDetectorRef,
    private notifyService: SdNotifyService,
    private confirmService: SdConfirmService,
    private builderService: BuilderService
  ) {
    super();
  }
  components: Required<SdFormGeneric>['components'] = [];
  variables: Required<SdFormGeneric>['variables'] = [];
  validations: Required<SdFormGeneric>['validations'] = [];
  // @Input('components') set _components(components: (SdFormGenericComponent | SdFormGenericGroup)[] | undefined | null) {
  //   // LuÃ´n clone components Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng Ä‘áº¿n tham sá»‘ truyá»n vÃ o
  //   if (Array.isArray(components)) {
  //     this.components = JSON.parse(JSON.stringify(components));
  //   } else {
  //     this.components = [];
  //   }
  //   this.#componentsChanges.next();
  // }

  // Má»—i láº§n má»Ÿ popup thÃ¬ sá»­ dá»¥ng clone variables vÃ o clonedVariables, khi nÃ o báº¥m ok thÃ¬ má»›i gÃ¡n ngÆ°á»£c láº¡i clonedVariables vÃ o variables
  clonedVariables: SdFormGenericVariable[] = [];
  // @Input('variables') set _variables(variables: SdFormGenericVariable[] | undefined | null) {
  //   // LuÃ´n clone components Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng Ä‘áº¿n tham sá»‘ truyá»n vÃ o
  //   if (Array.isArray(variables)) {
  //     this.variables = JSON.parse(JSON.stringify(variables));
  //   } else {
  //     this.variables = [];
  //   }
  //   this.#variablesChanges.next();
  // }

  @Input('formGeneric') set _formGeneric(formGeneric: SdFormGeneric) {
    // LuÃ´n clone (JSONS stringfy) Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng Ä‘áº¿n tham sá»‘ truyá»n vÃ o
    // Xá»­ lÃ½ gÃ¡n components
    if (Array.isArray(formGeneric?.components)) {
      this.components = JSON.parse(JSON.stringify(formGeneric?.components));
    } else {
      this.components = [];
    }
    this.#componentsChanges.next();
    // Xá»­ lÃ½ gÃ¡n variables
    if (Array.isArray(formGeneric?.variables)) {
      this.variables = JSON.parse(JSON.stringify(formGeneric?.variables));
    } else {
      this.variables = [];
    }
    this.#variablesChanges.next();
    // Xá»­ lÃ½ gÃ¡n validations
    if (Array.isArray(formGeneric?.validations)) {
      this.validations = JSON.parse(JSON.stringify(formGeneric?.validations));
    } else {
      this.validations = [];
    }
    this.#validationsChanges.next();
  }

  formBuilderComponents = FormBuilderComponents;
  selectedComponent?: SdFormGenericComponent | SdFormGenericGroup;
  expand = true;
  dragDropRows: DragDropRowItem[] = [];
  isDragging = false;
  targetItem?: DragDropRowItem = undefined;

  #componentsChanges = new Subject<void>();
  #variablesChanges = new Subject<void>();
  #validationsChanges = new Subject<void>();
  #subscription = new Subscription();
  isPreview = false;
  ngOnInit() {
    this.#subscription.add(
      this.#componentsChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        // Khi component thay Ä‘á»•i thÃ¬ sync láº¡i
        this.#syncComponentsToRows();
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.#variablesChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        // Khi component thay Ä‘á»•i thÃ¬ sync láº¡i
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.#validationsChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        // Khi component thay Ä‘á»•i thÃ¬ sync láº¡i
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  addComponent = (item: FormBuilderComponent, index?: number) => {
    const id = GenerateId();
    const key = GenerateKey();
    const formRenderComponent: SdFormGenericComponent = {
      id,
      key,
      type: item.type as any,
      label: item.type,
      layout: {
        columns: '12',
      },
      validate: {
        required: false,
      },
      disabled: false,
      properties: {},
    };
    if (index !== undefined) {
      this.components.splice(index, 0, formRenderComponent);
    } else {
      this.components.push(formRenderComponent);
    }

    this.#recountTabIndex();
    this.selectedComponent = this.components?.find(component => component.id === id);
    this.selectComponent(this.selectedComponent);
    this.ref.markForCheck();
  };

  removeComponent = (id: string) => {
    this.components = this.components.filter((t: { id: string }) => t.id !== id);
    this.#recountTabIndex();
  };

  selectComponent = (item?: SdFormGenericComponent | SdFormGenericGroup) => {
    this.selectedComponent = item;
    this.ref.markForCheck();
  };

  onClickedOutside = (e: any) => {
    const classList = (e.target as Element).classList;
    if (!classList.length || classList.contains('components') || classList.contains('cdk-drop-list')) {
      this.selectedComponent = undefined;
    }
  };

  clickFormContentEmpty = () => {
    if (!this.dragDropRows?.length) {
      this.selectedComponent = undefined;
    }
  };

  drop = (event: CdkDragDrop<any[]>) => {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.#syncRowsToComponents();
      // xá»­ lÃ½ kÃ©o chÃ©o
      if (!event.isPointerOverContainer) {
        const dragItemId = event.item.element.nativeElement.id;
        if (dragItemId) {
          const dragItem = this.components.find((t: { id: string }) => t.id === dragItemId);
          this.xuLyKeoCheo(dragItem);
        }
      }
    } else {
      const drop = event.previousContainer.data[0];
      if ('icon' in drop) {
        // transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        const droppedItem = event.previousContainer.data[event.previousIndex] as FormBuilderComponent;
        const rowIndex = event.currentIndex;
        const rowItem = this.dragDropRows?.find(t => t.rowIndex === rowIndex);
        if (rowItem) {
          this.addComponent(droppedItem, +(rowItem.items[0]?.layout?.row || 12) - 1);
          // this.addComponent(droppedItem, parseInt(rowItem.items[rowItem.items.length - 1].layout.row, 0));
        } else {
          this.addComponent(droppedItem);
        }
      } else {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      }
    }
    this.#recountTabIndex();
  };

  dragStartComponentItem = (event: any) => {
    this.isDragging = true;
  };

  dragEndComponentItem = (event: any) => {
    this.isDragging = false;
  };

  onMouseover = (event: MouseEvent, rowItem: DragDropRowItem) => {
    if (this.isDragging) {
      this.targetItem = rowItem;
    }
  };

  // Mouseover thÃ¬ pháº£i cÃ³ Focus khÃ´ng thÃ¬ tháº» sáº½ bÃ¡o lá»—i
  onFocus = (event: FocusEvent) => {
    //console.log(event);
  };

  xuLyKeoCheo = (dragItem?: SdFormGenericComponent | SdFormGenericGroup) => {
    if (dragItem) {
      if (this.targetItem) {
        // kiá»ƒm tra target Ä‘Ã£ full column chÆ°a?
        const totalColumnInRow = this.targetItem.items.map(t => +t.layout!.columns || 12).reduce((acc, curr) => acc + curr, 0);
        if (totalColumnInRow + +dragItem.layout!.columns <= 12) {
          // xÃ³a vá»‹ trÃ­ cÅ©
          this.dragDropRows.forEach(t => {
            if (t.items.some((k: { id: any }) => k.id === dragItem.id)) {
              t.items = t.items.filter((k: { id: any }) => k.id !== dragItem.id) || [];
            }
          });
          // thÃªm vÃ o vá»‹ trÃ­ má»›i
          this.targetItem.items.push(dragItem);
          this.#syncRowsToComponents();
        } else {
          this.notifyService.warning('KhÃ´ng thá»ƒ di chuyá»ƒn tá»›i dÃ²ng nÃ y vÃ¬ tá»•ng kÃ­ch thÆ°á»›c vÆ°á»£t quÃ¡ 12 cá»™t');
        }
      }
    }
    this.targetItem = undefined;
  };

  noReturnPredicate = () => {
    return false;
  };

  #recountTabIndex = () => {
    // TrÃ¡nh dÃ¹ng map vÃ¬ nÃ³ sáº½ sinh ra reference má»›i
    this.components.forEach((item, index) => {
      if (item.layout) {
        item.layout!.row = `${index + 1}`;
        item.layout!.columns = item.layout?.columns || '12';
      } else {
        item.layout = {
          row: `${index + 1}`,
          columns: '12',
        };
      }
    });
    if (this.selectedComponent && this.selectedComponent?.layout?.row) {
      this.selectedComponent.layout.row = this.components.find(t => t.id === this.selectedComponent?.id)?.layout?.row;
    }
    this.#syncComponentsToRows();
  };

  // HÃ m xá»­ lÃ½ chuyá»ƒn Ä‘á»•i components -> dragDropRows
  // Dá»±a vÃ o columns cá»§a component Ä‘á»ƒ quyáº¿t Ä‘á»‹nh dragDropRows cÃ³ bao nhiÃªu items trÃªn row, Ä‘áº£m báº£o columns tá»•ng sá»‘ items <= 12
  #syncComponentsToRows = () => {
    this.dragDropRows = [];
    for (const component of this.components) {
      // láº¥y dÃ²ng cuá»‘i cÃ¹ng cá»§a dragDropList
      let lastRow: DragDropRowItem = { rowIndex: this.dragDropRows.length, items: [] };
      if (this.dragDropRows.length) {
        lastRow = this.dragDropRows[this.dragDropRows.length - 1];
      } else {
        this.dragDropRows.push(lastRow);
      }
      // tÃ­nh tá»•ng cá»™t trÃªn 1 dÃ²ng
      const columns = +component.layout!.columns || 12;
      const totalColumnInRow = lastRow.items.map(t => +t.layout!.columns || 12).reduce((acc: number, curr) => acc + curr, 0);
      if (+totalColumnInRow + columns <= 12) {
        lastRow.items.push(component);
      } else {
        const newRow = { rowIndex: this.dragDropRows.length, items: [component] };
        this.dragDropRows.push(newRow);
      }
    }
  };

  // HÃ m xá»­ lÃ½ chuyá»ƒn Ä‘á»•i dragDropRows -> components
  // VÃ¬ khi kÃ©o tháº£ sáº½ thay Ä‘á»•i vá»‹ trÃ­, do Ä‘Ã³ cáº§n sáº¯p xáº¿p láº¡i components
  #syncRowsToComponents = () => {
    // ráº£i data ma tráº­n droplist => schema.components
    this.components = this.dragDropRows?.map(e => e.items)?.reduce((current, next) => [...current, ...next], []) || [];
  };

  changeSizeControl = async (
    event: CdkDragMove<SdFormGenericComponent | SdFormGenericGroup>,
    item: SdFormGenericComponent | SdFormGenericGroup,
    items: (SdFormGenericComponent | SdFormGenericGroup)[],
    currentIndex: number
  ) => {
    // const totalColumnInRow = items.map(k => k.layout.columns).reduce((acc, curr) => acc + parseInt(curr, 0), 0);
    const totalColumnBeforeItem = items
      .map(k => +k.layout!.columns || 12)
      .reduce((acc, curr, index) => {
        if (index < currentIndex) {
          acc = acc + curr;
        }
        return acc;
      }, 0);
    const rect = document.getElementById('frmComponent')?.getBoundingClientRect() as DOMRect;
    const left = rect.left;
    const right = rect.right - left;
    const mouse = event.pointerPosition.x - left!;
    const t = Math.round(12 / (100 / ((100 * mouse) / right))) - totalColumnBeforeItem;
    if (t > 12) {
      item.layout!.columns = '12';
    } else if (t < 2) {
      item.layout!.columns = '2';
    } else {
      item.layout!.columns = `${t}` as any;
    }

    //     document.getElementById('test').innerHTML = `<pre>
    // left: ${left}
    // right: ${document.getElementById('frmComponent').getBoundingClientRect().right}
    // right-left: ${right}
    // mouse: ${event.pointerPosition.x}
    // mouse-left: ${mouse}
    // t: ${t}
    // columns: ${item.layout.columns}
    // </pre>`;
  };

  dragEndChangeSizeControl = (event: any) => {
    this.#recountTabIndex();
  };

  onChangeViewed = (component: SdFormGenericComponent) => {
    component.properties!.viewed = !component.properties!.viewed;
    // Emit khi cÃ³ sá»± thay Ä‘á»•i Ä‘á»ƒ control vÃ  attribute láº¯ng nghe vÃ  render láº¡i
    this.builderService.componentEmitters.next(component);
  };

  onChangeHidden = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    component.properties!.hidden = !component.properties!.hidden;
    // Emit khi cÃ³ sá»± thay Ä‘á»•i Ä‘á»ƒ control vÃ  attribute láº¯ng nghe vÃ  render láº¡i
    this.builderService.componentEmitters.next(component);
  };

  // Duplicate component nhÆ°ng sáº½ clear id vÃ  key Ä‘á»ƒ trÃ¡nh trÃ¹ng láº·p
  onDuplicate = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    const clonedComponent = JSON.parse(JSON.stringify(component));
    clonedComponent.id = GenerateId();
    clonedComponent.key = GenerateKey();
    this.components.push(clonedComponent);
    this.#recountTabIndex();
    this.selectedComponent = this.components?.find(t => t.id === clonedComponent.id);
    this.selectComponent(this.selectedComponent);
    this.ref.markForCheck();
  };

  // Copy form hiá»‡n táº¡i
  jsonString?: string;
  viewJSON = () => {
    this.jsonString = JSON.stringify({ components: this.components });
    this.popupViewJSON?.open();
    this.ref.markForCheck();
  };

  updateJSON = () => {
    try {
      if (this.jsonString) {
        const json: Record<string, any> = JSON.parse(this.jsonString);
        if ('components' in json) {
          this.components = json['components'];
          this.popupViewJSON?.close();
          this.#syncComponentsToRows();
          this.ref.markForCheck();
        } else {
          throw new Error('Invalid JSON');
        }
      }
    } catch (err: any) {
      console.error(err);
      this.notifyService.warning(err?.message);
    }
  };

  configureVariables = () => {
    this.clonedVariables = JSON.parse(JSON.stringify(this.variables || []));
    this.popupConfigureVariables?.open();
    this.ref.markForCheck();
  };

  addVariables = () => {
    this.clonedVariables.push({
      id: SdUtilities.randomId(),
      key: '',
      label: '',
    });
  };

  removeVariables = (id: string) => {
    const idx = this.clonedVariables.findIndex(e => e.id === id);
    this.clonedVariables.splice(idx, 1);
  };

  updateVariables = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ref.markForCheck();
      return;
    }
    this.variables = this.clonedVariables;
    this.popupConfigureVariables?.close();
    this.ref.markForCheck();
  };

  // ChÃ¬a ra cho bÃªn ngoÃ i láº¥y components hiá»‡n táº¡i
  getComponents = (): (SdFormGenericComponent | SdFormGenericGroup)[] => {
    this.#syncRowsToComponents();
    return JSON.parse(JSON.stringify(this.components || []));
  };

  // ChÃ¬a ra cho bÃªn ngoÃ i láº¥y variables hiá»‡n táº¡i
  getVariables = (): SdFormGenericVariable[] => {
    return JSON.parse(JSON.stringify(this.variables || []));
  };

  #getValidations = (): SdFormGenericValidation[] => {
    return JSON.parse(JSON.stringify(this.validations || []));
  };

  getForm = (): SdFormGeneric => {
    return {
      components: this.getComponents(),
      variables: this.getVariables(),
      validations: this.#getValidations(),
    };
  };

  openConfigureValidation = () => {
    this.configureValidation?.open(this.getForm());
  };

  onUpdateValidations = (validations: SdFormGenericValidation[]) => {
    this.validations = validations;
  };

  onValidate = async () => {
    const errorMessages = await this.formRender?.getValidationMessages('error');
    if (errorMessages?.length) {
      this.notifyService.error(errorMessages);
      return;
    }
    const warningMessages = await this.formRender?.getValidationMessages('warning');
    if (warningMessages?.length) {
      this.confirmService.confirm(warningMessages.join(', ')).then(() => {
        this.notifyService.success('Submit success');
      });
    } else {
      this.notifyService.success('Submit success');
    }
  };
}


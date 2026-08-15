import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { sdFormatComponent, SdFormGenericTable } from '../../../../../models';
import { BuilderService } from '../../../services';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'table-control',
  templateUrl: './table-control.component.html',
  styleUrl: './table-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TableControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericTable;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericTable) {
    if (this.component !== component) {
      this.component = component;
      sdFormatComponent(this.component);
    }
  }

  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  columnIcon = (type: string) => {
    switch (type) {
      case 'number':
        return '123';
      case 'date':
      case 'datetime':
        return 'calendar_month';
      case 'boolean':
        return 'check_box';
      case 'file':
        return 'attach_file';
      case 'image':
        return 'image';
      case 'values':
      case 'radio':
        return 'radio_button_checked';
      case 'string':
      default:
        return 'text_fields';
    }
  };

  sampleRows = () => [0, 1, 2];

  cellPreview = (column: any, rowIndex: number) => {
    if (rowIndex === 0) return column.key || column.label || '-';
    if (column.type === 'number') return rowIndex + 1;
    if (column.type === 'boolean') return rowIndex === 1 ? '✓' : '—';
    if (column.type === 'date' || column.type === 'datetime') return '12/06/2026';
    if (column.type === 'file') return '—';
    return rowIndex === 1 ? 'Sample value' : '—';
  };
}

import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFormGenericOption } from '../../../models/form-generic-field.model';

export interface OptionsChange {
  readonly options: SdFormGenericOption[];
  /** Gõ liên tục vào cùng một ô được gộp thành một bước undo. */
  readonly coalesceKey?: string;
}

/**
 * Danh sách lựa chọn tĩnh (select/radio): giá trị + nhãn, thêm/xoá, kéo tay nắm để sắp xếp (↑/↓
 * trên tay nắm cho bàn phím). Luôn phát MẢNG MỚI — không sửa mảng của schema tại chỗ; thuộc tính
 * khác của lựa chọn (vd `disabled`) được giữ nguyên khi sửa giá trị/nhãn.
 */
@Component({
  selector: 'fb-options-editor',
  templateUrl: './options-editor.component.html',
  styleUrl: './options-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, SdIcon, SdTranslatePipe],
})
export class OptionsEditorComponent {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<readonly SdFormGenericOption[]>();
  readonly optionsChange = output<OptionsChange>();

  readonly rows = computed(() => this.options() ?? []);
  /** Giá trị bị trùng — cảnh báo vì radio/select không phân biệt được hai lựa chọn cùng giá trị. */
  readonly duplicates = computed(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const option of this.rows()) {
      const value = `${option?.value ?? ''}`;
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    }
    return duplicates;
  });

  update(index: number, field: 'value' | 'label', value: string): void {
    const next = this.rows().map((option, position) => (position === index ? { ...option, [field]: value } : option));
    this.optionsChange.emit({ options: next, coalesceKey: `option:${index}:${field}` });
  }

  add(): void {
    const taken = new Set(this.rows().map(option => `${option.value}`));
    let index = this.rows().length + 1;
    while (taken.has(`option_${index}`)) index += 1;
    this.optionsChange.emit({ options: [...this.rows(), { value: `option_${index}`, label: '' }] });
  }

  remove(index: number): void {
    this.optionsChange.emit({ options: this.rows().filter((_, position) => position !== index) });
  }

  /** Đổi chỗ `from` → `to` (một bước undo). */
  move(from: number, to: number): void {
    const rows = this.rows();
    if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return;
    const next = [...rows];
    moveItemInArray(next, from, to);
    this.optionsChange.emit({ options: next });
  }

  drop(event: CdkDragDrop<readonly SdFormGenericOption[]>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  /** ↑/↓ trên tay nắm: dời một bậc và giữ focus trên tay nắm của lựa chọn vừa dời. */
  moveByKey(event: Event, index: number, delta: -1 | 1, atEdge: boolean): void {
    event.preventDefault();
    if (atEdge) return;
    const target = index + delta;
    this.move(index, target);
    queueMicrotask(() => this.#host.nativeElement.querySelector<HTMLElement>(`[data-option-handle="${target}"]`)?.focus());
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }
}

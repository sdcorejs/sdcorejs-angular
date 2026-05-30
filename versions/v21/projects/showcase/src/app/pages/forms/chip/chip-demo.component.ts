import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChip } from '@sdcorejs/angular/forms/chip';

@Component({
  selector: 'app-chip-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChip],
  template: `
    <demo-page title="Chip" description="sd-chip – nhập danh sách tag dưới dạng chuỗi. Gõ rồi Enter để thêm, bấm X để xoá.">
      <demo-section heading="cơ bản" note="Mỗi chip là một string trong mảng.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
          <sd-chip label="Kỹ năng" placeholder="Nhập rồi Enter..." helperText="Có thể thêm nhiều giá trị"
            [(model)]="skills" [form]="form"></sd-chip>
          <div style="font-size:12px; color:#555">
            Số chip: <b>{{ skills().length }}</b> — [{{ skills().join(', ') }}]
          </div>
        </div>
      </demo-section>

      <demo-section heading="Validator (required + min=3)" note="Cần ít nhất 3 chip. Bấm Kiểm tra để hiện lỗi.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-chip label="required + min=3" placeholder="Nhập rồi Enter..."
            [(model)]="tags" [form]="formValid" required [min]="3"></sd-chip>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Không cho thêm / xoá chip.">
        <div style="width: 420px">
          <sd-chip label="disabled" [(model)]="lockedTags" [form]="form" disabled></sd-chip>
        </div>
      </demo-section>

      <demo-section heading="Kích thước (size)" note="Chip thu gọn cho bảng / toolbar.">
        <div style="width: 420px">
          <sd-chip label="sm" size="sm" placeholder="Nhập nhãn..." [(model)]="filters" [form]="form"></sd-chip>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  skills = signal<string[]>(['Angular', 'TypeScript', 'RxJS']);
  tags = signal<string[]>([]);
  lockedTags = signal<string[]>(['Đã khoá 1', 'Đã khoá 2']);
  filters = signal<string[]>([]);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}


import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

@Component({
  selector: 'app-confirm-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page title="Confirm" description="SdConfirmService – mở hộp thoại xác nhận trả về Promise. Hỗ trợ confirm cơ bản, nhập input, chọn radio/select, chọn ngày và ngày giờ.">
      <demo-section heading="Xác nhận cơ bản" [props]="[{ name: 'confirm()', value: 'method' }]" note="confirm(message) – Promise resolve khi bấm OK, reject khi Hủy.">
        <button mat-flat-button color="primary" (click)="onBasic()">Xác nhận thao tác</button>
      </demo-section>

      <demo-section heading="Xác nhận xóa" [props]="[{ name: 'confirm()', value: 'method' }]" note="Tùy chỉnh tiêu đề, nhãn nút và màu nút.">
        <button mat-flat-button color="warn" (click)="onDelete()">Xóa bản ghi</button>
      </demo-section>

      <demo-section heading="Nhập lý do" [props]="[{ name: 'withInput()', value: 'method' }]" note="withInput() – yêu cầu nhập nội dung trước khi xác nhận.">
        <button mat-stroked-button color="primary" (click)="onInput()">Nhập lý do từ chối</button>
      </demo-section>

      <demo-section heading="Chọn mức độ" [props]="[{ name: 'withRadio()', value: 'method' }]" note="withRadio() – chọn từ danh sách radio.">
        <button mat-stroked-button color="primary" (click)="onRadio()">Chọn mức độ</button>
      </demo-section>

      <demo-section heading="Chọn phòng ban" [props]="[{ name: 'withSelect()', value: 'method' }]" note="withSelect() – chọn một giá trị bằng sd-select.">
        <button mat-stroked-button color="primary" (click)="onSelect()">Chọn phòng ban</button>
      </demo-section>

      <demo-section heading="Chọn ngày" [props]="[{ name: 'withDate()', value: 'method' }]" note="withDate() – chọn ngày với min/max nếu cần.">
        <button mat-stroked-button color="primary" (click)="onDate()">Chọn ngày hiệu lực</button>
      </demo-section>

      <demo-section heading="Chọn ngày giờ" [props]="[{ name: 'withDatetime()', value: 'method' }]" note="withDatetime() – chọn ngày và giờ.">
        <button mat-stroked-button color="primary" (click)="onDatetime()">Chọn lịch xử lý</button>
      </demo-section>

      <demo-section heading="Nhật ký gần nhất">
        <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">{{ log() || '(chưa có thao tác)' }}</pre>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDemoComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly log = signal('');

  onBasic() {
    this.#confirm.confirm('Bạn có chắc muốn tiếp tục thao tác này?').then(
      () => this.log.set('Cơ bản: ĐỒNG Ý'),
      () => this.log.set('Cơ bản: HỦY'),
    );
  }

  onDelete() {
    this.#confirm
      .confirm('Bản ghi sẽ bị xóa vĩnh viễn. Tiếp tục?', {
        title: 'Xác nhận xóa',
        yesTitle: 'Xóa',
        noTitle: 'Hủy',
        yesButtonColor: 'error',
      })
      .then(
        () => this.log.set('Xóa: ĐÃ XÓA'),
        () => this.log.set('Xóa: HỦY'),
      );
  }

  onInput() {
    this.#confirm
      .withInput('Vui lòng nhập lý do:', { title: 'Nhập lý do', required: true, maxlength: 200 })
      .then(
        (v) => this.log.set('Input: ' + v),
        () => this.log.set('Input: HỦY'),
      );
  }

  onRadio() {
    this.#confirm
      .withRadio('Chọn mức độ ưu tiên:', {
        title: 'Mức độ ưu tiên',
        items: [
          { value: 'low', label: 'Thấp' },
          { value: 'medium', label: 'Trung bình' },
          { value: 'high', label: 'Cao' },
        ],
        valueField: 'value',
        displayField: 'label',
        display: 'row',
        defaultValue: 'medium',
        required: true,
      })
      .then(
        (v) => this.log.set('Radio: ' + v),
        () => this.log.set('Radio: HỦY'),
      );
  }

  onSelect() {
    this.#confirm
      .withSelect('Chọn phòng ban xử lý:', {
        title: 'Phòng ban xử lý',
        items: [
          { value: 'sales', label: 'Kinh doanh' },
          { value: 'operation', label: 'Vận hành' },
          { value: 'finance', label: 'Tài chính' },
        ],
        valueField: 'value',
        displayField: 'label',
        defaultValue: 'operation',
        required: true,
        placeholder: 'Phòng ban',
      })
      .then(
        (v) => this.log.set('Select: ' + v),
        () => this.log.set('Select: HỦY'),
      );
  }

  onDate() {
    this.#confirm
      .withDate('Chọn ngày hiệu lực:', {
        title: 'Ngày hiệu lực',
        required: true,
        placeholder: 'dd/MM/yyyy',
        min: new Date('2026-01-01'),
        max: new Date('2026-12-31'),
      })
      .then(
        (v) => this.log.set('Date: ' + v),
        () => this.log.set('Date: HỦY'),
      );
  }

  onDatetime() {
    this.#confirm
      .withDatetime('Chọn thời điểm xử lý:', {
        title: 'Lịch xử lý',
        required: true,
        placeholder: 'dd/MM/yyyy HH:mm',
        min: new Date('2026-01-01T00:00:00'),
        max: new Date('2026-12-31T23:59:59'),
      })
      .then(
        (v) => this.log.set('Datetime: ' + v),
        () => this.log.set('Datetime: HỦY'),
      );
  }
}

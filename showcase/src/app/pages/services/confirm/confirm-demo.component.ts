import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

@Component({
  selector: 'app-confirm-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page
      #demoPage
      title="Confirm"
      description="SdConfirmService – mở hộp thoại xác nhận trả về Promise. Hỗ trợ confirm cơ bản, nhập input, chọn radio/select, chọn ngày và ngày giờ.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xac-nhan-co-ban') {
        <demo-section
          heading="Xác nhận cơ bản"
          [props]="[
            { name: 'confirm()', value: 'method' },
            { name: 'icon', value: 'default / info_outline' },
          ]"
          note="Không truyền icon sẽ dùng icon mặc định. Truyền icon để thay biểu tượng trong cùng ô nền nhẹ.">
          <button mat-flat-button color="primary" (click)="onBasic()">Xác nhận thao tác</button>
          <button mat-stroked-button color="primary" (click)="onCustomIcon()">Icon tùy chỉnh</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xac-nhan-xoa') {
        <demo-section
          heading="Xác nhận xóa"
          [props]="[{ name: 'confirm()', value: 'method' }]"
          note="Tùy chỉnh tiêu đề, nhãn nút và màu nút.">
          <button mat-flat-button color="warn" (click)="onDelete()">Xóa bản ghi</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhap-ly-do') {
        <demo-section
          heading="Nhập lý do"
          [props]="[{ name: 'withInput()', value: 'method' }]"
          note="withInput() – yêu cầu nhập nội dung trước khi xác nhận.">
          <button mat-stroked-button color="primary" (click)="onInput()">Nhập lý do từ chối</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-muc-do') {
        <demo-section
          heading="Chọn mức độ"
          [props]="[{ name: 'withRadio()', value: 'method' }]"
          note="withRadio() – chọn từ danh sách radio.">
          <button mat-stroked-button color="primary" (click)="onRadio()">Chọn mức độ</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-radio-dang-doc') {
        <demo-section
          heading="Chọn radio dạng dọc"
          [props]="[{ name: 'display', value: 'column' }]"
          note="withRadio(..., { display: 'column' }) – hiển thị danh sách radio theo chiều dọc.">
          <button mat-stroked-button color="primary" (click)="onRadioColumn()">Chọn phòng ban dạng dọc</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-phong-ban') {
        <demo-section
          heading="Chọn phòng ban"
          [props]="[{ name: 'withSelect()', value: 'method' }]"
          note="withSelect() – chọn một giá trị bằng sd-select.">
          <button mat-stroked-button color="primary" (click)="onSelect()">Chọn phòng ban</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-ngay') {
        <demo-section
          heading="Chọn ngày"
          [props]="[{ name: 'withDate()', value: 'method' }]"
          note="withDate() – chọn ngày với min/max nếu cần.">
          <button mat-stroked-button color="primary" (click)="onDate()">Chọn ngày hiệu lực</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-ngay-gio') {
        <demo-section
          heading="Chọn ngày giờ"
          [props]="[{ name: 'withDatetime()', value: 'method' }]"
          note="withDatetime() – chọn ngày và giờ.">
          <button mat-stroked-button color="primary" (click)="onDatetime()">Chọn lịch xử lý</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhat-ky-gan-nhat') {
        <demo-section heading="Nhật ký gần nhất">
          <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">{{
            log() || '(chưa có thao tác)'
          }}</pre>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDemoComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly log = signal('');

  onBasic() {
    this.#confirm
      .confirm('Bạn có chắc muốn thực hiện thao tác này?', { title: 'Tiếp tục thao tác?', yesTitle: 'Tiếp tục', noTitle: 'Hủy' })
      .then(
        () => this.log.set('Cơ bản: ĐỒNG Ý'),
        () => this.log.set('Cơ bản: HỦY')
      );
  }

  onCustomIcon() {
    this.#confirm
      .confirm('Kiểm tra lại thông tin trước khi tiếp tục.', {
        icon: 'info_outline',
        title: 'Xác nhận thông tin',
        yesTitle: 'Tiếp tục',
        noTitle: 'Hủy',
      })
      .then(
        () => this.log.set('Icon tùy chỉnh: ĐỒNG Ý'),
        () => this.log.set('Icon tùy chỉnh: HỦY')
      );
  }

  onDelete() {
    this.#confirm
      .confirm('Bản ghi sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác thao tác này.', {
        title: 'Xóa bản ghi này?',
        yesTitle: 'Xóa bản ghi',
        noTitle: 'Hủy',
        yesButtonColor: 'error',
      })
      .then(
        () => this.log.set('Xóa: ĐÃ XÓA'),
        () => this.log.set('Xóa: HỦY')
      );
  }

  onInput() {
    this.#confirm
      .withInput('Cho người gửi biết lý do để họ có thể điều chỉnh.', {
        title: 'Lý do từ chối',
        label: 'Lý do',
        placeholder: 'Nhập lý do từ chối…',
        yesTitle: 'Gửi lý do',
        noTitle: 'Hủy',
        required: true,
        maxlength: 200,
      })
      .then(
        v => this.log.set('Input: ' + v),
        () => this.log.set('Input: HỦY')
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
        v => this.log.set('Radio: ' + v),
        () => this.log.set('Radio: HỦY')
      );
  }

  onRadioColumn() {
    this.#confirm
      .withRadio('Chọn phòng ban xử lý:', {
        title: 'Phòng ban xử lý',
        items: [
          { value: 'sales', label: 'Kinh doanh' },
          { value: 'operation', label: 'Vận hành' },
          { value: 'finance', label: 'Tài chính' },
        ],
        valueField: 'value',
        displayField: 'label',
        display: 'column',
        defaultValue: 'operation',
        required: true,
      })
      .then(
        v => this.log.set('Radio dọc: ' + v),
        () => this.log.set('Radio dọc: HỦY')
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
        v => this.log.set('Select: ' + v),
        () => this.log.set('Select: HỦY')
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
        v => this.log.set('Date: ' + v),
        () => this.log.set('Date: HỦY')
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
        v => this.log.set('Datetime: ' + v),
        () => this.log.set('Datetime: HỦY')
      );
  }
}

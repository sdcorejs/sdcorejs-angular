import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';

@Component({
  selector: 'app-checkbox-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdCheckbox],
  template: `
    <demo-page #demoPage title="Checkbox" description="sd-checkbox – ô đánh dấu. Hỗ trợ bind hai chiều boolean, các màu chủ đề, disabled / viewed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind [(model)] với boolean — hiển thị giá trị bên dưới.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-checkbox label="Tôi đồng ý điều khoản" [(model)]="accept" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ accept() ? 'TRUE' : 'FALSE' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-tuy-chon') {
      <demo-section heading="Nhóm tuỳ chọn" note="Mỗi checkbox bind 1 biến độc lập.">
        <div style="display:flex; flex-direction:column; gap:4px">
          <sd-checkbox label="Email" [(model)]="optEmail" [form]="form"></sd-checkbox>
          <sd-checkbox label="SMS" [(model)]="optSms" [form]="form"></sd-checkbox>
          <sd-checkbox label="Push notification" [(model)]="optPush" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555; margin-top:4px">
            Đã chọn: <b>{{ summary() || '(chưa chọn)' }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac') {
      <demo-section heading="Màu sắc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thuộc tính color thay đổi accent.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="primary" color="primary" [(model)]="c1" [form]="form"></sd-checkbox>
          <sd-checkbox label="success" color="success" [(model)]="c2" [form]="form"></sd-checkbox>
          <sd-checkbox label="warning" color="warning" [(model)]="c3" [form]="form"></sd-checkbox>
          <sd-checkbox label="error" color="error" [(model)]="c4" [form]="form"></sd-checkbox>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bao-loi-inlineerror') {
      <demo-section
        heading="Báo lỗi (inlineError)"
        [props]="[{ name: 'inlineError', value: 'text' }]"
        note="Truyền inlineError + bấm Hiện lỗi (markAsTouched) → message đỏ hiện dưới checkbox. Bấm lại Đặt lại để ẩn.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-checkbox label="Tôi đồng ý điều khoản" [(model)]="errAccept" [form]="formErr" [inlineError]="'Bạn phải đồng ý điều khoản'"></sd-checkbox>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hiện lỗi</button>
            <button type="button" (click)="resetErr()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai trạng thái khoá.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-checkbox>
          <sd-checkbox label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-checkbox>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
      <demo-section heading="Chế độ xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hiện chữ Có/Không; 'inline' vẫn bấm được, disabled+inline thì xem tĩnh.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="viewed=true (tĩnh)" [(model)]="viewedFlag" [form]="form" viewed></sd-checkbox>
          <sd-checkbox label="inline (vẫn sửa được)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-checkbox>
          <sd-checkbox label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-checkbox>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDemoComponent {
  form = new FormGroup({});
  formErr = new FormGroup({});

  accept = signal<boolean>(false);
  errAccept = signal<boolean>(false);

  optEmail = signal<boolean>(true);
  optSms = signal<boolean>(false);
  optPush = signal<boolean>(true);

  c1 = signal<boolean>(true);
  c2 = signal<boolean>(true);
  c3 = signal<boolean>(false);
  c4 = signal<boolean>(false);

  lockedA = signal<boolean>(true);
  lockedB = signal<boolean>(false);

  viewedFlag = signal<boolean>(true);
  inlineFlag = signal<boolean>(false);

  summary = () => {
    const items: string[] = [];
    if (this.optEmail()) items.push('Email');
    if (this.optSms()) items.push('SMS');
    if (this.optPush()) items.push('Push');
    return items.join(', ');
  };

  showErr() { this.formErr.markAllAsTouched(); }
  resetErr() { this.formErr.markAsUntouched(); }
}

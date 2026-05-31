import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';

@Component({
  selector: 'app-checkbox-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdCheckbox],
  template: `
    <demo-page title="Checkbox" description="sd-checkbox – ô đánh dấu. Hỗ trợ bind hai chiều boolean, các màu chủ đề, disabled / viewed.">
      <demo-section heading="cơ bản" note="Bind [(model)] với boolean — hiển thị giá trị bên dưới.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-checkbox label="Tôi đồng ý điều khoản" [(model)]="accept" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ accept() ? 'TRUE' : 'FALSE' }}</b></div>
        </div>
      </demo-section>

      <demo-section heading="nhóm tuỳ chọn" note="Mỗi checkbox bind 1 biến độc lập.">
        <div style="display:flex; flex-direction:column; gap:4px">
          <sd-checkbox label="Email" [(model)]="optEmail" [form]="form"></sd-checkbox>
          <sd-checkbox label="SMS" [(model)]="optSms" [form]="form"></sd-checkbox>
          <sd-checkbox label="Push notification" [(model)]="optPush" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555; margin-top:4px">
            Đã chọn: <b>{{ summary() || '(chưa chọn)' }}</b>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Màu sắc (color)" note="Thuộc tính color thay đổi accent.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="primary" color="primary" [(model)]="c1" [form]="form"></sd-checkbox>
          <sd-checkbox label="success" color="success" [(model)]="c2" [form]="form"></sd-checkbox>
          <sd-checkbox label="warning" color="warning" [(model)]="c3" [form]="form"></sd-checkbox>
          <sd-checkbox label="error" color="error" [(model)]="c4" [form]="form"></sd-checkbox>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Hai trạng thái khoá.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-checkbox>
          <sd-checkbox label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-checkbox>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDemoComponent {
  form = new FormGroup({});

  accept = signal<boolean>(false);

  optEmail = signal<boolean>(true);
  optSms = signal<boolean>(false);
  optPush = signal<boolean>(true);

  c1 = signal<boolean>(true);
  c2 = signal<boolean>(true);
  c3 = signal<boolean>(false);
  c4 = signal<boolean>(false);

  lockedA = signal<boolean>(true);
  lockedB = signal<boolean>(false);

  summary = () => {
    const items: string[] = [];
    if (this.optEmail()) items.push('Email');
    if (this.optSms()) items.push('SMS');
    if (this.optPush()) items.push('Push');
    return items.join(', ');
  };
}

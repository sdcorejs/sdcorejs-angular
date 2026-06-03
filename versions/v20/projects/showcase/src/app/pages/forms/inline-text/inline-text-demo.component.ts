import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormControl } from '@sdcorejs/angular/forms/models';

@Component({
  selector: 'app-inline-text-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInlineText, SdInput, SdInputNumber],
  template: `
    <demo-page
      title="Inline Text"
      description="Primitive input borderless, ôm sát nội dung (content-hug) — bề rộng bám theo độ dài giá trị thay vì kéo full width. Dùng chung cho sd-input/sd-input-number (viewed='inline') và chip query-bar/query-builder.">

      <demo-section [props]="[{ name: '[(value)]' }]" note="Vùng hover/click bám theo độ dài giá trị — không kéo full width. Dài/ngắn khác nhau → rộng khác nhau.">
        <div class="stack">
          <span class="row"><sd-inline-text [(value)]="short" /> <code>{{ short() || '(trống)' }}</code></span>
          <span class="row"><sd-inline-text [(value)]="medium" /> <code>{{ medium() }}</code></span>
          <span class="row"><sd-inline-text [(value)]="long" /> <code>{{ long() }}</code></span>
          <span class="row"><sd-inline-text [(value)]="empty" placeholder="nhập giá trị…" /> <code>placeholder khi trống</code></span>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'chrome', value: 'standalone / seamless' }]" note="standalone tự vẽ nền hover + ring focus; seamless trong suốt để pill cha (chip) vẽ viền/nền.">
        <div class="stack">
          <span class="row">standalone: <sd-inline-text chrome="standalone" [(value)]="cs1" /></span>
          <span class="row pill">seamless trong 1 pill: <span class="fake-chip">Tên: <sd-inline-text chrome="seamless" [clearable]="false" [state]="'active'" [(value)]="cs2" /></span></span>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'state', value: 'pending / active / error' }]" note="auto suy ra từ focus + value; có thể override (vd error).">
        <div class="stack">
          <span class="row">pending (trống): <sd-inline-text [(value)]="stEmpty" placeholder="…" /></span>
          <span class="row">active (có value): <sd-inline-text [(value)]="stActive" /></span>
          <span class="row">error (override): <sd-inline-text [(value)]="stErr" [state]="'error'" /></span>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'control' }]" note="Bind FormControl ngoài (chế độ form controls dùng). Disabled qua control.">
        <div class="stack">
          <span class="row">control: <sd-inline-text [control]="ctrl" /> <code>{{ ctrl.value }}</code></span>
          <span class="row">disabled control: <sd-inline-text [control]="ctrlDisabled" /></span>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'viewed', value: 'inline' }]" note="Cùng primitive — inline edit ôm sát nội dung, không còn full-width.">
        <div class="stack">
          <span class="row">sd-input: <sd-input [(model)]="inlineStr" [viewed]="'inline'" placeholder="nhập tên…" /></span>
          <span class="row">sd-input-number: <sd-input-number [(model)]="inlineNum" [viewed]="'inline'" placeholder="nhập số…" /></span>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .stack { display: flex; flex-direction: column; gap: 14px; }
    .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .fake-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #d6d8db;
      border-radius: 999px;
      padding: 2px 10px;
      background: #fff;
      color: #5f6368;
      font-size: 13px;
    }
    code {
      background: #f0f3f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineTextDemoComponent {
  readonly short = signal('Ab');
  readonly medium = signal('Nguyễn Văn A');
  readonly long = signal('Một giá trị khá dài để thấy bề rộng bám nội dung');
  readonly empty = signal('');

  readonly cs1 = signal('standalone');
  readonly cs2 = signal('Giá trị');

  readonly stEmpty = signal('');
  readonly stActive = signal('Đang nhập');
  readonly stErr = signal('sai định dạng');

  readonly ctrl = new SdFormControl({ value: 'từ FormControl', disabled: false });
  readonly ctrlDisabled = new SdFormControl({ value: 'không sửa được', disabled: true });

  readonly inlineStr = signal('Tên hiển thị');
  readonly inlineNum = signal<number | null>(25000000);
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton],
  template: `
    <demo-page
      title="Button"
      description="Nút thao tác chuẩn — 4 biến thể (fill / light / outline / link), 3 kích thước, hỗ trợ icon và trạng thái loading.">

      <demo-section heading="Biến thể" [props]="[{ name: 'type', value: 'fill / light / outline / link' }]">
        <sd-button type="fill" color="primary" title="fill"></sd-button>
        <sd-button type="light" color="primary" title="light"></sd-button>
        <sd-button type="outline" color="primary" title="outline"></sd-button>
        <sd-button type="link" color="primary" title="link"></sd-button>
      </demo-section>

      <demo-section heading="Bảng màu" [props]="[{ name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-button type="fill" color="primary" title="primary"></sd-button>
        <sd-button type="fill" color="secondary" title="secondary"></sd-button>
        <sd-button type="fill" color="success" title="success"></sd-button>
        <sd-button type="fill" color="info" title="info"></sd-button>
        <sd-button type="fill" color="warning" title="warning"></sd-button>
        <sd-button type="fill" color="error" title="error"></sd-button>
      </demo-section>

      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm / md / lg' }]">
        <sd-button type="fill" color="primary" size="sm" title="sm" prefixIcon="add"></sd-button>
        <sd-button type="fill" color="primary" size="md" title="md" prefixIcon="add"></sd-button>
        <sd-button type="fill" color="primary" size="lg" title="lg" prefixIcon="add"></sd-button>
      </demo-section>

      <demo-section heading="Chỉ icon" [props]="[{ name: 'prefixIcon', value: 'name' }]">
        <sd-button type="light" color="primary" prefixIcon="edit" tooltip="edit"></sd-button>
        <sd-button type="light" color="error" prefixIcon="delete" tooltip="delete"></sd-button>
      </demo-section>

      <demo-section heading="Trạng thái" [props]="[{ name: 'loading', value: 'true' }, { name: 'disabled', value: 'true' }]">
        <sd-button
          type="fill"
          color="primary"
          title="loading"
          prefixIcon="send"
          [loading]="submitting()"
          (click)="onSubmit()">
        </sd-button>
        <sd-button type="fill" color="primary" title="disabled" [disabled]="true"></sd-button>
        <div style="width: 240px;">
          <sd-button type="fill" color="primary" title="block" [block]="true"></sd-button>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  readonly submitting = signal(false);

  onSubmit() {
    this.submitting.set(true);
    setTimeout(() => this.submitting.set(false), 1500);
  }
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton],
  template: `
    <demo-page
      title="Button"
      description="Nút thao tác chuẩn: 4 biến thể (fill / light / outline / link), 3 kích thước, hỗ trợ icon và trạng thái loading.">
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

      <demo-section
        heading="Toggle icon set bằng alias"
        [props]="[
          { name: 'iconSet', value: iconSet() },
          { name: 'alias', value: 'add -> plus | delete -> trash-2 | visibility -> eye | more_vert -> ellipsis-vertical' },
        ]"
        note="Các button bên dưới vẫn truyền icon name theo Material; khi chuyển sang Lucide, SdIcon tự map qua alias tương ứng.">
        <sd-button type="fill" color="primary" title="Material filled" (click)="useIconSet('material-icons')"></sd-button>
        <sd-button type="fill" color="secondary" title="Material outlined" (click)="useIconSet('material-icons-outlined')"></sd-button>
        <sd-button type="fill" color="info" title="Lucide" (click)="useIconSet('lucide')"></sd-button>
        <sd-button type="light" color="primary" title="Create" prefixIcon="add" [iconSet]="iconSet()"></sd-button>
        <sd-button type="light" color="primary" title="View" prefixIcon="visibility" [iconSet]="iconSet()"></sd-button>
        <sd-button type="light" color="error" title="Delete" prefixIcon="delete" [iconSet]="iconSet()"></sd-button>
        <sd-button type="outline" color="secondary" title="More" suffixIcon="more_vert" [iconSet]="iconSet()"></sd-button>
      </demo-section>

      <demo-section
        heading="Trạng thái"
        [props]="[
          { name: 'loading', value: 'true' },
          { name: 'disabled', value: 'true' },
        ]">
        <sd-button type="fill" color="primary" title="loading" prefixIcon="send" [loading]="submitting()" (click)="onSubmit()"> </sd-button>
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
  readonly iconSet = signal<SdIconSet>('material-icons-outlined');

  useIconSet(iconSet: SdIconSet) {
    this.iconSet.set(iconSet);
  }

  onSubmit() {
    this.submitting.set(true);
    setTimeout(() => this.submitting.set(false), 1500);
  }
}

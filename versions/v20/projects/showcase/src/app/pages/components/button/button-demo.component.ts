import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { type SdIconFontSet } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton],
  template: `
    <demo-page
      title="Button"
      description="Nút thao tác chuẩn: 4 biến thể (fill / light / outline / text), 3 kích thước, hỗ trợ icon và trạng thái loading.">
      <demo-section heading="Biến thể" [props]="[{ name: 'type', value: 'fill / light / outline / text' }]">
        <sd-button type="fill" color="primary" title="fill"></sd-button>
        <sd-button type="light" color="primary" title="light"></sd-button>
        <sd-button type="outline" color="primary" title="outline"></sd-button>
        <sd-button type="text" color="primary" title="text"></sd-button>
      </demo-section>

      <demo-section heading="Bảng màu" [props]="[{ name: 'color', value: 'primary / secondary / black / success / info / warning / error' }]">
        <sd-button type="fill" color="primary" title="primary"></sd-button>
        <sd-button type="fill" color="secondary" title="secondary"></sd-button>
        <sd-button type="fill" color="black" title="black"></sd-button>
        <sd-button type="fill" color="success" title="success"></sd-button>
        <sd-button type="fill" color="info" title="info"></sd-button>
        <sd-button type="fill" color="warning" title="warning"></sd-button>
        <sd-button type="fill" color="error" title="error"></sd-button>
      </demo-section>

      <demo-section heading="Secondary vs black" [props]="[{ name: 'color', value: 'secondary / black' }]">
        <sd-button type="fill" color="secondary" title="secondary fill"></sd-button>
        <sd-button type="fill" color="black" title="black fill"></sd-button>
        <sd-button type="light" color="secondary" title="secondary light"></sd-button>
        <sd-button type="light" color="black" title="black light"></sd-button>
        <sd-button type="outline" color="secondary" title="secondary outline"></sd-button>
        <sd-button type="outline" color="black" title="black outline"></sd-button>
        <sd-button type="text" color="secondary" title="secondary text"></sd-button>
        <sd-button type="text" color="black" title="black text"></sd-button>
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
          { name: 'fontSet', value: fontSet() },
          { name: 'alias', value: 'add -> plus | delete -> trash-2 | visibility -> eye | more_vert -> ellipsis-vertical' },
        ]"
        note="Các button bên dưới vẫn truyền icon name theo Material; khi chuyển sang Lucide, SdIcon tự map qua alias tương ứng.">
        <sd-button type="fill" color="primary" title="Material filled" (click)="useFontSet('material-icons')"></sd-button>
        <sd-button type="fill" color="secondary" title="Material outlined" (click)="useFontSet('material-icons-outlined')"></sd-button>
        <sd-button type="fill" color="info" title="Lucide" (click)="useFontSet('lucide')"></sd-button>
        <sd-button type="light" color="primary" title="Create" prefixIcon="add" [fontSet]="fontSet()"></sd-button>
        <sd-button type="light" color="primary" title="View" prefixIcon="visibility" [fontSet]="fontSet()"></sd-button>
        <sd-button type="light" color="error" title="Delete" prefixIcon="delete" [fontSet]="fontSet()"></sd-button>
        <sd-button type="outline" color="secondary" title="More" suffixIcon="more_vert" [fontSet]="fontSet()"></sd-button>
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
  readonly fontSet = signal<SdIconFontSet>('material-icons-outlined');

  useFontSet(fontSet: SdIconFontSet) {
    this.fontSet.set(fontSet);
  }

  onSubmit() {
    this.submitting.set(true);
    setTimeout(() => this.submitting.set(false), 1500);
  }
}

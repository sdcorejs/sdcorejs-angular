import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { ButtonColorsExampleComponent } from './examples/button-colors.example';
import { ButtonIconOnlyExampleComponent } from './examples/button-icon-only.example';
import { ButtonIconSetExampleComponent } from './examples/button-icon-set.example';
import { ButtonSecondaryBlackExampleComponent } from './examples/button-secondary-black.example';
import { ButtonSizesExampleComponent } from './examples/button-sizes.example';
import { ButtonStatesExampleComponent } from './examples/button-states.example';
import { ButtonVariantsExampleComponent } from './examples/button-variants.example';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    ButtonVariantsExampleComponent,
    ButtonColorsExampleComponent,
    ButtonSecondaryBlackExampleComponent,
    ButtonSizesExampleComponent,
    ButtonIconOnlyExampleComponent,
    ButtonIconSetExampleComponent,
    ButtonStatesExampleComponent,
  ],
  template: `<demo-page #demoPage
    title="Button"
    description="Nút thao tác chuẩn: 4 biến thể (fill / light / outline / text), 3 kích thước, hỗ trợ icon và trạng thái loading.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bien-the') {
    <demo-section
      heading="Biến thể"
      data-example-typescript="./examples/button-variants.example.ts"
      data-example-template="./examples/button-variants.example.html"
      [props]="[{ name: 'type', value: 'fill / light / outline / text' }]">
      <app-button-variants-example></app-button-variants-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau') {
    <demo-section
      heading="Bảng màu"
      data-example-typescript="./examples/button-colors.example.ts"
      data-example-template="./examples/button-colors.example.html"
      [props]="[{ name: 'color', value: 'primary / secondary / black / success / info / warning / error' }]">
      <app-button-colors-example></app-button-colors-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-secondary-vs-black') {
    <demo-section
      heading="Secondary vs black"
      data-example-typescript="./examples/button-secondary-black.example.ts"
      data-example-template="./examples/button-secondary-black.example.html"
      [props]="[{ name: 'color', value: 'secondary / black' }]">
      <app-button-secondary-black-example></app-button-secondary-black-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
    <demo-section
      heading="Kích thước"
      data-example-typescript="./examples/button-sizes.example.ts"
      data-example-template="./examples/button-sizes.example.html"
      [props]="[{ name: 'size', value: 'sm / md / lg' }]">
      <app-button-sizes-example></app-button-sizes-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-icon') {
    <demo-section
      heading="Chỉ icon"
      data-example-typescript="./examples/button-icon-only.example.ts"
      data-example-template="./examples/button-icon-only.example.html"
      [props]="[{ name: 'prefixIcon', value: 'name' }]">
      <app-button-icon-only-example></app-button-icon-only-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toggle-icon-set-bang-alias') {
    <demo-section
      heading="Toggle icon set bằng alias"
      data-example-typescript="./examples/button-icon-set.example.ts"
      data-example-template="./examples/button-icon-set.example.html"
      [props]="[
        { name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' },
        { name: 'alias', value: 'add -> plus | delete -> trash-2 | visibility -> eye | more_vert -> ellipsis-vertical' },
      ]"
      note="Các button bên dưới vẫn truyền icon name theo Material; khi chuyển sang Lucide, SdIcon tự map qua alias tương ứng.">
      <app-button-icon-set-example></app-button-icon-set-example>
    </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
    <demo-section
      heading="Trạng thái"
      data-example-typescript="./examples/button-states.example.ts"
      data-example-template="./examples/button-states.example.html"
      [props]="[
        { name: 'loading', value: 'true' },
        { name: 'disabled', value: 'true' },
        { name: 'block', value: 'true' },
      ]">
      <app-button-states-example></app-button-states-example>
    </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {}

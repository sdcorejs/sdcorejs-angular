import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface IconDemoItem {
  name: string;
  label: string;
}

@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdIcon],
  template: `
    <demo-page title="Icon" description="SdIcon is the Core UI icon facade for Material filled, Material outlined, and Lucide SVG icons.">
      <demo-section heading="Material filled" [props]="[{ name: 'set', value: 'material-icons' }]">
        @for (icon of materialIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="material-icons" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>

      <demo-section heading="Material outlined" [props]="[{ name: 'set', value: 'material-icons-outlined' }]">
        @for (icon of materialIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="material-icons-outlined" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>

      <demo-section heading="Lucide explicit" [props]="[{ name: 'set', value: 'lucide' }]">
        @for (icon of lucideIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="lucide" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>

      <demo-section heading="Sizes" [props]="[{ name: 'size', value: 'sm / md / lg / CSS string' }]">
        @for (size of sizes; track size) {
          <span class="icon-demo-size">
            <sd-icon name="search" set="lucide" [size]="size" ariaLabel="Search"></sd-icon>
            <span>{{ size }}</span>
          </span>
        }
      </demo-section>

      <demo-section
        heading="Button integration"
        [props]="[{ name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' }]">
        <sd-button type="fill" color="primary" title="Material" prefixIcon="add" fontSet="material-icons"></sd-button>
        <sd-button type="light" color="primary" title="Outlined" prefixIcon="save" fontSet="material-icons-outlined"></sd-button>
        <sd-button type="outline" color="error" title="Lucide" prefixIcon="delete" fontSet="lucide"></sd-button>
        <sd-button type="text" color="secondary" title="More" suffixIcon="more_vert" fontSet="lucide"></sd-button>
      </demo-section>
    </demo-page>
  `,
  styles: [
    `
      .icon-demo-item,
      .icon-demo-size {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 132px;
        padding: 8px 10px;
        border: 1px solid #e6e6e6;
        border-radius: 8px;
        background: #ffffff;
        color: #1f2937;
        font-size: 13px;
      }

      .icon-demo-size {
        min-width: 88px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconDemoComponent {
  readonly materialIcons: IconDemoItem[] = [
    { name: 'add', label: 'Add' },
    { name: 'edit', label: 'Edit' },
    { name: 'delete', label: 'Delete' },
    { name: 'save', label: 'Save' },
    { name: 'visibility', label: 'View' },
    { name: 'more_vert', label: 'More' },
  ];

  readonly lucideIcons: IconDemoItem[] = [
    { name: 'add', label: 'Add' },
    { name: 'edit', label: 'Edit' },
    { name: 'delete', label: 'Delete' },
    { name: 'save', label: 'Save' },
    { name: 'visibility', label: 'View' },
    { name: 'more_vert', label: 'More' },
    { name: 'warning', label: 'Warning' },
    { name: 'keyboard_arrow_down', label: 'Expand' },
  ];

  readonly sizes = ['sm', 'md', 'lg', '28px'];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdOrgChart, SdOrgChartItem, SdOrgChartItemDefDirective } from '@sdcorejs/angular/components/org-chart';

@Component({
  selector: 'app-org-chart-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdOrgChart, SdOrgChartItemDefDirective],
  template: `
    <demo-page #demoPage
      title="Org Chart"
      description="Sơ đồ tổ chức dạng tree: card mặc định có ảnh, tiêu đề, mô tả, màu nền; node có children có thể thu gọn/mở rộng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-card-mac-dinh') {
      <demo-section
        heading="Card mặc định"
        [props]="[
          { name: 'items', value: 'SdOrgChartItem[]' },
          { name: 'collapsible', value: 'true' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="basicItems" autoId="basic"></sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-node-co-mau') {
      <demo-section
        heading="Node có màu"
        note="Mỗi item truyền color riêng; node không có image và description tự chuyển sang compact card."
        [props]="[
          { name: 'color', value: '#hex' },
          { name: 'expanded', value: 'boolean' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="coloredItems" autoId="colored"></sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-bang-directive') {
      <demo-section
        heading="Custom bằng directive"
        [props]="[
          { name: 'sdOrgChartItemDef', value: 'template' },
          { name: 'context', value: 'item / depth / toggle' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="compactItems" autoId="directive-template">
            <ng-template sdOrgChartItemDef let-item let-depth="depth" let-hasChildren="hasChildren" let-toggle="toggle">
              <button
                type="button"
                class="org-custom-card"
                [class.org-custom-card--leaf]="!hasChildren"
                [style.border-color]="item.color || '#d9e2ef'"
                (click)="toggle()">
                <span class="org-custom-card__level">L{{ depth + 1 }}</span>
                <strong>{{ item.title }}</strong>
                @if (item.description) {
                  <small>{{ item.description }}</small>
                }
              </button>
            </ng-template>
          </sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-bang-templateref-input') {
      <demo-section
        heading="Custom bằng TemplateRef input"
        [props]="[
          { name: 'itemTemplate', value: 'TemplateRef' },
          { name: 'collapsible', value: 'false' },
        ]">
        <ng-template #teamNode let-item let-isLeaf="isLeaf">
          <div class="org-template-node" [class.org-template-node--leaf]="isLeaf">
            @if (item.image) {
              <img [src]="item.image" [alt]="item.title" />
            }
            <span>{{ item.title }}</span>
            @if (item.description) {
              <small>{{ item.description }}</small>
            }
          </div>
        </ng-template>

        <div class="org-demo-stage">
          <sd-org-chart [items]="compactItems" [itemTemplate]="teamNode" [collapsible]="false" autoId="input-template"></sd-org-chart>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .org-demo-stage {
        width: 100%;
        overflow-x: auto;
        padding: 16px 8px;
        background: #fbfcfe;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .org-custom-card {
        display: grid;
        min-width: 118px;
        gap: 4px;
        padding: 12px;
        color: #102047;
        background: #ffffff;
        border: 2px solid #d9e2ef;
        border-radius: 6px;
        cursor: pointer;
      }

      .org-custom-card--leaf {
        min-width: 92px;
        padding: 10px 12px;
      }

      .org-custom-card__level {
        color: #60708a;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .org-custom-card strong {
        font-size: 13px;
        line-height: 1.25;
      }

      .org-custom-card small {
        color: #60708a;
        font-size: 12px;
      }

      .org-template-node {
        display: grid;
        justify-items: center;
        min-width: 116px;
        gap: 6px;
        padding: 12px 14px;
        color: #0f2445;
        background: #ffffff;
        border: 1px solid #dce4ee;
        border-radius: 6px;
      }

      .org-template-node--leaf {
        min-width: 88px;
      }

      .org-template-node img {
        width: 34px;
        height: 34px;
        object-fit: cover;
        border-radius: 50%;
      }

      .org-template-node span {
        font-size: 13px;
        font-weight: 700;
        line-height: 1.25;
      }

      .org-template-node small {
        color: #60708a;
        font-size: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartDemoComponent {
  readonly basicItems: SdOrgChartItem[] = [
    {
      id: 'amy',
      image: 'https://i.pravatar.cc/96?img=32',
      title: 'Amy Elsner',
      description: 'CEO',
      children: [
        {
          id: 'anna',
          image: 'https://i.pravatar.cc/96?img=47',
          title: 'Anna Fali',
          description: 'CMO',
          children: [
            { id: 'sales', title: 'Sales' },
            { id: 'marketing', title: 'Marketing' },
          ],
        },
        {
          id: 'stephen',
          image: 'https://i.pravatar.cc/96?img=12',
          title: 'Stephen Shaw',
          description: 'CTO',
          children: [
            { id: 'development', title: 'Development' },
            { id: 'design', title: 'UI/UX Design' },
          ],
        },
      ],
    },
  ];

  readonly coloredItems: SdOrgChartItem[] = [
    {
      id: 'amy',
      image: 'https://i.pravatar.cc/96?img=32',
      title: 'Amy Elsner',
      description: 'CEO',
      color: '#dfe6ff',
      children: [
        {
          id: 'anna',
          image: 'https://i.pravatar.cc/96?img=47',
          title: 'Anna Fali',
          description: 'CMO',
          color: '#f0ddff',
          children: [
            { id: 'sales', title: 'Sales', color: '#f0ddff' },
            { id: 'marketing', title: 'Marketing', color: '#f0ddff' },
          ],
        },
        {
          id: 'stephen',
          image: 'https://i.pravatar.cc/96?img=12',
          title: 'Stephen Shaw',
          description: 'CTO',
          color: '#c6f4eb',
          children: [
            { id: 'development', title: 'Development', color: '#c6f4eb' },
            { id: 'design', title: 'UI/UX Design', color: '#c6f4eb' },
          ],
        },
      ],
    },
  ];

  readonly compactItems: SdOrgChartItem[] = [
    {
      id: 'company',
      title: 'OneMount',
      description: 'Corporate',
      color: '#dfe6ff',
      children: [
        {
          id: 'growth',
          title: 'Growth',
          description: 'Revenue',
          color: '#c6f4eb',
          children: [
            { id: 'sales', title: 'Sales', color: '#c6f4eb' },
            { id: 'partnership', title: 'Partnership', color: '#c6f4eb' },
          ],
        },
        {
          id: 'product',
          title: 'Product',
          description: 'Experience',
          color: '#f0ddff',
          children: [
            { id: 'design', title: 'Design', color: '#f0ddff' },
            { id: 'engineering', title: 'Engineering', color: '#f0ddff' },
          ],
        },
      ],
    },
  ];
}

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdOrgChart } from './org-chart.component';
import { SdOrgChartItemDefDirective } from './org-chart-item-def.directive';
import { SdOrgChartItem } from './org-chart.model';

const ORG_ITEMS: SdOrgChartItem[] = [
  {
    id: 'ceo',
    image: 'amy.png',
    title: 'Amy Elsner',
    description: 'CEO',
    color: '#dfe6ff',
    children: [
      {
        id: 'cmo',
        image: 'anna.png',
        title: 'Anna Fali',
        description: 'CMO',
        color: '#f1e2ff',
        children: [
          { id: 'sales', title: 'Sales' },
          { id: 'marketing', title: 'Marketing' },
        ],
      },
      {
        id: 'cto',
        image: 'stephen.png',
        title: 'Stephen Shaw',
        description: 'CTO',
        color: '#c6f4eb',
        children: [
          { id: 'development', title: 'Development' },
          { id: 'design', title: 'UI/UX Design' },
        ],
      },
    ],
  },
];

@Component({
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [items]="items" autoId="basic" />`,
})
class DefaultHostComponent {
  items = ORG_ITEMS;
}

@Component({
  standalone: true,
  imports: [SdOrgChart, SdOrgChartItemDefDirective],
  template: `
    <sd-org-chart [items]="items">
      <ng-template sdOrgChartItemDef let-item let-depth="depth">
        <span class="custom-node">{{ depth }}:{{ item.title }}</span>
      </ng-template>
    </sd-org-chart>
  `,
})
class DirectiveTemplateHostComponent {
  items = ORG_ITEMS;
}

@Component({
  standalone: true,
  imports: [SdOrgChart],
  template: `
    <ng-template #card let-item let-hasChildren="hasChildren">
      <span class="input-template">{{ item.title }}:{{ hasChildren }}</span>
    </ng-template>
    <sd-org-chart [items]="items" [itemTemplate]="card" />
  `,
})
class InputTemplateHostComponent {
  items = ORG_ITEMS;
}

describe('SdOrgChart', () => {
  it('renders the default item card with image, title, description, color and child nodes', async () => {
    const fixture = await createFixture(DefaultHostComponent);

    const chart = fixture.nativeElement as HTMLElement;
    const host = chart.querySelector('sd-org-chart') as HTMLElement;
    const root = chart.querySelector('[data-node-id="ceo"]') as HTMLElement;

    expect(host.getAttribute('data-autoid')).toBe('components-org-chart-basic');
    expect(root).withContext('root card is rendered').toBeTruthy();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('amy.png');
    expect(root.querySelector('.sd-org-chart__title')?.textContent?.trim()).toBe('Amy Elsner');
    expect(root.querySelector('.sd-org-chart__description')?.textContent?.trim()).toBe('CEO');
    expect(root.style.getPropertyValue('--sd-org-node-color')).toBe('#dfe6ff');
    expect(chart.textContent).toContain('Development');
    expect(chart.textContent).toContain('UI/UX Design');
  });

  it('renders stable data-autoid attributes for nodes and default node parts', async () => {
    const fixture = await createFixture(DefaultHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('[data-autoid="components-org-chart-basic-node-ceo"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-basic-image-ceo"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-basic-title-ceo"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-basic-description-ceo"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-basic-toggle-ceo"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-basic-node-development"]')).toBeTruthy();
  });

  it('collapses and expands descendants from the node toggle', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;

    component.toggle(ORG_ITEMS[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Anna Fali');

    component.toggle(ORG_ITEMS[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
  });

  it('uses sdOrgChartItemDef as the projected item template', async () => {
    const fixture = await createFixture(DirectiveTemplateHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('.custom-node')?.textContent?.trim()).toBe('0:Amy Elsner');
    expect(chart.querySelector('.sd-org-chart__title')).toBeNull();
  });

  it('uses the itemTemplate input when no projected item template is provided', async () => {
    const fixture = await createFixture(InputTemplateHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('.input-template')?.textContent?.trim()).toBe('Amy Elsner:true');
    expect(chart.querySelector('.sd-org-chart__title')).toBeNull();
  });
});

async function createFixture<T>(component: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({
    imports: [component],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return fixture;
}

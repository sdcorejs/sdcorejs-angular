import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdOrgChart } from './org-chart.component';
import { SdOrgChartItemDefDirective } from './org-chart-item-def.directive';
import { SdOrgChartItem, SdOrgChartOption } from './org-chart.model';

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

const SPECIAL_ID_ITEMS: SdOrgChartItem[] = [
  {
    id: 'sales & marketing/1',
    title: 'Sales & Marketing',
    description: null,
  },
];

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [items]="items" autoId="basic" />`,
})
class DefaultHostComponent {
  items = ORG_ITEMS;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [items]="items" autoId="special" />`,
})
class SpecialIdHostComponent {
  items = SPECIAL_ID_ITEMS;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [items]="items" autoId="collapsed" />`,
})
class InitiallyCollapsedHostComponent {
  items: SdOrgChartItem[] = [
    {
      ...ORG_ITEMS[0],
      expanded: false,
    },
  ];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [items]="items" [collapsible]="false" autoId="locked" />`,
})
class NonCollapsibleHostComponent {
  items: SdOrgChartItem[] = [
    {
      ...ORG_ITEMS[0],
      expanded: false,
    },
  ];
}

// why: `[option]` là API mới; `collapsible` nằm TRONG option nên input thô `collapsible()` vẫn giữ
// mặc định true — đúng cấu hình từng làm chevron render dù toggle đã bị chặn.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [option]="option" />`,
})
class OptionNonCollapsibleHostComponent {
  readonly option: SdOrgChartOption = {
    autoId: 'option-locked',
    items: ORG_ITEMS,
    collapsible: false,
  };
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart],
  template: `<sd-org-chart [option]="option" />`,
})
class OptionCollapsibleHostComponent {
  readonly option: SdOrgChartOption = {
    autoId: 'option-open',
    items: ORG_ITEMS,
  };
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdOrgChart, SdOrgChartItemDefDirective],
  template: `
    <sd-org-chart [items]="items">
      <ng-template
        sdOrgChartItemDef
        let-item
        let-depth="depth"
        let-parent="parent"
        let-expanded="expanded"
        let-hasChildren="hasChildren"
        let-isLeaf="isLeaf"
        let-toggle="toggle">
        <button type="button" class="custom-node" (click)="toggle()">
          {{ depth }}:{{ parent?.id || 'root' }}:{{ item.title }}:{{ expanded }}:{{ hasChildren }}:{{ isLeaf }}
        </button>
      </ng-template>
    </sd-org-chart>
  `,
})
class DirectiveTemplateHostComponent {
  items = ORG_ITEMS;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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

  it('renders the expected treeitem roles, hierarchy and aria state for expanded nodes', async () => {
    const fixture = await createFixture(DefaultHostComponent);

    const chart = fixture.nativeElement as HTMLElement;
    const tree = chart.querySelector('[role="tree"]') as HTMLElement;
    const treeItems = Array.from(chart.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const groups = Array.from(chart.querySelectorAll<HTMLElement>('[role="group"]'));

    expect(tree).withContext('tree wrapper is rendered').toBeTruthy();
    expect(treeItems.map(item => item.querySelector<HTMLElement>('[data-node-id]')?.dataset['nodeId'])).toEqual([
      'ceo',
      'cmo',
      'sales',
      'marketing',
      'cto',
      'development',
      'design',
    ]);
    expect(groups.length).toBe(3);
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('true');
    expect(nodeElement(chart, 'cmo').getAttribute('aria-expanded')).toBe('true');
    expect(nodeElement(chart, 'sales').getAttribute('aria-expanded')).toBeNull();
  });

  // why: role="treeitem" BẮT BUỘC có aria-selected — thiếu nó screen reader bỏ qua ngữ nghĩa tree.
  // Org-chart là sơ đồ chỉ-đọc nên khai tĩnh "false" (đúng sự thật), kèm aria-level cho độ sâu.
  it('declares the required aria-selected and an aria-level on every treeitem', async () => {
    const fixture = await createFixture(DefaultHostComponent);

    const chart = fixture.nativeElement as HTMLElement;
    const treeItems = Array.from(chart.querySelectorAll<HTMLElement>('[role="treeitem"]'));

    expect(treeItems.length).toBeGreaterThan(0);
    treeItems.forEach(item => expect(item.getAttribute('aria-selected')).toBe('false'));

    expect(nodeElement(chart, 'ceo').getAttribute('aria-level')).toBe('1');
    expect(nodeElement(chart, 'cmo').getAttribute('aria-level')).toBe('2');
    expect(nodeElement(chart, 'sales').getAttribute('aria-level')).toBe('3');
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

  it('sanitizes node ids before appending them to data-autoid attributes', async () => {
    const fixture = await createFixture(SpecialIdHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('[data-autoid="components-org-chart-special-node-sales---marketing-1"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid="components-org-chart-special-title-sales---marketing-1"]')).toBeTruthy();
    expect(chart.querySelector('[data-autoid*="sales & marketing/1"]')).toBeNull();
  });

  it('collapses and expands descendants from the component API', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;

    component.toggle(ORG_ITEMS[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Anna Fali');

    component.toggle(ORG_ITEMS[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
  });

  it('collapses and expands descendants from the node toggle button', async () => {
    const fixture = await createFixture(DefaultHostComponent);

    const chart = fixture.nativeElement as HTMLElement;
    const toggle = chart.querySelector('[data-autoid="components-org-chart-basic-toggle-ceo"]') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Anna Fali');
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.querySelector('mat-icon')?.textContent?.trim()).toBe('chevron_right');

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.querySelector('mat-icon')?.textContent?.trim()).toBe('expand_more');
  });

  it('honors item.expanded as the initial collapsible state', async () => {
    const fixture = await createFixture(InitiallyCollapsedHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(fixture.nativeElement.textContent).not.toContain('Anna Fali');
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('false');
    expect(chart.querySelector('[data-autoid="components-org-chart-collapsed-toggle-ceo"]')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps all descendants visible and suppresses toggles when collapsible is false', async () => {
    const fixture = await createFixture(NonCollapsibleHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;

    const chart = fixture.nativeElement as HTMLElement;

    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
    expect(chart.querySelector('[data-autoid="components-org-chart-locked-toggle-ceo"]')).toBeNull();
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('true');

    component.toggle(ORG_ITEMS[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
  });

  it('ignores toggle requests for leaf nodes', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;

    component.toggle(ORG_ITEMS[0].children![0].children![0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sales');
    expect(component.isExpanded(ORG_ITEMS[0])).toBeTrue();
  });

  it('uses sdOrgChartItemDef as the projected item template', async () => {
    const fixture = await createFixture(DirectiveTemplateHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('.custom-node')?.textContent?.trim()).toBe('0:root:Amy Elsner:true:true:false');
    expect(Array.from(chart.querySelectorAll('.custom-node')).map(node => node.textContent?.trim())).toContain(
      '2:cmo:Sales:true:false:true'
    );
    expect(chart.querySelector('.sd-org-chart__title')).toBeNull();
  });

  it('passes a working toggle function through the projected template context', async () => {
    const fixture = await createFixture(DirectiveTemplateHostComponent);

    const rootTemplateButton = fixture.nativeElement.querySelector('.custom-node') as HTMLButtonElement;

    rootTemplateButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Anna Fali');
  });

  it('uses the itemTemplate input when no projected item template is provided', async () => {
    const fixture = await createFixture(InputTemplateHostComponent);

    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('.input-template')?.textContent?.trim()).toBe('Amy Elsner:true');
    expect(chart.querySelector('.sd-org-chart__title')).toBeNull();
  });

  it('exposes public helpers for children, expansion state, context and tracking', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;
    const cmo = ORG_ITEMS[0].children![0];
    const sales = cmo.children![0];

    const cmoContext = component.createContext(cmo, 1, ORG_ITEMS[0]);
    const salesContext = component.createContext(sales, 2, cmo);

    expect(component.trackByItem(0, cmo)).toBe('cmo');
    expect(component.childrenOf({ id: 'empty', title: 'Empty' })).toEqual([]);
    expect(component.hasChildren(cmo)).toBeTrue();
    expect(component.hasChildren(sales)).toBeFalse();
    expect(cmoContext).toEqual(
      jasmine.objectContaining({
        $implicit: cmo,
        item: cmo,
        depth: 1,
        parent: ORG_ITEMS[0],
        expanded: true,
        hasChildren: true,
        isLeaf: false,
      })
    );
    expect(salesContext).toEqual(
      jasmine.objectContaining({
        $implicit: sales,
        item: sales,
        depth: 2,
        parent: cmo,
        expanded: true,
        hasChildren: false,
        isLeaf: true,
      })
    );

    cmoContext.toggle();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Sales');
    expect(component.isExpanded(cmo)).toBeFalse();
  });

  // why: template gate cũ đọc input THÔ `collapsible()` thay vì `resolvedCollapsible()`, nên
  // `[option]="{ collapsible: false }"` vẫn render chevron dù `toggle()` đã chặn — nút chết.
  it('hides the node toggle when collapsible is disabled through option', async () => {
    const fixture = await createFixture(OptionNonCollapsibleHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;
    const chart = fixture.nativeElement as HTMLElement;

    expect(component.resolvedCollapsible()).toBeFalse();
    expect(chart.querySelector('.sd-org-chart__toggle')).toBeNull();
    expect(chart.querySelector('[data-autoid="components-org-chart-option-locked-toggle-ceo"]')).toBeNull();
    expect(nodeElement(chart, 'ceo').getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Anna Fali');
  });

  it('still renders the node toggle when option omits collapsible', async () => {
    const fixture = await createFixture(OptionCollapsibleHostComponent);
    const chart = fixture.nativeElement as HTMLElement;

    expect(chart.querySelector('[data-autoid="components-org-chart-option-open-toggle-ceo"]')).toBeTruthy();
  });

  // why: `createContext` được gọi thẳng từ template nên trước đây cấp phát một context MỚI cho
  // MỖI node ở MỖI chu kỳ change detection rồi đưa vào `*ngTemplateOutlet`.
  it('memoizes the item context so change detection does not allocate a new one per node', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;
    const ceo = ORG_ITEMS[0];
    const cmo = ceo.children![0];
    const sales = cmo.children![0];

    const ceoContext = component.createContext(ceo, 0, null);
    const salesContext = component.createContext(sales, 2, cmo);

    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.createContext(ceo, 0, null)).toBe(ceoContext);
    expect(component.createContext(sales, 2, cmo)).toBe(salesContext);
    expect(component.createContext(cmo, 1, ceo)).not.toBe(ceoContext);
  });

  it('refreshes the memoized context when expansion state changes', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;
    const ceo = ORG_ITEMS[0];

    expect(component.createContext(ceo, 0, null).expanded).toBeTrue();

    component.toggle(ceo);
    fixture.detectChanges();

    expect(component.createContext(ceo, 0, null).expanded).toBeFalse();
    expect(component.createContext(ceo, 0, null)).toBe(component.createContext(ceo, 0, null));
  });

  it('reuses one empty children array for leaf nodes', async () => {
    const fixture = await createFixture(DefaultHostComponent);
    const component = fixture.debugElement.query(By.directive(SdOrgChart)).componentInstance as SdOrgChart;
    const sales = ORG_ITEMS[0].children![0].children![0];
    const design = ORG_ITEMS[0].children![1].children![1];

    expect(component.childrenOf(sales)).toEqual([]);
    expect(component.childrenOf(sales)).toBe(component.childrenOf(design));
  });

  it('does not include the old expanded-parent connector selector that drew an extra line', async () => {
    await createFixture(DefaultHostComponent);

    const orgChartCss = collectCssText('.sd-org-chart__node');

    expect(orgChartCss).toContain('.sd-org-chart__children');
    expect(orgChartCss).not.toContain('.sd-org-chart__node--expanded');
    expect(orgChartCss).not.toContain('.sd-org-chart__node-shell::after');
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

function nodeElement(chart: HTMLElement, id: string): HTMLElement {
  return chart.querySelector(`[data-node-id="${id}"]`)?.closest('[role="treeitem"]') as HTMLElement;
}

function collectCssText(selectorNeedle: string): string {
  return Array.from(document.styleSheets)
    .flatMap(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules);
      } catch {
        return [];
      }
    })
    .map(rule => rule.cssText)
    .filter(cssText => cssText.includes(selectorNeedle))
    .join('\n');
}

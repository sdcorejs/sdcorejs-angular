import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTree } from './tree.component';
import { SdTreeItemLazy, SdTreeLazyComponentOption, SdTreeToggleEvent } from './tree.model';

// Các lỗi do review độc lập (R1, R2) tìm ra. Mỗi test giữ đúng kịch bản trong báo cáo ở
// .sdcorejs/handoff/design-tree-selection/reviews/.

interface Category {
  id: string;
}

type SearchResult = readonly { path: readonly SdTreeItemLazy<Category>[] }[];

const lazy = (id: string, hasChildren = true): SdTreeItemLazy<Category> => ({ id, label: `Label ${id}`, data: { id }, hasChildren });
const CHILDREN: Record<string, SdTreeItemLazy<Category>[]> = {
  r1: [lazy('c1'), lazy('c2', false)],
  c1: [lazy('g1', false), lazy('g2', false)],
};
const DEBOUNCE_MS = 300;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => (resolve = res));
  return { promise, resolve };
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `
    <sd-tree
      style="display: block; height: 100px; overflow: auto"
      [option]="option()"
      [(activeId)]="activeId"
      (expandChange)="expanded.push($event)" />
  `,
})
class ReviewHostComponent {
  readonly activeId = signal<string | null>(null);
  readonly selected = signal<Category[]>([]);
  readonly expanded: SdTreeToggleEvent<Category>[] = [];
  readonly expandChildren = jasmine
    .createSpy('onExpandChildren')
    .and.callFake((item: SdTreeItemLazy<Category>) => Promise.resolve(CHILDREN[item.id] ?? []));
  readonly search = jasmine
    .createSpy('onSearch')
    .and.callFake((): Promise<SearchResult> => Promise.resolve([{ path: [lazy('r1'), lazy('c1'), lazy('g1', false)] }]));
  readonly resolvePath = jasmine.createSpy('onResolvePath').and.returnValue(Promise.resolve(['r1', 'c1']));
  readonly base: SdTreeLazyComponentOption<Category> = {
    autoId: 'rb',
    navigation: true,
    items: [lazy('r1'), lazy('r2', false)],
    tree: {
      loadType: 'lazy',
      onExpandChildren: this.expandChildren,
      onSearch: this.search,
      onResolvePath: this.resolvePath,
    },
  };
  /** Hai chiều như consumer thật: cây phát gì thì ghi lại đúng thứ đó vào `selectedItems`. */
  readonly option = signal<SdTreeLazyComponentOption<Category>>(this.base);

  withSelector(cascade?: 'descendants'): void {
    const build = (): SdTreeLazyComponentOption<Category> => ({
      ...this.base,
      selector: { visible: true, cascade },
      selectedItems: this.selected(),
      onSelectedItemsChange: items => {
        this.selected.set(items);
        this.option.set(build());
      },
    });
    this.option.set(build());
  }
}

describe('SdTree review fixes (TR-B)', () => {
  let fixture: ComponentFixture<ReviewHostComponent>;
  let host: HTMLElement;
  let component: ReviewHostComponent;
  let tree: SdTree<Category>;

  const settle = async () => {
    for (let pass = 0; pass < 3; pass++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };
  const setup = async (before?: (host: ReviewHostComponent) => void) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, ReviewHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(ReviewHostComponent);
    component = fixture.componentInstance;
    before?.(component);
    await settle();
    host = fixture.nativeElement;
    tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;
  };
  const row = (id: string) => host.querySelector<HTMLElement>(`[data-autoid="components-tree-rb-row-${id}"]`);
  const visibleIds = () => tree.visibleNodes().map(node => node.id);
  const tick = async (id: string) => {
    tree.toggleSelection(tree.visibleNodes().find(node => node.id === id)!);
    await settle();
  };
  const searchFor = async (text: string) => {
    tree.filter(text);
    jasmine.clock().tick(DEBOUNCE_MS);
    await settle();
  };
  const ids = (items: Category[]) => items.map(value => value.id).sort();

  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('TR-B-01 ticking inside search results keeps the selection made before the search (R1 C1)', async () => {
    await setup(hostComponent => hostComponent.withSelector());
    await tick('r2');
    expect(ids(component.selected())).toEqual(['r2']);

    await searchFor('g');
    expect(visibleIds()).toEqual(['r1', 'c1', 'g1']);
    // r2 is outside the results but still counts.
    expect(ids(tree.selectedItems())).toEqual(['r2']);

    await tick('g1');
    expect(ids(component.selected())).toEqual(['g1', 'r2']);
    expect(tree.selectedCount()).toBe(2);

    await searchFor('');
    // g1 was only ever seen in the results: it stays selected after the search is cleared.
    expect(ids(component.selected())).toEqual(['g1', 'r2']);
    expect(ids(tree.selectedItems())).toEqual(['g1', 'r2']);
    expect(row('r2')!.getAttribute('aria-checked')).toBe('true');

    await tick('r2');
    expect(ids(component.selected())).toEqual(['g1']);
  });

  it('TR-B-01 cascade inside search results does not tick ancestors that have children outside the results (R1 G6)', async () => {
    await setup(hostComponent => hostComponent.withSelector('descendants'));
    await searchFor('g');
    await tick('g1');
    expect(ids(component.selected())).toEqual(['g1']);
  });

  it('TR-B-02 an aborted reveal does not open the ancestor that was loading (R1 N2)', async () => {
    await setup();
    const slow = deferred<SdTreeItemLazy<Category>[]>();
    component.expandChildren.and.returnValue(slow.promise);
    const pending = tree.reveal('g1');
    await settle();
    expect(component.expandChildren).toHaveBeenCalledTimes(1);

    row('r2')!.click();
    slow.resolve(CHILDREN['r1']);
    expect(await pending).toBeFalse();
    await settle();

    expect(row('r1')!.getAttribute('aria-expanded')).toBe('false');
    expect(component.expanded).toEqual([]);
    expect(component.activeId()).toBe('r2');
  });

  it('TR-B-03 an activeId set from outside during a search is revealed once the search is cleared (R1 N3)', async () => {
    await setup();
    component.resolvePath.and.returnValue(Promise.resolve(['r1']));
    await searchFor('g');
    component.activeId.set('c2');
    await settle();
    expect(row('c2')).toBeNull();

    await searchFor('');
    expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'r2']);
    expect(row('c2')!.classList).toContain('sd-tree__row--active');
  });

  it('TR-B-04 reveal scrolls when the tree host itself is the scroll area (R1 N4)', async () => {
    await setup();
    const scroller = host.querySelector<HTMLElement>('sd-tree')!;
    expect(await tree.reveal('g2')).toBeTrue();
    await settle();

    expect(scroller.scrollTop).toBeGreaterThan(0);
    const box = scroller.getBoundingClientRect();
    const rect = row('g2')!.getBoundingClientRect();
    expect(rect.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
  });

  it('TR-B-05 dropping onSearch while results are shown gives the tree back on filter("") (R1 G4)', async () => {
    await setup();
    await searchFor('g');
    expect(visibleIds()).toEqual(['r1', 'c1', 'g1']);

    component.option.set({ ...component.base, tree: { loadType: 'lazy', onExpandChildren: component.expandChildren } });
    await settle();
    tree.filter('');
    await settle();
    expect(visibleIds()).toEqual(['r1', 'r2']);
  });

  it('TR-B-06 the search waits 300ms, the same as sd-kanban (R1 N1)', async () => {
    await setup();
    tree.filter('g');
    jasmine.clock().tick(DEBOUNCE_MS - 1);
    expect(component.search).not.toHaveBeenCalled();
    jasmine.clock().tick(1);
    expect(component.search).toHaveBeenCalledTimes(1);
  });
});

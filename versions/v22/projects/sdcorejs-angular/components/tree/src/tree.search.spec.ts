import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTree } from './tree.component';
import { SdTreeComponentOption, SdTreeItemLazy, SdTreeItemStatic, SdTreeLoadErrorEvent } from './tree.model';

interface Category {
  id: string;
}

type SearchResult = readonly { path: readonly SdTreeItemLazy<Category>[] }[];

const LABELS: Record<string, string> = {
  r1: 'Điện tử',
  c1: 'Điện thoại',
  c2: 'Máy tính bảng',
  g1: 'Điện thoại gập',
  g2: 'Ốp lưng điện thoại',
  r2: 'Gia dụng',
};
const lazy = (id: string, hasChildren = true): SdTreeItemLazy<Category> => ({ id, label: LABELS[id] ?? id, data: { id }, hasChildren });
const CHILDREN: Record<string, SdTreeItemLazy<Category>[]> = {
  r1: [lazy('c1'), lazy('c2', false)],
  c1: [lazy('g1', false), lazy('g2', false)],
};
const DEBOUNCE_MS = 300;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option()" [(activeId)]="activeId" (loadError)="errors.push($event)" />`,
})
class SearchHostComponent {
  readonly activeId = signal<string | null>(null);
  readonly errors: SdTreeLoadErrorEvent<Category>[] = [];
  readonly search = jasmine
    .createSpy('onSearch')
    .and.callFake(
      (_text: string, _signal: AbortSignal): Promise<SearchResult> =>
        Promise.resolve([
          { path: [lazy('r1'), lazy('c1'), lazy('g1', false)] },
          { path: [lazy('r1'), lazy('c1'), lazy('g2', false)] },
          { path: [lazy('r1'), lazy('c1')] },
        ])
    );
  readonly expandChildren = jasmine
    .createSpy('onExpandChildren')
    .and.callFake((item: SdTreeItemLazy<Category>) => Promise.resolve(CHILDREN[item.id] ?? []));
  readonly option = signal<SdTreeComponentOption<Category>>({
    autoId: 'sr',
    navigation: true,
    items: [lazy('r1'), lazy('r2', false)],
    tree: { loadType: 'lazy', onExpandChildren: this.expandChildren, onSearch: this.search },
  });
}

describe('SdTree search (R6)', () => {
  let fixture: ComponentFixture<SearchHostComponent>;
  let host: HTMLElement;
  let component: SearchHostComponent;
  let tree: SdTree<Category>;

  const settle = async () => {
    for (let pass = 0; pass < 3; pass++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };
  const setup = async (option?: SdTreeComponentOption<Category>) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, SearchHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchHostComponent);
    component = fixture.componentInstance;
    if (option) component.option.set(option);
    await settle();
    host = fixture.nativeElement;
    tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;
  };
  const row = (id: string) => host.querySelector<HTMLElement>(`[data-autoid="components-tree-sr-row-${id}"]`);
  const visibleIds = () => tree.visibleNodes().map(node => node.id);
  const marks = (id: string) => Array.from(row(id)!.querySelectorAll('mark')).map(mark => mark.textContent);
  /** Chạy hết thời gian chờ của debounce rồi để promise của onSearch hoàn tất. */
  const elapse = async (ms = DEBOUNCE_MS) => {
    jasmine.clock().tick(ms);
    await settle();
  };

  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('TR-09 debounces like the table quick search and sends only the last text', async () => {
    await setup();
    tree.filter('đ');
    jasmine.clock().tick(DEBOUNCE_MS - 1);
    tree.filter('điện');
    jasmine.clock().tick(DEBOUNCE_MS - 1);
    expect(component.search).not.toHaveBeenCalled();
    // While the search waits, the loaded tree stays as it is: no local filtering.
    expect(visibleIds()).toEqual(['r1', 'r2']);

    await elapse(1);
    expect(component.search).toHaveBeenCalledOnceWith('điện', jasmine.any(AbortSignal));
  });

  it('TR-09 a newer text aborts the search in flight and ignores its late result', async () => {
    await setup();
    const first = deferred<SearchResult>();
    const signals: AbortSignal[] = [];
    component.search.and.callFake((text: string, signal: AbortSignal) => {
      signals.push(signal);
      return text === 'cũ' ? first.promise : Promise.resolve([{ path: [lazy('r2', false)] }]);
    });

    tree.filter('cũ');
    await elapse();
    expect(signals[0].aborted).toBeFalse();

    tree.filter('gia');
    expect(signals[0].aborted).toBeTrue();
    await elapse();
    expect(visibleIds()).toEqual(['r2']);

    first.resolve([{ path: [lazy('r1'), lazy('c1')] }]);
    await settle();
    expect(visibleIds()).toEqual(['r2']);
  });

  it('TR-09 results replace the tree: paths merged by id, all open, ancestors muted', async () => {
    await setup();
    tree.filter('điện thoại');
    await elapse();

    expect(visibleIds()).toEqual(['r1', 'c1', 'g1', 'g2']);
    expect(row('r1')!.getAttribute('aria-expanded')).toBe('true');
    expect(row('c1')!.getAttribute('aria-expanded')).toBe('true');
    expect(component.expandChildren).not.toHaveBeenCalled();

    // r1 is only on the way to a match; c1 is both an ancestor and a match.
    expect(row('r1')!.classList).toContain('sd-tree__row--context');
    for (const id of ['c1', 'g1', 'g2']) expect(row(id)!.classList).not.toContain('sd-tree__row--context');
    const label = (id: string) => getComputedStyle(row(id)!.querySelector('.sd-tree__label')!).color;
    expect(label('r1')).not.toBe(label('g1'));
  });

  it('TR-09 highlights the accent-insensitive match in <mark>, text colour unchanged', async () => {
    await setup();
    tree.filter('dien thoai');
    await elapse();

    expect(marks('c1')).toEqual(['Điện thoại']);
    expect(marks('g2')).toEqual(['điện thoại']);
    expect(marks('r1')).toEqual([]);
    expect(row('g2')!.querySelector('.sd-tree__label')!.textContent!.trim()).toBe('Ốp lưng điện thoại');

    const mark = row('g1')!.querySelector('mark')!;
    const style = getComputedStyle(mark);
    expect(style.borderRadius).toBe('2px');
    expect(style.color).toBe(getComputedStyle(mark.parentElement!).color);
    expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('TR-09 clearing the text restores the open state from before the search and keeps activeId', async () => {
    await setup();
    await tree.expand('r1');
    await settle();
    row('c2')!.click();
    await settle();
    const before = visibleIds();
    expect(before).toEqual(['r1', 'c1', 'c2', 'r2']);

    tree.filter('điện');
    await elapse();
    // Collapsing inside the results must not leak into the real tree.
    host.querySelector<HTMLElement>('[data-autoid="components-tree-sr-toggle-r1"]')!.click();
    await settle();
    expect(visibleIds()).toEqual(['r1']);

    component.search.calls.reset();
    tree.filter('');
    await settle();
    expect(visibleIds()).toEqual(before);
    expect(component.activeId()).toBe('c2');
    expect(row('c2')!.classList).toContain('sd-tree__row--active');
    expect(host.querySelector('mark')).toBeNull();
    expect(host.querySelector('.sd-tree__row--context')).toBeNull();

    await elapse();
    expect(component.search).not.toHaveBeenCalled();
  });

  it('TR-09 clearing the text cancels a search that is still waiting or running', async () => {
    await setup();
    tree.filter('điện');
    jasmine.clock().tick(DEBOUNCE_MS - 1);
    tree.filter(null);
    await elapse();
    expect(component.search).not.toHaveBeenCalled();

    const slow = deferred<SearchResult>();
    component.search.and.returnValue(slow.promise);
    tree.filter('điện');
    await elapse();
    tree.filter('   ');
    slow.resolve([{ path: [lazy('r2', false)] }]);
    await settle();
    expect(visibleIds()).toEqual(['r1', 'r2']);
  });

  it('TR-09 a failed search emits loadError and leaves the tree alone', async () => {
    await setup();
    component.search.and.returnValue(Promise.reject(new Error('boom')));
    tree.filter('điện');
    await elapse();

    expect(component.errors.length).toBe(1);
    expect(visibleIds()).toEqual(['r1', 'r2']);
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it('TR-09 without onSearch: filter() stays synchronous over loaded nodes and gains the highlight', async () => {
    const items: SdTreeItemStatic<Category>[] = [
      { id: 'r1', label: LABELS['r1'], data: { id: 'r1' }, children: [{ id: 'c1', label: LABELS['c1'], data: { id: 'c1' } }] },
      { id: 'r2', label: LABELS['r2'], data: { id: 'r2' } },
    ];
    await setup({ autoId: 'sr', items, tree: { loadType: 'static' } });

    tree.filter('THOAI');
    fixture.detectChanges();

    expect(visibleIds()).toEqual(['r1', 'c1']);
    expect(marks('c1')).toEqual(['thoại']);
    expect(marks('r1')).toEqual([]);
    // Muted ancestors belong to the server search only.
    expect(host.querySelector('.sd-tree__row--context')).toBeNull();

    tree.filter('');
    fixture.detectChanges();
    expect(visibleIds()).toEqual(['r1', 'r2']);
    expect(host.querySelector('mark')).toBeNull();
  });
});

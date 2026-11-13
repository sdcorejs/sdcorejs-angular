import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdTree } from './tree.component';
import { SdTreeItemStatic, SdTreeSelectionAction, SdTreeStaticComponentOption } from './tree.model';

interface Category {
  id: string;
}

const ITEMS: SdTreeItemStatic<Category>[] = Array.from({ length: 12 }, (_, index) => ({
  id: `n${index}`,
  label: `Node ${index}`,
  data: { id: `n${index}` },
}));

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTree],
  template: `
    <div class="scroller" style="height: 240px; width: 640px; overflow: auto">
      <sd-tree [option]="option()" />
    </div>
  `,
})
class BarTreeHostComponent {
  readonly spies = ['archive', 'move', 'tag'].map(name => jasmine.createSpy(name));
  readonly actions: SdTreeSelectionAction<Category>[] = [
    { icon: 'archive', title: 'Lưu trữ', click: this.spies[0] },
    { icon: 'drive_file_move', title: 'Chuyển', color: 'primary', type: 'outline', click: this.spies[1] },
    { icon: 'label', title: 'Gán nhãn', click: this.spies[2] },
    { icon: 'lock', title: 'Ẩn', hidden: true, click: () => undefined },
  ];
  readonly option = signal<SdTreeStaticComponentOption<Category>>({
    autoId: 'cat',
    items: ITEMS,
    selector: { visible: true, actions: this.actions },
  });
}

describe('SdTree selection bar (SB)', () => {
  let fixture: ComponentFixture<BarTreeHostComponent>;
  let host: HTMLElement;
  let component: BarTreeHostComponent;
  let tree: SdTree<Category>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const setup = async (patch: Partial<SdTreeStaticComponentOption<Category>> = {}) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, BarTreeHostComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(BarTreeHostComponent);
    component = fixture.componentInstance;
    component.option.update(option => ({ ...option, ...patch }));
    await settle();
    host = fixture.nativeElement;
    tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;
  };
  const select = async (...ids: string[]) => {
    for (const id of ids) tree.toggleSelection(tree.visibleNodes().find(node => node.id === id)!);
    await settle();
  };
  const bar = () => host.querySelector<HTMLElement>('sd-tree > sd-selection-bar')!;
  const frame = () => host.querySelector<HTMLElement>('sd-tree .c-quick-action.contained');
  const treeHost = () => host.querySelector<HTMLElement>('sd-tree')!;
  const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();
  const messageText = () => host.querySelector('.sd-selection-message > span:last-child')!.textContent!.trim();

  beforeEach(() => document.documentElement.style.setProperty('--sd-surface', 'rgb(250, 250, 250)'));
  afterEach(() => document.documentElement.style.removeProperty('--sd-surface'));

  it('SB-02 the bar lives inside the tree host, after the rows, and is closed with no selection', async () => {
    await setup();
    expect(bar()).not.toBeNull();
    expect(bar().previousElementSibling).toBe(host.querySelector('sd-tree > .sd-tree'));
    expect(frame()).toBeNull();
    // The floating quick-action and its badge are gone.
    expect(host.querySelector('.c-quick-action:not(.contained)')).toBeNull();
    expect(host.querySelector('.c-bg-length, .c-length, .c-message, .sd-tree__qa-actions, .sd-tree__qa-count')).toBeNull();
  });

  it('SB-02 opened: sticky at the bottom of the scroll area on a surface background, 8px inline padding', async () => {
    await setup();
    await select('n1', 'n3');

    expect(frame()).not.toBeNull();
    const style = getComputedStyle(bar());
    expect(style.position).toBe('sticky');
    expect(style.bottom).toBe('0px');
    expect(style.paddingLeft).toBe('8px');
    expect(style.paddingRight).toBe('8px');
    expect(style.backgroundColor).toBe('rgb(250, 250, 250)');

    // Sticky: the bar sits at the bottom edge of the scroll area while the list is at the top.
    const scroller = host.querySelector<HTMLElement>('.scroller')!;
    expect(scroller.scrollTop).toBe(0);
    expect(Math.abs(bar().getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom)).toBeLessThan(1.5);
    expect(messageText()).toBe('Đã chọn 2 mục');
  });

  it('SB-02 opened: the host reserves the height of the bar, so the last row is never covered', async () => {
    await setup();
    const closedHeight = treeHost().getBoundingClientRect().height;
    await select('n1');

    const barHeight = bar().getBoundingClientRect().height;
    expect(barHeight).toBeGreaterThan(40);
    expect(treeHost().getBoundingClientRect().height).toBeCloseTo(closedHeight + barHeight, 0);

    const scroller = host.querySelector<HTMLElement>('.scroller')!;
    scroller.scrollTop = scroller.scrollHeight;
    const rows = host.querySelectorAll<HTMLElement>('[role="treeitem"]');
    const lastRow = rows[rows.length - 1].getBoundingClientRect();
    expect(lastRow.bottom).toBeLessThanOrEqual(bar().getBoundingClientRect().top + 0.5);

    tree.clearSelection();
    await settle();
    expect(treeHost().getBoundingClientRect().height).toBeCloseTo(closedHeight, 0);
  });

  it('SB-02 no visible action means no bar (sd-tree-select), whatever is selected', async () => {
    await setup({ selector: { visible: true } });
    await select('n1');
    expect(tree.selectedCount()).toBe(1);
    expect(frame()).toBeNull();
    expect(bar().getBoundingClientRect().height).toBe(0);

    component.option.update(option => ({ ...option, selector: { visible: true, actions: [component.actions[3]] } }));
    await settle();
    expect(frame()).toBeNull();
  });

  it('SB-02 keeps the tree autoIds and the custom message', async () => {
    await setup();
    component.option.update(option => ({
      ...option,
      selector: { visible: true, actions: component.actions, message: items => `${items.length} danh mục` },
    }));
    await select('n1', 'n2');

    expect(messageText()).toBe('2 danh mục');
    for (const index of [0, 1]) {
      expect(host.querySelector(`[data-autoid="components-button-components-tree-cat-selection-action-${index}"]`)).not.toBeNull();
    }
    const clear = host.querySelector<HTMLButtonElement>('[data-autoid="components-button-components-tree-cat-clear-selection"]')!;
    clear.click();
    await settle();
    expect(tree.selectedCount()).toBe(0);
    expect(frame()).toBeNull();
  });

  it('SB-04 actions keep their shape: two direct, the third under "more", hidden ones dropped, click gets the selection', async () => {
    await setup();
    await select('n1', 'n2');

    const direct = Array.from(host.querySelectorAll<HTMLElement>('.sd-selection-direct'));
    expect(direct.map(element => element.querySelector('.c-title')!.textContent!.trim())).toEqual(['Lưu trữ', 'Chuyển']);
    // type defaults to light; an explicit type and colour pass through.
    expect(direct[0].querySelector('button')!.classList).toContain('c-light');
    expect(direct[1].querySelector('button')!.classList).toContain('c-outline');
    expect(direct[0].querySelector('button')!.classList).toContain('c-sm');
    expect(direct[0].querySelector('.c-icon-prefix')!.textContent!.trim()).toBe('archive');

    direct[0].querySelector('button')!.click();
    expect(component.spies[0]).toHaveBeenCalledOnceWith([{ id: 'n1' }, { id: 'n2' }]);

    host.querySelector<HTMLButtonElement>('.sd-selection-more button')!.click();
    fixture.detectChanges();
    const items = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.sd-action-item'));
    expect(items.map(item => item.querySelector('.sd-action-label')!.textContent!.trim())).toEqual(['Gán nhãn']);
    expect(items[0].getAttribute('data-autoid')).toBe('components-tree-cat-selection-action-2');
    items[0].click();
    expect(component.spies[2]).toHaveBeenCalledOnceWith([{ id: 'n1' }, { id: 'n2' }]);
    expect(component.spies[1]).not.toHaveBeenCalled();
  });
});

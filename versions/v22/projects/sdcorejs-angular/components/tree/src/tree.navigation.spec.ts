import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdTree } from './tree.component';
import { SdTreeComponentOption, SdTreeItemStatic, SdTreeNode } from './tree.model';

interface Category {
  id: string;
  name: string;
}

const item = (id: string, children?: SdTreeItemStatic<Category>[], count?: number | null): SdTreeItemStatic<Category> => ({
  id,
  label: `Label ${id}`,
  data: { id, name: id },
  children,
  count,
});

const ITEMS: SdTreeItemStatic<Category>[] = [
  item('a', [item('a1', undefined, 1234), item('a2', undefined, null)], 12),
  item('b', [item('b1')], 0),
];

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option()" [(activeId)]="activeId" (activeChange)="activeEvents.push($event)" />`,
})
class NavHostComponent {
  readonly activeId = signal<string | null>(null);
  readonly activeEvents: { item: Category; node: SdTreeNode<Category> }[] = [];
  readonly onActivate = jasmine.createSpy('onActivate');
  readonly commandSpy = jasmine.createSpy('command');
  readonly option = signal<SdTreeComponentOption<Category>>(this.build({ navigation: true }));

  build(patch: Partial<SdTreeComponentOption<Category>>): SdTreeComponentOption<Category> {
    return {
      autoId: 'nav',
      items: ITEMS,
      tree: { loadType: 'static', defaultExpanded: true },
      commands: [{ key: 'rename', title: 'Rename', click: this.commandSpy }],
      onActivate: this.onActivate,
      ...patch,
    } as SdTreeComponentOption<Category>;
  }
}

describe('SdTree navigation (R1, R3, R4)', () => {
  let fixture: ComponentFixture<NavHostComponent>;
  let host: HTMLElement;

  const setup = async (patch: Partial<SdTreeComponentOption<Category>> = { navigation: true }) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, NavHostComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(NavHostComponent);
    fixture.componentInstance.option.set(fixture.componentInstance.build(patch));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement;
  };
  const row = (id: string) => host.querySelector<HTMLElement>(`[data-autoid="components-tree-nav-row-${id}"]`)!;
  const part = (kind: string, id: string) => host.querySelector<HTMLElement>(`[data-autoid="components-tree-nav-${kind}-${id}"]`)!;
  const key = (id: string, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    row(id).dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => TestBed.inject(I18nService).setLanguage('vi', { reload: false }));

  it('TR-01 navigation off: row click and Enter keep the current behaviour and aria', async () => {
    await setup({ navigation: false, selector: { visible: true } });
    const component = fixture.componentInstance;

    row('a1').click();
    fixture.detectChanges();
    expect(component.activeId()).toBeNull();
    expect(component.activeEvents).toEqual([]);
    expect(component.onActivate).not.toHaveBeenCalled();

    key('a1', { key: 'Enter' });
    expect(component.activeId()).toBeNull();
    expect(row('a1').getAttribute('aria-selected')).toBe('true');
    expect(row('a1').getAttribute('aria-checked')).toBe('true');
    expect(row('a1').classList).toContain('sd-tree__row--selected');
    expect(row('a2').getAttribute('aria-selected')).toBe('false');

    // Shift+F10 belongs to navigation mode only.
    row('a1').focus();
    key('a1', { key: 'F10', shiftKey: true });
    expect(overlay().querySelector('.sd-action-popover')).toBeNull();
  });

  it('TR-01 navigation off without a selector: rows carry no aria-selected', async () => {
    await setup({ navigation: false });
    expect(row('a').hasAttribute('aria-selected')).toBeFalse();
    expect(row('a').hasAttribute('aria-checked')).toBeFalse();
  });

  it('TR-02 navigation on: a row click activates the node and emits activeChange and onActivate', async () => {
    await setup();
    const component = fixture.componentInstance;

    row('a1').click();
    fixture.detectChanges();

    expect(component.activeId()).toBe('a1');
    expect(component.activeEvents.length).toBe(1);
    expect(component.activeEvents[0].item).toEqual({ id: 'a1', name: 'a1' });
    expect(component.activeEvents[0].node.id).toBe('a1');
    expect(component.onActivate).toHaveBeenCalledOnceWith(jasmine.objectContaining({ item: { id: 'a1', name: 'a1' } }));

    // Activating the open node again still emits, so the consumer can reload the detail side.
    row('a1').click();
    fixture.detectChanges();
    expect(component.activeEvents.length).toBe(2);
    expect(component.onActivate).toHaveBeenCalledTimes(2);
  });

  it('TR-02 navigation on: Enter activates, Space does not', async () => {
    await setup();
    const component = fixture.componentInstance;

    expect(key('b', { key: 'Enter' }).defaultPrevented).toBeTrue();
    expect(component.activeId()).toBe('b');

    key('a', { key: ' ' });
    expect(component.activeId()).toBe('b');
    expect(component.activeEvents.length).toBe(1);
  });

  it('TR-02 navigation on: chevron, checkbox and the command trigger do not change the open node', async () => {
    await setup({ navigation: true, selector: { visible: true } });
    const component = fixture.componentInstance;
    const tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;

    part('toggle', 'a').click();
    await settle();
    expect(tree.visibleNodes().map(node => node.id)).toEqual(['a', 'b', 'b1']);

    part('checkbox', 'b').querySelector('input')!.click();
    await settle();
    expect(tree.selectedItems().map(value => value.id)).toEqual(['b']);

    part('command', 'b').querySelector('button')!.click();
    await settle();
    expect(overlay().querySelector('.sd-action-popover')).not.toBeNull();

    expect(component.activeId()).toBeNull();
    expect(component.activeEvents).toEqual([]);

    // Space toggles the checkbox, Enter opens the node.
    key('b1', { key: ' ' });
    expect(tree.selectedItems().map(value => value.id)).toEqual(['b', 'b1']);
    expect(component.activeId()).toBeNull();
  });

  it('TR-03 open node: background, primary icon, aria-selected on the open node only', async () => {
    await setup();
    row('a').click();
    fixture.detectChanges();

    expect(row('a').classList).toContain('sd-tree__row--active');
    expect(getComputedStyle(row('a')).backgroundColor).not.toBe(getComputedStyle(row('b')).backgroundColor);
    expect(part('icon', 'a').getAttribute('color')).toBe('primary');
    expect(part('icon', 'b').getAttribute('color')).toBeNull();
    expect(row('a').getAttribute('aria-selected')).toBe('true');
    expect(row('b').getAttribute('aria-selected')).toBe('false');
    expect(row('a').hasAttribute('aria-checked')).toBeFalse();
  });

  it('TR-03 navigation on: a ticked checkbox does not paint the row; aria-checked carries the tick', async () => {
    await setup({ navigation: true, selector: { visible: true } });
    part('checkbox', 'b1').querySelector('input')!.click();
    await settle();

    expect(row('b1').classList).not.toContain('sd-tree__row--selected');
    expect(row('b1').classList).not.toContain('sd-tree__row--active');
    expect(getComputedStyle(row('b1')).backgroundColor).toBe(getComputedStyle(row('a1')).backgroundColor);
    expect(row('b1').getAttribute('aria-checked')).toBe('true');
    expect(row('b1').getAttribute('aria-selected')).toBe('false');
    expect(part('icon', 'b').getAttribute('color')).toBeNull();
  });

  it('TR-03 an activeId that is not in the loaded tree is kept and paints nothing', async () => {
    await setup();
    fixture.componentInstance.activeId.set('missing');
    await settle();

    expect(fixture.componentInstance.activeId()).toBe('missing');
    expect(host.querySelector('.sd-tree__row--active')).toBeNull();
    expect(host.querySelector('[aria-selected="true"]')).toBeNull();
  });

  it('TR-06 count: rendered after the label, locale-formatted, in the accessible name', async () => {
    await setup();
    const count = (id: string) => row(id).querySelector<HTMLElement>('.sd-tree__count');

    expect(count('a')!.textContent!.trim()).toBe('12');
    expect(count('a1')!.textContent!.trim()).toBe(new Intl.NumberFormat('vi-VN').format(1234));
    expect(count('b')!.textContent!.trim()).toBe('0');
    expect(row('a1').getAttribute('aria-label')).toBe(`Label a1, ${new Intl.NumberFormat('vi-VN').format(1234)}`);

    const style = getComputedStyle(count('a')!);
    expect(style.fontSize).toBe('12px');
    expect(style.lineHeight).toBe('16px');
    expect(style.paddingTop).toBe('6px');
    expect(style.paddingLeft).toBe('8px');
    expect(style.fontVariantNumeric).toContain('tabular-nums');

    // The count sits between the label block and the command trigger.
    const children = Array.from(row('a').children);
    expect(children.indexOf(count('a')!)).toBeGreaterThan(children.indexOf(row('a').querySelector('.sd-tree__main')!));
    expect(children.indexOf(count('a')!)).toBeLessThan(children.indexOf(part('command', 'a')));

    TestBed.inject(I18nService).setLanguage('en', { reload: false });
    fixture.detectChanges();
    expect(count('a1')!.textContent!.trim()).toBe('1,234');
  });

  it('TR-06 count: null or missing draws nothing and leaves the accessible name alone', async () => {
    await setup();
    expect(row('a2').querySelector('.sd-tree__count')).toBeNull();
    expect(row('b1').querySelector('.sd-tree__count')).toBeNull();
    expect(row('a2').hasAttribute('aria-label')).toBeFalse();
  });

  it('TR-06 the command trigger keeps its place while hidden, so the count does not move', async () => {
    await setup();
    const trigger = part('command', 'a');
    expect(getComputedStyle(trigger).opacity).toBe('0');
    expect(getComputedStyle(trigger).display).not.toBe('none');
    expect(getComputedStyle(trigger).visibility).toBe('visible');
    expect(trigger.getBoundingClientRect().width).toBe(24);
  });

  it('TR-07 the command trigger shows on a focused row and on the open node, and is named per row', async () => {
    await setup();
    const opacity = (id: string) => getComputedStyle(part('command', id)).opacity;

    // The trigger fades in over --sd-duration-fast, so read the value once the transition is over.
    const fade = () => new Promise(resolve => setTimeout(resolve, 250));

    expect(opacity('a')).toBe('0');
    row('a').focus();
    await fade();
    expect(opacity('a')).toBe('1');
    expect(opacity('b')).toBe('0');

    row('b').click();
    fixture.detectChanges();
    row('a').focus();
    await fade();
    expect(opacity('b')).toBe('1');

    expect(part('command', 'a').querySelector('button')!.getAttribute('aria-label')).toBe('Thao tác với Label a');
  });

  it('TR-07 coarse pointers always show the command trigger', async () => {
    await setup();
    const rules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText.includes('pointer: coarse'))
      .flatMap(rule => Array.from(rule.cssRules) as CSSStyleRule[])
      .filter(rule => rule.selectorText?.includes('sd-tree__command-trigger'));
    expect(rules.length).toBe(1);
    expect(rules[0].style.opacity).toBe('1');
  });

  for (const init of [
    { key: 'F10', shiftKey: true },
    { key: 'ContextMenu', shiftKey: false },
  ]) {
    it(`TR-07 ${init.shiftKey ? 'Shift+F10' : 'ContextMenu'} opens the row menu; closing it returns focus to the row`, async () => {
      await setup();
      row('a1').focus();
      expect(key('a1', init).defaultPrevented).toBeTrue();
      await settle();

      const menu = overlay().querySelector<HTMLElement>('.sd-action-popover');
      expect(menu).not.toBeNull();
      expect(part('command', 'a1').querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
      expect(menu!.contains(document.activeElement)).toBeTrue();

      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await settle();
      expect(overlay().querySelector('.sd-action-popover')).toBeNull();
      expect(document.activeElement).toBe(row('a1'));
      expect(fixture.componentInstance.activeId()).toBeNull();
    });
  }

  it('TR-07 plain F10 and rows without commands do nothing', async () => {
    await setup({ navigation: true, commands: [] });
    row('a').focus();
    expect(key('a', { key: 'F10', shiftKey: true }).defaultPrevented).toBeFalse();
    expect(overlay().querySelector('.sd-action-popover')).toBeNull();
  });
});

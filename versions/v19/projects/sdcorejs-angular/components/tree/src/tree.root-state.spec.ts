import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdTreeEmptyDefDirective } from './tree-empty-def.directive';
import { SdTree } from './tree.component';
import { SdTreeComponentOption, SdTreeItemLazy, SdTreeItemStatic, SdTreeLoadErrorEvent } from './tree.model';

interface Category {
  id: string;
}

const leaf = (id: string, label = `Label ${id}`): SdTreeItemStatic<Category> => ({ id, label, data: { id } });

@Component({
  standalone: true,
  imports: [SdTree, SdTreeEmptyDefDirective],
  template: `
    <sd-tree [option]="option()" (loadError)="errors.push($event)">
      @if (custom()) {
        <ng-template sdTreeEmptyDef let-searching="searching" let-text="text">
          <p class="custom-empty">{{ searching ? 'none for ' + text : 'nothing' }}</p>
        </ng-template>
      }
    </sd-tree>
  `,
})
class RootStateHostComponent {
  readonly custom = signal(false);
  readonly errors: SdTreeLoadErrorEvent<Category>[] = [];
  readonly option = signal<SdTreeComponentOption<Category>>({ autoId: 'rs', items: [] });
}

describe('SdTree root states (R8)', () => {
  let fixture: ComponentFixture<RootStateHostComponent>;
  let host: HTMLElement;
  let component: RootStateHostComponent;
  let tree: SdTree<Category>;

  const settle = async () => {
    for (let pass = 0; pass < 3; pass++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };
  const setup = async (option: SdTreeComponentOption<Category>, custom = false) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, RootStateHostComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(RootStateHostComponent);
    component = fixture.componentInstance;
    component.option.set(option);
    component.custom.set(custom);
    await settle();
    host = fixture.nativeElement;
    tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;
  };
  const empty = () => host.querySelector<HTMLElement>('.sd-tree__root-empty');

  afterEach(() => TestBed.inject(I18nService).setLanguage('vi', { reload: false }));

  for (const [name, items] of [
    ['a rejected loader', () => Promise.reject(new Error('SECRET'))],
    [
      'a loader that throws',
      () => {
        throw new Error('SECRET');
      },
    ],
  ] as const) {
    it(`TR-11 error from ${name}: translated text, never the exception message`, async () => {
      await setup({ autoId: 'rs', items });
      const alert = host.querySelector<HTMLElement>('[role="alert"]')!;

      expect(alert).not.toBeNull();
      expect(host.textContent).not.toContain('SECRET');
      expect(alert.querySelector('.sd-tree__root-error-text')!.textContent!.trim()).toBe('Không tải được danh sách.');
      expect(component.errors.length).toBe(1);
      expect((component.errors[0].error as Error).message).toBe('SECRET');
      expect(host.querySelector('[role="tree"]')).toBeNull();
    });
  }

  it('TR-11 error: 24px error icon, body text colour, sd-button outline sm that retries', async () => {
    let calls = 0;
    const items = (): Promise<SdTreeItemStatic<Category>[]> =>
      ++calls === 1 ? Promise.reject(new Error('SECRET')) : Promise.resolve([leaf('ok')]);
    await setup({ autoId: 'rs', items });
    const alert = host.querySelector<HTMLElement>('[role="alert"]')!;

    const icon = alert.querySelector<HTMLElement>('sd-icon.sd-tree__root-error-icon')!;
    expect(icon.textContent!.trim()).toBe('error');
    expect(getComputedStyle(icon).fontSize).toBe('24px');
    const textColor = getComputedStyle(alert.querySelector('.sd-tree__root-error-text')!).color;
    expect(getComputedStyle(icon).color).not.toBe(textColor);
    expect(getComputedStyle(alert).color).toBe(textColor);

    const retry = alert.querySelector<HTMLButtonElement>('sd-button[data-tree-retry] button')!;
    expect(retry.classList).toContain('c-outline');
    expect(retry.classList).toContain('c-sm');
    expect(retry.textContent!.trim()).toBe('Thử lại');
    // The hand-drawn 36px button is gone.
    expect(alert.querySelector(':scope > button')).toBeNull();

    retry.click();
    await settle();
    expect(calls).toBe(2);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.textContent).toContain('Label ok');
  });

  it('TR-11 error text follows the language; errorMessage() stays for compatibility', async () => {
    await setup({ autoId: 'rs', items: () => Promise.reject<SdTreeItemStatic<Category>[]>(new Error('SECRET')) });
    // The translate pipe is pure (language changes reload the page), so read the other catalogue directly.
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en', { reload: false });
    expect(i18n.t('core.component.tree.load-error')).toBe("The list couldn't be loaded.");
    expect(tree.errorMessage(new Error('SECRET'))).toBe('SECRET');
  });

  it('TR-11 loading keeps the 24px spinner block', async () => {
    await setup({ autoId: 'rs', items: () => new Promise<SdTreeItemStatic<Category>[]>(() => undefined) });
    const loading = host.querySelector<HTMLElement>('.sd-tree__root-loading')!;
    expect(loading.getAttribute('role')).toBe('status');
    expect(loading.getBoundingClientRect().height).toBeGreaterThanOrEqual(120);
    expect(empty()).toBeNull();
  });

  it('TR-11 empty: centred muted text in a block of at least 120px', async () => {
    await setup({ autoId: 'rs', items: [] });

    expect(empty()!.textContent!.trim()).toBe('Chưa có mục nào');
    expect(host.querySelector('[role="tree"]')).toBeNull();
    const style = getComputedStyle(empty()!);
    expect(style.fontSize).toBe('14px');
    expect(style.justifyContent).toBe('center');
    expect(style.alignItems).toBe('center');
    expect(empty()!.getBoundingClientRect().height).toBeGreaterThanOrEqual(120);

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en', { reload: false });
    expect(i18n.t('core.component.tree.empty')).toBe('Nothing here yet');
    expect(i18n.t('core.component.tree.no-match', { text: 'x' })).toBe('No items match “x”');
  });

  it('TR-11 no match: names the text being searched, and the tree comes back when it is cleared', async () => {
    await setup({ autoId: 'rs', items: [leaf('a'), leaf('b')] });
    expect(empty()).toBeNull();

    tree.filter('  zzz ');
    fixture.detectChanges();
    expect(empty()!.textContent!.trim()).toBe('Không tìm thấy mục khớp “zzz”');

    tree.filter('');
    fixture.detectChanges();
    expect(empty()).toBeNull();
    expect(host.querySelectorAll('[role="treeitem"]').length).toBe(2);
  });

  it('TR-11 no match after a server search', async () => {
    jasmine.clock().install();
    try {
      const lazyItem: SdTreeItemLazy<Category> = { id: 'r', label: 'Root', data: { id: 'r' }, hasChildren: false };
      await setup({
        autoId: 'rs',
        items: [lazyItem],
        tree: { loadType: 'lazy', onExpandChildren: () => [], onSearch: () => Promise.resolve([]) },
      });

      tree.filter('abc');
      fixture.detectChanges();
      // Still waiting for the server: the loaded tree stays.
      expect(empty()).toBeNull();

      jasmine.clock().tick(700);
      await settle();
      expect(empty()!.textContent!.trim()).toBe('Không tìm thấy mục khớp “abc”');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('TR-11 sdTreeEmptyDef replaces both texts and receives { searching, text }', async () => {
    await setup({ autoId: 'rs', items: [] }, true);
    expect(host.querySelector('.custom-empty')!.textContent!.trim()).toBe('nothing');
    expect(host.textContent).not.toContain('Chưa có mục nào');

    component.option.set({ autoId: 'rs', items: [leaf('a')] });
    await settle();
    expect(host.querySelector('.custom-empty')).toBeNull();

    tree.filter('q');
    fixture.detectChanges();
    expect(host.querySelector('.custom-empty')!.textContent!.trim()).toBe('none for q');
    expect(host.textContent).not.toContain('Không tìm thấy');
  });
});

import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTree } from './tree.component';
import { SdTreeComponentOption, SdTreeItemLazy, SdTreeItemStatic, SdTreeLoadErrorEvent, SdTreeStaticComponentOption } from './tree.model';

interface Category {
  id: string;
}

const leaf = (id: string): SdTreeItemStatic<Category> => ({ id, label: `Label ${id}`, data: { id } });
const branch = (id: string, children: SdTreeItemStatic<Category>[]): SdTreeItemStatic<Category> => ({ ...leaf(id), children });
const lazy = (id: string, hasChildren = true): SdTreeItemLazy<Category> => ({ id, label: `Label ${id}`, data: { id }, hasChildren });

/** 30 gốc, gốc cuối có cháu ở mức 2: đủ dài để vùng cuộn 160px phải cuộn. */
const staticItems = (): SdTreeItemStatic<Category>[] => [
  ...Array.from({ length: 29 }, (_, index) => branch(`r${index}`, [leaf(`r${index}-a`)])),
  branch('deep', [branch('deep-1', [leaf('deep-1-a'), leaf('deep-1-b')])]),
];

const LAZY_CHILDREN: Record<string, SdTreeItemLazy<Category>[]> = {
  r1: [lazy('c1'), lazy('c2', false)],
  c1: [lazy('g1', false), lazy('g2', false)],
  r2: [],
};
const LAZY_PATHS: Record<string, string[]> = { g1: ['r1', 'c1'], g2: ['r1', 'c1'], c2: ['r1'], c1: ['r1'] };

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
  template: `
    <div class="scroller" style="height: 160px; overflow: auto; position: relative">
      <sd-tree [option]="option()" [(activeId)]="activeId" [(expandedIds)]="expandedIds" (loadError)="errors.push($event)" />
    </div>
  `,
})
class RevealHostComponent {
  readonly activeId = signal<string | null>(null);
  readonly expandedIds = signal<readonly string[] | undefined>(undefined);
  readonly errors: SdTreeLoadErrorEvent<Category>[] = [];
  readonly expandChildren = jasmine
    .createSpy('onExpandChildren')
    .and.callFake((item: SdTreeItemLazy<Category>) => Promise.resolve(LAZY_CHILDREN[item.id] ?? []));
  readonly resolvePath = jasmine
    .createSpy('onResolvePath')
    .and.callFake((id: string, _signal: AbortSignal) =>
      LAZY_PATHS[id] ? Promise.resolve(LAZY_PATHS[id]) : Promise.reject(new Error('unknown'))
    );
  readonly option = signal<SdTreeComponentOption<Category>>(this.staticOption());

  staticOption(items = staticItems()): SdTreeStaticComponentOption<Category> {
    return { autoId: 'rv', navigation: true, items, tree: { loadType: 'static' } };
  }

  lazyOption(): SdTreeComponentOption<Category> {
    return {
      autoId: 'rv',
      navigation: true,
      items: [lazy('r1'), lazy('r2')],
      tree: { loadType: 'lazy', onExpandChildren: this.expandChildren, onResolvePath: this.resolvePath },
    };
  }
}

describe('SdTree reveal, node operations, expandedIds (R2, R5, R7)', () => {
  let fixture: ComponentFixture<RevealHostComponent>;
  let host: HTMLElement;
  let component: RevealHostComponent;
  let tree: SdTree<Category>;

  const settle = async () => {
    for (let pass = 0; pass < 3; pass++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };
  const setup = async (mode: 'static' | 'lazy' = 'static', before?: (host: RevealHostComponent) => void) => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, RevealHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(RevealHostComponent);
    component = fixture.componentInstance;
    if (mode === 'lazy') component.option.set(component.lazyOption());
    before?.(component);
    await settle();
    host = fixture.nativeElement;
    tree = fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<Category>;
  };
  const row = (id: string) => host.querySelector<HTMLElement>(`[data-autoid="components-tree-rv-row-${id}"]`);
  const visibleIds = () => tree.visibleNodes().map(node => node.id);
  const scroller = () => host.querySelector<HTMLElement>('.scroller')!;
  const inView = (id: string) => {
    const box = scroller().getBoundingClientRect();
    const rect = row(id)!.getBoundingClientRect();
    return rect.top >= box.top - 0.5 && rect.bottom <= box.bottom + 0.5;
  };

  describe('TR-04 reveal', () => {
    it('TR-04 static: opens every ancestor and resolves true', async () => {
      await setup();
      expect(row('deep-1-b')).toBeNull();

      const result = await tree.reveal('deep-1-b');
      await settle();

      expect(result).toBeTrue();
      expect(row('deep-1-b')).not.toBeNull();
      expect(row('deep')!.getAttribute('aria-expanded')).toBe('true');
      expect(row('deep-1')!.getAttribute('aria-expanded')).toBe('true');
      // Siblings off the path stay closed.
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('false');
    });

    it('TR-04 static: an id that is not in the tree resolves false and changes nothing', async () => {
      await setup();
      const before = visibleIds();
      expect(await tree.reveal('nope')).toBeFalse();
      await settle();
      expect(visibleIds()).toEqual(before);
    });

    it('TR-04 lazy: resolves the path, loads each ancestor in order and reuses loaded children', async () => {
      await setup('lazy');

      expect(await tree.reveal('g2')).toBeTrue();
      await settle();

      expect(component.resolvePath).toHaveBeenCalledOnceWith('g2', jasmine.any(AbortSignal));
      expect(component.expandChildren.calls.allArgs().map(args => args[0].id)).toEqual(['r1', 'c1']);
      expect(visibleIds()).toEqual(['r1', 'c1', 'g1', 'g2', 'c2', 'r2']);

      // A loaded node needs neither the resolver nor another fetch.
      await tree.collapse('r1');
      await settle();
      expect(await tree.reveal('g1')).toBeTrue();
      expect(component.resolvePath).toHaveBeenCalledTimes(1);
      expect(component.expandChildren).toHaveBeenCalledTimes(2);
    });

    it('TR-04 lazy: an unknown id, a rejected resolver or a missing resolver resolve false', async () => {
      await setup('lazy');
      expect(await tree.reveal('ghost')).toBeFalse();
      expect(component.errors.length).toBe(1);

      component.option.set({
        ...component.lazyOption(),
        tree: { loadType: 'lazy', onExpandChildren: component.expandChildren },
      } as SdTreeComponentOption<Category>);
      await settle();
      expect(await tree.reveal('g1')).toBeFalse();
      expect(component.expandChildren).not.toHaveBeenCalled();
    });

    it('TR-04 lazy: a path whose node does not exist resolves false', async () => {
      await setup('lazy');
      component.resolvePath.and.returnValue(Promise.resolve(['r1', 'missing']));
      expect(await tree.reveal('g1')).toBeFalse();
      await settle();
      expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'r2']);
    });

    it('TR-04 a newer activeId aborts the reveal in flight', async () => {
      await setup('lazy');
      const slow = deferred<string[]>();
      const signals: AbortSignal[] = [];
      component.resolvePath.and.callFake((id: string, signal: AbortSignal) => {
        signals.push(signal);
        return id === 'g1' ? slow.promise : Promise.resolve(LAZY_PATHS[id]);
      });
      const reveal = spyOn(tree, 'reveal').and.callThrough();

      component.activeId.set('g1');
      await settle();
      expect(signals[0].aborted).toBeFalse();

      component.activeId.set('c2');
      await settle();
      expect(signals[0].aborted).toBeTrue();
      expect(signals[1].aborted).toBeFalse();

      slow.resolve(['r1', 'c1']);
      await settle();

      expect(reveal.calls.allArgs()).toEqual([['g1'], ['c2']]);
      expect(await reveal.calls.first().returnValue).toBeFalse();
      expect(await reveal.calls.mostRecent().returnValue).toBeTrue();
      // The aborted reveal must not go on expanding its own path.
      expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'r2']);
      expect(row('c1')!.getAttribute('aria-expanded')).toBe('false');
      expect(row('c2')!.classList).toContain('sd-tree__row--active');
    });

    it('TR-04 a row click aborts the reveal in flight', async () => {
      await setup('lazy');
      const slow = deferred<string[]>();
      component.resolvePath.and.returnValue(slow.promise);
      const pending = tree.reveal('g1');

      row('r2')!.click();
      slow.resolve(['r1', 'c1']);
      expect(await pending).toBeFalse();
      await settle();
      expect(visibleIds()).toEqual(['r1', 'r2']);
    });

    it('TR-04 a load error half way keeps the failed node in its error state, resolves false and emits loadError', async () => {
      await setup('lazy');
      component.expandChildren.and.callFake((item: SdTreeItemLazy<Category>) =>
        item.id === 'c1' ? Promise.reject(new Error('boom')) : Promise.resolve(LAZY_CHILDREN[item.id] ?? [])
      );

      expect(await tree.reveal('g1')).toBeFalse();
      await settle();

      expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'r2']);
      expect(host.querySelector('[data-tree-node-retry="c1"]')).not.toBeNull();
      expect(component.errors.length).toBe(1);
      expect(component.errors[0].item).toEqual({ id: 'c1' });
    });
  });

  describe('TR-05 activeId from outside', () => {
    it('TR-05 reveals the node, scrolls with scrollTop and leaves focus alone', async () => {
      await setup();
      const scrollIntoView = spyOn(Element.prototype, 'scrollIntoView');
      const reveal = spyOn(tree, 'reveal').and.callThrough();
      const focused = document.activeElement;
      expect(scroller().scrollTop).toBe(0);

      component.activeId.set('deep-1-b');
      await settle();

      expect(reveal).toHaveBeenCalledOnceWith('deep-1-b');
      expect(row('deep-1-b')!.classList).toContain('sd-tree__row--active');
      expect(scroller().scrollTop).toBeGreaterThan(0);
      expect(inView('deep-1-b')).toBeTrue();
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(focused);
      expect(host.contains(document.activeElement)).toBeFalse();
      // Roving tabindex follows the revealed node, so Tab lands on it.
      expect(row('deep-1-b')!.getAttribute('tabindex')).toBe('0');
    });

    it('TR-05 scrolls back up for a node above the viewport and not at all for a visible one', async () => {
      await setup();
      await tree.reveal('deep-1-b');
      await settle();
      const bottom = scroller().scrollTop;

      await tree.reveal('deep-1-a');
      await settle();
      expect(scroller().scrollTop).toBe(bottom);

      await tree.reveal('r0');
      await settle();
      expect(scroller().scrollTop).toBe(0);
      expect(inView('r0')).toBeTrue();
    });

    it('TR-05 an activeId present before the items arrive is revealed once they load', async () => {
      const items = deferred<SdTreeItemStatic<Category>[]>();
      await setup('static', hostComponent => {
        hostComponent.option.set({ ...hostComponent.staticOption(), items: () => items.promise });
        hostComponent.activeId.set('deep-1-a');
      });
      expect(row('deep-1-a')).toBeNull();

      items.resolve(staticItems());
      await settle();

      expect(row('deep-1-a')!.classList).toContain('sd-tree__row--active');
      expect(inView('deep-1-a')).toBeTrue();
    });

    it('TR-05 a user click is not revealed, and navigation off never reveals', async () => {
      await setup();
      const reveal = spyOn(tree, 'reveal').and.callThrough();
      row('r3')!.click();
      await settle();
      expect(component.activeId()).toBe('r3');
      expect(reveal).not.toHaveBeenCalled();

      // Going back to an id the user opened earlier is still an outside change.
      component.activeId.set('deep-1-a');
      await settle();
      component.activeId.set('r3');
      await settle();
      expect(reveal.calls.allArgs()).toEqual([['deep-1-a'], ['r3']]);

      component.option.set({ ...component.staticOption(), navigation: false });
      component.activeId.set('deep-1-b');
      await settle();
      expect(reveal).toHaveBeenCalledTimes(2);
    });
  });

  describe('TR-08 operations by id', () => {
    it('TR-08 expand: false for an unknown id or a leaf, true once the branch is open', async () => {
      await setup();
      expect(await tree.expand('nope')).toBeFalse();
      expect(await tree.expand('r0-a')).toBeFalse();
      expect(await tree.expand('r0')).toBeTrue();
      await settle();
      expect(row('r0-a')).not.toBeNull();
      // Already open: still true, nothing toggles back.
      expect(await tree.expand('r0')).toBeTrue();
      await settle();
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('true');
    });

    it('TR-08 expand on a lazy node loads its children; a failed load resolves false', async () => {
      await setup('lazy');
      expect(await tree.expand('r1')).toBeTrue();
      await settle();
      expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'r2']);

      component.expandChildren.and.returnValue(Promise.reject(new Error('boom')));
      expect(await tree.expand('c1')).toBeFalse();
    });

    it('TR-08 collapse closes a branch and ignores unknown ids', async () => {
      await setup();
      await tree.expand('r0');
      await settle();
      tree.collapse('r0');
      tree.collapse('nope');
      await settle();
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('false');
      expect(row('r0-a')).toBeNull();
    });

    it('TR-08 reloadNode refetches a lazy node, keeps it open and shows the new children', async () => {
      await setup('lazy');
      await tree.expand('r1');
      await settle();
      component.expandChildren.calls.reset();
      component.expandChildren.and.callFake((item: SdTreeItemLazy<Category>) =>
        Promise.resolve(item.id === 'r1' ? [...LAZY_CHILDREN['r1'], lazy('c3', false)] : [])
      );

      await tree.reloadNode('r1');
      await settle();

      expect(component.expandChildren.calls.allArgs().map(args => args[0].id)).toEqual(['r1']);
      expect(row('r1')!.getAttribute('aria-expanded')).toBe('true');
      expect(visibleIds()).toEqual(['r1', 'c1', 'c2', 'c3', 'r2']);

      // A node that loaded empty can gain children on reload.
      await tree.expand('r2');
      await settle();
      expect(row('r2')!.hasAttribute('aria-expanded')).toBeFalse();
      component.expandChildren.and.returnValue(Promise.resolve([lazy('n1', false)]));
      await tree.reloadNode('r2');
      await tree.expand('r2');
      await settle();
      expect(row('n1')).not.toBeNull();
    });

    it('TR-08 reloadNode does nothing on a static tree or for an unknown id', async () => {
      await setup();
      const before = visibleIds();
      await tree.reloadNode('r0');
      await tree.reloadNode('nope');
      await settle();
      expect(visibleIds()).toEqual(before);
    });

    it('TR-08 focusNode moves the roving tabindex and focus to a visible node only', async () => {
      await setup();
      expect(tree.focusNode('r4')).toBeTrue();
      fixture.detectChanges();
      expect(document.activeElement).toBe(row('r4'));
      expect(row('r4')!.getAttribute('tabindex')).toBe('0');
      expect(row('r0')!.getAttribute('tabindex')).toBe('-1');

      expect(tree.focusNode('nope')).toBeFalse();
      expect(tree.focusNode('r0-a')).toBeFalse();
      expect(document.activeElement).toBe(row('r4'));
    });
  });

  describe('TR-10 expandedIds', () => {
    it('TR-10 a defined expandedIds is the source of the open state, both ways', async () => {
      await setup('static', hostComponent => {
        hostComponent.option.set({ ...hostComponent.staticOption(), tree: { loadType: 'static', defaultExpanded: true } });
        hostComponent.expandedIds.set(['r1']);
      });

      expect(row('r1')!.getAttribute('aria-expanded')).toBe('true');
      // defaultExpanded no longer applies once expandedIds is defined.
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('false');

      host.querySelector<HTMLElement>('[data-autoid="components-tree-rv-toggle-r2"]')!.click();
      await settle();
      expect(component.expandedIds()).toEqual(['r1', 'r2']);

      host.querySelector<HTMLElement>('[data-autoid="components-tree-rv-toggle-r1"]')!.click();
      await settle();
      expect(component.expandedIds()).toEqual(['r2']);

      component.expandedIds.set(['deep', 'deep-1']);
      await settle();
      expect(row('deep-1-a')).not.toBeNull();
      expect(row('r2')!.getAttribute('aria-expanded')).toBe('false');

      await tree.reveal('r5-a');
      expect(component.expandedIds()).toEqual(['deep', 'deep-1', 'r5']);
    });

    it('TR-10 changing items does not reset expandedIds', async () => {
      await setup('static', hostComponent => hostComponent.expandedIds.set(['r1']));
      component.option.set(component.staticOption([...staticItems(), leaf('extra')]));
      await settle();

      expect(component.expandedIds()).toEqual(['r1']);
      expect(row('extra')).not.toBeNull();
      expect(row('r1')!.getAttribute('aria-expanded')).toBe('true');
    });

    it('TR-10 undefined leaves the tree in charge and emits nothing', async () => {
      await setup('static', hostComponent =>
        hostComponent.option.set({ ...hostComponent.staticOption(), tree: { loadType: 'static', defaultExpanded: 1 } })
      );
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('true');
      host.querySelector<HTMLElement>('[data-autoid="components-tree-rv-toggle-r0"]')!.click();
      await settle();
      expect(row('r0')!.getAttribute('aria-expanded')).toBe('false');
      expect(component.expandedIds()).toBeUndefined();
    });

    it('TR-10 lazy: ids in expandedIds load their children', async () => {
      await setup('lazy', hostComponent => hostComponent.expandedIds.set(['r1', 'c1']));
      expect(component.expandChildren.calls.allArgs().map(args => args[0].id)).toEqual(['r1', 'c1']);
      expect(visibleIds()).toEqual(['r1', 'c1', 'g1', 'g2', 'c2', 'r2']);
    });
  });
});

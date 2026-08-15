import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdTree } from './tree.component';
import { SdTreeItemDefDirective } from './tree-item-def.directive';
import {
  SdTreeCommand,
  SdTreeComponentOption,
  SdTreeDataSource,
  SdTreeItemLazy,
  SdTreeItemStatic,
  SdTreeNode,
  SdTreeSelectionEvent,
  SdTreeSelectorOption,
  SdTreeStaticOption,
  SdTreeToggleEvent,
} from './tree.model';

interface NodeItem {
  id: string;
  title: string;
  description?: string;
  locked?: boolean;
}

const ROOT_DATA: NodeItem = { id: 'root', title: 'Ph\u00f2ng K\u1ebf to\u00e1n' };
const PAYABLE_DATA: NodeItem = { id: 'payable', title: 'C\u00f4ng n\u1ee3 ph\u1ea3i tr\u1ea3' };
const RECEIVABLE_DATA: NodeItem = {
  id: 'receivable',
  title:
    'C\u00f4ng n\u1ee3 ph\u1ea3i thu r\u1ea5t d\u00e0i c\u1ea7n hi\u1ec3n th\u1ecb t\u1ed1i \u0111a hai d\u00f2ng v\u00e0 kh\u00f4ng \u0111\u00e8 l\u00ean command cu\u1ed1i d\u00f2ng',
};
const HR_DATA: NodeItem = { id: 'hr', title: 'Nh\u00e2n s\u1ef1' };
const CONTRACT_DATA: NodeItem = { id: 'contract', title: 'H\u1ee3p \u0111\u1ed3ng lao \u0111\u1ed9ng' };

const STATIC_ITEMS: SdTreeItemStatic<NodeItem>[] = [
  treeItem(ROOT_DATA, [treeItem(PAYABLE_DATA), treeItem(RECEIVABLE_DATA, undefined, 'description')]),
  treeItem(HR_DATA, [treeItem(CONTRACT_DATA)]),
];

@Component({
  standalone: true,
  imports: [SdTree],
  template: `
    <sd-tree [option]="option" (selectChange)="onSelect($event)" (expandChange)="onExpand($event)" (collapseChange)="onCollapse($event)" />
  `,
})
class StaticHostComponent {
  items = STATIC_ITEMS;
  tree: SdTreeStaticOption<NodeItem> = {
    loadType: 'static',
    defaultExpanded: 1,
  };
  get option(): SdTreeComponentOption<NodeItem> {
    return {
      autoId: 'static',
      items: this.items,
      tree: this.tree,
      commands: this.commands,
      selector: this.selector,
    };
  }
  selectedEvents: SdTreeSelectionEvent<NodeItem>[] = [];
  expandedEvents: SdTreeToggleEvent<NodeItem>[] = [];
  collapsedEvents: SdTreeToggleEvent<NodeItem>[] = [];
  editSpy = jasmine.createSpy('edit');
  deleteSpy = jasmine.createSpy('delete');
  selectionActionSpy = jasmine.createSpy('selectionAction');
  selector: SdTreeSelectorOption<NodeItem> = {
    visible: true,
    message: (items: NodeItem[]) => `Đã chọn ${items.length} dòng`,
    actions: [
      {
        icon: 'archive',
        title: 'Archive',
        click: this.selectionActionSpy,
      },
    ],
  };
  commands: SdTreeCommand<NodeItem>[] = [
    {
      key: 'edit',
      title: item => `Edit ${item.title}`,
      icon: 'edit',
      hidden: item => item.id === 'hr',
      click: this.editSpy,
    },
    {
      key: 'delete',
      title: 'Delete',
      icon: 'delete',
      disabled: item => item.id === 'root',
      click: this.deleteSpy,
    },
  ];

  onSelect(event: SdTreeSelectionEvent<NodeItem>): void {
    this.selectedEvents.push(event);
  }

  onExpand(event: SdTreeToggleEvent<NodeItem>): void {
    this.expandedEvents.push(event);
  }

  onCollapse(event: SdTreeToggleEvent<NodeItem>): void {
    this.collapsedEvents.push(event);
  }
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class SelectedHostComponent {
  items = STATIC_ITEMS;
  selectedItems = [PAYABLE_DATA];
  selector = { visible: true };
  get option(): SdTreeComponentOption<NodeItem> {
    return {
      autoId: 'selected',
      items: this.items,
      selectedItems: this.selectedItems,
      selector: this.selector,
      tree: { loadType: 'static', defaultExpanded: true },
    };
  }
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class LazyHostComponent {
  child = lazyTreeItem({ id: 'lazy-child', title: 'Lazy child' }, false);
  items: SdTreeItemLazy<NodeItem>[] = [lazyTreeItem({ id: 'lazy-root', title: 'Lazy root' }, true)];
  loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve([this.child]));
  get option(): SdTreeComponentOption<NodeItem> {
    return {
      autoId: 'lazy',
      items: this.items,
      tree: {
        loadType: 'lazy',
        onExpandChildren: this.loader,
      },
    };
  }
}

@Component({
  standalone: true,
  imports: [SdTree, SdTreeItemDefDirective],
  template: `
    <sd-tree [option]="option">
      <ng-template sdTreeItemDef let-item let-level="level" let-selected="selected" let-isLeaf="isLeaf" let-toggle="toggle">
        <button type="button" class="custom-item" (click)="toggle()">{{ level }}:{{ item.id }}:{{ selected }}:{{ isLeaf }}</button>
      </ng-template>
    </sd-tree>
  `,
})
class CustomTemplateHostComponent {
  items = STATIC_ITEMS;
  get option(): SdTreeComponentOption<NodeItem> {
    return {
      autoId: 'custom',
      items: this.items,
      tree: { loadType: 'static', defaultExpanded: false },
    };
  }
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class SignalSourceHostComponent {
  items = signal<SdTreeItemStatic<NodeItem>[]>([treeItem({ id: 'initial', title: 'Initial' })]);
  option: SdTreeComponentOption<NodeItem> = {
    autoId: 'signal',
    items: this.items,
    tree: { loadType: 'static' },
  };
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class ReloadHostComponent {
  first = [treeItem({ id: 'first', title: 'First load' })];
  second = [treeItem({ id: 'second', title: 'Second load' })];
  loader = jasmine.createSpy('loader').and.returnValues(Promise.resolve(this.first), Promise.resolve(this.second));
  itemsSource = () => this.loader();
  option: SdTreeComponentOption<NodeItem> = {
    autoId: 'reload',
    items: this.itemsSource,
    tree: { loadType: 'static' },
  };
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class SwappableSourceHostComponent {
  resolvePending!: (items: SdTreeItemStatic<NodeItem>[]) => void;
  source: SdTreeDataSource<SdTreeItemStatic<NodeItem>> = () =>
    new Promise(resolve => {
      this.resolvePending = resolve;
    });

  get option(): SdTreeComponentOption<NodeItem> {
    return {
      autoId: 'swappable',
      items: this.source,
      tree: { loadType: 'static' },
    };
  }
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class RootErrorHostComponent {
  loader = jasmine
    .createSpy('loader')
    .and.returnValues(Promise.reject(new Error('root failed')), Promise.resolve([treeItem({ id: 'recovered', title: 'Recovered' })]));
  option: SdTreeComponentOption<NodeItem> = {
    autoId: 'root-error',
    items: () => this.loader(),
    tree: { loadType: 'static' },
  };
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class LazyErrorHostComponent {
  items: SdTreeItemLazy<NodeItem>[] = [lazyTreeItem({ id: 'lazy-error', title: 'Lazy error' }, true)];
  loader = jasmine
    .createSpy('loader')
    .and.returnValues(
      Promise.reject(new Error('lazy failed')),
      Promise.resolve([lazyTreeItem({ id: 'lazy-recovered', title: 'Lazy recovered' }, false)])
    );
  option: SdTreeComponentOption<NodeItem> = {
    autoId: 'lazy-error',
    items: this.items,
    tree: { loadType: 'lazy', onExpandChildren: this.loader },
  };
}

// why: các host dưới đây giữ `option` là FIELD (không phải getter như StaticHostComponent) — getter
// trả object mới mỗi CD nên input đổi ref liên tục và mọi computed dẫn xuất đều tính lại, che mất
// đúng thứ cần đo: tính ổn định của `rootNodes`.
@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class StableOptionHostComponent {
  readonly option: SdTreeComponentOption<NodeItem> = {
    autoId: 'stable',
    items: STATIC_ITEMS,
    tree: { loadType: 'static', defaultExpanded: true },
    selector: { visible: true },
  };
}

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class StableLazyHostComponent {
  resolveChildren!: (items: SdTreeItemLazy<NodeItem>[]) => void;
  loader = jasmine.createSpy('loader').and.callFake(
    () =>
      new Promise<SdTreeItemLazy<NodeItem>[]>(resolve => {
        this.resolveChildren = resolve;
      })
  );
  readonly option: SdTreeComponentOption<NodeItem> = {
    autoId: 'lazy-stable',
    items: [lazyTreeItem({ id: 'lazy-root', title: 'Lazy root' }, true)],
    tree: { loadType: 'lazy', onExpandChildren: this.loader },
  };
}

const CASCADE_ITEMS = binaryTreeItems(6);

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" />`,
})
class CascadeHostComponent {
  readonly option: SdTreeComponentOption<NodeItem> = {
    autoId: 'cascade',
    items: CASCADE_ITEMS,
    tree: { loadType: 'static', defaultExpanded: true },
    selector: { visible: true, cascade: 'descendants' },
  };
}

const DEEP_ITEMS: SdTreeItemStatic<NodeItem>[] = [
  treeItem({ id: 'l0', title: 'Level 0' }, [treeItem({ id: 'l1', title: 'Level 1' }, [treeItem({ id: 'l2', title: 'Level 2' })])]),
];

@Component({
  standalone: true,
  imports: [SdTree],
  template: `<sd-tree [option]="option" (expandChange)="expandedEvents.push($event)" />`,
})
class MaxDepthHostComponent {
  expandedEvents: SdTreeToggleEvent<NodeItem>[] = [];
  readonly option: SdTreeComponentOption<NodeItem> = {
    autoId: 'max-depth',
    items: DEEP_ITEMS,
    tree: { loadType: 'static', defaultExpanded: true, maxDepth: 1 },
  };
}

describe('SdTree', () => {
  it('renders static tree rows from SdTreeItem, default expansion, roles and stable auto ids', async () => {
    const fixture = await createFixture(StaticHostComponent);

    const host = fixture.nativeElement as HTMLElement;
    const rows = visibleRows(host);

    expect(host.querySelector('sd-tree')?.getAttribute('data-autoid')).toBe('components-tree-static');
    expect(rows.map(row => row.textContent?.trim())).toEqual([
      jasmine.stringContaining(ROOT_DATA.title),
      jasmine.stringContaining(PAYABLE_DATA.title),
      jasmine.stringContaining(RECEIVABLE_DATA.title.slice(0, 20)),
      jasmine.stringContaining(HR_DATA.title),
      jasmine.stringContaining(CONTRACT_DATA.title),
    ]);
    expect(row(host, 'root').getAttribute('aria-expanded')).toBe('true');
    expect(row(host, 'payable').getAttribute('aria-expanded')).toBeNull();
    expect(host.querySelector('[data-autoid="components-tree-static-row-root"]')).toBeTruthy();
    expect(host.querySelector('[data-autoid="components-tree-static-label-receivable"]')).toBeTruthy();
  });

  it('uses folder icons for branch nodes and hides the icon for leaves unless item.icon is provided', async () => {
    const fixture = await createFixture(StaticHostComponent);

    const host = fixture.nativeElement as HTMLElement;

    expect(icon(host, 'root')?.textContent?.trim()).toBe('folder_open');
    expect(icon(host, 'payable')).toBeNull();
    expect(icon(host, 'receivable')?.textContent?.trim()).toBe('description');
  });

  it('emits selection events and supports selecting multiple rows', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);
    const payable = tree.visibleNodes().find(node => node.id === 'payable')!;
    const receivable = tree.visibleNodes().find(node => node.id === 'receivable')!;

    tree.toggleSelection(payable);
    tree.toggleSelection(receivable);
    fixture.detectChanges();

    expect(component.selectedEvents.length).toBe(2);
    expect(component.selectedEvents[0]).toEqual(
      jasmine.objectContaining({
        item: PAYABLE_DATA,
        selected: true,
      })
    );
    expect(component.selectedEvents[1].selectedItems.map(item => item.id)).toEqual(['payable', 'receivable']);
    expect(row(fixture.nativeElement, 'payable').getAttribute('aria-selected')).toBe('true');
    expect(row(fixture.nativeElement, 'receivable').getAttribute('aria-selected')).toBe('true');
  });

  it('renders selected rows without border radius', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const tree = treeComponent<NodeItem>(fixture);
    const payable = tree.visibleNodes().find(node => node.id === 'payable')!;

    tree.toggleSelection(payable);
    fixture.detectChanges();

    expect(getComputedStyle(row(fixture.nativeElement, 'payable')).borderRadius).toBe('0px');
  });

  it('draws the selection checkbox smaller than its slot while keeping the full hit area', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const checkbox = fixture.nativeElement.querySelector('.sd-tree__checkbox') as HTMLElement;
    const background = checkbox.querySelector('.mdc-checkbox__background') as HTMLElement;
    const touchTarget = checkbox.querySelector('.mat-mdc-checkbox-touch-target') as HTMLElement;
    const checkboxRect = checkbox.getBoundingClientRect();
    const backgroundRect = background.getBoundingClientRect();

    expect(backgroundRect.width).toBeCloseTo(16, 0);
    expect(backgroundRect.height).toBeCloseTo(16, 0);
    // Chỉ glyph nhỏ đi — ô control vẫn 28px và touch target a11y 48px của Material giữ nguyên.
    expect(checkboxRect.width).toBeCloseTo(28, 0);
    expect(touchTarget.getBoundingClientRect().width).toBeCloseTo(48, 0);
    // Glyph nhỏ hơn nhưng vẫn đúng tâm ô, nếu không cả cột control sẽ lệch.
    expect(backgroundRect.left + backgroundRect.width / 2).toBeCloseTo(checkboxRect.left + checkboxRect.width / 2, 0);
    expect(backgroundRect.top + backgroundRect.height / 2).toBeCloseTo(checkboxRect.top + checkboxRect.height / 2, 0);
  });

  it('rounds the quick-action count badge with the same radius as the bar', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const bar = fixture.nativeElement.querySelector('.c-quick-action') as HTMLElement;
    const badge = fixture.nativeElement.querySelector('.c-bg-length') as HTMLElement;
    const barStyle = getComputedStyle(bar);
    const badgeStyle = getComputedStyle(badge);

    expect(badgeStyle.borderTopLeftRadius).toBe(barStyle.borderTopLeftRadius);
    expect(badgeStyle.borderBottomLeftRadius).toBe(barStyle.borderBottomLeftRadius);
    // Cạnh phải của badge nằm giữa thanh nên phải vuông.
    expect(badgeStyle.borderTopRightRadius).toBe('0px');
    expect(badgeStyle.borderBottomRightRadius).toBe('0px');
  });

  it('renders quick action when selection is visible and rows are selected', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);
    const payable = tree.visibleNodes().find(node => node.id === 'payable')!;

    tree.toggleSelection(payable);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sd-tree__qa-count')?.textContent?.trim()).toBe('1');
    expect(fixture.nativeElement.textContent).toContain('Đã chọn 1 dòng');

    tree.onSelectionAction(component.selector.actions![0]!);

    expect(component.selectionActionSpy).toHaveBeenCalledOnceWith([PAYABLE_DATA]);

    tree.clearSelection();
    fixture.detectChanges();

    expect(row(fixture.nativeElement, 'payable').getAttribute('aria-selected')).toBe('false');
  });

  // why: checkbox là ký hiệu của "chọn nhiều". Với `selector.single` người dùng chỉ phát hiện ra
  // giới hạn sau khi tick node thứ hai và thấy node đầu tự bỏ chọn — radio nói trước điều đó.
  describe('single-selection control', () => {
    it('renders a radio per row instead of a checkbox', async () => {
      const fixture = await createFixture(StaticHostComponent);
      fixture.componentInstance.selector = { visible: true, single: true };
      fixture.detectChanges();

      expect(treeComponent<NodeItem>(fixture).selectionSingle()).toBeTrue();
      expect(fixture.nativeElement.querySelectorAll('mat-radio-button').length).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelectorAll('mat-checkbox').length).toBe(0);
    });

    it('keeps checkboxes when the selector allows several nodes', async () => {
      const fixture = await createFixture(StaticHostComponent);

      expect(treeComponent<NodeItem>(fixture).selectionSingle()).toBeFalse();
      expect(fixture.nativeElement.querySelectorAll('mat-checkbox').length).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelectorAll('mat-radio-button').length).toBe(0);
    });

    it('still replaces the previous node when a second one is picked', async () => {
      const fixture = await createFixture(StaticHostComponent);
      fixture.componentInstance.selector = { visible: true, single: true };
      fixture.detectChanges();

      const tree = treeComponent<NodeItem>(fixture);
      tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
      tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'hr')!);
      fixture.detectChanges();

      expect(tree.selectedItems()).toEqual([HR_DATA]);
    });

    // why: radio không gom vào <mat-radio-group> — group chiếm Arrow Up/Down để đổi lựa chọn, mà
    // hàng cây đã dùng đúng hai phím đó để điều hướng.
    it('does not wrap the radios in a radio group', async () => {
      const fixture = await createFixture(StaticHostComponent);
      fixture.componentInstance.selector = { visible: true, single: true };
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('mat-radio-group')).toBeNull();
    });
  });

  // why: `<sd-tree-select>` dựng sd-tree với selector KHÔNG có action nào (chọn xong bấm "Áp dụng"
  // ở footer modal). Thanh quick-action khi đó chỉ nhắc lại đúng thứ checkbox đã nói, lại còn nổi
  // đè lên cây trong modal. Không có action ⇒ không mở thanh.
  it('keeps the quick action closed when the selector declares no actions', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    component.selector = { visible: true, message: () => 'Đã chọn' };
    fixture.detectChanges();

    const tree = treeComponent<NodeItem>(fixture);
    tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
    fixture.detectChanges();

    expect(tree.selectedCount()).toBe(1);
    expect(tree.selectionQuickActionOpened()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.c-quick-action.active')).toBeNull();
  });

  it('honors selectedItems input as the initial selected state', async () => {
    const fixture = await createFixture(SelectedHostComponent);
    const tree = treeComponent<NodeItem>(fixture);
    const payable = tree.visibleNodes().find(node => node.id === 'payable')!;

    expect(row(fixture.nativeElement, 'payable').getAttribute('aria-selected')).toBe('true');
    expect(tree.isSelected(payable)).toBeTrue();
  });

  it('collapses and expands static branches from the toggle and emits events', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;

    toggle(fixture.nativeElement, 'root').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain(PAYABLE_DATA.title);
    expect(component.collapsedEvents[0]).toEqual(jasmine.objectContaining({ item: ROOT_DATA, expanded: false }));

    toggle(fixture.nativeElement, 'root').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(PAYABLE_DATA.title);
    expect(component.expandedEvents[0]).toEqual(jasmine.objectContaining({ item: ROOT_DATA, expanded: true }));
  });

  it('lazy-loads children once, shows loading state and caches children internally', async () => {
    const fixture = await createFixture(LazyHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);

    void tree.toggle(tree.visibleNodes()[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-progress-spinner')).toBeTruthy();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loader).toHaveBeenCalledOnceWith(component.items[0]);
    expect((component.items[0] as unknown as { children?: unknown }).children).toBeUndefined();
    expect(tree.visibleNodes().some(node => node.id === 'lazy-child')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Lazy child');

    toggle(fixture.nativeElement, 'lazy-root').click();
    fixture.detectChanges();
    toggle(fixture.nativeElement, 'lazy-root').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loader).toHaveBeenCalledTimes(1);
  });

  it('filters loaded items using Vietnamese accent-insensitive search and keeps matching ancestors visible', async () => {
    const fixture = await createFixture(StaticHostComponent);

    treeComponent<NodeItem>(fixture).filter('ke toan');
    fixture.detectChanges();

    expect(text(fixture)).toContain(ROOT_DATA.title);
    expect(text(fixture)).not.toContain(HR_DATA.title);

    treeComponent<NodeItem>(fixture).filter('cong no phai thu');
    fixture.detectChanges();

    expect(text(fixture)).toContain(ROOT_DATA.title);
    expect(text(fixture)).toContain(RECEIVABLE_DATA.title);
    expect(text(fixture)).not.toContain(PAYABLE_DATA.title);

    treeComponent<NodeItem>(fixture).filter('');
    fixture.detectChanges();

    expect(text(fixture)).toContain(HR_DATA.title);
  });

  it('renders command trigger only for rows with visible commands and resolves command metadata', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);
    const rootNode = tree.visibleNodes().find(node => node.id === 'root')!;
    const hrNode = tree.visibleNodes().find(node => node.id === 'hr')!;

    expect(fixture.nativeElement.querySelector('[data-autoid="components-tree-static-command-root"]')).toBeTruthy();
    expect(tree.visibleCommands(rootNode).map(command => command.key)).toEqual(['edit', 'delete']);
    expect(tree.visibleCommands(hrNode).map(command => command.key)).toEqual(['delete']);
    expect(tree.commandTitle(component.commands[0], rootNode.data)).toBe(`Edit ${ROOT_DATA.title}`);
    expect(tree.isCommandDisabled(component.commands[1], rootNode.data)).toBeTrue();
    expect(tree.visibleViewNodes().find(node => node.id === 'root')?.commands[0]).toEqual(
      jasmine.objectContaining({
        title: `Edit ${ROOT_DATA.title}`,
        icon: 'edit',
        fontSet: 'material-icons-outlined',
      })
    );
  });

  it('opens command menu with centered icon, compact label spacing and working click callback', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const trigger = fixture.nativeElement.querySelector('[data-autoid="components-tree-static-command-receivable"]') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editButton = overlay.querySelector('[data-autoid="components-tree-static-command-receivable-edit"]') as HTMLButtonElement;
    const content = editButton.querySelector('.sd-tree__command-menu-content') as HTMLElement;
    const iconEl = editButton.querySelector('.sd-tree__command-menu-icon') as HTMLElement;
    const title = editButton.querySelector('.sd-tree__command-title') as HTMLElement;

    expect(editButton).toBeTruthy();
    expect(content).toBeTruthy();
    expect(iconEl).toBeTruthy();
    expect(title).toBeTruthy();
    expect(content.children[0]).toBe(iconEl);
    expect(content.children[1]).toBe(title);
    expect(title.textContent?.trim()).toBe(`Edit ${RECEIVABLE_DATA.title}`);
    expect(getComputedStyle(content).display).toBe('flex');
    expect(getComputedStyle(content).alignItems).toBe('center');
    expect(getComputedStyle(content).gap).toBe('6px');
    expect(getComputedStyle(iconEl).display).toBe('flex');
    expect(getComputedStyle(iconEl).alignItems).toBe('center');
    expect(getComputedStyle(iconEl).justifyContent).toBe('center');
    expect(getComputedStyle(iconEl).marginRight).toBe('0px');
    expect(getComputedStyle(title).lineHeight).toBe('20px');

    editButton.click();
    fixture.detectChanges();

    expect(component.editSpy).toHaveBeenCalledOnceWith(RECEIVABLE_DATA);
  });

  it('uses sdTreeItemDef context and lets the projected template toggle the row', async () => {
    const fixture = await createFixture(CustomTemplateHostComponent);

    expect(fixture.nativeElement.querySelector('.custom-item')?.textContent?.trim()).toBe('0:root:false:false');

    (fixture.nativeElement.querySelector('.custom-item') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0:root:false:false');
    expect(fixture.nativeElement.textContent).toContain('1:payable:false:true');
  });

  it('keeps label content constrained separately from command column', async () => {
    const fixture = await createFixture(StaticHostComponent);

    const content = fixture.nativeElement.querySelector('[data-autoid="components-tree-static-label-receivable"]') as HTMLElement;
    const command = fixture.nativeElement.querySelector('[data-autoid="components-tree-static-command-receivable"]') as HTMLElement;

    expect(getComputedStyle(content).webkitLineClamp).toBe('2');
    expect(getComputedStyle(content).overflow).toBe('hidden');
    expect(command).toBeTruthy();
  });

  it('updates when items is a signal data source', async () => {
    const fixture = await createFixture(SignalSourceHostComponent);
    const component = fixture.componentInstance;

    expect(text(fixture)).toContain('Initial');

    component.items.set([treeItem({ id: 'updated', title: 'Updated' })]);
    fixture.detectChanges();

    expect(text(fixture)).toContain('Updated');
    expect(text(fixture)).not.toContain('Initial');
  });

  it('does not let an obsolete async source overwrite a newer signal source', async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, SwappableSourceHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SwappableSourceHostComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.source = signal([treeItem({ id: 'current', title: 'Current signal' })]);
    fixture.detectChanges();
    expect(text(fixture)).toContain('Current signal');

    component.resolvePending([treeItem({ id: 'obsolete', title: 'Obsolete async' })]);
    await Promise.resolve();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Current signal');
    expect(text(fixture)).not.toContain('Obsolete async');
  });

  it('loads items from an async source and reloads manually', async () => {
    const fixture = await createFixture(ReloadHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);

    expect(component.loader).toHaveBeenCalledTimes(1);
    expect(text(fixture)).toContain('First load');

    tree.reload();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loader).toHaveBeenCalledTimes(2);
    expect(text(fixture)).toContain('Second load');
    expect(text(fixture)).not.toContain('First load');
  });

  it('uses roving tabindex and supports native tree keyboard navigation and selection', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const rootRow = row(fixture.nativeElement, 'root');
    const payableRow = row(fixture.nativeElement, 'payable');

    expect(rootRow.tabIndex).toBe(0);
    expect(payableRow.tabIndex).toBe(-1);
    rootRow.focus();
    rootRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(payableRow);

    payableRow.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(payableRow.getAttribute('aria-selected')).toBe('true');
  });

  // why: bản cũ bind `[tabIndex]` (property DOM, camelCase) — giá trị đúng nhưng KHÔNG sinh
  // attribute `tabindex` trong markup, nên mọi thứ đọc markup (lint a11y, snapshot, devtools)
  // đều thấy row là không focusable.
  it('emits a real tabindex attribute on tree rows, not just the DOM property', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const rootRow = row(fixture.nativeElement, 'root');
    const payableRow = row(fixture.nativeElement, 'payable');

    expect(rootRow.getAttribute('tabindex')).toBe('0');
    expect(payableRow.getAttribute('tabindex')).toBe('-1');
  });

  it('supports single selection and descendant cascade with indeterminate parents', async () => {
    const fixture = await createFixture(StaticHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);
    component.selector = { ...component.selector, cascade: 'descendants' } satisfies SdTreeSelectorOption<NodeItem>;
    fixture.detectChanges();

    tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'root')!);
    fixture.detectChanges();

    expect(tree.selectedItems().map(item => item.id)).toEqual(['root', 'payable', 'receivable']);

    tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
    fixture.detectChanges();

    expect(row(fixture.nativeElement, 'root').getAttribute('aria-checked')).toBe('mixed');

    component.selector = { ...component.selector, cascade: 'independent', single: true };
    fixture.detectChanges();
    tree.clearSelection();
    tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
    tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'receivable')!);

    expect(tree.selectedItems().map(item => item.id)).toEqual(['receivable']);
  });

  it('renders root load errors and retries without leaking the rejection', async () => {
    const fixture = await createFixture(RootErrorHostComponent);
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.querySelector('[data-tree-retry]')).not.toBeNull();
    expect(text(fixture)).toContain('root failed');

    (fixture.nativeElement.querySelector('[data-tree-retry]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loader).toHaveBeenCalledTimes(2);
    expect(text(fixture)).toContain('Recovered');
  });

  it('contains lazy load errors per node and retries the failed branch', async () => {
    const fixture = await createFixture(LazyErrorHostComponent);
    const component = fixture.componentInstance;
    const tree = treeComponent<NodeItem>(fixture);

    await tree.toggle(tree.visibleNodes()[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-tree-node-retry="lazy-error"]')).not.toBeNull();

    (fixture.nativeElement.querySelector('[data-tree-node-retry="lazy-error"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loader).toHaveBeenCalledTimes(2);
    expect(text(fixture)).toContain('Lazy recovered');
  });

  // -------------------------------------------------------------------------
  // Regression: node tree must not be rebuilt for pure UI-state changes
  // -------------------------------------------------------------------------

  describe('node tree allocation', () => {
    it('keeps rootNodes referentially stable across change detection passes', async () => {
      const fixture = await createFixture(StableOptionHostComponent);
      const tree = treeComponent<NodeItem>(fixture);
      const before = tree.rootNodes();

      fixture.detectChanges();
      fixture.detectChanges();

      expect(tree.rootNodes()).toBe(before);
    });

    // why: `#expandedState` từng là dependency của `rootNodes` → mở/đóng MỘT node dựng lại TOÀN BỘ
    // cây, kéo theo `visibleNodes` + `visibleViewNodes` map lại từ đầu.
    it('does not rebuild the node tree when a branch is collapsed or expanded', async () => {
      const fixture = await createFixture(StableOptionHostComponent);
      const tree = treeComponent<NodeItem>(fixture);
      const before = tree.rootNodes();
      const rootNode = before[0];

      await tree.toggle(rootNode);
      fixture.detectChanges();

      expect(tree.rootNodes()).toBe(before);
      expect(tree.rootNodes()[0]).toBe(rootNode);
      expect(rootNode.isExpanded).toBeFalse();
      expect(tree.visibleNodes().map(node => node.id)).toEqual(['root', 'hr', 'contract']);
      expect(row(fixture.nativeElement, 'root').getAttribute('aria-expanded')).toBe('false');

      await tree.toggle(rootNode);
      fixture.detectChanges();

      expect(tree.rootNodes()).toBe(before);
      expect(rootNode.isExpanded).toBeTrue();
      expect(row(fixture.nativeElement, 'root').getAttribute('aria-expanded')).toBe('true');
    });

    it('does not rebuild the node tree while a lazy branch is loading, only once its children arrive', async () => {
      const fixture = await createFixture(StableLazyHostComponent);
      const tree = treeComponent<NodeItem>(fixture);
      const before = tree.rootNodes();

      const pending = tree.toggle(before[0]);
      fixture.detectChanges();

      expect(before[0].isLoading).toBeTrue();
      expect(tree.rootNodes()).toBe(before);

      fixture.componentInstance.resolveChildren([lazyTreeItem({ id: 'lazy-child', title: 'Lazy child' }, false)]);
      await pending;
      fixture.detectChanges();

      // structure genuinely changed — a rebuild here is expected
      expect(tree.rootNodes()).not.toBe(before);
      expect(text(fixture)).toContain('Lazy child');
    });

    // why: `#isSelectionIndeterminate` từng gọi `#flattenAll(node.children)` cho TỪNG node hiển thị
    // ngay trong map của `visibleViewNodes` → O(n²) và một mảng mới mỗi node mỗi lần recompute.
    it('derives indeterminate state in one bottom-up pass instead of flattening every subtree', async () => {
      const fixture = await createFixture(CascadeHostComponent);
      const tree = treeComponent<NodeItem>(fixture);

      tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'n-0-0-0-0-0-0')!);
      fixture.detectChanges();

      const roots = tree.rootNodes();
      const nodeCount = tree.visibleNodes().length;
      expect(nodeCount).toBe(127);
      expect(tree.visibleViewNodes().find(node => node.id === 'n')?.selectionIndeterminate).toBeTrue();
      expect(tree.visibleViewNodes().find(node => node.id === 'n-1')?.selectionIndeterminate).toBeFalse();

      let childrenReads = 0;
      const instrument = (nodes: SdTreeNode<NodeItem>[]): void => {
        for (const node of nodes) {
          const children = node.children;
          Object.defineProperty(node, 'children', {
            configurable: true,
            get: () => {
              childrenReads += 1;
              return children;
            },
          });
          instrument(children);
        }
      };
      instrument(roots);

      // activeNodeId only invalidates visibleViewNodes, so this measures exactly one recompute
      tree.activeNodeId.set('n-1');
      const views = tree.visibleViewNodes();

      expect(tree.rootNodes()).toBe(roots);
      expect(views.length).toBe(nodeCount);
      expect(childrenReads).toBeLessThanOrEqual(nodeCount * 3);
    });
  });

  describe('maxDepth', () => {
    it('drops nodes past maxDepth and clamps the boundary node to a leaf', async () => {
      const fixture = await createFixture(MaxDepthHostComponent);
      const tree = treeComponent<NodeItem>(fixture);
      const host = fixture.nativeElement as HTMLElement;
      const boundary = tree.visibleNodes().find(node => node.id === 'l1')!;

      expect(tree.visibleNodes().map(node => node.id)).toEqual(['l0', 'l1']);
      expect(boundary.hasChildren).toBeFalse();
      expect(boundary.children).toEqual([]);
      expect(row(host, 'l1').getAttribute('aria-expanded')).toBeNull();
      expect(toggle(host, 'l1').disabled).toBeTrue();
      expect(icon(host, 'l1')).toBeNull();
      // the node above the boundary is untouched
      expect(row(host, 'l0').getAttribute('aria-expanded')).toBe('true');
      expect(icon(host, 'l0')?.textContent?.trim()).toBe('folder_open');
    });

    it('never emits expandChange for a node sitting at maxDepth', async () => {
      const fixture = await createFixture(MaxDepthHostComponent);
      const tree = treeComponent<NodeItem>(fixture);
      const host = fixture.nativeElement as HTMLElement;

      toggle(host, 'l1').click();
      await tree.toggle(tree.visibleNodes().find(node => node.id === 'l1')!);
      fixture.detectChanges();

      expect(fixture.componentInstance.expandedEvents).toEqual([]);
      expect(tree.visibleNodes().map(node => node.id)).toEqual(['l0', 'l1']);
      expect(text(fixture)).not.toContain('Level 2');
    });
  });

  // Template đã dùng key `core.component.tree.retry` từ trước, nhưng nhãn screen-reader của nút
  // gập/mở, message chọn và lỗi mặc định lại hardcode — một component hai ngôn ngữ, không dịch được.
  describe('i18n', () => {
    // why: `createFixture` mới gọi `TestBed.configureTestingModule`, nên KHÔNG được `TestBed.inject`
    // trong `beforeEach` — inject sớm sẽ khởi tạo test module và làm configure sau đó ném lỗi.
    // `setLanguage` ghi localStorage và `#resolveInitial` đọc lại, nên một spec chạy trước có thể để
    // lại ngôn ngữ khác — chốt 'vi' rồi render lại để assertion không phụ thuộc thứ tự chạy.
    const useI18n = (fixture: ComponentFixture<unknown>): I18nService => {
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('vi', { reload: false });
      fixture.detectChanges();
      return i18n;
    };

    afterEach(() => {
      TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    });

    it('falls back to the translated selection message and interpolates the count', async () => {
      const fixture = await createFixture(StaticHostComponent);
      const i18n = useI18n(fixture);
      const tree = treeComponent<NodeItem>(fixture);
      fixture.componentInstance.selector = { visible: true };
      fixture.detectChanges();

      tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
      fixture.detectChanges();
      expect(tree.selectionMessage()).toBe('Đã chọn 1 mục');

      i18n.setLanguage('en', { reload: false });
      expect(tree.selectionMessage()).toBe('1 item(s) selected');
    });

    it('keeps a consumer-supplied selection message untouched', async () => {
      const fixture = await createFixture(StaticHostComponent);
      useI18n(fixture);
      const tree = treeComponent<NodeItem>(fixture);

      tree.toggleSelection(tree.visibleNodes().find(node => node.id === 'payable')!);
      fixture.detectChanges();
      expect(tree.selectionMessage()).toBe('Đã chọn 1 dòng');
    });

    it('translates the expand / collapse toggle labels and writes them to aria-label', async () => {
      const fixture = await createFixture(StaticHostComponent);
      const i18n = useI18n(fixture);
      const tree = treeComponent<NodeItem>(fixture);
      const host = fixture.nativeElement as HTMLElement;

      // root mở sẵn (defaultExpanded: 1) → nhãn là "thu gọn"
      expect(toggle(host, 'root').getAttribute('aria-label')).toBe('Thu gọn mục');

      await tree.toggle(tree.visibleNodes().find(node => node.id === 'root')!);
      fixture.detectChanges();
      expect(toggle(host, 'root').getAttribute('aria-label')).toBe('Mở rộng mục');

      i18n.setLanguage('en', { reload: false });
      fixture.detectChanges();
      expect(toggle(host, 'root').getAttribute('aria-label')).toBe('Expand tree item');
    });

    it('translates the default load-error message but keeps a real Error message intact', async () => {
      const fixture = await createFixture(StaticHostComponent);
      const i18n = useI18n(fixture);
      const tree = treeComponent<NodeItem>(fixture);

      expect(tree.errorMessage(null)).toBe('Không tải được dữ liệu cây');
      expect(tree.errorMessage(new Error('boom'))).toBe('boom');

      i18n.setLanguage('en', { reload: false });
      expect(tree.errorMessage(undefined)).toBe('Unable to load tree data');
    });
  });
});

async function createFixture<T>(component: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, component],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function treeItem(data: NodeItem, children?: SdTreeItemStatic<NodeItem>[], icon?: string): SdTreeItemStatic<NodeItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    children,
  };
}

/** Complete binary tree of `2^(depth + 1) - 1` static items — wide enough to expose O(n²) walks. */
function binaryTreeItems(depth: number, prefix = 'n'): SdTreeItemStatic<NodeItem>[] {
  const build = (id: string, level: number): SdTreeItemStatic<NodeItem> => {
    const data: NodeItem = { id, title: id };
    if (level >= depth) return treeItem(data);
    return treeItem(data, [build(`${id}-0`, level + 1), build(`${id}-1`, level + 1)]);
  };
  return [build(prefix, 0)];
}

function lazyTreeItem(data: NodeItem, hasChildren?: boolean, icon?: string): SdTreeItemLazy<NodeItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    hasChildren,
  };
}

function treeComponent<T>(fixture: ComponentFixture<unknown>): SdTree<T> {
  return fixture.debugElement.query(By.directive(SdTree)).componentInstance as SdTree<T>;
}

function visibleRows(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('[role="treeitem"]'));
}

function row(host: HTMLElement, id: string): HTMLElement {
  return host.querySelector(`[data-autoid$="-row-${id}"]`) as HTMLElement;
}

function toggle(host: HTMLElement, id: string): HTMLButtonElement {
  return host.querySelector(`[data-autoid$="-toggle-${id}"]`) as HTMLButtonElement;
}

function icon(host: HTMLElement, id: string): HTMLElement | null {
  return host.querySelector(`[data-autoid$="-icon-${id}"]`);
}

function text(fixture: ComponentFixture<unknown>): string {
  return fixture.nativeElement.textContent;
}

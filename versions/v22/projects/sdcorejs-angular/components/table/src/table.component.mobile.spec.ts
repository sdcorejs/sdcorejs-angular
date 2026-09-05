import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTableExpandDefDirective } from './directives/sd-table-expand-def.directive';
import { SdTableCommandHeaderDefDirective } from './directives/sd-table-command-header-def.directive';
import { SdMaterialFooterDefDirective } from './directives/sd-table-footer-def.directive';
import { SdTableMobileCardsComponent } from './components/mobile-cards/mobile-cards.component';
import { SdTableMobileActionsComponent } from './components/mobile-cards/mobile-actions.component';
import { OverlayContainer } from '@angular/cdk/overlay';
import { I18nService } from '@sdcorejs/angular/i18n';

interface MobileRow {
  id: number;
  name: string;
  locked?: boolean;
  children?: MobileRow[];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [
    SdTable,
    SdTableRowMobileDefDirective,
    SdTableExpandDefDirective,
    SdTableCommandHeaderDefDirective,
    SdMaterialFooterDefDirective,
  ],
  template: `
    <sd-table autoId="mobile-test" [option]="option">
      @if (withTemplate()) {
        <ng-template
          [sdTableRowMobileDef]="option"
          let-row="item"
          let-index="index"
          let-selected="selected"
          let-disabled="selectionDisabled">
          <span class="row-content">{{ row.name }}:{{ index }}:{{ selected }}:{{ disabled }}</span>
          <button type="button" class="child-control" (click)="childClicks = childClicks + 1">Child</button>
          <input aria-label="Note" />
          <span contenteditable="true">Editable</span>
          @if (nested) {
            <sd-table [option]="nestedOption">
              <ng-template sdTableRowMobileDef let-child="item"
                ><span class="nested-content">{{ child.name }}</span></ng-template
              >
            </sd-table>
          }
        </ng-template>
      }
      @if (features) {
        <ng-template sdTableCommandHeaderDef
          ><button class="command-header" type="button" (click)="headerClicks = headerClicks + 1">Add</button></ng-template
        >
        <ng-template sdTableExpandDef let-row="item"
          ><span class="expand-context">Details {{ row.data.name }}</span></ng-template
        >
        <ng-template sdTableFooterDef="name" let-items="items"
          ><span class="footer-context">Page total {{ items.length }}</span></ng-template
        >
      }
    </sd-table>
  `,
})
class MobileHost {
  withTemplate = signal(true);
  childClicks = 0;
  features = false;
  nested = false;
  nestedOption: SdTableOption<MobileRow> = {
    type: 'local',
    rowKey: 'id',
    items: () => [{ id: 11, name: 'Nested' }],
    columns: [{ field: 'name', title: 'Name', type: 'string' }],
    selector: { visible: true },
  };
  headerClicks = 0;
  rows: MobileRow[] = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
    { id: 3, name: 'Locked', locked: true },
  ];
  rowClick = jasmine.createSpy('row command');
  bulkClick = jasmine.createSpy('bulk action');
  fetch = jasmine.createSpy('items').and.callFake(() => this.rows);
  option: SdTableOption<MobileRow> = {
    type: 'local',
    rowKey: 'id',
    items: this.fetch,
    columns: [{ field: 'name', type: 'string', title: 'Name', sortable: true }],
    sort: { enable: true },
    selector: { visible: true, disabled: row => !!row?.locked, actions: [{ title: 'Process', click: this.bulkClick }] },
    commands: [{ title: 'View', click: this.rowClick }],
  };
}

describe('SdTable mobile cards', () => {
  let fixture: ComponentFixture<MobileHost>;
  let host: MobileHost;
  let table: SdTable<MobileRow>;
  const mobile = signal(true);
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const cards = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.sd-mobile-card'));
  const tap = (index: number) => {
    cards()[index].querySelector<HTMLElement>('.row-content')!.click();
    settle();
  };
  const select = (index: number) => {
    cards()[index].querySelector<HTMLInputElement>('input[type=checkbox], input[type=radio]')!.click();
    settle();
  };

  beforeEach(() => {
    mobile.set(true);
    TestBed.configureTestingModule({
      imports: [MobileHost],
      providers: [provideNoopAnimations(), { provide: SdViewportService, useValue: { isMobile: mobile } }],
    });
  });
  const create = (configure?: (component: MobileHost) => void) => {
    fixture = TestBed.createComponent(MobileHost);
    host = fixture.componentInstance;
    configure?.(host);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  it('dismisses an automatically opened row sheet with Escape without selecting the row', fakeAsync(() => {
    create();
    tap(0);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const close = overlay.querySelector<HTMLButtonElement>('.sd-modal-close-btn')!;
    expect(close).not.toBeNull();
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    settle();
    expect(overlay.querySelector('mat-bottom-sheet-container')).toBeNull();
    expect(table.selectedItems).toEqual([]);
    expect(host.rowClick).not.toHaveBeenCalled();
  }));

  it('starts on mobile without instantiating MatTable and prepares selection eligibility', fakeAsync(() => {
    create();
    expect(cards().length).toBe(3);
    expect(table.table()).toBeUndefined();
    expect(cards()[2].querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeTrue();
    expect(cards()[0].textContent).toContain('One:0:false:false');
  }));

  it('keeps nested template queries, card events and selection independent', fakeAsync(() => {
    create(h => {
      h.nested = true;
    });
    const tables = fixture.debugElement.queryAll(By.directive(SdTable)).map(node => node.componentInstance as SdTable<MobileRow>);
    expect(tables.length).toBe(4);
    (fixture.nativeElement.querySelector('.nested-content') as HTMLElement).click();
    settle();
    expect(tables[0].selectedItems).toEqual([]);
    expect(tables[1].selectedItems.map(row => row.id)).toEqual([11]);
    expect(tables[2].selectedItems).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.sd-mobile-actions').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions').closest('sd-table')).toBe(
      fixture.debugElement.queryAll(By.directive(SdTable))[1].nativeElement
    );
    expect(tables[0].sdRowMobileDef()).not.toBe(tables[1].sdRowMobileDef());
  }));

  it('keeps the existing renderer without a mobile template', fakeAsync(() => {
    create(h => h.withTemplate.set(false));
    expect(cards().length).toBe(0);
    expect(table.table()).toBeDefined();
  }));

  it('opens footer tools in a titled Core modal sheet and keeps the command header above cards', fakeAsync(() => {
    create(h => {
      h.features = true;
    });
    const element: HTMLElement = fixture.nativeElement;
    const footer = element.querySelector('.c-paginator')!;
    const header = element.querySelector('.sd-mobile-command-header');
    expect(header?.querySelector('.command-header')).not.toBeNull();
    expect(
      (header?.compareDocumentPosition(element.querySelector('.sd-mobile-list')!) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      footer.querySelectorAll('button:not(.mat-mdc-paginator-navigation-next):not(.mat-mdc-paginator-navigation-previous)').length
    ).toBe(1);
    expect(element.querySelector('.sd-mobile-select-page')).toBeNull();
    footer.querySelector<HTMLButtonElement>('[data-autoid$="-mobile-tools"]')!.click();
    settle();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('.sd-modal-bottom-sheet-panel .sd-modal-title')?.textContent?.trim()).toBeTruthy();
    expect(overlay.querySelector('[data-autoid$="-mobile-tool-sort-name"]')).not.toBeNull();
    expect(overlay.querySelector('[data-autoid$="-mobile-tool-filter"]')).not.toBeNull();
  }));

  it('uses a Core modal sheet for row commands and reserves compact QuickAction for selection', fakeAsync(() => {
    create(h => {
      h.option.selector!.message = 'Do not show this message on mobile';
    });
    tap(0);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('.sd-modal-bottom-sheet-panel .sd-mobile-sheet-action')?.textContent).toContain('View');
    expect(fixture.nativeElement.querySelector('sd-quick-action')).toBeNull();
    select(0);
    const bar = fixture.nativeElement.querySelector('sd-quick-action');
    expect(bar?.querySelector('.sd-mobile-selection-count')?.textContent).toContain('1');
    expect(bar?.textContent).not.toContain('Do not show this message on mobile');
    expect(bar?.querySelector('.sd-mobile-clear')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-mobile-select-page')).toBeNull();
  }));

  it('omits the footer tools trigger when every tool is disabled', fakeAsync(() => {
    create(h => {
      h.option.filter = { disabled: true };
      h.option.sort = { enable: false };
      h.option.reload = { visible: false };
      h.option.export = undefined;
    });
    expect(fixture.nativeElement.querySelector('.sd-mobile-tools-trigger')).toBeNull();
  }));

  it('keeps external filters in the mobile drawer and restores the desktop filter form on resize', fakeAsync(() => {
    create(h => {
      h.option.filter = { externalFilters: [{ field: 'name', type: 'string', title: 'Customer name' }] };
    });
    expect(fixture.nativeElement.querySelector('external-filter')).toBeNull();
    expect(
      table
        .mobileFilter()!
        .externalFilters()
        ?.map(filter => filter.field)
    ).toEqual(['name']);
    table.filterRegister!.value.set({ externalFilter: { name: 'One' } });
    settle();
    mobile.set(false);
    settle();
    expect(fixture.nativeElement.querySelector('external-filter')).not.toBeNull();
    expect(table.getFilterRequest().rawExternalFilter?.['name']).toBe('One');
    mobile.set(true);
    settle();
    expect(fixture.nativeElement.querySelector('external-filter')).toBeNull();
    table.mobileFilter()!.open();
    settle();
    expect(table.mobileFilter()!.workingExternalFilter()['name']).toBe('One');
  }));

  it('opens a row command without selecting, then enters and exits selection mode', fakeAsync(() => {
    create();
    tap(0);
    expect(table.selectedItems).toEqual([]);
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).toContain('View');
    select(0);
    expect(table.selectedItems).toEqual([host.rows[0]]);
    expect(fixture.nativeElement.querySelector('.sd-mobile-command-trigger')).toBeNull();
    tap(1);
    expect(table.selectedItems).toEqual(host.rows.slice(0, 2));
    tap(0);
    tap(1);
    expect(table.selectedItems).toEqual([]);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
  }));

  it('runs row and bulk callbacks once with their distinct payloads', fakeAsync(() => {
    create();
    tap(0);
    TestBed.inject(OverlayContainer).getContainerElement().querySelector<HTMLButtonElement>('.sd-mobile-sheet-action')!.click();
    settle();
    expect(host.rowClick).toHaveBeenCalledOnceWith(host.rows[0]);
    select(0);
    select(1);
    fixture.nativeElement.querySelector('.sd-mobile-action-direct button').click();
    settle();
    expect(host.bulkClick).toHaveBeenCalledOnceWith(host.rows.slice(0, 2));
    expect(table.selectedItems.length).toBe(2);
  }));

  it('preserves selection and sort/page instances on resize without fetching again', fakeAsync(() => {
    create();
    select(0);
    const sort = table.sort();
    const paginator = table.paginator();
    const calls = host.fetch.calls.count();
    mobile.set(false);
    settle();
    expect(cards().length).toBe(0);
    expect(table.table()).toBeDefined();
    expect(table.selectedItems).toEqual([host.rows[0]]);
    mobile.set(true);
    settle();
    expect(cards().length).toBe(3);
    expect(table.table()).toBeUndefined();
    expect(table.sort()).toBe(sort);
    expect(table.paginator()).toBe(paginator);
    expect(host.fetch.calls.count()).toBe(calls);
  }));

  it('does not turn nested controls into card actions', fakeAsync(() => {
    create();
    cards()[0].querySelector<HTMLElement>('.child-control')!.click();
    cards()[0].querySelector<HTMLElement>('input[aria-label=Note]')!.click();
    cards()[0].querySelector<HTMLElement>('[contenteditable]')!.click();
    settle();
    expect(host.childClicks).toBe(1);
    expect(table.selectedItems).toEqual([]);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
  }));

  it('selects immediately without row commands and keeps a selected radio checked', fakeAsync(() => {
    create(h => {
      h.option.commands = [];
      h.option.selector = { visible: true, single: true };
    });
    tap(0);
    select(0);
    expect(table.selectedItems).toEqual([host.rows[0]]);
    tap(1);
    expect(table.selectedItems).toEqual([host.rows[1]]);
    table.onClearSelection();
    settle();
    expect(table.selectedItems).toEqual([]);
  }));

  it('does not select when selector is hidden', fakeAsync(() => {
    create(h => {
      h.option.selector = { visible: false };
      h.option.commands = [];
    });
    tap(0);
    expect(cards()[0].querySelector('input[type=checkbox]')).toBeNull();
    expect(table.selectedItems).toEqual([]);
  }));

  it('renders desktop first when the viewport is desktop, then switches without applying defaults again', fakeAsync(() => {
    mobile.set(false);
    const defaults = jasmine.createSpy('defaultSelected').and.callFake((row: MobileRow) => row.id === 1);
    create(h => {
      h.option.selector!.defaultSelected = defaults;
    });
    expect(cards().length).toBe(0);
    expect(table.selectedItems[0].id).toBe(1);
    const count = defaults.calls.count();
    mobile.set(true);
    settle();
    expect(cards()[0].querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBeTrue();
    expect(defaults.calls.count()).toBe(count);
  }));

  it('keeps a clear-selection route without any bulk actions and allows a now-disabled selected row to be removed', fakeAsync(() => {
    create(h => {
      h.option.commands = [];
      h.option.selector = { visible: true, defaultSelected: row => row.id === 3, disabled: () => true };
    });
    expect(table.selectedItems.map(row => row.id)).toEqual([3]);
    expect(cards()[2].querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('sd-quick-action .sd-mobile-selection-summary')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-mobile-action-direct, .sd-mobile-more')).toBeNull();
    fixture.nativeElement.querySelector('.sd-mobile-clear').click();
    settle();
    expect(table.selectedItems).toEqual([]);
    expect(cards()[2].querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeTrue();
  }));

  it('keeps the shared page-selection API and indeterminate state without a mobile page checkbox', fakeAsync(() => {
    create();
    select(0);
    expect(table.isSelectAll()).toBeFalse();
    expect(table.isSelectIndeterminate()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.sd-mobile-select-page')).toBeNull();
    table.isSelectAll.set(true);
    table.onSelectAll();
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1, 2]);
    expect(table.isSelectAll()).toBeTrue();
    expect(table.isSelectIndeterminate()).toBeFalse();
    table.isSelectAll.set(false);
    table.onSelectAll();
    settle();
    expect(table.selectedItems).toEqual([]);
  }));

  it('does not report an empty eligible page as checked', fakeAsync(() => {
    create(h => {
      h.option.selector!.disabled = () => true;
    });
    expect(table.isSelectAll()).toBeFalse();
    expect(table.isSelectIndeterminate()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sd-mobile-selection-summary input[type=checkbox]')).toBeNull();
  }));

  it('preserves rowKey selection across server pages and page deselection leaves off-page rows selected', fakeAsync(() => {
    const selectedCallback = jasmine.createSpy('onSelect');
    create(h => {
      h.option = {
        ...h.option,
        type: 'server',
        paginate: { pageSize: 1 },
        selector: { visible: true, preserveSelection: true, onSelect: selectedCallback },
        items: async request => ({ items: [{ ...h.rows[request.pageNumber] }], total: 3 }),
      };
    });
    select(0);
    table.paginator()!.nextPage();
    settle();
    select(0);
    expect(table.selectedItems.map(row => row.id)).toEqual([1, 2]);
    expect(selectedCallback.calls.mostRecent().args[1].map((row: MobileRow) => row.id)).toEqual([1, 2]);
    expect(fixture.nativeElement.querySelector('.sd-mobile-selection-summary').getAttribute('aria-label')).toContain('1');
    expect(fixture.nativeElement.querySelector('.sd-mobile-selection-count').textContent).toBe('2');
    table.isSelectAll.set(false);
    table.onSelectAll();
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
    table.paginator()!.previousPage();
    settle();
    expect(cards()[0].querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBeTrue();
  }));

  it('does not combine incompatible children of the same bulk-action group', fakeAsync(() => {
    create(h => {
      h.option.selector = {
        visible: true,
        actions: [
          {
            title: 'Group',
            children: [
              { title: 'Only one', hidden: row => row?.id !== 1, click: h.bulkClick },
              { title: 'Only two', hidden: row => row?.id !== 2, click: h.bulkClick },
            ],
          },
        ],
      };
    });
    expect(table.visibleSelectAll()).toBeFalse();
    select(0);
    expect(cards()[1].querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeTrue();
    tap(1);
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
  }));

  it('does not offer partial bulk actions when the preserved selection has no common action', fakeAsync(() => {
    create(h => {
      h.option.selector = {
        visible: true,
        defaultSelected: () => true,
        actions: [
          { title: 'One', hidden: row => row?.id !== 1, click: h.bulkClick },
          { title: 'Two', hidden: row => row?.id !== 2, click: h.bulkClick },
        ],
      };
    });
    expect(table.selectedItems.length).toBe(3);
    expect(fixture.nativeElement.querySelector('sd-quick-action .sd-mobile-selection-summary')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-mobile-action-direct, .sd-mobile-more')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-mobile-clear')).not.toBeNull();
    expect(host.bulkClick).not.toHaveBeenCalled();
  }));

  it('keeps single selection replacement independent of the old row action eligibility', fakeAsync(() => {
    create(h => {
      h.option.selector = {
        visible: true,
        single: true,
        actions: [
          { title: 'One', hidden: row => row?.id !== 1, click: h.bulkClick },
          { title: 'Two', hidden: row => row?.id !== 2, click: h.bulkClick },
        ],
      };
    });
    select(0);
    tap(1);
    expect(table.selectedItems.map(row => row.id)).toEqual([2]);
  }));

  it('does not open an empty command bar for hidden commands, including a hidden group', fakeAsync(() => {
    create(h => {
      h.option.commands = [
        { title: 'Hidden', hidden: true, click: h.rowClick },
        { title: 'Hidden group', hidden: async () => true, children: [{ title: 'Child', click: h.rowClick }] },
      ];
    });
    tap(0);
    expect(fixture.nativeElement.querySelector('.sd-mobile-command-trigger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
  }));

  it('does not replace row B commands when a slow hidden predicate for A resolves later', fakeAsync(() => {
    let resolveA!: (value: boolean) => void;
    create(h => {
      h.option.commands = [
        {
          title: row => `Command ${row.id}`,
          hidden: row =>
            row.id === 1
              ? new Promise(resolve => {
                  resolveA = resolve;
                })
              : false,
          click: h.rowClick,
        },
      ];
    });
    tap(1);
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).toContain('Command 2');
    resolveA(false);
    settle();
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).toContain('Command 2');
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).not.toContain('Command 1');
  }));

  it('closes row commands when a new page/filter replaces their data context', fakeAsync(() => {
    create();
    tap(0);
    table.setFilter({ columnFilter: { name: 'Two' } });
    settle();
    expect(cards().length).toBe(1);
    expect(cards()[0].textContent).toContain('Two');
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
  }));

  it('does not treat a pointer scroll, cancellation, drag or selected text as a card click', fakeAsync(() => {
    create();
    const card = cards()[0];
    card.dispatchEvent(new PointerEvent('pointerdown', { clientX: 20, clientY: 20, bubbles: true }));
    card.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 50, bubbles: true }));
    tap(0);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    card.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    tap(0);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    const renderer = fixture.debugElement.query(By.directive(SdTableMobileCardsComponent))
      .componentInstance as SdTableMobileCardsComponent<MobileRow>;
    renderer.dragStart();
    tap(0);
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const range = document.createRange();
    range.selectNodeContents(card.querySelector('.row-content')!);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    try {
      tap(0);
      expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    } finally {
      document.getSelection()!.removeAllRanges();
    }
  }));

  it('offers keyboard activation and Escape closes row commands with focus restored', fakeAsync(() => {
    create();
    const card = cards()[0];
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    settle();
    expect(TestBed.inject(OverlayContainer).getContainerElement().querySelector('.sd-modal-bottom-sheet-panel')).not.toBeNull();
    const ancestorEscape = jasmine.createSpy('ancestor Escape');
    fixture.nativeElement.addEventListener('keydown', ancestorEscape);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    card.dispatchEvent(escape);
    settle();
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    expect(document.activeElement).toBe(card);
    expect(escape.defaultPrevented).toBeTrue();
    expect(ancestorEscape).not.toHaveBeenCalled();
  }));

  it('retains command header, footer scope and expanded details across a resize', fakeAsync(() => {
    create(h => {
      h.features = true;
      h.option.expand = { multiple: true, onExpand: row => row };
    });
    fixture.nativeElement.querySelector('.command-header').click();
    settle();
    expect(host.headerClicks).toBe(1);
    expect(fixture.nativeElement.querySelector('.footer-context')).withContext('mobile footer').not.toBeNull();
    expect(fixture.nativeElement.querySelector('.footer-context')?.textContent).toContain('3');
    cards()[0].querySelector<HTMLElement>('[data-autoid$="-expand-1"]')!.click();
    settle();
    expect(cards()[0].querySelector('.expand-context')!.textContent).toContain('One');
    expect(table.selectedItems).toEqual([]);
    mobile.set(false);
    settle();
    expect(fixture.nativeElement.querySelector('.expand-context')).withContext('desktop expanded detail').not.toBeNull();
    expect(fixture.nativeElement.querySelector('.expand-context')?.textContent).toContain('One');
    mobile.set(true);
    settle();
    expect(cards()[0].querySelector('.expand-context')).not.toBeNull();
  }));

  it('keeps group headers out of the data template and selects only eligible group rows', fakeAsync(() => {
    create(h => {
      h.option.group = { fields: ['locked'], collapsible: true };
    });
    expect(cards().map(card => card.querySelector('.row-content')!.textContent)).toEqual([
      'One:0:false:false',
      'Two:1:false:false',
      'Locked:2:false:true',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.sd-mobile-group').length).toBe(2);
    const header = table.groupHost.headers[0];
    table.onSelectGroup(header, true);
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1, 2]);
    table.toggleGroupExpand(header);
    settle();
    expect(cards().length).toBe(1);
    table.onClearSelection();
    settle();
    expect(table.selectedItems).toEqual([]);
  }));

  it('selects only visible loaded tree rows and clears cached children too', fakeAsync(() => {
    create(h => {
      h.rows = [
        { id: 1, name: 'Parent', children: [{ id: 11, name: 'Child' }] },
        { id: 2, name: 'Other' },
      ];
      h.option.tree = { loadType: 'static', childrenKey: 'children', defaultExpanded: false };
    });
    table.isSelectAll.set(true);
    table.onSelectAll();
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1, 2]);
    table.onTreeToggle(table.items()[0]);
    settle();
    expect(cards().length).toBe(3);
    expect(cards()[1].querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBeFalse();
    select(1);
    table.onTreeToggle(table.items()[0]);
    settle();
    table.onClearSelection();
    table.onTreeToggle(table.items()[0]);
    settle();
    expect(cards()[1].querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBeFalse();
  }));

  it('shows an error state and can recover on retry', fakeAsync(() => {
    let fail = true;
    spyOn(console, 'error');
    create(h => {
      h.option = {
        ...h.option,
        type: 'server',
        items: async () => {
          if (fail) throw new Error('Offline');
          return { items: h.rows, total: 3 };
        },
      };
    });
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    expect(table.loading()).toBeFalse();
    fail = false;
    table.reload();
    settle();
    expect(cards().length).toBe(3);
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
  }));

  it('counts a selected cached tree child on this page even when its parent is collapsed', fakeAsync(() => {
    create(h => {
      h.rows = [{ id: 1, name: 'Parent', children: [{ id: 11, name: 'Child' }] }];
      h.option.tree = { loadType: 'static', childrenKey: 'children' };
      h.option.selector = { visible: true, preserveSelection: true };
    });
    table.onTreeToggle(table.items()[0]);
    settle();
    select(1);
    table.onTreeToggle(table.items()[0]);
    settle();
    const renderer = fixture.debugElement.query(By.directive(SdTableMobileCardsComponent))
      .componentInstance as SdTableMobileCardsComponent<MobileRow>;
    expect(renderer.selectionSummary()).toBe(TestBed.inject(I18nService).t('core.component.table.mobile.selected', { count: 1 }));
  }));

  it('recovers from a synchronous data-source failure without terminating reloads', fakeAsync(() => {
    let fail = true;
    spyOn(console, 'error');
    create(h => {
      h.fetch.and.callFake(() => {
        if (fail) throw new Error('Offline');
        return h.rows;
      });
    });
    expect(table.loadError()).toBeTrue();
    fail = false;
    table.reload();
    settle();
    expect(cards().length).toBe(3);
    expect(table.loadError()).toBeFalse();
  }));

  it('cycles mobile sort through ascending, descending and clear on the shared pipeline', fakeAsync(() => {
    create();
    const sort = () => {
      fixture.nativeElement.querySelector('.c-paginator [data-autoid$="-mobile-tools"]').click();
      settle();
      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      overlay.querySelector<HTMLButtonElement>('[data-autoid$="-mobile-tool-sort-name"]')!.click();
    };
    sort();
    settle();
    expect(cards()[0].textContent).toContain('Locked');
    expect(table.getFilterRequest().orderDirection).toBe('ASC');
    sort();
    settle();
    expect(cards()[0].textContent).toContain('Two');
    sort();
    settle();
    expect(table.getFilterRequest().orderDirection).toBeUndefined();
    expect(host.fetch).toHaveBeenCalledTimes(1);
  }));

  it('uses rowLabel, rowKey, then an ordinal without leaking internal identities', fakeAsync(() => {
    create(h => {
      h.option.rowKey = undefined;
      h.option.mobile = { rowLabel: row => (row.id === 1 ? 'Order 001' : '') };
    });
    expect(cards()[0].getAttribute('aria-label')).toBe('Order 001');
    expect(cards()[1].getAttribute('aria-label')).toMatch(/2/);
    expect(cards()[1].getAttribute('aria-label')).not.toContain('sd-row');
    expect(cards()[1].getAttribute('aria-label')).not.toContain('Two');
  }));

  it('keeps at most one default row in single-selection mode', fakeAsync(() => {
    create(h => {
      h.option.selector = { visible: true, single: true, defaultSelected: () => true };
    });
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
    select(0);
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
  }));

  it('retains selection while More closes, preserves command groups and invokes a child once', fakeAsync(() => {
    create(h => {
      h.option.selector!.actions = [{ title: 'Reports', children: [{ title: 'Export long report', click: h.bulkClick }] }];
    });
    select(0);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    fixture.nativeElement.querySelector('.sd-mobile-more').click();
    settle();
    expect(overlay.querySelector('[role=dialog]')).not.toBeNull();
    expect(overlay.querySelector('h3')?.textContent).toContain('Reports');
    (overlay.querySelector('.sd-modal-close-btn') as HTMLElement).click();
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
    fixture.nativeElement.querySelector('.sd-mobile-more').click();
    settle();
    (overlay.querySelector('.sd-mobile-sheet-action') as HTMLElement).click();
    settle();
    expect(host.bulkClick).toHaveBeenCalledOnceWith([host.rows[0]]);
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
  }));

  it('disables grouped commands and keeps HTML commands labelled in More', fakeAsync(() => {
    create(h => {
      h.option.commands = [
        { title: 'Disabled group', disabled: true, children: [{ title: 'Child', click: h.rowClick }] },
        { title: 'HTML action', htmlTemplate: () => '<b>Details</b>', click: h.rowClick },
      ];
    });
    tap(0);
    settle();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const buttons = overlay.querySelectorAll<HTMLButtonElement>('.sd-mobile-sheet-action');
    expect(buttons[0].disabled).toBeTrue();
    buttons[0].click();
    expect(host.rowClick).not.toHaveBeenCalled();
    expect(buttons[1].textContent).toContain('HTML action');
    expect(buttons[1].querySelector('b')?.textContent).toBe('Details');
    buttons[1].click();
    settle();
    expect(host.rowClick).toHaveBeenCalledOnceWith(host.rows[0]);
  }));

  it('blocks duplicate Promise actions and leaves success and failure selection ownership to the consumer', fakeAsync(() => {
    let resolve!: () => void;
    create(h => {
      h.bulkClick.and.callFake(
        () =>
          new Promise<void>(done => {
            resolve = done;
          })
      );
    });
    select(0);
    const bar = fixture.debugElement.query(By.directive(SdTableMobileActionsComponent)).componentInstance as SdTableMobileActionsComponent;
    const action = bar.actions()[0];
    bar.run(action);
    bar.run(action);
    settle();
    expect(host.bulkClick).toHaveBeenCalledTimes(1);
    expect(bar.busy()).toBeTrue();
    resolve();
    settle();
    expect(bar.busy()).toBeFalse();
    expect(table.selectedItems.length).toBe(1);
    spyOn(console, 'error');
    host.bulkClick.and.callFake(async () => {
      throw new Error('Rejected');
    });
    bar.run(action);
    settle();
    expect(bar.error()).toBeTruthy();
    expect(table.selectedItems.length).toBe(1);
  }));

  it('dismisses an owned More sheet on renderer change and destroy', fakeAsync(() => {
    create(h => {
      h.option.commands = [{ title: 'Group', children: [{ title: 'Child', click: h.rowClick }] }];
    });
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    tap(0);
    settle();
    mobile.set(false);
    settle();
    expect(overlay.querySelector('[role=dialog]')).toBeNull();
    mobile.set(true);
    settle();
    tap(0);
    settle();
    fixture.destroy();
    tick(850);
    flush();
    expect(overlay.querySelector('[role=dialog]')).toBeNull();
  }));

  it('refreshes eligibility and closes stale commands after a consumer edits a row in place', fakeAsync(() => {
    create();
    tap(0);
    host.rows[0].locked = true;
    table.detectChanges();
    settle();
    expect(fixture.nativeElement.querySelector('.sd-mobile-actions')).toBeNull();
    expect(cards()[0].querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeTrue();
  }));
});

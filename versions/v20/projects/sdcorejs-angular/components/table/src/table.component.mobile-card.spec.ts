import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTableExpandDefDirective } from './directives/sd-table-expand-def.directive';

interface CardRow {
  id: number;
  name: string;
}

@Component({
  imports: [SdTable, SdTableRowMobileDefDirective, SdTableExpandDefDirective],
  template: `
    <div
      style="width: 360px; --sd-surface: rgb(255, 255, 255); --sd-surface-muted: rgb(230, 230, 230); --sd-border: rgb(200, 200, 200); --sd-primary: rgb(0, 90, 190)">
      <sd-table autoId="card" [option]="option">
        <ng-template [sdTableRowMobileDef]="option" let-row="item" let-index="index" let-selected="selected">
          <span class="row-content">{{ row.name }}:{{ index }}:{{ selected }}</span>
        </ng-template>
        @if (expand) {
          <ng-template sdTableExpandDef let-row="item"
            ><span class="expand-context">Details {{ row.data.name }}</span></ng-template
          >
        }
      </sd-table>
    </div>
  `,
})
class CardHost {
  expand = false;
  rows: CardRow[] = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
  ];
  option: SdTableOption<CardRow> = {
    type: 'local',
    rowKey: 'id',
    items: () => this.rows,
    columns: [{ field: 'name', type: 'string', title: 'Name' }],
    selector: { visible: true },
    commands: [{ title: 'View', click: () => undefined }],
  };
}

/** Section 8 of the table-mobile handoff: card frame. */
describe('SdTable mobile card frame', () => {
  let fixture: ComponentFixture<CardHost>;
  let table: SdTable<CardRow>;
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const element = (): HTMLElement => fixture.nativeElement;
  const cards = (): HTMLElement[] => Array.from(element().querySelectorAll('.sd-mobile-card'));
  const columns = (card: HTMLElement): string[] => getComputedStyle(card).gridTemplateColumns.split(' ');
  const create = (configure?: (host: CardHost) => void) => {
    fixture = TestBed.createComponent(CardHost);
    configure?.(fixture.componentInstance);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardHost],
      providers: [provideNoopAnimations(), { provide: SdViewportService, useValue: { isMobile: signal(true) } }],
    });
  });

  it('lays the list out on a low surface with 8px between cards', fakeAsync(() => {
    create();
    const list = element().querySelector<HTMLElement>('.sd-mobile-list')!;
    const style = getComputedStyle(list);
    expect(style.paddingTop).toBe('8px');
    expect(style.paddingLeft).toBe('12px');
    expect(style.rowGap).toBe('8px');
    expect(style.backgroundColor).not.toBe(getComputedStyle(cards()[0]).backgroundColor);
    const card = getComputedStyle(cards()[0]);
    expect(card.borderTopLeftRadius).toBe('12px');
    expect(card.borderTopWidth).toBe('1px');
  }));

  it('puts the selector in a 44px left column instead of over the corner', fakeAsync(() => {
    create();
    const card = cards()[0];
    expect(columns(card).length).toBe(3);
    expect(columns(card)[0]).toBe('44px');
    expect(columns(card)[2]).toBe('44px');
    const zone = card.querySelector<HTMLElement>('.sd-mobile-card-select')!;
    expect(zone).not.toBeNull();
    expect(zone.querySelector('mat-checkbox')).not.toBeNull();
    const cardBox = card.getBoundingClientRect();
    const zoneBox = zone.getBoundingClientRect();
    expect(zoneBox.width).toBe(44);
    expect(zoneBox.height).toBe(44);
    expect(Math.round(zoneBox.left - cardBox.left)).toBeLessThanOrEqual(1);
    expect(zoneBox.top).toBeGreaterThanOrEqual(cardBox.top);
    const body = card.querySelector<HTMLElement>('.sd-mobile-card-body')!.getBoundingClientRect();
    expect(body.left).toBeGreaterThanOrEqual(zoneBox.right);
  }));

  it('has no left column without a selector', fakeAsync(() => {
    create(host => (host.option.selector = undefined));
    const card = cards()[0];
    expect(card.querySelector('.sd-mobile-card-select')).toBeNull();
    expect(columns(card).length).toBe(2);
    expect(columns(card)[1]).toBe('44px');
    expect(getComputedStyle(card).paddingLeft).toBe('16px');
  }));

  it('opens row commands from ⋯ in the top-right corner and drops the "Details · ⋯" row', fakeAsync(() => {
    create();
    const card = cards()[0];
    expect(card.querySelector('.sd-mobile-card-actions')).toBeNull();
    const trigger = card.querySelector<HTMLButtonElement>('.sd-mobile-command-trigger')!;
    expect(trigger.getAttribute('data-autoid')).toMatch(/-card-mobile-row-1-commands$/);
    const cardBox = card.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();
    expect(box.width).toBe(44);
    expect(box.height).toBe(44);
    expect(Math.round(cardBox.right - box.right)).toBeLessThanOrEqual(1);
    expect(box.top - cardBox.top).toBeLessThanOrEqual(6);
    trigger.click();
    settle();
    expect(document.querySelector('.sd-modal-bottom-sheet-panel')?.textContent).toContain('View');
    expect(table.selectedItems).toEqual([]);
  }));

  it('renders the consumer template in the content column with the same context', fakeAsync(() => {
    create();
    const card = cards()[1];
    const main = card.querySelector<HTMLElement>('.sd-mobile-card-main')!;
    expect(main.querySelector('.sd-mobile-card-body .row-content')?.textContent).toBe('Two:1:false');
    expect(getComputedStyle(main).paddingTop).toBe('10px');
  }));

  it('adds a Details line at the end of the card only when the table has an expand template', fakeAsync(() => {
    create();
    expect(cards()[0].querySelector('.sd-mobile-card-details')).toBeNull();
    fixture.destroy();
    create(host => (host.expand = true));
    const card = cards()[0];
    const details = card.querySelector<HTMLButtonElement>('.sd-mobile-card-details')!;
    expect(details.getAttribute('data-autoid')).toMatch(/-card-expand-1$/);
    const main = card.querySelector<HTMLElement>('.sd-mobile-card-main')!;
    expect(main.lastElementChild).toBe(details);
    details.click();
    settle();
    expect(card.querySelector('.sd-mobile-expand .expand-context')?.textContent).toContain('Details One');
    expect(details.getAttribute('aria-expanded')).toBe('true');
  }));

  it('hides ⋯ and narrows the right column to 12px while rows are selected', fakeAsync(() => {
    create();
    cards()[0].querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    settle();
    const [selected, other] = cards();
    expect(selected.classList).toContain('selected');
    expect(other.classList).not.toContain('selected');
    for (const card of cards()) {
      expect(card.querySelector('.sd-mobile-command-trigger')).toBeNull();
      expect(columns(card)[2]).toBe('12px');
    }
    expect(getComputedStyle(selected).borderTopColor).not.toBe(getComputedStyle(other).borderTopColor);
  }));

  it('keeps a 12px right column when the table has no row commands', fakeAsync(() => {
    create(host => (host.option.commands = undefined));
    expect(columns(cards()[0])[2]).toBe('12px');
  }));

  it('selects once when the tap lands in the 44px zone outside the checkbox box', fakeAsync(() => {
    create();
    const zone = cards()[0].querySelector<HTMLElement>('.sd-mobile-card-select')!;
    const box = zone.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + 2, box.top + 2) as HTMLElement;
    expect(zone.contains(target)).toBeTrue();
    target.click();
    settle();
    expect(table.selectedItems.map(row => row.id)).toEqual([1]);
    expect(document.querySelector('.sd-modal-bottom-sheet-panel')).toBeNull();
  }));
});

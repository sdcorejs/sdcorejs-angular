import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdHistoryItem } from './history.component';
import { SdHistoryItemType } from '../models/history.model';

describe('SdHistoryItem', () => {
  let fixture: ComponentFixture<SdHistoryItem>;
  let component: SdHistoryItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdHistoryItem, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdHistoryItem);
    component = fixture.componentInstance;
  });

  it('creates with default empty items', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.items).toEqual([]);
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.history-item');
    expect(items.length).toBe(0);
  });

  it('renders one card per item with title', () => {
    const data: SdHistoryItemType[] = [
      { title: 'Created' },
      { title: 'Approved' },
    ];
    component.items = data;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const items = host.querySelectorAll('.history-item');
    expect(items.length).toBe(2);

    const titles = Array.from(host.querySelectorAll('.title')).map(n => n.textContent?.trim());
    expect(titles).toEqual(['Created', 'Approved']);
  });

  it('renders sd-badge only when status is present', () => {
    component.items = [
      { title: 'no-status' },
      { title: 'with-status', status: { title: 'Done', color: 'success' } },
    ];
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const badges = host.querySelectorAll('sd-badge');
    expect(badges.length).toBe(1);
  });

  it('renders formatted date when item.date is a valid ISO string', () => {
    component.items = [{ title: 't', date: '2026-05-28T08:00:00' }];
    fixture.detectChanges();

    const dateEl = (fixture.nativeElement as HTMLElement).querySelector('.date');
    expect(dateEl?.textContent).toMatch(/\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
  });

  it('renders actor block only when actor present', () => {
    component.items = [
      { title: 'no actor' },
      { title: 'has actor', actor: 'alice' },
    ];
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const metas = host.querySelectorAll('.meta');
    expect(metas.length).toBe(2);
    // Item 1 meta is empty (no actor / source)
    expect(metas[0].textContent?.trim()).toBe('');
    // Item 2 meta contains @alice
    expect(metas[1].textContent).toContain('@alice');
  });

  it('renders source block only when source present', () => {
    component.items = [{ title: 't', actor: 'a', source: 'API' }];
    fixture.detectChanges();
    const meta = (fixture.nativeElement as HTMLElement).querySelector('.meta');
    expect(meta?.textContent).toContain('API');
  });

  it('renders description text', () => {
    component.items = [{ title: 't', description: 'change-log here' }];
    fixture.detectChanges();
    const desc = (fixture.nativeElement as HTMLElement).querySelector('.description');
    expect(desc?.textContent?.trim()).toBe('change-log here');
  });

  it('updates when items input changes', () => {
    component.items = [{ title: 'A' }];
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.history-item').length).toBe(1);

    component.items = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.history-item').length).toBe(3);
  });
});

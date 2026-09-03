import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfigComponent } from './config.component';
import { SdTableOption } from '../../models/table-option.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOption(): SdTableOption {
  return {
    type: 'local',
    key: `config-spec-${Math.random().toString(36).slice(2)}`,
    data: [],
    columns: [
      { field: 'name', title: 'Họ và tên', width: '180px' },
      { field: 'email', title: 'Email', width: '220px' },
      { field: 'dept', title: 'Phòng ban', width: '140px' },
    ],
  } as unknown as SdTableOption;
}

/** Modal renders through an overlay, so the panel content lives on document.body. */
function panel(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>('.sd-table-config');
  if (!el) throw new Error('config panel not rendered');
  return el;
}

function rows(): HTMLElement[] {
  return Array.from(panel().querySelectorAll<HTMLElement>('tr.mat-mdc-row'));
}

describe('ConfigComponent (table setup dialog)', () => {
  let fixture: ComponentFixture<ConfigComponent>;
  let component: ConfigComponent;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [ConfigComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tableOption', makeOption());
    fixture.componentRef.setInput('autoId', 'components-table-demo');
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.querySelectorAll('.cdk-overlay-container').forEach(el => {
      el.innerHTML = '';
    });
    localStorage.clear();
  });

  function open(): void {
    component.open();
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  }

  // -------------------------------------------------------------------------
  // Controls
  // -------------------------------------------------------------------------

  it('renders one row per configurable column', fakeAsync(() => {
    open();
    expect(rows().length).toBe(3);
  }));

  // why: switch quá nặng thị giác cho một bảng nhiều dòng toàn giá trị bật/tắt — chốt dùng
  // checkbox. Khoá lại để không ai đổi ngược về sd-switch.
  it('uses checkboxes, not switches, for the boolean columns', fakeAsync(() => {
    open();
    const row = rows()[0];
    expect(row.querySelectorAll('sd-checkbox').length).toBe(3);
    expect(row.querySelector('sd-switch')).toBeNull();
  }));

  it('renders the compact input size for title and width', fakeAsync(() => {
    open();
    const row = rows()[0];
    const inputs = row.querySelectorAll('sd-input');
    expect(inputs.length).toBe(2);
    // sd-input đặt class size lên mat-form-field bên trong, không phải host.
    inputs.forEach(input => expect(input.querySelector('mat-form-field.sd-sm')).not.toBeNull());
  }));

  // -------------------------------------------------------------------------
  // Drag-and-drop affordance
  // -------------------------------------------------------------------------

  it('shows a localized drag-and-drop hint above the table', fakeAsync(() => {
    open();
    const hint = panel().querySelector<HTMLElement>('.c-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Kéo');
  }));

  // -------------------------------------------------------------------------
  // Hidden row state
  // -------------------------------------------------------------------------

  it('marks a row as hidden and disables its editors when display is turned off', fakeAsync(() => {
    open();
    const columns = component.configuration()!.columns!;
    columns[1].invisible = true;
    fixture.detectChanges();

    const row = rows()[1];
    expect(row.classList.contains('c-row-hidden')).toBe(true);

    // Editors are locked, but the display toggle itself must stay usable to bring the row back.
    row.querySelectorAll('sd-input input').forEach(input => expect((input as HTMLInputElement).disabled).toBe(true));
    const displayToggle = row.querySelector<HTMLInputElement>('.c-display-cell sd-checkbox input');
    expect(displayToggle?.disabled).toBe(false);

    expect(component.isRowDisabled(columns[1])).toBe(true);
    expect(component.isRowDisabled(columns[0])).toBe(false);
  }));

  it('keeps every row enabled while all columns are visible', fakeAsync(() => {
    open();
    rows().forEach(row => expect(row.classList.contains('c-row-hidden')).toBe(false));
  }));
});

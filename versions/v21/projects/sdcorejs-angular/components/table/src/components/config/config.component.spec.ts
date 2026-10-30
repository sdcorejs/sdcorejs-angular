import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfigComponent } from './config.component';
import { SdTableOption } from '../../models/table-option.model';
import { LayoutTestTheme } from '../../../../../testing/layout-theme.spec';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ColumnSeed = Record<string, unknown> & { field: string; title: string };

const BASE_COLUMNS: ColumnSeed[] = [
  { field: 'name', title: 'Họ và tên', width: '180px' },
  { field: 'email', title: 'Email', width: '220px' },
  { field: 'dept', title: 'Phòng ban', width: '140px' },
];

// Ten columns: more than eight, so the find box shows.
const WIDE_COLUMNS: ColumnSeed[] = [
  { field: 'code', title: 'Mã đơn', width: '120px' },
  { field: 'customer', title: 'Khách hàng' },
  { field: 'phone', title: 'Điện thoại' },
  { field: 'createdAt', title: 'Ngày tạo', width: '128px' },
  { field: 'status', title: 'Trạng thái', width: '150px' },
  { field: 'channel', title: 'Kênh bán' },
  { field: 'payment', title: 'Thanh toán' },
  { field: 'staff', title: 'Nhân viên phụ trách' },
  { field: 'note', title: 'Ghi chú', width: '240px' },
  { field: 'total', title: 'Tổng tiền', width: '140px' },
];

function makeOption(columns: ColumnSeed[] = BASE_COLUMNS): SdTableOption {
  return {
    type: 'local',
    key: `config-spec-${Math.random().toString(36).slice(2)}`,
    data: [],
    columns,
  } as unknown as SdTableOption;
}

/** Modal renders through an overlay, so the panel content lives on document.body. */
function panel(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>('.sd-table-config');
  if (!el) throw new Error('config panel not rendered');
  return el;
}

function modalRoot(): HTMLElement {
  return panel().closest<HTMLElement>('.sd-modal-root')!;
}

function items(): HTMLElement[] {
  return Array.from(panel().querySelectorAll<HTMLElement>('.c-item'));
}

function item(field: string): HTMLElement {
  const el = panel().querySelector<HTMLElement>(`.c-item[data-field="${field}"]`);
  if (!el) throw new Error(`no row for ${field}`);
  return el;
}

function rowFields(): string[] {
  return items().map(el => el.dataset['field']!);
}

/** sd-button prefixes its autoId with `components-button-`. */
function byAutoId(autoId: string): HTMLButtonElement | null {
  return modalRoot().querySelector<HTMLButtonElement>(`[data-autoid="components-button-${autoId}"]`);
}

describe('ConfigComponent (table setup dialog)', () => {
  let fixture: ComponentFixture<ConfigComponent>;
  let component: ConfigComponent;

  async function setup(columns?: ColumnSeed[]): Promise<void> {
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tableOption', makeOption(columns));
    fixture.componentRef.setInput('autoId', 'components-table-demo');
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [ConfigComponent, LayoutTestTheme, NoopAnimationsModule],
    }).compileComponents();

    TestBed.createComponent(LayoutTestTheme).detectChanges();
    await document.fonts.ready;
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

  function render(): void {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function toggle(field: string): void {
    item(field).querySelector<HTMLButtonElement>('.c-toggle')!.click();
    render();
  }

  function clickCheckbox(host: Element): void {
    host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    render();
  }

  /** The control of an sd-switch (mat-slide-toggle renders a `button[role=switch]`). */
  function switchOf(host: Element | null): HTMLButtonElement {
    const control = host?.querySelector<HTMLButtonElement>('button[role="switch"]');
    if (!control) throw new Error('no switch');
    return control;
  }

  function clickSwitch(host: Element | null): void {
    switchOf(host).click();
    render();
  }

  function input(host: Element | null): HTMLInputElement {
    const el = host?.querySelector<HTMLInputElement>('input');
    if (!el) throw new Error('no input');
    return el;
  }

  function type(host: Element | null, value: string): void {
    const el = input(host);
    el.value = value;
    el.dispatchEvent(new Event('input'));
    render();
  }

  function blur(host: Element | null): void {
    input(host).dispatchEvent(new FocusEvent('blur'));
    render();
  }

  function columnOf(field: string) {
    return component.configuration()!.columns!.find(column => column.origin.field === field)!;
  }

  function find(value: string): void {
    type(panel().querySelector('.c-find'), value);
  }

  // -------------------------------------------------------------------------
  // Rows
  // -------------------------------------------------------------------------

  describe('rows', () => {
    beforeEach(() => setup());

    it('renders one collapsed row per configurable column, in order', fakeAsync(() => {
      open();
      expect(rowFields()).toEqual(['name', 'email', 'dept']);
      expect(panel().querySelector('table')).withContext('no mat-table any more').toBeNull();
      expect(panel().querySelector('.c-details')).withContext('every row starts collapsed').toBeNull();
    }));

    it('puts the handle, the Show checkbox and the open button on every row, in that order', fakeAsync(() => {
      open();
      const row = item('email').querySelector<HTMLElement>('.c-row')!;
      const parts = Array.from(row.children).map(el =>
        el.classList.contains('c-handle')
          ? 'handle'
          : el.classList.contains('c-show')
            ? 'show'
            : el.classList.contains('c-toggle')
              ? 'toggle'
              : '?'
      );
      expect(parts).toEqual(['handle', 'show', 'toggle']);
      expect(row.querySelector('button.c-handle')).not.toBeNull();
      expect(row.querySelectorAll('sd-checkbox').length).toBe(1);
      expect(row.querySelector('sd-switch')).toBeNull();
      expect(row.querySelector('sd-input')).toBeNull();
    }));

    it('names each handle after its column', fakeAsync(() => {
      open();
      expect(item('email').querySelector('.c-handle')!.getAttribute('aria-label')).toContain('Email');
    }));

    it('names each Show checkbox after its column', fakeAsync(() => {
      open();
      const label = item('email').querySelector('.c-show label');
      expect(label?.textContent).toContain('Email');
    }));

    it('keeps rows 44px tall and centers the Show checkbox in them', fakeAsync(() => {
      open();
      items().forEach(el => {
        const row = el.querySelector<HTMLElement>('.c-row')!.getBoundingClientRect();
        expect(Math.abs(row.height - 44))
          .withContext('row height')
          .toBeLessThanOrEqual(1);
        const box = el.querySelector('.c-show .mdc-checkbox__background')!.getBoundingClientRect();
        expect(Math.abs(box.top + box.height / 2 - row.top - row.height / 2))
          .withContext('checkbox / row vertical centers')
          .toBeLessThanOrEqual(1);
      });
    }));

    it('aligns the list border with the modal footer buttons', fakeAsync(() => {
      open();
      const list = panel().querySelector('.c-list')!.getBoundingClientRect();
      const footer = modalRoot().querySelector('.sd-modal-footer-right')!.getBoundingClientRect();
      expect(Math.abs(list.right - footer.right)).toBeLessThanOrEqual(1);
    }));

    it('shows a localized drag-and-drop hint above the list', fakeAsync(() => {
      open();
      const hint = panel().querySelector<HTMLElement>('.c-hint');
      expect(hint?.textContent).toContain('Kéo ⠿');
      expect(hint?.textContent).toContain('↑ ↓');
    }));
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  describe('row summary', () => {
    beforeEach(() =>
      setup([
        { field: 'a', title: 'Mã đơn', width: '120px', fixed: true },
        { field: 'b', title: 'Khách hàng' },
        { field: 'c', title: 'Ghi chú', width: '20%' },
        { field: 'd', title: 'Điện thoại', width: '90px', invisible: true, fixed: true },
        { field: 'e', title: 'Nhân viên', width: '100px', cell: { truncate: { enable: true } } },
      ])
    );

    function meta(field: string): string {
      return item(field).querySelector('.c-width-meta')!.textContent!.trim();
    }

    it('summarizes the width: px, auto, verbatim, hidden', fakeAsync(() => {
      open();
      expect(meta('a')).toBe('120 px');
      expect(meta('b')).toBe('Tự động');
      expect(meta('c')).toBe('20%');
      expect(meta('d')).toBe('Đang ẩn');
      expect(meta('e')).toBe('100 px');
    }));

    it('names the fixed and truncated flags for screen readers', fakeAsync(() => {
      open();
      expect(item('a').querySelector('.c-pin')!.getAttribute('aria-label')).toBe('Cố định khi cuộn ngang');
      expect(item('e').querySelector('.c-trunc')!.getAttribute('aria-label')).toBe('Rút gọn nội dung dài');
    }));

    it('flags fixed and truncated visible columns', fakeAsync(() => {
      open();
      expect(item('a').querySelector('.c-pin')).not.toBeNull();
      expect(item('a').querySelector('.c-trunc')).toBeNull();
      expect(item('e').querySelector('.c-trunc')).not.toBeNull();
      expect(item('e').querySelector('.c-pin')).toBeNull();
      // Hidden: no flags, the summary says "hidden" instead.
      expect(item('d').querySelector('.c-pin')).toBeNull();
    }));

    it('dims the title of a hidden column', fakeAsync(() => {
      open();
      expect(item('d').classList).toContain('c-item--hidden');
      expect(item('a').classList).not.toContain('c-item--hidden');
    }));

    it('shows the current title, not the original, once renamed', fakeAsync(() => {
      open();
      toggle('b');
      type(item('b').querySelector('.c-field-title'), 'Tên khách');
      expect(item('b').querySelector('.c-title')!.textContent!.trim()).toBe('Tên khách');
    }));
  });

  // -------------------------------------------------------------------------
  // Details
  // -------------------------------------------------------------------------

  describe('details', () => {
    beforeEach(() => setup());

    it('opens a row through its toggle and links them with aria-expanded / aria-controls', fakeAsync(() => {
      open();
      const button = item('email').querySelector<HTMLButtonElement>('.c-toggle')!;
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.hasAttribute('aria-controls')).withContext('no target while collapsed').toBe(false);
      toggle('email');
      expect(button.getAttribute('aria-expanded')).toBe('true');
      const details = item('email').querySelector<HTMLElement>('.c-details')!;
      expect(details).not.toBeNull();
      expect(button.getAttribute('aria-controls')).toBe(details.id);
      expect(item('email').classList).toContain('c-item--open');
      toggle('email');
      expect(item('email').querySelector('.c-details')).toBeNull();
    }));

    it('keeps one row open at a time', fakeAsync(() => {
      open();
      toggle('name');
      toggle('dept');
      expect(item('name').querySelector('.c-details')).toBeNull();
      expect(item('dept').querySelector('.c-details')).not.toBeNull();
    }));

    it('edits with compact labelled inputs and two labelled switches', fakeAsync(() => {
      open();
      toggle('name');
      const details = item('name').querySelector<HTMLElement>('.c-details')!;
      const inputs = details.querySelectorAll('sd-input');
      expect(inputs.length).toBe(2);
      inputs.forEach(host => expect(host.querySelector('mat-form-field.sd-sm')).not.toBeNull());
      expect(details.querySelector('.c-field-title mat-label')?.textContent).toContain('Tiêu đề cột');
      expect(details.querySelector('.c-field-width mat-label')?.textContent).toContain('Rộng');
      expect(details.querySelector('sd-checkbox')).withContext('no checkbox left in the details').toBeNull();
      expect(details.querySelectorAll('sd-switch').length).toBe(2);
      expect(details.querySelector('.c-fixed label')?.textContent).toContain('Cố định khi cuộn ngang');
      expect(details.querySelector('.c-truncate label')?.textContent).toContain('Rút gọn nội dung dài');
    }));

    it('gives each switch row a description under its label', fakeAsync(() => {
      open();
      toggle('name');
      const rows = Array.from(item('name').querySelectorAll<HTMLElement>('.c-option'));
      expect(rows.length).toBe(2);
      expect(rows[0].querySelector('.c-option-hint')?.textContent).toContain('mép trái');
      expect(rows[1].querySelector('.c-option-hint')?.textContent).toContain('rê chuột');
    }));

    it('lines the switches up on the right and keeps the rows apart', fakeAsync(() => {
      open();
      toggle('name');
      const details = item('name').querySelector<HTMLElement>('.c-details')!;
      const list = details.querySelector<HTMLElement>('.c-options')!.getBoundingClientRect();
      const [fixed, truncate] = [switchOf(details.querySelector('.c-fixed')), switchOf(details.querySelector('.c-truncate'))].map(control =>
        control.getBoundingClientRect()
      );
      expect(Math.abs(fixed.right - truncate.right))
        .withContext('switches share one right edge')
        .toBeLessThanOrEqual(1);
      expect(list.right - fixed.right)
        .withContext('switch sits at the right of its row')
        .toBeLessThanOrEqual(20);
      const labels = Array.from(details.querySelectorAll<HTMLElement>('.c-option label')).map(label => label.getBoundingClientRect());
      expect(Math.abs(labels[0].left - labels[1].left))
        .withContext('labels share one left edge')
        .toBeLessThanOrEqual(1);
      expect(labels[0].right).withContext('label left of its switch').toBeLessThanOrEqual(fixed.left);
      const [first, second] = Array.from(details.querySelectorAll<HTMLElement>('.c-option')).map(row => row.getBoundingClientRect());
      expect(second.top)
        .withContext('rows do not overlap')
        .toBeGreaterThanOrEqual(first.bottom - 1);
    }));

    it('uses the original title as the title placeholder', fakeAsync(() => {
      open();
      toggle('name');
      expect(input(item('name').querySelector('.c-field-title')).placeholder).toBe('Họ và tên');
    }));

    it('offers to restore a renamed title and clears it on restore', fakeAsync(() => {
      open();
      toggle('name');
      expect(item('name').querySelector('.c-origin')).toBeNull();
      type(item('name').querySelector('.c-field-title'), 'Tên đầy đủ');
      const origin = item('name').querySelector<HTMLElement>('.c-origin')!;
      expect(origin.textContent).toContain('Gốc: Họ và tên');
      origin.querySelector<HTMLButtonElement>('.c-restore')!.click();
      render();
      expect(columnOf('name').title).toBeUndefined();
      expect(item('name').querySelector('.c-origin')).toBeNull();
      expect(input(item('name').querySelector('.c-field-title')).value).toBe('');
    }));

    it('toggles fixed and truncate from the details', fakeAsync(() => {
      open();
      toggle('email');
      clickSwitch(item('email').querySelector('.c-fixed'));
      clickSwitch(item('email').querySelector('.c-truncate'));
      expect(switchOf(item('email').querySelector('.c-fixed')).getAttribute('aria-checked')).toBe('true');
      expect(columnOf('email').fixed).toBe(true);
      expect(columnOf('email').truncate).toBe(true);
      expect(item('email').querySelector('.c-pin')).not.toBeNull();
      expect(item('email').querySelector('.c-trunc')).not.toBeNull();
    }));
  });

  // -------------------------------------------------------------------------
  // Hidden columns
  // -------------------------------------------------------------------------

  describe('hidden column', () => {
    beforeEach(() => setup());

    it('locks the details of a hidden column but keeps its Show checkbox usable', fakeAsync(() => {
      open();
      clickCheckbox(item('email').querySelector('.c-show')!);
      expect(columnOf('email').invisible).toBe(true);
      expect(item('email').classList).toContain('c-item--hidden');
      expect(component.isRowDisabled(columnOf('email'))).toBe(true);
      expect(component.isRowDisabled(columnOf('name'))).toBe(false);

      toggle('email');
      const details = item('email').querySelector<HTMLElement>('.c-details')!;
      details.querySelectorAll<HTMLInputElement>('sd-input input').forEach(el => expect(el.disabled).toBe(true));
      expect(details.querySelectorAll('button[role="switch"]').length).toBe(2);
      details.querySelectorAll<HTMLButtonElement>('button[role="switch"]').forEach(el => expect(el.disabled).toBe(true));
      expect(input(item('email').querySelector('.c-show')).disabled).toBe(false);

      clickCheckbox(item('email').querySelector('.c-show')!);
      expect(columnOf('email').invisible).toBe(false);
      details.querySelectorAll<HTMLInputElement>('sd-input input').forEach(el => expect(el.disabled).toBe(false));
    }));

    it('keeps every row enabled while all columns are visible', fakeAsync(() => {
      open();
      expect(items().length).toBe(3);
      items().forEach(el => expect(el.classList).not.toContain('c-item--hidden'));
    }));
  });

  // -------------------------------------------------------------------------
  // Width
  // -------------------------------------------------------------------------

  describe('width', () => {
    beforeEach(() =>
      setup([
        { field: 'name', title: 'Họ và tên', width: '180px', minWidth: '80px', maxWidth: '300px' },
        { field: 'note', title: 'Ghi chú', width: '20%' },
        { field: 'auto', title: 'Tự do' },
      ])
    );

    const widthField = (field: string) => item(field).querySelector('.c-field-width');

    it('edits a px width as a number with a px suffix', fakeAsync(() => {
      open();
      toggle('name');
      expect(input(widthField('name')).type).toBe('number');
      expect(input(widthField('name')).value).toBe('180');
      expect(widthField('name')!.querySelector('.c-px')?.textContent).toContain('px');
      type(widthField('name'), '150');
      expect(columnOf('name').width).toBe('150px');
    }));

    it('stores an empty width as undefined and falls back to the original width in the summary', fakeAsync(() => {
      open();
      toggle('name');
      type(widthField('name'), '');
      expect(columnOf('name').width).toBeUndefined();
      expect(input(widthField('name')).placeholder).toBe('180');
      expect(item('name').querySelector('.c-width-meta')!.textContent!.trim()).toBe('180 px');
    }));

    it('uses "auto" as the placeholder of a column without a width', fakeAsync(() => {
      open();
      toggle('auto');
      expect(input(widthField('auto')).placeholder).toBe('Tự động');
    }));

    it('shows a width that is not px verbatim, without the px suffix', fakeAsync(() => {
      open();
      toggle('note');
      expect(input(widthField('note')).type).toBe('text');
      expect(input(widthField('note')).value).toBe('20%');
      expect(widthField('note')!.querySelector('.c-px')).toBeNull();
      expect(columnOf('note').width).toBe('20%');
    }));

    it('switches a verbatim width to px once a number is typed', fakeAsync(() => {
      open();
      toggle('note');
      type(widthField('note'), '200');
      blur(widthField('note'));
      expect(columnOf('note').width).toBe('200px');
      expect(input(widthField('note')).type).toBe('number');
    }));

    it('clamps to the column minWidth / maxWidth on blur, not while typing', fakeAsync(() => {
      open();
      toggle('name');
      type(widthField('name'), '40');
      expect(columnOf('name').width).withContext('typing').toBe('40px');
      blur(widthField('name'));
      expect(columnOf('name').width).toBe('80px');
      type(widthField('name'), '900');
      blur(widthField('name'));
      expect(columnOf('name').width).toBe('300px');
    }));

    it('leaves widths nobody edited untouched on Apply', fakeAsync(() => {
      setup([
        { field: 'odd', title: 'Lẻ', width: '120.5px' },
        { field: 'narrow', title: 'Hẹp', width: '100px', minWidth: '150px' },
      ]);
      open();
      byAutoId('components-table-demo-config-apply')!.click();
      tick(300);
      fixture.detectChanges();
      open();
      expect(columnOf('odd').width).toBe('120.5px');
      expect(columnOf('narrow').width).toBe('100px');
    }));

    it('leaves the width alone when the field is left without an edit', fakeAsync(() => {
      setup([{ field: 'odd', title: 'Lẻ', width: '120.5px' }]);
      open();
      toggle('odd');
      blur(item('odd').querySelector('.c-field-width'));
      expect(columnOf('odd').width).toBe('120.5px');
    }));

    it('clamps on Apply too and saves the result', fakeAsync(() => {
      open();
      toggle('name');
      type(widthField('name'), '20');
      byAutoId('components-table-demo-config-apply')!.click();
      tick(300);
      fixture.detectChanges();
      open();
      expect(columnOf('name').width).toBe('80px');
    }));
  });

  // -------------------------------------------------------------------------
  // Find, count, show all
  // -------------------------------------------------------------------------

  describe('find box', () => {
    it('is not shown with eight columns or fewer', fakeAsync(() => {
      setup(WIDE_COLUMNS.slice(0, 8));
      open();
      expect(panel().querySelector('.c-find')).toBeNull();
    }));

    it('is shown with more than eight columns', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      const host = panel().querySelector('.c-find');
      expect(host).not.toBeNull();
      expect(input(host).placeholder).toBe('Tìm cột');
      expect(host!.querySelector('mat-form-field.sd-sm')).not.toBeNull();
    }));

    it('matches accent- and case-insensitively', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      find('NHAN VIEN');
      expect(rowFields()).toEqual(['staff']);
      find('tien');
      expect(rowFields()).toEqual(['total']);
    }));

    it('matches both the current and the original title', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      toggle('note');
      type(item('note').querySelector('.c-field-title'), 'Lưu ý');
      find('ghi chu');
      expect(rowFields()).toEqual(['note']);
      find('luu y');
      expect(rowFields()).toEqual(['note']);
    }));

    it('turns reordering off while searching and says why', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      expect(panel().querySelector('.c-list')!.classList).not.toContain('cdk-drop-list-disabled');
      find('ngay');
      expect(panel().querySelector('.c-list')!.classList).toContain('cdk-drop-list-disabled');
      items().forEach(el => expect(el.querySelector<HTMLButtonElement>('.c-handle')!.disabled).toBe(true));
      expect(panel().querySelector('.c-hint')!.textContent).toContain('Xoá ô tìm để đổi thứ tự.');
      find('');
      expect(panel().querySelector('.c-list')!.classList).not.toContain('cdk-drop-list-disabled');
      expect(panel().querySelector('.c-hint')!.textContent).toContain('Kéo ⠿');
    }));

    it('closes the open row when the search filters it out', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      toggle('note');
      find('ngay');
      find('');
      expect(item('note').querySelector('.c-details')).toBeNull();
    }));

    it('keeps the open row open while the search still matches it', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      toggle('note');
      find('ghi');
      expect(item('note').querySelector('.c-details')).not.toBeNull();
    }));
  });

  describe('shown count and show all', () => {
    beforeEach(() => setup());

    const count = () => panel().querySelector('.c-shown-count')!.textContent!.trim();
    const showAll = () => byAutoId('components-table-demo-config-show-all')!;

    it('counts the shown columns and shows every column at once', fakeAsync(() => {
      open();
      expect(count()).toBe('Hiện 3/3 cột');
      expect(showAll().disabled).toBe(true);

      clickCheckbox(item('name').querySelector('.c-show')!);
      clickCheckbox(item('dept').querySelector('.c-show')!);
      expect(count()).toBe('Hiện 1/3 cột');
      expect(showAll().disabled).toBe(false);

      showAll().click();
      render();
      expect(count()).toBe('Hiện 3/3 cột');
      expect(component.configuration()!.columns!.every(column => !column.invisible)).toBe(true);
      expect(showAll().disabled).toBe(true);
    }));
  });

  // -------------------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------------------

  describe('footer', () => {
    beforeEach(() => setup());

    it('keeps the footer autoIds and moves Restore defaults to the left', fakeAsync(() => {
      open();
      const left = modalRoot().querySelector('.sd-modal-footer-left')!;
      const right = modalRoot().querySelector('.sd-modal-footer-right')!;
      expect(left.contains(byAutoId('components-table-demo-config-reset'))).toBe(true);
      expect(right.contains(byAutoId('components-table-demo-config-skip'))).toBe(true);
      expect(right.contains(byAutoId('components-table-demo-config-apply'))).toBe(true);
      expect(byAutoId('components-table-demo-config-reset')!.textContent).toContain('Khôi phục mặc định');
    }));

    it('uses small default-shaped buttons: text reset, outline skip, filled apply', fakeAsync(() => {
      open();
      const reset = byAutoId('components-table-demo-config-reset')!;
      const skip = byAutoId('components-table-demo-config-skip')!;
      const apply = byAutoId('components-table-demo-config-apply')!;
      for (const button of [reset, skip, apply]) {
        expect(Math.round(button.getBoundingClientRect().height)).withContext(button.textContent!).toBe(32);
      }
      expect(reset.classList).toContain('c-text');
      expect(skip.classList).toContain('c-outline');
      expect(apply.classList).toContain('c-fill');
    }));

    it('saves the edits on Apply', fakeAsync(() => {
      open();
      clickCheckbox(item('email').querySelector('.c-show')!);
      byAutoId('components-table-demo-config-apply')!.click();
      tick(300);
      fixture.detectChanges();
      open();
      expect(columnOf('email').invisible).toBe(true);
    }));

    it('drops the edits on Skip', fakeAsync(() => {
      open();
      clickCheckbox(item('email').querySelector('.c-show')!);
      byAutoId('components-table-demo-config-skip')!.click();
      tick(300);
      fixture.detectChanges();
      open();
      expect(columnOf('email').invisible).toBeFalsy();
    }));
  });

  // -------------------------------------------------------------------------
  // Mouse reorder
  // -------------------------------------------------------------------------

  describe('mouse reorder', () => {
    const drop = (previousIndex: number, currentIndex: number) => {
      component.drop({ previousIndex, currentIndex } as Parameters<ConfigComponent['drop']>[0]);
      render();
    };

    it('moves the dropped row to its new index', fakeAsync(() => {
      setup();
      open();
      drop(0, 2);
      expect(rowFields()).toEqual(['email', 'dept', 'name']);
    }));

    it('ignores a drop while searching', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      find('ngay');
      drop(0, 1);
      find('');
      expect(rowFields().slice(0, 2)).toEqual(['code', 'customer']);
    }));

    it('closes the open row only when its own handle is pressed', fakeAsync(() => {
      setup();
      open();
      toggle('name');
      item('dept')
        .querySelector('.c-handle')!
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      render();
      expect(item('name').querySelector('.c-details')).withContext('another row keeps it open').not.toBeNull();
      item('name')
        .querySelector('.c-handle')!
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      render();
      expect(item('name').querySelector('.c-details')).toBeNull();
    }));
  });

  describe('toolbar', () => {
    it('wraps instead of overflowing a narrow modal', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      const toolbar = panel().querySelector<HTMLElement>('.c-toolbar')!;
      toolbar.style.width = '320px';
      expect(getComputedStyle(toolbar).flexWrap).toBe('wrap');
      expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth + 1);
    }));
  });

  // -------------------------------------------------------------------------
  // Keyboard reorder
  // -------------------------------------------------------------------------

  describe('keyboard reorder', () => {
    beforeEach(() => setup());

    const handle = (field: string) => item(field).querySelector<HTMLButtonElement>('.c-handle')!;
    const live = () => panel().querySelector<HTMLElement>('.c-live')!;

    /** Dispatches a keydown on the handle; returns whether it bubbled past the dialog content. */
    function press(field: string, key: string): { bubbled: boolean; prevented: boolean } {
      let bubbled = false;
      const listener = () => (bubbled = true);
      document.addEventListener('keydown', listener);
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      handle(field).dispatchEvent(event);
      document.removeEventListener('keydown', listener);
      render();
      return { bubbled, prevented: event.defaultPrevented };
    }

    it('announces through a live region inside the dialog', fakeAsync(() => {
      open();
      expect(live().getAttribute('aria-live')).toBe('assertive');
      expect(live().getAttribute('aria-atomic')).toBe('true');
      expect(live().textContent!.trim()).toBe('');
    }));

    it('points the handle at the drag hint', fakeAsync(() => {
      open();
      const hint = panel().querySelector('.c-hint')!;
      expect(handle('email').getAttribute('aria-describedby')).toBe(hint.id);
    }));

    it('picks a row up with Space and says where it is', fakeAsync(() => {
      open();
      handle('email').focus();
      const result = press('email', ' ');
      expect(result.prevented).toBe(true);
      expect(item('email').classList).toContain('c-item--picked');
      expect(live().textContent!.trim()).toBe('Đã nhấc Email, vị trí 2/3.');
    }));

    it('moves the picked row with the arrows and keeps focus on its handle', fakeAsync(() => {
      open();
      handle('email').focus();
      press('email', ' ');
      const result = press('email', 'ArrowDown');
      expect(result.prevented).toBe(true);
      expect(rowFields()).toEqual(['name', 'dept', 'email']);
      expect(document.activeElement).toBe(handle('email'));
      expect(live().textContent!.trim()).toBe('Email: vị trí 3/3.');

      press('email', 'ArrowUp');
      press('email', 'ArrowUp');
      expect(rowFields()).toEqual(['email', 'name', 'dept']);
      expect(document.activeElement).toBe(handle('email'));
      expect(live().textContent!.trim()).toBe('Email: vị trí 1/3.');
    }));

    it('does not move past either end', fakeAsync(() => {
      open();
      handle('name').focus();
      press('name', 'Enter');
      press('name', 'ArrowUp');
      expect(rowFields()).toEqual(['name', 'email', 'dept']);
      expect(item('name').classList).toContain('c-item--picked');
    }));

    it('drops with Enter or Space and announces the new position', fakeAsync(() => {
      open();
      handle('name').focus();
      press('name', 'Enter');
      press('name', 'ArrowDown');
      press('name', 'Enter');
      expect(item('name').classList).not.toContain('c-item--picked');
      expect(live().textContent!.trim()).toBe('Đã chuyển Họ và tên tới vị trí 2.');

      press('dept', ' ');
      press('dept', 'ArrowUp');
      press('dept', ' ');
      expect(rowFields()).toEqual(['email', 'dept', 'name']);
      expect(live().textContent!.trim()).toBe('Đã chuyển Phòng ban tới vị trí 2.');
    }));

    it('ignores the arrows until a row is picked', fakeAsync(() => {
      open();
      handle('name').focus();
      const result = press('name', 'ArrowDown');
      expect(result.prevented).toBe(false);
      expect(rowFields()).toEqual(['name', 'email', 'dept']);
    }));

    it('cancels with Escape, restores the order and keeps the dialog open', fakeAsync(() => {
      open();
      handle('name').focus();
      press('name', ' ');
      press('name', 'ArrowDown');
      press('name', 'ArrowDown');
      const result = press('name', 'Escape');
      tick(300);
      fixture.detectChanges();
      expect(result.bubbled).withContext('Escape must not reach the dialog').toBe(false);
      expect(rowFields()).toEqual(['name', 'email', 'dept']);
      expect(item('name').classList).not.toContain('c-item--picked');
      expect(document.activeElement).toBe(handle('name'));
      expect(live().textContent!.trim()).toBe('Đã huỷ đổi thứ tự.');
      expect(document.body.querySelector('.sd-table-config')).not.toBeNull();
    }));

    it('lets Escape through when no row is picked', fakeAsync(() => {
      open();
      handle('name').focus();
      const result = press('name', 'Escape');
      expect(result.bubbled).toBe(true);
      tick(300);
    }));

    it('drops the row where it is when focus leaves the handle', fakeAsync(() => {
      open();
      handle('name').focus();
      press('name', ' ');
      press('name', 'ArrowDown');
      handle('name').blur();
      render();
      expect(item('name').classList).not.toContain('c-item--picked');
      expect(rowFields()).toEqual(['email', 'name', 'dept']);
      expect(live().textContent!.trim()).toBe('Đã chuyển Họ và tên tới vị trí 2.');
    }));

    it('saves a keyboard reorder on Apply', fakeAsync(() => {
      open();
      handle('dept').focus();
      press('dept', ' ');
      press('dept', 'ArrowUp');
      press('dept', ' ');
      byAutoId('components-table-demo-config-apply')!.click();
      tick(300);
      fixture.detectChanges();
      open();
      expect(rowFields()).toEqual(['name', 'dept', 'email']);
    }));
  });

  // -------------------------------------------------------------------------
  // Tab order
  // -------------------------------------------------------------------------

  describe('tab order', () => {
    /** Focusable controls of the panel, in DOM (= Tab) order, named by their role in the dialog. */
    function tabStops(): string[] {
      const focusable = Array.from(
        panel().querySelectorAll<HTMLElement>('input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.closest('[aria-hidden="true"]') && el.tabIndex >= 0);
      return focusable.map(el => {
        if (el.closest('.c-find')) return 'find';
        if (el.closest('[data-autoid$="-config-show-all"]') || el.matches('[data-autoid$="-config-show-all"]')) return 'show-all';
        const field = el.closest<HTMLElement>('.c-item')?.dataset['field'];
        const part = el.classList.contains('c-handle')
          ? 'handle'
          : el.closest('.c-show')
            ? 'show'
            : el.classList.contains('c-toggle')
              ? 'toggle'
              : el.closest('.c-field-title')
                ? el.classList.contains('c-restore')
                  ? 'restore'
                  : 'title'
                : el.closest('.c-field-width')
                  ? 'width'
                  : el.closest('.c-fixed')
                    ? 'fixed'
                    : el.closest('.c-truncate')
                      ? 'truncate'
                      : el.className;
        return `${field}:${part}`;
      });
    }

    it('runs find → show all → handle, show, toggle per row → the open row details', fakeAsync(() => {
      setup(WIDE_COLUMNS);
      open();
      clickCheckbox(item('code').querySelector('.c-show')!);
      toggle('customer');
      type(item('customer').querySelector('.c-field-title'), 'Tên khách');
      const stops = tabStops();
      expect(stops.slice(0, 2)).toEqual(['find', 'show-all']);
      expect(stops.slice(2, 5)).toEqual(['code:handle', 'code:show', 'code:toggle']);
      expect(stops.slice(5, 13)).toEqual([
        'customer:handle',
        'customer:show',
        'customer:toggle',
        'customer:title',
        'customer:restore',
        'customer:width',
        'customer:fixed',
        'customer:truncate',
      ]);
      expect(stops[13]).toBe('phone:handle');
    }));
  });
});

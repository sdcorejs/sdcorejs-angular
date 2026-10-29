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

    it('edits with compact labelled inputs and two labelled checkboxes', fakeAsync(() => {
      open();
      toggle('name');
      const details = item('name').querySelector<HTMLElement>('.c-details')!;
      const inputs = details.querySelectorAll('sd-input');
      expect(inputs.length).toBe(2);
      inputs.forEach(host => expect(host.querySelector('mat-form-field.sd-sm')).not.toBeNull());
      expect(details.querySelector('.c-field-title mat-label')?.textContent).toContain('Tiêu đề cột');
      expect(details.querySelector('.c-field-width mat-label')?.textContent).toContain('Rộng');
      expect(details.querySelector('.c-fixed label')?.textContent).toContain('Cố định khi cuộn ngang');
      expect(details.querySelector('.c-truncate label')?.textContent).toContain('Rút gọn nội dung dài');
      expect(details.querySelector('.c-check-hint')?.textContent).toContain('rê chuột');
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
      clickCheckbox(item('email').querySelector('.c-fixed')!);
      clickCheckbox(item('email').querySelector('.c-truncate')!);
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
      details.querySelectorAll<HTMLInputElement>('sd-checkbox input').forEach(el => expect(el.disabled).toBe(true));
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
});

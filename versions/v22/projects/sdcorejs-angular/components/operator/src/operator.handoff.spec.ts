import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Operator } from '@sdcorejs/utils/models';
import { SdOperator } from './operator.component';

// Design handoff sd-operator (wave 2 · G addendum), step 2: size, readonly, active, showCode, trigger name, one-line menu
// with families (A1, A3, B1, B2, B4, B5, C7, D1). Menu has no tick (decision 19), but rows are menuitemradio.
describe('SdOperator · design handoff', () => {
  let fixture: ComponentFixture<SdOperator>;
  let component: SdOperator;
  let overlay: HTMLElement;
  let i18n: I18nService;

  const el = (): HTMLElement => fixture.nativeElement;
  const trigger = () => el().querySelector<HTMLButtonElement>('button.c-op-trigger');
  const rows = () => Array.from(overlay.querySelectorAll<HTMLElement>('.c-op-menu .c-op-row'));
  const set = (inputs: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };
  const openMenu = async () => {
    trigger()!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const label = (operator: Operator) => i18n.t(`core.operator.${operator.toLowerCase().replace(/_/g, '-')}.display`);

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [SdOperator, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdOperator);
    component = fixture.componentInstance;
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    i18n = TestBed.inject(I18nService);
    // why: ghim host ở đỉnh để menu luôn mở xuống, trong khung (xem karma-overlay-position-specs).
    Object.assign(el().style, { position: 'fixed', top: '0', left: '0' });
    set({ operators: ['EQUAL', 'GREATER_THAN', 'LESS_THAN'], model: 'GREATER_THAN' });
  });

  afterEach(() => overlay.querySelectorAll('.cdk-overlay-pane').forEach(pane => pane.remove()));

  describe('trigger (A1, C7)', () => {
    it('is named after the current operator, and asks to choose one without a model', () => {
      expect(trigger()!.getAttribute('aria-label')).toBe(i18n.t('core.component.operator.current', { operator: label('GREATER_THAN') }));
      set({ model: undefined });
      expect(trigger()!.getAttribute('aria-label')).toBe(i18n.t('core.component.operator.choose'));
    });

    it('hides every glyph from assistive tech', async () => {
      await openMenu();
      const svgs = [...Array.from(el().querySelectorAll('svg')), ...Array.from(overlay.querySelectorAll('.c-op-menu svg'))];
      expect(svgs.length).toBeGreaterThan(1);
      for (const svg of svgs) {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.getAttribute('focusable')).toBe('false');
      }
    });

    for (const [size, glyph, stroke, arrow] of [
      ['xs', '14', '2.5', false],
      ['sm', '16', '2.25', true],
      ['md', '18', '2.1', true],
    ] as const) {
      it(`${size}: ${glyph}px glyph with stroke ${stroke}, ${arrow ? 'with' : 'without'} an arrow`, () => {
        set({ size });
        const svg = trigger()!.querySelector('svg')!;
        expect(svg.getAttribute('width')).toBe(glyph);
        expect(svg.getAttribute('stroke-width')).toBe(stroke);
        expect(!!trigger()!.querySelector('.sd-operator-chip__arrow')).toBe(arrow);
      });
    }

    it('defaults to md: a 28px chip', () => {
      expect(trigger()!.getBoundingClientRect().height).toBe(28);
    });

    it('xs keeps a 24px hit area without taking more than the glyph in the layout', () => {
      set({ size: 'xs' });
      const box = trigger()!.getBoundingClientRect();
      expect(box.width).toBe(24);
      expect(box.height).toBe(24);
      expect(el().getBoundingClientRect().height).toBeLessThanOrEqual(14);
    });

    it('is grey by default and tinted primary only when active', () => {
      expect(trigger()!.classList).not.toContain('sd-operator-chip__trigger--value');
      set({ active: true });
      expect(trigger()!.classList).toContain('sd-operator-chip__trigger--value');
    });

    it('keeps the data-autoId hook on the trigger', () => {
      set({ autoId: 'price-op' });
      expect(trigger()!.getAttribute('data-autoId')).toBe('price-op');
    });
  });

  // Handoff sd-operator B6: shorter Vietnamese labels.
  it('uses the Vietnamese labels of the handoff', () => {
    const expected: [Operator, string][] = [
      ['NOT_EQUAL', 'Khác'],
      ['GREATER_OR_EQUAL', 'Lớn hơn hoặc bằng'],
      ['LESS_OR_EQUAL', 'Nhỏ hơn hoặc bằng'],
      ['START_WITH', 'Bắt đầu bằng'],
      ['NOT_START_WITH', 'Không bắt đầu bằng'],
      ['END_WITH', 'Kết thúc bằng'],
      ['NOT_END_WITH', 'Không kết thúc bằng'],
      ['NULL', 'Trống'],
      ['NOT_NULL', 'Không trống'],
    ];
    i18n.setLanguage('vi', { reload: false });
    expect(expected.map(([operator]) => [operator, label(operator)])).toEqual(expected);
  });

  describe('readonly (A2)', () => {
    it('renders a glyph with a name and a tooltip, without a button or a menu', async () => {
      set({ readonly: true });
      expect(trigger()).toBeNull();
      expect(el().querySelector('button')).toBeNull();
      const glyph = el().querySelector<HTMLElement>('.sd-operator__glyph[role="img"]')!;
      expect(glyph).withContext('role="img" glyph').not.toBeNull();
      expect(glyph.getAttribute('aria-label')).toBe(label('GREATER_THAN'));
      expect(glyph.hasAttribute('tabindex')).toBeFalse();
      glyph.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(overlay.querySelector('.c-op-menu')).toBeNull();
    });

    it('loses to disabled', () => {
      set({ readonly: true, disabled: true });
      expect(trigger()).not.toBeNull();
      expect(trigger()!.disabled).toBeTrue();
      expect(el().querySelector('.sd-operator__glyph')).toBeNull();
    });
  });

  describe('menu (A3, B1, B2)', () => {
    it('draws one 36px line per row, without the operator code by default', async () => {
      await openMenu();
      for (const row of rows()) expect(row.getBoundingClientRect().height).toBe(36);
      expect(overlay.querySelector('.c-op-code')).toBeNull();
      expect(rows()[1].textContent?.trim()).toBe(label('GREATER_THAN'));
    });

    it('shows the code on the same line with showCode', async () => {
      set({ showCode: true });
      await openMenu();
      const row = rows()[1];
      const code = row.querySelector<HTMLElement>('.c-op-code')!;
      expect(code.textContent?.trim()).toBe('GREATER_THAN');
      expect(row.getBoundingClientRect().height).toBe(36);
      const name = row.querySelector<HTMLElement>('.c-op-label')!.getBoundingClientRect();
      expect(Math.abs(code.getBoundingClientRect().top + code.getBoundingClientRect().height / 2 - (name.top + name.height / 2)))
        .withContext('same line')
        .toBeLessThan(2);
    });

    it('marks the rows as menuitemradio with exactly one checked', async () => {
      await openMenu();
      expect(rows().map(row => row.getAttribute('role'))).toEqual(['menuitemradio', 'menuitemradio', 'menuitemradio']);
      expect(rows().map(row => row.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
      expect(overlay.querySelector('.c-op-check')).withContext('no tick (decision 19)').toBeNull();
    });

    it('keeps the order of the operators input', async () => {
      set({ operators: ['NULL', 'CONTAIN', 'EQUAL', 'BETWEEN'] });
      await openMenu();
      expect(rows().map(row => row.textContent?.trim())).toEqual([label('NULL'), label('CONTAIN'), label('EQUAL'), label('BETWEEN')]);
    });

    it('separates the families once the list has more than four operators', async () => {
      set({ operators: ['EQUAL', 'NOT_EQUAL', 'CONTAIN', 'NOT_CONTAIN', 'IN', 'NULL'] });
      await openMenu();
      const items = Array.from(overlay.querySelectorAll<HTMLElement>('.c-op-menu .c-op-row, .c-op-menu [role="separator"]'));
      expect(items.map(item => (item.getAttribute('role') === 'separator' ? '|' : item.textContent?.trim()))).toEqual([
        label('EQUAL'),
        label('NOT_EQUAL'),
        '|',
        label('CONTAIN'),
        label('NOT_CONTAIN'),
        '|',
        label('IN'),
        '|',
        label('NULL'),
      ]);
    });

    it('does not separate a list of four', async () => {
      set({ operators: ['EQUAL', 'CONTAIN', 'IN', 'NULL'] });
      await openMenu();
      expect(overlay.querySelector('.c-op-menu [role="separator"]')).toBeNull();
    });

    it('gives focus back to the trigger after a pick', async () => {
      await openMenu();
      rows()[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.model()).toBe('EQUAL');
      expect(document.activeElement).toBe(trigger());
    });
  });
});

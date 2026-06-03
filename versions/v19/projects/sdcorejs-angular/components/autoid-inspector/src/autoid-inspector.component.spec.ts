import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { SdAutoidInspector } from './autoid-inspector.component';

@Component({
  standalone: true,
  imports: [SdAutoidInspector],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div id="harness-root">
      <sd-input><input data-autoid="forms-input-email" placeholder="Email"
                       data-disabled="false" data-empty="true"/></sd-input>
      <sd-input><input placeholder="No autoid"/></sd-input>
      <sd-button><button data-autoid="button-submit">Submit</button></sd-button>
      <sd-button><button data-autoid="button-submit">Dup</button></sd-button>
      <sd-table data-autoid="components-table-employees">
        <input data-autoid="table-input-search" data-invalid="false"/>
      </sd-table>
    </div>
    <sd-autoid-inspector [enabled]="enabled" [config]="cfg"></sd-autoid-inspector>
  `,
})
class HostComponent {
  enabled = true;
  cfg = { root: undefined as HTMLElement | undefined };
}

describe('SdAutoidInspector', () => {
  let fixture: ComponentFixture<HostComponent>;
  let inspector: SdAutoidInspector;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    // Trỏ root scan vào harness để tránh quét toàn body (test khác).
    fixture.componentInstance.cfg = { root: document.querySelector('#harness-root') as HTMLElement };
    await settle();

    inspector = fixture.debugElement.query(By.directive(SdAutoidInspector))
      .componentInstance as SdAutoidInspector;
  });

  afterEach(() => {
    // closePanel KHÔNG còn clear highlight — phải destroy fixture để ngOnDestroy chạy.
    inspector?.closePanel();
    fixture?.destroy();
    // Guard cleanup phòng leak marker khi test fail trước ngOnDestroy.
    document.querySelectorAll('[data-sd-autoid-highlight]').forEach(n => {
      (n as HTMLElement).removeAttribute('data-sd-autoid-highlight');
      (n as HTMLElement).style.outline = '';
      (n as HTMLElement).style.backgroundColor = '';
    });
  });

  it('mount với FAB hiển thị khi enabled=true', () => {
    const fab = fixture.nativeElement.querySelector('.sd-autoid-inspector__fab');
    expect(fab).toBeTruthy();
  });

  it('ẩn FAB khi enabled=false', async () => {
    fixture.componentInstance.enabled = false;
    await settle();
    expect(fixture.nativeElement.querySelector('.sd-autoid-inspector__fab')).toBeNull();
  });

  it('togglePanel mở panel + scan elements', async () => {
    inspector.togglePanel();
    await settle();
    expect(inspector.open()).toBe(true);
    // 5 autoid elements (forms-input-email, button-submit×2, components-table-employees,
    // table-input-search) + 1 fallback cho sd-input thiếu autoid = 6
    expect(inspector.elements().length).toBe(6);
    expect(inspector.elements().filter(e => e.missingAutoid).length).toBe(1);
    expect(fixture.nativeElement.querySelector('.sd-autoid-inspector__panel')).toBeTruthy();
  });

  it('audit báo duplicate cho button-submit', async () => {
    inspector.openPanel();
    await settle();
    const a = inspector.audit();
    expect(a).not.toBeNull();
    expect(a!.duplicateCount).toBe(1);
    expect(a!.duplicates['button-submit']).toBe(2);
  });

  it('audit báo missing cho sd-input thứ 2', async () => {
    inspector.openPanel();
    await settle();
    expect(inspector.audit()!.missingCount).toBe(1);
  });

  it('togglePanel lần 2 đóng panel NHƯNG vẫn giữ highlight (clear chỉ qua toggleHighlight)', async () => {
    inspector.togglePanel();
    await settle();
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBeGreaterThan(0);
    inspector.togglePanel();
    await settle();
    expect(inspector.open()).toBe(false);
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBeGreaterThan(0);
  });

  it('toggleHighlight ON→OFF clear DOM, OFF→ON re-apply', async () => {
    inspector.openPanel();
    await settle();
    expect(inspector.highlightOn()).toBe(true);
    inspector.toggleHighlight();
    expect(inspector.highlightOn()).toBe(false);
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBe(0);
    inspector.toggleHighlight();
    expect(inspector.highlightOn()).toBe(true);
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBeGreaterThan(0);
  });

  it('openPanel khi highlightOn=false KHÔNG apply highlight', async () => {
    inspector.highlightOn.set(false);
    inspector.openPanel();
    await settle();
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBe(0);
  });

  it('Esc đóng panel', async () => {
    inspector.openPanel();
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle();
    expect(inspector.open()).toBe(false);
  });

  it('setSegment switch active segment', () => {
    inspector.setSegment('export');
    expect(inspector.segment()).toBe('export');
  });

  it('filter computed lọc theo autoid / name / tag', async () => {
    inspector.openPanel();
    await settle();
    inspector.filter.set('button');
    expect(inspector.filteredElements().every(e => e.autoid.includes('button') || e.tag.includes('button'))).toBe(true);
  });

  it('copyJson gọi export.copyToClipboard với JSON', async () => {
    const exportSvc = (inspector as any)['#export'] ?? null;
    // Spy clipboard navigator API.
    let captured = '';
    spyOn(navigator.clipboard, 'writeText').and.callFake((text: string) => {
      captured = text;
      return Promise.resolve();
    });
    inspector.openPanel();
    await settle();
    await inspector.copyJson();
    // JSON export giờ bọc { meta, elements } để mang theo url/route.
    const parsed = JSON.parse(captured);
    expect(Array.isArray(parsed)).toBe(false);
    expect(parsed.meta).toBeDefined();
    expect(typeof parsed.meta.url).toBe('string');
    expect(captured).toContain('forms-input-email');
    expect(exportSvc).toBeNull(); // private symbol không lộ ra
  });

  it('dismissFab ẩn FAB + đóng panel; reset signal hiện lại', async () => {
    inspector.openPanel();
    await settle();
    inspector.dismissFab(new MouseEvent('click'));
    await settle();
    expect(inspector.dismissed()).toBe(true);
    expect(inspector.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-autoid-inspector__fab')).toBeNull();
    // Mô phỏng "reload trang": reset signal.
    inspector.dismissed.set(false);
    await settle();
    expect(fixture.nativeElement.querySelector('.sd-autoid-inspector__fab')).toBeTruthy();
  });

  it('openPanel khi disabled=false → no-op', async () => {
    fixture.componentInstance.enabled = false;
    await settle();
    inspector.openPanel();
    expect(inspector.open()).toBe(false);
  });

  it('ngOnDestroy clear highlight', async () => {
    inspector.openPanel();
    await settle();
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBeGreaterThan(0);
    fixture.destroy();
    expect(document.querySelectorAll('[data-sd-autoid-highlight]').length).toBe(0);
  });

  describe('topLevelElements / tableGroups computeds', () => {
    it('topLevelElements excludes elements with tableScope', async () => {
      inspector.openPanel();
      await settle();
      const topLevel = inspector.topLevelElements();
      // table-input-search has tableScope → must not appear in topLevelElements
      expect(topLevel.some(e => e.autoid === 'table-input-search')).toBe(false);
      // forms-input-email, button-submit×2, components-table-employees → 4 top-level
      expect(topLevel.every(e => !e.tableScope)).toBe(true);
    });

    it('tableGroups groups elements under their table scope', async () => {
      inspector.openPanel();
      await settle();
      const groups = inspector.tableGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].scope).toBe('components-table-employees');
      expect(groups[0].items.length).toBe(1);
      expect(groups[0].items[0].autoid).toBe('table-input-search');
    });

    it('state column renders chips for each defined state key', async () => {
      inspector.openPanel();
      await settle();
      inspector.setSegment('elements');
      fixture.detectChanges();
      // forms-input-email has data-disabled + data-empty on the DOM
      const chips = fixture.nativeElement.querySelectorAll('.sd-autoid-inspector__state-chip');
      expect(chips.length).toBeGreaterThan(0);
      const chipTexts = Array.from(chips).map((c: any) => c.textContent.trim());
      expect(chipTexts.some((t: string) => t.includes('disabled='))).toBe(true);
      expect(chipTexts.some((t: string) => t.includes('empty='))).toBe(true);
    });

    it('renders validation meta chips when state contains those fields', async () => {
      // Inject an element with all 5 new attrs into the harness root.
      const harness = document.querySelector('#harness-root') as HTMLElement;
      const el = document.createElement('input');
      el.setAttribute('data-autoid', 'forms-input-validation-test');
      el.setAttribute('data-required', 'true');
      el.setAttribute('data-maxlength', '100');
      el.setAttribute('data-minlength', '5');
      el.setAttribute('data-pattern', 'VN_PHONE');
      el.setAttribute('data-error-message', 'Lỗi bắt buộc');
      harness.appendChild(el);

      inspector.openPanel();
      await settle();
      inspector.setSegment('elements');
      fixture.detectChanges();

      const allChips = fixture.nativeElement.querySelectorAll('.sd-autoid-inspector__state-chip');
      const texts = Array.from(allChips).map((c: any) => c.textContent.trim());

      expect(texts.some((t: string) => t.includes('required='))).toBe(true);
      expect(texts.some((t: string) => t.includes('maxlength='))).toBe(true);
      expect(texts.some((t: string) => t.includes('minlength='))).toBe(true);
      expect(texts.some((t: string) => t.includes('pattern='))).toBe(true);
      expect(texts.some((t: string) => t.includes('error:'))).toBe(true);

      // Cleanup
      harness.removeChild(el);
    });
  });

  describe('E2E attributes', () => {
    it('renders data-opened on the FAB reflecting open() signal', async () => {
      const fab = fixture.nativeElement.querySelector('[data-autoid="sd-autoid-inspector-fab"]');
      expect(fab).toBeTruthy();
      expect(fab.getAttribute('data-opened')).toBe('false');

      inspector.openPanel();
      await settle();
      expect(fab.getAttribute('data-opened')).toBe('true');

      inspector.closePanel();
      await settle();
      expect(fab.getAttribute('data-opened')).toBe('false');
    });

    it('renders data-segment / data-highlight-on / data-*-count on the panel', async () => {
      inspector.openPanel();
      await settle();

      const panel = fixture.nativeElement.querySelector('[data-autoid="sd-autoid-inspector-panel"]');
      expect(panel).toBeTruthy();
      expect(panel.getAttribute('data-segment')).toBe('audit');
      expect(panel.getAttribute('data-highlight-on')).toBe('true');
      // 5 elements with data-autoid (forms-input-email, button-submit×2,
      // components-table-employees, table-input-search) + 1 fallback (sd-input thiếu autoid) = 6
      expect(panel.getAttribute('data-element-count')).toBe('6');
      // harness has 1 missing (sd-input without autoid) → missingCount = 1
      expect(panel.getAttribute('data-missing-count')).toBe('1');
      // harness has 1 duplicate (button-submit appears twice) → duplicateCount = 1
      expect(panel.getAttribute('data-duplicate-count')).toBe('1');

      inspector.setSegment('elements');
      await settle();
      expect(panel.getAttribute('data-segment')).toBe('elements');

      inspector.toggleHighlight();
      await settle();
      expect(panel.getAttribute('data-highlight-on')).toBe('false');
    });
  });
});

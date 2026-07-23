import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdAuditDiff, SdAuditDiffValueTemplateDirective } from './audit-diff.component';
import { SdAuditDiffOptions } from './audit-diff.engine';

@Component({
  standalone: true,
  imports: [SdAuditDiff, SdAuditDiffValueTemplateDirective],
  template: `
    <sd-audit-diff [before]="before()" [after]="after()" [options]="options()" [mode]="mode()">
      @if (customTemplate()) {
        <ng-template sdAuditDiffValue let-value let-row="row" let-side="side">
          <mark [attr.data-custom-side]="side">{{ row.path }}={{ value }}</mark>
        </ng-template>
      }
    </sd-audit-diff>
  `,
})
class HostComponent {
  readonly before = signal<unknown>({ name: 'Ada', status: 'draft' });
  readonly after = signal<unknown>({ name: 'Grace', status: 'active' });
  readonly options = signal<SdAuditDiffOptions>({
    fields: [{ path: 'status', enumMap: { draft: 'Draft', active: 'Active' }, order: 1 }],
  });
  readonly mode = signal<'table' | 'detail-list'>('table');
  readonly customTemplate = signal(false);
}

describe('SdAuditDiff', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: (key: string): string =>
              ({
                'core.component.audit-diff.label': 'Audit changes',
                'core.component.audit-diff.field': 'Field',
                'core.component.audit-diff.before': 'Before',
                'core.component.audit-diff.after': 'After',
                'core.component.audit-diff.empty': 'No changes',
                'core.component.audit-diff.value.label': 'Localized value',
              })[key] ??
              key.split('.').at(-1) ??
              key,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders semantic table headers, row headers and before/after cells', () => {
    const element = fixture.nativeElement as HTMLElement;
    const table = element.querySelector('table');
    const headers = [...element.querySelectorAll('thead th')].map(node => node.textContent?.trim());
    const row = element.querySelector('tbody tr[data-change-kind="changed"]');

    expect(table).not.toBeNull();
    expect(headers).toEqual(['Field', 'Before', 'After']);
    expect(row?.querySelector('th')?.getAttribute('scope')).toBe('row');
    expect(row?.querySelector('[data-audit-before]')?.textContent).toContain('Draft');
    expect(row?.querySelector('[data-audit-after]')?.textContent).toContain('Active');
  });

  it('renders a semantic detail list with explicit before and after labels', () => {
    host.mode.set('detail-list');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('dl')).not.toBeNull();
    expect(element.querySelector('dt')?.textContent).toBeTruthy();
    expect(element.querySelector('[data-audit-before]')?.textContent).toContain('Before');
    expect(element.querySelector('[data-audit-after]')?.textContent).toContain('After');
  });

  it('renders a polite empty state when there are no rows', () => {
    host.after.set({ name: 'Ada', status: 'draft' });
    fixture.detectChanges();

    const empty = (fixture.nativeElement as HTMLElement).querySelector('[data-audit-empty]');
    expect(empty?.getAttribute('role')).toBe('status');
    expect(empty?.textContent?.trim()).toBe('No changes');
  });

  it('projects a typed custom value template for both sides', () => {
    host.customTemplate.set(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[data-custom-side="before"]')).toHaveSize(2);
    expect(element.querySelectorAll('[data-custom-side="after"]')).toHaveSize(2);
    expect(element.textContent).toContain('status=Draft');
    expect(element.textContent).toContain('status=Active');
  });

  it('never renders hidden or raw redacted values', () => {
    host.before.set({ password: 'old-secret', token: 'old-token' });
    host.after.set({ password: 'new-secret', token: 'new-token' });
    host.options.set({
      redactedValue: '[redacted]',
      fields: [
        { path: 'password', hidden: true },
        { path: 'token', redacted: true },
      ],
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('[redacted]');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('old-token');
    expect(text).not.toContain('new-token');
  });

  it('updates rows reactively when before and after inputs change', () => {
    host.before.set({ count: 1 });
    host.after.set({ count: 2, added: true });
    host.options.set({});
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-audit-row]');
    expect(rows).toHaveSize(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('count');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('added');
  });

  it('uses the localized root label for scalar values', () => {
    host.before.set(1);
    host.after.set(2);
    host.options.set({});
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('tbody th')?.textContent).toContain('Localized value');
  });
});

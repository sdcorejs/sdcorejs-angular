import { TestBed } from '@angular/core/testing';
import { AuditDiffDemoComponent } from './audit-diff-demo.component';

describe('AuditDiffDemoComponent', () => {
  it('renders nested, stable-array, secure and projected examples without leaking protected values', async () => {
    await TestBed.configureTestingModule({ imports: [AuditDiffDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AuditDiffDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelectorAll('sd-audit-diff')).toHaveSize(4);
    expect(element.querySelector('table')).not.toBeNull();
    expect(element.querySelector('dl')).not.toBeNull();
    expect(element.querySelector('[data-custom-side="before"]')).not.toBeNull();
    expect(text).toContain('••••••');
    expect(text).not.toContain('raw-old-token');
    expect(text).not.toContain('raw-new-token');
    expect(text).not.toContain('secret');
  });
});

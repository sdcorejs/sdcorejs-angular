import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownRendererComponent } from './markdown-renderer.component';

describe('MarkdownRendererComponent', () => {
  let fixture: ComponentFixture<MarkdownRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarkdownRendererComponent] }).compileComponents();
    fixture = TestBed.createComponent(MarkdownRendererComponent);
  });

  it('renders responsive semantic tables and fenced code', () => {
    fixture.componentRef.setInput('markdown', '| Name | Type |\n| --- | --- |\n| value | string |\n\n```ts\nconst ok = true;\n```');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('th')?.textContent).toContain('Name');
    expect(fixture.nativeElement.querySelector('code')?.textContent).toContain('const ok = true');
  });

  it('sanitizes raw script markup instead of executing arbitrary HTML', () => {
    fixture.componentRef.setInput('markdown', '<script>window.hacked = true</script>Safe content');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Safe content');
  });

  it('renders safe Markdown links and leaves unsafe schemes as plain text', () => {
    fixture.componentRef.setInput(
      'markdown',
      '[Guide](https://example.test/docs) and [unsafe](javascript:alert(1))',
    );
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.test/docs');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noreferrer');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveSize(1);
    expect(fixture.nativeElement.textContent).toContain('[unsafe](javascript:alert(1))');
  });

  it('renders safe fragment links with the same accent-folded IDs as Markdown headings', () => {
    fixture.componentRef.setInput('markdown', '[Cài đặt](#1-cài-đặt-vào-angular)\n\n### 1. Cài đặt vào Angular');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('#1-cai-dat-vao-angular');
    expect(fixture.nativeElement.querySelector('h3')?.id).toBe('1-cai-dat-vao-angular');
    expect(link.target).toBe('');
  });

  it('resolves safe relative published-doc links against the deployed document URL', () => {
    fixture.componentRef.setInput('linkBaseUrl', 'https://example.test/app/docs/21.1.2/modules/permission/sd-permission.md');
    fixture.componentRef.setInput('markdown', '[Auth module](../auth/sd-auth.md)');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.test/app/docs/21.1.2/modules/auth/sd-auth.md');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noreferrer');
  });
});

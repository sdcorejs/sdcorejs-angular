import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbDemoComponent } from './breadcrumb-demo.component';

describe('BreadcrumbDemoComponent', () => {
  it('renders static, router-generated and async examples and resolves the async label', async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbDemoComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BreadcrumbDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(3);
    expect(element.textContent).toContain('Danh sách tĩnh');
    expect(element.textContent).toContain('Router-generated');
    expect(element.textContent).toContain('Đang tải nhãn');

    (element.querySelector('[data-resolve-label]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Đơn hàng #42');
  });
});

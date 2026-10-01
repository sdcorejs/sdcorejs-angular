import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormGenericDemoComponent } from './form-generic-demo.component';

// why: trang docs bọc lazy-load trong try/catch và chỉ hiện "The live example could not be loaded",
// nên lỗi gốc không bao giờ tới được người dùng. Dựng thẳng demo ở đây để lỗi nổ ra kèm stack.
describe('FormGenericDemoComponent (live example)', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [FormGenericDemoComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const create = async () => {
    const fixture = TestBed.createComponent(FormGenericDemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('creates and renders the builder with the sample schema and the runtime renderer', async () => {
    const consoleError = spyOn(console, 'error').and.callThrough();
    const fixture = await create();
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(root.querySelector('sd-form-builder')).not.toBeNull();
    expect(root.querySelectorAll('sd-form-builder [data-fb-item]').length).toBeGreaterThan(5);
    expect(root.querySelector('sd-form-builder [data-fb-item="c-agree"] .fb-newrow')).withContext('newRow marker').not.toBeNull();
    expect(root.querySelector('sd-form-render .sd-fg-grid')).not.toBeNull();
    expect(['desktop', 'tablet', 'mobile']).toContain(fixture.componentInstance.render()!.level());
    expect(consoleError).withContext('the live example logs no console error (AC-019)').not.toHaveBeenCalled();
  });

  it('validates the sample through the renderer: required fields keep it invalid', async () => {
    const fixture = await create();
    await fixture.componentInstance.check();
    expect(fixture.componentInstance.result()).toContain('Chưa hợp lệ');
  });

  it('loads an empty schema and resets the change counter', async () => {
    const fixture = await create();
    fixture.componentInstance.load(fixture.componentInstance.emptyForm());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('sd-form-builder [data-fb-item]').length).toBe(0);
    expect(fixture.componentInstance.changes()).toBe(0);
  });
});

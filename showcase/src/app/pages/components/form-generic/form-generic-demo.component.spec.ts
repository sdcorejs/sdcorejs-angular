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

  it('creates and renders', () => {
    const fixture = TestBed.createComponent(FormGenericDemoComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});

import { Type } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { ButtonAsyncExampleComponent } from './button-async.example';
import { ButtonColorsExampleComponent } from './button-colors.example';
import { ButtonCrudEntityExampleComponent } from './button-crud-entity.example';
import { ButtonCrudExampleComponent } from './button-crud.example';
import { ButtonDangerExampleComponent } from './button-danger.example';
import { ButtonGroupedExampleComponent } from './button-grouped.example';
import { ButtonIconOnlyExampleComponent } from './button-icon-only.example';
import { ButtonIconSetExampleComponent } from './button-icon-set.example';
import { ButtonIndicatorExampleComponent } from './button-indicator.example';
import { ButtonQueryExampleComponent } from './button-query.example';
import { ButtonSecondaryBlackExampleComponent } from './button-secondary-black.example';
import { ButtonSizesExampleComponent } from './button-sizes.example';
import { ButtonStatesExampleComponent } from './button-states.example';
import { ButtonVariantsExampleComponent } from './button-variants.example';
import { ButtonWorkflowExampleComponent } from './button-workflow.example';

const EXAMPLES: readonly { readonly name: string; readonly component: Type<unknown> }[] = [
  { name: 'colors', component: ButtonColorsExampleComponent },
  { name: 'icon only', component: ButtonIconOnlyExampleComponent },
  { name: 'icon set', component: ButtonIconSetExampleComponent },
  { name: 'indicator', component: ButtonIndicatorExampleComponent },
  { name: 'secondary and black', component: ButtonSecondaryBlackExampleComponent },
  { name: 'sizes', component: ButtonSizesExampleComponent },
  { name: 'states', component: ButtonStatesExampleComponent },
  { name: 'variants', component: ButtonVariantsExampleComponent },
  { name: 'CRUD', component: ButtonCrudExampleComponent },
  { name: 'CRUD by entity', component: ButtonCrudEntityExampleComponent },
  { name: 'search / filter', component: ButtonQueryExampleComponent },
  { name: 'workflow', component: ButtonWorkflowExampleComponent },
  { name: 'danger', component: ButtonDangerExampleComponent },
  { name: 'grouped', component: ButtonGroupedExampleComponent },
  { name: 'async', component: ButtonAsyncExampleComponent },
];

describe('Button example spacing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: EXAMPLES.map(example => example.component),
      providers: [provideRouter([])],
    }).compileComponents();
  });

  for (const example of EXAMPLES) {
    it(`keeps the ${example.name} controls separated when they wrap`, () => {
      const fixture: ComponentFixture<unknown> = TestBed.createComponent(example.component);
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();

      const style = getComputedStyle(fixture.nativeElement);
      expect(style.display).toBe('flex');
      expect(style.flexWrap).toBe('wrap');
      expect(style.rowGap).toBe('12px');
      expect(style.columnGap).toBe('12px');

      fixture.nativeElement.remove();
      fixture.destroy();
    });
  }
});

describe('Button pattern examples', () => {
  let confirm: jasmine.Spy;

  beforeEach(async () => {
    confirm = jasmine.createSpy('confirm');
    await TestBed.configureTestingModule({
      imports: [ButtonCrudExampleComponent, ButtonDangerExampleComponent, ButtonAsyncExampleComponent],
      providers: [provideRouter([]), { provide: SdConfirmService, useValue: { confirm } }],
    }).compileComponents();
  });

  it('uses "Cập nhật", never "Chỉnh sửa", for the CRUD update action', () => {
    const fixture = TestBed.createComponent(ButtonCrudExampleComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cập nhật');
    expect(text).not.toContain('Chỉnh sửa');
  });

  it('names the record in the delete confirmation and keeps it on "Giữ lại"', async () => {
    confirm.and.returnValue(Promise.reject(new Error('kept')));
    const fixture = TestBed.createComponent(ButtonDangerExampleComponent);
    fixture.detectChanges();

    await fixture.componentInstance.remove();

    expect(confirm).toHaveBeenCalledWith(
      jasmine.stringContaining('DH-1024'),
      jasmine.objectContaining({ title: 'Xoá đơn hàng DH-1024?', yesTitle: 'Xoá', noTitle: 'Giữ lại', yesButtonColor: 'error' })
    );
    expect(fixture.componentInstance.deleted()).toBeFalse();
    expect(fixture.componentInstance.message()).toBe('Đã giữ lại bản ghi.');
  });

  it('deletes after confirmation and can restore the sample', async () => {
    confirm.and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(ButtonDangerExampleComponent);
    fixture.detectChanges();

    await fixture.componentInstance.remove();
    fixture.detectChanges();
    expect(fixture.componentInstance.deleted()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Khôi phục dữ liệu mẫu');

    fixture.componentInstance.restore();
    expect(fixture.componentInstance.deleted()).toBeFalse();
  });

  it('blocks a second save while pending, fails once, then succeeds on "Thử lại"', fakeAsync(() => {
    const fixture = TestBed.createComponent(ButtonAsyncExampleComponent);
    const example = fixture.componentInstance;
    fixture.detectChanges();

    void example.save();
    void example.save();
    expect(example.title()).toBe('Đang lưu…');
    tick(500);
    expect(example.failed()).toBeTrue();
    expect(example.title()).toBe('Thử lại');
    expect(example.name()).toBe('Công ty An Phát');

    void example.save();
    tick(500);
    expect(example.failed()).toBeFalse();
    expect(example.title()).toBe('Lưu');
    expect(example.message()).toBe('Đã lưu thay đổi.');
  }));
});

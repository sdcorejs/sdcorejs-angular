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

  it('shows static elements and buttons and logs (sdAction) for a valid submit and a custom action (AC-017)', async () => {
    const consoleError = spyOn(console, 'error').and.callThrough();
    const fixture = await create();
    const root = fixture.nativeElement as HTMLElement;
    const render = root.querySelector('sd-form-render')!;
    expect(render.querySelector('h2.sd-fg-heading')?.textContent?.trim()).toBeTruthy();
    expect(render.querySelector('.sd-fg-notice sd-inform')).withContext('notice').not.toBeNull();
    expect(render.querySelector('hr.sd-fg-divider')).withContext('divider').not.toBeNull();
    expect(render.querySelectorAll('lib-button-element').length).withContext('submit, custom and reset buttons').toBe(3);
    expect(root.querySelector('sd-form-builder [data-fb-item="b-submit"] fb-field-preview [inert]'))
      .withContext('the builder canvas previews the button')
      .not.toBeNull();

    const press = async (id: string) => {
      root.querySelector<HTMLButtonElement>(`sd-form-render [data-element-id="${id}"] button`)!.click();
      for (let pass = 0; pass < 3; pass += 1) {
        fixture.detectChanges();
        await fixture.whenStable();
      }
    };
    const demo = fixture.componentInstance;
    await press('b-submit');
    expect(demo.actions()).withContext('an invalid submit emits nothing').toEqual([]);

    demo.value.set({ fullName: 'Nguyễn Lan', email: 'lan@example.com', city: 'hn' });
    fixture.detectChanges();
    await fixture.whenStable();
    await press('b-submit');
    expect(demo.actions().map(entry => entry.action)).toEqual(['submit']);
    expect(demo.actions()[0]).toEqual(jasmine.objectContaining({ buttonId: 'b-submit' }));
    await press('b-draft');
    expect(demo.actions().map(entry => entry.action)).toEqual(['submit', 'save-draft']);
    expect(root.querySelector('.action-log')!.textContent).toContain('save-draft');
    expect(consoleError).withContext('no console error').not.toHaveBeenCalled();
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

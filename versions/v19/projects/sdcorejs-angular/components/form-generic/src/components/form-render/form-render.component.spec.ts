import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdFormRender } from './form-render.component';

describe('SdFormRender - configuration data safety', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormRender],
    });
  });

  it('formats an internal clone instead of mutating the input schema', () => {
    const component = TestBed.createComponent(SdFormRender).componentInstance;
    const child: any = {
      type: 'textfield',
      label: 'Child',
      layout: { columns: '6' },
      properties: {},
    };
    const input: any = {
      components: [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group',
          layout: { columns: '12' },
          properties: { icon: 'category', color: 'primary' },
          components: [child],
        },
      ],
    };

    component._configuration = input;

    expect(child.id).toBeUndefined();
    expect(child.key).toBeUndefined();
    expect(component.configuration.components[0]).not.toBe(input.components[0]);
    expect((component.configuration.components[0] as any).components[0].id).toBeDefined();
    expect((component.configuration.components[0] as any).components[0].key).toBeDefined();
  });

  it('does not call full setValue before dynamic controls are registered', () => {
    const component = TestBed.createComponent(SdFormRender).componentInstance;
    component.form = new FormGroup({});
    component._configuration = {
      components: [
        {
          id: 'c1',
          key: 'firstName',
          type: 'textfield',
          label: 'First name',
          layout: { columns: '12' },
          validate: {},
          properties: {},
        },
      ],
      variables: [],
      validations: [],
    } as any;
    component._entity = { lastName: 'Nguyen' };
    component._default = { firstName: 'An', lastName: 'Default' };

    expect(() => component.ngAfterViewInit()).not.toThrow();
    expect(component.entity).toEqual({ lastName: 'Nguyen', firstName: 'An' });
    expect(component.form.controls['sdRaw']?.value).toEqual({ lastName: 'Nguyen', firstName: 'An' });

    component.ngOnDestroy();
  });
});

describe('SdFormRender - group collapse', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let form: FormGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdFormRender);
    form = new FormGroup({});
    fixture.componentRef.setInput('form', form);
  });

  function render(properties: Record<string, unknown> = {}, viewed = false) {
    fixture.componentRef.setInput('viewed', viewed);
    fixture.componentRef.setInput('configuration', {
      components: [
        {
          id: 'group',
          type: 'group',
          label: 'Details',
          layout: { columns: '12' },
          properties: { icon: 'category', color: 'primary', ...properties },
          components: [
            {
              id: 'name',
              key: 'name',
              type: 'textfield',
              label: 'Name',
              layout: { columns: '12' },
              validate: { required: true },
              properties: {},
            },
          ],
        },
      ],
    });
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  for (const collapsible of [undefined, false]) {
    it(`keeps the group expanded without a toggle when collapsible is ${collapsible}`, fakeAsync(() => {
      render({ collapsible });
      expect(fixture.nativeElement.querySelector('.sd-section-body')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.sd-section-collapse-toggle')).toBeNull();
    }));
  }

  it('collapses and expands without losing child control state, value or validation', fakeAsync(() => {
    render({ collapsible: true });
    const trigger = fixture.nativeElement.querySelector('.sd-section-collapse-toggle') as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();
    if (!trigger) return;
    const control = form.get('name')!;
    expect(control.hasError('required')).toBeTrue();
    control.markAsTouched();

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.sd-section-body')).toBeNull();
    expect(form.get('name')).toBe(control);
    expect(control.touched).toBeTrue();
    expect(control.hasError('required')).toBeTrue();
    control.setValue('Saved name');

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('sd-input input').value).toBe('Saved name');
    expect(form.get('name')).toBe(control);
    expect(control.valid).toBeTrue();
    fixture.destroy();
  }));

  it('allows collapse in viewed mode', fakeAsync(() => {
    render({ collapsible: true }, true);
    const trigger = fixture.nativeElement.querySelector('.sd-section-collapse-toggle') as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();
    if (!trigger) return;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  }));

  it('ignores legacy group disable conditions and keeps visibility rules', fakeAsync(() => {
    fixture.componentRef.setInput('entity', { locked: true });
    render({
      disabledWhenExpression: {
        key: 'disable-group',
        type: 'combinator',
        combinator: '&&',
        conditions: [{ key: 'locked', type: 'condition', field: 'locked', operator: 'EQUAL', value: true, dayInfo: {} }],
      },
    });
    expect(form.get('name')?.enabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('sd-input input').disabled).toBeFalse();
    render({ collapsible: true, hidden: true });
    expect(fixture.nativeElement.querySelector('sd-section')).toBeNull();
  }));
});

describe('SdFormRender - initial preview render', () => {
  let fixture: ComponentFixture<SdFormRender>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormRender],
    });

    fixture = TestBed.createComponent(SdFormRender);
  });

  it('renders initial preview content without waiting for a second change detection cycle', fakeAsync(() => {
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('configuration', {
      components: [
        {
          id: 'name',
          key: 'name',
          type: 'textfield',
          label: 'Name',
          layout: { columns: '12' },
          validate: {},
          disabled: false,
          properties: {},
        },
      ],
      validations: [],
    });

    fixture.detectChanges();
    flushMicrotasks();

    expect(fixture.componentInstance.loadCompleted).toBeTrue();
    expect(fixture.componentInstance.hashedValues).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lib-item')).not.toBeNull();
  }));
});

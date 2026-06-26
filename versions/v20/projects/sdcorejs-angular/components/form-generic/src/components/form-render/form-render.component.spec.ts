import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { SdLicenseService } from '@sdcorejs/angular/services/license';
import { SdFormRender } from './form-render.component';

describe('SdFormRender - configuration data safety', () => {
  it('formats an internal clone instead of mutating the input schema', () => {
    const ref = { detectChanges: () => {}, markForCheck: () => {} } as ChangeDetectorRef;
    const component = new SdFormRender(ref, null);
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
    const ref = { detectChanges: () => {}, markForCheck: () => {} } as ChangeDetectorRef;
    const component = new SdFormRender(ref, null);
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

describe('SdFormRender - initial preview render', () => {
  let fixture: ComponentFixture<SdFormRender>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormRender],
      providers: [{ provide: SdLicenseService, useValue: { enforceLicense: () => {} } }],
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

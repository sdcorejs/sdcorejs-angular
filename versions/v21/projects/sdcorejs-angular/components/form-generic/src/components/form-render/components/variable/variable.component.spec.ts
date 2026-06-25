import { ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { VariableComponent } from './variable.component';

describe('VariableComponent', () => {
  it('patches only registered variable controls when a variable value changes', () => {
    const ref = { markForCheck: () => {} } as ChangeDetectorRef;
    const component = new VariableComponent(ref);
    const setVariables = new Subject<{ key: string; value: any }>();
    component.variables = [{ id: 'v1', key: 'currentUserId', label: 'Current user id' }];
    component.setVariables = setVariables;
    component.form = new FormGroup({});
    component._entity = { unrelated: 'keep-me' };

    component.ngOnInit();

    expect(() => setVariables.next({ key: 'currentUserId', value: 'u-1' })).not.toThrow();
    expect(component.entity).toEqual({ unrelated: 'keep-me', currentUserId: 'u-1' });
    expect(component.form.controls['currentUserId']?.value).toBe('u-1');

    component.ngOnDestroy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormGroup } from '@angular/forms';
import { SdSegmentedComponent } from './segmented.component';

describe('SdSegmentedComponent', () => {
  let fixture: ComponentFixture<SdSegmentedComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdSegmentedComponent] }).compileComponents();
    fixture = TestBed.createComponent(SdSegmentedComponent);
    fixture.componentRef.setInput('items', [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
    ]);
    fixture.componentRef.setInput('model', 'list');
    fixture.detectChanges();
  });
  it('renders a named radio group and selected choice without owning a content panel', () => {
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(group).not.toBeNull();
    const choices = fixture.nativeElement.querySelectorAll('[role="radio"]');
    expect(choices.length).toBe(2);
    expect(choices[0].getAttribute('aria-checked')).toBe('true');
    expect(choices[1].getAttribute('aria-checked')).toBe('false');
  });
  it('updates model and emits sdChange once for a user choice', () => {
    const change = jasmine.createSpy('change');
    fixture.componentInstance.sdChange.subscribe(change);
    const button = fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement;
    expect(button).toBeDefined();
    button?.click();
    expect(fixture.componentInstance.model()).toBe('grid');
    expect(change).toHaveBeenCalledOnceWith('grid');
  });
  const buttons = (f: ComponentFixture<SdSegmentedComponent>) =>
    Array.from(f.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
  it('does not emit for programmatic model writes or re-selecting the active choice', () => {
    const changed = jasmine.createSpy('changed');
    fixture.componentInstance.sdChange.subscribe(changed);
    fixture.componentRef.setInput('model', 'grid');
    fixture.detectChanges();
    buttons(fixture)[1].click();
    expect(changed).not.toHaveBeenCalled();
  });
  it('clears the active choice only when allowEmpty is enabled', () => {
    fixture.componentRef.setInput('option', { allowEmpty: true });
    fixture.detectChanges();
    buttons(fixture)[0].click();
    expect(fixture.componentInstance.model()).toBeNull();
  });
  it('keeps an active allowEmpty choice when navigation lands on it', () => {
    fixture.componentRef.setInput('option', { allowEmpty: true });
    fixture.detectChanges();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(fixture.componentInstance.model()).toBe('list');
  });
  it('supports multiple selection in item order and keeps unknown consumer values', () => {
    fixture.componentRef.setInput('option', { multiple: true });
    fixture.componentRef.setInput('model', ['grid', 'external']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="group"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="checkbox"]').length).toBe(2);
    buttons(fixture)[0].click();
    expect(fixture.componentInstance.model()).toEqual(['list', 'grid', 'external']);
    buttons(fixture)[1].click();
    expect(fixture.componentInstance.model()).toEqual(['list', 'external']);
  });
  it('moves and selects with arrows, Home and End while skipping disabled items', () => {
    fixture.componentRef.setInput('items', [
      { value: 'list', label: 'List' },
      { value: 'hidden', label: 'Disabled', disabled: true },
      { value: 'grid', label: 'Grid' },
    ]);
    fixture.detectChanges();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(fixture.componentInstance.model()).toBe('grid');
    expect(document.activeElement).toBe(buttons(fixture)[2]);
    buttons(fixture)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(fixture.componentInstance.model()).toBe('list');
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(fixture.componentInstance.model()).toBe('grid');
  });
  it('moves focus without changing multiple selection on arrow keys', () => {
    fixture.componentRef.setInput('option', { multiple: true });
    fixture.componentRef.setInput('model', ['list']);
    fixture.detectChanges();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(fixture.componentInstance.model()).toEqual(['list']);
    expect(document.activeElement).toBe(buttons(fixture)[1]);
  });
  it('respects vertical orientation and RTL navigation', () => {
    fixture.componentRef.setInput('option', { orientation: 'vertical' });
    fixture.detectChanges();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(fixture.componentInstance.model()).toBe('grid');
    fixture.componentRef.setInput('option', {});
    fixture.componentRef.setInput('model', 'list');
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(fixture.componentInstance.model()).toBe('grid');
  });
  for (const lock of ['disabled', 'readonly', 'loading']) {
    it(`blocks user choices while ${lock}`, () => {
      fixture.componentRef.setInput(lock, true);
      fixture.detectChanges();
      buttons(fixture)[1].click();
      buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(fixture.componentInstance.model()).toBe('list');
    });
  }
  it('enables again after an initially disabled input is cleared', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(buttons(fixture)[1].disabled).toBeFalse();
    buttons(fixture)[1].click();
    expect(fixture.componentInstance.model()).toBe('grid');
  });
  it('preserves disabled or removed choices and exact numeric/boolean values', () => {
    fixture.componentRef.setInput('items', [
      { value: 0, label: 'Zero' },
      { value: false, label: 'False' },
    ]);
    fixture.componentRef.setInput('model', 0);
    fixture.detectChanges();
    expect(buttons(fixture)[0].getAttribute('aria-checked')).toBe('true');
    buttons(fixture)[1].click();
    expect(fixture.componentInstance.model()).toBeFalse();
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.model()).toBeFalse();
  });
  it('keeps icon-only choices named and labels the group visibly', () => {
    fixture.componentRef.setInput('label', 'Layout');
    fixture.componentRef.setInput('items', [{ value: 'list', label: 'List', prefixIcon: 'view_list', iconOnly: true }]);
    fixture.detectChanges();
    expect(buttons(fixture)[0].getAttribute('aria-label')).toBe('List');
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent).toContain('Layout');
  });
  it('registers with the parent form, reflects external writes, and unregisters on destruction', () => {
    const form = new UntypedFormGroup({});
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('name', 'view');
    fixture.detectChanges();
    expect(form.get('view')).toBe(fixture.componentInstance.formControl);
    form.get('view')!.setValue('grid');
    expect(fixture.componentInstance.model()).toBe('grid');
    fixture.destroy();
    expect(form.get('view')).toBeNull();
  });
  it('shows required and consumer errors after parent touch with OnPush automatic rendering', async () => {
    fixture.componentRef.setInput('model', null);
    fixture.componentRef.setInput('required', true);
    fixture.autoDetectChanges();
    fixture.componentInstance.formControl.markAsTouched();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector(`#${fixture.componentInstance.id}-error`)).not.toBeNull();
    fixture.componentRef.setInput('inlineError', 'Choose another layout');
    fixture.componentInstance.reValidate();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Choose another layout');
  });
  it('marks the control touched only when focus leaves the whole group', () => {
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    group.dispatchEvent(new FocusEvent('focusout', { relatedTarget: buttons(fixture)[1] }));
    expect(fixture.componentInstance.formControl.touched).toBeFalse();
    group.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
    expect(fixture.componentInstance.formControl.touched).toBeTrue();
  });
  for (const invalid of [
    [
      { value: 'x', label: 'One' },
      { value: 'x', label: 'Two' },
    ],
    [{ value: 'x', label: '' }],
    [{ value: NaN, label: 'Invalid' }],
  ]) {
    it('shows a described configuration error and prevents invalid choices', () => {
      fixture.componentRef.setInput('items', invalid);
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(document.getElementById(group.getAttribute('aria-describedby')!)).not.toBeNull();
      expect(buttons(fixture)).toHaveSize(0);
      expect(fixture.componentInstance.model()).toBe('list');
    });
  }

  for (const write of ['model', 'control']) {
    it(`enters at the new selection after focus leaves and an external ${write} write`, () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      try {
        buttons(fixture)[0].focus();
        expect(document.activeElement).toBe(buttons(fixture)[0]);
        outside.focus();
        expect(document.activeElement).toBe(outside);
        if (write === 'model') fixture.componentRef.setInput('model', 'grid');
        else fixture.componentInstance.formControl.setValue('grid');
        fixture.detectChanges();
        expect(buttons(fixture)[0].getAttribute('aria-checked')).toBe('false');
        expect(buttons(fixture)[0].tabIndex).toBe(-1);
        expect(buttons(fixture)[1].getAttribute('aria-checked')).toBe('true');
        expect(buttons(fixture)[1].tabIndex).toBe(0);
      } finally {
        outside.remove();
      }
    });
  }

  it('defaults to the light type and reflects type, color and size on the host', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-type')).toBe('light');
    expect(host.getAttribute('data-color')).toBe('primary');
    expect(host.getAttribute('data-size')).toBe('md');
    for (const type of ['fill', 'outline', 'light'] as const) {
      fixture.componentRef.setInput('type', type);
      fixture.detectChanges();
      expect(host.getAttribute('data-type')).toBe(type);
    }
  });

  for (const type of ['light', 'fill', 'outline'] as const) {
    it(`keeps single and multiple semantics unchanged for the ${type} type`, () => {
      const changed = jasmine.createSpy('changed');
      fixture.componentInstance.sdChange.subscribe(changed);
      fixture.componentRef.setInput('type', type);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).not.toBeNull();
      expect(buttons(fixture)[0].classList).toContain('sd-segmented__item--selected');
      buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.model()).toBe('grid');
      expect(document.activeElement).toBe(buttons(fixture)[1]);
      expect(buttons(fixture)[1].getAttribute('aria-checked')).toBe('true');
      expect(buttons(fixture)[1].tabIndex).toBe(0);
      expect(changed).toHaveBeenCalledOnceWith('grid');
      fixture.componentRef.setInput('option', { multiple: true });
      fixture.componentRef.setInput('model', ['list']);
      fixture.detectChanges();
      buttons(fixture)[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.model()).toEqual(['list', 'grid']);
      expect(buttons(fixture).map(button => button.getAttribute('aria-checked'))).toEqual(['true', 'true']);
    });
  }

  it('keeps the current multiple-mode tab stop while focus moves inside the group', () => {
    fixture.componentRef.setInput('option', { multiple: true });
    fixture.componentRef.setInput('model', ['list']);
    fixture.detectChanges();
    buttons(fixture)[0].focus();
    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons(fixture)[1]);
    expect(buttons(fixture)[0].tabIndex).toBe(-1);
    expect(buttons(fixture)[1].tabIndex).toBe(0);
    expect(fixture.componentInstance.model()).toEqual(['list']);
  });
});

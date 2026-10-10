import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormGroup } from '@angular/forms';
import { SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdStepper } from '@sdcorejs/angular/components/stepper';
import { MatStepper } from '@angular/material/stepper';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormRender } from './form-render.component';

describe('Form Core navigation and consumer registration regressions', () => {
  let fixture: ComponentFixture<SdFormRender>;
  const schema = (type: 'tabs' | 'steps'): SdFormGenericSchema => ({
    navigation: { type, linear: true },
    pages: [
      {
        id: 'details',
        label: 'Details',
        elements: [{ id: 'project', key: 'project', type: 'textfield', label: 'Project', validation: { required: true } }],
      },
      {
        id: 'approval',
        label: 'Approval',
        elements: [{ id: 'approver', key: 'approver', type: 'textfield', label: 'Approver', validation: { required: true } }],
      },
      {
        id: 'legal',
        label: 'Legal',
        rules: { visible: { field: 'needsLegal', operator: 'EQUAL', data: true } },
        elements: [{ id: 'legalNote', key: 'legalNote', type: 'textarea', label: 'Legal note', validation: { required: true } }],
      },
      { id: 'review', label: 'Review', elements: [] },
    ],
  });
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function setup(type: 'tabs' | 'steps') {
    TestBed.configureTestingModule({ imports: [SdFormRender], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SdFormRender);
    fixture.componentRef.setInput('schema', schema(type));
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('value', { project: 'Nova', approver: 'Linh', needsLegal: true, legalNote: '' });
    await settle();
  }
  afterEach(() => fixture?.destroy());

  it('uses sm Core footer buttons on mobile and restores md outside mobile', async () => {
    await setup('steps');
    fixture.componentRef.setInput('breakpoint', 'mobile');
    await settle();
    const buttons = () => fixture.debugElement.queryAll(By.css('.sd-fg-step-actions sd-button')).map(b => b.componentInstance as SdButton);
    expect(buttons().map(b => b.size())).toEqual(['sm', 'sm']);
    fixture.componentRef.setInput('breakpoint', 'desktop');
    await settle();
    expect(buttons().map(b => b.size())).toEqual(['md', 'md']);
  });

  it('uses vertical Core steps on mobile while retaining control identity and values', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    const before = render.formGroup().get('approver');
    fixture.componentRef.setInput('breakpoint', 'mobile');
    await settle();
    const core = fixture.debugElement.query(By.directive(SdStepper)).componentInstance as SdStepper;
    expect(core.orientation()).toBe('vertical');
    expect((fixture.nativeElement as HTMLElement).querySelector('.mat-stepper-vertical')).not.toBeNull();
    expect(render.formGroup().get('approver')).toBe(before);
    expect(before?.value).toBe('Linh');
    fixture.componentRef.setInput('breakpoint', 'desktop');
    await settle();
    expect(core.orientation()).toBe('horizontal');
    expect(render.formGroup().get('approver')).toBe(before);
  });

  it('gates a real Core arrow/Enter proposal and shows guidance for the invalid predecessor', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    fixture.componentRef.setInput('value', { ...render.value(), approver: '' });
    await settle();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLElement>('mat-step-header')!.focus();
    for (let i = 0; i < 3; i++) {
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
    }
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    await settle();
    expect(render.effectivePageId()).toBe('approval');
    expect(render.formGroup().get('approver')?.touched).toBeTrue();
    expect(root.querySelector('.sd-fg-navigation-tip [role="note"]')).not.toBeNull();
    const material = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    expect(material.selectedIndex).toBe(render.activeIndex());
  });

  for (const type of ['tabs', 'steps'] as const) {
    it(`uses the existing Core ${type} component and mounts unvisited page controls`, async () => {
      await setup(type);
      expect(fixture.debugElement.query(By.directive(type === 'tabs' ? SdTabGroup : SdStepper))).not.toBeNull();
      expect(fixture.componentInstance.formGroup().get('legalNote')?.hasError('required')).toBeTrue();
    });
  }

  it('registers a required textarea again after a rule hides and reveals its page', async () => {
    await setup('tabs');
    const render = fixture.componentInstance;
    expect((await render.validate()).valid).toBeFalse();
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: false });
    await settle();
    expect(render.formGroup().get('legalNote')).toBeNull();
    expect((await render.validate()).valid).toBeTrue();
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: true });
    await settle();
    expect(render.formGroup().get('legalNote')?.hasError('required')).toBeTrue();
    expect((await render.validate()).valid).toBeFalse();
    expect(render.effectivePageId()).toBe('legal');
  });

  it('accepts a linear consumer model jump after the native approver input becomes valid', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: false, approver: '' });
    await settle();
    await render.requestPage('approval');
    await settle();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('[data-page-id="approval"] input')!;
    input.value = 'Linh (demo)';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(render.formGroup().get('approver')?.valid).toBeTrue();
    fixture.componentRef.setInput('activePageId', 'review');
    await settle();
    expect(render.navigationPending()).toBeFalse();
    expect(render.effectivePageId()).toBe('review');
  });

  it('shows non-live guidance only after a blocked linear attempt, and clears it when the value changes', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.sd-fg-navigation-tip')).toBeNull();
    fixture.componentRef.setInput('value', { ...render.value(), approver: '', needsLegal: false });
    await settle();
    await render.requestPage('review');
    await settle();
    expect(root.querySelector('.sd-fg-navigation-tip [role="note"]')).not.toBeNull();
    expect(root.querySelector('.sd-fg-navigation-tip [role="alert"]')).toBeNull();
    fixture.componentRef.setInput('value', { ...render.value(), approver: 'Linh' });
    await settle();
    expect(root.querySelector('.sd-fg-navigation-tip')).toBeNull();
  });

  it('validates a rule-revealed page even when the consumer calls validate before the next render', async () => {
    await setup('tabs');
    const render = fixture.componentInstance;
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: false });
    await settle();
    expect((await render.validate()).valid).toBeTrue();
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: true });
    const validation = render.validate();
    await settle();
    expect((await validation).valid).toBeFalse();
    expect(render.formGroup().get('legalNote')?.hasError('required')).toBeTrue();
    expect(render.effectivePageId()).toBe('legal');
  });

  it('retains a forward request made after an input while that input validator is still pending', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    fixture.componentRef.setInput('value', { ...render.value(), needsLegal: false });
    await settle();
    await render.requestPage('approval');
    await settle();
    let resolve!: (value: null) => void;
    const control = render.formGroup().get('approver')!;
    control.setAsyncValidators(
      () =>
        new Promise<null>(r => {
          resolve = r;
        })
    );
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('[data-page-id="approval"] input')!;
    input.value = 'Linh (demo)';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const navigation = render.requestPage('review');
    fixture.detectChanges();
    resolve(null);
    await navigation;
    await settle();
    expect(render.effectivePageId()).toBe('review');
    expect(render.activePageId()).toBe('review');
  });

  it('restores the actual Core stepper index after a native header proposal is rejected', async () => {
    await setup('steps');
    const render = fixture.componentInstance;
    fixture.componentRef.setInput('value', { ...render.value(), project: '', needsLegal: false });
    await settle();
    const headers = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('mat-step-header');
    headers[2].click();
    await settle();
    const stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    expect(render.effectivePageId()).toBe('details');
    expect(stepper.selectedIndex).toBe(0);
    expect(stepper.steps.toArray()[2].completed).toBeFalse();
  });
});

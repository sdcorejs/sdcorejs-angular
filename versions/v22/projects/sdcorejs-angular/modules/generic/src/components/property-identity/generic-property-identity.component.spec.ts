import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdGenericProperty } from '../../models';
import { GenericPropertyIdentity } from './generic-property-identity.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [GenericPropertyIdentity],
  template: `<sd-generic-property-identity [property]="property()"
    ><span class="projected">Customer email</span></sd-generic-property-identity
  >`,
})
class HostComponent {
  readonly property = signal<SdGenericProperty>({ key: 'customerEmail', label: 'Customer email', dataType: 'string', format: 'email' });
}

describe('GenericPropertyIdentity', () => {
  const render = async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
  };

  it('shows the data-type icon with the translated type as accessible name and tooltip (AC-009)', async () => {
    const fixture = await render();
    const label = TestBed.inject(I18nService).t('core.data-type.email');
    const icon = fixture.debugElement.query(By.directive(SdIcon)).componentInstance as SdIcon;
    expect(icon.name()).toBe('mail');
    expect(icon.ariaLabel()).toBe(label);
    const tooltip = fixture.debugElement.query(By.directive(SdTooltipDirective)).injector.get(SdTooltipDirective);
    expect(tooltip.content()).toBe(label);
  });

  it('shows the property key under the projected label (AC-009)', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.projected')?.textContent).toBe('Customer email');
    expect(root.querySelector('[data-role="key"]')?.textContent?.trim()).toBe('customerEmail');
  });

  it('follows the property when it changes', async () => {
    const fixture = await render();
    fixture.componentInstance.property.set({
      key: 'owners',
      label: 'Owners',
      dataType: 'relation',
      multiple: true,
      relation: { entity: 'user' },
    });
    await fixture.whenStable();
    const icon = fixture.debugElement.query(By.directive(SdIcon)).componentInstance as SdIcon;
    expect(icon.name()).toBe('hub');
    expect(icon.ariaLabel()).toBe(TestBed.inject(I18nService).t('core.data-type.relation'));
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-role="key"]')?.textContent?.trim()).toBe('owners');
  });
});

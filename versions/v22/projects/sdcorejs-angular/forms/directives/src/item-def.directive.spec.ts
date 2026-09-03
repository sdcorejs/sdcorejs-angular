import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';

import { SdItemDefDefDirective } from './item-def.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdItemDefDefDirective],
  template: `
    <ng-container *sdItemDef="let it; let alt = item">
      <span class="row">{{ it?.label }}|{{ alt?.label }}</span>
    </ng-container>
  `,
})
class Host {
  @ViewChild(SdItemDefDefDirective, { static: true }) directive!: SdItemDefDefDirective<unknown>;
}

describe('SdItemDefDefDirective', () => {
  it('instantiates and exposes a TemplateRef', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dir = fixture.componentInstance.directive;
    expect(dir).toBeTruthy();
    expect(dir.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('ngTemplateContextGuard always narrows to the Context shape', () => {
    expect(SdItemDefDefDirective.ngTemplateContextGuard({} as SdItemDefDefDirective<unknown>, { item: 'x', $implicit: 'x' })).toBe(true);
    // Returns true regardless of ctx shape (compile-time guard only).
    expect(SdItemDefDefDirective.ngTemplateContextGuard({} as SdItemDefDefDirective<unknown>, null)).toBe(true);
  });

  it('renders projected template content via createEmbeddedView', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const tplRef = fixture.componentInstance.directive.templateRef;
    const view = tplRef.createEmbeddedView({ $implicit: { label: 'a' }, item: { label: 'b' } });
    view.detectChanges();
    const node = view.rootNodes.find((n: Node) => (n as HTMLElement).classList?.contains('row')) as HTMLElement;
    expect(node.textContent?.trim()).toBe('a|b');
  });
});

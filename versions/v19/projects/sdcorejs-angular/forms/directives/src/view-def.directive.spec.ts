import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SdViewDefDirective } from './view-def.directive';

@Component({
  standalone: true,
  imports: [SdViewDefDirective],
  template: `
    <ng-template sdViewDef let-v="value" let-it="selectedItem">
      <span class="v">{{ v }}|{{ it?.label }}</span>
    </ng-template>
  `,
})
class Host {
  @ViewChild(SdViewDefDirective, { static: true }) directive!: SdViewDefDirective<unknown, unknown>;
}

describe('SdViewDefDirective', () => {
  it('instantiates and exposes a TemplateRef', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dir = fixture.componentInstance.directive;
    expect(dir).toBeTruthy();
    expect(dir.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('ngTemplateContextGuard always narrows to Context', () => {
    expect(
      SdViewDefDirective.ngTemplateContextGuard({} as SdViewDefDirective<unknown, unknown>, { value: 1, selectedItem: { label: 'x' } })
    ).toBe(true);
    expect(SdViewDefDirective.ngTemplateContextGuard({} as SdViewDefDirective<unknown, unknown>, null)).toBe(true);
  });

  it('renders projected template with bound context (value + selectedItem)', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const view = fixture.componentInstance.directive.templateRef.createEmbeddedView({
      value: 'hi',
      selectedItem: { label: 'A' },
      selectedItems: null,
    });
    view.detectChanges();
    const node = view.rootNodes.find((n: Node) => (n as HTMLElement).classList?.contains('v')) as HTMLElement;
    expect(node.textContent?.trim()).toBe('hi|A');
  });
});

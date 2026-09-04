import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SdSuffixDefDirective } from './suffix-def.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSuffixDefDirective],
  template: `
    <ng-template sdSuffixDef>
      <i class="suf">&#64;</i>
    </ng-template>
  `,
})
class Host {
  @ViewChild(SdSuffixDefDirective, { static: true }) directive!: SdSuffixDefDirective;
}

describe('SdSuffixDefDirective', () => {
  it('instantiates and exposes a TemplateRef', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dir = fixture.componentInstance.directive;
    expect(dir).toBeTruthy();
    expect(dir.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('renders projected template content via createEmbeddedView', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const view = fixture.componentInstance.directive.templateRef.createEmbeddedView({});
    view.detectChanges();
    const node = view.rootNodes.find((n: Node) => (n as HTMLElement).classList?.contains('suf')) as HTMLElement;
    expect(node.textContent?.trim()).toBe('@');
  });
});

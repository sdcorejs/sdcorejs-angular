import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SdLabelDefDirective } from './label-def.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdLabelDefDirective],
  template: `
    <ng-template sdLabelDef>
      <span class="lbl">label content</span>
    </ng-template>
  `,
})
class Host {
  @ViewChild(SdLabelDefDirective, { static: true }) directive!: SdLabelDefDirective;
}

describe('SdLabelDefDirective', () => {
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
    const node = view.rootNodes.find((n: Node) => (n as HTMLElement).classList?.contains('lbl')) as HTMLElement;
    expect(node.textContent?.trim()).toBe('label content');
  });
});

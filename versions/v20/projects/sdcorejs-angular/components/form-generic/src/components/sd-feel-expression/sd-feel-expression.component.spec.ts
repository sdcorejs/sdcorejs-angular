import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewContainerRef } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdFeelExpression } from './sd-feel-expression.component';

describe('SdFeelExpression', () => {
  let fixture: ComponentFixture<SdFeelExpression>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdFeelExpression, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdFeelExpression);
    fixture.componentRef.setInput('components', []);
    fixture.componentRef.setInput('expression', undefined);
    fixture.componentRef.setInput('model', '');
    fixture.detectChanges();
  });

  it('projects the confirm action with a real footer-right host', () => {
    const modalDe = fixture.debugElement.query(By.directive(SdModal));
    const modal = modalDe.componentInstance as SdModal;
    const vcr = modalDe.injector.get(ViewContainerRef);

    modal.alreadyOpened.set(true);
    const view = modal.templateRef().createEmbeddedView({});
    vcr.insert(view);
    fixture.detectChanges();

    const root = view.rootNodes[0] as HTMLElement;
    const footerRight = root.querySelector('.sd-modal-footer-right') as HTMLElement | null;
    const body = root.querySelector('.sd-modal-body') as HTMLElement | null;

    expect(footerRight?.querySelector('sd-button[sdFooterRight]')).not.toBeNull();
    expect(Array.from(body?.children ?? []).some(child => child.tagName.toLowerCase() === 'sd-button')).toBeFalse();
  });
});

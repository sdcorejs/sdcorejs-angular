import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewContainerRef } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { AttributeExpression } from './attribute-expression.component';

describe('AttributeExpression', () => {
  let fixture: ComponentFixture<AttributeExpression>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttributeExpression, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AttributeExpression);
    fixture.componentRef.setInput('components', []);
    fixture.componentRef.setInput('variables', []);
    fixture.componentRef.setInput('model', undefined);
    fixture.detectChanges();
  });

  it('projects the confirm action into the modal footer instead of the scrollable body', () => {
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

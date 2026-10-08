import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SdSectionItem } from './section-item.component';

describe('SdSectionItem', () => {
  let fixture: ComponentFixture<SdSectionItem>;
  let component: SdSectionItem;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdSectionItem] });
    fixture = TestBed.createComponent(SdSectionItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'My Label');
    fixture.detectChanges();
  });

  describe('creation', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the .c-item wrapper', () => {
      const wrapper = fixture.nativeElement.querySelector('.c-item');
      expect(wrapper).not.toBeNull();
    });
  });

  describe('label() input', () => {
    it('renders the bound label text', () => {
      const label = fixture.nativeElement.querySelector('.c-item > div') as HTMLElement;
      expect(label.textContent?.trim()).toBe('My Label');
    });

    it('updates the rendered text when label changes', () => {
      fixture.componentRef.setInput('label', 'Updated');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('.c-item > div') as HTMLElement;
      expect(label.textContent?.trim()).toBe('Updated');
    });
  });

  describe('labelWidth() input + transform', () => {
    it('defaults to "150px"', () => {
      expect(component.labelWidth()).toBe('150px');
    });

    it('applies default width as inline style.width', () => {
      const label = fixture.nativeElement.querySelector('.c-item > div') as HTMLElement;
      expect(label.style.width).toBe('150px');
    });

    it('reflects an explicit width', () => {
      fixture.componentRef.setInput('labelWidth', '200px');
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('200px');
      const label = fixture.nativeElement.querySelector('.c-item > div') as HTMLElement;
      expect(label.style.width).toBe('200px');
    });

    it('transform: falsy ("", null, undefined) falls back to "150px"', () => {
      fixture.componentRef.setInput('labelWidth', '');
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('150px');

      fixture.componentRef.setInput('labelWidth', null);
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('150px');

      fixture.componentRef.setInput('labelWidth', undefined);
      fixture.detectChanges();
      expect(component.labelWidth()).toBe('150px');
    });
  });

  describe('content projection', () => {
    @Component({
      changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
      standalone: true,
      imports: [SdSectionItem],
      template: `
        <sd-section-item [label]="'Email'" [labelWidth]="'120px'">
          <input class="proj" value="x@y.com" />
        </sd-section-item>
      `,
    })
    class Host {}

    it('projects child content into the value slot', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [Host] });
      const hostFixture = TestBed.createComponent(Host);
      hostFixture.detectChanges();
      const input = hostFixture.debugElement.query(By.css('input.proj')).nativeElement as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe('x@y.com');
    });
  });

  describe('label-only left column', () => {
    it('keeps the c-item-label T14R text-secondary classes, the width and the label text', () => {
      fixture.componentRef.setInput('labelWidth', '180px');
      fixture.detectChanges();
      const left = fixture.nativeElement.querySelector('.c-item > .c-item-label') as HTMLElement;
      expect(left.classList).toContain('T14R');
      expect(left.classList).toContain('text-secondary');
      expect(left.style.width).toBe('180px');
      expect(left.textContent?.trim()).toBe('My Label');
    });
  });

  describe('[itemLeft] slot', () => {
    @Component({
      changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
      standalone: true,
      imports: [SdSectionItem],
      template: `
        <sd-section-item [label]="'Plain label'" [labelWidth]="'120px'">
          <span itemLeft class="T14M custom-left">General info</span>
          <input class="proj" value="value" />
        </sd-section-item>
      `,
    })
    class SlotWithLabelHost {}

    @Component({
      changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
      standalone: true,
      imports: [SdSectionItem],
      template: `
        <sd-section-item>
          <span itemLeft class="custom-left">Deal value</span>
        </sd-section-item>
      `,
    })
    class SlotOnlyHost {}

    const leftColumn = (hostFixture: ComponentFixture<unknown>): HTMLElement =>
      hostFixture.nativeElement.querySelector('.c-item > .c-item-label') as HTMLElement;

    it('renders projected [itemLeft] content in the left column instead of the label', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [SlotWithLabelHost] });
      const hostFixture = TestBed.createComponent(SlotWithLabelHost);
      hostFixture.detectChanges();
      const left = leftColumn(hostFixture);
      const span = left.querySelector('span.custom-left') as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.classList).toContain('T14M');
      expect(left.textContent?.trim()).toBe('General info');
      expect(left.textContent).not.toContain('Plain label');
      expect(left.style.width).toBe('120px');
    });

    it('keeps the value slot working alongside [itemLeft]', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [SlotWithLabelHost] });
      const hostFixture = TestBed.createComponent(SlotWithLabelHost);
      hostFixture.detectChanges();
      const left = leftColumn(hostFixture);
      const content = hostFixture.nativeElement.querySelector('.c-item > .c-item-content') as HTMLElement;
      expect(left.querySelector('span.custom-left')).not.toBeNull();
      expect(left.querySelector('input.proj')).toBeNull();
      const input = content.querySelector('input.proj') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe('value');
    });

    it('creates without label when only [itemLeft] is projected', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [SlotOnlyHost] });
      const hostFixture = TestBed.createComponent(SlotOnlyHost);
      expect(() => hostFixture.detectChanges()).not.toThrow();
      const item = hostFixture.debugElement.query(By.directive(SdSectionItem)).componentInstance as SdSectionItem;
      expect(item.label()).toBe('');
      expect(leftColumn(hostFixture).textContent?.trim()).toBe('Deal value');
    });
  });

  describe('optional label', () => {
    it('defaults label() to an empty string when not set', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [SdSectionItem] });
      const bare = TestBed.createComponent(SdSectionItem);
      expect(() => bare.detectChanges()).not.toThrow();
      expect(bare.componentInstance.label()).toBe('');
    });
  });
});

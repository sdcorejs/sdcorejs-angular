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
});

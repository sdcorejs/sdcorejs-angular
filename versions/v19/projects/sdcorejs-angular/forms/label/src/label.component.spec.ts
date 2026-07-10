import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltip } from '@angular/material/tooltip';
import { SdLabel } from './label.component';
import { queryByCss } from '../../../testing/test-utils';

@Component({
  standalone: true,
  imports: [SdLabel],
  template: `<sd-label [label]="label" [description]="description" [helperText]="helperText" [required]="required"></sd-label>`,
})
class HostComponent {
  label?: string | null = undefined;
  description?: string | null = undefined;
  helperText?: string | undefined = undefined;
  required: boolean | '' | null | undefined = false;
}

describe('SdLabel', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  describe('creation', () => {
    it('creates without inputs', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renders nothing when label is falsy', () => {
      fixture.detectChanges();
      // Khi !label, template @if (label) skip toàn bộ output
      const inner = fixture.nativeElement.querySelector('.T14M');
      expect(inner).toBeNull();
    });
  });

  describe('label input', () => {
    it('renders label text when provided', () => {
      host.label = 'Họ và tên';
      fixture.detectChanges();
      const span = queryByCss<HTMLSpanElement>(fixture, 'span.T14M');
      expect(span.textContent?.trim()).toBe('Họ và tên');
    });

    it('skips render when label set to null', () => {
      host.label = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.T14M')).toBeNull();
    });
  });

  describe('required input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders * when required = true', () => {
      host.required = true;
      fixture.detectChanges();
      const star = queryByCss<HTMLSpanElement>(fixture, 'span.text-error');
      expect(star.textContent?.trim()).toBe('*');
    });

    it('renders * when required is bare attribute (empty string)', () => {
      host.required = '';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).not.toBeNull();
    });

    it('does NOT render * when required = false', () => {
      host.required = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();
    });

    it('does NOT render * when required = null/undefined', () => {
      host.required = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();

      host.required = undefined;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span.text-error')).toBeNull();
    });
  });

  describe('helperText input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders mat-icon outlined info with tooltip when helperText provided', () => {
      host.helperText = 'Giải thích';
      fixture.detectChanges();
      const icon = queryByCss(fixture, 'mat-icon');
      expect(icon.textContent?.trim()).toBe('info');
      const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
      expect(tooltip.message).toBe('Giải thích');
    });

    it('does NOT render icon when helperText is undefined', () => {
      host.helperText = undefined;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
    });
  });

  describe('description input', () => {
    beforeEach(() => {
      host.label = 'X';
    });

    it('renders description below label when provided', () => {
      host.description = 'Mô tả chi tiết';
      fixture.detectChanges();
      const desc = queryByCss<HTMLDivElement>(fixture, 'div.text-secondary');
      expect(desc.textContent?.trim()).toBe('Mô tả chi tiết');
    });

    it('skips description when null', () => {
      host.description = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('div.text-secondary')).toBeNull();
    });
  });
});

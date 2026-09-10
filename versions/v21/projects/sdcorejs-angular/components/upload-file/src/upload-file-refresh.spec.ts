import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdUploadFile } from './upload-file.component';
@Component({
  standalone: true,
  imports: [SdUploadFile],
  template: '<table style="width: 80px; table-layout: fixed"><tbody><tr><td><sd-upload-file></sd-upload-file></td></tr></tbody></table>',
})
class UploadTableCellHost {}

describe('Upload compact presentation', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdUploadFile, NoopAnimationsModule] }));
  it('keeps the default upload tile small and keyboard accessible', () => {
    const f = TestBed.createComponent(SdUploadFile);
    f.detectChanges();
    const zone = f.nativeElement.querySelector('.c-area-upload') as HTMLElement;
    expect(zone.style.width).toBe('50px');
    expect(zone.style.height).toBe('50px');
    expect(zone.getBoundingClientRect().height).toBeLessThanOrEqual(56);
    expect(zone.querySelector('.c-upload-copy')).toBeNull();
    expect(zone.getAttribute('role')).toBe('button');
    expect(zone.tabIndex).toBe(0);
    expect(zone.getAttribute('aria-hidden')).not.toBe('true');
    expect(zone.textContent?.trim()).not.toBe('');
    const upload = spyOn(f.componentInstance, 'onUpload');
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    zone.dispatchEvent(event);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBeTrue();
  });
  it('fits the default upload tile inside a narrow table cell', () => {
    const f = TestBed.createComponent(UploadTableCellHost);
    f.detectChanges();
    const cell = f.nativeElement.querySelector('td') as HTMLElement;
    const zone = cell.querySelector('.c-area-upload') as HTMLElement;
    expect(zone.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(zone.getBoundingClientRect().width).toBeLessThanOrEqual(cell.getBoundingClientRect().width);
    expect(cell.getBoundingClientRect().height).toBeLessThan(80);
  });
  it('retains explicitly configured compact dimensions', () => {
    const f = TestBed.createComponent(SdUploadFile);
    f.componentRef.setInput('previewWidth', '80px');
    f.componentRef.setInput('previewHeight', '70px');
    f.detectChanges();
    const zone = f.nativeElement.querySelector('.c-area-upload') as HTMLElement;
    expect(zone.style.width).toBe('80px');
    expect(zone.style.height).toBe('70px');
    expect(zone.querySelector('.c-upload-copy')).toBeNull();
  });
  it('removes the affordance when disabled or maximum is reached', () => {
    const f = TestBed.createComponent(SdUploadFile);
    f.componentRef.setInput('max', 0);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.c-area-upload')).toBeNull();
    f.componentRef.setInput('max', 5);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.c-area-upload')).toBeNull();
  });
});

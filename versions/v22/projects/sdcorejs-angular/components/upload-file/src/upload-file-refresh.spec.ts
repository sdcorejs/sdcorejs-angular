import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdUploadFile } from './upload-file.component';
describe('Upload presentation refresh', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdUploadFile, NoopAnimationsModule] }));
  it('offers a labelled dropzone reachable using keyboard', () => {
    const f = TestBed.createComponent(SdUploadFile);
    f.detectChanges();
    const zone = f.nativeElement.querySelector('.c-area-upload') as HTMLElement;
    expect(zone.classList.contains('c-area-upload--dropzone')).toBeTrue();
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
  it('retains explicitly configured compact dimensions', () => {
    const f = TestBed.createComponent(SdUploadFile);
    f.componentRef.setInput('appearance', 'compact');
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

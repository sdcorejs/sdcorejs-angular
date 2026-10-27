import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SD_FILE_TYPE_ICONS } from '../../helpers/file-type';
import { SdUploadFileTypeIcon } from './file-type-icon.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdUploadFileTypeIcon],
  template: `<sd-upload-file-type-icon [extension]="extension()" [size]="size()" />`,
})
class IconHost {
  readonly extension = signal<string | undefined>('pdf');
  readonly size = signal(24);
}

// Đợt 3 · 4a: một component vẽ icon SVG theo đuôi file cho ô tải lên và popup.
describe('SdUploadFileTypeIcon (wave 3 · 4a)', () => {
  const render = (patch: { extension?: string; size?: number } = {}) => {
    const fixture = TestBed.createComponent(IconHost);
    if ('extension' in patch) fixture.componentInstance.extension.set(patch.extension);
    if (patch.size) fixture.componentInstance.size.set(patch.size);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('sd-upload-file-type-icon') as HTMLElement;
  };

  it('is a decorative square of the given size', () => {
    const icon = render({ size: 22 });
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    const box = icon.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([22, 22]);
  });

  it('paints the SVG of the extension, and the generic file icon otherwise', () => {
    const pdf = render({ extension: 'PDF' });
    expect(pdf.classList).toContain('sd-upload-file-type-icon--pdf');
    const unknown = render({ extension: 'heic' });
    expect(unknown.classList).toContain('sd-upload-file-type-icon--file');
    expect(getComputedStyle(unknown).backgroundImage).toMatch(/svg/);
  });

  // why: bộ SVG inline lúc build — đuôi nào trong danh sách mà SCSS thiếu class sẽ hiện ô trống.
  it('has a background image for every extension of the set', () => {
    const missing = SD_FILE_TYPE_ICONS.filter(ext => !/svg/.test(getComputedStyle(render({ extension: ext })).backgroundImage));
    expect(missing).toEqual([]);
  });
});

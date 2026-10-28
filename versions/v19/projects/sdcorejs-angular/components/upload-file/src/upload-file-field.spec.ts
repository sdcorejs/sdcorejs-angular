import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';

import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdUploadFile } from './upload-file.component';

const IMG_A = 'http://cdn.example.com/a.jpg';
const IMG_B = 'http://cdn.example.com/b.jpg';
const IMG_C = 'http://cdn.example.com/c.jpg';
const IMG_D = 'http://cdn.example.com/d.jpg';
const DOC_A = 'http://cdn.example.com/hop-dong.pdf';
const DOC_B = 'http://cdn.example.com/bang-ke.xlsx';

@Component({
  imports: [SdUploadFile, SdLabelDefDirective, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 480px">
      <sd-upload-file
        [type]="type()"
        [label]="label()"
        [max]="max()"
        [maxOfImage]="maxOfImage()"
        [disabled]="disabled()"
        [required]="required()"
        [maxSize]="maxSize()"
        [extensions]="extensions()"
        [upload]="upload"
        [(model)]="model">
        @if (customLabel()) {
          <ng-template sdLabelDef><span class="custom-label">Hồ sơ</span></ng-template>
        }
      </sd-upload-file>
    </div>
  `,
})
class FieldHost {
  readonly field = viewChild.required(SdUploadFile);
  readonly type = signal<'image' | 'document' | 'file'>('file');
  readonly label = signal<string | undefined>('Tệp đính kèm');
  readonly max = signal(5);
  readonly maxOfImage = signal(3);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly maxSize = signal<number | undefined>(undefined);
  readonly extensions = signal<string[]>([]);
  readonly customLabel = signal(false);
  model: (string | number)[] = [];
  upload = jasmine.createSpy('upload').and.callFake(async (files: File[]) => files.map((_, i) => `id-${i}`));
}

// Đợt 3 · 4c (design handoff `upload-file.md`, mục H3 — variant default).
describe('Upload file field (wave 3 · 4c)', () => {
  let fixture: ComponentFixture<FieldHost>;
  let host: FieldHost;
  let i18n: I18nService;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = <T extends Element = HTMLElement>(selector: string) => el().querySelector(selector) as T | null;
  const qa = (selector: string) => Array.from(el().querySelectorAll(selector)) as HTMLElement[];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const setModel = async (model: (string | number)[]) => {
    host.model = model;
    await settle();
  };
  const resolve = (property: string, value: string) => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    el().appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };
  const drop = async (files: File[], type = 'drop') => {
    const data = new DataTransfer();
    files.forEach(file => data.items.add(file));
    q('sd-upload-file')!.dispatchEvent(new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true }));
    await settle();
    await new Promise(resolve => setTimeout(resolve, 50));
    await settle();
  };
  const file = (name: string, size: number, type = 'application/pdf') => new File([new Uint8Array(size)], name, { type });
  /** DataTransfer đang kéo một tệp (types chứa `Files`). */
  const files = () => {
    const data = new DataTransfer();
    data.items.add(file('a.pdf', 10));
    return data;
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [FieldHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(FieldHost);
    host = fixture.componentInstance;
    i18n = TestBed.inject(I18nService);
    spyOn(TestBed.inject(SdNotifyService), 'warning');
    spyOn(TestBed.inject(SdConfirmService), 'confirm').and.resolveTo(true as never);
    await settle();
  });

  describe('label and counter', () => {
    it('puts "{n} / {max}" right after the label, 12px medium tabular figures', async () => {
      await setModel([IMG_A, DOC_A]);
      const head = q('.sd-upload-file__head')!;
      const counter = q('.sd-upload-file__counter')!;
      expect(counter.textContent!.trim()).toBe('2 / 5');
      expect(head.firstElementChild!.tagName).toBe('SD-LABEL');
      expect(getComputedStyle(head).alignItems).toBe('baseline');
      expect(getComputedStyle(head).columnGap).toBe('8px');
      const style = getComputedStyle(counter);
      expect([style.fontSize, style.fontWeight, style.fontVariantNumeric]).toEqual(['12px', '500', 'tabular-nums']);
      expect(style.color).toBe(resolve('color', 'var(--sd-text-secondary)'));
    });

    it('hides the counter for a single file or a disabled field', async () => {
      host.max.set(1);
      await settle();
      expect(q('.sd-upload-file__counter')).toBeNull();
      host.max.set(5);
      host.disabled.set(true);
      await settle();
      expect(q('.sd-upload-file__counter')).toBeNull();
    });

    it('keeps the counter next to a custom sdLabelDef and the description under the row', async () => {
      host.customLabel.set(true);
      host.maxSize.set(5);
      await settle();
      const head = q('.sd-upload-file__head')!;
      expect(head.querySelector('.custom-label')).not.toBeNull();
      expect(head.querySelector('.sd-upload-file__counter')).not.toBeNull();
      expect(head.nextElementSibling!.classList).toContain('sd-upload-file__description');
    });
  });

  describe('type image', () => {
    beforeEach(async () => {
      host.type.set('image');
      await setModel([IMG_A, IMG_B]);
    });

    it('starts with a 72px "Thêm ảnh" tile, dashed --sd-border-strong, 8px corners', () => {
      const grid = q('.sd-upload-file__grid')!;
      const add = q('.sd-upload-file__add')!;
      expect(grid.firstElementChild).toBe(add);
      expect(add.getBoundingClientRect().width).toBe(72);
      expect(add.getBoundingClientRect().height).toBe(72);
      const style = getComputedStyle(add);
      expect(style.borderTopStyle).toBe('dashed');
      expect(style.borderTopColor).toBe(resolve('border-top-color', 'var(--sd-border-strong)'));
      expect(style.borderTopLeftRadius).toBe('8px');
      expect(style.opacity).toBe('1');
      expect(add.querySelector('sd-icon')!.textContent).toContain('add_photo_alternate');
      expect(add.textContent).toContain(i18n.t('core.component.upload-file.add-image'));
      expect(getComputedStyle(grid).columnGap).toBe('8px');
      expect(getComputedStyle(grid).paddingTop).toBe('8px');
      expect(getComputedStyle(grid).paddingRight).toBe('8px');
      expect(getComputedStyle(q('sd-upload-file')!).overflowY).toBe('visible');
    });

    it('tints the tile primary 6% while files are dragged over the field', async () => {
      const target = q('sd-upload-file')!;
      const enter = () => target.dispatchEvent(new DragEvent('dragenter', { dataTransfer: files(), bubbles: true, cancelable: true }));
      const leave = () => target.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
      enter();
      enter();
      fixture.detectChanges();
      const add = q('.sd-upload-file__add')!;
      expect(add.classList).toContain('sd-upload-file__add--dragging');
      expect(getComputedStyle(add).backgroundColor).toBe(
        resolve('background-color', 'color-mix(in srgb, var(--sd-primary) 6%, var(--sd-surface))')
      );
      leave();
      fixture.detectChanges();
      expect(q('.sd-upload-file__add')!.classList).withContext('still over a child').toContain('sd-upload-file__add--dragging');
      leave();
      fixture.detectChanges();
      expect(q('.sd-upload-file__add')!.classList).not.toContain('sd-upload-file__add--dragging');
    });

    it('opens the popup at the image that was clicked, with no zoom icon or dark overlay', async () => {
      const open = spyOn(host.field().previewFileComponent()!, 'open');
      const tiles = qa('.sd-upload-file__tile');
      expect(q('.c-zoom')).toBeNull();
      (tiles[1].querySelector('.sd-upload-file__open') as HTMLButtonElement).click();
      expect(open).toHaveBeenCalledOnceWith(host.field().previewFiles(), 1);
    });

    it('rounds image tiles 8px and shows a 20px remove badge at -7px only on hover or focus', () => {
      const tile = qa('.sd-upload-file__tile')[0];
      const badge = tile.querySelector('.sd-upload-file__remove') as HTMLElement;
      expect(getComputedStyle(tile.querySelector('.sd-upload-file__open')!).borderTopLeftRadius).toBe('8px');
      const box = badge.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([20, 20]);
      expect(getComputedStyle(badge).top).toBe('-7px');
      expect(getComputedStyle(badge).right).toBe('-7px');
      expect(getComputedStyle(badge).visibility).toBe('hidden');
      expect(badge.getAttribute('aria-label')).toBe(
        i18n.t('core.component.upload-file.remove-named', { name: 'http://cdn.example.com/a.jpg' })
      );

      tile.querySelector<HTMLButtonElement>('.sd-upload-file__open')!.focus();
      expect(getComputedStyle(badge).visibility).withContext('focus-within').toBe('visible');
    });

    it('keeps a tile per rejected file with its reason, outside the value, without a toast', async () => {
      host.maxSize.set(1);
      await settle();
      await drop([file('lon.jpg', 2 * 1024 * 1024, 'image/jpeg'), file('ghi-chu.txt', 10, 'text/plain')]);

      const failed = qa('.sd-upload-file__tile--failed');
      expect(failed.length).toBe(2);
      expect(failed[0].querySelector('[role="img"]')!.getAttribute('aria-label')).toContain('lon.jpg');
      expect(host.model).toEqual([IMG_A, IMG_B]);
      expect(TestBed.inject(SdNotifyService).warning).not.toHaveBeenCalled();

      (failed[0].querySelector('.sd-upload-file__remove') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(qa('.sd-upload-file__tile--failed').length).toBe(1);
    });
  });

  describe('type document', () => {
    beforeEach(async () => {
      host.type.set('document');
      await setModel([DOC_A]);
    });

    it('shows a full-width drop zone, 56px high, "Kéo thả tệp vào đây hoặc chọn tệp"', () => {
      const zone = q('.sd-upload-file__dropzone')!;
      expect(zone.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
      expect(zone.getAttribute('role')).toBe('button');
      expect(zone.getAttribute('tabindex')).toBe('0');
      expect(zone.textContent).toContain(i18n.t('core.component.upload-file.drop-hint'));
      expect(q('.sd-upload-file__link')!.textContent!.trim()).toBe(i18n.t('core.component.upload-file.choose-file'));
      expect(getComputedStyle(zone).borderTopStyle).toBe('dashed');
    });

    it('turns solid primary with "Thả để tải lên" while files are dragged over', () => {
      q('sd-upload-file')!.dispatchEvent(new DragEvent('dragenter', { dataTransfer: files(), bubbles: true, cancelable: true }));
      fixture.detectChanges();
      const zone = q('.sd-upload-file__dropzone')!;
      expect(getComputedStyle(zone).borderTopStyle).toBe('solid');
      expect(zone.querySelector('.sd-upload-file__drop-text')!.textContent!.trim()).toBe(
        i18n.t('core.component.upload-file.drop-to-upload')
      );
    });

    it('lists a document as a 52px row: icon, name, "{EXT} · {size}", download; a click opens the popup at it', () => {
      const row = q('.sd-upload-file__row')!;
      expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
      expect(getComputedStyle(row).borderTopLeftRadius).toBe('8px');
      expect(row.querySelector('sd-upload-file-type-icon')).not.toBeNull();
      expect(row.querySelector('.sd-upload-file__row-meta')!.textContent!.trim()).toBe('PDF');
      const download = row.querySelector('.sd-upload-file__row-button') as HTMLElement;
      expect(download.getBoundingClientRect().width).toBe(32);
      expect(download.getAttribute('aria-label')).toBe(i18n.t('core.component.upload-file.viewer.download'));

      const open = spyOn(host.field().previewFileComponent()!, 'open');
      const onDownload = spyOn(host.field(), 'onDownload');
      (row.querySelector('.c-file-name') as HTMLButtonElement).click();
      expect(open).toHaveBeenCalledOnceWith(host.field().previewFiles(), 0);
      expect(onDownload).withContext('the name no longer downloads').not.toHaveBeenCalled();
      expect(getComputedStyle(row.querySelector('.c-file-name')!).color).toBe(resolve('color', 'var(--sd-text)'));
    });

    it('keeps the valid files of a drop and lists the rejected one with its reason', async () => {
      host.extensions.set(['pdf']);
      await settle();
      await drop([file('ok.pdf', 2048), file('anh.png', 10, 'image/png')]);

      expect(host.model.length).toBe(2);
      const failed = q('.sd-upload-file__row--failed')!;
      expect(failed.textContent).toContain('anh.png');
      expect(failed.querySelector('.sd-upload-file__row-meta')!.textContent).not.toContain('[anh.png]');
      expect(failed.querySelectorAll('button').length).withContext('only remove for a format error').toBe(1);
    });

    it('shows uploading rows during upload(), then the failed rows with Retry, which uploads again', async () => {
      let fail!: (error: Error) => void;
      host.upload.and.returnValue(new Promise<string[]>((_, reject) => (fail = reject)));
      await drop([file('ho-so.pdf', 2048)]);

      const run = host.field().upload();
      await settle();
      const uploading = q('.sd-upload-file__row--uploading')!;
      expect(uploading.textContent).toContain(i18n.t('core.component.upload-file.loading'));
      expect(uploading.querySelector('.sd-upload-file__progress')).not.toBeNull();
      expect(uploading.querySelector('.sd-upload-file__row-button')!.getAttribute('aria-label')).toBe(i18n.t('core.common.cancel'));

      fail(new Error('network'));
      await expectAsync(run).toBeRejected();
      await settle();
      const failed = q('.sd-upload-file__row--failed')!;
      expect(failed.textContent).toContain(i18n.t('core.component.upload-file.upload-failed'));
      expect(host.model.length).withContext('the file stays in the value for a retry').toBe(2);

      host.upload.and.callFake(async (files: File[]) => files.map(() => 'saved-id'));
      (failed.querySelector('.sd-upload-file__row-button') as HTMLButtonElement).click();
      await settle();
      await new Promise(resolve => setTimeout(resolve));
      await settle();
      expect(host.model).toEqual([DOC_A, 'saved-id']);
      expect(q('.sd-upload-file__row--failed')).toBeNull();
    });
  });

  describe('type file', () => {
    it('reorders images among image positions only', async () => {
      await setModel([IMG_A, DOC_A, IMG_B, DOC_B, IMG_C]);
      host.field().onDrop({ previousIndex: 0, currentIndex: 2 } as never, 'image');
      await settle();
      expect(host.model).toEqual([IMG_B, DOC_A, IMG_C, DOC_B, IMG_A]);

      host.field().onDrop({ previousIndex: 1, currentIndex: 0 } as never, 'document');
      await settle();
      expect(host.model).toEqual([IMG_B, DOC_B, IMG_C, DOC_A, IMG_A]);
    });

    it('labels the tile "Tải lên" with upload_file and has no wide drop zone', async () => {
      await setModel([IMG_A, DOC_A]);
      expect(q('.sd-upload-file__add')!.textContent).toContain(i18n.t('core.component.upload-file.upload-tile'));
      expect(q('.sd-upload-file__add sd-icon')!.textContent).toContain('upload_file');
      expect(q('.sd-upload-file__dropzone')).toBeNull();
    });
  });

  describe('disabled', () => {
    beforeEach(async () => {
      host.disabled.set(true);
      await setModel([IMG_A, IMG_B, IMG_C, IMG_D, DOC_A]);
    });

    it('has no tile, drop zone or remove badge, and rows only download', () => {
      expect(q('.sd-upload-file__add')).toBeNull();
      expect(q('.sd-upload-file__dropzone')).toBeNull();
      expect(q('.sd-upload-file__remove')).toBeNull();
      expect(q('.sd-upload-file__row')!.querySelectorAll('.sd-upload-file__row-button').length).toBe(1);
    });

    it('covers the last of maxOfImage images with "+N" and opens the popup at it', () => {
      const tiles = qa('.sd-upload-file__tile');
      expect(tiles.length).toBe(3);
      const more = tiles[2].querySelector('.sd-upload-file__more') as HTMLElement;
      expect(more.textContent!.trim()).toBe('+1');
      expect(getComputedStyle(more).fontSize).toBe('16px');
      const open = spyOn(host.field().previewFileComponent()!, 'open');
      (tiles[2].querySelector('.sd-upload-file__open') as HTMLButtonElement).click();
      expect(open).toHaveBeenCalledOnceWith(host.field().previewFiles(), 2);
    });
  });

  it('shows the required error as an error icon and 12px text, like other fields', async () => {
    host.required.set(true);
    await settle();
    host.field().formControl.markAsTouched();
    host.field().formControl.updateValueAndValidity();
    await settle();
    const error = q('.sd-upload-file__error')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.querySelector('sd-icon')!.textContent).toContain('error');
    expect(getComputedStyle(error).fontSize).toBe('12px');
    expect(getComputedStyle(error).paddingLeft).toBe('0px');
  });
});

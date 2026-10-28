import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { PreviewFile } from '../../services';
import { PreviewComponent } from './preview.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [PreviewComponent],
  template: `
    <button type="button" class="opener" (click)="open()">Open</button>
    <preview (download)="downloaded.push($event)" (close)="closed = closed + 1"></preview>
  `,
})
class PreviewHost {
  readonly preview = viewChild.required(PreviewComponent);
  files: PreviewFile[] = [];
  start = 0;
  downloaded: PreviewFile[] = [];
  closed = 0;
  open = () => this.preview().open(this.files, this.start);
}

const MB = 1024 * 1024;

/** PNG thật (vẽ bằng canvas) để `<img>` phát `load` với kích thước biết trước. */
const png = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#3366cc';
  context.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
};

const image = (name: string, src: string, size?: number): PreviewFile => ({
  fileName: name,
  extension: 'jpg',
  fileSize: size,
  src,
  previewSrc: null,
  isPreviewImage: true,
});

const document_ = (name: string, extension: string, src: string | null, size?: number): PreviewFile => ({
  fileName: name,
  extension,
  fileSize: size,
  src,
  previewSrc: null,
  isPreviewImage: false,
});

// Đợt 3 · 4b (design handoff `upload-file.md`, mục H2 — phương án A).
describe('Upload file viewer (wave 3 · 4b)', () => {
  let fixture: ComponentFixture<PreviewHost>;
  let i18n: I18nService;
  let overlay: HTMLElement;

  const q = <T extends Element = HTMLElement>(selector: string) => overlay.querySelector(selector) as T | null;
  const qa = (selector: string) => Array.from(overlay.querySelectorAll(selector)) as HTMLElement[];
  const viewer = () => q('.sd-upload-file-viewer');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    fixture.detectChanges();
  };
  const loaded = async () => {
    const img = q<HTMLImageElement>('.sd-upload-file-viewer__image');
    if (img && !img.complete) await new Promise(resolve => img.addEventListener('load', resolve, { once: true }));
    await settle();
  };
  const open = async (files: PreviewFile[], start = 0) => {
    fixture.componentInstance.files = files;
    fixture.componentInstance.start = start;
    const opener = fixture.nativeElement.querySelector('.opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await settle();
  };
  const key = (k: string) => {
    viewer()!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const label = (button: HTMLElement | null) => button?.getAttribute('aria-label');
  const toolbar = () => qa('.sd-upload-file-viewer__bar button').map(label);

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [PreviewHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(PreviewHost);
    fixture.detectChanges();
    i18n = TestBed.inject(I18nService);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => {
    fixture.componentInstance.preview().closeViewer();
    overlay.innerHTML = '';
  });

  describe('frame', () => {
    it('opens a CDK dialog, not sd-modal, on the dark viewer colours', async () => {
      await open([image('a.jpg', png(40, 20))]);
      expect(q('.cdk-dialog-container')).not.toBeNull();
      expect(q('sd-modal')).toBeNull();
      const style = getComputedStyle(viewer()!);
      expect(style.backgroundColor).toBe('rgb(20, 21, 24)');
      expect(style.borderTopLeftRadius).toBe('12px');
      expect(q('.cdk-dialog-container')!.getAttribute('aria-labelledby')).toBe(q('.sd-upload-file-viewer__name')!.id);
    });

    it('stacks a 56px top bar, the stage and an 88px filmstrip', async () => {
      await open([image('a.jpg', png(40, 20)), image('b.jpg', png(40, 20))]);
      expect(q('.sd-upload-file-viewer__bar')!.getBoundingClientRect().height).toBe(56);
      expect(q('.sd-upload-file-viewer__strip')!.getBoundingClientRect().height).toBe(88);
      expect(getComputedStyle(q('.sd-upload-file-viewer__stage')!).paddingLeft).toBe('72px');
    });

    it('focuses the stage on open and gives focus back to the opener on close, with Esc', async () => {
      await open([image('a.jpg', png(40, 20))]);
      expect(document.activeElement).toBe(q('.sd-upload-file-viewer__stage'));
      expect(q('.sd-upload-file-viewer__stage')!.getAttribute('tabindex')).toBe('-1');

      // why: CDK Dialog đọc `keyCode` (27) như sự kiện thật của trình duyệt, không đọc `key`.
      q('.sd-upload-file-viewer__stage')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true } as KeyboardEventInit)
      );
      await settle();
      expect(viewer()).toBeNull();
      expect(fixture.componentInstance.closed).toBe(1);
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.opener'));
    });
  });

  describe('top bar', () => {
    it('shows the file name, "{EXT} · {size}" and the position "2 / 3" announced politely', async () => {
      await open([image('a.jpg', png(40, 20)), image('Biên bản bàn giao.jpg', png(40, 20), 1.8 * MB), image('c.jpg', png(40, 20))], 1);
      expect(q('.sd-upload-file-viewer__name')!.textContent!.trim()).toBe('Biên bản bàn giao.jpg');
      expect(q('.sd-upload-file-viewer__meta')!.textContent!.trim()).toBe('JPG · 1,8 MB');
      const position = q('.sd-upload-file-viewer__position')!;
      expect(position.getAttribute('aria-live')).toBe('polite');
      expect(position.textContent).toContain('2 / 3');
    });

    it('hides the position, the arrows and the filmstrip with one file', async () => {
      await open([image('a.jpg', png(40, 20))]);
      expect(q('.sd-upload-file-viewer__position')).toBeNull();
      expect(q('.sd-upload-file-viewer__nav')).toBeNull();
      expect(q('.sd-upload-file-viewer__strip')).toBeNull();
    });

    it('offers zoom, rotate, download and open in a new tab for an image', async () => {
      await open([image('a.jpg', png(40, 20))]);
      await loaded();
      expect(toolbar()).toEqual([
        i18n.t('core.component.upload-file.viewer.zoom-out'),
        i18n.t('core.component.upload-file.viewer.fit'),
        i18n.t('core.component.upload-file.viewer.zoom-in'),
        i18n.t('core.component.upload-file.viewer.rotate'),
        i18n.t('core.component.upload-file.viewer.download'),
        i18n.t('core.component.upload-file.viewer.open-new-tab'),
        i18n.t('core.common.close'),
      ]);
    });

    // why: nút tải xuống từng dùng nhầm key `core.component.upload-file.upload` ("Tải file").
    it('downloads the current file with the download label', async () => {
      const doc = document_('hop-dong.docx', 'docx', '/files/hop-dong.docx');
      await open([doc]);
      const download = qa('.sd-upload-file-viewer__bar button').find(
        b => label(b) === i18n.t('core.component.upload-file.viewer.download')
      )!;
      expect(i18n.t('core.component.upload-file.viewer.download')).not.toBe(i18n.t('core.component.upload-file.upload'));
      download.click();
      expect(fixture.componentInstance.downloaded).toEqual([doc]);
    });
  });

  describe('stage', () => {
    it('shows a PDF inline in an iframe named after the file, without zoom', async () => {
      await open([document_('hop-dong.pdf', 'pdf', 'https://cdn.example.com/hop-dong.pdf')]);
      const frame = q<HTMLIFrameElement>('.sd-upload-file-viewer__frame')!;
      expect(frame).not.toBeNull();
      expect(frame.title).toBe('hop-dong.pdf');
      expect(frame.src).toBe('https://cdn.example.com/hop-dong.pdf');
      expect(getComputedStyle(q('.sd-upload-file-viewer__stage')!).paddingLeft).toBe('0px');
      expect(q('.sd-upload-file-viewer__zoom')).toBeNull();
      expect(toolbar()).toContain(i18n.t('core.component.upload-file.viewer.open-new-tab'));
    });

    it('does not embed a PDF whose URL is not safe', async () => {
      await open([document_('x.pdf', 'pdf', 'javascript:alert(1)')]);
      expect(q('iframe')).toBeNull();
      expect(q('.sd-upload-file-viewer__state')!.textContent).toContain(i18n.t('core.component.upload-file.viewer.no-preview'));
    });

    it('explains a file it cannot show, with Download and Open in a new tab', async () => {
      await open([document_('bang-ke.docx', 'docx', '/files/bang-ke.docx', 640 * 1024)]);
      const state = q('.sd-upload-file-viewer__state')!;
      expect(state.textContent).toContain('bang-ke.docx');
      expect(state.textContent).toContain(`DOCX · 640 KB · ${i18n.t('core.component.upload-file.viewer.no-preview')}`);
      const filled = q('.sd-upload-file-viewer__filled')!;
      expect(filled.getBoundingClientRect().height).toBe(36);
      expect(filled.textContent).toContain(i18n.t('core.component.upload-file.viewer.download'));
      expect(q('.sd-upload-file-viewer__state .sd-upload-file-viewer__text-button')!.textContent).toContain(
        i18n.t('core.component.upload-file.viewer.open-new-tab')
      );
      expect(q('.sd-upload-file-viewer__zoom')).toBeNull();
    });

    it('shows the error state with Retry, which loads the image again', async () => {
      await open([image('a.jpg', 'data:image/png;base64,broken')]);
      const img = q<HTMLImageElement>('.sd-upload-file-viewer__image');
      if (img) await new Promise(resolve => img.addEventListener('error', resolve, { once: true }));
      await settle();
      const state = q('.sd-upload-file-viewer__state')!;
      expect(state.getAttribute('role')).toBe('alert');
      expect(state.textContent).toContain(i18n.t('core.component.upload-file.viewer.load-error'));
      expect(q('.sd-upload-file-viewer__zoom')).withContext('no zoom on an error').toBeNull();

      (q('.sd-upload-file-viewer__outlined') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(q('.sd-upload-file-viewer__image')).withContext('a fresh <img>').not.toBeNull();
    });

    it('shows "loading" only after 150ms', async () => {
      const preview = fixture.componentInstance.preview();
      await open([image('a.jpg', png(40, 20))]);
      preview.retry();
      fixture.detectChanges();
      expect(q('.sd-upload-file-viewer__loading')).toBeNull();
      await new Promise(resolve => setTimeout(resolve, 200));
      if (preview.status() === 'loading') {
        fixture.detectChanges();
        expect(q('.sd-upload-file-viewer__loading')!.getAttribute('role')).toBe('status');
      }
    });
  });

  describe('navigation', () => {
    const files = () => [image('a.jpg', png(40, 20)), document_('b.pdf', 'pdf', '/b.pdf'), image('c.jpg', png(40, 20))];

    it('moves with the arrows and ←/→, disabled at the ends instead of wrapping', async () => {
      await open(files());
      const [prev, next] = qa('.sd-upload-file-viewer__nav') as HTMLButtonElement[];
      expect(prev.disabled).toBe(true);
      next.click();
      fixture.detectChanges();
      expect(q('.sd-upload-file-viewer__name')!.textContent!.trim()).toBe('b.pdf');
      key('ArrowRight');
      key('ArrowRight');
      expect(q('.sd-upload-file-viewer__name')!.textContent!.trim()).withContext('stays on the last file').toBe('c.jpg');
      expect((qa('.sd-upload-file-viewer__nav')[1] as HTMLButtonElement).disabled).toBe(true);
      key('ArrowLeft');
      expect(q('.sd-upload-file-viewer__name')!.textContent!.trim()).toBe('b.pdf');
    });

    it('lists every file in the filmstrip as 56px buttons, the current one marked', async () => {
      await open(files(), 2);
      const thumbs = qa('.sd-upload-file-viewer__thumb');
      expect(thumbs.length).toBe(3);
      expect(thumbs[0].getBoundingClientRect().width).toBe(56);
      expect(thumbs[0].getAttribute('aria-label')).toBe('a.jpg');
      expect(thumbs[2].getAttribute('aria-current')).toBe('true');
      expect(thumbs[0].hasAttribute('aria-current')).toBe(false);
      expect(thumbs[1].querySelector('.sd-upload-file-viewer__ext--pdf')!.textContent!.trim()).toBe('pdf');
      expect(getComputedStyle(thumbs[1].querySelector('.sd-upload-file-viewer__ext')!).textTransform).toBe('uppercase');

      thumbs[0].click();
      fixture.detectChanges();
      expect(q('.sd-upload-file-viewer__name')!.textContent!.trim()).toBe('a.jpg');
    });
  });

  describe('zoom and rotation', () => {
    it('starts fitted, steps through 50 → 400%, comes back with 0, and resets on another file', async () => {
      const preview = fixture.componentInstance.preview();
      await open([image('a.jpg', png(4000, 2000)), image('b.jpg', png(40, 20))]);
      await loaded();
      const fit = preview.percent();
      expect(fit).toBeLessThan(50);
      expect(q('.sd-upload-file-viewer__percent')!.textContent!.trim()).toBe(`${fit}%`);

      key('+');
      expect(preview.percent()).toBe(50);
      key('=');
      expect(preview.percent()).toBe(75);
      key('-');
      expect(preview.percent()).toBe(50);
      key('0');
      expect(preview.zoom()).toBe('fit');

      key('+');
      (q('.sd-upload-file-viewer__percent') as HTMLButtonElement).click();
      expect(preview.zoom()).withContext('the % button fits again').toBe('fit');

      preview.rotate();
      expect(preview.rotation()).toBe(90);
      key('+');
      key('ArrowRight');
      expect(preview.zoom()).toBe('fit');
      expect(preview.rotation()).toBe(0);
    });

    it('draws the fitted image inside the stage padding', async () => {
      await open([image('a.jpg', png(4000, 2000))]);
      await loaded();
      const stage = q('.sd-upload-file-viewer__stage')!.getBoundingClientRect();
      const img = q('.sd-upload-file-viewer__image')!.getBoundingClientRect();
      expect(img.width).toBeLessThanOrEqual(stage.width - 144 + 1);
      expect(img.height).toBeLessThanOrEqual(stage.height - 48 + 1);
    });
  });
});

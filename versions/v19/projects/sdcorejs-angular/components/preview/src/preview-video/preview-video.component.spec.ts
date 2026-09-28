import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdPreviewVideo } from './preview-video.component';

describe('SdPreviewVideo', () => {
  let fixture: ComponentFixture<SdPreviewVideo>;
  let comp: SdPreviewVideo;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const video = (): HTMLVideoElement | null => host().querySelector('video');
  const set = (name: string, value: unknown): void => {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };
  const t = (key: string): string => TestBed.inject(I18nService).t(key);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdPreviewVideo] }).compileComponents();
    fixture = TestBed.createComponent(SdPreviewVideo);
    comp = fixture.componentInstance;
  });

  describe('source', () => {
    it('renders a native video with controls and no autoplay for a URL', () => {
      set('source', 'https://cdn.example.com/clip.mp4');
      const el = video()!;
      expect(el).not.toBeNull();
      expect(el.getAttribute('src')).toBe('https://cdn.example.com/clip.mp4');
      expect(el.hasAttribute('controls')).toBeTrue();
      expect(el.hasAttribute('autoplay')).toBeFalse();
      expect(el.autoplay).toBeFalse();
      expect(el.getAttribute('preload')).toBe('metadata');
    });

    it('plays a Blob through an object URL and revokes it on destroy', () => {
      const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:https://app.example.com/v1');
      const revoke = spyOn(URL, 'revokeObjectURL');
      const blob = new Blob(['x'], { type: 'video/mp4' });

      set('source', blob);
      expect(create).toHaveBeenCalledOnceWith(blob);
      expect(video()!.getAttribute('src')).toBe('blob:https://app.example.com/v1');

      fixture.destroy();
      expect(revoke).toHaveBeenCalledOnceWith('blob:https://app.example.com/v1');
    });

    it('revokes the previous object URL when the source changes', () => {
      spyOn(URL, 'createObjectURL').and.returnValues('blob:https://app.example.com/a', 'blob:https://app.example.com/b');
      const revoke = spyOn(URL, 'revokeObjectURL');

      set('source', new Blob(['a'], { type: 'video/mp4' }));
      set('source', new Blob(['b'], { type: 'video/mp4' }));

      expect(revoke).toHaveBeenCalledOnceWith('blob:https://app.example.com/a');
      expect(video()!.getAttribute('src')).toBe('blob:https://app.example.com/b');
    });

    it('refuses an unsafe URL: no video element, an error message and loadError', () => {
      const errors: unknown[] = [];
      comp.loadError.subscribe(error => errors.push(error));

      set('source', 'javascript:alert(1)');

      expect(video()).toBeNull();
      expect(comp.status()).toBe('error');
      expect(host().querySelector('[role="alert"]')?.textContent).toContain(t('core.component.preview-video.error'));
      expect(errors).toEqual([null]);
    });

    it('shows nothing when there is no source', () => {
      set('source', null);
      expect(video()).toBeNull();
      expect(comp.status()).toBe('empty');
      expect(host().querySelector('button')).toBeNull();
    });
  });

  describe('poster', () => {
    it('applies a safe poster and ignores an unsafe one', () => {
      set('source', 'https://cdn.example.com/clip.mp4');
      set('poster', 'https://cdn.example.com/poster.jpg');
      expect(video()!.getAttribute('poster')).toBe('https://cdn.example.com/poster.jpg');

      set('poster', 'javascript:alert(1)');
      expect(video()!.hasAttribute('poster')).toBeFalse();
    });
  });

  describe('media errors', () => {
    it('shows the i18n error with a retry button that reloads the video', () => {
      set('source', 'https://cdn.example.com/clip.mp4');
      const el = video()!;
      const load = spyOn(el, 'load');

      el.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(comp.status()).toBe('error');
      const alert = host().querySelector('[role="alert"]')!;
      expect(alert.textContent).toContain(t('core.component.preview-video.error'));
      const retry = alert.querySelector('button') as HTMLButtonElement;
      expect(retry.getAttribute('type')).toBe('button');
      expect(retry.textContent?.trim()).toBe(t('core.component.preview-video.retry'));

      retry.click();
      fixture.detectChanges();
      expect(load).toHaveBeenCalledTimes(1);
      expect(comp.status()).toBe('loading');
      expect(host().querySelector('[role="alert"]')).toBeNull();
    });

    it('explains when the browser cannot play the format', () => {
      set('source', 'https://cdn.example.com/clip.mkv');
      const el = video()!;
      Object.defineProperty(el, 'error', { configurable: true, value: { code: 4 } });

      el.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(host().querySelector('[role="alert"]')?.textContent).toContain(t('core.component.preview-video.unsupported'));
    });

    it('marks the video ready once data is loaded', () => {
      set('source', 'https://cdn.example.com/clip.mp4');
      video()!.dispatchEvent(new Event('loadeddata'));
      expect(comp.status()).toBe('ready');
    });
  });

  describe('download', () => {
    it('downloads through SdUtilities.download and emits the file name', () => {
      const download = spyOn(SdUtilities, 'download');
      const emitted: { fileName: string }[] = [];
      comp.download.subscribe(event => emitted.push(event));
      set('source', 'https://cdn.example.com/clip.mp4');
      set('fileName', 'clip.mp4');

      const button = host().querySelector('.sd-preview-video-actions button') as HTMLButtonElement;
      expect(button.textContent?.trim()).toBe(t('core.component.preview-video.download'));
      button.click();

      expect(download).toHaveBeenCalledOnceWith('https://cdn.example.com/clip.mp4', 'clip.mp4');
      expect(emitted).toEqual([{ fileName: 'clip.mp4' }]);
    });

    it('offers no download for a refused URL or when downloadable is false', () => {
      const download = spyOn(SdUtilities, 'download');
      set('source', 'data:text/html,<p>x</p>');
      expect(host().querySelector('.sd-preview-video-actions')).toBeNull();
      comp.downloadFile();
      expect(download).not.toHaveBeenCalled();

      set('source', 'https://cdn.example.com/clip.mp4');
      set('downloadable', false);
      expect(host().querySelector('.sd-preview-video-actions')).toBeNull();
    });
  });

  describe('autoId', () => {
    it('derives the host and child autoIds', () => {
      set('autoId', 'lesson');
      set('source', 'https://cdn.example.com/clip.mp4');
      expect(host().getAttribute('data-autoId')).toBe('components-preview-video-lesson');
      expect(video()!.getAttribute('data-autoId')).toBe('components-preview-video-lesson-video');
      expect(host().querySelector('.sd-preview-video-actions button')!.getAttribute('data-autoId')).toBe(
        'components-preview-video-lesson-download'
      );

      video()!.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(host().querySelector('[role="alert"] button')!.getAttribute('data-autoId')).toBe('components-preview-video-lesson-retry');
    });
  });
});

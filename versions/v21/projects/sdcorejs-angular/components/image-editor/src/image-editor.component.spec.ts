import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdImageEditor } from './image-editor.component';
import {
  BLACK,
  BLUE,
  GREEN,
  RED,
  UPRIGHT,
  WHITE,
  YELLOW,
  bytes,
  canvas,
  corners,
  decode,
  fill,
  gifBlob,
  near,
  pixel,
  quadrantBlob,
  sameCorners,
  toBlob,
  transparentBlob,
  truncatedPng,
  until,
  wait,
  withExifOrientation,
} from './image-editor.fixtures.spec';
import type { SdImageEditorError, SdImageEditorOption, SdImageEditorResult } from './image-editor.model';
import { sdImageEditorFormatBytes } from './image-editor.export';
import { sdImageEditorSniffFormat } from './image-editor.source';

@Component({
  standalone: true,
  imports: [SdImageEditor],
  template: `
    @if (shown()) {
      <div [style.width.px]="width()" style="height: 640px">
        <sd-image-editor [source]="source()" [option]="option()" (failed)="errors.push($event)" />
      </div>
    }
  `,
})
class HostComponent {
  readonly source = signal<Blob | null>(null);
  readonly option = signal<SdImageEditorOption | undefined>({ autoId: 'test' });
  readonly width = signal(1000);
  readonly shown = signal(true);
  readonly editor = viewChild(SdImageEditor);
  readonly errors: SdImageEditorError[] = [];
}

let fixture: ComponentFixture<HostComponent>;
let host: HostComponent;

const id = (suffix: string) => `[data-autoid="components-image-editor-test-${suffix}"]`;

function query<T extends Element = HTMLElement>(selector: string): T | null {
  return (fixture.nativeElement as HTMLElement).querySelector<T>(selector) as T | null;
}

function editor(): SdImageEditor {
  const instance = host.editor();
  if (!instance) throw new Error('editor not rendered');
  return instance;
}

async function setup(source: Blob | null, option: SdImageEditorOption = {}, width = 1000): Promise<void> {
  fixture = TestBed.createComponent(HostComponent);
  host = fixture.componentInstance;
  host.option.set({ autoId: 'test', ...option });
  host.width.set(width);
  host.source.set(source);
  fixture.autoDetectChanges(true);
  fixture.detectChanges();
  if (source) await ready();
}

async function ready(): Promise<void> {
  await until(() => editor().status() === 'ready' || editor().status() === 'error', 5000, 'editor ready');
  fixture.detectChanges();
  await fixture.whenStable();
  // ResizeObserver delivers the stage size asynchronously.
  await until(() => !!query(id('crop')) || editor().status() === 'error', 2000, 'crop box');
  fixture.detectChanges();
}

/** Clicks the inner `<button>` of an `sd-button`. Buttons are throttled 300 ms, so repeated clicks must wait. */
async function click(suffix: string): Promise<void> {
  const button = query<HTMLButtonElement>(`${id(suffix)} button`) ?? query<HTMLButtonElement>(id(suffix));
  if (!button) throw new Error(`no button ${suffix}`);
  button.click();
  fixture.detectChanges();
  await fixture.whenStable();
}

/** What a consumer's own Apply button does. */
async function apply(): Promise<SdImageEditorResult> {
  const result = await editor().getResult();
  fixture.detectChanges();
  return result;
}

async function failureOf(promise: Promise<unknown>): Promise<SdImageEditorError> {
  try {
    await promise;
  } catch (error) {
    return error as SdImageEditorError;
  }
  throw new Error('expected a rejection');
}

function pointer(type: string, target: Element, x: number, y: number, pointerId = 7): void {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, clientX: x, clientY: y, button: 0, buttons: 1, isPrimary: true })
  );
}

/** Drags from the centre of `from` by (dx, dy) CSS pixels. Moves are sent to the stage, which captures the pointer. */
function drag(from: Element, dx: number, dy: number): void {
  const rect = from.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const stage = query(id('stage')) as HTMLElement;
  pointer('pointerdown', from, x, y);
  pointer('pointermove', stage, x + dx / 2, y + dy / 2);
  pointer('pointermove', stage, x + dx, y + dy);
  pointer('pointerup', stage, x + dx, y + dy);
  fixture.detectChanges();
}

function key(target: Element, keyName: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  fixture.detectChanges();
  return event;
}

/** Types into an `sd-input-number` and leaves the field, which is when the editor commits it. */
function setNumber(suffix: string, value: number): void {
  const input = query<HTMLInputElement>(`${id(suffix)} input`);
  if (!input) throw new Error(`no number field ${suffix}`);
  input.focus();
  input.value = String(value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
}

function numberValue(suffix: string): string {
  return query<HTMLInputElement>(`${id(suffix)} input`)?.value ?? '';
}

/** Picks an output format in the `sd-select`, as closing its panel on an option does. */
function selectFormat(format: string): void {
  const select = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect;
  select.valueModel.set(format);
  select.sdChange.emit(format);
  fixture.detectChanges();
}

describe('SdImageEditor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideNoopAnimations()] });
    TestBed.inject(I18nService).setLanguage('en', { reload: false });
  });

  afterEach(() => {
    host?.shown.set(false);
    fixture?.detectChanges();
    fixture?.destroy();
  });

  describe('states', () => {
    it('shows the empty state, has no footer of its own and refuses to export without a source', async () => {
      await setup(null);
      expect(editor().status()).toBe('empty');
      expect(fixture.nativeElement.textContent).toContain('No image');
      expect(query(id('crop'))).toBeNull();
      // Apply / Cancel belong to the consumer.
      expect(query('.footer')).toBeNull();
      expect(query(id('apply'))).toBeNull();
      expect(query(id('cancel'))).toBeNull();
      expect(query<HTMLButtonElement>(`${id('reset')} button`)?.disabled).toBeTrue();
      const failure = await failureOf(editor().getResult());
      expect(failure).toEqual(jasmine.objectContaining({ code: 'not-ready', stage: 'export' }));
      expect(host.errors.length).toBe(0);
    });

    it('loads a PNG and shows its facts', async () => {
      await setup(await quadrantBlob(400, 200));
      expect(editor().sourceInfo()).toEqual(
        jasmine.objectContaining({ mimeType: 'image/png', width: 400, height: 200, hasAlpha: false, exifOrientation: 1 })
      );
      expect(editor().edits()).toEqual({
        flip: false,
        rotate: 0,
        crop: { x: 0, y: 0, width: 400, height: 200 },
        aspectRatio: null,
        resize: null,
      });
      expect(query(id('meta-source'))?.textContent).toContain('400 × 200 px · PNG');
      expect(query(id('meta-output'))?.textContent).toContain('400 × 200 px · PNG');
      const preview = query<HTMLCanvasElement>(id('preview'));
      expect(preview?.width).toBe(400);
      expect(preview?.style.transform).toContain('matrix(');
      expect(query(id('crop'))?.getAttribute('aria-label')).toContain('400 × 200');
    });

    it('uses the Core floating label for the number fields and the format, and one label style for the rest', async () => {
      await setup(await quadrantBlob(400, 200));
      const floating: [string, string][] = [
        ['crop-x', 'X'],
        ['crop-y', 'Y'],
        ['crop-width', 'Width'],
        ['crop-height', 'Height'],
        ['output-width', 'Width'],
        ['output-height', 'Height'],
        ['format', 'Format'],
      ];
      for (const [suffix, text] of floating) {
        expect(query(`${id(suffix)} mat-label`)?.textContent?.trim())
          .withContext(suffix)
          .toBe(text);
      }
      expect(query('label.prop-label')).toBeNull();
      // The format always has a value: no clear button and no required asterisk.
      const marker = query(`${id('format')} .mat-mdc-form-field-required-marker`) as HTMLElement;
      expect(marker).not.toBeNull();
      expect(getComputedStyle(marker).display).toBe('none');
      const labels = Array.from(fixture.nativeElement.querySelectorAll('.prop-label, .meta-row dt')) as HTMLElement[];
      const styles = new Set(
        labels.map(el => {
          const cs = getComputedStyle(el);
          return `${cs.fontSize}|${cs.fontWeight}|${cs.lineHeight}|${cs.color}`;
        })
      );
      expect(labels.length).toBeGreaterThanOrEqual(4);
      expect(styles.size).toBe(1);
    });

    it('reports an unsupported file clearly and does not decode it', async () => {
      await setup(gifBlob());
      expect(editor().status()).toBe('error');
      expect(host.errors.length).toBe(1);
      expect(host.errors[0]).toEqual(jasmine.objectContaining({ code: 'unsupported-format', stage: 'load' }));
      expect(query(id('error'))?.textContent).toContain('Only JPEG, PNG and WebP');
      expect((await failureOf(editor().getResult())).code).toBe('not-ready');
    });

    it('enforces the source limits before decoding', async () => {
      const source = await quadrantBlob(400, 200);
      const decodeSpy = spyOn(window, 'createImageBitmap').and.callThrough();
      await setup(source, { limits: { maxSourcePixels: 1000 } });
      expect(host.errors[0]?.code).toBe('source-too-many-pixels');
      expect(host.errors[0]?.message).toContain('400 × 200');
      expect(decodeSpy).not.toHaveBeenCalled();
    });

    it('reports a corrupt file', async () => {
      await setup(await truncatedPng());
      expect(host.errors[0]?.code).toBe('decode-failed');
      expect(query(id('error'))?.textContent).toContain('could not be read');
    });

    it('centres the image while an ancestor is scaled, as during a modal opening animation', async () => {
      const source = await quadrantBlob(400, 200);
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      host.option.set({ autoId: 'test' });
      fixture.autoDetectChanges(true);
      fixture.detectChanges();
      const wrapper = fixture.nativeElement.querySelector('div') as HTMLElement;
      wrapper.style.transform = 'scale(0.5)';
      wrapper.style.transformOrigin = '0 0';
      host.source.set(source);
      await ready();
      const stage = query(id('stage')) as HTMLElement;
      const crop = query(id('crop')) as HTMLElement;
      const scale = Math.min((stage.clientWidth - 48) / 400, (stage.clientHeight - 48) / 200);
      expect(parseFloat(crop.style.left)).toBeCloseTo(stage.clientWidth / 2 - (400 * scale) / 2, 0);
      expect(parseFloat(crop.style.width)).toBeCloseTo(400 * scale, 0);
      // A pointer drag measured in screen pixels is converted back to stage pixels.
      drag(query(id('handle-e')) as HTMLElement, -50 * scale * 0.5, 0);
      expect(editor().edits()?.crop.width).toBeCloseTo(350, -1);
    });

    it('switches to the compact layout in a narrow container', async () => {
      await setup(await quadrantBlob(40, 20), {}, 480);
      await until(
        () => (fixture.nativeElement.querySelector('sd-image-editor') as HTMLElement).classList.contains('sd-image-editor--compact'),
        2000,
        'compact'
      );
      const stage = query(id('stage')) as HTMLElement;
      const crop = query(id('crop')) as HTMLElement;
      const panel = fixture.nativeElement.querySelector('.panel') as HTMLElement;
      // The panel goes below the stage instead of covering the crop area.
      expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(stage.getBoundingClientRect().bottom - 1);
      expect(crop.getBoundingClientRect().bottom).toBeLessThanOrEqual(stage.getBoundingClientRect().bottom + 1);
      // In the fixed 640 px container the editor stays inside it and its body scrolls.
      const wrapper = fixture.nativeElement.querySelector('div') as HTMLElement;
      const hostElement = fixture.nativeElement.querySelector('sd-image-editor') as HTMLElement;
      const body = fixture.nativeElement.querySelector('.body') as HTMLElement;
      expect(hostElement.getBoundingClientRect().bottom).toBeLessThanOrEqual(wrapper.getBoundingClientRect().bottom + 2);
      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    });
  });

  describe('export', () => {
    it('rotates, crops, resizes and applies from the real source pixels', async () => {
      const source = await quadrantBlob(400, 200);
      const original = await bytes(source, source.size);
      await setup(source);
      await click('rotate-right');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ rotate: 90, crop: { x: 0, y: 0, width: 200, height: 400 } }));
      // Keep the top half of the rotated image: blue (left) and red (right).
      setNumber('crop-height', 200);
      expect(editor().edits()?.crop).toEqual({ x: 0, y: 0, width: 200, height: 200 });
      setNumber('output-width', 100);
      expect(numberValue('output-height')).toBe('100');
      const result = await apply();
      expect([result.width, result.height]).toEqual([100, 100]);
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBe(result.blob.size);
      expect(sdImageEditorSniffFormat(await bytes(result.blob))).toBe('image/png');
      const decoded = await decode(result.blob);
      expect([decoded.width, decoded.height]).toEqual([100, 100]);
      expect(near(pixel(decoded, 20, 50), BLUE)).toBeTrue();
      expect(near(pixel(decoded, 80, 50), RED)).toBeTrue();
      // The source was never modified.
      expect(await bytes(source, source.size)).toEqual(original);
    });

    it('produces what the preview shows after flips in either order', async () => {
      await setup(await quadrantBlob(40, 20));
      await click('flip-vertical');
      await click('rotate-right');
      const a = await decode((await apply()).blob);
      expect(sameCorners(corners(a), { tl: RED, tr: BLUE, bl: GREEN, br: YELLOW }, 0)).toBeTrue();
      // Stored as a mirror plus a 270° turn — the transpose of the source.
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: true, rotate: 270 }));
    });

    it('ignores zoom and pan in the exported image', async () => {
      await setup(await quadrantBlob(400, 200));
      const fitZoom = query(id('zoom-value'))?.textContent;
      const fitTransform = query<HTMLCanvasElement>(id('preview'))?.style.transform;
      await click('zoom-in');
      await wait(320);
      await click('zoom-in');
      const stage = query(id('stage')) as HTMLElement;
      const rect = stage.getBoundingClientRect();
      // Pan by dragging the stage itself (not the crop box).
      pointer('pointerdown', stage, rect.left + 4, rect.top + 4);
      pointer('pointermove', stage, rect.left + 60, rect.top + 40);
      pointer('pointerup', stage, rect.left + 60, rect.top + 40);
      fixture.detectChanges();
      expect(query(id('zoom-value'))?.textContent).not.toBe(fitZoom);
      expect(query<HTMLCanvasElement>(id('preview'))?.style.transform).not.toBe(fitTransform);
      // A crop across the four quadrants, typed while zoomed in, never encoded before.
      setNumber('crop-width', 100);
      setNumber('crop-height', 100);
      setNumber('crop-x', 150);
      setNumber('crop-y', 50);
      const result = await apply();
      expect(result.edits.crop).toEqual({ x: 150, y: 50, width: 100, height: 100 });
      expect([result.width, result.height]).toEqual([100, 100]);
      const decoded = await decode(result.blob);
      expect(pixel(decoded, 49, 10)).toEqual(RED);
      expect(pixel(decoded, 50, 10)).toEqual(GREEN);
      expect(pixel(decoded, 10, 49)).toEqual(RED);
      expect(pixel(decoded, 10, 50)).toEqual(BLUE);
      expect(pixel(decoded, 90, 90)).toEqual(YELLOW);
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: false, rotate: 0, resize: null }));
    });

    it('exports from the full-resolution source, not the downscaled preview', async () => {
      // 2400 × 2000 is above the 4 MP preview budget; a 1 px black line only survives a full-resolution export.
      const element = canvas(2400, 2000, ctx => {
        fill(ctx, WHITE, 0, 0, 2400, 2000);
        fill(ctx, BLACK, 1201, 0, 1, 2000);
      });
      await setup(await toBlob(element));
      const preview = query<HTMLCanvasElement>(id('preview')) as HTMLCanvasElement;
      expect(preview.width).toBeLessThan(2400);
      const result = await apply();
      expect([result.width, result.height]).toEqual([2400, 2000]);
      const decoded = await decode(result.blob);
      expect(pixel(decoded, 1201, 1000)).toEqual(BLACK);
      expect(pixel(decoded, 1200, 1000)).toEqual(WHITE);
      expect(pixel(decoded, 1202, 1000)).toEqual(WHITE);
    });

    it('does not rotate an EXIF-oriented photo twice', async () => {
      await setup(await withExifOrientation(await quadrantBlob(40, 20, 'image/jpeg'), 6));
      expect(editor().sourceInfo()).toEqual(
        jasmine.objectContaining({ width: 20, height: 40, exifOrientation: 6, mimeType: 'image/jpeg' })
      );
      const result = await apply();
      expect(result.mimeType).toBe('image/jpeg');
      const decoded = await decode(result.blob);
      expect([decoded.width, decoded.height]).toEqual([20, 40]);
      expect(sameCorners(corners(decoded), { tl: UPRIGHT.bl, tr: UPRIGHT.tl, bl: UPRIGHT.br, br: UPRIGHT.tr }, 48)).toBeTrue();
    });

    it('flattens transparency on a JPEG background and keeps it in PNG', async () => {
      await setup(await transparentBlob(20, 10), { output: { background: 'rgb(0, 0, 255)' } });
      expect(query(id('background'))).toBeNull();
      expect(query(id('quality'))).toBeNull();
      const png = await decode((await apply()).blob);
      expect(pixel(png, 2, 5)[3]).toBe(0);
      selectFormat('image/jpeg');
      expect(query(id('background'))).not.toBeNull();
      expect(query(id('quality'))).not.toBeNull();
      const result = await apply();
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.quality).toBeCloseTo(0.92, 5);
      const jpeg = await decode(result.blob);
      expect(near(pixel(jpeg, 2, 5), BLUE, 16)).toBeTrue();
      expect(near(pixel(jpeg, 15, 5), RED, 16)).toBeTrue();
    });

    it('returns a File named after the real format when the source is a File', async () => {
      const png = await quadrantBlob(40, 20);
      await setup(new File([png], 'holiday.png', { type: 'image/png' }), { output: { format: 'image/jpeg' } });
      const result = await apply();
      expect(result.file).toBeInstanceOf(File);
      expect(result.blob).toBe(result.file as File);
      expect(result.fileName).toBe('holiday.jpg');
      expect(result.file?.name).toBe('holiday.jpg');
      expect(result.file?.type).toBe('image/jpeg');
    });

    it('returns a plain Blob for a Blob source unless a File is requested', async () => {
      await setup(await quadrantBlob(40, 20));
      const blobResult = await apply();
      expect(blobResult.file).toBeNull();
      expect(blobResult.blob instanceof File).toBeFalse();
      expect(blobResult.fileName).toBe('image.png');
      host.option.set({ autoId: 'test', output: { resultType: 'file', fileName: 'avatar' } });
      fixture.detectChanges();
      const fileResult = await apply();
      expect(fileResult.file?.name).toBe('avatar.png');
    });

    it('scales to the default output box and reports limits', async () => {
      await setup(await quadrantBlob(400, 200), { output: { width: 100 } });
      let result = await apply();
      expect([result.width, result.height, result.sizeLimited]).toEqual([100, 50, false]);
      host.option.set({ autoId: 'test', limits: { maxOutputPixels: 5000 } });
      fixture.detectChanges();
      expect(query(id('limited'))).not.toBeNull();
      result = await apply();
      expect(result.sizeLimited).toBeTrue();
      expect(result.width * result.height).toBeLessThanOrEqual(5000);
    });

    it('never upscales a typed size unless allowed', async () => {
      await setup(await quadrantBlob(40, 20));
      setNumber('output-width', 400);
      expect(editor().edits()?.resize).toEqual({ width: 40, height: 20 });
      expect(fixture.nativeElement.textContent).toContain('Reduced to 40 × 20 px');
    });

    it('shows the real encoded size and reuses that encoding on Apply', async () => {
      await setup(await quadrantBlob(400, 200));
      await until(() => /\d+(\.\d+)? (B|KB)/.test(query(id('meta-size'))?.textContent ?? ''), 3000, 'size');
      const encodes = spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callThrough();
      const result = await apply();
      expect(encodes).not.toHaveBeenCalled();
      expect(query(id('meta-size'))?.textContent?.trim()).toBe(sdImageEditorFormatBytes(result.size, 'en-US'));
    });

    it('rejects getResult() on an encoding failure, shows it and stays editable', async () => {
      await setup(await quadrantBlob(40, 20));
      spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake((callback: BlobCallback) => callback(null));
      // Change the output so no cached encoding can be reused.
      setNumber('output-width', 20);
      const failure = await failureOf(editor().getResult());
      fixture.detectChanges();
      expect(failure).toEqual(jasmine.objectContaining({ code: 'encode-failed', stage: 'export' }));
      expect(host.errors.length).toBe(0);
      expect(editor().status()).toBe('ready');
      expect(editor().error()?.code).toBe('encode-failed');
      expect(query(id('export-error'))?.textContent).toContain('could not be created');
    });

    it('offers getFile(), getBlob() and shares one encoding between concurrent calls', async () => {
      await setup(await quadrantBlob(40, 20));
      setNumber('output-width', 20);
      const first = editor().getResult();
      const second = editor().getResult();
      expect(second).toBe(first);
      expect(editor().status()).toBe('exporting');
      const result = await first;
      expect(editor().status()).toBe('ready');
      const file = await editor().getFile('receipt-0042.heic');
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('receipt-0042.png');
      expect(file.type).toBe('image/png');
      expect(file.size).toBe(result.size);
      expect((await editor().getFile()).name).toBe('image.png');
      const blob = await editor().getBlob();
      expect([...(await bytes(blob, blob.size))]).toEqual([...(await bytes(result.blob, result.blob.size))]);
    });

    it('rejects a result whose source was replaced while encoding', async () => {
      await setup(await quadrantBlob(40, 20));
      const replacement = await quadrantBlob(60, 30);
      setNumber('output-width', 30);
      const native = HTMLCanvasElement.prototype.toBlob;
      spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake(function (
        this: HTMLCanvasElement,
        callback: BlobCallback,
        type?: string,
        q?: number
      ) {
        setTimeout(() => native.call(this, callback, type, q), 150);
      });
      const pending = editor().getResult();
      host.source.set(replacement);
      fixture.detectChanges();
      expect((await failureOf(pending)).code).toBe('not-ready');
      await ready();
      expect(editor().sourceInfo()?.width).toBe(60);
    });
  });

  describe('editing', () => {
    it('moves and resizes the crop with the pointer, staying inside the image', async () => {
      await setup(await quadrantBlob(400, 200));
      const crop = query(id('crop')) as HTMLElement;
      drag(query(id('handle-se')) as HTMLElement, -2000, -2000);
      const small = editor().edits()?.crop;
      expect(small?.x).toBe(0);
      expect(small?.width).toBeGreaterThan(0);
      expect(small?.width).toBeLessThan(400);
      drag(crop, 5000, 5000);
      const moved = editor().edits()?.crop;
      expect(moved && moved.x + moved.width).toBe(400);
      expect(moved && moved.y + moved.height).toBe(200);
      expect(editor().canUndo()).toBeTrue();
    });

    it('keeps a ratio fixed by the application while dragging, with the keep-ratio toggle disabled', async () => {
      await setup(await quadrantBlob(400, 200), { aspectRatio: 1, lockAspectRatio: true });
      expect(query(id('ratio-1-1'))).toBeNull();
      const toggle = query<HTMLButtonElement>(id('keep-ratio')) as HTMLButtonElement;
      expect(toggle.disabled).toBeTrue();
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
      // The reason is a tooltip on the info icon next to the label, not a text line in the panel.
      expect(fixture.nativeElement.textContent).not.toContain('Ratio fixed by the application');
      const info = query<HTMLButtonElement>(id('ratio-fixed-info')) as HTMLButtonElement;
      expect(info.getAttribute('aria-label')).toBe('Ratio fixed by the application');
      info.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      fixture.detectChanges();
      const bubble = document.querySelector('.c-sd-tooltip-container') as HTMLElement;
      expect(bubble?.textContent?.trim()).toBe('Ratio fixed by the application');
      expect(info.getAttribute('aria-describedby')).toBe(bubble.id);
      info.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      fixture.detectChanges();
      expect(editor().edits()?.crop).toEqual({ x: 100, y: 0, width: 200, height: 200 });
      drag(query(id('handle-nw')) as HTMLElement, 60, 10);
      const crop = editor().edits()?.crop;
      expect(crop?.width).toBe(crop?.height);
      expect(crop && crop.x + crop.width).toBe(300);
    });

    it('frees the crop when keep ratio is turned off, and locks the current shape when turned on', async () => {
      await setup(await quadrantBlob(400, 200), { aspectRatio: 1 });
      const toggle = query<HTMLButtonElement>(id('keep-ratio')) as HTMLButtonElement;
      expect(toggle.disabled).toBeFalse();
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
      expect(query(id('ratio-value'))?.textContent).toContain('1:1');
      expect(query(id('ratio-fixed-info'))).toBeNull();
      // Off: the east handle only changes the width.
      toggle.click();
      fixture.detectChanges();
      expect(editor().edits()?.aspectRatio).toBeNull();
      expect(toggle.getAttribute('aria-pressed')).toBe('false');
      expect(query(id('ratio-0-free'))?.getAttribute('aria-pressed')).toBe('true');
      drag(query(id('handle-w')) as HTMLElement, 60, 0);
      const free = editor().edits()?.crop;
      expect(free?.height).toBe(200);
      expect(free?.width).toBeLessThan(200);
      // Typing a width no longer changes the height either.
      setNumber('crop-width', 150);
      expect(editor().edits()?.crop.height).toBe(200);
      // On again: the current 150 × 200 shape is kept while dragging.
      toggle.click();
      fixture.detectChanges();
      expect(editor().edits()?.aspectRatio).toBeCloseTo(0.75, 9);
      drag(query(id('handle-se')) as HTMLElement, -40, 0);
      const locked = editor().edits()?.crop;
      expect(locked && locked.width / locked.height).toBeCloseTo(0.75, 1);
      expect(locked?.height).toBeLessThan(200);
      // The output size always follows the crop ratio: the image is never stretched.
      setNumber('output-height', 100);
      expect(editor().edits()?.resize).toEqual({ width: 75, height: 100 });
    });

    it('edits the crop from the keyboard, merging quick nudges into one undo step', async () => {
      await setup(await quadrantBlob(400, 200));
      setNumber('crop-width', 100);
      setNumber('crop-height', 100);
      const crop = query(id('crop')) as HTMLElement;
      crop.focus();
      key(crop, 'ArrowRight');
      key(crop, 'ArrowRight', { shiftKey: true });
      key(crop, 'ArrowDown');
      expect(editor().edits()?.crop).toEqual({ x: 11, y: 1, width: 100, height: 100 });
      key(crop, 'ArrowLeft', { ctrlKey: true });
      expect(editor().edits()?.crop).toEqual({ x: 11, y: 1, width: 99, height: 100 });
      editor().undo();
      expect(editor().edits()?.crop).toEqual({ x: 11, y: 1, width: 100, height: 100 });
      editor().undo();
      expect(editor().edits()?.crop).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    });

    it('applies a ratio chip around the crop centre', async () => {
      await setup(await quadrantBlob(400, 200));
      await click('ratio-1-1');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ aspectRatio: 1, crop: { x: 100, y: 0, width: 200, height: 200 } }));
      expect(query(id('ratio-1-1'))?.getAttribute('aria-pressed')).toBe('true');
      setNumber('crop-width', 100);
      expect(editor().edits()?.crop).toEqual({ x: 150, y: 50, width: 100, height: 100 });
    });

    it('undoes, redoes and resets, from buttons and shortcuts', async () => {
      await setup(await quadrantBlob(40, 20));
      await click('rotate-right');
      await click('flip-horizontal');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: true, rotate: 270 }));
      await click('undo');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: false, rotate: 90 }));
      await click('redo');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: true, rotate: 270 }));
      const stage = query(id('stage')) as HTMLElement;
      expect(key(stage, 'z', { ctrlKey: true }).defaultPrevented).toBeTrue();
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: false, rotate: 90 }));
      key(stage, 'z', { ctrlKey: true, shiftKey: true });
      expect(editor().edits()?.rotate).toBe(270);
      await click('reset');
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: false, rotate: 0 }));
      expect(editor().dirty()).toBeFalse();
      // Reset is itself undoable.
      key(stage, 'y', { ctrlKey: true });
      expect(editor().edits()?.rotate).toBe(0);
      key(stage, 'z', { metaKey: true });
      expect(editor().edits()?.rotate).toBe(270);
    });

    it('leaves Ctrl+Z to a focused number field', async () => {
      await setup(await quadrantBlob(40, 20));
      await click('rotate-right');
      const input = query<HTMLInputElement>(`${id('crop-x')} input`) as HTMLInputElement;
      input.focus();
      key(input, 'z', { ctrlKey: true });
      // The field keeps the shortcut; the editor history is untouched.
      expect(editor().edits()?.rotate).toBe(90);
      expect(editor().canUndo()).toBeTrue();
    });

    it("exposes rotate(), flip() and reset() for the consumer's own controls", async () => {
      await setup(await quadrantBlob(40, 20));
      editor().rotate('right');
      editor().flip('vertical');
      // Rotated right (blue, red / yellow, green) then mirrored top ↔ bottom.
      expect(editor().edits()).toEqual(jasmine.objectContaining({ flip: true, rotate: 90 }));
      expect(editor().dirty()).toBeTrue();
      const moved = await decode((await apply()).blob);
      expect(sameCorners(corners(moved), { tl: YELLOW, tr: GREEN, bl: BLUE, br: RED }, 0)).toBeTrue();
      editor().reset();
      expect(editor().dirty()).toBeFalse();
      editor().rotate('left');
      expect(editor().edits()?.rotate).toBe(270);
      editor().undo();
      expect(editor().edits()?.rotate).toBe(0);
    });
  });

  describe('lifecycle', () => {
    it('keeps the newest source when an older one finishes decoding later', async () => {
      const first = await quadrantBlob(40, 20);
      const second = await quadrantBlob(60, 30);
      const native = window.createImageBitmap.bind(window) as (...args: unknown[]) => Promise<ImageBitmap>;
      let release!: () => void;
      const gate = new Promise<void>(resolve => (release = resolve));
      const closed: ImageBitmap[] = [];
      const close = ImageBitmap.prototype.close;
      spyOn(ImageBitmap.prototype, 'close').and.callFake(function (this: ImageBitmap) {
        closed.push(this);
        close.call(this);
      });
      let slow: ImageBitmap | null = null;
      spyOn(window, 'createImageBitmap').and.callFake(((...args: unknown[]) => {
        if (args[0] === first) {
          return gate.then(async () => (slow = await native(...args)));
        }
        return native(...args);
      }) as typeof window.createImageBitmap);
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      host.source.set(first);
      fixture.autoDetectChanges(true);
      fixture.detectChanges();
      await wait(20);
      host.source.set(second);
      fixture.detectChanges();
      await until(() => editor().status() === 'ready' && editor().sourceInfo()?.width === 60, 5000, 'second source');
      release();
      await until(() => slow !== null, 2000, 'stale decode');
      await wait(20);
      expect(editor().sourceInfo()?.width).toBe(60);
      expect(closed).toContain(slow as unknown as ImageBitmap);
    });

    it('releases every bitmap after opening and closing the editor repeatedly', async () => {
      const created: ImageBitmap[] = [];
      const closed = new Set<ImageBitmap>();
      const native = window.createImageBitmap.bind(window) as (...args: unknown[]) => Promise<ImageBitmap>;
      spyOn(window, 'createImageBitmap').and.callFake(((...args: unknown[]) =>
        native(...args).then(bitmap => {
          created.push(bitmap);
          return bitmap;
        })) as typeof window.createImageBitmap);
      const close = ImageBitmap.prototype.close;
      spyOn(ImageBitmap.prototype, 'close').and.callFake(function (this: ImageBitmap) {
        closed.add(this);
        close.call(this);
      });
      const source = await quadrantBlob(40, 20);
      await setup(source);
      for (let i = 0; i < 4; i++) {
        host.shown.set(false);
        fixture.detectChanges();
        host.shown.set(true);
        fixture.detectChanges();
        await ready();
      }
      host.shown.set(false);
      fixture.detectChanges();
      await wait(700);
      expect(created.length).toBe(5);
      expect(created.every(bitmap => closed.has(bitmap))).toBeTrue();
      expect(host.errors.length).toBe(0);
    });

    it('releases a bitmap that finishes decoding after the editor was destroyed', async () => {
      const source = await quadrantBlob(40, 20);
      const native = window.createImageBitmap.bind(window) as (...args: unknown[]) => Promise<ImageBitmap>;
      let release!: () => void;
      const gate = new Promise<void>(resolve => (release = resolve));
      let late: ImageBitmap | null = null;
      spyOn(window, 'createImageBitmap').and.callFake(((...args: unknown[]) =>
        gate.then(async () => (late = await native(...args)))) as typeof window.createImageBitmap);
      const close = spyOn(ImageBitmap.prototype, 'close').and.callThrough();
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      host.source.set(source);
      fixture.autoDetectChanges(true);
      fixture.detectChanges();
      await wait(20);
      host.shown.set(false);
      fixture.detectChanges();
      release();
      await until(() => late !== null, 2000, 'late decode');
      await wait(20);
      expect(close.calls.all().some(call => call.object === late)).toBeTrue();
      expect(host.errors.length).toBe(0);
    });
  });
});

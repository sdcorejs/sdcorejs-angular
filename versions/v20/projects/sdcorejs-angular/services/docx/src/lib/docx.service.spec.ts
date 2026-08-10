/**
 * SdDocxService spec
 *
 * Nguyên tắc: MỌI test dưới đây chạy code thật của `convertToHtml` /
 * `convertToHtmlString` / `open()`.
 *
 * Ranh giới duy nhất bị stub là `loadPandocInstance()` — `fetch(pandoc.wasm)` +
 * `WebAssembly.instantiate` không chạy được trong Karma (không network, không
 * binary ~50MB trong CI). Mọi thứ khác — merge option, phân nhánh
 * File/Blob/ArrayBuffer, validate định dạng, validate kích thước, dựng option
 * pandoc, map kết quả, nhánh catch — đều là code thật.
 *
 * Lịch sử: bản trước dùng `installConversionSpy()` để `spyOn(service, 'convertToHtml')`
 * rồi `callFake` chép lại y hệt các nhánh validate. 12 `it()` chỉ test chính đoạn
 * fake trong spec, không chạy một dòng nào của service. Đừng quay lại pattern đó:
 * stub ở ranh giới KHÔNG mock được, không bao giờ stub chính method đang test.
 */

import { TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';

import { SdDocxService } from './docx.service';
import { PandocConvertResult, PandocInstance } from './pandoc-core';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, sizeBytes = 32): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: 'application/octet-stream',
  });
}

function makeBlob(bytes = 64): Blob {
  return new Blob([new Uint8Array(bytes)]);
}

function makePandocResult(overrides: Partial<PandocConvertResult> = {}): PandocConvertResult {
  return {
    stdout: '<html><body>converted</body></html>',
    stderr: '',
    warnings: [],
    files: {},
    mediaFiles: {},
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SdDocxService', () => {
  let service: SdDocxService;
  let notifyService: jasmine.SpyObj<SdNotifyService>;
  let loadingService: jasmine.SpyObj<SdLoadingService>;
  let i18n: I18nService;

  /** Spy cho `PandocInstance.convert` — WASM boundary, không mock được thật. */
  let convertSpy: jasmine.Spy<PandocInstance['convert']>;
  /** Spy cho loader: đếm số lần thực sự nạp WASM (verify memo hoá). */
  let loadSpy: jasmine.Spy;

  /**
   * Thay ranh giới WASM bằng một `PandocInstance` giả.
   * KHÔNG đụng tới `convertToHtml` — method đó chạy code thật.
   */
  function stubWasmBoundary(result: PandocConvertResult = makePandocResult()): void {
    convertSpy = jasmine.createSpy('convert').and.resolveTo(result) as jasmine.Spy<PandocInstance['convert']>;
    loadSpy = spyOn(service as any, 'loadPandocInstance').and.resolveTo({ convert: convertSpy } as PandocInstance);
  }

  /** Đọc lại đúng chuỗi i18n mà service dùng, thay vì hard-code tiếng Việt vào spec. */
  function t(key: string): string {
    return i18n.t(key);
  }

  beforeEach(() => {
    notifyService = jasmine.createSpyObj<SdNotifyService>('SdNotifyService', ['error', 'success', 'info', 'warning']);

    loadingService = jasmine.createSpyObj<SdLoadingService>('SdLoadingService', ['start', 'stop']);

    TestBed.configureTestingModule({
      providers: [
        SdDocxService,
        { provide: SdNotifyService, useValue: notifyService },
        { provide: SdLoadingService, useValue: loadingService },
      ],
    });

    service = TestBed.inject(SdDocxService);
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => {
    document.body.querySelectorAll('input[type="file"]').forEach(el => el.remove());
  });

  // ─── 1. Instantiation ───────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── 2. convertToHtml — valid extensions reach pandoc ───────────────────────

  it('converts a .docx file and maps pandoc stdout onto "html"', async () => {
    stubWasmBoundary(makePandocResult({ stdout: '<html>xin chào</html>' }));
    const file = makeFile('template.docx');

    const result = await service.convertToHtml(file);

    expect(result).toEqual({ html: '<html>xin chào</html>', messages: [] });
    expect(notifyService.error).not.toHaveBeenCalled();
    expect(convertSpy).toHaveBeenCalledTimes(1);
  });

  it('converts a .doc file (uppercase extension included)', async () => {
    stubWasmBoundary();

    await expectAsync(service.convertToHtml(makeFile('template.DOC'))).toBeResolvedTo({
      html: '<html><body>converted</body></html>',
      messages: [],
    });
    expect(notifyService.error).not.toHaveBeenCalled();
  });

  it('passes the documented pandoc options and mounts the input at document.docx', async () => {
    stubWasmBoundary();
    const file = makeFile('template.docx');

    await service.convertToHtml(file);

    const [options, stdin, files] = convertSpy.calls.mostRecent().args;
    expect(options).toEqual({
      from: 'docx',
      to: 'html',
      'input-files': ['document.docx'],
      standalone: true,
      'embed-resources': true,
    });
    expect(stdin).toBeNull();
    // File là Blob nên được truyền thẳng, không copy.
    expect(files['document.docx']).toBe(file);
  });

  it('stringifies pandoc warnings into "messages"', async () => {
    stubWasmBoundary(makePandocResult({ warnings: [{ toString: () => 'w1' }, 'w2'] }));

    const result = await service.convertToHtml(makeFile('a.docx'));

    expect(result!.messages).toEqual(['w1', 'w2']);
  });

  it('loads the pandoc instance once and reuses it across calls', async () => {
    stubWasmBoundary();

    await service.convertToHtml(makeFile('one.docx'));
    await service.convertToHtml(makeFile('two.docx'));

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(convertSpy).toHaveBeenCalledTimes(2);
  });

  // ─── 3. convertToHtml — format validation (short-circuits before WASM) ──────

  it('returns null and notifies for a .pdf File, without touching pandoc', async () => {
    stubWasmBoundary();

    const result = await service.convertToHtml(makeFile('report.pdf'));

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.invalid-format'));
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('rejects a file whose name merely contains ".docx" mid-string', async () => {
    stubWasmBoundary();

    const result = await service.convertToHtml(makeFile('template.docx.exe'));

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.invalid-format'));
  });

  it('skips the format check when validateFormat is false', async () => {
    stubWasmBoundary();

    const result = await service.convertToHtml(makeFile('data.txt'), { validateFormat: false });

    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
    expect(convertSpy).toHaveBeenCalledTimes(1);
  });

  // ─── 4. convertToHtml — size validation (short-circuits before WASM) ────────

  it('returns null and notifies when the file exceeds the 50 MB default', async () => {
    stubWasmBoundary();
    const file = makeFile('huge.docx');
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });

    const result = await service.convertToHtml(file);

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.size-exceeded'));
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('accepts a file sitting exactly on the size limit', async () => {
    stubWasmBoundary();
    const file = makeFile('exact.docx');
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });

    const result = await service.convertToHtml(file, { maxSizeInMb: 2 });

    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
  });

  it('respects a custom maxSizeInMb option', async () => {
    stubWasmBoundary();
    const file = makeFile('medium.docx');
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5 MB > 2 MB limit

    const result = await service.convertToHtml(file, { maxSizeInMb: 2 });

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.size-exceeded'));
  });

  it('skips the size check when validateSize is false', async () => {
    stubWasmBoundary();
    const file = makeFile('huge.docx');
    Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });

    const result = await service.convertToHtml(file, { validateSize: false });

    expect(result).not.toBeNull();
    expect(convertSpy).toHaveBeenCalledTimes(1);
  });

  // ─── 5. Blob / ArrayBuffer inputs ───────────────────────────────────────────

  it('accepts a Blob input, skips format validation and forwards the blob as-is', async () => {
    stubWasmBoundary();
    const blob = makeBlob();

    const result = await service.convertToHtml(blob);

    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
    expect(convertSpy.calls.mostRecent().args[2]['document.docx']).toBe(blob);
  });

  it('still size-checks a Blob input', async () => {
    stubWasmBoundary();
    const blob = new Blob([new Uint8Array(4096)]);

    const result = await service.convertToHtml(blob, { maxSizeInMb: 0.001 }); // 1024 bytes

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.size-exceeded'));
  });

  it('wraps an ArrayBuffer input into a docx-typed Blob and skips both checks', async () => {
    stubWasmBoundary();

    const result = await service.convertToHtml(new ArrayBuffer(64));

    expect(result).not.toBeNull();
    const forwarded = convertSpy.calls.mostRecent().args[2]['document.docx'] as Blob;
    expect(forwarded instanceof Blob).toBeTrue();
    expect(forwarded.type).toBe(DOCX_MIME);
    expect(forwarded.size).toBe(64);
  });

  // ─── 6. Failure handling ────────────────────────────────────────────────────

  it('returns null and notifies when loading the pandoc instance fails', async () => {
    spyOn(console, 'error');
    spyOn(service as any, 'loadPandocInstance').and.rejectWith(new Error('Failed to fetch pandoc.wasm: 404 Not Found'));

    const result = await service.convertToHtml(makeFile('template.docx'));

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.convert-error'));
  });

  it('returns null and notifies when pandoc conversion throws', async () => {
    spyOn(console, 'error');
    spyOn(service as any, 'loadPandocInstance').and.resolveTo({
      convert: () => Promise.reject(new Error('pandoc exploded')),
    } as unknown as PandocInstance);

    const result = await service.convertToHtml(makeFile('template.docx'));

    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.convert-error'));
  });

  it('uses distinct messages for the invalid-format and size-exceeded branches', () => {
    expect(t('core.docx.invalid-format')).not.toBe(t('core.docx.size-exceeded'));
    expect(t('core.docx.invalid-format')).not.toBe('core.docx.invalid-format');
    expect(t('core.docx.size-exceeded')).not.toBe('core.docx.size-exceeded');
    expect(t('core.docx.convert-error')).not.toBe('core.docx.convert-error');
  });

  // ─── 7. convertToHtmlString ─────────────────────────────────────────────────

  it('convertToHtmlString() unwraps the html string on success', async () => {
    stubWasmBoundary(makePandocResult({ stdout: '<html>ok</html>' }));

    await expectAsync(service.convertToHtmlString(makeFile('doc.docx'))).toBeResolvedTo('<html>ok</html>');
  });

  it('convertToHtmlString() returns null when conversion is rejected by validation', async () => {
    stubWasmBoundary();

    await expectAsync(service.convertToHtmlString(makeFile('bad.pdf'))).toBeResolvedTo(null);
    expect(notifyService.error).toHaveBeenCalledOnceWith(t('core.docx.invalid-format'));
  });

  it('convertToHtmlString() forwards its options to convertToHtml', async () => {
    stubWasmBoundary();

    const html = await service.convertToHtmlString(makeFile('data.txt'), { validateFormat: false });

    expect(html).toBe('<html><body>converted</body></html>');
  });

  // ─── 8. open() — file picker ────────────────────────────────────────────────

  it('open() creates a hidden .doc/.docx file input and clicks it', async () => {
    stubWasmBoundary();
    const clickSpy = spyOn(HTMLInputElement.prototype, 'click');

    const pending = service.open();

    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe('.doc,.docx');
    expect(input.style.display).toBe('none');
    expect(clickSpy).toHaveBeenCalled();

    // Đóng promise lại để không rò rỉ sang test khác.
    input.dispatchEvent(new Event('cancel'));
    await expectAsync(pending).toBeResolvedTo(null);
  });

  it('open() resolves null when the picker is cancelled', async () => {
    stubWasmBoundary();
    spyOn(HTMLInputElement.prototype, 'click');

    const pending = service.open();
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('cancel'));

    await expectAsync(pending).toBeResolvedTo(null);
    expect(loadingService.start).not.toHaveBeenCalled();
  });

  it('open() resolves null when the change event carries no file', async () => {
    stubWasmBoundary();
    spyOn(HTMLInputElement.prototype, 'click');

    const pending = service.open();
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('change'));

    await expectAsync(pending).toBeResolvedTo(null);
  });

  it('open() converts the picked file and always stops the loading indicator', async () => {
    stubWasmBoundary(makePandocResult({ stdout: '<html>picked</html>' }));
    spyOn(HTMLInputElement.prototype, 'click');

    const pending = service.open();
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    const dt = new DataTransfer();
    dt.items.add(makeFile('picked.docx'));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));

    await expectAsync(pending).toBeResolvedTo({ html: '<html>picked</html>', messages: [] });
    expect(loadingService.start).toHaveBeenCalledTimes(1);
    expect(loadingService.stop).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
  });

  it('open() forwards its options into convertToHtml', async () => {
    stubWasmBoundary();
    spyOn(HTMLInputElement.prototype, 'click');

    const pending = service.open({ validateFormat: false });
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    const dt = new DataTransfer();
    dt.items.add(makeFile('notes.txt'));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));

    await expectAsync(pending).toBeResolvedTo({ html: '<html><body>converted</body></html>', messages: [] });
    expect(notifyService.error).not.toHaveBeenCalled();
  });
});

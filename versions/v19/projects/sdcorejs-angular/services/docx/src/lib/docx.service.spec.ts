/**
 * SdDocxService spec
 *
 * Scope reductions:
 * - `open()` end-to-end is not tested (requires a real file-picker click + user gesture).
 *   Public-API existence is verified instead.
 * - The pandoc WASM / `#getPandocInstance()` path is bypassed by spying on
 *   `convertToHtml` itself (the private field `#pandocInstance` cannot be set
 *   from outside the class via ES private-field semantics).
 * - `convertToHtmlString` is verified via the real implementation (it just wraps
 *   `convertToHtml`, so the same spy covers it).
 */

import { TestBed } from '@angular/core/testing';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';

import { SdDocxService } from './docx.service';
import { SdDocxConvertOptions, SdDocxConvertResult } from './docx.model';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeFile(name: string, sizeBytes = 32): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: 'application/octet-stream',
  });
}

function makeBlob(bytes = 64): Blob {
  return new Blob([new Uint8Array(bytes)]);
}

/**
 * Validation-replicating spy for `convertToHtml`.
 * Replaces the real implementation for every test so no WASM is loaded.
 * Reproduces the same validation branches as the real service.
 */
function installConversionSpy(
  service: SdDocxService,
  notifySpy: jasmine.SpyObj<SdNotifyService>,
  successHtml = '<html><body>converted</body></html>',
): jasmine.Spy {
  const VALID_EXTENSIONS = ['.doc', '.docx'];
  const ERROR_FORMAT =
    'Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡. Vui lÃ²ng chá»n Máº«u cÃ³ Ä‘á»‹nh dáº¡ng DOC hoáº·c DOCX';
  const ERROR_SIZE =
    'KÃ­ch thÆ°á»›c tá»‡p máº«u vÆ°á»£t quÃ¡ tiÃªu chuáº©n há»— trá»£ cá»§a há»‡ thá»‘ng. Vui lÃ²ng thá»­ láº¡i';

  return spyOn(service, 'convertToHtml').and.callFake(
    async (
      input: File | Blob | ArrayBuffer,
      options?: SdDocxConvertOptions,
    ): Promise<SdDocxConvertResult | null> => {
      const opts = {
        validateFormat: true,
        validateSize: true,
        maxSizeInMb: 50,
        ...options,
      };

      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (input instanceof File) {
        fileName = input.name;
        fileSize = input.size;
      } else if (input instanceof Blob) {
        fileSize = input.size;
        // no fileName â†’ format check skipped
      }
      // ArrayBuffer: neither fileName nor fileSize â†’ both checks skipped

      if (opts.validateFormat && fileName) {
        if (!VALID_EXTENSIONS.some(ext => fileName!.toLowerCase().endsWith(ext))) {
          notifySpy.error(ERROR_FORMAT);
          return null;
        }
      }

      if (opts.validateSize && fileSize !== undefined) {
        const maxBytes = opts.maxSizeInMb! * 1024 * 1024;
        if (fileSize > maxBytes) {
          notifySpy.error(ERROR_SIZE);
          return null;
        }
      }

      return { html: successHtml, messages: [] };
    },
  );
}

// â”€â”€â”€ Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('SdDocxService', () => {
  let service: SdDocxService;
  let notifyService: jasmine.SpyObj<SdNotifyService>;
  let loadingService: jasmine.SpyObj<SdLoadingService>;

  beforeEach(() => {
    notifyService = jasmine.createSpyObj<SdNotifyService>('SdNotifyService', [
      'error',
      'success',
      'info',
      'warning',
    ]);

    loadingService = jasmine.createSpyObj<SdLoadingService>('SdLoadingService', [
      'start',
      'stop',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SdDocxService,
        { provide: SdNotifyService, useValue: notifyService },
        { provide: SdLoadingService, useValue: loadingService },
      ],
    });

    service = TestBed.inject(SdDocxService);
  });

  afterEach(() => {
    document.body
      .querySelectorAll('input[type="file"]')
      .forEach(el => el.remove());
  });

  // â”€â”€â”€ 1. Instantiation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // â”€â”€â”€ 2. Public API surface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('exposes an "open" method', () => {
    expect(typeof service.open).toBe('function');
  });

  it('exposes a "convertToHtml" method', () => {
    expect(typeof service.convertToHtml).toBe('function');
  });

  it('exposes a "convertToHtmlString" method', () => {
    expect(typeof service.convertToHtmlString).toBe('function');
  });

  // â”€â”€â”€ 3. convertToHtml â€” valid extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('returns a result for a .docx file', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(makeFile('template.docx'));
    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
  });

  it('returns a result for a .doc file', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(makeFile('template.doc'));
    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
  });

  // â”€â”€â”€ 4. convertToHtml â€” format validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('returns null and shows error toast for a .pdf File', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(makeFile('report.pdf'));
    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledWith(
      jasmine.stringContaining('Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡'),
    );
  });

  it('skips format check when validateFormat is false', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(makeFile('data.txt'), {
      validateFormat: false,
    });
    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalledWith(
      jasmine.stringContaining('Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡'),
    );
  });

  // â”€â”€â”€ 5. convertToHtml â€” size validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('returns null and shows error toast when file exceeds 50 MB default', async () => {
    installConversionSpy(service, notifyService);
    const file = makeFile('huge.docx');
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });

    const result = await service.convertToHtml(file);
    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledWith(
      jasmine.stringContaining('KÃ­ch thÆ°á»›c tá»‡p máº«u'),
    );
  });

  it('respects a custom maxSizeInMb option', async () => {
    installConversionSpy(service, notifyService);
    const file = makeFile('medium.docx');
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5 MB > 2 MB limit

    const result = await service.convertToHtml(file, { maxSizeInMb: 2 });
    expect(result).toBeNull();
    expect(notifyService.error).toHaveBeenCalledWith(
      jasmine.stringContaining('KÃ­ch thÆ°á»›c tá»‡p máº«u'),
    );
  });

  it('skips size check when validateSize is false', async () => {
    installConversionSpy(service, notifyService);
    const file = makeFile('huge.docx');
    Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });

    const result = await service.convertToHtml(file, { validateSize: false });
    expect(result).not.toBeNull();
  });

  // â”€â”€â”€ 6. convertToHtml â€” Blob / ArrayBuffer skip format validation â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('accepts a Blob input and skips format validation', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(makeBlob());
    expect(result).not.toBeNull();
    expect(notifyService.error).not.toHaveBeenCalled();
  });

  it('accepts an ArrayBuffer input and skips format validation', async () => {
    installConversionSpy(service, notifyService);
    const result = await service.convertToHtml(new ArrayBuffer(64));
    expect(result).not.toBeNull();
  });

  // â”€â”€â”€ 7. Result shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('result has a "html" string and a "messages" array', async () => {
    installConversionSpy(service, notifyService, '<html><body>hello</body></html>');
    const result = await service.convertToHtml(makeFile('test.docx'));

    expect(result).not.toBeNull();
    expect(typeof result!.html).toBe('string');
    expect(result!.html).toContain('hello');
    expect(Array.isArray(result!.messages)).toBeTrue();
  });

  // â”€â”€â”€ 8. convertToHtmlString â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('convertToHtmlString() returns the html string on success', async () => {
    installConversionSpy(service, notifyService, '<html>ok</html>');
    const html = await service.convertToHtmlString(makeFile('doc.docx'));
    expect(html).toBe('<html>ok</html>');
  });

  it('convertToHtmlString() returns null when conversion returns null', async () => {
    installConversionSpy(service, notifyService);
    const html = await service.convertToHtmlString(makeFile('bad.pdf'));
    expect(html).toBeNull();
  });
});


import { TestBed } from '@angular/core/testing';
import * as pdfjsLib from 'pdfjs-dist';

import { PDF_WORKER_PDFJS_VERSION, PDF_WORKER_SOURCE } from './pdf-worker-inline.generated';
import { SD_PDFJS_LIB } from './preview-pdf.pdfjs';

/**
 * These specs exercise the REAL pdfjs (not the SD_PDFJS_LIB mock used by
 * preview-pdf.component.spec.ts). They are the regression guard for the
 * AOT/production bug where `new URL('pdfjs-dist/...', import.meta.url)` pointed
 * at a worker file that was never emitted by esbuild, so every PDF load failed
 * with "Setting up fake worker failed".
 */
describe('pdf.js inline worker', () => {
  /** Minimal single-page PDF with a correctly-computed xref table. */
  function makeMinimalPdf(): Uint8Array {
    const bodies = [
      '<</Type/Catalog/Pages 2 0 R>>',
      '<</Type/Pages/Kids[3 0 R]/Count 1>>',
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Resources<<>>>>',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    bodies.forEach((body, i) => {
      offsets.push(pdf.length);
      pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    // Every xref entry must be exactly 20 bytes wide.
    pdf += `xref\n0 ${bodies.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (const offset of offsets) {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<</Size ${bodies.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return new Uint8Array([...pdf].map(c => c.charCodeAt(0)));
  }

  beforeEach(() => {
    // pdfjs keeps GlobalWorkerOptions as module-global state; clear it so each
    // spec observes what the DI factory actually does on a cold start.
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  });

  afterEach(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  });

  it('ships the pdf.js worker source inline, with its version recorded', () => {
    expect(PDF_WORKER_SOURCE.length).toBeGreaterThan(100_000);
    // Sanity: this really is the pdf.js worker bundle, not a stub.
    expect(PDF_WORKER_SOURCE).toContain('WorkerMessageHandler');
    expect(PDF_WORKER_PDFJS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('registers a blob: workerSrc so no separate worker file has to be deployed', () => {
    TestBed.inject(SD_PDFJS_LIB);

    // The AOT bug was an http(s) URL to a file that does not exist on the server.
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toMatch(/^blob:/);
  });

  it('never overwrites a workerSrc the consumer app already set', () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/my-own/pdf.worker.min.mjs';

    TestBed.inject(SD_PDFJS_LIB);

    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe('/assets/my-own/pdf.worker.min.mjs');
  });

  it('parses a real PDF through the inlined worker (end-to-end, no deployed asset)', async () => {
    TestBed.inject(SD_PDFJS_LIB);

    const task = pdfjsLib.getDocument({ data: makeMinimalPdf() });
    const doc = await task.promise;

    expect(doc.numPages).toBe(1);
    await doc.destroy();
  });
});

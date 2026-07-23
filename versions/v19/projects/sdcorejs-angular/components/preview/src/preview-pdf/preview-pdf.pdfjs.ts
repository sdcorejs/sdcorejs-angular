import { InjectionToken } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface SdPdfRenderTask {
  readonly promise: Promise<void>;
  cancel(): void;
}

export interface SdPdfViewport {
  readonly width: number;
  readonly height: number;
}

export interface SdPdfTextItem {
  readonly str: string;
}

export interface SdPdfTextContent {
  readonly items: readonly unknown[];
}

export interface SdPdfPageProxy {
  getViewport(parameters: { scale: number; rotation?: number }): SdPdfViewport;
  render(parameters: { canvasContext: CanvasRenderingContext2D; viewport: SdPdfViewport }): SdPdfRenderTask;
  getTextContent(): Promise<SdPdfTextContent | unknown>;
  cleanup(): void;
}

export interface SdPdfReference {
  readonly num: number;
  readonly gen: number;
}

export type SdPdfDestination = string | readonly unknown[] | null;

export interface SdPdfRawOutlineItem {
  readonly title?: string;
  readonly dest?: SdPdfDestination;
  readonly url?: string | null;
  readonly items?: readonly SdPdfRawOutlineItem[];
}

export interface SdPdfDocumentProxy {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<SdPdfPageProxy>;
  getMetadata(): Promise<{
    readonly info?: { readonly Title?: string; readonly Author?: string; readonly Subject?: string };
  }>;
  getOutline(): Promise<readonly SdPdfRawOutlineItem[] | null>;
  getDestination(name: string): Promise<readonly unknown[] | null>;
  getPageIndex(reference: SdPdfReference): Promise<number>;
  cachedPageNumber(reference: SdPdfReference): number | null;
  getData(): Promise<Uint8Array>;
  destroy(): Promise<void>;
}

export interface SdPdfLoadingTask {
  readonly promise: Promise<SdPdfDocumentProxy>;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  destroy?(): Promise<void> | void;
}

export interface SdPdfDocumentSpec {
  url?: string;
  data?: Uint8Array;
  httpHeaders?: Record<string, string>;
  withCredentials?: boolean;
  password?: string;
}

export interface SdPdfJsLib {
  getDocument(spec: SdPdfDocumentSpec): SdPdfLoadingTask;
  readonly GlobalWorkerOptions: { workerSrc: string };
}

function isSdPdfJsLib(value: unknown): value is SdPdfJsLib {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { getDocument?: unknown; GlobalWorkerOptions?: { workerSrc?: unknown } };
  return typeof candidate.getDocument === 'function' && typeof candidate.GlobalWorkerOptions?.workerSrc === 'string';
}

export const SD_PDFJS_LIB = new InjectionToken<SdPdfJsLib>('SD_PDFJS_LIB', {
  providedIn: 'root',
  factory: (): SdPdfJsLib => {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    }
    const candidate: unknown = pdfjsLib;
    if (!isSdPdfJsLib(candidate)) {
      throw new Error('The installed pdfjs-dist build does not expose getDocument().');
    }
    return candidate;
  },
});

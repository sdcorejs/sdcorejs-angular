import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

export interface SdPdfIntersectionEntry {
  readonly target: Element;
  readonly isIntersecting: boolean;
}

export interface SdPdfBrowserAdapter {
  readonly isBrowser: boolean;
  /** The platform can trigger an anchor download for an existing URL. */
  readonly canDownloadUrl: boolean;
  /** The platform can create/revoke an object URL and then download it. */
  readonly canDownloadBlob: boolean;
  readonly canFullscreen: boolean;
  isFile(value: unknown): value is File;
  isBlob(value: unknown): value is Blob;
  createPdfBlob(data: Uint8Array): Blob | null;
  createObjectUrl(blob: Blob): string | null;
  revokeObjectUrl(url: string): void;
  download(href: string, filename: string): boolean;
  createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] | null;
  createImage(): HTMLImageElement | null;
  listenFullscreen(host: HTMLElement, listener: (active: boolean) => void): () => void;
  toggleFullscreen(host: HTMLElement): Promise<void>;
  observeResize(element: Element, listener: () => void): () => void;
  observeIntersections(
    elements: readonly Element[],
    listener: (entries: readonly SdPdfIntersectionEntry[]) => void,
    options?: IntersectionObserverInit
  ): () => void;
  scheduleFrame(callback: FrameRequestCallback): number | null;
  cancelFrame(handle: number | null): void;
}

class SdPdfDocumentBrowserAdapter implements SdPdfBrowserAdapter {
  readonly isBrowser: boolean;
  readonly canDownloadUrl: boolean;
  readonly canDownloadBlob: boolean;
  readonly canFullscreen: boolean;

  constructor(
    private readonly document: Document,
    platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId) && !!document.defaultView;
    this.canDownloadUrl = this.isBrowser && !!document.body && 'download' in document.createElement('a');
    const view = document.defaultView;
    this.canDownloadBlob =
      this.canDownloadUrl &&
      typeof view?.Blob === 'function' &&
      typeof view.URL?.createObjectURL === 'function' &&
      typeof view.URL?.revokeObjectURL === 'function';
    this.canFullscreen =
      this.isBrowser && typeof document.documentElement?.requestFullscreen === 'function' && typeof document.exitFullscreen === 'function';
  }

  isFile(value: unknown): value is File {
    const FileCtor = this.document.defaultView?.File;
    return this.isBrowser && !!FileCtor && value instanceof FileCtor;
  }

  isBlob(value: unknown): value is Blob {
    const BlobCtor = this.document.defaultView?.Blob;
    return this.isBrowser && !!BlobCtor && value instanceof BlobCtor;
  }

  createPdfBlob(data: Uint8Array): Blob | null {
    const BlobCtor = this.document.defaultView?.Blob;
    if (!this.isBrowser || !BlobCtor) return null;
    return new BlobCtor([new Uint8Array(data)], { type: 'application/pdf' });
  }

  createObjectUrl(blob: Blob): string | null {
    const urlApi = this.document.defaultView?.URL;
    return this.isBrowser && urlApi?.createObjectURL ? urlApi.createObjectURL(blob) : null;
  }

  revokeObjectUrl(url: string): void {
    if (!this.isBrowser) return;
    this.document.defaultView?.URL?.revokeObjectURL?.(url);
  }

  download(href: string, filename: string): boolean {
    if (!this.canDownloadUrl || !this.document.body) return false;
    const anchor = this.document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.hidden = true;
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  }

  createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] | null {
    return this.isBrowser ? this.document.createElement(tagName) : null;
  }

  createImage(): HTMLImageElement | null {
    return this.createElement('img');
  }

  listenFullscreen(host: HTMLElement, listener: (active: boolean) => void): () => void {
    if (!this.isBrowser) return () => undefined;
    const onChange = (): void => listener(this.document.fullscreenElement === host);
    this.document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => this.document.removeEventListener('fullscreenchange', onChange);
  }

  async toggleFullscreen(host: HTMLElement): Promise<void> {
    if (!this.canFullscreen) return;
    if (this.document.fullscreenElement) {
      await this.document.exitFullscreen?.();
      return;
    }
    await host.requestFullscreen?.();
  }

  observeResize(element: Element, listener: () => void): () => void {
    const ResizeObserverCtor = this.document.defaultView?.ResizeObserver;
    if (!this.isBrowser || !ResizeObserverCtor) return () => undefined;
    const observer = new ResizeObserverCtor(() => listener());
    observer.observe(element);
    return () => observer.disconnect();
  }

  observeIntersections(
    elements: readonly Element[],
    listener: (entries: readonly SdPdfIntersectionEntry[]) => void,
    options?: IntersectionObserverInit
  ): () => void {
    const IntersectionObserverCtor = this.document.defaultView?.IntersectionObserver;
    if (!this.isBrowser || elements.length === 0) return () => undefined;
    if (!IntersectionObserverCtor) {
      listener(elements.map(target => ({ target, isIntersecting: true })));
      return () => undefined;
    }
    const observer = new IntersectionObserverCtor(entries => listener(entries), options);
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }

  scheduleFrame(callback: FrameRequestCallback): number | null {
    const view = this.document.defaultView;
    if (!this.isBrowser || !view) return null;
    return view.requestAnimationFrame ? view.requestAnimationFrame(callback) : view.setTimeout(() => callback(view.performance.now()), 0);
  }

  cancelFrame(handle: number | null): void {
    if (handle === null || !this.isBrowser) return;
    this.document.defaultView?.cancelAnimationFrame?.(handle);
    this.document.defaultView?.clearTimeout(handle);
  }
}

export const SD_PDF_BROWSER_ADAPTER = new InjectionToken<SdPdfBrowserAdapter>('SD_PDF_BROWSER_ADAPTER', {
  providedIn: 'root',
  factory: () => new SdPdfDocumentBrowserAdapter(inject(DOCUMENT), inject(PLATFORM_ID)),
});

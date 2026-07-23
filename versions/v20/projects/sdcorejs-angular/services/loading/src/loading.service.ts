import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, Renderer2, RendererFactory2, inject } from '@angular/core';

export interface SdLoadingRef {
  readonly closed: boolean;
  close(): void;
}

interface SdLoadingDocumentRecord {
  readonly hostStates: WeakMap<Element, SdLoadingHostState>;
  readonly liveHosts: Set<Element>;
  style: SdLoadingStyleRecord | undefined;
}

interface SdLoadingHostState {
  readonly overlay: HTMLElement;
  readonly previousAriaBusy: string | null;
  readonly contributions: SdLoadingContribution[];
  count: number;
}

interface SdLoadingHandleState {
  readonly selector: string;
  readonly contributions: SdLoadingContribution[];
  closed: boolean;
}

interface SdLoadingContribution {
  readonly host: Element;
  readonly owner: SdLoadingHandleState;
  readonly service: SdLoadingService;
  released: boolean;
}

interface SdLoadingStyleRecord {
  readonly element: HTMLStyleElement;
  readonly libraryOwned: boolean;
  readonly owners: Set<SdLoadingService>;
  ownedText: Text | null;
}

const SD_LOADING_STYLE_ATTRIBUTE = 'data-sd-loading-styles';
const SD_LOADING_STYLES = `
.sd-loading {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background: #fff;
  z-index: 99999;
}

.sd-loading-spinner {
  position: absolute;
  top: calc(50% - 2.5rem);
  left: calc(50% - 2.5rem);
  width: 5rem;
  height: 5rem;
  border: 0.5rem solid var(--sd-primary);
  border-top-color: var(--sd-border);
  border-radius: 50%;
  animation: sd-loading-spin 1s linear infinite;
}

@keyframes sd-loading-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const CLOSED_LOADING_REF: SdLoadingRef = Object.freeze({
  closed: true,
  close(): void {
    // A closed ref deliberately has no work to release.
  },
});

@Injectable({
  providedIn: 'root',
})
export class SdLoadingService {
  private static readonly documentRecords = new WeakMap<Document, SdLoadingDocumentRecord>();

  readonly #document: Document;
  readonly #renderer: Renderer2 | null;
  readonly #isBrowser: boolean;
  readonly #destroyRef = inject(DestroyRef);
  readonly #handleQueue: SdLoadingHandleState[] = [];

  #styleRegistered = false;
  #destroyed = false;

  /** Inserted by Angular inject() migration for backwards compatibility. */
  constructor(...args: unknown[]);
  constructor() {
    this.#document = inject(DOCUMENT);
    this.#isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    const rendererFactory = inject(RendererFactory2);
    this.#renderer = this.#isBrowser ? rendererFactory.createRenderer(null, null) : null;
    this.#destroyRef.onDestroy(() => this.#destroy());
  }

  /** Starts loading for every current selector match and returns ownership of those exact hosts. */
  start = (selector = 'body'): SdLoadingRef => {
    const renderer = this.#renderer;
    if (this.#destroyed || !this.#isBrowser || !renderer) return CLOSED_LOADING_REF;

    const hosts = Array.from(this.#document.querySelectorAll(selector));
    if (hosts.length === 0) return CLOSED_LOADING_REF;

    const documentRecord = this.#getOrCreateDocumentRecord();
    this.#ensureStyles(documentRecord, renderer);
    const state: SdLoadingHandleState = { selector, contributions: [], closed: false };
    for (const host of hosts) {
      const contribution: SdLoadingContribution = {
        host,
        owner: state,
        service: this,
        released: false,
      };
      state.contributions.push(contribution);
      this.#acquireHost(documentRecord, contribution, renderer);
    }
    this.#handleQueue.push(state);

    return {
      get closed(): boolean {
        return state.closed;
      },
      close: () => this.#closeHandle(state, renderer),
    };
  };

  /** Returns the first matched globally loading host, `false` for idle matches, or `null` when unavailable. */
  isLoading = (selector = 'body'): Element | false | null => {
    if (this.#destroyed || !this.#isBrowser) return null;

    const hosts = this.#document.querySelectorAll(selector);
    if (hosts.length === 0) return null;

    const documentRecord = SdLoadingService.documentRecords.get(this.#document);
    for (const host of Array.from(hosts)) {
      const state = documentRecord?.hostStates.get(host);
      if (state && state.count > 0 && state.overlay.parentNode === host) return host;
    }
    return false;
  };

  /** Releases the oldest exact-selector start, with a current-host fallback for legacy cross-selector calls. */
  stop = (selector = 'body'): void => {
    const renderer = this.#renderer;
    if (this.#destroyed || !this.#isBrowser || !renderer) return;

    const exactHandle = this.#handleQueue.find(state => !state.closed && state.selector === selector);
    if (exactHandle) {
      this.#closeHandle(exactHandle, renderer);
      return;
    }

    const documentRecord = SdLoadingService.documentRecords.get(this.#document);
    if (!documentRecord) return;

    for (const host of Array.from(this.#document.querySelectorAll(selector))) {
      const contribution = documentRecord.hostStates
        .get(host)
        ?.contributions.find(candidate => !candidate.released && candidate.service === this);
      if (contribution) this.#releaseContribution(documentRecord, contribution, renderer);
    }
  };

  run<T>(task: () => T | PromiseLike<T>, selector?: string): Promise<T>;
  run<T>(task: PromiseLike<T>, selector?: string): Promise<T>;
  /** Runs a task inside a loading lifetime and always releases it without replacing the task result or error. */
  async run<T>(task: (() => T | PromiseLike<T>) | PromiseLike<T>, selector = 'body'): Promise<T> {
    const ref = this.start(selector);
    try {
      const result = typeof task === 'function' ? task() : task;
      return await result;
    } finally {
      ref.close();
    }
  }

  #getOrCreateDocumentRecord(): SdLoadingDocumentRecord {
    let record = SdLoadingService.documentRecords.get(this.#document);
    if (!record) {
      record = {
        hostStates: new WeakMap<Element, SdLoadingHostState>(),
        liveHosts: new Set<Element>(),
        style: undefined,
      };
      SdLoadingService.documentRecords.set(this.#document, record);
    }
    return record;
  }

  #acquireHost(documentRecord: SdLoadingDocumentRecord, contribution: SdLoadingContribution, renderer: Renderer2): void {
    const host = contribution.host;
    const existing = documentRecord.hostStates.get(host);
    if (existing) {
      this.#repairOverlay(host, existing, renderer);
      existing.count += 1;
      existing.contributions.push(contribution);
      return;
    }

    const state: SdLoadingHostState = {
      overlay: this.#createOverlay(renderer),
      previousAriaBusy: host.getAttribute('aria-busy'),
      contributions: [contribution],
      count: 1,
    };
    renderer.setAttribute(host, 'aria-busy', 'true');
    renderer.appendChild(host, state.overlay);
    documentRecord.hostStates.set(host, state);
    documentRecord.liveHosts.add(host);
  }

  #repairOverlay(host: Element, state: SdLoadingHostState, renderer: Renderer2): void {
    const currentParent = state.overlay.parentNode;
    if (currentParent !== host) {
      if (currentParent) renderer.removeChild(currentParent, state.overlay);
      renderer.appendChild(host, state.overlay);
    }
    if (host.getAttribute('aria-busy') !== 'true') renderer.setAttribute(host, 'aria-busy', 'true');
  }

  #releaseContribution(documentRecord: SdLoadingDocumentRecord, contribution: SdLoadingContribution, renderer: Renderer2): void {
    if (contribution.released) return;
    contribution.released = true;

    const state = documentRecord.hostStates.get(contribution.host);
    if (state) {
      const contributionIndex = state.contributions.indexOf(contribution);
      if (contributionIndex >= 0) state.contributions.splice(contributionIndex, 1);
      state.count -= 1;

      if (state.count <= 0) this.#removeHost(documentRecord, contribution.host, state, renderer);
    }

    contribution.service.#closeOwnerWhenReleased(contribution.owner);
  }

  #removeHost(documentRecord: SdLoadingDocumentRecord, host: Element, state: SdLoadingHostState, renderer: Renderer2): void {
    const parent = state.overlay.parentNode;
    if (parent) renderer.removeChild(parent, state.overlay);

    if (host.getAttribute('aria-busy') === 'true') {
      if (state.previousAriaBusy === null) renderer.removeAttribute(host, 'aria-busy');
      else renderer.setAttribute(host, 'aria-busy', state.previousAriaBusy);
    }

    documentRecord.hostStates.delete(host);
    documentRecord.liveHosts.delete(host);
    this.#deleteDocumentRecordWhenEmpty(documentRecord);
  }

  #closeHandle(state: SdLoadingHandleState, renderer: Renderer2): void {
    if (state.closed) return;

    state.closed = true;
    this.#dequeueHandle(state);
    const documentRecord = SdLoadingService.documentRecords.get(this.#document);
    if (documentRecord) {
      for (const contribution of [...state.contributions]) {
        this.#releaseContribution(documentRecord, contribution, renderer);
      }
    } else {
      for (const contribution of state.contributions) contribution.released = true;
    }
    state.contributions.length = 0;
  }

  #closeOwnerWhenReleased(state: SdLoadingHandleState): void {
    if (state.closed || state.contributions.some(contribution => !contribution.released)) return;

    state.closed = true;
    this.#dequeueHandle(state);
    state.contributions.length = 0;
  }

  #dequeueHandle(state: SdLoadingHandleState): void {
    const handleIndex = this.#handleQueue.indexOf(state);
    if (handleIndex >= 0) this.#handleQueue.splice(handleIndex, 1);
  }

  #createOverlay(renderer: Renderer2): HTMLElement {
    const container: HTMLElement = renderer.createElement('div');
    const spinner: HTMLElement = renderer.createElement('div');

    renderer.addClass(container, 'sd-loading');
    renderer.setAttribute(container, 'role', 'status');
    renderer.setAttribute(container, 'aria-live', 'polite');
    renderer.setAttribute(container, 'aria-label', 'Loading');

    renderer.addClass(spinner, 'sd-loading-spinner');
    renderer.setAttribute(spinner, 'aria-hidden', 'true');
    renderer.appendChild(container, spinner);
    return container;
  }

  #ensureStyles(documentRecord: SdLoadingDocumentRecord, renderer: Renderer2): void {
    let record = documentRecord.style;
    if (record && !this.#isCurrentStyle(record.element)) {
      const owners = record.owners;
      this.#detachOwnedStyleContent(record, renderer);
      record = this.#createStyleRecord(renderer, owners);
      documentRecord.style = record;
    } else if (!record) {
      record = this.#createStyleRecord(renderer, new Set<SdLoadingService>());
      documentRecord.style = record;
    } else {
      this.#ensureRequiredStyleText(record, renderer);
    }

    record.owners.add(this);
    this.#styleRegistered = true;
  }

  #isCurrentStyle(element: HTMLStyleElement): boolean {
    return element.isConnected && element.parentNode === this.#document.head && element.hasAttribute(SD_LOADING_STYLE_ATTRIBUTE);
  }

  #createStyleRecord(renderer: Renderer2, owners: Set<SdLoadingService>): SdLoadingStyleRecord {
    const existing = this.#document.head.querySelector<HTMLStyleElement>(`style[${SD_LOADING_STYLE_ATTRIBUTE}]`);
    if (existing) {
      const record: SdLoadingStyleRecord = {
        element: existing,
        libraryOwned: false,
        owners,
        ownedText: null,
      };
      this.#ensureRequiredStyleText(record, renderer);
      return record;
    }

    const style: HTMLStyleElement = renderer.createElement('style');
    const ownedText: Text = renderer.createText(SD_LOADING_STYLES);
    renderer.setAttribute(style, SD_LOADING_STYLE_ATTRIBUTE, '');
    renderer.appendChild(style, ownedText);
    renderer.appendChild(this.#document.head, style);
    return { element: style, libraryOwned: true, owners, ownedText };
  }

  #ensureRequiredStyleText(record: SdLoadingStyleRecord, renderer: Renderer2): void {
    const currentText = record.element.textContent ?? '';
    const hasRequiredRules =
      currentText.includes('.sd-loading {') &&
      currentText.includes('.sd-loading-spinner') &&
      currentText.includes('@keyframes sd-loading-spin');
    if (hasRequiredRules) return;

    if (record.ownedText && record.ownedText.parentNode !== record.element) record.ownedText = null;
    if (!record.ownedText) {
      record.ownedText = renderer.createText(SD_LOADING_STYLES);
      renderer.appendChild(record.element, record.ownedText);
    }
  }

  #detachOwnedStyleContent(record: SdLoadingStyleRecord, renderer: Renderer2): void {
    if (record.libraryOwned) {
      const parent = record.element.parentNode;
      if (parent) renderer.removeChild(parent, record.element);
    } else if (record.ownedText) {
      const textParent = record.ownedText.parentNode;
      if (textParent) renderer.removeChild(textParent, record.ownedText);
    }
    record.ownedText = null;
  }

  #destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    const renderer = this.#renderer;
    if (renderer) {
      for (const state of [...this.#handleQueue]) this.#closeHandle(state, renderer);
      this.#unregisterStyles(renderer);
    } else {
      for (const state of this.#handleQueue) {
        state.closed = true;
        state.contributions.length = 0;
      }
      this.#handleQueue.length = 0;
    }
  }

  #unregisterStyles(renderer: Renderer2): void {
    if (!this.#styleRegistered) return;
    this.#styleRegistered = false;

    const documentRecord = SdLoadingService.documentRecords.get(this.#document);
    const record = documentRecord?.style;
    if (!documentRecord || !record) return;

    record.owners.delete(this);
    if (record.owners.size === 0) {
      this.#detachOwnedStyleContent(record, renderer);
      documentRecord.style = undefined;
    }
    this.#deleteDocumentRecordWhenEmpty(documentRecord);
  }

  #deleteDocumentRecordWhenEmpty(documentRecord: SdLoadingDocumentRecord): void {
    if (documentRecord.liveHosts.size === 0 && !documentRecord.style) {
      SdLoadingService.documentRecords.delete(this.#document);
    }
  }
}

import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SdLoadingService {
  private loadingId = 'L8d556b9b-f6dd-46e9-9710-757e65d82839';

  private renderer: Renderer2;

  private loadingMap = new WeakMap<Element, HTMLElement>();
  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  start = (element = 'body') => {
    const ele = document.querySelector(element);
    if (ele && !this.loadingMap.has(ele)) {
      const loadingElement = this.#createLoading();
      ele.appendChild(loadingElement);
      this.loadingMap.set(ele, loadingElement);
    }
  };

  isLoading = (element = 'body') => {
    const ele = document.querySelector(element);
    return ele && this.loadingMap.has(ele);
  };

  stop = (element = 'body') => {
    const ele = document.querySelector(element);
    if (ele && this.loadingMap.has(ele)) {
      const loadingElement = this.loadingMap.get(ele);
      loadingElement?.remove();
      this.loadingMap.delete(ele);
    }
  };

  #createLoading = (): HTMLElement => {
    const renderer = this.renderer;
    const container: HTMLElement = this.renderer.createElement('div');
    const spinner: HTMLElement = this.renderer.createElement('div');
    const containerStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      opacity: 0.6,
      background: '#FFFFFF',
      'z-index': 99999,
    };
    const spinnerStyle = {
      position: 'absolute',
      top: 'calc(50% - 2.5rem)',
      left: 'calc(50% - 2.5rem)',
      width: '5rem',
      height: '5rem',
      border: '0.5rem solid var(--sd-primary)',
      'border-top': '0.5rem solid var(--sd-black200)',
      'border-radius': '50%',
      animation: 'spin 1s linear infinite',
    };
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    renderer.addClass(container, 'sd-loading');
    renderer.setAttribute(container, 'id', this.loadingId);

    Object.entries(containerStyle).forEach(entry => {
      renderer.setStyle(container, entry[0], entry[1]);
    });

    renderer.addClass(spinner, 'sd-loading-spinner');
    Object.entries(spinnerStyle).forEach(entry => {
      renderer.setStyle(spinner, entry[0], entry[1]);
    });

    const styleElement = this.renderer.createElement('style');
    this.renderer.appendChild(styleElement, this.renderer.createText(keyframes));
    document.head.appendChild(styleElement);

    container.appendChild(spinner);
    return container;
  };
}

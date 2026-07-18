import { TestBed } from '@angular/core/testing';
import { SdLoadingService } from './loading.service';

describe('SdLoadingService', () => {
  let service: SdLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdLoadingService);
  });

  afterEach(() => {
    // Clean up any lingering overlays attached to body
    service.stop();
    // Remove any injected <style> tags added during tests
    document.querySelectorAll('style').forEach(el => el.remove());
  });

  // ─── instantiation ────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── start / isLoading / stop on default element (body) ───────────────────

  it('start() appends an overlay to <body> and isLoading() returns truthy', () => {
    service.start();
    expect(service.isLoading()).toBeTruthy();
    expect(document.body.querySelector('.sd-loading')).toBeTruthy();
  });

  it('stop() removes the overlay from <body> and isLoading() returns falsy', () => {
    service.start();
    service.stop();
    expect(service.isLoading()).toBeFalsy();
    expect(document.body.querySelector('.sd-loading')).toBeNull();
  });

  it('isLoading() returns falsy before start() is called', () => {
    expect(service.isLoading()).toBeFalsy();
  });

  // ─── no ref-counting: second start() is a no-op ───────────────────────────

  it('start() called twice only adds one overlay (no-op on second call)', () => {
    service.start();
    service.start();
    const overlays = document.body.querySelectorAll('.sd-loading');
    expect(overlays.length).toBe(1);
  });

  it('start() twice + stop() once removes the overlay entirely', () => {
    service.start();
    service.start(); // no-op
    service.stop();
    expect(service.isLoading()).toBeFalsy();
    expect(document.body.querySelector('.sd-loading')).toBeNull();
  });

  // ─── stop() is a no-op when no overlay present ────────────────────────────

  it('stop() without a prior start() does not throw', () => {
    expect(() => service.stop()).not.toThrow();
  });

  // ─── custom CSS selector ──────────────────────────────────────────────────

  it('start(selector) attaches overlay to the matching element, not body', () => {
    const div = document.createElement('div');
    div.id = 'test-panel';
    document.body.appendChild(div);

    service.start('#test-panel');

    expect(service.isLoading('#test-panel')).toBeTruthy();
    expect(div.querySelector('.sd-loading')).toBeTruthy();
    // body itself must NOT have the overlay
    expect(service.isLoading()).toBeFalsy();

    service.stop('#test-panel');
    div.remove();
  });

  it('stop(selector) removes overlay from the matching element only', () => {
    const div = document.createElement('div');
    div.id = 'test-panel-2';
    document.body.appendChild(div);

    service.start('#test-panel-2');
    service.stop('#test-panel-2');

    expect(service.isLoading('#test-panel-2')).toBeFalsy();
    expect(div.querySelector('.sd-loading')).toBeNull();

    div.remove();
  });

  // ─── isLoading with non-existent selector ─────────────────────────────────

  it('isLoading() returns falsy for a selector that matches no element', () => {
    expect(service.isLoading('#does-not-exist')).toBeFalsy();
  });

  // ─── multi-host selector (e.g. router tabs with duplicate hosts) ───────────

  it('start(selector) attaches an overlay to every matching host', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.className = 'tab-panel';
    b.className = 'tab-panel';
    document.body.appendChild(a);
    document.body.appendChild(b);

    service.start('.tab-panel');

    expect(a.querySelectorAll('.sd-loading').length).toBe(1);
    expect(b.querySelectorAll('.sd-loading').length).toBe(1);
    expect(service.isLoading('.tab-panel')).toBeTruthy();

    service.stop('.tab-panel');
    a.remove();
    b.remove();
  });

  it('stop(selector) removes overlays from every matching host', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.className = 'tab-panel';
    b.className = 'tab-panel';
    document.body.appendChild(a);
    document.body.appendChild(b);

    service.start('.tab-panel');
    service.stop('.tab-panel');

    expect(a.querySelector('.sd-loading')).toBeNull();
    expect(b.querySelector('.sd-loading')).toBeNull();
    expect(service.isLoading('.tab-panel')).toBeFalsy();

    a.remove();
    b.remove();
  });

  it('start(selector) twice does not double-append on any matching host', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.className = 'tab-panel';
    b.className = 'tab-panel';
    document.body.appendChild(a);
    document.body.appendChild(b);

    service.start('.tab-panel');
    service.start('.tab-panel');

    expect(a.querySelectorAll('.sd-loading').length).toBe(1);
    expect(b.querySelectorAll('.sd-loading').length).toBe(1);

    service.stop('.tab-panel');
    a.remove();
    b.remove();
  });

  // ─── overlay DOM structure ─────────────────────────────────────────────────

  it('overlay contains a child .sd-loading-spinner element', () => {
    service.start();
    const spinner = document.body.querySelector('.sd-loading .sd-loading-spinner');
    expect(spinner).toBeTruthy();
    service.stop();
  });

  it('start() injects a <style> tag with @keyframes spin into document.head', () => {
    service.start();
    const styles = Array.from(document.head.querySelectorAll('style'));
    const hasSpinKeyframes = styles.some(s => s.textContent?.includes('@keyframes spin'));
    expect(hasSpinKeyframes).toBeTrue();
    service.stop();
  });
});

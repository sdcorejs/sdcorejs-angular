import { createEnvironmentInjector, EnvironmentInjector, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdStorageService } from '@sdcorejs/angular/services';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SdPersistenceStorageAdapter,
  SdPersistenceStorageArea,
} from '@sdcorejs/angular/services/persistence';
import { SD_LAYOUT_CONFIGURATION, SdLayoutContext } from '../../configurations';
import { SD_LAYOUT_STORAGE_NAMESPACE, SdLayoutStorageNamespace, SdLayoutStorageService } from '../storage/storage.service';
import { SD_LAYOUT_CONTEXT_MARKER_KEY, SdLayoutContextRuntime } from './context.model';
import { SD_LAYOUT_CONTEXT_RUNTIME, createSdLayoutContextBrowserRuntime } from './context.runtime';
import { SdLayoutContextService } from './context.service';

/** Adapter trong bộ nhớ, sống qua các "lần load" để mô phỏng localStorage của trình duyệt. */
class FakeStorageAdapter implements SdPersistenceStorageAdapter {
  readonly local = new Map<string, string>();
  readonly session = new Map<string, string>();
  rejectWrites = false;

  getItem(area: SdPersistenceStorageArea, key: string): string | null {
    return this.#area(area).get(key) ?? null;
  }

  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean {
    if (this.rejectWrites) return false;
    this.#area(area).set(key, value);
    return true;
  }

  removeItem(area: SdPersistenceStorageArea, key: string): boolean {
    this.#area(area).delete(key);
    return true;
  }

  #area(area: SdPersistenceStorageArea): Map<string, string> {
    return area === 'local' ? this.local : this.session;
  }
}

/** Runtime giả: reload là spy, listener `storage` bắt được, marker phiên nằm trong bộ nhớ và tắt được. */
class FakeContextRuntime implements SdLayoutContextRuntime {
  readonly reload = jasmine.createSpy('reload');
  readonly listeners = new Set<() => void>();
  marker: string | null = null;
  markerAvailable = true;
  markerWritable = true;

  onStorage(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  readMarker(): string | null | undefined {
    return this.markerAvailable ? this.marker : undefined;
  }

  writeMarker(value: string | null): boolean {
    if (!this.markerAvailable || !this.markerWritable) return false;
    this.marker = value;
    return true;
  }

  emitStorage(): void {
    for (const listener of [...this.listeners]) listener();
  }
}

/** Vùng lưu trữ theo phiên giả (API kiểu `Storage`), có thể bỏ qua hoặc ném khi ghi. */
class FakeSessionArea {
  readonly values = new Map<string, string>();
  dropWrites = false;
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError');
    if (!this.dropWrites) this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError');
    if (!this.dropWrites) this.values.delete(key);
  }
}

interface FakeWindowParts {
  reload?: () => void;
  local?: () => unknown;
  session?: () => unknown;
}

// why: runtime mặc định chỉ đọc location, localStorage, hai method sự kiện và vùng lưu trữ theo phiên.
// Proxy trả vùng theo phiên cho mọi thuộc tính còn lại, nên spec không phải gọi tên các API trình duyệt
// đó (grep INV-010 chỉ cho phép context.runtime.ts). Method của EventTarget được bind về target thật.
function fakeWindow(parts: FakeWindowParts = {}): Window {
  return new Proxy(new EventTarget(), {
    get(target, property) {
      if (property === 'location') return { reload: parts.reload ?? (() => undefined) };
      if (property === 'localStorage') return parts.local?.();
      if (property in target) {
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      return parts.session?.();
    },
  }) as unknown as Window;
}

function throwSecurityError(): never {
  throw new DOMException('denied', 'SecurityError');
}

describe('SdLayoutContextService', () => {
  const hanoi: SdLayoutContext = { id: 'store-hn', title: 'Hà Nội', subtitle: 'Cửa hàng', avatar: 'https://cdn.example.com/hn.png' };
  const saigon: SdLayoutContext = { id: 'store-sg', title: 'Sài Gòn' };
  const danang: SdLayoutContext = { id: 'store-dn', title: 'Đà Nẵng' };
  const items: readonly SdLayoutContext[] = [hanoi, saigon, danang];

  let adapter: FakeStorageAdapter;
  let runtime: FakeContextRuntime;
  let namespace: SdLayoutStorageNamespace | undefined;
  let warn: jasmine.Spy;
  const otherTabInjectors: EnvironmentInjector[] = [];

  beforeEach(() => {
    adapter = new FakeStorageAdapter();
    runtime = new FakeContextRuntime();
    namespace = undefined;
    warn = spyOn(console, 'warn');
  });

  afterEach(() => {
    destroyOtherTabs();
    TestBed.resetTestingModule();
  });

  function destroyOtherTabs(): void {
    for (const injector of otherTabInjectors.splice(0)) injector.destroy();
  }

  // why: mỗi lần load trang là một injector mới (bộ nhớ storage mới) trên CÙNG adapter và marker của tab,
  // đúng như reload thật: localStorage và session storage còn, state trong bộ nhớ thì mất.
  function configure(extraProviders: Provider[] = []): void {
    destroyOtherTabs();
    TestBed.resetTestingModule();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }, ...extraProviders];
    if (namespace !== undefined) providers.push({ provide: SD_LAYOUT_STORAGE_NAMESPACE, useValue: namespace });
    TestBed.configureTestingModule({ providers });
  }

  function load(): SdLayoutContextService {
    configure([{ provide: SD_LAYOUT_CONTEXT_RUNTIME, useValue: runtime }]);
    return TestBed.inject(SdLayoutContextService);
  }

  /** Snapshot mà một lần load trước đã lưu. */
  function seed(value: SdLayoutContext): void {
    configure();
    TestBed.inject(SdLayoutStorageService).writeCurrentContext(value);
  }

  // why: SdStorageService riêng trên cùng adapter mô phỏng tab khác — nó giữ entry trong bộ nhớ riêng nên
  // ghi ở đó không chạm entry dùng chung của service đang test. Kế thừa namespace từ injector cha.
  function otherTab(extraProviders: Provider[] = []): SdLayoutStorageService {
    const injector = createEnvironmentInjector(
      [SdStorageService, SdLayoutStorageService, ...extraProviders],
      TestBed.inject(EnvironmentInjector)
    );
    otherTabInjectors.push(injector);
    return injector.get(SdLayoutStorageService);
  }

  function stored(): SdLayoutContext | null {
    return otherTab().refreshCurrentContext();
  }

  describe('getCurrentContext', () => {
    it('returns null on the first run and works without SD_LAYOUT_CONFIGURATION', () => {
      const service = load();

      expect(TestBed.inject(SD_LAYOUT_CONFIGURATION, null)).toBeNull();
      expect(service.getCurrentContext()).toBeNull();
      expect(service.current()).toBeNull();
      expect(service.items()).toEqual([]);
      expect(service.switchingId()).toBeNull();
      expect(service.switchFailed()).toBeFalse();
      expect(service.changedElsewhere()).toBeFalse();
    });

    it('returns the snapshot a previous load stored as an isolated copy', () => {
      seed(hanoi);
      const service = load();

      const context = service.getCurrentContext();
      expect(context).toEqual(hanoi);
      if (context) context.title = 'mutated';
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(service.getCurrentContext()).not.toBe(service.getCurrentContext());
      expect(service.current()).toEqual(hanoi);
    });
  });

  describe('setCurrentContext', () => {
    it('does nothing for the active id', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.setCurrentContext('store-hn');

      expect(write).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(service.switchingId()).toBeNull();
    });

    it('ignores any id before syncItems provides the items', () => {
      seed(hanoi);
      const service = load();
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.setCurrentContext('store-sg');

      expect(write).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(service.switchingId()).toBeNull();
      expect(stored()).toEqual(hanoi);
    });

    it('ignores an id that is not in items', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.setCurrentContext('store-unknown');

      expect(write).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(service.switchingId()).toBeNull();
      expect(stored()).toEqual(hanoi);
    });

    it('writes only the snapshot fields under the storage namespace and reloads once after confirming them', () => {
      namespace = 'tenant-1';
      seed(hanoi);
      const service = load();
      service.syncItems([hanoi, { ...saigon, role: 'owner' } as SdLayoutContext]);

      service.setCurrentContext('store-sg');

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(runtime.marker).toBe('store-sg');
      expect(service.switchingId()).toBe('store-sg');
      expect(service.switchFailed()).toBeFalse();
      expect(Object.keys(otherTab().currentContext.refresh() ?? {})).toEqual(['id', 'title']);
      expect(stored()).toEqual(saigon);
      expect(otherTab([{ provide: SD_LAYOUT_STORAGE_NAMESPACE, useValue: null }]).refreshCurrentContext()).toBeNull();
      // why: không có event change — context của lần load này chỉ đổi sau reload.
      expect(service.getCurrentContext()).toEqual(hanoi);
    });

    it('reports an unconfirmed switch without reloading and clears the failure on the next attempt', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);

      adapter.rejectWrites = true;
      service.setCurrentContext('store-sg');

      expect(runtime.reload).not.toHaveBeenCalled();
      expect(runtime.marker).toBeNull();
      expect(service.switchingId()).toBeNull();
      expect(service.switchFailed()).toBeTrue();
      expect(service.getCurrentContext()).toEqual(hanoi);

      adapter.rejectWrites = false;
      service.setCurrentContext('store-sg');

      expect(service.switchFailed()).toBeFalse();
      expect(service.switchingId()).toBe('store-sg');
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(runtime.marker).toBe('store-sg');
      expect(stored()).toEqual(saigon);
    });

    it('still reloads after a confirmed switch when the marker cannot be written', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      runtime.markerWritable = false;

      service.setCurrentContext('store-sg');

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(stored()).toEqual(saigon);
      expect(service.switchFailed()).toBeFalse();
    });

    it('records the switch target in the marker so a late namespace costs no extra reconcile reload', () => {
      let user: string | undefined = 'user-1';
      namespace = () => user;
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      service.setCurrentContext('store-sg');
      expect(runtime.reload).toHaveBeenCalledTimes(1);

      user = undefined;
      const next = load();
      user = 'user-1';
      next.syncItems(items);

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(next.current()).toEqual(saigon);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncItems', () => {
    it('refreshes the metadata of a valid stored id without reloading and clears the session marker', () => {
      seed({ id: 'store-hn', title: 'Tên cũ' });
      runtime.marker = 'store-hn';
      const service = load();

      service.syncItems(items);

      expect(service.current()).toEqual(hanoi);
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(stored()).toEqual(hanoi);
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(runtime.marker).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it('keeps a valid stored id that is not the first item without writing', () => {
      seed(saigon);
      const service = load();
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.syncItems(items);

      expect(write).not.toHaveBeenCalled();
      expect(service.getCurrentContext()).toEqual(saigon);
      expect(runtime.reload).not.toHaveBeenCalled();
    });

    it('stores items[0] on the first run, reloads once and does not reload on the next load', () => {
      const first = load();
      first.syncItems(items);

      expect(stored()).toEqual(hanoi);
      expect(first.current()).toEqual(hanoi);
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(runtime.marker).toBe('store-hn');

      const second = load();
      expect(second.getCurrentContext()).toEqual(hanoi);
      second.syncItems(items);

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(runtime.marker).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it('falls back to items[0] for a stale id and reloads once', () => {
      seed({ id: 'store-removed', title: 'Đã đóng cửa' });
      const first = load();
      expect(first.getCurrentContext()?.id).toBe('store-removed');

      first.syncItems(items);

      expect(stored()).toEqual(hanoi);
      expect(runtime.reload).toHaveBeenCalledTimes(1);

      load().syncItems(items);
      expect(runtime.reload).toHaveBeenCalledTimes(1);
    });

    it('stores nothing and never reloads for empty or invalid items', () => {
      const service = load();
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.syncItems([]);
      service.syncItems(null);
      service.syncItems(undefined);
      service.syncItems([{ id: '', title: 'Trống' }, { id: 'store-x', title: '  ' }, null as unknown as SdLayoutContext]);

      expect(write).not.toHaveBeenCalled();
      expect(stored()).toBeNull();
      expect(service.items()).toEqual([]);
      expect(service.current()).toBeNull();
      expect(runtime.reload).not.toHaveBeenCalled();
    });

    it('drops invalid entries and keeps the first occurrence of an id', () => {
      const service = load();

      service.syncItems([
        { id: '', title: 'Trống' },
        hanoi,
        { ...hanoi, title: 'Trùng id' },
        { id: 'store-no-title' } as SdLayoutContext,
        { id: 42, title: 'Số' } as unknown as SdLayoutContext,
        saigon,
      ]);

      expect(service.items()).toEqual([hanoi, saigon]);
      expect(stored()).toEqual(hanoi);
    });

    it('keeps an unconfirmed target in memory without reloading', () => {
      adapter.rejectWrites = true;
      const service = load();

      service.syncItems(items);

      expect(runtime.reload).not.toHaveBeenCalled();
      expect(service.current()).toEqual(hanoi);
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(runtime.marker).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.calls.mostRecent().args[0])).toContain('[SdLayoutContextService]');
    });

    it('does not reload when the session marker already holds the target and warns once', () => {
      runtime.marker = 'store-hn';
      const service = load();

      service.syncItems(items);
      service.syncItems(items);

      expect(stored()).toEqual(hanoi);
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.calls.mostRecent().args[0])).toContain('SD_LAYOUT_STORAGE_NAMESPACE');
    });

    it('does not reload when the session marker is unavailable and warns once', () => {
      runtime.markerAvailable = false;
      const service = load();

      service.syncItems(items);
      service.syncItems([...items]);

      expect(stored()).toEqual(hanoi);
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('keeps a valid load-time context in memory when another tab removed the snapshot', () => {
      seed(saigon);
      const service = load();
      service.syncItems(items);
      otherTab().clear();
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();
      const writeMarker = spyOn(runtime, 'writeMarker').and.callThrough();

      service.syncItems([hanoi, { ...saigon, subtitle: 'Quận 1' }, danang]);

      expect(service.current()).toEqual({ ...saigon, subtitle: 'Quận 1' });
      expect(service.getCurrentContext()?.id).toBe('store-sg');
      expect(write).not.toHaveBeenCalled();
      expect(writeMarker).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(stored()).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it('keeps the load-time context after a failed switch left no readable snapshot', () => {
      seed(saigon);
      const service = load();
      service.syncItems(items);
      adapter.rejectWrites = true;
      service.setCurrentContext('store-dn');
      expect(service.switchFailed()).toBeTrue();
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.syncItems(items);
      expect(service.current()).toEqual(saigon);

      adapter.rejectWrites = false;
      service.syncItems(items);

      expect(service.current()).toEqual(saigon);
      expect(service.getCurrentContext()).toEqual(saigon);
      expect(write).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it('does not reload when the session marker cannot be written', () => {
      runtime.markerWritable = false;
      const service = load();

      service.syncItems(items);

      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('reloads at most once across loads when the namespace resolves after construction', () => {
      let user: string | undefined;
      namespace = () => user;

      const first = load();
      expect(first.getCurrentContext()).toBeNull();
      user = 'user-1';
      first.syncItems(items);

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(stored()).toEqual(hanoi);

      user = undefined;
      const second = load();
      expect(second.getCurrentContext()).toBeNull();
      user = 'user-1';
      second.syncItems(items);

      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(second.current()).toEqual(hanoi);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('is idempotent for repeated calls with the same items', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      service.syncItems(items);
      service.syncItems([...items]);

      expect(write).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();

      // why: lần chạy đầu trên storage trống — lời gọi lặp sau khi đã xin reload không ghi hay reload thêm.
      adapter = new FakeStorageAdapter();
      const firstRun = load();
      firstRun.syncItems([saigon, hanoi]);
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      const rewrite = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();

      firstRun.syncItems([saigon, hanoi]);

      expect(rewrite).not.toHaveBeenCalled();
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(warn).not.toHaveBeenCalled();
    });

    it('treats a context stored by another tab as a notice when syncItems runs again', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      otherTab().writeCurrentContext(saigon);
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();
      const writeMarker = spyOn(runtime, 'writeMarker').and.callThrough();

      service.syncItems(items);

      expect(service.changedElsewhere()).toBeTrue();
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(service.current()).toEqual(hanoi);
      expect(write).not.toHaveBeenCalled();
      expect(writeMarker).not.toHaveBeenCalled();
      expect(runtime.reload).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
      expect(stored()).toEqual(saigon);

      otherTab().writeCurrentContext(hanoi);
      runtime.emitStorage();

      expect(service.changedElsewhere()).toBeFalse();
      expect(runtime.reload).not.toHaveBeenCalled();
    });

    it('stays silent and never reloads twice once a reload was requested in this load', () => {
      const service = load();
      service.syncItems(items);
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      const write = spyOn(TestBed.inject(SdLayoutStorageService), 'writeCurrentContext').and.callThrough();
      const writeMarker = spyOn(runtime, 'writeMarker').and.callThrough();

      service.syncItems(items);
      service.syncItems([saigon]);
      service.setCurrentContext('store-sg');

      expect(write).not.toHaveBeenCalled();
      expect(writeMarker).not.toHaveBeenCalled();
      expect(runtime.reload).toHaveBeenCalledTimes(1);
      expect(service.switchingId()).toBeNull();
      expect(warn).not.toHaveBeenCalled();

      // why: trang sắp tải lại — sự kiện storage không bật thông báo, reload() không gọi runtime lần hai.
      otherTab().writeCurrentContext(saigon);
      runtime.emitStorage();
      service.reload();
      expect(service.changedElsewhere()).toBeFalse();
      expect(runtime.reload).toHaveBeenCalledTimes(1);

      seed(hanoi);
      const switching = load();
      switching.syncItems(items);
      switching.setCurrentContext('store-sg');
      expect(runtime.reload).toHaveBeenCalledTimes(2);

      switching.setCurrentContext('store-dn');
      switching.syncItems(items);

      expect(runtime.reload).toHaveBeenCalledTimes(2);
      expect(stored()).toEqual(saigon);
      expect(switching.switchingId()).toBe('store-sg');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('storage events', () => {
    it('registers one listener lazily on the first syncItems and releases it with the injector', () => {
      const service = load();
      expect(runtime.listeners.size).toBe(0);

      service.syncItems([]);
      service.syncItems(items);

      expect(runtime.listeners.size).toBe(1);
      TestBed.resetTestingModule();
      expect(runtime.listeners.size).toBe(0);
    });

    it('flags a context switched in another tab while getCurrentContext keeps the load-time context', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);

      otherTab().writeCurrentContext(saigon);
      runtime.emitStorage();

      expect(service.changedElsewhere()).toBeTrue();
      expect(service.getCurrentContext()).toEqual(hanoi);
      expect(service.current()).toEqual(hanoi);
      expect(runtime.reload).not.toHaveBeenCalled();

      // why: signout ở tab khác xoá snapshot — không phải thông báo mới, cờ đang bật giữ nguyên.
      otherTab().clear();
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeTrue();

      otherTab().writeCurrentContext(hanoi);
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeFalse();

      otherTab().writeCurrentContext(danang);
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeTrue();
      expect(runtime.reload).not.toHaveBeenCalled();

      service.reload();
      service.reload();
      expect(runtime.reload).toHaveBeenCalledTimes(1);

      otherTab().writeCurrentContext(hanoi);
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeTrue();
    });

    it('ignores an unrelated change and a removed snapshot', () => {
      seed(hanoi);
      const service = load();
      service.syncItems(items);

      otherTab().writeCurrentContext({ ...hanoi, title: 'Hà Nội mới' });
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeFalse();

      otherTab().clear();
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeFalse();
      expect(service.getCurrentContext()?.id).toBe('store-hn');
      expect(runtime.reload).not.toHaveBeenCalled();
    });

    it('recaptures the snapshot without a notice when the namespace changed', () => {
      let user = 'user-1';
      namespace = () => user;
      seed(hanoi);
      const service = load();
      service.syncItems(items);
      otherTab().writeCurrentContext(danang);
      runtime.emitStorage();
      expect(service.changedElsewhere()).toBeTrue();

      user = 'user-2';
      otherTab().writeCurrentContext(saigon);
      runtime.emitStorage();

      expect(service.changedElsewhere()).toBeFalse();
      expect(service.current()).toEqual(saigon);

      otherTab().writeCurrentContext(danang);
      runtime.emitStorage();

      expect(service.changedElsewhere()).toBeTrue();
      expect(service.current()).toEqual(saigon);
      expect(runtime.reload).not.toHaveBeenCalled();
    });
  });

  describe('default runtime', () => {
    it('turns every operation into a no-op without a window', () => {
      const browser = createSdLayoutContextBrowserRuntime(null);
      const listener = jasmine.createSpy('listener');

      expect(() => browser.reload()).not.toThrow();
      const unsubscribe = browser.onStorage(listener);
      expect(() => unsubscribe()).not.toThrow();
      expect(browser.readMarker()).toBeUndefined();
      expect(browser.writeMarker('store-hn')).toBeFalse();
      expect(browser.writeMarker(null)).toBeFalse();
      expect(listener).not.toHaveBeenCalled();
    });

    it('reloads through the window and forwards only storage events of its own localStorage', () => {
      const reload = jasmine.createSpy('reload');
      const view = fakeWindow({ reload, local: () => localStorage });
      const browser = createSdLayoutContextBrowserRuntime(view);
      const listener = jasmine.createSpy('listener');

      browser.reload();
      expect(reload).toHaveBeenCalledTimes(1);

      const unsubscribe = browser.onStorage(listener);
      view.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage }));
      view.dispatchEvent(new StorageEvent('storage', { storageArea: null }));
      view.dispatchEvent(new Event('storage'));
      expect(listener).toHaveBeenCalledTimes(2);

      const foreign = fakeWindow({ local: () => ({}) });
      const foreignListener = jasmine.createSpy('foreignListener');
      createSdLayoutContextBrowserRuntime(foreign).onStorage(foreignListener);
      foreign.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage }));
      expect(foreignListener).not.toHaveBeenCalled();

      unsubscribe();
      view.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage }));
      expect(listener).toHaveBeenCalledTimes(2);

      // why: window giả không có session storage → marker coi như không khả dụng.
      expect(browser.readMarker()).toBeUndefined();
      expect(browser.writeMarker('store-hn')).toBeFalse();
    });

    it('ignores localStorage events when the window blocks its localStorage', () => {
      const blocked = fakeWindow({ local: () => throwSecurityError() });
      const listener = jasmine.createSpy('listener');
      createSdLayoutContextBrowserRuntime(blocked).onStorage(listener);

      blocked.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage }));
      expect(listener).not.toHaveBeenCalled();
      blocked.dispatchEvent(new StorageEvent('storage', { storageArea: null }));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('round-trips the marker through the session area and reports dropped or failed writes', () => {
      const area = new FakeSessionArea();
      const browser = createSdLayoutContextBrowserRuntime(fakeWindow({ session: () => area }));

      expect(browser.writeMarker('store-hn')).toBeTrue();
      expect(browser.readMarker()).toBe('store-hn');
      expect(area.values.get(SD_LAYOUT_CONTEXT_MARKER_KEY)).toBe('store-hn');
      expect(browser.writeMarker(null)).toBeTrue();
      expect(browser.readMarker()).toBeNull();

      // why: có trình duyệt bỏ qua lệnh ghi mà không ném — chỉ đọc lại mới phát hiện được.
      area.dropWrites = true;
      expect(browser.writeMarker('store-sg')).toBeFalse();
      expect(browser.readMarker()).toBeNull();

      area.dropWrites = false;
      area.failWrites = true;
      expect(browser.writeMarker('store-sg')).toBeFalse();
      expect(browser.readMarker()).toBeNull();
    });

    it('treats a session area that throws on access as unavailable', () => {
      const browser = createSdLayoutContextBrowserRuntime(fakeWindow({ session: () => throwSecurityError() }));

      expect(browser.readMarker()).toBeUndefined();
      expect(browser.writeMarker('store-hn')).toBeFalse();
      expect(browser.writeMarker(null)).toBeFalse();
    });

    it('round-trips the marker through the session storage of the injected document window', () => {
      configure();
      const browser = TestBed.inject(SD_LAYOUT_CONTEXT_RUNTIME);

      try {
        expect(browser.writeMarker('store-hn')).toBeTrue();
        expect(browser.readMarker()).toBe('store-hn');
        expect(browser.writeMarker(null)).toBeTrue();
        expect(browser.readMarker()).toBeNull();
      } finally {
        browser.writeMarker(null);
      }
    });
  });
});

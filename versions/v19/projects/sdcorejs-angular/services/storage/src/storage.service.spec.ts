import { TestBed } from '@angular/core/testing';
import { SdStorageService } from './storage.service';

describe('SdStorageService', () => {
  let service: SdStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdStorageService);
  });

  it('set() persists value AND emits subject', () => {
    const storage = service.create<{ v: number }>('test-key-1');
    const emissions: any[] = [];
    storage.subject.subscribe(val => emissions.push(val));

    storage.set({ v: 10 });

    expect(storage.get()).toEqual({ v: 10 });
    // emissions[0] là initial undefined, emissions[1] là { v: 10 }
    expect(emissions.length).toBe(2);
    expect(emissions[1]).toEqual({ v: 10 });
  });

  it('setSilent() persists value but does NOT emit subject', () => {
    const storage = service.create<{ v: number }>('test-key-2');
    const emissions: any[] = [];
    storage.subject.subscribe(val => emissions.push(val));

    storage.setSilent({ v: 20 });

    expect(storage.get()).toEqual({ v: 20 });
    // chỉ có 1 emission ban đầu (undefined) — không có emission cho setSilent
    expect(emissions.length).toBe(1);
  });

  it('setSilent() ghi localStorage giống set()', () => {
    const storage = service.create<{ v: number }>('test-key-3');
    storage.setSilent({ v: 30 });

    const raw = localStorage.getItem('test-key-3');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.data).toEqual({ v: 30 });
  });
});

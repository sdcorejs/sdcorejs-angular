import { TestBed } from '@angular/core/testing';
import { SdStorageService } from '../../../../services';
import { SD_TABLE_CONFIGURATION } from '../configurations';
import { SdTableOption } from '../models/table-option.model';
import { ConfigService } from './config.service';

describe('ConfigService.persistColumnWidth', () => {
  let service: ConfigService;

  const option: SdTableOption = {
    key: 'test-table',
    type: 'local',
    items: () => [],
    columns: [
      { field: 'name', title: 'Name', type: 'string', width: '120px' },
      { field: 'age', title: 'Age', type: 'number', width: '80px' },
    ],
  } as any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        SdStorageService,
        { provide: SD_TABLE_CONFIGURATION, useValue: null },
      ],
    });
    service = TestBed.inject(ConfigService);
  });

  it('does nothing if init() chưa được gọi', () => {
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));
    service.persistColumnWidth('name', '200px');
    expect(emitted).toBeNull();
  });

  it('cập nhật width của đúng field và emit widthChange\$', () => {
    const storage = service.init(option);
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));

    service.persistColumnWidth('name', '200px');

    const stored = storage.get();
    expect(stored.columns!.find(c => c.origin.field === 'name')!.width).toBe('200px');
    expect(stored.columns!.find(c => c.origin.field === 'age')!.width).toBe('80px');
    expect(emitted).toEqual({ field: 'name', width: '200px' });
  });

  it('KHÔNG emit qua storage.subject (silent)', () => {
    const storage = service.init(option);
    const emissions: any[] = [];
    storage.subject.subscribe(v => emissions.push(v));
    const baseline = emissions.length;

    service.persistColumnWidth('name', '180px');

    // emissions.length giữ nguyên: setSilent không trigger subject
    expect(emissions.length).toBe(baseline);
  });

  it('bỏ qua field không tồn tại trong storage', () => {
    service.init(option);
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));

    service.persistColumnWidth('nonexistent', '300px');

    expect(emitted).toBeNull();
  });
});

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
      providers: [ConfigService, SdStorageService, { provide: SD_TABLE_CONFIGURATION, useValue: null }],
    });
    service = TestBed.inject(ConfigService);
  });

  it('does nothing if init() chưa được gọi', () => {
    let emitted: any = null;
    service.widthChange$.subscribe(v => (emitted = v));
    service.persistColumnWidth('name', '200px');
    expect(emitted).toBeNull();
  });

  it('cập nhật width của đúng field và emit widthChange$', () => {
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

describe('ConfigService.loadConfigurationResult — filler column', () => {
  let service: ConfigService;

  const baseOption = (overrides: Partial<SdTableOption> = {}): SdTableOption =>
    ({
      type: 'local',
      items: () => [],
      columns: [
        { field: 'name', title: 'Name', type: 'string', width: '120px' },
        { field: 'age', title: 'Age', type: 'number', width: '80px' },
      ],
      ...overrides,
    }) as SdTableOption;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [ConfigService, SdStorageService, { provide: SD_TABLE_CONFIGURATION, useValue: null }],
    });
    service = TestBed.inject(ConfigService);
  });

  it('mặc định (filler không truyền) → KHÔNG có sdFiller trong displayedColumns/firstHeaders/displayedFooters', () => {
    const opt = baseOption();
    const cfg = service.loadConfiguredTable(opt);
    const result = service.loadConfigurationResult(opt, cfg);
    expect(result.displayedColumns).not.toContain('sdFiller');
    expect(result.firstHeaders).not.toContain('sdFiller');
    expect(result.displayedFooters).not.toContain('sdFiller');
  });

  it('filler.enabled = false → vẫn KHÔNG có sdFiller', () => {
    const opt = baseOption({ filler: { enabled: false } } as Partial<SdTableOption>);
    const cfg = service.loadConfiguredTable(opt);
    const result = service.loadConfigurationResult(opt, cfg);
    expect(result.displayedColumns).not.toContain('sdFiller');
  });

  it('filler.enabled = true → sdFiller xuất hiện ở CUỐI displayedColumns + firstHeaders + displayedFooters', () => {
    const opt = baseOption({ filler: { enabled: true } } as Partial<SdTableOption>);
    const cfg = service.loadConfiguredTable(opt);
    const result = service.loadConfigurationResult(opt, cfg);

    expect(result.displayedColumns[result.displayedColumns.length - 1]).toBe('sdFiller');
    expect(result.firstHeaders[result.firstHeaders.length - 1]).toBe('sdFiller');
    expect(result.displayedFooters[result.displayedFooters.length - 1]).toBe('sdFiller');
  });

  it('filler đặt SAU command-right (sticky end vẫn ở vị trí cuối logical row)', () => {
    const opt = baseOption({
      filler: { enabled: true },
      command: { align: 'right', commands: [{ icon: 'edit', click: () => undefined }] },
    } as Partial<SdTableOption>);
    const cfg = service.loadConfiguredTable(opt);
    const result = service.loadConfigurationResult(opt, cfg);

    const cmdIdx = result.displayedColumns.indexOf('sdCommand');
    const fillerIdx = result.displayedColumns.indexOf('sdFiller');
    expect(cmdIdx).toBeGreaterThanOrEqual(0);
    expect(fillerIdx).toBeGreaterThan(cmdIdx);
  });

  it('filler đặt SAU sdIndex và sdSelection', () => {
    const opt = baseOption({
      filler: { enabled: true },
      index: { enabled: true },
      selector: { visible: true },
    } as Partial<SdTableOption>);
    const cfg = service.loadConfiguredTable(opt);
    const result = service.loadConfigurationResult(opt, cfg);

    const selIdx = result.displayedColumns.indexOf('sdSelection');
    const idxIdx = result.displayedColumns.indexOf('sdIndex');
    const fillerIdx = result.displayedColumns.indexOf('sdFiller');
    expect(fillerIdx).toBeGreaterThan(selIdx);
    expect(fillerIdx).toBeGreaterThan(idxIdx);
  });
});

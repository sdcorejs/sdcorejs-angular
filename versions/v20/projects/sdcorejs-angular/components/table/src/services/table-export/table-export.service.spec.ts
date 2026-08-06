import { TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';

import { TableExportService } from './table-export.service';

/**
 * The export button label used to be the hard-coded English string 'Export',
 * so a Vietnamese user saw "Export" instead of "Xuất dữ liệu". These specs pin
 * the label (and the in-progress label) to the i18n catalog.
 */
describe('TableExportService — export label i18n', () => {
  let service: TableExportService;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TableExportService] });
    service = TestBed.inject(TableExportService);
    i18n = TestBed.inject(I18nService);
  });

  it('shows the Vietnamese label when the app runs in Vietnamese', () => {
    i18n.setLanguage('vi', { reload: false });

    expect(service.exportTitle()).toBe('Xuất dữ liệu');
  });

  it('shows the English label when the app runs in English', () => {
    i18n.setLanguage('en', { reload: false });

    expect(service.exportTitle()).toBe('Export');
  });

  it('reports export progress through the i18n catalog, not a hard-coded string', () => {
    i18n.setLanguage('vi', { reload: false });

    service.setExportProgress(42);

    expect(service.exportTitle()).toBe('Đang xuất...42%');
  });

  it('returns to the idle label once progress is cleared', () => {
    i18n.setLanguage('vi', { reload: false });
    service.setExportProgress(42);

    service.setExportProgress(null);

    expect(service.exportTitle()).toBe('Xuất dữ liệu');
  });
});

import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { ViewDateTimePipe } from './view-date.pipe';

const configure = (timeZone?: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
  });
};

describe('ViewDateTimePipe with ISdCoreConfiguration.timeZone', () => {
  it('shows an instant as the wall clock of the configured zone', () => {
    configure('Asia/Ho_Chi_Minh');
    expect(TestBed.inject(ViewDateTimePipe).transform('1960-05-19T16:00:00Z')).toBe('00:00 20/05/1960');
    configure('Asia/Bangkok');
    expect(TestBed.inject(ViewDateTimePipe).transform('1960-05-19T16:00:00Z')).toBe('23:00 19/05/1960');
  });

  it('keeps the local behavior without a zone or when created with new', () => {
    configure();
    expect(TestBed.inject(ViewDateTimePipe).transform('1960-05-19T16:00:00Z')).toBe(
      DateUtilities.toFormat('1960-05-19T16:00:00Z', 'HH:mm dd/MM/yyyy')
    );
    configure('Asia/Ho_Chi_Minh');
    expect(new ViewDateTimePipe().transform('1960-05-19T16:00:00Z')).toBe(
      DateUtilities.toFormat('1960-05-19T16:00:00Z', 'HH:mm dd/MM/yyyy')
    );
  });
});

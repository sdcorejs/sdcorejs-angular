import { TestBed } from '@angular/core/testing';
import { ISdLayoutConfiguration, SD_LAYOUT_CONFIGURATION } from '../configurations';
import { SD_LAYOUT_DEMO_FALLBACK, SdLayoutService } from './layout.service';

function baseConfiguration(overrides: Partial<ISdLayoutConfiguration> = {}): ISdLayoutConfiguration {
  return {
    sidebar: { version: 1, defaultTitle: 'Portal' },
    userInfo: { fullName: 'Real User', email: 'real@company.example' },
    signout: jasmine.createSpy('signout'),
    ...overrides,
  };
}

describe('SdLayoutService configuration contract', () => {
  it('throws instead of silently degrading to a fake signed-in demo user', () => {
    TestBed.configureTestingModule({});

    expect(() => TestBed.inject(SdLayoutService)).toThrowError(/SD_LAYOUT_CONFIGURATION/);
  });

  it('does not fall back when the demo flag is explicitly false', () => {
    TestBed.configureTestingModule({ providers: [{ provide: SD_LAYOUT_DEMO_FALLBACK, useValue: false }] });

    expect(() => TestBed.inject(SdLayoutService)).toThrowError(/SD_LAYOUT_DEMO_FALLBACK/);
  });

  it('uses mock data only when the consumer opts into the demo fallback', () => {
    TestBed.configureTestingModule({ providers: [{ provide: SD_LAYOUT_DEMO_FALLBACK, useValue: true }] });
    const warn = spyOn(console, 'warn');

    const service = TestBed.inject(SdLayoutService);

    expect(service.userInfo()?.email).toBe('demo@example.com');
    expect(service.sidebar()?.version).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it('resolves static user info and sidebar from the configuration', () => {
    TestBed.configureTestingModule({ providers: [{ provide: SD_LAYOUT_CONFIGURATION, useValue: baseConfiguration() }] });

    const service = TestBed.inject(SdLayoutService);

    expect(service.userInfo()?.email).toBe('real@company.example');
    expect(service.sidebar()?.defaultTitle).toBe('Portal');
  });

  it('resolves async factory user info and sidebar from the configuration', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: baseConfiguration({
            userInfo: () => Promise.resolve({ fullName: 'Async User', email: 'async@company.example' }),
            sidebar: () => Promise.resolve({ version: 3 as const, defaultTitle: 'Async Portal' }),
          }),
        },
      ],
    });

    const service = TestBed.inject(SdLayoutService);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.userInfo()?.email).toBe('async@company.example');
    expect(service.sidebar()?.defaultTitle).toBe('Async Portal');
  });

  it('exposes the configured homeUrl and falls back to the app root', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SD_LAYOUT_CONFIGURATION, useValue: baseConfiguration({ homeUrl: '  /dashboard  ' }) }],
    });

    expect(TestBed.inject(SdLayoutService).homeUrl).toBe('/dashboard');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SD_LAYOUT_CONFIGURATION, useValue: baseConfiguration() }] });

    expect(TestBed.inject(SdLayoutService).homeUrl).toBe('/');
  });
});

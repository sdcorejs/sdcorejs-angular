import { TestBed } from '@angular/core/testing';

import { LucideHash, LucideMail } from '@lucide/angular';

import { SD_ICON_DEFAULT_CONFIG, type SdIconShape, type SdLucideIconRegistration } from './icon.model';
import { normalizeSdLucideIcons, provideSdIcon, resolveSdIconConfig, SD_ICON_CONFIGURATION } from './icon.provider';

describe('normalizeSdLucideIcons', () => {
  it('accepts a readonly array and returns a copy', () => {
    const registrations: readonly SdLucideIconRegistration[] = Object.freeze([LucideHash, LucideMail]);
    const normalized = normalizeSdLucideIcons(registrations);
    expect(normalized).toEqual([LucideHash, LucideMail]);
    expect(normalized).not.toBe(registrations);
  });

  it('accepts a readonly object map', () => {
    const registrations: Readonly<Record<string, SdLucideIconRegistration>> = Object.freeze({ hash: LucideHash });
    expect(normalizeSdLucideIcons(registrations)).toEqual([LucideHash]);
  });
});

describe('icon provider defaultShape', () => {
  it('resolves square when no shape is configured', () => {
    expect(resolveSdIconConfig().defaultShape).toBe('square');
    expect(SD_ICON_DEFAULT_CONFIG.defaultShape).toBe('square');
  });

  it('keeps the configured shape', () => {
    const shapes: SdIconShape[] = ['square', 'circle', 'none'];
    for (const shape of shapes) {
      expect(resolveSdIconConfig({ defaultShape: shape }).defaultShape).toBe(shape);
    }
  });

  it('token falls back to square without a provider', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SD_ICON_CONFIGURATION).defaultShape).toBe('square');
  });

  it('provideSdIcon changes the app default', () => {
    TestBed.configureTestingModule({ providers: [provideSdIcon({ defaultShape: 'circle' })] });
    expect(TestBed.inject(SD_ICON_CONFIGURATION).defaultShape).toBe('circle');
  });
});

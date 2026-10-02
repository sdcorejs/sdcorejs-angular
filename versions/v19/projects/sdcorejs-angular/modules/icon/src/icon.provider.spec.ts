import { TestBed } from '@angular/core/testing';

import { SD_ICON_DEFAULT_CONFIG, type SdIconShape } from './icon.model';
import { provideSdIcon, resolveSdIconConfig, SD_ICON_CONFIGURATION } from './icon.provider';

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

import type { SdFormGenericButton } from '../models/form-generic-element.model';
import { sdButtonAppearance, sdButtonIntent } from './form-generic-button';

const button = (patch: Partial<SdFormGenericButton> & Record<string, unknown> = {}): SdFormGenericButton =>
  ({ id: 'b', type: 'button', label: 'Send', action: 'submit', ...patch }) as SdFormGenericButton;

describe('form generic button rules', () => {
  describe('sdButtonAppearance', () => {
    it('defaults to fill / primary for submit and light / secondary for reset and custom, aligned at the start', () => {
      expect(sdButtonAppearance(button())).toEqual({ type: 'fill', color: 'primary', align: 'start', block: false, prefixIcon: null });
      expect(sdButtonAppearance(button({ action: 'reset' }))).toEqual({
        type: 'light',
        color: 'secondary',
        align: 'start',
        block: false,
        prefixIcon: null,
      });
      expect(sdButtonAppearance(button({ action: 'custom', name: 'x' }))).toEqual({
        type: 'light',
        color: 'secondary',
        align: 'start',
        block: false,
        prefixIcon: null,
      });
    });

    it('uses the variant, color, alignment and icon of the schema', () => {
      expect(sdButtonAppearance(button({ variant: 'outline', color: 'error', align: 'end', icon: ' save ' }))).toEqual({
        type: 'outline',
        color: 'error',
        align: 'end',
        block: false,
        prefixIcon: 'save',
      });
    });

    it('fills the whole cell when aligned to stretch', () => {
      expect(sdButtonAppearance(button({ align: 'stretch' }))).toEqual(jasmine.objectContaining({ align: 'stretch', block: true }));
    });

    it('falls back to the defaults for an unknown variant or alignment and a blank icon', () => {
      expect(sdButtonAppearance(button({ variant: 'neon', align: 'middle', icon: '  ' } as never))).toEqual({
        type: 'fill',
        color: 'primary',
        align: 'start',
        block: false,
        prefixIcon: null,
      });
    });
  });

  describe('sdButtonIntent', () => {
    it('submit validates and emits submit; reset never validates and emits reset', () => {
      expect(sdButtonIntent(button())).toEqual({ kind: 'submit', action: 'submit', validates: true });
      expect(sdButtonIntent(button({ action: 'reset' }))).toEqual({ kind: 'reset', action: 'reset', validates: false });
    });

    it('custom emits its trimmed name and validates only when validate is true', () => {
      expect(sdButtonIntent(button({ action: 'custom', name: ' save-draft ' }))).toEqual({
        kind: 'custom',
        action: 'save-draft',
        validates: false,
      });
      expect(sdButtonIntent(button({ action: 'custom', name: 'review', validate: true }))).toEqual({
        kind: 'custom',
        action: 'review',
        validates: true,
      });
      // why: validate only applies to custom buttons — submit always validates, reset never does.
      expect(sdButtonIntent(button({ action: 'reset', validate: true }))).toEqual({ kind: 'reset', action: 'reset', validates: false });
    });

    it('returns null for a button that breaks the grammar (it is not rendered)', () => {
      for (const patch of [
        { label: '' },
        { action: 'delete' },
        { action: 'custom' },
        { action: 'custom', name: 'submit' },
        { action: 'custom', name: ' reset ' },
      ]) {
        expect(sdButtonIntent(button(patch as never)))
          .withContext(JSON.stringify(patch))
          .toBeNull();
      }
    });
  });
});

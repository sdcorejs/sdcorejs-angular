import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdEditor } from './editor.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdEditor', () => {
  let fixture: ComponentFixture<SdEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdEditor, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdEditor);
  });

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting disabled input', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      // initial: data-disabled === 'false'
      expect(el.getAttribute('data-disabled')).toBe('false');

      // set disabled to true
      setInput(fixture, 'disabled', true);
      expect(el.getAttribute('data-disabled')).toBe('true');

      // set disabled back to false
      setInput(fixture, 'disabled', false);
      expect(el.getAttribute('data-disabled')).toBe('false');
    });

    it('renders data-empty toggling with valueModel', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      // initial empty: data-empty === 'true'
      expect(el.getAttribute('data-empty')).toBe('true');

      // set model to non-empty string
      setInput(fixture, 'model', 'hello');
      expect(el.getAttribute('data-empty')).toBe('false');

      // set model back to empty string
      setInput(fixture, 'model', '');
      expect(el.getAttribute('data-empty')).toBe('true');

      // set model to whitespace-only (still not empty by sdIsEmpty logic)
      setInput(fixture, 'model', '  ');
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders both data-disabled and data-empty together', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      setInput(fixture, 'disabled', true);
      setInput(fixture, 'model', 'content');

      expect(el.getAttribute('data-disabled')).toBe('true');
      expect(el.getAttribute('data-empty')).toBe('false');
    });
  });
});

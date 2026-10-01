import { SD_FORM_GENERIC_BREAKPOINTS } from '../configurations/form-generic-breakpoints';
import type { SdFormGenericLayout } from '../models/form-generic-field.model';
import {
  sdEffectiveBreakpoint,
  sdPackRows,
  sdResolveBreakpoint,
  sdResolveBreakpoints,
  sdResolveSpan,
  sdSpanSource,
  sdWithNewRow,
  sdWithSpan,
} from './form-generic-layout';

interface Item {
  id: string;
  type: string;
  layout?: SdFormGenericLayout;
}

const item = (id: string, layout?: SdFormGenericLayout, type = 'textfield'): Item => ({ id, type, layout });
const rowsOf = (items: Item[], level: 'desktop' | 'tablet' | 'mobile') =>
  sdPackRows(items, level).map(row => row.map(cell => `${cell.element.id}:${cell.span}`));

describe('form generic layout', () => {
  describe('breakpoints', () => {
    it('defaults to tablet 600px and desktop 1024px, measured on the form width', () => {
      expect(SD_FORM_GENERIC_BREAKPOINTS).toEqual({ tablet: 600, desktop: 1024 });
      expect(sdResolveBreakpoint(599)).toBe('mobile');
      expect(sdResolveBreakpoint(600)).toBe('tablet');
      expect(sdResolveBreakpoint(1023)).toBe('tablet');
      expect(sdResolveBreakpoint(1024)).toBe('desktop');
    });

    it('treats an unmeasured width as desktop', () => {
      expect(sdResolveBreakpoint(0)).toBe('desktop');
      expect(sdResolveBreakpoint(Number.NaN)).toBe('desktop');
    });

    it('merges a partial override with the defaults', () => {
      const breakpoints = sdResolveBreakpoints({ tablet: 700 });
      expect(breakpoints).toEqual({ tablet: 700, desktop: 1024 });
      expect(sdResolveBreakpoint(650, breakpoints)).toBe('mobile');
      expect(sdResolveBreakpoint(800, breakpoints)).toBe('tablet');
      expect(sdResolveBreakpoints({ tablet: undefined })).toEqual({ tablet: 600, desktop: 1024 });
    });

    it('lets a forced level win over the measured width and falls back when it is cleared', () => {
      expect(sdEffectiveBreakpoint('mobile', 1200)).toBe('mobile');
      expect(sdEffectiveBreakpoint(null, 1200)).toBe('desktop');
      expect(sdEffectiveBreakpoint(undefined, 700, { tablet: 600, desktop: 1024 })).toBe('tablet');
    });
  });

  describe('span inheritance', () => {
    it('uses desktop 12, tablet from desktop and mobile 12 by default', () => {
      expect(sdResolveSpan(undefined, 'desktop')).toBe(12);
      expect(sdResolveSpan({ span: { desktop: 6 } }, 'tablet')).toBe(6);
      expect(sdResolveSpan({ span: { desktop: 6 } }, 'mobile')).toBe(12);
      expect(sdResolveSpan({ span: { desktop: 6, tablet: 4, mobile: 6 } }, 'tablet')).toBe(4);
      expect(sdResolveSpan({ span: { desktop: 6, tablet: 4, mobile: 6 } }, 'mobile')).toBe(6);
    });

    it('clamps spans to whole columns between 1 and 12', () => {
      expect(sdResolveSpan({ span: { desktop: 0 } }, 'desktop')).toBe(1);
      expect(sdResolveSpan({ span: { desktop: 20 } }, 'desktop')).toBe(12);
      expect(sdResolveSpan({ span: { desktop: 5.6 } }, 'desktop')).toBe(6);
    });

    it('reports where each level takes its span from', () => {
      expect(sdSpanSource({ span: { desktop: 6 } }, 'desktop')).toBe('own');
      expect(sdSpanSource(undefined, 'desktop')).toBe('default');
      expect(sdSpanSource({ span: { desktop: 6 } }, 'tablet')).toBe('desktop');
      expect(sdSpanSource({ span: { tablet: 4 } }, 'tablet')).toBe('own');
      expect(sdSpanSource({ span: { desktop: 6 } }, 'mobile')).toBe('default');
    });
  });

  describe('row packing', () => {
    it('keeps two desktop-6 fields on one row at desktop and tablet and stacks them at mobile', () => {
      const items = [item('a', { span: { desktop: 6 } }), item('b', { span: { desktop: 6 } })];
      expect(rowsOf(items, 'desktop')).toEqual([['a:6', 'b:6']]);
      expect(rowsOf(items, 'tablet')).toEqual([['a:6', 'b:6']]);
      expect(rowsOf(items, 'mobile')).toEqual([['a:12'], ['b:12']]);
    });

    it('starts a new row for newRow even when the previous row has room', () => {
      const items = [
        item('a', { span: { desktop: 4 } }),
        item('b', { span: { desktop: 4 }, newRow: true }),
        item('c', { span: { desktop: 4 } }),
      ];
      expect(rowsOf(items, 'desktop')).toEqual([['a:4'], ['b:4', 'c:4']]);
    });

    it('wraps greedily when the next element does not fit', () => {
      const items = [item('a', { span: { desktop: 8 } }), item('b', { span: { desktop: 6 } }), item('c', { span: { desktop: 6 } })];
      expect(rowsOf(items, 'desktop')).toEqual([['a:8'], ['b:6', 'c:6']]);
    });

    it('gives a group a full row of its own', () => {
      const items = [
        item('a', { span: { desktop: 6 } }),
        item('g', { span: { desktop: 4 } }, 'group'),
        item('b', { span: { desktop: 6 } }),
      ];
      expect(rowsOf(items, 'desktop')).toEqual([['a:6'], ['g:12'], ['b:6']]);
    });

    it('packs an element of an unknown type by its layout like any other element', () => {
      const items = [item('a', { span: { desktop: 6 } }), item('x', { span: { desktop: 6 } }, 'heading'), item('y', undefined, 'heading')];
      expect(rowsOf(items, 'desktop')).toEqual([['a:6', 'x:6'], ['y:12']]);
    });
  });

  describe('layout edits', () => {
    it('changes only the selected level and returns a new object', () => {
      const layout = Object.freeze({ span: Object.freeze({ desktop: 6, mobile: 12 }) }) as SdFormGenericLayout;
      const next = sdWithSpan(layout, 'tablet', 4);
      expect(next).toEqual({ span: { desktop: 6, tablet: 4, mobile: 12 } });
      expect(next).not.toBe(layout);
      expect(layout).toEqual({ span: { desktop: 6, mobile: 12 } });
    });

    it('clears a level back to inheritance and drops an empty span', () => {
      expect(sdWithSpan({ span: { desktop: 6, tablet: 4 } }, 'tablet', null)).toEqual({ span: { desktop: 6 } });
      expect(sdWithSpan({ span: { tablet: 4 }, newRow: true }, 'tablet', null)).toEqual({ newRow: true });
      expect(sdWithSpan(undefined, 'desktop', 20)).toEqual({ span: { desktop: 12 } });
    });

    it('sets and clears newRow', () => {
      expect(sdWithNewRow({ span: { desktop: 6 } }, true)).toEqual({ span: { desktop: 6 }, newRow: true });
      expect(sdWithNewRow({ span: { desktop: 6 }, newRow: true }, false)).toEqual({ span: { desktop: 6 } });
    });
  });
});

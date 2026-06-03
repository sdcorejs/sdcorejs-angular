import { signal } from '@angular/core';

import { SdViewed, sdViewedTransform, sdViewedInline } from './sd-viewed';

describe('sdViewedTransform', () => {
  it('default false; bare-attr "" → true; "inline" → "inline"; booleans/null pass through', () => {
    // asserts: bare-attribute coercion is preserved AND the literal 'inline' survives (booleanAttribute would force it to true)
    expect(sdViewedTransform(false)).toBe(false);
    expect(sdViewedTransform('' as never)).toBe(true); // <sd-select viewed>
    expect(sdViewedTransform(true)).toBe(true);
    expect(sdViewedTransform('inline')).toBe('inline');
    expect(sdViewedTransform(null)).toBe(false);
    expect(sdViewedTransform(undefined)).toBe(false);
  });
});

describe('sdViewedInline', () => {
  it('isInline / isViewed reflect the tri-state', () => {
    // asserts: isViewed is true ONLY for `true` (static); inline is NOT isViewed (editor must mount)
    const viewed = signal<SdViewed>(false);
    const api = sdViewedInline(viewed);
    expect(api.isInline()).toBe(false);
    expect(api.isViewed()).toBe(false); // edit

    viewed.set(true);
    expect(api.isInline()).toBe(false);
    expect(api.isViewed()).toBe(true); // static view

    viewed.set('inline');
    expect(api.isInline()).toBe(true);
    expect(api.isViewed()).toBe(false); // inline → editor rendered (hidden), text face on top
  });

  it('enterInlineEdit opens the picker only in inline mode', () => {
    // asserts: enterInlineEdit is a no-op unless viewed==='inline' — never opens a static/edit field
    const viewed = signal<SdViewed>(true);
    let opened = 0;
    const api = sdViewedInline(viewed, () => (opened += 1));
    api.enterInlineEdit();
    expect(opened).toBe(0); // not inline → no-op

    viewed.set('inline');
    api.enterInlineEdit();
    expect(opened).toBe(1);
  });

  it('disabled makes inline behave like viewed=true (static, not editable)', () => {
    // asserts: a disabled 'inline' field → isInline false, isViewed true; enterInlineEdit no-op
    const viewed = signal<SdViewed>('inline');
    const disabled = signal(false);
    let opened = 0;
    const api = sdViewedInline(viewed, () => (opened += 1), disabled);
    expect(api.isInline()).toBe(true);
    expect(api.isViewed()).toBe(false);

    disabled.set(true);
    expect(api.isInline()).toBe(false);
    expect(api.isViewed()).toBe(true); // treated as static view
    api.enterInlineEdit();
    expect(opened).toBe(0); // disabled → cannot enter edit
  });
});

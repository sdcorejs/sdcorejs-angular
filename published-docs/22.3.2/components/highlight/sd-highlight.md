# `<sd-highlight>`

**Type**: Component
**Selector**: `sd-highlight`
**Import path**: `@sdcorejs/angular/components/highlight` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdHighlight`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Renders a piece of text and wraps every match of a search term in `<mark>` — Vietnamese-aware
(diacritics and `đ`/`Đ` ignored), case-insensitive, and safe: the text is always rendered as text,
never as HTML.

## When to use
- Highlighting a search keyword in list items, table cells, option labels, menu entries.
- Anywhere the text comes from data you do not control (user input, API) — markup in the text shows as
  literal characters.

## When NOT to use
- Rich HTML content — the component renders plain text only.
- Fuzzy / initials matching ("sp" → "Sản phẩm") — matching is contiguous, diacritic-insensitive
  substring search.
- The layout menu search (`highLightSearch` pipe) keeps its own behaviour in this release; it is not
  wired to `sd-highlight` yet.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `text` | `string \| number \| null \| undefined` | `''` | Text to render. Numbers are converted with `String()`; `null`/`undefined` render nothing. |
| `term` | `string \| null \| undefined` | `''` | Search term. Trimmed; an empty, blank or diacritic-only term highlights nothing. |

## Outputs
None.

## Public API
| Member | Type | Notes |
| --- | --- | --- |
| `segments` | `Signal<readonly SdHighlightSegment[]>` | The pieces that are rendered: `{ text, match }`. Useful for tests. |

`SdHighlightSegment` is exported from the same entry point.

## Matching rules
Matching is done by `sdFindHighlightRanges` from `@sdcorejs/angular/utilities/extensions`:

- `'duc'` matches `Đức`, `ĐỨC`, `đuc`; `'ha noi'` matches `Hà Nội` and `HÀ NỘI`.
- Every non-overlapping occurrence is marked, left to right.
- No `RegExp` is built from the term — `(`, `*`, `.`, `[` match literally and never throw.
- Ranges never split an emoji (surrogate pair) and keep combining accents with their letter.
- Inner whitespace is compared as-is: `'a  b'` does not match `'a b'`.

## Security
The template renders each segment through an interpolation (a text node) and `<mark>` elements —
there is no `innerHTML`. Text such as `<img src=x onerror=…>` appears on screen as those characters and
is never parsed.

## Visual cues
- Plain inline text; matches get the browser's highlight colours (`Mark` / `MarkText` system colours),
  which also adapt to Windows high-contrast mode.

## Theming / CSS surface
| Selector / hook | Purpose |
| --- | --- |
| `.sd-highlight` | Host element (inline). |
| `.sd-highlight-mark` | Each `<mark>`. |
| `--sd-highlight-bg` | Background of a match (default: system `Mark`). |
| `--sd-highlight-color` | Text colour of a match (default: system `MarkText`). |

## Examples

### 1. Highlight a keyword in a list
```html
@for (name of names; track name) {
  <li><sd-highlight [text]="name" [term]="keyword()"></sd-highlight></li>
}
```

### 2. Custom colours
```scss
.results {
  --sd-highlight-bg: var(--sd-warning-light);
  --sd-highlight-color: var(--sd-black);
}
```

## Accessibility
- `<mark>` is exposed to assistive technology as highlighted/marked text where supported; the full
  text is still read in order.
- Colour is not the only cue in forced-colours mode: the system `Mark` colours are used by default.

## Anti-patterns
- Building a string with `<mark>` and binding it with `[innerHTML]` — use this component instead.
- Passing HTML as `text` expecting it to render — it is shown as text on purpose.

## Related
- `sdNormalizeSearchText`, `sdFindHighlightRanges` — `@sdcorejs/angular/utilities/extensions`.

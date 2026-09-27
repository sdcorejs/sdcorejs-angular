# Utilities — Extensions

**Import path**: `@sdcorejs/angular/utilities/extensions`

Local pure-function helpers owned by this library. None of them mutate global prototypes — import the named export and call its members.

> **No more `@sdcorejs/utils` re-exports.** This entry point used to re-export `ArrayUtilities`, `StringUtilities`, `NumberUtilities`, `DateUtilities`, `ColorUtilities`, `ValidationUtilities`, `Utilities` and `BrowserUtilities` from `@sdcorejs/utils/fns`. Those re-exports are removed: anything owned by `@sdcorejs/utils` is imported from `@sdcorejs/utils` directly (`import { ArrayUtilities } from '@sdcorejs/utils/fns'`) and documented there. `@sdcorejs/utils` is a runtime dependency of this package, so it is already in your tree — add it to your own `package.json` when you import from it directly. What remains below is code that lives in this repository.

---

## `object.extension.ts` — `ObjectUtilities`

Deep-clone and deep-merge for plain objects. Prototype-safe: only `Object.prototype`/`null`-prototype objects recurse; class instances, `Date`, `Map`, … are copied by reference.

| Name | Signature | Purpose |
| --- | --- | --- |
| `isPlainObject` | `(value: unknown) => value is Record<PropertyKey, unknown>` | `true` only for object literals / `Object.create(null)`. |
| `clone` | `<T>(value: T) => T` | Recursive copy of arrays + plain objects; everything else by reference. |
| `merge` | `<T, U>(target: T, source: U) => T & U` | Immutable deep merge of two plain objects; `undefined` source values are skipped. |
| `deepMerge` | `<T>(...sources: T[]) => T` | Left-to-right `merge` over any number of objects. |

---

## `url-safety.ts` — URL parsing and external-link guards

Security helpers behind the sidebar/link handling and `SdKeycloakInterceptor` route matching. See the source for full doc comments.

| Name | Signature | Purpose |
| --- | --- | --- |
| `sdParseUrl` | `(value, base?) => URL \| undefined` | Safe `new URL(...)` — returns `undefined` instead of throwing. |
| `sdResolveBaseOrigin` | `(explicit?) => string` | Document origin, or `SD_NON_BROWSER_ORIGIN` under SSR. |
| `sdIsExternalHttpUrl` | `(value) => boolean` | `true` only for absolute `http:`/`https:` URLs **without embedded credentials**. `javascript:` and `user:pass@` forms fail. |
| `sdOpenExternal` | `(value, target?) => Window \| null` | `window.open` gated by `sdIsExternalHttpUrl`, always `noopener,noreferrer`. |
| `sdIsAllowedOrigin` | `(url, allowedOrigins, baseOrigin?) => boolean` | Origin allow-list check on parsed origins (no substring matching). |
| `sdMatchesSecureRoute` | `(url, routes, baseOrigin?) => boolean` | Segment-aware path-prefix match for interceptor `secureRoutes`. |
| `sdIsPathPrefix` | `(prefix, pathname) => boolean` | `/api` matches `/api/v1` but not `/api-evil`. |
| `sdIsSafeResourceUrl` | `(value, baseOrigin?) => boolean` | Guard for download / media / navigation URLs — see below. |

### `sdIsSafeResourceUrl` — URLs used for downloads, media and navigation

```ts
sdIsSafeResourceUrl(value: string | null | undefined, baseOrigin?: string): boolean
```

Use it before a URL reaches `<a href>` + `click()`, a media `src`, or `window.location`. Library call
sites (`SdUtilities.download`, `sd-preview-image`, `sd-preview-pdf`, `sd-upload-file`,
`sd-preview-video`) already do.

| Allowed | Refused |
| --- | --- |
| `http:` / `https:` without embedded credentials | `https://real.com@evil.tld/…` (credentials) |
| Relative URLs (`/files/a.pdf`, `files/a.pdf`), resolved against `baseOrigin` or the document origin (`SD_NON_BROWSER_ORIGIN` under SSR) | `javascript:`, `vbscript:` — including mixed case, leading spaces and embedded tabs/newlines |
| `blob:` | `data:` of any other type (`data:text/html`, `data:,text`) |
| `data:image/*`, `data:application/pdf` | `file:`, `mailto:`, `tel:` (not resources), blank or unparseable values |

The value is parsed with `sdParseUrl`, so the check matches what the browser will do with the same
string — there is no substring matching.

---

## `editor-html-sanitizer.ts` — `sdSanitizeEditorHtml`

```ts
sdSanitizeEditorHtml(html: string | null | undefined): string
```

Allowlist filter for the HTML that `sd-editor` and `sd-mini-editor` emit (form value, `sdChange`,
`valueChange`, `contentChange`, `getContent()`, `getHtmlContent()`, `upload()`). Exported so an app can
apply the same policy to HTML it receives from elsewhere before rendering it with `innerHTML`.

| Area | Policy |
| --- | --- |
| Elements | CKEditor 5 output is kept: paragraphs, headings, inline formatting (`strong`, `b`, `i`, `em`, `u`, `s`, `sub`, `sup`, `code`, `mark`, `span`…), lists, tables, `figure`/`figcaption`, `img`, `a`, `blockquote`, `pre`, `hr`, `br`, `div`. Unknown elements are unwrapped and their text is kept. |
| Removed with their content | `script`, `style`, `iframe`, `frame`, `object`, `embed`, `applet`, `base`, `meta`, `link`, `template`, `noscript`, `noembed`, `noframes`, `xmp`, `plaintext`, `title`, form controls (`form`, `input`, `button`, `select`, `option`, `textarea`…), and SVG `use` / `animate*` / `set` / `foreignObject`. SVG and MathML containers are always unwrapped. Comments are removed. |
| Attributes | `class`, `style`, `id`, `title`, `lang`, `dir`, `align`, `width`, `height`, `colspan`, `rowspan`, `scope`, `headers`, `alt`, `href`, `src`, `srcset`, `sizes`, `loading`, `target`, `rel`, `start`, `reversed`, `type` (on `ol` only), `cite`, `datetime`, `contenteditable="false"`, `data-*`, `aria-*`. Everything else is removed — every `on*` handler, `srcdoc`, `formaction`, `xlink:href`, `poster`, `background`, `name`. |
| `href`, `cite` | `http:`, `https:`, `mailto:`, `tel:`, relative URLs, `#fragment`. |
| `img src`, every `srcset` candidate | `http:`, `https:`, `blob:` (images waiting for a deferred upload), relative URLs, `data:image/*`. A `srcset` with one unsafe candidate is removed as a whole. |
| Clean input | Returned **unchanged** — the same string, not a re-serialisation — when nothing is removed and the markup is already in the browser's canonical form (which CKEditor output always is). The function is idempotent. |
| No `DOMParser` (SSR) | Returns the input with HTML escaped, so nothing executable leaves the function. |

`sizes`, `loading`, `contenteditable="false"` and `blob:` image sources are kept because the
library's own editors emit them (responsive images, `imageConfig.lazyLoad`, mention chips, deferred
uploads); none of them carries script or a navigable URL.

---

## `text-search.ts` — diacritic-insensitive search

| Name | Signature | Purpose |
| --- | --- | --- |
| `sdNormalizeSearchText` | `(value) => string` | Lower-case and strip diacritics, including `đ`/`Đ` → `d`. Spaces, digits and punctuation are kept. `null`/`undefined` → `''`. |
| `sdFindHighlightRanges` | `(text, term) => SdHighlightRange[]` | Every non-overlapping match of `term` in `text`, left to right, as `{ start, end }` (UTF-16, `end` exclusive) on the **original** text. |

```ts
sdNormalizeSearchText('Đà Nẵng'); // 'da nang'
sdFindHighlightRanges('Nguyễn Văn Đức', 'duc'); // [{ start: 11, end: 14 }]
```

- Matching uses `indexOf` on the normalised text — no `RegExp` is built from the term, so `(`, `*`,
  `[` and other metacharacters match literally and never throw.
- The term is trimmed; an empty, blank or diacritic-only term returns `[]`.
- Ranges never split a surrogate pair, and a combining mark stays inside the range of its letter.
- Inner whitespace is compared as-is (`'a  b'` does not match `'a b'`).

`sd-highlight` (`@sdcorejs/angular/components/highlight`) renders these ranges as `<mark>` without
`innerHTML`.

---

## `utility.extension.ts` — `SdUtilities`

General-purpose facade of this library (upload/download, clipboard, paging, hash, uuid, …). All 14 members are **local implementations** in this file with Angular-specific behaviour (interceptors, i18n, DOM) — this is not an alias of `@sdcorejs/utils`.

| Name | Signature | Purpose |
| --- | --- | --- |
| `upload` | `(option?: { extensions?, maxSizeInMb?, validator?, multiple? }) => Promise<File \| File[] \| null>` | Programmatic file picker — injects a hidden `<input type=file>`, validates extension/size/custom rule. Resolves `null` when the OS dialog is cancelled or the change event carries no file. In `multiple` mode EVERY file is validated, so one bad file rejects the whole call. The hidden input is removed as soon as the call settles. |
| `download` | `(fileOrPath: File \| string, fileName?) => void` | Trigger browser download of a `File` (blob URL) or a string path. Absolute `http:`/`https:` URLs open in a new tab through `sdOpenExternal` (`noopener,noreferrer`) instead of downloading. Any other string must pass `sdIsSafeResourceUrl`, otherwise nothing happens (see below). |
| `downloadBlob` | `(blob: Blob, fileName?) => void` | Trigger download of an arbitrary `Blob`. |
| `changeAliasLowerCase` | `(value) => string` | Lower-case + strip Vietnamese diacritics (for search matching). |
| `copyToClipboard` | `(text: string) => void` | `navigator.clipboard.writeText`. |
| `allWithPaging` | `<T>(func, defaultPageSize?) => Promise<T[]>` | Drain a paginated API into a single array (default page size `1000`). |
| `isIncognito` | `() => Promise<{ isPrivate: boolean; browserName: string }>` | Browser-specific private-mode probes (Safari indexedDB blob, Chrome storage quota, Firefox `serviceWorker`, IE `indexedDB`). |
| `isMobile` | `() => boolean` | UA sniff for `Mobi` or `Android`. |
| `randomId` | `(prefix?: string) => string` | Base-36 timestamp ID, optionally prefixed. |
| `hash` | `(obj: any) => string` | Stable 32-bit non-crypto hash — `h` + abs(int). Uses `stableStringify` (sorted keys, special-cases `Date` → ISO string and `File`). |
| `parseQueryParams` | `(queryString?: string) => Record<string, string>` | Wrap `URLSearchParams` into a plain object. |
| `getClientPublicIp` | `(endpoint: string) => Promise<string \| null>` | See below — endpoint is required. |
| `generateUuid` | `() => string` | `crypto.randomUUID()` with timestamp+random fallback for legacy browsers. |
| `getNestedValue` | `(obj: any, path: string) => any` | Read nested value by dotted path; safe against `undefined` segments. |

### `SdUtilities.getClientPublicIp` — endpoint is required (BREAKING)

```ts
getClientPublicIp(endpoint: string): Promise<string | null>
```

| Before | After |
| --- | --- |
| `SdUtilities.getClientPublicIp()` — always called `https://api.ipify.org?format=json` | `SdUtilities.getClientPublicIp('/api/client-ip')` — calls only what you name |

The hard-coded third-party call is gone. A UI library that silently ships a user's IP address to an
endpoint the application never declared is a privacy/GDPR exposure and a network dependency every
consumer inherited without asking. `endpoint` is now a required argument, so **no request leaves the
app unless the app asks for one** — prefer a first-party endpoint.

- `endpoint` must be an absolute `http:`/`https:` URL or a same-origin path (`/api/client-ip`); it is
  parsed with `sdParseUrl` and anything else (`javascript:`, `file:`, garbage) returns `null` without
  issuing a request.
- The endpoint must answer with JSON shaped `{ "ip": "..." }`.
- Failures (bad endpoint, network error, non-2xx) resolve to `null` and log **only in dev mode**.

To keep the old behaviour, name the third-party endpoint yourself and disclose it in your privacy
policy: `SdUtilities.getClientPublicIp('https://api.ipify.org?format=json')`.

### `SdUtilities.download` — unsafe URLs are refused (BREAKING)

A string that is not an absolute `http:`/`https:` URL used to be assigned to a hidden `<a href>` and
clicked, whatever its scheme — so `javascript:…`, `vbscript:…` or `data:text/html,…` ran in the
app's origin. That branch now requires `sdIsSafeResourceUrl`: relative paths, `blob:`,
`data:image/*` and `data:application/pdf` download as before; anything else is a no-op with a
dev-mode warning. `mailto:`/`tel:` are not downloads — open them with a normal link.

### Developer logging is dev-mode only

`download` / `downloadBlob` / `isIncognito` / `getClientPublicIp` used to `console.warn` /
`console.error` in shipped code. Those calls are now gated behind Angular's `isDevMode()`, so a
production build stays silent. Return values are unchanged — keep handling `null` / no-op results
rather than reading the console.

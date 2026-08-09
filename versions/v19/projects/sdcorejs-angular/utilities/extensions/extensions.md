# Utilities — Extensions

**Import path**: `@sdcorejs/angular/utilities/extensions`
**Canonical source**: every namespace below is re-exported from `@sdcorejs/utils/fns`. Prefer importing from `@sdcorejs/utils/fns` directly when there is no Angular dependency.

Pure-function utility namespaces. None of them mutate global prototypes — earlier monkey-patching has been deprecated in favour of explicit namespaced calls. Import the named export and call its members.

Each file re-exports a single object (`ArrayUtilities`, `StringUtilities`, `NumberUtilities`, `DateUtilities`, `ColorUtilities`, `ValidationUtilities`, `Utilities`, `BrowserUtilities`) whose members are the functions documented below.

---

## `array.extension.ts` — `ArrayUtilities`

Generic helpers for filtering and shaping arrays of records, with diacritic-insensitive search.

| Name | Signature | Purpose |
| --- | --- | --- |
| `search` | `<T>(items: T[], searchText, fields?, children?) => T[]` | Filter items whose given field(s) include the search text using `StringUtilities.aliasIncludes` (Vietnamese-diacritic-insensitive). Recurses into `children` field if provided. |
| `union` | `<T>(key: string, ...args: T[][]) => T[]` | Merge multiple arrays and de-duplicate by `item[key]` (first occurrence wins). |
| `toObject` | `<T>(key: string, items: T[]) => Record<string, T>` | Convert array of records into a dictionary keyed by `item[key].toString()`. |
| `distinct` | `<T>(items: T[]) => T[]` | Return unique values via `new Set(...)`. Works on primitives. |
| `paging` | `<T>(items: T[], pageSize: number, page = 0) => T[]` | Slice page `page` of size `pageSize` (zero-indexed). |

```ts
ArrayUtilities.search(users, 'Đỗ', ['fullName', 'email']); // matches "Do" too
```

---

## `color.extension.ts` — `ColorUtilities`

Color conversion helpers.

| Name | Signature | Purpose |
| --- | --- | --- |
| `hslToHex` | `(h: number, s: number, l: number) => string` | Convert HSL (`0–360, 0–100, 0–100`) to `#rrggbb` hex. |
| `rgbToHex` | `(r: number, g: number, b: number) => string` | Convert RGB (`0–255` each, clamped) to `#rrggbb` hex. |

> Standalone exports `hslToHex` / `rgbToHex` are kept as deprecated aliases pointing to `ColorUtilities`. Migrate to `ColorUtilities.hslToHex` / `ColorUtilities.rgbToHex`.

---

## `date.extension.ts` — `DateUtilities`

Date arithmetic and formatting; tolerant of `string | Date | any`. All functions return `null` (not throw) on invalid input.

| Name | Signature | Purpose |
| --- | --- | --- |
| `isDate` | `(value: any) => boolean` | Validate a value as a real date (incl. common `MM/dd/yyyy`, `yyyy-MM-dd` string variants). |
| `toFormat` | `(value: any, format: string) => string` | Format a date using tokens `yyyy MM dd HH mm ss` (uses `Intl.DateTimeFormat` for locale-correct parts). |
| `parseFrom` | `(value: any, format: string) => Date \| null` | Inverse of `toFormat` — parse a string given a format pattern. |
| `equal` | `(d1, d2) => boolean` | Strict-equal by `.getTime()`; both invalid → `true`, mixed → `false`. |
| `dayDiff` / `monthDiff` / `yearDiff` | `(d1, d2) => number \| null` | Difference in days / calendar months / calendar years (signed; `d2 - d1`). |
| `age` | `(d1, d2) => number \| null` | Year-fractional age (months/12) rounded via `NumberUtilities.round`. |
| `addMiliseconds` / `addHours` / `addDays` / `addMonths` | `(value, n) => Date \| null` | Return a new `Date` shifted by `n` units. |
| `begin` | `(value) => Date \| null` | Start-of-day (`00:00:00.000`). |
| `end` | `(value) => Date \| null` | End-of-day (`23:59:59.999`) — implemented as `begin(value+1day) - 1ms`. |
| `timeDifference` | `(previous, current = new Date()) => string` | Human-friendly relative phrase — `"5 minutes ago"`, `"2 days ago"`, `"3 years ago"`. English output. |

---

## `number.extension.ts` — `NumberUtilities`

Number formatting and validation. Inputs are tolerant (`any`); strip commas before parsing.

| Name | Signature | Purpose |
| --- | --- | --- |
| `toVNCurrency` | `(value: any) => string \| null` | Format with `vi-VN` locale (`1.234.567,89`). Same as `toVN` — kept as alias. |
| `toVN` | `(value: any) => string \| null` | Vietnamese locale number format. |
| `toISO` | `(value: any) => string \| null` | `en-US` locale format (`1,234,567.89`). |
| `isNumber` | `(value: any) => boolean` | Coercible to a finite number, not empty. |
| `isPositiveInteger` | `(value: any) => boolean` | Matches `^[0-9]*$` AND `> 0`. |
| `isPositiveNumber` | `(value: any) => boolean` | Matches `^[0-9]+(\.[0-9]+)?$` AND `> 0`. |
| `round` | `(value: any, digits = 2) => number \| null` | Round to `digits` decimals via `Math.round`. |

---

## `string.extension.ts` — `StringUtilities`

Vietnamese-aware string helpers, regex constants, and lightweight templating.

Exposed regex constants: `REGEX_EMAIL`, `REGEX_PHONE`, `REGEX_VN_PHONE`, `REGEX_VN_ID`, `REGEX_PASSPORT`, `REGEX_VN_ID_OR_PASSPORT`, `REGEX_TIME` (also surfaced via `VALIDATION_PATTERNS`).

| Name | Signature | Purpose |
| --- | --- | --- |
| `isNullOrEmpty` | `(value: any) => boolean` | `undefined`, `null`, or `''`. |
| `isNullOrWhiteSpace` | `(value: any) => boolean` | Above OR string of only spaces. |
| `changeAliasLowerCase` | `(alias: any) => string` | Strip Vietnamese diacritics and special chars; lowercase, trim. |
| `aliasIncludes` | `(alias: any, searchText: any) => boolean` | `changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText))`. Used by `ArrayUtilities.search`. |
| `format` | `(template: string, ...args: any[]) => string` | C#-style `{0} {1}` placeholder replacement. |
| `templateToDisplay` | `(template: string, entity: object) => string` | Replace `${path.to.field}` placeholders by reading nested values from `entity`. |
| `parseExpression` | `(template: string, entity: object) => unknown` | Like `templateToDisplay` but if the entire template is one `${path}` returns the raw value (preserves type); supports literals `true`/`false`/`null`/`undefined`/numbers. Safe — does NOT `eval`. |
| `encrypt` / `decrypt` | `(obj: any) => string` / `(s: string) => any` | Reversible obfuscation (URL-encoded JSON with `{`↔`}` swap and a fixed SALT). NOT cryptographically secure — for opaque URL params only. |
| `convertToSnakeCaseCode` | `(name: string) => string` | `"Đội Kỹ Thuật"` → `"doi_ky_thuat"`. Throws if `name` not a string. |
| `generateUniqueCode` | `(name: string, existingCodes: string[]) => string` | `convertToSnakeCaseCode` + suffix `_1`, `_2`, ... until unique. |
| `sha256` | `(input: string) => Promise<string>` | URL-safe base64 SHA-256 via `crypto.subtle`. |

> Deprecated: `isValidEmail` / `isValidPhone` / `isValidCode` (moved to `ValidationUtilities.isEmail` / `isPhone` / `isCode`). Kept as deprecated wrappers on `StringUtilities`.
> Deprecated regex aliases: `REGEX_PHONE_VN` → `REGEX_VN_PHONE`, `REGEX_IDVN` → `REGEX_VN_ID`, `REGEX_IDVN_OR_PASSPORT` → `REGEX_VN_ID_OR_PASSPORT`.

---

## `string.extension.ts` — `ValidationUtilities`

Higher-level value validators built on `StringUtilities.REGEX_*`. New canonical home for the `isValid*` helpers that used to live on `StringUtilities`.

| Name | Signature | Purpose |
| --- | --- | --- |
| `isEmail` / `isPhone` / `isVnPhone` / `isVnId` / `isPassport` / `isVnIdOrPassport` / `isTime` / `isUrl` | `(value: any) => boolean` | Regex validators against the matching `REGEX_*` constant. |
| `isCode` | `(value: any) => boolean` | 2–20 chars, alphanumeric + `@_-`. |

---

## `utility.extension.ts` — `Utilities` + `BrowserUtilities`

`SdUtilities` from older releases has been split into two namespaces:

### `Utilities` — generic helpers

| Name | Signature | Purpose |
| --- | --- | --- |
| `fetchAllByPaging` | `<T>(func: (pageSize, pageNumber) => Promise<{items, total}>, defaultPageSize?) => Promise<T[]>` | Drain a paginated API into a single array (default page size `1000`). Renamed from `allWithPaging`. |
| `randomId` | `(prefix?: string) => string` | Base-36 timestamp ID, optionally prefixed. |
| `hash` | `(obj: any) => string` | Stable 32-bit non-crypto hash of any object — `h` + abs(int). Uses `stableStringify` (sorted keys, special-cases `Date` → ISO string and `File`). |
| `parseQueryParams` | `(queryString?: string) => Record<string, string>` | Wrap `URLSearchParams` into a plain object. |
| `generateUuid` | `() => string` | `crypto.randomUUID()` with timestamp+random fallback for legacy browsers. |
| `getNestedValue` | `(obj: any, path: string) => any` | Read nested value by dotted path; safe against `undefined` segments. |

### `BrowserUtilities` — browser/DOM helpers

| Name | Signature | Purpose |
| --- | --- | --- |
| `upload` | `(option?: { extensions?, maxSizeInMb?, validator?, multiple? }) => Promise<File \| File[] \| null>` | Programmatic file picker — injects a hidden `<input type=file>`, validates extension/size/custom rule, resolves with selected file(s). |
| `download` | `(fileOrPath: File \| string, fileName?) => void` | Trigger browser download of a `File` (via blob URL) or a string path/URL. Absolute `http:`/`https:` URLs open in a new tab through `sdOpenExternal` (`noopener,noreferrer`) instead of downloading. |
| `downloadBlob` | `(blob: Blob, fileName?) => void` | Trigger download of an arbitrary `Blob`. |
| `copyToClipboard` | `(text: string) => void` | `navigator.clipboard.writeText`. |
| `isMobile` | `() => boolean` | UA sniff for `Mobi` or `Android`. |
| `detectIncognito` | `() => Promise<{ isPrivate: boolean; browserName: string }>` | Run browser-specific probes (Safari indexedDB blob, Chrome storage quota, Firefox `serviceWorker`, IE `indexedDB`) and resolve with detected browser name + private-mode flag. `browserName` ∈ `{ 'Safari', 'Chrome', 'Brave', 'Edge', 'Opera', 'Chromium', 'Firefox', 'Internet Explorer', 'Unknown' }`. |

> The legacy `SdUtilities` object is kept as a deprecated aggregate that proxies the union of `Utilities` + `BrowserUtilities` members (plus old `allWithPaging` / `isIncognito` names). Migrate to the split namespaces.

### `SdUtilities.getClientPublicIp` — endpoint is now required (BREAKING)

Only on the deprecated `SdUtilities` aggregate; it has no counterpart in `Utilities` / `BrowserUtilities`.

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

### Developer logging is dev-mode only

`download` / `downloadBlob` / `isIncognito` / `getClientPublicIp` used to `console.warn` /
`console.error` in shipped code. Those calls are now gated behind Angular's `isDevMode()`, so a
production build stays silent. Return values are unchanged — keep handling `null` / no-op results
rather than reading the console.

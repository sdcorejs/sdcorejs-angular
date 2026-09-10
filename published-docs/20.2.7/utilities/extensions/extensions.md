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

---

## `utility.extension.ts` — `SdUtilities`

General-purpose facade of this library (upload/download, clipboard, paging, hash, uuid, …). All 14 members are **local implementations** in this file with Angular-specific behaviour (interceptors, i18n, DOM) — this is not an alias of `@sdcorejs/utils`.

| Name | Signature | Purpose |
| --- | --- | --- |
| `upload` | `(option?: { extensions?, maxSizeInMb?, validator?, multiple? }) => Promise<File \| File[] \| null>` | Programmatic file picker — injects a hidden `<input type=file>`, validates extension/size/custom rule. Resolves `null` when the OS dialog is cancelled or the change event carries no file. In `multiple` mode EVERY file is validated, so one bad file rejects the whole call. The hidden input is removed as soon as the call settles. |
| `download` | `(fileOrPath: File \| string, fileName?) => void` | Trigger browser download of a `File` (blob URL) or a string path. Absolute `http:`/`https:` URLs open in a new tab through `sdOpenExternal` (`noopener,noreferrer`) instead of downloading. |
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

### Developer logging is dev-mode only

`download` / `downloadBlob` / `isIncognito` / `getClientPublicIp` used to `console.warn` /
`console.error` in shipped code. Those calls are now gated behind Angular's `isDevMode()`, so a
production build stays silent. Return values are unchanged — keep handling `null` / no-op results
rather than reading the console.

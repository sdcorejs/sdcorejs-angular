�# SdDocxService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdDocxService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/docx`

## One-line purpose
Converts `.doc` / `.docx` files to standalone HTML in the browser by lazily loading a Pandoc WebAssembly binary; exposes both an "open file picker" flow and a programmatic conversion API.

## When to use
- Previewing a Word document inside the app (e.g., template preview before printing/exporting).
- Extracting embedded HTML from a `.docx` mail-merge template to feed into the editor or print pipeline.
- Letting users drag/select a `.docx` and getting back an HTML string + warning messages.

## When NOT to use
- For server-side rendering � this relies on browser `fetch` of `https://pandoc.github.io/pandoc-wasm/pandoc.wasm` and a browser `File`/`Blob`/`ArrayBuffer`.
- For format conversions other than `.doc`/`.docx` �  HTML (the service hard-codes Pandoc args `from: 'docx', to: 'html'`).
- When the network blocks `pandoc.github.io` � the WASM fetch will fail.

## Public API

### `open(options?): Promise<SdDocxConvertResult | null>`
Opens a hidden `<input type="file" accept=".doc,.docx">`, awaits user selection, then runs `convertToHtml`. Resolves with `null` if the user cancels or an error occurs (errors also surface a `SdNotifyService.error` toast).

```typescript
open(options?: SdDocxConvertOptions): Promise<SdDocxConvertResult | null>;
```

**Parameters**:
- `options` (`SdDocxConvertOptions`, optional): validation options forwarded to `convertToHtml` (see interface below).

**Returns**:
- `SdDocxConvertResult` on successful conversion.
- `null` if the user cancels the file picker, the file fails validation, or a WASM/network error occurs.

**Behavior**: starts/stops `SdLoadingService` around the conversion, removes its own change listener, and reuses a single `<input>` element (lazily appended to `document.body`).

### `convertToHtml(input, options?): Promise<SdDocxConvertResult | null>`
Programmatic conversion. Accepts a `File`, `Blob`, or `ArrayBuffer`. Performs validation (size + extension when applicable), then runs Pandoc with `standalone: true, embed-resources: true` so images/CSS are inlined.

```typescript
convertToHtml(
  input: File | Blob | ArrayBuffer,
  options?: SdDocxConvertOptions
): Promise<SdDocxConvertResult | null>;

interface SdDocxConvertOptions {
  validateFormat?: boolean;   // default: true (only checked when File.name is available)
  validateSize?: boolean;     // default: true
  maxSizeInMb?: number;       // default: 50
}

interface SdDocxConvertResult {
  html: string;        // standalone HTML with embedded resources
  messages: string[];  // pandoc warnings, stringified
}
```

**Parameters**:
- `input` (`File | Blob | ArrayBuffer`): the document to convert.
  - `File` � extension and size are checked when validation flags are enabled.
  - `Blob` � size is checked; format validation is skipped (no file name).
  - `ArrayBuffer` � both format and size validation are skipped.
- `options` (`SdDocxConvertOptions`, optional): see interface above.

**Returns**:
- `SdDocxConvertResult` on success.
- `null` on validation failure (a Vietnamese error toast is shown via `SdNotifyService.error`) or on Pandoc/WASM error.

### `convertToHtmlString(input, options?): Promise<string | null>`
Thin wrapper around `convertToHtml` returning only the HTML string (or `null`).

```typescript
convertToHtmlString(
  input: File | Blob | ArrayBuffer,
  options?: SdDocxConvertOptions
): Promise<string | null>;
```

**Parameters**: same as `convertToHtml` � `input` and `options` are forwarded unchanged.

**Returns**:
- The `html` string from `SdDocxConvertResult` on success.
- `null` if `convertToHtml` returns `null` (validation failure or error).

## Configuration / DI tokens
None. Constructor injects `SdNotifyService` and `SdLoadingService` for UX feedback.

## Behavior notes
- **WASM source**: hard-coded to `https://pandoc.github.io/pandoc-wasm/pandoc.wasm`. Fetched once and cached on the service instance (`#pandocInstance`). First call is slow (network + WASM init); subsequent calls reuse the instance.
- **Pandoc args**: `{ from: 'docx', to: 'html', 'input-files': ['document.docx'], standalone: true, 'embed-resources': true }`. The output is a full HTML document, not a fragment.
- **Validation messages** (Vietnamese):
  - Invalid format: `"Đ�9nh dạng không hợp l�!. Vui lòng chọn Mẫu có ��9nh dạng DOC hoặc DOCX"`
  - Size exceeded: `"Kích thư�:c t�!p mẫu vượt quá tiêu chuẩn h� trợ của h�! th�ng. Vui lòng thử lại"`
  - Conversion error: `"Có l�i xảy ra khi chuyỒn ��"i file DOCX"`
- **Format check** runs only when a file name is known (`input instanceof File`). Raw `Blob`/`ArrayBuffer` skip the extension check.
- **Loading spinner**: `open()` calls `SdLoadingService.start()` / `stop()`. `convertToHtml()` does NOT � call those yourself if needed.
- **Logging**: the service logs `[SdDocxService] ...` debug info to `console`. Filter or strip in production builds if noisy.

## Examples

### 1. Preview a user-selected DOCX
```typescript
import { SdDocxService } from '@sdcorejs/angular/services/docx';
import { inject } from '@angular/core';

const docx = inject(SdDocxService);
const result = await docx.open({ maxSizeInMb: 20 });
if (result) {
  this.previewHtml = result.html;
  if (result.messages.length) console.warn('pandoc warnings', result.messages);
}
```

### 2. Convert a server-fetched DOCX
```typescript
const blob = await firstValueFrom(http.get('/api/templates/123.docx', { responseType: 'blob' }));
const html = await docx.convertToHtmlString(blob, { validateFormat: false });
```

### 3. Convert from `ArrayBuffer` (e.g., from File API)
```typescript
const buf = await file.arrayBuffer();
const result = await docx.convertToHtml(buf);
```

### 4. Skip validation when source is trusted
```typescript
await docx.convertToHtml(blob, { validateFormat: false, validateSize: false });
```

## Anti-patterns
- Do NOT call `convertToHtml` in a tight loop � the first call fetches ~30+ MB of WASM. Reuse the singleton service.
- Do NOT expect a fragment � the result is a full HTML document; if injecting into a host page, sanitize and/or extract `<body>` content first.
- Do NOT rely on the network in offline-first apps � host the WASM yourself and (until the constant is configurable) fork the service if needed.
- Do NOT call `open()` from non-user-gesture code paths � browsers may block the synthetic file picker click.

## Related
- `SdLoadingService` (`@sdcorejs/angular/services/loading`) � global spinner toggled around `open()`.
- `SdNotifyService` (`@sdcorejs/angular/services/notify`) � error toasts on validation/conversion failure.
- `pandoc-core` (sibling file) � thin wrapper around the Pandoc WASM module.


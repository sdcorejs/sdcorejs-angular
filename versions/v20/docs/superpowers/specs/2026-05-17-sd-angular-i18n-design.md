�# sd-angular i18n (VI/EN) design

Date: 2026-05-17
Status: approved (pending implementation plan)
Target: `@sdcorejs/angular` library (`projects/sdcorejs-angular/`)

## Goal

Áp dụng song ngữ Vietnamese-English cho toàn b�" `@sdcorejs/angular`. Mọi message/label/title/error trong library hi�!n �ang hardcode tiếng Vi�!t sẽ �ược gom vào m�"t thư mục i18n, lưu key thay vì chu�i raw. Consumer (portal) có thỒ switch language runtime; lựa chọn �ược persist vào localStorage.

## Non-goals

- Không i18n hóa `console.log` / `console.warn` debug log (không phải UX).
- Không i18n hóa comment trong code.
- Không cung cấp UI toggle component sẵn � consumer tự dựng.
- Không h� trợ ngôn ngữ ngoài VI/EN �x vòng này (cấu trúc cho phép m�x r�"ng sau).
- Không dùng third-party library (`ngx-translate`, `@angular/localize`).
- Không dùng HTTP load lazy � messages bundle sẵn trong library qua TS static import.

## Architecture

### Library approach

Custom lightweight i18n service, signal-based. Lý do:
- Library context: không mu�n ép consumer phải cài thêm dependency.
- S� lượng key gi�:i hạn (~150-250) �  bundle sẵn không gây bloat �áng kỒ.
- Signal-based �  reactive update tự ��"ng khi `setLanguage()`, không cần observable boilerplate.
- TS static import �  type-safe key qua `keyof typeof VI_MESSAGES`.

### New secondary entry point

`projects/sdcorejs-angular/i18n/` � sibling của `configurations/`, `utilities/`, etc.

```
projects/sdcorejs-angular/i18n/
  ng-package.json                # lib: { entryFile: 'src/public-api.ts' }
  src/
    public-api.ts                # exports service, pipe, types, constants
    sd-i18n.types.ts             # SdLanguage, SdI18nKey, SdI18nParams
    sd-i18n.messages.ts          # re-export VI/EN, derive SdI18nKey
    vi.ts                        # VI_MESSAGES = { 'core.xxx': '...' }
    en.ts                        # EN_MESSAGES, parity 1-1 v�:i vi
    sd-i18n.token.ts             # SD_I18N_STORAGE_KEY = 'sd-core.language'
    sd-i18n.service.ts           # SdI18nService (providedIn: 'root')
    sd-i18n.service.spec.ts
    sd-i18n.pipe.ts              # SdTPipe (pure: false �Ồ track signal)
    sd-i18n.pipe.spec.ts
```

### Configuration change

`projects/sdcorejs-angular/configurations/src/sd-core.configuration.ts`:

```ts
import { SdLanguage } from '@sdcorejs/angular/i18n';

export interface ISdCoreConfiguration {
  licenseKey?: string | string[];
  format?: { number?: '1,234,567.89' | '1.234.567,89' };
  language?: SdLanguage;   // m�:i � default 'vi'
}
```

### Public API

```ts
export type SdLanguage = 'vi' | 'en';
export const SD_SUPPORTED_LANGUAGES: readonly SdLanguage[] = ['vi', 'en'];
export const SD_I18N_STORAGE_KEY = 'sd-core.language';

export type SdI18nKey = keyof typeof VI_MESSAGES;
export type SdI18nParams = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class SdI18nService {
  readonly language: Signal<SdLanguage>;
  readonly messages: Signal<Readonly<Record<string, string>>>;
  setLanguage(lang: SdLanguage): void;
  t(key: SdI18nKey | string, params?: SdI18nParams): string;
}

@Pipe({ name: 'sdT', pure: false, standalone: true })
export class SdTPipe implements PipeTransform {
  transform(key: string, params?: SdI18nParams): string;
}
```

## Service behavior

### Initial language resolution (theo thứ tự ưu tiên)

1. `localStorage.getItem(SD_I18N_STORAGE_KEY)` � nếu giá tr�9 hợp l�! trong `SD_SUPPORTED_LANGUAGES` �  dùng.
2. `SD_CORE_CONFIGURATION.language` � nếu có �  dùng.
3. Fallback `'vi'`.

### `setLanguage(lang)`

- Update `WritableSignal<SdLanguage>` n�"i b�".
- Swap `messages` signal sang map tương ứng (`VI_MESSAGES` hoặc `EN_MESSAGES`).
- `localStorage.setItem(SD_I18N_STORAGE_KEY, lang)`.
- Pipe `| sdT` reactive theo `messages()` �  toàn UI re-render tự ��"ng.

### `t(key, params?)`

1. Tìm `messages()[key]`. Có �  interpolate �  trả về.
2. Miss �  tìm trong `VI_MESSAGES` (fallback chính). Có �  trả + `console.warn` 1 lần per key (Set �Ồ dedup).
3. Vẫn miss �  trả về chính `key` (string), `console.warn('[SdI18n] Missing key: ' + key)`.

### Interpolation

- Cú pháp `{name}` (single curly). Lý do: tránh �ụng v�:i Angular template `{{ }}`.
- Regex: `\{(\w+)\}` �  thay bằng `params[name]`.
- Param không có �  giữ nguyên `{name}` raw.
- Ví dụ: `t('core.validator.min-length', { min: 5 })` v�:i template `'T�i thiỒu {min} ký tự'` �  `'T�i thiỒu 5 ký tự'`.

## Key naming convention

- Flat namespaced, dot-separated, lowercase, kebab cho segment n�"i b�".
- Bắt bu�"c prefix `core.` (tránh �ụng key của portal consumer sau này).
- Pattern: `core.<scope>.<descriptor>[.<sub>]`.
- Ví dụ:
  - `core.common.cancel`, `core.common.close`, `core.common.search`
  - `core.validator.email.error`, `core.validator.phone-vn.name`
  - `core.interceptor.no-internet.offline`, `core.interceptor.no-internet.cors-error`
  - `core.layout.forbidden.title`, `core.layout.not-found.title`
  - `core.excel.cannot-read-file`

## Usage patterns

### Template

```html
<button>{{ 'core.common.cancel' | sdT }}</button>
<input [placeholder]="'core.common.search' | sdT" />
<p>{{ 'core.validator.min-length' | sdT: { min: 5 } }}</p>
```

### TypeScript (eager string)

```ts
private readonly i18n = inject(SdI18nService);

throw new Error(this.i18n.t('core.excel.cannot-read-file'));
this.snackBar.open(this.i18n.t('core.interceptor.no-internet.offline'),
                   this.i18n.t('core.common.close'));
```

### TypeScript (constant array � `pattern.model.ts` pattern)

`pattern.model.ts` �ang lưu `name`, `errorMessage` là chu�i VI hardcode. Đ�"i thành i18n key:

```ts
// trư�:c
{ name: 'Email', errorMessage: 'Email không hợp l�!', ... }

// sau
{ name: 'core.validator.email.name', errorMessage: 'core.validator.email.error', ... }
```

Consumer của `name` / `errorMessage` (form-generic, validators) phải `i18n.t(pattern.errorMessage)` khi render. Tìm tất cả consumer khi migrate batch 1.

### Consumer language toggle

```ts
toggle() {
  this.i18n.setLanguage(this.i18n.language() === 'vi' ? 'en' : 'vi');
}
```

## Migration strategy

193 file `.ts` + 3 file `.html` chứa VI hardcode. Chia 5 batch �Ồ control diff size:

1. **utilities + handlers** � `pattern.model.ts`, `global-error.handler.ts`, validators. Bư�:c này phát hi�!n consumer của `pattern.errorMessage` �Ồ migrate ��ng b�".
2. **interceptors** � `no-internet`, `unauthorized`.
3. **services** � `excel.service.ts`, `auth.service.ts`, `authom.service.ts`, `storage.service`...
4. **directives + pipes** � `sd-tooltip.directive`, `sd-scroll.directive`...
5. **components + modules + HTML templates** � `section.component.html`, `layout/forbidden`, `layout/not-found`, `form-generic`, `splitter`...

M�i batch:
- Li�!t kê chu�i VI cần migrate.
- Thêm key vào `vi.ts` + `en.ts` (translate luôn EN).
- Replace chu�i raw bằng `i18n.t(key)` hoặc `| sdT`.
- Cập nhật spec test tương ứng.
- Run `npm run check:i18n` + `npm run check:i18n-parity`.

### Replacement patterns

| Trường hợp | Trư�:c | Sau |
| --- | --- | --- |
| TS eager string | `'Không �ọc �ược file'` | `this.#i18n.t('core.excel.cannot-read-file')` |
| TS constant value | `errorMessage: 'Email không hợp l�!'` | `errorMessage: 'core.validator.email.error'` (+ resolve site consumer) |
| HTML text node | `<div>Không có quyền truy cập</div>` | `<div>{{ 'core.layout.forbidden.title' \| sdT }}</div>` |
| HTML attribute | `placeholder="Tìm kiếm"` | `[placeholder]="'core.common.search' \| sdT"` |
| `throw new Error('...')` | `throw new Error('Không �ọc...')` | `throw new Error(this.#i18n.t('core.excel.cannot-read-file'))` |

### Out-of-scope cho i18n migration

- `console.log` / `console.warn` dev � giữ nguyên (không phải UX).
- Comment trong code � giữ nguyên.
- File `*.spec.ts` � không i18n hóa string trong test setup; nhưng nếu spec assert chu�i VI cụ thỒ thì update �Ồ assert key hoặc inject `SdI18nService` mock.

## Testing

### Unit tests

- `sd-i18n.service.spec.ts`:
  - Init từ localStorage hợp l�!.
  - Init fallback config khi localStorage tr�ng/invalid.
  - Init fallback `'vi'` khi cả hai tr�ng.
  - `setLanguage()` update signal + persist localStorage.
  - `t()` happy path.
  - `t()` interpolation `{name}`.
  - `t()` interpolation param thiếu �  giữ nguyên `{name}`.
  - `t()` missing key �  return key + warn once.
  - `t()` miss EN có VI �  fallback VI + warn.
- `sd-i18n.pipe.spec.ts`:
  - Render �úng cho key có sẵn.
  - Reactive khi `setLanguage()`.
  - Interpolation qua pipe args.

### Parity check

- Script `npm run check:i18n-parity` (node script �ơn giản):
  - Import `VI_MESSAGES` + `EN_MESSAGES`.
  - Assert `Object.keys(vi).sort()` deep-equal `Object.keys(en).sort()`.
  - Fail CI nếu l�!ch.

### Hardcode VI guard

- Script `npm run check:i18n` (regex scan):
  - Quét `projects/sdcorejs-angular/**/*.{ts,html}`.
  - Regex chứa ký tự VI có dấu (`[ìÁẢÒẠ...ỹ��Đ�`�ƠƯ...]`).
  - Whitelist: `projects/sdcorejs-angular/i18n/src/vi.ts`, `*.spec.ts`, doc comment (`/**`, `//`).
  - Fail CI nếu match.

## Acceptance criteria

1. `npm run build` xanh.
2. `npm run check:i18n-parity` xanh.
3. `npm run check:i18n` xanh � không còn VI hardcode ngoài `vi.ts` + whitelist.
4. Tất cả unit test xanh, bao g�m spec m�:i cho service + pipe.
5. Toggle `i18n.setLanguage('en')` trong consumer demo �  toàn b�" UI Core chuyỒn EN tức thì.
6. Reload trang �  ngôn ngữ giữ nguyên (�ọc localStorage).
7. `ISdCoreConfiguration.language = 'en'` nhưng localStorage có `'vi'` �  dùng `'vi'` (localStorage thắng).
8. Build size delta `< 30KB` gzipped cho 2 file message (sanity check).

## Risks

- **Consumer của `pattern.errorMessage`** � không biết hết caller, có thỒ có ch� �ang assert chu�i raw. Mitigation: grep `errorMessage` trên cả workspace trư�:c batch 1.
- **Spec test có chu�i VI hardcode** � sẽ vỡ. Mitigation: batch 1 update ��ng thời các spec liên quan.
- **Translation EN chất lượng** � không có native reviewer. Mitigation: chấp nhận round 1, m�x issue cho native review.
- **Pipe `pure: false`** � invalidate m�i CD cycle. Mitigation: i18n trên hot path (table cell, list item) có thỒ cần cache; nếu performance �o �ược vấn �ề thì cache trong service.
- **Test có thỒ b�9 flaky do localStorage** � `beforeEach` clear `SD_I18N_STORAGE_KEY`.

## File-level impact summary

- **Tạo m�:i**: 9 file dư�:i `projects/sdcorejs-angular/i18n/src/` + 1 `ng-package.json`.
- **Sửa**: `configurations/src/sd-core.configuration.ts`, `src/public-api.ts`, `tsconfig.lib.json` (paths), `package.json` (script `check:i18n*`), 193 file `.ts` + 3 file `.html` (Vietnamese strings).
- **Sửa spec**: `pattern.model.spec.ts` (assert key thay vì chu�i) + spec khác b�9 ảnh hư�xng.


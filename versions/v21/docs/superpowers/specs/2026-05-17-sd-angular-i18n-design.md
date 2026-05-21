# sd-angular i18n (VI/EN) design

Date: 2026-05-17
Status: approved (pending implementation plan)
Target: `@sdcorejs/angular` library (`projects/sdcorejs-angular/`)

## Goal

Ãp dá»¥ng song ngá»¯ Vietnamese-English cho toÃ n bá»™ `@sdcorejs/angular`. Má»i message/label/title/error trong library hiá»‡n Ä‘ang hardcode tiáº¿ng Viá»‡t sáº½ Ä‘Æ°á»£c gom vÃ o má»™t thÆ° má»¥c i18n, lÆ°u key thay vÃ¬ chuá»—i raw. Consumer (portal) cÃ³ thá»ƒ switch language runtime; lá»±a chá»n Ä‘Æ°á»£c persist vÃ o localStorage.

## Non-goals

- KhÃ´ng i18n hÃ³a `console.log` / `console.warn` debug log (khÃ´ng pháº£i UX).
- KhÃ´ng i18n hÃ³a comment trong code.
- KhÃ´ng cung cáº¥p UI toggle component sáºµn â€” consumer tá»± dá»±ng.
- KhÃ´ng há»— trá»£ ngÃ´n ngá»¯ ngoÃ i VI/EN á»Ÿ vÃ²ng nÃ y (cáº¥u trÃºc cho phÃ©p má»Ÿ rá»™ng sau).
- KhÃ´ng dÃ¹ng third-party library (`ngx-translate`, `@angular/localize`).
- KhÃ´ng dÃ¹ng HTTP load lazy â€” messages bundle sáºµn trong library qua TS static import.

## Architecture

### Library approach

Custom lightweight i18n service, signal-based. LÃ½ do:
- Library context: khÃ´ng muá»‘n Ã©p consumer pháº£i cÃ i thÃªm dependency.
- Sá»‘ lÆ°á»£ng key giá»›i háº¡n (~150-250) â†’ bundle sáºµn khÃ´ng gÃ¢y bloat Ä‘Ã¡ng ká»ƒ.
- Signal-based â†’ reactive update tá»± Ä‘á»™ng khi `setLanguage()`, khÃ´ng cáº§n observable boilerplate.
- TS static import â†’ type-safe key qua `keyof typeof VI_MESSAGES`.

### New secondary entry point

`projects/sdcorejs-angular/i18n/` â€” sibling cá»§a `configurations/`, `utilities/`, etc.

```
projects/sdcorejs-angular/i18n/
  ng-package.json                # lib: { entryFile: 'src/public-api.ts' }
  src/
    public-api.ts                # exports service, pipe, types, constants
    sd-i18n.types.ts             # SdLanguage, SdI18nKey, SdI18nParams
    sd-i18n.messages.ts          # re-export VI/EN, derive SdI18nKey
    vi.ts                        # VI_MESSAGES = { 'core.xxx': '...' }
    en.ts                        # EN_MESSAGES, parity 1-1 vá»›i vi
    sd-i18n.token.ts             # SD_I18N_STORAGE_KEY = 'sd-core.language'
    sd-i18n.service.ts           # SdI18nService (providedIn: 'root')
    sd-i18n.service.spec.ts
    sd-i18n.pipe.ts              # SdTPipe (pure: false Ä‘á»ƒ track signal)
    sd-i18n.pipe.spec.ts
```

### Configuration change

`projects/sdcorejs-angular/configurations/src/sd-core.configuration.ts`:

```ts
import { SdLanguage } from '@sdcorejs/angular/i18n';

export interface ISdCoreConfiguration {
  licenseKey?: string | string[];
  format?: { number?: '1,234,567.89' | '1.234.567,89' };
  language?: SdLanguage;   // má»›i â€” default 'vi'
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

### Initial language resolution (theo thá»© tá»± Æ°u tiÃªn)

1. `localStorage.getItem(SD_I18N_STORAGE_KEY)` â€” náº¿u giÃ¡ trá»‹ há»£p lá»‡ trong `SD_SUPPORTED_LANGUAGES` â†’ dÃ¹ng.
2. `SD_CORE_CONFIGURATION.language` â€” náº¿u cÃ³ â†’ dÃ¹ng.
3. Fallback `'vi'`.

### `setLanguage(lang)`

- Update `WritableSignal<SdLanguage>` ná»™i bá»™.
- Swap `messages` signal sang map tÆ°Æ¡ng á»©ng (`VI_MESSAGES` hoáº·c `EN_MESSAGES`).
- `localStorage.setItem(SD_I18N_STORAGE_KEY, lang)`.
- Pipe `| sdT` reactive theo `messages()` â†’ toÃ n UI re-render tá»± Ä‘á»™ng.

### `t(key, params?)`

1. TÃ¬m `messages()[key]`. CÃ³ â†’ interpolate â†’ tráº£ vá».
2. Miss â†’ tÃ¬m trong `VI_MESSAGES` (fallback chÃ­nh). CÃ³ â†’ tráº£ + `console.warn` 1 láº§n per key (Set Ä‘á»ƒ dedup).
3. Váº«n miss â†’ tráº£ vá» chÃ­nh `key` (string), `console.warn('[SdI18n] Missing key: ' + key)`.

### Interpolation

- CÃº phÃ¡p `{name}` (single curly). LÃ½ do: trÃ¡nh Ä‘á»¥ng vá»›i Angular template `{{ }}`.
- Regex: `\{(\w+)\}` â†’ thay báº±ng `params[name]`.
- Param khÃ´ng cÃ³ â†’ giá»¯ nguyÃªn `{name}` raw.
- VÃ­ dá»¥: `t('core.validator.min-length', { min: 5 })` vá»›i template `'Tá»‘i thiá»ƒu {min} kÃ½ tá»±'` â†’ `'Tá»‘i thiá»ƒu 5 kÃ½ tá»±'`.

## Key naming convention

- Flat namespaced, dot-separated, lowercase, kebab cho segment ná»™i bá»™.
- Báº¯t buá»™c prefix `core.` (trÃ¡nh Ä‘á»¥ng key cá»§a portal consumer sau nÃ y).
- Pattern: `core.<scope>.<descriptor>[.<sub>]`.
- VÃ­ dá»¥:
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

### TypeScript (constant array â€” `pattern.model.ts` pattern)

`pattern.model.ts` Ä‘ang lÆ°u `name`, `errorMessage` lÃ  chuá»—i VI hardcode. Äá»•i thÃ nh i18n key:

```ts
// trÆ°á»›c
{ name: 'Email', errorMessage: 'Email khÃ´ng há»£p lá»‡', ... }

// sau
{ name: 'core.validator.email.name', errorMessage: 'core.validator.email.error', ... }
```

Consumer cá»§a `name` / `errorMessage` (form-generic, validators) pháº£i `i18n.t(pattern.errorMessage)` khi render. TÃ¬m táº¥t cáº£ consumer khi migrate batch 1.

### Consumer language toggle

```ts
toggle() {
  this.i18n.setLanguage(this.i18n.language() === 'vi' ? 'en' : 'vi');
}
```

## Migration strategy

193 file `.ts` + 3 file `.html` chá»©a VI hardcode. Chia 5 batch Ä‘á»ƒ control diff size:

1. **utilities + handlers** â€” `pattern.model.ts`, `global-error.handler.ts`, validators. BÆ°á»›c nÃ y phÃ¡t hiá»‡n consumer cá»§a `pattern.errorMessage` Ä‘á»ƒ migrate Ä‘á»“ng bá»™.
2. **interceptors** â€” `no-internet`, `unauthorized`.
3. **services** â€” `excel.service.ts`, `auth.service.ts`, `authom.service.ts`, `storage.service`...
4. **directives + pipes** â€” `sd-tooltip.directive`, `sd-scroll.directive`...
5. **components + modules + HTML templates** â€” `section.component.html`, `layout/forbidden`, `layout/not-found`, `form-generic`, `splitter`...

Má»—i batch:
- Liá»‡t kÃª chuá»—i VI cáº§n migrate.
- ThÃªm key vÃ o `vi.ts` + `en.ts` (translate luÃ´n EN).
- Replace chuá»—i raw báº±ng `i18n.t(key)` hoáº·c `| sdT`.
- Cáº­p nháº­t spec test tÆ°Æ¡ng á»©ng.
- Run `npm run check:i18n` + `npm run check:i18n-parity`.

### Replacement patterns

| TrÆ°á»ng há»£p | TrÆ°á»›c | Sau |
| --- | --- | --- |
| TS eager string | `'KhÃ´ng Ä‘á»c Ä‘Æ°á»£c file'` | `this.#i18n.t('core.excel.cannot-read-file')` |
| TS constant value | `errorMessage: 'Email khÃ´ng há»£p lá»‡'` | `errorMessage: 'core.validator.email.error'` (+ resolve site consumer) |
| HTML text node | `<div>KhÃ´ng cÃ³ quyá»n truy cáº­p</div>` | `<div>{{ 'core.layout.forbidden.title' \| sdT }}</div>` |
| HTML attribute | `placeholder="TÃ¬m kiáº¿m"` | `[placeholder]="'core.common.search' \| sdT"` |
| `throw new Error('...')` | `throw new Error('KhÃ´ng Ä‘á»c...')` | `throw new Error(this.#i18n.t('core.excel.cannot-read-file'))` |

### Out-of-scope cho i18n migration

- `console.log` / `console.warn` dev â€” giá»¯ nguyÃªn (khÃ´ng pháº£i UX).
- Comment trong code â€” giá»¯ nguyÃªn.
- File `*.spec.ts` â€” khÃ´ng i18n hÃ³a string trong test setup; nhÆ°ng náº¿u spec assert chuá»—i VI cá»¥ thá»ƒ thÃ¬ update Ä‘á»ƒ assert key hoáº·c inject `SdI18nService` mock.

## Testing

### Unit tests

- `sd-i18n.service.spec.ts`:
  - Init tá»« localStorage há»£p lá»‡.
  - Init fallback config khi localStorage trá»‘ng/invalid.
  - Init fallback `'vi'` khi cáº£ hai trá»‘ng.
  - `setLanguage()` update signal + persist localStorage.
  - `t()` happy path.
  - `t()` interpolation `{name}`.
  - `t()` interpolation param thiáº¿u â†’ giá»¯ nguyÃªn `{name}`.
  - `t()` missing key â†’ return key + warn once.
  - `t()` miss EN cÃ³ VI â†’ fallback VI + warn.
- `sd-i18n.pipe.spec.ts`:
  - Render Ä‘Ãºng cho key cÃ³ sáºµn.
  - Reactive khi `setLanguage()`.
  - Interpolation qua pipe args.

### Parity check

- Script `npm run check:i18n-parity` (node script Ä‘Æ¡n giáº£n):
  - Import `VI_MESSAGES` + `EN_MESSAGES`.
  - Assert `Object.keys(vi).sort()` deep-equal `Object.keys(en).sort()`.
  - Fail CI náº¿u lá»‡ch.

### Hardcode VI guard

- Script `npm run check:i18n` (regex scan):
  - QuÃ©t `projects/sdcorejs-angular/**/*.{ts,html}`.
  - Regex chá»©a kÃ½ tá»± VI cÃ³ dáº¥u (`[Ã€Ãáº¢Ãƒáº ...á»¹Ä‚Ã‚ÄÃŠÃ”Æ Æ¯...]`).
  - Whitelist: `projects/sdcorejs-angular/i18n/src/vi.ts`, `*.spec.ts`, doc comment (`/**`, `//`).
  - Fail CI náº¿u match.

## Acceptance criteria

1. `npm run build` xanh.
2. `npm run check:i18n-parity` xanh.
3. `npm run check:i18n` xanh â€” khÃ´ng cÃ²n VI hardcode ngoÃ i `vi.ts` + whitelist.
4. Táº¥t cáº£ unit test xanh, bao gá»“m spec má»›i cho service + pipe.
5. Toggle `i18n.setLanguage('en')` trong consumer demo â†’ toÃ n bá»™ UI Core chuyá»ƒn EN tá»©c thÃ¬.
6. Reload trang â†’ ngÃ´n ngá»¯ giá»¯ nguyÃªn (Ä‘á»c localStorage).
7. `ISdCoreConfiguration.language = 'en'` nhÆ°ng localStorage cÃ³ `'vi'` â†’ dÃ¹ng `'vi'` (localStorage tháº¯ng).
8. Build size delta `< 30KB` gzipped cho 2 file message (sanity check).

## Risks

- **Consumer cá»§a `pattern.errorMessage`** â€” khÃ´ng biáº¿t háº¿t caller, cÃ³ thá»ƒ cÃ³ chá»— Ä‘ang assert chuá»—i raw. Mitigation: grep `errorMessage` trÃªn cáº£ workspace trÆ°á»›c batch 1.
- **Spec test cÃ³ chuá»—i VI hardcode** â€” sáº½ vá»¡. Mitigation: batch 1 update Ä‘á»“ng thá»i cÃ¡c spec liÃªn quan.
- **Translation EN cháº¥t lÆ°á»£ng** â€” khÃ´ng cÃ³ native reviewer. Mitigation: cháº¥p nháº­n round 1, má»Ÿ issue cho native review.
- **Pipe `pure: false`** â€” invalidate má»—i CD cycle. Mitigation: i18n trÃªn hot path (table cell, list item) cÃ³ thá»ƒ cáº§n cache; náº¿u performance Ä‘o Ä‘Æ°á»£c váº¥n Ä‘á» thÃ¬ cache trong service.
- **Test cÃ³ thá»ƒ bá»‹ flaky do localStorage** â€” `beforeEach` clear `SD_I18N_STORAGE_KEY`.

## File-level impact summary

- **Táº¡o má»›i**: 9 file dÆ°á»›i `projects/sdcorejs-angular/i18n/src/` + 1 `ng-package.json`.
- **Sá»­a**: `configurations/src/sd-core.configuration.ts`, `src/public-api.ts`, `tsconfig.lib.json` (paths), `package.json` (script `check:i18n*`), 193 file `.ts` + 3 file `.html` (Vietnamese strings).
- **Sá»­a spec**: `pattern.model.spec.ts` (assert key thay vÃ¬ chuá»—i) + spec khÃ¡c bá»‹ áº£nh hÆ°á»Ÿng.


# `<sd-inform>` â€” Design Spec

**Date**: 2026-05-30
**Status**: Approved-pending-review
**Component**: `@sdcorejs/angular/components/inform`

## 1. Purpose

A page-level banner / alert that informs the user â€” bÃ¡o lá»—i, cáº£nh bÃ¡o, hoáº·c thÃ´ng tin.
ThÆ°á»ng Ä‘Æ°á»£c **neo á»Ÿ trÃªn page** (consumer tá»± Ä‘áº·t vá»‹ trÃ­). Card cÃ³ viá»n + ná»n tint theo
mÃ u tráº¡ng thÃ¡i, leading status icon, title + body, optional close (Ã—), optional action.

Presentational thuáº§n â€” KHÃ”NG tá»± sticky/overlay, khÃ´ng service. Consumer quyáº¿t Ä‘á»‹nh vá»‹ trÃ­
vÃ  vÃ²ng Ä‘á»i (render/remove).

## 2. When to use / NOT to use

**Use**
- ThÃ´ng bÃ¡o lá»—i táº£i dá»¯ liá»‡u / lá»—i thao tÃ¡c á»Ÿ Ä‘áº§u trang.
- Cáº£nh bÃ¡o (dá»¯ liá»‡u sáº¯p háº¿t háº¡n, thiáº¿u cáº¥u hÃ¬nh, cháº¿ Ä‘á»™ chá»‰-Ä‘á»c).
- ThÃ´ng tin tráº¡ng thÃ¡i (Ä‘Ã£ lÆ°u nhÃ¡p, Ä‘ang Ä‘á»“ng bá»™).
- Banner hÆ°á»›ng dáº«n kÃ¨m 1 action ("Xem chi tiáº¿t", "Thá»­ láº¡i").

**NOT to use**
- Toast/notification táº¡m thá»i â†’ dÃ¹ng `NotifyService`.
- NhÃ£n tráº¡ng thÃ¡i ngáº¯n trong list/cell â†’ dÃ¹ng `<sd-badge>`.
- Há»™p xÃ¡c nháº­n cháº·n luá»“ng â†’ dÃ¹ng `ConfirmService` / `<sd-modal>`.

## 3. Identity

| | |
|---|---|
| Selector | `sd-inform` |
| Class | `SdInform` |
| Import path | `@sdcorejs/angular/components/inform` (barrel: `@sdcorejs/angular/components`) |
| Standalone | yes |
| Change detection | `OnPush` |
| Entry point | own folder + `ng-package.json` (`entryFile: index.ts`) + `index.ts` |

## 4. Public API

### Inputs

| Name | Type | Default | Notes |
|---|---|---|---|
| `color` | `Color` | `'primary'` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`. Falsy coerces â†’ `'primary'`. |
| `primary` | `boolean` | `false` | `booleanAttribute` shortcut cho `color="primary"`. |
| `secondary` | `boolean` | `false` | shortcut. |
| `info` | `boolean` | `false` | shortcut. |
| `success` | `boolean` | `false` | shortcut. |
| `warning` | `boolean` | `false` | shortcut. |
| `error` | `boolean` | `false` | shortcut. |
| `title` | `string \| undefined` | `undefined` | TiÃªu Ä‘á» (bold). KHÃ”NG nháº­n number. |
| `description` | `string \| undefined` | `undefined` | Body text. |
| `icon` | `string \| undefined` | `undefined` | Material icon override. Falsy â†’ auto theo color. |
| `hideIcon` | `boolean` | `false` | `booleanAttribute` â€” áº©n icon háº³n. |
| `fontSet` | `MaterialIconFontSet` | `'material-icons'` | Falsy â†’ default. Äá»“ng nháº¥t `sd-badge`. |
| `closable` | `boolean` | `false` | `booleanAttribute` â€” hiá»‡n nÃºt Ã—. |
| `actionLabel` | `string \| undefined` | `undefined` | Render text-link action. Bá»‹ override khi cÃ³ slot `[sdInformAction]`. |
| `lineClamp` | `number \| undefined` | `undefined` | Cáº¯t body cÃ²n N dÃ²ng + nÃºt Xem thÃªm/Thu gá»n khi trÃ n. |
| `autoId` | `string \| undefined` | `undefined` | Emit `data-autoId` / `data-autoid`. |

> Precedence mÃ u (giá»‘ng `sd-badge`): primary â†’ secondary â†’ info â†’ success â†’ warning â†’ error â†’ input `color`.

### Outputs

| Name | Type | Notes |
|---|---|---|
| `sdClosed` | `output<Event>` | Ã— click. Component set internal `dismissed()` â†’ host áº©n, Ä‘á»“ng thá»i emit. Uncontrolled. |
| `sdAction` | `output<Event>` | `actionLabel` link click. (Slot `[sdInformAction]` tá»± lo handler riÃªng.) |

### Content projection

| Slot | Notes |
|---|---|
| `[sdInformAction]` | VÃ¹ng action custom (vd `<sd-button>`). Khi cÃ³ ná»™i dung chiáº¿u vÃ o, thay tháº¿ link `actionLabel`. |

### Auto icon map

Khi `icon` falsy vÃ  `hideIcon === false`:

| color | icon |
|---|---|
| `error` | `error` |
| `warning` | `warning` |
| `success` | `check_circle` |
| `info` | `info` |
| `primary` | `info` |
| `secondary` | `info` |

## 5. Behavior

### Close (uncontrolled)
- `closable` true â†’ render Ã— á»Ÿ gÃ³c pháº£i trÃªn.
- Click Ã— â†’ `dismissed.set(true)` â†’ host bá»c trong `@if (!dismissed())` nÃªn biáº¿n máº¥t khá»i DOM; Ä‘á»“ng thá»i `sdClosed.emit(event)`.
- aria-label nÃºt Ã— = `core.common.close`.

### Line clamp + toggle
- `lineClamp` set (N>0) â†’ body nháº­n `-webkit-line-clamp: N` (clamp khi `expanded()` false).
- PhÃ¡t hiá»‡n trÃ n: `viewChild` element body + `afterNextRender` (+ `ResizeObserver` Ä‘á»ƒ re-check khi resize) so sÃ¡nh `scrollHeight > clientHeight` â†’ set `overflowing()` signal.
- Chá»‰ render toggle link khi `overflowing()` true.
- Toggle: `expanded()` flip; label = `core.inform.show-less` (Ä‘ang má»Ÿ) / `core.inform.show-more` (Ä‘ang thu).
- `lineClamp` khÃ´ng set â†’ body hiá»ƒn thá»‹ full, khÃ´ng toggle.

### Icon
- `computed effectiveIcon`: náº¿u `hideIcon` â†’ none; else `icon() || autoMap[effectiveColor()]`.
- Render qua MatIcon (font icon, giá»‘ng badge), color theo tráº¡ng thÃ¡i.

## 6. Layout / SCSS

`.c-inform` â€” flex row, align-items: flex-start:
```
[status icon] [content column: title / body / (toggle) / (action)] [Ã— close]
```
- border: `1px solid` mÃ u base; background: mÃ u `*-light` tint; border-radius: 8px; padding ~12px 16px; gap.
- Per-color tint/border/text/icon dÃ¹ng `$color_map` (mÆ°á»£n pattern `sd-badge` tag: `@each` color â†’ `.c-<color>`).
- Title: weight bold (T14B-ish), body: regular; action link: mÃ u base, hover underline.
- Ã— : icon-button nháº¹, mÃ u text má».
- Khi `hideIcon` / khÃ´ng title / khÃ´ng action â†’ cÃ¡c pháº§n tá»­ áº©n, layout co láº¡i tá»± nhiÃªn.

## 7. i18n

ThÃªm key vÃ o `i18n/src/{en,vi,ja,ko,zh}.ts` (+ type trong `i18n.messages.ts` náº¿u cáº§n):

| Key | en | vi |
|---|---|---|
| `core.inform.show-more` | `Show more` | `Xem thÃªm` |
| `core.inform.show-less` | `Show less` | `Thu gá»n` |

Reuse `core.common.close` cho aria-label nÃºt Ã—.

## 8. Files

**Lib** (`projects/sdcorejs-angular/components/inform/`)
- `ng-package.json` â€” `{ "lib": { "entryFile": "index.ts" } }`
- `index.ts` â€” `export * from './src/inform.component'`
- `sd-inform.md` â€” per-component contract doc
- `src/inform.component.ts | .html | .scss | .spec.ts`

**i18n** â€” bá»• sung 2 key Ã— 5 locale.

**Showcase** (`projects/showcase/`)
- `src/app/pages/components/inform/inform-demo.component.ts`
- route `components/inform` trong `app.routes.ts` (+ nav menu náº¿u cÃ³ registry).

**Docs**
- `CLAUDE.md`: thÃªm rule "má»—i component Má»šI pháº£i cÃ³ showcase demo + route trong cÃ¹ng PR" vÃ o má»¥c Documentation rules; thÃªm Recent work bullet.

## 9. Test coverage (TDD, Redâ†’Greenâ†’Refactor)

Spec `inform.component.spec.ts` â€” full unit + integration, khÃ´ng chá»‰ happy-path:
- Render máº·c Ä‘á»‹nh: color primary, auto icon `info`, khÃ´ng Ã— / khÃ´ng action.
- Má»—i color (6) â†’ class `.c-<color>` + auto icon Ä‘Ãºng map.
- Boolean shortcut precedence (vd `error` tháº¯ng `color="info"`).
- `icon` override tháº¯ng auto; `hideIcon` áº©n icon ká»ƒ cáº£ khi cÃ³ `icon`.
- `title` / `description` undefined â†’ pháº§n tá»­ tÆ°Æ¡ng á»©ng khÃ´ng render.
- `closable` false â†’ khÃ´ng cÃ³ Ã—; true â†’ cÃ³ Ã—; click Ã— â†’ emit `sdClosed` + host biáº¿n máº¥t.
- `actionLabel` â†’ render link; click â†’ emit `sdAction`. Slot `[sdInformAction]` cÃ³ ná»™i dung â†’ áº©n link `actionLabel`.
- `lineClamp`: Ã¡p clamp; mock overflow â†’ hiá»‡n toggle; click toggle flip `expanded` + Ä‘á»•i label show-moreâ†”show-less; khÃ´ng lineClamp â†’ khÃ´ng toggle.
- `autoId` â†’ `data-autoId`/`data-autoid` xuáº¥t hiá»‡n.
- i18n: dÃ¹ng key, khÃ´ng hardcode chuá»—i.

## 10. Out of scope (YAGNI)
- Sticky/pinned positioning helper.
- Two-way `[(open)]` model (uncontrolled lÃ  Ä‘á»§; cÃ³ thá»ƒ thÃªm sau náº¿u cáº§n Ä‘iá»u khiá»ƒn).
- Nhiá»u action máº·c Ä‘á»‹nh (slot `[sdInformAction]` Ä‘Ã£ lo case phá»©c táº¡p).
- Auto-dismiss theo timer (Ä‘Ã³ lÃ  viá»‡c cá»§a Notify/toast).

## 11. Consistency notes
- Naming inputs `icon`, `closable`, `color`, `fontSet`, `autoId` khá»›p cÃ¡c component khÃ¡c.
- Output `sdClosed` khá»›p `sd-modal` / `sd-side-drawer`.
- Color precedence + auto-coerce khá»›p `sd-badge`.
- Per-color SCSS pattern mÆ°á»£n `sd-badge` tag.


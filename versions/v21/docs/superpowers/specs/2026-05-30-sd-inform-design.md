�# `<sd-inform>` � Design Spec

**Date**: 2026-05-30
**Status**: Approved-pending-review
**Component**: `@sdcorejs/angular/components/inform`

## 1. Purpose

A page-level banner / alert that informs the user � báo l�i, cảnh báo, hoặc thông tin.
Thường �ược **neo �x trên page** (consumer tự �ặt v�9 trí). Card có viền + nền tint theo
màu trạng thái, leading status icon, title + body, optional close (�), optional action.

Presentational thuần � KH�NG tự sticky/overlay, không service. Consumer quyết ��9nh v�9 trí
và vòng �ời (render/remove).

## 2. When to use / NOT to use

**Use**
- Thông báo l�i tải dữ li�!u / l�i thao tác �x �ầu trang.
- Cảnh báo (dữ li�!u sắp hết hạn, thiếu cấu hình, chế ��" ch�0-�ọc).
- Thông tin trạng thái (�ã lưu nháp, �ang ��ng b�").
- Banner hư�:ng dẫn kèm 1 action ("Xem chi tiết", "Thử lại").

**NOT to use**
- Toast/notification tạm thời �  dùng `NotifyService`.
- Nhãn trạng thái ngắn trong list/cell �  dùng `<sd-badge>`.
- H�"p xác nhận chặn lu�ng �  dùng `ConfirmService` / `<sd-modal>`.

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
| `color` | `Color` | `'primary'` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`. Falsy coerces �  `'primary'`. |
| `primary` | `boolean` | `false` | `booleanAttribute` shortcut cho `color="primary"`. |
| `secondary` | `boolean` | `false` | shortcut. |
| `info` | `boolean` | `false` | shortcut. |
| `success` | `boolean` | `false` | shortcut. |
| `warning` | `boolean` | `false` | shortcut. |
| `error` | `boolean` | `false` | shortcut. |
| `title` | `string \| undefined` | `undefined` | Tiêu �ề (bold). KH�NG nhận number. |
| `description` | `string \| undefined` | `undefined` | Body text. |
| `icon` | `string \| undefined` | `undefined` | Material icon override. Falsy �  auto theo color. |
| `hideIcon` | `boolean` | `false` | `booleanAttribute` � ẩn icon hẳn. |
| `fontSet` | `MaterialIconFontSet` | `'material-icons'` | Falsy �  default. Đ�ng nhất `sd-badge`. |
| `closable` | `boolean` | `false` | `booleanAttribute` � hi�!n nút �. |
| `actionLabel` | `string \| undefined` | `undefined` | Render text-link action. B�9 override khi có slot `[sdInformAction]`. |
| `lineClamp` | `number \| undefined` | `undefined` | Cắt body còn N dòng + nút Xem thêm/Thu gọn khi tràn. |
| `autoId` | `string \| undefined` | `undefined` | Emit `data-autoId` / `data-autoid`. |

> Precedence màu (gi�ng `sd-badge`): primary �  secondary �  info �  success �  warning �  error �  input `color`.

### Outputs

| Name | Type | Notes |
|---|---|---|
| `sdClosed` | `output<Event>` | � click. Component set internal `dismissed()` �  host ẩn, ��ng thời emit. Uncontrolled. |
| `sdAction` | `output<Event>` | `actionLabel` link click. (Slot `[sdInformAction]` tự lo handler riêng.) |

### Content projection

| Slot | Notes |
|---|---|
| `[sdInformAction]` | Vùng action custom (vd `<sd-button>`). Khi có n�"i dung chiếu vào, thay thế link `actionLabel`. |

### Auto icon map

Khi `icon` falsy và `hideIcon === false`:

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
- `closable` true �  render � �x góc phải trên.
- Click � �  `dismissed.set(true)` �  host bọc trong `@if (!dismissed())` nên biến mất khỏi DOM; ��ng thời `sdClosed.emit(event)`.
- aria-label nút � = `core.common.close`.

### Line clamp + toggle
- `lineClamp` set (N>0) �  body nhận `-webkit-line-clamp: N` (clamp khi `expanded()` false).
- Phát hi�!n tràn: `viewChild` element body + `afterNextRender` (+ `ResizeObserver` �Ồ re-check khi resize) so sánh `scrollHeight > clientHeight` �  set `overflowing()` signal.
- Ch�0 render toggle link khi `overflowing()` true.
- Toggle: `expanded()` flip; label = `core.inform.show-less` (�ang m�x) / `core.inform.show-more` (�ang thu).
- `lineClamp` không set �  body hiỒn th�9 full, không toggle.

### Icon
- `computed effectiveIcon`: nếu `hideIcon` �  none; else `icon() || autoMap[effectiveColor()]`.
- Render qua MatIcon (font icon, gi�ng badge), color theo trạng thái.

## 6. Layout / SCSS

`.c-inform` � flex row, align-items: flex-start:
```
[status icon] [content column: title / body / (toggle) / (action)] [� close]
```
- border: `1px solid` màu base; background: màu `*-light` tint; border-radius: 8px; padding ~12px 16px; gap.
- Per-color tint/border/text/icon dùng `$color_map` (mượn pattern `sd-badge` tag: `@each` color �  `.c-<color>`).
- Title: weight bold (T14B-ish), body: regular; action link: màu base, hover underline.
- � : icon-button nhẹ, màu text mờ.
- Khi `hideIcon` / không title / không action �  các phần tử ẩn, layout co lại tự nhiên.

## 7. i18n

Thêm key vào `i18n/src/{en,vi,ja,ko,zh}.ts` (+ type trong `i18n.messages.ts` nếu cần):

| Key | en | vi |
|---|---|---|
| `core.inform.show-more` | `Show more` | `Xem thêm` |
| `core.inform.show-less` | `Show less` | `Thu gọn` |

Reuse `core.common.close` cho aria-label nút �.

## 8. Files

**Lib** (`projects/sdcorejs-angular/components/inform/`)
- `ng-package.json` � `{ "lib": { "entryFile": "index.ts" } }`
- `index.ts` � `export * from './src/inform.component'`
- `sd-inform.md` � per-component contract doc
- `src/inform.component.ts | .html | .scss | .spec.ts`

**i18n** � b�" sung 2 key � 5 locale.

**Showcase** (`projects/showcase/`)
- `src/app/pages/components/inform/inform-demo.component.ts`
- route `components/inform` trong `app.routes.ts` (+ nav menu nếu có registry).

**Docs**
- `CLAUDE.md`: thêm rule "m�i component M�aI phải có showcase demo + route trong cùng PR" vào mục Documentation rules; thêm Recent work bullet.

## 9. Test coverage (TDD, Red� Green� Refactor)

Spec `inform.component.spec.ts` � full unit + integration, không ch�0 happy-path:
- Render mặc ��9nh: color primary, auto icon `info`, không � / không action.
- M�i color (6) �  class `.c-<color>` + auto icon �úng map.
- Boolean shortcut precedence (vd `error` thắng `color="info"`).
- `icon` override thắng auto; `hideIcon` ẩn icon kỒ cả khi có `icon`.
- `title` / `description` undefined �  phần tử tương ứng không render.
- `closable` false �  không có �; true �  có �; click � �  emit `sdClosed` + host biến mất.
- `actionLabel` �  render link; click �  emit `sdAction`. Slot `[sdInformAction]` có n�"i dung �  ẩn link `actionLabel`.
- `lineClamp`: áp clamp; mock overflow �  hi�!n toggle; click toggle flip `expanded` + ��"i label show-more� show-less; không lineClamp �  không toggle.
- `autoId` �  `data-autoId`/`data-autoid` xuất hi�!n.
- i18n: dùng key, không hardcode chu�i.

## 10. Out of scope (YAGNI)
- Sticky/pinned positioning helper.
- Two-way `[(open)]` model (uncontrolled là �ủ; có thỒ thêm sau nếu cần �iều khiỒn).
- Nhiều action mặc ��9nh (slot `[sdInformAction]` �ã lo case phức tạp).
- Auto-dismiss theo timer (�ó là vi�!c của Notify/toast).

## 11. Consistency notes
- Naming inputs `icon`, `closable`, `color`, `fontSet`, `autoId` kh�:p các component khác.
- Output `sdClosed` kh�:p `sd-modal` / `sd-side-drawer`.
- Color precedence + auto-coerce kh�:p `sd-badge`.
- Per-color SCSS pattern mượn `sd-badge` tag.


---
title: Breadcrumb và Data State architecture
track: angular
status: implemented-in-v19
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular/components
---

# Breadcrumb và Data State architecture

## Phạm vi

Task 8 thêm hai standalone `OnPush` secondary entrypoint:

- `@sdcorejs/angular/components/breadcrumb`;
- `@sdcorejs/angular/components/data-state`.

UI DataState không import hoặc thay đổi `utilities/data-state`; hai surface có mục đích và đường dẫn độc lập. Chỉ v19 là source-of-truth, rollout v20/v21 thuộc Task 14.

## Breadcrumb data flow

```text
explicit items signal -----------------------------+
                                                    |
Router NavigationEnd -> route snapshot primary chain+-> normalize async labels
                                                       -> combineLatest
                                                       -> resolved item signal
                                                       -> overflow projection
                                                       -> semantic nav/ol/a/button/span
```

Effect dùng dependency động: `routeVersion` chỉ được đọc khi `items` là null/undefined. Vì vậy navigation dựng lại router trail nhưng không unsubscribe/re-subscribe manual observable labels. Mỗi lần source trail thay đổi, `combineLatest` cũ được cleanup; router event subscription dùng `takeUntilDestroyed`.

Route label error được chuyển thành label rỗng và item tương ứng bị bỏ khỏi trail. Overflow `maxItems >= 3` giữ root, một ellipsis và các item cuối. Current item là phần tử cuối sau overflow.

Navigation contract:

- URL string: native anchor có `href`; click thường được Router xử lý nội bộ nếu Router tồn tại, modified click giữ hành vi browser.
- router command array: native button gọi `router.navigate(commands)`.
- `clickable` không URL: native button chỉ emit `sdItemActivate`.
- disabled/current: non-interactive span.

## DataState rendering contract

```text
state === success -> custom template OR direct ng-content
state !== success -> custom template OR accessible default section
```

Default presentation derives locale keys from state, default icon map, role, and optional actions. `title`/`message` use nullish fallback: `undefined`/`null` chọn bản dịch, chuỗi rỗng là override hợp lệ. `icon` cũng dùng nullish semantics; chuỗi rỗng loại bỏ icon còn null/undefined chọn icon mặc định.

Error/forbidden use `role=alert`, loading/empty use `role=status`; loading adds `aria-busy=true`. CSS animation has a `prefers-reduced-motion` override. The host uses `display: contents`, so success does not introduce a layout presentation box.

`SdDataStateTemplateDirective` supplies a typed `TemplateRef<SdDataStateTemplateContext>` with `$implicit`, `state`, `retry`, and `action`. Callback references are stable class fields and forward to component outputs.

## Public surface

Breadcrumb exports:

- `SdBreadcrumb`;
- `SdBreadcrumbLabel`, `SdBreadcrumbItem`, `SdBreadcrumbRouteConfig`;
- `SdBreadcrumbResolvedItem`, `SdBreadcrumbItemTemplateContext`.

DataState exports:

- `SdDataState`, `SdDataStateTemplateDirective`;
- `SdDataStateKind`, `SdDataStateTemplateContext`.

Both are re-exported by `components/index.ts` and validated by the root public API spec.

## i18n

Nine keys were added consistently to en/vi/ja/ko/zh: title/message pairs for loading, empty, error, forbidden plus retry. Locale parity is checked independently because the package-level i18n scripts remain a known release blocker until Task 15.

## Showcase integration

- Breadcrumb: static, router-generated, async sections.
- DataState: loading, empty custom template, error actions, forbidden full-page, transparent success sections.
- Registry total: 89 pages, 276 examples after generation.
- Route metadata on category/slug/tab enables the router-generated breadcrumb demo.

## Review repairs

The Task 8 review introduced RED regression tests before each repair:

1. manual async label subscriptions are stable across navigation;
2. empty title/message overrides do not fall back to locale defaults;
3. router-command items are native focusable buttons rather than anchors without `href`.

## Source map

| Path                                                                 | Responsibility                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| `components/breadcrumb/src/breadcrumb.component.*`                   | route/manual resolution, navigation, semantics, styles    |
| `components/data-state/src/data-state.component.*`                   | state rendering, template context, actions, accessibility |
| `components/*/sd-*.md`                                               | consumer API reference                                    |
| `i18n/src/{en,vi,ja,ko,zh}.ts`                                       | default DataState copy                                    |
| `projects/showcase/src/app/pages/components/{breadcrumb,data-state}` | live demos and demo specs                                 |

## Remaining release work

- Rollout to v20/v21 and published documentation mapping in Task 14.
- Browser visual smoke and full-suite repair in Task 15.
- Known source-only full Karma baseline failures and global function coverage threshold remain release blockers; Task 8 focused evidence does not override them.

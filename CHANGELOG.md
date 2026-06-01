# Changelog — `@sdcorejs/angular`

Changelog **độc lập** cho npm package `@sdcorejs/angular`. Repo này deploy theo nhịp riêng, KHÔNG khớp 1:1 với `@sd-angular/core` (vn-angular source).

- **Đơn vị release = patch tag** (`v0.0`, `v0.1`, …). Mỗi tag publish đồng thời 3 major: `19.<patch>` / `20.<patch>` / `21.<patch>` — **cùng nội dung feature**, chỉ khác Angular major shim. Vì vậy mỗi patch = **một entry duy nhất** ở đây.
- Mỗi entry ghi rõ **synced from `vn-angular@<commit>`** để truy vết source. Một release `@sdcorejs/angular` có thể gộp nhiều commit vn-angular.
- Major digit khoá theo Angular line → **không** dùng để báo breaking. Breaking change PHẢI ghi rõ ở mục `Changed (BREAKING for consumers)` + migration. Consumer luôn pin major: `npm i @sdcorejs/angular@^19.0.0`.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

_Chưa có thay đổi nào kể từ `[0.0]`._

## [0.0] - 2026-06-01

Published: `@sdcorejs/angular@19.0.0` / `@20.0.0` / `@21.0.0` (npm dist-tag `latest`).
Pre-release: `0.0-rc.1` (dist-tag `beta`).
Synced from `vn-angular@50540baf`.

### Added

- **`components/tab`** — `<sd-tab-group>` + `<sd-tab>` declarative tabs wrapping `mat-tab-group`. Inputs: `selectedIndex` (model), `variant` (`'line' | 'pills' | 'segmented'`), `color` (SdColor), `stretchTabs`, `alignTabs`, `headerPosition`, `animationDuration`, `disableRipple`, `dynamicHeight`, `autoId`. Per-tab: `label` (required), `icon`, `badge`, `disabled`, `closable`. Lazy content via `matTabContent` + viewChild template ref. 58 specs.
- **`components/stepper`** — `<sd-stepper>` + `<sd-step>` wrapping `mat-stepper` / `CdkStepper`. Inputs: `selectedIndex` (model), `linear`, `orientation`, `labelPosition`, `headerPosition`, `animationDuration`, `disableRipple`, `color`, `autoId`. Per-step: `label` (required), `icon`, `optional`, `editable`, `stepControl`, `state`, `errorMessage`. Methods `next` / `previous` / `reset` / `goTo`. Doc tại `projects/sdcorejs-angular/components/stepper/sd-stepper.md`. 26 specs.
- **`components/ckeditor-styles`** — `<sd-ckeditor-styles>` empty-render component sở hữu global CKEditor 5 CSS qua `ViewEncapsulation.None`. Nhúng tự động trong `<sd-editor>`, `<sd-mini-editor>`, `<sd-document-builder>`; consumer không cần load CSS thủ công nữa.
- **`forms/input-color`** — `<sd-input-color>` hex color field gồm `<sd-input>` + suffix swatch + native `<input type="color">` ẩn. Hex pattern validator built-in; export `SD_INPUT_COLOR_HEX_PATTERN`. Nút Clear (X) khi có giá trị + editable + không required. 30 specs.

### Changed (BREAKING for consumers)

- **CKEditor global CSS no longer required** — `<sd-editor>`, `<sd-mini-editor>`, `<sd-document-builder>` giờ nhúng `<sd-ckeditor-styles>` nội bộ. CSS nằm trong lazy chunk của từng editor thay vì initial bundle của consumer.

  **Migration:** xoá dòng sau khỏi `angular.json` `styles[]` ở mọi consumer app:

  ```diff
   "styles": [
     "src/styles.scss",
  -  "@sdcorejs/angular/assets/scss/ckeditor5.scss",
     "@sdcorejs/angular/assets/scss/sd-core.scss"
   ],
  ```

  Không cần thao tác khác. Verify:
  1. `<sd-editor>` / `<sd-mini-editor>` / `<sd-document-builder>` vẫn render đúng (toolbar, dialog, balloon đều có style).
  2. Initial bundle giảm ~100 KB khi CSS không còn bundle global.
  3. Editor lazy chunk (khi route tới) tăng ~100 KB chứa cùng CSS dạng JS-injected styles.

  Asset `@sdcorejs/angular/assets/scss/ckeditor5.scss` vẫn ship trong package — chỉ bỏ yêu cầu import global. App cũ giữ global import vẫn chạy (`ViewEncapsulation.None` dedupe `<style>` theo component identity).

### Internal

- Showcase project tại `projects/showcase/` — catalog trực quan mọi component trong `@sdcorejs/angular`, 47 lazy demo page (Components / Forms / Services). Deploy lên GitHub Pages qua `.github/workflows/deploy-pages.yml`.

---

Để tra source chi tiết theo từng version, xem `SYNC-STATUS.md` trong mỗi `versions/v<N>/` (ghi commit vn-angular + thời điểm sync).

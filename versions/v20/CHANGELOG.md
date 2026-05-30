�# Changelog

Tất cả thay ��"i �áng kỒ của `@sdcorejs/angular` �ược ghi trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và project tuân theo [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **`components/tab`** � `<sd-tab-group>` + `<sd-tab>` declarative tabs wrapping `mat-tab-group`. Inputs: `selectedIndex` (model), `variant` (`'line' | 'pills' | 'segmented'`), `color` (SdColor), `stretchTabs`, `alignTabs`, `headerPosition`, `animationDuration`, `disableRipple`, `dynamicHeight`, `autoId`. Per-tab: `label` (required), `icon`, `badge`, `disabled`, `closable`. Lazy content via `matTabContent` + viewChild template ref. 58 specs.
- **`components/stepper`** � `<sd-stepper>` + `<sd-step>` wrapping `mat-stepper` / `CdkStepper`. Inputs: `selectedIndex` (model), `linear`, `orientation`, `labelPosition`, `headerPosition`, `animationDuration`, `disableRipple`, `color`, `autoId`. Per-step: `label` (required), `icon`, `optional`, `editable`, `stepControl`, `state`, `errorMessage`. Methods `next` / `previous` / `reset` / `goTo`. Doc at `projects/sdcorejs-angular/components/stepper/sd-stepper.md`. 26 specs.
- **`components/ckeditor-styles`** � `<sd-ckeditor-styles>` empty-render component that owns the global CKEditor 5 CSS via `ViewEncapsulation.None`. Embedded inside `<sd-editor>`, `<sd-mini-editor>`, and `<sd-document-builder>` automatically; downstream consumers no longer need to load the CSS themselves.
- **`forms/input-color`** � `<sd-input-color>` hex color field composing `<sd-input>` + suffix swatch + hidden native `<input type="color">`. Hex pattern validator built in; exports `SD_INPUT_COLOR_HEX_PATTERN`. Clear (X) button when the value is non-empty and the control is editable + not required. 30 specs.

### Changed (BREAKING for consumers)

- **CKEditor global CSS no longer required** � `<sd-editor>`, `<sd-mini-editor>`, and `<sd-document-builder>` now embed `<sd-ckeditor-styles>` internally. The CSS lives in each editor's lazy chunk instead of the consumer's initial bundle.

  **Migration:** remove the following line from `angular.json` `styles[]` in every consumer app:

  ```diff
   "styles": [
     "src/styles.scss",
  -  "@sdcorejs/angular/assets/scss/ckeditor5.scss",
     "@sdcorejs/angular/assets/scss/sd-core.scss"
   ],
  ```

  No other action required. Verify that:
  1. `<sd-editor>` / `<sd-mini-editor>` / `<sd-document-builder>` still render correctly (toolbar, dialogs, balloons all styled)
  2. The initial bundle size drops by ~100 KB once the CSS is no longer globally bundled
  3. The editor lazy chunks (when routed) gain ~100 KB containing the same CSS as JS-injected styles

  The `@sdcorejs/angular/assets/scss/ckeditor5.scss` asset itself still ships in the package � only the requirement to import it globally is removed. Existing apps that keep the global import will continue to work (the styles will load twice but `ViewEncapsulation.None` deduplicates the resulting `<style>` tags by component identity).

### Internal

- New showcase project at `projects/showcase/` (separate from the legacy `projects/demo/`). Visual catalog of every component in `@sdcorejs/angular` with 47 lazy-loaded demo pages organized into Components / Forms / Services groups. Run with `npm run showcase`.

---

For prior versions, see git history (`git log --oneline` on `release/0.0.1`). Versions before this CHANGELOG was introduced did not maintain a structured changelog file.


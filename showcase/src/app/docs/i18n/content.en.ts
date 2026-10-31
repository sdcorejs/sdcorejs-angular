import type { ShowcaseExampleSourceKey } from '../generated/example-manifest.generated';

/** English text of one registry entry whose source text is Vietnamese. A missing field keeps the source text. */
export interface DocsContentTranslation {
  readonly title?: string;
  readonly description?: string;
}

/**
 * English page titles and descriptions for EN mode, keyed by page id. The Vietnamese source stays in
 * documentation.registry.ts and VI mode shows it unchanged.
 */
export const EN_PAGE_CONTENT: Readonly<Record<string, DocsContentTranslation>> = {
  'components-anchor': { description: 'Column-style scroll-spy navigation that highlights the matching item as you scroll.' },
  'components-avatar': { description: 'Round avatar with an initials fallback and a name-stable color.' },
  'components-avatar-group': {
    description: 'Overlapping avatar group with a "+N" slot that opens the hidden people, status dots and name tooltips.',
  },
  'components-badge': { description: 'Status and count labels in icon, round, tag, solid, dot and pair forms.' },
  'components-badge-picker': {
    description:
      'Dropdown that picks the type, color and icon of sd-badge together, commits the value when the panel closes and registers with forms.',
  },
  'components-button': { description: 'Action button with variants, sizes, icons and a loading state.' },
  'components-breadcrumb': { description: 'Static or router-generated breadcrumb with async labels, overflow and semantic navigation.' },
  'components-code-editor': { description: 'Source code editor with Prism highlighting and copy support.' },
  'components-data-state': { description: 'Accessible loading, empty, error, forbidden and transparent success presentation.' },
  'components-editor': { description: 'Rich text editor with a CoreUI toolbar, validation and FormGroup binding.' },
  'components-file-explorer': {
    description: 'Google Drive-style file browser: folder tree, list/grid, search, preview, upload/download and a transfer queue.',
  },
  'modules-integrations-generic': { description: 'Dynamic form builder and renderer with drag/drop, conditions and runtime preview.' },
  'components-history': { description: 'Vertical timeline for the change and approval history of a record.' },
  'components-image-editor': {
    description:
      'Free or fixed-ratio crop, 90° rotate, flip, pixel resize, zoom/pan, undo/redo and format choice; returns a real Blob/File on Apply.',
  },
  'components-highlight': {
    description:
      'Highlights keywords in text, ignoring letter case and Vietnamese diacritics (including the stroked d); renders only text and <mark>.',
  },
  'guides-theme-tokens': {
    description:
      'The --sd-* token layers (palette, ramp, semantic, scale, component), light/dark/auto modes, focus ring and the contrast table.',
  },
  'modules-integrations-generic-crud': {
    description:
      'List, detail, create, edit, import and configuration screens generated from SdGenericSchema, connected to the backend through a per-module adapter.',
  },
  'modules-integrations-icon': { description: 'Shared icon facade for Material filled, Material outlined and Lucide SVG.' },
  'components-import-excel': { description: 'Excel import flow covering template, upload, validation, preview and valid data.' },
  'components-inform': { description: 'Page-anchored notification banner for errors, warnings and information.' },
  'components-mini-editor': { description: 'Compact editor for comments and short notes, supporting HTML or Markdown.' },
  'components-modal': { description: 'Dialog and bottom sheet with shared header/footer slots.' },
  'components-modal-resizable': { description: 'Compatibility alias of Window; use SdWindow and sd-window for new code.' },
  'components-window': { description: 'Nonmodal detail window with a close API unified with Core overlays; minimize and fullscreen.' },
  'components-operator': { description: 'Comparison operator picker used in advanced filters.' },
  'components-org-chart': { description: 'Tree-style org chart with node cards and collapse/expand states.' },
  'components-page': {
    description: 'Page frame inside the shell: header with title, back button and badge; column width; subheader, side column and footer.',
  },
  'components-page-list': {
    description:
      'List screen with sd-table: body fits the screen, the paginator is always visible and detail is a child route (page or drawer).',
  },
  'components-preview': { description: 'Image and PDF viewer with zoom, rotate, fullscreen and download.' },
  'components-query-bar': { description: 'Filter chip bar supporting AND/OR, saved filters, popover and inline mode.' },
  'components-api-contract-builder': { description: 'JSON API contract editor: input schema, request, response and output mapping.' },
  'components-query-builder': { description: 'Tree-style condition builder with nested AND/OR groups and many field types.' },
  'components-quick-action': { description: 'Floating bottom toolbar for bulk actions.' },
  'components-section': { description: 'Information group card with header, body, footer and label/value items.' },
  'components-side-drawer': {
    description:
      'Right-side panel for forms, detail and filters with header/footer slots; opens over the whole page or compactly inside a container.',
  },
  'components-splitter': { description: 'Splits space into panels that can be dragged to resize horizontally or vertically.' },
  'components-stepper': { description: 'Multi-step flow supporting horizontal/vertical, linear forms and error states.' },
  'components-tab': { description: 'Declarative tabs supporting icons, badges, disabled, closable and lazy content.' },
  'components-tab-router': { description: 'Browser-tab-style router shell that keeps state when switching back and forth between URLs.' },
  'components-table': { description: 'Local/server data table with pagination, filter, selection, commands and export.' },
  'components-tree': { description: 'Static/lazy tree for catalogs and organizations, supporting selection, commands and templates.' },
  'components-upload-file': { description: 'File and image upload with drag and drop, validation, multi-file and preview.' },
  'components-view': { description: 'Read-only label/value pairs for detail pages.' },
  'forms-autocomplete': { description: 'Type to filter and pick a single value, supporting cache, addable and validation.' },
  'forms-checkbox': { description: 'Boolean checkbox with theme colors and disabled/viewed states.' },
  'forms-chip': { description: 'String tag list input with add and remove chip actions.' },
  'forms-chip-calendar': { description: 'Pick multiple dates and show each date as a chip.' },
  'forms-date': { description: 'Pick a single date with two-way binding to an ISO date string.' },
  'forms-date-range': { description: 'Pick a period from a start date to an end date.' },
  'forms-datetime': { description: 'Pick a date and time in a single control.' },
  'forms-inline-text': { description: 'Borderless, content-hugging input primitive for inline editing.' },
  'forms-entity-picker': {
    description: 'Generic key-based picker composing QueryBar, Table and Modal for server paging, hydration and templates.',
  },
  'forms-input': { description: 'Single-line input with helper text, validators and locked/viewed states.' },
  'forms-input-color': { description: 'HEX code input with a swatch and a color palette.' },
  'forms-input-number': { description: 'Number input with thousands formatting, min/max, prefix and suffix.' },
  'forms-radio': { description: 'Pick one value from a group in a horizontal or vertical layout.' },
  'forms-select': { description: 'Single-value dropdown with templates and footer actions.' },
  'forms-switch': { description: 'Boolean switch with three sizes, theme colors and disabled/viewed states.' },
  'forms-textarea': { description: 'Multi-line input with helper text, length validation and locked states.' },
  'forms-time': { description: 'Enter or pick a plain HH:mm time, carrying no date or time zone.' },
  'forms-time-range': { description: 'Time-only range with order, boundary and open-ended validation.' },
  'forms-tree-select': {
    description: 'Stable-key tree picker composing static/lazy SdTree with cascade, indeterminate, keyboard and retry.',
  },
  'services-confirm': { description: 'Promise-based confirmation dialogs for confirm, input, choice and date/datetime.' },
  'services-excel': { description: 'Export/import XLSX and CSV, create templates and parse worksheets.' },
  'services-loading': { description: 'Overlays a loading spinner on the body or on a target element by CSS selector.' },
  'services-notify': { description: 'Toast notifications for success, info, warning and error.' },
  'services-storage': { description: 'Typed local/session storage handles with cache and Observable updates.' },
  'services-unsaved-changes': {
    description: 'Scoped dirty registry, FormGroup adapter and fail-closed guards for navigation, modal, drawer and tab.',
  },
  'services-viewport': { description: 'SSR-safe signals for size and mobile/tablet/desktop breakpoints from a single resize listener.' },
  'pipes-utilities-read-state': { description: 'TABLE/VALUE/SEARCH read state, error snapshots and retry for controls.' },
  'pipes-utilities-theme': {
    description: 'Reads resolved --sd-* color token values from TypeScript: readSdTokens, SdColorToken, SD_COLOR_TOKENS.',
  },
};

/**
 * English example titles and notes for EN mode, keyed by example source key. The Vietnamese source is the
 * `heading` and `note` of each <demo-section> in showcase/src/app/pages/**; labels inside live demos stay Vietnamese.
 */
export const EN_EXAMPLE_CONTENT: Readonly<Partial<Record<ShowcaseExampleSourceKey, DocsContentTranslation>>> = {
  'components/anchor/example-anchor-mac-dinh': { title: 'Default anchor' },
  'components/anchor/example-mau-va-cat-ngan-chu': { title: 'Colors and text truncation' },
  'components/api-contract-builder/example-ba-che-do-nguon-gia-tri': {
    title: 'Three value source modes',
    description:
      'keyword comes from a source (a single dropdown, no typing ${…}); Authorization is a composed template, so it opens under Advanced; version is a static value.',
  },
  'components/api-contract-builder/example-che-do-xem': {
    title: 'View mode',
    description: 'View mode shows a summary together with the JSON; disabled keeps the steps as they are but locks editing.',
  },
  'components/api-contract-builder/example-contract-sai-va-chan-doan': {
    title: 'Invalid contract and diagnostics',
    description:
      '${env.unknown} is not declared, {id} is missing from req.path, ${input.page} does not exist, and an array output points to a number.',
  },
  'components/api-contract-builder/example-dan-json-de-nap-contract': {
    title: 'Paste JSON to load a contract',
    description:
      'On the Check step: the Copy button takes the contract out, and pasting JSON into that same editor loads a new contract. If the JSON has a syntax error, the contract is kept unchanged and a contract.invalid diagnostic is added.',
  },
  'components/api-contract-builder/example-danh-sach-gon-sua-trong-drawer': {
    title: 'Compact list, edit in a drawer',
    description:
      'Each field is a read-only row. Click a row or the Add button to open a drawer; the contract only changes when you click Save. An object field shows its number of child fields — click it to drill down right inside that drawer, with no drawer nested in a drawer.',
  },
  'components/api-contract-builder/example-get-tim-kiem-san-pham': {
    title: 'GET product search',
    description:
      'Query is mapped from input, the Authorization header interpolates ${env.token}, and the output is a root array taken directly from ${res.body.items}.',
  },
  'components/api-contract-builder/example-gia-tri-tinh-theo-kieu-du-lieu': {
    title: 'Static values by data type',
    description: 'Each data type renders its own control; object and array use sd-code-editor. date/datetime values are stored as ISO.',
  },
  'components/api-contract-builder/example-ket-qua-chan-doan': {
    title: 'Diagnostic results',
    description: 'Values are read directly from the two outputs of the demo above.',
  },
  'components/api-contract-builder/example-post-map-body': {
    description:
      'input.a → req.body.x, input.b → req.body.y, input.c → req.body.z, env.userId → req.body.u, and a static literal at req.body.v.',
  },
  'components/api-contract-builder/example-truong-output-cho-dropdown-table': {
    title: 'Output fields for dropdown / table',
    description:
      'listSdApiContractSchemaFields() flattens the root array — this is exactly the data form-builder will use to pick valueField / displayField and generate columns.',
  },
  'components/audit-diff/example-format-redact-va-order': { title: 'Format, redact and order' },
  'components/audit-diff/example-stable-key-array': {
    description: 'Reordering does not produce false diffs; added or removed items still go through the child field rules.',
  },
  'components/avatar-group/example-du-dung-mot-nguoi': {
    title: 'Exactly one extra person',
    description: '7 people with max 6: the 7th person is always shown in place of the “+1” slot.',
  },
  'components/avatar-group/example-kich-thuoc': { title: 'Sizes' },
  'components/avatar-group/example-nhom-avatar': {
    title: 'Avatar group',
    description: 'Hover each avatar to see the name and status; click “+N” to open the list (Esc closes it and returns focus to the slot).',
  },
  'components/avatar-group/example-tu-mo-man-hinh-khac': {
    title: 'Open another screen yourself',
    description: 'When something listens to moreClick, “+N” does not open the default popover but emits the list of hidden people.',
  },
  'components/avatar/example-anh-co-ten': {
    title: 'Image with name',
    description: 'Hover the image to see the name. If the image fails, the initials and color come from name.',
  },
  'components/avatar/example-anh-url': { title: 'URL image' },
  'components/avatar/example-cac-kich-thuoc': { title: 'Sizes' },
  'components/avatar/example-cham-theo-kich-thuoc': { title: 'Dot by size' },
  'components/avatar/example-cham-trang-thai': {
    title: 'Status dot',
    description:
      "The dot sits on the avatar edge at a 45° angle, with a diameter of 25% of the avatar size (8–20px) and a border ring in the background color. statusLabel is the dot's tooltip and is read together with the name, for example “Le Lan Anh, Active”.",
  },
  'components/avatar/example-chu-cai-dau-tu-ten': { title: 'Initials from name' },
  'components/avatar/example-fallback-khi-thieu-du-lieu': { title: 'Fallback when data is missing' },
  'components/avatar/example-trong-danh-sach': { title: 'In a list' },
  'components/badge-picker/example-chi-xem-va-vo-hieu': { title: 'Read-only and disabled' },
  'components/badge-picker/example-chon-badge': {
    title: 'Pick a badge',
    description: 'Click outside, click Done or Tab out of the panel to commit; Esc cancels the change.',
  },
  'components/badge-picker/example-gioi-han-lua-chon': { title: 'Limit the choices' },
  'components/badge-picker/example-kich-thuoc': {
    title: 'Sizes',
    description: 'Same scale as sd-select. At size sm the summary line is hidden; size lg uses an md badge inside the field.',
  },
  'components/badge-picker/example-mo-ta-trong-ban-xem-truoc': {
    title: 'Description in the preview',
    description: 'Only shown in the large preview, for the icon and tag styles; other styles show a note.',
  },
  'components/badge-picker/example-nhan-va-placeholder': { title: 'Label and placeholder' },
  'components/badge-picker/example-trong-form': {
    description:
      'The control value is { type, color, icon } | null. The required error appears after the panel is first closed or on submit.',
  },
  'components/badge/example-bam-duoc': {
    title: 'Clickable',
    description:
      'Only when (click) is bound: role button, reachable with Tab, Enter/Space activate it. Hover mixes 6% of the darker color into the background, press mixes 10%; the focus ring keeps the rounded corners.',
  },
  'components/badge/example-dot-va-pulse': {
    title: 'Dot and pulse',
    description:
      'A dot shows only the dot; title is not displayed but serves as the tooltip and the screen reader name (required). pulse adds a 1.6s blinking halo ring, which stays still when reduced motion is preferred.',
  },
  'components/badge/example-fontset-switch': {
    description: 'Choose the fontSet with a radio to compare the alignment of the same set of icon badges.',
  },
  'components/badge/example-kem-mo-ta': {
    title: 'With description',
    description: 'Description is 12px. A tag with a description becomes a two-line block; the icon aligns to the first line.',
  },
  'components/badge/example-kich-thuoc-round': { title: 'Round sizes' },
  'components/badge/example-kich-thuoc-tag': { title: 'Tag sizes' },
  'components/badge/example-mau-sac-icon': {
    title: 'Icon colors',
    description: 'Without an icon, the badge draws a CSS dot in the base color (8px, lg 10px).',
  },
  'components/badge/example-mau-sac-round': { title: 'Round colors' },
  'components/badge/example-mau-sac-tag': { title: 'Tag colors' },
  'components/badge/example-pair': {
    description:
      'Attribute-value pair: the label has a light secondary background, the value follows color. When too long, the value is truncated first and the label is kept intact.',
  },
  'components/badge/example-round-voi-icon': { title: 'Round with icon' },
  'components/badge/example-sau-dang': { title: 'Six variants' },
  'components/badge/example-so-dem': {
    title: 'Counter',
    description:
      'When title is a number: a circle for a single digit, with tabular digits; above 99 it shows 99+ (screen readers still read the real number).',
  },
  'components/badge/example-solid': {
    description:
      'Base color background with contrasting text: for statuses that need immediate attention, at most one solid badge per row. When title is a number it becomes a counter like round.',
  },
  'components/badge/example-ten-dai-trong-o-hep': {
    title: 'Long name in a narrow cell',
    description:
      'Always a single line, long text is truncated with an ellipsis. The tooltip appears only when the text is truncated (full title) or when a dedicated tooltip is set.',
  },
  'components/breadcrumb/example-danh-sach-tinh': {
    title: 'Static list',
    description: 'The root, the ellipsis and the last context item are kept; disabled items do not become interactive controls.',
  },
  'components/breadcrumb/example-nhan-async': {
    title: 'Async label',
    description: 'An Observable label updates live and unsubscribes automatically when the source or component is replaced.',
  },
  'components/breadcrumb/example-router-generated': {
    description: 'No items passed: the component reads the primary route chain of this documentation page and updates after NavigationEnd.',
  },
  'components/button/example-bang-mau': { title: 'Color palette' },
  'components/button/example-bien-the': { title: 'Variants' },
  'components/button/example-chi-icon': { title: 'Icon only' },
  'components/button/example-crud-chung-khuyen-khich': {
    title: 'Generic CRUD (recommended)',
    description:
      'Create (add), Update (edit), Save (save): primary fill. Delete (delete): error fill. Details use a hyperlink on the code or name.',
  },
  'components/button/example-crud-theo-doi-tuong': {
    title: 'CRUD by entity',
    description: 'Create customer, Update customer, Save customer: primary fill, with add / edit / save icons.',
  },
  'components/button/example-dang-luu-loi-thu-lai': {
    title: 'Saving / error / retry',
    description: 'Saving… is disabled to prevent duplicate submits; on error the input is kept and a Retry button is shown.',
  },
  'components/button/example-hanh-dong-nguy-hiem': {
    title: 'Dangerous action',
    description:
      'The Delete button uses the delete icon with error fill. State the target and the consequence clearly in the confirmation dialog; the cancel button is Keep.',
  },
  'components/button/example-indicator': {
    description:
      'A dot or number at the top-right corner that does not change the button size. A number greater than indicatorMax shows {max}+; indicatorLabel is appended to aria-describedby.',
  },
  'components/button/example-kich-thuoc': { title: 'Sizes' },
  'components/button/example-search-filter': {
    description: 'Search, Apply filter, Clear filter; live search does not add a redundant Search button.',
  },
  'components/button/example-tac-vu-gop-popover': {
    title: 'Grouped actions · Popover',
    description:
      'Uses SdButton with SdButtonItem and SdButtonItemDivider. The popover supports mouse, keyboard, Escape and a tooltip for icon-only buttons.',
  },
  'components/button/example-tac-vu-nghiep-vu': {
    title: 'Business actions',
    description:
      'Uses light, with colors following business meaning: primary/info for submit and process, success for approve, warning for pause, error for reject. Includes samples with an icon, without an icon, and icon-only with a tooltip.',
  },
  'components/button/example-toggle-icon-set-bang-alias': {
    title: 'Toggle the icon set via aliases',
    description:
      'The buttons below still pass Material icon names; when switching to Lucide, SdIcon maps them automatically through the corresponding aliases.',
  },
  'components/button/example-trang-thai': { title: 'States' },
  'components/card/example-count-card-de-loc': {
    title: 'Count card as a filter',
    description: 'One card is selected; aria-pressed, toggle, counts over the whole dataset, intersected with search.',
  },
  'components/card/example-disabled-va-color': {
    title: 'Disabled and color',
    description: 'Includes selected+disabled, group disabled, inherited color, color override and standalone selected state.',
  },
  'components/card/example-icon-canh-nhan': {
    title: 'Icon beside label',
    description:
      'A 20–24px icon sits on the same row as the label; the value remains the main focal point. The icon does not replace the metric name.',
  },
  'components/card/example-icon-click-de-loc': {
    title: 'Icon + click to filter',
    description:
      'The whole card is a button and the icon is decorative; aria-pressed and a check mark show the selection. Clicking again returns to All; counts do not change with the selection.',
  },
  'components/card/example-icon-trang-thai': {
    title: 'Status icon',
    description: 'Clock / in progress / check accompany the status label; the text explains the meaning, not just the color.',
  },
  'components/card/example-icon-trong-nen-mau': {
    title: 'Icon on a colored background',
    description:
      'A 24px icon in a 44px box; color follows role/status, with one consistent icon style. A read-only metric has no click behavior.',
  },
  'components/card/example-metric-chi-doc': {
    title: 'Read-only metric',
    description: 'Includes unit and scope; no hover/action cursor is created when it is not clickable.',
  },
  'components/card/example-object-comparewith': {
    description: 'The model and option are two objects with different references, yet the ACTIVE card is still selected by code.',
  },
  'components/card/example-score-card-gon': {
    title: 'Compact score card',
    description: 'Reduces whitespace without shrinking text until it is hard to read.',
  },
  'components/card/example-single-selection': { description: 'Click the selected card again to clear the model to null.' },
  'components/card/example-so-sanh-hai-ky': {
    title: 'Two-period comparison',
    description: 'The delta states the unit and period; an increase is not assumed to be good for every metric.',
  },
  'components/card/example-standalone-card': {
    description: 'Click the card to toggle its state; the consumer reads the new state via #card=sdCard.',
  },
  'components/card/example-tien-do-ty-le': {
    title: 'Progress / ratio',
    description: 'Shows both numerator and denominator; when the total is 0 it shows 0%, with no division by 0.',
  },
  'components/code-editor/example-che-do-xem-json': { title: 'JSON view mode' },
  'components/code-editor/example-ngon-ngu-html': { title: 'HTML language' },
  'components/code-editor/example-ngon-ngu-typescript': { title: 'TypeScript language' },
  'components/data-state/example-empty': {
    description: 'A custom template receives the state/retry/action context in place of the default presentation.',
  },
  'components/data-state/example-icon-shape': {
    description:
      'Default is a square with 8px radius (token --sd-icon-shape-radius). circle keeps the old round style; none removes the background and keeps the box size.',
  },
  'components/data-state/example-loi-va-retry-tren-ba-control': { title: 'Error and retry on three controls' },
  'components/data-state/example-panel-hep-va-lua-chon-dang-giu': {
    title: 'Narrow panel and held selections',
    description:
      'The error sits in the middle, below the selected items. A 180px panel still shows the message and the Retry button is clickable.',
  },
  'components/data-state/example-success': { description: 'No redundant presentation wrapper; content is projected directly.' },
  'components/editor/example-bieu-mau': { title: 'Form' },
  'components/editor/example-chi-doc': { title: 'Read-only' },
  'components/editor/example-soan-noi-dung': { title: 'Compose content' },
  'components/file-explorer/example-chi-xem-va-tai-xuong': {
    title: 'View and download only',
    description:
      'Any callback that is not provided makes the matching UI disappear. Without search, the search box filters the already loaded list of the current folder. Download returns void: the explorer only records that the file was handed to the browser and does not simulate a percentage.',
  },
  'components/file-explorer/example-day-du-tinh-nang': {
    title: 'Full feature set',
    description:
      'Drag and drop files into the explorer or click "Upload file"; file names containing "loi" simulate an error so you can try the Retry button. Select several files and use the selection bar: flat buttons default to light (Move to Documents), groups default to text (Tools, ⋮ menu), at the same 32px size as the row commands. Semantic colors are declared by the demo page itself: Mark as approved (success), View info (info), Archive (warning), Delete file (error). Hover (or Tab) onto a row to see the file/folder commands; the sample contract is locked from selection. Confirmation, loading state and reload() are all handled by the demo page (the consumer).',
  },
  'components/file-explorer/example-khung-hep-mobile': {
    title: 'Narrow frame / mobile',
    description:
      'The layout changes with the width of the explorer itself (ResizeObserver), not the viewport, so placing it in a narrow sidebar also switches it. The selection bar keeps the count and the deselect button on the first row, with the actions wrapping to the next row; on touch screens the row commands are always visible with a 48px touch target.',
  },
  'components/file-explorer/example-loading-rong-va-loi': {
    title: 'Loading, empty and error',
    description:
      'The "First-time error" folder rejects on the first call; clicking Retry (in the content or the icon on the tree) succeeds.',
  },
  'components/form-generic/example-builder-render': {
    description:
      'Save, draft and publish belong to the consumer; the builder only emits (schemaChange). The buttons below belong to the demo page.',
  },
  'components/highlight/example-du-lieu-chua-markup': {
    title: 'Data containing markup',
    description: 'Markup in the data is shown as plain text; the component does not use innerHTML.',
  },
  'components/highlight/example-tim-kiem-khong-dau': {
    title: 'Accent-insensitive search',
    description: "Type 'duc', 'ha noi' or 'NGUYEN'; results also match accented text.",
  },
  'components/history/example-lich-su-cap-nhat': { title: 'Update history', description: 'Short update history.' },
  'components/history/example-luong-phe-duyet': { title: 'Approval flow' },
  'components/history/example-timeline-rong': { title: 'Empty timeline' },
  'components/image-editor/example-anh-dai-dien-vuong-1-1': {
    title: 'Square 1:1 avatar',
    description:
      'The sample image is a PNG with a transparent area: choose JPEG to see the background color cell. Pick your own image with the button below — the image is read in the browser and is not sent anywhere.',
  },
  'components/image-editor/example-banner-16-9-va-resize-dau-ra': {
    title: '16:9 banner and output resize',
    description:
      'The source image is 3000 × 2000. The 16:9 crop area is scaled down to a width of 1600 px; type a different size in the Size section. The displayed file size is the real encoded result, not an estimate.',
  },
  'components/image-editor/example-loi-va-gioi-han': {
    title: 'Errors and limits',
    description:
      'Each button feeds the editor a failing source: a GIF (unsupported format), a 3000 × 2000 image exceeding 2 MP (blocked before decoding), a truncated PNG file. The editor reports a clear error and emits (failed).',
  },
  'components/image-editor/example-mo-trong-modal': {
    title: 'Open in a modal',
    description:
      'The Edit button simulates a consumer loading an authenticated image into a Blob (400 ms) before opening the modal. The Cancel/Apply buttons are in the modal footer (owned by the consumer), and Apply calls getResult(). The editor sits inside @defer; Cancel does not change the image on the card.',
  },
  'components/image-editor/example-mo-tu-file-explorer': {
    title: 'Open from File Explorer',
    description:
      'Open an image in the explorer, then click Edit. The result is saved as a new file (name with the -da-sua suffix) and explorer.reload() shows that file; the original image is left untouched. sd-file-explorer does not import the editor.',
  },
  'components/image-editor/example-mo-tu-upload-file-anh-minh-chung': {
    title: 'Open from Upload File (evidence image)',
    description:
      'The captured receipt is sideways: click Edit image, rotate right, crop, then Apply. The consumer uploads the new version to the storage (new key) and replaces the key in the sd-upload-file model; the original is not overwritten. sd-upload-file does not import the editor — only this page wires the two components together.',
  },
  'components/import-excel/example-import-nhan-vien': { title: 'Import employees' },
  'components/inform/example-an-icon': { title: 'Hide icon' },
  'components/inform/example-bang-mau': { title: 'Color palette' },
  'components/inform/example-chi-co-tieu-de': {
    title: 'Title only',
    description: 'The title stays vertically centered with the icon even when there is no description or an extra action.',
  },
  'components/inform/example-dong-duoc-action': { title: 'Dismissible + action' },
  'components/inform/example-icon-shape': {
    description:
      'Defaults to square with an 8px radius (token --sd-icon-shape-radius). circle keeps the old round style; none removes the background but keeps the cell size.',
  },
  'components/inform/example-noi-dung-tuy-bien': {
    title: 'Custom content',
    description: 'The projected content replaces the default title, description and action; the icon and close button are kept.',
  },
  'components/inform/example-tip-bang-mau': {
    title: 'Tip color palette',
    description: 'All tips use the note role, including the warning and error colors.',
  },
  'components/inform/example-tip-co-tieu-de': { title: 'Tip with title' },
  'components/inform/example-tip-mot-dong': { title: 'Single-line tip' },
  'components/inform/example-tip-noi-dung-phong-phu': {
    title: 'Tip with rich content',
    description: 'Bold text, inline code, links and Angular bindings stay in the same text flow.',
  },
  'components/inform/example-tip-trong-form-va-bang': { title: 'Tip in form and table' },
  'components/job-progress/example-details-va-error': { title: 'Details and error' },
  'components/mini-editor/example-bieu-mau': { title: 'Form' },
  'components/mini-editor/example-dinh-dang-dau-ra-html': { title: 'HTML output format' },
  'components/mini-editor/example-dinh-dang-dau-ra-markdown': { title: 'Markdown output format' },
  'components/operator/example-chi-xem': {
    title: 'Read-only',
    description:
      'A glyph with a name and tooltip that opens no menu and does not receive Tab, meant for completed condition chips (query-bar). The color follows the chip that contains it. disabled wins over readonly.',
  },
  'components/operator/example-hien-ma-va-du-17-toan-tu': {
    title: 'Show code and all 17 operators',
    description:
      'The operator code sits on the same line as the label, for technical screens that need to know the value sent to the API. Lists with more than 4 items have dividers between families (comparison, text, list, range, empty); the order is kept exactly as passed in.',
  },
  'components/operator/example-kich-thuoc': {
    title: 'Sizes',
    description:
      'md: 28px chip (default). sm: 24px chip for table filters. xs: 14px glyph with a 24px hit area, used inside chips. Column 2 is active (the condition has a value), column 3 has no operator selected.',
  },
  'components/operator/example-toan-tu-chuoi': { title: 'String operators' },
  'components/operator/example-toan-tu-ngay': { title: 'Date operators' },
  'components/operator/example-toan-tu-so': { title: 'Number operators' },
  'components/operator/example-trong-control': {
    description:
      'sd-input, sd-input-number, sd-select, sd-date and sd-date-range accept [operators] / [(operator)] and render the operator as a prefix chip inside the field. Tab onto the chip before the input; Enter, Space or Alt+↓ opens the menu; after choosing, focus returns to the input.',
  },
  'components/operator/example-vo-hieu-hoa': { title: 'Disabled' },
  'components/org-chart/example-card-mac-dinh': { title: 'Default card' },
  'components/org-chart/example-custom-bang-directive': { title: 'Customization with a directive' },
  'components/org-chart/example-custom-bang-templateref-input': { title: 'Customization with a TemplateRef input' },
  'components/org-chart/example-node-co-mau': {
    title: 'Colored nodes',
    description: 'Each item passes its own color; nodes without an image and description automatically switch to a compact card.',
  },
  'components/page-list/example-danh-sach-vua-khit-khung': {
    title: 'List that fits the frame',
    description: 'The frame is 420px tall: the table fills the remaining space, only the data area scrolls, and the footer stays fixed.',
  },
  'components/page-list/example-man-song-toan-trang': {
    title: 'Live full-page screen',
    description:
      'Opens the orders screen of @sdcorejs/angular/modules/pattern; the configuration changes via ?cfg= or the Display options drawer (tabs, score card, external filter, multi-select, autoCompact, how details open).',
  },
  'components/page/example-be-rong-cot-noi-dung': { title: 'Content column width' },
  'components/page/example-header-co-nut-quay-lai-va-badge': { title: 'Header with back button and badge' },
  'components/page/example-man-cu-chi-dung-title-va-headerright': {
    title: 'Legacy screen using only title and headerRight',
    description: 'Without using any new input or slot, the header and body stay the same as before; the title still wraps.',
  },
  'components/page/example-subheader-cot-phu-va-footer': { title: 'Subheader, side column and footer' },
  'components/page/example-trang-chi-tiet-co-cot-phu-o-dau': { title: 'Detail page with a leading side column' },
  'components/page/example-trang-form-co-muc-luc': {
    title: 'Form page with a table of contents',
    description:
      'The table of contents lists the top-level sd-section elements that have a title; it is hidden when the viewport is below 1200px.',
  },
  'components/preview/example-anh-don': { title: 'Single image' },
  'components/preview/example-nguon-video-bi-chan': {
    title: 'Blocked video source',
    description: 'A URL that does not pass sdIsSafeResourceUrl is not bound to the player; an error message is shown instead.',
  },
  'components/preview/example-pdf-nang-cao': { title: 'Advanced PDF' },
  'components/preview/example-thu-vien-anh': { title: 'Image gallery' },
  'components/preview/example-xem-video': {
    description: 'Native player: with controls, no autoplay, and only metadata is loaded when opened.',
  },
  'components/query-bar/example-che-do-inline': {
    title: 'Inline mode',
    description:
      "Chip values: click a value to edit it inline (the panel opens right away, with no separate input box); click outside to return to text. Uses sd-select [viewed]='inline'.",
  },
  'components/query-bar/example-che-do-popover': { title: 'Popover mode' },
  'components/query-builder/example-bat-dau-trong-dung-tu-dau': {
    title: 'Start empty (build from scratch)',
    description:
      'The initial value is null. Click + → Condition to add the first rule; select a field to show the operator and value editor. The JSON panel updates in real time.',
  },
  'components/query-builder/example-moi-loai-truong-value-editor-theo-type': {
    title: 'All field types (value editor by type)',
    description:
      'Each type renders its own value editor: string → text box, number → number box (+ BETWEEN with two ends), boolean → Yes/No select, values → multi-select, date → date picker, datetime → datetime picker.',
  },
  'components/query-builder/example-ngay-tuong-doi': {
    title: 'Relative dates',
    description:
      "For date/datetime with a single-value operator (=, !=, >, <), choose 'Today' or 'Relative' (N days/weeks/months ago·ahead). It emits Filter.data in the form { rel, unit, amount, direction }. BETWEEN has no relative mode.",
  },
  'components/query-builder/example-nhom-and-or-long-nhau': {
    title: 'Nested AND/OR groups',
    description:
      'Click + → Group to create a child group. A child group with multiple conditions is wrapped in parentheses ( … ) in View mode.',
  },
  'components/query-builder/example-so-sanh-giua-cac-truong': {
    title: 'Comparing between fields',
    description:
      "Enable comparisonMode='value-or-field' so each rule can either take a value or compare against another field of the same type. The right-hand field is emitted as a Filter in the form { dataType: 'field', data: '<fieldKey>' }.",
  },
  'components/quick-action/example-bulk-action-nhieu-dong': { title: 'Bulk action - multiple rows' },
  'components/quick-action/example-thong-bao-trang-thai': { title: 'Status notifications' },
  'components/section/example-icon-shape': {
    description:
      'Default is a square with 8px radius (token --sd-icon-shape-radius). circle keeps the old round style; none removes the background and keeps the box size.',
  },
  'components/splitter/example-doc-3-panel-px-co-dinh': { title: 'Vertical 3 panels (fixed px)' },
  'components/splitter/example-panel-gap-voi-api-ngoai': { title: 'Collapsible panel with external API' },
  'components/stepper/example-bang-mau': {
    title: 'Color palette',
    description: 'primary / success / warning / error: drives the indicator and connector colors.',
  },
  'components/stepper/example-co-ban-horizontal': { title: 'Basic: horizontal' },
  'components/stepper/example-dieu-khien-tu-ngoai': { title: 'Controlled from outside' },
  'components/stepper/example-editable-false': {
    description: 'Step 1 sets editable=false. After moving past step 2, clicking step 1 will not go back.',
  },
  'components/stepper/example-error-state': { description: "A step can override state='error' to show a red X icon and the errorMessage." },
  'components/stepper/example-huong-doc': { title: 'Vertical orientation' },
  'components/stepper/example-linear-wizard': {
    description: 'Linear=true: you can only move on once the previous step is valid. Each sd-step binds stepControl to a FormGroup.',
  },
  'components/stepper/example-optional-step': {
    description: 'Step 2 is marked optional; the user can go to step 3 without filling it in.',
  },
  'components/stepper/example-vi-tri-nhan': {
    title: 'Label position',
    description:
      'The current step uses a fill background and a contrasting icon; completed steps use a light background. The connector lines up with the icon center when the label is below.',
  },
  'components/tab-router/example-thu-truc-tiep': {
    title: 'Try it live',
    description:
      'Opens a screen with a real sd-tab-router-outlet: with one tab the bar is hidden, and opening more tabs shows it; try 16 tabs and hover a truncated name to see the tooltip.',
  },
  'components/tab-router/example-tich-hop-app-shell': { title: 'App shell integration' },
  'components/tab/example-bang-mau-color': {
    title: 'Color palette',
    description: 'Changes the indicator and badge color using the Core palette: primary / secondary / info / success / warning / error.',
  },
  'components/tab/example-can-tab-sang-phai': {
    title: 'Align tabs to the right',
    description:
      'The default stretchTabs=true (Material default) stretches the tabs to full width. Turn off stretch and set alignTabs to push them to one side.',
  },
  'components/tab/example-chuyen-cach-xem-du-lieu': {
    title: 'Switch data view',
    description: 'A segmented control for two ways of viewing. The data source stays the same when switching.',
  },
  'components/tab/example-dieu-khien-tu-ngoai': { title: 'Controlled from outside' },
  'components/tab/example-form-chia-nhom': {
    title: 'Form split into groups',
    description: 'Data is kept when switching tabs; on save, it jumps to the group with errors and shows a Notify message.',
  },
  'components/tab/example-mo-nhieu-ho-so': {
    title: 'Open multiple records',
    description: 'Tabs are closable; rename one and then close it to try the unsaved-data confirmation.',
  },
  'components/tab/example-nhieu-nhom-noi-dung': {
    title: 'Many content groups',
    description: 'The tab bar scrolls automatically when space runs out; it does not force all labels into a single row.',
  },
  'components/tab/example-nhom-chua-kha-dung': {
    title: 'Unavailable group',
    description: 'Not just disabled: it explains the condition and provides an action that satisfies it.',
  },
  'components/tab/example-noi-dung-hon-hop': {
    title: 'Mixed content',
    description: 'Pick the structure that fits each tab instead of forcing all content into a table.',
  },
  'components/tab/example-phan-nhom-co-so-luong': {
    title: 'Groups with counts',
    description: 'Badges use the real count of each group; click complete to see the counts change.',
  },
  'components/tab/example-tab-chua-bang': {
    title: 'Tab containing a table',
    description: 'Uses quickSearch from the Core Table option; the table manages pages and row counts on its own.',
  },
  'components/tab/example-tab-co-ban': {
    title: 'Basic tabs',
    description: "The white background applies only to this group's header; the body keeps the theme background and has its own padding.",
  },
  'components/tab/example-tab-co-icon-badge-disabled': { title: 'Tabs with icon / badge / disabled' },
  'components/tab/example-tab-dong-duoc': { title: 'Closable tabs' },
  'components/tab/example-tab-long-tab': {
    title: 'Nested tabs',
    description:
      'With nested tabs, set different variants so the eye can clearly tell outer from inner. Keep the outer at the default line; switch the inner to pills or segmented.',
  },
  'components/tab/example-tai-rong-loi': {
    title: 'Loading / Empty / Error',
    description: 'Loading takes 1-2 seconds; the error state has a retry; the empty state has an explanation.',
  },
  'components/tab/example-variant-pills': {
    description:
      'Pills with a light background and text/icon in the main color. Click the active tab again or navigate by keyboard to check that the text color stays stable.',
  },
  'components/tab/example-variant-segmented': {
    description: 'A rounded container with a single border, iOS-style. Suitable for small toggles in a toolbar.',
  },
  'components/table/example-action-da-chon-co-menu-con': {
    title: 'Selected action with a submenu',
    description:
      'One row is preselected. Open Process selected in the bar below the table to try the submenu; select more rows to check the list passed to the callback.',
  },
  'components/table/example-cell-template-tuy-chinh': { title: 'Custom cell template' },
  'components/table/example-chon-mot-dong': { title: 'Single row selection' },
  'components/table/example-column-aggregate': {
    description:
      'Standalone totals above the footer: local page/filtered, COUNT, grouped headers, row groups, tree and lazy children. Server filtered is not supported; compute only the page, or provide the totals business logic yourself outside the table.',
  },
  'components/table/example-custom-th-td': {
    description: 'Uses sdTableTitleDef and sdTableCellDef. Keeps the identifying hyperlink and right-aligns numeric values.',
  },
  'components/table/example-dong-mo-rong': { title: 'Expandable rows' },
  'components/table/example-external-filters': {
    description:
      'Compact filters with spacing from the section edge. Enter the conditions then press Search; the clear and settings buttons sit in the header. The table has slightly rounded outer corners and still scrolls with a sticky header.',
  },
  'components/table/example-filter-onchange': {
    description:
      'The callback runs only when the filter value has been committed and differs from the previous one; text/number inputs commit on Enter or blur.',
  },
  'components/table/example-footer-tong-hop': { title: 'Summary footer' },
  'components/table/example-giu-selection-xuyen-trang': { title: 'Keep selection across pages' },
  'components/table/example-hanh-dong-o-header-cot-command': {
    title: 'Action in the command column header',
    description:
      "The header cell of the command column is normally empty. Project content into it to place a table-level action (here, adding a row) right above each row's edit/delete group, without needing a separate strip below the table.",
  },
  'components/table/example-inline-filter-operator': {
    description:
      'Uses column.filter.operator with enable and list; the server type sends columnOperator to the demo data adapter to filter before pagination. Customer: contains, equals, starts with. Value: equals, greater than, less than and the inclusive comparisons. Type then press Enter to apply; multiple columns combine with AND.',
  },
  'components/table/example-keo-tha-doi-thu-tu': { title: 'Drag and drop reordering' },
  'components/table/example-khong-co-filler': { title: 'No filler' },
  'components/table/example-lenh-dong-co-menu-con': {
    title: 'Row command with a submenu',
    description:
      'Command and action children use a compact white-background menu. Select rows to try the group action; child commands still support icon, title, color, disabled, hidden and click per row.',
  },
  'components/table/example-lenh-dong-phai': {
    title: 'Right-side row commands',
    description: 'SP-003 shows the Edit and Delete commands disabled: faded icons, while the View command remains usable.',
  },
  'components/table/example-loading-empty-error': {
    description:
      'Uses the SdTable loading flow: skeleton rows while there are no rows yet, a progress bar over dimmed rows when a reload takes longer than 300 ms, empty/no-results from the returned result, and an error with a retry that keeps the query. Customize the content with sdDataStateTemplate and SdDataState.',
  },
  'components/table/example-loc-bang-query-bar': {
    title: 'Filtering with the query bar',
    description:
      'Quick search, external filters and column filters share one chip bar; chips are edited right on the bar (the inline editor is the default), and Editor popover switches to popovers. The warehouse, priority, status and created-date filters are pinned; other fields are under +. The funnel icon beside a column title opens the chip of that column. Settings › Filters lets users pick the filter panel or the filter bar and which filters show or are pinned; the choice is stored by key, and Restore defaults clears it. Switch the layout to compare pagingReq: the same edits send the same payload. Values are cached and survive a reload. On mobile the table keeps the default layout.',
  },
  'components/table/example-mobile-chon-du-lieu': {
    title: 'Mobile data selection',
    description: 'Three independent tables: single selection with a default; multiple selection without bulk actions; row commands only.',
  },
  'components/table/example-mobile-qua-nhieu-trang': {
    title: 'Mobile across multiple pages',
    description:
      'The mock API returns new objects on every request. Select on page 1 then go to page 2; the summary and callback keep the entire selection.',
  },
  'components/table/example-mobile-trong-hop-thoai': {
    title: 'Mobile in a dialog',
    description: "The cards and action bar sit inside each table's scroll area. Closing the dialog or drawer cleans up the child overlays.",
  },
  'components/table/example-nhap-lieu-inline-bao-loi': {
    title: 'Inline entry · Error reporting',
    description:
      'Saving invalid data: SdInform warning and error cells with a tooltip. Duplicate product: the sample backend returns an error; the data is kept for correction.',
  },
  'components/table/example-nhap-lieu-inline-them-xoa': {
    title: 'Inline entry · Add / delete',
    description:
      'The custom TD uses SdInput/SdInputNumber size sm with hideInlineError; add/delete rows, the total updates with the entered data, and Save applies to everything. The add-row button in sdTableCommandHeaderDef is an icon-only add button with a tooltip, primary light, size sm; delete each row with the delete command.',
  },
  'components/table/example-nhom-don-hang-theo-khach': { title: 'Group orders by customer' },
  'components/table/example-nhom-dong': { title: 'Row grouping' },
  'components/table/example-quick-search': {
    description:
      'Selecting a tenant applies immediately; type a keyword then press Enter. Name/email use contains search, code/phone use exact search; email does not need a column. Change the tenant on screen A then switch to screen B to see the selection kept through a shared signal. The checkbox on the right is UI inserted by the consumer.',
  },
  'components/table/example-server-khong-biet-tong': {
    title: 'Server without a total',
    description:
      "The offset/limit API returns no total: the loader fetches pageSize + 1 rows to know whether a next page exists. The range counts only loaded rows, and there is no Last page button. Turn on 'Error on next load' then click Next page to see the error and Retry; use 'Remove some source data' while on page 2 to see an empty page.",
  },
  'components/table/example-the-mobile-va-thao-tac': {
    title: 'Mobile cards and actions',
    description:
      'The Add button is centered above the cards. The card margins on both sides are fixed, and the small checkbox overlaps the right corner of the border. The selection bar leaves 16px at both ends; many actions wrap evenly onto new rows. Tapping a card opens the row actions sheet; the Tools button in the footer opens the sheet for reload, export, filter and sort.',
  },
  'components/table/example-thiet-lap-cot': {
    title: 'Column settings',
    description:
      'The Settings button in the footer opens a modal with two tabs. Columns: find a column (tables with more than 8 columns), press a row to edit its title and width and to switch fixed and shortened on or off; drag ⠿, or pick ⠿ and use ↑ ↓, to reorder. Filters: pick the filter panel or the filter bar. Apply stores both tabs. The button carries a dot while the table uses its own settings; Restore defaults turns it off. The customer column has minWidth/maxWidth, and the note column is 20% wide.',
  },
  'components/table/example-toi-gian': { title: 'Minimal' },
  'components/table/example-tra-cuu-co-ban': {
    title: 'Basic lookup',
    description: 'Identifier with a link; numbers right-aligned; pagination after filter/sort.',
  },
  'components/table/example-tree-khong-cot-stt-chevron-nam-trong-cot-dau-don-vi': {
    title: 'Tree WITHOUT an index column — chevron inside the first column (Unit)',
    description: 'With index off, the expand icon and indent are embedded directly in the first data column (file explorer style).',
  },
  'components/table/example-tree-lazy-nap-con-khi-bung-co-loading': {
    title: 'Lazy tree — load children on expand (with loading)',
    description:
      "loadType 'lazy': expanding a row calls onExpandChildren (simulated 800ms delay) → a loading spinner shows in the chevron cell until loading finishes. hasChildren decides which rows get an expand icon (Group/Team are leaves → no icon).",
  },
  'components/table/example-tree-rows-search-o-cap-con-go-ten-don-vi-con-de-loc': {
    title: 'Tree rows + search at child level (type a child unit name to filter)',
    description:
      "Search on a 'local' table + 'static' tree also filters child levels: keeps the parent branches of matching nodes, prunes non-matching siblings, and auto-expands to the matching node.",
  },
  'components/table/example-tree-selector-command-chinh-indent': {
    title: 'Tree + selector + command + indent adjustment',
    description: 'A combined demo of tree rows with a checkbox selector, bulk actions, per-row commands and direct indent changes.',
  },
  'components/tree/example-custom-item-template': {
    description: 'sdTreeItemDef receives the context item, treeItem, level, selected, isLeaf, toggle, select.',
  },
  'components/tree/example-filter-tieng-viet-khong-dau': {
    title: 'Accent-insensitive Vietnamese filter',
    description: "The filter only searches loaded items. For example, type 'ke toan', 'cong no', 'nhan su'.",
  },
  'components/tree/example-lazy-tree': {
    description:
      'Click to expand a node to simulate loading its children. After the first time, children are cached internally in the component.',
  },
  'components/tree/example-selection-va-command': {
    title: 'Selection and command',
    description:
      'A checkbox selects multiple rows. The command sits at the end of the row; the three-dot button appears only when hovering the row.',
  },
  'components/tree/example-static-tree': {
    description:
      'Static tree takes SdTreeItemStatic items that already wrap id, label, data and children. Branches use the default folder icon; leaves show no icon unless one is declared.',
  },
  'components/upload-file/example-anh-va-tai-lieu-xem-truoc': {
    title: 'Images and documents, preview',
    description:
      'Click an image or a document row to open a popup at exactly that file (←/→, +/−/0, Esc). Drop files from your computer onto the Upload field; files with the wrong format or over 5 MB stay in the list with the reason. Call upload() to see the uploading row; turn on error simulation to see the error row and the Retry button.',
  },
  'components/upload-file/example-inline-trong-bang': {
    title: 'Inline in a table',
    description: 'A single 32px row: the upload cell, images, document chips and +N for the rest. No label, description or counter.',
  },
  'components/upload-file/example-tai-nhieu-anh-co-gioi-han': { title: 'Upload multiple images with a limit' },
  'components/upload-file/example-tai-tai-lieu-bao-loi-required': {
    title: 'Upload a document + required error',
    description:
      "Click Validate (simulates submit → markAllAsTouched) with no file attached: the red error message 'Please upload a file' appears right below the upload area. Attach a file and validate again → the error disappears.",
  },
  'components/upload-file/example-vo-hieu-hoa-chi-doc': { title: 'Disabled (read-only)' },
  'components/view/example-gia-tri-co-sieu-lien-ket': { title: 'Value with hyperlink' },
  'components/view/example-nhan-va-gia-tri-co-ban': { title: 'Basic label and value' },
  'components/view/example-template-tuy-chinh-gia-tri': { title: 'Custom value template' },
  'components/window/example-chi-tiet-va-thao-tac': { title: 'Details and actions' },
  'components/window/example-contract-dong': { title: 'Closing contract' },
  'components/window/example-hai-cua-so-cung-mo': { title: 'Two windows open together' },
  'components/window/example-khong-co-footer': { title: 'No footer' },
  'directives/desktop/example-cap-doi-voi-sdmobile': {
    title: 'Paired with sdMobile',
    description:
      'The two directives are mutually exclusive, so placing them side by side is a way to branch markup by device without a manual *ngIf.',
  },
  'directives/desktop/example-chi-render-tren-desktop': {
    title: 'Render on desktop only',
    description: 'The block below exists in the DOM only when BrowserUtilities.isMobile() returns false — it is not hidden with CSS.',
  },
  'directives/hover-copy/example-nut-sao-chep-hien-khi-hover': {
    title: 'Copy button shown on hover',
    description:
      'Hover over the box below and click the button: the value goes to the clipboard and the tooltip changes to "Copied" for 1 second.',
  },
  'directives/hover-copy/example-tat-nut-sao-chep': {
    title: 'Disable the copy button',
    description: 'When disabled, the button is REMOVED from the DOM rather than just hidden with opacity, so there is no way to click it.',
  },
  'directives/href/example-link-ngoai-mo-tab-moi-an-toan': {
    title: 'External link opening safely in a new tab',
    description:
      'Only a url that parses to the http:/https: scheme is treated as an external link, and it always opens with noopener,noreferrer to prevent reverse tabnabbing.',
  },
  'directives/href/example-link-noi-bo-di-qua-router': {
    title: 'Internal link through the Router',
    description:
      'A string that is not http/https is split into path + query and passed to Router.navigate — clicking does not reload the page.',
  },
  'directives/mobile/example-cap-doi-voi-sddesktop': {
    title: 'Paired with sdDesktop',
    description: 'Exactly one of the two branches exists in the DOM, so there is no render cost for the other branch.',
  },
  'directives/mobile/example-chi-render-tren-mobile': {
    title: 'Render on mobile only',
    description:
      'Open DevTools in device mode and reload the page to see this block appear; the directive reads the user agent at initialization and does not react to resize.',
  },
  'directives/scroll/example-thanh-cuon-ngang-chi-hien-khi-hover': {
    title: 'Horizontal scrollbar shown only on hover',
    description:
      'Hover over the frame to see the horizontal scrollbar appear; move the mouse out and overflow-x goes back to hidden. The directive also emits scrollTop() to scroll the frame back to the top.',
  },
  'directives/tooltip/example-noi-dung-dang-template': {
    title: 'Template content',
    description: 'Pass a TemplateRef so the tooltip carries real markup (a list, labels, links) instead of a single line of text.',
  },
  'directives/tooltip/example-tooltip-van-ban': {
    title: 'Text tooltip',
    description: 'Hover the button and the tooltip appears below — the default position is bottom.',
  },
  'directives/tooltip/example-vi-tri-mau-va-do-tre': {
    title: 'Position, color and delay',
    description: 'Delay is in milliseconds before the overlay opens; the color is applied directly to the tooltip box background.',
  },
  'forms/autocomplete/example-cac-trang-thai-bao-loi': {
    title: 'Error states',
    description:
      "Click Show errors to mark as touched. The [validator] field forbids selecting 'United States' — select it to see the message (this is a fixed bug: an async [validator] previously could not show its message). Reset re-seeds the sample values so the demo is repeatable.",
  },
  'forms/autocomplete/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Click to open the type/filter panel; the text is kept until you select. Hover shows × to clear.',
  },
  'forms/autocomplete/example-co-ban': { title: 'Basic', description: 'Type a few characters to filter the list.' },
  'forms/autocomplete/example-cuon-ao': {
    title: 'Virtual scroll',
    description:
      '10,000 locations. The panel only renders the visible rows and the list is not cut off by the limit; the up/down arrows walk the whole list (wrapping at both ends), Enter to select. Off by default.',
  },
  'forms/autocomplete/example-them-moi': { title: 'Add new', description: 'Allows adding a value that is not in the list.' },
  'forms/autocomplete/example-trang-thai': { title: 'States', description: 'Locks interaction.' },
  'forms/autocomplete/example-validator': { description: 'Leave it empty and click Check to see the inline error.' },
  'forms/checkbox/example-bao-loi-inlineerror': {
    title: 'Error reporting (inlineError)',
    description:
      'Pass inlineError and click Show error (markAsTouched) → a red message appears below the checkbox. Click Reset to hide it again.',
  },
  'forms/checkbox/example-che-do-xem': {
    title: 'View mode',
    description: "viewed=true shows Yes/No text; 'inline' is still clickable, while disabled+inline is a static view.",
  },
  'forms/checkbox/example-co-ban': { title: 'Basic', description: 'Bind [(model)] to a boolean and show the value below.' },
  'forms/checkbox/example-kich-thuoc': {
    title: 'Sizes',
    description: 'Same text size; the checkbox and the label spacing change with size. md is the default.',
  },
  'forms/checkbox/example-mau-sac': { title: 'Colors', description: 'The color property changes the accent.' },
  'forms/checkbox/example-nhom-tuy-chon': { title: 'Option group', description: 'Each checkbox binds to its own independent variable.' },
  'forms/checkbox/example-trang-thai': { title: 'States', description: 'Two locked states.' },
  'forms/chip-calendar/example-bat-buoc-so-toi-thieu': {
    title: 'Required and minimum count',
    description: 'At least 3 days are required. The error shows when the calendar closes or when you click Validate.',
  },
  'forms/chip-calendar/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'The calendar chip is still editable, but when disabled it falls back to a static view (viewed=true).',
  },
  'forms/chip-calendar/example-gioi-han-ngay-va-so-luong': {
    title: 'Limit days and count',
    description: 'Only working days from today can be chosen, up to 3 days. Once 3 days are selected, the remaining cells are locked.',
  },
  'forms/chip-calendar/example-gon-trong-bo-loc-bang': {
    title: 'Compact in a table filter',
    description: 'Only the first 2 chips are shown, the rest are merged into “+N”; opening the calendar shows them all.',
  },
  'forms/chip-calendar/example-khoa-ngay-da-qua': {
    title: 'Lock past days',
    description: 'Past days show a lock instead of ✕; Backspace, clicking again on the calendar and Clear all all keep them.',
  },
  'forms/chip-calendar/example-kich-thuoc': {
    title: 'Sizes',
    description: 'Single-line field of 32 / 40 / 48px, chips of 20 / 24 / 28px.',
  },
  'forms/chip-calendar/example-kieu-model-va-transform': {
    title: 'Model type and transform',
    description:
      'The model accepts Date, timestamp, ISO string and yyyy/MM/dd; after the first interaction, the model is a string[] according to the transform.',
  },
  'forms/chip-calendar/example-lien-ket-hai-chieu': { title: 'Two-way binding', description: 'Open the calendar and pick multiple days.' },
  'forms/chip-calendar/example-vo-hieu-hoa': {
    title: 'Disabled',
    description: 'Interaction is locked; only the selected chips are displayed.',
  },
  'forms/chip/example-bat-buoc-so-toi-thieu': {
    title: 'Required and minimum count',
    description:
      'At least 3 chips are needed. The error appears only after the field is touched or Submit is clicked; the field below hides the error in an icon.',
  },
  'forms/chip/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'The chip strip is still editable, but when disabled it falls back to a static view (viewed=true).',
  },
  'forms/chip/example-chip-khoa': {
    title: 'Locked chip',
    description:
      'The predicate applies to the ✕ button, Backspace, Delete and the clear-all button: the “Admin” chip cannot be removed. It has a lighter background, a lock icon with the tooltip “Cannot be removed”, and screen readers read “Admin, Cannot be removed”.',
  },
  'forms/chip/example-gon-trong-o-bang': {
    title: 'Compact in a table cell',
    description:
      'When not focused, only 2 chips and “+N” are shown; click “+N” or focus the cell to see them all. Chips longer than 240px are truncated with a tooltip.',
  },
  'forms/chip/example-kich-thuoc': {
    title: 'Sizes',
    description:
      'Single-line field of 32 / 40 / 48px, with 20 / 24 / 28px chips centered inside, on the same scale as sd-chip-calendar. Use sm for tables / toolbars.',
  },
  'forms/chip/example-lien-ket-hai-chieu': { title: 'Two-way binding', description: 'Each chip is a string in the array.' },
  'forms/chip/example-nguoi-nhan-email': {
    title: 'Email recipients',
    description:
      'Type abc then Enter: an error is shown and the text stays in the input. Type AN@congty.vn: the existing chip flashes. Type then Tab out: it still becomes a chip. Paste “a@x.vn, b@x.vn; abc”: adds several chips at once. At 5 chips no more can be added. The chip toi@congty.vn cannot be removed.',
  },
  'forms/chip/example-vo-hieu-hoa': { title: 'Disabled', description: 'Chips cannot be added or removed.' },
  'forms/date-range/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Click the range to open the calendar picker; the text is kept until you select. Hover shows × to clear.',
  },
  'forms/date-range/example-chuan-hoa-gia-tri-dau-ra': {
    title: 'Normalize the output value',
    description:
      'Each end of the range is serialized SEPARATELY — the whole object is never merged into a single string. The input is still dd/MM/yyyy → dd/MM/yyyy; a range missing one end still keeps null at that end.',
  },
  'forms/date-range/example-co-ban': { title: 'Basic', description: 'Pick the start date and end date in the same popup.' },
  'forms/date-range/example-trang-thai': { title: 'States', description: 'A pre-set range.' },
  'forms/date-range/example-validator': { description: 'Leave it empty and click Check.' },
  'forms/date/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Click the date to open the calendar immediately; the text stays until a date is chosen. Hover shows × to clear.',
  },
  'forms/date/example-chuan-hoa-gia-tri-dau-ra': {
    title: 'Normalize the output value',
    description:
      'transform only changes the value going out (model, sdChange, the field in FormGroup); the input still shows dd/MM/yyyy. The date is serialized at LOCAL midnight, so the date part of the UTC string may be one day off from the displayed field. It is the same instant.',
  },
  'forms/date/example-co-ban': { title: 'Basic', description: 'Open the calendar and pick a date.' },
  'forms/date/example-kich-thuoc': { title: 'Sizes', description: 'Compact UI for toolbars.' },
  'forms/date/example-trang-thai': { title: 'States', description: 'Two locked states.' },
  'forms/date/example-validator': { description: 'Leave it empty and click Validate to show the inline error.' },
  'forms/datetime/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Click to open the datetime overlay; the text stays unchanged until a value is chosen. Hover shows × to clear.',
  },
  'forms/datetime/example-chuan-hoa-gia-tri-dau-ra': {
    title: 'Normalize the output value',
    description:
      'transform only changes the outgoing value; the input still follows showSeconds. Precision is still governed by showSeconds: off sets seconds to 0, on keeps seconds; milliseconds are always 0.',
  },
  'forms/datetime/example-co-ban': { title: 'Basic', description: 'Open the picker popup to choose a date and time.' },
  'forms/datetime/example-trang-thai': { title: 'States', description: 'Two non-editable states.' },
  'forms/datetime/example-validator': { description: 'Leave it empty and click Check to see the error.' },
  'forms/entity-picker/example-error-retry-va-create-action': {
    title: 'Error, retry and create action',
    description:
      'A failing provider shows a DataState with retry; create only emits an event and does not hard-code any business workflow.',
  },
  'forms/entity-picker/example-multi-select-va-hydration': {
    title: 'Multi-select and hydration',
    description: 'EMP-042 is not on the first page but is still hydrated and displayed by its stable key.',
  },
  'forms/entity-picker/example-row-va-detail-template': {
    title: 'Row and detail template',
    description: 'The template receives the hydrated entity; the table engine and selection engine are still owned by SdTable.',
  },
  'forms/entity-picker/example-server-single-select': {
    description:
      'Search, filter, sort and paging go through the provider; the stale request receives an AbortSignal when a new query starts.',
  },
  'forms/inline-text/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Same primitive — inline edit hugs its content and is no longer full-width.',
  },
  'forms/inline-text/example-formcontrol': {
    description: 'Binds an external FormControl (used in form controls mode). Disabled via the control.',
  },
  'forms/inline-text/example-kieu-vien': {
    title: 'Border style',
    description:
      'standalone draws its own hover background + focus ring; seamless is transparent so the parent pill (chip) draws the border/background.',
  },
  'forms/inline-text/example-lien-ket-hai-chieu': {
    title: 'Two-way binding',
    description:
      'The hover/click area follows the length of the value — it does not stretch to full width. Longer/shorter values give different widths.',
  },
  'forms/inline-text/example-trang-thai': {
    title: 'States',
    description: 'auto is inferred from focus + value; it can be overridden (e.g. error).',
  },
  'forms/input-color/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'Displayed like text; click to edit. When disabled it falls back to a static view (viewed=true).',
  },
  'forms/input-color/example-co-ban': {
    title: 'Basic',
    description: 'The value is bound two-way; picking or typing by hand both update the signal.',
  },
  'forms/input-color/example-hex-ngan-alpha': {
    title: 'Short hex / alpha',
    description: 'The picker automatically normalizes #RGB → #RRGGBB and drops alpha; the swatch keeps the real value.',
  },
  'forms/input-color/example-trang-thai': { title: 'States' },
  'forms/input-color/example-validator': {
    description: "Leaving it empty or typing a badly formatted string (e.g. 'red') shows an error.",
  },
  'forms/input-number/example-bao-loi-dang-icon-hideinlineerror': {
    title: 'Icon-style error (hideInlineError)',
    description:
      'hideInlineError=true: a red ⚠ icon at the right edge, with the message shown via a tooltip. Fields with a value also show the clear button (×) next to the icon (clear on the left, error icon at the right edge — not pushed inward).',
  },
  'forms/input-number/example-cac-trang-thai-bao-loi-inline': {
    title: 'Error states (inline)',
    description:
      'Each field demonstrates one kind of error. Click Show errors to mark touched. The [validator] field forbids the number 13 — type 13 to see the message (this is a fixed bug: previously [validator] could not show its message).',
  },
  'forms/input-number/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description:
      'A transparent number input that looks like text; focus to edit, and on blur it reformats (e.g. 12.345). Hover darkens the background.',
  },
  'forms/input-number/example-co-ban': { title: 'Basic', description: 'Formats automatically while typing.' },
  'forms/input-number/example-trang-thai': { title: 'States', description: 'Three non-editable states.' },
  'forms/input-number/example-validator': { description: 'min=10, max=100. Click Validate to show the errors.' },
  'forms/input/example-bao-loi-dang-icon-hideinlineerror': {
    title: 'Icon-style error (hideInlineError)',
    description:
      'When hideInlineError=true: there is no error line under the field — instead a red ⚠ icon sits at the right edge, and the message appears via a tooltip on hover. Fields that already have a value also show the clear button (×) next to the error icon (clear on the left, error icon at the right edge).',
  },
  'forms/input/example-cac-trang-thai-bao-loi-inline': {
    title: 'Error states (inline)',
    description:
      "Each field demonstrates one kind of error. Click Show errors to mark touched — the error appears under the field (red). The [validator] field forbids the word 'admin'; type admin to see the error.",
  },
  'forms/input/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'A transparent input that looks like text; click/focus and type directly (no panel). Hover darkens the background.',
  },
  'forms/input/example-co-ban': { title: 'Basic', description: 'Two-way binding with [(model)] and a shared FormGroup.' },
  'forms/input/example-input-mask-raw-model-display-value': {
    description: 'The screen displays spacing, but the model, sdChange and the FormGroup only receive the raw digit string.',
  },
  'forms/input/example-kich-thuoc': {
    title: 'Sizes',
    description: 'The label, tooltip and required mark share the same row at size sm, even when there is an error.',
  },
  'forms/input/example-trang-thai': { title: 'States', description: 'Three non-editable states.' },
  'forms/input/example-validator': { description: 'Click Validate to show the inline errors.' },
  'forms/radio/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description: 'The radio can still be selected; when disabled it shows static text (viewed=true).',
  },
  'forms/radio/example-hien-thi': { title: 'Display', description: "display='row' (default) and display='column' for long lists." },
  'forms/radio/example-trang-thai': { title: 'States', description: 'A default value is already set.' },
  'forms/radio/example-validator': { description: 'Select nothing and click Validate to show the error.' },
  'forms/select/example-api-footer-action': {
    description: 'Import SdSelectFooterActionDirective together with SdSelect when using it in a standalone component.',
  },
  'forms/select/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description:
      'Displayed as text; click to open the selection panel (no input box is shown). The text stays unchanged while the panel is open and only changes when a new value is selected.',
  },
  'forms/select/example-chon-nhieu-voi-dong-tat-ca': {
    title: 'Multiple selection with an All row',
    description:
      "The 'All' row sits in a sticky header below the search box (still visible while scrolling), and the end of the row has a selected/total counter, shown only when multiple is on and items is a static array. Ticking it selects all enabled items matching the current search (the disabled item 'Legal' is not touched); while searching, ticking ONLY adds the items matching the filter and keeps the previous selection. The checkbox has 3 states: checked / indeterminate / unchecked.",
  },
  'forms/select/example-co-ban': { title: 'Basic', description: 'Two-way binding, showing the selected value.' },
  'forms/select/example-cuon-ao': {
    title: 'Virtual scroll',
    description:
      "10,000 employees. The panel only renders the visible rows, even after ticking 'All', and the list is not truncated by limit. In the search box: arrows, PageUp/PageDown and Home/End go through the whole list, Enter to select. Off by default.",
  },
  'forms/select/example-footer-action-giong-dropdown-item': {
    title: 'Footer action that looks like a dropdown item',
    description:
      'A button is not required. You can use div role=button and add your own padding and hover style so the footer action looks like an option in the dropdown.',
  },
  'forms/select/example-footer-action-khi-khong-co-ket-qua': {
    title: 'Footer action when there are no results',
    description:
      'Type a department that is not in the list. When the search text is non-empty and the filtered list has 0 items, the footer shows an add-new button.',
  },
  'forms/select/example-kich-thuoc': { title: 'Sizes', description: 'Compact UI for tables / toolbars.' },
  'forms/select/example-nhieu-footer-action-va-thu-tu-khai-bao': {
    title: 'Multiple footer actions and declaration order',
    description:
      'Templates are rendered in the exact order they are declared in sd-select. Event bindings still run in the context of the parent component.',
  },
  'forms/select/example-snippet-mau': {
    title: 'Sample snippet',
    description: 'A minimal sample for the case of quickly adding an item when no result is found.',
  },
  'forms/select/example-trang-thai': { title: 'States', description: 'The value is already set.' },
  'forms/select/example-validator': { description: 'Click Check to show the error.' },
  'forms/switch/example-ben-trong-bang': {
    title: 'Inside a table',
    description: 'A switch inside sd-table automatically renders at size sm, even when the cell template does not pass size.',
  },
  'forms/switch/example-che-do-xem': {
    title: 'View mode',
    description: "viewed=true shows the text On/Off; 'inline' can still be toggled, while disabled+inline is a static view.",
  },
  'forms/switch/example-co-ban': { title: 'Basic', description: 'Two-way binding, with the state shown right next to it.' },
  'forms/switch/example-danh-sach-cau-hinh': { title: 'Settings list', description: 'Each switch controls an independent option.' },
  'forms/switch/example-kich-thuoc': {
    title: 'Sizes',
    description: 'Default is md. The tracks are 36×20px, 52×32px and 60×36px respectively.',
  },
  'forms/switch/example-mau-sac': { title: 'Colors', description: 'The color property changes the track accent.' },
  'forms/switch/example-trang-thai': { title: 'States', description: 'Two locked states.' },
  'forms/textarea/example-chinh-sua-noi-tuyen': {
    title: 'Inline editing',
    description:
      'Displays like borderless text — click/focus to edit in place. When disabled it falls back to a static view (viewed=true).',
  },
  'forms/textarea/example-co-ban': { title: 'Basic', description: 'Two-way binding with [(model)].' },
  'forms/textarea/example-trang-thai': { title: 'States', description: 'Two states that do not allow editing.' },
  'forms/textarea/example-validator': { description: 'Click Check to show the inline error.' },
  'forms/time-range/example-co-ban': { title: 'Basic', description: 'Two boxes emit one model { from, to } normalized to HH:mm.' },
  'forms/time-range/example-gioi-han-va-thu-tu': {
    title: 'Limits and order',
    description: 'Each end checks min/max/step; a start time after the end time produces a range error.',
  },
  'forms/time-range/example-khoang-mo': {
    title: 'Open range',
    description: 'Allows only a start or only an end bound when the field is not required.',
  },
  'forms/time-range/example-trang-thai': {
    title: 'States',
    description: 'Viewed displays a time-only model without constructing a Date in the public API.',
  },
  'forms/time/example-co-ban': {
    title: 'Basic',
    description: 'You can type 9:05 to get the normalized model 09:05, or open the time picker.',
  },
  'forms/time/example-gioi-han-va-buoc-phut': {
    title: 'Limits and minute step',
    description: 'Min/max are inclusive; the arrow keys and the picker both use a 15-minute step.',
  },
  'forms/time/example-trang-thai': { title: 'States', description: 'The same time-only model in the non-editable states.' },
  'forms/time/example-validation': {
    description:
      'Invalid text such as 25:10 is kept for correction, the control is invalid, and the previous valid model is not overwritten.',
  },
  'forms/tree-select/example-lazy-tree': {
    description: 'Children are only loaded when a branch is opened; errors are kept on the node and have their own retry.',
  },
  'forms/tree-select/example-multiple-cascade': {
    description:
      'Selecting a parent applies to loaded descendants; partial selection shows indeterminate, and a locked node is not interactive.',
  },
  'forms/tree-select/example-unloaded-key-va-viewed': {
    title: 'Unloaded key and viewed',
    description: 'Unloaded keys are not removed by filter/page/lazy state; viewed mode shows a stable fallback key.',
  },
  'guides/theme-tokens/example-bang-contrast': {
    title: 'Contrast table',
    description:
      'Measured in the browser for the default palette in light and dark mode, using the same pairs and thresholds as test:theme (that test also runs for the 9 named presets). This is a palette check and does not replace checking each component state.',
  },
  'guides/theme-tokens/example-palette-va-che-do-sang-toi': {
    title: 'Palette and light/dark mode',
    description:
      'The buttons below set data-sd-theme on the html element (the library does not write this attribute itself). Dark is only available for the default palette. The displayed values are read with readSdTokens().',
  },
  'guides/theme-tokens/example-preset-co-san': {
    title: 'Built-in presets',
    description:
      'Each card is a region built with exactly the include line written on the card, so the buttons, badges, checkboxes and links inside are real components under that preset. A preset only changes colors (text, spacing and corner radius stay the same); named presets only have a light version, and only default has dark. In an app, place the include line in html {} of styles.scss after Core (see STYLE-GUIDE §14.1).',
  },
  'guides/theme-tokens/example-ramp': {
    description:
      'Mixed at runtime with color-mix() from the base color (step 500), so changing --sd-primary changes the whole ramp. The ramp is absolute: 50 is always the lightest, even in dark mode.',
  },
  'guides/theme-tokens/example-semantic-va-scale': {
    title: 'Semantic and scale',
    description:
      'Components ask by role (error state text, text on a strong background) instead of a palette cell; scales are named by px value and are the same in light and dark.',
  },
  'modules/layout/example-sidebar-v3-collapsible': {
    description:
      "Click each menu group to collapse or expand its child items on desktop. Search still finds items in collapsed groups; collapsing the whole sidebar keeps each group's state.",
  },
  'pipes-utilities/empty/example-gia-tri-co-noi-dung-giu-nguyen': {
    title: 'Values with content are kept as is',
    description: 'The pipe returns the original value unchanged, without coercion or formatting; to normalize arrays, use sdView.',
  },
  'pipes-utilities/empty/example-gia-tri-rong-hien-thi-dau-gach': {
    title: 'Empty values show a dash',
    description:
      "Only exactly three cases, null, undefined and '', are replaced. The number 0 and the string '0' are NOT treated as empty.",
  },
  'pipes-utilities/format-date/example-dinh-dang-mac-dinh': {
    title: 'Default format',
    description: 'With no parameters the pipe uses dd/MM/yyyy, the standard date format of the forms in the pack.',
  },
  'pipes-utilities/format-date/example-dinh-dang-tuy-chinh': {
    title: 'Custom format',
    description: 'The first parameter is a token string passed straight to DateUtilities.toFormat.',
  },
  'pipes-utilities/format-date/example-gia-tri-khong-hop-le': {
    title: 'Invalid value',
    description: "A value that cannot be parsed returns null, so interpolation outputs an empty string instead of 'Invalid Date'.",
  },
  'pipes-utilities/format-datetime/example-chi-lay-phan-gio': {
    title: 'Time part only',
    description: 'Pass a shorter token when the column already shows the date elsewhere; the pipe does not force a full date + time.',
  },
  'pipes-utilities/format-datetime/example-dinh-dang-mac-dinh': {
    title: 'Default format',
    description: 'Use it for log and action-history columns — where seconds are needed to tell two consecutive records apart.',
  },
  'pipes-utilities/format-number/example-chuan-quoc-te': {
    title: 'International standard',
    description:
      'A comma separates thousands and a period separates decimals. This is also the default when the app has not configured format.number.',
  },
  'pipes-utilities/format-number/example-chuan-viet-nam': {
    title: 'Vietnamese standard',
    description:
      'Swaps the roles of the two separators. Set it once in SD_CORE_CONFIGURATION and every pipe and form field in the app follows, with no parameters to pass.',
  },
  'pipes-utilities/format-number/example-so-chu-so-thap-phan': {
    title: 'Number of decimal digits',
    description:
      'The first parameter is the number of digits after the decimal point (default 2). A non-numeric value returns an empty string.',
  },
  'pipes-utilities/safe-html/example-sanitize-mac-dinh': {
    title: 'Default sanitize',
    description:
      'script tags, on* attributes and javascript: URLs are removed; the remaining benign markup still renders. This is the branch used for all data coming from the server.',
  },
  'pipes-utilities/safe-html/example-tin-cay-co-chu-dich': {
    title: 'Deliberate trust',
    description:
      'The true argument calls bypassSecurityTrustHtml. Use it only for markup written by the app itself, for example an internal SVG sprite — never for user-entered data.',
  },
  'pipes-utilities/time-different/example-qua-nguong-thi-ve-ngay-tuyet-doi': {
    title: 'Past the threshold, fall back to an absolute date',
    description:
      'A value older than the threshold creates NO timer: the pipe returns of(...) immediately, so a long list does not spawn a lot of unnecessary intervals.',
  },
  'pipes-utilities/time-different/example-thoi-gian-tuong-doi': {
    title: 'Relative time',
    description:
      'The second parameter is the threshold: below it, the relative distance is shown and ticks every second; once the threshold is reached it falls back to format.',
  },
  'pipes-utilities/view/example-chuan-hoa-gia-tri-rong': {
    title: 'Normalizing empty values',
    description:
      'Compared with sdEmpty, sdView also catches NaN and empty arrays — the two values that most often slip through when rendering API data.',
  },
  'pipes-utilities/view/example-gop-mang-thanh-chuoi': {
    title: 'Joining an array into a string',
    description:
      'Each element is normalized recursively before joining, so an empty element inside the array also becomes a dash instead of disappearing.',
  },
  'services/confirm/example-chon-muc-do': { title: 'Choose a level', description: 'withRadio() – pick from a list of radios.' },
  'services/confirm/example-chon-ngay': { title: 'Choose a date', description: 'withDate() – pick a date, with min/max if needed.' },
  'services/confirm/example-chon-ngay-gio': { title: 'Choose a date and time', description: 'withDatetime() – pick a date and time.' },
  'services/confirm/example-chon-phong-ban': { title: 'Choose a department', description: 'withSelect() – pick one value with sd-select.' },
  'services/confirm/example-chon-radio-dang-doc': {
    title: 'Vertical radio choice',
    description: "withRadio(..., { display: 'column' }) – shows the radio list vertically.",
  },
  'services/confirm/example-icon-shape': {
    description:
      'The default is square with an 8px radius (token --sd-icon-shape-radius). circle keeps the old round style; none removes the background but keeps the cell size.',
  },
  'services/confirm/example-nhap-ly-do': {
    title: 'Enter a reason',
    description: 'withInput() – requires entering content before confirming.',
  },
  'services/confirm/example-nhat-ky-gan-nhat': { title: 'Latest log' },
  'services/confirm/example-xac-nhan-co-ban': {
    title: 'Basic confirmation',
    description: 'Without an icon, the default icon is used. Pass an icon to replace the symbol inside the same light background cell.',
  },
  'services/confirm/example-xac-nhan-xoa': {
    title: 'Delete confirmation',
    description: 'Customize the title, button labels and button color.',
  },
  'services/date-time/example-bang-va-bo-loc-server': {
    title: 'Table and server filter',
    description:
      'The sample row is the instant 1960-05-19T16:00:00Z. Pick a date range to see pagingReq.filters: a single day is [start of day, start of next day) in the time zone in use.',
  },
  'services/date-time/example-form-ngay-gio': {
    title: 'Date-time form',
    description:
      "With timeZone set, form.value keeps the model value: sd-date 'yyyy/MM/dd', sd-datetime 'yyyy/MM/dd HH:mm:ss', sd-date-range { from, to }; the ISOString transform computes the instant in that time zone.",
  },
  'services/date-time/example-mui-gio-dang-dung': {
    title: 'Time zone in use',
    description:
      "The showcase reads ?timeZone= once at startup. An invalid value (for example +07:00) is ignored and the page runs with 'local'.",
  },
  'services/excel/example-tai-template-trong': {
    title: 'Download empty template',
    description: 'generateTemplate() creates a sample file for users to fill in (columns with required flags and descriptions).',
  },
  'services/excel/example-xuat-file-csv': {
    title: 'Export .csv file',
    description: 'exportCSV() includes a UTF-8 BOM so Excel opens Vietnamese accents correctly.',
  },
  'services/excel/example-xuat-file-xlsx': {
    title: 'Export .xlsx file',
    description: "export({ columns, items, fileName }): the 'data' sheet has a header plus the data.",
  },
  'services/loading/example-bat-tat-thu-cong': {
    title: 'Manual start / stop',
    description: 'New code keeps the ref; stop(selector) still works for legacy call sites, in oldest-start-first order.',
  },
  'services/loading/example-loading-o-dich': {
    title: 'Target element loading',
    description: "start('#demo-target') returns an idempotent handle that owns exactly the matched host.",
  },
  'services/loading/example-loading-toan-trang': {
    title: 'Full-page loading',
    description: "run() always closes the loading ref in finally and preserves the task's result/error.",
  },
  'services/loading/example-nhieu-host-cung-selector-multi-tab': {
    title: 'Multiple hosts with the same selector (multi-tab)',
    description: "Two owners overlap on the same two hosts; closing the first owner does not remove the second owner's overlay.",
  },
  'services/notify/example-4-loai-toast': { title: '4 toast types', description: 'success / info / warning / error with short messages.' },
  'services/notify/example-don-dep': {
    title: 'Cleanup',
    description: "clearAll() clears everything; clearByType('error') clears by type.",
  },
  'services/notify/example-icon-shape': {
    description:
      'Default is square with an 8px radius (token --sd-icon-shape-radius). circle keeps the old round style; none removes the background and keeps the cell size.',
  },
  'services/notify/example-thoi-luong-tuy-chinh': {
    title: 'Custom duration',
    description: 'duration is in ms. Default is 3000ms for success/info and 5000ms for warning/error.',
  },
  'services/notify/example-toast-co-action': {
    title: 'Toast with action',
    description: 'actionLabel + onAction attach a button to the toast.',
  },
  'services/storage/example-gia-tri-dang-luu-cap-nhat-truc-tiep-qua-subject': { title: 'Stored values (live updates via subject)' },
  'services/storage/example-localstorage': { description: "Key 'demo:user-name'. It persists after closing and reopening the browser." },
  'services/storage/example-sessionstorage': { description: "Key 'demo:session-note'. It is lost when the tab is closed." },
  'services/task/example-cancel-va-retry': {
    title: 'Cancel and retry',
    description: 'A failed cancel keeps the business state unchanged; retry does not restart a healthy connection.',
  },
  'services/task/example-polling-va-terminal-teardown': {
    title: 'Polling and terminal teardown',
    description: 'The demo returns a terminal state on the first turn; the service does not schedule any further poll after succeeded.',
  },
  'services/task/example-shared-stable-id': {
    description: 'Two watchers with the same ID share state/transport; the entry is only removed after the last lease.',
  },
  'services/unsaved-changes/example-additive-close-hook': {
    description:
      'Attach the same closeGuard to [beforeClose] of SdModal, SdSideDrawer or SdTab; the component does not need to depend on the service directly.',
  },
  'services/unsaved-changes/example-async-confirmation-decisions': {
    description:
      'A custom adapter returns save/discard/cancel or a boolean. An exception/rejection always keeps the user on the current screen.',
  },
  'services/unsaved-changes/example-formgroup-adapter': {
    description:
      'The adapter keeps a snapshot, updates the baseline after a successful save, and unsubscribes automatically when the registration is destroyed.',
  },
  'services/unsaved-changes/example-multiple-scoped-watchers': {
    description: 'The same id can exist in different scopes; registering repeatedly in the same scope returns the same registration ref.',
  },
  'services/viewport/example-breakpoint-mac-dinh': {
    title: 'Default breakpoints',
    description: 'The breakpoints use min-width semantics; all of them can be overridden through SD_VIEWPORT_BREAKPOINTS.',
  },
  'services/viewport/example-signal-theo-breakpoint': {
    description: 'The consumer only reads the signal and does not register or clean up listeners itself.',
  },
  'services/viewport/example-trang-thai-truc-tiep': {
    title: 'Live state',
    description: 'Resize the window to watch the signals update from the same resize listener.',
  },
};

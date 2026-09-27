import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { readSdTokens, SdColorToken } from '@sdcorejs/angular/utilities/theme';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

type ThemeMode = 'light' | 'dark';

interface ContrastCell {
  readonly ratio: number;
  readonly pass: boolean;
}

interface ContrastRow {
  readonly foreground: SdColorToken;
  readonly background: SdColorToken;
  readonly min: number;
  readonly cells: readonly ContrastCell[];
}

const PALETTE: readonly SdColorToken[] = [
  'primary',
  'primary-light',
  'primary-dark',
  'primary-contrast',
  'secondary',
  'secondary-light',
  'secondary-dark',
  'secondary-contrast',
  'info',
  'info-light',
  'info-dark',
  'info-contrast',
  'success',
  'success-light',
  'success-dark',
  'success-contrast',
  'warning',
  'warning-light',
  'warning-dark',
  'warning-contrast',
  'error',
  'error-light',
  'error-dark',
  'error-contrast',
  'surface',
  'surface-muted',
  'text',
  'text-secondary',
  'text-muted',
  'border',
  'border-strong',
  'disabled-bg',
  'disabled-text',
];
const RAMP_FAMILIES = ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'] as const;
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const STATES = ['info', 'success', 'warning', 'error'] as const;

/** Same pairs and minimums as scripts/theme-contrast.test.mjs. */
const PAIRS: readonly (readonly [SdColorToken, SdColorToken, number])[] = [
  ['text', 'surface', 4.5],
  ['text', 'surface-muted', 4.5],
  ['text-secondary', 'surface', 4.5],
  ['text-secondary', 'surface-muted', 4.5],
  ['link', 'surface', 4.5],
  ['primary-contrast', 'primary', 4.5],
  ...STATES.map(state => [`status-${state}-fg`, `status-${state}-bg`, 4.5] as [SdColorToken, SdColorToken, number]),
  ['border-strong', 'surface', 3],
  ['border-strong', 'surface-muted', 3],
  ['focus-ring-color', 'surface', 3],
  ['focus-ring-color', 'surface-muted', 3],
];

/**
 * Scopes measured by the contrast table. Each probe carries `data-sd-theme`, whose blocks in sd-core.scss
 * re-declare the whole token set — so the table reads the real light and dark palettes of the page.
 */
const SCOPES = [
  { mode: 'light', label: 'default · light' },
  { mode: 'dark', label: 'default · dark' },
] as const;

@Component({
  selector: 'app-theme-tokens-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      #demoPage
      title="Theme & tokens"
      description="Các tầng token --sd-* (palette, ramp, semantic, scale, component), chế độ sáng/tối và bảng contrast đo trực tiếp trên trình duyệt.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-palette-va-che-do-sang-toi') {
        <demo-section
          heading="Palette và chế độ sáng tối"
          [props]="[{ name: 'data-sd-theme', value: 'light | dark' }]"
          note="Nút dưới đây đặt data-sd-theme trên thẻ html (thư viện không tự ghi thuộc tính này). Dark chỉ có cho palette default. Giá trị hiển thị đọc bằng readSdTokens().">
          <div class="tt-column">
            <div class="tt-toolbar" role="group" aria-label="Chế độ màu">
              <button type="button" class="tt-toggle" [attr.aria-pressed]="mode() === 'light'" (click)="setMode('light')">Sáng</button>
              <button type="button" class="tt-toggle" [attr.aria-pressed]="mode() === 'dark'" (click)="setMode('dark')">Tối</button>
            </div>
            <div class="tt-swatches">
              @for (token of palette; track token) {
                <div class="tt-swatch">
                  <span class="tt-swatch__chip" [style.background]="'var(--sd-' + token + ')'"></span>
                  <code class="tt-swatch__name">--sd-{{ token }}</code>
                  <span class="tt-swatch__value">{{ values()[token] ?? '' }}</span>
                </div>
              }
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ramp') {
        <demo-section
          heading="Ramp"
          [props]="[{ name: '--sd-{family}-{step}', value: '50 … 950' }]"
          note="Pha bằng color-mix() lúc chạy từ màu gốc (bậc 500), nên đổi --sd-primary thì cả dải đổi theo. Ramp là tuyệt đối: 50 luôn nhạt nhất, kể cả ở chế độ tối.">
          <div class="tt-ramps">
            <div class="tt-ramp tt-ramp--head" aria-hidden="true">
              <span></span>
              @for (step of rampSteps; track step) {
                <code>{{ step }}</code>
              }
            </div>
            @for (family of rampFamilies; track family) {
              <div class="tt-ramp">
                <code class="tt-ramp__name">{{ family }}</code>
                @for (step of rampSteps; track step) {
                  <span
                    class="tt-ramp__step"
                    [style.background]="'var(--sd-' + family + '-' + step + ')'"
                    [attr.title]="'--sd-' + family + '-' + step"></span>
                }
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-semantic-va-scale') {
        <demo-section
          heading="Semantic và scale"
          [props]="[
            { name: 'semantic', value: '--sd-status-*, --sd-link, --sd-focus-ring-color' },
            { name: 'scale', value: '--sd-radius-*, --sd-shadow-*, --sd-space-*' },
          ]"
          note="Component hỏi theo vai trò (chữ trạng thái lỗi, chữ trên nền đậm) thay vì một ô palette; scale đặt tên theo giá trị px và giống nhau ở sáng lẫn tối.">
          <div class="tt-column">
            <div class="tt-row">
              @for (state of states; track state) {
                <span
                  class="tt-status"
                  [style.background]="'var(--sd-status-' + state + '-bg)'"
                  [style.color]="'var(--sd-status-' + state + '-fg)'">
                  status-{{ state }}
                </span>
              }
              <a class="tt-link" href="#" (click)="$event.preventDefault()">--sd-link</a>
              <button type="button" class="tt-focus-sample">Tab tới đây: --sd-focus-ring-color</button>
            </div>
            <div class="tt-row">
              @for (radius of radii; track radius) {
                <span class="tt-scale tt-scale--radius" [style.border-radius]="'var(--sd-radius-' + radius + ')'">radius-{{ radius }}</span>
              }
            </div>
            <div class="tt-row">
              @for (shadow of shadows; track shadow) {
                <span class="tt-scale tt-scale--shadow" [style.box-shadow]="'var(--sd-shadow-' + shadow + ')'">shadow-{{ shadow }}</span>
              }
            </div>
            <div class="tt-row tt-row--space">
              @for (space of spaces; track space) {
                <span class="tt-space">
                  <span class="tt-space__bar" [style.width]="'var(--sd-space-' + space + ')'"></span>
                  <code>space-{{ space }}</code>
                </span>
              }
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-contrast') {
        <demo-section
          heading="Bảng contrast"
          [props]="[{ name: 'npm run test:theme', value: 'contrast matrix' }]"
          note="Đo trên trình duyệt cho palette default ở chế độ sáng và tối, cùng cặp và ngưỡng với test:theme (test đó còn chạy cho 8 preset có tên). Đây là kiểm tra palette, không thay cho việc kiểm tra từng trạng thái component.">
          <div class="tt-probes" aria-hidden="true">
            @for (scope of scopes; track scope.mode) {
              <div #probe class="tt-probe" [attr.data-sd-theme]="scope.mode"><span class="tt-probe__paint"></span></div>
            }
          </div>
          <div class="tt-table-wrap">
            <table class="tt-table">
              <thead>
                <tr>
                  <th scope="col">Cặp màu</th>
                  <th scope="col">Tối thiểu</th>
                  @for (scope of scopes; track scope.mode) {
                    <th scope="col">{{ scope.label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of contrast(); track row.foreground + row.background) {
                  <tr>
                    <th scope="row">
                      <code>{{ row.foreground }}</code> / <code>{{ row.background }}</code>
                    </th>
                    <td>{{ row.min }}</td>
                    @for (cell of row.cells; track $index) {
                      <td [class.tt-fail]="!cell.pass">{{ cell.ratio.toFixed(2) }} {{ cell.pass ? '✓' : '✗' }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .tt-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
      }
      .tt-toolbar {
        display: flex;
        gap: 8px;
      }
      .tt-toggle {
        padding: 6px 14px;
        border: 1px solid var(--sd-border-strong);
        border-radius: var(--sd-radius-6);
        background: var(--sd-surface);
        color: var(--sd-text);
        cursor: pointer;
      }
      .tt-toggle[aria-pressed='true'] {
        background: var(--sd-primary);
        color: var(--sd-text-on-solid);
        border-color: var(--sd-primary);
      }
      .tt-toggle:focus-visible,
      .tt-focus-sample:focus-visible {
        outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color);
        outline-offset: var(--sd-focus-ring-offset);
      }
      .tt-swatches {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 8px;
      }
      .tt-swatch {
        display: grid;
        grid-template-columns: 32px 1fr;
        grid-template-rows: auto auto;
        column-gap: 8px;
        align-items: center;
      }
      .tt-swatch__chip {
        grid-row: span 2;
        width: 32px;
        height: 32px;
        border-radius: var(--sd-radius-6);
        border: 1px solid var(--sd-border);
      }
      .tt-swatch__name {
        font-size: 12px;
        color: var(--sd-text);
      }
      .tt-swatch__value {
        font-size: 11px;
        color: var(--sd-text-secondary);
        overflow-wrap: anywhere;
      }
      .tt-ramps {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        overflow-x: auto;
      }
      .tt-ramp {
        display: grid;
        grid-template-columns: 80px repeat(11, minmax(40px, 1fr));
        gap: 4px;
        align-items: center;
      }
      .tt-ramp__name {
        font-size: 12px;
      }
      .tt-ramp__step {
        height: 32px;
        border-radius: var(--sd-radius-4);
        border: 1px solid var(--sd-border);
      }
      .tt-ramp--head code {
        font-size: 10px;
        text-align: center;
        color: var(--sd-text-secondary);
      }
      .tt-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      .tt-status {
        padding: 4px 10px;
        border-radius: var(--sd-radius-999);
        font-size: 12px;
      }
      .tt-link {
        color: var(--sd-link);
      }
      .tt-focus-sample {
        padding: 6px 12px;
        border: 1px solid var(--sd-border-strong);
        border-radius: var(--sd-radius-6);
        background: var(--sd-surface);
        color: var(--sd-text);
      }
      .tt-scale {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 96px;
        height: 40px;
        font-size: 12px;
        background: var(--sd-surface);
        color: var(--sd-text);
      }
      .tt-scale--radius {
        border: 1px solid var(--sd-border-strong);
      }
      .tt-row--space {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .tt-space {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .tt-space__bar {
        display: inline-block;
        height: 10px;
        background: var(--sd-primary);
      }
      .tt-probes {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
      }
      .tt-table-wrap {
        width: 100%;
        overflow-x: auto;
      }
      .tt-table {
        border-collapse: collapse;
        font-size: 12px;
        white-space: nowrap;
      }
      .tt-table th,
      .tt-table td {
        padding: 6px 10px;
        border-bottom: 1px solid var(--sd-border);
        text-align: left;
      }
      .tt-table thead th {
        color: var(--sd-text-secondary);
        font-weight: var(--sd-font-weight-medium);
      }
      .tt-fail {
        color: var(--sd-status-error-fg);
        font-weight: var(--sd-font-weight-semibold);
      }
    `,
  ],
})
export class ThemeTokensDemoComponent {
  readonly #document = inject(DOCUMENT);
  private readonly probes = viewChildren<ElementRef<HTMLElement>>('probe');

  readonly palette = PALETTE;
  readonly rampFamilies = RAMP_FAMILIES;
  readonly rampSteps = RAMP_STEPS;
  readonly states = STATES;
  readonly scopes = SCOPES;
  readonly radii = [4, 8, 12, 16, 999];
  readonly shadows = ['xs', 'sm', 'md', 'lg', 'xl'];
  readonly spaces = [4, 8, 16, 24, 48];

  readonly mode = signal<ThemeMode>('light');
  readonly values = signal<Partial<Record<SdColorToken, string>>>({});
  readonly contrast = signal<readonly ContrastRow[]>([]);

  constructor() {
    const root = this.#document.documentElement;
    const previous = root.getAttribute('data-sd-theme');
    this.mode.set(previous === 'dark' ? 'dark' : 'light');
    // why: the toggle writes the page-wide attribute; leave the rest of the showcase as it was.
    inject(DestroyRef).onDestroy(() => {
      if (previous === null) root.removeAttribute('data-sd-theme');
      else root.setAttribute('data-sd-theme', previous);
    });
    afterNextRender(() => {
      this.#readValues();
      this.#measureContrast();
    });
  }

  setMode(mode: ThemeMode): void {
    this.#document.documentElement.setAttribute('data-sd-theme', mode);
    this.mode.set(mode);
    this.#readValues();
  }

  #readValues(): void {
    this.values.set(readSdTokens(this.#document.documentElement, PALETTE));
  }

  #measureContrast(): void {
    const probes = this.probes().map(probe => probe.nativeElement);
    if (probes.length !== SCOPES.length) return;
    const tokens = [...new Set(PAIRS.flatMap(([foreground, background]) => [foreground, background]))];
    const colours = probes.map(probe => {
      const paint = probe.querySelector<HTMLElement>('.tt-probe__paint');
      const values = readSdTokens(probe, tokens);
      // why: readSdTokens returns the custom-property text (color-mix() included); painting it lets the
      // browser resolve it to an actual colour.
      return (token: SdColorToken): [number, number, number] => {
        if (!paint) return [0, 0, 0];
        paint.style.color = values[token] ?? 'transparent';
        return parseColour(getComputedStyle(paint).color);
      };
    });
    this.contrast.set(
      PAIRS.map(([foreground, background, min]) => ({
        foreground,
        background,
        min,
        cells: colours.map(colour => {
          const ratio = contrastRatio(colour(foreground), colour(background));
          return { ratio, pass: ratio >= min };
        }),
      }))
    );
  }
}

/** Parses `rgb(…)`, `rgba(…)` and `color(srgb …)` (what the browser returns for color-mix()) into 0–255 RGB. */
function parseColour(value: string): [number, number, number] {
  const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(value);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : [0, 0, 0];
}

/** WCAG 2.x contrast ratio. */
function contrastRatio(foreground: [number, number, number], background: [number, number, number]): number {
  const luminance = ([r, g, b]: [number, number, number]) => {
    const channel = (value: number) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

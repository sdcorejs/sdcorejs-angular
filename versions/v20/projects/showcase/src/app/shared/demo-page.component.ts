import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input } from '@angular/core';
import { DocsFragmentLinkDirective } from '../docs/shared/docs-fragment-link.directive';

export const SHOWCASE_DEMO_SECTION_ID = new InjectionToken<string | null>('SHOWCASE_DEMO_SECTION_ID', {
  providedIn: 'root',
  factory: () => null,
});

function toExampleAnchor(value: string): string {
  return `example-${value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

@Component({
  selector: 'demo-page',
  standalone: true,
  template: `
    @if (!focusedSectionId) {
      <header class="demo-page__header">
        <h2>{{ title() }}</h2>
        @if (description(); as d) {
          <p class="demo-page__desc">{{ d }}</p>
        }
      </header>
    }
    <div class="demo-page__body">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .demo-page__header {
        margin-bottom: 24px;
        h2 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .demo-page__desc {
          color: var(--docs-text-secondary, #4a4a4a);
          font-size: 14px;
          max-width: 720px;
          margin: 0;
        }
      }
      .demo-page__body {
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoPageComponent {
  readonly focusedSectionId = inject(SHOWCASE_DEMO_SECTION_ID);
  title = input.required<string>();
  description = input<string | undefined>(undefined);
}

/**
 * One demonstrated property of a showcase section, rendered as a `name:value` badge.
 * Convention: ALWAYS supply `value` — boolean attr → `true`, two-way binding → `'two-way'`,
 * content-projection slot → `'template'`, method → `'method'`, enum → list (`'sm / md / lg'`).
 * `value` stays optional in the type only for backward compatibility.
 */
export interface DemoProp {
  name: string;
  value?: string | number | boolean;
}

@Component({
  selector: 'demo-section',
  standalone: true,
  imports: [DocsFragmentLinkDirective],
  host: {
    '[attr.id]': 'sectionId()',
    '[class.demo-section--filtered-out]': 'filteredOut()',
    '[class.demo-section--focused]': 'focused()',
    '[attr.aria-hidden]': 'filteredOut() ? "true" : null',
  },
  template: `
    @let _heading = heading();
    <header class="demo-section__head">
      <!-- why: heading = mô tả demo (cái gì) · badges = thuộc tính (name secondary : value primary) · note = giải thích thêm. -->
      @if (_heading && !focused()) {
        <a class="demo-section__anchor" [docsFragmentLink]="sectionId()" [attr.aria-label]="'Link to ' + _heading">#</a>
        <h3>{{ _heading }}</h3>
      }
      @if (props(); as ps) {
        <div class="demo-section__props">
          @for (p of ps; track p.name) {
            <span class="demo-prop"
              ><span class="demo-prop__name">{{ p.name }}</span>
              @if (p.value !== undefined) {
                <span class="demo-prop__sep">:</span><span class="demo-prop__value">{{ p.value }}</span>
              }
            </span>
          }
        </div>
      }
      @if (note(); as n) {
        <p class="demo-section__note">{{ n }}</p>
      }
    </header>
    <div class="demo-section__body">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        scroll-margin-top: calc(var(--docs-header-height, 64px) + 20px);
        background: var(--docs-surface-raised, #ffffff);
        border: 1px solid var(--docs-border-color, #e6e6e6);
        border-radius: 8px;
        padding: 20px 24px;
      }
      :host(.demo-section--filtered-out) {
        display: none;
      }
      :host(.demo-section--focused) {
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
      }
      .demo-section__head {
        margin-bottom: 14px;
        h3 {
          display: inline;
          font-size: 15px;
          font-weight: 600;
          color: var(--docs-text, #1f2937);
          margin: 0 0 6px;
        }
        .demo-section__anchor {
          margin-right: 6px;
          color: var(--docs-text-muted, #6b6b6b);
        }
        .demo-section__props {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 2px;
        }
        .demo-prop {
          display: inline-flex;
          align-items: center;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 12px;
          line-height: 1.6;
          background: var(--docs-surface-muted, #f3f5f8);
          border: 1px solid var(--docs-border-color, #e6e6e6);
          border-radius: 6px;
          padding: 1px 8px;
        }
        .demo-prop__name {
          color: var(--docs-text-secondary, #6b6b6b);
        }
        .demo-prop__sep {
          color: var(--docs-text-secondary, #6b6b6b);
          margin: 0 1px;
        }
        .demo-prop__value {
          color: var(--sd-primary, #005cbb);
          font-weight: 600;
        }
        .demo-section__note {
          font-size: 12px;
          color: var(--docs-text-secondary, #6b6b6b);
          margin: 0;
        }
      }
      .demo-section__body {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoSectionComponent {
  readonly focusedSectionId = inject(SHOWCASE_DEMO_SECTION_ID);
  /** Optional fallback title — used only when `props` is not supplied (rare; most sections use `props`). */
  heading = input<string | undefined>(undefined);
  /** Demonstrated properties, rendered as `name:value` badges. Preferred over `heading`. */
  props = input<DemoProp[] | undefined>(undefined);
  note = input<string | undefined>(undefined);
  sectionId = computed(() =>
    toExampleAnchor(
      this.heading() ??
        this.props()
          ?.map(prop => prop.name)
          .join('-') ??
        'scenario'
    )
  );
  focused = computed(() => !!this.focusedSectionId && this.focusedSectionId === this.sectionId());
  filteredOut = computed(() => !!this.focusedSectionId && this.focusedSectionId !== this.sectionId());
}

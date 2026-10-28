import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiMethod, ApiMethodOption, sharedOptionNames } from '../core/api-table.parser';
import { DocsI18nService } from '../core/docs-i18n.service';
import { foldSearchText } from '../core/docs-search.utils';
import { inlineCodeSegments } from './docs-page-header.component';
import { DOCS_TOC_OFFSET_PX, docsScrollBehavior } from './docs-table-of-contents.component';

interface OptionView extends ApiMethodOption {
  readonly shared: boolean;
}

function optionMatches(option: ApiMethodOption, term: string): boolean {
  return foldSearchText([option.name, ...option.types.map(type => type.text), option.description].join(' ')).includes(term);
}

/** Matches of the API filter in method cards: each matching option, or the card itself when only its name matches. */
export function apiMethodMatchCount(methods: readonly ApiMethod[], query: string): number {
  const term = foldSearchText(query.trim());
  return methods.reduce((total, method) => {
    const options = method.options.filter(option => !term || optionMatches(option, term)).length;
    return total + (options || (term && foldSearchText(method.name).includes(term) ? 1 : 0));
  }, 0);
}

/** Service API: method jump chips and one card per method, with the options every method shares collapsed. */
@Component({
  selector: 'docs-api-methods',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @let t = i18n.t();
    <ul class="method-chips" [attr.aria-label]="t.methods">
      @for (method of visibleMethods(); track method.id) {
        <li><button type="button" (click)="jump(method.id)">{{ method.name }}()</button></li>
      }
    </ul>
    @for (method of visibleMethods(); track method.id) {
      <section class="method" [id]="method.id" tabindex="-1">
        <header class="method__header">
          <h3 class="method__signature">
            <span class="method__name">{{ method.name }}</span>
            <span class="method__params">{{ method.params }}</span>
            <span class="method__returns">→ <span>{{ method.returns }}</span></span>
          </h3>
          @if (method.description) {
            <p class="method__description">
              @for (segment of segments(method.description); track $index) {
                @if (segment.code) {
                  <code>{{ segment.text }}</code>
                } @else {
                  {{ segment.text }}
                }
              }
            </p>
          }
        </header>
        <div class="method__body">
          @if (method.options.length) {
            <p class="method__label">{{ t.options }}</p>
          }
          @for (option of method.options; track option.name) {
            <div class="method-option">
              <div class="method-option__head">
                <code class="method-option__name">{{ option.name }}</code>
                @for (type of option.types; track $index) {
                  <code class="method-option__type" [class.method-option__type--literal]="type.literal">{{ type.text }}</code>
                }
                @if (option.shared) {
                  <span class="method-option__flag">{{ t.sharedOption }}</span>
                }
                @if (option.defaultValue) {
                  <span class="method-option__default">{{ t.defaultValue }} <code>{{ option.defaultValue }}</code></span>
                }
              </div>
              @if (option.description) {
                <div class="method-option__description">
                  @for (segment of segments(option.description); track $index) {
                    @if (segment.code) {
                      <code>{{ segment.text }}</code>
                    } @else {
                      {{ segment.text }}
                    }
                  }
                </div>
              }
            </div>
          }
          @if (method.sharedCount && !apiQuery().trim()) {
            <button
              class="method__toggle"
              type="button"
              [attr.aria-expanded]="isOpen(method.id)"
              (click)="toggle(method.id)">
              <mat-icon aria-hidden="true">{{ isOpen(method.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
              {{ isOpen(method.id) ? t.hideShared : i18n.format('showShared', { n: method.sharedCount }) }}
            </button>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './docs-api-methods.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsApiMethodsComponent {
  readonly #document = inject(DOCUMENT);
  readonly i18n = inject(DocsI18nService);
  readonly methods = input.required<readonly ApiMethod[]>();
  /** API filter, the same value as the renderer's apiQuery. */
  readonly apiQuery = input('');
  readonly #open = signal<ReadonlySet<string>>(new Set());

  readonly sharedNames = computed(() => sharedOptionNames(this.methods()));
  readonly visibleMethods = computed(() => {
    const term = foldSearchText(this.apiQuery().trim());
    const shared = this.sharedNames();
    const open = this.#open();
    return this.methods()
      .map(method => {
        const own: OptionView[] = method.options.filter(option => !shared.has(option.name)).map(option => ({ ...option, shared: false }));
        const sharedOptions: OptionView[] = method.options
          .filter(option => shared.has(option.name))
          .map(option => ({ ...option, shared: true }));
        const options = term
          ? [...own, ...sharedOptions].filter(option => optionMatches(option, term))
          : [...own, ...(open.has(method.id) ? sharedOptions : [])];
        const nameMatches = !term || foldSearchText(method.name).includes(term);
        return { ...method, options, sharedCount: sharedOptions.length, visible: nameMatches || options.length > 0 };
      })
      .filter(method => method.visible);
  });

  segments(text: string) {
    return inlineCodeSegments(text);
  }

  isOpen(id: string): boolean {
    return this.#open().has(id);
  }

  toggle(id: string): void {
    this.#open.update(open => {
      const next = new Set(open);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  jump(id: string): void {
    const view = this.#document.defaultView;
    const target = this.#document.getElementById(id);
    if (!view || !target) return;
    view.scrollTo({ top: target.getBoundingClientRect().top + view.scrollY - DOCS_TOC_OFFSET_PX, behavior: docsScrollBehavior(view) });
    // why: keyboard and screen-reader users continue reading at the method, not at the chip they pressed.
    target.focus({ preventScroll: true });
  }
}

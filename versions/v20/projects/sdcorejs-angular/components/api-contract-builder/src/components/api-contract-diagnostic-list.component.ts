import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdApiContractDiagnostic } from '../api-contract.model';

/**
 * Validation summary + the diagnostic list.
 *
 * Severity is never signalled by colour alone: every row carries an icon, the severity word, the
 * stable `code` and the structural `path`, so the list stays readable for a colour-blind reader and
 * usable from a screen reader.
 */
@Component({
  selector: 'sd-api-contract-diagnostic-list',
  standalone: true,
  imports: [SdIcon, SdTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _diagnostics = diagnostics();
    @let _errors = errorCount();
    @let _warnings = warningCount();
    @let _autoId = autoId();

    <div class="sd-acb-diagnostics" [attr.data-autoId]="_autoId">
      <div class="sd-acb-diagnostics__summary" role="status">
        @if (!_diagnostics.length) {
          <span class="sd-acb-diagnostics__badge" data-severity="ok">
            <sd-icon name="check_circle" size="sm"></sd-icon>
            <span>{{ 'core.component.api-contract-builder.review.valid' | sdTranslate }}</span>
          </span>
        } @else {
          <span class="sd-acb-diagnostics__badge" data-severity="error">
            <sd-icon name="error" size="sm"></sd-icon>
            <span>{{ 'core.component.api-contract-builder.review.errors' | sdTranslate: { count: _errors } }}</span>
          </span>
          <span class="sd-acb-diagnostics__badge" data-severity="warning">
            <sd-icon name="warning" size="sm"></sd-icon>
            <span>{{ 'core.component.api-contract-builder.review.warnings' | sdTranslate: { count: _warnings } }}</span>
          </span>
        }
      </div>

      @if (_diagnostics.length) {
        <ul class="sd-acb-diagnostics__list">
          @for (diagnostic of _diagnostics; track diagnostic.code + '|' + diagnostic.path + '|' + $index) {
            <li class="sd-acb-diagnostics__item" [attr.data-severity]="diagnostic.severity" [attr.data-code]="diagnostic.code">
              <button
                type="button"
                class="sd-acb-diagnostics__nav"
                [attr.data-autoId]="_autoId ? _autoId + '-goto-' + $index : null"
                (click)="navigate.emit(diagnostic)">
                <sd-icon [name]="diagnostic.severity === 'error' ? 'error' : 'warning'" size="sm"></sd-icon>
                <span class="sd-acb-diagnostics__path">{{ diagnostic.path || '(contract)' }}</span>
                <span class="sd-acb-diagnostics__message">{{ diagnostic.message }}</span>
                <span class="sd-acb-diagnostics__code">{{ diagnostic.code }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sd-acb-diagnostics__summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 10px;
      }
      .sd-acb-diagnostics__badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;

        &[data-severity='ok'] {
          color: var(--sd-success, #1c6c3a);
        }
        &[data-severity='error'] {
          color: var(--sd-error, #b3261e);
        }
        &[data-severity='warning'] {
          color: var(--sd-warning, #8a5a00);
        }
      }
      .sd-acb-diagnostics__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sd-acb-diagnostics__nav {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px;
        width: 100%;
        text-align: left;
        background: none;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 6px 8px;
        cursor: pointer;
        font: inherit;
        font-size: 12px;

        &:hover,
        &:focus-visible {
          border-color: var(--sd-border-color, #e6e6e6);
          background: var(--sd-surface-muted, #f3f5f8);
        }
      }
      .sd-acb-diagnostics__item[data-severity='error'] .sd-acb-diagnostics__nav {
        color: var(--sd-error, #b3261e);
      }
      .sd-acb-diagnostics__item[data-severity='warning'] .sd-acb-diagnostics__nav {
        color: var(--sd-warning, #8a5a00);
      }
      .sd-acb-diagnostics__path {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-weight: 600;
      }
      .sd-acb-diagnostics__message {
        color: var(--sd-text, #1f2937);
      }
      .sd-acb-diagnostics__code {
        margin-left: auto;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        color: var(--sd-text-secondary, #6b6b6b);
      }
    `,
  ],
})
export class SdApiContractDiagnosticList {
  diagnostics = input<readonly SdApiContractDiagnostic[]>([]);
  autoId = input<string | null | undefined>();

  navigate = output<SdApiContractDiagnostic>();

  protected readonly errorCount = computed(() => this.diagnostics().filter(diagnostic => diagnostic.severity === 'error').length);
  protected readonly warningCount = computed(() => this.diagnostics().filter(diagnostic => diagnostic.severity === 'warning').length);
}

import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSegmentedComponent, type SdSegmentedItem, type SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { PatternMockApiState, type PatternMockFailure } from '../../mock-api/mock-api.state';
import { PATTERN_ROLES, type PatternRole } from '../../permission/pattern-permission';
import { PatternRoleStore } from '../../permission/pattern-role.store';

const LATENCIES: readonly SdSegmentedItem<number>[] = [
  { value: 0, label: '0' },
  { value: 400, label: '400' },
  { value: 1500, label: '1500' },
];

const FAILURES: readonly SdSegmentedItem<PatternMockFailure>[] = [
  { value: 'none', label: 'Không' },
  { value: '500', label: '500' },
  { value: 'timeout', label: 'Timeout' },
  { value: '404', label: '404' },
  { value: '403', label: '403' },
];

/**
 * Sample toolbar pinned under every `/pattern` route: role, latency, simulated error, data reset and source.
 * It belongs to the shell, not to the feature code people copy.
 */
@Component({
  selector: 'sd-pattern-toolbar',
  standalone: true,
  imports: [RouterLink, SdButton, SdSegmentedComponent],
  template: `
    <div class="sd-pattern-toolbar" role="toolbar" aria-label="Thanh công cụ mẫu">
      <a class="sd-pattern-toolbar__home" routerLink=".">Pattern</a>
      <div class="sd-pattern-toolbar__group">
        <span class="sd-pattern-toolbar__label">Vai trò</span>
        <sd-segmented
          size="sm"
          ariaLabel="Vai trò"
          autoId="pattern-role"
          [items]="roles"
          [model]="role()"
          (sdChange)="switchRole($event)"></sd-segmented>
      </div>
      @if (mock; as mockApi) {
        <div class="sd-pattern-toolbar__group">
          <span class="sd-pattern-toolbar__label">Độ trễ (ms)</span>
          <sd-segmented
            size="sm"
            ariaLabel="Độ trễ"
            autoId="pattern-latency"
            [items]="latencies"
            [model]="mockApi.latencyMs()"
            (sdChange)="setLatency($event)"></sd-segmented>
        </div>
        <div class="sd-pattern-toolbar__group">
          <span class="sd-pattern-toolbar__label">Lỗi giả lập</span>
          <sd-segmented
            size="sm"
            ariaLabel="Lỗi giả lập"
            autoId="pattern-failure"
            [items]="failures"
            [model]="mockApi.failure()"
            (sdChange)="setFailure($event)"></sd-segmented>
        </div>
        <sd-button
          size="sm"
          type="text"
          prefixIcon="restart_alt"
          title="Khôi phục dữ liệu"
          autoId="pattern-reset"
          (click)="resetData()"></sd-button>
      }
      <span class="sd-pattern-toolbar__spacer"></span>
      <sd-button
        size="sm"
        type="outline"
        prefixIcon="code"
        title="Xem source"
        autoId="pattern-source"
        (click)="viewSource.emit()"></sd-button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex: 0 0 auto;
    }
    .sd-pattern-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 20px;
      min-height: 48px;
      padding: 6px 16px;
      border-top: 1px solid var(--sd-border);
      background: var(--sd-surface);
    }
    .sd-pattern-toolbar__home {
      color: var(--sd-text);
      font-weight: 500;
      text-decoration: none;
    }
    .sd-pattern-toolbar__group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sd-pattern-toolbar__label {
      color: var(--sd-text-secondary);
      font-size: 12px;
    }
    .sd-pattern-toolbar__spacer {
      flex: 1 1 auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternToolbarComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #roles = inject(PatternRoleStore);
  readonly #permission = inject(SdPermissionService);
  readonly #notify = inject(SdNotifyService);
  readonly mock = inject(PatternMockApiState, { optional: true });
  readonly viewSource = output<void>();
  readonly role = this.#roles.role;
  readonly roles: readonly SdSegmentedItem<PatternRole>[] = PATTERN_ROLES.map(role => ({ value: role.value, label: role.label }));
  readonly latencies = LATENCIES;
  readonly failures = FAILURES;

  /** Loads the permissions of the new role, then opens the current screen again (guards and `*sdPermission` re-run). */
  async switchRole(value: SdSegmentedModel<PatternRole>): Promise<void> {
    if (typeof value !== 'string' || value === this.role()) return;
    this.#roles.set(value);
    this.#permission.reset();
    await this.#permission.loadAllPermissions();
    await this.#reopen();
  }

  setLatency(value: SdSegmentedModel<number>): void {
    if (typeof value === 'number') this.mock?.setLatency(value);
  }

  setFailure(value: SdSegmentedModel<PatternMockFailure>): void {
    if (typeof value === 'string') this.mock?.setFailure(value);
  }

  async resetData(): Promise<void> {
    await this.mock?.resetData();
    this.#notify.success('Đã khôi phục dữ liệu mẫu.');
    await this.#reopen();
  }

  async #reopen(): Promise<void> {
    const url = this.#router.url;
    const shell = this.#router.createUrlTree(['.'], { relativeTo: this.#route });
    if (this.#router.serializeUrl(shell) === url) return;
    if (await this.#router.navigateByUrl(shell, { skipLocationChange: true })) await this.#router.navigateByUrl(url);
  }
}

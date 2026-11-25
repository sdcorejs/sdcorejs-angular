import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { Color } from '@sdcorejs/utils/models';

export interface RelationLink {
  link: unknown[];
  queryParams?: Params;
}

@Component({
  selector: 'relation-card',
  imports: [RouterLink, SdBadge, SdDataState, SdSection, SdIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    a {
      display: inline-flex;
      align-items: center;
      color: var(--sd-primary);
      text-decoration: none;
      white-space: nowrap;
    }
    a:hover {
      text-decoration: underline;
    }
    @media print {
      a {
        display: none;
      }
    }
  `,
  template: `
    <sd-section [title]="title()" [attr.id]="sectionId()" [attr.data-autoid]="autoId()" dividers="header">
      <div sdHeaderLeft class="d-flex align-items-center gap-8">
        <span class="T16M">{{ title() }}</span>
        @let count = totalLabel() ?? total();
        @if (state() === 'ready' && count !== null) {
          <sd-badge type="round" [color]="totalColor()" [title]="count" />
        }
      </div>
      <ng-container sdHeaderRight>
        @if (more(); as target) {
          @if (state() === 'ready' && total() !== 0) {
            <a
              class="T13M"
              [routerLink]="target.link"
              [queryParams]="target.queryParams"
              [attr.aria-label]="'Xem tất cả: ' + title()"
              [attr.data-autoid]="autoId() + '-more'">
              Xem tất cả <sd-icon name="chevron_right" aria-hidden="true" />
            </a>
          }
        }
      </ng-container>
      <div [attr.aria-busy]="state() === 'loading'">
        @switch (state()) {
          @case ('loading') {
            <sd-data-state compact state="loading" />
          }
          @case ('error') {
            <sd-data-state
              compact
              state="error"
              retryable
              [title]="'Không tải được ' + title().toLowerCase()"
              message="Các phần khác của hồ sơ vẫn dùng được."
              retryLabel="Thử lại"
              (sdRetry)="retry.emit()" />
          }
          @case ('ready') {
            @if (empty()) {
              <div class="p-16 T13R text-secondary">{{ emptyText() }}</div>
            } @else {
              <ng-content />
            }
          }
        }
      </div>
    </sd-section>
  `,
})
export class RelationCardComponent {
  readonly title = input.required<string>();
  readonly total = input<number | null>(null);
  readonly totalLabel = input<string | null>(null);
  readonly totalColor = input<Color>('primary');
  readonly state = input.required<'loading' | 'error' | 'ready'>();
  readonly empty = input(false);
  readonly emptyText = input.required<string>();
  readonly more = input<RelationLink | null>(null);
  readonly autoId = input.required<string>();
  readonly sectionId = input<string | null>(null);
  readonly retry = output<void>();
}

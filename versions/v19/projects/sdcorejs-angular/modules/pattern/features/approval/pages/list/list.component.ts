import { ChangeDetectionStrategy, Component, DestroyRef, effect, forwardRef, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSplitterComponent, SdSplitterPanelComponent, type SdSplitterOption } from '@sdcorejs/angular/components/splitter';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { ApprovalService } from '../../services/approval.service';
import { APPROVAL_STATUS_OPTIONS, approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from './approval-inbox';

/** Dưới bề rộng này chi tiết thay hẳn danh sách, có nút quay lại. */
const NARROW = '(max-width: 767.98px)';

/**
 * Hộp duyệt (pattern split): danh sách bên trái, chi tiết là route con `:id` trong panel phải. ↑ ↓ chuyển mục;
 * duyệt hoặc từ chối xong panel chi tiết tự chọn mục kế, bộ lọc và vị trí cuộn của danh sách giữ nguyên.
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Phím ↑ ↓ nổi lên từ dòng hay nút đang focus trong danh sách hoặc panel chi tiết.
  host: { '(keydown)': 'move($event)' },
  imports: [
    RouterLink,
    RouterOutlet,
    SdPageList,
    SdSplitterComponent,
    SdSplitterPanelComponent,
    SdTable,
    SdTableCellDefDirective,
    SdDataState,
  ],
  providers: [{ provide: ApprovalInbox, useExisting: forwardRef(() => ListComponent) }],
  styles: `
    .approval > sd-splitter {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval--narrow.approval--active sd-splitter-panel:first-child,
    .approval--narrow:not(.approval--active) sd-splitter-panel:last-of-type {
      display: none;
    }
  `,
})
export class ListComponent extends ApprovalInbox {
  readonly #approvalService = inject(ApprovalService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly table = viewChild.required(SdTable);
  protected readonly active = signal(false);
  protected readonly narrow = signal(false);
  /** ID đang mở ở panel phải, đọc từ route con. */
  protected readonly selectedId = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.firstChild?.snapshot.paramMap.get('id') ?? null)
    ),
    { requireSync: true }
  );
  protected readonly splitter: SdSplitterOption = { storageKey: 'sd-pattern.approval.splitter' };
  protected readonly option: SdTableOption<ApprovalDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#approvalService.list(req)),
    filter: {
      quickSearch: { containFields: ['code', 'title', 'requester'], placeholder: 'Tìm theo mã, nội dung, người đề nghị' },
    },
    paginate: { pageSize: 20, pages: [20, 50] },
    columns: [
      { field: 'code', title: 'Mã', type: 'string', width: '110px' },
      { field: 'title', title: 'Nội dung', type: 'string', minWidth: '160px' },
      { field: 'amount', title: 'Số tiền (₫)', type: 'number', width: '130px', align: 'right' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '140px',
        option: { items: APPROVAL_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => approvalStatusBadge(status),
        // Hộp duyệt mở sẵn các đề nghị đang chờ; đổi bộ lọc để xem đề nghị đã xử lý.
        filter: { default: 'pending' },
      },
    ],
    style: {
      rowCss: (row): Record<string, string> => (row.id === this.selectedId() ? { background: 'var(--sd-primary-light)' } : {}),
    },
  };

  constructor() {
    super();
    // Dòng đang mở được tô nền: vẽ lại bảng khi chọn mục khác.
    effect(() => {
      this.selectedId();
      untracked(() => this.table().detectChanges());
    });
    const media = typeof matchMedia === 'function' ? matchMedia(NARROW) : null;
    if (media) {
      this.narrow.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void => this.narrow.set(event.matches);
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
    }
  }

  nextOf(id: string): string | null {
    const rows = this.table().dataItems;
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) return rows[0]?.id ?? null;
    return rows[index + 1]?.id ?? rows[index - 1]?.id ?? null;
  }

  async refresh(): Promise<void> {
    await this.table().reload(true, false);
  }

  /** ↑ ↓ chuyển sang dòng trước/sau; bỏ qua khi đang gõ trong ô nhập. */
  protected move(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], mat-select, [role="separator"]')) return;
    const rows = this.table().dataItems;
    if (!rows.length) return;
    const index = rows.findIndex(row => row.id === this.selectedId());
    const next = rows[Math.min(rows.length - 1, Math.max(0, index < 0 ? 0 : index + (event.key === 'ArrowDown' ? 1 : -1)))];
    event.preventDefault();
    if (next.id !== this.selectedId()) void this.#router.navigate([next.id], { relativeTo: this.#route });
  }
}

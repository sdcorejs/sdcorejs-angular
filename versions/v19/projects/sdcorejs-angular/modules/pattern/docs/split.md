# Split

Danh sách và chi tiết cạnh nhau để xử lý nhanh từng mục: `sd-page-list detail="none"` + `sd-splitter` + route con `:id` trong panel phải. Route mẫu: `/pattern/approval`, `/pattern/approval/:id`.

## Khi nào dùng / khi nào không

- Dùng cho hộp xử lý: người dùng đi qua từng mục, duyệt hoặc từ chối, rồi sang mục kế.
- Xem chi tiết thỉnh thoảng: dùng [drawer](drawer.md) hoặc [detail](detail.md).

## Code mẫu

<!-- @source features/approval/pages/list/list.component.html -->
```html
<sd-page-list title="Phê duyệt" description="Đề nghị thanh toán chờ xử lý. Dùng ↑ ↓ để chuyển mục." detail="none">
  <div sdPageListMain class="approval" [class.approval--narrow]="narrow()" [class.approval--active]="active()">
    <sd-splitter [option]="splitter">
      <!-- Kéo trong khoảng 360–760px; panel chi tiết nhận phần còn lại (unit flex: minSize là trọng số, không phải px). -->
      <sd-splitter-panel class="approval__list" panelId="list" [size]="520" unit="px" [minSize]="360" [maxSize]="760">
        <sd-table autoId="approval-list" [option]="option">
          <ng-template sdTableCellDef="code" let-item="item">
            <a [routerLink]="[item.id]" [attr.aria-current]="item.id === selectedId() ? 'true' : null">{{ item.code }}</a>
          </ng-template>
        </sd-table>
      </sd-splitter-panel>
      <sd-splitter-panel class="approval__detail" panelId="detail" [size]="1">
        <router-outlet (activate)="active.set(true)" (deactivate)="active.set(false)" />
        @if (!active()) {
          <sd-data-state state="empty" icon="inbox" title="Chọn một mục" message="Chọn một đề nghị bên trái để xem chi tiết và xử lý." />
        }
      </sd-splitter-panel>
    </sd-splitter>
  </div>
</sd-page-list>
```

<!-- @source features/approval/pages/list/list.component.ts -->
```ts
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
    .approval sd-splitter-panel {
      display: flex;
      flex-direction: column;
    }
    .approval__list {
      background: var(--sd-surface, #ffffff);
      border: 1px solid var(--sd-border, #e3e5ea);
      border-radius: 8px;
    }
    .approval__list > sd-table {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval__detail {
      overflow-y: auto;
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
      { field: 'code', title: 'Mã', type: 'string', width: '96px' },
      { field: 'title', title: 'Nội dung', type: 'string', minWidth: '140px' },
      { field: 'amount', title: 'Số tiền (₫)', type: 'number', width: '120px', align: 'right' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '128px',
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
```

Panel chi tiết: xử lý xong thì tự mở mục kế trong danh sách đang lọc:

<!-- @source features/approval/pages/detail/detail.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { ApprovalService } from '../../services/approval.service';
import { approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from '../list/approval-inbox';

/** Chi tiết một đề nghị trong panel phải của hộp duyệt (route con `:id`). */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    RouterLink,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = entity();
    <article class="d-flex flex-column gap-16 p-16" [attr.aria-label]="'Đề nghị ' + item.code">
      <header class="d-flex align-items-start justify-content-between gap-16 flex-wrap">
        <div class="d-flex flex-column gap-4">
          <!-- Màn hẹp: chi tiết thay danh sách, quay lại bằng liên kết này. -->
          <a class="approval-back" [routerLink]="['..']">← Danh sách</a>
          <div class="d-flex align-items-center gap-8">
            <h2 class="T18M m-0">{{ item.code }} · {{ item.title }}</h2>
            <sd-badge size="md" type="round" [title]="badge().title" [color]="badge().color" />
          </div>
          <span class="T14R text-secondary">{{ item.requester }} · {{ item.department }}</span>
        </div>
        @if (item.status === 'pending') {
          <div class="d-flex align-items-center gap-8">
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_REJECT'"
              title="Từ chối"
              prefixIcon="close"
              type="light"
              color="warning"
              autoId="approval-reject"
              [disabled]="pending()"
              (click)="decide('reject')" />
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_APPROVE'"
              title="Duyệt"
              prefixIcon="check"
              type="fill"
              color="success"
              autoId="approval-approve"
              [disabled]="pending()"
              (click)="decide('approve')" />
          </div>
        }
      </header>
      <sd-section title="Thông tin đề nghị">
        <sd-section-item label="Số tiền (₫)">{{ item.amount | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ngày gửi">{{ item.submittedAt | sdFormatDatetime }}</sd-section-item>
        <sd-section-item label="Ghi chú">{{ item.note | sdEmpty }}</sd-section-item>
        <sd-section-item label="Lý do từ chối">{{ item.reason | sdEmpty }}</sd-section-item>
      </sd-section>
    </article>
  `,
  styles: `
    .approval-back {
      display: none;
      font-size: 13px;
    }
    @media (max-width: 767.98px) {
      .approval-back {
        display: inline;
      }
    }
  `,
})
export class DetailComponent {
  readonly #approvalService = inject(ApprovalService);
  readonly #inbox = inject(ApprovalInbox);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as ApprovalDto)), { requireSync: true });
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly badge = computed(() => approvalStatusBadge(this.entity().status));
  protected readonly pending = signal(false);

  /** Hỏi xác nhận (Từ chối kèm lý do), xử lý, rồi tự mở mục kế trong danh sách đang lọc. */
  protected async decide(action: 'approve' | 'reject'): Promise<void> {
    const item = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(`Từ chối ${item.code}. Lý do được gửi cho ${item.requester}.`, {
          title: 'Từ chối đề nghị',
          label: 'Lý do từ chối',
          required: true,
          maxlength: 200,
          yesTitle: 'Từ chối',
          noTitle: 'Không',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(`Duyệt ${item.code}: ${item.title}?`, { title: 'Duyệt đề nghị', yesTitle: 'Duyệt', noTitle: 'Không' });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      const next = this.#inbox.nextOf(item.id);
      this.entity.set(
        await firstValueFrom(
          action === 'approve' ? this.#approvalService.approve({ id: item.id }) : this.#approvalService.reject({ id: item.id, reason })
        )
      );
      this.#notify.success(action === 'approve' ? `Đã duyệt ${item.code}.` : `Đã từ chối ${item.code}.`);
      await this.#inbox.refresh();
      await this.#router.navigate(next ? ['..', next] : ['..'], { relativeTo: this.#route });
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
```

## Quy tắc

- MUST dùng `detail="none"`: `sd-page-list` không đặt router-outlet, màn đặt outlet trong panel phải. Bọc `sd-splitter` trong phần tử `sdPageListMain` để vùng chia đôi lấp phần còn lại của trang.
- MUST hiện trạng thái trống ("Chọn một mục") khi chưa mở mục nào.
- MUST cho ↑ ↓ chuyển mục khi focus không ở ô nhập; tô nền dòng đang mở.
- MUST giữ bộ lọc, trang và vị trí cuộn khi chuyển mục và sau khi xử lý; tải lại bằng `reload(true, false)`.
- MUST cho panel danh sách bề rộng px (`unit="px"`) với `minSize`/`maxSize` px, panel chi tiết `unit="flex"` nhận phần còn lại; đặt `display: flex; flex-direction: column` cho panel để bảng lấp chiều cao và paginator luôn hiện.
- SHOULD lưu bề rộng panel (`storageKey` của `sd-splitter`).
- SHOULD dưới 768px cho chi tiết thay hẳn danh sách, có liên kết quay lại.

## Lỗi hay gặp

- Để `sd-page-list` mặc định (`detail="page"`): route con hiện thay chỗ cả danh sách, không còn cạnh nhau.
- Đặt `sdPageListMain` trực tiếp lên `sd-splitter`: kiểu cột của vùng chính đè hướng ngang của splitter.
- Đặt `[minSize]="360"` lên panel `unit="flex"` để giữ chỗ cho chi tiết: với panel flex, `minSize` là trọng số chứ không phải px, nên handle không kéo được. Giới hạn bằng `maxSize` px của panel danh sách.
- Để panel ở `display: block` mặc định: bảng ở chế độ fill không co theo panel, dòng cuối và paginator bị cắt.
- Chọn mục kế sau khi đã tải lại danh sách: mục vừa xử lý đã biến mất khỏi bộ lọc, vị trí kế bị lệch. Lấy mục kế trước khi tải lại.

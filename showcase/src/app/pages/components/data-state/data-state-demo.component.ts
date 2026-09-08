import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdSearch, SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdReadState } from '@sdcorejs/angular/utilities/read-state';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface DemoRow {
  id: number;
  name: string;
}
type DemoControl = 'table' | 'select' | 'autocomplete';

@Component({
  selector: 'app-data-state-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDataState, SdDataStateTemplateDirective, SdTable, SdSelect, SdAutocomplete],
  template: `
    <demo-page
      #demoPage
      title="Data State"
      description="SdDataState – presentation nhất quán cho loading, empty, error, forbidden và success mà không trộn với utilities/data-state.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading') {
        <demo-section heading="Loading" [props]="[{ name: 'compact', value: 'true' }]">
          <sd-data-state state="loading" compact></sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-empty') {
        <demo-section heading="Empty" note="Custom template nhận state/retry/action context thay cho default presentation.">
          <sd-data-state state="empty" compact></sd-data-state>
          <sd-data-state state="empty" compact>
            <ng-template sdDataStateTemplate let-state>
              <div class="custom-empty">Custom {{ state }}: chưa có đơn hàng phù hợp.</div>
            </ng-template>
          </sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-error') {
        <demo-section
          heading="Error"
          [props]="[
            { name: 'retryable', value: 'true' },
            { name: 'actionLabel', value: 'Mở nhật ký' },
          ]">
          <sd-data-state state="error" retryable actionLabel="Mở nhật ký" (sdRetry)="onRetry()" (sdAction)="onAction()"> </sd-data-state>
          <div>Retry: {{ retryCount() }} · Action: {{ actionCount() }}</div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-forbidden') {
        <demo-section heading="Forbidden" [props]="[{ name: 'fullPage', value: 'true' }]">
          <div class="full-page-preview">
            <sd-data-state state="forbidden" fullPage></sd-data-state>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-success') {
        <demo-section heading="Success" note="Không có presentation wrapper dư thừa; content được project trực tiếp.">
          <sd-data-state state="success">
            <article data-success>Dữ liệu đã sẵn sàng</article>
          </sd-data-state>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loi-va-retry-tren-ba-control') {
      <demo-section
        heading="Lỗi và retry trên ba control"
        [props]="[{ name: 'readState / sdReadStateChange', value: 'idle → loading → ready / empty / error' }]">
        <p>
          Ban đầu máy chủ mô phỏng trả lỗi. Chọn “Có dữ liệu” hoặc “Rỗng hợp lệ”, rồi bấm Thử lại trên control. Chọn “Tiếp tục lỗi” để thử
          lỗi liên tiếp. Select đọc riêng VALUE và SEARCH nên có thể cần retry từng kênh.
        </p>
        <div class="demo-actions">
          <button type="button" [attr.aria-pressed]="mode() === 'ready'" (click)="mode.set('ready')">Có dữ liệu</button>
          <button type="button" [attr.aria-pressed]="mode() === 'empty'" (click)="mode.set('empty')">Rỗng hợp lệ</button>
          <button type="button" [attr.aria-pressed]="mode() === 'error'" (click)="mode.set('error')">Tiếp tục lỗi</button>
        </div>
        <p>
          Chế độ phản hồi: {{ mode() }}. Số request: bảng {{ counts().table }}, select {{ counts().select }}, autocomplete
          {{ counts().autocomplete }}.
        </p>
        <div class="table-demo">
          <sd-table #table [option]="tableOption" (sdReadStateChange)="record('table', $event)"></sd-table>
        </div>
        <div class="demo-actions">
          <button type="button" (click)="table.reload()">Đọc lại bảng</button>
          <span>Output bảng: {{ latest().table }}</span>
        </div>
        <div class="control-grid">
          <div>
            <sd-select
              #select
              label="Select — template lỗi riêng"
              [items]="loadSelect"
              valueField="id"
              displayField="name"
              [(model)]="selected"
              (sdReadStateChange)="record('select', $event)">
              <ng-template sdDataStateTemplate let-state let-retry="retry">
                <sd-data-state
                  [state]="state"
                  title="Chưa tải được lựa chọn"
                  message="Vui lòng thử lại."
                  compact
                  retryable
                  (sdRetry)="retry()"></sd-data-state>
              </ng-template>
            </sd-select>
            <p>Giá trị: {{ selected() }}. Output: {{ latest().select }}</p>
          </div>
          <div>
            <sd-autocomplete
              #autocomplete
              label="Autocomplete"
              [items]="loadAutocomplete"
              valueField="id"
              displayField="name"
              [(model)]="autocompleteValue"
              [hideReadError]="hideReadError()"
              (sdReadStateChange)="record('autocomplete', $event)">
            </sd-autocomplete>
            <p>Giá trị: {{ autocompleteValue() }}. Output: {{ latest().autocomplete }}</p>
            <label
              ><input type="checkbox" [checked]="hideReadError()" (change)="hideReadError.set(!hideReadError())" /> Host hiển thị lỗi bên
              ngoài</label
            >
            @if (hideReadError() && !autocomplete.loading() && autocomplete.readState().status === 'error') {
              <sd-data-state state="error" compact retryable (sdRetry)="autocomplete.retryRead()"></sd-data-state>
            }
          </div>
        </div>
        <p>
          Mở panel lỗi và nhấn Tab để tới retry; Enter/Space để thử lại, Escape để đóng panel. Giá trị đã chọn không bị xóa khi đọc lỗi.
        </p>
      </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .control-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; }
    .demo-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .table-demo { width: 100%; min-height: 320px; }
    .custom-empty,
    [data-success] {
      padding: 16px;
      border: 1px dashed #98a2b3;
      border-radius: 8px;
    }

    .full-page-preview {
      max-height: 360px;
      overflow: auto;
      border: 1px solid #e4e7ec;
      border-radius: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataStateDemoComponent {
  readonly retryCount = signal(0);
  readonly actionCount = signal(0);

  onRetry(): void {
    this.retryCount.update(value => value + 1);
  }

  onAction(): void {
    this.actionCount.update(value => value + 1);
  }
  readonly mode = signal<'error' | 'ready' | 'empty'>('error');
  readonly hideReadError = signal(false);
  readonly selected = signal<number | undefined>(1);
  readonly autocompleteValue = signal<number | undefined>(1);
  readonly counts = signal<Record<DemoControl, number>>({ table: 0, select: 0, autocomplete: 0 });
  readonly latest = signal<Record<DemoControl, string>>({ table: 'idle', select: 'idle', autocomplete: 'idle' });
  readonly rows: DemoRow[] = [
    { id: 1, name: 'Hà Nội' },
    { id: 2, name: 'Đà Nẵng' },
    { id: 3, name: 'TP. Hồ Chí Minh' },
  ];
  readonly loadSelect: SdSearch<DemoRow> = request => this.readRows('select', request);
  readonly loadAutocomplete: SdSearch<DemoRow> = request => this.readRows('autocomplete', request);
  readonly tableOption: SdTableOption<DemoRow> = {
    type: 'server',
    columns: [{ field: 'name', title: 'Địa điểm', type: 'string' }],
    paginate: { pageSize: 10 },
    items: async () => {
      const items = await this.readRows('table');
      return { items, total: items.length };
    },
  };

  record(control: DemoControl, state: SdReadState): void {
    this.latest.update(previous => ({ ...previous, [control]: state.operation + ': ' + state.status }));
  }

  private async readRows(control: DemoControl, request?: SdSearchReq): Promise<DemoRow[]> {
    this.counts.update(previous => ({ ...previous, [control]: previous[control] + 1 }));
    const mode = this.mode();
    await new Promise(resolve => setTimeout(resolve, 400));
    if (mode === 'error') throw new Error('Demo unavailable');
    if (mode === 'empty') return [];
    if (request?.type === 'VALUE') {
      const values = Array.isArray(request.value) ? request.value : [request.value];
      return this.rows.filter(row => values.some(value => String(value) === String(row.id)));
    }
    const query = request?.searchText?.toLocaleLowerCase() || '';
    return this.rows.filter(row => row.name.toLocaleLowerCase().includes(query));
  }
}

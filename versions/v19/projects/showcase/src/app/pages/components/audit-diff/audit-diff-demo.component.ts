import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdAuditDiff, SdAuditDiffOptions, SdAuditDiffValueTemplateDirective } from '@sdcorejs/angular/components/audit-diff';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-audit-diff-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAuditDiff, SdAuditDiffValueTemplateDirective],
  template: `
    <demo-page
      #demoPage
      title="Audit Diff"
      description="SdAuditDiff – pure diff engine cho nested object/stable-key array và presentation table/detail-list có semantic before/after.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nested-table') {
        <demo-section
          heading="Nested table"
          [props]="[
            { name: 'mode', value: 'table' },
            { name: 'nested objects', value: 'leaf rows' },
          ]">
          <sd-audit-diff [before]="nestedBefore" [after]="nestedAfter" [options]="nestedOptions"></sd-audit-diff>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-stable-key-array') {
        <demo-section
          heading="Stable-key array"
          [props]="[
            { name: 'arrayKey', value: 'id' },
            { name: 'mode', value: 'detail-list' },
          ]"
          note="Reorder không sinh diff giả; item thêm/xóa vẫn đi qua rule của field con.">
          <sd-audit-diff [before]="linesBefore" [after]="linesAfter" [options]="linesOptions" mode="detail-list"></sd-audit-diff>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-format-redact-va-order') {
        <demo-section
          heading="Format, redact và order"
          [props]="[
            { name: 'enumMap', value: 'status' },
            { name: 'redacted', value: 'token' },
            { name: 'hidden', value: 'password' },
          ]">
          <sd-audit-diff [before]="securedBefore" [after]="securedAfter" [options]="securedOptions"></sd-audit-diff>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-value-template') {
        <demo-section heading="Custom value template" [props]="[{ name: 'sdAuditDiffValue', value: 'TemplateRef context' }]">
          <sd-audit-diff [before]="customBefore" [after]="customAfter" [options]="customOptions">
            <ng-template sdAuditDiffValue let-value let-row="row" let-side="side">
              <span class="custom-value" [attr.data-custom-side]="side">{{ row.label }}: {{ value }}</span>
            </ng-template>
          </sd-audit-diff>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .custom-value {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef4ff;
      color: #1849a9;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDiffDemoComponent {
  readonly nestedBefore = {
    profile: { name: 'Nguyễn An', department: 'Sales' },
    active: true,
  };
  readonly nestedAfter = {
    profile: { name: 'Nguyễn An', department: 'Finance', title: 'Manager' },
    active: false,
  };
  readonly nestedOptions: SdAuditDiffOptions = {
    fields: [
      { path: 'profile.department', label: 'Phòng ban', order: 1 },
      { path: 'profile.title', label: 'Chức danh', order: 2 },
      { path: 'active', label: 'Đang hoạt động', order: 3 },
    ],
  };

  readonly linesBefore = {
    lines: [
      { id: 'B', product: 'Bút', quantity: 2 },
      { id: 'A', product: 'Sổ', quantity: 1 },
    ],
  };
  readonly linesAfter = {
    lines: [
      { id: 'A', product: 'Sổ', quantity: 3 },
      { id: 'C', product: 'Kẹp hồ sơ', quantity: 4 },
    ],
  };
  readonly linesOptions: SdAuditDiffOptions = {
    fields: [
      { path: 'lines', arrayKey: 'id' },
      { path: 'lines[].product', label: 'Sản phẩm' },
      { path: 'lines[].quantity', label: 'Số lượng' },
    ],
  };

  readonly securedBefore = { status: 'draft', amount: 1250000, token: 'raw-old-token', password: 'old-secret' };
  readonly securedAfter = { status: 'approved', amount: 1500000, token: 'raw-new-token', password: 'new-secret' };
  readonly securedOptions: SdAuditDiffOptions = {
    redactedValue: '••••••',
    fields: [
      { path: 'status', label: 'Trạng thái', order: 1, enumMap: { draft: 'Bản nháp', approved: 'Đã duyệt' } },
      { path: 'amount', label: 'Ngân sách', order: 2, format: value => `${Number(value).toLocaleString('vi-VN')} ₫` },
      { path: 'token', label: 'API token', order: 3, redacted: true },
      { path: 'password', hidden: true },
    ],
  };

  readonly customBefore = { priority: 'normal' };
  readonly customAfter = { priority: 'urgent' };
  readonly customOptions: SdAuditDiffOptions = {
    fields: [{ path: 'priority', label: 'Độ ưu tiên', enumMap: { normal: 'Bình thường', urgent: 'Khẩn cấp' } }],
  };
}

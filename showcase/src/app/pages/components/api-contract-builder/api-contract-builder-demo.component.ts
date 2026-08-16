import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import {
  sdApiContractCreateSample,
  sdApiContractInvalidSample,
  sdApiContractSearchSample,
  SdApiContractBuilder,
  SD_API_CONTRACT_CONFIGURATION,
  SD_API_CONTRACT_SAMPLE_ENVIRONMENT,
  listSdApiContractSchemaFields,
  type SdApiContract,
  type SdApiContractDiagnostic,
} from '@sdcorejs/angular/components/api-contract-builder';

@Component({
  selector: 'app-api-contract-builder-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdApiContractBuilder],
  // why: provideSdApiContract() trả EnvironmentProviders (dùng ở bootstrap/route). Ở cấp component
  // thì cấp thẳng token — nhờ vậy mỗi demo có thể mang một catalog env khác nhau trên cùng một trang.
  providers: [{ provide: SD_API_CONTRACT_CONFIGURATION, useValue: SD_API_CONTRACT_SAMPLE_ENVIRONMENT }],
  template: `
    <demo-page
      #demoPage
      title="API Contract Builder"
      description="Khai báo, chỉnh sửa và kiểm tra một API contract dạng JSON: input.schema · req · res · output.schema. Component chỉ dựng contract, không gọi HTTP.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-get-tim-kiem-san-pham') {
        <demo-section
          heading="GET tìm kiếm sản phẩm"
          [props]="[
            { name: '[(model)]', value: 'two-way' },
            { name: 'autoId', value: 'demo-search' },
            { name: 'env', value: '\${env.baseUrl} / \${env.token}' }
          ]"
          note="Query map từ input, header Authorization nội suy \${env.token}, output là mảng gốc lấy thẳng \${res.body.items}.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="searchContract" autoId="demo-search"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-post-map-body') {
        <demo-section
          heading="POST map body"
          [props]="[
            { name: '[(model)]', value: 'two-way' },
            { name: 'source', value: '\${input.*} / \${env.*}' },
            { name: 'value', value: 'static' }
          ]"
          note="input.a → req.body.x, input.b → req.body.y, input.c → req.body.z, env.userId → req.body.u, và một literal tĩnh ở req.body.v.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="createContract" autoId="demo-create"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-contract-sai-va-chan-doan') {
        <demo-section
          heading="Contract sai và chẩn đoán"
          [props]="[
            { name: 'diagnosticsChange', value: 'event' },
            { name: 'validChange', value: 'event' }
          ]"
          note="\${env.unknown} chưa khai báo, {id} thiếu req.path, \${input.page} không tồn tại, output mảng trỏ vào một số.">
          <div class="builder-box">
            <sd-api-contract-builder
              [(model)]="invalidContract"
              autoId="demo-invalid"
              (diagnosticsChange)="diagnostics.set($event)"
              (validChange)="valid.set($event)"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ket-qua-chan-doan') {
        <demo-section heading="Kết quả chẩn đoán" note="Giá trị đọc trực tiếp từ hai output của demo phía trên.">
          <div class="result-box">
            <p><strong>valid</strong>: {{ valid() }}</p>
            <ul>
              @for (diagnostic of diagnostics(); track diagnostic.code + diagnostic.path) {
                <li>
                  <code>{{ diagnostic.severity }}</code> · <code>{{ diagnostic.path }}</code> — {{ diagnostic.message }}
                  <code>{{ diagnostic.code }}</code>
                </li>
              }
            </ul>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
        <demo-section
          heading="Chế độ xem"
          [props]="[
            { name: 'mode', value: 'view' },
            { name: 'disabled', value: 'true' }
          ]"
          note="Chế độ xem hiển thị tóm tắt cùng JSON; disabled giữ nguyên các bước nhưng khoá chỉnh sửa.">
          <div class="builder-box">
            <sd-api-contract-builder [model]="searchContract()" mode="view" autoId="demo-view"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-truong-output-cho-dropdown-table') {
        <demo-section
          heading="Trường output cho dropdown / table"
          note="listSdApiContractSchemaFields() làm phẳng mảng gốc — đây chính là dữ liệu form-builder sẽ dùng để chọn valueField / displayField và sinh column.">
          <div class="result-box">
            <ul>
              @for (field of outputFields(); track field.path) {
                <li>
                  <code>{{ field.path }}</code> — <code>{{ field.type }}</code>
                  @if (field.required === true) {
                    <span>· bắt buộc</span>
                  }
                </li>
              }
            </ul>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .builder-box {
        width: 100%;
      }
      .result-box {
        width: 100%;
        font-size: 13px;

        ul {
          margin: 4px 0 0;
          padding-left: 18px;
        }
        code {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiContractBuilderDemoComponent {
  readonly searchContract = signal<SdApiContract | null>(sdApiContractSearchSample());
  readonly createContract = signal<SdApiContract | null>(sdApiContractCreateSample());
  readonly invalidContract = signal<SdApiContract | null>(sdApiContractInvalidSample());

  readonly diagnostics = signal<readonly SdApiContractDiagnostic[]>([]);
  readonly valid = signal(true);

  readonly outputFields = computed(() => {
    const contract = this.searchContract();
    if (!contract) return [];
    return listSdApiContractSchemaFields(contract.output.schema).filter(field => field.leaf);
  });
}

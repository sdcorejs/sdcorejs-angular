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

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ba-che-do-nguon-gia-tri') {
        <demo-section
          heading="Ba chế độ nguồn giá trị"
          [props]="[
            { name: 'mode picker', value: 'source / static / advanced' },
            { name: 'source', value: 'dropdown' }
          ]"
          note="keyword lấy từ nguồn (một dropdown, không gõ \${…}); Authorization là template ghép nên mở ở Nâng cao; version là giá trị tĩnh.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="modesContract" autoId="demo-modes"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-gon-sua-trong-drawer') {
        <demo-section
          heading="Danh sách gọn, sửa trong drawer"
          [props]="[
            { name: 'row', value: 'read-only' },
            { name: 'drawer', value: 'commit on save' },
            { name: 'nested', value: 'breadcrumb' }
          ]"
          note="Mỗi trường là một hàng chỉ để đọc. Bấm hàng hoặc nút Thêm để mở drawer; contract chỉ đổi khi bấm Lưu. Trường object hiện số trường con — bấm vào để đi sâu ngay trong drawer đó, không mở drawer lồng drawer.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="drawerContract" autoId="demo-drawer"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-tinh-theo-kieu-du-lieu') {
        <demo-section
          heading="Giá trị tĩnh theo kiểu dữ liệu"
          [props]="[
            { name: 'static control', value: 'input / number / date / datetime / select / json' }
          ]"
          note="Mỗi kiểu dữ liệu render đúng control của nó; object và array dùng sd-code-editor. Giá trị date/datetime lưu dạng ISO.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="staticContract" autoId="demo-static"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dan-json-de-nap-contract') {
        <demo-section
          heading="Dán JSON để nạp contract"
          [props]="[{ name: 'step', value: 'Kiểm tra' }]"
          note="Sang bước Kiểm tra: nút Copy lấy contract ra, và dán JSON vào chính editor đó để nạp contract mới. JSON sai cú pháp thì contract giữ nguyên và có thêm chẩn đoán contract.invalid.">
          <div class="builder-box">
            <sd-api-contract-builder
              [(model)]="pasteContract"
              autoId="demo-paste"
              (diagnosticsChange)="pasteDiagnostics.set($event)"></sd-api-contract-builder>
          </div>
          <div class="result-box">
            <ul>
              @for (diagnostic of pasteDiagnostics(); track diagnostic.code + diagnostic.path) {
                <li>
                  <code>{{ diagnostic.severity }}</code> · <code>{{ diagnostic.path }}</code> — {{ diagnostic.message }}
                  <code>{{ diagnostic.code }}</code>
                </li>
              }
            </ul>
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

  readonly modesContract = signal<SdApiContract | null>(threeModesSample());
  readonly drawerContract = signal<SdApiContract | null>(nestedInputSample());
  readonly staticContract = signal<SdApiContract | null>(staticTypesSample());
  readonly pasteContract = signal<SdApiContract | null>(sdApiContractSearchSample());

  readonly diagnostics = signal<readonly SdApiContractDiagnostic[]>([]);
  readonly pasteDiagnostics = signal<readonly SdApiContractDiagnostic[]>([]);
  readonly valid = signal(true);

  readonly outputFields = computed(() => {
    const contract = this.searchContract();
    if (!contract) return [];
    return listSdApiContractSchemaFields(contract.output.schema).filter(field => field.leaf);
  });
}

/** Một contract có đủ ba chế độ trên cùng một bước Request, để so sánh cạnh nhau. */
function threeModesSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.req.query = {
    keyword: { type: 'string', source: '${input.keyword}' },
    version: { type: 'string', value: 'v2' },
  };
  contract.req.headers = {
    Authorization: { type: 'string', source: 'Bearer ${env.token}' },
  };
  return contract;
}

/** Một input schema có trường object lồng nhau, để thấy hàng gọn + drill-down trong drawer. */
function nestedInputSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.input.schema = {
    type: 'object',
    properties: {
      keyword: { type: 'string', label: 'Từ khoá' },
      khachHang: {
        type: 'object',
        label: 'Khách hàng',
        properties: {
          ma: { type: 'string', required: true },
          ten: { type: 'string' },
          diaChi: {
            type: 'object',
            properties: {
              tinh: { type: 'string' },
              phuong: { type: 'string' },
            },
          },
        },
      },
    },
  };
  contract.req.query = { keyword: { type: 'string', source: '${input.keyword}' } };
  return contract;
}

/** Mỗi kiểu dữ liệu một giá trị tĩnh, để thấy control tương ứng. */
function staticTypesSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.req.query = {
    ten: { type: 'string', value: 'áo thun' },
    soLuong: { type: 'number', value: 10 },
    conHang: { type: 'boolean', value: true },
    tuNgay: { type: 'date', value: '2026-08-01' },
    denLuc: { type: 'datetime', value: '2026-08-17T08:00:00.000Z' },
    boLoc: { type: 'object', properties: {}, value: { mau: 'đen', size: ['M', 'L'] } },
    nhomIds: { type: 'array', items: { type: 'number' }, value: [1, 2, 3] },
  };
  return contract;
}

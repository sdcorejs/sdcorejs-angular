import{a as e,b as t}from"./chunk-J3S4UFG7.js";var o={"components/anchor":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAnchor, SdAnchorItem } from '@sdcorejs/angular/components/anchor';

@Component({
  selector: 'app-anchor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAnchor, SdAnchorItem],
  template: \`
    <demo-page #demoPage
      title="Anchor"
      description="\u0110i\u1EC1u h\u01B0\u1EDBng scroll-spy d\u1EA1ng c\u1ED9t b\xEAn \u2014 TOC t\u1EF1 highlight khi cu\u1ED9n qua t\u1EEBng section.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anchor-mac-dinh') {
      <demo-section heading="Anchor m\u1EB7c \u0111\u1ECBnh" [props]="[{ name: 'sidebarWidth', value: 'px' }]">
        <div class="anchor-wrap">
          <sd-anchor sidebarWidth="200px">
            <sd-anchor-item title="Th\xF4ng tin chung" icon="person">
              <div class="block">
                <h3>Th\xF4ng tin chung</h3>
                <p>H\u1ECD t\xEAn, email, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i c\u1EE7a nh\xE2n vi\xEAn.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="H\u1EE3p \u0111\u1ED3ng" icon="description">
              <div class="block">
                <h3>H\u1EE3p \u0111\u1ED3ng</h3>
                <p>Lo\u1EA1i h\u1EE3p \u0111\u1ED3ng, ng\xE0y hi\u1EC7u l\u1EF1c v\xE0 c\xE1c \u0111i\u1EC1u kho\u1EA3n \u0111\xEDnh k\xE8m.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Ph\xE2n quy\u1EC1n" icon="lock">
              <div class="block">
                <h3>Ph\xE2n quy\u1EC1n</h3>
                <p>Vai tr\xF2, nh\xF3m quy\u1EC1n \u0111\u01B0\u1EE3c g\xE1n cho t\xE0i kho\u1EA3n.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="L\u1ECBch s\u1EED thao t\xE1c" icon="history">
              <div class="block">
                <h3>L\u1ECBch s\u1EED thao t\xE1c</h3>
                <p>C\xE1c thay \u0111\u1ED5i \u0111\u01B0\u1EE3c ghi nh\u1EADn theo th\u1EDDi gian.</p>
              </div>
            </sd-anchor-item>
          </sd-anchor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-va-cat-ngan-chu') {
      <demo-section heading="M\xE0u v\xE0 c\u1EAFt ng\u1EAFn ch\u1EEF" [props]="[{ name: 'color', value: 'success' }, { name: 'ellipsis', value: 'true' }]">
        <div class="anchor-wrap">
          <sd-anchor color="success" ellipsis sidebarWidth="180px">
            <sd-anchor-item title="B\xE1o c\xE1o doanh thu chi nh\xE1nh qu\xFD 4 n\u0103m 2026" icon="trending_up">
              <div class="block">
                <h3>B\xE1o c\xE1o doanh thu</h3>
                <p>T\u1ED5ng h\u1EE3p doanh thu c\u1EE7a t\u1EA5t c\u1EA3 chi nh\xE1nh trong qu\xFD 4.</p>
              </div>
            </sd-anchor-item>
            <sd-anchor-item title="Ph\xE2n t\xEDch chi ph\xED v\u1EADn h\xE0nh" icon="paid">
              <div class="block">
                <h3>Ph\xE2n t\xEDch chi ph\xED</h3>
                <p>Chi ti\u1EBFt theo t\u1EEBng kho\u1EA3n chi ph\xED.</p>
              </div>
            </sd-anchor-item>
          </sd-anchor>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .anchor-wrap {
      width: 100%;
      height: 360px;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .block {
      height: 320px;
      padding: 12px 16px;
      border-bottom: 1px dashed #d6d6d6;
    }
    .block h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px;
    }
    .block p {
      font-size: 13px;
      color: #555;
      margin: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnchorDemoComponent {}
`,scss:`.anchor-wrap {
  width: 100%;
  height: 360px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}
.block {
  height: 320px;
  padding: 12px 16px;
  border-bottom: 1px dashed #d6d6d6;
}
.block h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px;
}
.block p {
  font-size: 13px;
  color: #555;
  margin: 0;
}`},"components/api-contract-builder":{typescript:`import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
  // why: provideSdApiContract() tr\u1EA3 EnvironmentProviders (d\xF9ng \u1EDF bootstrap/route). \u1EDE c\u1EA5p component
  // th\xEC c\u1EA5p th\u1EB3ng token \u2014 nh\u1EDD v\u1EADy m\u1ED7i demo c\xF3 th\u1EC3 mang m\u1ED9t catalog env kh\xE1c nhau tr\xEAn c\xF9ng m\u1ED9t trang.
  providers: [{ provide: SD_API_CONTRACT_CONFIGURATION, useValue: SD_API_CONTRACT_SAMPLE_ENVIRONMENT }],
  template: \`
    <demo-page
      #demoPage
      title="API Contract Builder"
      description="Khai b\xE1o, ch\u1EC9nh s\u1EEDa v\xE0 ki\u1EC3m tra m\u1ED9t API contract d\u1EA1ng JSON: input.schema \xB7 req \xB7 res \xB7 output.schema. Component ch\u1EC9 d\u1EF1ng contract, kh\xF4ng g\u1ECDi HTTP.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-get-tim-kiem-san-pham') {
        <demo-section
          heading="GET t\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m"
          [props]="[
            { name: '[(model)]', value: 'two-way' },
            { name: 'autoId', value: 'demo-search' },
            { name: 'env', value: '\\\${env.baseUrl} / \\\${env.token}' }
          ]"
          note="Query map t\u1EEB input, header Authorization n\u1ED9i suy \\\${env.token}, output l\xE0 m\u1EA3ng g\u1ED1c l\u1EA5y th\u1EB3ng \\\${res.body.items}.">
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
            { name: 'source', value: '\\\${input.*} / \\\${env.*}' },
            { name: 'value', value: 'static' }
          ]"
          note="input.a \u2192 req.body.x, input.b \u2192 req.body.y, input.c \u2192 req.body.z, env.userId \u2192 req.body.u, v\xE0 m\u1ED9t literal t\u0129nh \u1EDF req.body.v.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="createContract" autoId="demo-create"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-contract-sai-va-chan-doan') {
        <demo-section
          heading="Contract sai v\xE0 ch\u1EA9n \u0111o\xE1n"
          [props]="[
            { name: 'diagnosticsChange', value: 'event' },
            { name: 'validChange', value: 'event' }
          ]"
          note="\\\${env.unknown} ch\u01B0a khai b\xE1o, {id} thi\u1EBFu req.path, \\\${input.page} kh\xF4ng t\u1ED3n t\u1EA1i, output m\u1EA3ng tr\u1ECF v\xE0o m\u1ED9t s\u1ED1.">
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
        <demo-section heading="K\u1EBFt qu\u1EA3 ch\u1EA9n \u0111o\xE1n" note="Gi\xE1 tr\u1ECB \u0111\u1ECDc tr\u1EF1c ti\u1EBFp t\u1EEB hai output c\u1EE7a demo ph\xEDa tr\xEAn.">
          <div class="result-box">
            <p><strong>valid</strong>: {{ valid() }}</p>
            <ul>
              @for (diagnostic of diagnostics(); track diagnostic.code + diagnostic.path) {
                <li>
                  <code>{{ diagnostic.severity }}</code> \xB7 <code>{{ diagnostic.path }}</code> \u2014 {{ diagnostic.message }}
                  <code>{{ diagnostic.code }}</code>
                </li>
              }
            </ul>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
        <demo-section
          heading="Ch\u1EBF \u0111\u1ED9 xem"
          [props]="[
            { name: 'mode', value: 'view' },
            { name: 'disabled', value: 'true' }
          ]"
          note="Ch\u1EBF \u0111\u1ED9 xem hi\u1EC3n th\u1ECB t\xF3m t\u1EAFt c\xF9ng JSON; disabled gi\u1EEF nguy\xEAn c\xE1c b\u01B0\u1EDBc nh\u01B0ng kho\xE1 ch\u1EC9nh s\u1EEDa.">
          <div class="builder-box">
            <sd-api-contract-builder [model]="searchContract()" mode="view" autoId="demo-view"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ba-che-do-nguon-gia-tri') {
        <demo-section
          heading="Ba ch\u1EBF \u0111\u1ED9 ngu\u1ED3n gi\xE1 tr\u1ECB"
          [props]="[
            { name: 'mode picker', value: 'source / static / advanced' },
            { name: 'source', value: 'dropdown' }
          ]"
          note="keyword l\u1EA5y t\u1EEB ngu\u1ED3n (m\u1ED9t dropdown, kh\xF4ng g\xF5 \\\${\u2026}); Authorization l\xE0 template gh\xE9p n\xEAn m\u1EDF \u1EDF N\xE2ng cao; version l\xE0 gi\xE1 tr\u1ECB t\u0129nh.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="modesContract" autoId="demo-modes"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-gon-sua-trong-drawer') {
        <demo-section
          heading="Danh s\xE1ch g\u1ECDn, s\u1EEDa trong drawer"
          [props]="[
            { name: 'row', value: 'read-only' },
            { name: 'drawer', value: 'commit on save' },
            { name: 'nested', value: 'breadcrumb' }
          ]"
          note="M\u1ED7i tr\u01B0\u1EDDng l\xE0 m\u1ED9t h\xE0ng ch\u1EC9 \u0111\u1EC3 \u0111\u1ECDc. B\u1EA5m h\xE0ng ho\u1EB7c n\xFAt Th\xEAm \u0111\u1EC3 m\u1EDF drawer; contract ch\u1EC9 \u0111\u1ED5i khi b\u1EA5m L\u01B0u. Tr\u01B0\u1EDDng object hi\u1EC7n s\u1ED1 tr\u01B0\u1EDDng con \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 \u0111i s\xE2u ngay trong drawer \u0111\xF3, kh\xF4ng m\u1EDF drawer l\u1ED3ng drawer.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="drawerContract" autoId="demo-drawer"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-tinh-theo-kieu-du-lieu') {
        <demo-section
          heading="Gi\xE1 tr\u1ECB t\u0129nh theo ki\u1EC3u d\u1EEF li\u1EC7u"
          [props]="[
            { name: 'static control', value: 'input / number / date / datetime / select / json' }
          ]"
          note="M\u1ED7i ki\u1EC3u d\u1EEF li\u1EC7u render \u0111\xFAng control c\u1EE7a n\xF3; object v\xE0 array d\xF9ng sd-code-editor. Gi\xE1 tr\u1ECB date/datetime l\u01B0u d\u1EA1ng ISO.">
          <div class="builder-box">
            <sd-api-contract-builder [(model)]="staticContract" autoId="demo-static"></sd-api-contract-builder>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dan-json-de-nap-contract') {
        <demo-section
          heading="D\xE1n JSON \u0111\u1EC3 n\u1EA1p contract"
          [props]="[{ name: 'step', value: 'Ki\u1EC3m tra' }]"
          note="Sang b\u01B0\u1EDBc Ki\u1EC3m tra: n\xFAt Copy l\u1EA5y contract ra, v\xE0 d\xE1n JSON v\xE0o ch\xEDnh editor \u0111\xF3 \u0111\u1EC3 n\u1EA1p contract m\u1EDBi. JSON sai c\xFA ph\xE1p th\xEC contract gi\u1EEF nguy\xEAn v\xE0 c\xF3 th\xEAm ch\u1EA9n \u0111o\xE1n contract.invalid.">
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
                  <code>{{ diagnostic.severity }}</code> \xB7 <code>{{ diagnostic.path }}</code> \u2014 {{ diagnostic.message }}
                  <code>{{ diagnostic.code }}</code>
                </li>
              }
            </ul>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-truong-output-cho-dropdown-table') {
        <demo-section
          heading="Tr\u01B0\u1EDDng output cho dropdown / table"
          note="listSdApiContractSchemaFields() l\xE0m ph\u1EB3ng m\u1EA3ng g\u1ED1c \u2014 \u0111\xE2y ch\xEDnh l\xE0 d\u1EEF li\u1EC7u form-builder s\u1EBD d\xF9ng \u0111\u1EC3 ch\u1ECDn valueField / displayField v\xE0 sinh column.">
          <div class="result-box">
            <ul>
              @for (field of outputFields(); track field.path) {
                <li>
                  <code>{{ field.path }}</code> \u2014 <code>{{ field.type }}</code>
                  @if (field.required === true) {
                    <span>\xB7 b\u1EAFt bu\u1ED9c</span>
                  }
                </li>
              }
            </ul>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
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
    \`,
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

/** M\u1ED9t contract c\xF3 \u0111\u1EE7 ba ch\u1EBF \u0111\u1ED9 tr\xEAn c\xF9ng m\u1ED9t b\u01B0\u1EDBc Request, \u0111\u1EC3 so s\xE1nh c\u1EA1nh nhau. */
function threeModesSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.req.query = {
    keyword: { type: 'string', source: '\${input.keyword}' },
    version: { type: 'string', value: 'v2' },
  };
  contract.req.headers = {
    Authorization: { type: 'string', source: 'Bearer \${env.token}' },
  };
  return contract;
}

/** M\u1ED9t input schema c\xF3 tr\u01B0\u1EDDng object l\u1ED3ng nhau, \u0111\u1EC3 th\u1EA5y h\xE0ng g\u1ECDn + drill-down trong drawer. */
function nestedInputSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.input.schema = {
    type: 'object',
    properties: {
      keyword: { type: 'string', label: 'T\u1EEB kho\xE1' },
      khachHang: {
        type: 'object',
        label: 'Kh\xE1ch h\xE0ng',
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
  contract.req.query = { keyword: { type: 'string', source: '\${input.keyword}' } };
  return contract;
}

/** M\u1ED7i ki\u1EC3u d\u1EEF li\u1EC7u m\u1ED9t gi\xE1 tr\u1ECB t\u0129nh, \u0111\u1EC3 th\u1EA5y control t\u01B0\u01A1ng \u1EE9ng. */
function staticTypesSample(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.req.query = {
    ten: { type: 'string', value: '\xE1o thun' },
    soLuong: { type: 'number', value: 10 },
    conHang: { type: 'boolean', value: true },
    tuNgay: { type: 'date', value: '2026-08-01' },
    denLuc: { type: 'datetime', value: '2026-08-17T08:00:00.000Z' },
    boLoc: { type: 'object', properties: {}, value: { mau: '\u0111en', size: ['M', 'L'] } },
    nhomIds: { type: 'array', items: { type: 'number' }, value: [1, 2, 3] },
  };
  return contract;
}
`,scss:`.builder-box {
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
}`},"components/audit-diff":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdAuditDiff, SdAuditDiffOptions, SdAuditDiffValueTemplateDirective } from '@sdcorejs/angular/components/audit-diff';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-audit-diff-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAuditDiff, SdAuditDiffValueTemplateDirective],
  template: \`
    <demo-page
      #demoPage
      title="Audit Diff"
      description="SdAuditDiff \u2013 pure diff engine cho nested object/stable-key array v\xE0 presentation table/detail-list c\xF3 semantic before/after.">
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
          note="Reorder kh\xF4ng sinh diff gi\u1EA3; item th\xEAm/x\xF3a v\u1EABn \u0111i qua rule c\u1EE7a field con.">
          <sd-audit-diff [before]="linesBefore" [after]="linesAfter" [options]="linesOptions" mode="detail-list"></sd-audit-diff>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-format-redact-va-order') {
        <demo-section
          heading="Format, redact v\xE0 order"
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
  \`,
  styles: \`
    .custom-value {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef4ff;
      color: #1849a9;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDiffDemoComponent {
  readonly nestedBefore = {
    profile: { name: 'Nguy\u1EC5n An', department: 'Sales' },
    active: true,
  };
  readonly nestedAfter = {
    profile: { name: 'Nguy\u1EC5n An', department: 'Finance', title: 'Manager' },
    active: false,
  };
  readonly nestedOptions: SdAuditDiffOptions = {
    fields: [
      { path: 'profile.department', label: 'Ph\xF2ng ban', order: 1 },
      { path: 'profile.title', label: 'Ch\u1EE9c danh', order: 2 },
      { path: 'active', label: '\u0110ang ho\u1EA1t \u0111\u1ED9ng', order: 3 },
    ],
  };

  readonly linesBefore = {
    lines: [
      { id: 'B', product: 'B\xFAt', quantity: 2 },
      { id: 'A', product: 'S\u1ED5', quantity: 1 },
    ],
  };
  readonly linesAfter = {
    lines: [
      { id: 'A', product: 'S\u1ED5', quantity: 3 },
      { id: 'C', product: 'K\u1EB9p h\u1ED3 s\u01A1', quantity: 4 },
    ],
  };
  readonly linesOptions: SdAuditDiffOptions = {
    fields: [
      { path: 'lines', arrayKey: 'id' },
      { path: 'lines[].product', label: 'S\u1EA3n ph\u1EA9m' },
      { path: 'lines[].quantity', label: 'S\u1ED1 l\u01B0\u1EE3ng' },
    ],
  };

  readonly securedBefore = { status: 'draft', amount: 1250000, token: 'raw-old-token', password: 'old-secret' };
  readonly securedAfter = { status: 'approved', amount: 1500000, token: 'raw-new-token', password: 'new-secret' };
  readonly securedOptions: SdAuditDiffOptions = {
    redactedValue: '\u2022\u2022\u2022\u2022\u2022\u2022',
    fields: [
      { path: 'status', label: 'Tr\u1EA1ng th\xE1i', order: 1, enumMap: { draft: 'B\u1EA3n nh\xE1p', approved: '\u0110\xE3 duy\u1EC7t' } },
      { path: 'amount', label: 'Ng\xE2n s\xE1ch', order: 2, format: value => \`\${Number(value).toLocaleString('vi-VN')} \u20AB\` },
      { path: 'token', label: 'API token', order: 3, redacted: true },
      { path: 'password', hidden: true },
    ],
  };

  readonly customBefore = { priority: 'normal' };
  readonly customAfter = { priority: 'urgent' };
  readonly customOptions: SdAuditDiffOptions = {
    fields: [{ path: 'priority', label: '\u0110\u1ED9 \u01B0u ti\xEAn', enumMap: { normal: 'B\xECnh th\u01B0\u1EDDng', urgent: 'Kh\u1EA9n c\u1EA5p' } }],
  };
}
`,scss:`.custom-value {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef4ff;
  color: #1849a9;
}`},"components/avatar":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';

@Component({
  selector: 'app-avatar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdAvatar],
  template: \`
    <demo-page #demoPage
      title="Avatar"
      description="\u1EA2nh \u0111\u1EA1i di\u1EC7n tr\xF2n \u2014 t\u1EF1 sinh ch\u1EEF c\xE1i \u0111\u1EA7u v\u1EDBi m\xE0u c\u1ED1 \u0111\u1ECBnh theo t\xEAn khi kh\xF4ng c\xF3 URL \u1EA3nh.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chu-cai-dau-tu-ten') {
      <demo-section heading="Ch\u1EEF c\xE1i \u0111\u1EA7u t\u1EEB t\xEAn" [props]="[{ name: 'src', value: 'initials' }]">
        <div class="row">
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="48"></sd-avatar>
            <span>Nguy\u1EC5n V\u0103n An</span>
          </div>
          <div class="card">
            <sd-avatar src="Tr\u1EA7n Th\u1ECB B\xEDch" [size]="48"></sd-avatar>
            <span>Tr\u1EA7n Th\u1ECB B\xEDch</span>
          </div>
          <div class="card">
            <sd-avatar src="L\xEA Minh Ho\xE0ng" [size]="48"></sd-avatar>
            <span>L\xEA Minh Ho\xE0ng</span>
          </div>
          <div class="card">
            <sd-avatar src="Ph\u1EA1m Qu\u1EF3nh Anh" [size]="48"></sd-avatar>
            <span>Ph\u1EA1m Qu\u1EF3nh Anh</span>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-url') {
      <demo-section heading="\u1EA2nh URL" [props]="[{ name: 'src', value: 'url' }]">
        <div class="row">
          <sd-avatar src="https://i.pravatar.cc/80?img=11" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=22" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=33" [size]="48"></sd-avatar>
          <sd-avatar src="https://i.pravatar.cc/80?img=44" [size]="48"></sd-avatar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-kich-thuoc') {
      <demo-section heading="C\xE1c k\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: '24 / 32 / 48 / 72 / 96' }]">
        <div class="row size-row">
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="24"></sd-avatar>
            <span>24</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="32"></sd-avatar>
            <span>32</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="48"></sd-avatar>
            <span>48</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="72"></sd-avatar>
            <span>72</span>
          </div>
          <div class="card">
            <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="96"></sd-avatar>
            <span>96</span>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-fallback-khi-thieu-du-lieu') {
      <demo-section heading="Fallback khi thi\u1EBFu d\u1EEF li\u1EC7u" [props]="[{ name: 'src', value: 'null / empty' }]">
        <div class="row">
          <sd-avatar [src]="null" [size]="48"></sd-avatar>
          <sd-avatar src="" [size]="48"></sd-avatar>
          <sd-avatar src="?" [size]="48"></sd-avatar>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .size-row { align-items: flex-end; }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #555;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarDemoComponent {}
`,scss:`.row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.size-row { align-items: flex-end; }
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
}`},"components/badge":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { type SdIconSet } from '@sdcorejs/angular/modules/icon';

interface FontSetOption {
  value: SdIconSet;
  display: string;
}

@Component({
  selector: 'app-badge-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdBadge, SdRadio],
  template: \`
    <demo-page #demoPage
      title="Badge"
      description="Nh\xE3n tr\u1EA1ng th\xE1i / s\u1ED1 \u0111\u1EBFm \u2014 c\xF3 3 d\u1EA1ng (type): icon, round, tag.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ba-dang') {
      <demo-section heading="Ba d\u1EA1ng" [props]="[{ name: 'type', value: 'icon / round / tag' }]">
        <sd-badge type="icon" primary icon="check_circle" title="icon"></sd-badge>
        <sd-badge type="round" primary title="round"></sd-badge>
        <sd-badge type="tag" primary icon="label" title="tag"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-fontset-switch') {
      <demo-section
        heading="fontSet switch"
        [props]="[{ name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' }, { name: 'type', value: 'icon / round / tag' }]"
        note="Chon fontSet bang radio de so sanh alignment cua cung mot bo badge icon.">
        <div class="d-flex flex-column gap-16 w-full">
          <sd-radio
            label="fontSet"
            [items]="fontSetOptions"
            valueField="value"
            displayField="display"
            [(model)]="selectedFontSet"
            [form]="fontSetForm"></sd-radio>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="icon" success icon="check_circle" [fontSet]="selectedFontSet()" title="Approved"></sd-badge>
            <sd-badge type="icon" info icon="visibility" [fontSet]="selectedFontSet()" title="Visible"></sd-badge>
            <sd-badge type="icon" warning icon="warning" [fontSet]="selectedFontSet()" title="Warning"></sd-badge>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="round" success icon="check_circle" [fontSet]="selectedFontSet()" title="Round success"></sd-badge>
            <sd-badge type="round" info icon="local_offer" [fontSet]="selectedFontSet()" title="Round offer"></sd-badge>
            <sd-badge type="round" error icon="delete" [fontSet]="selectedFontSet()" title="Round error"></sd-badge>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="tag" primary icon="local_offer" [fontSet]="selectedFontSet()" title="Tag primary"></sd-badge>
            <sd-badge type="tag" warning icon="warning" [fontSet]="selectedFontSet()" title="Tag warning"></sd-badge>
            <sd-badge type="tag" secondary icon="visibility" [fontSet]="selectedFontSet()" title="Tag secondary"></sd-badge>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-round') {
      <demo-section heading="M\xE0u s\u1EAFc round" [props]="[{ name: 'type', value: 'round' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="round" primary title="primary"></sd-badge>
        <sd-badge type="round" secondary title="secondary"></sd-badge>
        <sd-badge type="round" success title="success"></sd-badge>
        <sd-badge type="round" info title="info"></sd-badge>
        <sd-badge type="round" warning title="warning"></sd-badge>
        <sd-badge type="round" error title="error"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-tag') {
      <demo-section heading="M\xE0u s\u1EAFc tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="tag" primary icon="label" title="primary"></sd-badge>
        <sd-badge type="tag" secondary icon="label" title="secondary"></sd-badge>
        <sd-badge type="tag" success icon="label" title="success"></sd-badge>
        <sd-badge type="tag" info icon="label" title="info"></sd-badge>
        <sd-badge type="tag" warning icon="label" title="warning"></sd-badge>
        <sd-badge type="tag" error icon="label" title="error"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-icon') {
      <demo-section heading="M\xE0u s\u1EAFc icon" [props]="[{ name: 'type', value: 'icon' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="icon" primary icon="circle" title="primary"></sd-badge>
        <sd-badge type="icon" secondary icon="circle" title="secondary"></sd-badge>
        <sd-badge type="icon" success icon="circle" title="success"></sd-badge>
        <sd-badge type="icon" info icon="circle" title="info"></sd-badge>
        <sd-badge type="icon" warning icon="circle" title="warning"></sd-badge>
        <sd-badge type="icon" error icon="circle" title="error"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc-round') {
      <demo-section heading="K\xEDch th\u01B0\u1EDBc round" [props]="[{ name: 'type', value: 'round' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" primary title="sm" size="sm"></sd-badge>
        <sd-badge type="round" primary title="md" size="md"></sd-badge>
        <sd-badge type="round" primary title="lg" size="lg"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-round-voi-icon') {
      <demo-section heading="Round v\u1EDBi icon" [props]="[{ name: 'type', value: 'round' }, { name: 'icon', value: 'name' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" success icon="check_circle" title="sm" size="sm"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="md" size="md"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="lg" size="lg"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc-tag') {
      <demo-section heading="K\xEDch th\u01B0\u1EDBc tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="tag" info icon="label" title="sm" size="sm"></sd-badge>
        <sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
        <sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kem-mo-ta') {
      <demo-section heading="K\xE8m m\xF4 t\u1EA3" [props]="[{ name: 'description', value: 'text' }]">
        <sd-badge type="icon" success icon="check_circle" title="title" description="description"></sd-badge>
        <sd-badge type="tag" primary icon="star" title="title" description="description"></sd-badge>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-dem') {
      <demo-section heading="S\u1ED1 \u0111\u1EBFm" [props]="[{ name: 'type', value: 'round' }, { name: 'title', value: 'number' }]">
        <sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
        <sd-badge type="round" error [title]="errorsCount()"></sd-badge>
        <sd-badge type="round" warning title="99+"></sd-badge>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {
  readonly fontSetForm = new FormGroup({});
  readonly selectedFontSet = signal<SdIconSet>('lucide');
  readonly fontSetOptions: FontSetOption[] = [
    { value: 'material-icons', display: 'Material filled' },
    { value: 'material-icons-outlined', display: 'Material outlined' },
    { value: 'lucide', display: 'Lucide' },
  ];

  readonly unreadCount = signal(7);
  readonly errorsCount = signal(3);
}
`},"components/breadcrumb":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdBreadcrumb, SdBreadcrumbItem } from '@sdcorejs/angular/components/breadcrumb';
import { BehaviorSubject } from 'rxjs';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-breadcrumb-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBreadcrumb],
  template: \`
    <demo-page
      #demoPage
      title="Breadcrumb"
      description="SdBreadcrumb \u2013 semantic navigation cho static items ho\u1EB7c route.data.breadcrumb, h\u1ED7 tr\u1EE3 label async v\xE0 overflow.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-tinh') {
        <demo-section
          heading="Danh s\xE1ch t\u0129nh"
          [props]="[
            { name: 'items', value: '6 items' },
            { name: 'maxItems', value: '4' },
          ]"
          note="Root, d\u1EA5u r\xFAt g\u1ECDn v\xE0 context cu\u1ED1i \u0111\u01B0\u1EE3c gi\u1EEF; item disabled kh\xF4ng tr\u1EDF th\xE0nh control t\u01B0\u01A1ng t\xE1c.">
          <sd-breadcrumb [items]="staticItems" [maxItems]="4"></sd-breadcrumb>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-router-generated') {
        <demo-section
          heading="Router-generated"
          [props]="[{ name: 'route.data.breadcrumb', value: 'resolver' }]"
          note="Kh\xF4ng truy\u1EC1n items: component \u0111\u1ECDc primary route chain c\u1EE7a ch\xEDnh trang t\xE0i li\u1EC7u n\xE0y v\xE0 c\u1EADp nh\u1EADt sau NavigationEnd.">
          <sd-breadcrumb></sd-breadcrumb>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhan-async') {
        <demo-section
          heading="Nh\xE3n async"
          [props]="[{ name: 'label', value: 'Observable<string>' }]"
          note="Observable label \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt tr\u1EF1c ti\u1EBFp v\xE0 t\u1EF1 unsubscribe khi source/component b\u1ECB thay th\u1EBF.">
          <sd-breadcrumb [items]="asyncItems"></sd-breadcrumb>
          <button type="button" data-resolve-label (click)="resolveAsyncLabel()">Resolve label</button>
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbDemoComponent {
  readonly #asyncLabel = new BehaviorSubject('\u0110ang t\u1EA3i nh\xE3n');

  readonly staticItems: SdBreadcrumbItem[] = [
    { label: 'Trang ch\u1EE7', icon: 'home', url: '/' },
    { label: 'V\u1EADn h\xE0nh', url: '/operations' },
    { label: '\u0110\u01A1n h\xE0ng', url: '/operations/orders' },
    { label: '\u0110\xE3 l\u01B0u tr\u1EEF', disabled: true },
    { label: 'Th\xE1ng 7', url: '/operations/orders/july' },
    { label: 'ORD-0042' },
  ];

  readonly asyncItems: SdBreadcrumbItem[] = [{ label: '\u0110\u01A1n h\xE0ng', url: '/orders' }, { label: this.#asyncLabel }];

  resolveAsyncLabel(): void {
    this.#asyncLabel.next('\u0110\u01A1n h\xE0ng #42');
  }
}
`},"components/button/example-bang-mau":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-colors-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-colors.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonColorsExampleComponent {}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-bien-the":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-variants-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-variants.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonVariantsExampleComponent {}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-chi-icon":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-icon-only-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-icon-only.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconOnlyExampleComponent {}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-kich-thuoc":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-sizes-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-sizes.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSizesExampleComponent {}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-secondary-vs-black":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-secondary-black-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-secondary-black.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSecondaryBlackExampleComponent {}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-toggle-icon-set-bang-alias":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { type SdIconFontSet } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'app-button-icon-set-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-icon-set.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconSetExampleComponent {
  readonly fontSet = signal<SdIconFontSet>('material-icons-outlined');

  useFontSet(fontSet: SdIconFontSet): void {
    this.fontSet.set(fontSet);
  }
}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/button/example-trang-thai":{typescript:`import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-states-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-states.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonStatesExampleComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly submitting = signal(false);
  #submitTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => clearTimeout(this.#submitTimer));
  }

  onSubmit(): void {
    clearTimeout(this.#submitTimer);
    this.submitting.set(true);
    this.#submitTimer = setTimeout(() => this.submitting.set(false), 1500);
  }
}`,scss:`:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}`},"components/chart":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import {
  SdLineChartComponent,
  SdBarChartComponent,
  SdPieChartComponent,
  SdDoughnutChartComponent,
} from '@sdcorejs/angular/components/chart';

@Component({
  selector: 'app-chart-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdLineChartComponent,
    SdBarChartComponent,
    SdPieChartComponent,
    SdDoughnutChartComponent,
  ],
  template: \`
    <demo-page #demoPage
      title="Chart"
      description="B\u1ED9 bi\u1EC3u \u0111\u1ED3 d\u1EF1a tr\xEAn Chart.js \u2014 line / bar / pie / doughnut. Th\u01B0\u1EDDng d\xF9ng tr\xEAn dashboard v\xE0 b\xE1o c\xE1o.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bieu-do-line') {
      <demo-section heading="Bi\u1EC3u \u0111\u1ED3 Line" [props]="[{ name: 'type', value: 'line' }]">
        <div class="chart-box">
          <sd-line-chart [data]="lineData" [options]="lineOptions"></sd-line-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bieu-do-bar') {
      <demo-section heading="Bi\u1EC3u \u0111\u1ED3 Bar" [props]="[{ name: 'type', value: 'bar' }]">
        <div class="chart-box">
          <sd-bar-chart [data]="barData" [options]="barOptions"></sd-bar-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bieu-do-pie-doughnut') {
      <demo-section heading="Bi\u1EC3u \u0111\u1ED3 Pie & Doughnut" [props]="[{ name: 'type', value: 'pie / doughnut' }]">
        <div class="row">
          <div class="chart-box small">
            <sd-pie-chart [data]="pieData"></sd-pie-chart>
          </div>
          <div class="chart-box small">
            <sd-doughnut-chart [data]="doughnutData"></sd-doughnut-chart>
          </div>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .chart-box {
      width: 100%;
      height: 320px;
    }
    .chart-box.small {
      height: 280px;
      flex: 1;
      min-width: 280px;
    }
    .row {
      display: flex;
      gap: 24px;
      width: 100%;
      flex-wrap: wrap;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDemoComponent {
  readonly lineData: ChartData<'line'> = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [
      {
        label: 'Doanh thu (t\u1EF7 VND)',
        data: [12.5, 14.2, 13.8, 16.4, 18.1, 19.5],
        borderColor: '#005cbb',
        backgroundColor: 'rgba(0, 92, 187, 0.14)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Chi ph\xED (t\u1EF7 VND)',
        data: [9.4, 10.1, 10.6, 11.0, 11.8, 12.3],
        borderColor: '#e64a19',
        backgroundColor: 'rgba(230, 74, 25, 0.10)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  readonly barData: ChartData<'bar'> = {
    labels: ['C\xF4ng ngh\u1EC7', 'Kinh doanh', 'Nh\xE2n s\u1EF1', 'T\xE0i ch\xEDnh', 'Marketing'],
    datasets: [
      {
        label: 'KPI \u0111\u1EA1t \u0111\u01B0\u1EE3c (%)',
        data: [92, 110, 85, 96, 102],
        backgroundColor: ['#005cbb', '#2e7d32', '#f9a825', '#6a1b9a', '#0277bd'],
      },
    ],
  };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly pieData: ChartData<'pie'> = {
    labels: ['Nh\xE2n s\u1EF1', 'Marketing', 'V\u1EADn h\xE0nh', 'Kh\xE1c'],
    datasets: [
      {
        data: [42, 23, 25, 10],
        backgroundColor: ['#005cbb', '#e64a19', '#2e7d32', '#9e9e9e'],
      },
    ],
  };

  readonly doughnutData: ChartData<'doughnut'> = {
    labels: ['Nh\xE2n s\u1EF1', 'Marketing', 'V\u1EADn h\xE0nh', 'Kh\xE1c'],
    datasets: [
      {
        data: [42, 23, 25, 10],
        backgroundColor: ['#005cbb', '#e64a19', '#2e7d32', '#9e9e9e'],
      },
    ],
  };
}
`,scss:`.chart-box {
  width: 100%;
  height: 320px;
}
.chart-box.small {
  height: 280px;
  flex: 1;
  min-width: 280px;
}
.row {
  display: flex;
  gap: 24px;
  width: 100%;
  flex-wrap: wrap;
}`},"components/code-editor":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';

@Component({
  selector: 'app-code-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdCodeEditor],
  template: \`
    <demo-page #demoPage
      title="Code Editor"
      description="Tr\xECnh so\u1EA1n th\u1EA3o m\xE3 ngu\u1ED3n v\u1EDBi highlight c\xFA ph\xE1p (Prism) \u2014 h\u1ED7 tr\u1EE3 TypeScript / JSON / HTML / CSS / SCSS, c\xF3 n\xFAt sao ch\xE9p s\u1EB5n.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ngon-ngu-typescript') {
      <demo-section heading="Ng\xF4n ng\u1EEF TypeScript" [props]="[{ name: 'language', value: 'typescript' }]">
        <div class="code-box">
          <sd-code-editor language="typescript" [(model)]="tsCode" maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem-json') {
      <demo-section heading="Ch\u1EBF \u0111\u1ED9 xem JSON" [props]="[{ name: 'language', value: 'json' }, { name: 'viewed', value: 'true' }]">
        <div class="code-box">
          <sd-code-editor language="json" [model]="jsonValue" [viewed]="true" maxHeight="240px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ngon-ngu-html') {
      <demo-section heading="Ng\xF4n ng\u1EEF HTML" [props]="[{ name: 'language', value: 'html' }]">
        <div class="code-box">
          <sd-code-editor language="html" [(model)]="htmlCode" maxHeight="220px"></sd-code-editor>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .code-box {
      width: 100%;
      max-width: 720px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorDemoComponent {
  readonly tsCode = signal<string>(
    \`interface Employee {
  id: number;
  name: string;
  department: 'TECH' | 'SALES' | 'HR';
}

function isActive(emp: Employee): boolean {
  return emp.id > 0 && !!emp.name;
}\`,
  );

  readonly jsonValue = {
    code: 'HD-2025-0001',
    name: 'H\u1EE3p \u0111\u1ED3ng cung c\u1EA5p d\u1ECBch v\u1EE5 ph\u1EA7n m\u1EC1m',
    amount: 1_280_000_000,
    status: 'ACTIVE',
    items: ['Tri\u1EC3n khai', 'B\u1EA3o h\xE0nh', 'B\u1EA3o tr\xEC'],
  };

  readonly htmlCode = signal<string>(
    \`<section class="invoice">
  <h2>H\xF3a \u0111\u01A1n #HD-2025-0001</h2>
  <p>Kh\xE1ch h\xE0ng: <strong>C\xF4ng ty TNHH ABC</strong></p>
</section>\`,
  );
}
`,scss:`.code-box {
  width: 100%;
  max-width: 720px;
}`},"components/data-state":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-data-state-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDataState, SdDataStateTemplateDirective],
  template: \`
    <demo-page
      #demoPage
      title="Data State"
      description="SdDataState \u2013 presentation nh\u1EA5t qu\xE1n cho loading, empty, error, forbidden v\xE0 success m\xE0 kh\xF4ng tr\u1ED9n v\u1EDBi utilities/data-state.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading') {
        <demo-section heading="Loading" [props]="[{ name: 'compact', value: 'true' }]">
          <sd-data-state state="loading" compact></sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-empty') {
        <demo-section heading="Empty" note="Custom template nh\u1EADn state/retry/action context thay cho default presentation.">
          <sd-data-state state="empty" compact>
            <ng-template sdDataStateTemplate let-state>
              <div class="custom-empty">Custom {{ state }}: ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng ph\xF9 h\u1EE3p.</div>
            </ng-template>
          </sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-error') {
        <demo-section
          heading="Error"
          [props]="[
            { name: 'retryable', value: 'true' },
            { name: 'actionLabel', value: 'M\u1EDF nh\u1EADt k\xFD' },
          ]">
          <sd-data-state state="error" retryable actionLabel="M\u1EDF nh\u1EADt k\xFD" (sdRetry)="onRetry()" (sdAction)="onAction()"> </sd-data-state>
          <div>Retry: {{ retryCount() }} \xB7 Action: {{ actionCount() }}</div>
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
        <demo-section heading="Success" note="Kh\xF4ng c\xF3 presentation wrapper d\u01B0 th\u1EEBa; content \u0111\u01B0\u1EE3c project tr\u1EF1c ti\u1EBFp.">
          <sd-data-state state="success">
            <article data-success>D\u1EEF li\u1EC7u \u0111\xE3 s\u1EB5n s\xE0ng</article>
          </sd-data-state>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
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
  \`,
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
}
`,scss:`.custom-empty,
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
}`},"components/editor":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdEditor } from '@sdcorejs/angular/components/editor';

@Component({
  selector: 'app-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdEditor],
  template: \`
    <demo-page #demoPage
      title="Editor"
      description="Rich text editor d\u1EF1a tr\xEAn CKEditor 5 \u2014 \u0111\u1EA7y \u0111\u1EE7 thanh c\xF4ng c\u1EE5, h\u1ED7 tr\u1EE3 ch\xE8n \u1EA3nh, validation v\xE0 FormGroup binding.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-soan-noi-dung') {
      <demo-section heading="So\u1EA1n n\u1ED9i dung" [props]="[{ name: '[(model)]', value: 'two-way' }]">
        <div class="editor-box">
          <sd-editor
            label="M\xF4 t\u1EA3 chi ti\u1EBFt"
            placeholder="Nh\u1EADp m\xF4 t\u1EA3 s\u1EA3n ph\u1EA9m..."
            helperText="H\u1ED7 tr\u1EE3 \u0111\u1ECBnh d\u1EA1ng \u0111\u1EADm / nghi\xEAng / g\u1EA1ch ch\xE2n / m\xE0u ch\u1EEF."
            height="240px"
            maxHeight="360px"
            [(model)]="content">
          </sd-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-doc') {
      <demo-section heading="Ch\u1EC9 \u0111\u1ECDc" [props]="[{ name: 'readonly', value: 'true' }]">
        <div class="editor-box">
          <sd-editor
            label="\u0110i\u1EC1u kho\u1EA3n d\u1ECBch v\u1EE5"
            height="200px"
            [readonly]="true"
            [(model)]="readOnlyContent">
          </sd-editor>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .editor-box {
      width: 100%;
      max-width: 720px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorDemoComponent {
  readonly content = signal<string>('<p>S\u1EA3n ph\u1EA9m <strong>SP-001</strong> \u0111\u01B0\u1EE3c thi\u1EBFt k\u1EBF d\xE0nh cho doanh nghi\u1EC7p v\u1EEBa v\xE0 nh\u1ECF.</p><ul><li>B\u1EA3o h\xE0nh 12 th\xE1ng</li><li>H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 24/7</li></ul>');
  readonly readOnlyContent = signal<string>('<p><em>B\u1EB1ng vi\u1EC7c s\u1EED d\u1EE5ng d\u1ECBch v\u1EE5, b\u1EA1n \u0111\u1ED3ng \xFD v\u1EDBi c\xE1c \u0111i\u1EC1u kho\u1EA3n sau:</em></p><ol><li>Kh\xF4ng chia s\u1EBB t\xE0i kho\u1EA3n cho b\xEAn th\u1EE9 ba.</li><li>Tu\xE2n th\u1EE7 ch\xEDnh s\xE1ch b\u1EA3o m\u1EADt c\u1EE7a h\u1EC7 th\u1ED1ng.</li></ol>');
}
`,scss:`.editor-box {
  width: 100%;
  max-width: 720px;
}`},"components/form-generic":{typescript:`import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFormBuilder, SdFormGeneric, SdFormRender } from '@sdcorejs/angular/components/form-generic';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

const SEED: SdFormGeneric = {
  variables: [{ id: 'v1', key: 'currentUserId', label: 'Current user id' }],
  components: [
    {
      id: 'c1',
      key: 'customerEmail',
      type: 'textfield',
      label: 'Email kh\xE1ch h\xE0ng',
      helperText: 'D\xF9ng cho th\xF4ng b\xE1o t\xE0i kho\u1EA3n quan tr\u1ECDng.',
      layout: { columns: '12' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c2',
      key: 'firstName',
      type: 'textfield',
      label: 'T\xEAn',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c3',
      key: 'lastName',
      type: 'textfield',
      label: 'H\u1ECD',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c4',
      key: 'birthDate',
      type: 'datetime',
      subtype: 'date',
      label: 'Ng\xE0y sinh',
      layout: { columns: '4' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c5',
      key: 'seats',
      type: 'number',
      label: 'S\u1ED1 ng\u01B0\u1EDDi d\xF9ng',
      layout: { columns: '4' },
      validate: { min: 1, max: 100 },
      properties: {},
    } as any,
    {
      id: 'c6',
      key: 'agreedToTerms',
      type: 'checkbox',
      label: '\u0110\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n',
      layout: { columns: '4' },
      validate: { required: true },
      properties: {},
    } as any,
    {
      id: 'c7',
      key: 'plan',
      type: 'select',
      label: 'G\xF3i d\u1ECBch v\u1EE5',
      layout: { columns: '6' },
      validate: { required: true },
      values: [
        { value: 'free', label: 'Mi\u1EC5n ph\xED' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Doanh nghi\u1EC7p' },
      ],
      properties: {},
    } as any,
    {
      id: 'c8',
      key: 'paymentMethod',
      type: 'radio',
      label: 'Ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n',
      layout: { columns: '6' },
      validate: {},
      values: [
        { value: 'card', label: 'Th\u1EBB' },
        { value: 'wire', label: 'Chuy\u1EC3n kho\u1EA3n' },
      ],
      properties: { direction: 'row' },
    } as any,
    {
      id: 'c9',
      key: 'tags',
      type: 'chip-string',
      label: 'Nh\xE3n n\u1ED9i b\u1ED9',
      layout: { columns: '6' },
      validate: { maxOfItems: 5 },
      properties: {},
    } as any,
    {
      id: 'c10',
      key: 'busyDates',
      type: 'chip-calendar',
      label: 'Ng\xE0y b\u1EADn',
      layout: { columns: '6' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c11',
      key: 'notes',
      type: 'textarea',
      label: 'Ghi ch\xFA n\u1ED9i b\u1ED9',
      layout: { columns: '12' },
      validate: { maxlength: 500 },
      properties: {},
    },
    {
      id: 'c12',
      key: 'summaryHtml',
      type: 'html',
      label: 'HTML t\xF3m t\u1EAFt',
      content: '<strong>Th\xF4ng tin h\u1ED3 s\u01A1</strong><br/>C\xF3 th\u1EC3 k\xE9o th\u1EA3, \u0111\u1ED5i v\u1ECB tr\xED v\xE0 render l\u1EA1i an to\xE0n.',
      layout: { columns: '12' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c13',
      key: 'lineItems',
      type: 'table',
      label: 'D\xF2ng chi ph\xED',
      layout: { columns: '12' },
      validate: {},
      columns: [
        { key: 'name', label: 'T\xEAn', type: 'string' },
        { key: 'quantity', label: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number' },
        { key: 'billable', label: 'T\xEDnh ph\xED', type: 'boolean', displayOnTrue: 'C\xF3', displayOnFalse: 'Kh\xF4ng' },
      ],
      properties: { type: 'inline', titleButtonCreate: 'Th\xEAm d\xF2ng' },
    } as any,
    {
      id: 'g1',
      type: 'group',
      label: '\u0110\u1ECBa ch\u1EC9 giao h\xE0ng',
      layout: { columns: '12' },
      properties: { icon: 'inventory_2', color: 'secondary' },
      components: [
        {
          id: 'g1c1',
          key: 'addressLine',
          type: 'textfield',
          label: 'S\u1ED1 nh\xE0 / \u0110\u01B0\u1EDDng',
          layout: { columns: '12' },
          validate: { required: true },
          properties: {},
        } as any,
        {
          id: 'g1c2',
          key: 'city',
          type: 'textfield',
          label: 'Th\xE0nh ph\u1ED1',
          layout: { columns: '6' },
          validate: {},
          properties: {},
        } as any,
        {
          id: 'g1c3',
          key: 'zipCode',
          type: 'textfield',
          label: 'M\xE3 b\u01B0u ch\xEDnh',
          layout: { columns: '6' },
          validate: { pattern: '\\\\d{5}' },
          properties: {},
        } as any,
      ],
    } as any,
  ],
  // why: badge \u0111\u1EBFm tr\xEAn toolbar ch\u1EC9 hi\u1EC7n khi c\xF3 c\u1EA5u h\xECnh \u2014 seed r\u1ED7ng th\xEC kh\xF4ng c\xF3 g\xEC \u0111\u1EC3 nh\xECn.
  validations: [
    {
      alert: 'warning',
      type: 'function',
      code: 'reviewBeforeSubmit',
    } as any,
  ],
};

const DRAG_DROP_POPUP_SEED: SdFormGeneric = {
  variables: Array.from({ length: 12 }, (_, index) => ({
    id: \`stress-v\${index + 1}\`,
    key: \`approvalValue\${index + 1}\`,
    label: \`Approval value \${index + 1}\`,
  })),
  components: [
    {
      id: 'stress-a',
      key: 'ownerName',
      type: 'textfield',
      label: 'Owner name',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'stress-b',
      key: 'ownerEmail',
      type: 'textfield',
      label: 'Owner email',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'stress-c',
      key: 'contractCode',
      type: 'textfield',
      label: 'Contract code',
      layout: { columns: '4' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'stress-d',
      key: 'contractValue',
      type: 'number',
      label: 'Contract value',
      layout: { columns: '4' },
      validate: { min: 1 },
      properties: {},
    } as any,
    {
      id: 'stress-e',
      key: 'goLiveDate',
      type: 'datetime',
      subtype: 'date',
      label: 'Go-live date',
      layout: { columns: '4' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'stress-f',
      key: 'approvalStatus',
      type: 'select',
      label: 'Approval status',
      layout: { columns: '12' },
      validate: { required: true },
      values: [
        { value: 'draft', label: 'Draft' },
        { value: 'reviewing', label: 'Reviewing' },
        { value: 'approved', label: 'Approved' },
      ],
      properties: {},
    } as any,
    {
      id: 'stress-g',
      key: 'riskNote',
      type: 'textarea',
      label: 'Risk note',
      layout: { columns: '6' },
      validate: { maxlength: 300 },
      properties: {},
    },
    {
      id: 'stress-h',
      key: 'internalNote',
      type: 'textarea',
      label: 'Internal note',
      layout: { columns: '6' },
      validate: { maxlength: 300 },
      properties: {},
    },
    {
      id: 'stress-i',
      type: 'group',
      label: 'Nested review block',
      layout: { columns: '12' },
      properties: { icon: 'fact_check', color: 'primary' },
      components: [
        {
          id: 'stress-i1',
          key: 'reviewer',
          type: 'textfield',
          label: 'Reviewer',
          layout: { columns: '6' },
          validate: {},
          properties: {},
        } as any,
        {
          id: 'stress-i2',
          key: 'reviewLevel',
          type: 'select',
          label: 'Review level',
          layout: { columns: '6' },
          validate: {},
          values: [
            { value: 'l1', label: 'Level 1' },
            { value: 'l2', label: 'Level 2' },
          ],
          properties: {},
        } as any,
      ],
    } as any,
  ],
  validations: [
    {
      alert: 'warning',
      type: 'function',
      code: 'reviewBeforeSubmit',
    } as any,
  ],
};

@Component({
  selector: 'app-form-generic-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormBuilder, SdFormRender, SdButton],
  template: \`
    <demo-page #demoPage
      title="Form Generic"
      description="Dynamic form builder and renderer with schema-safe drag/drop, group detail editing, query-builder conditions, and runtime preview.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-builder-render') {
      <demo-section heading="Builder + Render" [props]="[{ name: 'formGeneric', value: 'SdFormGeneric' }]">
        <div class="row-actions">
          <sd-button type="outline" color="primary" title="\u0110\u1EB7t l\u1EA1i" prefixIcon="restart_alt" (click)="reset()"></sd-button>
          <sd-button type="outline" color="secondary" title="T\u1EA3i form r\u1ED7ng" prefixIcon="layers_clear" (click)="loadEmpty()"></sd-button>
          <sd-button
            type="outline"
            color="primary"
            title="Demo drag/drop + popup"
            prefixIcon="open_with"
            (click)="loadDragDropPopupDemo()"></sd-button>
          <sd-button type="fill" color="primary" title="C\u1EADp nh\u1EADt preview" prefixIcon="visibility" (click)="refreshPreview()"></sd-button>
          <sd-button type="outline" color="primary" title="Xu\u1EA5t JSON" prefixIcon="code" (click)="dumpJson()"></sd-button>
        </div>

        <div class="builder-box">
          <sd-form-builder [formGeneric]="seed()"></sd-form-builder>
        </div>

        <div class="render-preview">
          <div class="render-preview__title">Runtime render t\u1EEB schema hi\u1EC7n t\u1EA1i</div>
          <sd-form-render [configuration]="previewConfig()" [form]="form" [entity]="entity()"></sd-form-render>
        </div>

        @if (output()) {
          <pre class="json">{{ output() }}</pre>
        }
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
      .row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        width: 100%;
      }
      .builder-box {
        width: 100%;
        min-height: 560px;
      }
      .render-preview {
        width: 100%;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      .render-preview__title {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .json {
        width: 100%;
        max-height: 320px;
        overflow: auto;
        background: #f5f5f5;
        padding: 12px;
        border-radius: 6px;
        font-size: 12px;
        margin: 12px 0 0;
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGenericDemoComponent {
  readonly builder = viewChild(SdFormBuilder);
  readonly seed = signal<SdFormGeneric>(structuredClone(SEED));
  readonly preview = signal<SdFormGeneric>(structuredClone(SEED));
  readonly output = signal<string>('');
  readonly form = new FormGroup({});
  readonly entity = signal<Record<string, any>>({
    customerEmail: 'customer@example.com',
    firstName: 'An',
    lastName: 'Nguy\u1EC5n',
    birthDate: '1994-06-25',
    seats: 12,
    agreedToTerms: true,
    plan: 'pro',
    paymentMethod: 'card',
    tags: ['priority', 'enterprise'],
    busyDates: ['2026-06-25'],
    notes: 'Kh\xE1ch h\xE0ng c\u1EA7n onboarding nhanh.',
    addressLine: '12 L\xFD T\u1EF1 Tr\u1ECDng',
    city: 'TP. H\u1ED3 Ch\xED Minh',
    zipCode: '70000',
    lineItems: [
      { name: 'Implementation', quantity: 1, billable: true },
      { name: 'Training', quantity: 2, billable: true },
    ],
  });

  readonly previewConfig = computed(() => ({
    components: this.preview().components,
    variables: this.preview().variables,
    validations: this.preview().validations,
  }));

  reset(): void {
    const fresh = structuredClone(SEED);
    this.seed.set(fresh);
    this.preview.set(structuredClone(fresh));
    this.output.set('');
  }

  loadEmpty(): void {
    const empty = { components: [], variables: [], validations: [] };
    this.seed.set(empty);
    this.preview.set(structuredClone(empty));
    this.output.set('');
  }

  loadDragDropPopupDemo(): void {
    const demo = structuredClone(DRAG_DROP_POPUP_SEED);
    this.seed.set(demo);
    this.preview.set(structuredClone(demo));
    this.output.set('');
  }

  refreshPreview(): void {
    const b = this.builder();
    if (!b) return;
    const form = b.getForm();
    this.preview.set(form);
  }

  dumpJson(): void {
    const b = this.builder();
    if (!b) return;
    const form = b.getForm();
    this.preview.set(form);
    this.output.set(JSON.stringify(form, null, 2));
  }
}
`,scss:`.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  width: 100%;
}
.builder-box {
  width: 100%;
  min-height: 560px;
}
.render-preview {
  width: 100%;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}
.render-preview__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.json {
  width: 100%;
  max-height: 320px;
  overflow: auto;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  margin: 12px 0 0;
}`},"components/history":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdHistoryItem } from '@sdcorejs/angular/components/history';
import type { Color } from '@sdcorejs/utils/models';

// SdHistoryItemType ch\u01B0a \u0111\u01B0\u1EE3c export \u1EDF barrel \u2014 khai b\xE1o l\u1EA1i t\u1EA1i \u0111\xE2y \u0111\u1EC3 tr\xE1nh s\u1EEDa th\u01B0 vi\u1EC7n.
interface SdHistoryItemType {
  title: string;
  status?: { title?: string; color?: Color; icon?: string };
  date?: string;
  actor?: string;
  source?: string;
  description?: string;
}

@Component({
  selector: 'app-history-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHistoryItem],
  template: \`
    <demo-page #demoPage
      title="History"
      description="D\xF2ng th\u1EDDi gian d\u1ECDc hi\u1EC3n th\u1ECB l\u1ECBch s\u1EED thay \u0111\u1ED5i / ph\xEA duy\u1EC7t c\u1EE7a m\u1ED9t b\u1EA3n ghi \u2014 k\xE8m tr\u1EA1ng th\xE1i, th\u1EDDi gian, ng\u01B0\u1EDDi thao t\xE1c.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-luong-phe-duyet') {
      <demo-section heading="Lu\u1ED3ng ph\xEA duy\u1EC7t" [props]="[{ name: 'items', value: '[\u2026]' }]">
        <div class="timeline-box">
          <sd-history [items]="approvalFlow"></sd-history>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lich-su-cap-nhat') {
      <demo-section heading="L\u1ECBch s\u1EED c\u1EADp nh\u1EADt" [props]="[{ name: 'items', value: '[\u2026]' }]" note="L\u1ECBch s\u1EED c\u1EADp nh\u1EADt ng\u1EAFn">
        <div class="timeline-box">
          <sd-history [items]="updateLog"></sd-history>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-timeline-rong') {
      <demo-section heading="Timeline r\u1ED7ng" [props]="[{ name: 'items', value: '[]' }]">
        <div class="timeline-box">
          <sd-history [items]="[]"></sd-history>
          <p class="empty-note">B\u1EA3n ghi ch\u01B0a c\xF3 l\u1ECBch s\u1EED thay \u0111\u1ED5i.</p>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .timeline-box {
      width: 100%;
      max-width: 720px;
    }
    .empty-note {
      color: #6b6b6b;
      font-size: 13px;
      margin: 8px 0 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryDemoComponent {
  readonly approvalFlow: SdHistoryItemType[] = [
    {
      title: 'T\u1EA1o phi\u1EBFu y\xEAu c\u1EA7u',
      status: { title: 'Kh\u1EDFi t\u1EA1o', color: 'info', icon: 'add_circle' },
      date: '2025-05-20T08:15:00Z',
      actor: 'an.nv',
      source: 'Web',
      description: 'Kh\u1EDFi t\u1EA1o phi\u1EBFu y\xEAu c\u1EA7u thanh to\xE1n cho nh\xE0 cung c\u1EA5p ABC.',
    },
    {
      title: 'G\u1EEDi duy\u1EC7t c\u1EA5p 1',
      status: { title: 'Ch\u1EDD duy\u1EC7t', color: 'warning', icon: 'hourglass_top' },
      date: '2025-05-20T09:30:00Z',
      actor: 'an.nv',
      source: 'Web',
    },
    {
      title: 'Ph\xEA duy\u1EC7t c\u1EA5p 1',
      status: { title: '\u0110\xE3 duy\u1EC7t', color: 'success', icon: 'check_circle' },
      date: '2025-05-21T10:05:00Z',
      actor: 'binh.tp',
      source: 'Mobile',
      description: '\u0110\u1ED3ng \xFD theo \u0111\u1EC1 ngh\u1ECB, chuy\u1EC3n sang c\u1EA5p 2.',
    },
    {
      title: 'T\u1EEB ch\u1ED1i c\u1EA5p 2',
      status: { title: 'T\u1EEB ch\u1ED1i', color: 'error', icon: 'cancel' },
      date: '2025-05-22T14:18:00Z',
      actor: 'cuong.lh',
      source: 'Web',
      description: '\u0110\u1EC1 ngh\u1ECB b\u1ED5 sung h\xF3a \u0111\u01A1n g\u1ED1c v\xE0 bi\xEAn b\u1EA3n nghi\u1EC7m thu tr\u01B0\u1EDBc khi duy\u1EC7t l\u1EA1i.',
    },
  ];

  readonly updateLog: SdHistoryItemType[] = [
    {
      title: 'C\u1EADp nh\u1EADt th\xF4ng tin kh\xE1ch h\xE0ng',
      date: '2025-05-15T11:20:00Z',
      actor: 'hoa.lt',
      source: 'API',
    },
    {
      title: '\u0110\u1ED3ng b\u1ED9 l\u1EA1i t\u1EEB CRM',
      date: '2025-05-10T07:00:00Z',
      actor: 'system',
      source: 'Job',
    },
  ];
}
`,scss:`.timeline-box {
  width: 100%;
  max-width: 720px;
}
.empty-note {
  color: #6b6b6b;
  font-size: 13px;
  margin: 8px 0 0;
}`},"components/icon":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface IconDemoItem {
  name: string;
  label: string;
}

@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdIcon],
  template: \`
    <demo-page #demoPage title="Icon" description="SdIcon is the Core UI icon facade for Material filled, Material outlined, and Lucide SVG icons.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-material-filled') {
      <demo-section heading="Material filled" [props]="[{ name: 'set', value: 'material-icons' }]">
        @for (icon of materialIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="material-icons" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-material-outlined') {
      <demo-section heading="Material outlined" [props]="[{ name: 'set', value: 'material-icons-outlined' }]">
        @for (icon of materialIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="material-icons-outlined" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lucide-explicit') {
      <demo-section heading="Lucide explicit" [props]="[{ name: 'set', value: 'lucide' }]">
        @for (icon of lucideIcons; track icon.name) {
          <span class="icon-demo-item">
            <sd-icon [name]="icon.name" set="lucide" size="lg" [ariaLabel]="icon.label"></sd-icon>
            <span>{{ icon.name }}</span>
          </span>
        }
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sizes') {
      <demo-section heading="Sizes" [props]="[{ name: 'size', value: 'sm / md / lg / CSS string' }]">
        @for (size of sizes; track size) {
          <span class="icon-demo-size">
            <sd-icon name="search" set="lucide" [size]="size" ariaLabel="Search"></sd-icon>
            <span>{{ size }}</span>
          </span>
        }
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-button-integration') {
      <demo-section
        heading="Button integration"
        [props]="[{ name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' }]">
        <sd-button type="fill" color="primary" title="Material" prefixIcon="add" fontSet="material-icons"></sd-button>
        <sd-button type="light" color="primary" title="Outlined" prefixIcon="save" fontSet="material-icons-outlined"></sd-button>
        <sd-button type="outline" color="error" title="Lucide" prefixIcon="delete" fontSet="lucide"></sd-button>
        <sd-button type="text" color="secondary" title="More" suffixIcon="more_vert" fontSet="lucide"></sd-button>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
      .icon-demo-item,
      .icon-demo-size {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 132px;
        padding: 8px 10px;
        border: 1px solid #e6e6e6;
        border-radius: 8px;
        background: #ffffff;
        color: #1f2937;
        font-size: 13px;
      }

      .icon-demo-size {
        min-width: 88px;
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconDemoComponent {
  readonly materialIcons: IconDemoItem[] = [
    { name: 'add', label: 'Add' },
    { name: 'edit', label: 'Edit' },
    { name: 'delete', label: 'Delete' },
    { name: 'save', label: 'Save' },
    { name: 'visibility', label: 'View' },
    { name: 'more_vert', label: 'More' },
  ];

  readonly lucideIcons: IconDemoItem[] = [
    { name: 'add', label: 'Add' },
    { name: 'edit', label: 'Edit' },
    { name: 'delete', label: 'Delete' },
    { name: 'save', label: 'Save' },
    { name: 'visibility', label: 'View' },
    { name: 'more_vert', label: 'More' },
    { name: 'warning', label: 'Warning' },
    { name: 'keyboard_arrow_down', label: 'Expand' },
  ];

  readonly sizes = ['sm', 'md', 'lg', '28px'];
}
`,scss:`.icon-demo-item,
.icon-demo-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 132px;
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  font-size: 13px;
}

.icon-demo-size {
  min-width: 88px;
}`},"components/icon-configuration":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SD_ICON_CONFIGURATION, resolveSdIconConfig, SdIcon, type SdIconFontSet } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface FontSetOption {
  value: SdIconFontSet;
  display: string;
}

interface DepartmentOption {
  value: string;
  display: string;
}

interface ProductRow {
  code: string;
  name: string;
  category: string;
  stock: number;
}

const FONT_SET_OPTIONS: FontSetOption[] = [
  { value: 'material-icons', display: 'Material filled' },
  { value: 'material-icons-outlined', display: 'Material outlined' },
  { value: 'lucide', display: 'Lucide' },
];

const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  { value: 'OPS', display: 'Operations' },
  { value: 'SALE', display: 'Sales' },
  { value: 'CS', display: 'Customer success' },
];

const PRODUCTS: ProductRow[] = [
  { code: 'SKU-001', name: 'Warehouse scanner', category: 'Hardware', stock: 12 },
  { code: 'SKU-002', name: 'Packing label', category: 'Supply', stock: 4 },
  { code: 'SKU-003', name: 'Delivery tablet', category: 'Hardware', stock: 8 },
];

@Component({
  selector: 'app-icon-configuration-preview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SdButton, SdIcon, SdInput, SdSelect, SdTable],
  template: \`
    <div class="icon-config-preview">
      <section class="icon-config-preview__block">
        <h3>Primitive icons</h3>
        <div class="icon-config-row">
          <span class="icon-config-token"><sd-icon name="add" size="lg"></sd-icon><span>add</span></span>
          <span class="icon-config-token"><sd-icon name="visibility" size="lg"></sd-icon><span>visibility</span></span>
          <span class="icon-config-token"><sd-icon name="delete" size="lg"></sd-icon><span>delete</span></span>
          <span class="icon-config-token"><sd-icon name="keyboard_arrow_down" size="lg"></sd-icon><span>arrow</span></span>
        </div>
        <div class="icon-config-row">
          <sd-button type="fill" color="primary" prefixIcon="add" title="Create"></sd-button>
          <sd-button type="light" color="secondary" suffixIcon="more_vert" title="More"></sd-button>
        </div>
      </section>

      <section class="icon-config-preview__block">
        <h3>Input and dropdown</h3>
        <div class="icon-config-form">
          <sd-input
            label="Search keyword"
            helperText="The helper, clear, and error icons use default fontSet"
            [(model)]="keyword"
            [form]="form"
            hideInlineError>
          </sd-input>
          <sd-select
            [items]="departments"
            valueField="value"
            displayField="display"
            label="Department"
            helperText="Open the dropdown to compare the suffix/search icons"
            [(model)]="department"
            [form]="form">
          </sd-select>
        </div>
      </section>

      <section class="icon-config-preview__block icon-config-preview__block--wide">
        <h3>Table</h3>
        <sd-table [option]="tableOption"></sd-table>
      </section>
    </div>
  \`,
  styles: [\`
    :host {
      display: block;
      width: 100%;
    }

    .icon-config-preview {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) minmax(280px, 1fr);
      gap: 16px;
      width: 100%;
      align-items: start;
    }

    .icon-config-preview__block {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .icon-config-preview__block--wide {
      grid-column: 1 / -1;
    }

    .icon-config-preview h3 {
      margin: 0;
      color: #1f2937;
      font-size: 14px;
      font-weight: 600;
    }

    .icon-config-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .icon-config-token {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 124px;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #1f2937;
      font-size: 13px;
    }

    .icon-config-form {
      width: min(100%, 360px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (max-width: 820px) {
      .icon-config-preview {
        grid-template-columns: 1fr;
      }
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewComponent {
  readonly form = new FormGroup({});
  readonly keyword = signal<string | null>('scanner');
  readonly department = signal<string | null>('OPS');
  readonly departments = DEPARTMENT_OPTIONS;

  readonly tableOption: SdTableOption<ProductRow> = {
    type: 'local',
    key: 'showcase-icon-configuration-table',
    items: () => PRODUCTS,
    index: { enabled: true },
    rowReorder: { enabled: true },
    export: { visible: 'ALL' },
    filter: { hideInlineFilter: false },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'View', click: row => alert(\`View \${row.code}\`) },
        { icon: 'edit', title: 'Edit', click: row => alert(\`Edit \${row.code}\`) },
        { icon: 'delete', title: 'Delete', color: 'error', click: row => alert(\`Delete \${row.code}\`) },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Code', width: '130px', filter: { default: '' } },
      { field: 'name', type: 'string', title: 'Product', width: '260px', filter: { default: '' } },
      { field: 'category', type: 'string', title: 'Category', width: '150px' },
      { field: 'stock', type: 'number', title: 'Stock', width: '120px', align: 'right' },
    ],
    style: { shadow: true, maxHeight: '320px' },
  };
}

@Component({
  selector: 'app-icon-configuration-preview-material-filled',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'material-icons' }) }],
  template: \`<app-icon-configuration-preview></app-icon-configuration-preview>\`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewMaterialFilledComponent {}

@Component({
  selector: 'app-icon-configuration-preview-material-outlined',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'material-icons-outlined' }) }],
  template: \`<app-icon-configuration-preview></app-icon-configuration-preview>\`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewMaterialOutlinedComponent {}

@Component({
  selector: 'app-icon-configuration-preview-lucide',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'lucide' }) }],
  template: \`<app-icon-configuration-preview></app-icon-configuration-preview>\`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewLucideComponent {}

@Component({
  selector: 'app-icon-configuration-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    FormsModule,
    ReactiveFormsModule,
    SdRadio,
    IconConfigurationPreviewMaterialFilledComponent,
    IconConfigurationPreviewMaterialOutlinedComponent,
    IconConfigurationPreviewLucideComponent,
  ],
  template: \`
    <demo-page #demoPage
      title="Icon Configuration"
      description="Switch defaultFontSet in SdIcon configuration and compare how Core UI icons render in table, input, and dropdown controls.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-configuration') {
      <demo-section
        heading="Configuration"
        [props]="[{ name: 'provideSdIcon', value: 'defaultFontSet: ' + selectedFontSet() }]"
        note="Controls below do not pass fontSet directly; they inherit the value from SD_ICON_CONFIGURATION.">
        <div class="icon-config-toolbar">
          <sd-radio
            label="defaultFontSet"
            [items]="fontSetOptions"
            valueField="value"
            displayField="display"
            [(model)]="selectedFontSet"
            [form]="form">
          </sd-radio>

          <code class="icon-config-snippet">provideSdIcon(&#123; defaultFontSet: '{{ selectedFontSet() }}' &#125;)</code>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-core-ui-preview') {
      <demo-section
        heading="Core UI preview"
        [props]="[{ name: 'defaultFontSet', value: selectedFontSet() }]"
        note="Change the radio and compare primitive icons, SdInput helper/clear icons, SdSelect suffix/search icons, and SdTable command/export/reorder icons.">
        @switch (selectedFontSet()) {
          @case ('material-icons') {
            <app-icon-configuration-preview-material-filled></app-icon-configuration-preview-material-filled>
          }
          @case ('lucide') {
            <app-icon-configuration-preview-lucide></app-icon-configuration-preview-lucide>
          }
          @default {
            <app-icon-configuration-preview-material-outlined></app-icon-configuration-preview-material-outlined>
          }
        }
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .icon-config-toolbar {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .icon-config-snippet {
      max-width: 100%;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f8fafc;
      color: #1f2937;
      font-size: 12px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationDemoComponent {
  readonly form = new FormGroup({});
  readonly selectedFontSet = signal<SdIconFontSet>('material-icons-outlined');
  readonly fontSetOptions = FONT_SET_OPTIONS;
}
`,scss:`.icon-config-toolbar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.icon-config-snippet {
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  color: #1f2937;
  font-size: 12px;
  white-space: normal;
  overflow-wrap: anywhere;
}`},"components/import-excel":{typescript:`import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdImportExcel,
  SdImportExcelOption,
  SdImportExcelValidation,
} from '@sdcorejs/angular/components/import-excel';

interface EmployeeRow {
  code: string;
  fullName: string;
  age: number;
  department: string;
  joinDate: Date;
  isActive: boolean;
  skills: string[];
}

@Component({
  selector: 'app-import-excel-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdImportExcel],
  template: \`
    <demo-page #demoPage
      title="Import Excel"
      description="Quy tr\xECnh import Excel \u0111\u1EA7y \u0111\u1EE7 \u2014 t\u1EA3i m\u1EABu, upload file, validate theo d\xF2ng & ch\xE9o d\xF2ng, preview c\xE1c d\xF2ng OK / c\u1EA3nh b\xE1o / l\u1ED7i, xu\u1EA5t file l\u1ED7i v\xE0 tr\u1EA3 v\u1EC1 d\u1EEF li\u1EC7u h\u1EE3p l\u1EC7.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-import-nhan-vien') {
      <demo-section heading="Import nh\xE2n vi\xEAn" [props]="[{ name: 'option', value: 'config' }, { name: 'columns', value: 'def' }]">
        <p class="hint">B\u1EA5m n\xFAt b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 m\u1EDF modal import. C\xF3 th\u1EC3 b\u1EA5m "T\u1EA3i file m\u1EABu" trong modal \u0111\u1EC3 t\u1EA3i template Excel.</p>
        <sd-button
          type="fill"
          color="primary"
          title="M\u1EDF Import Excel"
          prefixIcon="upload_file"
          (click)="excelModal()?.open()">
        </sd-button>
        <sd-import-excel [option]="employeeImport" #excelModalRef></sd-import-excel>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .hint {
      font-size: 13px;
      color: #6b6b6b;
      margin: 0 0 8px;
      width: 100%;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExcelDemoComponent {
  readonly excelModal = viewChild<SdImportExcel>('excelModalRef');

  readonly employeeImport: SdImportExcelOption<EmployeeRow> = {
    title: 'Nh\u1EADp li\u1EC7u Nh\xE2n vi\xEAn',
    fileName: 'Mau_Import_NhanVien',
    limit: 1000,
    columns: [
      { field: 'code', title: 'M\xE3 NV', type: 'string', width: '120px', required: true, maxlength: 10 },
      { field: 'fullName', title: 'H\u1ECD v\xE0 t\xEAn', type: 'string', width: '220px', required: true },
      { field: 'age', title: 'Tu\u1ED5i', type: 'number', width: '80px', required: true, min: 18, max: 65 },
      {
        field: 'department',
        title: 'Ph\xF2ng ban',
        type: 'values',
        width: '150px',
        values: ['IT', 'HR', 'Sale', 'Marketing'],
        checkValueInArray: true,
      },
      {
        field: 'joinDate',
        title: 'Ng\xE0y v\xE0o l\xE0m',
        type: 'date',
        width: '150px',
        format: 'dd/MM/yyyy',
        required: true,
      },
      { field: 'isActive', title: '\u0110ang l\xE0m vi\u1EC7c', type: 'bool', width: '120px' },
      {
        field: 'skills',
        title: 'K\u1EF9 n\u0103ng',
        type: 'array',
        width: '260px',
        divideString: ',',
        unitString: 'k\u1EF9 n\u0103ng',
      },
    ],
    validateItem: async (item, index, allItems): Promise<SdImportExcelValidation> => {
      const duplicateCount = allItems.filter(i => (i as EmployeeRow).code === item.code).length;
      if (duplicateCount > 1) {
        return { idx: index, errorMessage: \`M\xE3 nh\xE2n vi\xEAn <strong>\${item.code}</strong> b\u1ECB tr\xF9ng l\u1EB7p.\` };
      }
      if (item.age && item.age < 22) {
        return { idx: index, warningMessage: 'Nh\xE2n vi\xEAn tr\u1EBB (< 22 tu\u1ED5i) c\u1EA7n \u0111\xE0o t\u1EA1o th\xEAm.' };
      }
      return { idx: index };
    },
    accept: items => {
      alert(\`\u0110\xE3 nh\u1EADn \${items.length} d\xF2ng d\u1EEF li\u1EC7u h\u1EE3p l\u1EC7!\`);
      return [];
    },
  };
}
`,scss:`.hint {
  font-size: 13px;
  color: #6b6b6b;
  margin: 0 0 8px;
  width: 100%;
}`},"components/inform":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInform, SdInformActionDirective } from '@sdcorejs/angular/components/inform';

const LONG = \`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec semper nunc in faucibus dictum. Suspendisse interdum tempor est, vitae rutrum mauris gravida vitae. Praesent mattis libero id consequat imperdiet. Donec egestas, purus at ultricies condimentum, nulla nisi pulvinar.\`;

@Component({
  selector: 'app-inform-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInform, SdInformActionDirective],
  template: \`
    <demo-page #demoPage
      title="Inform"
      description="Banner / alert neo tr\xEAn page \u2014 b\xE1o l\u1ED7i, c\u1EA3nh b\xE1o, th\xF4ng tin. 6 m\xE0u, \u0111\xF3ng \u0111\u01B0\u1EE3c, action, line-clamp.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau') {
      <demo-section heading="B\u1EA3ng m\xE0u" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]">
        <sd-inform primary title="primary" description="Message body."></sd-inform>
        <sd-inform secondary title="secondary" description="Message body."></sd-inform>
        <sd-inform info title="info" description="Message body."></sd-inform>
        <sd-inform success title="success" description="Message body."></sd-inform>
        <sd-inform warning title="warning" description="Message body."></sd-inform>
        <sd-inform error title="error" description="Message body."></sd-inform>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dong-duoc-action') {
      <demo-section heading="\u0110\xF3ng \u0111\u01B0\u1EE3c + action" [props]="[{ name: 'closable', value: 'true' }, { name: 'actionLabel', value: 'text' }]">
        <sd-inform error closable title="Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u" description="M\xE1y ch\u1EE7 kh\xF4ng ph\u1EA3n h\u1ED3i." actionLabel="Th\u1EED l\u1EA1i"></sd-inform>
        <sd-inform info closable title="B\u1EA3n nh\xE1p \u0111\xE3 l\u01B0u" description="T\u1EF1 \u0111\u1ED9ng l\u01B0u l\xFAc 14:30." actionLabel="Xem"></sd-inform>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-an-icon') {
      <demo-section heading="\u1EA8n icon" [props]="[{ name: 'hideIcon', value: 'true' }]">
        <sd-inform success hideIcon title="\u0110\xE3 l\u01B0u" description="Kh\xF4ng c\xF3 icon."></sd-inform>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-line-clamp') {
      <demo-section heading="Line-clamp" [props]="[{ name: 'lineClamp', value: '[s\u1ED1]' }]">
        <sd-inform info title="\u0110i\u1EC1u kho\u1EA3n" [description]="long" [lineClamp]="3"></sd-inform>
        <sd-inform success [description]="long" [lineClamp]="2"></sd-inform>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-action-custom-projection') {
      <demo-section heading="Action custom (projection)" [props]="[{ name: 'sdInformAction', value: 'template' }]">
        <sd-inform warning title="Ch\u1EBF \u0111\u1ED9 ch\u1EC9 \u0111\u1ECDc" description="B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa.">
          <button sdInformAction class="demo-action-btn">Y\xEAu c\u1EA7u quy\u1EC1n</button>
        </sd-inform>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section > * { display: block; margin-bottom: 12px; }
    .demo-action-btn { border: none; background: none; color: inherit; cursor: pointer; padding: 0; text-decoration: underline; }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformDemoComponent {
  readonly long = LONG;
}
`,scss:`:host ::ng-deep demo-section > * { display: block; margin-bottom: 12px; }
.demo-action-btn { border: none; background: none; color: inherit; cursor: pointer; padding: 0; text-decoration: underline; }`},"components/job-progress":{typescript:`import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SdJobProgress } from '@sdcorejs/angular/components/job-progress';
import { SdTaskService, SdTaskState } from '@sdcorejs/angular/services/task';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-job-progress-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdJobProgress],
  template: \`
    <demo-page
      #demoPage
      title="Job Progress"
      description="SdJobProgress \u2013 progress presentation c\xF3 ARIA \u0111\u1EA7y \u0111\u1EE7, nh\u1EADn direct state ho\u1EB7c task ID m\xE0 kh\xF4ng ph\u1EE5 thu\u1ED9c backend.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-determinate-bar') {
        <demo-section
          heading="Determinate bar"
          [props]="[
            { name: 'mode', value: 'bar' },
            { name: 'progress', value: determinateState().progress },
          ]">
          <sd-job-progress [state]="determinateState()" (sdCancel)="cancelDirect()"></sd-job-progress>
          <button type="button" (click)="advanceDirect()">Ti\u1EBFn th\xEAm 10%</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-indeterminate-compact') {
        <demo-section
          heading="Indeterminate compact"
          [props]="[
            { name: 'mode', value: 'compact' },
            { name: 'aria-valuenow', value: 'omitted' },
          ]">
          <sd-job-progress [state]="{ id: 'queued', status: 'queued', title: '\u0110ang ch\u1EDD t\xE0i nguy\xEAn' }" mode="compact"></sd-job-progress>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-details-va-error') {
        <demo-section heading="Details v\xE0 error" [props]="[{ name: 'mode', value: 'details' }]">
          <sd-job-progress
            [state]="{
              id: 'failed',
              status: 'failed',
              title: '\u0110\u1ED3ng b\u1ED9 d\u1EEF li\u1EC7u',
              message: 'T\xE1c v\u1EE5 gi\u1EEF l\u1EA1i context \u0111\u1EC3 th\u1EED l\u1EA1i',
              error: 'M\xE1y ch\u1EE7 t\u1EA1m th\u1EDDi kh\xF4ng ph\u1EA3n h\u1ED3i',
            }"
            mode="details"
            (sdRetry)="retryCount.update(increment)"></sd-job-progress>
          <p data-retry-count>Retry events: {{ retryCount() }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-registry-binding') {
        <demo-section
          heading="Registry binding"
          [props]="[
            { name: 'taskId', value: 'showcase-component-task' },
            { name: 'automatic actions', value: 'cancel/retry' },
          ]">
          <sd-job-progress taskId="showcase-component-task" mode="details"></sd-job-progress>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    button {
      margin-top: 8px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobProgressDemoComponent {
  readonly #tasks = inject(SdTaskService);
  readonly increment = (value: number): number => value + 1;
  readonly retryCount = signal(0);
  readonly determinateState = signal<SdTaskState>({
    id: 'direct-export',
    status: 'running',
    progress: 45,
    title: 'T\u1EA1o t\u1EC7p xu\u1EA5t',
  });
  readonly registryTask = this.#tasks.watch({
    id: 'showcase-component-task',
    initialState: {
      id: 'showcase-component-task',
      status: 'running',
      progress: 72,
      title: 'X\u1EED l\xFD n\u1EC1n',
      message: 'State \u0111\u01B0\u1EE3c \u0111\u1ECDc tr\u1EF1c ti\u1EBFp t\u1EEB registry',
    },
    source: { mode: 'manual', cancel: () => undefined },
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.registryTask.destroy());
  }

  advanceDirect(): void {
    this.determinateState.update(state => {
      const progress = Math.min(100, (state.progress ?? 0) + 10);
      return { ...state, progress, status: progress === 100 ? 'succeeded' : 'running' };
    });
  }

  cancelDirect(): void {
    this.determinateState.update(state => ({ ...state, status: 'cancelled' }));
  }
}
`,scss:`button {
  margin-top: 8px;
}`},"components/mini-editor":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdMiniEditor, SdMiniEditorOption } from '@sdcorejs/angular/components/mini-editor';

@Component({
  selector: 'app-mini-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdMiniEditor, FormsModule],
  template: \`
    <demo-page #demoPage
      title="Mini Editor"
      description="Editor \u0111\u01A1n gi\u1EA3n (bold / italic / link / list) d\xE0nh cho \xF4 comment, ghi ch\xFA ng\u1EAFn. H\u1ED7 tr\u1EE3 mention v\xE0 xu\u1EA5t HTML ho\u1EB7c Markdown.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-dau-ra-html') {
      <demo-section heading="\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra HTML" [props]="[{ name: 'outputFormat', value: 'html' }]">
        <div class="editor-box">
          <sd-mini-editor
            [option]="commentOption"
            [(ngModel)]="commentContent">
          </sd-mini-editor>
          <p class="hint">\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra: HTML</p>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-dau-ra-markdown') {
      <demo-section heading="\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra Markdown" [props]="[{ name: 'outputFormat', value: 'markdown' }]">
        <div class="editor-box">
          <sd-mini-editor
            [option]="markdownOption"
            [(ngModel)]="markdownContent">
          </sd-mini-editor>
          <p class="hint">\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra: Markdown</p>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .editor-box {
      width: 100%;
      max-width: 560px;
    }
    .hint {
      margin: 6px 0 0;
      font-size: 12px;
      color: #6b6b6b;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniEditorDemoComponent {
  readonly commentOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Nh\u1EADp b\xECnh lu\u1EADn c\u1EE7a b\u1EA1n...',
    maxHeight: '160px',
  };

  readonly markdownOption: SdMiniEditorOption = {
    outputFormat: 'markdown',
    placeholder: 'Ghi ch\xFA (Markdown)...',
    maxHeight: '160px',
  };

  commentContent = '<p>\u0110\u1ED3ng \xFD v\u1EDBi <strong>\u0111\u1EC1 xu\u1EA5t</strong> tr\xEAn!</p>';
  markdownContent = '**L\u01B0u \xFD:** \u0110\xE2y l\xE0 ghi ch\xFA Markdown.';
}
`,scss:`.editor-box {
  width: 100%;
  max-width: 560px;
}
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b6b6b;
}`},"components/modal":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-modal-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdModal, SdSection, SdSectionItem],
  template: \`
    <demo-page #demoPage
      title="Modal"
      description="Dialog va bottom-sheet dung chung slot sdHeaderLeft/sdHeaderRight/sdFooterLeft/sdFooterRight. Body mac dinh padding 0 de consumer tu quyet dinh layout.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-basic-modal-footer-right') {
      <demo-section heading="Basic modal + footer right" [props]="[{ name: 'sdFooterRight', value: 'template' }, { name: 'body padding', value: 0 }]">
        <sd-button type="fill" color="primary" prefixIcon="info" title="Open detail" (click)="basic.open()"></sd-button>

        <sd-modal #basic title="Customer detail" width="md">
          <div class="demo-stack">
            <sd-section icon="person" title="Profile">
              <sd-section-item label="Name">Nguyen Van An</sd-section-item>
              <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
              <sd-section-item label="Status">
                <sd-badge type="round" success title="Active"></sd-badge>
              </sd-section-item>
            </sd-section>
          </div>

          <sd-button sdFooterRight type="fill" color="primary" title="Close" (click)="basic.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-confirm-modal-split-footer') {
      <demo-section heading="Confirm modal + split footer" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
        <sd-button type="fill" color="error" prefixIcon="delete" title="Delete record" (click)="confirm.open()"></sd-button>

        <sd-modal #confirm title="Delete customer" width="sm">
          <div class="demo-stack">
            <p class="demo-copy">Delete <strong>Nguyen Van An</strong>? This action cannot be undone.</p>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Cancel" (click)="confirm.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="error" title="Delete" prefixIcon="delete" (click)="confirm.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-header-left-right') {
      <demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
        <sd-button type="light" color="primary" prefixIcon="history" title="Open activity" (click)="activity.open()"></sd-button>

        <sd-modal #activity title="Activity log" width="lg">
          <div sdHeaderLeft class="demo-title-block">
            <strong>Activity log</strong>
            <span>Last 7 days</span>
          </div>
          <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Refresh"></sd-button>

          <div class="demo-stack">
            <div class="demo-list">
              @for (row of activityRows; track row.time) {
                <div class="demo-list__row">
                  <span>{{ row.time }}</span>
                  <strong>{{ row.actor }}</strong>
                  <span>{{ row.action }}</span>
                </div>
              }
            </div>
          </div>

          <sd-button sdFooterRight type="text" color="secondary" title="Close" (click)="activity.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-long-scroll-body') {
      <demo-section heading="Long scroll body" [props]="[{ name: 'max-height', value: '80vh' }, { name: 'body', value: 'scrollable' }]">
        <sd-button type="outline" color="primary" prefixIcon="list" title="Open long content" (click)="longContent.open()"></sd-button>

        <sd-modal #longContent title="Long approval checklist" width="md">
          <div class="demo-stack">
            <div class="demo-list">
              @for (item of checklist; track item) {
                <div class="demo-list__row">
                  <span>{{ item }}</span>
                  <sd-badge type="round" info title="Required"></sd-badge>
                </div>
              }
            </div>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Skip"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Done" (click)="longContent.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-read-only-modal-without-footer') {
      <demo-section heading="Read-only modal without footer" [props]="[{ name: 'footer', value: 'empty hidden' }]">
        <sd-button type="outline" color="primary" prefixIcon="visibility" title="Preview note" (click)="preview.open()"></sd-button>

        <sd-modal #preview title="Internal note" width="sm">
          <div class="demo-stack">
            <p class="demo-copy">This modal has no footer slots. The footer container stays hidden so read-only content can remain compact.</p>
          </div>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bottom-sheet-actions') {
      <demo-section heading="Bottom-sheet actions" [props]="[{ name: 'view', value: 'bottom-sheet' }, { name: 'sdFooterRight', value: 'template' }]">
        <sd-button type="outline" color="primary" prefixIcon="more_vert" title="Open actions" (click)="sheetActions.open()"></sd-button>

        <sd-modal #sheetActions title="Quick actions" view="bottom-sheet" width="100%">
          <div class="sheet-stack">
            <sd-button type="text" color="primary" prefixIcon="edit" title="Edit" (click)="sheetActions.close()"></sd-button>
            <sd-button type="text" color="primary" prefixIcon="share" title="Share" (click)="sheetActions.close()"></sd-button>
            <sd-button type="text" color="error" prefixIcon="delete" title="Delete" (click)="sheetActions.close()"></sd-button>
          </div>

          <sd-button sdFooterRight type="text" color="secondary" title="Cancel" (click)="sheetActions.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bottom-sheet-form') {
      <demo-section heading="Bottom-sheet form" [props]="[{ name: 'view', value: 'bottom-sheet' }, { name: 'sdFooterLeft/right', value: 'template' }]">
        <sd-button type="light" color="primary" prefixIcon="schedule" title="Pick time" (click)="sheetForm.open()"></sd-button>

        <sd-modal #sheetForm title="Pick a delivery time" view="bottom-sheet" width="100%">
          <div class="sheet-stack">
            @for (slot of deliverySlots; track slot.time) {
              <button type="button" class="time-option" (click)="sheetForm.close()">
                <strong>{{ slot.time }}</strong>
                <span>{{ slot.note }}</span>
              </button>
            }
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Cancel" (click)="sheetForm.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Confirm" (click)="sheetForm.close()"></sd-button>
        </sd-modal>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      align-items: flex-start;
    }

    .demo-stack,
    .sheet-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .sheet-stack {
      padding-top: 4px;
    }

    .demo-copy {
      margin: 0;
      color: #334155;
      line-height: 1.5;
    }

    .demo-title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .demo-title-block span {
      color: #667085;
      font-size: 12px;
    }

    .demo-list {
      display: flex;
      flex-direction: column;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }

    .demo-list__row {
      display: grid;
      grid-template-columns: minmax(90px, max-content) minmax(110px, max-content) minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid #f2f2f2;
      color: #475467;
    }

    .demo-list__row:last-child {
      border-bottom: 0;
    }

    .time-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      background: #fff;
      color: #1f2937;
      cursor: pointer;
      text-align: left;
    }

    .time-option:hover {
      border-color: var(--sd-primary, #005cbb);
    }

    .time-option span {
      color: #667085;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDemoComponent {
  readonly activityRows = [
    { time: '09:30', actor: 'Nguyen Van An', action: 'Updated status' },
    { time: '10:45', actor: 'Tran Thi Bich', action: 'Added attachment' },
    { time: '14:15', actor: 'Le Minh Hoang', action: 'Approved request' },
  ];

  readonly checklist = Array.from({ length: 16 }, (_, index) => \`Checklist item \${index + 1}\`);

  readonly deliverySlots = [
    { time: '5:00 PM - 5:15 PM', note: 'Prep starts at 4:45 PM' },
    { time: '5:30 PM - 5:45 PM', note: 'Good if you are heading home' },
    { time: '6:00 PM - 6:15 PM', note: 'Most popular' },
  ];
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  align-items: flex-start;
}

.demo-stack,
.sheet-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.sheet-stack {
  padding-top: 4px;
}

.demo-copy {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.demo-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.demo-title-block span {
  color: #667085;
  font-size: 12px;
}

.demo-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}

.demo-list__row {
  display: grid;
  grid-template-columns: minmax(90px, max-content) minmax(110px, max-content) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
  color: #475467;
}

.demo-list__row:last-child {
  border-bottom: 0;
}

.time-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  text-align: left;
}

.time-option:hover {
  border-color: var(--sd-primary, #005cbb);
}

.time-option span {
  color: #667085;
}`},"components/operator":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import type { Operator } from '@sdcorejs/utils/models';

@Component({
  selector: 'app-operator-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdOperator],
  template: \`
    <demo-page #demoPage
      title="Operator"
      description="N\xFAt ch\u1ECDn to\xE1n t\u1EED so s\xE1nh (=, \u2260, ch\u1EE9a, l\u1EDBn h\u01A1n, c\xF3 gi\xE1 tr\u1ECB, \u2026) \u2014 d\u1EA1ng icon nh\u1ECF, m\u1EDF menu khi click. Th\u01B0\u1EDDng d\xF9ng k\xE8m c\xE1c b\u1ED9 l\u1ECDc n\xE2ng cao.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-chuoi') {
      <demo-section heading="To\xE1n t\u1EED chu\u1ED7i" [props]="[{ name: 'operators', value: 'string' }]">
        <span class="row-label">H\u1ECD t\xEAn</span>
        <sd-operator [(model)]="stringOp" [operators]="stringOps"></sd-operator>
        <span class="row-value">{{ stringOp() ?? '\u2014' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-so') {
      <demo-section heading="To\xE1n t\u1EED s\u1ED1" [props]="[{ name: 'operators', value: 'number' }]">
        <span class="row-label">L\u01B0\u01A1ng</span>
        <sd-operator [(model)]="numberOp" [operators]="numberOps"></sd-operator>
        <span class="row-value">{{ numberOp() ?? '\u2014' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-ngay') {
      <demo-section heading="To\xE1n t\u1EED ng\xE0y" [props]="[{ name: 'operators', value: 'date' }]">
        <span class="row-label">Ng\xE0y t\u1EA1o</span>
        <sd-operator [(model)]="dateOp" [operators]="dateOps"></sd-operator>
        <span class="row-value">{{ dateOp() ?? '\u2014' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]">
        <span class="row-label">disabled</span>
        <sd-operator [(model)]="stringOp" [operators]="stringOps" [disabled]="true"></sd-operator>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .row-label {
      font-size: 13px;
      color: #4a4a4a;
      min-width: 96px;
    }
    .row-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--sd-primary, #005cbb);
      font-family: monospace;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorDemoComponent {
  readonly stringOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'];
  readonly numberOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL', 'NULL', 'NOT_NULL'];
  readonly dateOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'];

  readonly stringOp = signal<Operator | undefined>('CONTAIN');
  readonly numberOp = signal<Operator | undefined>('GREATER_OR_EQUAL');
  readonly dateOp = signal<Operator | undefined>('BETWEEN');
}
`,scss:`.row-label {
  font-size: 13px;
  color: #4a4a4a;
  min-width: 96px;
}
.row-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--sd-primary, #005cbb);
  font-family: monospace;
}`},"components/org-chart":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdOrgChart, SdOrgChartItem, SdOrgChartItemDefDirective } from '@sdcorejs/angular/components/org-chart';

@Component({
  selector: 'app-org-chart-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdOrgChart, SdOrgChartItemDefDirective],
  template: \`
    <demo-page #demoPage
      title="Org Chart"
      description="S\u01A1 \u0111\u1ED3 t\u1ED5 ch\u1EE9c d\u1EA1ng tree: card m\u1EB7c \u0111\u1ECBnh c\xF3 \u1EA3nh, ti\xEAu \u0111\u1EC1, m\xF4 t\u1EA3, m\xE0u n\u1EC1n; node c\xF3 children c\xF3 th\u1EC3 thu g\u1ECDn/m\u1EDF r\u1ED9ng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-card-mac-dinh') {
      <demo-section
        heading="Card m\u1EB7c \u0111\u1ECBnh"
        [props]="[
          { name: 'items', value: 'SdOrgChartItem[]' },
          { name: 'collapsible', value: 'true' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="basicItems" autoId="basic"></sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-node-co-mau') {
      <demo-section
        heading="Node c\xF3 m\xE0u"
        note="M\u1ED7i item truy\u1EC1n color ri\xEAng; node kh\xF4ng c\xF3 image v\xE0 description t\u1EF1 chuy\u1EC3n sang compact card."
        [props]="[
          { name: 'color', value: '#hex' },
          { name: 'expanded', value: 'boolean' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="coloredItems" autoId="colored"></sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-bang-directive') {
      <demo-section
        heading="Custom b\u1EB1ng directive"
        [props]="[
          { name: 'sdOrgChartItemDef', value: 'template' },
          { name: 'context', value: 'item / depth / toggle' },
        ]">
        <div class="org-demo-stage">
          <sd-org-chart [items]="compactItems" autoId="directive-template">
            <ng-template sdOrgChartItemDef let-item let-depth="depth" let-hasChildren="hasChildren" let-toggle="toggle">
              <button
                type="button"
                class="org-custom-card"
                [class.org-custom-card--leaf]="!hasChildren"
                [style.border-color]="item.color || '#d9e2ef'"
                (click)="toggle()">
                <span class="org-custom-card__level">L{{ depth + 1 }}</span>
                <strong>{{ item.title }}</strong>
                @if (item.description) {
                  <small>{{ item.description }}</small>
                }
              </button>
            </ng-template>
          </sd-org-chart>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-bang-templateref-input') {
      <demo-section
        heading="Custom b\u1EB1ng TemplateRef input"
        [props]="[
          { name: 'itemTemplate', value: 'TemplateRef' },
          { name: 'collapsible', value: 'false' },
        ]">
        <ng-template #teamNode let-item let-isLeaf="isLeaf">
          <div class="org-template-node" [class.org-template-node--leaf]="isLeaf">
            @if (item.image) {
              <img [src]="item.image" [alt]="item.title" />
            }
            <span>{{ item.title }}</span>
            @if (item.description) {
              <small>{{ item.description }}</small>
            }
          </div>
        </ng-template>

        <div class="org-demo-stage">
          <sd-org-chart [items]="compactItems" [itemTemplate]="teamNode" [collapsible]="false" autoId="input-template"></sd-org-chart>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
      .org-demo-stage {
        width: 100%;
        overflow-x: auto;
        padding: 16px 8px;
        background: #fbfcfe;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .org-custom-card {
        display: grid;
        min-width: 118px;
        gap: 4px;
        padding: 12px;
        color: #102047;
        background: #ffffff;
        border: 2px solid #d9e2ef;
        border-radius: 6px;
        cursor: pointer;
      }

      .org-custom-card--leaf {
        min-width: 92px;
        padding: 10px 12px;
      }

      .org-custom-card__level {
        color: #60708a;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .org-custom-card strong {
        font-size: 13px;
        line-height: 1.25;
      }

      .org-custom-card small {
        color: #60708a;
        font-size: 12px;
      }

      .org-template-node {
        display: grid;
        justify-items: center;
        min-width: 116px;
        gap: 6px;
        padding: 12px 14px;
        color: #0f2445;
        background: #ffffff;
        border: 1px solid #dce4ee;
        border-radius: 6px;
      }

      .org-template-node--leaf {
        min-width: 88px;
      }

      .org-template-node img {
        width: 34px;
        height: 34px;
        object-fit: cover;
        border-radius: 50%;
      }

      .org-template-node span {
        font-size: 13px;
        font-weight: 700;
        line-height: 1.25;
      }

      .org-template-node small {
        color: #60708a;
        font-size: 12px;
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartDemoComponent {
  readonly basicItems: SdOrgChartItem[] = [
    {
      id: 'amy',
      image: 'https://i.pravatar.cc/96?img=32',
      title: 'Amy Elsner',
      description: 'CEO',
      children: [
        {
          id: 'anna',
          image: 'https://i.pravatar.cc/96?img=47',
          title: 'Anna Fali',
          description: 'CMO',
          children: [
            { id: 'sales', title: 'Sales' },
            { id: 'marketing', title: 'Marketing' },
          ],
        },
        {
          id: 'stephen',
          image: 'https://i.pravatar.cc/96?img=12',
          title: 'Stephen Shaw',
          description: 'CTO',
          children: [
            { id: 'development', title: 'Development' },
            { id: 'design', title: 'UI/UX Design' },
          ],
        },
      ],
    },
  ];

  readonly coloredItems: SdOrgChartItem[] = [
    {
      id: 'amy',
      image: 'https://i.pravatar.cc/96?img=32',
      title: 'Amy Elsner',
      description: 'CEO',
      color: '#dfe6ff',
      children: [
        {
          id: 'anna',
          image: 'https://i.pravatar.cc/96?img=47',
          title: 'Anna Fali',
          description: 'CMO',
          color: '#f0ddff',
          children: [
            { id: 'sales', title: 'Sales', color: '#f0ddff' },
            { id: 'marketing', title: 'Marketing', color: '#f0ddff' },
          ],
        },
        {
          id: 'stephen',
          image: 'https://i.pravatar.cc/96?img=12',
          title: 'Stephen Shaw',
          description: 'CTO',
          color: '#c6f4eb',
          children: [
            { id: 'development', title: 'Development', color: '#c6f4eb' },
            { id: 'design', title: 'UI/UX Design', color: '#c6f4eb' },
          ],
        },
      ],
    },
  ];

  readonly compactItems: SdOrgChartItem[] = [
    {
      id: 'company',
      title: 'OneMount',
      description: 'Corporate',
      color: '#dfe6ff',
      children: [
        {
          id: 'growth',
          title: 'Growth',
          description: 'Revenue',
          color: '#c6f4eb',
          children: [
            { id: 'sales', title: 'Sales', color: '#c6f4eb' },
            { id: 'partnership', title: 'Partnership', color: '#c6f4eb' },
          ],
        },
        {
          id: 'product',
          title: 'Product',
          description: 'Experience',
          color: '#f0ddff',
          children: [
            { id: 'design', title: 'Design', color: '#f0ddff' },
            { id: 'engineering', title: 'Engineering', color: '#f0ddff' },
          ],
        },
      ],
    },
  ];
}
`,scss:`.org-demo-stage {
  width: 100%;
  overflow-x: auto;
  padding: 16px 8px;
  background: #fbfcfe;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
}

.org-custom-card {
  display: grid;
  min-width: 118px;
  gap: 4px;
  padding: 12px;
  color: #102047;
  background: #ffffff;
  border: 2px solid #d9e2ef;
  border-radius: 6px;
  cursor: pointer;
}

.org-custom-card--leaf {
  min-width: 92px;
  padding: 10px 12px;
}

.org-custom-card__level {
  color: #60708a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.org-custom-card strong {
  font-size: 13px;
  line-height: 1.25;
}

.org-custom-card small {
  color: #60708a;
  font-size: 12px;
}

.org-template-node {
  display: grid;
  justify-items: center;
  min-width: 116px;
  gap: 6px;
  padding: 12px 14px;
  color: #0f2445;
  background: #ffffff;
  border: 1px solid #dce4ee;
  border-radius: 6px;
}

.org-template-node--leaf {
  min-width: 88px;
}

.org-template-node img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 50%;
}

.org-template-node span {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.org-template-node small {
  color: #60708a;
  font-size: 12px;
}`},"components/preview":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdPreviewImage, SdPreviewPdf } from '@sdcorejs/angular/components/preview';
import { createPreviewPdfFixture } from './preview-pdf.fixture';

@Component({
  selector: 'app-preview-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdPreviewImage, SdPreviewPdf],
  template: \`
    <demo-page
      #demoPage
      title="Preview"
      description="B\u1ED9 xem \u1EA3nh v\xE0 PDF d\u1EA1ng lightbox \u2014 t\u1EF1 co theo container, h\u1ED7 tr\u1EE3 zoom / rotate / fullscreen / t\u1EA3i xu\u1ED1ng. C\xF3 th\u1EC3 nh\xFAng inline, trong sd-modal ho\u1EB7c trong sd-side-drawer.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thu-vien-anh') {
        <demo-section heading="Th\u01B0 vi\u1EC7n \u1EA3nh" [props]="[{ name: 'items', value: '[\u2026]' }]">
          <div class="preview-box">
            <sd-preview-image [items]="images" [startIndex]="0"></sd-preview-image>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-don') {
        <demo-section heading="\u1EA2nh \u0111\u01A1n" [props]="[{ name: 'thumbnailPosition', value: 'none' }]">
          <div class="preview-box">
            <sd-preview-image [items]="[singleImage]" thumbnailPosition="none"></sd-preview-image>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xem-pdf') {
        <demo-section
          heading="Xem PDF"
          [props]="[
            { name: 'source', value: 'local 3-page fixture' },
            { name: 'sidebar', value: 'thumbnails' },
          ]">
          <div class="preview-box">
            <sd-preview-pdf [source]="pdfSource()" sidebar="thumbnails"></sd-preview-pdf>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-pdf-nang-cao') {
        <demo-section
          heading="PDF n\xE2ng cao"
          [props]="[
            { name: 'sidebar', value: 'outline' },
            { name: 'scrollMode', value: 'continuous' },
            { name: 'fixture', value: '3 pages + PDF Outlines' },
            { name: 'print', value: 'header action / Ctrl+P' },
          ]">
          <div class="preview-box preview-box--advanced-pdf">
            <sd-preview-pdf [source]="pdfSource()" sidebar="outline" scrollMode="continuous"></sd-preview-pdf>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
      .preview-box {
        width: 100%;
        height: 480px;
        border: 1px solid #e6e6e6;
        border-radius: 6px;
        overflow: hidden;
      }

      .preview-box--advanced-pdf {
        height: 640px;
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewDemoComponent {
  readonly images: string[] = [
    'https://picsum.photos/seed/sd1/1600/1000',
    'https://picsum.photos/seed/sd2/1200/1600',
    'https://picsum.photos/seed/sd3/2000/1200',
    'https://picsum.photos/seed/sd4/1400/1400',
    'https://picsum.photos/seed/sd5/1800/900',
  ];

  readonly singleImage = 'https://picsum.photos/seed/single/1920/1080';

  readonly pdfSource = signal<Uint8Array>(createPreviewPdfFixture());
}
`,scss:`.preview-box {
  width: 100%;
  height: 480px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
}

.preview-box--advanced-pdf {
  height: 640px;
}`},"components/query-bar":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBar, SdQueryField, SdQueryLogic } from '@sdcorejs/angular/components/query-bar';
import { Filter } from '@sdcorejs/utils/models';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  status: string;
  salary: number;
  joinDate: Date;
  active: boolean;
}

@Component({
  selector: 'app-query-bar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBar],
  template: \`
    <demo-page #demoPage
      title="Query Bar"
      description="Thanh chip l\u1ECDc th\u1ED1ng nh\u1EA5t (Jira / Linear style) \u2014 g\u1ECDn nh\u1EB9, h\u1ED7 tr\u1EE3 AND/OR, l\u01B0u b\u1ED9 l\u1ECDc, popover ho\u1EB7c inline mode. Thay th\u1EBF b\u1ED9 l\u1ECDc r\u1EDDi r\u1EA1c tr\xEAn \u0111\u1EA7u trang danh s\xE1ch.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-popover') {
      <demo-section heading="Ch\u1EBF \u0111\u1ED9 popover" [props]="[{ name: 'mode', value: 'popover' }]">
        <div class="bar-box">
          <sd-query-bar
            [fields]="fields"
            [(filters)]="filters"
            [(logic)]="logic"
            [(search)]="search"
            mode="popover"
            [showSearch]="true"
            [showLogicToggle]="true"
            [showClearAll]="true"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-inline') {
      <demo-section heading="Ch\u1EBF \u0111\u1ED9 inline" [props]="[{ name: 'mode', value: 'inline' }]" note="Chip values b\u1EA5m v\xE0o gi\xE1 tr\u1ECB \u0111\u1EC3 s\u1EEDa inline (m\u1EDF panel ngay, kh\xF4ng hi\u1EC7n \xF4 input r\u1EDDi); b\u1EA5m ra ngo\xE0i quay v\u1EC1 text. D\xF9ng sd-select [viewed]='inline'.">
        <div class="bar-box">
          <sd-query-bar
            [fields]="fields"
            [(filters)]="inlineFilters"
            [(logic)]="logic"
            mode="inline"
            density="compact"
            [showLogicToggle]="true"
            [showOperatorOnChip]="true"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .bar-box {
      width: 100%;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBarDemoComponent {
  readonly departmentOptions = [
    { value: 'TECH', display: 'C\xF4ng ngh\u1EC7' },
    { value: 'SALES', display: 'Kinh doanh' },
    { value: 'HR', display: 'Nh\xE2n s\u1EF1' },
    { value: 'FINANCE', display: 'T\xE0i ch\xEDnh' },
    { value: 'MARKETING', display: 'Marketing' },
  ];

  readonly statusOptions = [
    { value: 'ACTIVE', display: '\u0110ang l\xE0m vi\u1EC7c' },
    { value: 'PROBATION', display: 'Th\u1EED vi\u1EC7c' },
    { value: 'RESIGNED', display: '\u0110\xE3 ngh\u1EC9' },
  ];

  readonly fields: SdQueryField<Employee>[] = [
    { type: 'string', key: 'name', label: 'H\u1ECD t\xEAn', icon: 'person' },
    { type: 'string', key: 'email', label: 'Email', icon: 'alternate_email', operators: true },
    {
      type: 'values',
      key: 'department',
      label: 'Ph\xF2ng ban',
      icon: 'apartment',
      operators: true,
      option: { items: this.departmentOptions, valueField: 'value', displayField: 'display' },
    },
    {
      type: 'values',
      key: 'status',
      label: 'Tr\u1EA1ng th\xE1i',
      icon: 'badge',
      option: { items: this.statusOptions, valueField: 'value', displayField: 'display' },
    },
    { type: 'number', key: 'salary', label: 'L\u01B0\u01A1ng', icon: 'payments', operators: true },
    { type: 'date', key: 'joinDate', label: 'Ng\xE0y v\xE0o', icon: 'event', operators: true },
    { type: 'boolean', key: 'active', label: '\u0110ang ho\u1EA1t \u0111\u1ED9ng', icon: 'toggle_on' },
  ];

  readonly filters = signal<Filter<Employee>[]>([
    { field: 'department', operator: 'IN', value: ['TECH', 'SALES'], data: null } as unknown as Filter<Employee>,
  ]);
  readonly inlineFilters = signal<Filter<Employee>[]>([]);
  readonly logic = signal<SdQueryLogic>('AND');
  readonly search = signal<string>('');

  onApply(): void {
    // Trong app th\u1EF1c, s\u1EBD trigger reload table d\u1EF1a tr\xEAn filters() + logic() + search().
  }
}
`,scss:`.bar-box {
  width: 100%;
}`},"components/query-builder":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBuilder, SdQueryBuilderField } from '@sdcorejs/angular/components/query-builder';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { Filter } from '@sdcorejs/utils/models';

@Component({
  selector: 'app-query-builder-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBuilder, SdCodeEditor],
  template: \`
    <demo-page #demoPage
      title="Query Builder"
      description="B\u1ED9 d\u1EF1ng truy v\u1EA5n d\u1EA1ng c\xE2y \u2014 gom c\xE1c \u0111i\u1EC1u ki\u1EC7n 'tr\u01B0\u1EDDng - to\xE1n t\u1EED - gi\xE1 tr\u1ECB' theo nh\xF3m AND/OR l\u1ED3ng nhau. To\xE1n t\u1EED suy ra theo type c\u1EE7a tr\u01B0\u1EDDng; output l\xE0 Filter c\u1EE7a @sdcorejs/utils (c\xE2y FilterAndOr l\u1ED3ng), gi\u1ED1ng query-bar. C\xE1c panel JSON b\xEAn d\u01B0\u1EDBi d\xF9ng <sd-code-editor language='json' viewed> \u0111\u1EC3 xem Filter realtime.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-edit-view') {
      <demo-section heading="Edit / View" [props]="[{ name: 'fields', value: 'SdQueryBuilderField[]' }, { name: 'value', value: 'Filter | null' }, { name: 'mode', value: 'edit | view' }]">
        <div class="qb-demo-toolbar">
          <button type="button" class="qb-demo-btn" [class.active]="mode() === 'edit'" (click)="mode.set('edit')">Edit</button>
          <button type="button" class="qb-demo-btn" [class.active]="mode() === 'view'" (click)="mode.set('view')">View</button>
        </div>

        <div class="builder-box">
          <sd-query-builder [fields]="fields" [mode]="mode()" [(value)]="value"></sd-query-builder>
        </div>

        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="value()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-moi-loai-truong-value-editor-theo-type') {
      <demo-section
        heading="M\u1ECDi lo\u1EA1i tr\u01B0\u1EDDng (value editor theo type)"
        note="M\u1ED7i type render m\u1ED9t value editor ri\xEAng: string \u2192 \xF4 text, number \u2192 \xF4 s\u1ED1 (+ BETWEEN hai \u0111\u1EA7u), boolean \u2192 select C\xF3/Kh\xF4ng, values \u2192 multi-select, date \u2192 date picker, datetime \u2192 datetime picker."
        [props]="[{ name: 'type', value: 'string / number / boolean / values / date / datetime' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="allTypesValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="allTypesValue()" viewed maxHeight="320px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ngay-tuong-doi') {
      <demo-section
        heading="Ng\xE0y t\u01B0\u01A1ng \u0111\u1ED1i"
        note="V\u1EDBi date/datetime + to\xE1n t\u1EED \u0111\u01A1n (=, !=, >, <), ch\u1ECDn 'H\xF4m nay' ho\u1EB7c 'T\u01B0\u01A1ng \u0111\u1ED1i' (N ng\xE0y/tu\u1EA7n/th\xE1ng tr\u01B0\u1EDBc\xB7t\u1EDBi). Emit ra Filter.data d\u1EA1ng { rel, unit, amount, direction }. BETWEEN kh\xF4ng c\xF3 ch\u1EBF \u0111\u1ED9 t\u01B0\u01A1ng \u0111\u1ED1i."
        [props]="[{ name: 'fields', value: 'date | datetime' }, { name: 'value', value: '{ rel, unit, amount, direction }' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="relativeValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="relativeValue()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-sanh-giua-cac-truong') {
      <demo-section
        heading="So s\xE1nh gi\u1EEFa c\xE1c tr\u01B0\u1EDDng"
        note="B\u1EADt comparisonMode='value-or-field' \u0111\u1EC3 m\u1ED7i rule c\xF3 th\u1EC3 ch\u1ECDn nh\u1EADp gi\xE1 tr\u1ECB ho\u1EB7c so s\xE1nh v\u1EDBi m\u1ED9t field kh\xE1c c\xF9ng type. Field b\xEAn ph\u1EA3i emit ra Filter d\u1EA1ng { dataType: 'field', data: '<fieldKey>' }."
        [props]="[{ name: 'comparisonMode', value: 'value-or-field' }, { name: 'dataType', value: 'field' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" comparisonMode="value-or-field" [(value)]="fieldComparisonValue"></sd-query-builder>
        </div>
        <div class="qb-demo-preview">
          <strong>View</strong>
          <sd-query-builder [fields]="fields" [value]="fieldComparisonValue()" mode="view"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="fieldComparisonValue()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-and-or-long-nhau') {
      <demo-section
        heading="Nh\xF3m AND/OR l\u1ED3ng nhau"
        note="B\u1EA5m + \u2192 Nh\xF3m \u0111\u1EC3 t\u1EA1o nh\xF3m con. Nh\xF3m con nhi\u1EC1u \u0111i\u1EC1u ki\u1EC7n \u0111\u01B0\u1EE3c b\u1ECDc ngo\u1EB7c ( \u2026 ) khi xem \u1EDF ch\u1EBF \u0111\u1ED9 View."
        [props]="[{ name: 'operator', value: 'AND / OR' }, { name: 'mode', value: 'edit | view' }]">
        <div class="qb-demo-toolbar">
          <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'edit'" (click)="nestedMode.set('edit')">Edit</button>
          <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'view'" (click)="nestedMode.set('view')">View</button>
        </div>
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [mode]="nestedMode()" [(value)]="nestedValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="nestedValue()" viewed maxHeight="320px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-dau-trong-dung-tu-dau') {
      <demo-section
        heading="B\u1EAFt \u0111\u1EA7u tr\u1ED1ng (d\u1EF1ng t\u1EEB \u0111\u1EA7u)"
        note="value kh\u1EDFi t\u1EA1o null. B\u1EA5m + \u2192 \u0110i\u1EC1u ki\u1EC7n \u0111\u1EC3 th\xEAm rule \u0111\u1EA7u ti\xEAn; ch\u1ECDn tr\u01B0\u1EDDng \u0111\u1EC3 hi\u1EC7n to\xE1n t\u1EED + value editor. Panel JSON c\u1EADp nh\u1EADt realtime."
        [props]="[{ name: 'value', value: 'null' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="emptyValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="emptyValue()" viewed maxHeight="240px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-disabled') {
      <demo-section heading="Disabled" [props]="[{ name: 'disabled', value: 'true' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [value]="seeded" disabled></sd-query-builder>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .builder-box { width: 100%; }
    .qb-demo-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
    .qb-demo-btn {
      border: 1px solid var(--sd-primary, #2a66f4); background: #fff; color: var(--sd-primary, #2a66f4);
      border-radius: 4px; padding: 4px 14px; cursor: pointer; font-size: 13px;
    }
    .qb-demo-btn.active { background: var(--sd-primary, #2a66f4); color: #fff; }
    .qb-demo-preview { margin-top: 16px; }
    .qb-demo-preview strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
    .qb-demo-out { margin-top: 16px; }
    .qb-demo-out strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
    .qb-demo-out sd-code-editor { display: block; }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderDemoComponent {
  readonly mode = signal<'edit' | 'view'>('edit');
  readonly nestedMode = signal<'edit' | 'view'>('edit');

  readonly fields: SdQueryBuilderField[] = [
    { key: 'code', label: 'M\xE3', type: 'string' },
    { key: 'name', label: 'T\xEAn', type: 'string' },
    { key: 'price', label: 'Gi\xE1 b\xE1n', type: 'number', compareGroup: 'money' },
    { key: 'cost', label: 'Gi\xE1 v\u1ED1n', type: 'number', compareGroup: 'money' },
    { key: 'quantity', label: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number', allowFieldCompare: false },
    {
      key: 'status',
      label: 'Tr\u1EA1ng th\xE1i',
      type: 'values',
      values: [
        { value: 'ACTIVE', display: '\u0110ang ho\u1EA1t \u0111\u1ED9ng' },
        { value: 'PROBATION', display: 'Th\u1EED vi\u1EC7c' },
        { value: 'INACTIVE', display: 'Ng\u1EEBng' },
      ],
    },
    { key: 'active', label: 'K\xEDch ho\u1EA1t', type: 'boolean', trueLabel: 'C\xF3', falseLabel: 'Kh\xF4ng' },
    { key: 'createdAt', label: 'Ng\xE0y t\u1EA1o', type: 'date', compareGroup: 'lifecycle' },
    { key: 'expiredAt', label: 'Ng\xE0y h\u1EBFt h\u1EA1n', type: 'date', compareGroup: 'lifecycle' },
    { key: 'updatedAt', label: 'C\u1EADp nh\u1EADt l\xFAc', type: 'datetime' },
  ];

  /** Seed used for the edit demo + disabled demo: (M\xE3 = 'ABC' and T\xEAn like '%abc%') or Gi\xE1 > 100. */
  readonly seeded: Filter = {
    operator: 'OR',
    data: [
      {
        operator: 'AND',
        data: [
          { field: 'code', operator: 'EQUAL', data: 'ABC' },
          { field: 'name', operator: 'CONTAIN', data: 'abc' },
        ],
      },
      { field: 'price', operator: 'GREATER_THAN', data: 100 },
    ],
  } as Filter;

  readonly value = signal<Filter | null>(this.seeded);

  /** One rule per field type so every value editor is visible at once. */
  readonly allTypesValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'name', operator: 'CONTAIN', data: 'abc' },
      { field: 'price', operator: 'BETWEEN', data: { from: 10, to: 99 } },
      { field: 'active', operator: 'EQUAL', data: true },
      { field: 'status', operator: 'IN', data: ['ACTIVE', 'PROBATION'] },
      { field: 'createdAt', operator: 'GREATER_THAN', data: '2026-01-01' },
      { field: 'updatedAt', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' },
    ],
  } as Filter);

  /** Seed for the relative-date demo: createdAt > 7 days ago, updatedAt = today. */
  readonly relativeValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'createdAt', operator: 'GREATER_THAN', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } },
      { field: 'updatedAt', operator: 'LESS_THAN', dataType: 'date-today', data: 'TODAY' },
    ],
  } as Filter);

  /** Seed for field comparison: Gi\xE1 b\xE1n > Gi\xE1 v\u1ED1n and Ng\xE0y h\u1EBFt h\u1EA1n >= Ng\xE0y t\u1EA1o. */
  readonly fieldComparisonValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
      { field: 'expiredAt', operator: 'GREATER_OR_EQUAL', dataType: 'field', data: 'createdAt' },
    ],
  } as Filter);

  /** Deep nested seed: (M\xE3 = 'ABC' and Gi\xE1 >= 50) or (Tr\u1EA1ng th\xE1i in ['INACTIVE'] and T\xEAn like 'x%'). */
  readonly nestedValue = signal<Filter | null>({
    operator: 'OR',
    data: [
      {
        operator: 'AND',
        data: [
          { field: 'code', operator: 'EQUAL', data: 'ABC' },
          { field: 'price', operator: 'GREATER_OR_EQUAL', data: 50 },
        ],
      },
      {
        operator: 'AND',
        data: [
          { field: 'status', operator: 'IN', data: ['INACTIVE'] },
          { field: 'name', operator: 'START_WITH', data: 'x' },
        ],
      },
    ],
  } as Filter);

  /** Empty start \u2014 build from scratch; the JSON panel fills in as rules complete. */
  readonly emptyValue = signal<Filter | null>(null);
}
`,scss:`.builder-box { width: 100%; }
.qb-demo-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.qb-demo-btn {
  border: 1px solid var(--sd-primary, #2a66f4); background: #fff; color: var(--sd-primary, #2a66f4);
  border-radius: 4px; padding: 4px 14px; cursor: pointer; font-size: 13px;
}
.qb-demo-btn.active { background: var(--sd-primary, #2a66f4); color: #fff; }
.qb-demo-preview { margin-top: 16px; }
.qb-demo-preview strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
.qb-demo-out { margin-top: 16px; }
.qb-demo-out strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
.qb-demo-out sd-code-editor { display: block; }`},"components/quick-action":{typescript:`import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-quick-action-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQuickAction, SdButton],
  template: \`
    <demo-page #demoPage
      title="Quick Action"
      description="Thanh toolbar n\u1ED5i \u1EDF \u0111\xE1y m\xE0n h\xECnh \u2014 th\u01B0\u1EDDng d\xF9ng cho bulk action khi user ch\u1ECDn nhi\u1EC1u d\xF2ng trong sd-table.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bulk-action-nhieu-dong') {
      <demo-section heading="Bulk action \u2014 nhi\u1EC1u d\xF2ng" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }, { name: 'sdAction', value: 'template' }]">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <sd-button type="light" color="primary" prefixIcon="add_circle" title="Th\xEAm ch\u1ECDn (+1 d\xF2ng)" (click)="addSelection()"></sd-button>
          <sd-button type="light" color="secondary" prefixIcon="remove_circle" title="B\u1ECF ch\u1ECDn (-1)" (click)="removeSelection()"></sd-button>
          <sd-button type="outline" color="secondary" prefixIcon="clear_all" title="X\xF3a h\u1EBFt" (click)="clearSelection()"></sd-button>
          <span style="color: #555; font-size: 13px;">\u0110\xE3 ch\u1ECDn: <strong>{{ selectedCount() }}</strong> d\xF2ng</span>
        </div>

        <sd-quick-action [opened]="hasSelection()">
          <div sdMessage>\u0110\xE3 ch\u1ECDn <strong>{{ selectedCount() }}</strong> b\u1EA3n ghi</div>
          <div sdAction style="display: flex; gap: 8px;">
            <sd-button type="fill" color="primary" prefixIcon="check" title="Ph\xEA duy\u1EC7t" (click)="bulkApprove()"></sd-button>
            <sd-button type="outline" color="error" prefixIcon="delete" title="X\xF3a" (click)="bulkDelete()"></sd-button>
            <sd-button type="text" color="secondary" prefixIcon="close" tooltip="B\u1ECF ch\u1ECDn" (click)="clearSelection()"></sd-button>
          </div>
        </sd-quick-action>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thong-bao-trang-thai') {
      <demo-section heading="Th\xF4ng b\xE1o tr\u1EA1ng th\xE1i" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }]">
        <sd-button type="light" color="primary" prefixIcon="sync" title="B\u1EADt / t\u1EAFt \u0111\u1ED3ng b\u1ED9" (click)="toggleSync()"></sd-button>

        <sd-quick-action [opened]="syncing()">
          <span sdMessage>\u0110ang \u0111\u1ED3ng b\u1ED9 d\u1EEF li\u1EC7u...</span>
        </sd-quick-action>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-undo-toast') {
      <demo-section heading="Undo toast" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdAction', value: 'template' }]">
        <sd-button type="light" color="error" prefixIcon="delete" title="X\xF3a b\u1EA3n ghi" (click)="simulateDelete()"></sd-button>

        <sd-quick-action [opened]="lastDeleted() !== null">
          <span sdMessage>\u0110\xE3 x\xF3a <strong>{{ lastDeleted() }}</strong>.</span>
          <sd-button sdAction type="text" color="primary" prefixIcon="undo" title="Ho\xE0n t\xE1c" (click)="undo()"></sd-button>
        </sd-quick-action>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionDemoComponent {
  readonly selectedCount = signal(0);
  readonly hasSelection = computed(() => this.selectedCount() > 0);

  readonly syncing = signal(false);
  readonly lastDeleted = signal<string | null>(null);

  addSelection() { this.selectedCount.update((v) => v + 1); }
  removeSelection() { this.selectedCount.update((v) => Math.max(0, v - 1)); }
  clearSelection() { this.selectedCount.set(0); }
  bulkApprove() { this.selectedCount.set(0); }
  bulkDelete() { this.selectedCount.set(0); }

  toggleSync() {
    this.syncing.update((v) => !v);
    if (this.syncing()) {
      setTimeout(() => this.syncing.set(false), 3000);
    }
  }

  simulateDelete() {
    this.lastDeleted.set('Kh\xE1ch h\xE0ng #' + Math.floor(Math.random() * 1000));
    setTimeout(() => {
      if (this.lastDeleted() !== null) this.lastDeleted.set(null);
    }, 5000);
  }

  undo() { this.lastDeleted.set(null); }
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}`},"components/section":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-section-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdSection, SdSectionItem],
  template: \`
    <demo-page #demoPage
      title="Section"
      description="Card nhom thong tin. Header/footer dung padding 8px 16px; body mac dinh padding 0 nen row item hoac wrapper con tu quan ly spacing.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-basic-info-rows') {
      <demo-section heading="Basic info rows" [props]="[{ name: 'header padding', value: '8px 16px' }, { name: 'body padding', value: 0 }]">
        <sd-section
          icon="info"
          iconColor="primary"
          title="General info"
          subTitle="Basic employee profile"
          class="demo-section-card">
          <sd-section-item label="Name">Nguyen Van An</sd-section-item>
          <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
          <sd-section-item label="Phone">0901 234 567</sd-section-item>
          <sd-section-item label="Department">
            <sd-badge type="round" primary title="Sales"></sd-badge>
          </sd-section-item>
        </sd-section>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-header-left-right') {
      <demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
        <sd-section class="demo-section-card">
          <div sdHeaderLeft class="section-title-block">
            <strong>Project members</strong>
            <span>3 active members</span>
          </div>
          <sd-button sdHeaderRight type="outline" color="primary" size="sm" prefixIcon="download" tooltip="Export"></sd-button>
          <sd-button sdHeaderRight type="fill" color="primary" size="sm" prefixIcon="add" title="Add"></sd-button>

          <sd-section-item label="Owner">Tran Thi Bich</sd-section-item>
          <sd-section-item label="Members">Le Minh Hoang, Pham Quynh Anh, Do Van Dat</sd-section-item>
        </sd-section>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-left-right') {
      <demo-section heading="Footer left/right" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
        <sd-section icon="rule" title="Approval summary" class="demo-section-card">
          <sd-section-item label="Risk level">
            <sd-badge type="round" warning title="Medium"></sd-badge>
          </sd-section-item>
          <sd-section-item label="SLA">2 business days</sd-section-item>

          <sd-button sdFooterLeft type="text" color="secondary" title="View history"></sd-button>
          <sd-button sdFooterRight type="text" color="secondary" title="Reject"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Approve"></sd-button>
        </sd-section>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-full-width-content-with-body-padding-0') {
      <demo-section heading="Full-width content with body padding 0" [props]="[{ name: 'body', value: 'padding 0' }, { name: 'legacy padding option', value: 'removed' }]">
        <sd-section icon="table_chart" title="Recent transactions" class="demo-section-card">
          <div class="mini-table">
            <div class="mini-table__head">
              <span>Code</span>
              <span>Owner</span>
              <span>Status</span>
            </div>
            @for (row of transactions; track row.code) {
              <div class="mini-table__row">
                <strong>{{ row.code }}</strong>
                <span>{{ row.owner }}</span>
                <sd-badge type="round" [color]="row.color" [title]="row.status"></sd-badge>
              </div>
            }
          </div>
        </sd-section>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-headerless-card-with-manual-body-padding') {
      <demo-section heading="Headerless card with manual body padding" [props]="[{ name: 'hideHeader', value: true }, { name: 'body wrapper', value: 'custom padding' }]">
        <sd-section [hideHeader]="true" class="demo-section-card">
          <div class="section-padded-body">
            <strong>Headerless note</strong>
            <p>Because section body has padding 0, free-form content should add its own wrapper when it needs breathing room.</p>
          </div>
        </sd-section>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-collapsible-section') {
      <demo-section heading="Collapsible section" [props]="[{ name: 'collapsible', value: true }, { name: '[(collapsed)]', value: 'two-way' }]">
        <sd-section
          icon="filter_list"
          title="Advanced filters"
          subTitle="Click the header to collapse"
          [collapsible]="true"
          [(collapsed)]="filterCollapsed"
          class="demo-section-card">
          <sd-section-item label="Status">Active</sd-section-item>
          <sd-section-item label="Created at">01/01/2026 - 31/12/2026</sd-section-item>
          <sd-section-item label="Type">Enterprise customer</sd-section-item>
        </sd-section>
        <p class="section-state">State: <strong>{{ filterCollapsed() ? 'Collapsed' : 'Expanded' }}</strong></p>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-section-item-rich-values') {
      <demo-section heading="Section item rich values" [props]="[{ name: 'labelWidth', value: '180px' }, { name: 'value', value: 'rich content' }]">
        <sd-section icon="badge" title="Role assignment" class="demo-section-card">
          <sd-section-item label="Primary role" labelWidth="180px">
            <div class="value-stack">
              <strong>Branch Manager</strong>
              <span>Can approve requests up to 50M VND</span>
            </div>
          </sd-section-item>
          <sd-section-item label="Tags" labelWidth="180px">
            <div class="badge-row">
              <sd-badge type="round" primary title="Finance"></sd-badge>
              <sd-badge type="round" info title="Approver"></sd-badge>
              <sd-badge type="round" success title="Active"></sd-badge>
            </div>
          </sd-section-item>
        </sd-section>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
    }

    .demo-section-card {
      width: 100%;
      max-width: 680px;
    }

    .section-title-block,
    .value-stack {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .section-title-block span,
    .value-stack span,
    .section-state,
    .section-padded-body p {
      color: #667085;
      font-size: 12px;
    }

    .section-padded-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
    }

    .section-padded-body p,
    .section-state {
      margin: 0;
    }

    .mini-table {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .mini-table__head,
    .mini-table__row {
      display: grid;
      grid-template-columns: 130px minmax(0, 1fr) 120px;
      gap: 12px;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #f2f2f2;
    }

    .mini-table__head {
      color: #667085;
      font-size: 12px;
      font-weight: 600;
      background: #f8fafc;
    }

    .mini-table__row:last-child {
      border-bottom: 0;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDemoComponent {
  readonly filterCollapsed = signal(false);

  readonly transactions = [
    { code: 'TRX-1001', owner: 'Nguyen Van An', status: 'Approved', color: 'success' },
    { code: 'TRX-1002', owner: 'Tran Thi Bich', status: 'Pending', color: 'warning' },
    { code: 'TRX-1003', owner: 'Le Minh Hoang', status: 'Draft', color: 'secondary' },
  ] as const;
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
}

.demo-section-card {
  width: 100%;
  max-width: 680px;
}

.section-title-block,
.value-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.section-title-block span,
.value-stack span,
.section-state,
.section-padded-body p {
  color: #667085;
  font-size: 12px;
}

.section-padded-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
}

.section-padded-body p,
.section-state {
  margin: 0;
}

.mini-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mini-table__head,
.mini-table__row {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 120px;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f2f2f2;
}

.mini-table__head {
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  background: #f8fafc;
}

.mini-table__row:last-child {
  border-bottom: 0;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}`},"components/side-drawer":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';

@Component({
  selector: 'app-side-drawer-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdSection, SdSectionItem, SdSideDrawer],
  template: \`
    <demo-page #demoPage
      title="Side Drawer"
      description="Right-side panel cho form/detail/filter. Header va footer dung slot sdHeaderLeft/sdHeaderRight/sdFooterLeft/sdFooterRight; content padding mac dinh bang 0.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-create-drawer-split-footer') {
      <demo-section heading="Create drawer + split footer" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
        <sd-button type="fill" color="primary" prefixIcon="add" title="Create employee" (click)="createDrawer.open()"></sd-button>

        <sd-side-drawer #createDrawer title="Create employee" width="480px">
          <div class="drawer-stack">
            <sd-section icon="person" title="Personal info">
              <sd-section-item label="Name">Nguyen Van An</sd-section-item>
              <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
              <sd-section-item label="Phone">0901 234 567</sd-section-item>
            </sd-section>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Reset"></sd-button>
          <sd-button sdFooterRight type="text" color="secondary" title="Cancel" (click)="createDrawer.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Save" prefixIcon="save" (click)="createDrawer.close()"></sd-button>
        </sd-side-drawer>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-header-left-right') {
      <demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
        <sd-button type="outline" color="primary" prefixIcon="visibility" title="Open profile" (click)="profileDrawer.open()"></sd-button>

        <sd-side-drawer #profileDrawer title="Profile" width="560px">
          <div sdHeaderLeft class="drawer-title-block">
            <strong>Employee profile</strong>
            <span>EMP-2026-0012</span>
          </div>
          <sd-button sdHeaderRight type="text" color="primary" prefixIcon="print" tooltip="Print"></sd-button>
          <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Refresh"></sd-button>

          <div class="drawer-stack">
            <sd-section icon="badge" title="Overview">
              <sd-section-item label="Department">Sales</sd-section-item>
              <sd-section-item label="Manager">Tran Thi Bich</sd-section-item>
              <sd-section-item label="Status">
                <sd-badge type="round" success title="Active"></sd-badge>
              </sd-section-item>
            </sd-section>
            <sd-section icon="notes" title="Note">
              <div class="drawer-copy">The drawer body has no built-in padding, so this demo uses a .drawer-stack wrapper.</div>
            </sd-section>
          </div>

          <sd-button sdFooterRight type="text" color="secondary" title="Close" (click)="profileDrawer.close()"></sd-button>
        </sd-side-drawer>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-filter-drawer') {
      <demo-section heading="Filter drawer" [props]="[{ name: 'disableBackdropClose', value: false }, { name: 'footer', value: 'left/right' }]">
        <sd-button type="outline" color="primary" prefixIcon="filter_list" title="Open filters" (click)="filterDrawer.open()"></sd-button>

        <sd-side-drawer #filterDrawer title="Advanced filters" width="420px">
          <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Reset filters"></sd-button>

          <div class="drawer-stack">
            <sd-section icon="tune" title="Criteria">
              <sd-section-item label="Date range">01/01/2026 - 31/12/2026</sd-section-item>
              <sd-section-item label="Status">Active</sd-section-item>
              <sd-section-item label="Department">Sales, Marketing</sd-section-item>
            </sd-section>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Clear"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Apply" (click)="filterDrawer.close()"></sd-button>
        </sd-side-drawer>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-long-scroll-content') {
      <demo-section heading="Long scroll content" [props]="[{ name: 'content', value: 'overflow auto' }, { name: 'width', value: '520px' }]">
        <sd-button type="light" color="primary" prefixIcon="list" title="Open checklist" (click)="checklistDrawer.open()"></sd-button>

        <sd-side-drawer #checklistDrawer title="Approval checklist" width="520px">
          <div class="drawer-stack">
            <div class="drawer-list">
              @for (item of checklist; track item) {
                <div class="drawer-list__row">
                  <span>{{ item }}</span>
                  <sd-badge type="round" info title="Required"></sd-badge>
                </div>
              }
            </div>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Back" (click)="checklistDrawer.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Submit" (click)="checklistDrawer.close()"></sd-button>
        </sd-side-drawer>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-read-only-drawer-without-footer') {
      <demo-section heading="Read-only drawer without footer" [props]="[{ name: 'footer', value: 'empty hidden' }]">
        <sd-button type="outline" color="primary" prefixIcon="description" title="Open detail" (click)="readonlyDrawer.open()"></sd-button>

        <sd-side-drawer #readonlyDrawer title="Request detail" width="500px">
          <div class="drawer-stack">
            <sd-section icon="description" title="Request">
              <sd-section-item label="Code">REQ-2026-0042</sd-section-item>
              <sd-section-item label="Owner">Tran Thi Bich</sd-section-item>
              <sd-section-item label="Created at">09/05/2026</sd-section-item>
            </sd-section>
            <p class="drawer-copy">No footer slots are projected here, so the action bar is hidden.</p>
          </div>
        </sd-side-drawer>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-locked-drawer-with-explicit-actions') {
      <demo-section heading="Locked drawer with explicit actions" [props]="[{ name: 'disableBackdropClose', value: true }, { name: 'hideClose', value: true }]">
        <sd-button type="fill" color="primary" prefixIcon="lock" title="Open locked drawer" (click)="lockedDrawer.open()"></sd-button>

        <sd-side-drawer #lockedDrawer title="Required decision" width="460px" disableBackdropClose hideClose>
          <div class="drawer-stack">
            <p class="drawer-copy">Backdrop and close icon are disabled. The user must choose one explicit footer action.</p>
          </div>

          <sd-button sdFooterLeft type="text" color="secondary" title="Reject" (click)="lockedDrawer.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="primary" title="Approve" (click)="lockedDrawer.close()"></sd-button>
        </sd-side-drawer>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      align-items: flex-start;
    }

    .drawer-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .drawer-title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .drawer-title-block span {
      color: #667085;
      font-size: 12px;
    }

    .drawer-copy {
      margin: 0;
      color: #334155;
      line-height: 1.5;
    }

    .drawer-list {
      display: flex;
      flex-direction: column;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }

    .drawer-list__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid #f2f2f2;
      color: #475467;
    }

    .drawer-list__row:last-child {
      border-bottom: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideDrawerDemoComponent {
  readonly checklist = Array.from({ length: 22 }, (_, index) => \`Checklist item \${index + 1}\`);
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  align-items: flex-start;
}

.drawer-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.drawer-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drawer-title-block span {
  color: #667085;
  font-size: 12px;
}

.drawer-copy {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.drawer-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}

.drawer-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
  color: #475467;
}

.drawer-list__row:last-child {
  border-bottom: 0;
}`},"components/splitter":{typescript:`import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSplitterComponent, SdSplitterPanelComponent } from '@sdcorejs/angular/components/splitter';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-splitter-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSplitterComponent, SdSplitterPanelComponent, SdButton],
  template: \`
    <demo-page #demoPage
      title="Splitter"
      description="Chia kh\xF4ng gian th\xE0nh c\xE1c panel c\xF3 th\u1EC3 k\xE9o \u0111\u1EC3 resize \u2014 h\u1ED7 tr\u1EE3 chi\u1EC1u ngang / d\u1ECDc, \u0111\u01A1n v\u1ECB flex / px, panel g\u1EADp \u0111\u01B0\u1EE3c.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ngang-2-panel-flex') {
      <demo-section heading="Ngang 2 panel (flex)" [props]="[{ name: 'orientation', value: 'horizontal' }, { name: 'unit', value: 'flex' }]">
        <div class="wrap" style="height: 240px;">
          <sd-splitter orientation="horizontal">
            <sd-splitter-panel [size]="1" unit="flex">
              <div class="pane bg-blue">Sidebar (1)</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="3" unit="flex">
              <div class="pane bg-grey">N\u1ED9i dung ch\xEDnh (3)</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-doc-3-panel-px-co-dinh') {
      <demo-section heading="D\u1ECDc 3 panel (px c\u1ED1 \u0111\u1ECBnh)" [props]="[{ name: 'orientation', value: 'vertical' }, { name: 'unit', value: 'px' }]">
        <div class="wrap" style="height: 320px;">
          <sd-splitter orientation="vertical">
            <sd-splitter-panel [size]="64" unit="px">
              <div class="pane bg-blue">Header \u2014 64px c\u1ED1 \u0111\u1ECBnh</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="1" unit="flex">
              <div class="pane bg-grey">N\u1ED9i dung \u2014 flex 1</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="100" unit="px">
              <div class="pane bg-blue">Footer \u2014 100px</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-panel-gap-voi-api-ngoai') {
      <demo-section heading="Panel g\u1EADp v\u1EDBi API ngo\xE0i" [props]="[{ name: 'collapsible', value: 'true' }, { name: 'toggle()', value: 'method' }, { name: 'resetLayout()', value: 'method' }]">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <sd-button type="light" color="primary" prefixIcon="menu_open" title="G\u1EADp / m\u1EDF sidebar" (click)="toggleSidebar()"></sd-button>
          <sd-button type="light" color="secondary" prefixIcon="restart_alt" title="Reset layout" (click)="reset()"></sd-button>
        </div>

        <div class="wrap" style="height: 280px;">
          <sd-splitter #apiSplitter orientation="horizontal">
            <sd-splitter-panel panelId="sidebar" [size]="240" unit="px" [minSize]="100" [collapsible]="true">
              <div class="pane bg-blue">Sidebar (collapsible)</div>
            </sd-splitter-panel>
            <sd-splitter-panel panelId="main" [size]="1" unit="flex">
              <div class="pane bg-grey">N\u1ED9i dung ch\xEDnh</div>
            </sd-splitter-panel>
            <sd-splitter-panel panelId="detail" [size]="320" unit="px" [minSize]="200" [collapsible]="true">
              <div class="pane bg-blue">Chi ti\u1EBFt (collapsible)</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .wrap {
      width: 100%;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .pane {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: var(--sd-primary, #005cbb);
    }
    .bg-blue { background: var(--sd-primary-light, #d7e3ff); }
    .bg-grey { background: #f5f5f5; color: #424242; }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitterDemoComponent {
  readonly apiSplitter = viewChild<SdSplitterComponent>('apiSplitter');

  toggleSidebar() {
    this.apiSplitter()?.toggle('sidebar');
  }

  reset() {
    this.apiSplitter()?.resetLayout();
  }
}
`,scss:`.wrap {
  width: 100%;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}
.pane {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: var(--sd-primary, #005cbb);
}
.bg-blue { background: var(--sd-primary-light, #d7e3ff); }
.bg-grey { background: #f5f5f5; color: #424242; }`},"components/stepper":{typescript:`import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';

@Component({
  selector: 'app-stepper-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdStepper,
    SdStep,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    JsonPipe,
  ],
  templateUrl: './stepper-demo.component.html',
  styleUrls: ['./stepper-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperDemoComponent {
  // -------- 1. Basic horizontal --------
  readonly basicIndex = signal(0);

  // -------- 2. Vertical orientation --------
  readonly verticalIndex = signal(0);

  // -------- 3. Linear + FormGroup gating (wizard) --------
  readonly linearStepper = viewChild<SdStepper>('linear');

  readonly accountForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  readonly profileForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    phone: new FormControl('', Validators.required),
  });
  readonly confirmForm = new FormGroup({
    agree: new FormControl(false, Validators.requiredTrue),
  });

  // Helper exposed as field for template-side access in linear "done" section
  submittedData = signal<unknown>(null);

  submitWizard() {
    this.submittedData.set({
      account: this.accountForm.value,
      profile: this.profileForm.value,
      agree: this.confirmForm.value.agree,
    });
  }

  resetWizard() {
    this.accountForm.reset();
    this.profileForm.reset();
    this.confirmForm.reset({ agree: false });
    this.submittedData.set(null);
    this.linearStepper()?.reset();
  }

  // -------- 4. Optional step --------
  readonly optionalIndex = signal(0);

  // -------- 5. Error state --------
  readonly errorIndex = signal(1);
  readonly errorState = signal<'error' | undefined>('error');

  toggleError() {
    this.errorState.update((s) => (s === 'error' ? undefined : 'error'));
  }

  // -------- 6. Custom labelPosition --------
  readonly labelPos = signal<'end' | 'bottom'>('bottom');

  // -------- 7. Color palette --------
  // (nothing \u2014 colors hard-coded in template)

  // -------- 8. External Next/Previous controls --------
  readonly externalStepper = viewChild<SdStepper>('external');
  readonly externalIndex = signal(0);

  externalNext() {
    this.externalStepper()?.next();
  }
  externalPrev() {
    this.externalStepper()?.previous();
  }
  externalReset() {
    this.externalStepper()?.reset();
  }
  externalGoLast() {
    this.externalStepper()?.goTo(2);
  }

  // -------- 9. Non-editable (no return) --------
  readonly nonEditableIndex = signal(0);
}
`,scss:`:host {
  display: block;
}

:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.full {
  width: 100%;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

.step-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;

  label {
    font-size: 13px;
    color: #4a4a4a;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  input[type='text'],
  input:not([type]) {
    padding: 8px 10px;
    border: 1px solid #d0d4da;
    border-radius: 4px;
    font-size: 14px;
    width: 320px;

    &:focus {
      border-color: var(--sd-primary, #005cbb);
      outline: none;
    }
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hint {
  font-size: 13px;
  color: #6b6b6b;
  margin: 0;
}

.output {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  margin: 8px 0 0;
}

.color-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

code {
  background: #f0f3f7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}`},"components/tab":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTab, SdTabClosedEvent, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdButton } from '@sdcorejs/angular/components/button';

interface FileTab {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tab-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTabGroup, SdTab, SdButton],
  template: \`
    <demo-page #demoPage
      title="Tab Group"
      description="Container tab khai b\xE1o \u2014 h\u1ED7 tr\u1EE3 icon, badge, disabled, closable. N\u1ED9i dung tab \u0111\u01B0\u1EE3c lazy mount.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-co-ban') {
      <demo-section heading="Tab c\u01A1 b\u1EA3n" [props]="[{ name: 'label', value: 'text' }]">
        <div class="full">
          <sd-tab-group>
            <sd-tab label="Th\xF4ng tin">
              <p>Th\xF4ng tin chung c\u1EE7a b\u1EA3n ghi s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\xE2y.</p>
            </sd-tab>
            <sd-tab label="L\u1ECBch s\u1EED">
              <p>L\u1ECBch s\u1EED thao t\xE1c \u2014 danh s\xE1ch c\xE1c thay \u0111\u1ED5i g\u1EA7n \u0111\xE2y.</p>
            </sd-tab>
            <sd-tab label="Quy\u1EC1n truy c\u1EADp">
              <p>C\u1EA5u h\xECnh vai tr\xF2 v\xE0 nh\xF3m quy\u1EC1n cho ng\u01B0\u1EDDi d\xF9ng.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-co-icon-badge-disabled') {
      <demo-section heading="Tab c\xF3 icon / badge / disabled" [props]="[{ name: 'icon', value: 'name' }, { name: 'badge', value: '7 / 99+' }, { name: 'disabled', value: 'true' }]">
        <div class="full">
          <sd-tab-group>
            <sd-tab label="H\u1ED3 s\u01A1" icon="person">
              <p>Trang h\u1ED3 s\u01A1 c\xE1 nh\xE2n.</p>
            </sd-tab>
            <sd-tab label="Th\xF4ng b\xE1o" icon="notifications" [badge]="unreadCount()">
              <p>B\u1EA1n c\xF3 {{ unreadCount() }} th\xF4ng b\xE1o ch\u01B0a \u0111\u1ECDc.</p>
            </sd-tab>
            <sd-tab label="Tin nh\u1EAFn" icon="mail" [badge]="'99+'">
              <p>H\u1ED9p th\u01B0 \u0111\u1EBFn.</p>
            </sd-tab>
            <sd-tab label="\u0110ang kh\xF3a" icon="lock" [disabled]="true">
              <p>Tab n\xE0y kh\xF4ng th\u1EC3 truy c\u1EADp.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-dong-duoc') {
      <demo-section heading="Tab \u0111\xF3ng \u0111\u01B0\u1EE3c" [props]="[{ name: 'closable', value: 'true' }, { name: '(tabClosed)', value: 'event' }]">
        <div class="full">
          <sd-tab-group (tabClosed)="onTabClosed($event)">
            @for (file of files(); track file.id) {
              <sd-tab [label]="file.name" icon="description" [closable]="true">
                <p>N\u1ED9i dung c\u1EE7a file <strong>{{ file.name }}</strong></p>
              </sd-tab>
            }
          </sd-tab-group>
          @if (files().length === 0) {
            <p style="padding: 16px; color: #888; font-style: italic;">T\u1EA5t c\u1EA3 c\xE1c tab \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\xF3ng.</p>
          }
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-can-tab-sang-phai') {
      <demo-section heading="C\u0103n tab sang ph\u1EA3i" [props]="[{ name: 'stretchTabs', value: 'false' }, { name: 'alignTabs', value: 'end' }]" note="Default stretchTabs=true (Material default) l\xE0m tabs gi\xE3n full width. T\u1EAFt stretch + \u0111\u1EB7t alignTabs \u0111\u1EC3 d\u1ED3n v\u1EC1 1 ph\xEDa.">
        <div class="full">
          <sd-tab-group [stretchTabs]="false" alignTabs="end">
            <sd-tab label="T\u1ED5ng quan" icon="dashboard">N\u1ED9i dung T\u1ED5ng quan.</sd-tab>
            <sd-tab label="B\xE1o c\xE1o" icon="bar_chart">N\u1ED9i dung B\xE1o c\xE1o.</sd-tab>
            <sd-tab label="C\xE0i \u0111\u1EB7t" icon="settings">N\u1ED9i dung C\xE0i \u0111\u1EB7t.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-variant-pills') {
      <demo-section heading="Variant pills" [props]="[{ name: 'variant', value: 'pills' }]" note="Pill rounded, active filled \u2014 nh\u1EB9 nh\xE0ng, kh\xF4ng underline, l\xFD t\u01B0\u1EDFng cho nested tab.">
        <div class="full">
          <sd-tab-group variant="pills" [stretchTabs]="false">
            <sd-tab label="Tu\u1EA7n n\xE0y" icon="today">N\u1ED9i dung tu\u1EA7n n\xE0y.</sd-tab>
            <sd-tab label="Th\xE1ng n\xE0y" icon="calendar_month" [badge]="3">N\u1ED9i dung th\xE1ng n\xE0y.</sd-tab>
            <sd-tab label="Qu\xFD n\xE0y">N\u1ED9i dung qu\xFD n\xE0y.</sd-tab>
            <sd-tab label="N\u0103m" [disabled]="true">N\u0103m</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-variant-segmented') {
      <demo-section heading="Variant segmented" [props]="[{ name: 'variant', value: 'segmented' }]" note="Container bo tr\xF2n v\u1EDBi 1 vi\u1EC1n \u2014 iOS-style. Ph\xF9 h\u1EE3p cho toggle nh\u1ECF trong toolbar.">
        <div class="full">
          <sd-tab-group variant="segmented" [stretchTabs]="false">
            <sd-tab label="Danh s\xE1ch">Hi\u1EC3n th\u1ECB d\u1EA1ng danh s\xE1ch.</sd-tab>
            <sd-tab label="B\u1EA3ng">Hi\u1EC3n th\u1ECB d\u1EA1ng b\u1EA3ng.</sd-tab>
            <sd-tab label="L\u01B0\u1EDBi">Hi\u1EC3n th\u1ECB d\u1EA1ng l\u01B0\u1EDBi.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau-color') {
      <demo-section heading="B\u1EA3ng m\xE0u color" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]" note="\u0110\u1ED5i m\xE0u indicator + badge theo b\u1ED9 Core: primary / secondary / info / success / warning / error.">
        <div class="full color-stack">
          <sd-tab-group [stretchTabs]="false" color="primary">
            <sd-tab label="primary" icon="info" [badge]="3">M\u1EB7c \u0111\u1ECBnh.</sd-tab>
            <sd-tab label="Tab 2">N\u1ED9i dung 2.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="success" variant="pills">
            <sd-tab label="success" icon="check_circle">Pill xanh \u2014 tr\u1EA1ng th\xE1i ho\xE0n th\xE0nh.</sd-tab>
            <sd-tab label="\u0110\xE3 duy\u1EC7t" [badge]="12">N\u1ED9i dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="warning" variant="pills">
            <sd-tab label="warning" icon="warning">Pill v\xE0ng \u2014 c\u1EA7n ch\xFA \xFD.</sd-tab>
            <sd-tab label="Ch\u1EDD x\u1EED l\xFD" [badge]="5">N\u1ED9i dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="error" variant="pills">
            <sd-tab label="error" icon="error">Pill \u0111\u1ECF \u2014 l\u1ED7i / nghi\xEAm tr\u1ECDng.</sd-tab>
            <sd-tab label="B\u1ECB t\u1EEB ch\u1ED1i" [badge]="2">N\u1ED9i dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="info" variant="segmented">
            <sd-tab label="info">Segmented info.</sd-tab>
            <sd-tab label="Chi ti\u1EBFt">N\u1ED9i dung.</sd-tab>
          </sd-tab-group>
          <sd-tab-group [stretchTabs]="false" color="secondary" variant="segmented">
            <sd-tab label="secondary">Segmented neutral.</sd-tab>
            <sd-tab label="L\u01B0u tr\u1EEF">N\u1ED9i dung.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tab-long-tab') {
      <demo-section heading="Tab l\u1ED3ng tab" [props]="[{ name: 'variant', value: 'pills / segmented' }]" note="Khi tab l\u1ED3ng tab, \u0111\u1EB7t variant kh\xE1c nhau \u0111\u1EC3 m\u1EAFt ph\xE2n bi\u1EC7t r\xF5 outer vs inner. Outer gi\u1EEF default line; inner \u0111\u1ED5i sang pills ho\u1EB7c segmented.">
        <div class="full">
          <sd-tab-group>
            <sd-tab label="Th\xF4ng tin chung" icon="info">
              <p>Khung outer gi\u1EEF underline Material default.</p>
              <sd-tab-group variant="pills" [stretchTabs]="false">
                <sd-tab label="C\xE1 nh\xE2n">H\u1ECD t\xEAn, email, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i.</sd-tab>
                <sd-tab label="C\xF4ng vi\u1EC7c">Ph\xF2ng ban, ch\u1EE9c v\u1EE5, m\xE3 NV.</sd-tab>
                <sd-tab label="Li\xEAn h\u1EC7 kh\u1EA9n c\u1EA5p">Ng\u01B0\u1EDDi th\xE2n, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i.</sd-tab>
              </sd-tab-group>
            </sd-tab>
            <sd-tab label="C\xE0i \u0111\u1EB7t" icon="settings">
              <sd-tab-group variant="segmented" [stretchTabs]="false">
                <sd-tab label="B\u1EA3o m\u1EADt">\u0110\u1ED5i m\u1EADt kh\u1EA9u, 2FA.</sd-tab>
                <sd-tab label="Th\xF4ng b\xE1o">Email, push, SMS.</sd-tab>
                <sd-tab label="Quy\u1EC1n">Vai tr\xF2, nh\xF3m.</sd-tab>
              </sd-tab-group>
            </sd-tab>
            <sd-tab label="L\u1ECBch s\u1EED" icon="history" [badge]="12">
              <p>B\u1EA3ng nh\u1EADt k\xFD thao t\xE1c.</p>
            </sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dieu-khien-tu-ngoai') {
      <demo-section heading="\u0110i\u1EC1u khi\u1EC3n t\u1EEB ngo\xE0i" [props]="[{ name: '[(selectedIndex)]', value: 'two-way' }]">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <sd-button type="light" color="secondary" prefixIcon="chevron_left" title="Tab tr\u01B0\u1EDBc" (click)="prev()"></sd-button>
          <sd-button type="light" color="secondary" suffixIcon="chevron_right" title="Tab k\u1EBF" (click)="next()"></sd-button>
          <span style="align-self: center; color: #555;">\u0110ang xem tab #{{ twowayIndex() }}</span>
        </div>
        <div class="full">
          <sd-tab-group [(selectedIndex)]="twowayIndexValue">
            <sd-tab label="B\u01B0\u1EDBc 1">N\u1ED9i dung b\u01B0\u1EDBc 1.</sd-tab>
            <sd-tab label="B\u01B0\u1EDBc 2">N\u1ED9i dung b\u01B0\u1EDBc 2.</sd-tab>
            <sd-tab label="B\u01B0\u1EDBc 3">N\u1ED9i dung b\u01B0\u1EDBc 3.</sd-tab>
          </sd-tab-group>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .full { width: 100%; }
    .color-stack { display: flex; flex-direction: column; gap: 16px; }
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabDemoComponent {
  readonly unreadCount = signal(7);

  readonly files = signal<FileTab[]>([
    { id: 'a', name: 'README.md' },
    { id: 'b', name: 'app.component.ts' },
    { id: 'c', name: 'styles.scss' },
  ]);

  onTabClosed(ev: SdTabClosedEvent) {
    this.files.update((arr) => arr.filter((_, i) => i !== ev.index));
  }

  readonly twowayIndex = signal(0);

  get twowayIndexValue() { return this.twowayIndex(); }
  set twowayIndexValue(v: number) { this.twowayIndex.set(v); }

  prev() { this.twowayIndex.update((v) => Math.max(0, v - 1)); }
  next() { this.twowayIndex.update((v) => Math.min(2, v + 1)); }
}
`,scss:`.full { width: 100%; }
.color-stack { display: flex; flex-direction: column; gap: 16px; }
:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
}`},"components/tab-router":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';

// TODO: <sd-tab-router-outlet> l\xE0 router-shell, c\u1EA7n Router + nhi\u1EC1u route \u0111\u01B0\u1EE3c decorate
// b\u1EB1ng @SdTabComponent \u0111\u1EC3 ho\u1EA1t \u0111\u1ED9ng \u0111\u1EA7y \u0111\u1EE7. Trong m\xF4i tr\u01B0\u1EDDng showcase \u0111\u01A1n gi\u1EA3n (route ph\u1EB3ng,
// m\u1ED7i trang l\xE0 m\u1ED9t demo \u0111\u1ED9c l\u1EADp) kh\xF4ng th\u1EC3 demo tr\u1EF1c ti\u1EBFp m\xE0 kh\xF4ng thay \u0111\u1ED5i c\u1EA5u tr\xFAc route.
// Trang n\xE0y hi\u1EC3n th\u1ECB m\xF4 t\u1EA3 + \u1EA3nh minh h\u1ECDa pill, k\xE8m h\u01B0\u1EDBng d\u1EABn xem v\xED d\u1EE5 th\u1EADt trong code.

@Component({
  selector: 'app-tab-router-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge],
  template: \`
    <demo-page #demoPage
      title="Tab Router"
      description="Shell router d\u1EA1ng tab ki\u1EC3u tr\xECnh duy\u1EC7t \u2014 m\u1ED7i URL \u0111\u01B0\u1EE3c m\u1EDF th\xE0nh m\u1ED9t tab, gi\u1EEF nguy\xEAn state khi chuy\u1EC3n qua l\u1EA1i.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-preview-dai-tab') {
      <demo-section heading="Preview d\u1EA3i tab" [props]="[{ name: 'routes', value: '[\u2026]' }]">
        <div class="strip">
          <sd-badge type="tag" primary icon="dashboard" title="Trang ch\u1EE7"></sd-badge>
          <sd-badge type="tag" info icon="person" title="Nh\xE2n vi\xEAn #001"></sd-badge>
          <sd-badge type="tag" warning icon="edit" title="\u0110ang ch\u1EC9nh s\u1EEDa h\u1EE3p \u0111\u1ED3ng"></sd-badge>
          <sd-badge type="tag" success icon="check_circle" title="Ph\xEA duy\u1EC7t y\xEAu c\u1EA7u"></sd-badge>
          <sd-badge type="tag" secondary icon="settings" title="C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng"></sd-badge>
        </div>
        <p class="note">
          M\u1ED7i pill \u1EDF tr\xEAn \u0111\u1EA1i di\u1EC7n cho m\u1ED9t tab. Click s\u1EBD \u0111i\u1EC1u h\u01B0\u1EDBng \u0111\u1EBFn URL t\u01B0\u01A1ng \u1EE9ng;
          tab gi\u1EEF state (form, scroll, request) khi user chuy\u1EC3n sang tab kh\xE1c v\xE0 quay l\u1EA1i.
        </p>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tich-hop-app-shell') {
      <demo-section heading="T\xEDch h\u1EE3p app shell" [props]="[{ name: '@SdTabComponent', value: 'template' }]">
        <div class="code">
          <pre>{{ snippet1 }}</pre>
        </div>
        <p class="note">
          Decorate component \u0111\xEDch b\u1EB1ng <code>&#64;SdTabComponent</code> \u0111\u1EC3 cung c\u1EA5p metadata
          (name, icon, color) cho pill. Outlet s\u1EBD t\u1EF1 d\u1EF1ng tab khi route \u0111\u01B0\u1EE3c activate.
        </p>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-replacetab-beforeclose') {
      <demo-section heading="replaceTab + beforeClose" [props]="[{ name: 'replaceTab', value: 'fn' }, { name: 'beforeClose', value: 'fn' }]">
        <div class="code">
          <pre>{{ snippet2 }}</pre>
        </div>
        <p class="note">
          Truy\u1EC1n <code>state.replaceTab</code> \u0111\u1EC3 thay tab hi\u1EC7n t\u1EA1i thay v\xEC m\u1EDF th\xEAm. G\xE1n
          <code>tab.beforeClose</code> \u0111\u1EC3 x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi \u0111\xF3ng (vd: c\u1EA3nh b\xE1o unsaved changes).
        </p>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      border: 1px dashed #d6d6d6;
      border-radius: 8px;
      background: #fafafa;
      width: 100%;
    }
    .note {
      width: 100%;
      font-size: 13px;
      color: #555;
      margin: 8px 0 0;
    }
    .code {
      width: 100%;
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      padding: 12px 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      overflow-x: auto;
    }
    .code pre { margin: 0; white-space: pre; }
    code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabRouterDemoComponent {
  readonly snippet1 = \`<!-- app.component.html -->
<sd-page>
  <sd-tab-router-outlet></sd-tab-router-outlet>
</sd-page>

// employee-detail.component.ts
@SdTabComponent({
  component: EmployeeDetailComponent,
  name: ({ params }) => 'Nh\xE2n vi\xEAn #' + params.id,
  icon: 'person',
  color: 'primary'
})
@Component({ /* ... */ })
export class EmployeeDetailComponent {}\`;

  readonly snippet2 = \`// Thay tab hi\u1EC7n t\u1EA1i
this.router.navigate(['/employees', id, 'edit'], {
  state: { replaceTab: true }
});

// X\xE1c nh\u1EADn tr\u01B0\u1EDBc khi \u0111\xF3ng tab
this.tab.beforeClose = async () => {
  if (!this.form.dirty) return true;
  return await this.confirm.ask('B\u1EA1n c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u. \u0110\xF3ng tab?');
};\`;
}
`,scss:`.strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px dashed #d6d6d6;
  border-radius: 8px;
  background: #fafafa;
  width: 100%;
}
.note {
  width: 100%;
  font-size: 13px;
  color: #555;
  margin: 8px 0 0;
}
.code {
  width: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  overflow-x: auto;
}
.code pre { margin: 0; white-space: pre; }
code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 12px; }`},"components/table":{typescript:`import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdTable,
  SdTableOption,
  SdTableCellDefDirective,
  SdTableCommandHeaderDefDirective,
  SdTableExpandDefDirective,
  SdTableGroupDefDirective,
  SdMaterialFooterDefDirective,
  SdTableItem,
} from '@sdcorejs/angular/components/table';

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  status: 'ACTIVE' | 'PROBATION' | 'RESIGNED';
  joinDate: Date;
  active: boolean;
  email: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  amount: number;
  stock: number;
  active: boolean;
}

interface OrgNode {
  id: number;
  name: string;
  role: string;
  headcount: number;
  children?: OrgNode[];
}

interface Task {
  id: number;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  description: string;
}

interface Order {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  product: string;
  qty: number;
  amount: number;
  date: Date;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: 'Nguy\u1EC5n V\u0103n An', department: 'TECH', position: 'Tr\u01B0\u1EDFng ph\xF2ng', salary: 35_000_000, status: 'ACTIVE', joinDate: new Date(2020, 0, 15), active: true, email: 'an.nv@company.vn' },
  { id: 2, name: 'Tr\u1EA7n Th\u1ECB B\xECnh', department: 'SALES', position: 'Nh\xE2n vi\xEAn', salary: 18_000_000, status: 'ACTIVE', joinDate: new Date(2021, 4, 1), active: true, email: 'binh.tt@company.vn' },
  { id: 3, name: 'L\xEA Ho\xE0ng C\u01B0\u1EDDng', department: 'TECH', position: 'Senior Dev', salary: 28_000_000, status: 'PROBATION', joinDate: new Date(2024, 11, 1), active: true, email: 'cuong.lh@company.vn' },
  { id: 4, name: 'Ph\u1EA1m Th\u1ECB Dung', department: 'HR', position: 'Chuy\xEAn vi\xEAn', salary: 16_000_000, status: 'ACTIVE', joinDate: new Date(2022, 2, 10), active: true, email: 'dung.pt@company.vn' },
  { id: 5, name: 'Ho\xE0ng Minh Em', department: 'FINANCE', position: 'K\u1EBF to\xE1n', salary: 17_500_000, status: 'RESIGNED', joinDate: new Date(2019, 7, 20), active: false, email: 'em.hm@company.vn' },
  { id: 6, name: 'V\u0169 V\u0103n Ph\xFAc', department: 'MARKETING', position: 'Tr\u01B0\u1EDFng nh\xF3m', salary: 22_000_000, status: 'ACTIVE', joinDate: new Date(2021, 9, 5), active: true, email: 'phuc.vv@company.vn' },
  { id: 7, name: '\u0110\u1ED7 Thu Giang', department: 'SALES', position: 'Tr\u01B0\u1EDFng ph\xF2ng', salary: 32_000_000, status: 'ACTIVE', joinDate: new Date(2018, 1, 12), active: true, email: 'giang.dt@company.vn' },
  { id: 8, name: 'B\xF9i Quang Huy', department: 'TECH', position: 'Junior Dev', salary: 14_000_000, status: 'PROBATION', joinDate: new Date(2025, 0, 4), active: true, email: 'huy.bq@company.vn' },
];

const PRODUCTS: Product[] = [
  { id: 1, code: 'SP-001', name: 'Laptop Dell Latitude 5430', amount: 22_500_000, stock: 12, active: true },
  { id: 2, code: 'SP-002', name: 'M\xE0n h\xECnh LG UltraWide 34"', amount: 9_800_000, stock: 8, active: true },
  { id: 3, code: 'SP-003', name: 'B\xE0n ph\xEDm c\u01A1 Keychron K6', amount: 2_300_000, stock: 0, active: false },
  { id: 4, code: 'SP-004', name: 'Chu\u1ED9t Logitech MX Master 3S', amount: 2_750_000, stock: 25, active: true },
  { id: 5, code: 'SP-005', name: 'Tai nghe Sony WH-1000XM5', amount: 7_500_000, stock: 4, active: true },
];

const ORG: OrgNode[] = [
  {
    id: 1, name: 'Kh\u1ED1i C\xF4ng ngh\u1EC7', role: 'Division', headcount: 42, children: [
      { id: 11, name: 'Ph\xF2ng Backend', role: 'Department', headcount: 18, children: [
        { id: 111, name: 'Nh\xF3m API', role: 'Team', headcount: 8 },
        { id: 112, name: 'Nh\xF3m Data', role: 'Team', headcount: 10 },
      ] },
      { id: 12, name: 'Ph\xF2ng Frontend', role: 'Department', headcount: 14 },
      { id: 13, name: 'Ph\xF2ng QA', role: 'Department', headcount: 10 },
    ],
  },
  {
    id: 2, name: 'Kh\u1ED1i Kinh doanh', role: 'Division', headcount: 28, children: [
      { id: 21, name: 'Ph\xF2ng Sales B\u1EAFc', role: 'Department', headcount: 16 },
      { id: 22, name: 'Ph\xF2ng Sales Nam', role: 'Department', headcount: 12 },
    ],
  },
];

// Lazy tree demo: ch\u1EC9 c\xF3 root s\u1EB5n, children n\u1EA1p theo y\xEAu c\u1EA7u (gi\u1EA3 l\u1EADp API tr\u1EC5).
const LAZY_ROOTS: OrgNode[] = [
  { id: 1, name: 'Kh\u1ED1i C\xF4ng ngh\u1EC7', role: 'Division', headcount: 42 },
  { id: 2, name: 'Kh\u1ED1i Kinh doanh', role: 'Division', headcount: 28 },
];
const LAZY_CHILDREN: Record<number, OrgNode[]> = {
  1: [
    { id: 11, name: 'Ph\xF2ng Backend', role: 'Department', headcount: 18 },
    { id: 12, name: 'Ph\xF2ng Frontend', role: 'Department', headcount: 14 },
  ],
  11: [
    { id: 111, name: 'Nh\xF3m API', role: 'Team', headcount: 8 },
    { id: 112, name: 'Nh\xF3m Data', role: 'Team', headcount: 10 },
  ],
  2: [
    { id: 21, name: 'Ph\xF2ng Sales B\u1EAFc', role: 'Department', headcount: 16 },
    { id: 22, name: 'Ph\xF2ng Sales Nam', role: 'Department', headcount: 12 },
  ],
};

const ORDERS: Order[] = [
  { id: 1, code: 'ORD-001', customerId: 1, customerName: 'Nguy\u1EC5n V\u0103n An', customerPhone: '0912345678', product: 'Laptop Dell', qty: 1, amount: 22_500_000, date: new Date(2026, 4, 1) },
  { id: 2, code: 'ORD-002', customerId: 1, customerName: 'Nguy\u1EC5n V\u0103n An', customerPhone: '0912345678', product: 'Chu\u1ED9t Logitech', qty: 2, amount: 5_500_000, date: new Date(2026, 4, 3) },
  { id: 3, code: 'ORD-003', customerId: 1, customerName: 'Nguy\u1EC5n V\u0103n An', customerPhone: '0912345678', product: 'Tai nghe Sony', qty: 1, amount: 7_500_000, date: new Date(2026, 4, 10) },
  { id: 4, code: 'ORD-004', customerId: 2, customerName: 'Tr\u1EA7n Th\u1ECB B\xECnh', customerPhone: '0987654321', product: 'M\xE0n h\xECnh LG', qty: 1, amount: 9_800_000, date: new Date(2026, 4, 2) },
  { id: 5, code: 'ORD-005', customerId: 2, customerName: 'Tr\u1EA7n Th\u1ECB B\xECnh', customerPhone: '0987654321', product: 'B\xE0n ph\xEDm Keychron', qty: 1, amount: 2_300_000, date: new Date(2026, 4, 8) },
  { id: 6, code: 'ORD-006', customerId: 3, customerName: 'L\xEA Ho\xE0ng C\u01B0\u1EDDng', customerPhone: '0901234567', product: 'Laptop Macbook', qty: 1, amount: 45_000_000, date: new Date(2026, 4, 5) },
  { id: 7, code: 'ORD-007', customerId: 3, customerName: 'L\xEA Ho\xE0ng C\u01B0\u1EDDng', customerPhone: '0901234567', product: 'Magic Mouse', qty: 1, amount: 2_500_000, date: new Date(2026, 4, 6) },
  { id: 8, code: 'ORD-008', customerId: 4, customerName: 'Ph\u1EA1m Th\u1ECB Dung', customerPhone: '0934567890', product: 'iPad Pro', qty: 1, amount: 28_000_000, date: new Date(2026, 4, 12) },
];

const TASKS: Task[] = [
  { id: 1, title: 'T\xEDch h\u1EE3p c\u1ED5ng thanh to\xE1n VNPay', assignee: 'An', priority: 'high', progress: 65, description: 'Tri\u1EC3n khai SDK VNPay phase 1 \u2014 sandbox + production switch, log audit, retry policy 3 l\u1EA7n.' },
  { id: 2, title: 'S\u1EEDa l\u1ED7i NaN c\u1ED9t STT', assignee: 'B\xECnh', priority: 'medium', progress: 100, description: 'C\u1ED9t STT hi\u1EC3n th\u1ECB NaN khi multiTemplateDataRows=true. \u0110\xE3 \u0111\u1ED5i sang renderIndex.' },
  { id: 3, title: 'Migrate import sdcorejs/utils', assignee: 'C\u01B0\u1EDDng', priority: 'low', progress: 80, description: 'Chuy\u1EC3n 80 file production code d\xF9ng @sdcorejs/angular/utilities sang @sdcorejs/utils. 4 batch parallel.' },
];

@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    DecimalPipe,
    SdTable,
    SdTableCellDefDirective,
    SdTableCommandHeaderDefDirective,
    SdTableExpandDefDirective,
    SdTableGroupDefDirective,
    SdMaterialFooterDefDirective,
    SdButton,
  ],
  template: \`
    <demo-page #demoPage
      title="Table"
      description="B\u1EA3ng d\u1EEF li\u1EC7u m\u1EB7c \u0111\u1ECBnh c\u1EE7a SDCoreJS \u2014 ph\xE2n trang, s\u1EAFp x\u1EBFp, l\u1ECDc, ch\u1ECDn nhi\u1EC1u, l\u1EC7nh d\xF2ng, export Excel/CSV. H\u1ED7 tr\u1EE3 ch\u1EBF \u0111\u1ED9 local v\xE0 server.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-full-demo-local') {
      <demo-section heading="Full demo (local)" [props]="[{ name: 'selector', value: 'true' }, { name: 'command', value: 'true' }, { name: 'export', value: 'true' }, { name: 'index', value: 'true' }, { name: 'filler', value: 'true' }, { name: 'paginate', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="employeeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toi-gian') {
      <demo-section heading="T\u1ED1i gi\u1EA3n" [props]="[{ name: 'paginate', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="productOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-filter-onchange') {
      <demo-section
        heading="Filter onChange"
        [props]="[
          { name: 'columns[].filter.onChange', value: 'callback' },
          { name: 'input / input-number', value: 'Enter / blur' }
        ]"
        note="Callback ch\u1EC9 ch\u1EA1y khi gi\xE1 tr\u1ECB filter \u0111\xE3 commit v\xE0 kh\xE1c l\u1EA7n tr\u01B0\u1EDBc; input text/number commit b\u1EB1ng Enter ho\u1EB7c blur.">
        <div class="table-box">
          <div class="filter-change-log">
            <span class="filter-change-log__label">Callback cu\u1ED1i:</span>
            <span>{{ filterOnChangeEvent() }}</span>
          </div>
          <sd-table [option]="filterOnChangeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-mot-dong') {
      <demo-section heading="Ch\u1ECDn m\u1ED9t d\xF2ng" [props]="[{ name: 'selector.single', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="singleSelectOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-rows-search-o-cap-con-go-ten-don-vi-con-de-loc') {
      <demo-section
        heading="Tree rows + search \u1EDF c\u1EA5p con (g\xF5 t\xEAn \u0111\u01A1n v\u1ECB con \u0111\u1EC3 l\u1ECDc)"
        [props]="[
          { name: 'tree.loadType', value: 'static' },
          { name: 'tree.childrenKey', value: 'children' },
          { name: 'tree.defaultExpanded', value: '1' },
          { name: 'columns[].filter', value: 'config' }
        ]"
        note="Search tr\xEAn table 'local' + tree 'static' l\u1ECDc c\u1EA3 c\u1EA5p con: gi\u1EEF nh\xE1nh cha c\u1EE7a node kh\u1EDBp, prune sibling kh\xF4ng kh\u1EDBp, t\u1EF1 bung t\u1EDBi node kh\u1EDBp.">
        <div class="table-box">
          <sd-table [option]="treeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-lazy-nap-con-khi-bung-co-loading') {
      <demo-section
        heading="Tree lazy \u2014 n\u1EA1p con khi bung (c\xF3 loading)"
        [props]="[
          { name: 'tree.loadType', value: 'lazy' },
          { name: 'tree.onExpandChildren', value: 'Promise' },
          { name: 'tree.hasChildren', value: 'method' }
        ]"
        note="loadType 'lazy': bung d\xF2ng \u2192 g\u1ECDi onExpandChildren (gi\u1EA3 l\u1EADp tr\u1EC5 800ms) \u2192 spinner loading hi\u1EC7n trong \xF4 chevron t\u1EDBi khi n\u1EA1p xong. hasChildren quy\u1EBFt \u0111\u1ECBnh d\xF2ng n\xE0o c\xF3 icon expand (Nh\xF3m/Team l\xE0 l\xE1 \u2192 kh\xF4ng icon).">
        <div class="table-box">
          <sd-table [option]="treeLazyOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-khong-cot-stt-chevron-nam-trong-cot-dau-don-vi') {
      <demo-section
        heading="Tree KH\xD4NG c\u1ED9t STT \u2014 chevron n\u1EB1m trong c\u1ED9t \u0111\u1EA7u (\u0110\u01A1n v\u1ECB)"
        [props]="[
          { name: 'tree.loadType', value: 'static' },
          { name: 'index', value: 'false' }
        ]"
        note="Kh\xF4ng b\u1EADt index \u2192 icon expand + indent nh\xFAng th\u1EB3ng v\xE0o c\u1ED9t data \u0111\u1EA7u ti\xEAn (ki\u1EC3u file explorer).">
        <div class="table-box">
          <sd-table [option]="treeNoIndexOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-selector-command-chinh-indent') {
      <demo-section
        heading="Tree + selector + command + ch\u1EC9nh indent"
        [props]="[
          { name: 'tree.indentSize', value: treeCommandIndentSize() + 'px' },
          { name: 'selector.visible', value: 'true' },
          { name: 'command.align', value: 'right' }
        ]"
        note="Demo ph\u1ED1i h\u1EE3p tree rows v\u1EDBi checkbox selector, bulk actions, command theo t\u1EEBng d\xF2ng v\xE0 thay \u0111\u1ED5i indent tr\u1EF1c ti\u1EBFp.">
        <div class="table-box">
          <div class="tree-command-toolbar">
            <span class="tree-command-toolbar__label">Indent: {{ treeCommandIndentSize() }}px</span>
            <sd-button
              type="light"
              color="secondary"
              prefixIcon="format_indent_decrease"
              title="Gi\u1EA3m indent"
              [disabled]="treeCommandIndentSize() <= 8"
              (click)="decreaseTreeCommandIndent()">
            </sd-button>
            <sd-button
              type="light"
              color="primary"
              prefixIcon="format_indent_increase"
              title="T\u0103ng indent"
              [disabled]="treeCommandIndentSize() >= 32"
              (click)="increaseTreeCommandIndent()">
            </sd-button>
          </div>
          <sd-table [option]="treeCommandOption()"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-dong') {
      <demo-section heading="Nh\xF3m d\xF2ng" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="groupOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data" let-isExpanded="isExpanded">
              <div class="group-header-cell">
                <span class="group-label">Ph\xF2ng <b>{{ values['department'] }}</b></span>
                <span class="group-meta">\u2014 {{ data.length }} nh\xE2n vi\xEAn \xB7 tr\u1EA1ng th\xE1i: {{ isExpanded ? 'expand' : 'collapse' }}</span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-don-hang-theo-khach') {
      <demo-section heading="Nh\xF3m \u0111\u01A1n h\xE0ng theo kh\xE1ch" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="customerOrderOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data">
              <div class="group-header-cell">
                <span class="group-label">
                  Kh\xE1ch: <b>{{ values['customerId'] === 1 ? 'Nguy\u1EC5n V\u0103n An' : values['customerId'] === 2 ? 'Tr\u1EA7n Th\u1ECB B\xECnh' : values['customerId'] === 3 ? 'L\xEA Ho\xE0ng C\u01B0\u1EDDng' : 'Ph\u1EA1m Th\u1ECB Dung' }}</b>
                </span>
                <span class="group-meta">
                  \u2014 {{ data.length }} \u0111\u01A1n \xB7 T\u1ED5ng: {{ totalOrderAmount(data) | number: '1.0-0' }} \u20AB
                </span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dong-mo-rong') {
      <demo-section heading="D\xF2ng m\u1EDF r\u1ED9ng" [props]="[{ name: 'expand', value: 'true' }, { name: 'sdTableExpandDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="expandOption">
            <ng-template sdTableExpandDef let-item="item">
              <div class="expand-box">
                <div class="expand-title">M\xF4 t\u1EA3 task #{{ item.data.id }}</div>
                <p>{{ item.data.description }}</p>
                <div class="expand-meta">
                  Ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch: <b>{{ item.data.assignee }}</b> \xB7 Ti\u1EBFn \u0111\u1ED9: <b>{{ item.data.progress }}%</b>
                </div>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lenh-dong-phai') {
      <demo-section heading="L\u1EC7nh d\xF2ng ph\u1EA3i" [props]="[{ name: 'command.align', value: 'right' }]">
        <div class="table-box">
          <sd-table [option]="commandRightOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lenh-dong-co-menu-con') {
      <demo-section
        heading="L\u1EC7nh d\xF2ng c\xF3 menu con"
        [props]="[
          { name: 'command.commands[].children', value: 'SdTableCommandNormal[]' },
          { name: 'command.align', value: 'right' }
        ]"
        note="Command c\xF3 children s\u1EBD render th\xE0nh n\xFAt menu; c\xE1c child command v\u1EABn h\u1ED7 tr\u1EE3 icon, title, color, disabled, hidden v\xE0 click theo t\u1EEBng row.">
        <div class="table-box">
          <sd-table [option]="commandChildrenOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-keo-tha-doi-thu-tu') {
      <demo-section heading="K\xE9o th\u1EA3 \u0111\u1ED5i th\u1EE9 t\u1EF1" [props]="[{ name: 'rowReorder', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="reorderOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hanh-dong-o-header-cot-command') {
      <demo-section
        heading="H\xE0nh \u0111\u1ED9ng \u1EDF header c\u1ED9t command"
        [props]="[{ name: 'sdTableCommandHeaderDef', value: 'template' }]"
        note="\xD4 header c\u1EE7a c\u1ED9t command v\u1ED1n \u0111\u1EC3 tr\u1ED1ng. Chi\u1EBFu n\u1ED9i dung v\xE0o \u0111\xF3 \u0111\u1EC3 \u0111\u1EB7t m\u1ED9t h\xE0nh \u0111\u1ED9ng c\u1EA5p b\u1EA3ng (\u1EDF \u0111\xE2y l\xE0 th\xEAm d\xF2ng) ngay tr\xEAn c\u1EE5m s\u1EEDa/xo\xE1 c\u1EE7a t\u1EEBng d\xF2ng, kh\u1ECFi c\u1EA7n th\xEAm m\u1ED9t d\u1EA3i ri\xEAng d\u01B0\u1EDBi b\u1EA3ng.">
        <div class="table-box">
          <sd-table [option]="commandHeaderOption">
            <ng-template sdTableCommandHeaderDef>
              <sd-button prefixIcon="add" type="text" color="primary" tooltip="Th\xEAm d\xF2ng" (click)="addCommandHeaderRow()"></sd-button>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cell-template-tuy-chinh') {
      <demo-section heading="Cell template t\xF9y ch\u1EC9nh" [props]="[{ name: 'sdTableCellDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="customCellOption">
            <ng-template [sdTableCellDef]="'name'" let-item="item">
              <div class="name-cell">
                <span class="avatar">{{ item.name.charAt(0) }}</span>
                <div>
                  <div class="name-line">{{ item.name }}</div>
                  <div class="email-line">{{ item.email }}</div>
                </div>
              </div>
            </ng-template>
            <ng-template [sdTableCellDef]="'status'" let-item="item">
              <span class="chip chip-{{ item.status.toLowerCase() }}">{{ item.status }}</span>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-tong-hop') {
      <demo-section heading="Footer t\u1ED5ng h\u1EE3p" [props]="[{ name: 'sdTableFooterDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="footerOption">
            <ng-template [sdTableFooterDef]="'salary'" let-items="items">
              <b>T\u1ED5ng: {{ totalSalary(items) | number: '1.0-0' }} \u20AB</b>
            </ng-template>
            <ng-template [sdTableFooterDef]="'name'" let-items="items">
              <span>{{ items.length }} nh\xE2n vi\xEAn</span>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khong-co-filler') {
      <demo-section heading="Kh\xF4ng c\xF3 filler" [props]="[{ name: 'filler', value: 'false' }]">
        <div class="table-box">
          <sd-table [option]="noFillerOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-server-side') {
      <demo-section heading="Server-side" [props]="[{ name: 'type', value: 'server' }]">
        <div class="table-box">
          <sd-table [option]="serverOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-giu-selection-xuyen-trang') {
      <demo-section heading="Gi\u1EEF selection xuy\xEAn trang" [props]="[{ name: 'selector.preserveSelection', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="preserveSelectionOption"></sd-table>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .table-box { width: 100%; }
    .tree-command-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tree-command-toolbar__label {
      color: #4b5563;
      font-size: 13px;
      font-weight: 600;
    }
    .expand-box {
      padding: 12px 16px;
      background: #fafafa;
      border-left: 3px solid var(--sd-primary, #005cbb);
    }
    .expand-title {
      font-weight: 600;
      margin-bottom: 6px;
    }
    .expand-meta {
      margin-top: 8px;
      font-size: 12px;
      color: #555;
    }
    .name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--sd-primary, #005cbb);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
    }
    .name-line { font-weight: 600; }
    .email-line { font-size: 12px; color: #777; }
    .chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .chip-active { background: #e6f7ec; color: #1f7a3e; }
    .chip-probation { background: #fff4e0; color: #b3691a; }
    .chip-resigned { background: #fde7e7; color: #b32626; }
    .group-header-cell {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      font-size: 14px;
    }
    .group-label { font-weight: 600; }
    .group-meta { color: #777; font-size: 12px; }
    .filter-change-log {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      color: #374151;
      font-size: 13px;
    }
    .filter-change-log__label {
      color: #6b7280;
      font-weight: 600;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDemoComponent {
  readonly filterOnChangeEvent = signal('Ch\u01B0a c\xF3 thay \u0111\u1ED5i');

  readonly employeeOption: SdTableOption<Employee> = {
    type: 'local',
    key: 'showcase-employee-table',
    items: () => EMPLOYEES,
    sort: { enable: true },
    paginate: { pageSize: 5, pages: [5, 10, 25] },
    config: { visible: true, resizable: true },
    index: { enabled: true },
    filler: { enabled: true },
    selector: {
      visible: true,
      actions: [
        { icon: 'mail', title: 'G\u1EEDi email', click: items => alert(\`G\u1EEDi email t\u1EDBi \${items?.length} nh\xE2n vi\xEAn\`) },
        { icon: 'delete', title: 'X\xF3a', color: 'error', click: items => alert(\`X\xF3a \${items?.length} nh\xE2n vi\xEAn\`) },
      ],
      message: items => \`\u0110\xE3 ch\u1ECDn \${items?.length ?? 0} nh\xE2n vi\xEAn\`,
    },
    command: {
      align: 'right',
      commands: [
        { icon: 'edit', title: 'S\u1EEDa', click: (e: Employee) => alert(\`S\u1EEDa: \${e.name}\`) },
        { icon: 'delete', title: 'X\xF3a', color: 'error', click: (e: Employee) => alert(\`X\xF3a: \${e.name}\`) },
      ],
    },
    export: { visible: 'EXCEL' },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD v\xE0 t\xEAn', width: '180px', sortable: true },
      { field: 'email', type: 'string', title: 'Email', width: '220px' },
      {
        field: 'department', type: 'values', title: 'Ph\xF2ng ban', width: '140px',
        option: {
          items: [
            { value: 'TECH', display: 'C\xF4ng ngh\u1EC7' },
            { value: 'SALES', display: 'Kinh doanh' },
            { value: 'HR', display: 'Nh\xE2n s\u1EF1' },
            { value: 'FINANCE', display: 'T\xE0i ch\xEDnh' },
            { value: 'MARKETING', display: 'Marketing' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
      },
      { field: 'position', type: 'string', title: 'Ch\u1EE9c v\u1EE5', width: '160px' },
      { field: 'salary', type: 'number', title: 'L\u01B0\u01A1ng', width: '140px', align: 'right', sortable: true },
      {
        field: 'status', type: 'values', title: 'Tr\u1EA1ng th\xE1i', width: '130px',
        option: {
          items: [
            { value: 'ACTIVE', display: '\u0110ang l\xE0m vi\u1EC7c' },
            { value: 'PROBATION', display: 'Th\u1EED vi\u1EC7c' },
            { value: 'RESIGNED', display: '\u0110\xE3 ngh\u1EC9' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
        useBadge: (v: string) => v === 'ACTIVE'
          ? { title: '\u0110ang l\xE0m vi\u1EC7c', color: 'success' }
          : v === 'PROBATION'
            ? { title: 'Th\u1EED vi\u1EC7c', color: 'warning' }
            : { title: '\u0110\xE3 ngh\u1EC9', color: 'error' },
      },
      { field: 'joinDate', type: 'date', title: 'Ng\xE0y v\xE0o', width: '130px' },
    ],
    style: { shadow: true, maxHeight: '460px' },
  };

  readonly productOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    sort: { enable: true },
    paginate: { pageSize: 5, hidePageSize: true },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3 SP', width: '120px' },
      { field: 'name', type: 'string', title: 'T\xEAn s\u1EA3n ph\u1EA9m', width: '320px' },
      { field: 'amount', type: 'number', title: 'Gi\xE1 b\xE1n (VND)', width: '160px', align: 'right' },
      {
        field: 'stock', type: 'number', title: 'T\u1ED3n kho', width: '120px', align: 'right',
        useBadge: (v: number) => v === 0
          ? { title: 'H\u1EBFt h\xE0ng', color: 'error' }
          : v < 5
            ? { title: \`\${v} (s\u1EAFp h\u1EBFt)\`, color: 'warning' }
            : { title: \`\${v}\`, color: 'success' },
      },
      { field: 'active', type: 'boolean', title: 'K\xEDch ho\u1EA1t', width: '120px', option: { displayOnTrue: 'C\xF3', displayOnFalse: 'Kh\xF4ng' } },
    ],
    style: { shadow: true },
  };

  readonly filterOnChangeOption: SdTableOption<Product> = {
    type: 'local',
    key: 'showcase-filter-on-change-table',
    items: () => PRODUCTS,
    sort: { enable: true },
    paginate: { pageSize: 5, hidePageSize: true },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3 SP', width: '120px' },
      {
        field: 'name',
        type: 'string',
        title: 'T\xEAn s\u1EA3n ph\u1EA9m',
        width: '320px',
        filter: {
          default: '',
          onChange: value => this.recordFilterOnChange('T\xEAn s\u1EA3n ph\u1EA9m', value),
        },
      },
      {
        field: 'stock',
        type: 'number',
        title: 'T\u1ED3n kho',
        width: '120px',
        align: 'right',
        filter: {
          onChange: value => this.recordFilterOnChange('T\u1ED3n kho', value),
        },
      },
      {
        field: 'active',
        type: 'boolean',
        title: 'K\xEDch ho\u1EA1t',
        width: '120px',
        option: { displayOnTrue: 'C\xF3', displayOnFalse: 'Kh\xF4ng' },
      },
    ],
    style: { shadow: true },
  };

  readonly singleSelectOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 5),
    selector: { visible: true, single: true, message: items => \`\u0110\xE3 ch\u1ECDn: \${items?.[0]?.name ?? '(ch\u01B0a ch\u1ECDn)'}\` },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD t\xEAn', width: '200px' },
      { field: 'department', type: 'string', title: 'Ph\xF2ng ban', width: '140px' },
      { field: 'position', type: 'string', title: 'Ch\u1EE9c v\u1EE5', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly treeOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1, indentSize: 16 },
    index: { enabled: true },
    filler: { enabled: true },
    // why: b\u1EADt inline filter \u0111\u1EC3 demo search \u1EDF c\u1EA5p con \u2014 g\xF5 t\xEAn \u0111\u01A1n v\u1ECB con,
    // table gi\u1EEF nh\xE1nh cha + t\u1EF1 bung t\u1EDBi node kh\u1EDBp (static + type 'local').
    columns: [
      { field: 'name', type: 'string', title: '\u0110\u01A1n v\u1ECB', width: '280px', filter: { default: '' } },
      { field: 'role', type: 'string', title: 'C\u1EA5p', width: '140px' },
      { field: 'headcount', type: 'number', title: 'S\u1ED1 nh\xE2n s\u1EF1', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly treeLazyOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => LAZY_ROOTS,
    tree: {
      loadType: 'lazy',
      indentSize: 16,
      // hasChildren: ch\u1EC9 d\xF2ng th\u1EF1c s\u1EF1 c\xF3 con m\u1EDBi hi\u1EC7n icon expand.
      hasChildren: row => !!LAZY_CHILDREN[row.id]?.length,
      // onExpandChildren: gi\u1EA3 l\u1EADp API tr\u1EC5 800ms \u0111\u1EC3 th\u1EA5y spinner loading khi bung.
      onExpandChildren: row =>
        new Promise<OrgNode[]>(resolve => setTimeout(() => resolve(LAZY_CHILDREN[row.id] ?? []), 800)),
    },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: '\u0110\u01A1n v\u1ECB', width: '280px' },
      { field: 'role', type: 'string', title: 'C\u1EA5p', width: '140px' },
      { field: 'headcount', type: 'number', title: 'S\u1ED1 nh\xE2n s\u1EF1', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // Tree kh\xF4ng b\u1EADt index \u2192 chevron + indent nh\xFAng v\xE0o c\u1ED9t data \u0111\u1EA7u (\u0110\u01A1n v\u1ECB).
  readonly treeNoIndexOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1, indentSize: 16 },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: '\u0110\u01A1n v\u1ECB', width: '320px' },
      { field: 'role', type: 'string', title: 'C\u1EA5p', width: '160px' },
      { field: 'headcount', type: 'number', title: 'S\u1ED1 nh\xE2n s\u1EF1', width: '160px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly treeCommandIndentSize = signal(16);

  readonly treeCommandOption = computed<SdTableOption<OrgNode>>(() => ({
    type: 'local',
    key: 'showcase-tree-selector-command-table',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: true, indentSize: this.treeCommandIndentSize() },
    selector: {
      visible: true,
      actions: [
        { icon: 'download', title: 'Xu\u1EA5t \u0111\u01A1n v\u1ECB', click: items => alert(\`Xu\u1EA5t \${items?.length ?? 0} \u0111\u01A1n v\u1ECB\`) },
        { icon: 'account_tree', title: 'G\u1ED9p b\xE1o c\xE1o', click: items => alert(\`G\u1ED9p b\xE1o c\xE1o cho \${items?.length ?? 0} \u0111\u01A1n v\u1ECB\`) },
      ],
      message: items => \`\u0110\xE3 ch\u1ECDn \${items?.length ?? 0} \u0111\u01A1n v\u1ECB\`,
    },
    command: {
      align: 'right',
      commands: [
        {
          icon: row => row.children?.length ? 'account_tree' : 'person',
          title: row => \`Xem \${this.describeOrgNode(row)}\`,
          click: row => alert(\`Xem \${this.describeOrgNode(row)}\`),
        },
        {
          icon: 'add',
          title: 'Th\xEAm \u0111\u01A1n v\u1ECB con',
          hidden: row => !row.children?.length,
          click: row => alert(\`Th\xEAm \u0111\u01A1n v\u1ECB con v\xE0o \${row.name}\`),
        },
        {
          icon: 'delete',
          title: 'X\xF3a \u0111\u01A1n v\u1ECB l\xE1',
          color: 'error',
          hidden: row => !!row.children?.length,
          click: row => alert(\`X\xF3a \${row.name}\`),
        },
      ],
    },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: '\u0110\u01A1n v\u1ECB', width: '320px', filter: { default: '' } },
      { field: 'role', type: 'string', title: 'C\u1EA5p', width: '140px' },
      { field: 'headcount', type: 'number', title: 'S\u1ED1 nh\xE2n s\u1EF1', width: '140px', align: 'right' },
    ],
    style: { shadow: true, maxHeight: '420px' },
  }));

  readonly groupOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    group: { fields: ['department'], collapsible: true },
    selector: { visible: true, message: items => \`\u0110\xE3 ch\u1ECDn \${items?.length ?? 0} nh\xE2n vi\xEAn\` },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD t\xEAn', width: '200px' },
      { field: 'position', type: 'string', title: 'Ch\u1EE9c v\u1EE5', width: '180px' },
      { field: 'salary', type: 'number', title: 'L\u01B0\u01A1ng', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // Demo "\u0111\u01A1n h\xE0ng \xD7 kh\xE1ch h\xE0ng" \u2014 group orders theo customerName.
  readonly customerOrderOption: SdTableOption<Order> = {
    type: 'local',
    items: () => ORDERS,
    group: { fields: ['customerId'], collapsible: true },
    selector: {
      visible: true,
      message: items => \`\u0110\xE3 ch\u1ECDn \${items?.length ?? 0} \u0111\u01A1n\`,
      actions: [
        { icon: 'print', title: 'In', click: items => alert(\`In \${items?.length} \u0111\u01A1n\`) },
        { icon: 'send', title: 'G\u1EEDi mail', click: items => alert(\`G\u1EEDi mail cho \${items?.length} \u0111\u01A1n\`) },
      ],
    },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3 \u0111\u01A1n', width: '120px' },
      { field: 'product', type: 'string', title: 'S\u1EA3n ph\u1EA9m', width: '260px' },
      { field: 'qty', type: 'number', title: 'SL', width: '80px', align: 'right' },
      { field: 'amount', type: 'number', title: 'Th\xE0nh ti\u1EC1n', width: '160px', align: 'right' },
      { field: 'date', type: 'date', title: 'Ng\xE0y', width: '120px' },
    ],
    style: { shadow: true, maxHeight: '500px' },
  };

  readonly expandOption: SdTableOption<Task> = {
    type: 'local',
    items: () => TASKS,
    expand: { multiple: true },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'title', type: 'string', title: 'Task', width: '320px' },
      { field: 'assignee', type: 'string', title: 'Ph\u1EE5 tr\xE1ch', width: '140px' },
      { field: 'priority', type: 'string', title: '\u01AFu ti\xEAn', width: '120px' },
      { field: 'progress', type: 'number', title: 'Ti\u1EBFn \u0111\u1ED9 %', width: '120px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly commandRightOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    filler: { enabled: true },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'Xem', click: (p: Product) => alert(\`Xem \${p.code}\`) },
        { icon: 'edit', title: 'S\u1EEDa', click: (p: Product) => alert(\`S\u1EEDa \${p.code}\`) },
        { icon: 'delete', title: 'X\xF3a', color: 'error', click: (p: Product) => alert(\`X\xF3a \${p.code}\`) },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3', width: '120px' },
      { field: 'name', type: 'string', title: 'T\xEAn', width: '320px' },
      { field: 'amount', type: 'number', title: 'Gi\xE1', width: '160px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly commandChildrenOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    filler: { enabled: true },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'Xem nhanh', click: (p: Product) => alert(\`Xem nhanh \${p.code}\`) },
        {
          icon: 'more_vert',
          title: 'Thao t\xE1c th\xEAm',
          children: [
            { icon: 'content_copy', title: 'Nh\xE2n b\u1EA3n', click: (p: Product) => alert(\`Nh\xE2n b\u1EA3n \${p.code}\`) },
            {
              icon: 'inventory_2',
              title: 'Ki\u1EC3m kho',
              disabled: (p: Product) => p.stock === 0,
              click: (p: Product) => alert(\`Ki\u1EC3m kho \${p.code}: \${p.stock}\`),
            },
            {
              icon: 'block',
              title: 'Ng\u1EEBng b\xE1n',
              color: 'warning',
              hidden: (p: Product) => !p.active,
              click: (p: Product) => alert(\`Ng\u1EEBng b\xE1n \${p.code}\`),
            },
            { icon: 'delete', title: 'X\xF3a', color: 'error', click: (p: Product) => alert(\`X\xF3a \${p.code}\`) },
          ],
        },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3', width: '120px' },
      { field: 'name', type: 'string', title: 'T\xEAn', width: '320px' },
      { field: 'stock', type: 'number', title: 'T\u1ED3n', width: '100px', align: 'right' },
      { field: 'active', type: 'boolean', title: 'K\xEDch ho\u1EA1t', width: '120px', option: { displayOnTrue: 'C\xF3', displayOnFalse: 'Kh\xF4ng' } },
    ],
    style: { shadow: true },
  };

  readonly reorderOption: SdTableOption<Product> = {
    type: 'local',
    items: () => [...PRODUCTS],
    rowReorder: {
      enabled: true,
      onChange: (rows, moved, from, to) => console.log(\`Reordered \${moved.name} from \${from} to \${to}\`, rows),
    },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3', width: '120px' },
      { field: 'name', type: 'string', title: 'T\xEAn', width: '320px' },
      { field: 'stock', type: 'number', title: 'T\u1ED3n', width: '100px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // why: d\xF9ng signal cho items \u0111\u1EC3 n\xFAt "th\xEAm d\xF2ng" trong header command c\xF3 th\u1EE9 \u0111\u1EC3 t\xE1c \u0111\u1ED9ng th\u1EADt,
  // thay v\xEC ch\u1EC9 l\xE0 m\u1ED9t n\xFAt trang tr\xED.
  readonly commandHeaderRows = signal<Employee[]>(EMPLOYEES.slice(0, 3));
  readonly commandHeaderOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => this.commandHeaderRows(),
    paginate: { hidden: true },
    commands: [
      { icon: 'edit', title: 'S\u1EEDa', click: () => undefined },
      { icon: 'delete', title: 'Xo\xE1', click: row => this.commandHeaderRows.update(rows => rows.filter(e => e.id !== row.id)) },
    ],
    columns: [
      { field: 'name', type: 'string', title: 'Nh\xE2n s\u1EF1', width: '260px' },
      { field: 'department', type: 'string', title: 'Ph\xF2ng', width: '140px' },
      { field: 'position', type: 'string', title: 'Ch\u1EE9c v\u1EE5' },
    ],
    style: { shadow: true },
  };

  readonly customCellOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 6),
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Nh\xE2n s\u1EF1', width: '260px' },
      { field: 'department', type: 'string', title: 'Ph\xF2ng', width: '140px' },
      { field: 'status', type: 'string', title: 'Tr\u1EA1ng th\xE1i', width: '160px' },
    ],
    style: { shadow: true },
  };

  readonly footerOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD t\xEAn', width: '200px' },
      { field: 'department', type: 'string', title: 'Ph\xF2ng', width: '140px' },
      { field: 'salary', type: 'number', title: 'L\u01B0\u01A1ng', width: '180px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly noFillerOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    selector: { visible: true },
    index: { enabled: true },
    // filler: KH\xD4NG b\u1EADt \u2192 so s\xE1nh visual v\u1EDBi c\xE1c demo tr\xEAn (c\u1ED9t utility s\u1EBD b\u1ECB browser n\u1EDBi r\u1ED9ng).
    columns: [
      { field: 'code', type: 'string', title: 'M\xE3', width: '120px' },
      { field: 'name', type: 'string', title: 'T\xEAn', width: '320px' },
    ],
    style: { shadow: true },
  };

  readonly preserveSelectionOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    sort: { enable: true },
    paginate: { pageSize: 3, pages: [3, 5, 8] },
    filler: { enabled: true },
    selector: {
      visible: true,
      preserveSelection: true,
      actions: [
        { icon: 'mail', title: 'G\u1EEDi email', click: items => alert(\`G\u1EEDi email t\u1EDBi \${items?.length} nh\xE2n vi\xEAn: \${items?.map(e => e.name).join(', ')}\`) },
      ],
      message: items => \`\u0110\xE3 ch\u1ECDn \${items?.length ?? 0} nh\xE2n vi\xEAn xuy\xEAn trang\`,
    },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD t\xEAn', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'Ph\xF2ng', width: '140px' },
      { field: 'position', type: 'string', title: 'Ch\u1EE9c v\u1EE5', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly serverOption: SdTableOption<Employee> = {
    type: 'server',
    items: async (_filterReq, pagingReq) => {
      // Mock fetch: chia EMPLOYEES theo pagingReq \u0111\u1EC3 minh ho\u1EA1 ki\u1EC3u server-side.
      await new Promise(r => setTimeout(r, 300));
      const page = pagingReq?.pageNumber ?? 0;
      const size = pagingReq?.pageSize ?? 3;
      return { items: EMPLOYEES.slice(page * size, (page + 1) * size), total: EMPLOYEES.length };
    },
    paginate: { pageSize: 3, pages: [3, 5, 8] },
    sort: { enable: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'H\u1ECD t\xEAn', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'Ph\xF2ng', width: '160px' },
      { field: 'salary', type: 'number', title: 'L\u01B0\u01A1ng', width: '160px', align: 'right', sortable: true },
    ],
    style: { shadow: true },
  };

  addCommandHeaderRow(): void {
    this.commandHeaderRows.update(rows => {
      const next = EMPLOYEES[rows.length % EMPLOYEES.length];
      // C\u1EA5p id m\u1EDBi \u0111\u1EC3 b\u1EA3ng kh\xF4ng tr\xF9ng key khi v\xF2ng l\u1EA1i danh s\xE1ch m\u1EABu.
      return [...rows, { ...next, id: Math.max(0, ...rows.map(e => e.id)) + 1 }];
    });
  }

  totalSalary(items: SdTableItem<Employee>[]): number {
    return (items || []).reduce((sum, e) => sum + (e?.data?.salary ?? 0), 0);
  }

  totalOrderAmount(orders: Order[]): number {
    return (orders || []).reduce((sum, o) => sum + (o?.amount ?? 0), 0);
  }

  recordFilterOnChange(label: string, value: unknown): void {
    const displayValue = this.formatFilterValue(value);
    this.filterOnChangeEvent.set(\`\${label}: \${displayValue}\`);
  }

  formatFilterValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '(tr\u1ED1ng)';
    if (value instanceof Date) return value.toLocaleDateString('vi-VN');
    if (Array.isArray(value)) return value.map(item => this.formatFilterValue(item)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return \`\${value}\`;
  }

  increaseTreeCommandIndent(): void {
    this.treeCommandIndentSize.update(value => Math.min(value + 4, 32));
  }

  decreaseTreeCommandIndent(): void {
    this.treeCommandIndentSize.update(value => Math.max(value - 4, 8));
  }

  describeOrgNode(row: OrgNode): string {
    return \`\${row.name} (\${row.role}, \${row.headcount} nh\xE2n s\u1EF1)\`;
  }
}
`,scss:`.table-box { width: 100%; }
.tree-command-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}
.tree-command-toolbar__label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
}
.expand-box {
  padding: 12px 16px;
  background: #fafafa;
  border-left: 3px solid var(--sd-primary, #005cbb);
}
.expand-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.expand-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #555;
}
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sd-primary, #005cbb);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}
.name-line { font-weight: 600; }
.email-line { font-size: 12px; color: #777; }
.chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.chip-active { background: #e6f7ec; color: #1f7a3e; }
.chip-probation { background: #fff4e0; color: #b3691a; }
.chip-resigned { background: #fde7e7; color: #b32626; }
.group-header-cell {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
}
.group-label { font-weight: 600; }
.group-meta { color: #777; font-size: 12px; }
.filter-change-log {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #374151;
  font-size: 13px;
}
.filter-change-log__label {
  color: #6b7280;
  font-weight: 600;
}`},"components/tree":{typescript:`import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  SdTree,
  SdTreeCommand,
  SdTreeComponentOption,
  SdTreeItemDefDirective,
  SdTreeItemLazy,
  SdTreeItemStatic,
  SdTreeLazyOption,
  SdTreeSelectorOption,
  SdTreeStaticOption,
} from '@sdcorejs/angular/components/tree';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface TreeDemoItem {
  id: string;
  title: string;
  description?: string;
  locked?: boolean;
}

@Component({
  selector: 'app-tree-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTree, SdTreeItemDefDirective],
  template: \`
    <demo-page #demoPage
      title="Tree"
      description="C\xE2y \u0111\u1ED9c l\u1EADp cho danh m\u1EE5c, th\u01B0 m\u1EE5c, \u0111\u01A1n v\u1ECB t\u1ED5 ch\u1EE9c: h\u1ED7 tr\u1EE3 static/lazy, selection, command, custom template v\xE0 filter ti\u1EBFng Vi\u1EC7t kh\xF4ng d\u1EA5u.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-static-tree') {
      <demo-section
        heading="Static tree"
        note="Static tree nh\u1EADn SdTreeItemStatic \u0111\xE3 b\u1ECDc s\u1EB5n id, label, data v\xE0 children. Branch d\xF9ng folder icon m\u1EB7c \u0111\u1ECBnh; leaf kh\xF4ng hi\u1EC7n icon n\u1EBFu kh\xF4ng khai b\xE1o icon."
        [props]="[
          { name: 'items', value: 'SdTreeItemStatic<T>[]' },
          { name: 'loadType', value: 'static' },
          { name: 'defaultExpanded', value: '1' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree [option]="staticDemoOption"></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-selection-va-command') {
      <demo-section
        heading="Selection v\xE0 command"
        note="Checkbox ch\u1ECDn nhi\u1EC1u d\xF2ng. Command \u1EDF cu\u1ED1i d\xF2ng, hover v\xE0o row m\u1EDBi th\u1EA5y n\xFAt ba ch\u1EA5m."
        [props]="[
          { name: 'selectedItemsChange', value: 'T[]' },
          { name: 'commands', value: 'SdTreeCommand[]' },
        ]">
        <div class="tree-demo-grid">
          <div class="tree-demo-panel">
            <sd-tree
              [option]="selectionDemoOption"
              (selectedItemsChange)="selectedItems = $event"
              (selectChange)="lastEvent = 'select: ' + $event.item.title"
            ></sd-tree>
          </div>

          <div class="tree-demo-state">
            <strong>Selected</strong>
            @if (selectedItems.length) {
              <ul>
                @for (item of selectedItems; track item.id) {
                  <li>{{ item.title }}</li>
                }
              </ul>
            } @else {
              <span>Ch\u01B0a ch\u1ECDn d\xF2ng n\xE0o</span>
            }
            <small>{{ lastEvent }}</small>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lazy-tree') {
      <demo-section
        heading="Lazy tree"
        note="B\u1EA5m m\u1EDF node \u0111\u1EC3 gi\u1EA3 l\u1EADp t\u1EA3i children. Sau l\u1EA7n \u0111\u1EA7u, children \u0111\u01B0\u1EE3c cache n\u1ED9i b\u1ED9 trong component."
        [props]="[
          { name: 'loadType', value: 'lazy' },
          { name: 'onExpandChildren', value: 'Promise<SdTreeItemLazy<T>[]>' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree
            [option]="lazyDemoOption"
            (expandChange)="lastEvent = 'expand: ' + $event.item.title"
            (collapseChange)="lastEvent = 'collapse: ' + $event.item.title"
          ></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-filter-tieng-viet-khong-dau') {
      <demo-section
        heading="Filter ti\u1EBFng Vi\u1EC7t kh\xF4ng d\u1EA5u"
        note="Filter ch\u1EC9 t\xECm tr\xEAn item \u0111\xE3 load. V\xED d\u1EE5 g\xF5 'ke toan', 'cong no', 'nhan su'."
        [props]="[{ name: 'filter(searchText)', value: 'method' }]">
        <div class="tree-filter">
          <input
            type="search"
            placeholder="T\xECm ki\u1EBFm..."
            [value]="filterText"
            (input)="onFilter(($any($event.target)).value)" />
          <button type="button" (click)="onFilter('')">X\xF3a</button>
        </div>
        <div class="tree-demo-panel">
          <sd-tree #filterTree [option]="filterDemoOption"></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-item-template') {
      <demo-section
        heading="Custom item template"
        note="sdTreeItemDef nh\u1EADn context item, treeItem, level, selected, isLeaf, toggle, select."
        [props]="[
          { name: 'sdTreeItemDef', value: 'template' },
          { name: 'context', value: 'item / treeItem / level / toggle' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree [option]="customDemoOption">
            <ng-template sdTreeItemDef let-item let-level="level" let-isLeaf="isLeaf" let-toggle="toggle">
              <button type="button" class="tree-custom-item" [class.tree-custom-item--leaf]="isLeaf" (click)="toggle()">
                <span>L{{ level + 1 }}</span>
                <strong>{{ item.title }}</strong>
                @if (item.description) {
                  <small>{{ item.description }}</small>
                }
              </button>
            </ng-template>
          </sd-tree>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [
    \`
      .tree-demo-panel {
        width: 100%;
        max-width: 560px;
        padding: 12px;
        background: #fbfcfe;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .tree-demo-grid {
        display: grid;
        grid-template-columns: minmax(280px, 560px) minmax(220px, 1fr);
        gap: 16px;
        align-items: start;
      }

      .tree-demo-state {
        display: grid;
        gap: 8px;
        min-height: 120px;
        padding: 12px;
        color: #102047;
        background: #ffffff;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .tree-demo-state ul {
        margin: 0;
        padding-left: 18px;
      }

      .tree-demo-state small,
      .tree-demo-state span {
        color: #60708a;
      }

      .tree-filter {
        display: flex;
        width: 100%;
        max-width: 560px;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tree-filter input {
        flex: 1 1 auto;
        min-width: 0;
        height: 36px;
        padding: 0 10px;
        color: #102047;
        background: #ffffff;
        border: 1px solid #cfd8e6;
        border-radius: 6px;
      }

      .tree-filter button {
        height: 36px;
        padding: 0 12px;
        color: #1f56d9;
        background: #edf3ff;
        border: 1px solid #cddcff;
        border-radius: 6px;
        cursor: pointer;
      }

      .tree-custom-item {
        display: grid;
        min-width: 0;
        gap: 2px;
        padding: 0;
        color: #102047;
        text-align: left;
        background: transparent;
        border: 0;
        cursor: pointer;
      }

      .tree-custom-item span {
        color: #60708a;
        font-size: 11px;
        font-weight: 700;
      }

      .tree-custom-item strong {
        overflow: hidden;
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        text-overflow: ellipsis;
      }

      .tree-custom-item small {
        overflow: hidden;
        color: #60708a;
        font-size: 12px;
        line-height: 16px;
        text-overflow: ellipsis;
      }

      .tree-custom-item--leaf strong {
        font-weight: 600;
      }

      @media (max-width: 760px) {
        .tree-demo-grid {
          grid-template-columns: 1fr;
        }
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeDemoComponent {
  @ViewChild('filterTree') filterTree?: SdTree<TreeDemoItem>;

  filterText = '';
  selectedItems: TreeDemoItem[] = [];
  lastEvent = 'Ch\u01B0a c\xF3 event';

  readonly staticTree: SdTreeStaticOption<TreeDemoItem> = {
    loadType: 'static',
    defaultExpanded: 1,
  };

  readonly filterTreeOption: SdTreeStaticOption<TreeDemoItem> = {
    loadType: 'static',
    defaultExpanded: true,
  };

  readonly lazyTree: SdTreeLazyOption<TreeDemoItem> = {
    loadType: 'lazy',
    onExpandChildren: item => this.loadChildren(item),
  };

  get staticDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-static',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
    };
  }

  get selectionDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-select',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
      selector: this.selector,
      selectedItems: this.selectedItems,
    };
  }

  get lazyDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-lazy',
      items: this.lazyItems,
      tree: this.lazyTree,
    };
  }

  get filterDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-filter',
      items: this.staticItems,
      tree: this.filterTreeOption,
      commands: this.commands,
    };
  }

  get customDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-custom',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
    };
  }

  readonly commands: SdTreeCommand<TreeDemoItem>[] = [
    {
      key: 'edit',
      title: item => \`S\u1EEDa \${item.title}\`,
      icon: 'edit',
      hidden: item => item.id === 'hr',
      click: item => (this.lastEvent = \`command: edit \${item.title}\`),
    },
    {
      key: 'delete',
      title: 'X\xF3a',
      icon: 'delete',
      disabled: item => !!item.locked,
      click: item => (this.lastEvent = \`command: delete \${item.title}\`),
    },
  ];

  readonly selector: SdTreeSelectorOption<TreeDemoItem> = {
    visible: true,
    message: items => \`\u0110\xE3 ch\u1ECDn \${items.length} m\u1EE5c\`,
    actions: [
      {
        icon: 'archive',
        title: 'L\u01B0u tr\u1EEF',
        color: 'primary',
        type: 'light',
        click: items => (this.lastEvent = \`quick action: l\u01B0u tr\u1EEF \${items.length} m\u1EE5c\`),
      },
    ],
  };

  readonly staticItems: SdTreeItemStatic<TreeDemoItem>[] = [
    treeItem(
      {
        id: 'finance',
        title: 'Ph\xF2ng K\u1EBF to\xE1n',
        description: 'T\xE0i ch\xEDnh n\u1ED9i b\u1ED9',
      },
      [
        treeItem({ id: 'payable', title: 'C\xF4ng n\u1EE3 ph\u1EA3i tr\u1EA3' }, undefined, 'description'),
        treeItem(
          {
            id: 'receivable',
            title: 'C\xF4ng n\u1EE3 ph\u1EA3i thu r\u1EA5t d\xE0i c\u1EA7n hi\u1EC3n th\u1ECB t\u1ED1i \u0111a hai d\xF2ng v\xE0 kh\xF4ng \u0111\xE8 l\xEAn command cu\u1ED1i d\xF2ng',
            description: 'Long label regression',
          },
          undefined,
          'description',
        ),
      ],
    ),
    treeItem(
      {
        id: 'hr',
        title: 'Nh\xE2n s\u1EF1',
        description: 'People operations',
        locked: true,
      },
      [
        treeItem({ id: 'contract', title: 'H\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng' }, undefined, 'article'),
        treeItem({ id: 'onboarding', title: 'Onboarding nh\xE2n vi\xEAn m\u1EDBi' }, undefined, 'checklist'),
      ],
    ),
    treeItem(
      {
        id: 'product',
        title: 'S\u1EA3n ph\u1EA9m',
        description: 'Product & Engineering',
      },
      [
        treeItem({ id: 'design', title: 'UI/UX Design' }),
        treeItem({ id: 'engineering', title: 'Engineering Platform' }),
      ],
    ),
  ];

  readonly lazyItems: SdTreeItemLazy<TreeDemoItem>[] = [
    {
      id: 'company',
      label: 'OneMount',
      data: { id: 'company', title: 'OneMount', description: 'Lazy root' },
      hasChildren: true,
    },
    lazyTreeItem({ id: 'archive', title: 'Kho l\u01B0u tr\u1EEF', description: 'Leaf lazy node' }, false),
  ];

  onFilter(value: string): void {
    this.filterText = value;
    this.filterTree?.filter(value);
  }

  private loadChildren(item: SdTreeItemLazy<TreeDemoItem>): Promise<SdTreeItemLazy<TreeDemoItem>[]> {
    return new Promise(resolve => {
      window.setTimeout(() => {
        resolve([
          {
            id: \`\${item.id}-finance\`,
            label: 'Finance lazy child',
            data: {
              id: \`\${item.id}-finance\`,
              title: 'Finance lazy child',
            },
            hasChildren: item.id === 'company',
          },
          lazyTreeItem(
            {
              id: \`\${item.id}-ops\`,
              title: 'Operations lazy child',
            },
            false,
            'folder_managed',
          ),
        ]);
      }, 650);
    });
  }
}

function treeItem(data: TreeDemoItem, children?: SdTreeItemStatic<TreeDemoItem>[], icon?: string): SdTreeItemStatic<TreeDemoItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    children,
  };
}

function lazyTreeItem(data: TreeDemoItem, hasChildren?: boolean, icon?: string): SdTreeItemLazy<TreeDemoItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    hasChildren,
  };
}
`,scss:`.tree-demo-panel {
  width: 100%;
  max-width: 560px;
  padding: 12px;
  background: #fbfcfe;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
}

.tree-demo-grid {
  display: grid;
  grid-template-columns: minmax(280px, 560px) minmax(220px, 1fr);
  gap: 16px;
  align-items: start;
}

.tree-demo-state {
  display: grid;
  gap: 8px;
  min-height: 120px;
  padding: 12px;
  color: #102047;
  background: #ffffff;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
}

.tree-demo-state ul {
  margin: 0;
  padding-left: 18px;
}

.tree-demo-state small,
.tree-demo-state span {
  color: #60708a;
}

.tree-filter {
  display: flex;
  width: 100%;
  max-width: 560px;
  gap: 8px;
  margin-bottom: 12px;
}

.tree-filter input {
  flex: 1 1 auto;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  color: #102047;
  background: #ffffff;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
}

.tree-filter button {
  height: 36px;
  padding: 0 12px;
  color: #1f56d9;
  background: #edf3ff;
  border: 1px solid #cddcff;
  border-radius: 6px;
  cursor: pointer;
}

.tree-custom-item {
  display: grid;
  min-width: 0;
  gap: 2px;
  padding: 0;
  color: #102047;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.tree-custom-item span {
  color: #60708a;
  font-size: 11px;
  font-weight: 700;
}

.tree-custom-item strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 18px;
  text-overflow: ellipsis;
}

.tree-custom-item small {
  overflow: hidden;
  color: #60708a;
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
}

.tree-custom-item--leaf strong {
  font-weight: 600;
}

@media (max-width: 760px) {
  .tree-demo-grid {
    grid-template-columns: 1fr;
  }
}`},"components/upload-file":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';

@Component({
  selector: 'app-upload-file-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdUploadFile],
  template: \`
    <demo-page #demoPage
      title="Upload File"
      description="T\u1EA3i l\xEAn t\u1EC7p tin / h\xECnh \u1EA3nh \u2014 k\xE9o th\u1EA3, \u0111a file, validate \u0111u\xF4i v\xE0 dung l\u01B0\u1EE3ng, c\xF3 preview thumbnail. H\u1ED7 tr\u1EE3 FormGroup v\xE0 two-way [(model)].">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-nhieu-anh-co-gioi-han') {
      <demo-section heading="T\u1EA3i nhi\u1EC1u \u1EA3nh c\xF3 gi\u1EDBi h\u1EA1n" [props]="[{ name: 'type', value: 'image' }, { name: 'max', value: '5' }, { name: 'maxSize', value: '2' }, { name: 'model', value: 'two-way' }]">
        <div class="control-box">
          <sd-upload-file
            label="\u1EA2nh s\u1EA3n ph\u1EA9m"
            type="image"
            helperText="\u1EA2nh s\u1EBD hi\u1EC3n th\u1ECB tr\xEAn trang chi ti\u1EBFt s\u1EA3n ph\u1EA9m."
            [extensions]="['jpg', 'jpeg', 'png']"
            [maxSize]="2"
            [max]="5"
            [(model)]="productImages">
          </sd-upload-file>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-tai-lieu-bao-loi-required') {
      <demo-section
        heading="T\u1EA3i t\xE0i li\u1EC7u + b\xE1o l\u1ED7i required"
        [props]="[{ name: 'type', value: 'document' }, { name: 'required', value: 'true' }, { name: '[form]', value: 'FormGroup' }]"
        note="B\u1EA5m Ki\u1EC3m tra (m\xF4 ph\u1ECFng submit \u2192 markAllAsTouched) khi ch\u01B0a \u0111\xEDnh k\xE8m file: message l\u1ED7i \u0111\u1ECF 'Vui l\xF2ng t\u1EA3i t\u1EC7p' hi\u1EC7n ngay d\u01B0\u1EDBi v\xF9ng upload. \u0110\xEDnh k\xE8m 1 file r\u1ED3i Ki\u1EC3m tra l\u1EA1i \u2192 l\u1ED7i bi\u1EBFn m\u1EA5t.">
        <div class="control-box" style="display:flex; flex-direction:column; gap:12px">
          <sd-upload-file
            label="T\xE0i li\u1EC7u \u0111\xEDnh k\xE8m"
            type="document"
            helperText="\u0110\xEDnh k\xE8m h\u1EE3p \u0111\u1ED3ng / ph\u1EE5 l\u1EE5c / bi\xEAn b\u1EA3n."
            [extensions]="['pdf', 'doc', 'docx', 'xlsx']"
            [maxSize]="10"
            [max]="3"
            required
            [form]="form"
            name="attachments">
          </sd-upload-file>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="resetForm()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa-chi-doc') {
      <demo-section heading="V\xF4 hi\u1EC7u h\xF3a (ch\u1EC9 \u0111\u1ECDc)" [props]="[{ name: 'disabled', value: 'true' }]">
        <div class="control-box">
          <sd-upload-file
            label="\u0110\xE3 \u0111\xEDnh k\xE8m"
            type="file"
            [disabled]="true"
            [model]="['demo-file-id']">
          </sd-upload-file>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .control-box {
      width: 100%;
      max-width: 560px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileDemoComponent {
  readonly productImages = signal<(string | number)[]>([]);
  readonly form = new FormGroup({});

  check() { this.form.markAllAsTouched(); }
  resetForm() { this.form.reset(); this.form.markAsUntouched(); }
}
`,scss:`.control-box {
  width: 100%;
  max-width: 560px;
}`},"components/view":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdBadge } from '@sdcorejs/angular/components/badge';

interface Contract {
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED';
  statusName: string;
  createdById: string;
  createdByName: string;
  amount: number;
}

@Component({
  selector: 'app-view-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdView, SdBadge, DatePipe],
  template: \`
    <demo-page #demoPage
      title="View"
      description="Hi\u1EC3n th\u1ECB c\u1EB7p nh\xE3n / gi\xE1 tr\u1ECB ch\u1EC9 \u0111\u1ECDc tr\xEAn trang chi ti\u1EBFt. L\xE0 phi\xEAn b\u1EA3n read-only c\u1EE7a sd-input / sd-select.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhan-va-gia-tri-co-ban') {
      <demo-section heading="Nh\xE3n v\xE0 gi\xE1 tr\u1ECB c\u01A1 b\u1EA3n" [props]="[{ name: 'display', value: 'text' }]">
        <div class="grid-3">
          <sd-view label="M\xE3 h\u1EE3p \u0111\u1ED3ng" [display]="contract.code"></sd-view>
          <sd-view label="T\xEAn h\u1EE3p \u0111\u1ED3ng" [display]="contract.name"></sd-view>
          <sd-view label="Gi\xE1 tr\u1ECB (VND)" [display]="contract.amount.toLocaleString('vi-VN')"></sd-view>
          <sd-view label="Ng\xE0y b\u1EAFt \u0111\u1EA7u" [display]="contract.startDate | date:'dd/MM/yyyy'"></sd-view>
          <sd-view label="Ng\xE0y k\u1EBFt th\xFAc" [display]="contract.endDate | date:'dd/MM/yyyy'"></sd-view>
          <sd-view label="Ghi ch\xFA" [display]="null"></sd-view>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-co-sieu-lien-ket') {
      <demo-section heading="Gi\xE1 tr\u1ECB c\xF3 si\xEAu li\xEAn k\u1EBFt" [props]="[{ name: 'hyperlink', value: 'url' }]">
        <div class="grid-3">
          <sd-view
            label="Ng\u01B0\u1EDDi t\u1EA1o"
            [display]="contract.createdByName"
            [hyperlink]="'/users/' + contract.createdById">
          </sd-view>
          <sd-view
            label="\u0110\u01B0\u1EDDng d\u1EABn ngo\xE0i"
            display="M\u1EDF t\xE0i li\u1EC7u h\u1EE3p \u0111\u1ED3ng"
            hyperlink="https://example.com/contracts/HD-2025-0001">
          </sd-view>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-template-tuy-chinh-gia-tri') {
      <demo-section heading="Template t\xF9y ch\u1EC9nh gi\xE1 tr\u1ECB" [props]="[{ name: '#sdValue', value: 'template' }]">
        <div class="grid-3">
          <sd-view label="Tr\u1EA1ng th\xE1i" [display]="contract.statusName" [value]="contract.status">
            <ng-template #sdValue let-display let-status="value">
              <sd-badge
                [title]="display"
                [color]="status === 'ACTIVE' ? 'success' : 'error'">
              </sd-badge>
            </ng-template>
          </sd-view>
          <sd-view label="Lo\u1EA1i h\u1EE3p \u0111\u1ED3ng" display="D\u1ECBch v\u1EE5 th\u01B0\u1EDDng xuy\xEAn"></sd-view>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px 24px;
      width: 100%;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDemoComponent {
  readonly contract: Contract = {
    code: 'HD-2025-0001',
    name: 'H\u1EE3p \u0111\u1ED3ng cung c\u1EA5p d\u1ECBch v\u1EE5 ph\u1EA7n m\u1EC1m',
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 11, 31),
    status: 'ACTIVE',
    statusName: '\u0110ang hi\u1EC7u l\u1EF1c',
    createdById: 'u-128',
    createdByName: 'Nguy\u1EC5n V\u0103n An',
    amount: 1_280_000_000,
  };
}
`,scss:`.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 24px;
  width: 100%;
}`},"directives/desktop":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdDesktopDirective, SdMobileDirective } from '@sdcorejs/angular/directives';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-desktop-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDesktopDirective, SdMobileDirective],
  template: \`
    <demo-page
      #demoPage
      title="Desktop Directive"
      description="*sdDesktop ch\u1EC9 t\u1EA1o embedded view khi thi\u1EBFt b\u1ECB KH\xD4NG ph\u1EA3i mobile. Quy\u1EBFt \u0111\u1ECBnh di\u1EC5n ra m\u1ED9t l\u1EA7n trong constructor, kh\xF4ng theo d\xF5i resize.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-render-tren-desktop') {
        <demo-section
          heading="Ch\u1EC9 render tr\xEAn desktop"
          [props]="[{ name: '*sdDesktop', value: 'true' }]"
          note="Kh\u1ED1i b\xEAn d\u01B0\u1EDBi ch\u1EC9 t\u1ED3n t\u1EA1i trong DOM khi BrowserUtilities.isMobile() tr\u1EA3 v\u1EC1 false \u2014 kh\xF4ng ph\u1EA3i \u1EA9n b\u1EB1ng CSS.">
          <div class="device-box">
            <div *sdDesktop class="device-card device-card--desktop" data-desktop-block>N\u1ED9i dung ch\u1EC9 d\xE0nh cho desktop</div>
            <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cap-doi-voi-sdmobile') {
        <demo-section
          heading="C\u1EB7p \u0111\xF4i v\u1EDBi sdMobile"
          [props]="[
            { name: '*sdDesktop', value: 'true' },
            { name: '*sdMobile', value: 'true' },
          ]"
          note="Hai directive lo\u1EA1i tr\u1EEB nhau, n\xEAn \u0111\u1EB7t c\u1EA1nh nhau l\xE0 c\xE1ch r\u1EBD nh\xE1nh markup theo thi\u1EBFt b\u1ECB m\xE0 kh\xF4ng c\u1EA7n *ngIf th\u1EE7 c\xF4ng.">
          <div class="device-box">
            <div *sdDesktop class="device-card device-card--desktop">B\u1ED1 c\u1EE5c desktop: b\u1EA3ng nhi\u1EC1u c\u1ED9t</div>
            <div *sdMobile class="device-card device-card--mobile">B\u1ED1 c\u1EE5c mobile: danh s\xE1ch th\u1EBB</div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .device-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .device-card {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #dfe3e8;
    }

    .device-card--desktop {
      background: #eef4ff;
    }

    .device-card--mobile {
      background: #fff4e6;
    }

    code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopDemoComponent {
  readonly isMobile = BrowserUtilities.isMobile();
}
`,scss:`.device-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.device-card {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #dfe3e8;
}

.device-card--desktop {
  background: #eef4ff;
}

.device-card--mobile {
  background: #fff4e6;
}

code {
  padding: 8px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}`},"directives/hover-copy":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdHoverCopyDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-hover-copy-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHoverCopyDirective],
  template: \`
    <demo-page
      #demoPage
      title="Hover Copy Directive"
      description="[sdHoverCopy] g\u1EAFn m\u1ED9t n\xFAt sao ch\xE9p v\xE0o b\u1EA5t k\u1EF3 ph\u1EA7n t\u1EED n\xE0o; n\xFAt ch\u1EC9 hi\u1EC7n khi hover v\xE0 t\u1EF1 \u0111\u1ED5i tooltip th\xE0nh th\xF4ng b\xE1o \u0111\xE3 sao ch\xE9p.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nut-sao-chep-hien-khi-hover') {
        <demo-section
          heading="N\xFAt sao ch\xE9p hi\u1EC7n khi hover"
          [props]="[{ name: '[sdHoverCopy]', value: 'text' }]"
          note="R\xEA chu\u1ED9t v\xE0o \xF4 b\xEAn d\u01B0\u1EDBi r\u1ED3i b\u1EA5m n\xFAt \u2014 gi\xE1 tr\u1ECB v\xE0o clipboard v\xE0 tooltip \u0111\u1ED5i sang '\u0110\xE3 sao ch\xE9p' trong 1 gi\xE2y.">
          <div class="copy-row">
            <span class="copy-cell" [sdHoverCopy]="orderCode" data-copy-order>{{ orderCode }}</span>
            <span class="copy-cell" [sdHoverCopy]="taxCode" data-copy-tax>{{ taxCode }}</span>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tat-nut-sao-chep') {
        <demo-section
          heading="T\u1EAFt n\xFAt sao ch\xE9p"
          [props]="[
            { name: '[sdHoverCopy]', value: 'text' },
            { name: '[sdHoverCopyDisabled]', value: 'true' },
          ]"
          note="Khi disabled, n\xFAt b\u1ECB G\u1EE0 kh\u1ECFi DOM ch\u1EE9 kh\xF4ng ch\u1EC9 \u1EA9n b\u1EB1ng opacity \u2014 kh\xF4ng c\xF2n c\xE1ch n\xE0o b\u1EA5m tr\xFAng n\xF3.">
          <div class="copy-row">
            <span class="copy-cell" [sdHoverCopy]="lockedValue" [sdHoverCopyDisabled]="true" data-copy-disabled>{{ lockedValue }}</span>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .copy-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .copy-cell {
      display: inline-block;
      min-width: 220px;
      padding: 10px 40px 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverCopyDemoComponent {
  readonly orderCode = 'DH-2026-000184';
  readonly taxCode = '0312345678-001';
  // why: KH\xD4NG \u0111\u1EB7t t\xEAn field l\xE0 \`secret\` \u2014 git-secrets c\u1EE7a org qu\xE9t theo t\xEAn \u0111\u1ECBnh danh, n\xEAn m\u1ED9t
  // h\u1EB1ng demo v\xF4 h\u1EA1i c\u0169ng ch\u1EB7n commit, v\xE0 n\xF3 ch\u1EB7n \u1EDF bundle \u0111\xE3 build (published-pages) ch\u1EE9 kh\xF4ng
  // ph\u1EA3i \u1EDF file n\xE0y, n\xEAn th\u1EE7 ph\u1EA1m r\u1EA5t kh\xF3 l\u1EA7n ra.
  readonly lockedValue = 'Kh\xF4ng cho sao ch\xE9p';
}
`,scss:`.copy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.copy-cell {
  display: inline-block;
  min-width: 220px;
  padding: 10px 40px 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"directives/href":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdHrefDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-href-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHrefDirective],
  template: \`
    <demo-page
      #demoPage
      title="Href Directive"
      description="a[sdHref] nh\u1EADn M\u1ED8T chu\u1ED7i url r\u1ED3i t\u1EF1 ch\u1ECDn c\xE1ch \u0111i: link n\u1ED9i b\u1ED9 \u0111i qua Router (kh\xF4ng reload), link http/https ra ngo\xE0i m\u1EDF tab m\u1EDBi k\xE8m noopener.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-link-noi-bo-di-qua-router') {
        <demo-section
          heading="Link n\u1ED9i b\u1ED9 \u0111i qua Router"
          [props]="[{ name: '[sdHref]', value: 'url' }]"
          note="Chu\u1ED7i kh\xF4ng ph\u1EA3i http/https \u0111\u01B0\u1EE3c t\xE1ch path + query r\u1ED3i \u0111\u1EA9y sang Router.navigate \u2014 b\u1EA5m kh\xF4ng n\u1EA1p l\u1EA1i trang.">
          <a class="demo-link" [sdHref]="internalUrl" data-href-internal>M\u1EDF trang Tooltip Directive</a>
          <code>{{ internalUrl }}</code>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-link-ngoai-mo-tab-moi-an-toan') {
        <demo-section
          heading="Link ngo\xE0i m\u1EDF tab m\u1EDBi an to\xE0n"
          [props]="[{ name: '[sdHref]', value: 'https url' }]"
          note="Ch\u1EC9 url parse ra \u0111\xFAng scheme http:/https: m\u1EDBi \u0111\u01B0\u1EE3c coi l\xE0 link ngo\xE0i, v\xE0 lu\xF4n m\u1EDF k\xE8m noopener,noreferrer \u0111\u1EC3 ch\u1EB7n reverse tabnabbing.">
          <a class="demo-link" [sdHref]="externalUrl" data-href-external>M\u1EDF angular.dev</a>
          <code>{{ externalUrl }}</code>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .demo-link {
      display: inline-block;
      padding: 10px 14px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #eef4ff;
      color: var(--sd-primary, #005cbb);
      font-weight: 600;
      text-decoration: none;
    }

    code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrefDemoComponent {
  readonly internalUrl = '/v/latest/directives/tooltip';
  readonly externalUrl = 'https://angular.dev';
}
`,scss:`.demo-link {
  display: inline-block;
  padding: 10px 14px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #eef4ff;
  color: var(--sd-primary, #005cbb);
  font-weight: 600;
  text-decoration: none;
}

code {
  padding: 8px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
  font-size: 13px;
}`},"directives/mobile":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdDesktopDirective, SdMobileDirective } from '@sdcorejs/angular/directives';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-mobile-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDesktopDirective, SdMobileDirective],
  template: \`
    <demo-page
      #demoPage
      title="Mobile Directive"
      description="*sdMobile ch\u1EC9 t\u1EA1o embedded view tr\xEAn thi\u1EBFt b\u1ECB mobile. C\xF9ng m\u1ED9t quy\u1EBFt \u0111\u1ECBnh m\u1ED9t-l\u1EA7n nh\u01B0 *sdDesktop, ch\u1EC9 \u0111\u1EA3o \u0111i\u1EC1u ki\u1EC7n.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-render-tren-mobile') {
        <demo-section
          heading="Ch\u1EC9 render tr\xEAn mobile"
          [props]="[{ name: '*sdMobile', value: 'true' }]"
          note="M\u1EDF DevTools \u1EDF ch\u1EBF \u0111\u1ED9 device r\u1ED3i t\u1EA3i l\u1EA1i trang \u0111\u1EC3 th\u1EA5y kh\u1ED1i n\xE0y xu\u1EA5t hi\u1EC7n \u2014 directive \u0111\u1ECDc user agent l\xFAc kh\u1EDFi t\u1EA1o, kh\xF4ng ph\u1EA3n \u1EE9ng v\u1EDBi resize.">
          <div class="device-box">
            <div *sdMobile class="device-card device-card--mobile" data-mobile-block>N\u1ED9i dung ch\u1EC9 d\xE0nh cho mobile</div>
            <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cap-doi-voi-sddesktop') {
        <demo-section
          heading="C\u1EB7p \u0111\xF4i v\u1EDBi sdDesktop"
          [props]="[
            { name: '*sdMobile', value: 'true' },
            { name: '*sdDesktop', value: 'true' },
          ]"
          note="\u0110\xFAng m\u1ED9t trong hai nh\xE1nh t\u1ED3n t\u1EA1i trong DOM, n\xEAn kh\xF4ng c\xF3 chi ph\xED render cho nh\xE1nh c\xF2n l\u1EA1i.">
          <div class="device-box">
            <div *sdMobile class="device-card device-card--mobile">Thanh h\xE0nh \u0111\u1ED9ng d\xE1n \u0111\xE1y m\xE0n h\xECnh</div>
            <div *sdDesktop class="device-card device-card--desktop">Thanh h\xE0nh \u0111\u1ED9ng n\u1EB1m trong toolbar</div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .device-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .device-card {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #dfe3e8;
    }

    .device-card--desktop {
      background: #eef4ff;
    }

    .device-card--mobile {
      background: #fff4e6;
    }

    code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDemoComponent {
  readonly isMobile = BrowserUtilities.isMobile();
}
`,scss:`.device-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.device-card {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #dfe3e8;
}

.device-card--desktop {
  background: #eef4ff;
}

.device-card--mobile {
  background: #fff4e6;
}

code {
  padding: 8px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}`},"directives/scroll":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdScrollDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-scroll-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdScrollDirective],
  template: \`
    <demo-page
      #demoPage
      title="Scroll Directive"
      description="[sdScroll] gi\u1EEF overflow-y: auto th\u01B0\u1EDDng tr\u1EF1c nh\u01B0ng ch\u1EC9 b\u1EADt overflow-x khi con tr\u1ECF n\u1EB1m trong v\xF9ng \u2014 thanh cu\u1ED9n ngang kh\xF4ng chi\u1EBFm ch\u1ED7 l\xFAc ch\u1EC9 \u0111\u1ECDc.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thanh-cuon-ngang-chi-hien-khi-hover') {
        <demo-section
          heading="Thanh cu\u1ED9n ngang ch\u1EC9 hi\u1EC7n khi hover"
          [props]="[{ name: '[sdScroll]', value: 'true' }]"
          note="R\xEA chu\u1ED9t v\xE0o khung \u0111\u1EC3 th\u1EA5y thanh cu\u1ED9n ngang xu\u1EA5t hi\u1EC7n; \u0111\u01B0a chu\u1ED9t ra ngo\xE0i, overflow-x quay l\u1EA1i hidden. Directive c\u0169ng ph\xE1t scrollTop() \u0111\u1EC3 cu\u1ED9n khung v\u1EC1 \u0111\u1EA7u.">
          <div class="scroll-frame" sdScroll #frame data-scroll-frame>
            <div class="scroll-wide">
              @for (row of rows; track row) {
                <p>{{ row }}</p>
              }
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .scroll-frame {
      width: 100%;
      max-width: 520px;
      height: 160px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      padding: 12px;
    }

    .scroll-wide {
      width: 900px;
    }

    .scroll-wide p {
      margin: 0 0 8px;
      white-space: nowrap;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollDemoComponent {
  readonly rows = Array.from(
    { length: 12 },
    (_, index) => \`D\xF2ng \${index + 1} \u2014 n\u1ED9i dung r\u1EA5t d\xE0i \u0111\u1EC3 \xE9p khung ph\u1EA3i cu\u1ED9n theo chi\u1EC1u ngang khi hover\`
  );
}
`,scss:`.scroll-frame {
  width: 100%;
  max-width: 520px;
  height: 160px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
  padding: 12px;
}

.scroll-wide {
  width: 900px;
}

.scroll-wide p {
  margin: 0 0 8px;
  white-space: nowrap;
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"directives/tooltip":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-tooltip-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTooltipDirective],
  template: \`
    <demo-page
      #demoPage
      title="Tooltip Directive"
      description="[sdTooltip] d\u1EF1ng tooltip qua CDK Overlay: nh\u1EADn chu\u1ED7i ho\u1EB7c TemplateRef, \u0111\u1ED5i \u0111\u01B0\u1EE3c v\u1ECB tr\xED, m\xE0u v\xE0 \u0111\u1ED9 tr\u1EC5; n\u1ED9i dung tooltip v\u1EABn ch\u1ECDn/copy \u0111\u01B0\u1EE3c.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tooltip-van-ban') {
        <demo-section
          heading="Tooltip v\u0103n b\u1EA3n"
          [props]="[{ name: '[sdTooltip]', value: 'text' }]"
          note="R\xEA chu\u1ED9t v\xE0o n\xFAt \u0111\u1EC3 tooltip hi\u1EC7n b\xEAn d\u01B0\u1EDBi \u2014 v\u1ECB tr\xED m\u1EB7c \u0111\u1ECBnh l\xE0 bottom.">
          <button type="button" class="demo-target" [sdTooltip]="'S\u1ED1 d\u01B0 kh\u1EA3 d\u1EE5ng sau khi tr\u1EEB phong to\u1EA3'" data-tooltip-basic>
            S\u1ED1 d\u01B0 kh\u1EA3 d\u1EE5ng
          </button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vi-tri-mau-va-do-tre') {
        <demo-section
          heading="V\u1ECB tr\xED, m\xE0u v\xE0 \u0111\u1ED9 tr\u1EC5"
          [props]="[
            { name: 'sdTooltipPosition', value: 'top / bottom / left / right' },
            { name: 'sdTooltipColor', value: '#hex' },
            { name: 'sdTooltipDelay', value: 'ms' },
          ]"
          note="Delay t\xEDnh b\u1EB1ng mili-gi\xE2y tr\u01B0\u1EDBc khi overlay m\u1EDF; m\xE0u \xE1p th\u1EB3ng v\xE0o n\u1EC1n h\u1ED9p tooltip.">
          <button type="button" class="demo-target" [sdTooltip]="'Hi\u1EC7n ph\xEDa tr\xEAn'" sdTooltipPosition="top" data-tooltip-top>Top</button>
          <button type="button" class="demo-target" [sdTooltip]="'Hi\u1EC7n b\xEAn tr\xE1i'" sdTooltipPosition="left" data-tooltip-left>Left</button>
          <button
            type="button"
            class="demo-target"
            [sdTooltip]="'\u0110\u1ECF c\u1EA3nh b\xE1o, ch\u1EDD 600ms'"
            sdTooltipPosition="right"
            sdTooltipColor="#d92d20"
            [sdTooltipDelay]="600"
            data-tooltip-delay>
            Right + delay
          </button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-noi-dung-dang-template') {
        <demo-section
          heading="N\u1ED9i dung d\u1EA1ng template"
          [props]="[{ name: '[sdTooltip]', value: 'template' }]"
          note="Truy\u1EC1n TemplateRef \u0111\u1EC3 tooltip mang markup th\u1EADt (danh s\xE1ch, nh\xE3n, li\xEAn k\u1EBFt) thay v\xEC m\u1ED9t d\xF2ng ch\u1EEF.">
          <button type="button" class="demo-target" [sdTooltip]="richTooltip" data-tooltip-template>Chi ti\u1EBFt ph\xED</button>
          <ng-template #richTooltip>
            <div class="rich-tooltip">
              <strong>Ph\xED giao d\u1ECBch</strong>
              <span>Ph\xED c\u1ED1 \u0111\u1ECBnh: 11.000 \u0111</span>
              <span>Ph\xED theo gi\xE1 tr\u1ECB: 0,02%</span>
            </div>
          </ng-template>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .demo-target {
      padding: 10px 14px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      cursor: pointer;
      font: inherit;
    }

    .rich-tooltip {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDemoComponent {}
`,scss:`.demo-target {
  padding: 10px 14px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
  cursor: pointer;
  font: inherit;
}

.rich-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}`},"forms/autocomplete":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';

interface Country { code: string; name: string; }

@Component({
  selector: 'app-autocomplete-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdAutocomplete],
  template: \`
    <demo-page #demoPage title="Autocomplete" description="sd-autocomplete \u2013 g\xF5 \u0111\u1EC3 l\u1ECDc, ch\u1ECDn 1 gi\xE1 tr\u1ECB. H\u1ED7 tr\u1EE3 cache, addable (th\xEAm m\u1EDBi gi\xE1 tr\u1ECB), required, disabled.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="G\xF5 v\xE0i k\xFD t\u1EF1 \u0111\u1EC3 l\u1ECDc danh s\xE1ch.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="Qu\u1ED1c t\u1ECBch" placeholder="G\xF5 \u0111\u1EC3 t\xECm..."
            [(model)]="country" [form]="form"></sd-autocomplete>
          <div style="font-size:12px; color:#555">M\xE3 \u0111\xE3 ch\u1ECDn: <b>{{ country() ?? '(tr\u1ED1ng)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1ECF tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i inline.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="required"
            [(model)]="countryR" [form]="formValid" required></sd-autocomplete>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-them-moi') {
      <demo-section heading="Th\xEAm m\u1EDBi" [props]="[{ name: 'addable', value: 'true' }]" note="Cho ph\xE9p th\xEAm gi\xE1 tr\u1ECB kh\xF4ng c\xF3 trong danh s\xE1ch.">
        <div style="width: 320px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="addable" placeholder="G\xF5 v\xE0 Enter \u0111\u1EC3 th\xEAm..."
            [(model)]="tag" [form]="form" addable></sd-autocomplete>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-trang-thai-bao-loi') {
      <demo-section
        heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i"
        [props]="[{ name: 'required', value: 'true' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
        note="B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched. \xD4 [validator] c\u1EA5m ch\u1ECDn 'Hoa K\u1EF3' \u2014 ch\u1ECDn Hoa K\u1EF3 \u0111\u1EC3 th\u1EA5y message (\u0111\xE2y l\xE0 l\u1ED7i \u0111\xE3 s\u1EEDa: [validator] b\u1EA5t \u0111\u1ED3ng b\u1ED9 tr\u01B0\u1EDBc kia kh\xF4ng hi\u1EC7n \u0111\u01B0\u1EE3c message). \u0110\u1EB7t l\u1EA1i gieo l\u1EA1i gi\xE1 tr\u1ECB m\u1EABu \u0111\u1EC3 demo l\u1EB7p \u0111\u01B0\u1EE3c.">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-autocomplete>
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="[validator] (c\u1EA5m Hoa K\u1EF3)" [(model)]="errValidator" [form]="formErr" [validator]="forbidUS"></sd-autocomplete>
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="inlineError (l\u1ED7i do cha truy\u1EC1n)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-autocomplete>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
            <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Kho\xE1 t\u01B0\u01A1ng t\xE1c.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-autocomplete>
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-autocomplete>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="B\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF panel g\xF5/l\u1ECDc; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
        <div style="width: 280px; font-size:13px; color:#555">
          Qu\u1ED1c t\u1ECBch:
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-autocomplete>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});

  countries: Country[] = [
    { code: 'VN', name: 'Vi\u1EC7t Nam' },
    { code: 'US', name: 'Hoa K\u1EF3' },
    { code: 'JP', name: 'Nh\u1EADt B\u1EA3n' },
    { code: 'KR', name: 'H\xE0n Qu\u1ED1c' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Th\xE1i Lan' },
  ];

  country = signal<string | null>(null);
  countryR = signal<string | null>(null);
  tag = signal<string | null>(null);
  lockedA = signal<string | null>('VN');
  lockedB = signal<string | null>('JP');

  // Error-state demo
  errRequired = signal<string | null>(null);
  errValidator = signal<string | null>('US'); // 'US' b\u1ECB validator ch\u1EB7n
  errInline = signal<string | null>('VN');
  serverError = signal<string>('Qu\u1ED1c gia n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng k\xFD');

  // why: SdCustomValidator = (value) => string | Promise<string>. async \u0111\u1EC3 minh ho\u1EA1 validator
  // b\u1EA5t \u0111\u1ED3ng b\u1ED9 ([validator] g\u1EAFn async validator \u2192 message ph\u1EA3i hi\u1EC7n \u0111\u01B0\u1EE3c sau khi resolve).
  forbidUS = async (value: any): Promise<string> =>
    value === 'US' ? 'T\u1EA1m th\u1EDDi kh\xF4ng h\u1ED7 tr\u1EE3 Hoa K\u1EF3' : '';

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  showErr() { this.formErr.markAllAsTouched(); }
  // why: gieo l\u1EA1i gi\xE1 tr\u1ECB m\u1EABu (kh\xF4ng fg.reset \u2192 reset() set null l\xE0m [validator] h\u1EBFt l\u1ED7i) \u0111\u1EC3 demo l\u1EB7p \u0111\u01B0\u1EE3c.
  resetErr() {
    this.errRequired.set(null);
    this.errValidator.set('US');
    this.errInline.set('VN');
    this.formErr.markAsUntouched();
  }
}
`},"forms/checkbox":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';

@Component({
  selector: 'app-checkbox-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdCheckbox],
  template: \`
    <demo-page #demoPage title="Checkbox" description="sd-checkbox \u2013 \xF4 \u0111\xE1nh d\u1EA5u. H\u1ED7 tr\u1EE3 bind hai chi\u1EC1u boolean, c\xE1c m\xE0u ch\u1EE7 \u0111\u1EC1, disabled / viewed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind [(model)] v\u1EDBi boolean \u2014 hi\u1EC3n th\u1ECB gi\xE1 tr\u1ECB b\xEAn d\u01B0\u1EDBi.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-checkbox label="T\xF4i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n" [(model)]="accept" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ accept() ? 'TRUE' : 'FALSE' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-tuy-chon') {
      <demo-section heading="Nh\xF3m tu\u1EF3 ch\u1ECDn" note="M\u1ED7i checkbox bind 1 bi\u1EBFn \u0111\u1ED9c l\u1EADp.">
        <div style="display:flex; flex-direction:column; gap:4px">
          <sd-checkbox label="Email" [(model)]="optEmail" [form]="form"></sd-checkbox>
          <sd-checkbox label="SMS" [(model)]="optSms" [form]="form"></sd-checkbox>
          <sd-checkbox label="Push notification" [(model)]="optPush" [form]="form"></sd-checkbox>
          <div style="font-size:12px; color:#555; margin-top:4px">
            \u0110\xE3 ch\u1ECDn: <b>{{ summary() || '(ch\u01B0a ch\u1ECDn)' }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac') {
      <demo-section heading="M\xE0u s\u1EAFc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thu\u1ED9c t\xEDnh color thay \u0111\u1ED5i accent.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="primary" color="primary" [(model)]="c1" [form]="form"></sd-checkbox>
          <sd-checkbox label="success" color="success" [(model)]="c2" [form]="form"></sd-checkbox>
          <sd-checkbox label="warning" color="warning" [(model)]="c3" [form]="form"></sd-checkbox>
          <sd-checkbox label="error" color="error" [(model)]="c4" [form]="form"></sd-checkbox>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bao-loi-inlineerror') {
      <demo-section
        heading="B\xE1o l\u1ED7i (inlineError)"
        [props]="[{ name: 'inlineError', value: 'text' }]"
        note="Truy\u1EC1n inlineError + b\u1EA5m Hi\u1EC7n l\u1ED7i (markAsTouched) \u2192 message \u0111\u1ECF hi\u1EC7n d\u01B0\u1EDBi checkbox. B\u1EA5m l\u1EA1i \u0110\u1EB7t l\u1EA1i \u0111\u1EC3 \u1EA9n.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-checkbox label="T\xF4i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n" [(model)]="errAccept" [form]="formErr" [inlineError]="'B\u1EA1n ph\u1EA3i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n'"></sd-checkbox>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
            <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-checkbox>
          <sd-checkbox label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-checkbox>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
      <demo-section heading="Ch\u1EBF \u0111\u1ED9 xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hi\u1EC7n ch\u1EEF C\xF3/Kh\xF4ng; 'inline' v\u1EABn b\u1EA5m \u0111\u01B0\u1EE3c, disabled+inline th\xEC xem t\u0129nh.">
        <div style="display:flex; gap:16px; flex-wrap:wrap">
          <sd-checkbox label="viewed=true (t\u0129nh)" [(model)]="viewedFlag" [form]="form" viewed></sd-checkbox>
          <sd-checkbox label="inline (v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-checkbox>
          <sd-checkbox label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-checkbox>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDemoComponent {
  form = new FormGroup({});
  formErr = new FormGroup({});

  accept = signal<boolean>(false);
  errAccept = signal<boolean>(false);

  optEmail = signal<boolean>(true);
  optSms = signal<boolean>(false);
  optPush = signal<boolean>(true);

  c1 = signal<boolean>(true);
  c2 = signal<boolean>(true);
  c3 = signal<boolean>(false);
  c4 = signal<boolean>(false);

  lockedA = signal<boolean>(true);
  lockedB = signal<boolean>(false);

  viewedFlag = signal<boolean>(true);
  inlineFlag = signal<boolean>(false);

  summary = () => {
    const items: string[] = [];
    if (this.optEmail()) items.push('Email');
    if (this.optSms()) items.push('SMS');
    if (this.optPush()) items.push('Push');
    return items.join(', ');
  };

  showErr() { this.formErr.markAllAsTouched(); }
  resetErr() { this.formErr.markAsUntouched(); }
}
`},"forms/chip":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChip } from '@sdcorejs/angular/forms/chip';

@Component({
  selector: 'app-chip-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChip],
  template: \`
    <demo-page #demoPage title="Chip" description="sd-chip \u2013 nh\u1EADp danh s\xE1ch tag d\u01B0\u1EDBi d\u1EA1ng chu\u1ED7i. G\xF5 r\u1ED3i Enter \u0111\u1EC3 th\xEAm, b\u1EA5m X \u0111\u1EC3 xo\xE1.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lien-ket-hai-chieu') {
      <demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1ED7i chip l\xE0 m\u1ED9t string trong m\u1EA3ng.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
          <sd-chip label="K\u1EF9 n\u0103ng" placeholder="Nh\u1EADp r\u1ED3i Enter..." helperText="C\xF3 th\u1EC3 th\xEAm nhi\u1EC1u gi\xE1 tr\u1ECB"
            [(model)]="skills" [form]="form"></sd-chip>
          <div style="font-size:12px; color:#555">
            S\u1ED1 chip: <b>{{ skills().length }}</b> \u2014 [{{ skills().join(', ') }}]
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-buoc-so-toi-thieu') {
      <demo-section heading="B\u1EAFt bu\u1ED9c & s\u1ED1 t\u1ED1i thi\u1EC3u" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '3' }]" note="C\u1EA7n \xEDt nh\u1EA5t 3 chip. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-chip label="required + min=3" placeholder="Nh\u1EADp r\u1ED3i Enter..."
            [(model)]="tags" [form]="formValid" required [min]="3"></sd-chip>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]" note="Kh\xF4ng cho th\xEAm / xo\xE1 chip.">
        <div style="width: 420px">
          <sd-chip label="disabled" [(model)]="lockedTags" [form]="form" disabled></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="Chip thu g\u1ECDn cho b\u1EA3ng / toolbar.">
        <div style="width: 420px">
          <sd-chip label="sm" size="sm" placeholder="Nh\u1EADp nh\xE3n..." [(model)]="filters" [form]="form"></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip strip v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c, nh\u01B0ng khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
        <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
          <sd-chip label="Tags (inline)" [viewed]="'inline'" [(model)]="inlineTags" [form]="form"></sd-chip>
          <sd-chip label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineTags" [form]="form" disabled></sd-chip>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  skills = signal<string[]>(['Angular', 'TypeScript', 'RxJS']);
  tags = signal<string[]>([]);
  lockedTags = signal<string[]>(['\u0110\xE3 kho\xE1 1', '\u0110\xE3 kho\xE1 2']);
  filters = signal<string[]>([]);
  inlineTags = signal<(string | number)[]>(['alpha', 'beta']);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
`},"forms/chip-calendar":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChipCalendar } from '@sdcorejs/angular/forms/chip-calendar';

@Component({
  selector: 'app-chip-calendar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChipCalendar],
  template: \`
    <demo-page #demoPage title="Chip Calendar" description="sd-chip-calendar \u2013 ch\u1ECDn nhi\u1EC1u ng\xE0y d\u01B0\u1EDBi d\u1EA1ng chip. M\u1EDF l\u1ECBch \u0111\u1EC3 pick, b\u1EA5m X \u0111\u1EC3 xo\xE1 ng\xE0y.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lien-ket-hai-chieu') {
      <demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF l\u1ECBch v\xE0 ch\u1ECDn nhi\u1EC1u ng\xE0y.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:8px">
          <sd-chip-calendar label="Ng\xE0y ngh\u1EC9 ph\xE9p" helperText="Ch\u1ECDn c\xE1c ng\xE0y d\u1EF1 ki\u1EBFn ngh\u1EC9"
            [(model)]="leaves" [form]="form"></sd-chip-calendar>
          <div style="font-size:12px; color:#555">
            \u0110\xE3 ch\u1ECDn <b>{{ leaves().length }}</b> ng\xE0y: {{ leaves().join(' \xB7 ') || '(tr\u1ED1ng)' }}
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-buoc-so-toi-thieu') {
      <demo-section heading="B\u1EAFt bu\u1ED9c & s\u1ED1 t\u1ED1i thi\u1EC3u" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '3' }]" note="C\u1EA7n t\u1ED1i thi\u1EC3u 3 ng\xE0y. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i.">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="required + min=3"
            [(model)]="duty" [form]="formValid" required [min]="3"></sd-chip-calendar>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]" note="Kho\xE1 thao t\xE1c \u2013 ch\u1EC9 hi\u1EC3n th\u1ECB c\xE1c chip \u0111\xE3 ch\u1ECDn.">
        <div style="width: 460px">
          <sd-chip-calendar label="disabled" [(model)]="lockedDates" [form]="form" disabled></sd-chip-calendar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip l\u1ECBch v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c, nh\u01B0ng khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
        <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
          <sd-chip-calendar label="Ng\xE0y ngh\u1EC9 (inline)" [viewed]="'inline'" [(model)]="inlineDates" [form]="form"></sd-chip-calendar>
          <sd-chip-calendar label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineDates" [form]="form" disabled></sd-chip-calendar>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipCalendarDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  leaves = signal<string[]>(['2025/01/15', '2025/01/20']);
  duty = signal<string[]>([]);
  lockedDates = signal<string[]>(['2025/01/10', '2025/01/11', '2025/01/12']);
  inlineDates = signal<string[]>(['2026/05/01', '2026/05/20']);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
`},"forms/date":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDate } from '@sdcorejs/angular/forms/date';

@Component({
  selector: 'app-date-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDate],
  template: \`
    <demo-page
      #demoPage
      title="Date"
      description="sd-date \u2013 ch\u1ECDn 1 ng\xE0y, hi\u1EC3n th\u1ECB theo \u0111\u1ECBnh d\u1EA1ng dd/MM/yyyy. Bind hai chi\u1EC1u v\u1EDBi chu\u1ED7i ISO.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF l\u1ECBch v\xE0 ch\u1ECDn ng\xE0y.">
          <div style="width: 320px; display:flex; flex-direction:column; gap:8px">
            <sd-date label="Ng\xE0y sinh" helperText="Theo CMND/CCCD" [(model)]="birthday" [form]="form"></sd-date>
            <div style="font-size:12px; color:#555">
              Gi\xE1 tr\u1ECB: <b>{{ birthday() || '(tr\u1ED1ng)' }}</b>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section
          heading="Validator"
          [props]="[{ name: 'required', value: 'true' }]"
          note="\u0110\u1EC3 tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i inline.">
          <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
            <sd-date label="required" [(model)]="startDate" [form]="formValid" required></sd-date>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="check()">Ki\u1EC3m tra</button>
              <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[
            { name: 'disabled', value: 'true' },
            { name: 'viewed', value: 'true' },
          ]"
          note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-date style="width: 240px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date>
            <sd-date style="width: 240px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
        <demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="UI g\u1ECDn cho toolbar.">
          <div style="width: 280px">
            <sd-date label="sm" size="sm" [(model)]="filter" [form]="form"></sd-date>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="B\u1EA5m v\xE0o ng\xE0y \u0111\u1EC3 m\u1EDF l\u1ECBch ngay; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
          <div style="width: 260px; font-size:13px; color:#555">
            Ng\xE0y sinh: <sd-date [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-dau-ra') {
        <demo-section
          heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
          [props]="[{ name: 'transform', value: 'ISOString / UTCString' }]"
          note="transform ch\u1EC9 \u0111\u1ED5i gi\xE1 tr\u1ECB \u0111i ra (model, sdChange, field trong FormGroup) \u2014 \xF4 nh\u1EADp v\u1EABn l\xE0 dd/MM/yyyy. Ng\xE0y \u0111\u01B0\u1EE3c serialize \u1EDF n\u1EEDa \u0111\xEAm GI\u1EDC \u0110\u1ECAA PH\u01AF\u01A0NG, n\xEAn ph\u1EA7n ng\xE0y trong chu\u1ED7i UTC c\xF3 th\u1EC3 l\u1EC7ch m\u1ED9t ng\xE0y so v\u1EDBi \xF4 hi\u1EC3n th\u1ECB. \u0110\xF3 l\xE0 c\xF9ng m\u1ED9t th\u1EDDi \u0111i\u1EC3m.">
          <div class="transform-grid">
            <div>
              <sd-date label="ISOString" transform="ISOString" [(model)]="isoDate"></sd-date>
              <code>{{ isoDate() ?? '\u2014' }}</code>
            </div>
            <div>
              <sd-date label="UTCString" transform="UTCString" [(model)]="utcDate"></sd-date>
              <code>{{ utcDate() ?? '\u2014' }}</code>
            </div>
            <div>
              <sd-date label="Kh\xF4ng transform" [(model)]="plainDate"></sd-date>
              <code>{{ plainDate() ?? '\u2014' }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .transform-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
    }

    .transform-grid > div {
      flex: 1 1 220px;
      min-width: 0;
    }

    .transform-grid code {
      display: block;
      margin-top: 4px;
      padding: 6px 8px;
      border: 1px solid #dfe3e8;
      border-radius: 6px;
      background: #f7f9fb;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateDemoComponent {
  isoDate = signal<string | null>(null);
  utcDate = signal<string | null>(null);
  plainDate = signal<string | null>(null);

  form = new FormGroup({});
  formValid = new FormGroup({});

  birthday = signal<string | null>(null);
  startDate = signal<string | null>(null);
  lockedA = signal<string | null>('2025-01-15');
  lockedB = signal<string | null>('2025-02-20');
  filter = signal<string | null>(null);

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }
}
`,scss:`.transform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.transform-grid > div {
  flex: 1 1 220px;
  min-width: 0;
}

.transform-grid code {
  display: block;
  margin-top: 4px;
  padding: 6px 8px;
  border: 1px solid #dfe3e8;
  border-radius: 6px;
  background: #f7f9fb;
  font-size: 12px;
  overflow-wrap: anywhere;
}`},"forms/date-range":{typescript:`import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';

interface Range {
  from?: string | null;
  to?: string | null;
}

@Component({
  selector: 'app-date-range-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, JsonPipe, SdDateRange],
  template: \`
    <demo-page
      #demoPage
      title="Date Range"
      description="sd-date-range \u2013 ch\u1ECDn kho\u1EA3ng th\u1EDDi gian t\u1EEB \u2013 \u0111\u1EBFn. Model l\xE0 object { from, to } d\u1EA1ng ISO.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="C\u01A1 b\u1EA3n"
          [props]="[{ name: '[(model)]', value: 'two-way' }]"
          note="Ch\u1ECDn ng\xE0y b\u1EAFt \u0111\u1EA7u v\xE0 ng\xE0y k\u1EBFt th\xFAc trong c\xF9ng popup.">
          <div style="width: 380px; display:flex; flex-direction:column; gap:8px">
            <sd-date-range
              label="Kho\u1EA3ng th\u1EDDi gian b\xE1o c\xE1o"
              helperText="Ch\u1ECDn ng\xE0y b\u1EAFt \u0111\u1EA7u v\xE0 k\u1EBFt th\xFAc"
              [(model)]="period"
              [form]="form"></sd-date-range>
            <div style="font-size:12px; color:#555">
              T\u1EEB <b>{{ period()?.from || '...' }}</b> \u0111\u1EBFn <b>{{ period()?.to || '...' }}</b>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="\u0110\u1EC3 tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra.">
          <div style="width: 380px; display:flex; flex-direction:column; gap:12px">
            <sd-date-range label="required" [(model)]="billing" [form]="formValid" required></sd-date-range>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="check()">Ki\u1EC3m tra</button>
              <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[
            { name: 'disabled', value: 'true' },
            { name: 'viewed', value: 'true' },
          ]"
          note="Kho\u1EA3ng \u0111\xE3 set s\u1EB5n.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-date-range style="width: 300px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date-range>
            <sd-date-range style="width: 300px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="B\u1EA5m v\xE0o kho\u1EA3ng \u0111\u1EC3 m\u1EDF l\u1ECBch ch\u1ECDn; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
          <div style="width: 340px; font-size:13px; color:#555">
            K\u1EF3: <sd-date-range [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-dau-ra') {
        <demo-section
          heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
          [props]="[{ name: 'transform', value: 'ISOString / UTCString' }]"
          note="M\u1ED7i \u0111\u1EA7u range \u0111\u01B0\u1EE3c serialize RI\xCANG \u2014 c\u1EA3 object kh\xF4ng bao gi\u1EDD b\u1ECB g\u1ED9p th\xE0nh m\u1ED9t chu\u1ED7i. \xD4 nh\u1EADp v\u1EABn l\xE0 dd/MM/yyyy \u2192 dd/MM/yyyy; range thi\u1EBFu m\u1ED9t \u0111\u1EA7u v\u1EABn gi\u1EEF null \u1EDF \u0111\u1EA7u \u0111\xF3.">
          <div class="transform-grid">
            <div>
              <sd-date-range label="ISOString" transform="ISOString" [(model)]="isoPeriod"></sd-date-range>
              <code>{{ isoPeriod() | json }}</code>
            </div>
            <div>
              <sd-date-range label="UTCString" transform="UTCString" [(model)]="utcPeriod"></sd-date-range>
              <code>{{ utcPeriod() | json }}</code>
            </div>
            <div>
              <sd-date-range label="Kh\xF4ng transform" [(model)]="plainPeriod"></sd-date-range>
              <code>{{ plainPeriod() | json }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .transform-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
    }

    .transform-grid > div {
      flex: 1 1 260px;
      min-width: 0;
    }

    .transform-grid code {
      display: block;
      margin-top: 4px;
      padding: 6px 8px;
      border: 1px solid #dfe3e8;
      border-radius: 6px;
      background: #f7f9fb;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeDemoComponent {
  isoPeriod = signal<Range | null>(null);
  utcPeriod = signal<Range | null>(null);
  plainPeriod = signal<Range | null>(null);

  form = new FormGroup({});
  formValid = new FormGroup({});

  period = signal<Range | null>(null);
  billing = signal<Range | null>(null);
  lockedA = signal<Range | null>({ from: '2025-01-01', to: '2025-01-31' });
  lockedB = signal<Range | null>({ from: '2025-02-01', to: '2025-02-28' });

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }
}
`,scss:`.transform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.transform-grid > div {
  flex: 1 1 260px;
  min-width: 0;
}

.transform-grid code {
  display: block;
  margin-top: 4px;
  padding: 6px 8px;
  border: 1px solid #dfe3e8;
  border-radius: 6px;
  background: #f7f9fb;
  font-size: 12px;
  overflow-wrap: anywhere;
}`},"forms/datetime":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';

@Component({
  selector: 'app-datetime-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdDatetime],
  template: \`
    <demo-page
      #demoPage
      title="Datetime"
      description="sd-datetime \u2013 ch\u1ECDn ng\xE0y + gi\u1EDD trong c\xF9ng m\u1ED9t control. Bind hai chi\u1EC1u v\u1EDBi chu\u1ED7i 'YYYY-MM-DD HH:mm'.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF popup picker \u0111\u1EC3 ch\u1ECDn ng\xE0y v\xE0 gi\u1EDD.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:8px">
            <sd-datetime label="Th\u1EDDi \u0111i\u1EC3m cu\u1ED9c h\u1ECDp" helperText="Bao g\u1ED3m ng\xE0y v\xE0 gi\u1EDD" [(model)]="meeting" [form]="form"></sd-datetime>
            <div style="font-size:12px; color:#555">
              Gi\xE1 tr\u1ECB: <b>{{ meeting() || '(tr\u1ED1ng)' }}</b>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1ECF tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
            <sd-datetime label="required" [(model)]="startAt" [form]="formValid" required></sd-datetime>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="check()">Ki\u1EC3m tra</button>
              <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[
            { name: 'disabled', value: 'true' },
            { name: 'viewed', value: 'true' },
          ]"
          note="Hai tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-datetime style="width: 260px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-datetime>
            <sd-datetime style="width: 260px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-datetime>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="B\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF overlay datetime; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
          <div style="width: 300px; font-size:13px; color:#555">
            H\u1EB9n l\xFAc: <sd-datetime [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-datetime>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-dau-ra') {
        <demo-section
          heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
          [props]="[
            { name: 'transform', value: 'ISOString / UTCString' },
            { name: 'showSeconds', value: 'true' },
          ]"
          note="transform ch\u1EC9 \u0111\u1ED5i gi\xE1 tr\u1ECB \u0111i ra \u2014 \xF4 nh\u1EADp v\u1EABn theo showSeconds. \u0110\u1ED9 ch\xEDnh x\xE1c v\u1EABn do showSeconds quy \u0111\u1ECBnh: t\u1EAFt th\xEC gi\xE2y v\u1EC1 0, b\u1EADt th\xEC gi\u1EEF gi\xE2y; mili-gi\xE2y lu\xF4n b\u1EB1ng 0.">
          <div class="transform-grid">
            <div>
              <sd-datetime label="ISOString" transform="ISOString" [(model)]="isoAt"></sd-datetime>
              <code>{{ isoAt() ?? '\u2014' }}</code>
            </div>
            <div>
              <sd-datetime label="UTCString + gi\xE2y" transform="UTCString" [showSeconds]="true" [(model)]="utcAt"></sd-datetime>
              <code>{{ utcAt() ?? '\u2014' }}</code>
            </div>
            <div>
              <sd-datetime label="Kh\xF4ng transform" [(model)]="plainAt"></sd-datetime>
              <code>{{ plainAt() ?? '\u2014' }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .transform-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
    }

    .transform-grid > div {
      flex: 1 1 240px;
      min-width: 0;
    }

    .transform-grid code {
      display: block;
      margin-top: 4px;
      padding: 6px 8px;
      border: 1px solid #dfe3e8;
      border-radius: 6px;
      background: #f7f9fb;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeDemoComponent {
  isoAt = signal<string | null>(null);
  utcAt = signal<string | null>(null);
  plainAt = signal<string | null>(null);

  form = new FormGroup({});
  formValid = new FormGroup({});

  meeting = signal<string | null>(null);
  startAt = signal<string | null>(null);
  lockedA = signal<string | null>('2025-01-15 09:30');
  lockedB = signal<string | null>('2025-02-20 14:00');

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }
}
`,scss:`.transform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.transform-grid > div {
  flex: 1 1 240px;
  min-width: 0;
}

.transform-grid code {
  display: block;
  margin-top: 4px;
  padding: 6px 8px;
  border: 1px solid #dfe3e8;
  border-radius: 6px;
  background: #f7f9fb;
  font-size: 12px;
  overflow-wrap: anywhere;
}`},"forms/entity-picker":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { SdTableColumn } from '@sdcorejs/angular/components/table';
import {
  SdEntityPicker,
  SdEntityPickerDataProvider,
  SdEntityPickerDetailTemplateDirective,
  SdEntityPickerRowTemplateDirective,
  SdEntityPickerSelectedTemplateDirective,
} from '@sdcorejs/angular/forms/entity-picker';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface Employee {
  id: number;
  code: string;
  name: string;
  department: string;
  disabled?: boolean;
}

const EMPLOYEES: Employee[] = Array.from({ length: 48 }, (_, index) => ({
  id: index + 1,
  code: \`EMP-\${String(index + 1).padStart(3, '0')}\`,
  name: ['Nguy\u1EC5n An', 'Tr\u1EA7n B\xECnh', 'L\xEA Chi', 'Ph\u1EA1m D\u0169ng'][index % 4] + \` \${index + 1}\`,
  department: ['K\u1EBF to\xE1n', 'Nh\xE2n s\u1EF1', 'V\u1EADn h\xE0nh'][index % 3],
  disabled: index === 4,
}));

@Component({
  selector: 'app-entity-picker-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdEntityPicker,
    SdEntityPickerRowTemplateDirective,
    SdEntityPickerSelectedTemplateDirective,
    SdEntityPickerDetailTemplateDirective,
  ],
  template: \`
    <demo-page
      #demoPage
      title="Entity Picker"
      description="SdEntityPicker compose QueryBar, Table v\xE0 Modal cho key model type-safe, server paging, hydration v\xE0 cancellation.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-server-single-select') {
        <demo-section
          heading="Server single-select"
          [props]="[
            { name: 'model', value: single() ?? 'null' },
            { name: 'pageSize', value: 10 },
          ]"
          note="T\xECm ki\u1EBFm, filter, sort v\xE0 paging \u0111i qua provider; request c\u0169 nh\u1EADn AbortSignal khi query m\u1EDBi b\u1EAFt \u0111\u1EA7u.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="provider"
            [columns]="columns"
            [queryFields]="queryFields"
            valueField="id"
            displayField="name"
            [pageSize]="10"
            [(model)]="single" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multi-select-va-hydration') {
        <demo-section
          heading="Multi-select v\xE0 hydration"
          [props]="[{ name: 'model', value: multi().join(', ') }]"
          note="EMP-042 kh\xF4ng thu\u1ED9c page \u0111\u1EA7u nh\u01B0ng v\u1EABn \u0111\u01B0\u1EE3c hydrate v\xE0 hi\u1EC3n th\u1ECB theo stable key.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="provider"
            [columns]="columns"
            valueField="id"
            displayField="name"
            multiple
            [(model)]="multi">
            <ng-template sdEntityPickerSelected let-entities="entities" let-keys="keys">
              {{ entities.length }} nh\xE2n vi\xEAn \xB7 keys {{ keys.join(', ') }}
            </ng-template>
          </sd-entity-picker>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-row-va-detail-template') {
        <demo-section
          heading="Row v\xE0 detail template"
          note="Template nh\u1EADn entity \u0111\xE3 hydrate; table engine v\xE0 selection engine v\u1EABn do SdTable s\u1EDF h\u1EEFu.">
          <sd-entity-picker style="max-width: 520px" [provider]="provider" valueField="id" displayField="name" [model]="3">
            <ng-template sdEntityPickerRow let-employee="item">
              <strong>{{ employee.name }}</strong> \xB7 {{ employee.department }}
            </ng-template>
            <ng-template sdEntityPickerDetail let-entities="entities"> Selected detail: {{ entities[0]?.code }} </ng-template>
          </sd-entity-picker>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-error-retry-va-create-action') {
        <demo-section
          heading="Error, retry v\xE0 create action"
          [props]="[{ name: 'addable', value: true }]"
          note="Provider l\u1ED7i hi\u1EC3n th\u1ECB DataState retry; create ch\u1EC9 ph\xE1t event, kh\xF4ng hard-code workflow nghi\u1EC7p v\u1EE5.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="errorProvider"
            valueField="id"
            displayField="name"
            addable
            (sdAdd)="onAdd()" />
          <div data-add-count>Create actions: {{ addCount() }}</div>
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPickerDemoComponent {
  readonly single = signal<number | null>(2);
  readonly multi = signal<number[]>([1, 42]);
  readonly addCount = signal(0);
  readonly columns: SdTableColumn<Employee>[] = [
    { field: 'code', title: 'M\xE3', type: 'string', sortable: true },
    { field: 'name', title: 'T\xEAn', type: 'string', sortable: true },
    { field: 'department', title: 'Ph\xF2ng ban', type: 'string' },
  ];
  readonly queryFields: SdQueryField<Employee>[] = [
    { key: 'name', label: 'T\xEAn', type: 'string' },
    { key: 'department', label: 'Ph\xF2ng ban', type: 'string' },
  ];
  readonly provider: SdEntityPickerDataProvider<Employee, number> = {
    load: async request => {
      await abortableDelay(120, request.signal);
      const search = (request.query.search ?? '').toLocaleLowerCase();
      const filtered = EMPLOYEES.filter(
        item => !search || \`\${item.code} \${item.name} \${item.department}\`.toLocaleLowerCase().includes(search)
      );
      const start = request.pageIndex * request.pageSize;
      return { items: filtered.slice(start, start + request.pageSize), total: filtered.length };
    },
    hydrate: keys => EMPLOYEES.filter(item => keys.includes(item.id)),
  };
  readonly errorProvider: SdEntityPickerDataProvider<Employee, number> = {
    load: () => Promise.reject(new Error('Kh\xF4ng th\u1EC3 t\u1EA3i danh s\xE1ch nh\xE2n vi\xEAn')),
    hydrate: keys => EMPLOYEES.filter(item => keys.includes(item.id)),
  };

  onAdd(): void {
    this.addCount.update(value => value + 1);
  }
}

function abortableDelay(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, duration);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}
`},"forms/inline-text":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormControl } from '@sdcorejs/angular/forms/models';

@Component({
  selector: 'app-inline-text-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInlineText, SdInput, SdInputNumber],
  template: \`
    <demo-page #demoPage
      title="Inline Text"
      description="Primitive input borderless, \xF4m s\xE1t n\u1ED9i dung (content-hug) \u2014 b\u1EC1 r\u1ED9ng b\xE1m theo \u0111\u1ED9 d\xE0i gi\xE1 tr\u1ECB thay v\xEC k\xE9o full width. D\xF9ng chung cho sd-input/sd-input-number (viewed='inline') v\xE0 chip query-bar/query-builder.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lien-ket-hai-chieu') {
      <demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(value)]', value: 'two-way' }]" note="V\xF9ng hover/click b\xE1m theo \u0111\u1ED9 d\xE0i gi\xE1 tr\u1ECB \u2014 kh\xF4ng k\xE9o full width. D\xE0i/ng\u1EAFn kh\xE1c nhau \u2192 r\u1ED9ng kh\xE1c nhau.">
        <div class="stack">
          <span class="row"><sd-inline-text [(value)]="short" /> <code>{{ short() || '(tr\u1ED1ng)' }}</code></span>
          <span class="row"><sd-inline-text [(value)]="medium" /> <code>{{ medium() }}</code></span>
          <span class="row"><sd-inline-text [(value)]="long" /> <code>{{ long() }}</code></span>
          <span class="row"><sd-inline-text [(value)]="empty" placeholder="nh\u1EADp gi\xE1 tr\u1ECB\u2026" /> <code>placeholder khi tr\u1ED1ng</code></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kieu-vien') {
      <demo-section heading="Ki\u1EC3u vi\u1EC1n" [props]="[{ name: 'chrome', value: 'standalone / seamless' }]" note="standalone t\u1EF1 v\u1EBD n\u1EC1n hover + ring focus; seamless trong su\u1ED1t \u0111\u1EC3 pill cha (chip) v\u1EBD vi\u1EC1n/n\u1EC1n.">
        <div class="stack">
          <span class="row">standalone: <sd-inline-text chrome="standalone" [(value)]="cs1" /></span>
          <span class="row pill">seamless trong 1 pill: <span class="fake-chip">T\xEAn: <sd-inline-text chrome="seamless" [clearable]="false" [state]="'active'" [(value)]="cs2" /></span></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'state', value: 'pending / active / error' }]" note="auto suy ra t\u1EEB focus + value; c\xF3 th\u1EC3 override (vd error).">
        <div class="stack">
          <span class="row">pending (tr\u1ED1ng): <sd-inline-text [(value)]="stEmpty" placeholder="\u2026" /></span>
          <span class="row">active (c\xF3 value): <sd-inline-text [(value)]="stActive" /></span>
          <span class="row">error (override): <sd-inline-text [(value)]="stErr" [state]="'error'" /></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-formcontrol') {
      <demo-section heading="FormControl" [props]="[{ name: 'control', value: 'FormControl' }]" note="Bind FormControl ngo\xE0i (ch\u1EBF \u0111\u1ED9 form controls d\xF9ng). Disabled qua control.">
        <div class="stack">
          <span class="row">control: <sd-inline-text [control]="ctrl" /> <code>{{ ctrl.value }}</code></span>
          <span class="row">disabled control: <sd-inline-text [control]="ctrlDisabled" /></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="C\xF9ng primitive \u2014 inline edit \xF4m s\xE1t n\u1ED9i dung, kh\xF4ng c\xF2n full-width.">
        <div class="stack">
          <span class="row">sd-input: <sd-input [(model)]="inlineStr" [viewed]="'inline'" placeholder="nh\u1EADp t\xEAn\u2026" /></span>
          <span class="row">sd-input-number: <sd-input-number [(model)]="inlineNum" [viewed]="'inline'" placeholder="nh\u1EADp s\u1ED1\u2026" /></span>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .stack { display: flex; flex-direction: column; gap: 14px; }
    .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .fake-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #d6d8db;
      border-radius: 999px;
      padding: 2px 10px;
      background: #fff;
      color: #5f6368;
      font-size: 13px;
    }
    code {
      background: #f0f3f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineTextDemoComponent {
  readonly short = signal('Ab');
  readonly medium = signal('Nguy\u1EC5n V\u0103n A');
  readonly long = signal('M\u1ED9t gi\xE1 tr\u1ECB kh\xE1 d\xE0i \u0111\u1EC3 th\u1EA5y b\u1EC1 r\u1ED9ng b\xE1m n\u1ED9i dung');
  readonly empty = signal('');

  readonly cs1 = signal('standalone');
  readonly cs2 = signal('Gi\xE1 tr\u1ECB');

  readonly stEmpty = signal('');
  readonly stActive = signal('\u0110ang nh\u1EADp');
  readonly stErr = signal('sai \u0111\u1ECBnh d\u1EA1ng');

  readonly ctrl = new SdFormControl({ value: 't\u1EEB FormControl', disabled: false });
  readonly ctrlDisabled = new SdFormControl({ value: 'kh\xF4ng s\u1EEDa \u0111\u01B0\u1EE3c', disabled: true });

  readonly inlineStr = signal('T\xEAn hi\u1EC3n th\u1ECB');
  readonly inlineNum = signal<number | null>(25000000);
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}
.stack { display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fake-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d6d8db;
  border-radius: 999px;
  padding: 2px 10px;
  background: #fff;
  color: #5f6368;
  font-size: 13px;
}
code {
  background: #f0f3f7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}`},"forms/input":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInput } from '@sdcorejs/angular/forms/input';

@Component({
  selector: 'app-input-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInput],
  template: \`
    <demo-page
      #demoPage
      title="Input"
      description="sd-input \u2013 \xF4 nh\u1EADp li\u1EC7u m\u1ED9t d\xF2ng. H\u1ED7 tr\u1EE3 helper text, ki\u1EC3u (text/number/password/email), tr\u1EA1ng th\xE1i disabled / readonly / viewed v\xE0 validator chu\u1EA9n.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="C\u01A1 b\u1EA3n"
          [props]="[{ name: '[(model)]', value: 'two-way' }]"
          note="Bind hai chi\u1EC1u v\u1EDBi [(model)] v\xE0 FormGroup chia s\u1EBB.">
          <div style="width: 320px">
            <sd-input
              label="H\u1ECD v\xE0 t\xEAn"
              placeholder="Nh\u1EADp h\u1ECD t\xEAn..."
              helperText="T\xEAn \u0111\u1EA7y \u0111\u1EE7 theo CMND"
              [(model)]="basic"
              [form]="form"></sd-input>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
        <demo-section
          heading="Validator"
          [props]="[
            { name: 'required', value: 'true' },
            { name: 'type', value: 'email' },
            { name: 'minlength', value: '6' },
          ]"
          note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i inline.">
          <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
            <sd-input
              label="required + type=email"
              placeholder="vd: a@b.com"
              type="email"
              [(model)]="email"
              [form]="formValid"
              required></sd-input>
            <sd-input
              label="required + minlength=6"
              type="password"
              [(model)]="password"
              [form]="formValid"
              required
              [minlength]="6"></sd-input>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="check()">Ki\u1EC3m tra</button>
              <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-trang-thai-bao-loi-inline') {
        <demo-section
          heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i (inline)"
          [props]="[
            { name: 'required', value: 'true' },
            { name: 'minlength', value: '6' },
            { name: 'pattern', value: 'regex' },
            { name: '[validator]', value: 'fn' },
            { name: 'inlineError', value: 'text' },
          ]"
          note="M\u1ED7i \xF4 minh ho\u1EA1 m\u1ED9t lo\u1EA1i l\u1ED7i. B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched \u2014 l\u1ED7i xu\u1EA5t hi\u1EC7n d\u01B0\u1EDBi \xF4 (\u0111\u1ECF). \xD4 [validator] c\u1EA5m ch\u1EEF 'admin'; g\xF5 admin \u0111\u1EC3 th\u1EA5y l\u1ED7i.">
          <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
            <sd-input label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-input>
            <sd-input label="minlength = 6" [(model)]="errMinLen" [form]="formErr" [minlength]="6"></sd-input>
            <sd-input
              label="pattern = 10 ch\u1EEF s\u1ED1"
              placeholder="vd: 0987654321"
              [(model)]="errPattern"
              [form]="formErr"
              pattern="^\\\\d{10}$"
              patternErrorMessage="Ph\u1EA3i g\u1ED3m \u0111\xFAng 10 ch\u1EEF s\u1ED1"></sd-input>
            <sd-input label="[validator] (c\u1EA5m 'admin')" [(model)]="errValidator" [form]="formErr" [validator]="forbidAdmin"></sd-input>
            <sd-input
              label="inlineError (l\u1ED7i do cha truy\u1EC1n)"
              [(model)]="errInline"
              [form]="formErr"
              [inlineError]="serverError()"></sd-input>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
              <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bao-loi-dang-icon-hideinlineerror') {
        <demo-section
          heading="B\xE1o l\u1ED7i d\u1EA1ng icon (hideInlineError)"
          [props]="[
            { name: 'hideInlineError', value: 'true' },
            { name: '[validator]', value: 'fn' },
          ]"
          note="Khi hideInlineError=true: kh\xF4ng c\xF3 d\xF2ng l\u1ED7i d\u01B0\u1EDBi \xF4 \u2014 thay v\xE0o \u0111\xF3 icon \u26A0 \u0111\u1ECF n\u1EB1m s\xE1t m\xE9p ph\u1EA3i, message hi\u1EC7n qua tooltip khi hover. C\xE1c \xF4 \u0111\xE3 c\xF3 gi\xE1 tr\u1ECB n\xEAn n\xFAt xo\xE1 (\xD7) c\u0169ng hi\u1EC7n c\u1EA1nh icon l\u1ED7i (xo\xE1 n\u1EB1m b\xEAn tr\xE1i, icon l\u1ED7i s\xE1t m\xE9p ph\u1EA3i).">
          <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
            <sd-input label="minlength = 6" [(model)]="iconMinLen" [form]="formIcon" [minlength]="6" hideInlineError></sd-input>
            <sd-input
              label="pattern = 10 ch\u1EEF s\u1ED1"
              [(model)]="iconPattern"
              [form]="formIcon"
              pattern="^\\\\d{10}$"
              patternErrorMessage="Ph\u1EA3i g\u1ED3m \u0111\xFAng 10 ch\u1EEF s\u1ED1"
              hideInlineError></sd-input>
            <sd-input
              label="[validator] (c\u1EA5m 'admin')"
              [(model)]="iconValidator"
              [form]="formIcon"
              [validator]="forbidAdmin"
              hideInlineError></sd-input>
            <div style="display:flex; gap:8px">
              <button type="button" (click)="showIcon()">Hi\u1EC7n l\u1ED7i</button>
              <button type="button" (click)="resetIcon()">\u0110\u1EB7t l\u1EA1i</button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[
            { name: 'disabled', value: 'true' },
            { name: 'readonly', value: 'true' },
            { name: 'viewed', value: 'true' },
          ]"
          note="Ba tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-input style="width: 220px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input>
            <sd-input style="width: 220px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input>
            <sd-input style="width: 220px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
        <demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="size='sm' cho UI g\u1ECDn h\u01A1n.">
          <div style="width: 320px">
            <sd-input label="sm" size="sm" placeholder="VD: NV001" [(model)]="codeSm" [form]="form"></sd-input>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
        <demo-section
          heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
          [props]="[{ name: 'viewed', value: 'inline' }]"
          note="Input trong su\u1ED1t nh\xECn nh\u01B0 text; b\u1EA5m/focus l\xE0 g\xF5 tr\u1EF1c ti\u1EBFp (kh\xF4ng c\xF3 panel). Hover \u0111\u1EADm n\u1EC1n.">
          <div style="width: 260px; font-size:13px; color:#555">
            H\u1ECD t\xEAn: <sd-input [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-input>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-input-mask-raw-model-display-value') {
        <demo-section
          heading="Input mask: raw model / display value"
          [props]="[
            { name: 'mask', value: 'VN_PHONE' },
            { name: 'model', value: maskedPhone() ?? 'null' },
          ]"
          note="M\xE0n h\xECnh hi\u1EC3n th\u1ECB kho\u1EA3ng c\xE1ch, nh\u01B0ng model, sdChange v\xE0 FormGroup ch\u1EC9 nh\u1EADn chu\u1ED7i s\u1ED1 raw.">
          <div style="width: 320px">
            <sd-input label="\u0110i\u1EC7n tho\u1EA1i" mask="VN_PHONE" [(model)]="maskedPhone" [form]="form"></sd-input>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});
  formIcon = new FormGroup({});

  basic = signal<string | null>('Nguy\u1EC5n V\u0103n A');
  email = signal<string | null>(null);
  password = signal<string | null>(null);
  lockedA = signal<string | null>('Kh\xF4ng th\u1EC3 s\u1EEDa');
  lockedB = signal<string | null>('Ch\u1EC9 \u0111\u1ECDc');
  lockedC = signal<string | null>('Ch\u1EBF \u0111\u1ED9 xem');
  codeSm = signal<string | null>(null);
  maskedPhone = signal<string | null>('0901234567');

  // Error-state demo (inline)
  errRequired = signal<string | null>(null);
  errMinLen = signal<string | null>('abc');
  errPattern = signal<string | null>('12ab');
  errValidator = signal<string | null>('admin');
  errInline = signal<string | null>('user@corp.vn');
  serverError = signal<string>('Email \u0111\xE3 t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng');

  // Error-state demo (icon / hideInlineError) \u2014 pre-filled invalid values so the
  // clear button also shows next to the error icon (demonstrates suffix ordering).
  iconMinLen = signal<string | null>('abc');
  iconPattern = signal<string | null>('12ab');
  iconValidator = signal<string | null>('admin');

  // why: SdCustomValidator = (value) => string | Promise<string>. Tr\u1EA3 chu\u1ED7i r\u1ED7ng = h\u1EE3p l\u1EC7,
  // tr\u1EA3 message = l\u1ED7i. async \u0111\u1EC3 minh ho\u1EA1 lu\u1ED3ng validator b\u1EA5t \u0111\u1ED3ng b\u1ED9 ([validator] d\xF9ng async validator).
  forbidAdmin = async (value: any): Promise<string> =>
    (value ?? '').toString().trim().toLowerCase() === 'admin' ? 'Kh\xF4ng \u0111\u01B0\u1EE3c d\xF9ng "admin"' : '';

  check() {
    this.formValid.markAllAsTouched();
  }
  reset() {
    this.formValid.reset();
    this.formValid.markAsUntouched();
  }

  // why: "\u0110\u1EB7t l\u1EA1i" KH\xD4NG d\xF9ng fg.reset() \u2014 reset() set control v\u1EC1 null (r\u1ED7ng) \u2192 minlength/pattern/
  // validator kh\xF4ng b\u1EAFt l\u1ED7i tr\xEAn gi\xE1 tr\u1ECB r\u1ED7ng \u2192 b\u1EA5m "Hi\u1EC7n l\u1ED7i" l\u1EA7n n\u1EEFa kh\xF4ng th\u1EA5y l\u1ED7i. Thay v\xE0o \u0111\xF3
  // gieo l\u1EA1i \u0111\xFAng c\xE1c gi\xE1 tr\u1ECB sai m\u1EABu (qua [(model)] signal) r\u1ED3i markAsUntouched \u2192 demo l\u1EB7p l\u1EA1i \u0111\u01B0\u1EE3c.
  showErr() {
    this.formErr.markAllAsTouched();
  }
  resetErr() {
    this.errRequired.set(null);
    this.errMinLen.set('abc');
    this.errPattern.set('12ab');
    this.errValidator.set('admin');
    this.errInline.set('user@corp.vn');
    this.formErr.markAsUntouched();
  }
  showIcon() {
    this.formIcon.markAllAsTouched();
  }
  resetIcon() {
    this.iconMinLen.set('abc');
    this.iconPattern.set('12ab');
    this.iconValidator.set('admin');
    this.formIcon.markAsUntouched();
  }
}
`},"forms/input-color":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputColor } from '@sdcorejs/angular/forms/input-color';

@Component({
  selector: 'app-input-color-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInputColor, FormsModule],
  template: \`
    <demo-page #demoPage
      title="Input Color"
      description="\xD4 nh\u1EADp m\xE3 m\xE0u HEX v\u1EDBi swatch hi\u1EC3n th\u1ECB m\xE0u hi\u1EC7n t\u1EA1i. B\u1EA5m swatch \u0111\u1EC3 m\u1EDF b\u1EA3ng ch\u1ECDn m\xE0u ho\u1EB7c g\xF5 tay m\xE3 HEX (#RGB / #RRGGBB / #RRGGBBAA).">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Gi\xE1 tr\u1ECB bind hai chi\u1EC1u \u2014 pick ho\u1EB7c g\xF5 tay \u0111\u1EC1u c\u1EADp nh\u1EADt signal.">
        <div class="row">
          <sd-input-color label="M\xE0u th\u01B0\u01A1ng hi\u1EC7u" [(model)]="brand" />
          <span class="value">\u0110ang ch\u1ECDn: <code>{{ brand() || '(tr\u1ED1ng)' }}</code></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="\u0110\u1EC3 tr\u1ED1ng ho\u1EB7c g\xF5 chu\u1ED7i sai \u0111\u1ECBnh d\u1EA1ng (vd 'red') s\u1EBD hi\u1EC7n l\u1ED7i.">
        <sd-input-color
          label="required"
          helperText="\u0110\u1ECBnh d\u1EA1ng #RGB, #RRGGBB ho\u1EB7c #RRGGBBAA"
          [required]="true"
          [(model)]="tagColor" />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]">
        <sd-input-color label="disabled" [model]="'#005CBB'" [disabled]="true" />
        <sd-input-color label="readonly" [model]="'#2E7D32'" [readonly]="true" />
        <sd-input-color label="viewed" [model]="'#BA1A1A'" [viewed]="true" />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hex-ngan-alpha') {
      <demo-section heading="Hex ng\u1EAFn / alpha" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Picker t\u1EF1 normalize #RGB \u2192 #RRGGBB v\xE0 b\u1ECF alpha; swatch gi\u1EEF gi\xE1 tr\u1ECB th\u1EADt.">
        <div class="row">
          <sd-input-color label="Hex 3 k\xFD t\u1EF1" [(model)]="shortHex" />
          <span class="value">Swatch hi\u1EC3n th\u1ECB: <code>{{ shortHex() }}</code></span>
        </div>
        <div class="row">
          <sd-input-color label="Hex 8 k\xFD t\u1EF1 (c\xF3 alpha)" [(model)]="alphaHex" />
          <span class="value">Swatch hi\u1EC3n th\u1ECB: <code>{{ alphaHex() }}</code></span>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 s\u1EEDa. Khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
        <div class="row">
          <sd-input-color label="M\xE0u inline" [viewed]="'inline'" [(model)]="inlineColor" />
          <span class="value">Gi\xE1 tr\u1ECB: <b>{{ inlineColor() ?? '(tr\u1ED1ng)' }}</b></span>
        </div>
        <div class="row">
          <sd-input-color label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineColor" [disabled]="true" />
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .value {
      font-size: 13px;
      color: #4a4a4a;
    }
    code {
      background: #f0f3f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputColorDemoComponent {
  readonly brand = signal<string | undefined>('#1565C0');
  readonly tagColor = signal<string | undefined>(undefined);
  readonly shortHex = signal<string | undefined>('#0AF');
  readonly alphaHex = signal<string | undefined>('#1565C088');
  readonly inlineColor = signal<string | undefined>('#1565C0');
}
`,scss:`:host ::ng-deep demo-section .demo-section__body {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.value {
  font-size: 13px;
  color: #4a4a4a;
}
code {
  background: #f0f3f7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}`},"forms/input-number":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

@Component({
  selector: 'app-input-number-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInputNumber],
  template: \`
    <demo-page #demoPage title="Input Number" description="sd-input-number \u2013 nh\u1EADp s\u1ED1 c\xF3 format ng\u0103n c\xE1ch h\xE0ng ngh\xECn, h\u1ED7 tr\u1EE3 min/max, prefix/suffix v\xE0 c\xE1c tr\u1EA1ng th\xE1i kho\xE1.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="T\u1EF1 \u0111\u1ED9ng format khi g\xF5.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="S\u1ED1 l\u01B0\u1EE3ng" placeholder="Nh\u1EADp s\u1ED1..." [(model)]="qty" [form]="form"></sd-input-number>
          <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB hi\u1EC7n t\u1EA1i: <b>{{ qty() ?? '(tr\u1ED1ng)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }]" note="min=10, max=100. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="required + min=10 + max=100" [(model)]="age" [form]="formValid" required [min]="10" [max]="100"></sd-input-number>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-trang-thai-bao-loi-inline') {
      <demo-section
        heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i (inline)"
        [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
        note="M\u1ED7i \xF4 minh ho\u1EA1 m\u1ED9t lo\u1EA1i l\u1ED7i. B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched. \xD4 [validator] c\u1EA5m s\u1ED1 13 \u2014 g\xF5 13 \u0111\u1EC3 th\u1EA5y message (\u0111\xE2y l\xE0 l\u1ED7i \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EEDa: tr\u01B0\u1EDBc kia [validator] kh\xF4ng hi\u1EC7n \u0111\u01B0\u1EE3c message).">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-input-number>
          <sd-input-number label="min = 10" [(model)]="errMin" [form]="formErr" [min]="10"></sd-input-number>
          <sd-input-number label="max = 100" [(model)]="errMax" [form]="formErr" [max]="100"></sd-input-number>
          <sd-input-number label="[validator] (c\u1EA5m s\u1ED1 13)" [(model)]="errValidator" [form]="formErr" [validator]="forbidThirteen"></sd-input-number>
          <sd-input-number label="inlineError (l\u1ED7i do cha truy\u1EC1n)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-input-number>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
            <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bao-loi-dang-icon-hideinlineerror') {
      <demo-section
        heading="B\xE1o l\u1ED7i d\u1EA1ng icon (hideInlineError)"
        [props]="[{ name: 'hideInlineError', value: 'true' }, { name: '[validator]', value: 'fn' }]"
        note="hideInlineError=true: icon \u26A0 \u0111\u1ECF s\xE1t m\xE9p ph\u1EA3i, message qua tooltip. C\xE1c \xF4 c\xF3 gi\xE1 tr\u1ECB n\xEAn n\xFAt xo\xE1 (\xD7) hi\u1EC7n c\u1EA1nh icon (xo\xE1 b\xEAn tr\xE1i, icon l\u1ED7i s\xE1t m\xE9p ph\u1EA3i \u2014 kh\xF4ng b\u1ECB \u0111\u1EA9y v\xE0o trong).">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="min = 10" [(model)]="iconMin" [form]="formIcon" [min]="10" hideInlineError></sd-input-number>
          <sd-input-number label="max = 100" [(model)]="iconMax" [form]="formIcon" [max]="100" hideInlineError></sd-input-number>
          <sd-input-number label="[validator] (c\u1EA5m s\u1ED1 13)" [(model)]="iconValidator" [form]="formIcon" [validator]="forbidThirteen" hideInlineError></sd-input-number>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showIcon()">Hi\u1EC7n l\u1ED7i</button>
            <button type="button" (click)="resetIcon()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Ba tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-input-number style="width: 200px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input-number>
          <sd-input-number style="width: 200px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input-number>
          <sd-input-number style="width: 200px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input-number>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input s\u1ED1 trong su\u1ED1t nh\xECn nh\u01B0 text; focus \u0111\u1EC3 s\u1EEDa, blur format l\u1EA1i (vd 12.345). Hover \u0111\u1EADm n\u1EC1n.">
        <div style="width: 240px; font-size:13px; color:#555">
          S\u1ED1 l\u01B0\u1EE3ng: <sd-input-number [viewed]="'inline'" [(model)]="lockedC" [form]="form"></sd-input-number>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});
  formIcon = new FormGroup({});

  qty = signal<number | null>(1500);
  age = signal<number | null>(null);
  lockedA = signal<number | null>(12345);
  lockedB = signal<number | null>(9999);
  lockedC = signal<number | null>(42);

  // Error-state demo (inline)
  errRequired = signal<number | null>(null);
  errMin = signal<number | null>(5);
  errMax = signal<number | null>(500);
  errValidator = signal<number | null>(13);
  errInline = signal<number | null>(7);
  serverError = signal<string>('S\u1ED1 n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng');

  // Error-state demo (icon / hideInlineError) \u2014 pre-filled invalid so the clear button
  // also shows next to the error icon (demonstrates suffix ordering fix).
  iconMin = signal<number | null>(5);
  iconMax = signal<number | null>(500);
  iconValidator = signal<number | null>(13);

  // why: SdCustomValidator = (value) => string | Promise<string>. [validator] t\u1EA1o async
  // validator (HandleSdCustomValidator) \u2192 c\u1EA7n \u0111\u1EA3m b\u1EA3o event lan ra \u0111\u1EC3 message hi\u1EC3n th\u1ECB.
  forbidThirteen = async (value: any): Promise<string> =>
    Number(value) === 13 ? 'S\u1ED1 13 kh\xF4ng \u0111\u01B0\u1EE3c ph\xE9p' : '';

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  // why: "\u0110\u1EB7t l\u1EA1i" KH\xD4NG d\xF9ng fg.reset() \u2014 reset() set control v\u1EC1 null (r\u1ED7ng) \u2192 min/max/validator
  // kh\xF4ng b\u1EAFt l\u1ED7i tr\xEAn gi\xE1 tr\u1ECB r\u1ED7ng \u2192 b\u1EA5m "Hi\u1EC7n l\u1ED7i" l\u1EA7n n\u1EEFa kh\xF4ng th\u1EA5y l\u1ED7i (v\xE0 \xF4 s\u1ED1 v\u1EABn hi\u1EC3n th\u1ECB
  // gi\xE1 tr\u1ECB c\u0169 v\xEC inputControl hi\u1EC3n th\u1ECB kh\xF4ng n\u1EB1m trong FormGroup). Gieo l\u1EA1i gi\xE1 tr\u1ECB sai m\u1EABu qua
  // [(model)] signal r\u1ED3i markAsUntouched \u2192 demo l\u1EB7p l\u1EA1i \u0111\u01B0\u1EE3c.
  showErr() { this.formErr.markAllAsTouched(); }
  resetErr() {
    this.errRequired.set(null);
    this.errMin.set(5);
    this.errMax.set(500);
    this.errValidator.set(13);
    this.errInline.set(7);
    this.formErr.markAsUntouched();
  }
  showIcon() { this.formIcon.markAllAsTouched(); }
  resetIcon() {
    this.iconMin.set(5);
    this.iconMax.set(500);
    this.iconValidator.set(13);
    this.formIcon.markAsUntouched();
  }
}
`},"forms/radio":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdRadio } from '@sdcorejs/angular/forms/radio';

interface Option { value: string; display: string; }

@Component({
  selector: 'app-radio-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdRadio],
  template: \`
    <demo-page #demoPage title="Radio" description="sd-radio \u2013 ch\u1ECDn 1 gi\xE1 tr\u1ECB trong nh\xF3m. H\u1ED7 tr\u1EE3 hi\u1EC3n th\u1ECB h\xE0ng ngang/d\u1ECDc v\xE0 c\xE1c tr\u1EA1ng th\xE1i kho\xE1.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hien-thi') {
      <demo-section heading="Hi\u1EC3n th\u1ECB" [props]="[{ name: 'display', value: 'row / column' }]" note="display='row' (m\u1EB7c \u0111\u1ECBnh) v\xE0 display='column' khi danh s\xE1ch d\xE0i.">
        <div style="display:flex; flex-direction:column; gap:16px; width:100%">
          <sd-radio label="row" [items]="genders" valueField="value" displayField="display"
            [(model)]="gender" [form]="form"></sd-radio>
          <sd-radio label="column" display="column"
            [items]="priorities" valueField="value" displayField="display"
            [(model)]="priority" [form]="form"></sd-radio>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Kh\xF4ng ch\u1ECDn v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
        <div style="display:flex; flex-direction:column; gap:12px; width:100%">
          <sd-radio label="required"
            [items]="payments" valueField="value" displayField="display"
            [(model)]="payment" [form]="formValid" required></sd-radio>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="\u0110\xE3 c\xF3 gi\xE1 tr\u1ECB m\u1EB7c \u0111\u1ECBnh.">
        <div style="display:flex; gap:24px; flex-wrap:wrap; width:100%">
          <sd-radio style="flex:1" label="disabled" [items]="genders" valueField="value" displayField="display"
            [(model)]="lockedA" [form]="form" disabled></sd-radio>
          <sd-radio style="flex:1" label="viewed" [items]="genders" valueField="value" displayField="display"
            [(model)]="lockedB" [form]="form" viewed></sd-radio>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Radio v\u1EABn ch\u1ECDn \u0111\u01B0\u1EE3c; khi disabled th\xEC hi\u1EC7n text t\u0129nh (viewed=true).">
        <div style="display:flex; gap:24px; flex-wrap:wrap; width:100%">
          <sd-radio style="flex:1" label="inline" [items]="genders" valueField="value" displayField="display"
            [viewed]="'inline'" [(model)]="inlineChoice" [form]="form"></sd-radio>
          <sd-radio style="flex:1" label="disabled + inline \u2192 t\u0129nh" [items]="genders" valueField="value" displayField="display"
            [viewed]="'inline'" [(model)]="inlineChoice" [form]="form" disabled></sd-radio>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  genders: Option[] = [
    { value: 'M', display: 'Nam' },
    { value: 'F', display: 'N\u1EEF' },
    { value: 'O', display: 'Kh\xE1c' },
  ];

  priorities: Option[] = [
    { value: 'low', display: 'Th\u1EA5p' },
    { value: 'med', display: 'Trung b\xECnh' },
    { value: 'high', display: 'Cao' },
    { value: 'urg', display: 'Kh\u1EA9n c\u1EA5p' },
  ];

  payments: Option[] = [
    { value: 'cash', display: 'Ti\u1EC1n m\u1EB7t' },
    { value: 'card', display: 'Th\u1EBB t\xEDn d\u1EE5ng' },
    { value: 'wallet', display: 'V\xED \u0111i\u1EC7n t\u1EED' },
  ];

  gender = signal<string | null>('M');
  priority = signal<string | null>('med');
  payment = signal<string | null>(null);
  lockedA = signal<string | null>('M');
  lockedB = signal<string | null>('F');
  inlineChoice = signal<string | null>('F');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
`},"forms/select":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSelect, SdSelectFooterActionDirective } from '@sdcorejs/angular/forms/select';

interface Option { value: string; display: string; }

@Component({
  selector: 'app-select-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSelect, SdSelectFooterActionDirective],
  template: \`
    <demo-page #demoPage title="Select" description="sd-select \u2013 dropdown ch\u1ECDn 1 gi\xE1 tr\u1ECB. Truy\u1EC1n items v\u1EDBi valueField + displayField.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u, hi\u1EC3n th\u1ECB gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="Ch\u1ECDn ph\xF2ng ban" placeholder="Ch\u1ECDn..." [(model)]="dept" [form]="form"></sd-select>
          <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ dept() ?? '(tr\u1ED1ng)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="required" helperText="Ch\u1ECDn ph\xF2ng \u0111ang c\xF4ng t\xE1c"
            [(model)]="deptR" [form]="formValid" required></sd-select>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Gi\xE1 tr\u1ECB \u0111\xE3 c\xF3 s\u1EB5n.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-select>
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-select>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF panel ch\u1ECDn (kh\xF4ng hi\u1EC7n \xF4 input). Text gi\u1EEF nguy\xEAn trong l\xFAc panel m\u1EDF, ch\u1EC9 \u0111\u1ED5i khi ch\u1ECDn gi\xE1 tr\u1ECB m\u1EDBi.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <div style="font-size:12px; color:#555">
            Ph\xF2ng ban:
            <sd-select [items]="items" valueField="value" displayField="display"
              [viewed]="'inline'" [(model)]="inlineDept" [form]="form"></sd-select>
          </div>
          <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ inlineDept() ?? '(tr\u1ED1ng)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="UI g\u1ECDn cho b\u1EA3ng / toolbar.">
        <div style="width: 280px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="sm" size="sm" [(model)]="quick" [form]="form"></sd-select>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-nhieu-voi-dong-tat-ca') {
      <demo-section
        heading="Ch\u1ECDn nhi\u1EC1u v\u1EDBi d\xF2ng T\u1EA5t c\u1EA3"
        [props]="[{ name: 'showSelectAll', value: 'true' }, { name: 'multiple', value: 'true' }, { name: 'disabledField', value: 'disabled' }]"
        note="Row 'T\u1EA5t c\u1EA3' \u0111\u1EA7u panel \u2014 ch\u1EC9 hi\u1EC7n khi multiple + items l\xE0 m\u1EA3ng t\u0129nh. Tick ch\u1ECDn to\xE0n b\u1ED9 items enabled kh\u1EDBp search hi\u1EC7n t\u1EA1i (item disabled 'Ph\xE1p ch\u1EBF' kh\xF4ng b\u1ECB \u0111\u1EE5ng); \u0111ang search th\xEC tick CH\u1EC8 th\xEAm items kh\u1EDBp filter, selection c\u0169 gi\u1EEF nguy\xEAn. Checkbox c\xF3 3 tr\u1EA1ng th\xE1i checked / indeterminate / unchecked.">
        <div class="select-demo-column">
          <sd-select
            label="\u0110\u01A1n v\u1ECB tham gia" multiple showSelectAll
            [items]="selectAllItems"
            valueField="value" displayField="display" disabledField="disabled"
            placeholder="Ch\u1ECDn c\xE1c \u0111\u01A1n v\u1ECB..."
            minWidthPanel="360px"
            [(model)]="selectAllDepts"
            [form]="form">
          </sd-select>
          <div class="select-demo-status">\u0110\xE3 ch\u1ECDn ({{ selectAllDepts()?.length ?? 0 }}): <b>{{ selectAllDepts()?.join(', ') || '(tr\u1ED1ng)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-action-khi-khong-co-ket-qua') {
      <demo-section
        heading="Footer action khi kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3"
        [props]="[{ name: 'sdSelectFooterAction', value: 'template' }, { name: 'when', value: 'empty' }, { name: 'searchText', value: 'context' }]"
        note="G\xF5 m\u1ED9t ph\xF2ng ban ch\u01B0a c\xF3 trong danh s\xE1ch. Khi search text kh\xE1c r\u1ED7ng v\xE0 danh s\xE1ch l\u1ECDc v\u1EC1 0 item, footer hi\u1EC3n th\u1ECB n\xFAt th\xEAm m\u1EDBi.">
        <div class="select-demo-column">
          <sd-select
            [items]="footerItems"
            valueField="value"
            displayField="display"
            label="T\xECm ho\u1EB7c th\xEAm ph\xF2ng ban"
            placeholder="G\xF5 \u0111\u1EC3 t\xECm..."
            minWidthPanel="360px"
            [(model)]="footerDept"
            [form]="form">
            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="addDepartment(searchText)">
                  Th\xEAm "{{ searchText }}"
                </button>
              </div>
            </ng-template>
          </sd-select>

          <div class="select-demo-status">
            Gi\xE1 tr\u1ECB \u0111ang ch\u1ECDn: <b>{{ footerDept() ?? '(tr\u1ED1ng)' }}</b>
          </div>
          <div class="select-demo-status">
            Log: <b>{{ lastFooterAction() }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhieu-footer-action-va-thu-tu-khai-bao') {
      <demo-section
        heading="Nhi\u1EC1u footer action v\xE0 th\u1EE9 t\u1EF1 khai b\xE1o"
        [props]="[{ name: 'when', value: 'always / has-result / empty' }, { name: 'contentChildren', value: 'order' }]"
        note="C\xE1c template \u0111\u01B0\u1EE3c render theo \u0111\xFAng th\u1EE9 t\u1EF1 khai b\xE1o trong sd-select. Event binding v\u1EABn ch\u1EA1y trong context c\u1EE7a component cha.">
        <div class="select-demo-column select-demo-column--wide">
          <sd-select
            [items]="largeItems"
            valueField="value"
            displayField="display"
            label="Ch\u1ECDn \u0111\u01A1n v\u1ECB x\u1EED l\xFD"
            placeholder="G\xF5 \u0111\u1EC3 l\u1ECDc..."
            minWidthPanel="420px"
            [(model)]="footerActionDept"
            [form]="form">
            <ng-template sdSelectFooterAction>
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('always')">
                  Lu\xF4n hi\u1EC3n th\u1ECB: m\u1EDF c\u1EA5u h\xECnh danh m\u1EE5c
                </button>
              </div>
            </ng-template>

            <ng-template sdSelectFooterAction when="has-result" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('has-result', searchText)">
                  C\xF3 k\u1EBFt qu\u1EA3: d\xF9ng "{{ searchText || 't\u1EA5t c\u1EA3' }}" l\xE0m b\u1ED9 l\u1ECDc nhanh
                </button>
              </div>
            </ng-template>

            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="recordFooterAction('empty', searchText)">
                  Kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3: g\u1EEDi y\xEAu c\u1EA7u t\u1EA1o "{{ searchText }}"
                </button>
              </div>
            </ng-template>
          </sd-select>

          <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-action-giong-dropdown-item') {
      <demo-section
        heading="Footer action gi\u1ED1ng dropdown item"
        [props]="[{ name: 'custom CSS', value: 'padding + item row' }, { name: 'tag', value: 'div' }]"
        note="Kh\xF4ng b\u1EAFt bu\u1ED9c d\xF9ng button. C\xF3 th\u1EC3 d\xF9ng div role=button, t\u1EF1 th\xEAm padding v\xE0 hover style \u0111\u1EC3 footer action nh\xECn nh\u01B0 m\u1ED9t option trong dropdown.">
        <div class="select-demo-column select-demo-column--wide">
          <sd-select
            [items]="largeItems"
            valueField="value"
            displayField="display"
            label="T\u1EA1o nhanh nh\xF3m x\u1EED l\xFD"
            placeholder="G\xF5 t\xEAn nh\xF3m m\u1EDBi..."
            minWidthPanel="420px"
            [(model)]="footerItemDept"
            [form]="form">
            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <div
                  class="select-demo-footer-item"
                  role="button"
                  tabindex="0"
                  (click)="recordFooterAction('dropdown-item', searchText)"
                  (keydown.enter)="recordFooterAction('dropdown-item', searchText)"
                  (keydown.space)="recordFooterAction('dropdown-item', searchText)">
                  <span class="select-demo-footer-item__mark">+</span>
                  <span class="select-demo-footer-item__main">T\u1EA1o nh\xF3m "{{ searchText }}"</span>
                  <span class="select-demo-footer-item__meta">Footer custom</span>
                </div>
              </div>
            </ng-template>
          </sd-select>

          <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-api-footer-action') {
      <demo-section
        heading="API footer action"
        [props]="[{ name: 'selector', value: 'ng-template[sdSelectFooterAction]' }, { name: 'standalone', value: 'true' }]"
        note="Import SdSelectFooterActionDirective c\xF9ng v\u1EDBi SdSelect khi d\xF9ng trong standalone component.">
        <div class="select-demo-api">
          <div><b>Directive</b><span><code>sdSelectFooterAction</code> \u0111\u1EB7t tr\xEAn <code>ng-template</code> b\xEAn trong <code>sd-select</code>.</span></div>
          <div><b>Padding</b><span>Core kh\xF4ng \xE1p padding cho footer. Consumer t\u1EF1 b\u1ECDc n\u1ED9i dung b\u1EB1ng class ri\xEAng, v\xED d\u1EE5 <code>.select-demo-footer-padding</code>.</span></div>
          <div><b>when="always"</b><span>Render m\u1ECDi l\xFAc, mi\u1EC5n l\xE0 panel \u0111ang c\xF3 footer action.</span></div>
          <div><b>when="empty"</b><span>Ch\u1EC9 render khi ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 nh\u1EADp search text v\xE0 s\u1ED1 option sau l\u1ECDc b\u1EB1ng 0.</span></div>
          <div><b>when="has-result"</b><span>Render khi s\u1ED1 option sau l\u1ECDc l\u1EDBn h\u01A1n 0.</span></div>
          <div><b>Context</b><span><code>let-searchText="searchText"</code> truy\u1EC1n search text hi\u1EC7n t\u1EA1i v\xE0o template.</span></div>
          <div><b>Event</b><span><code>(click)="addNew(searchText)"</code> ch\u1EA1y b\xECnh th\u01B0\u1EDDng trong component cha.</span></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-snippet-mau') {
      <demo-section
        heading="Snippet m\u1EABu"
        [props]="[{ name: 'copy pattern', value: 'HTML' }]"
        note="M\u1EABu t\u1ED1i thi\u1EC3u cho case th\xEAm nhanh item khi kh\xF4ng t\xECm th\u1EA5y k\u1EBFt qu\u1EA3.">
        <pre class="select-demo-code">{{ footerActionSnippet }}</pre>
      </demo-section>
      }
    </demo-page>
  \`,
  styles: [\`
    .select-demo-column {
      width: min(100%, 420px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .select-demo-column--wide {
      width: min(100%, 520px);
    }

    .select-demo-status {
      font-size: 12px;
      color: #555;
    }

    .select-demo-log,
    .select-demo-code {
      width: 100%;
      margin: 0;
      padding: 10px 12px;
      border: 1px solid #e6e6e6;
      border-radius: 6px;
      background: #f7f8fa;
      color: #222;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow: auto;
    }

    .select-demo-api {
      width: min(100%, 760px);
      display: grid;
      gap: 8px;
    }

    .select-demo-api > div {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 12px;
      align-items: start;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: #444;
    }

    .select-demo-api > div:last-child {
      border-bottom: 0;
    }

    .select-demo-api b {
      color: #1f2937;
      font-weight: 600;
    }

    .select-demo-api code {
      padding: 1px 4px;
      border-radius: 4px;
      background: #f0f3f7;
      font-size: 12px;
    }

    .select-demo-footer-btn {
      width: 100%;
      min-height: 34px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #fff;
      color: #24292f;
      font-size: 13px;
      text-align: left;
      padding: 6px 10px;
      cursor: pointer;
    }

    .select-demo-footer-btn:hover {
      background: #f6f8fa;
    }

    .select-demo-footer-btn--primary {
      border-color: #1f6feb;
      color: #0b57d0;
      font-weight: 600;
    }

    .select-demo-footer-padding {
      padding: 8px;
    }

    .select-demo-footer-item {
      display: grid;
      grid-template-columns: 24px 1fr auto;
      gap: 8px;
      align-items: center;
      min-height: 36px;
      padding: 8px 10px;
      border-radius: 4px;
      color: #24292f;
      cursor: pointer;
      user-select: none;
    }

    .select-demo-footer-item:hover,
    .select-demo-footer-item:focus-visible {
      background: #f6f8fa;
      outline: none;
    }

    .select-demo-footer-item__mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #eaf2ff;
      color: #0b57d0;
      font-weight: 700;
      line-height: 1;
    }

    .select-demo-footer-item__main {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
    }

    .select-demo-footer-item__meta {
      color: #6b7280;
      font-size: 12px;
    }

    @media (max-width: 640px) {
      .select-demo-api > div {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .select-demo-footer-item {
        grid-template-columns: 24px 1fr;
      }

      .select-demo-footer-item__meta {
        grid-column: 2;
      }
    }
  \`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  items: Option[] = [
    { value: 'IT',  display: 'C\xF4ng ngh\u1EC7 th\xF4ng tin' },
    { value: 'HR',  display: 'Nh\xE2n s\u1EF1' },
    { value: 'FIN', display: 'T\xE0i ch\xEDnh' },
    { value: 'OPS', display: 'V\u1EADn h\xE0nh' },
  ];

  largeItems: Option[] = [
    { value: 'IT', display: 'C\xF4ng ngh\u1EC7 th\xF4ng tin' },
    { value: 'HR', display: 'Nh\xE2n s\u1EF1' },
    { value: 'FIN', display: 'T\xE0i ch\xEDnh' },
    { value: 'OPS', display: 'V\u1EADn h\xE0nh' },
    { value: 'MKT', display: 'Marketing' },
    { value: 'SALES', display: 'Kinh doanh' },
    { value: 'CS', display: 'Ch\u0103m s\xF3c kh\xE1ch h\xE0ng' },
    { value: 'LEGAL', display: 'Ph\xE1p ch\u1EBF' },
    { value: 'ADMIN', display: 'H\xE0nh ch\xEDnh' },
    { value: 'PMO', display: 'Qu\u1EA3n l\xFD d\u1EF1 \xE1n' },
    { value: 'QA', display: '\u0110\u1EA3m b\u1EA3o ch\u1EA5t l\u01B0\u1EE3ng' },
    { value: 'DATA', display: 'Ph\xE2n t\xEDch d\u1EEF li\u1EC7u' },
    { value: 'SEC', display: 'An to\xE0n th\xF4ng tin' },
    { value: 'RND', display: 'Nghi\xEAn c\u1EE9u ph\xE1t tri\u1EC3n' },
  ];

  footerItems: Option[] = [...this.largeItems];

  /** why: 'LEGAL' disabled \u0111\u1EC3 demo h\xE0nh vi b\u1ECF qua item disabled c\u1EE7a d\xF2ng "T\u1EA5t c\u1EA3" */
  selectAllItems: (Option & { disabled?: boolean })[] = this.largeItems.map(item =>
    item.value === 'LEGAL' ? { ...item, disabled: true } : { ...item }
  );

  dept = signal<string | null>(null);
  deptR = signal<string | null>(null);
  lockedA = signal<string | null>('HR');
  lockedB = signal<string | null>('FIN');
  inlineDept = signal<string | null>('IT');
  quick = signal<string | null>(null);
  selectAllDepts = signal<string[] | null>(null);
  footerDept = signal<string | null>(null);
  footerActionDept = signal<string | null>(null);
  footerItemDept = signal<string | null>(null);
  lastFooterAction = signal<string>('Ch\u01B0a c\xF3 thao t\xE1c footer action.');

  readonly footerActionSnippet = \`<sd-select [items]="items" valueField="value" displayField="display">
  <ng-template
    sdSelectFooterAction
    when="empty"
    let-searchText="searchText"
  >
    <div class="my-select-footer-padding">
      <button type="button" (click)="addNew(searchText)">
        Add "{{ searchText }}"
      </button>
    </div>
  </ng-template>
</sd-select>\`;

  #customDepartmentSeq = 1;

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  addDepartment(searchText: string): void {
    const display = searchText.trim();
    if (!display) {
      this.lastFooterAction.set('Footer empty ch\u1EC9 n\xEAn th\xEAm khi searchText kh\xE1c r\u1ED7ng.');
      return;
    }

    const value = \`CUSTOM_\${this.#customDepartmentSeq++}\`;
    this.footerItems = [...this.footerItems, { value, display }];
    this.footerDept.set(value);
    this.lastFooterAction.set(\`\u0110\xE3 th\xEAm ph\xF2ng ban "\${display}" v\xE0 ch\u1ECDn gi\xE1 tr\u1ECB \${value}.\`);
  }

  recordFooterAction(when: string, searchText = ''): void {
    const text = searchText.trim() || '(kh\xF4ng nh\u1EADp search text)';
    this.lastFooterAction.set(\`Action "\${when}" \u0111\u01B0\u1EE3c b\u1EA5m v\u1EDBi searchText: \${text}.\`);
  }
}
`,scss:`.select-demo-column {
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.select-demo-column--wide {
  width: min(100%, 520px);
}

.select-demo-status {
  font-size: 12px;
  color: #555;
}

.select-demo-log,
.select-demo-code {
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  background: #f7f8fa;
  color: #222;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow: auto;
}

.select-demo-api {
  width: min(100%, 760px);
  display: grid;
  gap: 8px;
}

.select-demo-api > div {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  align-items: start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #444;
}

.select-demo-api > div:last-child {
  border-bottom: 0;
}

.select-demo-api b {
  color: #1f2937;
  font-weight: 600;
}

.select-demo-api code {
  padding: 1px 4px;
  border-radius: 4px;
  background: #f0f3f7;
  font-size: 12px;
}

.select-demo-footer-btn {
  width: 100%;
  min-height: 34px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
  color: #24292f;
  font-size: 13px;
  text-align: left;
  padding: 6px 10px;
  cursor: pointer;
}

.select-demo-footer-btn:hover {
  background: #f6f8fa;
}

.select-demo-footer-btn--primary {
  border-color: #1f6feb;
  color: #0b57d0;
  font-weight: 600;
}

.select-demo-footer-padding {
  padding: 8px;
}

.select-demo-footer-item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 4px;
  color: #24292f;
  cursor: pointer;
  user-select: none;
}

.select-demo-footer-item:hover,
.select-demo-footer-item:focus-visible {
  background: #f6f8fa;
  outline: none;
}

.select-demo-footer-item__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #0b57d0;
  font-weight: 700;
  line-height: 1;
}

.select-demo-footer-item__main {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.select-demo-footer-item__meta {
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 640px) {
  .select-demo-api > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .select-demo-footer-item {
    grid-template-columns: 24px 1fr;
  }

  .select-demo-footer-item__meta {
    grid-column: 2;
  }
}`},"forms/switch":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';

@Component({
  selector: 'app-switch-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSwitch],
  template: \`
    <demo-page #demoPage title="Switch" description="sd-switch \u2013 c\xF4ng t\u1EAFc b\u1EADt/t\u1EAFt boolean. H\u1ED7 tr\u1EE3 m\xE0u ch\u1EE7 \u0111\u1EC1, disabled / viewed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u, hi\u1EC3n th\u1ECB tr\u1EA1ng th\xE1i ngay b\xEAn c\u1EA1nh.">
        <div style="display:flex; flex-direction:column; gap:8px; width:100%">
          <sd-switch label="Nh\u1EADn th\xF4ng b\xE1o qua email" [(model)]="notify" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555">
            Tr\u1EA1ng th\xE1i: <b>{{ notify() ? 'B\u1EACT' : 'T\u1EAET' }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-cau-hinh') {
      <demo-section heading="Danh s\xE1ch c\u1EA5u h\xECnh" note="M\u1ED7i switch \u0111i\u1EC1u khi\u1EC3n m\u1ED9t option \u0111\u1ED9c l\u1EADp.">
        <div style="display:flex; flex-direction:column; gap:6px">
          <sd-switch label="T\u1EF1 \u0111\u1ED9ng l\u01B0u" [(model)]="autoSave" [form]="form"></sd-switch>
          <sd-switch label="Ch\u1EBF \u0111\u1ED9 t\u1ED1i" [(model)]="darkMode" [form]="form"></sd-switch>
          <sd-switch label="\u0110\u1ED3ng b\u1ED9 Cloud" [(model)]="cloudSync" [form]="form"></sd-switch>
          <div style="font-size:12px; color:#555; margin-top:6px">
            T\xF3m t\u1EAFt: autoSave={{ autoSave() }} \xB7 darkMode={{ darkMode() }} \xB7 cloud={{ cloudSync() }}
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac') {
      <demo-section heading="M\xE0u s\u1EAFc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thu\u1ED9c t\xEDnh color thay \u0111\u1ED5i accent track.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="primary" color="primary" [(model)]="s1" [form]="form"></sd-switch>
          <sd-switch label="success" color="success" [(model)]="s2" [form]="form"></sd-switch>
          <sd-switch label="warning" color="warning" [(model)]="s3" [form]="form"></sd-switch>
          <sd-switch label="error" color="error" [(model)]="s4" [form]="form"></sd-switch>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-switch>
          <sd-switch label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-switch>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-xem') {
      <demo-section heading="Ch\u1EBF \u0111\u1ED9 xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hi\u1EC7n ch\u1EEF B\u1EADt/T\u1EAFt; 'inline' v\u1EABn g\u1EA1t \u0111\u01B0\u1EE3c, disabled+inline th\xEC xem t\u0129nh.">
        <div style="display:flex; gap:20px; flex-wrap:wrap">
          <sd-switch label="viewed=true (t\u0129nh)" [(model)]="viewedFlag" [form]="form" viewed></sd-switch>
          <sd-switch label="inline (v\u1EABn g\u1EA1t \u0111\u01B0\u1EE3c)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-switch>
          <sd-switch label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-switch>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchDemoComponent {
  form = new FormGroup({});

  notify = signal<boolean>(true);

  autoSave = signal<boolean>(true);
  darkMode = signal<boolean>(false);
  cloudSync = signal<boolean>(true);

  s1 = signal<boolean>(true);
  s2 = signal<boolean>(true);
  s3 = signal<boolean>(true);
  s4 = signal<boolean>(false);

  lockedA = signal<boolean>(true);
  lockedB = signal<boolean>(false);

  viewedFlag = signal<boolean>(true);
  inlineFlag = signal<boolean>(false);
}
`},"forms/textarea":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';

@Component({
  selector: 'app-textarea-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdTextarea],
  template: \`
    <demo-page #demoPage title="Textarea" description="sd-textarea \u2013 \xF4 nh\u1EADp nhi\u1EC1u d\xF2ng. H\u1ED7 tr\u1EE3 helper text, validator chi\u1EC1u d\xE0i, c\xE1c tr\u1EA1ng th\xE1i disabled / readonly.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u v\u1EDBi [(model)].">
        <div style="width: 420px">
          <sd-textarea label="M\xF4 t\u1EA3" placeholder="Nh\u1EADp m\xF4 t\u1EA3..." helperText="T\u1ED1i \u0111a 500 k\xFD t\u1EF1" [(model)]="basic" [form]="form"></sd-textarea>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'maxlength', value: '50' }]" note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n inline error.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-textarea label="required + maxlength=50" [(model)]="reason" [form]="formValid" required [maxlength]="50"></sd-textarea>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Ki\u1EC3m tra</button>
            <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-textarea style="width: 280px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
          <sd-textarea style="width: 280px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-textarea>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text kh\xF4ng vi\u1EC1n \u2014 b\u1EA5m/focus \u0111\u1EC3 s\u1EEDa t\u1EA1i ch\u1ED7. Khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <div style="font-size:12px; color:#555">
            Ghi ch\xFA:
            <sd-textarea [viewed]="'inline'" [(model)]="inlineNote" [form]="form"></sd-textarea>
          </div>
          <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ inlineNote() ?? '(tr\u1ED1ng)' }}</b></div>
          <sd-textarea label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
        </div>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  basic = signal<string | null>('M\u1ED9t m\xF4 t\u1EA3 m\u1EABu...');
  reason = signal<string | null>(null);
  lockedA = signal<string | null>('Kh\xF4ng th\u1EC3 s\u1EEDa');
  lockedB = signal<string | null>('Ch\u1EC9 \u0111\u1ECDc');
  inlineNote = signal<string | null>('B\u1EA5m v\xE0o \u0111\u1EC3 s\u1EEDa ghi ch\xFA n\xE0y');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
`},"forms/time":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SdTime } from '@sdcorejs/angular/forms/time';

import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, ReactiveFormsModule, SdTime],
  template: \`
    <demo-page #demoPage title="Time" description="sd-time \u2013 nh\u1EADp ho\u1EB7c ch\u1ECDn gi\u1EDD thu\u1EA7n theo m\xF4 h\xECnh HH:mm, kh\xF4ng mang ng\xE0y hay m\xFAi gi\u1EDD.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="C\u01A1 b\u1EA3n"
          [props]="[{ name: '[(model)]', value: basic() ?? 'null' }]"
          note="C\xF3 th\u1EC3 g\xF5 9:05 \u0111\u1EC3 nh\u1EADn model chu\u1EA9n h\xF3a 09:05, ho\u1EB7c m\u1EDF b\u1ED9 ch\u1ECDn gi\u1EDD.">
          <div style="width: 320px">
            <sd-time [form]="form" name="basic" label="Gi\u1EDD b\u1EAFt \u0111\u1EA7u" clearable [(model)]="basic"></sd-time>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-va-buoc-phut') {
        <demo-section
          heading="Gi\u1EDBi h\u1EA1n v\xE0 b\u01B0\u1EDBc ph\xFAt"
          [props]="[
            { name: 'min', value: '08:00' },
            { name: 'max', value: '18:00' },
            { name: 'step', value: '15' },
          ]"
          note="Min/max bao g\u1ED3m bi\xEAn; ph\xEDm m\u0169i t\xEAn v\xE0 b\u1ED9 ch\u1ECDn c\xF9ng d\xF9ng b\u01B0\u1EDBc 15 ph\xFAt.">
          <div style="width: 320px">
            <sd-time [form]="form" name="bounded" label="Ca l\xE0m vi\u1EC7c" min="08:00" max="18:00" [step]="15" [(model)]="bounded"> </sd-time>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validation') {
        <demo-section
          heading="Validation"
          [props]="[{ name: 'required', value: 'true' }]"
          note="Text sai nh\u01B0 25:10 \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i \u0111\u1EC3 s\u1EEDa, control invalid v\xE0 model h\u1EE3p l\u1EC7 tr\u01B0\u1EDBc \u0111\xF3 kh\xF4ng b\u1ECB ghi \u0111\xE8.">
          <div style="width: 320px">
            <sd-time [form]="validationForm" name="requiredTime" label="Gi\u1EDD b\u1EAFt bu\u1ED9c" required [(model)]="requiredTime"></sd-time>
          </div>
          <button type="button" (click)="validationForm.markAllAsTouched()">Hi\u1EC7n l\u1ED7i</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
          note="C\xF9ng m\u1ED9t model time-only trong c\xE1c tr\u1EA1ng th\xE1i kh\xF4ng ch\u1EC9nh s\u1EEDa.">
          <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
            <sd-time style="width:220px" label="Disabled" [model]="'08:30'" disabled></sd-time>
            <sd-time style="width:220px" label="Readonly" [model]="'12:00'" readonly></sd-time>
            <sd-time style="width:220px" label="Viewed" [model]="'17:30'" viewed></sd-time>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeDemoComponent {
  readonly form = new FormGroup({});
  readonly validationForm = new FormGroup({});
  readonly basic = signal<string | null>('09:05');
  readonly bounded = signal<string | null>('08:30');
  readonly requiredTime = signal<string | null>(null);
}
`},"forms/time-range":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SdTimeRange, SdTimeRangeValue } from '@sdcorejs/angular/forms/time-range';

import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-range-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, ReactiveFormsModule, SdTimeRange],
  template: \`
    <demo-page
      #demoPage
      title="Time Range"
      description="sd-time-range \u2013 kho\u1EA3ng gi\u1EDD thu\u1EA7n { from, to } v\u1EDBi validation t\u1ED5ng h\u1EE3p v\xE0 endpoint \u0111\u1ED9c l\u1EADp.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
        <demo-section
          heading="C\u01A1 b\u1EA3n"
          [props]="[{ name: '[(model)]', value: 'SdTimeRangeValue' }]"
          note="Hai \xF4 c\xF9ng ph\xE1t m\u1ED9t model { from, to } \u0111\xE3 chu\u1EA9n h\xF3a HH:mm.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range [form]="form" name="workingHours" label="Gi\u1EDD l\xE0m vi\u1EC7c" clearable [(model)]="workingHours"></sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gioi-han-va-thu-tu') {
        <demo-section
          heading="Gi\u1EDBi h\u1EA1n v\xE0 th\u1EE9 t\u1EF1"
          [props]="[
            { name: 'min', value: '08:00' },
            { name: 'max', value: '18:00' },
            { name: 'step', value: '15' },
          ]"
          note="M\u1ED7i \u0111\u1EA7u ki\u1EC3m tra min/max/step; gi\u1EDD b\u1EAFt \u0111\u1EA7u sau gi\u1EDD k\u1EBFt th\xFAc t\u1EA1o l\u1ED7i range.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range
              [form]="form"
              name="boundedHours"
              label="Khung ph\u1EE5c v\u1EE5"
              min="08:00"
              max="18:00"
              [step]="15"
              [(model)]="boundedHours">
            </sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khoang-mo') {
        <demo-section
          heading="Kho\u1EA3ng m\u1EDF"
          [props]="[{ name: 'allowOpenEnded', value: 'true' }]"
          note="Cho ph\xE9p ch\u1EC9 c\xF3 m\u1ED1c b\u1EAFt \u0111\u1EA7u ho\u1EB7c k\u1EBFt th\xFAc khi field kh\xF4ng required.">
          <div style="width: 520px; max-width:100%">
            <sd-time-range [form]="form" name="openHours" label="\xC1p d\u1EE5ng t\u1EEB" allowOpenEnded [(model)]="openHours"> </sd-time-range>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i"
          [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
          note="Viewed hi\u1EC3n th\u1ECB model time-only m\xE0 kh\xF4ng kh\u1EDFi t\u1EA1o Date \u1EDF API c\xF4ng khai.">
          <div style="display:flex; gap:16px; flex-direction:column; max-width:520px">
            <sd-time-range label="Disabled" [model]="workingHours()" disabled></sd-time-range>
            <sd-time-range label="Readonly" [model]="workingHours()" readonly></sd-time-range>
            <sd-time-range label="Viewed" [model]="workingHours()" viewed></sd-time-range>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeRangeDemoComponent {
  readonly form = new FormGroup({});
  readonly workingHours = signal<SdTimeRangeValue | null>({ from: '08:30', to: '17:30' });
  readonly boundedHours = signal<SdTimeRangeValue | null>({ from: '08:15', to: '17:45' });
  readonly openHours = signal<SdTimeRangeValue | null>({ from: '09:00', to: null });
}
`},"forms/tree-select":{typescript:`import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdTreeItemLazy, SdTreeItemStatic } from '@sdcorejs/angular/components/tree';
import { SdTreeSelect, SdTreeSelectNodeTemplateDirective } from '@sdcorejs/angular/forms/tree-select';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface Department {
  id: number;
  name: string;
  locked?: boolean;
}

const FINANCE: Department = { id: 1, name: 'T\xE0i ch\xEDnh' };
const PAYABLE: Department = { id: 2, name: 'C\xF4ng n\u1EE3 ph\u1EA3i tr\u1EA3' };
const RECEIVABLE: Department = { id: 3, name: 'C\xF4ng n\u1EE3 ph\u1EA3i thu' };
const HR: Department = { id: 4, name: 'Nh\xE2n s\u1EF1', locked: true };

const STATIC_ITEMS: SdTreeItemStatic<Department>[] = [
  {
    id: 'finance',
    label: FINANCE.name,
    data: FINANCE,
    children: [
      { id: 'payable', label: PAYABLE.name, data: PAYABLE },
      { id: 'receivable', label: RECEIVABLE.name, data: RECEIVABLE },
    ],
  },
  { id: 'hr', label: HR.name, data: HR },
];

@Component({
  selector: 'app-tree-select-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTreeSelect, SdTreeSelectNodeTemplateDirective],
  template: \`
    <demo-page
      #demoPage
      title="Tree Select"
      description="SdTreeSelect gi\u1EEF model theo stable key v\xE0 compose SdTree static/lazy v\u1EDBi keyboard, cascade v\xE0 indeterminate semantics.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-static-single-select') {
        <demo-section heading="Static single-select" [props]="[{ name: 'model', value: single() ?? 'null' }]">
          <sd-tree-select style="max-width: 520px" [items]="staticItems" valueField="id" displayField="name" [(model)]="single" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-cascade') {
        <demo-section
          heading="Multiple cascade"
          [props]="[
            { name: 'cascade', value: 'descendants' },
            { name: 'model', value: multiple().join(', ') },
          ]"
          note="Ch\u1ECDn parent \xE1p d\u1EE5ng cho descendants \u0111\xE3 load; partial selection hi\u1EC3n th\u1ECB indeterminate, node locked kh\xF4ng t\u01B0\u01A1ng t\xE1c.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="staticItems"
            valueField="id"
            displayField="name"
            multiple
            cascade="descendants"
            [disabledNode]="disabledDepartment"
            [(model)]="multiple" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lazy-tree') {
        <demo-section heading="Lazy tree" note="Children ch\u1EC9 t\u1EA3i khi m\u1EDF branch; l\u1ED7i \u0111\u01B0\u1EE3c gi\u1EEF \u1EDF node v\xE0 c\xF3 retry ri\xEAng.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="lazyItems"
            [tree]="lazyTree"
            valueField="id"
            displayField="name"
            multiple
            [model]="[3]">
            <ng-template sdTreeSelectNode let-item let-loading="loading">
              {{ item.name }}
              @if (loading) {
                \xB7 loading
              }
            </ng-template>
          </sd-tree-select>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-unloaded-key-va-viewed') {
        <demo-section
          heading="Unloaded key v\xE0 viewed"
          [props]="[{ name: 'model', value: '[99]' }]"
          note="Key ch\u01B0a load kh\xF4ng b\u1ECB x\xF3a b\u1EDFi filter/page/lazy state; viewed mode hi\u1EC3n th\u1ECB fallback key \u1ED5n \u0111\u1ECBnh.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="lazyItems"
            [tree]="lazyTree"
            valueField="id"
            displayField="name"
            multiple
            viewed
            [model]="[99]" />
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeSelectDemoComponent {
  readonly staticItems = STATIC_ITEMS;
  readonly single = signal<number | null>(2);
  readonly multiple = signal<number[]>([2]);
  readonly lazyItems: SdTreeItemLazy<Department>[] = [{ id: 'finance', label: FINANCE.name, data: FINANCE, hasChildren: true }];
  readonly lazyTree = {
    loadType: 'lazy' as const,
    onExpandChildren: async (): Promise<SdTreeItemLazy<Department>[]> => {
      await Promise.resolve();
      return [
        { id: 'payable', label: PAYABLE.name, data: PAYABLE, hasChildren: false },
        { id: 'receivable', label: RECEIVABLE.name, data: RECEIVABLE, hasChildren: false },
      ];
    },
  };
  readonly disabledDepartment = (item: Department): boolean => !!item.locked;
}
`},"modules/layout":{typescript:`import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  ISdLayoutConfiguration,
  ISdSidebarConfiguration,
  MenuPipe,
  SD_LAYOUT_CONFIGURATION,
  SD_LAYOUT_VIEWPORT,
  SdLayoutComponent,
  SdLayoutMenu,
  SdLayoutNavigationStateService,
  SdLayoutResponsiveService,
  SdLayoutService,
  SdLayoutStorageService,
  SdLayoutViewport,
} from '@sdcorejs/angular/modules/layout';
import { SD_PERMISSION_CONFIGURATION, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

type LayoutDemoVersion = 1 | 2 | 3;
type LayoutDemoViewportMode = 'desktop' | 'mobile';

export const LAYOUT_DEMO_NOTIFICATION_COUNT = signal(6);

const LAYOUT_DEMO_TRANSLATIONS: Readonly<Record<string, string>> = {
  'core.module.layout.sidebar.search': 'Search menu',
  'core.module.layout.user.update-profile': 'Update profile',
  'core.module.layout.user.setting': 'Settings',
  'core.module.layout.user.notification': 'Notifications',
  'core.module.layout.user.change-password': 'Change password',
  'core.module.layout.user.logout': 'Sign out',
};

const SIDEBAR_CONFIGURATIONS: Readonly<Record<LayoutDemoVersion, ISdSidebarConfiguration>> = {
  1: {
    version: 1,
    defaultTitle: 'Operations Portal',
    pin: { enabled: true },
  },
  2: {
    version: 2,
    interaction: 'click',
    primaryMenuIds: ['workspace', 'insights', 'settings'],
    pin: { enabled: true },
  },
  3: {
    version: 3,
    defaultCollapsed: false,
    recent: { enabled: true, maxItems: 5 },
    pin: { enabled: true },
  },
};

const DEMO_CONFIGURATION: ISdLayoutConfiguration = {
  mobileBreakpoint: 900,
  sidebar: SIDEBAR_CONFIGURATIONS[1],
  userInfo: {
    fullName: 'Nguyen Minh Anh',
    username: 'minhanh',
    email: 'minhanh@example.com',
    role: {
      text: 'Product Owner',
      icon: 'badge',
      color: '#005cbb',
    },
  },
  signout: () => undefined,
  changePassword: () => undefined,
  updateProfile: () => undefined,
  setting: () => undefined,
  notification: {
    count: LAYOUT_DEMO_NOTIFICATION_COUNT,
    action: () => undefined,
  },
};

class LayoutDemoViewport implements SdLayoutViewport {
  innerWidth = 1280;
  readonly #resizeListeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void {
    if (type === 'resize') this.#resizeListeners.add(listener);
  }

  removeEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void {
    if (type === 'resize') this.#resizeListeners.delete(listener);
  }

  resizeTo(width: number): void {
    this.innerWidth = width;
    const event = new Event('resize');
    for (const listener of this.#resizeListeners) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }
}

@Component({
  selector: 'app-layout-version-preview',
  standalone: true,
  imports: [SdLayoutComponent],
  providers: [
    LayoutDemoViewport,
    SdViewportService,
    MenuPipe,
    SdPermissionService,
    SdLayoutService,
    SdLayoutResponsiveService,
    SdLayoutStorageService,
    SdLayoutNavigationStateService,
    { provide: I18nService, useValue: { t: (key: string) => LAYOUT_DEMO_TRANSLATIONS[key] ?? key } },
    { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    { provide: SD_LAYOUT_CONFIGURATION, useValue: DEMO_CONFIGURATION },
    { provide: SD_LAYOUT_VIEWPORT, useExisting: LayoutDemoViewport },
  ],
  template: \`
    <fieldset class="layout-demo__viewport-controls">
      <legend>Preview viewport</legend>
      @for (option of viewportOptions; track option.value) {
        <button
          type="button"
          [attr.data-layout-viewport]="option.value"
          [attr.aria-pressed]="selectedViewport() === option.value"
          (click)="selectViewport(option.value)">
          {{ option.label }}
        </button>
      }
    </fieldset>

    <div
      class="layout-demo__preview"
      [class.layout-demo__preview--mobile]="selectedViewport() === 'mobile'"
      [class.layout-demo__preview--contain-v1]="version() === 1"
      [attr.data-active-layout-version]="version()"
      [attr.data-active-layout-viewport]="selectedViewport()">
      <sd-layout [menus]="menus()">
        <main class="layout-demo__content">
          <span class="layout-demo__eyebrow">V{{ version() }} live fixture</span>
          <h4>Operations overview</h4>
          <p>The page content stays mounted while this showcase switches between desktop and mobile.</p>
          <div class="layout-demo__metrics" aria-label="Example summary">
            <span><strong>24</strong> open tasks</span>
            <span><strong>8</strong> approvals</span>
            <span><strong>5</strong> reports</span>
          </div>
        </main>
      </sd-layout>
    </div>
  \`,
  styles: [
    \`
      :host {
        display: block;
        width: 100%;
      }

      .layout-demo__viewport-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        width: fit-content;
        min-width: 0;
        margin: 0;
        padding: 8px;
        border: 1px solid var(--docs-border-color, #e6e6e6);
        border-radius: 8px;
      }

      legend {
        padding: 0 4px;
        color: var(--docs-text-secondary, #4a4a4a);
        font-size: 12px;
        font-weight: 600;
      }

      button {
        min-height: 36px;
        padding: 6px 12px;
        border: 1px solid var(--docs-border-color, #d1d5db);
        border-radius: 6px;
        background: var(--docs-surface-raised, #ffffff);
        color: var(--docs-text, #1f2937);
        cursor: pointer;
      }

      button[aria-pressed='true'] {
        border-color: var(--sd-primary, #005cbb);
        background: var(--sd-primary, #005cbb);
        color: #ffffff;
      }

      button:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--sd-primary, #005cbb) 35%, transparent);
        outline-offset: 2px;
      }

      /* why: transform establishes a containing block so fixed production sidebars remain inside the live documentation fixture. */
      .layout-demo__preview {
        position: relative;
        width: min(100%, 1120px);
        height: 620px;
        margin-top: 16px;
        overflow: hidden;
        border: 1px solid var(--docs-border-color, #d1d5db);
        border-radius: 12px;
        background: var(--docs-surface-muted, #f3f5f8);
        box-shadow: 0 16px 40px rgb(15 23 42 / 12%);
        transform: translateZ(0);
        transition: width 180ms ease;
      }

      .layout-demo__preview--mobile {
        width: min(100%, 390px);
      }

      /* why: V1 normally follows the browser viewport; constrain its legacy 100vh shell to the live preview so the account footer stays visible. */
      :host ::ng-deep .layout-demo__preview--contain-v1 sd-layout,
      :host ::ng-deep .layout-demo__preview--contain-v1 sidebar-v1,
      :host ::ng-deep .layout-demo__preview--contain-v1 sidebar {
        display: block;
        height: 100%;
        min-height: 0;
      }

      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-wrapper,
      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-sidebar,
      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-content {
        height: 100% !important;
        max-height: 100% !important;
      }

      :host ::ng-deep .layout-demo__preview--contain-v1 .c-vertical {
        height: 100%;
      }

      .layout-demo__content {
        min-height: 100%;
        padding: 48px;
        background: linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(238 245 255 / 96%)), var(--docs-surface-raised, #ffffff);
      }

      .layout-demo__eyebrow {
        color: var(--sd-primary, #005cbb);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h4 {
        margin: 8px 0;
        color: var(--docs-text, #1f2937);
        font-size: 24px;
      }

      p {
        max-width: 520px;
        margin: 0;
        color: var(--docs-text-secondary, #4a4a4a);
        line-height: 1.6;
      }

      .layout-demo__metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }

      .layout-demo__metrics span {
        display: grid;
        gap: 4px;
        min-width: 112px;
        padding: 14px;
        border: 1px solid rgb(148 163 184 / 35%);
        border-radius: 10px;
        background: rgb(255 255 255 / 78%);
        color: var(--docs-text-secondary, #4a4a4a);
        font-size: 12px;
      }

      .layout-demo__metrics strong {
        color: var(--docs-text, #1f2937);
        font-size: 22px;
      }

      @media (prefers-reduced-motion: reduce) {
        .layout-demo__preview {
          transition: none;
        }
      }
    \`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutVersionPreviewComponent {
  readonly #layoutService = inject(SdLayoutService);
  readonly #viewport = inject(LayoutDemoViewport);

  version = input.required<LayoutDemoVersion>();
  menus = input<SdLayoutMenu[]>([]);
  readonly selectedViewport = signal<LayoutDemoViewportMode>('desktop');
  readonly viewportOptions = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ] as const;

  constructor() {
    effect(() => this.#layoutService.sidebar.set(SIDEBAR_CONFIGURATIONS[this.version()]));
  }

  selectViewport(viewport: LayoutDemoViewportMode): void {
    this.selectedViewport.set(viewport);
    this.#viewport.resizeTo(viewport === 'mobile' ? 390 : 1280);
  }
}

@Component({
  selector: 'app-layout-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, LayoutVersionPreviewComponent],
  template: \`
    <demo-page
      #demoPage
      title="Layout"
      description="Review each responsive sidebar version in an independent live showcase using the same rich menu fixture.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v1-classic') {
        <demo-section
          data-layout-showcase="1"
          heading="Sidebar V1 - Classic"
          note="Desktop rail with expand/collapse, menu search after more than 10 items, and the default SDCoreJS logo."
          [props]="[
            { name: 'version', value: '1' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="1" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v2-rail') {
        <demo-section
          data-layout-showcase="2"
          heading="Sidebar V2 - Rail"
          note="Primary navigation rail on desktop and bottom navigation with a direct mobile sign-out action."
          [props]="[
            { name: 'version', value: '2' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="2" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v3-collapsible') {
        <demo-section
          data-layout-showcase="3"
          heading="Sidebar V3 - Collapsible"
          note="Collapsible desktop navigation and a unified mobile drawer with pinned and recent menus."
          [props]="[
            { name: 'version', value: '3' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="3" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    :host {
      display: block;
      width: 100%;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDemoComponent {
  readonly menus: SdLayoutMenu[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      icon: 'dashboard',
      children: [
        { id: 'overview', title: 'Overview', path: '/layout-demo/overview', icon: 'dashboard', permission: true },
        { id: 'tasks', title: 'Tasks', path: '/layout-demo/tasks', icon: 'check_circle', permission: true },
        { id: 'approvals', title: 'Approvals', path: '/layout-demo/approvals', icon: 'done_all', permission: true },
        { id: 'calendar', title: 'Calendar', path: '/layout-demo/calendar', icon: 'event', permission: true },
        { id: 'teams', title: 'Teams', path: '/layout-demo/teams', icon: 'people', permission: true },
        { id: 'documents', title: 'Documents', path: '/layout-demo/documents', icon: 'description', permission: true },
        { id: 'inbox', title: 'Inbox', path: '/layout-demo/inbox', icon: 'inbox', permission: true },
        { id: 'alerts', title: 'Notifications', path: '/layout-demo/alerts', icon: 'notifications', permission: true },
        { id: 'projects', title: 'Projects', path: '/layout-demo/projects', icon: 'folder', permission: true },
        { id: 'archive', title: 'Archive', path: '/layout-demo/archive', icon: 'archive', permission: true },
        { id: 'history', title: 'History', path: '/layout-demo/history', icon: 'history', permission: true },
        { id: 'templates', title: 'Templates', path: '/layout-demo/templates', icon: 'content_copy', permission: true },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      icon: 'bar_chart',
      children: [
        { id: 'reports', title: 'Reports', path: '/layout-demo/reports', icon: 'bar_chart', permission: true },
        { id: 'activity', title: 'Activity', path: '/layout-demo/activity', icon: 'timeline', permission: true },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      children: [
        { id: 'profile', title: 'Profile', path: '/layout-demo/profile', icon: 'person', permission: true },
        { id: 'access', title: 'Access control', path: '/layout-demo/access', icon: 'security', permission: true },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help',
      children: [{ id: 'help-center', title: 'Help center', path: '/layout-demo/help', icon: 'help_outline', permission: true }],
    },
  ];
}
`,scss:`:host {
  display: block;
  width: 100%;
}`},"pipes-utilities/empty":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-empty-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdEmptyPipe],
  template: \`
    <demo-page
      #demoPage
      title="Empty Pipe"
      description="sdEmpty \u0111\u1ED5i null / undefined / chu\u1ED7i r\u1ED7ng th\xE0nh d\u1EA5u g\u1EA1ch chu\u1EA9n (--) \u0111\u1EC3 b\u1EA3ng v\xE0 view kh\xF4ng bao gi\u1EDD c\xF3 \xF4 tr\u1ED1ng tr\u1EAFng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-rong-hien-thi-dau-gach') {
        <demo-section
          heading="Gi\xE1 tr\u1ECB r\u1ED7ng hi\u1EC3n th\u1ECB d\u1EA5u g\u1EA1ch"
          [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
          note="Ch\u1EC9 \u0111\xFAng ba tr\u01B0\u1EDDng h\u1EE3p null, undefined v\xE0 '' \u0111\u01B0\u1EE3c thay th\u1EBF. S\u1ED1 0 v\xE0 chu\u1ED7i '0' KH\xD4NG b\u1ECB coi l\xE0 r\u1ED7ng.">
          <div class="value-grid">
            @for (sample of emptySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdEmpty }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-co-noi-dung-giu-nguyen') {
        <demo-section
          heading="Gi\xE1 tr\u1ECB c\xF3 n\u1ED9i dung gi\u1EEF nguy\xEAn"
          [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
          note="Pipe tr\u1EA3 v\u1EC1 nguy\xEAn gi\xE1 tr\u1ECB g\u1ED1c, kh\xF4ng \xE9p ki\u1EC3u v\xE0 kh\xF4ng format \u2014 c\u1EA7n chu\u1EA9n ho\xE1 m\u1EA3ng th\xEC d\xF9ng sdView.">
          <div class="value-grid">
            @for (sample of filledSamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdEmpty }}</code>
              </div>
            }
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 160px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyDemoComponent {
  readonly emptySamples = [
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: "'' (chu\u1ED7i r\u1ED7ng)", value: '' },
  ];

  readonly filledSamples = [
    { label: "'Nguy\u1EC5n V\u0103n A'", value: 'Nguy\u1EC5n V\u0103n A' },
    { label: '0', value: 0 },
    { label: 'false', value: false },
  ];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"pipes-utilities/format-date":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-date-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatDatePipe],
  template: \`
    <demo-page
      #demoPage
      title="Format Date Pipe"
      description="sdFormatDate \u0111\u01B0a Date, ISO string ho\u1EB7c timestamp v\u1EC1 m\u1ED9t chu\u1ED7i ng\xE0y theo token c\u1EE7a DateUtilities; m\u1EB7c \u0111\u1ECBnh l\xE0 dd/MM/yyyy.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-mac-dinh') {
        <demo-section
          heading="\u0110\u1ECBnh d\u1EA1ng m\u1EB7c \u0111\u1ECBnh"
          [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
          note="Kh\xF4ng truy\u1EC1n tham s\u1ED1 th\xEC pipe d\xF9ng dd/MM/yyyy \u2014 d\u1EA1ng ng\xE0y chu\u1EA9n c\u1EE7a c\xE1c form trong pack.">
          <div class="value-grid">
            @for (sample of sources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdFormatDate }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-tuy-chinh') {
        <demo-section
          heading="\u0110\u1ECBnh d\u1EA1ng tu\u1EF3 ch\u1EC9nh"
          [props]="[{ name: 'sdFormatDate', value: 'format' }]"
          note="Tham s\u1ED1 \u0111\u1EA7u ti\xEAn l\xE0 chu\u1ED7i token truy\u1EC1n th\u1EB3ng cho DateUtilities.toFormat.">
          <div class="value-grid">
            @for (format of formats; track format) {
              <div class="value-cell">
                <span class="value-cell__label">{{ format }}</span>
                <code>{{ isoDate | sdFormatDate: format }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-khong-hop-le') {
        <demo-section
          heading="Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7"
          [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
          note="Gi\xE1 tr\u1ECB kh\xF4ng parse \u0111\u01B0\u1EE3c tr\u1EA3 v\u1EC1 null, n\xEAn interpolation ra chu\u1ED7i r\u1ED7ng thay v\xEC 'Invalid Date'.">
          <div class="value-grid">
            @for (sample of invalidSources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code class="value-cell__empty">{{ sample.value | sdFormatDate }}</code>
              </div>
            }
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 200px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    .value-cell__empty {
      min-height: 18px;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatDateDemoComponent {
  readonly isoDate = '2026-08-14T09:41:00.000Z';

  readonly sources = [
    { label: 'ISO string', value: '2026-08-14T09:41:00.000Z' },
    { label: 'Date', value: new Date(2026, 7, 14) },
    { label: 'timestamp (ms)', value: 1_786_779_660_000 },
  ];

  readonly formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd MMM yyyy', 'MM/yyyy'];

  readonly invalidSources = [
    { label: 'null', value: null },
    { label: "'khong-phai-ngay'", value: 'khong-phai-ngay' },
  ];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

.value-cell__empty {
  min-height: 18px;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"pipes-utilities/format-datetime":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-datetime-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatDatetimePipe],
  template: \`
    <demo-page
      #demoPage
      title="Format Datetime Pipe"
      description="sdFormatDatetime l\xE0 b\u1EA3n k\xE8m gi\u1EDD c\u1EE7a sdFormatDate: c\xF9ng b\u1ED9 token, ch\u1EC9 kh\xE1c \u0111\u1ECBnh d\u1EA1ng m\u1EB7c \u0111\u1ECBnh dd/MM/yyyy HH:mm:ss.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-mac-dinh') {
        <demo-section
          heading="\u0110\u1ECBnh d\u1EA1ng m\u1EB7c \u0111\u1ECBnh"
          [props]="[{ name: 'sdFormatDatetime', value: 'dd/MM/yyyy HH:mm:ss' }]"
          note="D\xF9ng cho c\u1ED9t nh\u1EADt k\xFD, l\u1ECBch s\u1EED thao t\xE1c \u2014 n\u01A1i c\u1EA7n \u0111\u1EE7 gi\xE2y \u0111\u1EC3 ph\xE2n bi\u1EC7t hai b\u1EA3n ghi li\u1EC1n nhau.">
          <div class="value-grid">
            @for (sample of sources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdFormatDatetime }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-lay-phan-gio') {
        <demo-section
          heading="Ch\u1EC9 l\u1EA5y ph\u1EA7n gi\u1EDD"
          [props]="[{ name: 'sdFormatDatetime', value: 'format' }]"
          note="Truy\u1EC1n token ng\u1EAFn h\u01A1n khi c\u1ED9t \u0111\xE3 c\xF3 ng\xE0y \u1EDF ch\u1ED7 kh\xE1c; pipe kh\xF4ng \xE9p ph\u1EA3i hi\u1EC7n \u0111\u1EE7 ng\xE0y + gi\u1EDD.">
          <div class="value-grid">
            @for (format of formats; track format) {
              <div class="value-cell">
                <span class="value-cell__label">{{ format }}</span>
                <code>{{ isoDatetime | sdFormatDatetime: format }}</code>
              </div>
            }
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 220px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatDatetimeDemoComponent {
  readonly isoDatetime = '2026-08-14T09:41:07.000Z';

  readonly sources = [
    { label: 'ISO string', value: '2026-08-14T09:41:07.000Z' },
    { label: 'Date', value: new Date(2026, 7, 14, 16, 41, 7) },
  ];

  readonly formats = ['HH:mm', 'HH:mm:ss', 'dd/MM HH:mm', 'yyyy-MM-dd HH:mm:ss'];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"pipes-utilities/format-number":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-number-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatNumberPipe],
  template: \`
    <demo-page
      #demoPage
      title="Format Number Pipe"
      description="sdFormatNumber nh\xF3m h\xE0ng ngh\xECn theo ki\u1EC3u qu\u1ED1c t\u1EBF ho\u1EB7c ki\u1EC3u Vi\u1EC7t Nam. Kh\xF4ng truy\u1EC1n ki\u1EC3u th\xEC pipe l\u1EA5y format.number t\u1EEB SD_CORE_CONFIGURATION.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-quoc-te') {
        <demo-section
          heading="Chu\u1EA9n qu\u1ED1c t\u1EBF"
          [props]="[{ name: 'sdFormatNumber', value: '1,234,567.89' }]"
          note="D\u1EA5u ph\u1EA9y ng\u0103n h\xE0ng ngh\xECn, d\u1EA5u ch\u1EA5m ng\u0103n th\u1EADp ph\xE2n. \u0110\xE2y c\u0169ng l\xE0 m\u1EB7c \u0111\u1ECBnh khi app ch\u01B0a c\u1EA5u h\xECnh format.number.">
          <div class="value-grid">
            @for (sample of amounts; track sample) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample }}</span>
                <code>{{ sample | sdFormatNumber: 2 : '1,234,567.89' }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-viet-nam') {
        <demo-section
          heading="Chu\u1EA9n Vi\u1EC7t Nam"
          [props]="[{ name: 'sdFormatNumber', value: '1.234.567,89' }]"
          note="\u0110\u1EA3o vai tr\xF2 hai d\u1EA5u. \u0110\u1EB7t m\u1ED9t l\u1EA7n \u1EDF SD_CORE_CONFIGURATION l\xE0 m\u1ECDi pipe v\xE0 form field trong app \u0111i theo, kh\xF4ng c\u1EA7n truy\u1EC1n tham s\u1ED1.">
          <div class="value-grid">
            @for (sample of amounts; track sample) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample }}</span>
                <code>{{ sample | sdFormatNumber: 2 : '1.234.567,89' }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-chu-so-thap-phan') {
        <demo-section
          heading="S\u1ED1 ch\u1EEF s\u1ED1 th\u1EADp ph\xE2n"
          [props]="[{ name: 'sdFormatNumber', value: 'digits' }]"
          note="Tham s\u1ED1 \u0111\u1EA7u l\xE0 s\u1ED1 ch\u1EEF s\u1ED1 sau d\u1EA5u th\u1EADp ph\xE2n (m\u1EB7c \u0111\u1ECBnh 2). Gi\xE1 tr\u1ECB kh\xF4ng ph\u1EA3i s\u1ED1 tr\u1EA3 v\u1EC1 chu\u1ED7i r\u1ED7ng.">
          <div class="value-grid">
            @for (digits of digitOptions; track digits) {
              <div class="value-cell">
                <span class="value-cell__label">digits = {{ digits }}</span>
                <code>{{ 1234567.891 | sdFormatNumber: digits : '1,234,567.89' }}</code>
              </div>
            }
            <div class="value-cell">
              <span class="value-cell__label">'khong-phai-so'</span>
              <code class="value-cell__empty">{{ 'khong-phai-so' | sdFormatNumber }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 180px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    .value-cell__empty {
      min-height: 18px;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatNumberDemoComponent {
  readonly amounts = [1234567.891, 250000, 0.5, -98765.4];
  readonly digitOptions = [0, 2, 4];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

.value-cell__empty {
  min-height: 18px;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"pipes-utilities/safe-html":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-safe-html-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSafeHtmlPipe],
  template: \`
    <demo-page
      #demoPage
      title="Safe Html Pipe"
      description="sdSafeHtml sanitize theo m\u1EB7c \u0111\u1ECBnh; b\u1ECF qua sanitize l\xE0 m\u1ED9t l\u1EF1a ch\u1ECDn ph\u1EA3i khai b\xE1o r\xF5 r\xE0ng cho t\u1EEBng ch\u1ED7 d\xF9ng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sanitize-mac-dinh') {
        <demo-section
          heading="Sanitize m\u1EB7c \u0111\u1ECBnh"
          [props]="[{ name: 'sdSafeHtml', value: 'pipe' }]"
          note="Th\u1EBB script, thu\u1ED9c t\xEDnh on* v\xE0 url javascript: b\u1ECB lo\u1EA1i b\u1ECF; ph\u1EA7n markup l\xE0nh t\xEDnh c\xF2n l\u1EA1i v\u1EABn render. \u0110\xE2y l\xE0 nh\xE1nh d\xF9ng cho m\u1ECDi d\u1EEF li\u1EC7u \u0111\u1EBFn t\u1EEB server.">
          <div class="html-pair">
            <div class="html-cell">
              <span class="html-cell__label">Chu\u1ED7i g\u1ED1c</span>
              <code>{{ untrusted }}</code>
            </div>
            <div class="html-cell">
              <span class="html-cell__label">K\u1EBFt qu\u1EA3 render</span>
              <div class="html-cell__output" data-safe-html-sanitized [innerHTML]="untrusted | sdSafeHtml"></div>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tin-cay-co-chu-dich') {
        <demo-section
          heading="Tin c\u1EADy c\xF3 ch\u1EE7 \u0111\xEDch"
          [props]="[{ name: 'sdSafeHtml', value: 'trusted' }]"
          note="Tham s\u1ED1 true g\u1ECDi bypassSecurityTrustHtml. Ch\u1EC9 d\xF9ng cho markup do ch\xEDnh app vi\u1EBFt ra, v\xED d\u1EE5 m\u1ED9t sprite SVG n\u1ED9i b\u1ED9 \u2014 kh\xF4ng bao gi\u1EDD cho d\u1EEF li\u1EC7u ng\u01B0\u1EDDi d\xF9ng nh\u1EADp.">
          <div class="html-pair">
            <div class="html-cell">
              <span class="html-cell__label">Chu\u1ED7i g\u1ED1c</span>
              <code>{{ appAuthored }}</code>
            </div>
            <div class="html-cell">
              <span class="html-cell__label">K\u1EBFt qu\u1EA3 render</span>
              <div class="html-cell__output" data-safe-html-trusted [innerHTML]="appAuthored | sdSafeHtml: true"></div>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .html-pair {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      width: 100%;
    }

    .html-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1 1 260px;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .html-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    .html-cell__output {
      min-height: 20px;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SafeHtmlDemoComponent {
  readonly untrusted = '<b>Ghi ch\xFA t\u1EEB kh\xE1ch h\xE0ng</b><img src="x" onerror="alert(1)"><script>alert(2)<\/script>';
  readonly appAuthored = '<span style="color:#1677ff;font-weight:600">Nh\xE3n do app t\u1EF1 d\u1EF1ng</span>';
}
`,scss:`.html-pair {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.html-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 260px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.html-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

.html-cell__output {
  min-height: 20px;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
}`},"pipes-utilities/time-different":{typescript:`import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeDifferentPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-different-demo',
  standalone: true,
  imports: [AsyncPipe, DemoPageComponent, DemoSectionComponent, SdTimeDifferentPipe],
  template: \`
    <demo-page
      #demoPage
      title="Time Different Pipe"
      description="sdTimeDifferent tr\u1EA3 v\u1EC1 m\u1ED9t Observable \u0111\u1EBFm l\u1EA1i m\u1ED7i gi\xE2y khi m\u1ED1c th\u1EDDi gian c\xF2n n\u1EB1m trong ng\u01B0\u1EE1ng t\u01B0\u01A1ng \u0111\u1ED1i, r\u1ED3i t\u1EF1 complete v\xE0 chuy\u1EC3n sang ng\xE0y tuy\u1EC7t \u0111\u1ED1i.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thoi-gian-tuong-doi') {
        <demo-section
          heading="Th\u1EDDi gian t\u01B0\u01A1ng \u0111\u1ED1i"
          [props]="[
            { name: 'sdTimeDifferent', value: 'format' },
            { name: 'different', value: 'second / minute / hour / day / month' },
          ]"
          note="Tham s\u1ED1 th\u1EE9 hai l\xE0 ng\u01B0\u1EE1ng: d\u01B0\u1EDBi ng\u01B0\u1EE1ng th\xEC hi\u1EC7n kho\u1EA3ng c\xE1ch t\u01B0\u01A1ng \u0111\u1ED1i v\xE0 tick m\u1ED7i gi\xE2y, ch\u1EA1m ng\u01B0\u1EE1ng th\xEC r\u01A1i v\u1EC1 format.">
          <div class="value-grid">
            @for (sample of recent; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'day' | async }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-qua-nguong-thi-ve-ngay-tuyet-doi') {
        <demo-section
          heading="Qu\xE1 ng\u01B0\u1EE1ng th\xEC v\u1EC1 ng\xE0y tuy\u1EC7t \u0111\u1ED1i"
          [props]="[{ name: 'sdTimeDifferent', value: 'format' }]"
          note="Gi\xE1 tr\u1ECB \u0111\xE3 c\u0169 h\u01A1n ng\u01B0\u1EE1ng KH\xD4NG t\u1EA1o timer n\xE0o \u2014 pipe tr\u1EA3 v\u1EC1 of(...) ngay, n\xEAn m\u1ED9t danh s\xE1ch d\xE0i kh\xF4ng sinh h\xE0ng lo\u1EA1t interval th\u1EEBa.">
          <div class="value-grid">
            @for (sample of old; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'minute' | async }}</code>
              </div>
            }
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 220px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeDifferentDemoComponent {
  readonly #now = Date.now();

  readonly recent = [
    { label: '30 gi\xE2y tr\u01B0\u1EDBc', value: new Date(this.#now - 30 * 1000) },
    { label: '12 ph\xFAt tr\u01B0\u1EDBc', value: new Date(this.#now - 12 * 60 * 1000) },
    { label: '5 gi\u1EDD tr\u01B0\u1EDBc', value: new Date(this.#now - 5 * 60 * 60 * 1000) },
  ];

  readonly old = [
    { label: '3 gi\u1EDD tr\u01B0\u1EDBc (ng\u01B0\u1EE1ng minute)', value: new Date(this.#now - 3 * 60 * 60 * 1000) },
    { label: '2 n\u0103m tr\u01B0\u1EDBc', value: new Date(this.#now - 730 * 24 * 60 * 60 * 1000) },
  ];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"pipes-utilities/view":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdViewPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-view-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdViewPipe],
  template: \`
    <demo-page
      #demoPage
      title="View Pipe"
      description="sdView l\xE0 b\u1EA3n chu\u1EA9n ho\xE1 hi\u1EC3n th\u1ECB: gi\xE1 tr\u1ECB r\u1ED7ng (k\u1EC3 c\u1EA3 NaN v\xE0 m\u1EA3ng r\u1ED7ng) th\xE0nh d\u1EA5u g\u1EA1ch, m\u1EA3ng c\xF3 ph\u1EA7n t\u1EED th\xE0nh chu\u1ED7i ng\u0103n c\xE1ch b\u1EB1ng d\u1EA5u ph\u1EA9y.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-rong') {
        <demo-section
          heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB r\u1ED7ng"
          [props]="[{ name: 'sdView', value: 'pipe' }]"
          note="So v\u1EDBi sdEmpty, sdView b\u1EAFt th\xEAm NaN v\xE0 m\u1EA3ng r\u1ED7ng \u2014 \u0111\xF3 l\xE0 hai gi\xE1 tr\u1ECB hay l\u1ECDt l\u01B0\u1EDBi nh\u1EA5t khi render d\u1EEF li\u1EC7u API.">
          <div class="value-grid">
            @for (sample of emptySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdView }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gop-mang-thanh-chuoi') {
        <demo-section
          heading="G\u1ED9p m\u1EA3ng th\xE0nh chu\u1ED7i"
          [props]="[{ name: 'sdView', value: 'pipe' }]"
          note="M\u1ED7i ph\u1EA7n t\u1EED \u0111\u01B0\u1EE3c chu\u1EA9n ho\xE1 \u0111\u1EC7 quy tr\u01B0\u1EDBc khi n\u1ED1i, n\xEAn ph\u1EA7n t\u1EED r\u1ED7ng b\xEAn trong m\u1EA3ng c\u0169ng th\xE0nh d\u1EA5u g\u1EA1ch thay v\xEC bi\u1EBFn m\u1EA5t.">
          <div class="value-grid">
            @for (sample of arraySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdView }}</code>
              </div>
            }
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 200px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDemoComponent {
  readonly emptySamples = [
    { label: 'null', value: null },
    { label: "'' (chu\u1ED7i r\u1ED7ng)", value: '' },
    { label: 'Number.NaN', value: Number.NaN },
    { label: '[] (m\u1EA3ng r\u1ED7ng)', value: [] },
  ];

  readonly arraySamples = [
    { label: "['K\u1EBF to\xE1n', 'Nh\xE2n s\u1EF1']", value: ['K\u1EBF to\xE1n', 'Nh\xE2n s\u1EF1'] },
    { label: "['K\u1EBF to\xE1n', null, 'Nh\xE2n s\u1EF1']", value: ['K\u1EBF to\xE1n', null, 'Nh\xE2n s\u1EF1'] },
    { label: '[1, 2, 3]', value: [1, 2, 3] },
  ];
}
`,scss:`.value-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}

.value-cell__label {
  font-size: 12px;
  color: #6b6b6b;
}

code {
  font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
  font-size: 13px;
}`},"services/confirm":{typescript:`import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';

@Component({
  selector: 'app-confirm-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: \`
    <demo-page #demoPage title="Confirm" description="SdConfirmService \u2013 m\u1EDF h\u1ED9p tho\u1EA1i x\xE1c nh\u1EADn tr\u1EA3 v\u1EC1 Promise. H\u1ED7 tr\u1EE3 confirm c\u01A1 b\u1EA3n, nh\u1EADp input, ch\u1ECDn radio/select, ch\u1ECDn ng\xE0y v\xE0 ng\xE0y gi\u1EDD.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xac-nhan-co-ban') {
      <demo-section heading="X\xE1c nh\u1EADn c\u01A1 b\u1EA3n" [props]="[{ name: 'confirm()', value: 'method' }]" note="confirm(message) \u2013 Promise resolve khi b\u1EA5m OK, reject khi H\u1EE7y.">
        <button mat-flat-button color="primary" (click)="onBasic()">X\xE1c nh\u1EADn thao t\xE1c</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xac-nhan-xoa') {
      <demo-section heading="X\xE1c nh\u1EADn x\xF3a" [props]="[{ name: 'confirm()', value: 'method' }]" note="T\xF9y ch\u1EC9nh ti\xEAu \u0111\u1EC1, nh\xE3n n\xFAt v\xE0 m\xE0u n\xFAt.">
        <button mat-flat-button color="warn" (click)="onDelete()">X\xF3a b\u1EA3n ghi</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhap-ly-do') {
      <demo-section heading="Nh\u1EADp l\xFD do" [props]="[{ name: 'withInput()', value: 'method' }]" note="withInput() \u2013 y\xEAu c\u1EA7u nh\u1EADp n\u1ED9i dung tr\u01B0\u1EDBc khi x\xE1c nh\u1EADn.">
        <button mat-stroked-button color="primary" (click)="onInput()">Nh\u1EADp l\xFD do t\u1EEB ch\u1ED1i</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-muc-do') {
      <demo-section heading="Ch\u1ECDn m\u1EE9c \u0111\u1ED9" [props]="[{ name: 'withRadio()', value: 'method' }]" note="withRadio() \u2013 ch\u1ECDn t\u1EEB danh s\xE1ch radio.">
        <button mat-stroked-button color="primary" (click)="onRadio()">Ch\u1ECDn m\u1EE9c \u0111\u1ED9</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-radio-dang-doc') {
      <demo-section heading="Ch\u1ECDn radio d\u1EA1ng d\u1ECDc" [props]="[{ name: 'display', value: 'column' }]" note="withRadio(..., { display: 'column' }) \u2013 hi\u1EC3n th\u1ECB danh s\xE1ch radio theo chi\u1EC1u d\u1ECDc.">
        <button mat-stroked-button color="primary" (click)="onRadioColumn()">Ch\u1ECDn ph\xF2ng ban d\u1EA1ng d\u1ECDc</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-phong-ban') {
      <demo-section heading="Ch\u1ECDn ph\xF2ng ban" [props]="[{ name: 'withSelect()', value: 'method' }]" note="withSelect() \u2013 ch\u1ECDn m\u1ED9t gi\xE1 tr\u1ECB b\u1EB1ng sd-select.">
        <button mat-stroked-button color="primary" (click)="onSelect()">Ch\u1ECDn ph\xF2ng ban</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-ngay') {
      <demo-section heading="Ch\u1ECDn ng\xE0y" [props]="[{ name: 'withDate()', value: 'method' }]" note="withDate() \u2013 ch\u1ECDn ng\xE0y v\u1EDBi min/max n\u1EBFu c\u1EA7n.">
        <button mat-stroked-button color="primary" (click)="onDate()">Ch\u1ECDn ng\xE0y hi\u1EC7u l\u1EF1c</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-ngay-gio') {
      <demo-section heading="Ch\u1ECDn ng\xE0y gi\u1EDD" [props]="[{ name: 'withDatetime()', value: 'method' }]" note="withDatetime() \u2013 ch\u1ECDn ng\xE0y v\xE0 gi\u1EDD.">
        <button mat-stroked-button color="primary" (click)="onDatetime()">Ch\u1ECDn l\u1ECBch x\u1EED l\xFD</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhat-ky-gan-nhat') {
      <demo-section heading="Nh\u1EADt k\xFD g\u1EA7n nh\u1EA5t">
        <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">{{ log() || '(ch\u01B0a c\xF3 thao t\xE1c)' }}</pre>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDemoComponent {
  readonly #confirm = inject(SdConfirmService);
  readonly log = signal('');

  onBasic() {
    this.#confirm.confirm('B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n ti\u1EBFp t\u1EE5c thao t\xE1c n\xE0y?').then(
      () => this.log.set('C\u01A1 b\u1EA3n: \u0110\u1ED2NG \xDD'),
      () => this.log.set('C\u01A1 b\u1EA3n: H\u1EE6Y'),
    );
  }

  onDelete() {
    this.#confirm
      .confirm('B\u1EA3n ghi s\u1EBD b\u1ECB x\xF3a v\u0129nh vi\u1EC5n. Ti\u1EBFp t\u1EE5c?', {
        title: 'X\xE1c nh\u1EADn x\xF3a',
        yesTitle: 'X\xF3a',
        noTitle: 'H\u1EE7y',
        yesButtonColor: 'error',
      })
      .then(
        () => this.log.set('X\xF3a: \u0110\xC3 X\xD3A'),
        () => this.log.set('X\xF3a: H\u1EE6Y'),
      );
  }

  onInput() {
    this.#confirm
      .withInput('Vui l\xF2ng nh\u1EADp l\xFD do:', { title: 'Nh\u1EADp l\xFD do', required: true, maxlength: 200 })
      .then(
        (v) => this.log.set('Input: ' + v),
        () => this.log.set('Input: H\u1EE6Y'),
      );
  }

  onRadio() {
    this.#confirm
      .withRadio('Ch\u1ECDn m\u1EE9c \u0111\u1ED9 \u01B0u ti\xEAn:', {
        title: 'M\u1EE9c \u0111\u1ED9 \u01B0u ti\xEAn',
        items: [
          { value: 'low', label: 'Th\u1EA5p' },
          { value: 'medium', label: 'Trung b\xECnh' },
          { value: 'high', label: 'Cao' },
        ],
        valueField: 'value',
        displayField: 'label',
        display: 'row',
        defaultValue: 'medium',
        required: true,
      })
      .then(
        (v) => this.log.set('Radio: ' + v),
        () => this.log.set('Radio: H\u1EE6Y'),
      );
  }

  onRadioColumn() {
    this.#confirm
      .withRadio('Ch\u1ECDn ph\xF2ng ban x\u1EED l\xFD:', {
        title: 'Ph\xF2ng ban x\u1EED l\xFD',
        items: [
          { value: 'sales', label: 'Kinh doanh' },
          { value: 'operation', label: 'V\u1EADn h\xE0nh' },
          { value: 'finance', label: 'T\xE0i ch\xEDnh' },
        ],
        valueField: 'value',
        displayField: 'label',
        display: 'column',
        defaultValue: 'operation',
        required: true,
      })
      .then(
        (v) => this.log.set('Radio d\u1ECDc: ' + v),
        () => this.log.set('Radio d\u1ECDc: H\u1EE6Y'),
      );
  }

  onSelect() {
    this.#confirm
      .withSelect('Ch\u1ECDn ph\xF2ng ban x\u1EED l\xFD:', {
        title: 'Ph\xF2ng ban x\u1EED l\xFD',
        items: [
          { value: 'sales', label: 'Kinh doanh' },
          { value: 'operation', label: 'V\u1EADn h\xE0nh' },
          { value: 'finance', label: 'T\xE0i ch\xEDnh' },
        ],
        valueField: 'value',
        displayField: 'label',
        defaultValue: 'operation',
        required: true,
        placeholder: 'Ph\xF2ng ban',
      })
      .then(
        (v) => this.log.set('Select: ' + v),
        () => this.log.set('Select: H\u1EE6Y'),
      );
  }

  onDate() {
    this.#confirm
      .withDate('Ch\u1ECDn ng\xE0y hi\u1EC7u l\u1EF1c:', {
        title: 'Ng\xE0y hi\u1EC7u l\u1EF1c',
        required: true,
        placeholder: 'dd/MM/yyyy',
        min: new Date('2026-01-01'),
        max: new Date('2026-12-31'),
      })
      .then(
        (v) => this.log.set('Date: ' + v),
        () => this.log.set('Date: H\u1EE6Y'),
      );
  }

  onDatetime() {
    this.#confirm
      .withDatetime('Ch\u1ECDn th\u1EDDi \u0111i\u1EC3m x\u1EED l\xFD:', {
        title: 'L\u1ECBch x\u1EED l\xFD',
        required: true,
        placeholder: 'dd/MM/yyyy HH:mm',
        min: new Date('2026-01-01T00:00:00'),
        max: new Date('2026-12-31T23:59:59'),
      })
      .then(
        (v) => this.log.set('Datetime: ' + v),
        () => this.log.set('Datetime: H\u1EE6Y'),
      );
  }
}
`},"services/excel":{typescript:`import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdExcelService } from '@sdcorejs/angular/services/excel';

interface Employee {
  code: string;
  name: string;
  department: string;
  salary: number;
}

@Component({
  selector: 'app-excel-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: \`
    <demo-page #demoPage title="Excel" description="SdExcelService \u2013 export() / exportCSV() / generateTemplate() / upload() / parse(). S\u1EED d\u1EE5ng exceljs n\u1ED9i b\u1ED9, t\u1EF1 k\xE8m header c\xF3 style.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xuat-file-xlsx') {
      <demo-section heading="Xu\u1EA5t file .xlsx" [props]="[{ name: 'export()', value: 'method' }]" note="export({ columns, items, fileName }) \u2013 sheet 'data' c\xF3 header + d\u1EEF li\u1EC7u.">
        <button mat-flat-button color="primary" (click)="onExport()">T\u1EA3i nhanvien.xlsx</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xuat-file-csv') {
      <demo-section heading="Xu\u1EA5t file .csv" [props]="[{ name: 'exportCSV()', value: 'method' }]" note="exportCSV() \u2013 k\xE8m BOM UTF-8 \u0111\u1EC3 Excel m\u1EDF \u0111\xFAng d\u1EA5u ti\u1EBFng Vi\u1EC7t.">
        <button mat-flat-button color="primary" (click)="onExportCsv()">T\u1EA3i nhanvien.csv</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-template-trong') {
      <demo-section heading="T\u1EA3i template tr\u1ED1ng" [props]="[{ name: 'generateTemplate()', value: 'method' }]" note="generateTemplate() \u2013 t\u1EA1o file m\u1EABu \u0111\u1EC3 ng\u01B0\u1EDDi d\xF9ng nh\u1EADp li\u1EC7u (c\u1ED9t c\xF3 required, m\xF4 t\u1EA3).">
        <button mat-stroked-button (click)="onTemplate()">T\u1EA3i template-nhanvien.xlsx</button>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelDemoComponent {
  readonly #excel = inject(SdExcelService);

  readonly #items: Employee[] = [
    { code: 'NV001', name: 'Nguy\u1EC5n V\u0103n An',  department: 'K\u1EF9 thu\u1EADt',  salary: 18500000 },
    { code: 'NV002', name: 'Tr\u1EA7n Th\u1ECB B\xEDch',  department: 'Nh\xE2n s\u1EF1',   salary: 14200000 },
    { code: 'NV003', name: 'L\xEA Minh C\u01B0\u1EDDng',  department: 'Kinh doanh', salary: 22000000 },
    { code: 'NV004', name: 'Ph\u1EA1m Thu H\xE0',    department: 'Marketing', salary: 16800000 },
    { code: 'NV005', name: 'Ho\xE0ng V\u0103n \u0110\u1EE9c',  department: 'K\u1EF9 thu\u1EADt',  salary: 19500000 },
  ];

  readonly #columns = [
    { field: 'code',       title: 'M\xE3 NV',     width: '120px' },
    { field: 'name',       title: 'H\u1ECD v\xE0 t\xEAn', width: '220px' },
    { field: 'department', title: 'Ph\xF2ng ban', width: '180px' },
    { field: 'salary',     title: 'L\u01B0\u01A1ng (VND)', width: '160px' },
  ];

  async onExport() {
    await this.#excel.export({ columns: this.#columns, items: this.#items, fileName: 'nhanvien.xlsx' });
  }

  async onExportCsv() {
    await this.#excel.exportCSV({ columns: this.#columns, items: this.#items, fileName: 'nhanvien' });
  }

  async onTemplate() {
    await this.#excel.generateTemplate({
      fileName: 'template-nhanvien.xlsx',
      columns: [
        { field: 'code',       title: 'M\xE3 NV',       required: true,  description: 'B\u1EAFt bu\u1ED9c, duy nh\u1EA5t' },
        { field: 'name',       title: 'H\u1ECD v\xE0 t\xEAn',   required: true,  description: 'B\u1EAFt bu\u1ED9c' },
        { field: 'department', title: 'Ph\xF2ng ban',   description: 'C\xF3 th\u1EC3 b\u1ECF tr\u1ED1ng' },
        { field: 'salary',     title: 'L\u01B0\u01A1ng (VND)', description: 'S\u1ED1 nguy\xEAn d\u01B0\u01A1ng' },
      ],
    });
  }
}
`},"services/loading":{typescript:`import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdLoadingRef, SdLoadingService } from '@sdcorejs/angular/services/loading';

@Component({
  selector: 'app-loading-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: \`
    <demo-page
      #demoPage
      title="Loading"
      description="SdLoadingService \u2013 handle/ref-counted overlay cho m\u1ECDi ph\u1EA7n t\u1EED kh\u1EDBp selector, c\xF3 run() scope, ARIA busy, SSR no-op v\xE0 teardown x\xE1c \u0111\u1ECBnh.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-toan-trang') {
        <demo-section
          heading="Loading to\xE0n trang"
          [props]="[{ name: 'start()', value: 'body' }]"
          note="run() lu\xF4n \u0111\xF3ng loading ref trong finally v\xE0 gi\u1EEF nguy\xEAn result/error c\u1EE7a task.">
          <button mat-flat-button color="primary" [disabled]="busy()" (click)="onFullPage()">Hi\u1EC3n th\u1ECB loading to\xE0n trang</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-o-dich') {
        <demo-section
          heading="Loading \xF4 \u0111\xEDch"
          [props]="[{ name: 'start()', value: '#demo-target' }]"
          note="start('#demo-target') tr\u1EA3 v\u1EC1 handle idempotent s\u1EDF h\u1EEFu \u0111\xFAng host \u0111\xE3 match.">
          <button mat-flat-button color="primary" (click)="onTarget()">Loading v\xF9ng b\xEAn d\u01B0\u1EDBi</button>
          <div id="demo-target" class="demo-host">N\u1ED9i dung m\u1EABu \u2014 loading s\u1EBD ph\u1EE7 ch\xEDnh khung n\xE0y.</div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhieu-host-cung-selector-multi-tab') {
        <demo-section
          heading="Nhi\u1EC1u host c\xF9ng selector (multi-tab)"
          [props]="[
            { name: 'start()', value: '.demo-tab-panel' },
            { name: 'querySelectorAll', value: 'all matches' },
          ]"
          note="Hai owner overlap tr\xEAn c\xF9ng hai host; \u0111\xF3ng owner \u0111\u1EA7u kh\xF4ng g\u1EE1 overlay c\u1EE7a owner th\u1EE9 hai.">
          <button mat-flat-button color="primary" (click)="onMultiHost()">Ch\u1EA1y hai owner overlap</button>
          <div class="demo-tabs">
            <div class="demo-tab-panel demo-host">
              <strong>Tab 1</strong>
              <p>Panel \u0111\u1EA7u ti\xEAn trong DOM.</p>
            </div>
            <div class="demo-tab-panel demo-host">
              <strong>Tab 2</strong>
              <p>Panel th\u1EE9 hai \u2014 tr\u01B0\u1EDBc \u0111\xE2y kh\xF4ng hi\u1EC7n loading v\xEC querySelector ch\u1EC9 l\u1EA5y ph\u1EA7n t\u1EED \u0111\u1EA7u.</p>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-tat-thu-cong') {
        <demo-section
          heading="B\u1EADt / t\u1EAFt th\u1EE7 c\xF4ng"
          [props]="[
            { name: 'start()', value: 'SdLoadingRef' },
            { name: 'close()', value: 'idempotent' },
            { name: 'stop()', value: 'compatibility FIFO' },
            { name: 'isLoading()', value: 'method' },
          ]"
          note="Code m\u1EDBi gi\u1EEF ref; stop(selector) v\u1EABn ho\u1EA1t \u0111\u1ED9ng cho call site c\u0169 theo th\u1EE9 t\u1EF1 start c\u0169 nh\u1EA5t.">
          <button mat-stroked-button (click)="onStart()">B\u1EADt loading</button>
          <button mat-stroked-button color="warn" (click)="onStop()">T\u1EAFt loading</button>
          <button mat-stroked-button (click)="onCheck()">Ki\u1EC3m tra tr\u1EA1ng th\xE1i</button>
          <span class="demo-status">Tr\u1EA1ng th\xE1i: {{ status() }}</span>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .demo-host {
      position: relative;
      width: 100%;
      min-height: 120px;
      background: #fafafa;
      border: 1px dashed #bdbdbd;
      border-radius: 6px;
      padding: 16px;
      margin-top: 8px;
    }
    .demo-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .demo-tabs .demo-host {
      margin-top: 0;
    }
    .demo-status {
      font-size: 12px;
      color: #666;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDemoComponent {
  readonly #loading = inject(SdLoadingService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  readonly #refs = new Set<SdLoadingRef>();
  readonly busy = signal(false);
  readonly status = signal('ch\u01B0a ki\u1EC3m tra');
  #manualRef: SdLoadingRef | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      for (const timer of this.#timers) clearTimeout(timer);
      for (const ref of this.#refs) ref.close();
      this.#timers.clear();
      this.#refs.clear();
    });
  }

  async onFullPage(): Promise<void> {
    this.busy.set(true);
    try {
      await this.#loading.run(this.#delay(1200));
    } finally {
      this.busy.set(false);
    }
  }

  onTarget(): void {
    const ref = this.#trackRef(this.#loading.start('#demo-target'));
    this.#schedule(() => this.#closeRef(ref), 1200);
  }

  onMultiHost(): void {
    const first = this.#trackRef(this.#loading.start('.demo-tab-panel'));
    const second = this.#trackRef(this.#loading.start('.demo-tab-panel'));
    this.status.set('2 owner \u0111ang gi\u1EEF overlay');
    this.#schedule(() => {
      this.#closeRef(first);
      this.status.set('owner 1 \u0111\xE3 \u0111\xF3ng, owner 2 v\u1EABn gi\u1EEF overlay');
    }, 800);
    this.#schedule(() => {
      this.#closeRef(second);
      this.status.set('c\u1EA3 2 owner \u0111\xE3 \u0111\xF3ng');
    }, 1600);
  }

  onStart(): void {
    if (this.#manualRef && !this.#manualRef.closed) return;
    this.#manualRef = this.#trackRef(this.#loading.start());
    this.status.set('manual ref \u0111ang m\u1EDF');
  }

  onStop(): void {
    if (this.#manualRef) this.#closeRef(this.#manualRef);
    else this.#loading.stop();
    this.#manualRef = undefined;
    this.status.set('manual ref \u0111\xE3 \u0111\xF3ng');
  }

  onCheck(): void {
    this.status.set(this.#loading.isLoading() ? '\u0111ang loading' : 'kh\xF4ng loading');
  }

  #delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => this.#schedule(resolve, milliseconds));
  }

  #schedule(callback: () => void, milliseconds: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, milliseconds);
    this.#timers.add(timer);
  }

  #trackRef(ref: SdLoadingRef): SdLoadingRef {
    if (!ref.closed) this.#refs.add(ref);
    return ref;
  }

  #closeRef(ref: SdLoadingRef): void {
    ref.close();
    this.#refs.delete(ref);
  }
}
`,scss:`.demo-host {
  position: relative;
  width: 100%;
  min-height: 120px;
  background: #fafafa;
  border: 1px dashed #bdbdbd;
  border-radius: 6px;
  padding: 16px;
  margin-top: 8px;
}
.demo-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}
.demo-tabs .demo-host {
  margin-top: 0;
}
.demo-status {
  font-size: 12px;
  color: #666;
}`},"services/notify":{typescript:`import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

@Component({
  selector: 'app-notify-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: \`
    <demo-page #demoPage title="Notify" description="SdNotifyService \u2013 toast container \u0111\u01B0\u1EE3c mount m\u1ED9t l\u1EA7n \u1EDF &lt;body&gt;. Th\xF4ng b\xE1o success/info hi\u1EC3n th\u1ECB ngay, warning/error gom nh\xF3m 500ms (debounce) \u0111\u1EC3 tr\xE1nh spam.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-4-loai-toast') {
      <demo-section heading="4 lo\u1EA1i toast" [props]="[{ name: 'type', value: 'success / error / info / warning' }]" note="success / info / warning / error v\u1EDBi th\xF4ng \u0111i\u1EC7p ng\u1EAFn.">
        <button mat-flat-button color="primary" (click)="onInfo()">info</button>
        <button mat-flat-button style="background:#2e7d32;color:#fff" (click)="onSuccess()">success</button>
        <button mat-flat-button style="background:#ed6c02;color:#fff" (click)="onWarning()">warning</button>
        <button mat-flat-button color="warn" (click)="onError()">error</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thoi-luong-tuy-chinh') {
      <demo-section heading="Th\u1EDDi l\u01B0\u1EE3ng t\xF9y ch\u1EC9nh" [props]="[{ name: 'duration', value: 'ms' }]" note="duration t\xEDnh b\u1EB1ng ms. M\u1EB7c \u0111\u1ECBnh 3000ms cho success/info, 5000ms cho warning/error.">
        <button mat-stroked-button (click)="onShort()">Toast 1.5 gi\xE2y</button>
        <button mat-stroked-button (click)="onLong()">Toast 8 gi\xE2y</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toast-co-action') {
      <demo-section heading="Toast c\xF3 action" [props]="[{ name: 'actionLabel', value: 'text' }]" note="actionLabel + onAction \u0111\u1EC3 g\u1EAFn n\xFAt b\u1EA5m v\xE0o toast.">
        <button mat-stroked-button color="primary" (click)="onAction()">Toast c\xF3 n\xFAt "Ho\xE0n t\xE1c"</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-don-dep') {
      <demo-section heading="D\u1ECDn d\u1EB9p" [props]="[{ name: 'clearAll()', value: 'method' }]" note="clearAll() x\xF3a to\xE0n b\u1ED9; clearByType('error') x\xF3a theo lo\u1EA1i.">
        <button mat-stroked-button (click)="onSpam()">T\u1EA1o 3 toast c\xF9ng l\xFAc</button>
        <button mat-stroked-button color="warn" (click)="onClear()">X\xF3a t\u1EA5t c\u1EA3</button>
      </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyDemoComponent {
  readonly #notify = inject(SdNotifyService);

  onInfo() { this.#notify.info('\u0110\xE3 t\u1EA3i d\u1EEF li\u1EC7u xong.'); }
  onSuccess() { this.#notify.success('L\u01B0u b\u1EA3n ghi th\xE0nh c\xF4ng.'); }
  onWarning() { this.#notify.warning('Dung l\u01B0\u1EE3ng t\u1EC7p g\u1EA7n \u0111\u1EA1t gi\u1EDBi h\u1EA1n.'); }
  onError() { this.#notify.error('Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi m\xE1y ch\u1EE7.'); }

  onShort() { this.#notify.info('Toast bi\u1EBFn m\u1EA5t sau 1.5 gi\xE2y.', { duration: 1500 }); }
  onLong() { this.#notify.success('Toast \u1EDF l\u1EA1i 8 gi\xE2y.', { duration: 8000 }); }

  onAction() {
    this.#notify.success('\u0110\xE3 x\xF3a 1 b\u1EA3n ghi.', {
      actionLabel: 'Ho\xE0n t\xE1c',
      onAction: () => this.#notify.info('\u0110\xE3 kh\xF4i ph\u1EE5c b\u1EA3n ghi.'),
    });
  }

  onSpam() {
    this.#notify.info('Th\xF4ng b\xE1o 1');
    this.#notify.success('Th\xF4ng b\xE1o 2');
    this.#notify.warning('Th\xF4ng b\xE1o 3');
  }

  onClear() { this.#notify.clearAll(); }
}
`},"services/persistence":{typescript:`import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SdGraphIdentityCanonicalizer,
  SdGraphSerializer,
  parseSdPersistenceEnvelope,
  stringifySdPersistenceValueEnvelope,
} from '@sdcorejs/angular/services/persistence';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface DemoSharedValue {
  readonly label: string;
}

interface DemoGraph {
  readonly createdAt: Date;
  readonly labels: Map<string, string>;
  readonly permissions: Set<string>;
  readonly primary: DemoSharedValue;
  readonly secondary: DemoSharedValue;
  self?: DemoGraph;
}

@Component({
  selector: 'app-persistence-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent],
  template: \`
    <demo-page
      #demoPage
      title="Persistence"
      description="Versioned graph serialization, deterministic identity and bounded envelopes used by SdCacheService and SdStorageService.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-graph-round-trip') {
        <demo-section
          heading="Graph round-trip"
          [props]="[
            { name: 'serializer', value: 'SdGraphSerializer' },
            { name: 'references', value: 'shared + circular' },
          ]">
          <pre>{{ graphSummary }}</pre>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-deterministic-identity') {
        <demo-section
          heading="Deterministic identity"
          [props]="[{ name: 'canonicalizer', value: 'SdGraphIdentityCanonicalizer' }]"
          note="Property insertion order does not change the canonical persistence identity.">
          <p>Stable identity: {{ stableIdentity }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-versioned-envelope') {
        <demo-section
          heading="Versioned envelope"
          [props]="[
            { name: 'identity', value: 'tenant:42' },
            { name: 'serializer', value: serializer.format },
          ]">
          <p>Envelope payload: {{ envelopeTeam }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-invalid-input-containment') {
        <demo-section
          heading="Invalid input containment"
          [props]="[{ name: 'error', value: 'SdPersistenceError' }]"
          note="Consumers can reject malformed documents without mutating the previous cache/storage value.">
          <p>Invalid document rejected: {{ invalidDocumentRejected }}</p>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    pre {
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      background: var(--docs-code-bg, #f4f6f8);
      white-space: pre-wrap;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersistenceDemoComponent {
  protected readonly serializer = new SdGraphSerializer();
  readonly graphSummary: string;
  readonly stableIdentity: boolean;
  readonly envelopeTeam: string;
  readonly invalidDocumentRejected: boolean;

  constructor() {
    const shared: DemoSharedValue = { label: 'shared' };
    const source: DemoGraph = {
      createdAt: new Date('2026-07-23T00:00:00.000Z'),
      labels: new Map([['vi', 'Xin ch\xE0o']]),
      permissions: new Set(['read', 'write']),
      primary: shared,
      secondary: shared,
    };
    source.self = source;
    const restored = this.serializer.parse<DemoGraph>(this.serializer.stringify(source));
    this.graphSummary = [
      \`Date: \${restored.createdAt instanceof Date}\`,
      \`Map: \${restored.labels instanceof Map}\`,
      \`Set: \${restored.permissions instanceof Set}\`,
      \`Shared reference: \${restored.primary === restored.secondary}\`,
      \`Circular reference: \${restored.self === restored}\`,
    ].join('\\n');

    const canonicalizer = new SdGraphIdentityCanonicalizer();
    this.stableIdentity =
      canonicalizer.canonicalize({ tenant: 42, filters: { status: 'active', page: 1 } }) ===
      canonicalizer.canonicalize({ filters: { page: 1, status: 'active' }, tenant: 42 });

    const identity = 'tenant:42';
    const payload = this.serializer.stringify({ team: 'Finance' });
    const serializedEnvelope = stringifySdPersistenceValueEnvelope(identity, this.serializer.format, payload);
    const envelope = parseSdPersistenceEnvelope(serializedEnvelope, identity, this.serializer.format);
    const envelopeValue = envelope?.kind === 'value' ? this.serializer.parse<{ team: string }>(envelope.payload) : undefined;
    this.envelopeTeam = envelopeValue?.team ?? 'unavailable';

    this.invalidDocumentRejected = rejectsInvalidDocument(this.serializer);
  }
}

function rejectsInvalidDocument(serializer: SdGraphSerializer): boolean {
  try {
    serializer.parse('{"format":"unknown","version":1}');
    return false;
  } catch {
    return true;
  }
}
`,scss:`pre {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--docs-code-bg, #f4f6f8);
  white-space: pre-wrap;
}`},"services/storage":{typescript:`import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services/storage';

@Component({
  selector: 'app-storage-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: \`
    <demo-page
      #demoPage
      title="Storage"
      description="SdStorageService.create(key) tr\u1EA3 v\u1EC1 typed handle reactive. D\u1EEF li\u1EC7u d\xF9ng versioned graph serializer, legacy migration v\xE0 local/session adapter SSR-safe.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-localstorage') {
        <demo-section
          heading="localStorage"
          [props]="[{ name: 'type', value: 'local' }]"
          note="Key 'demo:user-name'. \u0110\xF3ng tr\xECnh duy\u1EC7t r\u1ED3i m\u1EDF l\u1EA1i v\u1EABn c\xF2n.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>T\xEAn ng\u01B0\u1EDDi d\xF9ng</mat-label>
            <input matInput [(ngModel)]="draftLocal" placeholder="Nh\u1EADp t\xEAn..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveLocal()">L\u01B0u</button>
          <button mat-stroked-button (click)="readLocal()">\u0110\u1ECDc l\u1EA1i</button>
          <button mat-stroked-button color="warn" (click)="removeLocal()">X\xF3a</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sessionstorage') {
        <demo-section
          heading="sessionStorage"
          [props]="[{ name: 'type', value: 'session' }]"
          note="Key 'demo:session-note'. M\u1EA5t khi \u0111\xF3ng tab.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>Ghi ch\xFA phi\xEAn</mat-label>
            <input matInput [(ngModel)]="draftSession" placeholder="Nh\u1EADp ghi ch\xFA..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveSession()">L\u01B0u (session)</button>
          <button mat-stroked-button color="warn" (click)="removeSession()">X\xF3a</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-dang-luu-cap-nhat-truc-tiep-qua-subject') {
        <demo-section heading="Gi\xE1 tr\u1ECB \u0111ang l\u01B0u (c\u1EADp nh\u1EADt tr\u1EF1c ti\u1EBFp qua subject)">
          <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">
demo:user-name    = {{ liveLocal() ?? '(tr\u1ED1ng)' }}
demo:session-note = {{ liveSession() ?? '(tr\u1ED1ng)' }}</pre
          >
        </demo-section>
      }
    </demo-page>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageDemoComponent implements OnDestroy {
  readonly #storage = inject(SdStorageService);
  readonly #local: SdStorage<string> = this.#storage.create<string>('demo:user-name');
  readonly #session: SdStorage<string> = this.#storage.create<string>('demo:session-note', { type: 'session' });

  draftLocal = '';
  draftSession = '';
  readonly liveLocal = signal<string | undefined>(this.#local.get());
  readonly liveSession = signal<string | undefined>(this.#session.get());

  readonly #subLocal = this.#local.observer.subscribe(v => this.liveLocal.set(v));
  readonly #subSession = this.#session.observer.subscribe(v => this.liveSession.set(v));

  saveLocal() {
    this.#local.set(this.draftLocal);
  }
  readLocal() {
    this.draftLocal = this.#local.get() ?? '';
  }
  removeLocal() {
    this.#local.remove();
    this.draftLocal = '';
  }

  saveSession() {
    this.#session.set(this.draftSession);
  }
  removeSession() {
    this.#session.remove();
    this.draftSession = '';
  }

  ngOnDestroy() {
    this.#subLocal.unsubscribe();
    this.#subSession.unsubscribe();
  }
}
`},"services/task":{typescript:`import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { SdJobProgress } from '@sdcorejs/angular/components/job-progress';
import { SdTaskService, SdTaskSubscription } from '@sdcorejs/angular/services/task';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-task-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdJobProgress],
  template: \`
    <demo-page
      #demoPage
      title="Task Service"
      description="SdTaskService \u2013 registry theo stable ID, d\xF9ng chung polling/SSE connection, retry c\xF3 gi\u1EDBi h\u1EA1n v\xE0 cleanup x\xE1c \u0111\u1ECBnh.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-manual-lifecycle') {
        <demo-section
          heading="Manual lifecycle"
          [props]="[
            { name: 'status', value: manualTask.state().status },
            { name: 'progress', value: manualTask.state().progress ?? 'indeterminate' },
          ]">
          <sd-job-progress taskId="showcase-manual-task" mode="details"></sd-job-progress>
          <div class="task-actions">
            <button type="button" (click)="advanceManualTask()">Ti\u1EBFn th\xEAm 25%</button>
            <button type="button" (click)="completeManualTask()">Ho\xE0n t\u1EA5t</button>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-shared-stable-id') {
        <demo-section
          heading="Shared stable ID"
          [props]="[
            { name: 'subscriberCount', value: sharedTask.subscriberCount() },
            { name: 'same state signal', value: sharedTask.state === sharedTaskDuplicate.state },
          ]"
          note="Hai watcher tr\xF9ng ID d\xF9ng chung state/transport; entry ch\u1EC9 b\u1ECB x\xF3a sau lease cu\u1ED1i.">
          <p data-shared-task-count>Active leases: {{ sharedTask.subscriberCount() }}</p>
          <button type="button" [disabled]="sharedDuplicateDestroyed" (click)="releaseDuplicateLease()">H\u1EE7y lease th\u1EE9 hai</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-polling-va-terminal-teardown') {
        <demo-section
          heading="Polling v\xE0 terminal teardown"
          [props]="[
            { name: 'load calls', value: pollLoadCount },
            { name: 'connection', value: pollingTask.connection() },
          ]"
          note="Demo tr\u1EA3 terminal state ngay l\u01B0\u1EE3t \u0111\u1EA7u; service kh\xF4ng schedule th\xEAm poll sau succeeded.">
          <sd-job-progress taskId="showcase-poll-task"></sd-job-progress>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cancel-va-retry') {
        <demo-section
          heading="Cancel v\xE0 retry"
          [props]="[
            { name: 'cancel coalescing', value: 'Promise<boolean>' },
            { name: 'retry guard', value: 'failed/cancelled/transport error' },
          ]"
          note="Cancel l\u1ED7i gi\u1EEF nguy\xEAn business state; retry kh\xF4ng restart m\u1ED9t connection \u0111ang kh\u1ECFe.">
          <sd-job-progress taskId="showcase-action-task" mode="details"></sd-job-progress>
          <button type="button" (click)="failActionTask()">Gi\u1EA3 l\u1EADp task th\u1EA5t b\u1EA1i</button>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .task-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    button {
      margin-top: 8px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDemoComponent {
  readonly #tasks = inject(SdTaskService);
  pollLoadCount = 0;
  sharedDuplicateDestroyed = false;

  readonly manualTask = this.#tasks.watch({
    id: 'showcase-manual-task',
    initialState: {
      id: 'showcase-manual-task',
      status: 'running',
      progress: 25,
      title: 'Import danh m\u1EE5c',
      message: '\u0110ang x\u1EED l\xFD d\u1EEF li\u1EC7u c\u1EE5c b\u1ED9',
    },
    source: { mode: 'manual' },
  });
  readonly sharedTask = this.#tasks.watch({
    id: 'showcase-shared-task',
    initialState: { id: 'showcase-shared-task', status: 'running', progress: 10 },
    source: { mode: 'manual' },
  });
  readonly sharedTaskDuplicate = this.#tasks.watch({
    id: 'showcase-shared-task',
    source: { mode: 'manual' },
  });
  readonly pollingTask = this.#tasks.watch({
    id: 'showcase-poll-task',
    source: {
      mode: 'poll',
      intervalMs: 5_000,
      load: () => {
        this.pollLoadCount += 1;
        return {
          id: 'showcase-poll-task',
          status: 'succeeded' as const,
          progress: 100,
          title: '\u0110\u1ED1i so\xE1t ho\xE0n t\u1EA5t',
        };
      },
    },
  });
  readonly actionTask = this.#tasks.watch({
    id: 'showcase-action-task',
    initialState: {
      id: 'showcase-action-task',
      status: 'running',
      progress: 60,
      title: 'Xu\u1EA5t b\xE1o c\xE1o',
      message: 'C\xF3 th\u1EC3 h\u1EE7y khi t\xE1c v\u1EE5 \u0111ang ch\u1EA1y',
    },
    source: { mode: 'manual', cancel: () => undefined },
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const leases: SdTaskSubscription[] = [this.manualTask, this.sharedTask, this.sharedTaskDuplicate, this.pollingTask, this.actionTask];
    destroyRef.onDestroy(() => leases.forEach(lease => lease.destroy()));
  }

  advanceManualTask(): void {
    const progress = Math.min(100, (this.manualTask.state().progress ?? 0) + 25);
    this.#tasks.update('showcase-manual-task', { status: progress === 100 ? 'succeeded' : 'running', progress });
  }

  completeManualTask(): void {
    this.#tasks.update('showcase-manual-task', { status: 'succeeded', progress: 100, message: '\u0110\xE3 nh\u1EADp xong d\u1EEF li\u1EC7u' });
  }

  releaseDuplicateLease(): void {
    this.sharedTaskDuplicate.destroy();
    this.sharedDuplicateDestroyed = true;
  }

  failActionTask(): void {
    this.#tasks.update('showcase-action-task', {
      status: 'failed',
      error: new Error('Kh\xF4ng th\u1EC3 t\u1EA1o t\u1EC7p b\xE1o c\xE1o'),
    });
  }
}
`,scss:`.task-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

button {
  margin-top: 8px;
}`},"services/unsaved-changes":{typescript:`import { ChangeDetectionStrategy, Component, DestroyRef, Injectable, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import {
  SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
  SD_UNSAVED_CHANGES_WINDOW,
  SdUnsavedChangesConfirmationAdapter,
  SdUnsavedChangesDecision,
  SdUnsavedChangesPromptContext,
  SdUnsavedChangesRegistration,
  SdUnsavedChangesService,
  createSdUnsavedChangesCloseGuard,
  registerSdUnsavedChangesForm,
} from '@sdcorejs/angular/services/unsaved-changes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Injectable()
class ShowcaseUnsavedChangesAdapter implements SdUnsavedChangesConfirmationAdapter {
  readonly decision = signal<SdUnsavedChangesDecision>('cancel');
  readonly confirmCount = signal(0);

  async confirm(_context: SdUnsavedChangesPromptContext): Promise<SdUnsavedChangesDecision> {
    this.confirmCount.update(value => value + 1);
    await Promise.resolve();
    return this.decision();
  }
}

@Component({
  selector: 'app-unsaved-changes-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, ReactiveFormsModule, SdSideDrawer],
  providers: [
    SdUnsavedChangesService,
    ShowcaseUnsavedChangesAdapter,
    { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useExisting: ShowcaseUnsavedChangesAdapter },
    { provide: SD_UNSAVED_CHANGES_WINDOW, useValue: null },
  ],
  template: \`
    <demo-page
      #demoPage
      title="Unsaved Changes"
      description="Registry SSR-safe cho nhi\u1EC1u ngu\u1ED3n dirty, FormGroup, route guard v\xE0 hook \u0111\xF3ng modal/drawer/tab v\u1EDBi x\xE1c nh\u1EADn async fail-closed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-scoped-watchers') {
        <demo-section
          heading="Multiple scoped watchers"
          [props]="[
            { name: 'registrations', value: unsaved.registrations().length },
            { name: 'dirty', value: unsaved.dirty() },
          ]"
          note="C\xF9ng id c\xF3 th\u1EC3 t\u1ED3n t\u1EA1i \u1EDF scope kh\xE1c nhau; register l\u1EB7p trong c\xF9ng scope tr\u1EA3 l\u1EA1i \u0111\xFAng registration ref.">
          <div class="demo-actions">
            <button type="button" (click)="profileRef.markDirty()">S\u1EEDa h\u1ED3 s\u01A1</button>
            <button type="button" (click)="filterRef.markDirty()">S\u1EEDa b\u1ED9 l\u1ECDc</button>
            <button type="button" (click)="profileRef.markPristine(); filterRef.markPristine()">\u0110\xE1nh d\u1EA5u \u0111\xE3 l\u01B0u</button>
          </div>
          <output data-registry-state>
            profile={{ profileRef.dirty() }} \xB7 filters={{ filterRef.dirty() }} \xB7 any={{ unsaved.dirty() }}
          </output>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-formgroup-adapter') {
        <demo-section
          heading="FormGroup adapter"
          [props]="[{ name: 'form.dirty', value: profileForm.dirty }]"
          note="Adapter gi\u1EEF snapshot, c\u1EADp nh\u1EADt baseline sau save th\xE0nh c\xF4ng v\xE0 t\u1EF1 unsubscribe khi registration b\u1ECB destroy.">
          <label class="demo-field">
            T\xEAn hi\u1EC3n th\u1ECB
            <input [formControl]="profileForm.controls.name" />
          </label>
          <div class="demo-actions">
            <button type="button" (click)="saveForm()">Save</button>
            <button type="button" (click)="formRef.discard()">Discard v\u1EC1 snapshot</button>
          </div>
          <output data-form-state>{{ profileForm.controls.name.value }} \xB7 dirty={{ formRef.dirty() }}</output>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-async-confirmation-decisions') {
        <demo-section
          heading="Async confirmation decisions"
          [props]="[
            { name: 'decision', value: confirmation.decision() },
            { name: 'confirmCount', value: confirmation.confirmCount() },
          ]"
          note="Adapter t\xF9y bi\u1EBFn tr\u1EA3 save/discard/cancel ho\u1EB7c boolean. Exception/rejection lu\xF4n gi\u1EEF ng\u01B0\u1EDDi d\xF9ng \u1EDF m\xE0n h\xECnh hi\u1EC7n t\u1EA1i.">
          <div class="demo-actions">
            <button type="button" (click)="setDecision('save')">Save</button>
            <button type="button" (click)="setDecision('discard')">Discard</button>
            <button type="button" (click)="setDecision('cancel')">Cancel</button>
            <button type="button" (click)="confirmAll()">Confirm leave</button>
          </div>
          <output data-confirm-state>{{ confirmResult() }}</output>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-additive-close-hook') {
        <demo-section
          heading="Additive close hook"
          note="G\u1EAFn c\xF9ng closeGuard v\xE0o [beforeClose] c\u1EE7a SdModal, SdSideDrawer ho\u1EB7c SdTab; kh\xF4ng c\u1EA7n component ph\u1EE5 thu\u1ED9c tr\u1EF1c ti\u1EBFp v\xE0o service.">
          <button type="button" (click)="openDrawer()">M\u1EDF drawer \u0111\xE3 ch\u1EC9nh s\u1EEDa</button>
          <output data-drawer-state>drawer dirty={{ drawerRef.dirty() }}</output>
          <sd-side-drawer #drawer title="Bi\xEAn t\u1EADp h\u1ED3 s\u01A1" [beforeClose]="drawerCloseGuard">
            <div class="drawer-body">D\u1EEF li\u1EC7u trong drawer \u0111ang ch\u1EDD l\u01B0u.</div>
            <button sdFooterRight type="button" (click)="drawer.close()">\u0110\xF3ng c\xF3 guard</button>
          </sd-side-drawer>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .demo-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-block: 8px;
    }

    .demo-field {
      display: grid;
      gap: 6px;
      max-width: 360px;
    }

    .demo-field input {
      padding: 8px 10px;
    }

    output {
      display: block;
      margin-top: 8px;
    }

    .drawer-body {
      padding: 16px;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDemoComponent {
  readonly unsaved = inject(SdUnsavedChangesService);
  readonly confirmation = inject(ShowcaseUnsavedChangesAdapter);
  readonly #destroyRef = inject(DestroyRef);
  readonly drawerComponent = viewChild.required<SdSideDrawer>('drawer');
  readonly #profileDirty = signal(false);
  readonly #filterDirty = signal(false);
  readonly #drawerDirty = signal(false);
  readonly profileForm = new FormGroup({ name: new FormControl('Nguy\u1EC5n An', { nonNullable: true }) });
  readonly confirmResult = signal('Ch\u01B0a x\xE1c nh\u1EADn');
  readonly profileRef: SdUnsavedChangesRegistration;
  readonly filterRef: SdUnsavedChangesRegistration;
  readonly formRef: SdUnsavedChangesRegistration;
  readonly drawerRef: SdUnsavedChangesRegistration;
  readonly drawerCloseGuard: () => Promise<boolean>;

  constructor() {
    this.profileRef = this.unsaved.register({
      id: 'editor',
      scope: 'profile',
      isDirty: this.#profileDirty,
      message: 'H\u1ED3 s\u01A1 c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u.',
      save: () => this.#profileDirty.set(false),
      discard: () => this.#profileDirty.set(false),
    });
    this.filterRef = this.unsaved.register({
      id: 'editor',
      scope: 'filters',
      isDirty: this.#filterDirty,
      message: 'B\u1ED9 l\u1ECDc c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u.',
      save: () => this.#filterDirty.set(false),
      discard: () => this.#filterDirty.set(false),
    });
    this.formRef = registerSdUnsavedChangesForm(this.unsaved, this.profileForm, {
      id: 'profile-form',
      scope: 'form',
      message: 'Bi\u1EC3u m\u1EABu c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u.',
      save: () => undefined,
    });
    this.drawerRef = this.unsaved.register({
      id: 'drawer-editor',
      scope: 'drawer',
      isDirty: this.#drawerDirty,
      message: 'Drawer c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u.',
      discard: () => this.#drawerDirty.set(false),
      save: () => this.#drawerDirty.set(false),
    });
    this.drawerCloseGuard = createSdUnsavedChangesCloseGuard(this.unsaved, { scope: 'drawer' });

    this.#destroyRef.onDestroy(() => {
      this.profileRef.destroy();
      this.filterRef.destroy();
      this.formRef.destroy();
      this.drawerRef.destroy();
    });
  }

  async saveForm(): Promise<void> {
    await this.formRef.save();
  }

  setDecision(decision: SdUnsavedChangesDecision): void {
    this.confirmation.decision.set(decision);
  }

  async confirmAll(): Promise<void> {
    const canLeave = await this.unsaved.confirmLeave({ reason: 'manual' });
    this.confirmResult.set(canLeave ? 'C\xF3 th\u1EC3 r\u1EDDi m\xE0n h\xECnh' : 'Gi\u1EEF nguy\xEAn m\xE0n h\xECnh');
  }

  openDrawer(): void {
    this.#drawerDirty.set(true);
    this.drawerComponent().open();
  }
}
`,scss:`.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-block: 8px;
}

.demo-field {
  display: grid;
  gap: 6px;
  max-width: 360px;
}

.demo-field input {
  padding: 8px 10px;
}

output {
  display: block;
  margin-top: 8px;
}

.drawer-body {
  padding: 16px;
}`},"services/viewport":{typescript:`import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-viewport-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent],
  template: \`
    <demo-page
      #demoPage
      title="Viewport"
      description="SdViewportService \u2013 m\u1ED9t ngu\u1ED3n signal SSR-safe cho k\xEDch th\u01B0\u1EDBc viewport v\xE0 breakpoint mobile/tablet/desktop.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai-truc-tiep') {
        <demo-section
          heading="Tr\u1EA1ng th\xE1i tr\u1EF1c ti\u1EBFp"
          [props]="[
            { name: 'width / height', value: 'Signal<number>' },
            { name: 'currentBreakpoint', value: viewport.currentBreakpoint() },
          ]"
          note="Thay \u0111\u1ED5i k\xEDch th\u01B0\u1EDBc c\u1EEDa s\u1ED5 \u0111\u1EC3 quan s\xE1t c\xE1c signal c\u1EADp nh\u1EADt t\u1EEB c\xF9ng m\u1ED9t resize listener.">
          <div class="viewport-state">
            <strong data-viewport-size>{{ viewport.width() }} \xD7 {{ viewport.height() }}</strong>
            <span data-current-breakpoint>{{ viewport.currentBreakpoint() }}</span>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-breakpoint-mac-dinh') {
        <demo-section
          heading="Breakpoint m\u1EB7c \u0111\u1ECBnh"
          [props]="[
            { name: 'mobile', value: viewport.breakpoints.mobile },
            { name: 'tablet', value: viewport.breakpoints.tablet },
            { name: 'desktop', value: viewport.breakpoints.desktop },
          ]"
          note="C\xE1c m\u1ED1c d\xF9ng min-width semantics; c\xF3 th\u1EC3 override to\xE0n b\u1ED9 qua SD_VIEWPORT_BREAKPOINTS.">
          <div class="breakpoint-list">
            <code>mobile: {{ viewport.breakpoints.mobile }}</code>
            <code>tablet: {{ viewport.breakpoints.tablet }}</code>
            <code>desktop: {{ viewport.breakpoints.desktop }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-signal-theo-breakpoint') {
        <demo-section
          heading="Signal theo breakpoint"
          [props]="[
            { name: 'isMobile()', value: viewport.isMobile() },
            { name: 'isTablet()', value: viewport.isTablet() },
            { name: 'isDesktop()', value: viewport.isDesktop() },
          ]"
          note="Consumer ch\u1EC9 \u0111\u1ECDc signal, kh\xF4ng t\u1EF1 \u0111\u0103ng k\xFD ho\u1EB7c cleanup listener.">
          <div class="breakpoint-list">
            <code>isMobile: {{ viewport.isMobile() }}</code>
            <code>isTablet: {{ viewport.isTablet() }}</code>
            <code>isDesktop: {{ viewport.isDesktop() }}</code>
          </div>
        </demo-section>
      }
    </demo-page>
  \`,
  styles: \`
    .viewport-state,
    .breakpoint-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .viewport-state strong,
    .viewport-state span,
    .breakpoint-list code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewportDemoComponent {
  readonly viewport = inject(SdViewportService);
}
`,scss:`.viewport-state,
.breakpoint-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.viewport-state strong,
.viewport-state span,
.breakpoint-list code {
  padding: 8px 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #f7f9fb;
}`}},n={"components/anchor/example-anchor-mac-dinh":t(e({},o["components/anchor"]),{html:`<demo-section heading="Anchor m\u1EB7c \u0111\u1ECBnh" [props]="[{ name: 'sidebarWidth', value: 'px' }]">
    <div class="anchor-wrap">
      <sd-anchor sidebarWidth="200px">
        <sd-anchor-item title="Th\xF4ng tin chung" icon="person">
          <div class="block">
            <h3>Th\xF4ng tin chung</h3>
            <p>H\u1ECD t\xEAn, email, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i c\u1EE7a nh\xE2n vi\xEAn.</p>
          </div>
        </sd-anchor-item>
        <sd-anchor-item title="H\u1EE3p \u0111\u1ED3ng" icon="description">
          <div class="block">
            <h3>H\u1EE3p \u0111\u1ED3ng</h3>
            <p>Lo\u1EA1i h\u1EE3p \u0111\u1ED3ng, ng\xE0y hi\u1EC7u l\u1EF1c v\xE0 c\xE1c \u0111i\u1EC1u kho\u1EA3n \u0111\xEDnh k\xE8m.</p>
          </div>
        </sd-anchor-item>
        <sd-anchor-item title="Ph\xE2n quy\u1EC1n" icon="lock">
          <div class="block">
            <h3>Ph\xE2n quy\u1EC1n</h3>
            <p>Vai tr\xF2, nh\xF3m quy\u1EC1n \u0111\u01B0\u1EE3c g\xE1n cho t\xE0i kho\u1EA3n.</p>
          </div>
        </sd-anchor-item>
        <sd-anchor-item title="L\u1ECBch s\u1EED thao t\xE1c" icon="history">
          <div class="block">
            <h3>L\u1ECBch s\u1EED thao t\xE1c</h3>
            <p>C\xE1c thay \u0111\u1ED5i \u0111\u01B0\u1EE3c ghi nh\u1EADn theo th\u1EDDi gian.</p>
          </div>
        </sd-anchor-item>
      </sd-anchor>
    </div>
  </demo-section>`}),"components/anchor/example-mau-va-cat-ngan-chu":t(e({},o["components/anchor"]),{html:`<demo-section heading="M\xE0u v\xE0 c\u1EAFt ng\u1EAFn ch\u1EEF" [props]="[{ name: 'color', value: 'success' }, { name: 'ellipsis', value: 'true' }]">
    <div class="anchor-wrap">
      <sd-anchor color="success" ellipsis sidebarWidth="180px">
        <sd-anchor-item title="B\xE1o c\xE1o doanh thu chi nh\xE1nh qu\xFD 4 n\u0103m 2026" icon="trending_up">
          <div class="block">
            <h3>B\xE1o c\xE1o doanh thu</h3>
            <p>T\u1ED5ng h\u1EE3p doanh thu c\u1EE7a t\u1EA5t c\u1EA3 chi nh\xE1nh trong qu\xFD 4.</p>
          </div>
        </sd-anchor-item>
        <sd-anchor-item title="Ph\xE2n t\xEDch chi ph\xED v\u1EADn h\xE0nh" icon="paid">
          <div class="block">
            <h3>Ph\xE2n t\xEDch chi ph\xED</h3>
            <p>Chi ti\u1EBFt theo t\u1EEBng kho\u1EA3n chi ph\xED.</p>
          </div>
        </sd-anchor-item>
      </sd-anchor>
    </div>
  </demo-section>`}),"components/api-contract-builder/example-ba-che-do-nguon-gia-tri":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Ba ch\u1EBF \u0111\u1ED9 ngu\u1ED3n gi\xE1 tr\u1ECB"
      [props]="[
        { name: 'mode picker', value: 'source / static / advanced' },
        { name: 'source', value: 'dropdown' }
      ]"
      note="keyword l\u1EA5y t\u1EEB ngu\u1ED3n (m\u1ED9t dropdown, kh\xF4ng g\xF5 \${\u2026}); Authorization l\xE0 template gh\xE9p n\xEAn m\u1EDF \u1EDF N\xE2ng cao; version l\xE0 gi\xE1 tr\u1ECB t\u0129nh.">
      <div class="builder-box">
        <sd-api-contract-builder [(model)]="modesContract" autoId="demo-modes"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-che-do-xem":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Ch\u1EBF \u0111\u1ED9 xem"
      [props]="[
        { name: 'mode', value: 'view' },
        { name: 'disabled', value: 'true' }
      ]"
      note="Ch\u1EBF \u0111\u1ED9 xem hi\u1EC3n th\u1ECB t\xF3m t\u1EAFt c\xF9ng JSON; disabled gi\u1EEF nguy\xEAn c\xE1c b\u01B0\u1EDBc nh\u01B0ng kho\xE1 ch\u1EC9nh s\u1EEDa.">
      <div class="builder-box">
        <sd-api-contract-builder [model]="searchContract()" mode="view" autoId="demo-view"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-contract-sai-va-chan-doan":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Contract sai v\xE0 ch\u1EA9n \u0111o\xE1n"
      [props]="[
        { name: 'diagnosticsChange', value: 'event' },
        { name: 'validChange', value: 'event' }
      ]"
      note="\${env.unknown} ch\u01B0a khai b\xE1o, {id} thi\u1EBFu req.path, \${input.page} kh\xF4ng t\u1ED3n t\u1EA1i, output m\u1EA3ng tr\u1ECF v\xE0o m\u1ED9t s\u1ED1.">
      <div class="builder-box">
        <sd-api-contract-builder
          [(model)]="invalidContract"
          autoId="demo-invalid"
          (diagnosticsChange)="diagnostics.set($event)"
          (validChange)="valid.set($event)"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-dan-json-de-nap-contract":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="D\xE1n JSON \u0111\u1EC3 n\u1EA1p contract"
      [props]="[{ name: 'step', value: 'Ki\u1EC3m tra' }]"
      note="Sang b\u01B0\u1EDBc Ki\u1EC3m tra: n\xFAt Copy l\u1EA5y contract ra, v\xE0 d\xE1n JSON v\xE0o ch\xEDnh editor \u0111\xF3 \u0111\u1EC3 n\u1EA1p contract m\u1EDBi. JSON sai c\xFA ph\xE1p th\xEC contract gi\u1EEF nguy\xEAn v\xE0 c\xF3 th\xEAm ch\u1EA9n \u0111o\xE1n contract.invalid.">
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
              <code>{{ diagnostic.severity }}</code> \xB7 <code>{{ diagnostic.path }}</code> \u2014 {{ diagnostic.message }}
              <code>{{ diagnostic.code }}</code>
            </li>
          }
        </ul>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-danh-sach-gon-sua-trong-drawer":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Danh s\xE1ch g\u1ECDn, s\u1EEDa trong drawer"
      [props]="[
        { name: 'row', value: 'read-only' },
        { name: 'drawer', value: 'commit on save' },
        { name: 'nested', value: 'breadcrumb' }
      ]"
      note="M\u1ED7i tr\u01B0\u1EDDng l\xE0 m\u1ED9t h\xE0ng ch\u1EC9 \u0111\u1EC3 \u0111\u1ECDc. B\u1EA5m h\xE0ng ho\u1EB7c n\xFAt Th\xEAm \u0111\u1EC3 m\u1EDF drawer; contract ch\u1EC9 \u0111\u1ED5i khi b\u1EA5m L\u01B0u. Tr\u01B0\u1EDDng object hi\u1EC7n s\u1ED1 tr\u01B0\u1EDDng con \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 \u0111i s\xE2u ngay trong drawer \u0111\xF3, kh\xF4ng m\u1EDF drawer l\u1ED3ng drawer.">
      <div class="builder-box">
        <sd-api-contract-builder [(model)]="drawerContract" autoId="demo-drawer"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-get-tim-kiem-san-pham":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="GET t\xECm ki\u1EBFm s\u1EA3n ph\u1EA9m"
      [props]="[
        { name: '[(model)]', value: 'two-way' },
        { name: 'autoId', value: 'demo-search' },
        { name: 'env', value: '\${env.baseUrl} / \${env.token}' }
      ]"
      note="Query map t\u1EEB input, header Authorization n\u1ED9i suy \${env.token}, output l\xE0 m\u1EA3ng g\u1ED1c l\u1EA5y th\u1EB3ng \${res.body.items}.">
      <div class="builder-box">
        <sd-api-contract-builder [(model)]="searchContract" autoId="demo-search"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-gia-tri-tinh-theo-kieu-du-lieu":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Gi\xE1 tr\u1ECB t\u0129nh theo ki\u1EC3u d\u1EEF li\u1EC7u"
      [props]="[
        { name: 'static control', value: 'input / number / date / datetime / select / json' }
      ]"
      note="M\u1ED7i ki\u1EC3u d\u1EEF li\u1EC7u render \u0111\xFAng control c\u1EE7a n\xF3; object v\xE0 array d\xF9ng sd-code-editor. Gi\xE1 tr\u1ECB date/datetime l\u01B0u d\u1EA1ng ISO.">
      <div class="builder-box">
        <sd-api-contract-builder [(model)]="staticContract" autoId="demo-static"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-ket-qua-chan-doan":t(e({},o["components/api-contract-builder"]),{html:`<demo-section heading="K\u1EBFt qu\u1EA3 ch\u1EA9n \u0111o\xE1n" note="Gi\xE1 tr\u1ECB \u0111\u1ECDc tr\u1EF1c ti\u1EBFp t\u1EEB hai output c\u1EE7a demo ph\xEDa tr\xEAn.">
      <div class="result-box">
        <p><strong>valid</strong>: {{ valid() }}</p>
        <ul>
          @for (diagnostic of diagnostics(); track diagnostic.code + diagnostic.path) {
            <li>
              <code>{{ diagnostic.severity }}</code> \xB7 <code>{{ diagnostic.path }}</code> \u2014 {{ diagnostic.message }}
              <code>{{ diagnostic.code }}</code>
            </li>
          }
        </ul>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-post-map-body":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="POST map body"
      [props]="[
        { name: '[(model)]', value: 'two-way' },
        { name: 'source', value: '\${input.*} / \${env.*}' },
        { name: 'value', value: 'static' }
      ]"
      note="input.a \u2192 req.body.x, input.b \u2192 req.body.y, input.c \u2192 req.body.z, env.userId \u2192 req.body.u, v\xE0 m\u1ED9t literal t\u0129nh \u1EDF req.body.v.">
      <div class="builder-box">
        <sd-api-contract-builder [(model)]="createContract" autoId="demo-create"></sd-api-contract-builder>
      </div>
    </demo-section>`}),"components/api-contract-builder/example-truong-output-cho-dropdown-table":t(e({},o["components/api-contract-builder"]),{html:`<demo-section
      heading="Tr\u01B0\u1EDDng output cho dropdown / table"
      note="listSdApiContractSchemaFields() l\xE0m ph\u1EB3ng m\u1EA3ng g\u1ED1c \u2014 \u0111\xE2y ch\xEDnh l\xE0 d\u1EEF li\u1EC7u form-builder s\u1EBD d\xF9ng \u0111\u1EC3 ch\u1ECDn valueField / displayField v\xE0 sinh column.">
      <div class="result-box">
        <ul>
          @for (field of outputFields(); track field.path) {
            <li>
              <code>{{ field.path }}</code> \u2014 <code>{{ field.type }}</code>
              @if (field.required === true) {
                <span>\xB7 b\u1EAFt bu\u1ED9c</span>
              }
            </li>
          }
        </ul>
      </div>
    </demo-section>`}),"components/audit-diff/example-custom-value-template":t(e({},o["components/audit-diff"]),{html:`<demo-section heading="Custom value template" [props]="[{ name: 'sdAuditDiffValue', value: 'TemplateRef context' }]">
      <sd-audit-diff [before]="customBefore" [after]="customAfter" [options]="customOptions">
        <ng-template sdAuditDiffValue let-value let-row="row" let-side="side">
          <span class="custom-value" [attr.data-custom-side]="side">{{ row.label }}: {{ value }}</span>
        </ng-template>
      </sd-audit-diff>
    </demo-section>`}),"components/audit-diff/example-format-redact-va-order":t(e({},o["components/audit-diff"]),{html:`<demo-section
      heading="Format, redact v\xE0 order"
      [props]="[
        { name: 'enumMap', value: 'status' },
        { name: 'redacted', value: 'token' },
        { name: 'hidden', value: 'password' },
      ]">
      <sd-audit-diff [before]="securedBefore" [after]="securedAfter" [options]="securedOptions"></sd-audit-diff>
    </demo-section>`}),"components/audit-diff/example-nested-table":t(e({},o["components/audit-diff"]),{html:`<demo-section
      heading="Nested table"
      [props]="[
        { name: 'mode', value: 'table' },
        { name: 'nested objects', value: 'leaf rows' },
      ]">
      <sd-audit-diff [before]="nestedBefore" [after]="nestedAfter" [options]="nestedOptions"></sd-audit-diff>
    </demo-section>`}),"components/audit-diff/example-stable-key-array":t(e({},o["components/audit-diff"]),{html:`<demo-section
      heading="Stable-key array"
      [props]="[
        { name: 'arrayKey', value: 'id' },
        { name: 'mode', value: 'detail-list' },
      ]"
      note="Reorder kh\xF4ng sinh diff gi\u1EA3; item th\xEAm/x\xF3a v\u1EABn \u0111i qua rule c\u1EE7a field con.">
      <sd-audit-diff [before]="linesBefore" [after]="linesAfter" [options]="linesOptions" mode="detail-list"></sd-audit-diff>
    </demo-section>`}),"components/avatar/example-anh-url":t(e({},o["components/avatar"]),{html:`<demo-section heading="\u1EA2nh URL" [props]="[{ name: 'src', value: 'url' }]">
    <div class="row">
      <sd-avatar src="https://i.pravatar.cc/80?img=11" [size]="48"></sd-avatar>
      <sd-avatar src="https://i.pravatar.cc/80?img=22" [size]="48"></sd-avatar>
      <sd-avatar src="https://i.pravatar.cc/80?img=33" [size]="48"></sd-avatar>
      <sd-avatar src="https://i.pravatar.cc/80?img=44" [size]="48"></sd-avatar>
    </div>
  </demo-section>`}),"components/avatar/example-cac-kich-thuoc":t(e({},o["components/avatar"]),{html:`<demo-section heading="C\xE1c k\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: '24 / 32 / 48 / 72 / 96' }]">
    <div class="row size-row">
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="24"></sd-avatar>
        <span>24</span>
      </div>
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="32"></sd-avatar>
        <span>32</span>
      </div>
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="48"></sd-avatar>
        <span>48</span>
      </div>
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="72"></sd-avatar>
        <span>72</span>
      </div>
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="96"></sd-avatar>
        <span>96</span>
      </div>
    </div>
  </demo-section>`}),"components/avatar/example-chu-cai-dau-tu-ten":t(e({},o["components/avatar"]),{html:`<demo-section heading="Ch\u1EEF c\xE1i \u0111\u1EA7u t\u1EEB t\xEAn" [props]="[{ name: 'src', value: 'initials' }]">
    <div class="row">
      <div class="card">
        <sd-avatar src="Nguy\u1EC5n V\u0103n An" [size]="48"></sd-avatar>
        <span>Nguy\u1EC5n V\u0103n An</span>
      </div>
      <div class="card">
        <sd-avatar src="Tr\u1EA7n Th\u1ECB B\xEDch" [size]="48"></sd-avatar>
        <span>Tr\u1EA7n Th\u1ECB B\xEDch</span>
      </div>
      <div class="card">
        <sd-avatar src="L\xEA Minh Ho\xE0ng" [size]="48"></sd-avatar>
        <span>L\xEA Minh Ho\xE0ng</span>
      </div>
      <div class="card">
        <sd-avatar src="Ph\u1EA1m Qu\u1EF3nh Anh" [size]="48"></sd-avatar>
        <span>Ph\u1EA1m Qu\u1EF3nh Anh</span>
      </div>
    </div>
  </demo-section>`}),"components/avatar/example-fallback-khi-thieu-du-lieu":t(e({},o["components/avatar"]),{html:`<demo-section heading="Fallback khi thi\u1EBFu d\u1EEF li\u1EC7u" [props]="[{ name: 'src', value: 'null / empty' }]">
    <div class="row">
      <sd-avatar [src]="null" [size]="48"></sd-avatar>
      <sd-avatar src="" [size]="48"></sd-avatar>
      <sd-avatar src="?" [size]="48"></sd-avatar>
    </div>
  </demo-section>`}),"components/badge/example-ba-dang":t(e({},o["components/badge"]),{html:`<demo-section heading="Ba d\u1EA1ng" [props]="[{ name: 'type', value: 'icon / round / tag' }]">
    <sd-badge type="icon" primary icon="check_circle" title="icon"></sd-badge>
    <sd-badge type="round" primary title="round"></sd-badge>
    <sd-badge type="tag" primary icon="label" title="tag"></sd-badge>
  </demo-section>`}),"components/badge/example-fontset-switch":t(e({},o["components/badge"]),{html:`<demo-section
    heading="fontSet switch"
    [props]="[{ name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' }, { name: 'type', value: 'icon / round / tag' }]"
    note="Chon fontSet bang radio de so sanh alignment cua cung mot bo badge icon.">
    <div class="d-flex flex-column gap-16 w-full">
      <sd-radio
        label="fontSet"
        [items]="fontSetOptions"
        valueField="value"
        displayField="display"
        [(model)]="selectedFontSet"
        [form]="fontSetForm"></sd-radio>

      <div class="d-flex flex-wrap align-items-center gap-16">
        <sd-badge type="icon" success icon="check_circle" [fontSet]="selectedFontSet()" title="Approved"></sd-badge>
        <sd-badge type="icon" info icon="visibility" [fontSet]="selectedFontSet()" title="Visible"></sd-badge>
        <sd-badge type="icon" warning icon="warning" [fontSet]="selectedFontSet()" title="Warning"></sd-badge>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-16">
        <sd-badge type="round" success icon="check_circle" [fontSet]="selectedFontSet()" title="Round success"></sd-badge>
        <sd-badge type="round" info icon="local_offer" [fontSet]="selectedFontSet()" title="Round offer"></sd-badge>
        <sd-badge type="round" error icon="delete" [fontSet]="selectedFontSet()" title="Round error"></sd-badge>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-16">
        <sd-badge type="tag" primary icon="local_offer" [fontSet]="selectedFontSet()" title="Tag primary"></sd-badge>
        <sd-badge type="tag" warning icon="warning" [fontSet]="selectedFontSet()" title="Tag warning"></sd-badge>
        <sd-badge type="tag" secondary icon="visibility" [fontSet]="selectedFontSet()" title="Tag secondary"></sd-badge>
      </div>
    </div>
  </demo-section>`}),"components/badge/example-kem-mo-ta":t(e({},o["components/badge"]),{html:`<demo-section heading="K\xE8m m\xF4 t\u1EA3" [props]="[{ name: 'description', value: 'text' }]">
    <sd-badge type="icon" success icon="check_circle" title="title" description="description"></sd-badge>
    <sd-badge type="tag" primary icon="star" title="title" description="description"></sd-badge>
  </demo-section>`}),"components/badge/example-kich-thuoc-round":t(e({},o["components/badge"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc round" [props]="[{ name: 'type', value: 'round' }, { name: 'size', value: 'sm / md / lg' }]">
    <sd-badge type="round" primary title="sm" size="sm"></sd-badge>
    <sd-badge type="round" primary title="md" size="md"></sd-badge>
    <sd-badge type="round" primary title="lg" size="lg"></sd-badge>
  </demo-section>`}),"components/badge/example-kich-thuoc-tag":t(e({},o["components/badge"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'size', value: 'sm / md / lg' }]">
    <sd-badge type="tag" info icon="label" title="sm" size="sm"></sd-badge>
    <sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
    <sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
  </demo-section>`}),"components/badge/example-mau-sac-icon":t(e({},o["components/badge"]),{html:`<demo-section heading="M\xE0u s\u1EAFc icon" [props]="[{ name: 'type', value: 'icon' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
    <sd-badge type="icon" primary icon="circle" title="primary"></sd-badge>
    <sd-badge type="icon" secondary icon="circle" title="secondary"></sd-badge>
    <sd-badge type="icon" success icon="circle" title="success"></sd-badge>
    <sd-badge type="icon" info icon="circle" title="info"></sd-badge>
    <sd-badge type="icon" warning icon="circle" title="warning"></sd-badge>
    <sd-badge type="icon" error icon="circle" title="error"></sd-badge>
  </demo-section>`}),"components/badge/example-mau-sac-round":t(e({},o["components/badge"]),{html:`<demo-section heading="M\xE0u s\u1EAFc round" [props]="[{ name: 'type', value: 'round' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
    <sd-badge type="round" primary title="primary"></sd-badge>
    <sd-badge type="round" secondary title="secondary"></sd-badge>
    <sd-badge type="round" success title="success"></sd-badge>
    <sd-badge type="round" info title="info"></sd-badge>
    <sd-badge type="round" warning title="warning"></sd-badge>
    <sd-badge type="round" error title="error"></sd-badge>
  </demo-section>`}),"components/badge/example-mau-sac-tag":t(e({},o["components/badge"]),{html:`<demo-section heading="M\xE0u s\u1EAFc tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
    <sd-badge type="tag" primary icon="label" title="primary"></sd-badge>
    <sd-badge type="tag" secondary icon="label" title="secondary"></sd-badge>
    <sd-badge type="tag" success icon="label" title="success"></sd-badge>
    <sd-badge type="tag" info icon="label" title="info"></sd-badge>
    <sd-badge type="tag" warning icon="label" title="warning"></sd-badge>
    <sd-badge type="tag" error icon="label" title="error"></sd-badge>
  </demo-section>`}),"components/badge/example-round-voi-icon":t(e({},o["components/badge"]),{html:`<demo-section heading="Round v\u1EDBi icon" [props]="[{ name: 'type', value: 'round' }, { name: 'icon', value: 'name' }, { name: 'size', value: 'sm / md / lg' }]">
    <sd-badge type="round" success icon="check_circle" title="sm" size="sm"></sd-badge>
    <sd-badge type="round" success icon="check_circle" title="md" size="md"></sd-badge>
    <sd-badge type="round" success icon="check_circle" title="lg" size="lg"></sd-badge>
  </demo-section>`}),"components/badge/example-so-dem":t(e({},o["components/badge"]),{html:`<demo-section heading="S\u1ED1 \u0111\u1EBFm" [props]="[{ name: 'type', value: 'round' }, { name: 'title', value: 'number' }]">
    <sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
    <sd-badge type="round" error [title]="errorsCount()"></sd-badge>
    <sd-badge type="round" warning title="99+"></sd-badge>
  </demo-section>`}),"components/breadcrumb/example-danh-sach-tinh":t(e({},o["components/breadcrumb"]),{html:`<demo-section
      heading="Danh s\xE1ch t\u0129nh"
      [props]="[
        { name: 'items', value: '6 items' },
        { name: 'maxItems', value: '4' },
      ]"
      note="Root, d\u1EA5u r\xFAt g\u1ECDn v\xE0 context cu\u1ED1i \u0111\u01B0\u1EE3c gi\u1EEF; item disabled kh\xF4ng tr\u1EDF th\xE0nh control t\u01B0\u01A1ng t\xE1c.">
      <sd-breadcrumb [items]="staticItems" [maxItems]="4"></sd-breadcrumb>
    </demo-section>`}),"components/breadcrumb/example-nhan-async":t(e({},o["components/breadcrumb"]),{html:`<demo-section
      heading="Nh\xE3n async"
      [props]="[{ name: 'label', value: 'Observable<string>' }]"
      note="Observable label \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt tr\u1EF1c ti\u1EBFp v\xE0 t\u1EF1 unsubscribe khi source/component b\u1ECB thay th\u1EBF.">
      <sd-breadcrumb [items]="asyncItems"></sd-breadcrumb>
      <button type="button" data-resolve-label (click)="resolveAsyncLabel()">Resolve label</button>
    </demo-section>`}),"components/breadcrumb/example-router-generated":t(e({},o["components/breadcrumb"]),{html:`<demo-section
      heading="Router-generated"
      [props]="[{ name: 'route.data.breadcrumb', value: 'resolver' }]"
      note="Kh\xF4ng truy\u1EC1n items: component \u0111\u1ECDc primary route chain c\u1EE7a ch\xEDnh trang t\xE0i li\u1EC7u n\xE0y v\xE0 c\u1EADp nh\u1EADt sau NavigationEnd.">
      <sd-breadcrumb></sd-breadcrumb>
    </demo-section>`}),"components/button/example-bang-mau":t(e({},o["components/button/example-bang-mau"]),{html:`<sd-button type="fill" color="primary" title="primary"></sd-button>
<sd-button type="fill" color="secondary" title="secondary"></sd-button>
<sd-button type="fill" color="black" title="black"></sd-button>
<sd-button type="fill" color="success" title="success"></sd-button>
<sd-button type="fill" color="info" title="info"></sd-button>
<sd-button type="fill" color="warning" title="warning"></sd-button>
<sd-button type="fill" color="error" title="error"></sd-button>`}),"components/button/example-bien-the":t(e({},o["components/button/example-bien-the"]),{html:`<sd-button type="fill" color="primary" title="fill"></sd-button>
<sd-button type="light" color="primary" title="light"></sd-button>
<sd-button type="outline" color="primary" title="outline"></sd-button>
<sd-button type="text" color="primary" title="text"></sd-button>`}),"components/button/example-chi-icon":t(e({},o["components/button/example-chi-icon"]),{html:`<sd-button type="light" color="primary" prefixIcon="edit" tooltip="edit"></sd-button>
<sd-button type="light" color="error" prefixIcon="delete" tooltip="delete"></sd-button>`}),"components/button/example-kich-thuoc":t(e({},o["components/button/example-kich-thuoc"]),{html:`<sd-button type="fill" color="primary" size="sm" title="sm" prefixIcon="add"></sd-button>
<sd-button type="fill" color="primary" size="md" title="md" prefixIcon="add"></sd-button>
<sd-button type="fill" color="primary" size="lg" title="lg" prefixIcon="add"></sd-button>`}),"components/button/example-secondary-vs-black":t(e({},o["components/button/example-secondary-vs-black"]),{html:`<sd-button type="fill" color="secondary" title="secondary fill"></sd-button>
<sd-button type="fill" color="black" title="black fill"></sd-button>
<sd-button type="light" color="secondary" title="secondary light"></sd-button>
<sd-button type="light" color="black" title="black light"></sd-button>
<sd-button type="outline" color="secondary" title="secondary outline"></sd-button>
<sd-button type="outline" color="black" title="black outline"></sd-button>
<sd-button type="text" color="secondary" title="secondary text"></sd-button>
<sd-button type="text" color="black" title="black text"></sd-button>`}),"components/button/example-toggle-icon-set-bang-alias":t(e({},o["components/button/example-toggle-icon-set-bang-alias"]),{html:`<sd-button type="fill" color="primary" title="Material filled" (click)="useFontSet('material-icons')"></sd-button>
<sd-button type="fill" color="secondary" title="Material outlined" (click)="useFontSet('material-icons-outlined')"></sd-button>
<sd-button type="fill" color="info" title="Lucide" (click)="useFontSet('lucide')"></sd-button>
<sd-button type="light" color="primary" title="Create" prefixIcon="add" [fontSet]="fontSet()"></sd-button>
<sd-button type="light" color="primary" title="View" prefixIcon="visibility" [fontSet]="fontSet()"></sd-button>
<sd-button type="light" color="error" title="Delete" prefixIcon="delete" [fontSet]="fontSet()"></sd-button>
<sd-button type="outline" color="secondary" title="More" suffixIcon="more_vert" [fontSet]="fontSet()"></sd-button>`}),"components/button/example-trang-thai":t(e({},o["components/button/example-trang-thai"]),{html:`<sd-button
  type="fill"
  color="primary"
  title="loading"
  prefixIcon="send"
  [loading]="submitting()"
  (click)="onSubmit()">
</sd-button>
<sd-button type="fill" color="primary" title="disabled" [disabled]="true"></sd-button>
<div style="width: 240px;">
  <sd-button type="fill" color="primary" title="block" [block]="true"></sd-button>
</div>`}),"components/chart/example-bieu-do-bar":t(e({},o["components/chart"]),{html:`<demo-section heading="Bi\u1EC3u \u0111\u1ED3 Bar" [props]="[{ name: 'type', value: 'bar' }]">
    <div class="chart-box">
      <sd-bar-chart [data]="barData" [options]="barOptions"></sd-bar-chart>
    </div>
  </demo-section>`}),"components/chart/example-bieu-do-line":t(e({},o["components/chart"]),{html:`<demo-section heading="Bi\u1EC3u \u0111\u1ED3 Line" [props]="[{ name: 'type', value: 'line' }]">
    <div class="chart-box">
      <sd-line-chart [data]="lineData" [options]="lineOptions"></sd-line-chart>
    </div>
  </demo-section>`}),"components/chart/example-bieu-do-pie-doughnut":t(e({},o["components/chart"]),{html:`<demo-section heading="Bi\u1EC3u \u0111\u1ED3 Pie & Doughnut" [props]="[{ name: 'type', value: 'pie / doughnut' }]">
    <div class="row">
      <div class="chart-box small">
        <sd-pie-chart [data]="pieData"></sd-pie-chart>
      </div>
      <div class="chart-box small">
        <sd-doughnut-chart [data]="doughnutData"></sd-doughnut-chart>
      </div>
    </div>
  </demo-section>`}),"components/code-editor/example-che-do-xem-json":t(e({},o["components/code-editor"]),{html:`<demo-section heading="Ch\u1EBF \u0111\u1ED9 xem JSON" [props]="[{ name: 'language', value: 'json' }, { name: 'viewed', value: 'true' }]">
    <div class="code-box">
      <sd-code-editor language="json" [model]="jsonValue" [viewed]="true" maxHeight="240px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/code-editor/example-ngon-ngu-html":t(e({},o["components/code-editor"]),{html:`<demo-section heading="Ng\xF4n ng\u1EEF HTML" [props]="[{ name: 'language', value: 'html' }]">
    <div class="code-box">
      <sd-code-editor language="html" [(model)]="htmlCode" maxHeight="220px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/code-editor/example-ngon-ngu-typescript":t(e({},o["components/code-editor"]),{html:`<demo-section heading="Ng\xF4n ng\u1EEF TypeScript" [props]="[{ name: 'language', value: 'typescript' }]">
    <div class="code-box">
      <sd-code-editor language="typescript" [(model)]="tsCode" maxHeight="280px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/data-state/example-empty":t(e({},o["components/data-state"]),{html:`<demo-section heading="Empty" note="Custom template nh\u1EADn state/retry/action context thay cho default presentation.">
      <sd-data-state state="empty" compact>
        <ng-template sdDataStateTemplate let-state>
          <div class="custom-empty">Custom {{ state }}: ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng ph\xF9 h\u1EE3p.</div>
        </ng-template>
      </sd-data-state>
    </demo-section>`}),"components/data-state/example-error":t(e({},o["components/data-state"]),{html:`<demo-section
      heading="Error"
      [props]="[
        { name: 'retryable', value: 'true' },
        { name: 'actionLabel', value: 'M\u1EDF nh\u1EADt k\xFD' },
      ]">
      <sd-data-state state="error" retryable actionLabel="M\u1EDF nh\u1EADt k\xFD" (sdRetry)="onRetry()" (sdAction)="onAction()"> </sd-data-state>
      <div>Retry: {{ retryCount() }} \xB7 Action: {{ actionCount() }}</div>
    </demo-section>`}),"components/data-state/example-forbidden":t(e({},o["components/data-state"]),{html:`<demo-section heading="Forbidden" [props]="[{ name: 'fullPage', value: 'true' }]">
      <div class="full-page-preview">
        <sd-data-state state="forbidden" fullPage></sd-data-state>
      </div>
    </demo-section>`}),"components/data-state/example-loading":t(e({},o["components/data-state"]),{html:`<demo-section heading="Loading" [props]="[{ name: 'compact', value: 'true' }]">
      <sd-data-state state="loading" compact></sd-data-state>
    </demo-section>`}),"components/data-state/example-success":t(e({},o["components/data-state"]),{html:`<demo-section heading="Success" note="Kh\xF4ng c\xF3 presentation wrapper d\u01B0 th\u1EEBa; content \u0111\u01B0\u1EE3c project tr\u1EF1c ti\u1EBFp.">
      <sd-data-state state="success">
        <article data-success>D\u1EEF li\u1EC7u \u0111\xE3 s\u1EB5n s\xE0ng</article>
      </sd-data-state>
    </demo-section>`}),"components/editor/example-chi-doc":t(e({},o["components/editor"]),{html:`<demo-section heading="Ch\u1EC9 \u0111\u1ECDc" [props]="[{ name: 'readonly', value: 'true' }]">
    <div class="editor-box">
      <sd-editor
        label="\u0110i\u1EC1u kho\u1EA3n d\u1ECBch v\u1EE5"
        height="200px"
        [readonly]="true"
        [(model)]="readOnlyContent">
      </sd-editor>
    </div>
  </demo-section>`}),"components/editor/example-soan-noi-dung":t(e({},o["components/editor"]),{html:`<demo-section heading="So\u1EA1n n\u1ED9i dung" [props]="[{ name: '[(model)]', value: 'two-way' }]">
    <div class="editor-box">
      <sd-editor
        label="M\xF4 t\u1EA3 chi ti\u1EBFt"
        placeholder="Nh\u1EADp m\xF4 t\u1EA3 s\u1EA3n ph\u1EA9m..."
        helperText="H\u1ED7 tr\u1EE3 \u0111\u1ECBnh d\u1EA1ng \u0111\u1EADm / nghi\xEAng / g\u1EA1ch ch\xE2n / m\xE0u ch\u1EEF."
        height="240px"
        maxHeight="360px"
        [(model)]="content">
      </sd-editor>
    </div>
  </demo-section>`}),"components/form-generic/example-builder-render":t(e({},o["components/form-generic"]),{html:`<demo-section heading="Builder + Render" [props]="[{ name: 'formGeneric', value: 'SdFormGeneric' }]">
    <div class="row-actions">
      <sd-button type="outline" color="primary" title="\u0110\u1EB7t l\u1EA1i" prefixIcon="restart_alt" (click)="reset()"></sd-button>
      <sd-button type="outline" color="secondary" title="T\u1EA3i form r\u1ED7ng" prefixIcon="layers_clear" (click)="loadEmpty()"></sd-button>
      <sd-button
        type="outline"
        color="primary"
        title="Demo drag/drop + popup"
        prefixIcon="open_with"
        (click)="loadDragDropPopupDemo()"></sd-button>
      <sd-button type="fill" color="primary" title="C\u1EADp nh\u1EADt preview" prefixIcon="visibility" (click)="refreshPreview()"></sd-button>
      <sd-button type="outline" color="primary" title="Xu\u1EA5t JSON" prefixIcon="code" (click)="dumpJson()"></sd-button>
    </div>

    <div class="builder-box">
      <sd-form-builder [formGeneric]="seed()"></sd-form-builder>
    </div>

    <div class="render-preview">
      <div class="render-preview__title">Runtime render t\u1EEB schema hi\u1EC7n t\u1EA1i</div>
      <sd-form-render [configuration]="previewConfig()" [form]="form" [entity]="entity()"></sd-form-render>
    </div>

    @if (output()) {
      <pre class="json">{{ output() }}</pre>
    }
  </demo-section>`}),"components/history/example-lich-su-cap-nhat":t(e({},o["components/history"]),{html:`<demo-section heading="L\u1ECBch s\u1EED c\u1EADp nh\u1EADt" [props]="[{ name: 'items', value: '[\u2026]' }]" note="L\u1ECBch s\u1EED c\u1EADp nh\u1EADt ng\u1EAFn">
    <div class="timeline-box">
      <sd-history [items]="updateLog"></sd-history>
    </div>
  </demo-section>`}),"components/history/example-luong-phe-duyet":t(e({},o["components/history"]),{html:`<demo-section heading="Lu\u1ED3ng ph\xEA duy\u1EC7t" [props]="[{ name: 'items', value: '[\u2026]' }]">
    <div class="timeline-box">
      <sd-history [items]="approvalFlow"></sd-history>
    </div>
  </demo-section>`}),"components/history/example-timeline-rong":t(e({},o["components/history"]),{html:`<demo-section heading="Timeline r\u1ED7ng" [props]="[{ name: 'items', value: '[]' }]">
    <div class="timeline-box">
      <sd-history [items]="[]"></sd-history>
      <p class="empty-note">B\u1EA3n ghi ch\u01B0a c\xF3 l\u1ECBch s\u1EED thay \u0111\u1ED5i.</p>
    </div>
  </demo-section>`}),"components/icon-configuration/example-configuration":t(e({},o["components/icon-configuration"]),{html:`<demo-section
    heading="Configuration"
    [props]="[{ name: 'provideSdIcon', value: 'defaultFontSet: ' + selectedFontSet() }]"
    note="Controls below do not pass fontSet directly; they inherit the value from SD_ICON_CONFIGURATION.">
    <div class="icon-config-toolbar">
      <sd-radio
        label="defaultFontSet"
        [items]="fontSetOptions"
        valueField="value"
        displayField="display"
        [(model)]="selectedFontSet"
        [form]="form">
      </sd-radio>

      <code class="icon-config-snippet">provideSdIcon(&#123; defaultFontSet: '{{ selectedFontSet() }}' &#125;)</code>
    </div>
  </demo-section>`}),"components/icon-configuration/example-core-ui-preview":t(e({},o["components/icon-configuration"]),{html:`<demo-section
    heading="Core UI preview"
    [props]="[{ name: 'defaultFontSet', value: selectedFontSet() }]"
    note="Change the radio and compare primitive icons, SdInput helper/clear icons, SdSelect suffix/search icons, and SdTable command/export/reorder icons.">
    @switch (selectedFontSet()) {
      @case ('material-icons') {
        <app-icon-configuration-preview-material-filled></app-icon-configuration-preview-material-filled>
      }
      @case ('lucide') {
        <app-icon-configuration-preview-lucide></app-icon-configuration-preview-lucide>
      }
      @default {
        <app-icon-configuration-preview-material-outlined></app-icon-configuration-preview-material-outlined>
      }
    }
  </demo-section>`}),"components/icon/example-button-integration":t(e({},o["components/icon"]),{html:`<demo-section
    heading="Button integration"
    [props]="[{ name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' }]">
    <sd-button type="fill" color="primary" title="Material" prefixIcon="add" fontSet="material-icons"></sd-button>
    <sd-button type="light" color="primary" title="Outlined" prefixIcon="save" fontSet="material-icons-outlined"></sd-button>
    <sd-button type="outline" color="error" title="Lucide" prefixIcon="delete" fontSet="lucide"></sd-button>
    <sd-button type="text" color="secondary" title="More" suffixIcon="more_vert" fontSet="lucide"></sd-button>
  </demo-section>`}),"components/icon/example-lucide-explicit":t(e({},o["components/icon"]),{html:`<demo-section heading="Lucide explicit" [props]="[{ name: 'set', value: 'lucide' }]">
    @for (icon of lucideIcons; track icon.name) {
      <span class="icon-demo-item">
        <sd-icon [name]="icon.name" set="lucide" size="lg" [ariaLabel]="icon.label"></sd-icon>
        <span>{{ icon.name }}</span>
      </span>
    }
  </demo-section>`}),"components/icon/example-material-filled":t(e({},o["components/icon"]),{html:`<demo-section heading="Material filled" [props]="[{ name: 'set', value: 'material-icons' }]">
    @for (icon of materialIcons; track icon.name) {
      <span class="icon-demo-item">
        <sd-icon [name]="icon.name" set="material-icons" size="lg" [ariaLabel]="icon.label"></sd-icon>
        <span>{{ icon.name }}</span>
      </span>
    }
  </demo-section>`}),"components/icon/example-material-outlined":t(e({},o["components/icon"]),{html:`<demo-section heading="Material outlined" [props]="[{ name: 'set', value: 'material-icons-outlined' }]">
    @for (icon of materialIcons; track icon.name) {
      <span class="icon-demo-item">
        <sd-icon [name]="icon.name" set="material-icons-outlined" size="lg" [ariaLabel]="icon.label"></sd-icon>
        <span>{{ icon.name }}</span>
      </span>
    }
  </demo-section>`}),"components/icon/example-sizes":t(e({},o["components/icon"]),{html:`<demo-section heading="Sizes" [props]="[{ name: 'size', value: 'sm / md / lg / CSS string' }]">
    @for (size of sizes; track size) {
      <span class="icon-demo-size">
        <sd-icon name="search" set="lucide" [size]="size" ariaLabel="Search"></sd-icon>
        <span>{{ size }}</span>
      </span>
    }
  </demo-section>`}),"components/import-excel/example-import-nhan-vien":t(e({},o["components/import-excel"]),{html:`<demo-section heading="Import nh\xE2n vi\xEAn" [props]="[{ name: 'option', value: 'config' }, { name: 'columns', value: 'def' }]">
    <p class="hint">B\u1EA5m n\xFAt b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 m\u1EDF modal import. C\xF3 th\u1EC3 b\u1EA5m "T\u1EA3i file m\u1EABu" trong modal \u0111\u1EC3 t\u1EA3i template Excel.</p>
    <sd-button
      type="fill"
      color="primary"
      title="M\u1EDF Import Excel"
      prefixIcon="upload_file"
      (click)="excelModal()?.open()">
    </sd-button>
    <sd-import-excel [option]="employeeImport" #excelModalRef></sd-import-excel>
  </demo-section>`}),"components/inform/example-action-custom-projection":t(e({},o["components/inform"]),{html:`<demo-section heading="Action custom (projection)" [props]="[{ name: 'sdInformAction', value: 'template' }]">
    <sd-inform warning title="Ch\u1EBF \u0111\u1ED9 ch\u1EC9 \u0111\u1ECDc" description="B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa.">
      <button sdInformAction class="demo-action-btn">Y\xEAu c\u1EA7u quy\u1EC1n</button>
    </sd-inform>
  </demo-section>`}),"components/inform/example-an-icon":t(e({},o["components/inform"]),{html:`<demo-section heading="\u1EA8n icon" [props]="[{ name: 'hideIcon', value: 'true' }]">
    <sd-inform success hideIcon title="\u0110\xE3 l\u01B0u" description="Kh\xF4ng c\xF3 icon."></sd-inform>
  </demo-section>`}),"components/inform/example-bang-mau":t(e({},o["components/inform"]),{html:`<demo-section heading="B\u1EA3ng m\xE0u" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]">
    <sd-inform primary title="primary" description="Message body."></sd-inform>
    <sd-inform secondary title="secondary" description="Message body."></sd-inform>
    <sd-inform info title="info" description="Message body."></sd-inform>
    <sd-inform success title="success" description="Message body."></sd-inform>
    <sd-inform warning title="warning" description="Message body."></sd-inform>
    <sd-inform error title="error" description="Message body."></sd-inform>
  </demo-section>`}),"components/inform/example-dong-duoc-action":t(e({},o["components/inform"]),{html:`<demo-section heading="\u0110\xF3ng \u0111\u01B0\u1EE3c + action" [props]="[{ name: 'closable', value: 'true' }, { name: 'actionLabel', value: 'text' }]">
    <sd-inform error closable title="Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u" description="M\xE1y ch\u1EE7 kh\xF4ng ph\u1EA3n h\u1ED3i." actionLabel="Th\u1EED l\u1EA1i"></sd-inform>
    <sd-inform info closable title="B\u1EA3n nh\xE1p \u0111\xE3 l\u01B0u" description="T\u1EF1 \u0111\u1ED9ng l\u01B0u l\xFAc 14:30." actionLabel="Xem"></sd-inform>
  </demo-section>`}),"components/inform/example-line-clamp":t(e({},o["components/inform"]),{html:`<demo-section heading="Line-clamp" [props]="[{ name: 'lineClamp', value: '[s\u1ED1]' }]">
    <sd-inform info title="\u0110i\u1EC1u kho\u1EA3n" [description]="long" [lineClamp]="3"></sd-inform>
    <sd-inform success [description]="long" [lineClamp]="2"></sd-inform>
  </demo-section>`}),"components/job-progress/example-details-va-error":t(e({},o["components/job-progress"]),{html:`<demo-section heading="Details v\xE0 error" [props]="[{ name: 'mode', value: 'details' }]">
      <sd-job-progress
        [state]="{
          id: 'failed',
          status: 'failed',
          title: '\u0110\u1ED3ng b\u1ED9 d\u1EEF li\u1EC7u',
          message: 'T\xE1c v\u1EE5 gi\u1EEF l\u1EA1i context \u0111\u1EC3 th\u1EED l\u1EA1i',
          error: 'M\xE1y ch\u1EE7 t\u1EA1m th\u1EDDi kh\xF4ng ph\u1EA3n h\u1ED3i',
        }"
        mode="details"
        (sdRetry)="retryCount.update(increment)"></sd-job-progress>
      <p data-retry-count>Retry events: {{ retryCount() }}</p>
    </demo-section>`}),"components/job-progress/example-determinate-bar":t(e({},o["components/job-progress"]),{html:`<demo-section
      heading="Determinate bar"
      [props]="[
        { name: 'mode', value: 'bar' },
        { name: 'progress', value: determinateState().progress },
      ]">
      <sd-job-progress [state]="determinateState()" (sdCancel)="cancelDirect()"></sd-job-progress>
      <button type="button" (click)="advanceDirect()">Ti\u1EBFn th\xEAm 10%</button>
    </demo-section>`}),"components/job-progress/example-indeterminate-compact":t(e({},o["components/job-progress"]),{html:`<demo-section
      heading="Indeterminate compact"
      [props]="[
        { name: 'mode', value: 'compact' },
        { name: 'aria-valuenow', value: 'omitted' },
      ]">
      <sd-job-progress [state]="{ id: 'queued', status: 'queued', title: '\u0110ang ch\u1EDD t\xE0i nguy\xEAn' }" mode="compact"></sd-job-progress>
    </demo-section>`}),"components/job-progress/example-registry-binding":t(e({},o["components/job-progress"]),{html:`<demo-section
      heading="Registry binding"
      [props]="[
        { name: 'taskId', value: 'showcase-component-task' },
        { name: 'automatic actions', value: 'cancel/retry' },
      ]">
      <sd-job-progress taskId="showcase-component-task" mode="details"></sd-job-progress>
    </demo-section>`}),"components/mini-editor/example-dinh-dang-dau-ra-html":t(e({},o["components/mini-editor"]),{html:`<demo-section heading="\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra HTML" [props]="[{ name: 'outputFormat', value: 'html' }]">
    <div class="editor-box">
      <sd-mini-editor
        [option]="commentOption"
        [(ngModel)]="commentContent">
      </sd-mini-editor>
      <p class="hint">\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra: HTML</p>
    </div>
  </demo-section>`}),"components/mini-editor/example-dinh-dang-dau-ra-markdown":t(e({},o["components/mini-editor"]),{html:`<demo-section heading="\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra Markdown" [props]="[{ name: 'outputFormat', value: 'markdown' }]">
    <div class="editor-box">
      <sd-mini-editor
        [option]="markdownOption"
        [(ngModel)]="markdownContent">
      </sd-mini-editor>
      <p class="hint">\u0110\u1ECBnh d\u1EA1ng \u0111\u1EA7u ra: Markdown</p>
    </div>
  </demo-section>`}),"components/modal/example-basic-modal-footer-right":t(e({},o["components/modal"]),{html:`<demo-section heading="Basic modal + footer right" [props]="[{ name: 'sdFooterRight', value: 'template' }, { name: 'body padding', value: 0 }]">
    <sd-button type="fill" color="primary" prefixIcon="info" title="Open detail" (click)="basic.open()"></sd-button>

    <sd-modal #basic title="Customer detail" width="md">
      <div class="demo-stack">
        <sd-section icon="person" title="Profile">
          <sd-section-item label="Name">Nguyen Van An</sd-section-item>
          <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
          <sd-section-item label="Status">
            <sd-badge type="round" success title="Active"></sd-badge>
          </sd-section-item>
        </sd-section>
      </div>

      <sd-button sdFooterRight type="fill" color="primary" title="Close" (click)="basic.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-bottom-sheet-actions":t(e({},o["components/modal"]),{html:`<demo-section heading="Bottom-sheet actions" [props]="[{ name: 'view', value: 'bottom-sheet' }, { name: 'sdFooterRight', value: 'template' }]">
    <sd-button type="outline" color="primary" prefixIcon="more_vert" title="Open actions" (click)="sheetActions.open()"></sd-button>

    <sd-modal #sheetActions title="Quick actions" view="bottom-sheet" width="100%">
      <div class="sheet-stack">
        <sd-button type="text" color="primary" prefixIcon="edit" title="Edit" (click)="sheetActions.close()"></sd-button>
        <sd-button type="text" color="primary" prefixIcon="share" title="Share" (click)="sheetActions.close()"></sd-button>
        <sd-button type="text" color="error" prefixIcon="delete" title="Delete" (click)="sheetActions.close()"></sd-button>
      </div>

      <sd-button sdFooterRight type="text" color="secondary" title="Cancel" (click)="sheetActions.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-bottom-sheet-form":t(e({},o["components/modal"]),{html:`<demo-section heading="Bottom-sheet form" [props]="[{ name: 'view', value: 'bottom-sheet' }, { name: 'sdFooterLeft/right', value: 'template' }]">
    <sd-button type="light" color="primary" prefixIcon="schedule" title="Pick time" (click)="sheetForm.open()"></sd-button>

    <sd-modal #sheetForm title="Pick a delivery time" view="bottom-sheet" width="100%">
      <div class="sheet-stack">
        @for (slot of deliverySlots; track slot.time) {
          <button type="button" class="time-option" (click)="sheetForm.close()">
            <strong>{{ slot.time }}</strong>
            <span>{{ slot.note }}</span>
          </button>
        }
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Cancel" (click)="sheetForm.close()"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Confirm" (click)="sheetForm.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-confirm-modal-split-footer":t(e({},o["components/modal"]),{html:`<demo-section heading="Confirm modal + split footer" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
    <sd-button type="fill" color="error" prefixIcon="delete" title="Delete record" (click)="confirm.open()"></sd-button>

    <sd-modal #confirm title="Delete customer" width="sm">
      <div class="demo-stack">
        <p class="demo-copy">Delete <strong>Nguyen Van An</strong>? This action cannot be undone.</p>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Cancel" (click)="confirm.close()"></sd-button>
      <sd-button sdFooterRight type="fill" color="error" title="Delete" prefixIcon="delete" (click)="confirm.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-custom-header-left-right":t(e({},o["components/modal"]),{html:`<demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
    <sd-button type="light" color="primary" prefixIcon="history" title="Open activity" (click)="activity.open()"></sd-button>

    <sd-modal #activity title="Activity log" width="lg">
      <div sdHeaderLeft class="demo-title-block">
        <strong>Activity log</strong>
        <span>Last 7 days</span>
      </div>
      <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Refresh"></sd-button>

      <div class="demo-stack">
        <div class="demo-list">
          @for (row of activityRows; track row.time) {
            <div class="demo-list__row">
              <span>{{ row.time }}</span>
              <strong>{{ row.actor }}</strong>
              <span>{{ row.action }}</span>
            </div>
          }
        </div>
      </div>

      <sd-button sdFooterRight type="text" color="secondary" title="Close" (click)="activity.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-long-scroll-body":t(e({},o["components/modal"]),{html:`<demo-section heading="Long scroll body" [props]="[{ name: 'max-height', value: '80vh' }, { name: 'body', value: 'scrollable' }]">
    <sd-button type="outline" color="primary" prefixIcon="list" title="Open long content" (click)="longContent.open()"></sd-button>

    <sd-modal #longContent title="Long approval checklist" width="md">
      <div class="demo-stack">
        <div class="demo-list">
          @for (item of checklist; track item) {
            <div class="demo-list__row">
              <span>{{ item }}</span>
              <sd-badge type="round" info title="Required"></sd-badge>
            </div>
          }
        </div>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Skip"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Done" (click)="longContent.close()"></sd-button>
    </sd-modal>
  </demo-section>`}),"components/modal/example-read-only-modal-without-footer":t(e({},o["components/modal"]),{html:`<demo-section heading="Read-only modal without footer" [props]="[{ name: 'footer', value: 'empty hidden' }]">
    <sd-button type="outline" color="primary" prefixIcon="visibility" title="Preview note" (click)="preview.open()"></sd-button>

    <sd-modal #preview title="Internal note" width="sm">
      <div class="demo-stack">
        <p class="demo-copy">This modal has no footer slots. The footer container stays hidden so read-only content can remain compact.</p>
      </div>
    </sd-modal>
  </demo-section>`}),"components/operator/example-toan-tu-chuoi":t(e({},o["components/operator"]),{html:`<demo-section heading="To\xE1n t\u1EED chu\u1ED7i" [props]="[{ name: 'operators', value: 'string' }]">
    <span class="row-label">H\u1ECD t\xEAn</span>
    <sd-operator [(model)]="stringOp" [operators]="stringOps"></sd-operator>
    <span class="row-value">{{ stringOp() ?? '\u2014' }}</span>
  </demo-section>`}),"components/operator/example-toan-tu-ngay":t(e({},o["components/operator"]),{html:`<demo-section heading="To\xE1n t\u1EED ng\xE0y" [props]="[{ name: 'operators', value: 'date' }]">
    <span class="row-label">Ng\xE0y t\u1EA1o</span>
    <sd-operator [(model)]="dateOp" [operators]="dateOps"></sd-operator>
    <span class="row-value">{{ dateOp() ?? '\u2014' }}</span>
  </demo-section>`}),"components/operator/example-toan-tu-so":t(e({},o["components/operator"]),{html:`<demo-section heading="To\xE1n t\u1EED s\u1ED1" [props]="[{ name: 'operators', value: 'number' }]">
    <span class="row-label">L\u01B0\u01A1ng</span>
    <sd-operator [(model)]="numberOp" [operators]="numberOps"></sd-operator>
    <span class="row-value">{{ numberOp() ?? '\u2014' }}</span>
  </demo-section>`}),"components/operator/example-vo-hieu-hoa":t(e({},o["components/operator"]),{html:`<demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]">
    <span class="row-label">disabled</span>
    <sd-operator [(model)]="stringOp" [operators]="stringOps" [disabled]="true"></sd-operator>
  </demo-section>`}),"components/org-chart/example-card-mac-dinh":t(e({},o["components/org-chart"]),{html:`<demo-section
    heading="Card m\u1EB7c \u0111\u1ECBnh"
    [props]="[
      { name: 'items', value: 'SdOrgChartItem[]' },
      { name: 'collapsible', value: 'true' },
    ]">
    <div class="org-demo-stage">
      <sd-org-chart [items]="basicItems" autoId="basic"></sd-org-chart>
    </div>
  </demo-section>`}),"components/org-chart/example-custom-bang-directive":t(e({},o["components/org-chart"]),{html:`<demo-section
    heading="Custom b\u1EB1ng directive"
    [props]="[
      { name: 'sdOrgChartItemDef', value: 'template' },
      { name: 'context', value: 'item / depth / toggle' },
    ]">
    <div class="org-demo-stage">
      <sd-org-chart [items]="compactItems" autoId="directive-template">
        <ng-template sdOrgChartItemDef let-item let-depth="depth" let-hasChildren="hasChildren" let-toggle="toggle">
          <button
            type="button"
            class="org-custom-card"
            [class.org-custom-card--leaf]="!hasChildren"
            [style.border-color]="item.color || '#d9e2ef'"
            (click)="toggle()">
            <span class="org-custom-card__level">L{{ depth + 1 }}</span>
            <strong>{{ item.title }}</strong>
            @if (item.description) {
              <small>{{ item.description }}</small>
            }
          </button>
        </ng-template>
      </sd-org-chart>
    </div>
  </demo-section>`}),"components/org-chart/example-custom-bang-templateref-input":t(e({},o["components/org-chart"]),{html:`<demo-section
    heading="Custom b\u1EB1ng TemplateRef input"
    [props]="[
      { name: 'itemTemplate', value: 'TemplateRef' },
      { name: 'collapsible', value: 'false' },
    ]">
    <ng-template #teamNode let-item let-isLeaf="isLeaf">
      <div class="org-template-node" [class.org-template-node--leaf]="isLeaf">
        @if (item.image) {
          <img [src]="item.image" [alt]="item.title" />
        }
        <span>{{ item.title }}</span>
        @if (item.description) {
          <small>{{ item.description }}</small>
        }
      </div>
    </ng-template>

    <div class="org-demo-stage">
      <sd-org-chart [items]="compactItems" [itemTemplate]="teamNode" [collapsible]="false" autoId="input-template"></sd-org-chart>
    </div>
  </demo-section>`}),"components/org-chart/example-node-co-mau":t(e({},o["components/org-chart"]),{html:`<demo-section
    heading="Node c\xF3 m\xE0u"
    note="M\u1ED7i item truy\u1EC1n color ri\xEAng; node kh\xF4ng c\xF3 image v\xE0 description t\u1EF1 chuy\u1EC3n sang compact card."
    [props]="[
      { name: 'color', value: '#hex' },
      { name: 'expanded', value: 'boolean' },
    ]">
    <div class="org-demo-stage">
      <sd-org-chart [items]="coloredItems" autoId="colored"></sd-org-chart>
    </div>
  </demo-section>`}),"components/preview/example-anh-don":t(e({},o["components/preview"]),{html:`<demo-section heading="\u1EA2nh \u0111\u01A1n" [props]="[{ name: 'thumbnailPosition', value: 'none' }]">
      <div class="preview-box">
        <sd-preview-image [items]="[singleImage]" thumbnailPosition="none"></sd-preview-image>
      </div>
    </demo-section>`}),"components/preview/example-pdf-nang-cao":t(e({},o["components/preview"]),{html:`<demo-section
      heading="PDF n\xE2ng cao"
      [props]="[
        { name: 'sidebar', value: 'outline' },
        { name: 'scrollMode', value: 'continuous' },
        { name: 'fixture', value: '3 pages + PDF Outlines' },
        { name: 'print', value: 'header action / Ctrl+P' },
      ]">
      <div class="preview-box preview-box--advanced-pdf">
        <sd-preview-pdf [source]="pdfSource()" sidebar="outline" scrollMode="continuous"></sd-preview-pdf>
      </div>
    </demo-section>`}),"components/preview/example-thu-vien-anh":t(e({},o["components/preview"]),{html:`<demo-section heading="Th\u01B0 vi\u1EC7n \u1EA3nh" [props]="[{ name: 'items', value: '[\u2026]' }]">
      <div class="preview-box">
        <sd-preview-image [items]="images" [startIndex]="0"></sd-preview-image>
      </div>
    </demo-section>`}),"components/preview/example-xem-pdf":t(e({},o["components/preview"]),{html:`<demo-section
      heading="Xem PDF"
      [props]="[
        { name: 'source', value: 'local 3-page fixture' },
        { name: 'sidebar', value: 'thumbnails' },
      ]">
      <div class="preview-box">
        <sd-preview-pdf [source]="pdfSource()" sidebar="thumbnails"></sd-preview-pdf>
      </div>
    </demo-section>`}),"components/query-bar/example-che-do-inline":t(e({},o["components/query-bar"]),{html:`<demo-section heading="Ch\u1EBF \u0111\u1ED9 inline" [props]="[{ name: 'mode', value: 'inline' }]" note="Chip values b\u1EA5m v\xE0o gi\xE1 tr\u1ECB \u0111\u1EC3 s\u1EEDa inline (m\u1EDF panel ngay, kh\xF4ng hi\u1EC7n \xF4 input r\u1EDDi); b\u1EA5m ra ngo\xE0i quay v\u1EC1 text. D\xF9ng sd-select [viewed]='inline'.">
    <div class="bar-box">
      <sd-query-bar
        [fields]="fields"
        [(filters)]="inlineFilters"
        [(logic)]="logic"
        mode="inline"
        density="compact"
        [showLogicToggle]="true"
        [showOperatorOnChip]="true"
        (apply)="onApply()">
      </sd-query-bar>
    </div>
  </demo-section>`}),"components/query-bar/example-che-do-popover":t(e({},o["components/query-bar"]),{html:`<demo-section heading="Ch\u1EBF \u0111\u1ED9 popover" [props]="[{ name: 'mode', value: 'popover' }]">
    <div class="bar-box">
      <sd-query-bar
        [fields]="fields"
        [(filters)]="filters"
        [(logic)]="logic"
        [(search)]="search"
        mode="popover"
        [showSearch]="true"
        [showLogicToggle]="true"
        [showClearAll]="true"
        (apply)="onApply()">
      </sd-query-bar>
    </div>
  </demo-section>`}),"components/query-builder/example-bat-dau-trong-dung-tu-dau":t(e({},o["components/query-builder"]),{html:`<demo-section
    heading="B\u1EAFt \u0111\u1EA7u tr\u1ED1ng (d\u1EF1ng t\u1EEB \u0111\u1EA7u)"
    note="value kh\u1EDFi t\u1EA1o null. B\u1EA5m + \u2192 \u0110i\u1EC1u ki\u1EC7n \u0111\u1EC3 th\xEAm rule \u0111\u1EA7u ti\xEAn; ch\u1ECDn tr\u01B0\u1EDDng \u0111\u1EC3 hi\u1EC7n to\xE1n t\u1EED + value editor. Panel JSON c\u1EADp nh\u1EADt realtime."
    [props]="[{ name: 'value', value: 'null' }]">
    <div class="builder-box">
      <sd-query-builder [fields]="fields" [(value)]="emptyValue"></sd-query-builder>
    </div>
    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="emptyValue()" viewed maxHeight="240px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/query-builder/example-disabled":t(e({},o["components/query-builder"]),{html:`<demo-section heading="Disabled" [props]="[{ name: 'disabled', value: 'true' }]">
    <div class="builder-box">
      <sd-query-builder [fields]="fields" [value]="seeded" disabled></sd-query-builder>
    </div>
  </demo-section>`}),"components/query-builder/example-edit-view":t(e({},o["components/query-builder"]),{html:`<demo-section heading="Edit / View" [props]="[{ name: 'fields', value: 'SdQueryBuilderField[]' }, { name: 'value', value: 'Filter | null' }, { name: 'mode', value: 'edit | view' }]">
    <div class="qb-demo-toolbar">
      <button type="button" class="qb-demo-btn" [class.active]="mode() === 'edit'" (click)="mode.set('edit')">Edit</button>
      <button type="button" class="qb-demo-btn" [class.active]="mode() === 'view'" (click)="mode.set('view')">View</button>
    </div>

    <div class="builder-box">
      <sd-query-builder [fields]="fields" [mode]="mode()" [(value)]="value"></sd-query-builder>
    </div>

    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="value()" viewed maxHeight="280px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/query-builder/example-moi-loai-truong-value-editor-theo-type":t(e({},o["components/query-builder"]),{html:`<demo-section
    heading="M\u1ECDi lo\u1EA1i tr\u01B0\u1EDDng (value editor theo type)"
    note="M\u1ED7i type render m\u1ED9t value editor ri\xEAng: string \u2192 \xF4 text, number \u2192 \xF4 s\u1ED1 (+ BETWEEN hai \u0111\u1EA7u), boolean \u2192 select C\xF3/Kh\xF4ng, values \u2192 multi-select, date \u2192 date picker, datetime \u2192 datetime picker."
    [props]="[{ name: 'type', value: 'string / number / boolean / values / date / datetime' }]">
    <div class="builder-box">
      <sd-query-builder [fields]="fields" [(value)]="allTypesValue"></sd-query-builder>
    </div>
    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="allTypesValue()" viewed maxHeight="320px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/query-builder/example-ngay-tuong-doi":t(e({},o["components/query-builder"]),{html:`<demo-section
    heading="Ng\xE0y t\u01B0\u01A1ng \u0111\u1ED1i"
    note="V\u1EDBi date/datetime + to\xE1n t\u1EED \u0111\u01A1n (=, !=, >, <), ch\u1ECDn 'H\xF4m nay' ho\u1EB7c 'T\u01B0\u01A1ng \u0111\u1ED1i' (N ng\xE0y/tu\u1EA7n/th\xE1ng tr\u01B0\u1EDBc\xB7t\u1EDBi). Emit ra Filter.data d\u1EA1ng { rel, unit, amount, direction }. BETWEEN kh\xF4ng c\xF3 ch\u1EBF \u0111\u1ED9 t\u01B0\u01A1ng \u0111\u1ED1i."
    [props]="[{ name: 'fields', value: 'date | datetime' }, { name: 'value', value: '{ rel, unit, amount, direction }' }]">
    <div class="builder-box">
      <sd-query-builder [fields]="fields" [(value)]="relativeValue"></sd-query-builder>
    </div>
    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="relativeValue()" viewed maxHeight="280px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/query-builder/example-nhom-and-or-long-nhau":t(e({},o["components/query-builder"]),{html:`<demo-section
    heading="Nh\xF3m AND/OR l\u1ED3ng nhau"
    note="B\u1EA5m + \u2192 Nh\xF3m \u0111\u1EC3 t\u1EA1o nh\xF3m con. Nh\xF3m con nhi\u1EC1u \u0111i\u1EC1u ki\u1EC7n \u0111\u01B0\u1EE3c b\u1ECDc ngo\u1EB7c ( \u2026 ) khi xem \u1EDF ch\u1EBF \u0111\u1ED9 View."
    [props]="[{ name: 'operator', value: 'AND / OR' }, { name: 'mode', value: 'edit | view' }]">
    <div class="qb-demo-toolbar">
      <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'edit'" (click)="nestedMode.set('edit')">Edit</button>
      <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'view'" (click)="nestedMode.set('view')">View</button>
    </div>
    <div class="builder-box">
      <sd-query-builder [fields]="fields" [mode]="nestedMode()" [(value)]="nestedValue"></sd-query-builder>
    </div>
    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="nestedValue()" viewed maxHeight="320px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/query-builder/example-so-sanh-giua-cac-truong":t(e({},o["components/query-builder"]),{html:`<demo-section
    heading="So s\xE1nh gi\u1EEFa c\xE1c tr\u01B0\u1EDDng"
    note="B\u1EADt comparisonMode='value-or-field' \u0111\u1EC3 m\u1ED7i rule c\xF3 th\u1EC3 ch\u1ECDn nh\u1EADp gi\xE1 tr\u1ECB ho\u1EB7c so s\xE1nh v\u1EDBi m\u1ED9t field kh\xE1c c\xF9ng type. Field b\xEAn ph\u1EA3i emit ra Filter d\u1EA1ng { dataType: 'field', data: '<fieldKey>' }."
    [props]="[{ name: 'comparisonMode', value: 'value-or-field' }, { name: 'dataType', value: 'field' }]">
    <div class="builder-box">
      <sd-query-builder [fields]="fields" comparisonMode="value-or-field" [(value)]="fieldComparisonValue"></sd-query-builder>
    </div>
    <div class="qb-demo-preview">
      <strong>View</strong>
      <sd-query-builder [fields]="fields" [value]="fieldComparisonValue()" mode="view"></sd-query-builder>
    </div>
    <div class="qb-demo-out">
      <strong>Filter</strong>
      <sd-code-editor language="json" [model]="fieldComparisonValue()" viewed maxHeight="280px"></sd-code-editor>
    </div>
  </demo-section>`}),"components/quick-action/example-bulk-action-nhieu-dong":t(e({},o["components/quick-action"]),{html:`<demo-section heading="Bulk action \u2014 nhi\u1EC1u d\xF2ng" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }, { name: 'sdAction', value: 'template' }]">
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <sd-button type="light" color="primary" prefixIcon="add_circle" title="Th\xEAm ch\u1ECDn (+1 d\xF2ng)" (click)="addSelection()"></sd-button>
      <sd-button type="light" color="secondary" prefixIcon="remove_circle" title="B\u1ECF ch\u1ECDn (-1)" (click)="removeSelection()"></sd-button>
      <sd-button type="outline" color="secondary" prefixIcon="clear_all" title="X\xF3a h\u1EBFt" (click)="clearSelection()"></sd-button>
      <span style="color: #555; font-size: 13px;">\u0110\xE3 ch\u1ECDn: <strong>{{ selectedCount() }}</strong> d\xF2ng</span>
    </div>

    <sd-quick-action [opened]="hasSelection()">
      <div sdMessage>\u0110\xE3 ch\u1ECDn <strong>{{ selectedCount() }}</strong> b\u1EA3n ghi</div>
      <div sdAction style="display: flex; gap: 8px;">
        <sd-button type="fill" color="primary" prefixIcon="check" title="Ph\xEA duy\u1EC7t" (click)="bulkApprove()"></sd-button>
        <sd-button type="outline" color="error" prefixIcon="delete" title="X\xF3a" (click)="bulkDelete()"></sd-button>
        <sd-button type="text" color="secondary" prefixIcon="close" tooltip="B\u1ECF ch\u1ECDn" (click)="clearSelection()"></sd-button>
      </div>
    </sd-quick-action>
  </demo-section>`}),"components/quick-action/example-thong-bao-trang-thai":t(e({},o["components/quick-action"]),{html:`<demo-section heading="Th\xF4ng b\xE1o tr\u1EA1ng th\xE1i" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }]">
    <sd-button type="light" color="primary" prefixIcon="sync" title="B\u1EADt / t\u1EAFt \u0111\u1ED3ng b\u1ED9" (click)="toggleSync()"></sd-button>

    <sd-quick-action [opened]="syncing()">
      <span sdMessage>\u0110ang \u0111\u1ED3ng b\u1ED9 d\u1EEF li\u1EC7u...</span>
    </sd-quick-action>
  </demo-section>`}),"components/quick-action/example-undo-toast":t(e({},o["components/quick-action"]),{html:`<demo-section heading="Undo toast" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdAction', value: 'template' }]">
    <sd-button type="light" color="error" prefixIcon="delete" title="X\xF3a b\u1EA3n ghi" (click)="simulateDelete()"></sd-button>

    <sd-quick-action [opened]="lastDeleted() !== null">
      <span sdMessage>\u0110\xE3 x\xF3a <strong>{{ lastDeleted() }}</strong>.</span>
      <sd-button sdAction type="text" color="primary" prefixIcon="undo" title="Ho\xE0n t\xE1c" (click)="undo()"></sd-button>
    </sd-quick-action>
  </demo-section>`}),"components/section/example-basic-info-rows":t(e({},o["components/section"]),{html:`<demo-section heading="Basic info rows" [props]="[{ name: 'header padding', value: '8px 16px' }, { name: 'body padding', value: 0 }]">
    <sd-section
      icon="info"
      iconColor="primary"
      title="General info"
      subTitle="Basic employee profile"
      class="demo-section-card">
      <sd-section-item label="Name">Nguyen Van An</sd-section-item>
      <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
      <sd-section-item label="Phone">0901 234 567</sd-section-item>
      <sd-section-item label="Department">
        <sd-badge type="round" primary title="Sales"></sd-badge>
      </sd-section-item>
    </sd-section>
  </demo-section>`}),"components/section/example-collapsible-section":t(e({},o["components/section"]),{html:`<demo-section heading="Collapsible section" [props]="[{ name: 'collapsible', value: true }, { name: '[(collapsed)]', value: 'two-way' }]">
    <sd-section
      icon="filter_list"
      title="Advanced filters"
      subTitle="Click the header to collapse"
      [collapsible]="true"
      [(collapsed)]="filterCollapsed"
      class="demo-section-card">
      <sd-section-item label="Status">Active</sd-section-item>
      <sd-section-item label="Created at">01/01/2026 - 31/12/2026</sd-section-item>
      <sd-section-item label="Type">Enterprise customer</sd-section-item>
    </sd-section>
    <p class="section-state">State: <strong>{{ filterCollapsed() ? 'Collapsed' : 'Expanded' }}</strong></p>
  </demo-section>`}),"components/section/example-custom-header-left-right":t(e({},o["components/section"]),{html:`<demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
    <sd-section class="demo-section-card">
      <div sdHeaderLeft class="section-title-block">
        <strong>Project members</strong>
        <span>3 active members</span>
      </div>
      <sd-button sdHeaderRight type="outline" color="primary" size="sm" prefixIcon="download" tooltip="Export"></sd-button>
      <sd-button sdHeaderRight type="fill" color="primary" size="sm" prefixIcon="add" title="Add"></sd-button>

      <sd-section-item label="Owner">Tran Thi Bich</sd-section-item>
      <sd-section-item label="Members">Le Minh Hoang, Pham Quynh Anh, Do Van Dat</sd-section-item>
    </sd-section>
  </demo-section>`}),"components/section/example-footer-left-right":t(e({},o["components/section"]),{html:`<demo-section heading="Footer left/right" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
    <sd-section icon="rule" title="Approval summary" class="demo-section-card">
      <sd-section-item label="Risk level">
        <sd-badge type="round" warning title="Medium"></sd-badge>
      </sd-section-item>
      <sd-section-item label="SLA">2 business days</sd-section-item>

      <sd-button sdFooterLeft type="text" color="secondary" title="View history"></sd-button>
      <sd-button sdFooterRight type="text" color="secondary" title="Reject"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Approve"></sd-button>
    </sd-section>
  </demo-section>`}),"components/section/example-full-width-content-with-body-padding-0":t(e({},o["components/section"]),{html:`<demo-section heading="Full-width content with body padding 0" [props]="[{ name: 'body', value: 'padding 0' }, { name: 'legacy padding option', value: 'removed' }]">
    <sd-section icon="table_chart" title="Recent transactions" class="demo-section-card">
      <div class="mini-table">
        <div class="mini-table__head">
          <span>Code</span>
          <span>Owner</span>
          <span>Status</span>
        </div>
        @for (row of transactions; track row.code) {
          <div class="mini-table__row">
            <strong>{{ row.code }}</strong>
            <span>{{ row.owner }}</span>
            <sd-badge type="round" [color]="row.color" [title]="row.status"></sd-badge>
          </div>
        }
      </div>
    </sd-section>
  </demo-section>`}),"components/section/example-headerless-card-with-manual-body-padding":t(e({},o["components/section"]),{html:`<demo-section heading="Headerless card with manual body padding" [props]="[{ name: 'hideHeader', value: true }, { name: 'body wrapper', value: 'custom padding' }]">
    <sd-section [hideHeader]="true" class="demo-section-card">
      <div class="section-padded-body">
        <strong>Headerless note</strong>
        <p>Because section body has padding 0, free-form content should add its own wrapper when it needs breathing room.</p>
      </div>
    </sd-section>
  </demo-section>`}),"components/section/example-section-item-rich-values":t(e({},o["components/section"]),{html:`<demo-section heading="Section item rich values" [props]="[{ name: 'labelWidth', value: '180px' }, { name: 'value', value: 'rich content' }]">
    <sd-section icon="badge" title="Role assignment" class="demo-section-card">
      <sd-section-item label="Primary role" labelWidth="180px">
        <div class="value-stack">
          <strong>Branch Manager</strong>
          <span>Can approve requests up to 50M VND</span>
        </div>
      </sd-section-item>
      <sd-section-item label="Tags" labelWidth="180px">
        <div class="badge-row">
          <sd-badge type="round" primary title="Finance"></sd-badge>
          <sd-badge type="round" info title="Approver"></sd-badge>
          <sd-badge type="round" success title="Active"></sd-badge>
        </div>
      </sd-section-item>
    </sd-section>
  </demo-section>`}),"components/side-drawer/example-create-drawer-split-footer":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Create drawer + split footer" [props]="[{ name: 'sdFooterLeft', value: 'template' }, { name: 'sdFooterRight', value: 'template' }]">
    <sd-button type="fill" color="primary" prefixIcon="add" title="Create employee" (click)="createDrawer.open()"></sd-button>

    <sd-side-drawer #createDrawer title="Create employee" width="480px">
      <div class="drawer-stack">
        <sd-section icon="person" title="Personal info">
          <sd-section-item label="Name">Nguyen Van An</sd-section-item>
          <sd-section-item label="Email">an.nv&#64;onemount.com</sd-section-item>
          <sd-section-item label="Phone">0901 234 567</sd-section-item>
        </sd-section>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Reset"></sd-button>
      <sd-button sdFooterRight type="text" color="secondary" title="Cancel" (click)="createDrawer.close()"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Save" prefixIcon="save" (click)="createDrawer.close()"></sd-button>
    </sd-side-drawer>
  </demo-section>`}),"components/side-drawer/example-custom-header-left-right":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Custom header left/right" [props]="[{ name: 'sdHeaderLeft', value: 'template' }, { name: 'sdHeaderRight', value: 'template' }]">
    <sd-button type="outline" color="primary" prefixIcon="visibility" title="Open profile" (click)="profileDrawer.open()"></sd-button>

    <sd-side-drawer #profileDrawer title="Profile" width="560px">
      <div sdHeaderLeft class="drawer-title-block">
        <strong>Employee profile</strong>
        <span>EMP-2026-0012</span>
      </div>
      <sd-button sdHeaderRight type="text" color="primary" prefixIcon="print" tooltip="Print"></sd-button>
      <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Refresh"></sd-button>

      <div class="drawer-stack">
        <sd-section icon="badge" title="Overview">
          <sd-section-item label="Department">Sales</sd-section-item>
          <sd-section-item label="Manager">Tran Thi Bich</sd-section-item>
          <sd-section-item label="Status">
            <sd-badge type="round" success title="Active"></sd-badge>
          </sd-section-item>
        </sd-section>
        <sd-section icon="notes" title="Note">
          <div class="drawer-copy">The drawer body has no built-in padding, so this demo uses a .drawer-stack wrapper.</div>
        </sd-section>
      </div>

      <sd-button sdFooterRight type="text" color="secondary" title="Close" (click)="profileDrawer.close()"></sd-button>
    </sd-side-drawer>
  </demo-section>`}),"components/side-drawer/example-filter-drawer":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Filter drawer" [props]="[{ name: 'disableBackdropClose', value: false }, { name: 'footer', value: 'left/right' }]">
    <sd-button type="outline" color="primary" prefixIcon="filter_list" title="Open filters" (click)="filterDrawer.open()"></sd-button>

    <sd-side-drawer #filterDrawer title="Advanced filters" width="420px">
      <sd-button sdHeaderRight type="text" color="primary" prefixIcon="refresh" tooltip="Reset filters"></sd-button>

      <div class="drawer-stack">
        <sd-section icon="tune" title="Criteria">
          <sd-section-item label="Date range">01/01/2026 - 31/12/2026</sd-section-item>
          <sd-section-item label="Status">Active</sd-section-item>
          <sd-section-item label="Department">Sales, Marketing</sd-section-item>
        </sd-section>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Clear"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Apply" (click)="filterDrawer.close()"></sd-button>
    </sd-side-drawer>
  </demo-section>`}),"components/side-drawer/example-locked-drawer-with-explicit-actions":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Locked drawer with explicit actions" [props]="[{ name: 'disableBackdropClose', value: true }, { name: 'hideClose', value: true }]">
    <sd-button type="fill" color="primary" prefixIcon="lock" title="Open locked drawer" (click)="lockedDrawer.open()"></sd-button>

    <sd-side-drawer #lockedDrawer title="Required decision" width="460px" disableBackdropClose hideClose>
      <div class="drawer-stack">
        <p class="drawer-copy">Backdrop and close icon are disabled. The user must choose one explicit footer action.</p>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Reject" (click)="lockedDrawer.close()"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Approve" (click)="lockedDrawer.close()"></sd-button>
    </sd-side-drawer>
  </demo-section>`}),"components/side-drawer/example-long-scroll-content":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Long scroll content" [props]="[{ name: 'content', value: 'overflow auto' }, { name: 'width', value: '520px' }]">
    <sd-button type="light" color="primary" prefixIcon="list" title="Open checklist" (click)="checklistDrawer.open()"></sd-button>

    <sd-side-drawer #checklistDrawer title="Approval checklist" width="520px">
      <div class="drawer-stack">
        <div class="drawer-list">
          @for (item of checklist; track item) {
            <div class="drawer-list__row">
              <span>{{ item }}</span>
              <sd-badge type="round" info title="Required"></sd-badge>
            </div>
          }
        </div>
      </div>

      <sd-button sdFooterLeft type="text" color="secondary" title="Back" (click)="checklistDrawer.close()"></sd-button>
      <sd-button sdFooterRight type="fill" color="primary" title="Submit" (click)="checklistDrawer.close()"></sd-button>
    </sd-side-drawer>
  </demo-section>`}),"components/side-drawer/example-read-only-drawer-without-footer":t(e({},o["components/side-drawer"]),{html:`<demo-section heading="Read-only drawer without footer" [props]="[{ name: 'footer', value: 'empty hidden' }]">
    <sd-button type="outline" color="primary" prefixIcon="description" title="Open detail" (click)="readonlyDrawer.open()"></sd-button>

    <sd-side-drawer #readonlyDrawer title="Request detail" width="500px">
      <div class="drawer-stack">
        <sd-section icon="description" title="Request">
          <sd-section-item label="Code">REQ-2026-0042</sd-section-item>
          <sd-section-item label="Owner">Tran Thi Bich</sd-section-item>
          <sd-section-item label="Created at">09/05/2026</sd-section-item>
        </sd-section>
        <p class="drawer-copy">No footer slots are projected here, so the action bar is hidden.</p>
      </div>
    </sd-side-drawer>
  </demo-section>`}),"components/splitter/example-doc-3-panel-px-co-dinh":t(e({},o["components/splitter"]),{html:`<demo-section heading="D\u1ECDc 3 panel (px c\u1ED1 \u0111\u1ECBnh)" [props]="[{ name: 'orientation', value: 'vertical' }, { name: 'unit', value: 'px' }]">
    <div class="wrap" style="height: 320px;">
      <sd-splitter orientation="vertical">
        <sd-splitter-panel [size]="64" unit="px">
          <div class="pane bg-blue">Header \u2014 64px c\u1ED1 \u0111\u1ECBnh</div>
        </sd-splitter-panel>
        <sd-splitter-panel [size]="1" unit="flex">
          <div class="pane bg-grey">N\u1ED9i dung \u2014 flex 1</div>
        </sd-splitter-panel>
        <sd-splitter-panel [size]="100" unit="px">
          <div class="pane bg-blue">Footer \u2014 100px</div>
        </sd-splitter-panel>
      </sd-splitter>
    </div>
  </demo-section>`}),"components/splitter/example-ngang-2-panel-flex":t(e({},o["components/splitter"]),{html:`<demo-section heading="Ngang 2 panel (flex)" [props]="[{ name: 'orientation', value: 'horizontal' }, { name: 'unit', value: 'flex' }]">
    <div class="wrap" style="height: 240px;">
      <sd-splitter orientation="horizontal">
        <sd-splitter-panel [size]="1" unit="flex">
          <div class="pane bg-blue">Sidebar (1)</div>
        </sd-splitter-panel>
        <sd-splitter-panel [size]="3" unit="flex">
          <div class="pane bg-grey">N\u1ED9i dung ch\xEDnh (3)</div>
        </sd-splitter-panel>
      </sd-splitter>
    </div>
  </demo-section>`}),"components/splitter/example-panel-gap-voi-api-ngoai":t(e({},o["components/splitter"]),{html:`<demo-section heading="Panel g\u1EADp v\u1EDBi API ngo\xE0i" [props]="[{ name: 'collapsible', value: 'true' }, { name: 'toggle()', value: 'method' }, { name: 'resetLayout()', value: 'method' }]">
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <sd-button type="light" color="primary" prefixIcon="menu_open" title="G\u1EADp / m\u1EDF sidebar" (click)="toggleSidebar()"></sd-button>
      <sd-button type="light" color="secondary" prefixIcon="restart_alt" title="Reset layout" (click)="reset()"></sd-button>
    </div>

    <div class="wrap" style="height: 280px;">
      <sd-splitter #apiSplitter orientation="horizontal">
        <sd-splitter-panel panelId="sidebar" [size]="240" unit="px" [minSize]="100" [collapsible]="true">
          <div class="pane bg-blue">Sidebar (collapsible)</div>
        </sd-splitter-panel>
        <sd-splitter-panel panelId="main" [size]="1" unit="flex">
          <div class="pane bg-grey">N\u1ED9i dung ch\xEDnh</div>
        </sd-splitter-panel>
        <sd-splitter-panel panelId="detail" [size]="320" unit="px" [minSize]="200" [collapsible]="true">
          <div class="pane bg-blue">Chi ti\u1EBFt (collapsible)</div>
        </sd-splitter-panel>
      </sd-splitter>
    </div>
  </demo-section>`}),"components/stepper/example-bang-mau":t(e({},o["components/stepper"]),{html:`<demo-section heading="B\u1EA3ng m\xE0u" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]"
                note="primary / success / warning / error \u2014 driving indicator + connector m\xE0u.">
    <div class="color-stack">
      <sd-stepper color="primary">
        <sd-step label="primary"><p>...</p></sd-step>
        <sd-step label="primary"><p>...</p></sd-step>
        <sd-step label="primary"><p>...</p></sd-step>
      </sd-stepper>
      <sd-stepper color="success">
        <sd-step label="success"><p>...</p></sd-step>
        <sd-step label="success"><p>...</p></sd-step>
        <sd-step label="success"><p>...</p></sd-step>
      </sd-stepper>
      <sd-stepper color="warning">
        <sd-step label="warning"><p>...</p></sd-step>
        <sd-step label="warning"><p>...</p></sd-step>
        <sd-step label="warning"><p>...</p></sd-step>
      </sd-stepper>
      <sd-stepper color="error">
        <sd-step label="error"><p>...</p></sd-step>
        <sd-step label="error"><p>...</p></sd-step>
        <sd-step label="error"><p>...</p></sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-co-ban-horizontal":t(e({},o["components/stepper"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n: horizontal" [props]="[{ name: 'orientation', value: 'horizontal' }, { name: 'selectedIndex', value: 'two-way' }]">
    <div class="full">
      <sd-stepper [(selectedIndex)]="basicIndex">
        <sd-step label="Ch\u1ECDn d\u1ECBch v\u1EE5" icon="storefront">
          <div class="step-body">
            <p>Kh\xE1ch h\xE0ng ch\u1ECDn d\u1ECBch v\u1EE5 mu\u1ED1n \u0111\u0103ng k\xFD.</p>
            <button mat-flat-button color="primary" (click)="basicIndex.set(1)">Ti\u1EBFp t\u1EE5c</button>
          </div>
        </sd-step>
        <sd-step label="Cung c\u1EA5p th\xF4ng tin" icon="person">
          <div class="step-body">
            <p>Nh\u1EADp th\xF4ng tin li\xEAn h\u1EC7.</p>
            <div class="row">
              <button mat-stroked-button (click)="basicIndex.set(0)">Quay l\u1EA1i</button>
              <button mat-flat-button color="primary" (click)="basicIndex.set(2)">Ti\u1EBFp t\u1EE5c</button>
            </div>
          </div>
        </sd-step>
        <sd-step label="X\xE1c nh\u1EADn" icon="check_circle">
          <div class="step-body">
            <p>Ki\u1EC3m tra th\xF4ng tin tr\u01B0\u1EDBc khi x\xE1c nh\u1EADn.</p>
            <button mat-stroked-button (click)="basicIndex.set(0)">B\u1EAFt \u0111\u1EA7u l\u1EA1i</button>
          </div>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-dieu-khien-tu-ngoai":t(e({},o["components/stepper"]),{html:`<demo-section heading="\u0110i\u1EC1u khi\u1EC3n t\u1EEB ngo\xE0i" [props]="[{ name: 'next()', value: 'method' }, { name: 'previous()', value: 'method' }, { name: 'goTo()', value: 'method' }, { name: 'reset()', value: 'method' }]">
    <div class="row" style="margin-bottom: 12px;">
      <button mat-stroked-button (click)="externalPrev()">Prev</button>
      <button mat-stroked-button (click)="externalNext()">Next</button>
      <button mat-stroked-button (click)="externalGoLast()">\u0110\u1EBFn cu\u1ED1i</button>
      <button mat-stroked-button color="warn" (click)="externalReset()">Reset</button>
    </div>
    <div class="full">
      <sd-stepper #external [(selectedIndex)]="externalIndex">
        <sd-step label="Step A"><p>Step A.</p></sd-step>
        <sd-step label="Step B"><p>Step B.</p></sd-step>
        <sd-step label="Step C"><p>Step C.</p></sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-editable-false":t(e({},o["components/stepper"]),{html:`<demo-section heading="Editable = false" [props]="[{ name: 'editable', value: 'false' }]"
                note="Step 1 \u0111\u1EB7t editable=false. Sau khi qua step 2, click v\xE0o step 1 s\u1EBD kh\xF4ng tr\u1EDF l\u1EA1i.">
    <div class="full">
      <sd-stepper [(selectedIndex)]="nonEditableIndex">
        <sd-step label="B\u01B0\u1EDBc 1 (locked sau khi qua)" icon="lock" [editable]="false">
          <div class="step-body">
            <p>Sau khi b\u1EA5m Ti\u1EBFp t\u1EE5c, b\u01B0\u1EDBc n\xE0y s\u1EBD kh\xF4ng click l\u1EA1i \u0111\u01B0\u1EE3c.</p>
            <button mat-flat-button color="primary" (click)="nonEditableIndex.set(1)">Ti\u1EBFp t\u1EE5c</button>
          </div>
        </sd-step>
        <sd-step label="B\u01B0\u1EDBc 2">
          <p>\u0110\xE3 \u1EDF b\u01B0\u1EDBc 2. Th\u1EED click v\xE0o b\u01B0\u1EDBc 1 tr\xEAn header \u2014 s\u1EBD kh\xF4ng quay l\u1EA1i \u0111\u01B0\u1EE3c.</p>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-error-state":t(e({},o["components/stepper"]),{html:`<demo-section heading="Error state" [props]="[{ name: 'state', value: 'error' }, { name: 'errorMessage', value: 'text' }]"
                note="Step c\xF3 th\u1EC3 override state='error' \u0111\u1EC3 hi\u1EC7n icon X \u0111\u1ECF + errorMessage.">
    <div class="row" style="margin-bottom: 12px;">
      <button mat-stroked-button color="warn" (click)="toggleError()">
        {{ errorState() === 'error' ? 'B\u1ECF l\u1ED7i step 2' : '\u0110\u1EB7t l\u1ED7i step 2' }}
      </button>
    </div>
    <div class="full">
      <sd-stepper [(selectedIndex)]="errorIndex" color="error">
        <sd-step label="Step OK" icon="check">
          <p>OK.</p>
        </sd-step>
        <sd-step label="Validate fail" icon="warning" [state]="errorState()" errorMessage="M\xE3 \u0111\u01A1n kh\xF4ng h\u1EE3p l\u1EC7">
          <div class="step-body">
            <p>M\xE3 \u0111\u01A1n kh\xF4ng kh\u1EDBp v\u1EDBi h\u1EC7 th\u1ED1ng. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i.</p>
            <button mat-stroked-button (click)="errorIndex.set(0)">Quay l\u1EA1i</button>
          </div>
        </sd-step>
        <sd-step label="Step 3" icon="done">
          <p>Step cu\u1ED1i.</p>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-huong-doc":t(e({},o["components/stepper"]),{html:`<demo-section heading="H\u01B0\u1EDBng d\u1ECDc" [props]="[{ name: 'orientation', value: 'vertical' }, { name: 'selectedIndex', value: 'two-way' }]">
    <div class="full">
      <sd-stepper orientation="vertical" [(selectedIndex)]="verticalIndex">
        <sd-step label="T\u1EA1o t\xE0i kho\u1EA3n" icon="account_circle">
          <p>Form t\u1EA1o t\xE0i kho\u1EA3n \u0111\u1EB7t \u1EDF \u0111\xE2y.</p>
        </sd-step>
        <sd-step label="Li\xEAn k\u1EBFt ng\xE2n h\xE0ng" icon="account_balance">
          <p>Form li\xEAn k\u1EBFt t\xE0i kho\u1EA3n ng\xE2n h\xE0ng.</p>
        </sd-step>
        <sd-step label="Ho\xE0n t\u1EA5t" icon="done_all">
          <p>Setup xong, b\u1EAFt \u0111\u1EA7u s\u1EED d\u1EE5ng.</p>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-linear-wizard":t(e({},o["components/stepper"]),{html:`<demo-section heading="Linear wizard" [props]="[{ name: 'linear', value: 'true' }, { name: 'stepControl', value: 'FormGroup' }]"
                note="Linear=true: ch\u1EC9 qua \u0111\u01B0\u1EE3c step sau khi step tr\u01B0\u1EDBc h\u1EE3p l\u1EC7. M\u1ED7i sd-step bind stepControl t\u1EDBi 1 FormGroup.">
    <div class="full">
      <sd-stepper #linear linear="true" color="primary">
        <sd-step label="T\xE0i kho\u1EA3n" icon="badge" [stepControl]="accountForm">
          <form [formGroup]="accountForm" class="step-form">
            <label>T\xEAn \u0111\u0103ng nh\u1EADp</label>
            <input formControlName="username" placeholder="\xEDt nh\u1EA5t 3 k\xFD t\u1EF1" />
            <label>Email</label>
            <input formControlName="email" placeholder="user@onemount.com" />
            <div class="row">
              <button mat-flat-button color="primary" (click)="linear.next()" [disabled]="accountForm.invalid">
                Ti\u1EBFp t\u1EE5c
              </button>
            </div>
          </form>
        </sd-step>

        <sd-step label="H\u1ED3 s\u01A1" icon="contact_page" [stepControl]="profileForm">
          <form [formGroup]="profileForm" class="step-form">
            <label>H\u1ECD v\xE0 t\xEAn</label>
            <input formControlName="fullName" />
            <label>S\u1ED1 \u0111i\u1EC7n tho\u1EA1i</label>
            <input formControlName="phone" placeholder="09xx xxx xxx" />
            <div class="row">
              <button mat-stroked-button (click)="linear.previous()">Quay l\u1EA1i</button>
              <button mat-flat-button color="primary" (click)="linear.next()" [disabled]="profileForm.invalid">
                Ti\u1EBFp t\u1EE5c
              </button>
            </div>
          </form>
        </sd-step>

        <sd-step label="X\xE1c nh\u1EADn" icon="task_alt" [stepControl]="confirmForm">
          <form [formGroup]="confirmForm" class="step-form">
            <label>
              <input type="checkbox" formControlName="agree" />
              T\xF4i \u0111\u1ED3ng \xFD v\u1EDBi \u0111i\u1EC1u kho\u1EA3n d\u1ECBch v\u1EE5
            </label>
            <div class="row">
              <button mat-stroked-button (click)="linear.previous()">Quay l\u1EA1i</button>
              <button mat-flat-button color="primary" (click)="submitWizard()" [disabled]="confirmForm.invalid">
                Ho\xE0n t\u1EA5t
              </button>
              <button mat-stroked-button (click)="resetWizard()">B\u1EAFt \u0111\u1EA7u l\u1EA1i</button>
            </div>
          </form>
        </sd-step>

        <sd-step label="K\u1EBFt qu\u1EA3" icon="celebration">
          <div class="step-body">
            @if (submittedData()) {
              <p>\u0110\xE3 g\u1EEDi d\u1EEF li\u1EC7u:</p>
              <pre class="output">{{ submittedData() | json }}</pre>
              <button mat-stroked-button (click)="resetWizard()">B\u1EAFt \u0111\u1EA7u l\u1EA1i</button>
            } @else {
              <p class="hint">B\u1EA5m Ho\xE0n t\u1EA5t \u1EDF b\u01B0\u1EDBc X\xE1c nh\u1EADn \u0111\u1EC3 xem d\u1EEF li\u1EC7u t\u1ED5ng h\u1EE3p.</p>
            }
          </div>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-optional-step":t(e({},o["components/stepper"]),{html:`<demo-section heading="Optional step" [props]="[{ name: 'optional', value: 'true' }]"
                note="Step 2 \u0111\xE1nh d\u1EA5u optional \u2014 user c\xF3 th\u1EC3 qua step 3 m\xE0 kh\xF4ng c\u1EA7n \u0111i\u1EC1n.">
    <div class="full">
      <sd-stepper [(selectedIndex)]="optionalIndex">
        <sd-step label="C\u01A1 b\u1EA3n" icon="info">
          <div class="step-body">
            <p>Th\xF4ng tin b\u1EAFt bu\u1ED9c.</p>
            <button mat-flat-button color="primary" (click)="optionalIndex.set(1)">Ti\u1EBFp t\u1EE5c</button>
          </div>
        </sd-step>
        <sd-step label="Khuy\u1EBFn m\xE3i" icon="local_offer" [optional]="true">
          <div class="step-body">
            <p>M\xE3 gi\u1EDBi thi\u1EC7u (t\xF9y ch\u1ECDn \u2014 c\xF3 th\u1EC3 b\u1ECF qua).</p>
            <div class="row">
              <button mat-stroked-button (click)="optionalIndex.set(0)">Quay l\u1EA1i</button>
              <button mat-stroked-button (click)="optionalIndex.set(2)">B\u1ECF qua</button>
              <button mat-flat-button color="primary" (click)="optionalIndex.set(2)">\xC1p d\u1EE5ng</button>
            </div>
          </div>
        </sd-step>
        <sd-step label="Ho\xE0n t\u1EA5t" icon="done">
          <p>Xong.</p>
        </sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/stepper/example-vi-tri-nhan":t(e({},o["components/stepper"]),{html:`<demo-section heading="V\u1ECB tr\xED nh\xE3n" [props]="[{ name: 'labelPosition', value: 'end / bottom' }]">
    <div class="row" style="margin-bottom: 12px;">
      <button mat-stroked-button (click)="labelPos.set('end')">end</button>
      <button mat-stroked-button (click)="labelPos.set('bottom')">bottom</button>
      <span class="hint">\u0110ang ch\u1ECDn: <code>{{ labelPos() }}</code></span>
    </div>
    <div class="full">
      <sd-stepper [labelPosition]="labelPos()">
        <sd-step label="\u0110\u0103ng k\xFD"><p>B\u01B0\u1EDBc 1.</p></sd-step>
        <sd-step label="X\xE1c minh"><p>B\u01B0\u1EDBc 2.</p></sd-step>
        <sd-step label="Thanh to\xE1n"><p>B\u01B0\u1EDBc 3.</p></sd-step>
        <sd-step label="Ho\xE0n t\u1EA5t"><p>Xong.</p></sd-step>
      </sd-stepper>
    </div>
  </demo-section>`}),"components/tab-router/example-preview-dai-tab":t(e({},o["components/tab-router"]),{html:`<demo-section heading="Preview d\u1EA3i tab" [props]="[{ name: 'routes', value: '[\u2026]' }]">
    <div class="strip">
      <sd-badge type="tag" primary icon="dashboard" title="Trang ch\u1EE7"></sd-badge>
      <sd-badge type="tag" info icon="person" title="Nh\xE2n vi\xEAn #001"></sd-badge>
      <sd-badge type="tag" warning icon="edit" title="\u0110ang ch\u1EC9nh s\u1EEDa h\u1EE3p \u0111\u1ED3ng"></sd-badge>
      <sd-badge type="tag" success icon="check_circle" title="Ph\xEA duy\u1EC7t y\xEAu c\u1EA7u"></sd-badge>
      <sd-badge type="tag" secondary icon="settings" title="C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng"></sd-badge>
    </div>
    <p class="note">
      M\u1ED7i pill \u1EDF tr\xEAn \u0111\u1EA1i di\u1EC7n cho m\u1ED9t tab. Click s\u1EBD \u0111i\u1EC1u h\u01B0\u1EDBng \u0111\u1EBFn URL t\u01B0\u01A1ng \u1EE9ng;
      tab gi\u1EEF state (form, scroll, request) khi user chuy\u1EC3n sang tab kh\xE1c v\xE0 quay l\u1EA1i.
    </p>
  </demo-section>`}),"components/tab-router/example-replacetab-beforeclose":t(e({},o["components/tab-router"]),{html:`<demo-section heading="replaceTab + beforeClose" [props]="[{ name: 'replaceTab', value: 'fn' }, { name: 'beforeClose', value: 'fn' }]">
    <div class="code">
      <pre>{{ snippet2 }}</pre>
    </div>
    <p class="note">
      Truy\u1EC1n <code>state.replaceTab</code> \u0111\u1EC3 thay tab hi\u1EC7n t\u1EA1i thay v\xEC m\u1EDF th\xEAm. G\xE1n
      <code>tab.beforeClose</code> \u0111\u1EC3 x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi \u0111\xF3ng (vd: c\u1EA3nh b\xE1o unsaved changes).
    </p>
  </demo-section>`}),"components/tab-router/example-tich-hop-app-shell":t(e({},o["components/tab-router"]),{html:`<demo-section heading="T\xEDch h\u1EE3p app shell" [props]="[{ name: '@SdTabComponent', value: 'template' }]">
    <div class="code">
      <pre>{{ snippet1 }}</pre>
    </div>
    <p class="note">
      Decorate component \u0111\xEDch b\u1EB1ng <code>&#64;SdTabComponent</code> \u0111\u1EC3 cung c\u1EA5p metadata
      (name, icon, color) cho pill. Outlet s\u1EBD t\u1EF1 d\u1EF1ng tab khi route \u0111\u01B0\u1EE3c activate.
    </p>
  </demo-section>`}),"components/tab/example-bang-mau-color":t(e({},o["components/tab"]),{html:`<demo-section heading="B\u1EA3ng m\xE0u color" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]" note="\u0110\u1ED5i m\xE0u indicator + badge theo b\u1ED9 Core: primary / secondary / info / success / warning / error.">
    <div class="full color-stack">
      <sd-tab-group [stretchTabs]="false" color="primary">
        <sd-tab label="primary" icon="info" [badge]="3">M\u1EB7c \u0111\u1ECBnh.</sd-tab>
        <sd-tab label="Tab 2">N\u1ED9i dung 2.</sd-tab>
      </sd-tab-group>
      <sd-tab-group [stretchTabs]="false" color="success" variant="pills">
        <sd-tab label="success" icon="check_circle">Pill xanh \u2014 tr\u1EA1ng th\xE1i ho\xE0n th\xE0nh.</sd-tab>
        <sd-tab label="\u0110\xE3 duy\u1EC7t" [badge]="12">N\u1ED9i dung.</sd-tab>
      </sd-tab-group>
      <sd-tab-group [stretchTabs]="false" color="warning" variant="pills">
        <sd-tab label="warning" icon="warning">Pill v\xE0ng \u2014 c\u1EA7n ch\xFA \xFD.</sd-tab>
        <sd-tab label="Ch\u1EDD x\u1EED l\xFD" [badge]="5">N\u1ED9i dung.</sd-tab>
      </sd-tab-group>
      <sd-tab-group [stretchTabs]="false" color="error" variant="pills">
        <sd-tab label="error" icon="error">Pill \u0111\u1ECF \u2014 l\u1ED7i / nghi\xEAm tr\u1ECDng.</sd-tab>
        <sd-tab label="B\u1ECB t\u1EEB ch\u1ED1i" [badge]="2">N\u1ED9i dung.</sd-tab>
      </sd-tab-group>
      <sd-tab-group [stretchTabs]="false" color="info" variant="segmented">
        <sd-tab label="info">Segmented info.</sd-tab>
        <sd-tab label="Chi ti\u1EBFt">N\u1ED9i dung.</sd-tab>
      </sd-tab-group>
      <sd-tab-group [stretchTabs]="false" color="secondary" variant="segmented">
        <sd-tab label="secondary">Segmented neutral.</sd-tab>
        <sd-tab label="L\u01B0u tr\u1EEF">N\u1ED9i dung.</sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-can-tab-sang-phai":t(e({},o["components/tab"]),{html:`<demo-section heading="C\u0103n tab sang ph\u1EA3i" [props]="[{ name: 'stretchTabs', value: 'false' }, { name: 'alignTabs', value: 'end' }]" note="Default stretchTabs=true (Material default) l\xE0m tabs gi\xE3n full width. T\u1EAFt stretch + \u0111\u1EB7t alignTabs \u0111\u1EC3 d\u1ED3n v\u1EC1 1 ph\xEDa.">
    <div class="full">
      <sd-tab-group [stretchTabs]="false" alignTabs="end">
        <sd-tab label="T\u1ED5ng quan" icon="dashboard">N\u1ED9i dung T\u1ED5ng quan.</sd-tab>
        <sd-tab label="B\xE1o c\xE1o" icon="bar_chart">N\u1ED9i dung B\xE1o c\xE1o.</sd-tab>
        <sd-tab label="C\xE0i \u0111\u1EB7t" icon="settings">N\u1ED9i dung C\xE0i \u0111\u1EB7t.</sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-dieu-khien-tu-ngoai":t(e({},o["components/tab"]),{html:`<demo-section heading="\u0110i\u1EC1u khi\u1EC3n t\u1EEB ngo\xE0i" [props]="[{ name: '[(selectedIndex)]', value: 'two-way' }]">
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <sd-button type="light" color="secondary" prefixIcon="chevron_left" title="Tab tr\u01B0\u1EDBc" (click)="prev()"></sd-button>
      <sd-button type="light" color="secondary" suffixIcon="chevron_right" title="Tab k\u1EBF" (click)="next()"></sd-button>
      <span style="align-self: center; color: #555;">\u0110ang xem tab #{{ twowayIndex() }}</span>
    </div>
    <div class="full">
      <sd-tab-group [(selectedIndex)]="twowayIndexValue">
        <sd-tab label="B\u01B0\u1EDBc 1">N\u1ED9i dung b\u01B0\u1EDBc 1.</sd-tab>
        <sd-tab label="B\u01B0\u1EDBc 2">N\u1ED9i dung b\u01B0\u1EDBc 2.</sd-tab>
        <sd-tab label="B\u01B0\u1EDBc 3">N\u1ED9i dung b\u01B0\u1EDBc 3.</sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-tab-co-ban":t(e({},o["components/tab"]),{html:`<demo-section heading="Tab c\u01A1 b\u1EA3n" [props]="[{ name: 'label', value: 'text' }]">
    <div class="full">
      <sd-tab-group>
        <sd-tab label="Th\xF4ng tin">
          <p>Th\xF4ng tin chung c\u1EE7a b\u1EA3n ghi s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\xE2y.</p>
        </sd-tab>
        <sd-tab label="L\u1ECBch s\u1EED">
          <p>L\u1ECBch s\u1EED thao t\xE1c \u2014 danh s\xE1ch c\xE1c thay \u0111\u1ED5i g\u1EA7n \u0111\xE2y.</p>
        </sd-tab>
        <sd-tab label="Quy\u1EC1n truy c\u1EADp">
          <p>C\u1EA5u h\xECnh vai tr\xF2 v\xE0 nh\xF3m quy\u1EC1n cho ng\u01B0\u1EDDi d\xF9ng.</p>
        </sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-tab-co-icon-badge-disabled":t(e({},o["components/tab"]),{html:`<demo-section heading="Tab c\xF3 icon / badge / disabled" [props]="[{ name: 'icon', value: 'name' }, { name: 'badge', value: '7 / 99+' }, { name: 'disabled', value: 'true' }]">
    <div class="full">
      <sd-tab-group>
        <sd-tab label="H\u1ED3 s\u01A1" icon="person">
          <p>Trang h\u1ED3 s\u01A1 c\xE1 nh\xE2n.</p>
        </sd-tab>
        <sd-tab label="Th\xF4ng b\xE1o" icon="notifications" [badge]="unreadCount()">
          <p>B\u1EA1n c\xF3 {{ unreadCount() }} th\xF4ng b\xE1o ch\u01B0a \u0111\u1ECDc.</p>
        </sd-tab>
        <sd-tab label="Tin nh\u1EAFn" icon="mail" [badge]="'99+'">
          <p>H\u1ED9p th\u01B0 \u0111\u1EBFn.</p>
        </sd-tab>
        <sd-tab label="\u0110ang kh\xF3a" icon="lock" [disabled]="true">
          <p>Tab n\xE0y kh\xF4ng th\u1EC3 truy c\u1EADp.</p>
        </sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-tab-dong-duoc":t(e({},o["components/tab"]),{html:`<demo-section heading="Tab \u0111\xF3ng \u0111\u01B0\u1EE3c" [props]="[{ name: 'closable', value: 'true' }, { name: '(tabClosed)', value: 'event' }]">
    <div class="full">
      <sd-tab-group (tabClosed)="onTabClosed($event)">
        @for (file of files(); track file.id) {
          <sd-tab [label]="file.name" icon="description" [closable]="true">
            <p>N\u1ED9i dung c\u1EE7a file <strong>{{ file.name }}</strong></p>
          </sd-tab>
        }
      </sd-tab-group>
      @if (files().length === 0) {
        <p style="padding: 16px; color: #888; font-style: italic;">T\u1EA5t c\u1EA3 c\xE1c tab \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\xF3ng.</p>
      }
    </div>
  </demo-section>`}),"components/tab/example-tab-long-tab":t(e({},o["components/tab"]),{html:`<demo-section heading="Tab l\u1ED3ng tab" [props]="[{ name: 'variant', value: 'pills / segmented' }]" note="Khi tab l\u1ED3ng tab, \u0111\u1EB7t variant kh\xE1c nhau \u0111\u1EC3 m\u1EAFt ph\xE2n bi\u1EC7t r\xF5 outer vs inner. Outer gi\u1EEF default line; inner \u0111\u1ED5i sang pills ho\u1EB7c segmented.">
    <div class="full">
      <sd-tab-group>
        <sd-tab label="Th\xF4ng tin chung" icon="info">
          <p>Khung outer gi\u1EEF underline Material default.</p>
          <sd-tab-group variant="pills" [stretchTabs]="false">
            <sd-tab label="C\xE1 nh\xE2n">H\u1ECD t\xEAn, email, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i.</sd-tab>
            <sd-tab label="C\xF4ng vi\u1EC7c">Ph\xF2ng ban, ch\u1EE9c v\u1EE5, m\xE3 NV.</sd-tab>
            <sd-tab label="Li\xEAn h\u1EC7 kh\u1EA9n c\u1EA5p">Ng\u01B0\u1EDDi th\xE2n, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i.</sd-tab>
          </sd-tab-group>
        </sd-tab>
        <sd-tab label="C\xE0i \u0111\u1EB7t" icon="settings">
          <sd-tab-group variant="segmented" [stretchTabs]="false">
            <sd-tab label="B\u1EA3o m\u1EADt">\u0110\u1ED5i m\u1EADt kh\u1EA9u, 2FA.</sd-tab>
            <sd-tab label="Th\xF4ng b\xE1o">Email, push, SMS.</sd-tab>
            <sd-tab label="Quy\u1EC1n">Vai tr\xF2, nh\xF3m.</sd-tab>
          </sd-tab-group>
        </sd-tab>
        <sd-tab label="L\u1ECBch s\u1EED" icon="history" [badge]="12">
          <p>B\u1EA3ng nh\u1EADt k\xFD thao t\xE1c.</p>
        </sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-variant-pills":t(e({},o["components/tab"]),{html:`<demo-section heading="Variant pills" [props]="[{ name: 'variant', value: 'pills' }]" note="Pill rounded, active filled \u2014 nh\u1EB9 nh\xE0ng, kh\xF4ng underline, l\xFD t\u01B0\u1EDFng cho nested tab.">
    <div class="full">
      <sd-tab-group variant="pills" [stretchTabs]="false">
        <sd-tab label="Tu\u1EA7n n\xE0y" icon="today">N\u1ED9i dung tu\u1EA7n n\xE0y.</sd-tab>
        <sd-tab label="Th\xE1ng n\xE0y" icon="calendar_month" [badge]="3">N\u1ED9i dung th\xE1ng n\xE0y.</sd-tab>
        <sd-tab label="Qu\xFD n\xE0y">N\u1ED9i dung qu\xFD n\xE0y.</sd-tab>
        <sd-tab label="N\u0103m" [disabled]="true">N\u0103m</sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/tab/example-variant-segmented":t(e({},o["components/tab"]),{html:`<demo-section heading="Variant segmented" [props]="[{ name: 'variant', value: 'segmented' }]" note="Container bo tr\xF2n v\u1EDBi 1 vi\u1EC1n \u2014 iOS-style. Ph\xF9 h\u1EE3p cho toggle nh\u1ECF trong toolbar.">
    <div class="full">
      <sd-tab-group variant="segmented" [stretchTabs]="false">
        <sd-tab label="Danh s\xE1ch">Hi\u1EC3n th\u1ECB d\u1EA1ng danh s\xE1ch.</sd-tab>
        <sd-tab label="B\u1EA3ng">Hi\u1EC3n th\u1ECB d\u1EA1ng b\u1EA3ng.</sd-tab>
        <sd-tab label="L\u01B0\u1EDBi">Hi\u1EC3n th\u1ECB d\u1EA1ng l\u01B0\u1EDBi.</sd-tab>
      </sd-tab-group>
    </div>
  </demo-section>`}),"components/table/example-cell-template-tuy-chinh":t(e({},o["components/table"]),{html:`<demo-section heading="Cell template t\xF9y ch\u1EC9nh" [props]="[{ name: 'sdTableCellDef', value: 'template' }]">
    <div class="table-box">
      <sd-table [option]="customCellOption">
        <ng-template [sdTableCellDef]="'name'" let-item="item">
          <div class="name-cell">
            <span class="avatar">{{ item.name.charAt(0) }}</span>
            <div>
              <div class="name-line">{{ item.name }}</div>
              <div class="email-line">{{ item.email }}</div>
            </div>
          </div>
        </ng-template>
        <ng-template [sdTableCellDef]="'status'" let-item="item">
          <span class="chip chip-{{ item.status.toLowerCase() }}">{{ item.status }}</span>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-chon-mot-dong":t(e({},o["components/table"]),{html:`<demo-section heading="Ch\u1ECDn m\u1ED9t d\xF2ng" [props]="[{ name: 'selector.single', value: 'true' }]">
    <div class="table-box">
      <sd-table [option]="singleSelectOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-dong-mo-rong":t(e({},o["components/table"]),{html:`<demo-section heading="D\xF2ng m\u1EDF r\u1ED9ng" [props]="[{ name: 'expand', value: 'true' }, { name: 'sdTableExpandDef', value: 'template' }]">
    <div class="table-box">
      <sd-table [option]="expandOption">
        <ng-template sdTableExpandDef let-item="item">
          <div class="expand-box">
            <div class="expand-title">M\xF4 t\u1EA3 task #{{ item.data.id }}</div>
            <p>{{ item.data.description }}</p>
            <div class="expand-meta">
              Ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch: <b>{{ item.data.assignee }}</b> \xB7 Ti\u1EBFn \u0111\u1ED9: <b>{{ item.data.progress }}%</b>
            </div>
          </div>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-filter-onchange":t(e({},o["components/table"]),{html:`<demo-section
    heading="Filter onChange"
    [props]="[
      { name: 'columns[].filter.onChange', value: 'callback' },
      { name: 'input / input-number', value: 'Enter / blur' }
    ]"
    note="Callback ch\u1EC9 ch\u1EA1y khi gi\xE1 tr\u1ECB filter \u0111\xE3 commit v\xE0 kh\xE1c l\u1EA7n tr\u01B0\u1EDBc; input text/number commit b\u1EB1ng Enter ho\u1EB7c blur.">
    <div class="table-box">
      <div class="filter-change-log">
        <span class="filter-change-log__label">Callback cu\u1ED1i:</span>
        <span>{{ filterOnChangeEvent() }}</span>
      </div>
      <sd-table [option]="filterOnChangeOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-footer-tong-hop":t(e({},o["components/table"]),{html:`<demo-section heading="Footer t\u1ED5ng h\u1EE3p" [props]="[{ name: 'sdTableFooterDef', value: 'template' }]">
    <div class="table-box">
      <sd-table [option]="footerOption">
        <ng-template [sdTableFooterDef]="'salary'" let-items="items">
          <b>T\u1ED5ng: {{ totalSalary(items) | number: '1.0-0' }} \u20AB</b>
        </ng-template>
        <ng-template [sdTableFooterDef]="'name'" let-items="items">
          <span>{{ items.length }} nh\xE2n vi\xEAn</span>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-full-demo-local":t(e({},o["components/table"]),{html:`<demo-section heading="Full demo (local)" [props]="[{ name: 'selector', value: 'true' }, { name: 'command', value: 'true' }, { name: 'export', value: 'true' }, { name: 'index', value: 'true' }, { name: 'filler', value: 'true' }, { name: 'paginate', value: 'true' }]">
    <div class="table-box">
      <sd-table [option]="employeeOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-giu-selection-xuyen-trang":t(e({},o["components/table"]),{html:`<demo-section heading="Gi\u1EEF selection xuy\xEAn trang" [props]="[{ name: 'selector.preserveSelection', value: 'true' }]">
    <div class="table-box">
      <sd-table [option]="preserveSelectionOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-hanh-dong-o-header-cot-command":t(e({},o["components/table"]),{html:`<demo-section
    heading="H\xE0nh \u0111\u1ED9ng \u1EDF header c\u1ED9t command"
    [props]="[{ name: 'sdTableCommandHeaderDef', value: 'template' }]"
    note="\xD4 header c\u1EE7a c\u1ED9t command v\u1ED1n \u0111\u1EC3 tr\u1ED1ng. Chi\u1EBFu n\u1ED9i dung v\xE0o \u0111\xF3 \u0111\u1EC3 \u0111\u1EB7t m\u1ED9t h\xE0nh \u0111\u1ED9ng c\u1EA5p b\u1EA3ng (\u1EDF \u0111\xE2y l\xE0 th\xEAm d\xF2ng) ngay tr\xEAn c\u1EE5m s\u1EEDa/xo\xE1 c\u1EE7a t\u1EEBng d\xF2ng, kh\u1ECFi c\u1EA7n th\xEAm m\u1ED9t d\u1EA3i ri\xEAng d\u01B0\u1EDBi b\u1EA3ng.">
    <div class="table-box">
      <sd-table [option]="commandHeaderOption">
        <ng-template sdTableCommandHeaderDef>
          <sd-button prefixIcon="add" type="text" color="primary" tooltip="Th\xEAm d\xF2ng" (click)="addCommandHeaderRow()"></sd-button>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-keo-tha-doi-thu-tu":t(e({},o["components/table"]),{html:`<demo-section heading="K\xE9o th\u1EA3 \u0111\u1ED5i th\u1EE9 t\u1EF1" [props]="[{ name: 'rowReorder', value: 'true' }]">
    <div class="table-box">
      <sd-table [option]="reorderOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-khong-co-filler":t(e({},o["components/table"]),{html:`<demo-section heading="Kh\xF4ng c\xF3 filler" [props]="[{ name: 'filler', value: 'false' }]">
    <div class="table-box">
      <sd-table [option]="noFillerOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-lenh-dong-co-menu-con":t(e({},o["components/table"]),{html:`<demo-section
    heading="L\u1EC7nh d\xF2ng c\xF3 menu con"
    [props]="[
      { name: 'command.commands[].children', value: 'SdTableCommandNormal[]' },
      { name: 'command.align', value: 'right' }
    ]"
    note="Command c\xF3 children s\u1EBD render th\xE0nh n\xFAt menu; c\xE1c child command v\u1EABn h\u1ED7 tr\u1EE3 icon, title, color, disabled, hidden v\xE0 click theo t\u1EEBng row.">
    <div class="table-box">
      <sd-table [option]="commandChildrenOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-lenh-dong-phai":t(e({},o["components/table"]),{html:`<demo-section heading="L\u1EC7nh d\xF2ng ph\u1EA3i" [props]="[{ name: 'command.align', value: 'right' }]">
    <div class="table-box">
      <sd-table [option]="commandRightOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-nhom-don-hang-theo-khach":t(e({},o["components/table"]),{html:`<demo-section heading="Nh\xF3m \u0111\u01A1n h\xE0ng theo kh\xE1ch" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
    <div class="table-box">
      <sd-table [option]="customerOrderOption">
        <ng-template sdTableGroupDef let-values="values" let-data="data">
          <div class="group-header-cell">
            <span class="group-label">
              Kh\xE1ch: <b>{{ values['customerId'] === 1 ? 'Nguy\u1EC5n V\u0103n An' : values['customerId'] === 2 ? 'Tr\u1EA7n Th\u1ECB B\xECnh' : values['customerId'] === 3 ? 'L\xEA Ho\xE0ng C\u01B0\u1EDDng' : 'Ph\u1EA1m Th\u1ECB Dung' }}</b>
            </span>
            <span class="group-meta">
              \u2014 {{ data.length }} \u0111\u01A1n \xB7 T\u1ED5ng: {{ totalOrderAmount(data) | number: '1.0-0' }} \u20AB
            </span>
          </div>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-nhom-dong":t(e({},o["components/table"]),{html:`<demo-section heading="Nh\xF3m d\xF2ng" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
    <div class="table-box">
      <sd-table [option]="groupOption">
        <ng-template sdTableGroupDef let-values="values" let-data="data" let-isExpanded="isExpanded">
          <div class="group-header-cell">
            <span class="group-label">Ph\xF2ng <b>{{ values['department'] }}</b></span>
            <span class="group-meta">\u2014 {{ data.length }} nh\xE2n vi\xEAn \xB7 tr\u1EA1ng th\xE1i: {{ isExpanded ? 'expand' : 'collapse' }}</span>
          </div>
        </ng-template>
      </sd-table>
    </div>
  </demo-section>`}),"components/table/example-server-side":t(e({},o["components/table"]),{html:`<demo-section heading="Server-side" [props]="[{ name: 'type', value: 'server' }]">
    <div class="table-box">
      <sd-table [option]="serverOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-toi-gian":t(e({},o["components/table"]),{html:`<demo-section heading="T\u1ED1i gi\u1EA3n" [props]="[{ name: 'paginate', value: 'true' }]">
    <div class="table-box">
      <sd-table [option]="productOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-tree-khong-cot-stt-chevron-nam-trong-cot-dau-don-vi":t(e({},o["components/table"]),{html:`<demo-section
    heading="Tree KH\xD4NG c\u1ED9t STT \u2014 chevron n\u1EB1m trong c\u1ED9t \u0111\u1EA7u (\u0110\u01A1n v\u1ECB)"
    [props]="[
      { name: 'tree.loadType', value: 'static' },
      { name: 'index', value: 'false' }
    ]"
    note="Kh\xF4ng b\u1EADt index \u2192 icon expand + indent nh\xFAng th\u1EB3ng v\xE0o c\u1ED9t data \u0111\u1EA7u ti\xEAn (ki\u1EC3u file explorer).">
    <div class="table-box">
      <sd-table [option]="treeNoIndexOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-tree-lazy-nap-con-khi-bung-co-loading":t(e({},o["components/table"]),{html:`<demo-section
    heading="Tree lazy \u2014 n\u1EA1p con khi bung (c\xF3 loading)"
    [props]="[
      { name: 'tree.loadType', value: 'lazy' },
      { name: 'tree.onExpandChildren', value: 'Promise' },
      { name: 'tree.hasChildren', value: 'method' }
    ]"
    note="loadType 'lazy': bung d\xF2ng \u2192 g\u1ECDi onExpandChildren (gi\u1EA3 l\u1EADp tr\u1EC5 800ms) \u2192 spinner loading hi\u1EC7n trong \xF4 chevron t\u1EDBi khi n\u1EA1p xong. hasChildren quy\u1EBFt \u0111\u1ECBnh d\xF2ng n\xE0o c\xF3 icon expand (Nh\xF3m/Team l\xE0 l\xE1 \u2192 kh\xF4ng icon).">
    <div class="table-box">
      <sd-table [option]="treeLazyOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-tree-rows-search-o-cap-con-go-ten-don-vi-con-de-loc":t(e({},o["components/table"]),{html:`<demo-section
    heading="Tree rows + search \u1EDF c\u1EA5p con (g\xF5 t\xEAn \u0111\u01A1n v\u1ECB con \u0111\u1EC3 l\u1ECDc)"
    [props]="[
      { name: 'tree.loadType', value: 'static' },
      { name: 'tree.childrenKey', value: 'children' },
      { name: 'tree.defaultExpanded', value: '1' },
      { name: 'columns[].filter', value: 'config' }
    ]"
    note="Search tr\xEAn table 'local' + tree 'static' l\u1ECDc c\u1EA3 c\u1EA5p con: gi\u1EEF nh\xE1nh cha c\u1EE7a node kh\u1EDBp, prune sibling kh\xF4ng kh\u1EDBp, t\u1EF1 bung t\u1EDBi node kh\u1EDBp.">
    <div class="table-box">
      <sd-table [option]="treeOption"></sd-table>
    </div>
  </demo-section>`}),"components/table/example-tree-selector-command-chinh-indent":t(e({},o["components/table"]),{html:`<demo-section
    heading="Tree + selector + command + ch\u1EC9nh indent"
    [props]="[
      { name: 'tree.indentSize', value: treeCommandIndentSize() + 'px' },
      { name: 'selector.visible', value: 'true' },
      { name: 'command.align', value: 'right' }
    ]"
    note="Demo ph\u1ED1i h\u1EE3p tree rows v\u1EDBi checkbox selector, bulk actions, command theo t\u1EEBng d\xF2ng v\xE0 thay \u0111\u1ED5i indent tr\u1EF1c ti\u1EBFp.">
    <div class="table-box">
      <div class="tree-command-toolbar">
        <span class="tree-command-toolbar__label">Indent: {{ treeCommandIndentSize() }}px</span>
        <sd-button
          type="light"
          color="secondary"
          prefixIcon="format_indent_decrease"
          title="Gi\u1EA3m indent"
          [disabled]="treeCommandIndentSize() <= 8"
          (click)="decreaseTreeCommandIndent()">
        </sd-button>
        <sd-button
          type="light"
          color="primary"
          prefixIcon="format_indent_increase"
          title="T\u0103ng indent"
          [disabled]="treeCommandIndentSize() >= 32"
          (click)="increaseTreeCommandIndent()">
        </sd-button>
      </div>
      <sd-table [option]="treeCommandOption()"></sd-table>
    </div>
  </demo-section>`}),"components/tree/example-custom-item-template":t(e({},o["components/tree"]),{html:`<demo-section
    heading="Custom item template"
    note="sdTreeItemDef nh\u1EADn context item, treeItem, level, selected, isLeaf, toggle, select."
    [props]="[
      { name: 'sdTreeItemDef', value: 'template' },
      { name: 'context', value: 'item / treeItem / level / toggle' },
    ]">
    <div class="tree-demo-panel">
      <sd-tree [option]="customDemoOption">
        <ng-template sdTreeItemDef let-item let-level="level" let-isLeaf="isLeaf" let-toggle="toggle">
          <button type="button" class="tree-custom-item" [class.tree-custom-item--leaf]="isLeaf" (click)="toggle()">
            <span>L{{ level + 1 }}</span>
            <strong>{{ item.title }}</strong>
            @if (item.description) {
              <small>{{ item.description }}</small>
            }
          </button>
        </ng-template>
      </sd-tree>
    </div>
  </demo-section>`}),"components/tree/example-filter-tieng-viet-khong-dau":t(e({},o["components/tree"]),{html:`<demo-section
    heading="Filter ti\u1EBFng Vi\u1EC7t kh\xF4ng d\u1EA5u"
    note="Filter ch\u1EC9 t\xECm tr\xEAn item \u0111\xE3 load. V\xED d\u1EE5 g\xF5 'ke toan', 'cong no', 'nhan su'."
    [props]="[{ name: 'filter(searchText)', value: 'method' }]">
    <div class="tree-filter">
      <input
        type="search"
        placeholder="T\xECm ki\u1EBFm..."
        [value]="filterText"
        (input)="onFilter(($any($event.target)).value)" />
      <button type="button" (click)="onFilter('')">X\xF3a</button>
    </div>
    <div class="tree-demo-panel">
      <sd-tree #filterTree [option]="filterDemoOption"></sd-tree>
    </div>
  </demo-section>`}),"components/tree/example-lazy-tree":t(e({},o["components/tree"]),{html:`<demo-section
    heading="Lazy tree"
    note="B\u1EA5m m\u1EDF node \u0111\u1EC3 gi\u1EA3 l\u1EADp t\u1EA3i children. Sau l\u1EA7n \u0111\u1EA7u, children \u0111\u01B0\u1EE3c cache n\u1ED9i b\u1ED9 trong component."
    [props]="[
      { name: 'loadType', value: 'lazy' },
      { name: 'onExpandChildren', value: 'Promise<SdTreeItemLazy<T>[]>' },
    ]">
    <div class="tree-demo-panel">
      <sd-tree
        [option]="lazyDemoOption"
        (expandChange)="lastEvent = 'expand: ' + $event.item.title"
        (collapseChange)="lastEvent = 'collapse: ' + $event.item.title"
      ></sd-tree>
    </div>
  </demo-section>`}),"components/tree/example-selection-va-command":t(e({},o["components/tree"]),{html:`<demo-section
    heading="Selection v\xE0 command"
    note="Checkbox ch\u1ECDn nhi\u1EC1u d\xF2ng. Command \u1EDF cu\u1ED1i d\xF2ng, hover v\xE0o row m\u1EDBi th\u1EA5y n\xFAt ba ch\u1EA5m."
    [props]="[
      { name: 'selectedItemsChange', value: 'T[]' },
      { name: 'commands', value: 'SdTreeCommand[]' },
    ]">
    <div class="tree-demo-grid">
      <div class="tree-demo-panel">
        <sd-tree
          [option]="selectionDemoOption"
          (selectedItemsChange)="selectedItems = $event"
          (selectChange)="lastEvent = 'select: ' + $event.item.title"
        ></sd-tree>
      </div>

      <div class="tree-demo-state">
        <strong>Selected</strong>
        @if (selectedItems.length) {
          <ul>
            @for (item of selectedItems; track item.id) {
              <li>{{ item.title }}</li>
            }
          </ul>
        } @else {
          <span>Ch\u01B0a ch\u1ECDn d\xF2ng n\xE0o</span>
        }
        <small>{{ lastEvent }}</small>
      </div>
    </div>
  </demo-section>`}),"components/tree/example-static-tree":t(e({},o["components/tree"]),{html:`<demo-section
    heading="Static tree"
    note="Static tree nh\u1EADn SdTreeItemStatic \u0111\xE3 b\u1ECDc s\u1EB5n id, label, data v\xE0 children. Branch d\xF9ng folder icon m\u1EB7c \u0111\u1ECBnh; leaf kh\xF4ng hi\u1EC7n icon n\u1EBFu kh\xF4ng khai b\xE1o icon."
    [props]="[
      { name: 'items', value: 'SdTreeItemStatic<T>[]' },
      { name: 'loadType', value: 'static' },
      { name: 'defaultExpanded', value: '1' },
    ]">
    <div class="tree-demo-panel">
      <sd-tree [option]="staticDemoOption"></sd-tree>
    </div>
  </demo-section>`}),"components/upload-file/example-tai-nhieu-anh-co-gioi-han":t(e({},o["components/upload-file"]),{html:`<demo-section heading="T\u1EA3i nhi\u1EC1u \u1EA3nh c\xF3 gi\u1EDBi h\u1EA1n" [props]="[{ name: 'type', value: 'image' }, { name: 'max', value: '5' }, { name: 'maxSize', value: '2' }, { name: 'model', value: 'two-way' }]">
    <div class="control-box">
      <sd-upload-file
        label="\u1EA2nh s\u1EA3n ph\u1EA9m"
        type="image"
        helperText="\u1EA2nh s\u1EBD hi\u1EC3n th\u1ECB tr\xEAn trang chi ti\u1EBFt s\u1EA3n ph\u1EA9m."
        [extensions]="['jpg', 'jpeg', 'png']"
        [maxSize]="2"
        [max]="5"
        [(model)]="productImages">
      </sd-upload-file>
    </div>
  </demo-section>`}),"components/upload-file/example-tai-tai-lieu-bao-loi-required":t(e({},o["components/upload-file"]),{html:`<demo-section
    heading="T\u1EA3i t\xE0i li\u1EC7u + b\xE1o l\u1ED7i required"
    [props]="[{ name: 'type', value: 'document' }, { name: 'required', value: 'true' }, { name: '[form]', value: 'FormGroup' }]"
    note="B\u1EA5m Ki\u1EC3m tra (m\xF4 ph\u1ECFng submit \u2192 markAllAsTouched) khi ch\u01B0a \u0111\xEDnh k\xE8m file: message l\u1ED7i \u0111\u1ECF 'Vui l\xF2ng t\u1EA3i t\u1EC7p' hi\u1EC7n ngay d\u01B0\u1EDBi v\xF9ng upload. \u0110\xEDnh k\xE8m 1 file r\u1ED3i Ki\u1EC3m tra l\u1EA1i \u2192 l\u1ED7i bi\u1EBFn m\u1EA5t.">
    <div class="control-box" style="display:flex; flex-direction:column; gap:12px">
      <sd-upload-file
        label="T\xE0i li\u1EC7u \u0111\xEDnh k\xE8m"
        type="document"
        helperText="\u0110\xEDnh k\xE8m h\u1EE3p \u0111\u1ED3ng / ph\u1EE5 l\u1EE5c / bi\xEAn b\u1EA3n."
        [extensions]="['pdf', 'doc', 'docx', 'xlsx']"
        [maxSize]="10"
        [max]="3"
        required
        [form]="form"
        name="attachments">
      </sd-upload-file>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="resetForm()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"components/upload-file/example-vo-hieu-hoa-chi-doc":t(e({},o["components/upload-file"]),{html:`<demo-section heading="V\xF4 hi\u1EC7u h\xF3a (ch\u1EC9 \u0111\u1ECDc)" [props]="[{ name: 'disabled', value: 'true' }]">
    <div class="control-box">
      <sd-upload-file
        label="\u0110\xE3 \u0111\xEDnh k\xE8m"
        type="file"
        [disabled]="true"
        [model]="['demo-file-id']">
      </sd-upload-file>
    </div>
  </demo-section>`}),"components/view/example-gia-tri-co-sieu-lien-ket":t(e({},o["components/view"]),{html:`<demo-section heading="Gi\xE1 tr\u1ECB c\xF3 si\xEAu li\xEAn k\u1EBFt" [props]="[{ name: 'hyperlink', value: 'url' }]">
    <div class="grid-3">
      <sd-view
        label="Ng\u01B0\u1EDDi t\u1EA1o"
        [display]="contract.createdByName"
        [hyperlink]="'/users/' + contract.createdById">
      </sd-view>
      <sd-view
        label="\u0110\u01B0\u1EDDng d\u1EABn ngo\xE0i"
        display="M\u1EDF t\xE0i li\u1EC7u h\u1EE3p \u0111\u1ED3ng"
        hyperlink="https://example.com/contracts/HD-2025-0001">
      </sd-view>
    </div>
  </demo-section>`}),"components/view/example-nhan-va-gia-tri-co-ban":t(e({},o["components/view"]),{html:`<demo-section heading="Nh\xE3n v\xE0 gi\xE1 tr\u1ECB c\u01A1 b\u1EA3n" [props]="[{ name: 'display', value: 'text' }]">
    <div class="grid-3">
      <sd-view label="M\xE3 h\u1EE3p \u0111\u1ED3ng" [display]="contract.code"></sd-view>
      <sd-view label="T\xEAn h\u1EE3p \u0111\u1ED3ng" [display]="contract.name"></sd-view>
      <sd-view label="Gi\xE1 tr\u1ECB (VND)" [display]="contract.amount.toLocaleString('vi-VN')"></sd-view>
      <sd-view label="Ng\xE0y b\u1EAFt \u0111\u1EA7u" [display]="contract.startDate | date:'dd/MM/yyyy'"></sd-view>
      <sd-view label="Ng\xE0y k\u1EBFt th\xFAc" [display]="contract.endDate | date:'dd/MM/yyyy'"></sd-view>
      <sd-view label="Ghi ch\xFA" [display]="null"></sd-view>
    </div>
  </demo-section>`}),"components/view/example-template-tuy-chinh-gia-tri":t(e({},o["components/view"]),{html:`<demo-section heading="Template t\xF9y ch\u1EC9nh gi\xE1 tr\u1ECB" [props]="[{ name: '#sdValue', value: 'template' }]">
    <div class="grid-3">
      <sd-view label="Tr\u1EA1ng th\xE1i" [display]="contract.statusName" [value]="contract.status">
        <ng-template #sdValue let-display let-status="value">
          <sd-badge
            [title]="display"
            [color]="status === 'ACTIVE' ? 'success' : 'error'">
          </sd-badge>
        </ng-template>
      </sd-view>
      <sd-view label="Lo\u1EA1i h\u1EE3p \u0111\u1ED3ng" display="D\u1ECBch v\u1EE5 th\u01B0\u1EDDng xuy\xEAn"></sd-view>
    </div>
  </demo-section>`}),"directives/desktop/example-cap-doi-voi-sdmobile":t(e({},o["directives/desktop"]),{html:`<demo-section
      heading="C\u1EB7p \u0111\xF4i v\u1EDBi sdMobile"
      [props]="[
        { name: '*sdDesktop', value: 'true' },
        { name: '*sdMobile', value: 'true' },
      ]"
      note="Hai directive lo\u1EA1i tr\u1EEB nhau, n\xEAn \u0111\u1EB7t c\u1EA1nh nhau l\xE0 c\xE1ch r\u1EBD nh\xE1nh markup theo thi\u1EBFt b\u1ECB m\xE0 kh\xF4ng c\u1EA7n *ngIf th\u1EE7 c\xF4ng.">
      <div class="device-box">
        <div *sdDesktop class="device-card device-card--desktop">B\u1ED1 c\u1EE5c desktop: b\u1EA3ng nhi\u1EC1u c\u1ED9t</div>
        <div *sdMobile class="device-card device-card--mobile">B\u1ED1 c\u1EE5c mobile: danh s\xE1ch th\u1EBB</div>
      </div>
    </demo-section>`}),"directives/desktop/example-chi-render-tren-desktop":t(e({},o["directives/desktop"]),{html:`<demo-section
      heading="Ch\u1EC9 render tr\xEAn desktop"
      [props]="[{ name: '*sdDesktop', value: 'true' }]"
      note="Kh\u1ED1i b\xEAn d\u01B0\u1EDBi ch\u1EC9 t\u1ED3n t\u1EA1i trong DOM khi BrowserUtilities.isMobile() tr\u1EA3 v\u1EC1 false \u2014 kh\xF4ng ph\u1EA3i \u1EA9n b\u1EB1ng CSS.">
      <div class="device-box">
        <div *sdDesktop class="device-card device-card--desktop" data-desktop-block>N\u1ED9i dung ch\u1EC9 d\xE0nh cho desktop</div>
        <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
      </div>
    </demo-section>`}),"directives/hover-copy/example-nut-sao-chep-hien-khi-hover":t(e({},o["directives/hover-copy"]),{html:`<demo-section
      heading="N\xFAt sao ch\xE9p hi\u1EC7n khi hover"
      [props]="[{ name: '[sdHoverCopy]', value: 'text' }]"
      note="R\xEA chu\u1ED9t v\xE0o \xF4 b\xEAn d\u01B0\u1EDBi r\u1ED3i b\u1EA5m n\xFAt \u2014 gi\xE1 tr\u1ECB v\xE0o clipboard v\xE0 tooltip \u0111\u1ED5i sang '\u0110\xE3 sao ch\xE9p' trong 1 gi\xE2y.">
      <div class="copy-row">
        <span class="copy-cell" [sdHoverCopy]="orderCode" data-copy-order>{{ orderCode }}</span>
        <span class="copy-cell" [sdHoverCopy]="taxCode" data-copy-tax>{{ taxCode }}</span>
      </div>
    </demo-section>`}),"directives/hover-copy/example-tat-nut-sao-chep":t(e({},o["directives/hover-copy"]),{html:`<demo-section
      heading="T\u1EAFt n\xFAt sao ch\xE9p"
      [props]="[
        { name: '[sdHoverCopy]', value: 'text' },
        { name: '[sdHoverCopyDisabled]', value: 'true' },
      ]"
      note="Khi disabled, n\xFAt b\u1ECB G\u1EE0 kh\u1ECFi DOM ch\u1EE9 kh\xF4ng ch\u1EC9 \u1EA9n b\u1EB1ng opacity \u2014 kh\xF4ng c\xF2n c\xE1ch n\xE0o b\u1EA5m tr\xFAng n\xF3.">
      <div class="copy-row">
        <span class="copy-cell" [sdHoverCopy]="lockedValue" [sdHoverCopyDisabled]="true" data-copy-disabled>{{ lockedValue }}</span>
      </div>
    </demo-section>`}),"directives/href/example-link-ngoai-mo-tab-moi-an-toan":t(e({},o["directives/href"]),{html:`<demo-section
      heading="Link ngo\xE0i m\u1EDF tab m\u1EDBi an to\xE0n"
      [props]="[{ name: '[sdHref]', value: 'https url' }]"
      note="Ch\u1EC9 url parse ra \u0111\xFAng scheme http:/https: m\u1EDBi \u0111\u01B0\u1EE3c coi l\xE0 link ngo\xE0i, v\xE0 lu\xF4n m\u1EDF k\xE8m noopener,noreferrer \u0111\u1EC3 ch\u1EB7n reverse tabnabbing.">
      <a class="demo-link" [sdHref]="externalUrl" data-href-external>M\u1EDF angular.dev</a>
      <code>{{ externalUrl }}</code>
    </demo-section>`}),"directives/href/example-link-noi-bo-di-qua-router":t(e({},o["directives/href"]),{html:`<demo-section
      heading="Link n\u1ED9i b\u1ED9 \u0111i qua Router"
      [props]="[{ name: '[sdHref]', value: 'url' }]"
      note="Chu\u1ED7i kh\xF4ng ph\u1EA3i http/https \u0111\u01B0\u1EE3c t\xE1ch path + query r\u1ED3i \u0111\u1EA9y sang Router.navigate \u2014 b\u1EA5m kh\xF4ng n\u1EA1p l\u1EA1i trang.">
      <a class="demo-link" [sdHref]="internalUrl" data-href-internal>M\u1EDF trang Tooltip Directive</a>
      <code>{{ internalUrl }}</code>
    </demo-section>`}),"directives/mobile/example-cap-doi-voi-sddesktop":t(e({},o["directives/mobile"]),{html:`<demo-section
      heading="C\u1EB7p \u0111\xF4i v\u1EDBi sdDesktop"
      [props]="[
        { name: '*sdMobile', value: 'true' },
        { name: '*sdDesktop', value: 'true' },
      ]"
      note="\u0110\xFAng m\u1ED9t trong hai nh\xE1nh t\u1ED3n t\u1EA1i trong DOM, n\xEAn kh\xF4ng c\xF3 chi ph\xED render cho nh\xE1nh c\xF2n l\u1EA1i.">
      <div class="device-box">
        <div *sdMobile class="device-card device-card--mobile">Thanh h\xE0nh \u0111\u1ED9ng d\xE1n \u0111\xE1y m\xE0n h\xECnh</div>
        <div *sdDesktop class="device-card device-card--desktop">Thanh h\xE0nh \u0111\u1ED9ng n\u1EB1m trong toolbar</div>
      </div>
    </demo-section>`}),"directives/mobile/example-chi-render-tren-mobile":t(e({},o["directives/mobile"]),{html:`<demo-section
      heading="Ch\u1EC9 render tr\xEAn mobile"
      [props]="[{ name: '*sdMobile', value: 'true' }]"
      note="M\u1EDF DevTools \u1EDF ch\u1EBF \u0111\u1ED9 device r\u1ED3i t\u1EA3i l\u1EA1i trang \u0111\u1EC3 th\u1EA5y kh\u1ED1i n\xE0y xu\u1EA5t hi\u1EC7n \u2014 directive \u0111\u1ECDc user agent l\xFAc kh\u1EDFi t\u1EA1o, kh\xF4ng ph\u1EA3n \u1EE9ng v\u1EDBi resize.">
      <div class="device-box">
        <div *sdMobile class="device-card device-card--mobile" data-mobile-block>N\u1ED9i dung ch\u1EC9 d\xE0nh cho mobile</div>
        <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
      </div>
    </demo-section>`}),"directives/scroll/example-thanh-cuon-ngang-chi-hien-khi-hover":t(e({},o["directives/scroll"]),{html:`<demo-section
      heading="Thanh cu\u1ED9n ngang ch\u1EC9 hi\u1EC7n khi hover"
      [props]="[{ name: '[sdScroll]', value: 'true' }]"
      note="R\xEA chu\u1ED9t v\xE0o khung \u0111\u1EC3 th\u1EA5y thanh cu\u1ED9n ngang xu\u1EA5t hi\u1EC7n; \u0111\u01B0a chu\u1ED9t ra ngo\xE0i, overflow-x quay l\u1EA1i hidden. Directive c\u0169ng ph\xE1t scrollTop() \u0111\u1EC3 cu\u1ED9n khung v\u1EC1 \u0111\u1EA7u.">
      <div class="scroll-frame" sdScroll #frame data-scroll-frame>
        <div class="scroll-wide">
          @for (row of rows; track row) {
            <p>{{ row }}</p>
          }
        </div>
      </div>
    </demo-section>`}),"directives/tooltip/example-noi-dung-dang-template":t(e({},o["directives/tooltip"]),{html:`<demo-section
      heading="N\u1ED9i dung d\u1EA1ng template"
      [props]="[{ name: '[sdTooltip]', value: 'template' }]"
      note="Truy\u1EC1n TemplateRef \u0111\u1EC3 tooltip mang markup th\u1EADt (danh s\xE1ch, nh\xE3n, li\xEAn k\u1EBFt) thay v\xEC m\u1ED9t d\xF2ng ch\u1EEF.">
      <button type="button" class="demo-target" [sdTooltip]="richTooltip" data-tooltip-template>Chi ti\u1EBFt ph\xED</button>
      <ng-template #richTooltip>
        <div class="rich-tooltip">
          <strong>Ph\xED giao d\u1ECBch</strong>
          <span>Ph\xED c\u1ED1 \u0111\u1ECBnh: 11.000 \u0111</span>
          <span>Ph\xED theo gi\xE1 tr\u1ECB: 0,02%</span>
        </div>
      </ng-template>
    </demo-section>`}),"directives/tooltip/example-tooltip-van-ban":t(e({},o["directives/tooltip"]),{html:`<demo-section
      heading="Tooltip v\u0103n b\u1EA3n"
      [props]="[{ name: '[sdTooltip]', value: 'text' }]"
      note="R\xEA chu\u1ED9t v\xE0o n\xFAt \u0111\u1EC3 tooltip hi\u1EC7n b\xEAn d\u01B0\u1EDBi \u2014 v\u1ECB tr\xED m\u1EB7c \u0111\u1ECBnh l\xE0 bottom.">
      <button type="button" class="demo-target" [sdTooltip]="'S\u1ED1 d\u01B0 kh\u1EA3 d\u1EE5ng sau khi tr\u1EEB phong to\u1EA3'" data-tooltip-basic>
        S\u1ED1 d\u01B0 kh\u1EA3 d\u1EE5ng
      </button>
    </demo-section>`}),"directives/tooltip/example-vi-tri-mau-va-do-tre":t(e({},o["directives/tooltip"]),{html:`<demo-section
      heading="V\u1ECB tr\xED, m\xE0u v\xE0 \u0111\u1ED9 tr\u1EC5"
      [props]="[
        { name: 'sdTooltipPosition', value: 'top / bottom / left / right' },
        { name: 'sdTooltipColor', value: '#hex' },
        { name: 'sdTooltipDelay', value: 'ms' },
      ]"
      note="Delay t\xEDnh b\u1EB1ng mili-gi\xE2y tr\u01B0\u1EDBc khi overlay m\u1EDF; m\xE0u \xE1p th\u1EB3ng v\xE0o n\u1EC1n h\u1ED9p tooltip.">
      <button type="button" class="demo-target" [sdTooltip]="'Hi\u1EC7n ph\xEDa tr\xEAn'" sdTooltipPosition="top" data-tooltip-top>Top</button>
      <button type="button" class="demo-target" [sdTooltip]="'Hi\u1EC7n b\xEAn tr\xE1i'" sdTooltipPosition="left" data-tooltip-left>Left</button>
      <button
        type="button"
        class="demo-target"
        [sdTooltip]="'\u0110\u1ECF c\u1EA3nh b\xE1o, ch\u1EDD 600ms'"
        sdTooltipPosition="right"
        sdTooltipColor="#d92d20"
        [sdTooltipDelay]="600"
        data-tooltip-delay>
        Right + delay
      </button>
    </demo-section>`}),"forms/autocomplete/example-cac-trang-thai-bao-loi":t(e({},o["forms/autocomplete"]),{html:`<demo-section
    heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i"
    [props]="[{ name: 'required', value: 'true' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
    note="B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched. \xD4 [validator] c\u1EA5m ch\u1ECDn 'Hoa K\u1EF3' \u2014 ch\u1ECDn Hoa K\u1EF3 \u0111\u1EC3 th\u1EA5y message (\u0111\xE2y l\xE0 l\u1ED7i \u0111\xE3 s\u1EEDa: [validator] b\u1EA5t \u0111\u1ED3ng b\u1ED9 tr\u01B0\u1EDBc kia kh\xF4ng hi\u1EC7n \u0111\u01B0\u1EE3c message). \u0110\u1EB7t l\u1EA1i gieo l\u1EA1i gi\xE1 tr\u1ECB m\u1EABu \u0111\u1EC3 demo l\u1EB7p \u0111\u01B0\u1EE3c.">
    <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-autocomplete>
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="[validator] (c\u1EA5m Hoa K\u1EF3)" [(model)]="errValidator" [form]="formErr" [validator]="forbidUS"></sd-autocomplete>
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="inlineError (l\u1ED7i do cha truy\u1EC1n)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-autocomplete>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
        <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/autocomplete/example-chinh-sua-noi-tuyen":t(e({},o["forms/autocomplete"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="B\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF panel g\xF5/l\u1ECDc; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
    <div style="width: 280px; font-size:13px; color:#555">
      Qu\u1ED1c t\u1ECBch:
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-autocomplete>
    </div>
  </demo-section>`}),"forms/autocomplete/example-co-ban":t(e({},o["forms/autocomplete"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="G\xF5 v\xE0i k\xFD t\u1EF1 \u0111\u1EC3 l\u1ECDc danh s\xE1ch.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="Qu\u1ED1c t\u1ECBch" placeholder="G\xF5 \u0111\u1EC3 t\xECm..."
        [(model)]="country" [form]="form"></sd-autocomplete>
      <div style="font-size:12px; color:#555">M\xE3 \u0111\xE3 ch\u1ECDn: <b>{{ country() ?? '(tr\u1ED1ng)' }}</b></div>
    </div>
  </demo-section>`}),"forms/autocomplete/example-them-moi":t(e({},o["forms/autocomplete"]),{html:`<demo-section heading="Th\xEAm m\u1EDBi" [props]="[{ name: 'addable', value: 'true' }]" note="Cho ph\xE9p th\xEAm gi\xE1 tr\u1ECB kh\xF4ng c\xF3 trong danh s\xE1ch.">
    <div style="width: 320px">
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="addable" placeholder="G\xF5 v\xE0 Enter \u0111\u1EC3 th\xEAm..."
        [(model)]="tag" [form]="form" addable></sd-autocomplete>
    </div>
  </demo-section>`}),"forms/autocomplete/example-trang-thai":t(e({},o["forms/autocomplete"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Kho\xE1 t\u01B0\u01A1ng t\xE1c.">
    <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
      <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
        label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-autocomplete>
      <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
        label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-autocomplete>
    </div>
  </demo-section>`}),"forms/autocomplete/example-validator":t(e({},o["forms/autocomplete"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1ECF tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i inline.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-autocomplete [items]="countries" valueField="code" displayField="name"
        label="required"
        [(model)]="countryR" [form]="formValid" required></sd-autocomplete>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/checkbox/example-bao-loi-inlineerror":t(e({},o["forms/checkbox"]),{html:`<demo-section
    heading="B\xE1o l\u1ED7i (inlineError)"
    [props]="[{ name: 'inlineError', value: 'text' }]"
    note="Truy\u1EC1n inlineError + b\u1EA5m Hi\u1EC7n l\u1ED7i (markAsTouched) \u2192 message \u0111\u1ECF hi\u1EC7n d\u01B0\u1EDBi checkbox. B\u1EA5m l\u1EA1i \u0110\u1EB7t l\u1EA1i \u0111\u1EC3 \u1EA9n.">
    <div style="display:flex; flex-direction:column; gap:8px; width:100%">
      <sd-checkbox label="T\xF4i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n" [(model)]="errAccept" [form]="formErr" [inlineError]="'B\u1EA1n ph\u1EA3i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n'"></sd-checkbox>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
        <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/checkbox/example-che-do-xem":t(e({},o["forms/checkbox"]),{html:`<demo-section heading="Ch\u1EBF \u0111\u1ED9 xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hi\u1EC7n ch\u1EEF C\xF3/Kh\xF4ng; 'inline' v\u1EABn b\u1EA5m \u0111\u01B0\u1EE3c, disabled+inline th\xEC xem t\u0129nh.">
    <div style="display:flex; gap:16px; flex-wrap:wrap">
      <sd-checkbox label="viewed=true (t\u0129nh)" [(model)]="viewedFlag" [form]="form" viewed></sd-checkbox>
      <sd-checkbox label="inline (v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-checkbox>
      <sd-checkbox label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-checkbox>
    </div>
  </demo-section>`}),"forms/checkbox/example-co-ban":t(e({},o["forms/checkbox"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind [(model)] v\u1EDBi boolean \u2014 hi\u1EC3n th\u1ECB gi\xE1 tr\u1ECB b\xEAn d\u01B0\u1EDBi.">
    <div style="display:flex; flex-direction:column; gap:8px; width:100%">
      <sd-checkbox label="T\xF4i \u0111\u1ED3ng \xFD \u0111i\u1EC1u kho\u1EA3n" [(model)]="accept" [form]="form"></sd-checkbox>
      <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ accept() ? 'TRUE' : 'FALSE' }}</b></div>
    </div>
  </demo-section>`}),"forms/checkbox/example-mau-sac":t(e({},o["forms/checkbox"]),{html:`<demo-section heading="M\xE0u s\u1EAFc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thu\u1ED9c t\xEDnh color thay \u0111\u1ED5i accent.">
    <div style="display:flex; gap:16px; flex-wrap:wrap">
      <sd-checkbox label="primary" color="primary" [(model)]="c1" [form]="form"></sd-checkbox>
      <sd-checkbox label="success" color="success" [(model)]="c2" [form]="form"></sd-checkbox>
      <sd-checkbox label="warning" color="warning" [(model)]="c3" [form]="form"></sd-checkbox>
      <sd-checkbox label="error" color="error" [(model)]="c4" [form]="form"></sd-checkbox>
    </div>
  </demo-section>`}),"forms/checkbox/example-nhom-tuy-chon":t(e({},o["forms/checkbox"]),{html:`<demo-section heading="Nh\xF3m tu\u1EF3 ch\u1ECDn" note="M\u1ED7i checkbox bind 1 bi\u1EBFn \u0111\u1ED9c l\u1EADp.">
    <div style="display:flex; flex-direction:column; gap:4px">
      <sd-checkbox label="Email" [(model)]="optEmail" [form]="form"></sd-checkbox>
      <sd-checkbox label="SMS" [(model)]="optSms" [form]="form"></sd-checkbox>
      <sd-checkbox label="Push notification" [(model)]="optPush" [form]="form"></sd-checkbox>
      <div style="font-size:12px; color:#555; margin-top:4px">
        \u0110\xE3 ch\u1ECDn: <b>{{ summary() || '(ch\u01B0a ch\u1ECDn)' }}</b>
      </div>
    </div>
  </demo-section>`}),"forms/checkbox/example-trang-thai":t(e({},o["forms/checkbox"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
    <div style="display:flex; gap:16px; flex-wrap:wrap">
      <sd-checkbox label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-checkbox>
      <sd-checkbox label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-checkbox>
    </div>
  </demo-section>`}),"forms/chip-calendar/example-bat-buoc-so-toi-thieu":t(e({},o["forms/chip-calendar"]),{html:`<demo-section heading="B\u1EAFt bu\u1ED9c & s\u1ED1 t\u1ED1i thi\u1EC3u" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '3' }]" note="C\u1EA7n t\u1ED1i thi\u1EC3u 3 ng\xE0y. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i.">
    <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
      <sd-chip-calendar label="required + min=3"
        [(model)]="duty" [form]="formValid" required [min]="3"></sd-chip-calendar>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/chip-calendar/example-chinh-sua-noi-tuyen":t(e({},o["forms/chip-calendar"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip l\u1ECBch v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c, nh\u01B0ng khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
    <div style="width: 460px; display:flex; flex-direction:column; gap:12px">
      <sd-chip-calendar label="Ng\xE0y ngh\u1EC9 (inline)" [viewed]="'inline'" [(model)]="inlineDates" [form]="form"></sd-chip-calendar>
      <sd-chip-calendar label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineDates" [form]="form" disabled></sd-chip-calendar>
    </div>
  </demo-section>`}),"forms/chip-calendar/example-lien-ket-hai-chieu":t(e({},o["forms/chip-calendar"]),{html:`<demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF l\u1ECBch v\xE0 ch\u1ECDn nhi\u1EC1u ng\xE0y.">
    <div style="width: 460px; display:flex; flex-direction:column; gap:8px">
      <sd-chip-calendar label="Ng\xE0y ngh\u1EC9 ph\xE9p" helperText="Ch\u1ECDn c\xE1c ng\xE0y d\u1EF1 ki\u1EBFn ngh\u1EC9"
        [(model)]="leaves" [form]="form"></sd-chip-calendar>
      <div style="font-size:12px; color:#555">
        \u0110\xE3 ch\u1ECDn <b>{{ leaves().length }}</b> ng\xE0y: {{ leaves().join(' \xB7 ') || '(tr\u1ED1ng)' }}
      </div>
    </div>
  </demo-section>`}),"forms/chip-calendar/example-vo-hieu-hoa":t(e({},o["forms/chip-calendar"]),{html:`<demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]" note="Kho\xE1 thao t\xE1c \u2013 ch\u1EC9 hi\u1EC3n th\u1ECB c\xE1c chip \u0111\xE3 ch\u1ECDn.">
    <div style="width: 460px">
      <sd-chip-calendar label="disabled" [(model)]="lockedDates" [form]="form" disabled></sd-chip-calendar>
    </div>
  </demo-section>`}),"forms/chip/example-bat-buoc-so-toi-thieu":t(e({},o["forms/chip"]),{html:`<demo-section heading="B\u1EAFt bu\u1ED9c & s\u1ED1 t\u1ED1i thi\u1EC3u" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '3' }]" note="C\u1EA7n \xEDt nh\u1EA5t 3 chip. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
    <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
      <sd-chip label="required + min=3" placeholder="Nh\u1EADp r\u1ED3i Enter..."
        [(model)]="tags" [form]="formValid" required [min]="3"></sd-chip>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/chip/example-chinh-sua-noi-tuyen":t(e({},o["forms/chip"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip strip v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c, nh\u01B0ng khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
    <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
      <sd-chip label="Tags (inline)" [viewed]="'inline'" [(model)]="inlineTags" [form]="form"></sd-chip>
      <sd-chip label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineTags" [form]="form" disabled></sd-chip>
    </div>
  </demo-section>`}),"forms/chip/example-kich-thuoc":t(e({},o["forms/chip"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="Chip thu g\u1ECDn cho b\u1EA3ng / toolbar.">
    <div style="width: 420px">
      <sd-chip label="sm" size="sm" placeholder="Nh\u1EADp nh\xE3n..." [(model)]="filters" [form]="form"></sd-chip>
    </div>
  </demo-section>`}),"forms/chip/example-lien-ket-hai-chieu":t(e({},o["forms/chip"]),{html:`<demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1ED7i chip l\xE0 m\u1ED9t string trong m\u1EA3ng.">
    <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
      <sd-chip label="K\u1EF9 n\u0103ng" placeholder="Nh\u1EADp r\u1ED3i Enter..." helperText="C\xF3 th\u1EC3 th\xEAm nhi\u1EC1u gi\xE1 tr\u1ECB"
        [(model)]="skills" [form]="form"></sd-chip>
      <div style="font-size:12px; color:#555">
        S\u1ED1 chip: <b>{{ skills().length }}</b> \u2014 [{{ skills().join(', ') }}]
      </div>
    </div>
  </demo-section>`}),"forms/chip/example-vo-hieu-hoa":t(e({},o["forms/chip"]),{html:`<demo-section heading="V\xF4 hi\u1EC7u ho\xE1" [props]="[{ name: 'disabled', value: 'true' }]" note="Kh\xF4ng cho th\xEAm / xo\xE1 chip.">
    <div style="width: 420px">
      <sd-chip label="disabled" [(model)]="lockedTags" [form]="form" disabled></sd-chip>
    </div>
  </demo-section>`}),"forms/date-range/example-chinh-sua-noi-tuyen":t(e({},o["forms/date-range"]),{html:`<demo-section
      heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
      [props]="[{ name: 'viewed', value: 'inline' }]"
      note="B\u1EA5m v\xE0o kho\u1EA3ng \u0111\u1EC3 m\u1EDF l\u1ECBch ch\u1ECDn; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
      <div style="width: 340px; font-size:13px; color:#555">
        K\u1EF3: <sd-date-range [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date-range>
      </div>
    </demo-section>`}),"forms/date-range/example-chuan-hoa-gia-tri-dau-ra":t(e({},o["forms/date-range"]),{html:`<demo-section
      heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
      [props]="[{ name: 'transform', value: 'ISOString / UTCString' }]"
      note="M\u1ED7i \u0111\u1EA7u range \u0111\u01B0\u1EE3c serialize RI\xCANG \u2014 c\u1EA3 object kh\xF4ng bao gi\u1EDD b\u1ECB g\u1ED9p th\xE0nh m\u1ED9t chu\u1ED7i. \xD4 nh\u1EADp v\u1EABn l\xE0 dd/MM/yyyy \u2192 dd/MM/yyyy; range thi\u1EBFu m\u1ED9t \u0111\u1EA7u v\u1EABn gi\u1EEF null \u1EDF \u0111\u1EA7u \u0111\xF3.">
      <div class="transform-grid">
        <div>
          <sd-date-range label="ISOString" transform="ISOString" [(model)]="isoPeriod"></sd-date-range>
          <code>{{ isoPeriod() | json }}</code>
        </div>
        <div>
          <sd-date-range label="UTCString" transform="UTCString" [(model)]="utcPeriod"></sd-date-range>
          <code>{{ utcPeriod() | json }}</code>
        </div>
        <div>
          <sd-date-range label="Kh\xF4ng transform" [(model)]="plainPeriod"></sd-date-range>
          <code>{{ plainPeriod() | json }}</code>
        </div>
      </div>
    </demo-section>`}),"forms/date-range/example-co-ban":t(e({},o["forms/date-range"]),{html:`<demo-section
      heading="C\u01A1 b\u1EA3n"
      [props]="[{ name: '[(model)]', value: 'two-way' }]"
      note="Ch\u1ECDn ng\xE0y b\u1EAFt \u0111\u1EA7u v\xE0 ng\xE0y k\u1EBFt th\xFAc trong c\xF9ng popup.">
      <div style="width: 380px; display:flex; flex-direction:column; gap:8px">
        <sd-date-range
          label="Kho\u1EA3ng th\u1EDDi gian b\xE1o c\xE1o"
          helperText="Ch\u1ECDn ng\xE0y b\u1EAFt \u0111\u1EA7u v\xE0 k\u1EBFt th\xFAc"
          [(model)]="period"
          [form]="form"></sd-date-range>
        <div style="font-size:12px; color:#555">
          T\u1EEB <b>{{ period()?.from || '...' }}</b> \u0111\u1EBFn <b>{{ period()?.to || '...' }}</b>
        </div>
      </div>
    </demo-section>`}),"forms/date-range/example-trang-thai":t(e({},o["forms/date-range"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[
        { name: 'disabled', value: 'true' },
        { name: 'viewed', value: 'true' },
      ]"
      note="Kho\u1EA3ng \u0111\xE3 set s\u1EB5n.">
      <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
        <sd-date-range style="width: 300px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date-range>
        <sd-date-range style="width: 300px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date-range>
      </div>
    </demo-section>`}),"forms/date-range/example-validator":t(e({},o["forms/date-range"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="\u0110\u1EC3 tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra.">
      <div style="width: 380px; display:flex; flex-direction:column; gap:12px">
        <sd-date-range label="required" [(model)]="billing" [form]="formValid" required></sd-date-range>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="check()">Ki\u1EC3m tra</button>
          <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/date/example-chinh-sua-noi-tuyen":t(e({},o["forms/date"]),{html:`<demo-section
      heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
      [props]="[{ name: 'viewed', value: 'inline' }]"
      note="B\u1EA5m v\xE0o ng\xE0y \u0111\u1EC3 m\u1EDF l\u1ECBch ngay; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
      <div style="width: 260px; font-size:13px; color:#555">
        Ng\xE0y sinh: <sd-date [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-date>
      </div>
    </demo-section>`}),"forms/date/example-chuan-hoa-gia-tri-dau-ra":t(e({},o["forms/date"]),{html:`<demo-section
      heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
      [props]="[{ name: 'transform', value: 'ISOString / UTCString' }]"
      note="transform ch\u1EC9 \u0111\u1ED5i gi\xE1 tr\u1ECB \u0111i ra (model, sdChange, field trong FormGroup) \u2014 \xF4 nh\u1EADp v\u1EABn l\xE0 dd/MM/yyyy. Ng\xE0y \u0111\u01B0\u1EE3c serialize \u1EDF n\u1EEDa \u0111\xEAm GI\u1EDC \u0110\u1ECAA PH\u01AF\u01A0NG, n\xEAn ph\u1EA7n ng\xE0y trong chu\u1ED7i UTC c\xF3 th\u1EC3 l\u1EC7ch m\u1ED9t ng\xE0y so v\u1EDBi \xF4 hi\u1EC3n th\u1ECB. \u0110\xF3 l\xE0 c\xF9ng m\u1ED9t th\u1EDDi \u0111i\u1EC3m.">
      <div class="transform-grid">
        <div>
          <sd-date label="ISOString" transform="ISOString" [(model)]="isoDate"></sd-date>
          <code>{{ isoDate() ?? '\u2014' }}</code>
        </div>
        <div>
          <sd-date label="UTCString" transform="UTCString" [(model)]="utcDate"></sd-date>
          <code>{{ utcDate() ?? '\u2014' }}</code>
        </div>
        <div>
          <sd-date label="Kh\xF4ng transform" [(model)]="plainDate"></sd-date>
          <code>{{ plainDate() ?? '\u2014' }}</code>
        </div>
      </div>
    </demo-section>`}),"forms/date/example-co-ban":t(e({},o["forms/date"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF l\u1ECBch v\xE0 ch\u1ECDn ng\xE0y.">
      <div style="width: 320px; display:flex; flex-direction:column; gap:8px">
        <sd-date label="Ng\xE0y sinh" helperText="Theo CMND/CCCD" [(model)]="birthday" [form]="form"></sd-date>
        <div style="font-size:12px; color:#555">
          Gi\xE1 tr\u1ECB: <b>{{ birthday() || '(tr\u1ED1ng)' }}</b>
        </div>
      </div>
    </demo-section>`}),"forms/date/example-kich-thuoc":t(e({},o["forms/date"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="UI g\u1ECDn cho toolbar.">
      <div style="width: 280px">
        <sd-date label="sm" size="sm" [(model)]="filter" [form]="form"></sd-date>
      </div>
    </demo-section>`}),"forms/date/example-trang-thai":t(e({},o["forms/date"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[
        { name: 'disabled', value: 'true' },
        { name: 'viewed', value: 'true' },
      ]"
      note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
      <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
        <sd-date style="width: 240px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-date>
        <sd-date style="width: 240px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-date>
      </div>
    </demo-section>`}),"forms/date/example-validator":t(e({},o["forms/date"]),{html:`<demo-section
      heading="Validator"
      [props]="[{ name: 'required', value: 'true' }]"
      note="\u0110\u1EC3 tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i inline.">
      <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
        <sd-date label="required" [(model)]="startDate" [form]="formValid" required></sd-date>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="check()">Ki\u1EC3m tra</button>
          <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/datetime/example-chinh-sua-noi-tuyen":t(e({},o["forms/datetime"]),{html:`<demo-section
      heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
      [props]="[{ name: 'viewed', value: 'inline' }]"
      note="B\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF overlay datetime; text gi\u1EEF nguy\xEAn t\u1EDBi khi ch\u1ECDn. Hover hi\u1EC7n \xD7 \u0111\u1EC3 xo\xE1.">
      <div style="width: 300px; font-size:13px; color:#555">
        H\u1EB9n l\xFAc: <sd-datetime [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-datetime>
      </div>
    </demo-section>`}),"forms/datetime/example-chuan-hoa-gia-tri-dau-ra":t(e({},o["forms/datetime"]),{html:`<demo-section
      heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB \u0111\u1EA7u ra"
      [props]="[
        { name: 'transform', value: 'ISOString / UTCString' },
        { name: 'showSeconds', value: 'true' },
      ]"
      note="transform ch\u1EC9 \u0111\u1ED5i gi\xE1 tr\u1ECB \u0111i ra \u2014 \xF4 nh\u1EADp v\u1EABn theo showSeconds. \u0110\u1ED9 ch\xEDnh x\xE1c v\u1EABn do showSeconds quy \u0111\u1ECBnh: t\u1EAFt th\xEC gi\xE2y v\u1EC1 0, b\u1EADt th\xEC gi\u1EEF gi\xE2y; mili-gi\xE2y lu\xF4n b\u1EB1ng 0.">
      <div class="transform-grid">
        <div>
          <sd-datetime label="ISOString" transform="ISOString" [(model)]="isoAt"></sd-datetime>
          <code>{{ isoAt() ?? '\u2014' }}</code>
        </div>
        <div>
          <sd-datetime label="UTCString + gi\xE2y" transform="UTCString" [showSeconds]="true" [(model)]="utcAt"></sd-datetime>
          <code>{{ utcAt() ?? '\u2014' }}</code>
        </div>
        <div>
          <sd-datetime label="Kh\xF4ng transform" [(model)]="plainAt"></sd-datetime>
          <code>{{ plainAt() ?? '\u2014' }}</code>
        </div>
      </div>
    </demo-section>`}),"forms/datetime/example-co-ban":t(e({},o["forms/datetime"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="M\u1EDF popup picker \u0111\u1EC3 ch\u1ECDn ng\xE0y v\xE0 gi\u1EDD.">
      <div style="width: 340px; display:flex; flex-direction:column; gap:8px">
        <sd-datetime label="Th\u1EDDi \u0111i\u1EC3m cu\u1ED9c h\u1ECDp" helperText="Bao g\u1ED3m ng\xE0y v\xE0 gi\u1EDD" [(model)]="meeting" [form]="form"></sd-datetime>
        <div style="font-size:12px; color:#555">
          Gi\xE1 tr\u1ECB: <b>{{ meeting() || '(tr\u1ED1ng)' }}</b>
        </div>
      </div>
    </demo-section>`}),"forms/datetime/example-trang-thai":t(e({},o["forms/datetime"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[
        { name: 'disabled', value: 'true' },
        { name: 'viewed', value: 'true' },
      ]"
      note="Hai tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
      <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
        <sd-datetime style="width: 260px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-datetime>
        <sd-datetime style="width: 260px" label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-datetime>
      </div>
    </demo-section>`}),"forms/datetime/example-validator":t(e({},o["forms/datetime"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1ECF tr\u1ED1ng v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 xem l\u1ED7i.">
      <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
        <sd-datetime label="required" [(model)]="startAt" [form]="formValid" required></sd-datetime>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="check()">Ki\u1EC3m tra</button>
          <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/entity-picker/example-error-retry-va-create-action":t(e({},o["forms/entity-picker"]),{html:`<demo-section
      heading="Error, retry v\xE0 create action"
      [props]="[{ name: 'addable', value: true }]"
      note="Provider l\u1ED7i hi\u1EC3n th\u1ECB DataState retry; create ch\u1EC9 ph\xE1t event, kh\xF4ng hard-code workflow nghi\u1EC7p v\u1EE5.">
      <sd-entity-picker
        style="max-width: 520px"
        [provider]="errorProvider"
        valueField="id"
        displayField="name"
        addable
        (sdAdd)="onAdd()" />
      <div data-add-count>Create actions: {{ addCount() }}</div>
    </demo-section>`}),"forms/entity-picker/example-multi-select-va-hydration":t(e({},o["forms/entity-picker"]),{html:`<demo-section
      heading="Multi-select v\xE0 hydration"
      [props]="[{ name: 'model', value: multi().join(', ') }]"
      note="EMP-042 kh\xF4ng thu\u1ED9c page \u0111\u1EA7u nh\u01B0ng v\u1EABn \u0111\u01B0\u1EE3c hydrate v\xE0 hi\u1EC3n th\u1ECB theo stable key.">
      <sd-entity-picker
        style="max-width: 520px"
        [provider]="provider"
        [columns]="columns"
        valueField="id"
        displayField="name"
        multiple
        [(model)]="multi">
        <ng-template sdEntityPickerSelected let-entities="entities" let-keys="keys">
          {{ entities.length }} nh\xE2n vi\xEAn \xB7 keys {{ keys.join(', ') }}
        </ng-template>
      </sd-entity-picker>
    </demo-section>`}),"forms/entity-picker/example-row-va-detail-template":t(e({},o["forms/entity-picker"]),{html:`<demo-section
      heading="Row v\xE0 detail template"
      note="Template nh\u1EADn entity \u0111\xE3 hydrate; table engine v\xE0 selection engine v\u1EABn do SdTable s\u1EDF h\u1EEFu.">
      <sd-entity-picker style="max-width: 520px" [provider]="provider" valueField="id" displayField="name" [model]="3">
        <ng-template sdEntityPickerRow let-employee="item">
          <strong>{{ employee.name }}</strong> \xB7 {{ employee.department }}
        </ng-template>
        <ng-template sdEntityPickerDetail let-entities="entities"> Selected detail: {{ entities[0]?.code }} </ng-template>
      </sd-entity-picker>
    </demo-section>`}),"forms/entity-picker/example-server-single-select":t(e({},o["forms/entity-picker"]),{html:`<demo-section
      heading="Server single-select"
      [props]="[
        { name: 'model', value: single() ?? 'null' },
        { name: 'pageSize', value: 10 },
      ]"
      note="T\xECm ki\u1EBFm, filter, sort v\xE0 paging \u0111i qua provider; request c\u0169 nh\u1EADn AbortSignal khi query m\u1EDBi b\u1EAFt \u0111\u1EA7u.">
      <sd-entity-picker
        style="max-width: 520px"
        [provider]="provider"
        [columns]="columns"
        [queryFields]="queryFields"
        valueField="id"
        displayField="name"
        [pageSize]="10"
        [(model)]="single" />
    </demo-section>`}),"forms/inline-text/example-chinh-sua-noi-tuyen":t(e({},o["forms/inline-text"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="C\xF9ng primitive \u2014 inline edit \xF4m s\xE1t n\u1ED9i dung, kh\xF4ng c\xF2n full-width.">
    <div class="stack">
      <span class="row">sd-input: <sd-input [(model)]="inlineStr" [viewed]="'inline'" placeholder="nh\u1EADp t\xEAn\u2026" /></span>
      <span class="row">sd-input-number: <sd-input-number [(model)]="inlineNum" [viewed]="'inline'" placeholder="nh\u1EADp s\u1ED1\u2026" /></span>
    </div>
  </demo-section>`}),"forms/inline-text/example-formcontrol":t(e({},o["forms/inline-text"]),{html:`<demo-section heading="FormControl" [props]="[{ name: 'control', value: 'FormControl' }]" note="Bind FormControl ngo\xE0i (ch\u1EBF \u0111\u1ED9 form controls d\xF9ng). Disabled qua control.">
    <div class="stack">
      <span class="row">control: <sd-inline-text [control]="ctrl" /> <code>{{ ctrl.value }}</code></span>
      <span class="row">disabled control: <sd-inline-text [control]="ctrlDisabled" /></span>
    </div>
  </demo-section>`}),"forms/inline-text/example-kieu-vien":t(e({},o["forms/inline-text"]),{html:`<demo-section heading="Ki\u1EC3u vi\u1EC1n" [props]="[{ name: 'chrome', value: 'standalone / seamless' }]" note="standalone t\u1EF1 v\u1EBD n\u1EC1n hover + ring focus; seamless trong su\u1ED1t \u0111\u1EC3 pill cha (chip) v\u1EBD vi\u1EC1n/n\u1EC1n.">
    <div class="stack">
      <span class="row">standalone: <sd-inline-text chrome="standalone" [(value)]="cs1" /></span>
      <span class="row pill">seamless trong 1 pill: <span class="fake-chip">T\xEAn: <sd-inline-text chrome="seamless" [clearable]="false" [state]="'active'" [(value)]="cs2" /></span></span>
    </div>
  </demo-section>`}),"forms/inline-text/example-lien-ket-hai-chieu":t(e({},o["forms/inline-text"]),{html:`<demo-section heading="Li\xEAn k\u1EBFt hai chi\u1EC1u" [props]="[{ name: '[(value)]', value: 'two-way' }]" note="V\xF9ng hover/click b\xE1m theo \u0111\u1ED9 d\xE0i gi\xE1 tr\u1ECB \u2014 kh\xF4ng k\xE9o full width. D\xE0i/ng\u1EAFn kh\xE1c nhau \u2192 r\u1ED9ng kh\xE1c nhau.">
    <div class="stack">
      <span class="row"><sd-inline-text [(value)]="short" /> <code>{{ short() || '(tr\u1ED1ng)' }}</code></span>
      <span class="row"><sd-inline-text [(value)]="medium" /> <code>{{ medium() }}</code></span>
      <span class="row"><sd-inline-text [(value)]="long" /> <code>{{ long() }}</code></span>
      <span class="row"><sd-inline-text [(value)]="empty" placeholder="nh\u1EADp gi\xE1 tr\u1ECB\u2026" /> <code>placeholder khi tr\u1ED1ng</code></span>
    </div>
  </demo-section>`}),"forms/inline-text/example-trang-thai":t(e({},o["forms/inline-text"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'state', value: 'pending / active / error' }]" note="auto suy ra t\u1EEB focus + value; c\xF3 th\u1EC3 override (vd error).">
    <div class="stack">
      <span class="row">pending (tr\u1ED1ng): <sd-inline-text [(value)]="stEmpty" placeholder="\u2026" /></span>
      <span class="row">active (c\xF3 value): <sd-inline-text [(value)]="stActive" /></span>
      <span class="row">error (override): <sd-inline-text [(value)]="stErr" [state]="'error'" /></span>
    </div>
  </demo-section>`}),"forms/input-color/example-chinh-sua-noi-tuyen":t(e({},o["forms/input-color"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 s\u1EEDa. Khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
    <div class="row">
      <sd-input-color label="M\xE0u inline" [viewed]="'inline'" [(model)]="inlineColor" />
      <span class="value">Gi\xE1 tr\u1ECB: <b>{{ inlineColor() ?? '(tr\u1ED1ng)' }}</b></span>
    </div>
    <div class="row">
      <sd-input-color label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="inlineColor" [disabled]="true" />
    </div>
  </demo-section>`}),"forms/input-color/example-co-ban":t(e({},o["forms/input-color"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Gi\xE1 tr\u1ECB bind hai chi\u1EC1u \u2014 pick ho\u1EB7c g\xF5 tay \u0111\u1EC1u c\u1EADp nh\u1EADt signal.">
    <div class="row">
      <sd-input-color label="M\xE0u th\u01B0\u01A1ng hi\u1EC7u" [(model)]="brand" />
      <span class="value">\u0110ang ch\u1ECDn: <code>{{ brand() || '(tr\u1ED1ng)' }}</code></span>
    </div>
  </demo-section>`}),"forms/input-color/example-hex-ngan-alpha":t(e({},o["forms/input-color"]),{html:`<demo-section heading="Hex ng\u1EAFn / alpha" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Picker t\u1EF1 normalize #RGB \u2192 #RRGGBB v\xE0 b\u1ECF alpha; swatch gi\u1EEF gi\xE1 tr\u1ECB th\u1EADt.">
    <div class="row">
      <sd-input-color label="Hex 3 k\xFD t\u1EF1" [(model)]="shortHex" />
      <span class="value">Swatch hi\u1EC3n th\u1ECB: <code>{{ shortHex() }}</code></span>
    </div>
    <div class="row">
      <sd-input-color label="Hex 8 k\xFD t\u1EF1 (c\xF3 alpha)" [(model)]="alphaHex" />
      <span class="value">Swatch hi\u1EC3n th\u1ECB: <code>{{ alphaHex() }}</code></span>
    </div>
  </demo-section>`}),"forms/input-color/example-trang-thai":t(e({},o["forms/input-color"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]">
    <sd-input-color label="disabled" [model]="'#005CBB'" [disabled]="true" />
    <sd-input-color label="readonly" [model]="'#2E7D32'" [readonly]="true" />
    <sd-input-color label="viewed" [model]="'#BA1A1A'" [viewed]="true" />
  </demo-section>`}),"forms/input-color/example-validator":t(e({},o["forms/input-color"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="\u0110\u1EC3 tr\u1ED1ng ho\u1EB7c g\xF5 chu\u1ED7i sai \u0111\u1ECBnh d\u1EA1ng (vd 'red') s\u1EBD hi\u1EC7n l\u1ED7i.">
    <sd-input-color
      label="required"
      helperText="\u0110\u1ECBnh d\u1EA1ng #RGB, #RRGGBB ho\u1EB7c #RRGGBBAA"
      [required]="true"
      [(model)]="tagColor" />
  </demo-section>`}),"forms/input-number/example-bao-loi-dang-icon-hideinlineerror":t(e({},o["forms/input-number"]),{html:`<demo-section
    heading="B\xE1o l\u1ED7i d\u1EA1ng icon (hideInlineError)"
    [props]="[{ name: 'hideInlineError', value: 'true' }, { name: '[validator]', value: 'fn' }]"
    note="hideInlineError=true: icon \u26A0 \u0111\u1ECF s\xE1t m\xE9p ph\u1EA3i, message qua tooltip. C\xE1c \xF4 c\xF3 gi\xE1 tr\u1ECB n\xEAn n\xFAt xo\xE1 (\xD7) hi\u1EC7n c\u1EA1nh icon (xo\xE1 b\xEAn tr\xE1i, icon l\u1ED7i s\xE1t m\xE9p ph\u1EA3i \u2014 kh\xF4ng b\u1ECB \u0111\u1EA9y v\xE0o trong).">
    <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
      <sd-input-number label="min = 10" [(model)]="iconMin" [form]="formIcon" [min]="10" hideInlineError></sd-input-number>
      <sd-input-number label="max = 100" [(model)]="iconMax" [form]="formIcon" [max]="100" hideInlineError></sd-input-number>
      <sd-input-number label="[validator] (c\u1EA5m s\u1ED1 13)" [(model)]="iconValidator" [form]="formIcon" [validator]="forbidThirteen" hideInlineError></sd-input-number>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="showIcon()">Hi\u1EC7n l\u1ED7i</button>
        <button type="button" (click)="resetIcon()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/input-number/example-cac-trang-thai-bao-loi-inline":t(e({},o["forms/input-number"]),{html:`<demo-section
    heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i (inline)"
    [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
    note="M\u1ED7i \xF4 minh ho\u1EA1 m\u1ED9t lo\u1EA1i l\u1ED7i. B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched. \xD4 [validator] c\u1EA5m s\u1ED1 13 \u2014 g\xF5 13 \u0111\u1EC3 th\u1EA5y message (\u0111\xE2y l\xE0 l\u1ED7i \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EEDa: tr\u01B0\u1EDBc kia [validator] kh\xF4ng hi\u1EC7n \u0111\u01B0\u1EE3c message).">
    <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
      <sd-input-number label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-input-number>
      <sd-input-number label="min = 10" [(model)]="errMin" [form]="formErr" [min]="10"></sd-input-number>
      <sd-input-number label="max = 100" [(model)]="errMax" [form]="formErr" [max]="100"></sd-input-number>
      <sd-input-number label="[validator] (c\u1EA5m s\u1ED1 13)" [(model)]="errValidator" [form]="formErr" [validator]="forbidThirteen"></sd-input-number>
      <sd-input-number label="inlineError (l\u1ED7i do cha truy\u1EC1n)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-input-number>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
        <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/input-number/example-chinh-sua-noi-tuyen":t(e({},o["forms/input-number"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input s\u1ED1 trong su\u1ED1t nh\xECn nh\u01B0 text; focus \u0111\u1EC3 s\u1EEDa, blur format l\u1EA1i (vd 12.345). Hover \u0111\u1EADm n\u1EC1n.">
    <div style="width: 240px; font-size:13px; color:#555">
      S\u1ED1 l\u01B0\u1EE3ng: <sd-input-number [viewed]="'inline'" [(model)]="lockedC" [form]="form"></sd-input-number>
    </div>
  </demo-section>`}),"forms/input-number/example-co-ban":t(e({},o["forms/input-number"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="T\u1EF1 \u0111\u1ED9ng format khi g\xF5.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-input-number label="S\u1ED1 l\u01B0\u1EE3ng" placeholder="Nh\u1EADp s\u1ED1..." [(model)]="qty" [form]="form"></sd-input-number>
      <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB hi\u1EC7n t\u1EA1i: <b>{{ qty() ?? '(tr\u1ED1ng)' }}</b></div>
    </div>
  </demo-section>`}),"forms/input-number/example-trang-thai":t(e({},o["forms/input-number"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Ba tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
    <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
      <sd-input-number style="width: 200px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input-number>
      <sd-input-number style="width: 200px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input-number>
      <sd-input-number style="width: 200px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input-number>
    </div>
  </demo-section>`}),"forms/input-number/example-validator":t(e({},o["forms/input-number"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }]" note="min=10, max=100. B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-input-number label="required + min=10 + max=100" [(model)]="age" [form]="formValid" required [min]="10" [max]="100"></sd-input-number>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/input/example-bao-loi-dang-icon-hideinlineerror":t(e({},o["forms/input"]),{html:`<demo-section
      heading="B\xE1o l\u1ED7i d\u1EA1ng icon (hideInlineError)"
      [props]="[
        { name: 'hideInlineError', value: 'true' },
        { name: '[validator]', value: 'fn' },
      ]"
      note="Khi hideInlineError=true: kh\xF4ng c\xF3 d\xF2ng l\u1ED7i d\u01B0\u1EDBi \xF4 \u2014 thay v\xE0o \u0111\xF3 icon \u26A0 \u0111\u1ECF n\u1EB1m s\xE1t m\xE9p ph\u1EA3i, message hi\u1EC7n qua tooltip khi hover. C\xE1c \xF4 \u0111\xE3 c\xF3 gi\xE1 tr\u1ECB n\xEAn n\xFAt xo\xE1 (\xD7) c\u0169ng hi\u1EC7n c\u1EA1nh icon l\u1ED7i (xo\xE1 n\u1EB1m b\xEAn tr\xE1i, icon l\u1ED7i s\xE1t m\xE9p ph\u1EA3i).">
      <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
        <sd-input label="minlength = 6" [(model)]="iconMinLen" [form]="formIcon" [minlength]="6" hideInlineError></sd-input>
        <sd-input
          label="pattern = 10 ch\u1EEF s\u1ED1"
          [(model)]="iconPattern"
          [form]="formIcon"
          pattern="^\\d{10}$"
          patternErrorMessage="Ph\u1EA3i g\u1ED3m \u0111\xFAng 10 ch\u1EEF s\u1ED1"
          hideInlineError></sd-input>
        <sd-input
          label="[validator] (c\u1EA5m 'admin')"
          [(model)]="iconValidator"
          [form]="formIcon"
          [validator]="forbidAdmin"
          hideInlineError></sd-input>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="showIcon()">Hi\u1EC7n l\u1ED7i</button>
          <button type="button" (click)="resetIcon()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/input/example-cac-trang-thai-bao-loi-inline":t(e({},o["forms/input"]),{html:`<demo-section
      heading="C\xE1c tr\u1EA1ng th\xE1i b\xE1o l\u1ED7i (inline)"
      [props]="[
        { name: 'required', value: 'true' },
        { name: 'minlength', value: '6' },
        { name: 'pattern', value: 'regex' },
        { name: '[validator]', value: 'fn' },
        { name: 'inlineError', value: 'text' },
      ]"
      note="M\u1ED7i \xF4 minh ho\u1EA1 m\u1ED9t lo\u1EA1i l\u1ED7i. B\u1EA5m Hi\u1EC7n l\u1ED7i \u0111\u1EC3 mark touched \u2014 l\u1ED7i xu\u1EA5t hi\u1EC7n d\u01B0\u1EDBi \xF4 (\u0111\u1ECF). \xD4 [validator] c\u1EA5m ch\u1EEF 'admin'; g\xF5 admin \u0111\u1EC3 th\u1EA5y l\u1ED7i.">
      <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
        <sd-input label="required (\u0111\u1EC3 tr\u1ED1ng)" [(model)]="errRequired" [form]="formErr" required></sd-input>
        <sd-input label="minlength = 6" [(model)]="errMinLen" [form]="formErr" [minlength]="6"></sd-input>
        <sd-input
          label="pattern = 10 ch\u1EEF s\u1ED1"
          placeholder="vd: 0987654321"
          [(model)]="errPattern"
          [form]="formErr"
          pattern="^\\d{10}$"
          patternErrorMessage="Ph\u1EA3i g\u1ED3m \u0111\xFAng 10 ch\u1EEF s\u1ED1"></sd-input>
        <sd-input label="[validator] (c\u1EA5m 'admin')" [(model)]="errValidator" [form]="formErr" [validator]="forbidAdmin"></sd-input>
        <sd-input
          label="inlineError (l\u1ED7i do cha truy\u1EC1n)"
          [(model)]="errInline"
          [form]="formErr"
          [inlineError]="serverError()"></sd-input>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="showErr()">Hi\u1EC7n l\u1ED7i</button>
          <button type="button" (click)="resetErr()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/input/example-chinh-sua-noi-tuyen":t(e({},o["forms/input"]),{html:`<demo-section
      heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn"
      [props]="[{ name: 'viewed', value: 'inline' }]"
      note="Input trong su\u1ED1t nh\xECn nh\u01B0 text; b\u1EA5m/focus l\xE0 g\xF5 tr\u1EF1c ti\u1EBFp (kh\xF4ng c\xF3 panel). Hover \u0111\u1EADm n\u1EC1n.">
      <div style="width: 260px; font-size:13px; color:#555">
        H\u1ECD t\xEAn: <sd-input [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-input>
      </div>
    </demo-section>`}),"forms/input/example-co-ban":t(e({},o["forms/input"]),{html:`<demo-section
      heading="C\u01A1 b\u1EA3n"
      [props]="[{ name: '[(model)]', value: 'two-way' }]"
      note="Bind hai chi\u1EC1u v\u1EDBi [(model)] v\xE0 FormGroup chia s\u1EBB.">
      <div style="width: 320px">
        <sd-input
          label="H\u1ECD v\xE0 t\xEAn"
          placeholder="Nh\u1EADp h\u1ECD t\xEAn..."
          helperText="T\xEAn \u0111\u1EA7y \u0111\u1EE7 theo CMND"
          [(model)]="basic"
          [form]="form"></sd-input>
      </div>
    </demo-section>`}),"forms/input/example-input-mask-raw-model-display-value":t(e({},o["forms/input"]),{html:`<demo-section
      heading="Input mask: raw model / display value"
      [props]="[
        { name: 'mask', value: 'VN_PHONE' },
        { name: 'model', value: maskedPhone() ?? 'null' },
      ]"
      note="M\xE0n h\xECnh hi\u1EC3n th\u1ECB kho\u1EA3ng c\xE1ch, nh\u01B0ng model, sdChange v\xE0 FormGroup ch\u1EC9 nh\u1EADn chu\u1ED7i s\u1ED1 raw.">
      <div style="width: 320px">
        <sd-input label="\u0110i\u1EC7n tho\u1EA1i" mask="VN_PHONE" [(model)]="maskedPhone" [form]="form"></sd-input>
      </div>
    </demo-section>`}),"forms/input/example-kich-thuoc":t(e({},o["forms/input"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="size='sm' cho UI g\u1ECDn h\u01A1n.">
      <div style="width: 320px">
        <sd-input label="sm" size="sm" placeholder="VD: NV001" [(model)]="codeSm" [form]="form"></sd-input>
      </div>
    </demo-section>`}),"forms/input/example-trang-thai":t(e({},o["forms/input"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[
        { name: 'disabled', value: 'true' },
        { name: 'readonly', value: 'true' },
        { name: 'viewed', value: 'true' },
      ]"
      note="Ba tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
      <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
        <sd-input style="width: 220px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input>
        <sd-input style="width: 220px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input>
        <sd-input style="width: 220px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input>
      </div>
    </demo-section>`}),"forms/input/example-validator":t(e({},o["forms/input"]),{html:`<demo-section
      heading="Validator"
      [props]="[
        { name: 'required', value: 'true' },
        { name: 'type', value: 'email' },
        { name: 'minlength', value: '6' },
      ]"
      note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i inline.">
      <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
        <sd-input
          label="required + type=email"
          placeholder="vd: a@b.com"
          type="email"
          [(model)]="email"
          [form]="formValid"
          required></sd-input>
        <sd-input
          label="required + minlength=6"
          type="password"
          [(model)]="password"
          [form]="formValid"
          required
          [minlength]="6"></sd-input>
        <div style="display:flex; gap:8px">
          <button type="button" (click)="check()">Ki\u1EC3m tra</button>
          <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
        </div>
      </div>
    </demo-section>`}),"forms/radio/example-chinh-sua-noi-tuyen":t(e({},o["forms/radio"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Radio v\u1EABn ch\u1ECDn \u0111\u01B0\u1EE3c; khi disabled th\xEC hi\u1EC7n text t\u0129nh (viewed=true).">
    <div style="display:flex; gap:24px; flex-wrap:wrap; width:100%">
      <sd-radio style="flex:1" label="inline" [items]="genders" valueField="value" displayField="display"
        [viewed]="'inline'" [(model)]="inlineChoice" [form]="form"></sd-radio>
      <sd-radio style="flex:1" label="disabled + inline \u2192 t\u0129nh" [items]="genders" valueField="value" displayField="display"
        [viewed]="'inline'" [(model)]="inlineChoice" [form]="form" disabled></sd-radio>
    </div>
  </demo-section>`}),"forms/radio/example-hien-thi":t(e({},o["forms/radio"]),{html:`<demo-section heading="Hi\u1EC3n th\u1ECB" [props]="[{ name: 'display', value: 'row / column' }]" note="display='row' (m\u1EB7c \u0111\u1ECBnh) v\xE0 display='column' khi danh s\xE1ch d\xE0i.">
    <div style="display:flex; flex-direction:column; gap:16px; width:100%">
      <sd-radio label="row" [items]="genders" valueField="value" displayField="display"
        [(model)]="gender" [form]="form"></sd-radio>
      <sd-radio label="column" display="column"
        [items]="priorities" valueField="value" displayField="display"
        [(model)]="priority" [form]="form"></sd-radio>
    </div>
  </demo-section>`}),"forms/radio/example-trang-thai":t(e({},o["forms/radio"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="\u0110\xE3 c\xF3 gi\xE1 tr\u1ECB m\u1EB7c \u0111\u1ECBnh.">
    <div style="display:flex; gap:24px; flex-wrap:wrap; width:100%">
      <sd-radio style="flex:1" label="disabled" [items]="genders" valueField="value" displayField="display"
        [(model)]="lockedA" [form]="form" disabled></sd-radio>
      <sd-radio style="flex:1" label="viewed" [items]="genders" valueField="value" displayField="display"
        [(model)]="lockedB" [form]="form" viewed></sd-radio>
    </div>
  </demo-section>`}),"forms/radio/example-validator":t(e({},o["forms/radio"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Kh\xF4ng ch\u1ECDn v\xE0 b\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
    <div style="display:flex; flex-direction:column; gap:12px; width:100%">
      <sd-radio label="required"
        [items]="payments" valueField="value" displayField="display"
        [(model)]="payment" [form]="formValid" required></sd-radio>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/select/example-api-footer-action":t(e({},o["forms/select"]),{html:`<demo-section
    heading="API footer action"
    [props]="[{ name: 'selector', value: 'ng-template[sdSelectFooterAction]' }, { name: 'standalone', value: 'true' }]"
    note="Import SdSelectFooterActionDirective c\xF9ng v\u1EDBi SdSelect khi d\xF9ng trong standalone component.">
    <div class="select-demo-api">
      <div><b>Directive</b><span><code>sdSelectFooterAction</code> \u0111\u1EB7t tr\xEAn <code>ng-template</code> b\xEAn trong <code>sd-select</code>.</span></div>
      <div><b>Padding</b><span>Core kh\xF4ng \xE1p padding cho footer. Consumer t\u1EF1 b\u1ECDc n\u1ED9i dung b\u1EB1ng class ri\xEAng, v\xED d\u1EE5 <code>.select-demo-footer-padding</code>.</span></div>
      <div><b>when="always"</b><span>Render m\u1ECDi l\xFAc, mi\u1EC5n l\xE0 panel \u0111ang c\xF3 footer action.</span></div>
      <div><b>when="empty"</b><span>Ch\u1EC9 render khi ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 nh\u1EADp search text v\xE0 s\u1ED1 option sau l\u1ECDc b\u1EB1ng 0.</span></div>
      <div><b>when="has-result"</b><span>Render khi s\u1ED1 option sau l\u1ECDc l\u1EDBn h\u01A1n 0.</span></div>
      <div><b>Context</b><span><code>let-searchText="searchText"</code> truy\u1EC1n search text hi\u1EC7n t\u1EA1i v\xE0o template.</span></div>
      <div><b>Event</b><span><code>(click)="addNew(searchText)"</code> ch\u1EA1y b\xECnh th\u01B0\u1EDDng trong component cha.</span></div>
    </div>
  </demo-section>`}),"forms/select/example-chinh-sua-noi-tuyen":t(e({},o["forms/select"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text \u2014 b\u1EA5m v\xE0o \u0111\u1EC3 m\u1EDF panel ch\u1ECDn (kh\xF4ng hi\u1EC7n \xF4 input). Text gi\u1EEF nguy\xEAn trong l\xFAc panel m\u1EDF, ch\u1EC9 \u0111\u1ED5i khi ch\u1ECDn gi\xE1 tr\u1ECB m\u1EDBi.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <div style="font-size:12px; color:#555">
        Ph\xF2ng ban:
        <sd-select [items]="items" valueField="value" displayField="display"
          [viewed]="'inline'" [(model)]="inlineDept" [form]="form"></sd-select>
      </div>
      <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ inlineDept() ?? '(tr\u1ED1ng)' }}</b></div>
    </div>
  </demo-section>`}),"forms/select/example-chon-nhieu-voi-dong-tat-ca":t(e({},o["forms/select"]),{html:`<demo-section
    heading="Ch\u1ECDn nhi\u1EC1u v\u1EDBi d\xF2ng T\u1EA5t c\u1EA3"
    [props]="[{ name: 'showSelectAll', value: 'true' }, { name: 'multiple', value: 'true' }, { name: 'disabledField', value: 'disabled' }]"
    note="Row 'T\u1EA5t c\u1EA3' \u0111\u1EA7u panel \u2014 ch\u1EC9 hi\u1EC7n khi multiple + items l\xE0 m\u1EA3ng t\u0129nh. Tick ch\u1ECDn to\xE0n b\u1ED9 items enabled kh\u1EDBp search hi\u1EC7n t\u1EA1i (item disabled 'Ph\xE1p ch\u1EBF' kh\xF4ng b\u1ECB \u0111\u1EE5ng); \u0111ang search th\xEC tick CH\u1EC8 th\xEAm items kh\u1EDBp filter, selection c\u0169 gi\u1EEF nguy\xEAn. Checkbox c\xF3 3 tr\u1EA1ng th\xE1i checked / indeterminate / unchecked.">
    <div class="select-demo-column">
      <sd-select
        label="\u0110\u01A1n v\u1ECB tham gia" multiple showSelectAll
        [items]="selectAllItems"
        valueField="value" displayField="display" disabledField="disabled"
        placeholder="Ch\u1ECDn c\xE1c \u0111\u01A1n v\u1ECB..."
        minWidthPanel="360px"
        [(model)]="selectAllDepts"
        [form]="form">
      </sd-select>
      <div class="select-demo-status">\u0110\xE3 ch\u1ECDn ({{ selectAllDepts()?.length ?? 0 }}): <b>{{ selectAllDepts()?.join(', ') || '(tr\u1ED1ng)' }}</b></div>
    </div>
  </demo-section>`}),"forms/select/example-co-ban":t(e({},o["forms/select"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u, hi\u1EC3n th\u1ECB gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-select [items]="items" valueField="value" displayField="display"
        label="Ch\u1ECDn ph\xF2ng ban" placeholder="Ch\u1ECDn..." [(model)]="dept" [form]="form"></sd-select>
      <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ dept() ?? '(tr\u1ED1ng)' }}</b></div>
    </div>
  </demo-section>`}),"forms/select/example-footer-action-giong-dropdown-item":t(e({},o["forms/select"]),{html:`<demo-section
    heading="Footer action gi\u1ED1ng dropdown item"
    [props]="[{ name: 'custom CSS', value: 'padding + item row' }, { name: 'tag', value: 'div' }]"
    note="Kh\xF4ng b\u1EAFt bu\u1ED9c d\xF9ng button. C\xF3 th\u1EC3 d\xF9ng div role=button, t\u1EF1 th\xEAm padding v\xE0 hover style \u0111\u1EC3 footer action nh\xECn nh\u01B0 m\u1ED9t option trong dropdown.">
    <div class="select-demo-column select-demo-column--wide">
      <sd-select
        [items]="largeItems"
        valueField="value"
        displayField="display"
        label="T\u1EA1o nhanh nh\xF3m x\u1EED l\xFD"
        placeholder="G\xF5 t\xEAn nh\xF3m m\u1EDBi..."
        minWidthPanel="420px"
        [(model)]="footerItemDept"
        [form]="form">
        <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
          <div class="select-demo-footer-padding">
            <div
              class="select-demo-footer-item"
              role="button"
              tabindex="0"
              (click)="recordFooterAction('dropdown-item', searchText)"
              (keydown.enter)="recordFooterAction('dropdown-item', searchText)"
              (keydown.space)="recordFooterAction('dropdown-item', searchText)">
              <span class="select-demo-footer-item__mark">+</span>
              <span class="select-demo-footer-item__main">T\u1EA1o nh\xF3m "{{ searchText }}"</span>
              <span class="select-demo-footer-item__meta">Footer custom</span>
            </div>
          </div>
        </ng-template>
      </sd-select>

      <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
    </div>
  </demo-section>`}),"forms/select/example-footer-action-khi-khong-co-ket-qua":t(e({},o["forms/select"]),{html:`<demo-section
    heading="Footer action khi kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3"
    [props]="[{ name: 'sdSelectFooterAction', value: 'template' }, { name: 'when', value: 'empty' }, { name: 'searchText', value: 'context' }]"
    note="G\xF5 m\u1ED9t ph\xF2ng ban ch\u01B0a c\xF3 trong danh s\xE1ch. Khi search text kh\xE1c r\u1ED7ng v\xE0 danh s\xE1ch l\u1ECDc v\u1EC1 0 item, footer hi\u1EC3n th\u1ECB n\xFAt th\xEAm m\u1EDBi.">
    <div class="select-demo-column">
      <sd-select
        [items]="footerItems"
        valueField="value"
        displayField="display"
        label="T\xECm ho\u1EB7c th\xEAm ph\xF2ng ban"
        placeholder="G\xF5 \u0111\u1EC3 t\xECm..."
        minWidthPanel="360px"
        [(model)]="footerDept"
        [form]="form">
        <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
          <div class="select-demo-footer-padding">
            <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="addDepartment(searchText)">
              Th\xEAm "{{ searchText }}"
            </button>
          </div>
        </ng-template>
      </sd-select>

      <div class="select-demo-status">
        Gi\xE1 tr\u1ECB \u0111ang ch\u1ECDn: <b>{{ footerDept() ?? '(tr\u1ED1ng)' }}</b>
      </div>
      <div class="select-demo-status">
        Log: <b>{{ lastFooterAction() }}</b>
      </div>
    </div>
  </demo-section>`}),"forms/select/example-kich-thuoc":t(e({},o["forms/select"]),{html:`<demo-section heading="K\xEDch th\u01B0\u1EDBc" [props]="[{ name: 'size', value: 'sm' }]" note="UI g\u1ECDn cho b\u1EA3ng / toolbar.">
    <div style="width: 280px">
      <sd-select [items]="items" valueField="value" displayField="display"
        label="sm" size="sm" [(model)]="quick" [form]="form"></sd-select>
    </div>
  </demo-section>`}),"forms/select/example-nhieu-footer-action-va-thu-tu-khai-bao":t(e({},o["forms/select"]),{html:`<demo-section
    heading="Nhi\u1EC1u footer action v\xE0 th\u1EE9 t\u1EF1 khai b\xE1o"
    [props]="[{ name: 'when', value: 'always / has-result / empty' }, { name: 'contentChildren', value: 'order' }]"
    note="C\xE1c template \u0111\u01B0\u1EE3c render theo \u0111\xFAng th\u1EE9 t\u1EF1 khai b\xE1o trong sd-select. Event binding v\u1EABn ch\u1EA1y trong context c\u1EE7a component cha.">
    <div class="select-demo-column select-demo-column--wide">
      <sd-select
        [items]="largeItems"
        valueField="value"
        displayField="display"
        label="Ch\u1ECDn \u0111\u01A1n v\u1ECB x\u1EED l\xFD"
        placeholder="G\xF5 \u0111\u1EC3 l\u1ECDc..."
        minWidthPanel="420px"
        [(model)]="footerActionDept"
        [form]="form">
        <ng-template sdSelectFooterAction>
          <div class="select-demo-footer-padding">
            <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('always')">
              Lu\xF4n hi\u1EC3n th\u1ECB: m\u1EDF c\u1EA5u h\xECnh danh m\u1EE5c
            </button>
          </div>
        </ng-template>

        <ng-template sdSelectFooterAction when="has-result" let-searchText="searchText">
          <div class="select-demo-footer-padding">
            <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('has-result', searchText)">
              C\xF3 k\u1EBFt qu\u1EA3: d\xF9ng "{{ searchText || 't\u1EA5t c\u1EA3' }}" l\xE0m b\u1ED9 l\u1ECDc nhanh
            </button>
          </div>
        </ng-template>

        <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
          <div class="select-demo-footer-padding">
            <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="recordFooterAction('empty', searchText)">
              Kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3: g\u1EEDi y\xEAu c\u1EA7u t\u1EA1o "{{ searchText }}"
            </button>
          </div>
        </ng-template>
      </sd-select>

      <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
    </div>
  </demo-section>`}),"forms/select/example-snippet-mau":t(e({},o["forms/select"]),{html:`<demo-section
    heading="Snippet m\u1EABu"
    [props]="[{ name: 'copy pattern', value: 'HTML' }]"
    note="M\u1EABu t\u1ED1i thi\u1EC3u cho case th\xEAm nhanh item khi kh\xF4ng t\xECm th\u1EA5y k\u1EBFt qu\u1EA3.">
    <pre class="select-demo-code">{{ footerActionSnippet }}</pre>
  </demo-section>`}),"forms/select/example-trang-thai":t(e({},o["forms/select"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Gi\xE1 tr\u1ECB \u0111\xE3 c\xF3 s\u1EB5n.">
    <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
      <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
        label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-select>
      <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
        label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-select>
    </div>
  </demo-section>`}),"forms/select/example-validator":t(e({},o["forms/select"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n l\u1ED7i.">
    <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
      <sd-select [items]="items" valueField="value" displayField="display"
        label="required" helperText="Ch\u1ECDn ph\xF2ng \u0111ang c\xF4ng t\xE1c"
        [(model)]="deptR" [form]="formValid" required></sd-select>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/switch/example-che-do-xem":t(e({},o["forms/switch"]),{html:`<demo-section heading="Ch\u1EBF \u0111\u1ED9 xem" [props]="[{ name: 'viewed', value: 'true' }, { name: 'viewed', value: 'inline' }]" note="viewed=true hi\u1EC7n ch\u1EEF B\u1EADt/T\u1EAFt; 'inline' v\u1EABn g\u1EA1t \u0111\u01B0\u1EE3c, disabled+inline th\xEC xem t\u0129nh.">
    <div style="display:flex; gap:20px; flex-wrap:wrap">
      <sd-switch label="viewed=true (t\u0129nh)" [(model)]="viewedFlag" [form]="form" viewed></sd-switch>
      <sd-switch label="inline (v\u1EABn g\u1EA1t \u0111\u01B0\u1EE3c)" [viewed]="'inline'" [(model)]="inlineFlag" [form]="form"></sd-switch>
      <sd-switch label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="viewedFlag" [form]="form" disabled></sd-switch>
    </div>
  </demo-section>`}),"forms/switch/example-co-ban":t(e({},o["forms/switch"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u, hi\u1EC3n th\u1ECB tr\u1EA1ng th\xE1i ngay b\xEAn c\u1EA1nh.">
    <div style="display:flex; flex-direction:column; gap:8px; width:100%">
      <sd-switch label="Nh\u1EADn th\xF4ng b\xE1o qua email" [(model)]="notify" [form]="form"></sd-switch>
      <div style="font-size:12px; color:#555">
        Tr\u1EA1ng th\xE1i: <b>{{ notify() ? 'B\u1EACT' : 'T\u1EAET' }}</b>
      </div>
    </div>
  </demo-section>`}),"forms/switch/example-danh-sach-cau-hinh":t(e({},o["forms/switch"]),{html:`<demo-section heading="Danh s\xE1ch c\u1EA5u h\xECnh" note="M\u1ED7i switch \u0111i\u1EC1u khi\u1EC3n m\u1ED9t option \u0111\u1ED9c l\u1EADp.">
    <div style="display:flex; flex-direction:column; gap:6px">
      <sd-switch label="T\u1EF1 \u0111\u1ED9ng l\u01B0u" [(model)]="autoSave" [form]="form"></sd-switch>
      <sd-switch label="Ch\u1EBF \u0111\u1ED9 t\u1ED1i" [(model)]="darkMode" [form]="form"></sd-switch>
      <sd-switch label="\u0110\u1ED3ng b\u1ED9 Cloud" [(model)]="cloudSync" [form]="form"></sd-switch>
      <div style="font-size:12px; color:#555; margin-top:6px">
        T\xF3m t\u1EAFt: autoSave={{ autoSave() }} \xB7 darkMode={{ darkMode() }} \xB7 cloud={{ cloudSync() }}
      </div>
    </div>
  </demo-section>`}),"forms/switch/example-mau-sac":t(e({},o["forms/switch"]),{html:`<demo-section heading="M\xE0u s\u1EAFc" [props]="[{ name: 'color', value: 'primary / success / warning / error' }]" note="Thu\u1ED9c t\xEDnh color thay \u0111\u1ED5i accent track.">
    <div style="display:flex; gap:20px; flex-wrap:wrap">
      <sd-switch label="primary" color="primary" [(model)]="s1" [form]="form"></sd-switch>
      <sd-switch label="success" color="success" [(model)]="s2" [form]="form"></sd-switch>
      <sd-switch label="warning" color="warning" [(model)]="s3" [form]="form"></sd-switch>
      <sd-switch label="error" color="error" [(model)]="s4" [form]="form"></sd-switch>
    </div>
  </demo-section>`}),"forms/switch/example-trang-thai":t(e({},o["forms/switch"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kho\xE1.">
    <div style="display:flex; gap:20px; flex-wrap:wrap">
      <sd-switch label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-switch>
      <sd-switch label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-switch>
    </div>
  </demo-section>`}),"forms/textarea/example-chinh-sua-noi-tuyen":t(e({},o["forms/textarea"]),{html:`<demo-section heading="Ch\u1EC9nh s\u1EEDa n\u1ED9i tuy\u1EBFn" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hi\u1EC3n th\u1ECB nh\u01B0 text kh\xF4ng vi\u1EC1n \u2014 b\u1EA5m/focus \u0111\u1EC3 s\u1EEDa t\u1EA1i ch\u1ED7. Khi disabled th\xEC r\u01A1i v\u1EC1 xem t\u0129nh (viewed=true).">
    <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
      <div style="font-size:12px; color:#555">
        Ghi ch\xFA:
        <sd-textarea [viewed]="'inline'" [(model)]="inlineNote" [form]="form"></sd-textarea>
      </div>
      <div style="font-size:12px; color:#555">Gi\xE1 tr\u1ECB: <b>{{ inlineNote() ?? '(tr\u1ED1ng)' }}</b></div>
      <sd-textarea label="disabled + inline \u2192 t\u0129nh" [viewed]="'inline'" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
    </div>
  </demo-section>`}),"forms/textarea/example-co-ban":t(e({},o["forms/textarea"]),{html:`<demo-section heading="C\u01A1 b\u1EA3n" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chi\u1EC1u v\u1EDBi [(model)].">
    <div style="width: 420px">
      <sd-textarea label="M\xF4 t\u1EA3" placeholder="Nh\u1EADp m\xF4 t\u1EA3..." helperText="T\u1ED1i \u0111a 500 k\xFD t\u1EF1" [(model)]="basic" [form]="form"></sd-textarea>
    </div>
  </demo-section>`}),"forms/textarea/example-trang-thai":t(e({},o["forms/textarea"]),{html:`<demo-section heading="Tr\u1EA1ng th\xE1i" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }]" note="Hai tr\u1EA1ng th\xE1i kh\xF4ng cho ch\u1EC9nh s\u1EEDa.">
    <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
      <sd-textarea style="width: 280px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
      <sd-textarea style="width: 280px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-textarea>
    </div>
  </demo-section>`}),"forms/textarea/example-validator":t(e({},o["forms/textarea"]),{html:`<demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'maxlength', value: '50' }]" note="B\u1EA5m Ki\u1EC3m tra \u0111\u1EC3 hi\u1EC7n inline error.">
    <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
      <sd-textarea label="required + maxlength=50" [(model)]="reason" [form]="formValid" required [maxlength]="50"></sd-textarea>
      <div style="display:flex; gap:8px">
        <button type="button" (click)="check()">Ki\u1EC3m tra</button>
        <button type="button" (click)="reset()">\u0110\u1EB7t l\u1EA1i</button>
      </div>
    </div>
  </demo-section>`}),"forms/time-range/example-co-ban":t(e({},o["forms/time-range"]),{html:`<demo-section
      heading="C\u01A1 b\u1EA3n"
      [props]="[{ name: '[(model)]', value: 'SdTimeRangeValue' }]"
      note="Hai \xF4 c\xF9ng ph\xE1t m\u1ED9t model { from, to } \u0111\xE3 chu\u1EA9n h\xF3a HH:mm.">
      <div style="width: 520px; max-width:100%">
        <sd-time-range [form]="form" name="workingHours" label="Gi\u1EDD l\xE0m vi\u1EC7c" clearable [(model)]="workingHours"></sd-time-range>
      </div>
    </demo-section>`}),"forms/time-range/example-gioi-han-va-thu-tu":t(e({},o["forms/time-range"]),{html:`<demo-section
      heading="Gi\u1EDBi h\u1EA1n v\xE0 th\u1EE9 t\u1EF1"
      [props]="[
        { name: 'min', value: '08:00' },
        { name: 'max', value: '18:00' },
        { name: 'step', value: '15' },
      ]"
      note="M\u1ED7i \u0111\u1EA7u ki\u1EC3m tra min/max/step; gi\u1EDD b\u1EAFt \u0111\u1EA7u sau gi\u1EDD k\u1EBFt th\xFAc t\u1EA1o l\u1ED7i range.">
      <div style="width: 520px; max-width:100%">
        <sd-time-range
          [form]="form"
          name="boundedHours"
          label="Khung ph\u1EE5c v\u1EE5"
          min="08:00"
          max="18:00"
          [step]="15"
          [(model)]="boundedHours">
        </sd-time-range>
      </div>
    </demo-section>`}),"forms/time-range/example-khoang-mo":t(e({},o["forms/time-range"]),{html:`<demo-section
      heading="Kho\u1EA3ng m\u1EDF"
      [props]="[{ name: 'allowOpenEnded', value: 'true' }]"
      note="Cho ph\xE9p ch\u1EC9 c\xF3 m\u1ED1c b\u1EAFt \u0111\u1EA7u ho\u1EB7c k\u1EBFt th\xFAc khi field kh\xF4ng required.">
      <div style="width: 520px; max-width:100%">
        <sd-time-range [form]="form" name="openHours" label="\xC1p d\u1EE5ng t\u1EEB" allowOpenEnded [(model)]="openHours"> </sd-time-range>
      </div>
    </demo-section>`}),"forms/time-range/example-trang-thai":t(e({},o["forms/time-range"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
      note="Viewed hi\u1EC3n th\u1ECB model time-only m\xE0 kh\xF4ng kh\u1EDFi t\u1EA1o Date \u1EDF API c\xF4ng khai.">
      <div style="display:flex; gap:16px; flex-direction:column; max-width:520px">
        <sd-time-range label="Disabled" [model]="workingHours()" disabled></sd-time-range>
        <sd-time-range label="Readonly" [model]="workingHours()" readonly></sd-time-range>
        <sd-time-range label="Viewed" [model]="workingHours()" viewed></sd-time-range>
      </div>
    </demo-section>`}),"forms/time/example-co-ban":t(e({},o["forms/time"]),{html:`<demo-section
      heading="C\u01A1 b\u1EA3n"
      [props]="[{ name: '[(model)]', value: basic() ?? 'null' }]"
      note="C\xF3 th\u1EC3 g\xF5 9:05 \u0111\u1EC3 nh\u1EADn model chu\u1EA9n h\xF3a 09:05, ho\u1EB7c m\u1EDF b\u1ED9 ch\u1ECDn gi\u1EDD.">
      <div style="width: 320px">
        <sd-time [form]="form" name="basic" label="Gi\u1EDD b\u1EAFt \u0111\u1EA7u" clearable [(model)]="basic"></sd-time>
      </div>
    </demo-section>`}),"forms/time/example-gioi-han-va-buoc-phut":t(e({},o["forms/time"]),{html:`<demo-section
      heading="Gi\u1EDBi h\u1EA1n v\xE0 b\u01B0\u1EDBc ph\xFAt"
      [props]="[
        { name: 'min', value: '08:00' },
        { name: 'max', value: '18:00' },
        { name: 'step', value: '15' },
      ]"
      note="Min/max bao g\u1ED3m bi\xEAn; ph\xEDm m\u0169i t\xEAn v\xE0 b\u1ED9 ch\u1ECDn c\xF9ng d\xF9ng b\u01B0\u1EDBc 15 ph\xFAt.">
      <div style="width: 320px">
        <sd-time [form]="form" name="bounded" label="Ca l\xE0m vi\u1EC7c" min="08:00" max="18:00" [step]="15" [(model)]="bounded"> </sd-time>
      </div>
    </demo-section>`}),"forms/time/example-trang-thai":t(e({},o["forms/time"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i"
      [props]="[{ name: 'disabled / readonly / viewed', value: 'true' }]"
      note="C\xF9ng m\u1ED9t model time-only trong c\xE1c tr\u1EA1ng th\xE1i kh\xF4ng ch\u1EC9nh s\u1EEDa.">
      <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
        <sd-time style="width:220px" label="Disabled" [model]="'08:30'" disabled></sd-time>
        <sd-time style="width:220px" label="Readonly" [model]="'12:00'" readonly></sd-time>
        <sd-time style="width:220px" label="Viewed" [model]="'17:30'" viewed></sd-time>
      </div>
    </demo-section>`}),"forms/time/example-validation":t(e({},o["forms/time"]),{html:`<demo-section
      heading="Validation"
      [props]="[{ name: 'required', value: 'true' }]"
      note="Text sai nh\u01B0 25:10 \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i \u0111\u1EC3 s\u1EEDa, control invalid v\xE0 model h\u1EE3p l\u1EC7 tr\u01B0\u1EDBc \u0111\xF3 kh\xF4ng b\u1ECB ghi \u0111\xE8.">
      <div style="width: 320px">
        <sd-time [form]="validationForm" name="requiredTime" label="Gi\u1EDD b\u1EAFt bu\u1ED9c" required [(model)]="requiredTime"></sd-time>
      </div>
      <button type="button" (click)="validationForm.markAllAsTouched()">Hi\u1EC7n l\u1ED7i</button>
    </demo-section>`}),"forms/tree-select/example-lazy-tree":t(e({},o["forms/tree-select"]),{html:`<demo-section heading="Lazy tree" note="Children ch\u1EC9 t\u1EA3i khi m\u1EDF branch; l\u1ED7i \u0111\u01B0\u1EE3c gi\u1EEF \u1EDF node v\xE0 c\xF3 retry ri\xEAng.">
      <sd-tree-select
        style="max-width: 520px"
        [items]="lazyItems"
        [tree]="lazyTree"
        valueField="id"
        displayField="name"
        multiple
        [model]="[3]">
        <ng-template sdTreeSelectNode let-item let-loading="loading">
          {{ item.name }}
          @if (loading) {
            \xB7 loading
          }
        </ng-template>
      </sd-tree-select>
    </demo-section>`}),"forms/tree-select/example-multiple-cascade":t(e({},o["forms/tree-select"]),{html:`<demo-section
      heading="Multiple cascade"
      [props]="[
        { name: 'cascade', value: 'descendants' },
        { name: 'model', value: multiple().join(', ') },
      ]"
      note="Ch\u1ECDn parent \xE1p d\u1EE5ng cho descendants \u0111\xE3 load; partial selection hi\u1EC3n th\u1ECB indeterminate, node locked kh\xF4ng t\u01B0\u01A1ng t\xE1c.">
      <sd-tree-select
        style="max-width: 520px"
        [items]="staticItems"
        valueField="id"
        displayField="name"
        multiple
        cascade="descendants"
        [disabledNode]="disabledDepartment"
        [(model)]="multiple" />
    </demo-section>`}),"forms/tree-select/example-static-single-select":t(e({},o["forms/tree-select"]),{html:`<demo-section heading="Static single-select" [props]="[{ name: 'model', value: single() ?? 'null' }]">
      <sd-tree-select style="max-width: 520px" [items]="staticItems" valueField="id" displayField="name" [(model)]="single" />
    </demo-section>`}),"forms/tree-select/example-unloaded-key-va-viewed":t(e({},o["forms/tree-select"]),{html:`<demo-section
      heading="Unloaded key v\xE0 viewed"
      [props]="[{ name: 'model', value: '[99]' }]"
      note="Key ch\u01B0a load kh\xF4ng b\u1ECB x\xF3a b\u1EDFi filter/page/lazy state; viewed mode hi\u1EC3n th\u1ECB fallback key \u1ED5n \u0111\u1ECBnh.">
      <sd-tree-select
        style="max-width: 520px"
        [items]="lazyItems"
        [tree]="lazyTree"
        valueField="id"
        displayField="name"
        multiple
        viewed
        [model]="[99]" />
    </demo-section>`}),"modules/layout/example-sidebar-v1-classic":t(e({},o["modules/layout"]),{html:`<demo-section
      data-layout-showcase="1"
      heading="Sidebar V1 - Classic"
      note="Desktop rail with expand/collapse, menu search after more than 10 items, and the default SDCoreJS logo."
      [props]="[
        { name: 'version', value: '1' },
        { name: 'mobileBreakpoint', value: '900' },
        { name: 'viewport', value: 'desktop / mobile' },
      ]">
      <app-layout-version-preview [version]="1" [menus]="menus"></app-layout-version-preview>
    </demo-section>`}),"modules/layout/example-sidebar-v2-rail":t(e({},o["modules/layout"]),{html:`<demo-section
      data-layout-showcase="2"
      heading="Sidebar V2 - Rail"
      note="Primary navigation rail on desktop and bottom navigation with a direct mobile sign-out action."
      [props]="[
        { name: 'version', value: '2' },
        { name: 'mobileBreakpoint', value: '900' },
        { name: 'viewport', value: 'desktop / mobile' },
      ]">
      <app-layout-version-preview [version]="2" [menus]="menus"></app-layout-version-preview>
    </demo-section>`}),"modules/layout/example-sidebar-v3-collapsible":t(e({},o["modules/layout"]),{html:`<demo-section
      data-layout-showcase="3"
      heading="Sidebar V3 - Collapsible"
      note="Collapsible desktop navigation and a unified mobile drawer with pinned and recent menus."
      [props]="[
        { name: 'version', value: '3' },
        { name: 'mobileBreakpoint', value: '900' },
        { name: 'viewport', value: 'desktop / mobile' },
      ]">
      <app-layout-version-preview [version]="3" [menus]="menus"></app-layout-version-preview>
    </demo-section>`}),"pipes-utilities/empty/example-gia-tri-co-noi-dung-giu-nguyen":t(e({},o["pipes-utilities/empty"]),{html:`<demo-section
      heading="Gi\xE1 tr\u1ECB c\xF3 n\u1ED9i dung gi\u1EEF nguy\xEAn"
      [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
      note="Pipe tr\u1EA3 v\u1EC1 nguy\xEAn gi\xE1 tr\u1ECB g\u1ED1c, kh\xF4ng \xE9p ki\u1EC3u v\xE0 kh\xF4ng format \u2014 c\u1EA7n chu\u1EA9n ho\xE1 m\u1EA3ng th\xEC d\xF9ng sdView.">
      <div class="value-grid">
        @for (sample of filledSamples; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdEmpty }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/empty/example-gia-tri-rong-hien-thi-dau-gach":t(e({},o["pipes-utilities/empty"]),{html:`<demo-section
      heading="Gi\xE1 tr\u1ECB r\u1ED7ng hi\u1EC3n th\u1ECB d\u1EA5u g\u1EA1ch"
      [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
      note="Ch\u1EC9 \u0111\xFAng ba tr\u01B0\u1EDDng h\u1EE3p null, undefined v\xE0 '' \u0111\u01B0\u1EE3c thay th\u1EBF. S\u1ED1 0 v\xE0 chu\u1ED7i '0' KH\xD4NG b\u1ECB coi l\xE0 r\u1ED7ng.">
      <div class="value-grid">
        @for (sample of emptySamples; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdEmpty }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-date/example-dinh-dang-mac-dinh":t(e({},o["pipes-utilities/format-date"]),{html:`<demo-section
      heading="\u0110\u1ECBnh d\u1EA1ng m\u1EB7c \u0111\u1ECBnh"
      [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
      note="Kh\xF4ng truy\u1EC1n tham s\u1ED1 th\xEC pipe d\xF9ng dd/MM/yyyy \u2014 d\u1EA1ng ng\xE0y chu\u1EA9n c\u1EE7a c\xE1c form trong pack.">
      <div class="value-grid">
        @for (sample of sources; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdFormatDate }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-date/example-dinh-dang-tuy-chinh":t(e({},o["pipes-utilities/format-date"]),{html:`<demo-section
      heading="\u0110\u1ECBnh d\u1EA1ng tu\u1EF3 ch\u1EC9nh"
      [props]="[{ name: 'sdFormatDate', value: 'format' }]"
      note="Tham s\u1ED1 \u0111\u1EA7u ti\xEAn l\xE0 chu\u1ED7i token truy\u1EC1n th\u1EB3ng cho DateUtilities.toFormat.">
      <div class="value-grid">
        @for (format of formats; track format) {
          <div class="value-cell">
            <span class="value-cell__label">{{ format }}</span>
            <code>{{ isoDate | sdFormatDate: format }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-date/example-gia-tri-khong-hop-le":t(e({},o["pipes-utilities/format-date"]),{html:`<demo-section
      heading="Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7"
      [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
      note="Gi\xE1 tr\u1ECB kh\xF4ng parse \u0111\u01B0\u1EE3c tr\u1EA3 v\u1EC1 null, n\xEAn interpolation ra chu\u1ED7i r\u1ED7ng thay v\xEC 'Invalid Date'.">
      <div class="value-grid">
        @for (sample of invalidSources; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code class="value-cell__empty">{{ sample.value | sdFormatDate }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-datetime/example-chi-lay-phan-gio":t(e({},o["pipes-utilities/format-datetime"]),{html:`<demo-section
      heading="Ch\u1EC9 l\u1EA5y ph\u1EA7n gi\u1EDD"
      [props]="[{ name: 'sdFormatDatetime', value: 'format' }]"
      note="Truy\u1EC1n token ng\u1EAFn h\u01A1n khi c\u1ED9t \u0111\xE3 c\xF3 ng\xE0y \u1EDF ch\u1ED7 kh\xE1c; pipe kh\xF4ng \xE9p ph\u1EA3i hi\u1EC7n \u0111\u1EE7 ng\xE0y + gi\u1EDD.">
      <div class="value-grid">
        @for (format of formats; track format) {
          <div class="value-cell">
            <span class="value-cell__label">{{ format }}</span>
            <code>{{ isoDatetime | sdFormatDatetime: format }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-datetime/example-dinh-dang-mac-dinh":t(e({},o["pipes-utilities/format-datetime"]),{html:`<demo-section
      heading="\u0110\u1ECBnh d\u1EA1ng m\u1EB7c \u0111\u1ECBnh"
      [props]="[{ name: 'sdFormatDatetime', value: 'dd/MM/yyyy HH:mm:ss' }]"
      note="D\xF9ng cho c\u1ED9t nh\u1EADt k\xFD, l\u1ECBch s\u1EED thao t\xE1c \u2014 n\u01A1i c\u1EA7n \u0111\u1EE7 gi\xE2y \u0111\u1EC3 ph\xE2n bi\u1EC7t hai b\u1EA3n ghi li\u1EC1n nhau.">
      <div class="value-grid">
        @for (sample of sources; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdFormatDatetime }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-number/example-chuan-quoc-te":t(e({},o["pipes-utilities/format-number"]),{html:`<demo-section
      heading="Chu\u1EA9n qu\u1ED1c t\u1EBF"
      [props]="[{ name: 'sdFormatNumber', value: '1,234,567.89' }]"
      note="D\u1EA5u ph\u1EA9y ng\u0103n h\xE0ng ngh\xECn, d\u1EA5u ch\u1EA5m ng\u0103n th\u1EADp ph\xE2n. \u0110\xE2y c\u0169ng l\xE0 m\u1EB7c \u0111\u1ECBnh khi app ch\u01B0a c\u1EA5u h\xECnh format.number.">
      <div class="value-grid">
        @for (sample of amounts; track sample) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample }}</span>
            <code>{{ sample | sdFormatNumber: 2 : '1,234,567.89' }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-number/example-chuan-viet-nam":t(e({},o["pipes-utilities/format-number"]),{html:`<demo-section
      heading="Chu\u1EA9n Vi\u1EC7t Nam"
      [props]="[{ name: 'sdFormatNumber', value: '1.234.567,89' }]"
      note="\u0110\u1EA3o vai tr\xF2 hai d\u1EA5u. \u0110\u1EB7t m\u1ED9t l\u1EA7n \u1EDF SD_CORE_CONFIGURATION l\xE0 m\u1ECDi pipe v\xE0 form field trong app \u0111i theo, kh\xF4ng c\u1EA7n truy\u1EC1n tham s\u1ED1.">
      <div class="value-grid">
        @for (sample of amounts; track sample) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample }}</span>
            <code>{{ sample | sdFormatNumber: 2 : '1.234.567,89' }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/format-number/example-so-chu-so-thap-phan":t(e({},o["pipes-utilities/format-number"]),{html:`<demo-section
      heading="S\u1ED1 ch\u1EEF s\u1ED1 th\u1EADp ph\xE2n"
      [props]="[{ name: 'sdFormatNumber', value: 'digits' }]"
      note="Tham s\u1ED1 \u0111\u1EA7u l\xE0 s\u1ED1 ch\u1EEF s\u1ED1 sau d\u1EA5u th\u1EADp ph\xE2n (m\u1EB7c \u0111\u1ECBnh 2). Gi\xE1 tr\u1ECB kh\xF4ng ph\u1EA3i s\u1ED1 tr\u1EA3 v\u1EC1 chu\u1ED7i r\u1ED7ng.">
      <div class="value-grid">
        @for (digits of digitOptions; track digits) {
          <div class="value-cell">
            <span class="value-cell__label">digits = {{ digits }}</span>
            <code>{{ 1234567.891 | sdFormatNumber: digits : '1,234,567.89' }}</code>
          </div>
        }
        <div class="value-cell">
          <span class="value-cell__label">'khong-phai-so'</span>
          <code class="value-cell__empty">{{ 'khong-phai-so' | sdFormatNumber }}</code>
        </div>
      </div>
    </demo-section>`}),"pipes-utilities/safe-html/example-sanitize-mac-dinh":t(e({},o["pipes-utilities/safe-html"]),{html:`<demo-section
      heading="Sanitize m\u1EB7c \u0111\u1ECBnh"
      [props]="[{ name: 'sdSafeHtml', value: 'pipe' }]"
      note="Th\u1EBB script, thu\u1ED9c t\xEDnh on* v\xE0 url javascript: b\u1ECB lo\u1EA1i b\u1ECF; ph\u1EA7n markup l\xE0nh t\xEDnh c\xF2n l\u1EA1i v\u1EABn render. \u0110\xE2y l\xE0 nh\xE1nh d\xF9ng cho m\u1ECDi d\u1EEF li\u1EC7u \u0111\u1EBFn t\u1EEB server.">
      <div class="html-pair">
        <div class="html-cell">
          <span class="html-cell__label">Chu\u1ED7i g\u1ED1c</span>
          <code>{{ untrusted }}</code>
        </div>
        <div class="html-cell">
          <span class="html-cell__label">K\u1EBFt qu\u1EA3 render</span>
          <div class="html-cell__output" data-safe-html-sanitized [innerHTML]="untrusted | sdSafeHtml"></div>
        </div>
      </div>
    </demo-section>`}),"pipes-utilities/safe-html/example-tin-cay-co-chu-dich":t(e({},o["pipes-utilities/safe-html"]),{html:`<demo-section
      heading="Tin c\u1EADy c\xF3 ch\u1EE7 \u0111\xEDch"
      [props]="[{ name: 'sdSafeHtml', value: 'trusted' }]"
      note="Tham s\u1ED1 true g\u1ECDi bypassSecurityTrustHtml. Ch\u1EC9 d\xF9ng cho markup do ch\xEDnh app vi\u1EBFt ra, v\xED d\u1EE5 m\u1ED9t sprite SVG n\u1ED9i b\u1ED9 \u2014 kh\xF4ng bao gi\u1EDD cho d\u1EEF li\u1EC7u ng\u01B0\u1EDDi d\xF9ng nh\u1EADp.">
      <div class="html-pair">
        <div class="html-cell">
          <span class="html-cell__label">Chu\u1ED7i g\u1ED1c</span>
          <code>{{ appAuthored }}</code>
        </div>
        <div class="html-cell">
          <span class="html-cell__label">K\u1EBFt qu\u1EA3 render</span>
          <div class="html-cell__output" data-safe-html-trusted [innerHTML]="appAuthored | sdSafeHtml: true"></div>
        </div>
      </div>
    </demo-section>`}),"pipes-utilities/time-different/example-qua-nguong-thi-ve-ngay-tuyet-doi":t(e({},o["pipes-utilities/time-different"]),{html:`<demo-section
      heading="Qu\xE1 ng\u01B0\u1EE1ng th\xEC v\u1EC1 ng\xE0y tuy\u1EC7t \u0111\u1ED1i"
      [props]="[{ name: 'sdTimeDifferent', value: 'format' }]"
      note="Gi\xE1 tr\u1ECB \u0111\xE3 c\u0169 h\u01A1n ng\u01B0\u1EE1ng KH\xD4NG t\u1EA1o timer n\xE0o \u2014 pipe tr\u1EA3 v\u1EC1 of(...) ngay, n\xEAn m\u1ED9t danh s\xE1ch d\xE0i kh\xF4ng sinh h\xE0ng lo\u1EA1t interval th\u1EEBa.">
      <div class="value-grid">
        @for (sample of old; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'minute' | async }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/time-different/example-thoi-gian-tuong-doi":t(e({},o["pipes-utilities/time-different"]),{html:`<demo-section
      heading="Th\u1EDDi gian t\u01B0\u01A1ng \u0111\u1ED1i"
      [props]="[
        { name: 'sdTimeDifferent', value: 'format' },
        { name: 'different', value: 'second / minute / hour / day / month' },
      ]"
      note="Tham s\u1ED1 th\u1EE9 hai l\xE0 ng\u01B0\u1EE1ng: d\u01B0\u1EDBi ng\u01B0\u1EE1ng th\xEC hi\u1EC7n kho\u1EA3ng c\xE1ch t\u01B0\u01A1ng \u0111\u1ED1i v\xE0 tick m\u1ED7i gi\xE2y, ch\u1EA1m ng\u01B0\u1EE1ng th\xEC r\u01A1i v\u1EC1 format.">
      <div class="value-grid">
        @for (sample of recent; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'day' | async }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/view/example-chuan-hoa-gia-tri-rong":t(e({},o["pipes-utilities/view"]),{html:`<demo-section
      heading="Chu\u1EA9n ho\xE1 gi\xE1 tr\u1ECB r\u1ED7ng"
      [props]="[{ name: 'sdView', value: 'pipe' }]"
      note="So v\u1EDBi sdEmpty, sdView b\u1EAFt th\xEAm NaN v\xE0 m\u1EA3ng r\u1ED7ng \u2014 \u0111\xF3 l\xE0 hai gi\xE1 tr\u1ECB hay l\u1ECDt l\u01B0\u1EDBi nh\u1EA5t khi render d\u1EEF li\u1EC7u API.">
      <div class="value-grid">
        @for (sample of emptySamples; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdView }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"pipes-utilities/view/example-gop-mang-thanh-chuoi":t(e({},o["pipes-utilities/view"]),{html:`<demo-section
      heading="G\u1ED9p m\u1EA3ng th\xE0nh chu\u1ED7i"
      [props]="[{ name: 'sdView', value: 'pipe' }]"
      note="M\u1ED7i ph\u1EA7n t\u1EED \u0111\u01B0\u1EE3c chu\u1EA9n ho\xE1 \u0111\u1EC7 quy tr\u01B0\u1EDBc khi n\u1ED1i, n\xEAn ph\u1EA7n t\u1EED r\u1ED7ng b\xEAn trong m\u1EA3ng c\u0169ng th\xE0nh d\u1EA5u g\u1EA1ch thay v\xEC bi\u1EBFn m\u1EA5t.">
      <div class="value-grid">
        @for (sample of arraySamples; track sample.label) {
          <div class="value-cell">
            <span class="value-cell__label">{{ sample.label }}</span>
            <code>{{ sample.value | sdView }}</code>
          </div>
        }
      </div>
    </demo-section>`}),"services/confirm/example-chon-muc-do":t(e({},o["services/confirm"]),{html:`<demo-section heading="Ch\u1ECDn m\u1EE9c \u0111\u1ED9" [props]="[{ name: 'withRadio()', value: 'method' }]" note="withRadio() \u2013 ch\u1ECDn t\u1EEB danh s\xE1ch radio.">
    <button mat-stroked-button color="primary" (click)="onRadio()">Ch\u1ECDn m\u1EE9c \u0111\u1ED9</button>
  </demo-section>`}),"services/confirm/example-chon-ngay":t(e({},o["services/confirm"]),{html:`<demo-section heading="Ch\u1ECDn ng\xE0y" [props]="[{ name: 'withDate()', value: 'method' }]" note="withDate() \u2013 ch\u1ECDn ng\xE0y v\u1EDBi min/max n\u1EBFu c\u1EA7n.">
    <button mat-stroked-button color="primary" (click)="onDate()">Ch\u1ECDn ng\xE0y hi\u1EC7u l\u1EF1c</button>
  </demo-section>`}),"services/confirm/example-chon-ngay-gio":t(e({},o["services/confirm"]),{html:`<demo-section heading="Ch\u1ECDn ng\xE0y gi\u1EDD" [props]="[{ name: 'withDatetime()', value: 'method' }]" note="withDatetime() \u2013 ch\u1ECDn ng\xE0y v\xE0 gi\u1EDD.">
    <button mat-stroked-button color="primary" (click)="onDatetime()">Ch\u1ECDn l\u1ECBch x\u1EED l\xFD</button>
  </demo-section>`}),"services/confirm/example-chon-phong-ban":t(e({},o["services/confirm"]),{html:`<demo-section heading="Ch\u1ECDn ph\xF2ng ban" [props]="[{ name: 'withSelect()', value: 'method' }]" note="withSelect() \u2013 ch\u1ECDn m\u1ED9t gi\xE1 tr\u1ECB b\u1EB1ng sd-select.">
    <button mat-stroked-button color="primary" (click)="onSelect()">Ch\u1ECDn ph\xF2ng ban</button>
  </demo-section>`}),"services/confirm/example-chon-radio-dang-doc":t(e({},o["services/confirm"]),{html:`<demo-section heading="Ch\u1ECDn radio d\u1EA1ng d\u1ECDc" [props]="[{ name: 'display', value: 'column' }]" note="withRadio(..., { display: 'column' }) \u2013 hi\u1EC3n th\u1ECB danh s\xE1ch radio theo chi\u1EC1u d\u1ECDc.">
    <button mat-stroked-button color="primary" (click)="onRadioColumn()">Ch\u1ECDn ph\xF2ng ban d\u1EA1ng d\u1ECDc</button>
  </demo-section>`}),"services/confirm/example-nhap-ly-do":t(e({},o["services/confirm"]),{html:`<demo-section heading="Nh\u1EADp l\xFD do" [props]="[{ name: 'withInput()', value: 'method' }]" note="withInput() \u2013 y\xEAu c\u1EA7u nh\u1EADp n\u1ED9i dung tr\u01B0\u1EDBc khi x\xE1c nh\u1EADn.">
    <button mat-stroked-button color="primary" (click)="onInput()">Nh\u1EADp l\xFD do t\u1EEB ch\u1ED1i</button>
  </demo-section>`}),"services/confirm/example-nhat-ky-gan-nhat":t(e({},o["services/confirm"]),{html:`<demo-section heading="Nh\u1EADt k\xFD g\u1EA7n nh\u1EA5t">
    <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">{{ log() || '(ch\u01B0a c\xF3 thao t\xE1c)' }}</pre>
  </demo-section>`}),"services/confirm/example-xac-nhan-co-ban":t(e({},o["services/confirm"]),{html:`<demo-section heading="X\xE1c nh\u1EADn c\u01A1 b\u1EA3n" [props]="[{ name: 'confirm()', value: 'method' }]" note="confirm(message) \u2013 Promise resolve khi b\u1EA5m OK, reject khi H\u1EE7y.">
    <button mat-flat-button color="primary" (click)="onBasic()">X\xE1c nh\u1EADn thao t\xE1c</button>
  </demo-section>`}),"services/confirm/example-xac-nhan-xoa":t(e({},o["services/confirm"]),{html:`<demo-section heading="X\xE1c nh\u1EADn x\xF3a" [props]="[{ name: 'confirm()', value: 'method' }]" note="T\xF9y ch\u1EC9nh ti\xEAu \u0111\u1EC1, nh\xE3n n\xFAt v\xE0 m\xE0u n\xFAt.">
    <button mat-flat-button color="warn" (click)="onDelete()">X\xF3a b\u1EA3n ghi</button>
  </demo-section>`}),"services/excel/example-tai-template-trong":t(e({},o["services/excel"]),{html:`<demo-section heading="T\u1EA3i template tr\u1ED1ng" [props]="[{ name: 'generateTemplate()', value: 'method' }]" note="generateTemplate() \u2013 t\u1EA1o file m\u1EABu \u0111\u1EC3 ng\u01B0\u1EDDi d\xF9ng nh\u1EADp li\u1EC7u (c\u1ED9t c\xF3 required, m\xF4 t\u1EA3).">
    <button mat-stroked-button (click)="onTemplate()">T\u1EA3i template-nhanvien.xlsx</button>
  </demo-section>`}),"services/excel/example-xuat-file-csv":t(e({},o["services/excel"]),{html:`<demo-section heading="Xu\u1EA5t file .csv" [props]="[{ name: 'exportCSV()', value: 'method' }]" note="exportCSV() \u2013 k\xE8m BOM UTF-8 \u0111\u1EC3 Excel m\u1EDF \u0111\xFAng d\u1EA5u ti\u1EBFng Vi\u1EC7t.">
    <button mat-flat-button color="primary" (click)="onExportCsv()">T\u1EA3i nhanvien.csv</button>
  </demo-section>`}),"services/excel/example-xuat-file-xlsx":t(e({},o["services/excel"]),{html:`<demo-section heading="Xu\u1EA5t file .xlsx" [props]="[{ name: 'export()', value: 'method' }]" note="export({ columns, items, fileName }) \u2013 sheet 'data' c\xF3 header + d\u1EEF li\u1EC7u.">
    <button mat-flat-button color="primary" (click)="onExport()">T\u1EA3i nhanvien.xlsx</button>
  </demo-section>`}),"services/loading/example-bat-tat-thu-cong":t(e({},o["services/loading"]),{html:`<demo-section
      heading="B\u1EADt / t\u1EAFt th\u1EE7 c\xF4ng"
      [props]="[
        { name: 'start()', value: 'SdLoadingRef' },
        { name: 'close()', value: 'idempotent' },
        { name: 'stop()', value: 'compatibility FIFO' },
        { name: 'isLoading()', value: 'method' },
      ]"
      note="Code m\u1EDBi gi\u1EEF ref; stop(selector) v\u1EABn ho\u1EA1t \u0111\u1ED9ng cho call site c\u0169 theo th\u1EE9 t\u1EF1 start c\u0169 nh\u1EA5t.">
      <button mat-stroked-button (click)="onStart()">B\u1EADt loading</button>
      <button mat-stroked-button color="warn" (click)="onStop()">T\u1EAFt loading</button>
      <button mat-stroked-button (click)="onCheck()">Ki\u1EC3m tra tr\u1EA1ng th\xE1i</button>
      <span class="demo-status">Tr\u1EA1ng th\xE1i: {{ status() }}</span>
    </demo-section>`}),"services/loading/example-loading-o-dich":t(e({},o["services/loading"]),{html:`<demo-section
      heading="Loading \xF4 \u0111\xEDch"
      [props]="[{ name: 'start()', value: '#demo-target' }]"
      note="start('#demo-target') tr\u1EA3 v\u1EC1 handle idempotent s\u1EDF h\u1EEFu \u0111\xFAng host \u0111\xE3 match.">
      <button mat-flat-button color="primary" (click)="onTarget()">Loading v\xF9ng b\xEAn d\u01B0\u1EDBi</button>
      <div id="demo-target" class="demo-host">N\u1ED9i dung m\u1EABu \u2014 loading s\u1EBD ph\u1EE7 ch\xEDnh khung n\xE0y.</div>
    </demo-section>`}),"services/loading/example-loading-toan-trang":t(e({},o["services/loading"]),{html:`<demo-section
      heading="Loading to\xE0n trang"
      [props]="[{ name: 'start()', value: 'body' }]"
      note="run() lu\xF4n \u0111\xF3ng loading ref trong finally v\xE0 gi\u1EEF nguy\xEAn result/error c\u1EE7a task.">
      <button mat-flat-button color="primary" [disabled]="busy()" (click)="onFullPage()">Hi\u1EC3n th\u1ECB loading to\xE0n trang</button>
    </demo-section>`}),"services/loading/example-nhieu-host-cung-selector-multi-tab":t(e({},o["services/loading"]),{html:`<demo-section
      heading="Nhi\u1EC1u host c\xF9ng selector (multi-tab)"
      [props]="[
        { name: 'start()', value: '.demo-tab-panel' },
        { name: 'querySelectorAll', value: 'all matches' },
      ]"
      note="Hai owner overlap tr\xEAn c\xF9ng hai host; \u0111\xF3ng owner \u0111\u1EA7u kh\xF4ng g\u1EE1 overlay c\u1EE7a owner th\u1EE9 hai.">
      <button mat-flat-button color="primary" (click)="onMultiHost()">Ch\u1EA1y hai owner overlap</button>
      <div class="demo-tabs">
        <div class="demo-tab-panel demo-host">
          <strong>Tab 1</strong>
          <p>Panel \u0111\u1EA7u ti\xEAn trong DOM.</p>
        </div>
        <div class="demo-tab-panel demo-host">
          <strong>Tab 2</strong>
          <p>Panel th\u1EE9 hai \u2014 tr\u01B0\u1EDBc \u0111\xE2y kh\xF4ng hi\u1EC7n loading v\xEC querySelector ch\u1EC9 l\u1EA5y ph\u1EA7n t\u1EED \u0111\u1EA7u.</p>
        </div>
      </div>
    </demo-section>`}),"services/notify/example-4-loai-toast":t(e({},o["services/notify"]),{html:`<demo-section heading="4 lo\u1EA1i toast" [props]="[{ name: 'type', value: 'success / error / info / warning' }]" note="success / info / warning / error v\u1EDBi th\xF4ng \u0111i\u1EC7p ng\u1EAFn.">
    <button mat-flat-button color="primary" (click)="onInfo()">info</button>
    <button mat-flat-button style="background:#2e7d32;color:#fff" (click)="onSuccess()">success</button>
    <button mat-flat-button style="background:#ed6c02;color:#fff" (click)="onWarning()">warning</button>
    <button mat-flat-button color="warn" (click)="onError()">error</button>
  </demo-section>`}),"services/notify/example-don-dep":t(e({},o["services/notify"]),{html:`<demo-section heading="D\u1ECDn d\u1EB9p" [props]="[{ name: 'clearAll()', value: 'method' }]" note="clearAll() x\xF3a to\xE0n b\u1ED9; clearByType('error') x\xF3a theo lo\u1EA1i.">
    <button mat-stroked-button (click)="onSpam()">T\u1EA1o 3 toast c\xF9ng l\xFAc</button>
    <button mat-stroked-button color="warn" (click)="onClear()">X\xF3a t\u1EA5t c\u1EA3</button>
  </demo-section>`}),"services/notify/example-thoi-luong-tuy-chinh":t(e({},o["services/notify"]),{html:`<demo-section heading="Th\u1EDDi l\u01B0\u1EE3ng t\xF9y ch\u1EC9nh" [props]="[{ name: 'duration', value: 'ms' }]" note="duration t\xEDnh b\u1EB1ng ms. M\u1EB7c \u0111\u1ECBnh 3000ms cho success/info, 5000ms cho warning/error.">
    <button mat-stroked-button (click)="onShort()">Toast 1.5 gi\xE2y</button>
    <button mat-stroked-button (click)="onLong()">Toast 8 gi\xE2y</button>
  </demo-section>`}),"services/notify/example-toast-co-action":t(e({},o["services/notify"]),{html:`<demo-section heading="Toast c\xF3 action" [props]="[{ name: 'actionLabel', value: 'text' }]" note="actionLabel + onAction \u0111\u1EC3 g\u1EAFn n\xFAt b\u1EA5m v\xE0o toast.">
    <button mat-stroked-button color="primary" (click)="onAction()">Toast c\xF3 n\xFAt "Ho\xE0n t\xE1c"</button>
  </demo-section>`}),"services/persistence/example-deterministic-identity":t(e({},o["services/persistence"]),{html:`<demo-section
      heading="Deterministic identity"
      [props]="[{ name: 'canonicalizer', value: 'SdGraphIdentityCanonicalizer' }]"
      note="Property insertion order does not change the canonical persistence identity.">
      <p>Stable identity: {{ stableIdentity }}</p>
    </demo-section>`}),"services/persistence/example-graph-round-trip":t(e({},o["services/persistence"]),{html:`<demo-section
      heading="Graph round-trip"
      [props]="[
        { name: 'serializer', value: 'SdGraphSerializer' },
        { name: 'references', value: 'shared + circular' },
      ]">
      <pre>{{ graphSummary }}</pre>
    </demo-section>`}),"services/persistence/example-invalid-input-containment":t(e({},o["services/persistence"]),{html:`<demo-section
      heading="Invalid input containment"
      [props]="[{ name: 'error', value: 'SdPersistenceError' }]"
      note="Consumers can reject malformed documents without mutating the previous cache/storage value.">
      <p>Invalid document rejected: {{ invalidDocumentRejected }}</p>
    </demo-section>`}),"services/persistence/example-versioned-envelope":t(e({},o["services/persistence"]),{html:`<demo-section
      heading="Versioned envelope"
      [props]="[
        { name: 'identity', value: 'tenant:42' },
        { name: 'serializer', value: serializer.format },
      ]">
      <p>Envelope payload: {{ envelopeTeam }}</p>
    </demo-section>`}),"services/storage/example-gia-tri-dang-luu-cap-nhat-truc-tiep-qua-subject":t(e({},o["services/storage"]),{html:`<demo-section heading="Gi\xE1 tr\u1ECB \u0111ang l\u01B0u (c\u1EADp nh\u1EADt tr\u1EF1c ti\u1EBFp qua subject)">
          <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">
demo:user-name    = {{ liveLocal() ?? '(tr\u1ED1ng)' }}
demo:session-note = {{ liveSession() ?? '(tr\u1ED1ng)' }}</pre
          >
        </demo-section>`}),"services/storage/example-localstorage":t(e({},o["services/storage"]),{html:`<demo-section
          heading="localStorage"
          [props]="[{ name: 'type', value: 'local' }]"
          note="Key 'demo:user-name'. \u0110\xF3ng tr\xECnh duy\u1EC7t r\u1ED3i m\u1EDF l\u1EA1i v\u1EABn c\xF2n.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>T\xEAn ng\u01B0\u1EDDi d\xF9ng</mat-label>
            <input matInput [(ngModel)]="draftLocal" placeholder="Nh\u1EADp t\xEAn..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveLocal()">L\u01B0u</button>
          <button mat-stroked-button (click)="readLocal()">\u0110\u1ECDc l\u1EA1i</button>
          <button mat-stroked-button color="warn" (click)="removeLocal()">X\xF3a</button>
        </demo-section>`}),"services/storage/example-sessionstorage":t(e({},o["services/storage"]),{html:`<demo-section
          heading="sessionStorage"
          [props]="[{ name: 'type', value: 'session' }]"
          note="Key 'demo:session-note'. M\u1EA5t khi \u0111\xF3ng tab.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>Ghi ch\xFA phi\xEAn</mat-label>
            <input matInput [(ngModel)]="draftSession" placeholder="Nh\u1EADp ghi ch\xFA..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveSession()">L\u01B0u (session)</button>
          <button mat-stroked-button color="warn" (click)="removeSession()">X\xF3a</button>
        </demo-section>`}),"services/task/example-cancel-va-retry":t(e({},o["services/task"]),{html:`<demo-section
      heading="Cancel v\xE0 retry"
      [props]="[
        { name: 'cancel coalescing', value: 'Promise<boolean>' },
        { name: 'retry guard', value: 'failed/cancelled/transport error' },
      ]"
      note="Cancel l\u1ED7i gi\u1EEF nguy\xEAn business state; retry kh\xF4ng restart m\u1ED9t connection \u0111ang kh\u1ECFe.">
      <sd-job-progress taskId="showcase-action-task" mode="details"></sd-job-progress>
      <button type="button" (click)="failActionTask()">Gi\u1EA3 l\u1EADp task th\u1EA5t b\u1EA1i</button>
    </demo-section>`}),"services/task/example-manual-lifecycle":t(e({},o["services/task"]),{html:`<demo-section
      heading="Manual lifecycle"
      [props]="[
        { name: 'status', value: manualTask.state().status },
        { name: 'progress', value: manualTask.state().progress ?? 'indeterminate' },
      ]">
      <sd-job-progress taskId="showcase-manual-task" mode="details"></sd-job-progress>
      <div class="task-actions">
        <button type="button" (click)="advanceManualTask()">Ti\u1EBFn th\xEAm 25%</button>
        <button type="button" (click)="completeManualTask()">Ho\xE0n t\u1EA5t</button>
      </div>
    </demo-section>`}),"services/task/example-polling-va-terminal-teardown":t(e({},o["services/task"]),{html:`<demo-section
      heading="Polling v\xE0 terminal teardown"
      [props]="[
        { name: 'load calls', value: pollLoadCount },
        { name: 'connection', value: pollingTask.connection() },
      ]"
      note="Demo tr\u1EA3 terminal state ngay l\u01B0\u1EE3t \u0111\u1EA7u; service kh\xF4ng schedule th\xEAm poll sau succeeded.">
      <sd-job-progress taskId="showcase-poll-task"></sd-job-progress>
    </demo-section>`}),"services/task/example-shared-stable-id":t(e({},o["services/task"]),{html:`<demo-section
      heading="Shared stable ID"
      [props]="[
        { name: 'subscriberCount', value: sharedTask.subscriberCount() },
        { name: 'same state signal', value: sharedTask.state === sharedTaskDuplicate.state },
      ]"
      note="Hai watcher tr\xF9ng ID d\xF9ng chung state/transport; entry ch\u1EC9 b\u1ECB x\xF3a sau lease cu\u1ED1i.">
      <p data-shared-task-count>Active leases: {{ sharedTask.subscriberCount() }}</p>
      <button type="button" [disabled]="sharedDuplicateDestroyed" (click)="releaseDuplicateLease()">H\u1EE7y lease th\u1EE9 hai</button>
    </demo-section>`}),"services/unsaved-changes/example-additive-close-hook":t(e({},o["services/unsaved-changes"]),{html:`<demo-section
      heading="Additive close hook"
      note="G\u1EAFn c\xF9ng closeGuard v\xE0o [beforeClose] c\u1EE7a SdModal, SdSideDrawer ho\u1EB7c SdTab; kh\xF4ng c\u1EA7n component ph\u1EE5 thu\u1ED9c tr\u1EF1c ti\u1EBFp v\xE0o service.">
      <button type="button" (click)="openDrawer()">M\u1EDF drawer \u0111\xE3 ch\u1EC9nh s\u1EEDa</button>
      <output data-drawer-state>drawer dirty={{ drawerRef.dirty() }}</output>
      <sd-side-drawer #drawer title="Bi\xEAn t\u1EADp h\u1ED3 s\u01A1" [beforeClose]="drawerCloseGuard">
        <div class="drawer-body">D\u1EEF li\u1EC7u trong drawer \u0111ang ch\u1EDD l\u01B0u.</div>
        <button sdFooterRight type="button" (click)="drawer.close()">\u0110\xF3ng c\xF3 guard</button>
      </sd-side-drawer>
    </demo-section>`}),"services/unsaved-changes/example-async-confirmation-decisions":t(e({},o["services/unsaved-changes"]),{html:`<demo-section
      heading="Async confirmation decisions"
      [props]="[
        { name: 'decision', value: confirmation.decision() },
        { name: 'confirmCount', value: confirmation.confirmCount() },
      ]"
      note="Adapter t\xF9y bi\u1EBFn tr\u1EA3 save/discard/cancel ho\u1EB7c boolean. Exception/rejection lu\xF4n gi\u1EEF ng\u01B0\u1EDDi d\xF9ng \u1EDF m\xE0n h\xECnh hi\u1EC7n t\u1EA1i.">
      <div class="demo-actions">
        <button type="button" (click)="setDecision('save')">Save</button>
        <button type="button" (click)="setDecision('discard')">Discard</button>
        <button type="button" (click)="setDecision('cancel')">Cancel</button>
        <button type="button" (click)="confirmAll()">Confirm leave</button>
      </div>
      <output data-confirm-state>{{ confirmResult() }}</output>
    </demo-section>`}),"services/unsaved-changes/example-formgroup-adapter":t(e({},o["services/unsaved-changes"]),{html:`<demo-section
      heading="FormGroup adapter"
      [props]="[{ name: 'form.dirty', value: profileForm.dirty }]"
      note="Adapter gi\u1EEF snapshot, c\u1EADp nh\u1EADt baseline sau save th\xE0nh c\xF4ng v\xE0 t\u1EF1 unsubscribe khi registration b\u1ECB destroy.">
      <label class="demo-field">
        T\xEAn hi\u1EC3n th\u1ECB
        <input [formControl]="profileForm.controls.name" />
      </label>
      <div class="demo-actions">
        <button type="button" (click)="saveForm()">Save</button>
        <button type="button" (click)="formRef.discard()">Discard v\u1EC1 snapshot</button>
      </div>
      <output data-form-state>{{ profileForm.controls.name.value }} \xB7 dirty={{ formRef.dirty() }}</output>
    </demo-section>`}),"services/unsaved-changes/example-multiple-scoped-watchers":t(e({},o["services/unsaved-changes"]),{html:`<demo-section
      heading="Multiple scoped watchers"
      [props]="[
        { name: 'registrations', value: unsaved.registrations().length },
        { name: 'dirty', value: unsaved.dirty() },
      ]"
      note="C\xF9ng id c\xF3 th\u1EC3 t\u1ED3n t\u1EA1i \u1EDF scope kh\xE1c nhau; register l\u1EB7p trong c\xF9ng scope tr\u1EA3 l\u1EA1i \u0111\xFAng registration ref.">
      <div class="demo-actions">
        <button type="button" (click)="profileRef.markDirty()">S\u1EEDa h\u1ED3 s\u01A1</button>
        <button type="button" (click)="filterRef.markDirty()">S\u1EEDa b\u1ED9 l\u1ECDc</button>
        <button type="button" (click)="profileRef.markPristine(); filterRef.markPristine()">\u0110\xE1nh d\u1EA5u \u0111\xE3 l\u01B0u</button>
      </div>
      <output data-registry-state>
        profile={{ profileRef.dirty() }} \xB7 filters={{ filterRef.dirty() }} \xB7 any={{ unsaved.dirty() }}
      </output>
    </demo-section>`}),"services/viewport/example-breakpoint-mac-dinh":t(e({},o["services/viewport"]),{html:`<demo-section
      heading="Breakpoint m\u1EB7c \u0111\u1ECBnh"
      [props]="[
        { name: 'mobile', value: viewport.breakpoints.mobile },
        { name: 'tablet', value: viewport.breakpoints.tablet },
        { name: 'desktop', value: viewport.breakpoints.desktop },
      ]"
      note="C\xE1c m\u1ED1c d\xF9ng min-width semantics; c\xF3 th\u1EC3 override to\xE0n b\u1ED9 qua SD_VIEWPORT_BREAKPOINTS.">
      <div class="breakpoint-list">
        <code>mobile: {{ viewport.breakpoints.mobile }}</code>
        <code>tablet: {{ viewport.breakpoints.tablet }}</code>
        <code>desktop: {{ viewport.breakpoints.desktop }}</code>
      </div>
    </demo-section>`}),"services/viewport/example-signal-theo-breakpoint":t(e({},o["services/viewport"]),{html:`<demo-section
      heading="Signal theo breakpoint"
      [props]="[
        { name: 'isMobile()', value: viewport.isMobile() },
        { name: 'isTablet()', value: viewport.isTablet() },
        { name: 'isDesktop()', value: viewport.isDesktop() },
      ]"
      note="Consumer ch\u1EC9 \u0111\u1ECDc signal, kh\xF4ng t\u1EF1 \u0111\u0103ng k\xFD ho\u1EB7c cleanup listener.">
      <div class="breakpoint-list">
        <code>isMobile: {{ viewport.isMobile() }}</code>
        <code>isTablet: {{ viewport.isTablet() }}</code>
        <code>isDesktop: {{ viewport.isDesktop() }}</code>
      </div>
    </demo-section>`}),"services/viewport/example-trang-thai-truc-tiep":t(e({},o["services/viewport"]),{html:`<demo-section
      heading="Tr\u1EA1ng th\xE1i tr\u1EF1c ti\u1EBFp"
      [props]="[
        { name: 'width / height', value: 'Signal<number>' },
        { name: 'currentBreakpoint', value: viewport.currentBreakpoint() },
      ]"
      note="Thay \u0111\u1ED5i k\xEDch th\u01B0\u1EDBc c\u1EEDa s\u1ED5 \u0111\u1EC3 quan s\xE1t c\xE1c signal c\u1EADp nh\u1EADt t\u1EEB c\xF9ng m\u1ED9t resize listener.">
      <div class="viewport-state">
        <strong data-viewport-size>{{ viewport.width() }} \xD7 {{ viewport.height() }}</strong>
        <span data-current-breakpoint>{{ viewport.currentBreakpoint() }}</span>
      </div>
    </demo-section>`})};export{n as SHOWCASE_EXAMPLE_SOURCES};

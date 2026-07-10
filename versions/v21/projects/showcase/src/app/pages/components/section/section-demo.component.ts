import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-section-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdSection, SdSectionItem],
  template: `
    <demo-page
      title="Section"
      description="Card nhom thong tin. Header/footer dung padding 8px 16px; body mac dinh padding 0 nen row item hoac wrapper con tu quan ly spacing.">

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

      <demo-section heading="Headerless card with manual body padding" [props]="[{ name: 'hideHeader', value: true }, { name: 'body wrapper', value: 'custom padding' }]">
        <sd-section [hideHeader]="true" class="demo-section-card">
          <div class="section-padded-body">
            <strong>Headerless note</strong>
            <p>Because section body has padding 0, free-form content should add its own wrapper when it needs breathing room.</p>
          </div>
        </sd-section>
      </demo-section>

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
    </demo-page>
  `,
  styles: [`
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
  `],
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

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';

@Component({
  selector: 'app-modal-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdModal, SdSection, SdSectionItem],
  template: `
    <demo-page
      title="Modal"
      description="Dialog va bottom-sheet dung chung slot sdHeaderLeft/sdHeaderRight/sdFooterLeft/sdFooterRight. Body mac dinh padding 0 de consumer tu quyet dinh layout.">

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

      <demo-section heading="Read-only modal without footer" [props]="[{ name: 'footer', value: 'empty hidden' }]">
        <sd-button type="outline" color="primary" prefixIcon="visibility" title="Preview note" (click)="preview.open()"></sd-button>

        <sd-modal #preview title="Internal note" width="sm">
          <div class="demo-stack">
            <p class="demo-copy">This modal has no footer slots. The footer container stays hidden so read-only content can remain compact.</p>
          </div>
        </sd-modal>
      </demo-section>

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
    </demo-page>
  `,
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDemoComponent {
  readonly activityRows = [
    { time: '09:30', actor: 'Nguyen Van An', action: 'Updated status' },
    { time: '10:45', actor: 'Tran Thi Bich', action: 'Added attachment' },
    { time: '14:15', actor: 'Le Minh Hoang', action: 'Approved request' },
  ];

  readonly checklist = Array.from({ length: 16 }, (_, index) => `Checklist item ${index + 1}`);

  readonly deliverySlots = [
    { time: '5:00 PM - 5:15 PM', note: 'Prep starts at 4:45 PM' },
    { time: '5:30 PM - 5:45 PM', note: 'Good if you are heading home' },
    { time: '6:00 PM - 6:15 PM', note: 'Most popular' },
  ];
}

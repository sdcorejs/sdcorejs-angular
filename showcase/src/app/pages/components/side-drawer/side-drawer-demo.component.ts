import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';

@Component({
  selector: 'app-side-drawer-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge, SdButton, SdSection, SdSectionItem, SdSideDrawer],
  template: `
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
  `,
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideDrawerDemoComponent {
  readonly checklist = Array.from({ length: 22 }, (_, index) => `Checklist item ${index + 1}`);
}

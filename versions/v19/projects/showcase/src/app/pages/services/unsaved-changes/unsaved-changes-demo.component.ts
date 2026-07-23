import { ChangeDetectionStrategy, Component, DestroyRef, Injectable, inject, signal, viewChild } from '@angular/core';
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
  template: `
    <demo-page
      #demoPage
      title="Unsaved Changes"
      description="Registry SSR-safe cho nhiều nguồn dirty, FormGroup, route guard và hook đóng modal/drawer/tab với xác nhận async fail-closed.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-scoped-watchers') {
        <demo-section
          heading="Multiple scoped watchers"
          [props]="[
            { name: 'registrations', value: unsaved.registrations().length },
            { name: 'dirty', value: unsaved.dirty() },
          ]"
          note="Cùng id có thể tồn tại ở scope khác nhau; register lặp trong cùng scope trả lại đúng registration ref.">
          <div class="demo-actions">
            <button type="button" (click)="profileRef.markDirty()">Sửa hồ sơ</button>
            <button type="button" (click)="filterRef.markDirty()">Sửa bộ lọc</button>
            <button type="button" (click)="profileRef.markPristine(); filterRef.markPristine()">Đánh dấu đã lưu</button>
          </div>
          <output data-registry-state>
            profile={{ profileRef.dirty() }} · filters={{ filterRef.dirty() }} · any={{ unsaved.dirty() }}
          </output>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-formgroup-adapter') {
        <demo-section
          heading="FormGroup adapter"
          [props]="[{ name: 'form.dirty', value: profileForm.dirty }]"
          note="Adapter giữ snapshot, cập nhật baseline sau save thành công và tự unsubscribe khi registration bị destroy.">
          <label class="demo-field">
            Tên hiển thị
            <input [formControl]="profileForm.controls.name" />
          </label>
          <div class="demo-actions">
            <button type="button" (click)="saveForm()">Save</button>
            <button type="button" (click)="formRef.discard()">Discard về snapshot</button>
          </div>
          <output data-form-state>{{ profileForm.controls.name.value }} · dirty={{ formRef.dirty() }}</output>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-async-confirmation-decisions') {
        <demo-section
          heading="Async confirmation decisions"
          [props]="[
            { name: 'decision', value: confirmation.decision() },
            { name: 'confirmCount', value: confirmation.confirmCount() },
          ]"
          note="Adapter tùy biến trả save/discard/cancel hoặc boolean. Exception/rejection luôn giữ người dùng ở màn hình hiện tại.">
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
          note="Gắn cùng closeGuard vào [beforeClose] của SdModal, SdSideDrawer hoặc SdTab; không cần component phụ thuộc trực tiếp vào service.">
          <button type="button" (click)="openDrawer()">Mở drawer đã chỉnh sửa</button>
          <output data-drawer-state>drawer dirty={{ drawerRef.dirty() }}</output>
          <sd-side-drawer #drawer title="Biên tập hồ sơ" [beforeClose]="drawerCloseGuard">
            <div class="drawer-body">Dữ liệu trong drawer đang chờ lưu.</div>
            <button sdFooterRight type="button" (click)="drawer.close()">Đóng có guard</button>
          </sd-side-drawer>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
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
  `,
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
  readonly profileForm = new FormGroup({ name: new FormControl('Nguyễn An', { nonNullable: true }) });
  readonly confirmResult = signal('Chưa xác nhận');
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
      message: 'Hồ sơ có thay đổi chưa lưu.',
      save: () => this.#profileDirty.set(false),
      discard: () => this.#profileDirty.set(false),
    });
    this.filterRef = this.unsaved.register({
      id: 'editor',
      scope: 'filters',
      isDirty: this.#filterDirty,
      message: 'Bộ lọc có thay đổi chưa lưu.',
      save: () => this.#filterDirty.set(false),
      discard: () => this.#filterDirty.set(false),
    });
    this.formRef = registerSdUnsavedChangesForm(this.unsaved, this.profileForm, {
      id: 'profile-form',
      scope: 'form',
      message: 'Biểu mẫu có thay đổi chưa lưu.',
      save: () => undefined,
    });
    this.drawerRef = this.unsaved.register({
      id: 'drawer-editor',
      scope: 'drawer',
      isDirty: this.#drawerDirty,
      message: 'Drawer có thay đổi chưa lưu.',
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
    this.confirmResult.set(canLeave ? 'Có thể rời màn hình' : 'Giữ nguyên màn hình');
  }

  openDrawer(): void {
    this.#drawerDirty.set(true);
    this.drawerComponent().open();
  }
}

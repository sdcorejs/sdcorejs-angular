import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, merge } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSegmentedComponent } from '@sdcorejs/angular/forms/segmented';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage, apiFieldErrors } from '../../../../utils/api-error';
import { PartnerService } from '../../services/partner.service';
import { PARTNER_TYPE_OPTIONS, type PartnerSaveReq, type PartnerType } from '../../services/partner.model';

/** Bản nháp giữ trong tab trình duyệt: tải lại trang vẫn tiếp tục được. */
interface PartnerDraft extends PartnerSaveReq {
  readonly step: number;
  readonly savedAt: string;
}

const DRAFT_KEY = 'pattern.partner.create.draft';
const EMPTY: PartnerSaveReq = {
  code: '',
  type: 'individual',
  name: '',
  identity: '',
  representative: null,
  email: '',
  phone: '',
  address: '',
};

function readDraft(): PartnerDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PartnerDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: PartnerDraft | null): void {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Không lưu được nháp (chế độ riêng tư, hết dung lượng): flow vẫn chạy, chỉ không khôi phục sau khi tải lại.
  }
}

/**
 * Pattern flow dọc: `sd-page` hẹp + `sd-stepper` dọc, nút bước ở footer. Bước 2 rẽ nhánh theo loại đối tác; rời bước 1
 * thì kiểm tra trùng mã với API; mọi thay đổi được lưu nháp và khôi phục khi tải lại trang.
 */
@Component({
  selector: 'create',
  standalone: true,
  imports: [
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdInput,
    SdSegmentedComponent,
    SdFormatDatetimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let value = seed();
    <sd-page title="Tạo đối tác" description="Đối tác cá nhân hoặc doanh nghiệp." [backLink]="['../..']" width="narrow">
      @if (restored(); as draft) {
        <sd-inform
          info
          class="mt-16"
          autoId="partner-draft"
          [description]="'Đã khôi phục bản nháp lưu lúc ' + (draft.savedAt | sdFormatDatetime) + '.'"
          actionLabel="Bỏ nháp"
          (sdAction)="discard()" />
      }
      <sd-stepper linear orientation="vertical" animationDuration="0ms" autoId="partner-steps" [(selectedIndex)]="step">
        <sd-step label="Loại và mã đối tác" [stepControl]="kind">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-segmented
              name="type"
              ariaLabel="Loại đối tác"
              autoId="partner-type"
              [form]="kind"
              [items]="types"
              [model]="value.type"
              (sdChange)="type.set($any($event) ?? 'individual')" />
            <sd-input
              label="Mã đối tác"
              name="code"
              autoId="partner-code"
              [form]="kind"
              [model]="value.code"
              [inlineError]="codeError() ?? undefined"
              maxlength="20"
              required />
          </div>
        </sd-step>
        <sd-step [label]="type() === 'business' ? 'Thông tin doanh nghiệp' : 'Thông tin cá nhân'" [stepControl]="identity">
          <div class="d-flex flex-column gap-8 py-8">
            @if (type() === 'business') {
              <sd-input label="Tên doanh nghiệp" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="Mã số thuế"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="14"
                required />
              <sd-input
                label="Người đại diện"
                name="representative"
                autoId="partner-representative"
                [form]="identity"
                [model]="value.representative"
                required />
            } @else {
              <sd-input label="Họ và tên" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="Số CCCD"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="12"
                required />
            }
          </div>
        </sd-step>
        <sd-step label="Liên hệ" [stepControl]="contact">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-input label="Email" name="email" autoId="partner-email" [form]="contact" [model]="value.email" pattern="EMAIL" required />
            <sd-input
              label="Điện thoại"
              name="phone"
              autoId="partner-phone"
              [form]="contact"
              [model]="value.phone"
              maxlength="15"
              required />
            <sd-input label="Địa chỉ" name="address" autoId="partner-address" [form]="contact" [model]="value.address" maxlength="200" />
          </div>
        </sd-step>
        <sd-step label="Xác nhận">
          @let summary = request();
          <sd-section title="Kiểm tra lại" class="d-block my-8">
            <sd-section-item label="Mã đối tác">{{ summary.code }}</sd-section-item>
            <sd-section-item label="Loại">{{ summary.type === 'business' ? 'Doanh nghiệp' : 'Cá nhân' }}</sd-section-item>
            <sd-section-item label="Tên">{{ summary.name }}</sd-section-item>
            <sd-section-item [label]="summary.type === 'business' ? 'Mã số thuế' : 'Số CCCD'">{{ summary.identity }}</sd-section-item>
            @if (summary.type === 'business') {
              <sd-section-item label="Người đại diện">{{ summary.representative }}</sd-section-item>
            }
            <sd-section-item label="Email">{{ summary.email }}</sd-section-item>
            <sd-section-item label="Điện thoại">{{ summary.phone }}</sd-section-item>
          </sd-section>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay lại"
        type="outline"
        autoId="partner-previous"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Tiếp tục"
          type="fill"
          color="primary"
          autoId="partner-next"
          [loading]="checking()"
          (click)="next()" />
      } @else {
        <sd-button
          sdFooterRight
          title="Tạo đối tác"
          type="fill"
          color="primary"
          autoId="partner-save"
          [loading]="saving()"
          (click)="save()" />
      }
    </sd-page>
  `,
})
export class CreateComponent {
  readonly #partnerService = inject(PartnerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #draft = readDraft();
  protected readonly types = PARTNER_TYPE_OPTIONS;
  /** Giá trị ban đầu của các field: bản nháp nếu có. */
  protected readonly seed = signal<PartnerSaveReq>(this.#draft ?? EMPTY);
  protected readonly restored = signal<PartnerDraft | null>(this.#draft);
  protected readonly step = signal(this.#draft?.step ?? 0);
  protected readonly type = signal<PartnerType>(this.#draft?.type ?? 'individual');
  // Mỗi bước một FormGroup: stepper `linear` không cho sang bước sau khi bước hiện tại còn lỗi.
  protected readonly kind = new FormGroup({});
  protected readonly identity = new FormGroup({});
  protected readonly contact = new FormGroup({});
  protected readonly codeError = signal<string | null>(null);
  protected readonly checking = signal(false);
  protected readonly saving = signal(false);
  readonly #values = signal(0);
  /** Đã tạo xong: khi trang đóng, field gỡ control khỏi form và phát valueChanges; không được ghi lại nháp vừa xoá. */
  #created = false;
  protected readonly request = computed<PartnerSaveReq>(() => {
    this.#values();
    // why: nội dung bước chỉ tạo khi bước được mở; bước chưa mở lại sau khi khôi phục nháp lấy giá trị của nháp.
    const value = {
      ...this.seed(),
      ...this.kind.getRawValue(),
      ...this.identity.getRawValue(),
      ...this.contact.getRawValue(),
    } as Partial<PartnerSaveReq>;
    const type = this.type();
    return {
      code: (value.code ?? '').trim().toUpperCase(),
      type,
      name: value.name ?? '',
      identity: value.identity ?? '',
      representative: type === 'business' ? (value.representative ?? '') : null,
      email: value.email ?? '',
      phone: value.phone ?? '',
      address: value.address ?? '',
    };
  });

  constructor() {
    // Mỗi thay đổi lưu nháp; mã đổi thì bỏ lỗi trùng mã cũ.
    const subscription = merge(this.kind.valueChanges, this.identity.valueChanges, this.contact.valueChanges).subscribe(() => {
      if (this.#created) return;
      this.#values.update(count => count + 1);
      this.#saveDraft();
    });
    const code = this.kind.valueChanges.subscribe(() => this.codeError.set(null));
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      code.unsubscribe();
    });
  }

  protected async next(): Promise<void> {
    const step = this.step();
    const group = [this.kind, this.identity, this.contact][step];
    group.markAllAsTouched();
    if (group.invalid) return;
    if (step === 0 && !(await this.#codeAvailable())) return;
    this.step.set(step + 1);
    this.#saveDraft();
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const partner = await firstValueFrom(this.#partnerService.create(this.request()));
      this.#created = true;
      writeDraft(null);
      this.#notify.success(`Đã tạo đối tác ${partner.code}.`);
      await this.#router.navigate(['../..'], { relativeTo: this.#route });
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields['code']) {
        // Mã vừa bị người khác dùng: quay lại bước nhập mã, dữ liệu các bước khác giữ nguyên.
        this.codeError.set(fields['code']);
        this.step.set(0);
      } else this.#notify.error(apiErrorMessage(error, 'Không tạo được đối tác. Dữ liệu vẫn được giữ trong bản nháp.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async discard(): Promise<void> {
    try {
      await this.#confirm.confirm('Xoá bản nháp và nhập lại từ đầu?', {
        title: 'Bỏ nháp',
        yesTitle: 'Bỏ nháp',
        noTitle: 'Giữ lại',
        yesButtonColor: 'warning',
      });
    } catch {
      return;
    }
    writeDraft(null);
    this.restored.set(null);
    this.step.set(0);
    this.type.set('individual');
    this.seed.set({ ...EMPTY });
  }

  async #codeAvailable(): Promise<boolean> {
    this.checking.set(true);
    try {
      const { available } = await firstValueFrom(this.#partnerService.checkCode(this.request().code));
      if (!available) this.codeError.set(`Mã ${this.request().code} đã được dùng.`);
      return available;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không kiểm tra được mã. Thử lại.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #saveDraft(): void {
    writeDraft({ ...this.request(), step: this.step(), savedAt: new Date().toISOString() });
  }
}

# Flow

Quy trình nhiều bước: `sd-page width="narrow"` + `sd-stepper` trong thân + nút bước ở `sdFooterLeft` / `sdFooterRight`. Route mẫu: `/pattern/import` (bốn bước ngang: nguồn, ánh xạ, xem trước & xung đột, xác nhận), `/pattern/partner/create` (bước dọc, rẽ nhánh theo loại, kiểm tra trùng mã, lưu nháp).

## Khi nào dùng / khi nào không

- Dùng khi bước sau phụ thuộc kết quả bước trước (ánh xạ cột rồi mới xem trước), hoặc khi dữ liệu nhiều đến mức chia bước giúp người dùng.
- Các nhóm độc lập, nhập theo thứ tự nào cũng được: dùng [form](form.md) với mục lục.

## Code mẫu

Bước ngang, mỗi bước có cổng (`stepControl`) chỉ mở khi bước đã qua kiểm tra; bước cuối mới ghi dữ liệu:

<!-- @source features/import/pages/flow/flow.component.ts -->
```ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdSegmentedComponent, type SdSegmentedItem, type SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { MappingFormComponent } from '../../components/mapping-form/mapping-form.component';
import { PreviewViewComponent } from '../../components/preview-view/preview-view.component';
import { ImportService } from '../../services/import.service';
import {
  guessMapping,
  IMPORT_FIELDS,
  IMPORT_SAMPLE,
  parseCsv,
  type ImportCommitRes,
  type ImportDuplicatePolicy,
  type ImportMapping,
  type ImportPreviewRowDto,
} from '../../services/import.model';

const DUPLICATES: readonly SdSegmentedItem<ImportDuplicatePolicy>[] = [
  { value: 'skip', label: 'Bỏ qua dòng trùng' },
  { value: 'overwrite', label: 'Ghi đè sản phẩm đã có' },
];

/**
 * Pattern flow ngang: `sd-page` hẹp + `sd-stepper`, nút bước ở footer. Bốn bước giữ dữ liệu khi quay lại; mỗi bước
 * kiểm tra điều kiện của chính nó trước khi sang bước sau, bước cuối mới ghi dữ liệu.
 */
@Component({
  selector: 'flow',
  standalone: true,
  imports: [
    RouterLink,
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdSegmentedComponent,
    SdTextarea,
    MappingFormComponent,
    PreviewViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-page title="Nhập dữ liệu sản phẩm" description="Nhập danh mục sản phẩm từ tệp CSV." [backLink]="['..']" width="narrow">
      <sd-stepper linear [(selectedIndex)]="step" animationDuration="0ms" autoId="import-steps">
        <sd-step label="Nguồn dữ liệu" [stepControl]="gates[0]">
          <div class="d-flex flex-column gap-8 py-16">
            <sd-inform type="tip" description="Dán nội dung CSV có dòng tiêu đề, hoặc dùng dữ liệu mẫu." />
            <sd-textarea
              label="Nội dung CSV"
              name="source"
              autoId="import-source"
              [form]="sourceForm"
              [model]="source()"
              (modelChange)="editSource($event ?? '')"
              [inlineError]="showErrors() && !rows().length ? 'Cần ít nhất một dòng dữ liệu dưới dòng tiêu đề.' : undefined"
              [maxlength]="20000"
              required />
            <div>
              <sd-button title="Dùng dữ liệu mẫu" type="text" prefixIcon="description" autoId="import-sample" (click)="useSample()" />
            </div>
          </div>
        </sd-step>
        <sd-step label="Nhận diện & ánh xạ" [stepControl]="gates[1]">
          <div class="py-16">
            <p class="T14R text-secondary mt-0">Đọc được {{ rows().length }} dòng, {{ columns().length }} cột.</p>
            <mapping-form
              [sourceColumns]="columns()"
              [mapping]="mapping()"
              [showErrors]="showErrors()"
              (mappingChange)="mapping.set($event)" />
          </div>
        </sd-step>
        <sd-step label="Xem trước & xung đột" [stepControl]="gates[2]">
          <div class="d-flex flex-column gap-12 py-16">
            @if (preview(); as rows) {
              <p class="T14R m-0">
                {{ counts().new }} dòng mới · {{ counts().duplicate }} dòng trùng mã · {{ counts().invalid }} dòng lỗi (bỏ qua)
              </p>
              <preview-view [rows]="rows" />
              @if (counts().duplicate) {
                <sd-segmented
                  ariaLabel="Xử lý dòng trùng"
                  autoId="import-duplicates"
                  [items]="duplicateItems"
                  [model]="duplicates()"
                  (sdChange)="setDuplicates($event)" />
              }
            } @else {
              <p class="T14R text-secondary">Đang kiểm tra dữ liệu…</p>
            }
          </div>
        </sd-step>
        <sd-step label="Xác nhận">
          <div class="py-16">
            @if (result(); as done) {
              <sd-inform
                success
                title="Đã nhập dữ liệu"
                [description]="done.created + ' sản phẩm mới, ' + done.updated + ' cập nhật, ' + done.skipped + ' bỏ qua.'" />
              <a class="d-inline-block mt-12" [routerLink]="['../product']">Xem danh sách sản phẩm</a>
            } @else {
              <sd-section title="Tóm tắt">
                <sd-section-item label="Thêm mới">{{ counts().new }}</sd-section-item>
                <sd-section-item label="Trùng mã"
                  >{{ counts().duplicate }} ({{ duplicates() === 'overwrite' ? 'ghi đè' : 'bỏ qua' }})</sd-section-item
                >
                <sd-section-item label="Lỗi, bỏ qua">{{ counts().invalid }}</sd-section-item>
              </sd-section>
            }
          </div>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay lại"
        type="outline"
        autoId="import-previous"
        [disabled]="step() === 0 || !!result()"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Tiếp tục"
          type="fill"
          color="primary"
          autoId="import-next"
          [loading]="checking()"
          (click)="next()" />
      } @else if (!result()) {
        <sd-button
          sdFooterRight
          title="Nhập dữ liệu"
          type="fill"
          color="primary"
          autoId="import-commit"
          [loading]="committing()"
          (click)="commit()" />
      }
    </sd-page>
  `,
})
export class FlowComponent {
  readonly #importService = inject(ImportService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  protected readonly duplicateItems = DUPLICATES;
  protected readonly step = signal(0);
  /**
   * Một cổng cho mỗi bước: chỉ đúng sau khi bước đó qua kiểm tra, nên stepper `linear` không cho bấm tiêu đề để
   * vượt qua bước chưa kiểm tra. Đổi nguồn dữ liệu thì đóng lại các bước sau.
   */
  protected readonly gates = [0, 1, 2].map(() => new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }));
  protected readonly showErrors = signal(false);
  /** Chỉ để đánh dấu đã chạm ô nguồn khi bấm Tiếp: lỗi của ô hiện ngay cả khi người dùng chưa gõ gì. */
  protected readonly sourceForm = new FormGroup({});
  protected readonly source = signal('');
  readonly #parsed = computed(() => parseCsv(this.source()));
  protected readonly columns = computed(() => this.#parsed().columns);
  protected readonly rows = computed(() => this.#parsed().rows);
  protected readonly mapping = signal<ImportMapping>({ code: null, name: null, unit: null, price: null });
  protected readonly preview = signal<readonly ImportPreviewRowDto[] | null>(null);
  protected readonly duplicates = signal<ImportDuplicatePolicy>('skip');
  protected readonly checking = signal(false);
  protected readonly committing = signal(false);
  protected readonly result = signal<ImportCommitRes | null>(null);
  protected readonly counts = computed(() => {
    const rows = this.preview() ?? [];
    return {
      new: rows.filter(row => row.result === 'new').length,
      duplicate: rows.filter(row => row.result === 'duplicate').length,
      invalid: rows.filter(row => row.result === 'invalid').length,
    };
  });

  protected useSample(): void {
    this.editSource(IMPORT_SAMPLE);
  }

  /** Đổi nguồn thì các bước sau phải kiểm tra lại. */
  protected editSource(value: string): void {
    this.source.set(value);
    this.gates.forEach(gate => gate.setValue(false));
  }

  protected setDuplicates(value: SdSegmentedModel<ImportDuplicatePolicy>): void {
    if (value === 'skip' || value === 'overwrite') this.duplicates.set(value);
  }

  protected async next(): Promise<void> {
    const step = this.step();
    if (step === 0) {
      if (!this.rows().length) {
        this.sourceForm.markAllAsTouched();
        return this.showErrors.set(true);
      }
      // Nguồn mới: ánh xạ lại theo tên cột, bỏ kết quả kiểm tra cũ.
      this.mapping.set(guessMapping(this.columns()));
      this.preview.set(null);
      this.gates.slice(1).forEach(gate => gate.setValue(false));
    }
    if (step === 1) {
      const missing = IMPORT_FIELDS.some(field => field.required && !this.mapping()[field.field]);
      if (missing) return this.showErrors.set(true);
      if (!(await this.#check())) return;
    }
    this.showErrors.set(false);
    this.gates[step].setValue(true);
    this.step.set(step + 1);
  }

  protected async commit(): Promise<void> {
    const { new: created, duplicate } = this.counts();
    const overwrite = this.duplicates() === 'overwrite' ? duplicate : 0;
    try {
      await this.#confirm.confirm(`Thêm ${created} sản phẩm${overwrite ? `, ghi đè ${overwrite} sản phẩm` : ''}?`, {
        title: 'Nhập dữ liệu',
        yesTitle: 'Nhập dữ liệu',
        noTitle: 'Không',
      });
    } catch {
      return;
    }
    this.committing.set(true);
    try {
      this.result.set(await firstValueFrom(this.#importService.commit(this.#mappedRows(), this.duplicates())));
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không nhập được dữ liệu. Thử lại.'));
    } finally {
      this.committing.set(false);
    }
  }

  async #check(): Promise<boolean> {
    this.checking.set(true);
    try {
      this.preview.set((await firstValueFrom(this.#importService.preview(this.#mappedRows()))).rows);
      return true;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không kiểm tra được dữ liệu. Thử lại.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #mappedRows() {
    const mapping = this.mapping();
    return this.rows().map(row => ({
      code: mapping.code ? (row[mapping.code] ?? '') : '',
      name: mapping.name ? (row[mapping.name] ?? '') : '',
      unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
      price: mapping.price ? (row[mapping.price] ?? '') : '0',
    }));
  }
}
```

Bước dọc, rẽ nhánh theo loại đối tác, kiểm tra trùng mã khi rời bước đầu, lưu nháp mỗi lần thay đổi:

<!-- @source features/partner/pages/create/create.component.ts -->
```ts
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
```

## Quy tắc

- MUST dùng `sd-page` với `backLink` và `width="narrow"`; nút bước (Quay lại, Tiếp tục, nút hoàn tất) ở footer, không ở header (E3).
- MUST giữ dữ liệu khi quay lại bước trước hoặc chuyển bước (E8); đổi dữ liệu nguồn thì các bước sau phải kiểm tra lại.
- MUST kiểm tra bước hiện tại trước khi sang bước sau (validation của form bước, kiểm tra với API như trùng mã); dùng `linear` + `stepControl` để người dùng không vượt bước bằng tiêu đề.
- MUST chỉ ghi dữ liệu ở bước cuối, sau khi hỏi xác nhận; trước đó chỉ đọc hoặc kiểm tra.
- SHOULD lưu nháp vào storage của tab khi quy trình dài; tải lại trang thì khôi phục và báo rõ, kèm cách bỏ nháp.
- SHOULD hiện tóm tắt ở bước Xác nhận để người dùng kiểm tra lại trước khi ghi.

## Lỗi hay gặp

- Mỗi bước là một route riêng: dữ liệu mất khi tải lại hoặc quay lại.
- Bấm tiêu đề bước sau để bỏ qua kiểm tra: dữ liệu lỗi tới bước ghi.
- Rẽ nhánh bằng cách ẩn field bằng CSS: field ẩn vẫn còn validator và chặn bước.
- Thanh bước của `mat-stepper` cuộn cùng nội dung; có màn thứ ba cần thanh bước ghim thì tách thành component riêng.

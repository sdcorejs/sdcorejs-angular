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

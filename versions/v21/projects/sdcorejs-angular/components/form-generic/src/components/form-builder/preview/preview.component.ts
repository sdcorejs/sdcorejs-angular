import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdFormRender } from '../../form-render/form-render.component';
import { documentToSchema } from '../state/builder-document';
import { FormBuilderStore } from '../state/builder-store';

interface PreviewResult {
  readonly invalidFields: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Xem trước bằng CHÍNH `<sd-form-render>` với schema của builder — nhãn, bố cục, biến, điều kiện và
 * validation khớp runtime. Dữ liệu thử nằm riêng (không bao giờ vào schema), có nút đặt lại;
 * "Kiểm tra" chạy `validate()` tại chỗ, không submit/lưu. Upload không bao giờ được gọi (`upload()`
 * chỉ chạy khi consumer chủ động gọi) nên không có side effect mạng.
 *
 * Mức bố cục: `[breakpoint]` ép đúng mức đang chọn trên thanh công cụ (Desktop | Tablet | Mobile) —
 * hàng của Xem trước vì thế trùng hàng của canvas ở cùng mức. Khung tablet 768px, mobile 390px.
 */
@Component({
  selector: 'fb-preview',
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdFormRender, SdButton, SdIcon, SdTranslatePipe],
})
export class PreviewComponent {
  readonly store = inject(FormBuilderStore);
  readonly render = viewChild(SdFormRender);

  /** Tạo lại renderer + dữ liệu thử khi đặt lại. */
  readonly session = signal(0);
  readonly viewed = signal(false);
  readonly result = signal<PreviewResult | null>(null);
  /** Dữ liệu thử của người thiết kế — renderer phát object mới, không bao giờ ghi vào schema. */
  readonly value = signal<Record<string, unknown>>({});

  /** Bản clone độc lập: renderer không thể chạm vào tài liệu của builder. */
  readonly schema = computed(() => documentToSchema(this.store.doc()));

  readonly isEmpty = computed(() => !this.schema().navigation && !this.schema().pages[0]?.elements.length);

  /** Lần "Kiểm tra" mới nhất — kết quả của lần cũ hơn (đã đặt lại/đổi dữ liệu giữa chừng) bị bỏ. */
  #request = 0;

  constructor() {
    // why: a result belongs to the test data it checked — editing that data makes it stale.
    effect(() => {
      this.value();
      untracked(() => this.#discardResult());
    });
  }

  reset(): void {
    this.value.set({});
    this.#discardResult();
    this.session.update(value => value + 1);
  }

  toggleViewed(): void {
    this.viewed.update(value => !value);
    this.#discardResult();
  }

  async validate(): Promise<void> {
    const render = this.render();
    if (!render) return;
    const request = ++this.#request;
    const { messages } = await render.validate();
    if (request !== this.#request) return;
    // why: field errors are reported on their own — a form-level error message must not hide them.
    const invalidFields = render.formGroup().invalid;
    this.result.set({ invalidFields, errors: messages.error, warnings: messages.warning });
  }

  #discardResult(): void {
    this.#request += 1;
    this.result.set(null);
  }
}

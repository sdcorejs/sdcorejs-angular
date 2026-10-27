import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import type { CategorySaveReq } from '../../services/category.model';

export type CategoryForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  active?: FormControl<boolean>;
}>;

/** Giá trị form → request lưu; danh mục cha do drawer quyết định, không sửa trong form. */
export function categorySaveReq(form: CategoryForm, parentId: string | null, code?: string): CategorySaveReq {
  const value = form.getRawValue();
  return { code: code ?? value.code ?? '', name: value.name ?? '', parentId, status: value.active === false ? 'inactive' : 'active' };
}

/** Form danh mục một nhóm, dùng chung cho drawer tạo và cập nhật. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdView, SdInput, SdSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Thông tin chung">
      <div class="d-flex flex-column gap-8 p-16">
        <sd-view label="Danh mục cha" [display]="parentName()" />
        <sd-input
          label="Mã danh mục"
          name="code"
          autoId="category-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="30"
          required />
        <sd-input
          label="Tên danh mục"
          name="name"
          autoId="category-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
        <sd-switch label="Đang dùng" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
      </div>
    </sd-section>
  `,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CategoryForm>();
  readonly seed = input.required<CategorySaveReq>();
  readonly parentName = input<string | null>(null);
  readonly editing = input(false);
  readonly errors = input<Readonly<Record<string, string>>>({});
}

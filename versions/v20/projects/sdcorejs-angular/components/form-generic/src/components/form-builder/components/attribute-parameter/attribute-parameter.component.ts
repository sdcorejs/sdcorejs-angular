import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdFormGenericParam } from '../../../../models/form-generic-field.model';
import type { SdFormGenericPageElement, SdFormGenericVariable } from '../../../../models/form-generic-schema.model';
import { BuildQueries } from '../attribute-selection/components/build-queries/build-queries.component';

/** `params` của field upload: tên tham số tự đặt, giá trị là tham chiếu field | biến | hằng số. */
@Component({
  selector: 'attribute-parameter',
  templateUrl: './attribute-parameter.component.html',
  styleUrl: './attribute-parameter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuildQueries, SdTranslatePipe],
})
export class AttributeParameter {
  readonly label = input<string>();
  readonly elements = input.required<readonly SdFormGenericPageElement[]>();
  readonly variables = input.required<readonly SdFormGenericVariable[]>();
  readonly model = input<readonly SdFormGenericParam[] | null | undefined>(undefined);
  /** Chỉ xem — không có nút mở popup chỉnh sửa. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly modelChange = output<SdFormGenericParam[]>();
}

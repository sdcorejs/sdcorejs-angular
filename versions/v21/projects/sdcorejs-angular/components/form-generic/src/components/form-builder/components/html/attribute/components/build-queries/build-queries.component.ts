import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SdFormGenericHtmlDefinition } from '../../../../../../../models/form-generic-config.model';
import type { SdFormGenericParam } from '../../../../../../../models/form-generic-field.model';
import type { SdFormGenericPageElement, SdFormGenericVariable } from '../../../../../../../models/form-generic-schema.model';
import { BuildQueries } from '../../../../attribute-selection/components/build-queries/build-queries.component';

/**
 * `query` của field html theo html definition dạng `query`: tên tham số cố định theo `definition.params`,
 * giá trị là tham chiếu field | biến | hằng số. Definition tĩnh hoặc không có tham số thì không hiện gì.
 */
@Component({
  // why: selector riêng — inspector dùng song song với build-queries của nguồn catalog.
  selector: 'build-queries-html',
  templateUrl: './build-queries.component.html',
  styleUrl: './build-queries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuildQueries],
})
export class HtmlBuildQueries {
  readonly label = input<string>();
  readonly elements = input.required<readonly SdFormGenericPageElement[]>();
  readonly variables = input.required<readonly SdFormGenericVariable[]>();
  readonly definition = input<SdFormGenericHtmlDefinition | null | undefined>(undefined);
  readonly model = input<readonly SdFormGenericParam[] | null | undefined>(undefined);
  /** Chỉ xem — không có nút mở popup chỉnh sửa. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly modelChange = output<SdFormGenericParam[]>();

  readonly params = computed(() => {
    const definition = this.definition();
    return definition?.type === 'query' ? (definition.params ?? []) : [];
  });
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBuilder } from '@sdcorejs/angular/components/query-builder';

@Component({
  selector: 'app-query-builder-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBuilder],
  template: `
    <demo-page
      title="Query Builder"
      description="Bộ dựng truy vấn dạng cây — gom các điều kiện 'trường - toán tử - giá trị' theo nhóm AND/OR lồng nhau. Phù hợp cho 'Tìm kiếm nâng cao' và trình chỉnh sửa bộ lọc lưu.">

      <demo-section heading="Bộ lọc nâng cao (mặc định 3 điều kiện + nhóm OR lồng)">
        <div class="builder-box">
          <sd-query-builder></sd-query-builder>
        </div>
      </demo-section>

      <demo-section heading="Khởi tạo với cây rule tự chuẩn bị">
        <div class="builder-box">
          <sd-query-builder [group]="customGroup"></sd-query-builder>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .builder-box {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderDemoComponent {
  readonly customGroup = {
    condition: 'AND' as const,
    rules: [
      { field: 'department', operator: 'Equal', value: 'TECH' },
      { field: 'salary', operator: 'Equal', value: '20000000' },
      {
        condition: 'OR' as const,
        rules: [
          { field: 'status', operator: 'Equal', value: 'ACTIVE' },
          { field: 'status', operator: 'Equal', value: 'PROBATION' },
        ],
      },
    ],
  };
}


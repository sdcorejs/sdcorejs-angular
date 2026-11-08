import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, SdCardGroup, type SdCardOptionData } from '@sdcorejs/angular/components/card';

type DuplicatePolicy = 'skip' | 'overwrite';
type PartnerKind = 'personal' | 'business' | 'agency';

@Component({
  selector: 'app-card-option-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-option.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardOptionExampleComponent {
  readonly policy = signal<DuplicatePolicy | DuplicatePolicy[] | null>('skip');
  readonly policies: readonly { readonly key: DuplicatePolicy; readonly data: SdCardOptionData }[] = [
    {
      key: 'skip',
      data: { icon: 'skip_next', title: 'Bỏ qua dòng trùng', description: 'Sản phẩm đã có giữ nguyên. 3 dòng trùng mã không được nhập.' },
    },
    {
      key: 'overwrite',
      data: {
        icon: 'published_with_changes',
        title: 'Ghi đè sản phẩm đã có',
        description: 'Tên, đơn vị và giá của 3 sản phẩm sẽ bị thay. Không hoàn tác được.',
        badge: { title: 'Không hoàn tác', color: 'warning' },
      },
    },
  ];
  readonly kinds = signal<PartnerKind | PartnerKind[] | null>(['personal']);
  readonly partnerKinds: readonly { readonly key: PartnerKind; readonly data: SdCardOptionData; readonly disabled?: boolean }[] = [
    { key: 'personal', data: { icon: 'person', title: 'Cá nhân', description: 'Khách lẻ, không cần mã số thuế' } },
    { key: 'business', data: { icon: 'business', title: 'Doanh nghiệp', description: 'Cần mã số thuế' }, disabled: true },
    { key: 'agency', data: { icon: 'storefront', title: 'Đại lý', description: 'Có bảng giá và hạn mức riêng' } },
  ];
}

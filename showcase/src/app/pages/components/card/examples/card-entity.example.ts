import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCard, SdCardActionsDirective, SdCardGroup, type SdCardEntityData } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-entity-example',
  standalone: true,
  imports: [SdButton, SdCard, SdCardActionsDirective, SdCardGroup],
  templateUrl: './card-entity.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEntityExampleComponent {
  readonly company: SdCardEntityData = {
    title: 'Công ty TNHH Minh Phát',
    subtitle: 'KH0012',
    avatar: { text: 'Minh Phát' },
    badge: { title: 'VIP', color: 'warning' },
    meta: [
      { label: 'Công nợ', value: '128,4 tr' },
      { label: 'Đơn', value: '48' },
      { label: 'Phụ trách', value: 'Thu Hà' },
    ],
  };
  readonly warehouse: SdCardEntityData = {
    title: 'Kho Hà Nội',
    subtitle: 'Long Biên · 1.240 mã hàng',
    avatar: { icon: 'warehouse' },
  };
  readonly customers: readonly { readonly code: string; readonly data: SdCardEntityData }[] = [
    { code: 'KH0031', data: { title: 'Trần Bảo Ngọc', subtitle: 'KH0031', avatar: { text: 'Bảo Ngọc' } } },
    { code: 'KH0047', data: { title: 'Phạm Gia Huy', subtitle: 'KH0047', avatar: { text: 'Gia Huy' } } },
    { code: 'KH0052', data: { title: 'Lê Thu Trang', subtitle: 'KH0052', avatar: { text: 'Thu Trang' } } },
  ];
  readonly picked = signal<string | string[] | null>(['KH0047']);
  readonly lastAction = signal('Chưa có tác vụ');
}

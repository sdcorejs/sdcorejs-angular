import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-crud-entity-example',
  standalone: true,
  imports: [RouterLink, SdButton],
  templateUrl: './button-crud-entity.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonCrudEntityExampleComponent {
  readonly saving = signal(false);
  readonly message = signal('');

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.saving.set(false);
    this.message.set('Đã lưu khách hàng.');
  }
}

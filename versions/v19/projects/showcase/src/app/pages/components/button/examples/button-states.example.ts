import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-states-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-states.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonStatesExampleComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly submitting = signal(false);
  #submitTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => clearTimeout(this.#submitTimer));
  }

  onSubmit(): void {
    clearTimeout(this.#submitTimer);
    this.submitting.set(true);
    this.#submitTimer = setTimeout(() => this.submitting.set(false), 1500);
  }
}

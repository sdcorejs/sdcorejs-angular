import {
  ChangeDetectionStrategy, Component, OnDestroy, TemplateRef, ViewEncapsulation,
  ViewContainerRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatCalendar } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SdDateAdapter } from '../core/date-adapter';
import { SdTimeSpinner } from '../time-spinner/time-spinner.component';

@Component({
  selector: 'sd-datetime-picker',
  standalone: true,
  imports: [CommonModule, MatCalendar, SdTimeSpinner, MatButtonModule, MatIconModule],
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sd-datetime-picker' },
})
export class SdDatetimePicker<D = Date> implements OnDestroy {
  protected readonly adapter = inject<SdDateAdapter<D>>(SdDateAdapter as never);
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);

  public readonly showSeconds = input<boolean>(false);
  public readonly stepMinute = input<number>(1);
  public readonly disabled = input<boolean>(false);
  public readonly minDate = input<D | null>(null);
  public readonly maxDate = input<D | null>(null);
  public readonly startAt = input<D | null>(null);

  public readonly applied = output<D>();
  public readonly cleared = output<void>();
  public readonly closed = output<void>();

  private readonly _selected = signal<D | null>(null);
  private readonly _opened = signal<boolean>(false);

  public readonly selected = computed(() => this._selected());
  public readonly opened = computed(() => this._opened());
  public readonly disabledEffective = computed(() => this.disabled() || this._inputDisabled());

  public readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panel');

  private overlayRef: OverlayRef | null = null;
  private anchorEl: HTMLElement | null = null;
  private readonly _inputDisabled = signal<boolean>(false);

  /** Anchor the overlay to a specific input element (set by the input directive). */
  public setAnchor(el: HTMLElement | null): void { this.anchorEl = el; }

  /** Sync disabled state from the ControlValueAccessor input directive. */
  public setInputDisabledState(isDisabled: boolean): void {
    this._inputDisabled.set(isDisabled);
    if (isDisabled) this.close();
  }

  public open(): void {
    if (this.disabledEffective() || this._opened()) return;
    const anchor = this.anchorEl ?? document.body;
    const position = this.overlay.position()
      .flexibleConnectedTo(anchor)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      .withFlexibleDimensions(false)
      .withPush(true);

    this.overlayRef = this.overlay.create(new OverlayConfig({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-backdrop',
      panelClass: 'sd-datetime-picker__overlay',
    }));
    this.overlayRef.attach(new TemplatePortal(this.panelTemplate(), this.vcr));
    // Khi click vào backdrop thì đóng picker lại
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this._opened.set(true);
  }

  public close(): void {
    if (!this._opened()) return;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this._opened.set(false);
    this.closed.emit();
  }

  public select(value: D): void { this._selected.set(value); }

  public apply(): void {
    const v = this._selected();
    if (v != null) this.applied.emit(v);
    this.close();
  }

  public clear(): void {
    this._selected.set(null);
    this.cleared.emit();
    this.close();
  }

  public now(): void {
    this._selected.set(new Date() as D);
  }

  public ngOnDestroy(): void { this.overlayRef?.dispose(); }
}

import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  HostBinding,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { Color } from '@sdcorejs/utils/models';
import { SdStep } from './step.component';

@Component({
  selector: 'sd-stepper',
  standalone: true,
  imports: [MatStepperModule, MatIconModule, NgTemplateOutlet],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdStepper {
  steps = contentChildren(SdStep);

  selectedIndex = model<number>(0);
  // why: enforce sequential gating — only valid steps unlock the next.
  linear = input(false, { transform: booleanAttribute });
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  labelPosition = input<'end' | 'bottom'>('end');
  headerPosition = input<'top' | 'bottom'>('top');
  animationDuration = input<string>('500ms');
  disableRipple = input(false, { transform: booleanAttribute });
  // Drives the Core color CSS vars on indicators / connector / line.
  color = input<Color>('primary');
  autoId = input<string | undefined>(undefined);

  // Emits {previousIndex, selectedIndex, previousStep, selectedStep}.
  selectionChange = output<StepperSelectionEvent>();

  protected matStepper = viewChild(MatStepper);

  @HostBinding('attr.data-autoId') get autoIdAttr(): string | null {
    return this.autoId() ?? null;
  }

  // Core color CSS vars — same mechanism as <sd-tab-group>.
  @HostBinding('style.--sd-stepper-active-color') get cssActive(): string {
    return `var(--sd-${this.color()})`;
  }
  @HostBinding('style.--sd-stepper-active-bg') get cssActiveBg(): string {
    return `var(--sd-${this.color()})`;
  }
  @HostBinding('style.--sd-stepper-completed-color') get cssCompleted(): string {
    return `var(--sd-${this.color()})`;
  }
  @HostBinding('style.--sd-stepper-line-active-color') get cssLine(): string {
    return `var(--sd-${this.color()})`;
  }

  constructor() {
    // why: clamp selectedIndex when a step is removed past the active one.
    effect(() => {
      const len = this.steps().length;
      const cur = untracked(() => this.selectedIndex());
      if (len > 0 && cur >= len) {
        this.selectedIndex.set(Math.max(0, len - 1));
      }
    });
  }

  next(): void {
    this.matStepper()?.next();
  }

  previous(): void {
    this.matStepper()?.previous();
  }

  reset(): void {
    this.matStepper()?.reset();
  }

  goTo(index: number): void {
    const len = this.steps().length;
    if (len === 0) {
      this.selectedIndex.set(0);
      return;
    }
    this.selectedIndex.set(Math.max(0, Math.min(index, len - 1)));
  }

  protected onSelectionChange(ev: StepperSelectionEvent): void {
    this.selectionChange.emit(ev);
    // Forward to each step that just became selected so consumer can react.
    const step = this.steps()[ev.selectedIndex];
    step?.selectChange.emit();
  }
}

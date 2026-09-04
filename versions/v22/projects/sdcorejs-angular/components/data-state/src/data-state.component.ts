import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon, SdIconSet } from '@sdcorejs/angular/modules/icon';

export type SdDataStateKind = 'loading' | 'empty' | 'error' | 'forbidden' | 'success';

export interface SdDataStateTemplateContext {
  readonly $implicit: SdDataStateKind;
  readonly state: SdDataStateKind;
  readonly retry: () => void;
  readonly action: () => void;
}

@Directive({
  selector: 'ng-template[sdDataStateTemplate]',
  standalone: true,
})
export class SdDataStateTemplateDirective {
  readonly template = inject<TemplateRef<SdDataStateTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(_directive: SdDataStateTemplateDirective, _context: unknown): _context is SdDataStateTemplateContext {
    return true;
  }
}

const DEFAULT_ICON: Readonly<Record<SdDataStateKind, string | null>> = {
  loading: 'progress_activity',
  empty: 'inbox',
  error: 'error_outline',
  forbidden: 'lock',
  success: null,
};

@Component({
  selector: 'sd-data-state',
  standalone: true,
  imports: [NgTemplateOutlet, SdTranslatePipe, SdIcon],
  templateUrl: './data-state.component.html',
  styleUrl: './data-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdDataState {
  readonly state = input<SdDataStateKind>('success');
  readonly title = input<string | null | undefined>();
  readonly message = input<string | null | undefined>();
  readonly icon = input<string | null | undefined>();
  readonly fontSet = input<SdIconSet | undefined>();
  readonly retryable = input(false, { transform: booleanAttribute });
  readonly retryLabel = input<string | null | undefined>();
  readonly actionLabel = input<string | null | undefined>();
  readonly compact = input(false, { transform: booleanAttribute });
  readonly fullPage = input(false, { transform: booleanAttribute });
  readonly sdRetry = output<void>();
  readonly sdAction = output<void>();

  protected readonly customTemplate = contentChild(SdDataStateTemplateDirective);
  protected readonly effectiveIcon = computed(() => this.icon() ?? DEFAULT_ICON[this.state()]);
  protected readonly titleKey = computed(() => `core.component.data-state.${this.state()}.title`);
  protected readonly messageKey = computed(() => `core.component.data-state.${this.state()}.message`);
  protected readonly role = computed<'alert' | 'status'>(() =>
    this.state() === 'error' || this.state() === 'forbidden' ? 'alert' : 'status'
  );

  protected readonly retry = (): void => this.sdRetry.emit();
  protected readonly action = (): void => this.sdAction.emit();
  protected readonly templateContext = computed<SdDataStateTemplateContext>(() => ({
    $implicit: this.state(),
    state: this.state(),
    retry: this.retry,
    action: this.action,
  }));
}

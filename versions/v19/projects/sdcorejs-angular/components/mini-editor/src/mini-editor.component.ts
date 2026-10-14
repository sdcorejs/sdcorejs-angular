import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  SdEditorEngine,
  SdEditorImportDiagnostic,
  SdEditorMentionItem,
  SdEditorSourceChangeReason,
  SdEditorSurface,
} from '@sdcorejs/angular/components/editor-engine';
import { SdMiniEditorOption } from './mini-editor.model';

/** Compact Core toolbar with the same document schema as SdEditor. */
@Component({
  selector: 'sd-mini-editor',
  standalone: true,
  imports: [SdEditorSurface],
  templateUrl: './mini-editor.component.html',
  styleUrl: './mini-editor.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SdMiniEditor), multi: true }],
})
export class SdMiniEditor implements ControlValueAccessor, OnChanges, OnDestroy {
  @Input({ required: true }) option!: SdMiniEditorOption;
  @Input() value = '';
  readonly disabled = input(false);
  readonly valueChange = output<string>();
  readonly contentChange = output<string>();
  readonly blur = output<FocusEvent>();
  readonly focus = output<FocusEvent>();
  readonly importWarning = output<readonly SdEditorImportDiagnostic[]>();
  readonly #diagnostics = signal<readonly SdEditorImportDiagnostic[]>([]);
  readonly importDiagnostics = this.#diagnostics.asReadonly();
  readonly surfaceContent = signal('');
  readonly #formDisabled = signal(false);
  readonly effectiveDisabled = computed(() => this.disabled() || this.#formDisabled());
  readonly #cdRef = inject(ChangeDetectorRef);
  #engine?: SdEditorEngine;
  #timer?: ReturnType<typeof setTimeout>;
  #trailing?: string;
  #deadline?: number;
  #composing = false;
  #formatPending = false;
  #destroyed = false;
  #onChange: (value: string) => void = () => {};
  #onTouched: () => void = () => {};

  @HostBinding('style.--sd-mini-editor-max-height')
  get maxEditorHeight(): string | undefined {
    return this.option?.maxHeight;
  }

  constructor() {
    effect(() => {
      if (this.effectiveDisabled()) this.onSourceChange();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) this.setContent(this.value);
  }
  onEngineReady(engine: SdEditorEngine): void {
    this.onSourceChange();
    this.#composing = false;
    this.#engine = engine;
  }
  /** Cancel a stale throttle window before replacing an authoritative source. */
  onSourceChange(reason: SdEditorSourceChangeReason = 'source'): void {
    this.#clearTimer();
    if (reason === 'format') {
      this.#formatPending = true;
      return;
    }
    this.#formatPending = false;
    this.#deadline = undefined;
    this.#trailing = undefined;
  }
  onFormatChange(value: string | undefined): void {
    if (this.#destroyed || this.effectiveDisabled()) return;
    // A refused conversion stays paused until a supported representation is
    // restored. Retain the live pending edit without exporting stale HTML.
    if (value === undefined) return;
    this.#formatPending = false;
    this.#trailing = undefined;
    if (value !== this.value) this.onSurfaceChange(value);
    if (this.#deadline !== undefined) this.#scheduleWindow();
  }
  onSurfaceChange(value: string): void {
    if (this.#destroyed || this.effectiveDisabled()) return;
    if (this.#composing || this.#formatPending) {
      this.#trailing = value;
      return;
    }
    if (this.#deadline === undefined) {
      // App callbacks can replace content synchronously; establish the window first.
      this.#startWindow();
      this.#emit(value);
    } else this.#trailing = value;
  }
  #startWindow(): void {
    this.#deadline = Date.now() + 500;
    this.#scheduleWindow();
  }
  #scheduleWindow(): void {
    if (this.#deadline === undefined || this.#composing || this.#formatPending || this.#destroyed) return;
    this.#clearTimer();
    this.#timer = setTimeout(
      () => {
        this.#timer = undefined;
        this.#deadline = undefined;
        const trailing = this.#trailing;
        this.#trailing = undefined;
        if (trailing !== undefined && !this.#destroyed && !this.#composing && !this.effectiveDisabled()) {
          this.#startWindow();
          this.#emit(trailing);
        }
      },
      Math.max(0, this.#deadline - Date.now())
    );
  }
  onCompositionChange(composing: boolean): void {
    this.#composing = composing;
    this.#clearTimer();
    if (composing || this.#formatPending || this.#destroyed || this.effectiveDisabled()) return;
    if (this.#deadline !== undefined) this.#scheduleWindow();
    else if (this.#trailing !== undefined) {
      const value = this.#trailing;
      this.#trailing = undefined;
      this.#startWindow();
      this.#emit(value);
    }
  }
  #clearTimer(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }
  #emit(value: string): void {
    this.value = value;
    this.#onChange(value);
    this.valueChange.emit(value);
    this.contentChange.emit(value);
    this.option?.onChange?.(value);
    this.#cdRef.markForCheck();
  }
  onSurfaceFocus(event: FocusEvent): void {
    this.focus.emit(event);
    this.option?.onFocus?.(event);
  }
  onSurfaceBlur(event: FocusEvent): void {
    this.#onTouched();
    this.blur.emit(event);
    this.option?.onBlur?.(event);
    this.#cdRef.markForCheck();
  }
  onDiagnostics(diagnostics: readonly SdEditorImportDiagnostic[]): void {
    this.#diagnostics.set(diagnostics);
    this.importWarning.emit(diagnostics);
  }
  onMentionSelected(item: SdEditorMentionItem): void {
    this.option?.onMentionSelect?.(item);
  }
  setContent(content: string): void {
    const value = content ?? '';
    this.value = value;
    // Consumer echoes must not replay content or reset the current selection/history.
    if (this.#isCurrentContent(value)) return;
    this.onSourceChange();
    this.surfaceContent.set(value);
    this.#engine?.setContent(value, this.option?.outputFormat ?? 'html');
    this.#cdRef.markForCheck();
  }
  #isCurrentContent(value: string): boolean {
    if (!this.#engine) return value === this.surfaceContent();
    try {
      return this.#engine.format === (this.option?.outputFormat ?? 'html') && value === this.#engine.getContent();
    } catch {
      return false;
    }
  }
  getContent(): string {
    return this.#engine?.getContent() ?? '';
  }
  getHtmlContent(): string {
    return this.#engine?.getHtml() ?? '';
  }
  focusEditor(): void {
    if (!this.effectiveDisabled()) this.#engine?.focus();
  }
  insertMention(item: { id: string; name: string; marker?: string }): void {
    if (!this.#engine || !this.option?.enableMention || this.effectiveDisabled() || this.importDiagnostics().length) return;
    const marker = item.marker ?? this.option.mentionConfig?.feeds?.[0]?.marker ?? '@';
    this.#engine.insertMention({ ...item, marker });
    this.option.onMentionSelect?.({ id: item.id, name: item.name, text: `${marker}${item.name}` });
  }
  getMentions(): { id: string; name: string; marker: string }[] {
    return this.#engine?.getMentions() ?? [];
  }
  writeValue(value: string): void {
    this.setContent(value || '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.#formDisabled.set(disabled);
    if (disabled) this.onSourceChange();
    this.#cdRef.markForCheck();
  }
  ngOnDestroy(): void {
    this.#destroyed = true;
    this.onSourceChange();
    this.#engine = undefined; // Surface owns engine destruction.
  }
}

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';
import { SdEditorEngine } from '../engine/editor-engine';
import type {
  SdEditorImportDiagnostic,
  SdEditorMentionFeed,
  SdEditorMentionItem,
  SdEditorSourceChangeReason,
} from '../engine/editor-engine.models';
import { SdEditorToolbar } from '../toolbar/editor-toolbar.component';

/** Internal composition surface. It alone owns the browser editor lifecycle. */
@Component({
  selector: 'sd-editor-surface',
  standalone: true,
  imports: [SdEditorToolbar, SdCKEditorStyles],
  templateUrl: './editor-surface.component.html',
  styleUrl: './editor-surface.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-variant]': 'variant()' },
})
export class SdEditorSurface {
  readonly content = input('');
  readonly format = input<'html' | 'markdown'>('html');
  readonly variant = input<'full' | 'compact'>('full');
  readonly editable = input(true);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly placeholder = input<string | undefined>();
  readonly mentionFeeds = input<readonly SdEditorMentionFeed[] | undefined>();
  readonly uploadEnabled = input(false);
  readonly height = input<string | undefined>();
  readonly maxHeight = input<string | undefined>();
  readonly label = input<string | undefined>();
  readonly describedBy = input<string | undefined>();
  readonly invalid = input(false);
  readonly id = input<string | undefined>();
  readonly engineReady = output<SdEditorEngine>();
  readonly change = output<string>();
  readonly focus = output<FocusEvent>();
  readonly blur = output<FocusEvent>();
  readonly diagnostics = output<readonly SdEditorImportDiagnostic[]>();
  readonly sourceChange = output<SdEditorSourceChangeReason>();
  readonly formatChange = output<string | undefined>();
  readonly compositionChange = output<boolean>();
  readonly mentionSelected = output<SdEditorMentionItem>();
  readonly filesSelected = output<File[]>();
  readonly hostElement = viewChild.required<ElementRef<HTMLElement>>('contentHost');
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly toolbar = viewChild(SdEditorToolbar);
  readonly engine = signal<SdEditorEngine | null>(null);
  readonly revision = signal(0);
  readonly sourceVersion = signal(0);
  readonly importDiagnostics = signal<readonly SdEditorImportDiagnostic[]>([]);
  readonly #i18n = inject(I18nService);
  readonly #browser = isPlatformBrowser(inject(PLATFORM_ID));
  #lastContent = '';
  #lastFormat: 'html' | 'markdown' = 'html';
  #destroyed = false;

  constructor() {
    afterNextRender(() => {
      if (!this.#browser || this.#destroyed) return;
      this.#lastContent = this.content();
      this.#lastFormat = this.format();
      const engine = new SdEditorEngine(this.hostElement().nativeElement, {
        content: this.content(),
        format: this.format(),
        editable: this.editable() && !this.disabled() && !this.readonly(),
        placeholder: this.placeholder(),
        mentionFeeds: this.mentionFeeds(),
        onChange: value => {
          if (!this.#destroyed) this.change.emit(value);
        },
        onFocus: event => {
          if (!this.#destroyed) this.focus.emit(event);
        },
        onBlur: event => {
          if (!this.#destroyed) this.blur.emit(event);
        },
        onDiagnostics: values => {
          if (!this.#destroyed) {
            this.importDiagnostics.set(values);
            this.diagnostics.emit(values);
          }
        },
        onStateChange: () => {
          if (!this.#destroyed) this.revision.update(value => value + 1);
        },
        onSourceChange: reason => {
          if (!this.#destroyed) {
            this.toolbar()?.close(false);
            this.sourceVersion.update(value => value + 1);
            this.sourceChange.emit(reason);
          }
        },
        onFormatChange: value => {
          if (!this.#destroyed) this.formatChange.emit(value);
        },
        onCompositionStateChange: composing => {
          if (!this.#destroyed) this.compositionChange.emit(composing);
        },
        onMentionSelect: item => {
          if (!this.#destroyed) this.mentionSelected.emit(item);
        },
        mentionLabel: () => this.#i18n.t('core.component.editor.mentions'),
      });
      this.engine.set(engine);
      this.engineReady.emit(engine);
    });
    effect(() => {
      const content = this.content();
      const format = this.format();
      const engine = this.engine();
      if (!engine || this.#destroyed) return;
      if (content !== this.#lastContent) {
        this.#lastContent = content;
        this.#lastFormat = format;
        engine.setContent(content, format);
      } else if (format !== this.#lastFormat) {
        this.#lastFormat = format;
        engine.setFormat(format);
      }
    });
    effect(() => {
      const editable = this.editable() && !this.disabled() && !this.readonly();
      const placeholder = this.placeholder();
      const feeds = this.mentionFeeds();
      const engine = this.engine();
      if (!engine || this.#destroyed) return;
      engine.setEditable(editable);
      engine.setPlaceholder(placeholder);
      engine.setMentionFeeds(feeds);
    });
    effect(() => {
      const engine = this.engine();
      this.revision();
      const label = this.label() || this.#i18n.t('core.component.editor.content');
      const describedBy = this.describedBy();
      const invalid = this.invalid();
      const id = this.id();
      const height = this.height();
      const maxHeight = this.maxHeight();
      const disabled = this.disabled();
      const readonly = this.readonly();
      if (!engine || this.#destroyed) return;
      const native = engine.editor.view.dom;
      native.setAttribute('role', 'textbox');
      native.setAttribute('aria-multiline', 'true');
      native.setAttribute('aria-label', label);
      native.setAttribute('aria-invalid', String(invalid));
      native.setAttribute('aria-readonly', String(readonly || (!engine.editor.isEditable && !disabled)));
      native.setAttribute('aria-disabled', String(disabled));
      native.tabIndex = disabled ? -1 : 0;
      if (describedBy) native.setAttribute('aria-describedby', describedBy);
      else native.removeAttribute('aria-describedby');
      if (id) native.id = id;
      else native.removeAttribute('id');
      native.style.minHeight = height ?? '';
      native.style.maxHeight = maxHeight ?? '';
      native.style.overflowY = 'auto';
      const preview = this.hostElement().nativeElement.querySelector<HTMLElement>('.sd-editor-import-preview');
      if (preview) {
        preview.setAttribute('role', 'region');
        preview.setAttribute('aria-label', label);
        preview.tabIndex = disabled ? -1 : 0;
        if (describedBy) preview.setAttribute('aria-describedby', describedBy);
        else preview.removeAttribute('aria-describedby');
        preview.style.minHeight = height ?? '';
        preview.style.maxHeight = maxHeight ?? '';
        preview.style.overflowY = 'auto';
        preview.style.boxSizing = 'border-box';
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      this.engine()?.destroy();
    });
  }

  preview(): string {
    return this.content();
  }
  warning(code: SdEditorImportDiagnostic['code']): string {
    return this.#i18n.t(`core.component.editor.import.${code}`);
  }
  warningCodes(): SdEditorImportDiagnostic['code'][] {
    return [...new Set(this.importDiagnostics().map(value => value.code))];
  }
  detailsLabel(): string {
    return this.#i18n.t('core.component.editor.import.details');
  }

  chooseFiles(): void {
    if (!this.#destroyed && this.uploadEnabled() && this.engine()?.editor.isEditable) this.fileInput()?.nativeElement.click();
  }

  selectedFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length && !this.#destroyed && this.uploadEnabled() && this.engine()?.editor.isEditable) this.filesSelected.emit(files);
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdFormGenericJson } from '../../../../../../models/form-generic-field.model';
import { sdParseJsonText } from '../../../../../../rules/form-generic-validation';
import { FormRenderContext } from '../../../../form-render.context';

const serialize = (value: unknown): string => (value === undefined || value === null ? '' : JSON.stringify(value));

let nextId = 0;

/**
 * JSON field. `sd-code-editor` has no form connector, so this component owns the `FormControl`: the control
 * holds the editor TEXT (validated as JSON) while the form value holds the PARSED JSON.
 */
@Component({
  selector: 'lib-json',
  templateUrl: './json.component.html',
  styleUrl: './json.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdCodeEditor, SdTranslatePipe],
})
export class JsonComponent {
  readonly field = input.required<SdFormGenericJson>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  /** Prefix of the label / message ids that the field group references. */
  readonly id = `sd-form-generic-json-${nextId++}`;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key]);
  /** Value handed to the editor. It stays identical to what the editor emitted, so typing is never reformatted. */
  readonly editorValue = signal<unknown>(null);
  readonly error = signal<'required' | 'json' | null>(null);
  // why: the validator also runs while the control is created, before the inputs are bound, so it reads
  // plain flags that the effects below keep in sync instead of the input signals.
  #skipValidation = true;
  #isRequired = false;
  #parsed: { text: string; result: ReturnType<typeof sdParseJsonText> } | undefined;
  readonly control = new FormControl<string>('', { nonNullable: true, validators: control => this.#validate(control) });
  #lastSerialized: string | undefined;

  constructor() {
    effect(onCleanup => {
      const form = this.form();
      const key = this.field().key;
      untracked(() => form.setControl(key, this.control, { emitEvent: false }));
      onCleanup(() => {
        if (form.get(key) === this.control) form.removeControl(key, { emitEvent: false });
      });
    });
    effect(() => {
      const value = this.value();
      untracked(() => {
        const serialized = serialize(value);
        if (serialized === this.#lastSerialized) return;
        this.#lastSerialized = serialized;
        this.editorValue.set(value ?? null);
        this.control.setValue(serialized, { emitEvent: false });
      });
    });
    effect(() => {
      const required = this.required();
      const viewed = this.viewed();
      untracked(() => {
        this.#isRequired = required;
        this.#skipValidation = viewed;
        this.control.updateValueAndValidity({ emitEvent: false });
      });
    });
    effect(() => {
      const disabled = this.disabled();
      untracked(() => (disabled ? this.control.disable({ emitEvent: false }) : this.control.enable({ emitEvent: false })));
    });
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe(text => this.#commit(text));
    // why: a submit marks the control touched without changing its value; the message must still appear then.
    this.control.events
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.error.set(this.control.touched ? this.#errorOf(this.control.errors) : null));
  }

  onEditorChange(next: unknown): void {
    this.editorValue.set(next);
    this.control.markAsTouched();
    this.control.setValue(typeof next === 'string' ? next : JSON.stringify(next));
  }

  #commit(text: string): void {
    const parsed = this.#parse(text);
    if (!parsed.valid) return;
    this.#lastSerialized = serialize(parsed.value);
    this.#context.patch({ [this.field().key]: parsed.value });
  }

  #validate(control: AbstractControl<string>): ValidationErrors | null {
    // why: a viewed field is not validated (see LibItemComponent).
    if (this.#skipValidation) return null;
    const text = control.value ?? '';
    if (!text.trim()) return this.#isRequired ? { required: true } : null;
    return this.#parse(text).valid ? null : { json: true };
  }

  /** The validator and the commit read the same text on every keystroke; parse it once. */
  #parse(text: string): ReturnType<typeof sdParseJsonText> {
    if (this.#parsed?.text !== text) this.#parsed = { text, result: sdParseJsonText(text) };
    return this.#parsed.result;
  }

  #errorOf(errors: ValidationErrors | null): 'required' | 'json' | null {
    if (errors?.['json']) return 'json';
    return errors?.['required'] ? 'required' : null;
  }
}

import { Component, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SdEditor, SdEditorOption, SdEditorUploadFileDetail } from '@sdcorejs/angular/components/editor';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-editor-demo-component',
  standalone: true,
  imports: [SdEditor, MatButtonModule],
  templateUrl: './sd-editor-demo.component.html',
  styleUrls: ['./sd-editor-demo.component.scss'],
})
export class SdEditorDemoComponent {
  // ---- Section 1: Basic States ----
  basicValue = '';
  disabledValue = '<p>Ná»™i dung <strong>khÃ´ng thá»ƒ sá»­a</strong> Ä‘Æ°á»£c.</p>';
  readonlyValue = '<p>Ná»™i dung <em>chá»‰ Ä‘á»c</em>, khÃ´ng thá»ƒ chá»‰nh sá»­a.</p>';

  // ---- Section 2: label Â· helperText Â· placeholder ----
  labelValue = '<p>Ná»™i dung <strong>ban Ä‘áº§u</strong> Ä‘Æ°á»£c truyá»n vÃ o.</p>';

  // ---- Section 3: Validation â€” Inline Error ----
  formValidation = new FormGroup({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_required: any = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_maxLength: any = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_inlineError: any = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v_customValidator: any = '';
  backendError: string | undefined = undefined;

  readonly customValidator: SdCustomValidator = async (value: string) => {
    await new Promise(r => setTimeout(r, 400));
    const text = (value ?? '').replace(/<[^>]*>/g, '').trim();
    return text.length < 10 ? 'Ná»™i dung pháº£i cÃ³ Ã­t nháº¥t 10 kÃ½ tá»± (async check)' : '';
  };

  validateSection() {
    this.formValidation.markAllAsTouched();
  }

  resetSection() {
    this.v_required = '';
    this.v_maxLength = '';
    this.v_inlineError = '';
    this.v_customValidator = '';
    this.backendError = undefined;
    this.formValidation.reset();
    this.formValidation.markAsUntouched();
  }

  simulateBackendError() {
    this.backendError = 'Ná»™i dung Ä‘Ã£ tá»“n táº¡i trÃªn há»‡ thá»‘ng';
  }

  clearBackendError() {
    this.backendError = undefined;
  }

  // ---- Section 4: Validation â€” Hide Inline Error ----
  formHide = new FormGroup({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_required: any = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h_maxLength: any = '';

  validateHide() {
    this.formHide.markAllAsTouched();
  }

  resetHide() {
    this.h_required = '';
    this.h_maxLength = '';
    this.formHide.reset();
    this.formHide.markAsUntouched();
  }

  // ---- Section 5: Image upload â€” immediate ----
  immediateValue = '';
  immediateOption: SdEditorOption = {
    imageConfig: {
      uploadMode: 'immediate',
      batchSize: 2,
      maxConcurrentUploads: 1,
      maxImagesPerSelection: 10,
      lazyLoad: true,
      validation: {
        maxSizeMB: 2,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxWidth: 4000,
        maxHeight: 4000,
      },
      uploadFn: async (files: File[]): Promise<SdEditorUploadFileDetail[]> => {
        // Fake batch upload: simulate a server that accepts N files at once and returns N results
        await new Promise(r => setTimeout(r, 10000));
        return files.map(f => ({
          cdn: URL.createObjectURL(f),
          idOrKey: f.name,
          name: f.name,
        }));
      },
    },
  };

  // ---- Section 6: Image upload â€” deferred ----
  readonly deferredEditor = viewChild<SdEditor>('deferredEditor');
  deferredValue = '';
  deferredOption: SdEditorOption = {
    imageConfig: {
      uploadMode: 'deferred',
      validation: {
        maxSizeMB: 2,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxWidth: 4000,
        maxHeight: 4000,
      },
      uploadFn: async (files: File[]): Promise<SdEditorUploadFileDetail[]> => {
        return Promise.all(
          files.map(async f => {
            const form = new FormData();
            form.append('file', f);
            const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form });
            const json = await res.json();
            const cdn: string = (json.data.url as string).replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            return { cdn, idOrKey: f.name, name: f.name };
          })
        );
      },
    },
  };
  deferredSubmitResult = '';
  isSubmitting = false;

  async onDeferredSubmit() {
    const editor = this.deferredEditor();
    if (!editor) return;
    this.isSubmitting = true;
    try {
      this.deferredSubmitResult = await editor.upload();
    } finally {
      this.isSubmitting = false;
    }
  }

  // ---- Section 7: Reactive Form ----
  form = new FormGroup({});

  get formJson(): string {
    return JSON.stringify(this.form.value, null, 2);
  }

  // ---- Section 8: Events ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventValue: any = '';
  eventLog: string[] = [];

  onSdChange(val: string) {
    const len = val.replace(/<[^>]*>/g, '').length;
    this.eventLog.unshift(`[change] ${len} kÃ½ tá»±`);
    if (this.eventLog.length > 6) this.eventLog.pop();
  }

  onSdFocus() {
    this.eventLog.unshift('[focus]');
    if (this.eventLog.length > 6) this.eventLog.pop();
  }

  onSdBlur() {
    this.eventLog.unshift('[blur]');
    if (this.eventLog.length > 6) this.eventLog.pop();
  }

  // ---- Section 9: Height / maxHeight ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heightValue: any = '';
}


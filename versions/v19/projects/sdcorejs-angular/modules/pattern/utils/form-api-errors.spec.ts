import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { apiErrorMessage, apiFieldErrors } from './api-error';
import { focusFirstInvalid } from './focus-first-invalid';
import { formApiErrors } from './form-api-errors';

const rejected = (errors: { field: string; message: string }[], message = 'Dữ liệu chưa hợp lệ.') =>
  new HttpErrorResponse({ status: 400, error: { message, errors } });

describe('formApiErrors', () => {
  const create = (form: FormGroup) => TestBed.runInInjectionContext(() => formApiErrors(form));

  it('keeps the errors of the fields the form has and says whether it kept one', () => {
    const form = new FormGroup({ code: new FormControl('SP-001') });
    const api = create(form);

    expect(
      api.set(
        rejected([
          { field: 'code', message: 'Mã SP-001 đã được dùng.' },
          { field: 'parentId', message: 'Danh mục chỉ có tối đa 3 cấp.' },
        ])
      )
    ).toBeTrue();
    expect(api.errors()).toEqual({ code: 'Mã SP-001 đã được dùng.' });

    // A field the form does not show is left to the message of the caller.
    expect(api.set(rejected([{ field: 'parentId', message: 'Danh mục chỉ có tối đa 3 cấp.' }]))).toBeFalse();
    expect(api.errors()).toEqual({});
  });

  it('drops the error of a field while its value differs from the rejected one', () => {
    const form = new FormGroup({ code: new FormControl('SP-001'), name: new FormControl('Sữa') });
    const api = create(form);
    api.set(rejected([{ field: 'code', message: 'Mã SP-001 đã được dùng.' }]));

    form.controls.name.setValue('Sữa tươi');
    expect(api.errors()).toEqual({ code: 'Mã SP-001 đã được dùng.' });
    form.controls.code.setValue('SP-002');
    expect(api.errors()).toEqual({});
    form.controls.code.setValue('SP-001');
    expect(api.errors()).toEqual({ code: 'Mã SP-001 đã được dùng.' });

    api.clear();
    expect(api.errors()).toEqual({});
  });

  it('shows the error of a save made without edits, when the fields wrote their values without an event', () => {
    // As <sd-*> fields do: the control joins the form, then its model is written with emitEvent: false.
    const form = new FormGroup<Record<string, FormControl<number | null>>>({});
    const api = create(form);
    const minutes = new FormControl<number | null>(null);
    form.addControl('sessionMinutes', minutes);
    minutes.setValue(3, { emitEvent: false });

    expect(api.set(rejected([{ field: 'sessionMinutes', message: 'Từ 5 đến 480 phút.' }]))).toBeTrue();
    expect(api.errors()).toEqual({ sessionMinutes: 'Từ 5 đến 480 phút.' });

    minutes.setValue(30);
    expect(api.errors()).toEqual({});
  });

  it('reads the field of a row by its path', () => {
    const row = (quantity: number) => new FormGroup({ quantity: new FormControl(quantity) });
    const form = new FormGroup({ lines: new FormArray([row(1), row(60)]) });
    const api = create(form);

    expect(api.set(rejected([{ field: 'lines.1.quantity', message: 'Vượt tồn kho (còn 50).' }]))).toBeTrue();
    expect(api.errors()).toEqual({ 'lines.1.quantity': 'Vượt tồn kho (còn 50).' });

    form.controls.lines.at(0).controls.quantity.setValue(2);
    expect(api.errors()).toEqual({ 'lines.1.quantity': 'Vượt tồn kho (còn 50).' });
    form.controls.lines.at(1).controls.quantity.setValue(50);
    expect(api.errors()).toEqual({});
  });
});

describe('apiFieldErrors', () => {
  it('keeps the first message of each field and ignores entries without a field', () => {
    const error = rejected([
      { field: 'code', message: 'Nhập mã.' },
      { field: 'code', message: 'Mã đã được dùng.' },
      { field: '', message: 'Không có field.' },
    ]);
    expect(apiFieldErrors(error)).toEqual({ code: 'Nhập mã.' });
    expect(apiFieldErrors(new Error('x'))).toEqual({});
  });
});

describe('apiErrorMessage', () => {
  it('names a request that never reached the server', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe('Không kết nối được máy chủ. Vui lòng thử lại.');
  });

  it('adds the field errors to the message of the API', () => {
    const error = rejected([{ field: 'parentId', message: 'Danh mục chỉ có tối đa 3 cấp.' }]);
    expect(apiErrorMessage(error)).toBe('Dữ liệu chưa hợp lệ. Danh mục chỉ có tối đa 3 cấp.');
  });

  it('falls back when the API sent no message', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 500 }), 'Không thể lưu.')).toBe('Không thể lưu.');
    expect(apiErrorMessage(new Error('x'))).toBe('Không thể thực hiện. Vui lòng thử lại.');
  });
});

describe('focusFirstInvalid', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => host.remove());

  it('focuses the first field in an error state, in DOM order', () => {
    host.innerHTML = `
      <input id="valid" class="ng-valid" />
      <input id="number" aria-invalid="true" />
      <textarea id="text" class="ng-invalid"></textarea>`;
    expect(focusFirstInvalid(host)).toBeTrue();
    expect(document.activeElement?.id).toBe('number');
  });

  it('reports that no field is invalid', () => {
    host.innerHTML = '<input class="ng-valid" />';
    expect(focusFirstInvalid(host)).toBeFalse();
  });
});

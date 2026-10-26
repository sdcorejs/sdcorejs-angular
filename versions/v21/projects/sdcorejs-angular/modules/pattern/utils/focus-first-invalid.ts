/**
 * Native controls of the Core form fields in an error state: Angular marks `ng-invalid` where the control is bound to
 * the field's own control; `sd-input-number` binds a display control instead and reports the error with `aria-invalid`.
 */
const INVALID_CONTROL = 'input.ng-invalid, textarea.ng-invalid, mat-select.ng-invalid, input[aria-invalid="true"]';

/**
 * Focuses the first invalid field inside `host`, in DOM order, and scrolls it into view.
 * Call it after the view rendered the validation state (for example in `afterNextRender`).
 */
export function focusFirstInvalid(host: HTMLElement): boolean {
  const field = host.querySelector<HTMLElement>(INVALID_CONTROL);
  if (!field) return false;
  field.scrollIntoView({ block: 'center' });
  field.focus();
  return true;
}

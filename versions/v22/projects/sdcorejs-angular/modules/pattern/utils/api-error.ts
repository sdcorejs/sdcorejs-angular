import { HttpErrorResponse } from '@angular/common/http';

/** Error body of the sample API: a message and, for validation errors, one entry per field. */
interface ApiErrorBody {
  readonly message?: string;
  readonly errors?: readonly { readonly field?: string; readonly message?: string }[];
}

const bodyOf = (error: unknown): ApiErrorBody | null =>
  error instanceof HttpErrorResponse && error.error && typeof error.error === 'object' ? (error.error as ApiErrorBody) : null;

/** Field errors returned by the API, keyed by field name, to show on the matching fields. */
export function apiFieldErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const item of bodyOf(error)?.errors ?? []) {
    if (item.field && item.message && !errors[item.field]) errors[item.field] = item.message;
  }
  return errors;
}

/** Message to show for a failed request, with the field errors that no field of the screen shows. */
export function apiErrorMessage(error: unknown, fallback = 'Không thể thực hiện. Vui lòng thử lại.'): string {
  if (error instanceof HttpErrorResponse && error.status === 0) return 'Không kết nối được máy chủ. Vui lòng thử lại.';
  const body = bodyOf(error);
  const details = (body?.errors ?? []).map(item => item.message).filter((message): message is string => !!message);
  return [body?.message || fallback, ...details].join(' ');
}

import { firstValueFrom, from, Observable, of } from 'rxjs';

export type SdMaybeAsync<T> = T | Promise<T> | Observable<T>;

export const SdResolveMaybeAsync = <T>(value: SdMaybeAsync<T>): Promise<T> => {
  if (value instanceof Promise) {
    return value;
  }
  if (isObservable(value)) {
    return firstValueFrom(value);
  }
  return Promise.resolve(value);
};

export const SdNormalizeAsync = <T>(value: SdMaybeAsync<T>): Observable<T> => {
  if (isObservable(value)) {
    return value; // Nếu là Observable, giữ nguyên
  }
  if (value instanceof Promise) {
    return from(value); // Nếu là Promise, chuyển sang Observable
  }
  return of(value); // Nếu là giá trị thuần (Object, string...), bọc lại bằng of
};

function isObservable(obj: any): obj is Observable<any> {
  return obj && typeof obj.subscribe === 'function';
}
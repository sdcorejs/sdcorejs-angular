import { ActivatedRoute, Data, ParamMap, Params, UrlSegment, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

const shallowEqual = (a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]);
};

const sameSegments = (a: UrlSegment[], b: UrlSegment[]): boolean =>
  a === b ||
  (a.length === b.length &&
    a.every((segment, index) => segment.path === b[index].path && shallowEqual(segment.parameters, b[index].parameters)));

/**
 * `ActivatedRoute` "sống" của một tab: proxy (vẫn `instanceof ActivatedRoute`) luôn trỏ route mới nhất của path tab đó.
 *
 * why: tab-router giữ component sống khi người dùng sang tab khác. Quay lại tab, Angular tạo `ActivatedRoute` MỚI cho
 * path đó; subscription mà component đã đăng ký trên route cũ không bao giờ phát nữa, nên component không biết query
 * đã đổi. Proxy chuyển nguồn sang route mới (`setTarget`) và không phát lại giá trị trùng.
 */
export class SdTabActivatedRouteRef {
  readonly #target: BehaviorSubject<ActivatedRoute>;
  readonly route: ActivatedRoute;

  constructor(initial: ActivatedRoute) {
    this.#target = new BehaviorSubject(initial);
    const follow = <T>(pick: (route: ActivatedRoute) => Observable<T>, equal: (a: T, b: T) => boolean): Observable<T> =>
      this.#target.pipe(switchMap(pick), distinctUntilChanged(equal));

    const params = follow<Params>(route => route.params, shallowEqual);
    const queryParams = follow<Params>(route => route.queryParams, shallowEqual);
    const overrides: Record<PropertyKey, unknown> = {
      params,
      queryParams,
      fragment: follow<string | null>(
        route => route.fragment,
        (a, b) => a === b
      ),
      data: follow<Data>(route => route.data, shallowEqual),
      url: follow<UrlSegment[]>(route => route.url, sameSegments),
      title: follow<string | undefined>(
        route => route.title,
        (a, b) => a === b
      ),
      paramMap: params.pipe(map((value): ParamMap => convertToParamMap(value))),
      queryParamMap: queryParams.pipe(map((value): ParamMap => convertToParamMap(value))),
    };

    const current = () => this.#target.getValue();
    this.route = new Proxy(Object.create(ActivatedRoute.prototype) as ActivatedRoute, {
      get: (_, property) => {
        if (Object.prototype.hasOwnProperty.call(overrides, property)) return overrides[property];
        const target = current();
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (_, property, value) => Reflect.set(current(), property, value),
      has: (_, property) => Object.prototype.hasOwnProperty.call(overrides, property) || property in current(),
      getPrototypeOf: () => ActivatedRoute.prototype,
    });
  }

  /** Route Angular mà proxy đang theo. */
  get target(): ActivatedRoute {
    return this.#target.getValue();
  }

  /** Chuyển proxy sang route mới của cùng path (tab được mở lại / điều hướng tới). */
  setTarget(route: ActivatedRoute): void {
    if (route !== this.#target.getValue()) this.#target.next(route);
  }
}

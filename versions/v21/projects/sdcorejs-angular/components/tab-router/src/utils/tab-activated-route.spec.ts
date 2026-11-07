import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { SdTabActivatedRouteRef } from './tab-activated-route';

interface FakeRoute {
  route: ActivatedRoute;
  queryParams: BehaviorSubject<Params>;
  params: BehaviorSubject<Params>;
  fragment: BehaviorSubject<string | null>;
}

const fakeRoute = (queryParams: Params, extra: Record<string, unknown> = {}): FakeRoute => {
  const query = new BehaviorSubject<Params>(queryParams);
  const params = new BehaviorSubject<Params>({ id: '1' });
  const fragment = new BehaviorSubject<string | null>(null);
  const route = {
    queryParams: query.asObservable(),
    params: params.asObservable(),
    fragment: fragment.asObservable(),
    data: new BehaviorSubject({ title: 'A' }).asObservable(),
    url: new BehaviorSubject([]).asObservable(),
    title: new BehaviorSubject(undefined).asObservable(),
    snapshot: { marker: queryParams },
    outlet: 'primary',
    toString: function () {
      return `route(${JSON.stringify(queryParams)})`;
    },
    ...extra,
  } as unknown as ActivatedRoute;
  return { route, queryParams: query, params, fragment };
};

describe('SdTabActivatedRouteRef', () => {
  it('is an ActivatedRoute that delegates plain members to the current target', () => {
    const first = fakeRoute({ x: '1' });
    const ref = new SdTabActivatedRouteRef(first.route);

    expect(ref.route instanceof ActivatedRoute).toBeTrue();
    expect(ref.route.snapshot).toBe(first.route.snapshot);
    expect(ref.route.outlet).toBe('primary');
    expect(ref.route.toString()).toBe('route({"x":"1"})');

    const second = fakeRoute({ x: '2' });
    ref.setTarget(second.route);
    expect(ref.target).toBe(second.route);
    expect(ref.route.snapshot).toBe(second.route.snapshot);
  });

  it('keeps the same observable instances across target switches', () => {
    const ref = new SdTabActivatedRouteRef(fakeRoute({}).route);
    const queryParams = ref.route.queryParams;
    const queryParamMap = ref.route.queryParamMap;
    ref.setTarget(fakeRoute({ x: '1' }).route);
    expect(ref.route.queryParams).toBe(queryParams);
    expect(ref.route.queryParamMap).toBe(queryParamMap);
  });

  it('emits query params of the current target, switches to the new target and skips equal values', () => {
    const first = fakeRoute({ x: '1' });
    const ref = new SdTabActivatedRouteRef(first.route);
    const received: (string | null)[] = [];
    const subscription = ref.route.queryParamMap.subscribe(map => received.push(map.get('x')));

    first.queryParams.next({ x: '2' });
    const same = fakeRoute({ x: '2' });
    ref.setTarget(same.route); // same value: no emission
    const next = fakeRoute({ x: '3' });
    ref.setTarget(next.route);
    first.queryParams.next({ x: 'stale' }); // old target no longer drives the stream
    next.queryParams.next({ x: '4' });

    expect(received).toEqual(['1', '2', '3', '4']);
    subscription.unsubscribe();
  });

  it('follows params, paramMap and fragment the same way', () => {
    const first = fakeRoute({});
    const ref = new SdTabActivatedRouteRef(first.route);
    const fragments: (string | null)[] = [];
    const ids: (string | null)[] = [];
    const subscriptions = [
      ref.route.fragment.subscribe(value => fragments.push(value)),
      ref.route.paramMap.subscribe(map => ids.push(map.get('id'))),
    ];

    const second = fakeRoute({});
    second.fragment.next('h');
    second.params.next({ id: '2' });
    ref.setTarget(second.route);

    expect(fragments).toEqual([null, 'h']);
    expect(ids).toEqual(['1', '2']);
    subscriptions.forEach(subscription => subscription.unsubscribe());
  });

  it('ignores a switch to the route it already follows', () => {
    const first = fakeRoute({ x: '1' });
    const ref = new SdTabActivatedRouteRef(first.route);
    const received: unknown[] = [];
    const subscription = ref.route.queryParams.subscribe(value => received.push(value));
    ref.setTarget(first.route);
    expect(received.length).toBe(1);
    subscription.unsubscribe();
  });
});

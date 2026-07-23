import { Observable } from 'rxjs';
import {
  ISdCacheConfiguration,
  SdCache,
  SdCacheOption,
  SdCacheStoredValue,
  SdCacheWithDefault,
  adaptLegacySdCacheCallbacks,
} from './cache.model';

interface UserValue {
  name: string;
}

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Expect<Value extends true> = Value;
interface NarrowConfiguration {
  set: (key: string, value: SdCacheStoredValue<UserValue>, option?: SdCacheOption<UserValue>) => void;
}

describe('cache public types', () => {
  it('models optional and with-default reads without generic absence lies', () => {
    const optionalProof: Expect<Equal<ReturnType<SdCache<string>['get']>, string | undefined>> = true;
    const defaultProof: Expect<Equal<ReturnType<SdCacheWithDefault<string>['get']>, string>> = true;
    const observerProof: Expect<Equal<SdCacheWithDefault<string>['observer'], Observable<string>>> = true;
    const rejectsNarrowGlobalCallback: Expect<Equal<NarrowConfiguration extends ISdCacheConfiguration ? true : false, false>> = true;
    expect(optionalProof && defaultProof && observerProof && rejectsNarrowGlobalCallback).toBeTrue();
  });

  it('adapts a guarded legacy narrow callback and rejects matched type mismatches', () => {
    const seen: string[] = [];
    const adapted = adaptLegacySdCacheCallbacks<UserValue>({
      matches: key => key.startsWith('user:'),
      isValue: (value): value is UserValue => typeof value === 'object' && value !== null && typeof Reflect.get(value, 'name') === 'string',
      set: (_key, entry) => {
        seen.push(entry.data.name);
      },
    });

    adapted.set?.('other:key', { data: 1, createdOn: new Date() });
    expect(seen).toEqual([]);
    expect(() => adapted.set?.('user:1', { data: 1, createdOn: new Date() })).toThrowError(TypeError);
    adapted.set?.('user:1', { data: { name: 'Ada' }, createdOn: new Date() });
    expect(seen).toEqual(['Ada']);
  });
});

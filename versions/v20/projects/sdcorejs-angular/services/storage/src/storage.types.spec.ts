import { BehaviorSubject, Observable } from 'rxjs';
import { SdStorage, SdStorageWithDefault } from './storage.model';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Expect<Value extends true> = Value;

describe('storage public types', () => {
  it('models optional and with-default reads with a non-optional default subject', () => {
    const optionalProof: Expect<Equal<ReturnType<SdStorage<string>['get']>, string | undefined>> = true;
    const defaultProof: Expect<Equal<ReturnType<SdStorageWithDefault<string>['get']>, string>> = true;
    const observerProof: Expect<Equal<SdStorageWithDefault<string>['observer'], Observable<string>>> = true;
    const subjectProof: Expect<Equal<SdStorageWithDefault<string>['subject'], BehaviorSubject<string>>> = true;
    expect(optionalProof && defaultProof && observerProof && subjectProof).toBeTrue();
  });
});

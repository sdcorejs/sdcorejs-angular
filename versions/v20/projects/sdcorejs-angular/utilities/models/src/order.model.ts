import { SdNestedKeyOf } from "./nested-key-of.model";

export interface SdOrder<T = any> {
  field: SdNestedKeyOf<T>;
  direction: 'ASC' | 'DESC';
}
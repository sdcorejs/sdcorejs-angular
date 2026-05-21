import { SdFormGenericComponent, SdFormGenericHtml } from './form-generic-component.model';

export interface SdFormGenericTemplate {
  value: string;
  display: string;
  // Html không dùng mẫu mà sẽ dùng definition
  component: Exclude<SdFormGenericComponent, SdFormGenericHtml>;
}

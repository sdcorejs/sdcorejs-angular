import type { SdFormGenericValidator } from '../models/form-generic-config.model';
import type { SdFormGenericValidation } from '../models/form-generic-schema.model';
import { sdEvaluateFilter, sdFormScope, sdIsEmptyFilter, type SdFormGenericFieldTypes } from './form-generic-filter';

export interface SdFormGenericValidationMessages {
  error: string[];
  warning: string[];
}

/** Kết quả `validate()`: luôn có hai danh sách; chỉ lỗi `error` làm `valid = false`. */
export interface SdFormGenericValidationResult {
  valid: boolean;
  messages: SdFormGenericValidationMessages;
}

export interface SdFormGenericValidationContext {
  value: Readonly<Record<string, unknown>>;
  variables: Readonly<Record<string, unknown>>;
  fieldTypes?: SdFormGenericFieldTypes;
  validators?: readonly SdFormGenericValidator[];
  /** Message khi validator chưa được đăng ký (fail-closed). */
  unregisteredMessage?: (validatorId: string) => string;
  /** Message khi validator ném lỗi. */
  failedMessage?: (validatorId: string) => string;
}

const defaultUnregistered = (id: string) => `Validator "${id}" is not registered.`;
const defaultFailed = (id: string) => `Validator "${id}" failed.`;

/** Chạy validation cấp form theo thứ tự khai báo. */
export const sdRunFormValidations = async (
  validations: readonly SdFormGenericValidation[] | null | undefined,
  context: SdFormGenericValidationContext
): Promise<SdFormGenericValidationResult> => {
  const messages: SdFormGenericValidationMessages = { error: [], warning: [] };
  const scope = sdFormScope(context.value, context.variables);
  for (const validation of validations ?? []) {
    if (!validation) continue;
    // why: fail closed — an alert level this version does not know is reported as an error, never dropped.
    const alert: keyof SdFormGenericValidationMessages = validation.alert === 'warning' ? 'warning' : 'error';
    if (validation.type === 'filter') {
      // why: a validation whose filter has no condition never fires (it would always report its message).
      if (!sdIsEmptyFilter(validation.filter) && sdEvaluateFilter(validation.filter, scope, context.fieldTypes))
        messages[alert].push(validation.message);
      continue;
    }
    const validator = context.validators?.find(candidate => candidate.id === validation.validator);
    if (!validator) {
      // why: a portal that forgot to register a validator must not let unchecked data through.
      messages.error.push((context.unregisteredMessage ?? defaultUnregistered)(validation.validator));
      continue;
    }
    try {
      const message = await validator.validate(context.value);
      if (message) messages[alert].push(message);
    } catch {
      messages.error.push((context.failedMessage ?? defaultFailed)(validation.validator));
    }
  }
  return { valid: messages.error.length === 0, messages };
};

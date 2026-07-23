export type SdInputMaskStatus = 'empty' | 'incomplete' | 'valid' | 'invalid';

export type SdInputMaskInputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';

export interface SdInputMaskResult {
  readonly raw: string;
  readonly display: string;
  readonly status: SdInputMaskStatus;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

export interface SdInputMaskAdapter {
  readonly inputMode?: SdInputMaskInputMode;
  readonly maxDisplayLength?: number;
  format(raw: string | null | undefined): SdInputMaskResult;
  parse(display: string, selectionStart?: number | null, selectionEnd?: number | null): SdInputMaskResult;
}

export interface SdInputMaskToken {
  readonly pattern: RegExp;
  readonly optional?: boolean;
  readonly transform?: (value: string) => string;
}

export interface SdCreateInputMaskOptions {
  readonly tokens?: Readonly<Record<string, SdInputMaskToken>>;
  readonly inputMode?: SdInputMaskInputMode;
}

interface MaskSlot {
  readonly unitIndex: number;
  readonly slotIndex: number;
  readonly token: SdInputMaskToken;
}

interface MaskLiteral {
  readonly unitIndex: number;
  readonly value: string;
}

interface AssignedSlot {
  readonly slotIndex: number;
  readonly unitIndex: number;
  readonly value: string;
  readonly sourceIndex: number;
}

const DEFAULT_TOKENS: Readonly<Record<string, SdInputMaskToken>> = {
  '#': { pattern: /[0-9]/ },
  '9': { pattern: /[0-9]/, optional: true },
  A: { pattern: /[A-Za-z]/ },
  a: { pattern: /[A-Za-z]/, optional: true },
  '*': { pattern: /[A-Za-z0-9]/ },
  '?': { pattern: /[A-Za-z0-9]/, optional: true },
};

function tokenAccepts(token: SdInputMaskToken, value: string): boolean {
  token.pattern.lastIndex = 0;
  const accepted = token.pattern.test(value);
  token.pattern.lastIndex = 0;
  return accepted;
}

/**
 * Creates a dependency-free slot mask.
 *
 * Default tokens: `#` required digit, `9` optional digit, `A`/`a` required/optional
 * letter, and `*`/`?` required/optional alphanumeric. Every other character is a
 * display literal and never leaks into the raw model.
 */
export function sdCreateInputMask(pattern: string, options: SdCreateInputMaskOptions = {}): SdInputMaskAdapter {
  if (!pattern) throw new Error('Input mask pattern must not be empty.');

  const tokens = { ...DEFAULT_TOKENS, ...options.tokens };
  const slots: MaskSlot[] = [];
  const literals: MaskLiteral[] = [];
  const units = Array.from(pattern, (value, unitIndex) => {
    const token = tokens[value];
    if (token) {
      const slot = { unitIndex, slotIndex: slots.length, token } satisfies MaskSlot;
      slots.push(slot);
      return slot;
    }
    const literal = { unitIndex, value } satisfies MaskLiteral;
    literals.push(literal);
    return literal;
  });
  if (slots.length === 0) throw new Error('Input mask pattern must contain at least one token.');

  const literalValues = new Set(literals.map(item => item.value));

  const convert = (
    source: string,
    sourceSelectionStart: number,
    sourceSelectionEnd: number,
    sourceIsDisplay: boolean
  ): SdInputMaskResult => {
    const assigned: AssignedSlot[] = [];
    let unitCursor = 0;
    let invalid = false;

    for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex += 1) {
      const value = source[sourceIndex];
      let consumed = false;

      // why: literals are consumed at the pattern cursor, not filtered globally;
      // a global filter would corrupt raw digits in masks with prefixes such as `+84`.
      while (unitCursor < units.length) {
        const unit = units[unitCursor];

        if ('value' in unit) {
          unitCursor += 1;
          if (sourceIsDisplay && value === unit.value) {
            consumed = true;
            break;
          }
          continue;
        }

        if (tokenAccepts(unit.token, value)) {
          assigned.push({
            slotIndex: unit.slotIndex,
            unitIndex: unit.unitIndex,
            value: unit.token.transform?.(value) ?? value,
            sourceIndex,
          });
          unitCursor += 1;
          consumed = true;
          break;
        }

        if (sourceIsDisplay && literalValues.has(value)) {
          consumed = true;
          break;
        }

        if (unit.token.optional) {
          unitCursor += 1;
          continue;
        }

        invalid = true;
        consumed = true;
        break;
      }

      if (!consumed) invalid = true;
    }

    const assignedByUnit = new Map(assigned.map(item => [item.unitIndex, item] as const));
    const lastFilledUnit = assigned.at(-1)?.unitIndex ?? -1;
    let display = '';
    let acceptedCount = 0;
    const displayPositionByAcceptedCount = new Map<number, number>([[0, 0]]);

    for (const unit of units) {
      if ('token' in unit) {
        const item = assignedByUnit.get(unit.unitIndex);
        if (!item) continue;
        display += item.value;
        acceptedCount += 1;
        displayPositionByAcceptedCount.set(acceptedCount, display.length);
      } else if (unit.unitIndex < lastFilledUnit) {
        display += unit.value;
      }
    }

    const raw = assigned.map(item => item.value).join('');
    const hasEveryRequiredSlot = slots.every((slot, index) => slot.token.optional || assigned.some(item => item.slotIndex === index));
    const status: SdInputMaskStatus = invalid ? 'invalid' : raw.length === 0 ? 'empty' : hasEveryRequiredSlot ? 'valid' : 'incomplete';

    const acceptedBefore = (position: number): number => assigned.filter(item => item.sourceIndex < Math.max(0, position)).length;
    const mapSelection = (position: number): number => {
      const count = acceptedBefore(position);
      return displayPositionByAcceptedCount.get(count) ?? display.length;
    };

    return {
      raw,
      display,
      status,
      selectionStart: mapSelection(sourceSelectionStart),
      selectionEnd: mapSelection(sourceSelectionEnd),
    };
  };

  return {
    inputMode: options.inputMode ?? (slots.every(slot => tokenAccepts(slot.token, '0')) ? 'numeric' : 'text'),
    maxDisplayLength: pattern.length,
    format: raw => {
      const source = raw == null ? '' : String(raw);
      return convert(source, source.length, source.length, false);
    },
    parse: (display, selectionStart = display.length, selectionEnd = selectionStart) =>
      convert(display, selectionStart ?? display.length, selectionEnd ?? selectionStart ?? display.length, true),
  };
}

/** Common business masks. Models remain raw strings; separators are display-only. */
export const SD_INPUT_MASKS = {
  VN_PHONE: sdCreateInputMask('#### ### ###', { inputMode: 'tel' }),
  VN_ID: sdCreateInputMask('#### #### ####', { inputMode: 'numeric' }),
  VN_TAX_CODE: sdCreateInputMask('##########-999', { inputMode: 'numeric' }),
  BANK_ACCOUNT: sdCreateInputMask('######99999999999999', { inputMode: 'numeric' }),
  BUSINESS_CODE: sdCreateInputMask('****-????????????', { inputMode: 'text' }),
} as const satisfies Readonly<Record<string, SdInputMaskAdapter>>;

export type SdInputMaskPreset = keyof typeof SD_INPUT_MASKS;
export type SdInputMask = SdInputMaskAdapter | SdInputMaskPreset;

export function sdResolveInputMask(mask: SdInputMask | null | undefined): SdInputMaskAdapter | undefined {
  if (!mask) return undefined;
  return typeof mask === 'string' ? SD_INPUT_MASKS[mask] : mask;
}

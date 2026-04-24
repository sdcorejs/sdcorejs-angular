/* eslint-disable @typescript-eslint/no-explicit-any */
// export {};

// declare global {
//   interface NumberConstructor {
//     toVNCurrency(value: any): string | null;
//     toISO(value: any): string | null;
//     isNumber(value: any): boolean;
//     isPositiveInteger(value: any): boolean;
//     isPositiveNumber(value: any): boolean;
//     round(value: any, digits?: number): number | null;
//   }
// }

const toVNCurrency = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) {
    return null;
  }
  const val = +value;
  if (!Number.isNaN(val)) {
    return val.toLocaleString('vi-VN', { maximumFractionDigits: 10 });
  }
  return null;
};

const toVN = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) {
    return null;
  }
  const val = +value;
  if (!Number.isNaN(val)) {
    return val.toLocaleString('vi-VN', { maximumFractionDigits: 10 });
  }
  return null;
};

const toISO = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) {
    return null;
  }
  const val = +value;
  if (!Number.isNaN(val)) {
    return val.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }
  return null;
};

const isPositiveInteger = (value: any) => {
  if (!value) {
    return false;
  }
  const regex = /^([0-9]*)$/;
  return regex.test(value) && +value > 0;
};

const isPositiveNumber = (value: any) => {
  if (!value) {
    return false;
  }
  const regex = /^([0-9]*)(\.[0-9]+$){0,1}$/;
  return regex.test(value) && +value > 0;
};

const isNumber = (value: any) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  return !Number.isNaN(+value);
};

const round = (value: any, digits?: number): number | null => {
  digits = digits ?? 2;
  if (!NumberUtilities.isNumber(value)) {
    return null;
  }
  const val = Math.pow(10, digits);
  return Math.round(value * val) / val;
};

const NumberUtilities = {
  toVNCurrency,
  toVN,
  toISO,
  isPositiveInteger,
  isPositiveNumber,
  isNumber,
  round,
};

export { NumberUtilities };

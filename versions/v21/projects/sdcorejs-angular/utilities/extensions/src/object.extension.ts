type PlainObject = Record<PropertyKey, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const clone = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => clone(item)) as T;
  }
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((result, key) => {
      result[key] = clone(value[key]);
      return result;
    }, {} as PlainObject) as T;
  }
  return value;
};

const merge = <T extends PlainObject, U extends PlainObject>(target: T, source: U): T & U => {
  const result = clone(target) as PlainObject;
  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    if (sourceValue === undefined) return;

    const targetValue = result[key];
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = merge(targetValue, sourceValue);
    } else {
      result[key] = clone(sourceValue);
    }
  });
  return result as T & U;
};

const deepMerge = <T extends PlainObject>(...sources: T[]): T =>
  sources.reduce((result, source) => merge(result, source), {} as PlainObject) as T;

export const ObjectUtilities = {
  isPlainObject,
  clone,
  merge,
  deepMerge,
};

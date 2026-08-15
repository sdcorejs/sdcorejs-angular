import {
  SD_TEMPORAL_VALUE_TRANSFORMS,
  sdIsTemporalValueTransform,
  sdLocalStartOfDay,
  sdParseTransformedTemporal,
  sdSerializeTemporalValue,
} from './sd-temporal-transform';

describe('sdSerializeTemporalValue', () => {
  const instant = new Date(2026, 7, 15, 10, 20, 30, 456);

  it('serializes with the native ISO representation', () => {
    expect(sdSerializeTemporalValue(instant, 'ISOString')).toBe(instant.toISOString());
  });

  it('serializes with the native UTC representation', () => {
    expect(sdSerializeTemporalValue(instant, 'UTCString')).toBe(instant.toUTCString());
  });

  // why: `null` là tín hiệu "giữ nguyên biểu diễn cũ" cho ba component — nhờ vậy không có transform
  // thì không nhánh nào phải kiểm tra riêng.
  it('returns null when no transform is active', () => {
    expect(sdSerializeTemporalValue(instant, undefined)).toBeNull();
    expect(sdSerializeTemporalValue(instant, null)).toBeNull();
  });

  // why: gọi `toISOString()` trên Invalid Date sẽ THROW, còn `toUTCString()` cho ra chuỗi
  // "Invalid Date" — cả hai đều không được phép chạm tới model.
  it('never hands an unusable value to a serializer', () => {
    expect(sdSerializeTemporalValue(null, 'ISOString')).toBeNull();
    expect(sdSerializeTemporalValue(undefined, 'ISOString')).toBeNull();
    expect(sdSerializeTemporalValue(new Date('nonsense'), 'ISOString')).toBeNull();
    expect(sdSerializeTemporalValue(new Date('nonsense'), 'UTCString')).toBeNull();
  });

  it('exposes exactly the two supported strategies', () => {
    expect([...SD_TEMPORAL_VALUE_TRANSFORMS].sort()).toEqual(['ISOString', 'UTCString']);
    expect(sdIsTemporalValueTransform('ISOString')).toBeTrue();
    expect(sdIsTemporalValueTransform('GMTString')).toBeFalse();
    expect(sdIsTemporalValueTransform(undefined)).toBeFalse();
  });
});

describe('sdLocalStartOfDay', () => {
  it('keeps the local calendar day and zeroes the time', () => {
    const result = sdLocalStartOfDay(new Date(2026, 7, 15, 23, 45, 12, 999));

    expect([result.getFullYear(), result.getMonth(), result.getDate()]).toEqual([2026, 7, 15]);
    expect([result.getHours(), result.getMinutes(), result.getSeconds(), result.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });
});

describe('sdParseTransformedTemporal', () => {
  it('round-trips its own ISO output', () => {
    const instant = new Date(2026, 7, 15, 10, 20, 30, 456);

    expect(sdParseTransformedTemporal(instant.toISOString())?.getTime()).toBe(instant.getTime());
  });

  // why: `DateUtilities.isDate` của utils từ chối shape này, nên nếu không parse ở đây thì
  // `transform="UTCString"` không đọc lại được chính output của mình.
  it('round-trips its own UTC output to the second', () => {
    const instant = new Date(2026, 7, 15, 10, 20, 30, 0);

    expect(sdParseTransformedTemporal(instant.toUTCString())?.getTime()).toBe(instant.getTime());
  });

  it('reads an explicit offset as the instant it denotes', () => {
    expect(sdParseTransformedTemporal('2026-08-15T14:30:00+02:00')?.toISOString()).toBe('2026-08-15T12:30:00.000Z');
  });

  // why: `new Date('2026-08-15')` được JS hiểu là nửa đêm UTC — ở múi giờ âm nó lùi sang 14/08 và
  // ngày trên lịch của người dùng đổi chỉ vì render. Date-only phải được đọc theo local.
  it('reads a date-only string on the local calendar day', () => {
    const result = sdParseTransformedTemporal('2026-08-15')!;

    expect([result.getFullYear(), result.getMonth(), result.getDate()]).toEqual([2026, 7, 15]);
    expect(result.getHours()).toBe(0);
  });

  it('rejects anything that is not one of the supported shapes', () => {
    for (const value of ['khong-phai-ngay', '15/08/2026', '2026/08/15', '', '   ', 42, null, undefined, new Date()]) {
      expect(sdParseTransformedTemporal(value)).withContext(String(value)).toBeNull();
    }
  });

  it('rejects a well-shaped but impossible date', () => {
    expect(sdParseTransformedTemporal('2026-13-45T00:00:00Z')).toBeNull();
  });
});

import { SdAuditDiffOptions, sdBuildAuditDiff } from './audit-diff.engine';

describe('sdBuildAuditDiff', () => {
  it('normalizes nested added, removed, changed and unchanged leaf rows', () => {
    const rows = sdBuildAuditDiff(
      {
        profile: { name: 'Ada', phone: '0901' },
        legacy: true,
        same: 7,
      },
      {
        profile: { name: 'Grace', email: 'grace@example.com' },
        same: 7,
      },
      { includeUnchanged: true }
    );

    expect(rows.map(row => [row.path, row.kind])).toEqual([
      ['legacy', 'removed'],
      ['profile.email', 'added'],
      ['profile.name', 'changed'],
      ['profile.phone', 'removed'],
      ['same', 'unchanged'],
    ]);
    expect(rows.find(row => row.path === 'profile.name')).toEqual(
      jasmine.objectContaining({ before: 'Ada', after: 'Grace', configPath: 'profile.name' })
    );
  });

  it('matches stable-key arrays without producing reorder noise', () => {
    const rows = sdBuildAuditDiff(
      {
        lines: [
          { id: 'b', quantity: 2 },
          { id: 'a', quantity: 1 },
        ],
      },
      {
        lines: [
          { id: 'a', quantity: 3 },
          { id: 'c', quantity: 4 },
        ],
      },
      {
        fields: [
          { path: 'lines', arrayKey: 'id' },
          { path: 'lines[].quantity', label: 'Quantity' },
        ],
      }
    );

    expect(rows.map(row => [row.path, row.configPath, row.kind])).toEqual([
      ['lines[id=string%3Aa].quantity', 'lines[].quantity', 'changed'],
      ['lines[id=string%3Ab].id', 'lines[].id', 'removed'],
      ['lines[id=string%3Ab].quantity', 'lines[].quantity', 'removed'],
      ['lines[id=string%3Ac].id', 'lines[].id', 'added'],
      ['lines[id=string%3Ac].quantity', 'lines[].quantity', 'added'],
    ]);
    expect(rows[0].label).toBe('Quantity');
    expect(rows[0].before).toBe(1);
    expect(rows[0].after).toBe(3);
  });

  it('keeps paths and row ids unique when stable keys stringify to the same value', () => {
    const rows = sdBuildAuditDiff(
      {
        lines: [
          { id: 1, value: 'number-before' },
          { id: '1', value: 'string-before' },
        ],
      },
      {
        lines: [
          { id: '1', value: 'string-after' },
          { id: 1, value: 'number-after' },
        ],
      },
      { fields: [{ path: 'lines', arrayKey: 'id' }] }
    );

    expect(rows.map(row => row.path)).toEqual(['lines[id=number%3A1].value', 'lines[id=string%3A1].value']);
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
  });

  it('applies enum mapping and side-aware formatters outside the template', () => {
    const options: SdAuditDiffOptions = {
      fields: [
        { path: 'status', enumMap: { draft: 'Draft', active: 'Active' } },
        {
          path: 'amount',
          format: (value, context) => `${context.side}:${Number(value).toFixed(2)} VND`,
        },
      ],
    };

    const rows = sdBuildAuditDiff({ status: 'draft', amount: 12.5 }, { status: 'active', amount: 20 }, options);

    expect(rows.find(row => row.path === 'status')).toEqual(jasmine.objectContaining({ before: 'Draft', after: 'Active' }));
    expect(rows.find(row => row.path === 'amount')).toEqual(
      jasmine.objectContaining({ before: 'before:12.50 VND', after: 'after:20.00 VND' })
    );
  });

  it('orders configured fields first by explicit order and then uses stable lexical paths', () => {
    const rows = sdBuildAuditDiff(
      { zeta: 1, title: 'Old', status: 0, alpha: 1 },
      { zeta: 2, title: 'New', status: 1, alpha: 2 },
      {
        fields: [
          { path: 'title', order: 20 },
          { path: 'status', order: 10 },
        ],
      }
    );

    expect(rows.map(row => row.path)).toEqual(['status', 'title', 'alpha', 'zeta']);
  });

  it('omits hidden paths and redacts values before they reach normalized rows', () => {
    const rows = sdBuildAuditDiff(
      { password: 'old-secret', token: 'old-token', profile: { name: 'Ada' } },
      { password: 'new-secret', token: 'new-token', profile: { name: 'Grace' } },
      {
        redactedValue: '[redacted]',
        fields: [
          { path: 'password', hidden: true },
          { path: 'token', redacted: true, label: 'API token' },
        ],
      }
    );

    expect(rows.map(row => row.path)).toEqual(['profile.name', 'token']);
    expect(rows[1]).toEqual(jasmine.objectContaining({ before: '[redacted]', after: '[redacted]', redacted: true, kind: 'changed' }));
    expect(JSON.stringify(rows)).not.toContain('old-token');
    expect(JSON.stringify(rows)).not.toContain('new-token');
    expect(JSON.stringify(rows)).not.toContain('secret');
  });

  it('preserves null and undefined as distinct values', () => {
    const rows = sdBuildAuditDiff({ nullable: null, optional: undefined }, { nullable: undefined, optional: null });

    expect(rows).toHaveSize(2);
    expect(rows[0]).toEqual(jasmine.objectContaining({ path: 'nullable', before: null, after: undefined, kind: 'changed' }));
    expect(rows[1]).toEqual(jasmine.objectContaining({ path: 'optional', before: undefined, after: null, kind: 'changed' }));
  });

  it('returns an empty result for equivalent structures and excludes unchanged rows by default', () => {
    expect(sdBuildAuditDiff({ nested: { value: 1 } }, { nested: { value: 1 } })).toEqual([]);
    expect(sdBuildAuditDiff(undefined, undefined)).toEqual([]);
  });

  it('compares arrays without a stable-key rule as one atomic value', () => {
    const rows = sdBuildAuditDiff({ tags: ['a', 'b'] }, { tags: ['b', 'a'] });

    expect(rows).toHaveSize(1);
    expect(rows[0]).toEqual(jasmine.objectContaining({ path: 'tags', kind: 'changed', before: ['a', 'b'], after: ['b', 'a'] }));
  });

  it('falls back to an atomic array row when stable keys are missing or duplicated', () => {
    const options: SdAuditDiffOptions = { fields: [{ path: 'lines', arrayKey: 'id' }] };

    expect(sdBuildAuditDiff({ lines: [{ value: 1 }] }, { lines: [{ value: 2 }] }, options).map(row => row.path)).toEqual(['lines']);
    expect(sdBuildAuditDiff({ lines: [{ id: 1 }, { id: 1 }] }, { lines: [{ id: 1 }, { id: 2 }] }, options).map(row => row.path)).toEqual([
      'lines',
    ]);
  });

  it('applies nested hidden and redacted rules to newly added stable-array items', () => {
    const rows = sdBuildAuditDiff(
      { lines: [] },
      { lines: [{ id: 'a', name: 'Visible', secret: 'do-not-leak', token: 'raw-token' }] },
      {
        redactedValue: '[redacted]',
        fields: [
          { path: 'lines', arrayKey: 'id' },
          { path: 'lines[].secret', hidden: true },
          { path: 'lines[].token', redacted: true },
        ],
      }
    );

    expect(rows.map(row => row.path)).toEqual(['lines[id=string%3Aa].id', 'lines[id=string%3Aa].name', 'lines[id=string%3Aa].token']);
    expect(rows.find(row => row.configPath === 'lines[].token')?.after).toBe('[redacted]');
    expect(JSON.stringify(rows)).not.toContain('do-not-leak');
    expect(JSON.stringify(rows)).not.toContain('raw-token');
  });

  it('contains cyclic object graphs without losing sibling changes', () => {
    const before: { value: number; self?: unknown } = { value: 1 };
    const after: { value: number; self?: unknown } = { value: 2 };
    before.self = before;
    after.self = after;

    expect(sdBuildAuditDiff(before, after).map(row => row.path)).toEqual(['value']);
  });

  it('compares Date values by timestamp and supports root scalar values', () => {
    expect(sdBuildAuditDiff(new Date('2026-01-01'), new Date('2026-01-01'))).toEqual([]);
    expect(sdBuildAuditDiff(1, 2, { rootLabel: 'Localized value' })).toEqual([
      jasmine.objectContaining({ path: '$', configPath: '$', label: 'Localized value', kind: 'changed', before: 1, after: 2 }),
    ]);
  });
});

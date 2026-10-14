import { sdGenericRenderTitle, sdGenericTitleIssues, sdGenericTitlePlaceholders } from './generic-title';

const keys = new Set(['code', 'name']);

describe('generic titles', () => {
  it('lists the ${key} placeholders of a template', () => {
    expect(sdGenericTitlePlaceholders('Order ${code} - ${name}')).toEqual(['code', 'name']);
    expect(sdGenericTitlePlaceholders('Orders')).toEqual([]);
    expect(sdGenericTitlePlaceholders('${ code }')).toEqual(['code']);
  });

  it('renders placeholders from the record as plain text and blanks missing values', () => {
    expect(sdGenericRenderTitle('Order ${code}', { code: 'SO-1' })).toBe('Order SO-1');
    expect(sdGenericRenderTitle('Order ${code} (${missing})', { code: 7 })).toBe('Order 7 ()');
    expect(sdGenericRenderTitle('Order ${code}', null)).toBe('Order ');
    // why: the result is bound as text, so markup stays literal instead of becoming HTML.
    expect(sdGenericRenderTitle('<b>${code}</b>', { code: '<i>x</i>' })).toBe('<b><i>x</i></b>');
  });

  it('forbids placeholders in the list and create titles (AC-009)', () => {
    expect(sdGenericTitleIssues('list', 'Orders ${code}', keys).map(issue => issue.code)).toEqual(['title-placeholder-forbidden']);
    expect(sdGenericTitleIssues('create', 'New ${code}', keys)[0].path).toBe('create.title');
    expect(sdGenericTitleIssues('list', 'Orders', keys)).toEqual([]);
  });

  it('allows only known property keys in the detail and update titles (AC-009)', () => {
    const issues = sdGenericTitleIssues('update', 'Order ${unknown}', keys);
    expect(issues.length).toBe(1);
    expect(issues[0]).toEqual(jasmine.objectContaining({ code: 'title-placeholder-unknown', severity: 'error', path: 'update.title' }));
    expect(issues[0].message).toContain('unknown');
    expect(sdGenericTitleIssues('detail', 'Order ${code} ${name}', keys)).toEqual([]);
  });

  it('ignores an absent title and reports a non-string title as a shape issue', () => {
    expect(sdGenericTitleIssues('detail', undefined, keys)).toEqual([]);
    expect(sdGenericTitleIssues('detail', 42, keys).map(issue => issue.code)).toEqual(['shape']);
  });
});

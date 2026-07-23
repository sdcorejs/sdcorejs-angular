import { ExpressionFeelPipe } from './expression-feel.pipe';
import { ExpressionQueryPipe } from './expression-query.pipe';
import { ExpressionViewPipe } from './expression-view.pipe';
import { HyperlinkPipe } from './hyperlink.pipe';

describe('form-generic expression display pipes', () => {
  const condition = (field: string, operator: string, value?: unknown) => ({ type: 'condition', field, operator, value }) as any;

  it('renders nested FEEL conditions with FEEL combinator and null syntax', () => {
    const pipe = new ExpressionFeelPipe();
    const expression = {
      type: 'combinator',
      combinator: '&&',
      conditions: [condition('status', 'EQUAL', 'active'), condition('deletedAt', 'NULL')],
    } as any;

    expect(pipe.transform(expression)).toBe("${(status == 'active' and deletedAt == null)}");
    expect(pipe.transform(condition('score', 'GREATER_OR_EQUAL', 80))).toBe('${score >= 80}');
    expect(pipe.transform(condition('name', '', 'demo'))).toBeUndefined();
  });

  it('renders JavaScript-query conditions and safely handles absent input', () => {
    const pipe = new ExpressionQueryPipe();
    const expression = {
      type: 'combinator',
      combinator: '||',
      conditions: [condition('enabled', 'NOT_NULL'), condition('count', 'LESS_THAN', 10)],
    } as any;

    expect(pipe.transform(expression)).toBe('((!!${enabled}) || (${count} < 10))');
    expect(pipe.transform(condition('status', 'NOT_EQUAL', 'closed'))).toBe("${status} !== 'closed'");
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('renders a readable condition and suppresses combinator-only rows', () => {
    const pipe = new ExpressionViewPipe();
    const html = pipe.transform(condition('status', 'EQUAL', 'active'), [{ value: 'status', display: 'Status' }] as any);

    expect(html).toContain('Status');
    expect(html).toContain('active');
    expect(pipe.transform({ type: 'combinator', combinator: '&&', conditions: [] } as any, [])).toBe('');
  });

  it('formats entity-backed hyperlinks and treats empty templates as empty text', () => {
    const pipe = new HyperlinkPipe();

    expect(pipe.transform(undefined, { id: 7 })).toBe('');
    expect(pipe.transform('/users/${id}', { id: 7 })).toBe('/users/7');
  });
});

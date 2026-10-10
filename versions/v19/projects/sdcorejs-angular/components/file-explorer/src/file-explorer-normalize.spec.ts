import { sdFileExplorerNormalizeConfig, sdFileExplorerEligible } from './file-explorer-normalize';
import type { SdFileExplorerConfig, SdFileExplorerItem, SdFileExplorerOption } from './file-explorer.model';

describe('Explorer canonical configuration', () => {
  const item: SdFileExplorerItem<{ owner: string }> = { id: 'a', parentId: null, name: 'a', kind: 'file', data: { owner: 'Ada' } };
  it('retains legacy callable declarations and DTO context', () => {
    interface Extended extends SdFileExplorerOption<{ owner: string }> {
      tenant?: string;
    }
    const option: Extended = { list: () => [item], share: ({ item }) => item.data?.owner ?? '' };
    expect(option.share?.({ item, signal: new AbortController().signal })).toBe('Ada');
    expect(sdFileExplorerNormalizeConfig(option).list).toBe(option.list);
  });
  it('canonical groups win without wrapping callbacks or falling back when denied', () => {
    const legacy = jasmine.createSpy('legacy');
    const canonical = jasmine.createSpy('canonical');
    const config: SdFileExplorerConfig<{ owner: string }> = {
      list: () => [item],
      share: legacy,
      capabilities: { share: { onShare: canonical, shareable: false } },
    };
    const resolved = sdFileExplorerNormalizeConfig(config);
    expect(resolved.share).toBe(canonical);
    expect(sdFileExplorerEligible(resolved.shareable, item)).toBeFalse();
    expect(legacy).not.toHaveBeenCalled();
  });
  it('source-only configuration preserves list identity and uses local search when absent', () => {
    const onList = () => [item];
    const resolved = sdFileExplorerNormalizeConfig({ dataSource: { onList } });
    expect(resolved.list).toBe(onList);
    expect(resolved.search).toBeUndefined();
  });
  it('re-evaluates synchronous eligibility and defaults missing state to true', () => {
    let allowed = true;
    const predicate = () => allowed;
    expect(sdFileExplorerEligible(predicate, item)).toBeTrue();
    allowed = false;
    expect(sdFileExplorerEligible(predicate, item)).toBeFalse();
    expect(sdFileExplorerEligible(undefined, item)).toBeTrue();
  });
  it('keeps DTO and callable compatibility strict without widening to any', () => {
    const legacy: SdFileExplorerOption<{ owner: string }> = { list: () => [item] };
    const source: SdFileExplorerConfig<{ owner: string }> = { dataSource: { onList: () => [item] } };
    expect(sdFileExplorerNormalizeConfig(source).list).toBe(source.dataSource!.onList);
    const inspectTypeErrors = (execute: boolean) => {
      if (!execute) return;
      // @ts-expect-error unknown DTO fields must not typecheck
      void item.data?.missing;
      const unknownItem: SdFileExplorerItem = item;
      // @ts-expect-error default DTO must remain unknown
      void unknownItem.data?.owner;
      // @ts-expect-error source-only option cannot declare legacy list too
      const mixed: SdFileExplorerConfig<{ owner: string }> = { ...legacy, dataSource: { onList: legacy.list } };
      void mixed;
    };
    inspectTypeErrors(false);
  });
});

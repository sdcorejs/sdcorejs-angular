import { sdFileExplorerValidateMove, SdFileExplorerDragSession } from './file-explorer-move';
import type { SdFileExplorerItem } from './file-explorer.model';

describe('Explorer internal move trust boundary', () => {
  const a: SdFileExplorerItem = { id: 'a', parentId: null, name: 'A', kind: 'file' };
  const b: SdFileExplorerItem = { id: 'b', parentId: 'old', name: 'B', kind: 'file' };
  const target: SdFileExplorerItem = { id: 'target', parentId: null, name: 'Target', kind: 'folder' };
  const visible = [a, b, target];
  it('accepts only original visible file identities and a known folder destination', () => {
    expect(sdFileExplorerValidateMove([a, b], target, visible)).toBeTrue();
    expect(sdFileExplorerValidateMove([{ ...a }], target, visible)).toBeFalse();
    expect(sdFileExplorerValidateMove([target], null, visible)).toBeFalse();
    expect(sdFileExplorerValidateMove([a], { ...target }, visible)).toBeFalse();
  });
  it('rejects a whole batch for same-parent members, duplicate ids or file targets', () => {
    expect(sdFileExplorerValidateMove([a, b], null, visible)).toBeFalse();
    expect(sdFileExplorerValidateMove([a, a], target, visible)).toBeFalse();
    expect(sdFileExplorerValidateMove([b], a, visible)).toBeFalse();
    expect(sdFileExplorerValidateMove([], target, visible)).toBeFalse();
  });
  it('owns an ephemeral token per instance and never accepts serialized items', () => {
    const first = new SdFileExplorerDragSession();
    const second = new SdFileExplorerDragSession();
    const token = first.start([a]);
    expect(first.resolve(token)).toEqual([a]);
    expect(second.resolve(token)).toBeNull();
    expect(first.resolve(JSON.stringify([a]))).toBeNull();
    first.clear();
    expect(first.resolve(token)).toBeNull();
  });
});

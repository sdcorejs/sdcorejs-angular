import type { SdFileExplorerItem } from './file-explorer.model';

export const SD_FILE_EXPLORER_MOVE_MIME = 'application/x-sd-file-explorer-move';

/** Whole-batch validation keeps original caller objects and rejects stale destinations. */
export function sdFileExplorerValidateMove<T>(
  items: readonly SdFileExplorerItem<T>[],
  target: SdFileExplorerItem<T> | null,
  known: readonly SdFileExplorerItem<T>[],
  visible: readonly SdFileExplorerItem<T>[] = known
): boolean {
  if (!items.length || (target !== null && (target.kind !== 'folder' || !known.includes(target)))) return false;
  const ids = new Set<string>();
  const knownIds = new Map<string, SdFileExplorerItem<T>>();
  for (const item of known) {
    if (knownIds.has(item.id) && knownIds.get(item.id) !== item) return false;
    knownIds.set(item.id, item);
  }
  const visibleIds = new Map<string, SdFileExplorerItem<T>>();
  for (const item of visible) {
    if (visibleIds.has(item.id) && visibleIds.get(item.id) !== item) return false;
    visibleIds.set(item.id, item);
  }
  for (const item of items) {
    if (
      item.kind !== 'file' ||
      !visible.includes(item) ||
      knownIds.get(item.id)?.kind === 'folder' ||
      ids.has(item.id) ||
      item.parentId === (target?.id ?? null)
    )
      return false;
    ids.add(item.id);
  }
  return true;
}

/** Tokens resolve only inside the originating instance and only during its current gesture. */
export class SdFileExplorerDragSession<T = unknown> {
  #token: string | null = null;
  #items: readonly SdFileExplorerItem<T>[] = [];
  get activeItems(): readonly SdFileExplorerItem<T>[] | null {
    return this.#token === null ? null : this.#items;
  }
  start(items: readonly SdFileExplorerItem<T>[]): string {
    this.#token = crypto.randomUUID();
    this.#items = Object.freeze([...items]);
    return this.#token;
  }
  resolve(token: string): readonly SdFileExplorerItem<T>[] | null {
    return this.#token !== null && token === this.#token ? this.#items : null;
  }
  clear(): void {
    this.#token = null;
    this.#items = [];
  }
}

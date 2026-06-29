import { SdFormGenericComponent, SdFormGenericGroup } from '../../models';

export type FormBuilderLayoutItem = SdFormGenericComponent | SdFormGenericGroup;

export interface FormBuilderLayoutRow {
  id: string;
  items: FormBuilderLayoutItem[];
  columns: number;
}

export interface MoveItemToRowRequest {
  itemId: string;
  targetRowId: string;
  targetIndex?: number;
}

export interface MoveItemToRowResult {
  rows: FormBuilderLayoutRow[];
  moved: boolean;
  reason?: 'item-not-found' | 'target-row-not-found' | 'row-overflow';
}

export function normalizeColumns(item: FormBuilderLayoutItem): number {
  const raw = Number(item.layout?.columns ?? 12);
  if (!Number.isFinite(raw)) return 12;
  return Math.min(12, Math.max(1, Math.round(raw)));
}

export function buildFormBuilderRows(components: FormBuilderLayoutItem[]): FormBuilderLayoutRow[] {
  const rows: FormBuilderLayoutRow[] = [];

  for (const component of components) {
    const columns = normalizeColumns(component);
    let row = rows[rows.length - 1];

    if (!row || row.columns + columns > 12) {
      row = { id: '', items: [], columns: 0 };
      rows.push(row);
    }

    row.items.push(component);
    row.columns += columns;
  }

  return rows.map(row => ({
    ...row,
    id: createRowId(row),
  }));
}

export function flattenFormBuilderRows(rows: FormBuilderLayoutRow[]): FormBuilderLayoutItem[] {
  return rows.flatMap(row => row.items);
}

export function canPlaceInRow(row: FormBuilderLayoutRow, item: FormBuilderLayoutItem, ignoredItemId?: string): boolean {
  const currentColumns = row.items
    .filter(rowItem => rowItem.id !== ignoredItemId)
    .reduce((sum, rowItem) => sum + normalizeColumns(rowItem), 0);

  return currentColumns + normalizeColumns(item) <= 12;
}

export function moveItemToRow(rows: FormBuilderLayoutRow[], request: MoveItemToRowRequest): MoveItemToRowResult {
  const source = findItem(rows, request.itemId);
  if (!source) {
    return { rows, moved: false, reason: 'item-not-found' };
  }

  const targetRow = rows.find(row => row.id === request.targetRowId);
  if (!targetRow) {
    return { rows, moved: false, reason: 'target-row-not-found' };
  }

  if (!canPlaceInRow(targetRow, source.item, request.itemId)) {
    return { rows, moved: false, reason: 'row-overflow' };
  }

  const nextRows = rows.map(row => ({ ...row, items: [...row.items] }));
  const nextSource = findItem(nextRows, request.itemId);
  const nextTarget = nextRows.find(row => row.id === request.targetRowId);
  if (!nextSource || !nextTarget) {
    return { rows, moved: false, reason: 'item-not-found' };
  }

  const [item] = nextRows[nextSource.rowIndex].items.splice(nextSource.itemIndex, 1);
  const insertAt = clampIndex(request.targetIndex ?? nextTarget.items.length, nextTarget.items.length);
  nextTarget.items.splice(insertAt, 0, item);

  return {
    rows: buildFormBuilderRows(flattenFormBuilderRows(nextRows)),
    moved: true,
  };
}

function createRowId(row: Pick<FormBuilderLayoutRow, 'items'>): string {
  const firstId = row.items[0]?.id || 'empty';
  return `row-${firstId}`;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

function findItem(
  rows: FormBuilderLayoutRow[],
  itemId: string
): { rowIndex: number; itemIndex: number; item: FormBuilderLayoutItem } | undefined {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const itemIndex = rows[rowIndex].items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      return {
        rowIndex,
        itemIndex,
        item: rows[rowIndex].items[itemIndex],
      };
    }
  }
  return undefined;
}

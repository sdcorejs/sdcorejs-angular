import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';

export interface MockCategory extends PatternMockRecord {
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly status: 'active' | 'inactive';
}

interface MockCategoryNode extends MockCategory {
  readonly level: number;
  readonly productCount: number;
  readonly children: MockCategoryNode[];
}

/** Three levels: group → line → sub-line. Ids are the dotted path so the tree reads well in e2e. */
const TREE: readonly [string, string, readonly (readonly [string, string, readonly string[]])[]][] = [
  [
    'DU',
    'Đồ uống',
    [
      ['DU-NUOC', 'Nước giải khát', ['Nước suối', 'Nước ngọt', 'Nước ép']],
      ['DU-CAFE', 'Cà phê & trà', ['Cà phê rang xay', 'Trà túi lọc']],
    ],
  ],
  [
    'TP',
    'Thực phẩm khô',
    [
      ['TP-GAO', 'Gạo & ngũ cốc', ['Gạo', 'Ngũ cốc']],
      ['TP-GIAVI', 'Gia vị', ['Nước mắm', 'Nước tương', 'Hạt nêm']],
      ['TP-MI', 'Mì & bún khô', []],
    ],
  ],
  [
    'HMP',
    'Hoá mỹ phẩm',
    [
      ['HMP-GIAT', 'Giặt xả', ['Bột giặt', 'Nước xả']],
      ['HMP-CN', 'Chăm sóc cá nhân', ['Dầu gội', 'Kem đánh răng']],
    ],
  ],
  [
    'SUA',
    'Sữa & chế phẩm',
    [
      ['SUA-TUOI', 'Sữa tươi', []],
      ['SUA-CHUA', 'Sữa chua', []],
    ],
  ],
];

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

function seed(): MockCategory[] {
  const records: MockCategory[] = [];
  let id = 1;
  for (const [groupCode, groupName, lines] of TREE) {
    const groupId = String(id++);
    records.push({ id: groupId, code: groupCode, name: groupName, parentId: null, status: 'active' });
    for (const [lineCode, lineName, subs] of lines) {
      const lineId = String(id++);
      records.push({ id: lineId, code: lineCode, name: lineName, parentId: groupId, status: 'active' });
      subs.forEach((name, index) =>
        records.push({
          id: String(id++),
          code: `${lineCode}-${index + 1}`,
          name,
          parentId: lineId,
          status: name === 'Nước ép' ? 'inactive' : 'active',
        })
      );
    }
  }
  return records;
}

/** Level of a new category under `parentId` (1 for a root). */
function levelOf(records: readonly MockCategory[], parentId: string | null): number {
  let level = 1;
  let parent = records.find(record => record.id === parentId);
  while (parent) {
    level++;
    parent = records.find(record => record.id === parent!.parentId);
  }
  return level;
}

function validate(body: Record<string, unknown>, records: readonly MockCategory[], id?: string) {
  const code = text(body['code']).toUpperCase();
  const name = text(body['name']);
  const parentId = text(body['parentId']) || null;
  const errors: { field: string; message: string }[] = [];
  if (!code) errors.push({ field: 'code', message: 'Nhập mã danh mục.' });
  if (!name) errors.push({ field: 'name', message: 'Nhập tên danh mục.' });
  if (parentId && !records.some(record => record.id === parentId))
    errors.push({ field: 'parentId', message: 'Danh mục cha không tồn tại.' });
  if (parentId && levelOf(records, parentId) > 3) errors.push({ field: 'parentId', message: 'Danh mục chỉ có tối đa 3 cấp.' });
  if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
  if (records.some(record => record.id !== id && record.code === code)) {
    throw new PatternMockError(409, {
      message: 'Mã danh mục đã tồn tại.',
      errors: [{ field: 'code', message: `Mã ${code} đã được dùng.` }],
    });
  }
  return { code, name, parentId, status: body['status'] === 'inactive' ? ('inactive' as const) : ('active' as const) };
}

/** Nested tree for the list: every node with its level and children, roots in seed order. */
function tree(records: readonly MockCategory[]): MockCategoryNode[] {
  const build = (parentId: string | null, level: number): MockCategoryNode[] =>
    records
      .filter(record => record.parentId === parentId)
      .map(record => {
        const children = build(record.id, level + 1);
        return {
          ...record,
          level,
          children,
          productCount: children.length ? children.reduce((sum, child) => sum + child.productCount, 0) : 3 + (Number(record.id) % 5),
        };
      });
  return build(null, 1);
}

/** `categories`: danh mục ba cấp. `GET categories/tree` trả cây lồng nhau; xoá danh mục còn con bị từ chối (409). */
export const CATEGORY_RESOURCE: PatternMockResource<MockCategory> = {
  name: 'categories',
  seed,
  create: (body, records, context) => ({ id: context.nextId('categories'), ...validate(body, records) }),
  update: (current, body, records) => ({ ...current, ...validate({ ...body, parentId: current.parentId }, records, current.id) }),
  beforeDelete: (current, context) => {
    if (context.collection<MockCategory>('categories').some(record => record.parentId === current.id)) {
      throw new PatternMockError(409, { message: `${current.name} còn danh mục con, không xoá được.` });
    }
  },
  route: (method, segments, _query, _body, context) =>
    method === 'GET' && segments.length === 1 && segments[0] === 'tree'
      ? { body: tree(context.collection<MockCategory>('categories')) }
      : undefined,
};

export type SdOperator = SdOperatorHasData | SdOperatorNoData;

export type SdOperatorHasData =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'CONTAIN'
  | 'NOT_CONTAIN'
  | 'IN'
  | 'NOT_IN'
  | 'START_WITH'
  | 'END_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'BETWEEN';

export type SdOperatorNoData = 'NULL' | 'NOT_NULL';

export const SdOperators: {
  value: SdOperator;
  symbol?: string;
  display: string;
}[] = [
  {
    value: 'EQUAL',
    symbol: '=',
    display: 'Bằng',
  },
  {
    value: 'NOT_EQUAL',
    symbol: '≠',
    display: 'Không bằng',
  },
  {
    value: 'GREATER_THAN',
    symbol: '>',
    display: 'Lớn hơn',
  },
  {
    value: 'LESS_THAN',
    symbol: '<',
    display: 'Nhỏ hơn',
  },
  {
    value: 'GREATER_OR_EQUAL',
    symbol: '≥',
    display: 'Lớn hơn, hoặc bằng',
  },
  {
    value: 'LESS_OR_EQUAL',
    symbol: '≤',
    display: 'Nhỏ hơn, hoặc bằng',
  },
  {
    value: 'CONTAIN',
    symbol: 'join_inner',
    display: 'Chứa',
  },
  {
    value: 'NOT_CONTAIN',
    symbol: 'join',
    display: 'Không chứa',
  },
  {
    value: 'START_WITH',
    symbol: 'line_start_circle',
    display: 'Bắt đầu bởi',
  },
  {
    value: 'END_WITH',
    symbol: 'line_end_circle',
    display: 'Kết thúc bởi',
  },
  {
    value: 'IN',
    symbol: 'checklist_rtl',
    display: 'Nằm trong',
  },
  {
    value: 'NOT_IN',
    symbol: 'event_list',
    display: 'Không nằm trong',
  },
  {
    value: 'NULL',
    symbol: 'motion_photos_off',
    display: 'Là rỗng',
  },
  {
    value: 'NOT_NULL',
    symbol: 'adjust',
    display: 'Không rỗng',
  },
];

import { Utilities } from '@sdcorejs/utils/fns';
import { SdSelectionVisiblePipe } from './selection-visible.pipe';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { SdTableAction, SdTableOptionSelector } from '../models/table-option-selector.model';

interface Row {
  id: number;
  status: string;
}

const noop = () => undefined;

const mkItem = (data: Row): SdTableItem<Row> => MapToSdTableItem(data);

const sel = (actions: SdTableAction<Row>[]): SdTableOptionSelector<Row> => ({ visible: true, actions });

describe('SdSelectionVisiblePipe', () => {
  let pipe: SdSelectionVisiblePipe;

  beforeEach(() => {
    pipe = new SdSelectionVisiblePipe();
  });

  describe('không mutate tích luỹ input (pure pipe)', () => {
    it('re-eval nhiều lần cho CÙNG một item KHÔNG nhân bản action key', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([
        { title: 'Duyệt', click: noop },
        { title: 'Xoá', click: noop },
      ]);

      pipe.transform(item, selection);
      const afterFirst = [...item.meta.selector!.actions!];
      expect(afterFirst.length).toBe(2);

      // why: template re-eval pipe ở MỖI change-detection pass — bản cũ push thêm vào
      // mảng cũ mà không reset nên số key tăng vô hạn.
      for (let i = 0; i < 20; i++) pipe.transform(item, selection);

      expect(item.meta.selector!.actions).toEqual(afterFirst);
      expect(item.meta.selector!.actions!.length).toBe(2);
    });

    it('giữ NGUYÊN reference mảng actions qua các lần transform (không cấp phát mỗi pass)', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([{ title: 'Duyệt', click: noop }]);

      pipe.transform(item, selection);
      const ref = item.meta.selector!.actions;
      pipe.transform(item, selection);
      pipe.transform(item, selection);

      expect(item.meta.selector!.actions).toBe(ref!);
    });

    it('actions phản ánh ĐÚNG selection hiện tại khi hidden đổi giữa 2 lần eval', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      let hide = false;
      const selection = sel([{ title: 'Duyệt', hidden: () => hide, click: noop }]);

      pipe.transform(item, selection);
      expect(item.meta.selector!.actions!.length).toBe(1);
      expect(item.meta.selector!.selectable).toBe(true);

      hide = true;
      pipe.transform(item, selection);
      // Bản cũ giữ lại key stale → selectable vẫn true. Reset ở entry làm nó đúng.
      expect(item.meta.selector!.actions!.length).toBe(0);
      expect(item.meta.selector!.selectable).toBe(false);
    });

    it('select-all pipe cũ đọc actions.includes() — key không được trùng lặp sau nhiều pass', () => {
      const action: SdTableAction<Row> = { title: 'Duyệt', click: noop };
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([action]);

      pipe.transform(item, selection);
      pipe.transform(item, selection);
      pipe.transform(item, selection);

      const key = Utilities.hash(action);
      expect(item.meta.selector!.actions!.filter(a => a === key).length).toBe(1);
    });
  });

  describe('hành vi hiển thị checkbox', () => {
    it('selectable = true khi selection không cấu hình action nào', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      expect(pipe.transform(item, { visible: true })).toBe(true);
      expect(item.meta.selector!.selectable).toBe(true);
    });

    it('ẩn checkbox khi mọi action khả dụng đều isGrouped và row không phải group row', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([{ title: 'Gộp', isGrouped: true, click: noop }]);

      expect(pipe.transform(item, selection)).toBe(false);
      expect(item.meta.selector!.selectable).toBe(true);
    });

    it('hiện checkbox khi có ít nhất 1 action KHÔNG grouped', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([
        { title: 'Gộp', isGrouped: true, click: noop },
        { title: 'Xoá', click: noop },
      ]);

      expect(pipe.transform(item, selection)).toBe(true);
    });

    it('action cha (children) chỉ được thêm khi có ít nhất 1 child hiển thị', () => {
      const visibleRow = mkItem({ id: 1, status: 'DRAFT' });
      const hiddenRow = mkItem({ id: 2, status: 'DONE' });
      const selection = sel([
        {
          title: 'Nhóm',
          children: [{ title: 'Duyệt', hidden: (row?: Row) => row?.status === 'DONE', click: noop }],
        },
      ]);

      pipe.transform(visibleRow, selection);
      pipe.transform(hiddenRow, selection);

      // child + parent
      expect(visibleRow.meta.selector!.actions!.length).toBe(2);
      expect(hiddenRow.meta.selector!.actions!.length).toBe(0);
      expect(hiddenRow.meta.selector!.selectable).toBe(false);
    });

    it('hidden = true (cờ tĩnh) loại action khỏi danh sách', () => {
      const item = mkItem({ id: 1, status: 'DRAFT' });
      const selection = sel([{ title: 'Ẩn', hidden: true, click: noop }]);

      expect(pipe.transform(item, selection)).toBe(false);
      expect(item.meta.selector!.actions!.length).toBe(0);
    });
  });
});

import { Utilities } from '@sdcorejs/utils/fns';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdSelectionDisabledPipe } from './selection-disabled.pipe';

interface Row {
  id: number;
  name: string;
}

const row = (id: number): SdTableItem<Row> => {
  const item = MapToSdTableItem<Row>({ id, name: `R${id}` });
  item.meta.selector = { isSelected: false, selectable: true, actions: [] };
  return item;
};

describe('SdSelectionDisabledPipe', () => {
  let pipe: SdSelectionDisabledPipe;

  beforeEach(() => {
    pipe = new SdSelectionDisabledPipe();
  });

  it('keeps a preserved selected row enabled so it can be deselected after reload', () => {
    const selected = row(1);
    selected.meta.selector!.isSelected = true;
    const selector: SdTableOptionSelector<Row> = {
      preserveSelection: true,
      disabled: current => current?.id === 1,
    };

    const result = pipe.transform([selected], selected, selector);

    expect(result).toBeFalse();
    expect(selected.meta.selector!.selectable).toBeTrue();
  });

  it('still disables an unselected row when the disabled predicate matches', () => {
    const unselected = row(1);
    const selector: SdTableOptionSelector<Row> = {
      preserveSelection: true,
      disabled: current => current?.id === 1,
    };

    const result = pipe.transform([], unselected, selector);

    expect(result).toBeTrue();
    expect(unselected.meta.selector!.selectable).toBeFalse();
  });

  it('marks an action-compatible unselected row unselectable when the disabled predicate matches', () => {
    const action = { title: 'Process', click: () => undefined };
    const unselected = row(2);
    unselected.meta.selector!.actions = [Utilities.hash(action)];
    const selector: SdTableOptionSelector<Row> = {
      actions: [action],
      disabled: current => current?.id === 2,
    };

    const result = pipe.transform([], unselected, selector);

    expect(result).toBeTrue();
    expect(unselected.meta.selector!.selectable).toBeFalse();
  });

  it('marks a candidate unselectable when it has no action compatible with the selected rows', () => {
    const actionA = { title: 'Action A', click: () => undefined };
    const actionB = { title: 'Action B', click: () => undefined };
    const selected = row(1);
    const candidate = row(2);
    selected.meta.selector!.isSelected = true;
    selected.meta.selector!.actions = [Utilities.hash(actionA)];
    candidate.meta.selector!.actions = [Utilities.hash(actionB)];
    const selector: SdTableOptionSelector<Row> = { actions: [actionA, actionB] };

    const result = pipe.transform([selected], candidate, selector);

    expect(result).toBeTrue();
    expect(candidate.meta.selector!.selectable).toBeFalse();
  });

  it('passes row data and selected row data to the disabled predicate', () => {
    const selected = row(1);
    const unselected = row(2);
    const disabled = jasmine.createSpy('disabled').and.returnValue(false);
    const selector: SdTableOptionSelector<Row> = { disabled };

    pipe.transform([selected], unselected, selector);

    expect(disabled).toHaveBeenCalledOnceWith(unselected.data, [selected.data]);
  });
});

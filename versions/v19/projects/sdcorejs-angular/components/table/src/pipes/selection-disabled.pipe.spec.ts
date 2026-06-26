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
    const selector: SdTableOptionSelector<any> = {
      preserveSelection: true,
      disabled: current => current?.data?.id === 1,
    };

    const result = pipe.transform([selected], selected, selector);

    expect(result).toBeFalse();
    expect(selected.meta.selector!.selectable).toBeTrue();
  });

  it('still disables an unselected row when the disabled predicate matches', () => {
    const unselected = row(1);
    const selector: SdTableOptionSelector<any> = {
      preserveSelection: true,
      disabled: current => current?.data?.id === 1,
    };

    const result = pipe.transform([], unselected, selector);

    expect(result).toBeTrue();
    expect(unselected.meta.selector!.selectable).toBeFalse();
  });
});

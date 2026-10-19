import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ɵsdModelFacingControl } from './sd-model-facing-control';

// The control registered in the parent form while `transform` or ISdCoreConfiguration.timeZone is
// active. A user edit reaches it through the editor control (`source`); the form connector writes the
// model from that same `valueChanges`, after this helper subscribed — the "connector" below mirrors that.
describe('ɵsdModelFacingControl valueChanges', () => {
  const setup = () => {
    const model = signal<string | null>(null);
    const source = new FormControl<Date | null>(null);
    const writes: unknown[] = [];
    const facing = TestBed.runInInjectionContext(() =>
      ɵsdModelFacingControl<string | null>({
        active: signal(true),
        model,
        writeModel: value => {
          writes.push(value);
          model.set(value);
        },
        source: signal(source),
      })
    );
    const form = new FormGroup({ day: facing.control });
    TestBed.flushEffects();
    // The connector: subscribes after the helper and writes the model synchronously.
    let next: string | null = null;
    source.valueChanges.subscribe(() => model.set(next));
    const emitted: unknown[] = [];
    const parent: unknown[] = [];
    facing.control.valueChanges.subscribe(value => emitted.push(value));
    form.valueChanges.subscribe(value => parent.push(value));
    const userEdit = (value: string | null) => {
      next = value;
      source.setValue(new Date(1960, 4, 20));
    };
    return { model, source, facing, form, writes, emitted, parent, userEdit };
  };
  const settle = async () => {
    TestBed.flushEffects();
    await Promise.resolve();
    TestBed.flushEffects();
  };

  it('emits once with the model value when a user edit changes the model', async () => {
    const { facing, form, emitted, parent, userEdit } = setup();
    userEdit('1960/05/20');
    await settle();
    expect(emitted).toEqual(['1960/05/20']);
    expect(parent).toEqual([{ day: '1960/05/20' }]);
    expect(facing.control.value).toBe('1960/05/20');
    expect(form.value).toEqual({ day: '1960/05/20' });
  });

  it('emits once whether the effect or the microtask runs first', async () => {
    const { emitted, userEdit } = setup();
    userEdit('1960/05/20');
    TestBed.flushEffects();
    await Promise.resolve();
    expect(emitted).toEqual(['1960/05/20']);

    userEdit('1960/05/21');
    await Promise.resolve();
    TestBed.flushEffects();
    expect(emitted).toEqual(['1960/05/20', '1960/05/21']);
  });

  it('emits nothing when a user edit leaves the model unchanged', async () => {
    const { emitted, parent, userEdit } = setup();
    userEdit('1960/05/20');
    await settle();
    userEdit('1960/05/20');
    await settle();
    expect(emitted).toEqual(['1960/05/20']);
    expect(parent.length).toBe(1);
  });

  it('stays silent for a model write from outside', async () => {
    const { model, facing, emitted, parent } = setup();
    model.set('1960/05/20');
    await settle();
    expect(facing.control.value).toBe('1960/05/20');
    expect(emitted).toEqual([]);
    expect(parent).toEqual([]);
  });

  it('writes the model once and emits once for a write through the registered control', async () => {
    const { facing, writes, emitted } = setup();
    facing.control.setValue('1960/05/21');
    await settle();
    expect(writes).toEqual(['1960/05/21']);
    expect(emitted).toEqual(['1960/05/21']);
  });
});

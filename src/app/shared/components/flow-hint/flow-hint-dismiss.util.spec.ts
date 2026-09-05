import {
  FLOW_HINT_STORAGE_PREFIX,
  dismissFlowHint,
  flowHintStorageKey,
  isFlowHintDismissed,
} from './flow-hint-dismiss.util';

describe('flow-hint-dismiss.util (072)', () => {
  it('persiste y lee el dismiss', () => {
    const mem: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
    } as Storage;

    expect(isFlowHintDismissed('citas', storage)).toBeFalse();
    dismissFlowHint('citas', storage);
    expect(mem[flowHintStorageKey('citas')]).toBe('1');
    expect(isFlowHintDismissed('citas', storage)).toBeTrue();
    expect(flowHintStorageKey('citas').startsWith(FLOW_HINT_STORAGE_PREFIX)).toBeTrue();
  });

  it('id vacío no escribe', () => {
    const storage = { getItem: () => null, setItem: jasmine.createSpy('setItem') } as unknown as Storage;
    dismissFlowHint('  ', storage);
    expect((storage.setItem as jasmine.Spy).calls.count()).toBe(0);
  });
});

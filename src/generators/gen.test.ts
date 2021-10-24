/* eslint-disable @typescript-eslint/ban-ts-comment */
import createReduxPack, { configureStore, resetAction, requestErrorGen, resetActionGen } from '../index';
import { simpleGen } from './simple';

const state = () => createReduxPack._store?.getState();

const packName = 'RequestSimpleError';
const reducerName = 'TestReducer';
const payloadMap = {
  name: packName,
  reducerName: reducerName,
  defaultInitial: null as 'sad' | null,
  actions: ['extraAction'],
};

/*const getG = <T extends Params>(_c: T) => ({
  a: ({ defaultInitial }: T) => defaultInitial as T['defaultInitial'],
});

const asd = createReduxPack(payloadMap).withGenerator((_c) => getG<typeof _c>(_c));

type d = keyof typeof asd;
const s = asd.a;*/

const { selectors: testPackSelectors, actions: testPackActions, requestSimpleErrorSelectors } = createReduxPack(
  payloadMap,
)
  .withGenerator(requestErrorGen)
  .withGenerator(simpleGen);

const { selectors: resetGenSelectors, multiGenSelectors, actions: resetGenActions, errorSelector } = createReduxPack({
  name: 'multiGen',
  reducerName: reducerName,
  defaultInitial: null as number | null,
  formatPayload: (p: { a: number }) => p.a,
  modifyValue: (val, prevVal) => val + prevVal,
})
  .withGenerator(requestErrorGen)
  .withGenerator(resetActionGen)
  .withGenerator({
    errorSelector: (_info, prevPack) => prevPack.selectors.error,
    reset: (_info, prevPack) => prevPack.actions.reset,
    allActions: (_info, prevPack) => prevPack.actions,
    allSelectors: (_info, prevPack) => prevPack.selectors,
  });

const { selectors: mergeSelectors, actions: mergeActions, withGenPayloadCustomActionsActions } = createReduxPack({
  name: 'WithGenPayloadCustomActions',
  reducerName: reducerName,
  actions: ['sad', 'asd', 'wasd'],
  defaultInstanced: true,
  mergeByKey: 'id',
  defaultInitial: {} as { [key: string]: { id: string; value: string } },
  payloadMap: {
    field: {
      actions: ['sad'],
      instanced: ['asd'],
      initial: {} as { [key: string]: { id: string; value: string } },
      mergeByKey: 'id',
    },
    field2: {
      actions: ['asd', 'wasd'],
      instanced: ['asd'],
      initial: {} as { [key: string]: { id: string; value: string } },
      mergeByKey: 'id',
      formatMergePayload: (a: { id: string; value: string }) => a,
    },
  },
}).withGenerator(resetActionGen);

test('check default gens merge', () => {
  configureStore();
  expect(testPackSelectors).toEqual(requestSimpleErrorSelectors);
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual(null);
  expect(testPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.set('asd1'));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual('asd1');
  expect(testPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual('asd1');

  createReduxPack._store?.dispatch(testPackActions.reset());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.success(123));
  createReduxPack._store?.dispatch(testPackActions.set('asd'));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(123);
  expect(testPackSelectors.value(state())).toEqual('asd');

  createReduxPack._store?.dispatch(testPackActions.run());
  createReduxPack._store?.dispatch(testPackActions.fail('sad'));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(123);
  expect(testPackSelectors.value(state())).toEqual('asd');
  expect(testPackSelectors.error(state())).toEqual('sad');

  createReduxPack._store?.dispatch(testPackActions.run());

  expect(testPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(resetAction());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual(null);
  expect(testPackSelectors.error(state())).toEqual(null);

  expect(testPackActions.extraAction).toBeDefined();
});

test('check error and reset gens merge', () => {
  expect(resetGenSelectors).toEqual(multiGenSelectors);
  expect(resetGenSelectors.isLoading(state())).toEqual(false);
  expect(resetGenSelectors.result(state())).toEqual(null);
  expect(resetGenSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(resetGenActions.run());

  expect(resetGenSelectors.isLoading(state())).toEqual(true);
  expect(resetGenSelectors.result(state())).toEqual(null);
  expect(resetGenSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(resetGenActions.success({ a: 123 }));
  createReduxPack._store?.dispatch(resetGenActions.success({ a: 123 }));

  expect(resetGenSelectors.isLoading(state())).toEqual(false);
  expect(resetGenSelectors.result(state())).toEqual(246);
  expect(resetGenSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(resetGenActions.run());
  createReduxPack._store?.dispatch(resetGenActions.fail('sad'));

  expect(resetGenSelectors.isLoading(state())).toEqual(false);
  expect(resetGenSelectors.result(state())).toEqual(246);
  expect(resetGenSelectors.error(state())).toEqual('sad');

  createReduxPack._store?.dispatch(testPackActions.success(123));
  createReduxPack._store?.dispatch(testPackActions.set('asd'));
  createReduxPack._store?.dispatch(testPackActions.run());
  createReduxPack._store?.dispatch(testPackActions.fail('sad'));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(123);
  expect(testPackSelectors.value(state())).toEqual('asd');
  expect(testPackSelectors.error(state())).toEqual('sad');
  expect(errorSelector(state())).toEqual('sad');

  createReduxPack._store?.dispatch(resetGenActions.reset());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(123);
  expect(testPackSelectors.value(state())).toEqual('asd');
  expect(testPackSelectors.error(state())).toEqual('sad');
  expect(resetGenSelectors.isLoading(state())).toEqual(false);
  expect(resetGenSelectors.result(state())).toEqual(null);
  expect(resetGenSelectors.error(state())).toEqual(null);
  expect(errorSelector(state())).toEqual(null);
});

test('check merge by key payload', () => {
  expect(mergeActions).toEqual(withGenPayloadCustomActionsActions);
  expect(mergeSelectors.field(state())).toEqual({});
  expect(mergeSelectors.field2(state())).toEqual({});

  createReduxPack._store?.dispatch(mergeActions.sad.instances.wasd({ field: [{ id: 'asd', value: '1' }] }));
  expect(mergeSelectors.field(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  createReduxPack._store?.dispatch(mergeActions.sad.instances.sad({ field: { id: 'sad', value: '2' } }));
  expect(mergeSelectors.field(state())).toEqual({ asd: { id: 'asd', value: '1' }, sad: { id: 'sad', value: '2' } });

  createReduxPack._store?.dispatch(mergeActions.asd.instances.asd({ id: 'asd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({});
  createReduxPack._store?.dispatch(mergeActions.asd({ id: 'wasd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({ wasd: { id: 'wasd', value: '1' } });

  expect(mergeSelectors.field2.instances.asd(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  createReduxPack._store?.dispatch(mergeActions.asd.instances.asd({ id: 'sad', value: '2' }));
  expect(mergeSelectors.field2.instances.asd(state())).toEqual({
    asd: { id: 'asd', value: '1' },
    sad: { id: 'sad', value: '2' },
  });
  expect(mergeSelectors.field2(state())).toEqual({ wasd: { id: 'wasd', value: '1' } });

  createReduxPack._store?.dispatch(mergeActions.wasd.instances.asd({ id: 'sasd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({
    wasd: { id: 'wasd', value: '1' },
    sasd: { id: 'sasd', value: '1' },
  });

  createReduxPack._store?.dispatch(mergeActions.asd({ id: 'wsad', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({
    wasd: { id: 'wasd', value: '1' },
    sasd: { id: 'sasd', value: '1' },
    wsad: { id: 'wsad', value: '1' },
  });
  expect(mergeSelectors.field2.instances.asd(state())).toEqual({
    asd: { id: 'asd', value: '1' },
    sad: { id: 'sad', value: '2' },
  });
});

test('check merge by key default instanced', () => {
  expect(mergeSelectors.result(state())).toEqual({});
  expect(mergeSelectors.result.instances.a(state())).toEqual({});
  expect(mergeSelectors.result.instances.b(state())).toEqual({});

  createReduxPack._store?.dispatch(mergeActions.success.instances.a({ id: 'asd', value: '1' }));
  createReduxPack._store?.dispatch(mergeActions.success.instances.a({ id: 'asd', value: '1' }));

  expect(mergeSelectors.result(state())).toEqual({});
  expect(mergeSelectors.result.instances.a(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  expect(mergeSelectors.result.instances.b(state())).toEqual({});

  createReduxPack._store?.dispatch(mergeActions.success.instances.b({ id: 'sasd', value: '1' }));
  createReduxPack._store?.dispatch(mergeActions.success.instances.a({ id: 'asd', value: '1' }));

  expect(mergeSelectors.result(state())).toEqual({});
  expect(mergeSelectors.result.instances.a(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  expect(mergeSelectors.result.instances.b(state())).toEqual({ sasd: { id: 'sasd', value: '1' } });

  createReduxPack._store?.dispatch(mergeActions.success({ id: 'sasd', value: '1' }));
  createReduxPack._store?.dispatch(mergeActions.success.instances.b({ id: 'sasd', value: '1' }));
  createReduxPack._store?.dispatch(mergeActions.success.instances.a({ id: 'asd', value: '1' }));

  expect(mergeSelectors.result(state())).toEqual({ sasd: { id: 'sasd', value: '1' } });
  expect(mergeSelectors.result.instances.a(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  expect(mergeSelectors.result.instances.b(state())).toEqual({ sasd: { id: 'sasd', value: '1' } });

  createReduxPack._store?.dispatch(mergeActions.success([{ id: 'asd', value: '1' }]));
  createReduxPack._store?.dispatch(mergeActions.success.instances.b({ id: 'asd', value: '1' }));
  createReduxPack._store?.dispatch(mergeActions.success.instances.a({ id: 'sasd', value: '1' }));

  expect(mergeSelectors.result(state())).toEqual({ sasd: { id: 'sasd', value: '1' }, asd: { id: 'asd', value: '1' } });
  expect(mergeSelectors.result.instances.a(state())).toEqual({
    asd: { id: 'asd', value: '1' },
    sasd: { id: 'sasd', value: '1' },
  });
  expect(mergeSelectors.result.instances.b(state())).toEqual({
    sasd: { id: 'sasd', value: '1' },
    asd: { id: 'asd', value: '1' },
  });

  createReduxPack._store?.dispatch(
    mergeActions.success({
      a1: { id: 'a1', value: '1' },
      sasd: { id: 'sasd', value: '1' },
      a2: { id: 'a3', value: '1' },
    }),
  );
  expect(mergeSelectors.result(state())).toEqual({
    a1: { id: 'a1', value: '1' },
    a3: { id: 'a3', value: '1' },
    sasd: { id: 'sasd', value: '1' },
    asd: { id: 'asd', value: '1' },
  });
});

test('check reset action with instances', () => {
  createReduxPack._store?.dispatch(mergeActions.reset());

  expect(mergeSelectors.result(state())).toEqual({});
  expect(mergeSelectors.result.instances.a(state())).toEqual({});
  expect(mergeSelectors.result.instances.b(state())).toEqual({});
  expect(mergeSelectors.field2(state())).toEqual({});
  expect(mergeSelectors.field2.instances.asd(state())).toEqual({});
  expect(mergeSelectors.field(state())).toEqual({});
  expect(mergeSelectors.field.instances.a(state())).toEqual({});
});

/* eslint-disable @typescript-eslint/ban-ts-comment */
import createReduxPack, {
  configureStore,
  mergeGenerators,
  resetAction,
  requestErrorGen,
  resetActionGen,
} from '../index';

const state = () => createReduxPack._store?.getState();

const packName = 'Request + Simple + Error';
const reducerName = 'TestReducer';
const payloadMap = {
  name: packName,
  reducerName: reducerName,
  defaultInitial: null as any,
  actions: ['extraAction'],
};
const { selectors: testPackSelectors, actions: testPackActions } = createReduxPack(payloadMap).withGenerator(
  mergeGenerators(requestErrorGen, createReduxPack._generators.simple),
);

const { selectors: resetGenSelectors, actions: resetGenActions, errorSelector } = createReduxPack({
  name: packName,
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
// }).withGenerator(mergeGenerators(requestErrorGen, resetActionGen));

const { selectors: mergeSelectors, actions: mergeActions } = createReduxPack({
  name: packName,
  reducerName: reducerName,
  actions: ['sad', 'asd'],
  payloadMap: {
    field: {
      actions: ['sad'],
      initial: {} as { [key: string]: { id: string; value: string } },
      mergeByKey: 'id',
    },
    field2: {
      actions: ['asd'],
      initial: {} as { [key: string]: { id: string; value: string } },
      mergeByKey: 'id',
      formatMergePayload: (a: { id: string; value: string }) => a,
    },
  },
});

test('check default gens merge', () => {
  configureStore();
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
  expect(mergeSelectors.field(state())).toEqual({});
  expect(mergeSelectors.field2(state())).toEqual({});

  createReduxPack._store?.dispatch(mergeActions.sad({ field: [{ id: 'asd', value: '1' }] }));
  expect(mergeSelectors.field(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  createReduxPack._store?.dispatch(mergeActions.sad({ field: { id: 'sad', value: '2' } }));
  expect(mergeSelectors.field(state())).toEqual({ asd: { id: 'asd', value: '1' }, sad: { id: 'sad', value: '2' } });

  createReduxPack._store?.dispatch(mergeActions.asd({ id: 'asd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  createReduxPack._store?.dispatch(mergeActions.asd({ id: 'sad', value: '2' }));
  expect(mergeSelectors.field2(state())).toEqual({ asd: { id: 'asd', value: '1' }, sad: { id: 'sad', value: '2' } });
});

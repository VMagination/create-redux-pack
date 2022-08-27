/* eslint-disable @typescript-eslint/ban-ts-comment */
import { configureStore as configureToolkitStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import createReduxPack, { connectStore, resetAction, requestErrorGen, resetActionGen } from '../index';
import { simpleGen } from './simple';
import { mergableRemoveSymbol } from '../utils/mergePayloadByKey';
import { getNameWithInstance } from '../utils';

const state = () => createReduxPack._store?.getState() as any;

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

const { simpleNameActions } = createReduxPack({
  name: 'simpleName',
  template: 'simple',
  reducerName: 'reducer',
});

const { selectors: resetGenSelectors, multiGenSelectors, actions: resetGenActions, errorSelector } = createReduxPack({
  name: 'multiGen',
  reducerName: reducerName,
  defaultInitial: null as number | null,
  formatPayload: (p: { a: number }) => p.a,
  modifyValue: (val, prevVal) => val + prevVal,
  // actionToValue: (p: { a: number }, prevVal) => p.a + prevVal,
})
  .withGenerator(requestErrorGen)
  .withGenerator(resetActionGen)
  .withGenerator({
    errorSelector: (_info, prevPack) => prevPack.selectors.error,
    reset: (_info, prevPack) => prevPack.actions.reset,
    allActions: (_info, prevPack) => prevPack.actions,
    allSelectors: (_info, prevPack) => prevPack.selectors,
  });

const { checkSelectors, checkActions, checkStateNames } = createReduxPack({
  name: 'check',
  reducerName: reducerName,
  defaultInitial: null,
  actions: ['secondary'],
  payloadMap: {
    value: {
      initial: [] as number[],
    },
    value2: {
      actions: ['secondary'],
      initial: {} as Record<string, string>,
    },
  },
});

const { checkMActions } = createReduxPack({
  name: 'checkM',
  reducerName: reducerName,
  defaultInitial: [] as number[],
  payloadMap: {
    [checkStateNames.value]: {
      formatPayload: (val: number[]) => val,
      initial: [] as number[],
    },
  },
});

const {
  selectors: mergeSelectors,
  actions: mergeActions,
  withGenPayloadCustomActionsActions,
  withGenPayloadCustomActionsStateNames,
} = createReduxPack({
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

const initialState = {
  myField: null,
  myField1: null,
};

const reducer = (state: any = initialState, action: any) => {
  // console.log({ state, action });
  if (action.type === 'customAction') {
    return { ...state, myField: action.data };
  }
  if (action.type === 'customAction1') {
    return { ...state, myField1: action.data };
  }
  // console.log({ state });
  return state;
};

test('check default gens merge and store connection', () => {
  const store = configureToolkitStore({
    // @ts-ignore
    reducer: combineReducers({ default: reducer, badReducer: false }),
  });
  console.warn = jest.fn();
  // @ts-ignore
  connectStore(store);
  expect(console.warn).toBeCalled();
  // @ts-ignore
  connectStore(store, { default: reducer, badReducer: false });
  expect(createReduxPack._store).toEqual(store);
  expect(createReduxPack._initialState).toMatchObject({
    default: initialState,
  });
  expect(state().default.myField).toEqual(null);
  expect(state().default.myField1).toEqual(null);

  createReduxPack._store?.dispatch({ type: 'customAction1', data: 'asd' } as any);
  expect(state().default.myField).toEqual(null);
  expect(state().default.myField1).toEqual('asd');

  expect(testPackSelectors).toEqual(requestSimpleErrorSelectors);
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual(null);
  expect(testPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.set('asd1'));
  expect(state().default.myField).toEqual(null);
  expect(state().default.myField1).toEqual('asd');
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

  expect(state().default.myField).toEqual(null);
  expect(state().default.myField1).toEqual('asd');

  createReduxPack._store?.dispatch({ type: 'customAction', data: 123 } as any);
  expect(state().default.myField).toEqual(123);
  expect(state().default.myField1).toEqual('asd');

  createReduxPack._store?.dispatch(resetAction());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
  expect(testPackSelectors.value(state())).toEqual(null);
  expect(testPackSelectors.error(state())).toEqual(null);

  expect(state().default.myField).toEqual(null);
  expect(state().default.myField1).toEqual(null);

  expect(testPackActions.extraAction).toBeDefined();
});

test('Simple gen without actions', () => {
  expect(Object.keys(simpleNameActions)).toEqual(['set', 'reset']);
});

test('check forced value reset', () => {
  expect(checkSelectors.value(state())).toEqual([]);
  createReduxPack._store?.dispatch(checkActions.success({ value: [1, 2, 3] }));
  expect(checkSelectors.value(state())).toEqual([1, 2, 3]);
  createReduxPack._store?.dispatch(checkActions.success({ value: [] }));
  expect(checkSelectors.value(state())).toEqual([]);
  createReduxPack._store?.dispatch(checkMActions.success([2]));
  expect(checkSelectors.value(state())).toEqual([2]);
  createReduxPack._store?.dispatch(checkMActions.success([]));
  expect(checkSelectors.value(state())).toEqual([]);

  expect(checkSelectors.value2(state())).toEqual({});
  createReduxPack._store?.dispatch(checkActions.secondary({ value2: { a: '1', b: '2' } }));
  expect(checkSelectors.value2(state())).toEqual({ a: '1', b: '2' });
  createReduxPack._store?.dispatch(checkActions.secondary({ value2: {} }));
  expect(checkSelectors.value2(state())).toEqual({});
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
  expect(state()[reducerName][getNameWithInstance(withGenPayloadCustomActionsStateNames.field2, 'asd')]).toEqual(
    undefined,
  );

  createReduxPack._store?.dispatch(mergeActions.sad.instances.wasd({ field: [{ id: 'asd', value: '1' }] }));
  expect(mergeSelectors.field(state())).toEqual({ asd: { id: 'asd', value: '1' } });
  createReduxPack._store?.dispatch(mergeActions.sad.instances.sad({ field: { id: 'sad', value: '2' } }));
  createReduxPack._store?.dispatch(
    mergeActions.sad.instances.sad({
      field: {
        wasd: {
          id: 'wasd',
          value: '3',
        },
      },
    }),
  );
  expect(mergeSelectors.field(state())).toEqual({
    asd: { id: 'asd', value: '1' },
    sad: { id: 'sad', value: '2' },
    wasd: { id: 'wasd', value: '3' },
  });
  createReduxPack._store?.dispatch(
    mergeActions.sad.instances.sad({
      field: {
        wasd: mergableRemoveSymbol,
      },
    }),
  );
  expect(mergeSelectors.field(state())).toEqual({
    asd: { id: 'asd', value: '1' },
    sad: { id: 'sad', value: '2' },
  });

  createReduxPack._store?.dispatch(mergeActions.asd.instances.asd({ id: 'asd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({});
  createReduxPack._store?.dispatch(mergeActions.asd({ id: 'wasd', value: '1' }));
  expect(mergeSelectors.field2(state())).toEqual({ wasd: { id: 'wasd', value: '1' } });

  expect(state()[reducerName][getNameWithInstance(withGenPayloadCustomActionsStateNames.field2, 'asd')]).not.toEqual(
    undefined,
  );
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
  expect(state()[reducerName][getNameWithInstance(withGenPayloadCustomActionsStateNames.field2, 'asd')]).toEqual(
    undefined,
  );
  expect(mergeSelectors.field2.instances.asd(state())).toEqual({});
  expect(mergeSelectors.field(state())).toEqual({});
  expect(mergeSelectors.field.instances.a(state())).toEqual({});

  const { asdSelectors } = createReduxPack({ name: 'asd', reducerName });
  expect(asdSelectors.isLoading(state())).toEqual(false);
});

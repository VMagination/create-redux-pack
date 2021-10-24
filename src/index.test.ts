/* eslint-disable @typescript-eslint/ban-ts-comment */
import createReduxPack, {
  resetAction,
  requestErrorGen,
  disableLogger,
  enableLogger,
  configureStore,
  createReducerOn,
  createAction,
  createSelector,
  createReducerCase,
  mergeGenerators,
  makeKeysReadable,
} from './index';
import { mergePayloadByKey } from './utils/mergePayloadByKey';

const state = (): any => createReduxPack._store?.getState();

test('pack exists', () => {
  expect(createReduxPack).toBeDefined();
});

test('check logger toggle', () => {
  disableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(false);
  enableLogger();
  enableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(true);
  enableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(true);
  disableLogger();
  disableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(false);
  disableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(false);
});

test('check id generator disabling', () => {
  expect(createReduxPack._idGeneration).toEqual(true);
  createReduxPack.setDefaultIdGeneration(true);
  expect(createReduxPack._idGeneration).toEqual(true);
  createReduxPack.setDefaultIdGeneration(false);
  expect(createReduxPack._idGeneration).toEqual(false);
  createReduxPack.setDefaultIdGeneration(true);
  expect(createReduxPack._idGeneration).toEqual(true);
});

const packName = 'TestPack';
const reducerName = 'TestReducer';
const {
  initialState: testPackInitial,
  name: testPackName,
  testPackSelectors,
  testPackStateNames,
  testPackActions,
  // @ts-ignore
  notRealNameActions,
  actions: testPackActions2,
  testPackActionNames,
  testPackReducer,
} = createReduxPack({
  name: packName,
  reducerName: reducerName,
  defaultInitial: null as any,
  actions: ['extraAction'],
});
const uniqueName = testPackName;

const {
  initialState: payloadPackInitial,
  selectors: payloadPackSelectors,
  stateNames: payloadPackStateNames,
  actions: payloadPackActions,
} = createReduxPack({
  name: 'PackWithPayload',
  actions: ['setError'],
  reducerName: reducerName + 3,
  payloadMap: {
    error: {
      formatPayload: (payload: string) => payload,
      actions: ['fail', 'setError'],
      initial: null as null | string,
    },
    item1: {
      actions: ['success', 'run'],
      formatPayload: (payload: { passedItem1: string } | void) => payload?.passedItem1 ?? null,
      modifyValue: (val, _prevVal, { code, getStateWithSelector }) => {
        getStateWithSelector(payloadPackSelectors.item2);
        getStateWithSelector(modifyPackSelectors.result);
        return code === 'success' ? val : null;
      },
      initial: null as null | string,
    },
    item2: {
      initial: { a: 1 },
      formatPayload: (payload) => payload?.item2,
      formatSelector: (val) => ({ b: val.a }),
      fallback: { a: 10 },
    },
    item3: {
      innerItem1: {
        formatPayload: (payload) => payload?.innerItem1,
        initial: '3.1',
      },
      innerItem2: {
        formatPayload: (payload) => payload?.wha,
        initial: '3.2',
      },
    },
    item4: {
      innerItem1: {
        innerInnerItem1: {
          initial: '4.1.1',
          formatPayload: (payload) => payload?.keyForItem4?.sad,
          fallback: null,
        },
      },
    },
  },
});

const {
  selectors: modifyPackSelectors,
  stateNames: modifyPackStateNames,
  actions: modifyPackActions,
} = createReduxPack({
  name: 'PackWithPayload + modify',
  reducerName: reducerName + 3,
  payloadMap: {
    [payloadPackStateNames.item1]: {
      formatPayload: (payload) => payload?.passedItem1,
      initial: payloadPackInitial[payloadPackStateNames.item1],
      modifyValue: (passedItem, prevValue) => prevValue + passedItem,
    },
  },
}).withGenerator(requestErrorGen);

const {
  initialState: genPackInitial,
  name: genPackName,
  selectors: genPackSelectors,
  stateNames: genPackStateNames,
  actions: genPackActions,
  actionNames: genPackActionNames,
  reducer: genPackReducer,
  newParam: genPackNew,
} = createReduxPack({
  name: 'PackWithGenerator',
  idGeneration: false,
  reducerName: reducerName + 4,
  defaultInitial: [],
}).withGenerator(
  mergeGenerators(
    {
      initialState: ({ name }) => ({
        [name + 'Flag']: false,
      }),
      stateNames: ({ name }) => ({
        flag: name + 'Flag',
      }),
      actionNames: ({ name }) => ({
        reset: name + 'Reset',
      }),
      actions: ({ name }) => ({
        reset: createAction(name + 'Reset'),
      }),
      reducer: ({ name }) => ({
        [createReduxPack.getRunName(name)]: createReducerCase((state) => ({
          ...state, // its here for warn test
          [createReduxPack.getLoadingName(name)]: false,
          somethingCool: 'right here',
        })),
        [name + 'Reset']: createReducerCase(() => ({
          [createReduxPack.getResultName(name)]: [],
          [name + 'Flag']: true,
        })),
      }),
      selectors: ({ reducerName, name }) => ({
        flag: createSelector(reducerName, name + 'Flag'),
      }),
      newParam: () => ({
        anything: 'here',
      }),
    },
    {
      reducer: ({ name }) => ({
        [createReduxPack.getRunName(name)]: () => ({
          somethingElse: 'as cool',
        }),
      }),
      initialState: () => ({
        somethingElse: 'not cool',
        somethingCool: 'not quite',
      }),
    },
  ),
);

const {
  selectors: simplePackSelectors,
  stateNames: simplePackStateNames,
  actions: simplePackActions,
  actionNames: simplePackActionNames,
} = createReduxPack({
  name: 'simplePack',
  reducerName: reducerName + 5,
  defaultInitial: -10,
  template: 'simple',
  actions: ['extraAction'],
  payloadMap: {
    counter: {
      formatPayload: (val: number | void) => val || 0,
      initial: 0 as number,
      fallback: 0,
      modifyValue: (val, prevValue) => {
        return (prevValue || 0) + (val || 0);
      },
    },
    setter: {
      ofValue: {
        formatPayload: (val: number) => val,
        initial: 0,
        fallback: 420,
      },
    },
    extraField: {
      actions: ['extraAction'],
      formatPayload: (val: number) => val,
      modifyValue: (v, pV) => v + pV,
      initial: 0,
    },
  },
});

test('check name change and generations', () => {
  expect(packName).not.toEqual(uniqueName);
  expect(uniqueName).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getSuccessName(uniqueName));
  expect(createReduxPack.getSuccessName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getResultName(uniqueName));
  expect(createReduxPack.getResultName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getFailName(uniqueName));
  expect(createReduxPack.getFailName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getLoadingName(uniqueName));
  expect(createReduxPack.getLoadingName(uniqueName)).toContain(packName);
});

test('check package actionNames', () => {
  expect(testPackActionNames.success).toEqual(createReduxPack.getSuccessName(uniqueName));
  expect(testPackActionNames.extraAction).toBeDefined();
  expect(testPackActionNames.success).not.toEqual(testPackActionNames.run);
  expect(testPackActionNames.success).not.toEqual(testPackActionNames.fail);
  expect(testPackActionNames.fail).toEqual(createReduxPack.getFailName(uniqueName));
  expect(testPackActionNames.fail).not.toEqual(testPackActionNames.run);
  expect(testPackActionNames.fail).not.toEqual(testPackActionNames.success);
});

test('check package stateNames', () => {
  expect(testPackStateNames.result).toEqual(createReduxPack.getResultName(uniqueName));
  expect(testPackStateNames.isLoading).toEqual(createReduxPack.getLoadingName(uniqueName));
  expect(testPackStateNames.result).not.toEqual(testPackStateNames.isLoading);
});

test('check package actions', () => {
  expect(notRealNameActions).toEqual(undefined);
  expect(testPackActions2).toEqual(testPackActions);
  expect(testPackActions.run()).toEqual({ type: createReduxPack.getRunName(uniqueName), payload: undefined });
  expect(testPackActions.extraAction()).toEqual({
    type: createReduxPack.getActionName(uniqueName, 'extraAction'),
    payload: undefined,
  });
  expect(testPackActions.success({ b: 2 })).toEqual({
    type: createReduxPack.getSuccessName(uniqueName),
    payload: { b: 2 },
  });
  expect(testPackActions.fail()).toEqual({ type: createReduxPack.getFailName(uniqueName), payload: undefined });
});

test('check package initialState', () => {
  expect(testPackInitial).toEqual({
    [testPackStateNames.result]: null,
    [testPackStateNames.isLoading]: false,
  });
});

test('check package selectors', () => {
  expect(testPackSelectors.result).toBeDefined();
  expect(testPackSelectors.isLoading).toBeDefined();
});

test('check package reducer', () => {
  expect(testPackReducer[testPackActionNames.run]).toBeDefined();
  expect(testPackReducer[testPackActionNames.success]).toBeDefined();
  expect(testPackReducer[testPackActionNames.fail]).toBeDefined();
});

test('check package instances', () => {
  expect(testPackSelectors.isLoading.instances).toBeDefined();
  expect(testPackSelectors.isLoading.instances.instance1).toBeDefined();
  expect(testPackActions.run.instances).toBeDefined();
  expect(testPackActions.run.instances.instance1).toBeDefined();
});

let store;

test('check store configuration', () => {
  expect(createReduxPack._store).toEqual(null);
  expect(
    (() => {
      store = configureStore();
      return store;
    })(),
  ).toBeDefined();
  expect(createReduxPack._store).toBeTruthy();
  expect(createReduxPack._store?.getState()).toBeDefined();
  expect(createReduxPack._store?.getState()).toEqual({
    [reducerName]: {
      [testPackStateNames.isLoading]: false,
      [testPackStateNames.result]: null,
    },
    [reducerName + 3]: {
      [modifyPackStateNames.isLoading]: false,
      [modifyPackStateNames.result]: null,
      [modifyPackStateNames.error]: null,
      [payloadPackStateNames.isLoading]: false,
      [payloadPackStateNames.error]: null,
      [payloadPackStateNames.result]: null,
      [payloadPackStateNames.item1]: null,
      [payloadPackStateNames.item2]: { a: 1 },
      [payloadPackStateNames.item3]: {
        [payloadPackStateNames.item3.innerItem1]: '3.1',
        [payloadPackStateNames.item3.innerItem2]: '3.2',
      },
      [payloadPackStateNames.item4]: {
        [payloadPackStateNames.item4.innerItem1]: {
          [payloadPackStateNames.item4.innerItem1.innerInnerItem1]: '4.1.1',
        },
      },
    },
    [reducerName + 4]: {
      [genPackStateNames.isLoading]: false,
      [genPackStateNames.result]: [],
      [genPackStateNames.flag]: false,
      somethingCool: 'not quite',
      somethingElse: 'not cool',
    },
    [reducerName + 5]: {
      [simplePackStateNames.value]: -10,
      [simplePackStateNames.extraField]: 0,
      [simplePackStateNames.counter]: 0,
      [simplePackStateNames.setter]: {
        [simplePackStateNames.setter.ofValue]: 0,
      },
    },
  });
});

test('check store manipulations', () => {
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.success({ nothing: 'here' }));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack._store?.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack._store?.dispatch(testPackActions.fail());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  const justANumber = 'justANumber';
  createReduxPack.addGlobalReducers({
    [justANumber]: (_s, p, skip) => (typeof p.payload === 'string' ? skip : { ..._s, a: 1 }),
  });
  const savedState = state();

  createReduxPack._store?.dispatch({ type: justANumber, payload: '1' });
  expect(state()).toEqual(savedState);

  createReduxPack._store?.dispatch({ type: justANumber, payload: 2 });
  expect(state().a).toEqual(1);

  createReduxPack._store?.dispatch(resetAction());

  expect(state().a).toEqual(undefined);
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
});

test('check store manipulations \\w instances', () => {
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.run.instances.instance1());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.run.instances.instance2());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store?.dispatch(testPackActions.success.instances.instance2({ i: 2 }));

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual({ i: 2 });

  createReduxPack._store?.dispatch(testPackActions.success({ i: 0 }));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual({ i: 0 });

  createReduxPack._store?.dispatch(testPackActions.run.instances.instance2());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(true);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual({ i: 0 });

  createReduxPack._store?.dispatch(testPackActions.success.instances.instance1({ i: 1 }));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(true);
  expect(testPackSelectors.result(state())).toEqual({ i: 1 });

  createReduxPack._store?.dispatch(testPackActions.success.instances.instance2({ i: 2 }));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual({ i: 2 });

  createReduxPack._store?.dispatch(resetAction());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance1(state())).toEqual(false);
  expect(testPackSelectors.isLoading.instances.instance2(state())).toEqual(false);
  expect(testPackSelectors.result(state())).toEqual(null);
});

test('check pack reducer and initial state injection', async () => {
  expect(Object.keys(createReduxPack._reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(4);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(2);

  createReduxPack({ name: 'AnotherPack', reducerName });

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(7);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(4);

  createReduxPack({ name: 'AnotherPackIntoAnotherReducer', reducerName: reducerName + 1 });

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(5);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(5);
  expect(Object.keys(createReduxPack._reducers[reducerName + 1])).toHaveLength(3);
  expect(Object.keys(createReduxPack._initialState[reducerName + 1])).toHaveLength(2);
});

test('check tool reducer and initial state injection', async () => {
  createReducerOn(
    reducerName,
    { param1: 1, param2: 2, param3: 3 },
    {
      a1: createReducerCase(() => ({
        param1: 1,
        param2: 2,
        param3: 3,
      })),
    },
  );

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(5);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(5);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(8);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(7);

  createReducerOn(
    reducerName + 2,
    { param1: 1, param2: 2, param3: 3 },
    {
      a1: createReducerCase(() => ({
        param1: 1,
        param2: 2,
        param3: 3,
      })),
    },
  );

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(6);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(6);
  expect(Object.keys(createReduxPack._reducers[reducerName + 2])).toHaveLength(1);
  expect(Object.keys(createReduxPack._initialState[reducerName + 2])).toHaveLength(3);
});

test('check pack with payloadMap definitions and recursions', () => {
  expect(payloadPackSelectors.isLoading).toBeDefined();
  expect(payloadPackSelectors.result).toBeDefined();
  expect(payloadPackSelectors.item1).toBeDefined();
  expect(payloadPackSelectors.item2).toBeDefined();
  expect(payloadPackStateNames.isLoading).toBeDefined();
  expect(payloadPackStateNames.result).toBeDefined();
  expect(payloadPackStateNames.item1).toBeDefined();
  expect((payloadPackStateNames as any).passedItem1).not.toBeDefined();
  expect(payloadPackStateNames.item2).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.isLoading]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.result]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item1]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item2]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item3]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item3][payloadPackStateNames.item3.innerItem1]).toBeDefined();

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.result(state())).toEqual(null);
  expect(payloadPackSelectors.item1(state())).toEqual(null);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 1 });
  expect(payloadPackSelectors.item2.a(state())).toEqual(1);
  expect(payloadPackSelectors.item3(state())).toEqual({ innerItem1: '3.1', innerItem2: '3.2' });
  expect(payloadPackSelectors.item3.innerItem1(state())).toEqual('3.1');
  expect(payloadPackSelectors.item3(state()).innerItem1).toEqual('3.1');
  expect(payloadPackSelectors.item3.innerItem1(state())).toEqual('3.1');
  expect(payloadPackSelectors.item4.innerItem1.innerInnerItem1(state())).toEqual('4.1.1');

  expect('b' in payloadPackSelectors.item2).toEqual(false);
  expect(payloadPackSelectors.item2.a(state())).toEqual(1);
  expect(payloadPackSelectors.item2.a === payloadPackSelectors.item2.a).toEqual(true);
  // @ts-ignore
  expect(payloadPackSelectors.item2.b).toBeDefined();
  // @ts-ignore
  expect(payloadPackSelectors.item2.b(state())).toEqual(undefined);
  // @ts-ignore
  expect(payloadPackSelectors.item2.b.c).toBeDefined();
  // @ts-ignore
  expect(payloadPackSelectors.item2.b.c(state())).toEqual(undefined);
  expect('b' in payloadPackSelectors.item2(state())).toEqual(true);
  expect('innerItem1' in payloadPackSelectors.item4).toEqual(true);
  expect('innerItem1' in payloadPackSelectors.item4(state())).toEqual(true);
  expect(payloadPackStateNames.item4.innerItem1 in payloadPackSelectors.item4).toEqual(false);
  expect(payloadPackStateNames.item4.innerItem1 in payloadPackSelectors.item4(state())).toEqual(true);
});

test('check pack with payloadMap state management', () => {
  createReduxPack._store?.dispatch(payloadPackActions.run());

  expect(payloadPackSelectors.isLoading(state())).toEqual(true);
  expect(payloadPackSelectors.result(state())).toEqual(null);
  expect(payloadPackSelectors.item1(state())).toEqual(null);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 1 });

  createReduxPack._store?.dispatch(
    payloadPackActions.success({ passedItem1: 'setItem1', item2: { a: 2 }, innerItem1: '3.1 new' }),
  );

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    innerItem1: '3.1 new',
  });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem1');
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 2 });
  expect(payloadPackSelectors.item3(state())).toEqual({ innerItem1: '3.1 new', innerItem2: undefined });

  createReduxPack._store?.dispatch(payloadPackActions.run());

  expect(payloadPackSelectors.isLoading(state())).toEqual(true);
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    innerItem1: '3.1 new',
  });
  expect(payloadPackSelectors.item1(state())).toEqual(null);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 2 });

  createReduxPack._store?.dispatch(payloadPackActions.success(undefined));

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.result(state())).toEqual(undefined);
  expect(payloadPackSelectors.item1(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 10 });
  expect(payloadPackSelectors.item2.a(state())).toEqual(10);

  createReduxPack._store?.dispatch(payloadPackActions.fail('error1'));

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual('error1');
  expect(payloadPackSelectors.result(state())).toEqual(undefined);
  expect(payloadPackSelectors.item1(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 10 });
  expect(payloadPackSelectors.item2.a(state())).toEqual(10);

  createReduxPack._store?.dispatch(payloadPackActions.setError('errorSet'));

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual('errorSet');
  expect(payloadPackSelectors.result(state())).toEqual(undefined);
  expect(payloadPackSelectors.item1(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 10 });
  expect(payloadPackSelectors.item2.a(state())).toEqual(10);
});

test('check pack with payloadMap modification', () => {
  createReduxPack._store?.dispatch(
    payloadPackActions.success({ passedItem1: 'setItem1', item2: { a: 2 }, keyForItem4: { sad: 1 } }),
  );
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    keyForItem4: { sad: 1 },
  });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem1');
  // expect(modifyPackSelectors[payloadPackStateNames.item4].sad(state())).toEqual('sad');
  expect(payloadPackSelectors.item2(state())).toEqual({ b: 2 });
  expect(modifyPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(modifyPackActions.fail('error'));
  expect(modifyPackSelectors.error(state())).toEqual('error');

  createReduxPack._store?.dispatch(modifyPackActions.run());
  expect(modifyPackSelectors.error(state())).toEqual(null);

  createReduxPack._store?.dispatch(modifyPackActions.fail({ error: true }));
  expect(modifyPackSelectors.error(state())).toEqual(true);

  createReduxPack._store?.dispatch(modifyPackActions.success({ passedItem1: 1 }));

  expect(modifyPackSelectors.isLoading(state())).toEqual(false);
  expect(modifyPackSelectors.result(state())).toEqual({ passedItem1: 1 });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem11');
  expect(modifyPackSelectors.error(state())).toEqual(null);
  // expect(modifyPackSelectors[payloadPackStateNames.item4].sad(state())).toEqual('sad1');
});

test('check pack with generator', () => {
  expect(genPackName).toBeDefined();
  expect(genPackSelectors.isLoading).toBeDefined();
  expect(genPackSelectors.result).toBeDefined();
  expect(genPackSelectors.flag).toBeDefined();
  expect(genPackStateNames.isLoading).toBeDefined();
  expect(genPackStateNames.result).toBeDefined();
  expect(genPackStateNames.flag).toBeDefined();
  expect(genPackInitial[genPackStateNames.isLoading]).toBeDefined();
  expect(genPackInitial[genPackStateNames.result]).toBeDefined();
  expect(genPackInitial[genPackStateNames.flag]).toBeDefined();
  expect(genPackActions.run).toBeDefined();
  expect(genPackActions.success).toBeDefined();
  expect(genPackActions.fail).toBeDefined();
  expect(genPackActions.reset).toBeDefined();
  expect(genPackActionNames.run).toBeDefined();
  expect(genPackActionNames.success).toBeDefined();
  expect(genPackActionNames.fail).toBeDefined();
  expect(genPackActionNames.reset).toBeDefined();
  expect(genPackReducer[genPackActionNames.run]).toBeDefined();
  expect(genPackReducer[genPackActionNames.success]).toBeDefined();
  expect(genPackReducer[genPackActionNames.fail]).toBeDefined();
  expect(genPackReducer[genPackActionNames.reset]).toBeDefined();
  expect(genPackNew.anything).toBeDefined();
  expect(genPackNew.anything).toEqual('here');
});

test('check mergeGenerators', () => {
  // @ts-ignore
  expect(() => mergeGenerators([], null)).toThrowError();

  expect(createSelector(reducerName + 4, 'somethingCool')(state())).toEqual('not quite');
  expect(createSelector(reducerName + 4, 'somethingElse')(state())).toEqual('not cool');
  console.warn = jest.fn();
  createReduxPack._store?.dispatch(genPackActions.run());
  expect(console.warn).toHaveBeenCalled();
  expect(createSelector(reducerName + 4, 'somethingCool')(state())).toEqual('right here');
  expect(createSelector(reducerName + 4, 'somethingElse')(state())).toEqual('as cool');
  expect(genPackSelectors.isLoading(state())).toEqual(false);
});

test('check reducer update freeze', () => {
  createReduxPack.freezeReducerUpdates();
  expect(createReduxPack.preventReducerUpdates).toEqual(true);
  createReduxPack({ reducerName: reducerName + 7, name: 'FreezeCheck' });
  expect(Object.keys(state() as any)).toHaveLength(6);
  createReduxPack.releaseReducerUpdates();
  expect(Object.keys(state() as any)).toHaveLength(7);
  expect(createReduxPack.preventReducerUpdates).toEqual(false);
});

test('check simple template \\w store manipulations', () => {
  expect(simplePackStateNames).toBeDefined();
  expect(simplePackStateNames.value).toBeDefined();
  expect(simplePackStateNames.counter).toBeDefined();
  expect(simplePackStateNames.setter).toBeDefined();
  expect(simplePackStateNames.setter.ofValue).toBeDefined();
  expect(simplePackStateNames.extraField).toBeDefined();
  expect(simplePackActions).toBeDefined();
  expect(simplePackActions.set).toBeDefined();
  expect(simplePackActions.reset).toBeDefined();
  expect(simplePackActions.extraAction).toBeDefined();
  expect(simplePackSelectors.value).toBeDefined();
  expect(simplePackSelectors.counter).toBeDefined();
  expect(simplePackSelectors.setter).toBeDefined();
  expect(simplePackSelectors.setter.ofValue).toBeDefined();
  expect(simplePackSelectors.extraField).toBeDefined();
  expect(simplePackActionNames.set).toBeDefined();
  expect(simplePackActionNames.reset).toBeDefined();
  expect(simplePackActionNames.extraAction).toBeDefined();

  expect(simplePackSelectors.value(state())).toEqual(-10);
  expect(simplePackSelectors.counter(state())).toEqual(0);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 0 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(0);
  expect(simplePackSelectors.extraField(state())).toEqual(0);

  createReduxPack._store?.dispatch(simplePackActions.set(3));

  expect(simplePackSelectors.value(state())).toEqual(3);
  expect(simplePackSelectors.counter(state())).toEqual(3);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 3 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(3);

  createReduxPack._store?.dispatch(simplePackActions.set(5));

  expect(simplePackSelectors.value(state())).toEqual(5);
  expect(simplePackSelectors.counter(state())).toEqual(8);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 5 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(5);

  createReduxPack._store?.dispatch(simplePackActions.set());

  expect(simplePackSelectors.value(state())).toEqual(null);
  expect(simplePackSelectors.counter(state())).toEqual(8);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 420 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(420);

  createReduxPack._store?.dispatch(simplePackActions.set(2));

  expect(simplePackSelectors.value(state())).toEqual(2);
  expect(simplePackSelectors.counter(state())).toEqual(10);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 2 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(2);
  expect(simplePackSelectors.extraField(state())).toEqual(0);
  expect(simplePackSelectors.extraField(state())).toEqual(0);

  createReduxPack._store?.dispatch(simplePackActions.extraAction(123));

  expect(simplePackSelectors.value(state())).toEqual(2);
  expect(simplePackSelectors.counter(state())).toEqual(10);
  expect(simplePackSelectors.counter.instances[1](state())).toEqual(0);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 2 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(2);
  expect(simplePackSelectors.extraField(state())).toEqual(123);

  createReduxPack._store?.dispatch(simplePackActions.extraAction(123));

  expect(simplePackSelectors.extraField(state())).toEqual(246);

  createReduxPack._store?.dispatch(simplePackActions.reset());

  expect(simplePackSelectors.value(state())).toEqual(-10);
  expect(simplePackSelectors.counter(state())).toEqual(0);
  expect(simplePackSelectors.setter(state())).toEqual({ ofValue: 0 });
  expect(simplePackSelectors.setter.ofValue(state())).toEqual(0);
  expect(simplePackSelectors.extraField(state())).toEqual(0);
});

test('check createAction', () => {
  expect(createAction).toBeDefined();
  const action = createAction('text');
  expect(action).toBeDefined();
  expect(action()).toEqual({ type: 'text' });
  expect(action({ a: 1 })).toEqual({ type: 'text', payload: { a: 1 } });
  const actionWithPrepare = createAction('text', ({ a }: { a: number }) => a);
  expect(actionWithPrepare({ a: 1 })).toEqual({ type: 'text', payload: 1 });
});

test('check mergePayloadByKey', () => {
  expect(mergePayloadByKey).toBeDefined();
  expect(
    mergePayloadByKey(
      {},
      [
        { id: 1, f: 1 },
        { id: 2, f: 3 },
      ],
      'id',
    ),
  ).toEqual({ 1: { id: 1, f: 1 }, 2: { id: 2, f: 3 } });
  expect(
    mergePayloadByKey(
      { 1: { id: 1, f: 0 } },
      [
        { id: 1, f: 1 },
        { id: 2, f: 3 },
      ],
      'id',
    ),
  ).toEqual({ 1: { id: 1, f: 1 }, 2: { id: 2, f: 3 } });
  expect(mergePayloadByKey({ 1: { id: 1, f: 0 } }, { id: 3, f: 2 }, 'id')).toEqual({
    1: { id: 1, f: 0 },
    3: { id: 3, f: 2 },
  });
  expect(
    mergePayloadByKey(
      { 1: { id: 1, f: 0 } },
      {
        4: {
          id: 3,
          f: 2,
        },
      },
      'id',
    ),
  ).toEqual({
    1: { id: 1, f: 0 },
    3: { id: 3, f: 2 },
  });
  expect(
    mergePayloadByKey(
      { 1: { id: 1, f: 0 } },
      {
        4: {
          f: 2,
        },
      },
      'id',
    ),
  ).toEqual({
    1: { id: 1, f: 0 },
    4: { f: 2 },
  });
  expect(
    mergePayloadByKey(
      [],
      [
        { id: 1, f: 1 },
        { id: 2, f: 3 },
      ],
      'id',
    ),
  ).toEqual([
    { id: 1, f: 1 },
    { id: 2, f: 3 },
  ]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], [{ id: 2, f: 3 }], 'id')).toEqual([
    { id: 1, f: 1 },
    { id: 2, f: 3 },
  ]);
  expect(
    mergePayloadByKey(
      [{ id: 1, f: 1 }],
      [
        { id: 1, f: 3 },
        { id: 2, f: 2 },
      ],
      'id',
    ),
  ).toEqual([
    { id: 1, f: 3 },
    { id: 2, f: 2 },
  ]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], { id: 2, f: 2 }, 'id')).toEqual([
    { id: 1, f: 1 },
    { id: 2, f: 2 },
  ]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], { id: 1, f: 2 }, 'id')).toEqual([{ id: 1, f: 2 }]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], { f: 2 }, 'id')).toEqual([{ id: 1, f: 1 }, { f: 2 }]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], [{ f: 2 }, { id: 2, f: 3 }, { id: 1, f: 2 }], 'id')).toEqual([
    { f: 2 },
    { id: 2, f: 3 },
    { id: 1, f: 2 },
  ]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], undefined, 'id')).toEqual([{ id: 1, f: 1 }]);
  expect(mergePayloadByKey([{ id: 1, f: 1 }], 123)).toEqual(123);
});

test('check createSelector', () => {
  expect(createSelector).toBeDefined();
  const selectorFromKeys = createSelector(reducerName + 1, createReduxPack.getLoadingName(testPackName));
  const selectorFromFns = createSelector(
    (state) => state[reducerName + 1],
    (state) => state[createReduxPack.getLoadingName(testPackName)],
  );
  expect(selectorFromKeys).toBeDefined();
  expect(selectorFromFns).toBeDefined();
  expect(selectorFromKeys({ [reducerName + 1]: { [createReduxPack.getLoadingName(testPackName)]: 1 } })).toEqual(1);
  expect(selectorFromFns({ [reducerName + 1]: { [createReduxPack.getLoadingName(testPackName)]: 1 } })).toEqual(1);
});

test('check getRootReducer', () => {
  console.log = jest.fn();
  expect(createReduxPack.getRootReducer).toBeDefined();
  enableLogger();
  expect(createReduxPack.getRootReducer()).toBeTruthy();
  expect(console.log).toHaveBeenCalled();
  console.log = jest.fn();
  disableLogger();
  expect(createReduxPack.getRootReducer()).toBeTruthy();
  expect(console.log).not.toHaveBeenCalled();
  expect(
    createReduxPack.getRootReducer(
      {
        [reducerName + 6]: {
          action: () => ({ sad: 1 }),
        },
      },
      {
        [reducerName + 6]: {
          sad: 0,
        },
      },
    ),
  ).toBeTruthy();
  expect(createReduxPack._reducers[reducerName + 6]).toBeDefined();
  expect(createReduxPack._reducers[reducerName + 6].action).toBeDefined();
  expect(Object.keys(createReduxPack._reducers[reducerName + 6])).toHaveLength(1);
  expect(createReduxPack._initialState[reducerName + 6]).toBeDefined();
  expect(createReduxPack._initialState[reducerName + 6].sad).toBeDefined();
  expect(createReduxPack._initialState[reducerName + 6].sad).toEqual(0);
  expect(Object.keys(createReduxPack._initialState[reducerName + 6])).toHaveLength(1);
  expect(
    createReduxPack.getRootReducer(
      {
        [reducerName + 1]: {
          action: () => ({ sad: 1 }),
        },
      },
      {
        [reducerName + 1]: {
          sad: 0,
        },
      },
    ),
  ).toBeTruthy();
  expect(createReduxPack._reducers[reducerName + 1]).toBeDefined();
  expect(createReduxPack._reducers[reducerName + 1].action).toBeDefined();
  expect(Object.keys(createReduxPack._reducers[reducerName + 1])).toHaveLength(4);
  expect(createReduxPack._initialState[reducerName + 1]).toBeDefined();
  expect(createReduxPack._initialState[reducerName + 1].sad).toBeDefined();
  expect(createReduxPack._initialState[reducerName + 1].sad).toEqual(0);
  expect(Object.keys(createReduxPack._initialState[reducerName + 1])).toHaveLength(3);
});

test('check errors and fallbacks', () => {
  // @ts-ignore
  expect(() => createReduxPack().withGenerator()).toThrowError('CRPack received invalid package info');
  // @ts-ignore
  expect(createReduxPack({}).name).toContain('NamelessPack');
  expect(createReduxPack._reducers['UnspecifiedReducer']).toBeDefined();
  expect(makeKeysReadable(1)).toEqual(1);
});

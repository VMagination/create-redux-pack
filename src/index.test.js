import createReduxPack, {
  resetAction,
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

const state = () => createReduxPack._store.getState();

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

const packName = 'TestPack';
const reducerName = 'TestReducer';
const {
  initialState: testPackInitial,
  name: testPackName,
  selectors: testPackSelectors,
  stateNames: testPackStateNames,
  actions: testPackActions,
  actionNames: testPackActionNames,
  reducer: testPackReducer,
} = createReduxPack({ name: packName, reducerName: reducerName });
const uniqueName = testPackName;

const {
  initialState: payloadPackInitial,
  selectors: payloadPackSelectors,
  stateNames: payloadPackStateNames,
  actions: payloadPackActions,
} = createReduxPack({
  name: 'PackWithPayload',
  reducerName: reducerName + 3,
  payloadMap: {
    item1: {
      key: 'passedItem1',
      initial: null,
    },
    item2: {
      initial: { a: 1 },
      fallback: { a: 10 },
    },
    item3: {
      innerItem1: {
        initial: '3.1',
      },
      innerItem2: {
        key: 'wha',
        initial: '3.2',
      },
    },
    item4: {
      innerItem1: {
        innerInnerItem1: {
          initial: '4.1.1',
          key: 'keyForItem4.sad',
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
      key: 'passedItem1',
      initial: payloadPackInitial[payloadPackStateNames.item1],
      modifyValue: (passedItem, prevValue) => prevValue + passedItem,
    },
    [payloadPackStateNames.item4]: {
      sad: {
        key: 'passedItem1',
        initial: 'sad',
        fallback: 'asd',
        modifyValue: (passedItem, prevValue) => prevValue + passedItem,
      },
    },
  },
});

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
  reducerName: reducerName + 4,
  resultInitial: [],
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
        [createReduxPack.getRunName(name)]: createReducerCase(() => ({
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

test('check name change and generations', () => {
  expect(packName).not.toEqual(uniqueName);
  expect(uniqueName).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getSuccessName(uniqueName));
  expect(createReduxPack.getSuccessName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getResultName(uniqueName));
  expect(createReduxPack.getResultName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getErrorName(uniqueName));
  expect(createReduxPack.getErrorName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getFailName(uniqueName));
  expect(createReduxPack.getFailName(uniqueName)).toContain(packName);
  expect(uniqueName).not.toEqual(createReduxPack.getLoadingName(uniqueName));
  expect(createReduxPack.getLoadingName(uniqueName)).toContain(packName);
});

test('check package actionNames', () => {
  expect(testPackActionNames.success).toEqual(createReduxPack.getSuccessName(uniqueName));
  expect(testPackActionNames.success).not.toEqual(testPackActionNames.run);
  expect(testPackActionNames.success).not.toEqual(testPackActionNames.fail);
  expect(testPackActionNames.fail).toEqual(createReduxPack.getFailName(uniqueName));
  expect(testPackActionNames.fail).not.toEqual(testPackActionNames.run);
  expect(testPackActionNames.fail).not.toEqual(testPackActionNames.success);
});

test('check package stateNames', () => {
  expect(testPackStateNames.result).toEqual(createReduxPack.getResultName(uniqueName));
  expect(testPackStateNames.isLoading).toEqual(createReduxPack.getLoadingName(uniqueName));
  expect(testPackStateNames.error).toEqual(createReduxPack.getErrorName(uniqueName));
  expect(testPackStateNames.result).not.toEqual(testPackStateNames.isLoading);
  expect(testPackStateNames.result).not.toEqual(testPackStateNames.error);
  expect(testPackStateNames.error).not.toEqual(testPackStateNames.isLoading);
});

test('check package actions', () => {
  expect(testPackActions.run({ a: 1 })).toEqual({ type: createReduxPack.getRunName(uniqueName), payload: { a: 1 } });
  expect(testPackActions.success({ b: 2 })).toEqual({
    type: createReduxPack.getSuccessName(uniqueName),
    payload: { b: 2 },
  });
  expect(testPackActions.fail('error')).toEqual({ type: createReduxPack.getFailName(uniqueName), payload: 'error' });
});

test('check package initialState', () => {
  expect(testPackInitial).toEqual({
    [testPackStateNames.result]: null,
    [testPackStateNames.isLoading]: false,
    [testPackStateNames.error]: null,
  });
});

test('check package selectors', () => {
  expect(testPackSelectors.result).toBeDefined();
  expect(testPackSelectors.error).toBeDefined();
  expect(testPackSelectors.isLoading).toBeDefined();
});

test('check package reducer', () => {
  expect(testPackReducer[testPackActions.run]).toBeDefined();
  expect(testPackReducer[testPackActions.success]).toBeDefined();
  expect(testPackReducer[testPackActions.fail]).toBeDefined();
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
  expect(createReduxPack._store.getState()).toBeDefined();
  expect(createReduxPack._store.getState()).toEqual({
    [reducerName]: {
      [testPackStateNames.error]: null,
      [testPackStateNames.isLoading]: false,
      [testPackStateNames.result]: null,
    },
    [reducerName + 3]: {
      [modifyPackStateNames.error]: null,
      [modifyPackStateNames.isLoading]: false,
      [modifyPackStateNames.result]: null,
      [modifyPackStateNames.result]: null,
      [payloadPackStateNames.error]: null,
      [payloadPackStateNames.isLoading]: false,
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
        [modifyPackStateNames[payloadPackStateNames.item4].sad]: 'sad',
      },
    },
    [reducerName + 4]: {
      [genPackStateNames.error]: null,
      [genPackStateNames.isLoading]: false,
      [genPackStateNames.result]: [],
      [genPackStateNames.flag]: false,
      somethingCool: 'not quite',
      somethingElse: 'not cool',
    },
  });
});

test('check store manipulations', () => {
  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.error(state())).toEqual(null);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.error(state())).toEqual(null);
  expect(testPackSelectors.result(state())).toEqual(null);

  createReduxPack._store.dispatch(testPackActions.success({ nothing: 'here' }));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.error(state())).toEqual(null);
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack._store.dispatch(testPackActions.run());

  expect(testPackSelectors.isLoading(state())).toEqual(true);
  expect(testPackSelectors.error(state())).toEqual(null);
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack._store.dispatch(testPackActions.fail('error'));

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.error(state())).toEqual('error');
  expect(testPackSelectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack._store.dispatch(resetAction());

  expect(testPackSelectors.isLoading(state())).toEqual(false);
  expect(testPackSelectors.error(state())).toEqual(null);
  expect(testPackSelectors.result(state())).toEqual(null);
});

test('check pack reducer and initial state injection', async () => {
  expect(Object.keys(createReduxPack._reducers)).toHaveLength(3);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(3);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(3);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(3);

  createReduxPack({ name: 'AnotherPack', reducerName });

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(3);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(3);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(6);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(6);

  createReduxPack({ name: 'AnotherPackIntoAnotherReducer', reducerName: reducerName + 1 });

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack._reducers[reducerName + 1])).toHaveLength(3);
  expect(Object.keys(createReduxPack._initialState[reducerName + 1])).toHaveLength(3);
});

test('check tool reducer and initial state injection', async () => {
  createReducerOn(
    reducerName,
    { param1: 1, param2: 2, param3: 3 },
    {
      a1: (state) => ({
        ...state,
        param1: 1,
        param2: 2,
        param3: 3,
      }),
    },
  );

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack._reducers[reducerName])).toHaveLength(7);
  expect(Object.keys(createReduxPack._initialState[reducerName])).toHaveLength(9);

  createReducerOn(
    reducerName + 2,
    { param1: 1, param2: 2, param3: 3 },
    {
      a1: (state) => ({
        ...state,
        param1: 1,
        param2: 2,
        param3: 3,
      }),
    },
  );

  expect(Object.keys(createReduxPack._reducers)).toHaveLength(5);
  expect(Object.keys(createReduxPack._initialState)).toHaveLength(5);
  expect(Object.keys(createReduxPack._reducers[reducerName + 2])).toHaveLength(1);
  expect(Object.keys(createReduxPack._initialState[reducerName + 2])).toHaveLength(3);
});

test('check pack with payloadMap definitions and recursions', () => {
  expect(payloadPackSelectors.isLoading).toBeDefined();
  expect(payloadPackSelectors.error).toBeDefined();
  expect(payloadPackSelectors.result).toBeDefined();
  expect(payloadPackSelectors.item1).toBeDefined();
  expect(payloadPackSelectors.item2).toBeDefined();
  expect(payloadPackStateNames.isLoading).toBeDefined();
  expect(payloadPackStateNames.error).toBeDefined();
  expect(payloadPackStateNames.result).toBeDefined();
  expect(payloadPackStateNames.item1).toBeDefined();
  expect(payloadPackStateNames.passedItem1).not.toBeDefined();
  expect(payloadPackStateNames.item2).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.isLoading]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.error]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.result]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item1]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item2]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item3]).toBeDefined();
  expect(payloadPackInitial[payloadPackStateNames.item3][payloadPackStateNames.item3.innerItem1]).toBeDefined();

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual(null);
  expect(payloadPackSelectors.result(state())).toEqual(null);
  expect(payloadPackSelectors.item1(state())).toEqual(null);
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 1 });
  expect(payloadPackSelectors.item2.a(state())).toEqual(1);
  expect(payloadPackSelectors.item3(state())).toEqual({ innerItem1: '3.1', innerItem2: '3.2' });
  expect(payloadPackSelectors.item3(state())[payloadPackStateNames.item3.innerItem1]).toEqual('3.1');
  expect(payloadPackSelectors.item3(state()).innerItem1).toEqual('3.1');
  expect(payloadPackSelectors.item3.innerItem1(state())).toEqual('3.1');
  expect(payloadPackSelectors.item4.innerItem1.innerInnerItem1(state())).toEqual('4.1.1');

  expect('a' in payloadPackSelectors.item2).toEqual(false);
  expect(payloadPackSelectors.item2.a(state())).toEqual(1);
  expect(payloadPackSelectors.item2.a === payloadPackSelectors.item2.a).toEqual(true);
  expect(payloadPackSelectors.item2.b).toBeDefined();
  expect(payloadPackSelectors.item2.b(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2.b.c).toBeDefined();
  expect(payloadPackSelectors.item2.b.c(state())).toEqual(undefined);
  expect('a' in payloadPackSelectors.item2(state())).toEqual(true);
  expect('innerItem1' in payloadPackSelectors.item4).toEqual(true);
  expect('innerItem1' in payloadPackSelectors.item4(state())).toEqual(true);
  expect(payloadPackStateNames.item4.innerItem1 in payloadPackSelectors.item4).toEqual(false);
  expect(payloadPackStateNames.item4.innerItem1 in payloadPackSelectors.item4(state())).toEqual(true);
});

test('check pack with payloadMap state management', () => {
  createReduxPack._store.dispatch(payloadPackActions.run());

  expect(payloadPackSelectors.isLoading(state())).toEqual(true);
  expect(payloadPackSelectors.error(state())).toEqual(null);
  expect(payloadPackSelectors.result(state())).toEqual(null);
  expect(payloadPackSelectors.item1(state())).toEqual(null);
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 1 });

  createReduxPack._store.dispatch(
    payloadPackActions.success({ passedItem1: 'setItem1', item2: { a: 2 }, innerItem1: '3.1 new' }),
  );

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual(null);
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    innerItem1: '3.1 new',
  });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem1');
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 2 });
  expect(payloadPackSelectors.item3(state())).toEqual({ innerItem1: '3.1 new', innerItem2: undefined });

  createReduxPack._store.dispatch(payloadPackActions.run());

  expect(payloadPackSelectors.isLoading(state())).toEqual(true);
  expect(payloadPackSelectors.error(state())).toEqual(null);
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    innerItem1: '3.1 new',
  });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem1');
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 2 });

  createReduxPack._store.dispatch(payloadPackActions.success(undefined));

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual(null);
  expect(payloadPackSelectors.result(state())).toEqual(undefined);
  expect(payloadPackSelectors.item1(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 10 });

  createReduxPack._store.dispatch(payloadPackActions.fail('error1'));

  expect(payloadPackSelectors.isLoading(state())).toEqual(false);
  expect(payloadPackSelectors.error(state())).toEqual('error1');
  expect(payloadPackSelectors.result(state())).toEqual(undefined);
  expect(payloadPackSelectors.item1(state())).toEqual(undefined);
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 10 });
});

test('check pack with payloadMap modification', () => {
  createReduxPack._store.dispatch(
    payloadPackActions.success({ passedItem1: 'setItem1', item2: { a: 2 }, keyForItem4: { sad: 1 } }),
  );
  expect(payloadPackSelectors.result(state())).toEqual({
    passedItem1: 'setItem1',
    item2: { a: 2 },
    keyForItem4: { sad: 1 },
  });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem1');
  expect(modifyPackSelectors[payloadPackStateNames.item4].sad(state())).toEqual('sad');
  expect(payloadPackSelectors.item2(state())).toEqual({ a: 2 });

  createReduxPack._store.dispatch(modifyPackActions.success({ passedItem1: 1 }));

  expect(modifyPackSelectors.isLoading(state())).toEqual(false);
  expect(modifyPackSelectors.error(state())).toEqual(null);
  expect(modifyPackSelectors.result(state())).toEqual({ passedItem1: 1 });
  expect(payloadPackSelectors.item1(state())).toEqual('setItem11');
  expect(modifyPackSelectors[payloadPackStateNames.item4].sad(state())).toEqual('sad1');
});

test('check pack with generator', () => {
  expect(genPackName).toBeDefined();
  expect(genPackSelectors.isLoading).toBeDefined();
  expect(genPackSelectors.error).toBeDefined();
  expect(genPackSelectors.result).toBeDefined();
  expect(genPackSelectors.flag).toBeDefined();
  expect(genPackStateNames.isLoading).toBeDefined();
  expect(genPackStateNames.error).toBeDefined();
  expect(genPackStateNames.result).toBeDefined();
  expect(genPackStateNames.flag).toBeDefined();
  expect(genPackInitial[genPackStateNames.isLoading]).toBeDefined();
  expect(genPackInitial[genPackStateNames.error]).toBeDefined();
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
  expect(() => mergeGenerators([], null)).toThrowError();

  expect(createSelector(reducerName + 4, 'somethingCool')(state())).toEqual('not quite');
  expect(createSelector(reducerName + 4, 'somethingElse')(state())).toEqual('not cool');
  console.warn = jest.fn();
  createReduxPack._store.dispatch(genPackActions.run());
  expect(console.warn).toHaveBeenCalled();
  expect(createSelector(reducerName + 4, 'somethingCool')(state())).toEqual('right here');
  expect(createSelector(reducerName + 4, 'somethingElse')(state())).toEqual('as cool');
  expect(genPackSelectors.isLoading(state())).toEqual(false);
});

test('check reducer update freeze', () => {
  createReduxPack.freezeReducerUpdates();
  expect(createReduxPack.preventReducerUpdates).toEqual(true);
  createReduxPack({ reducerName: reducerName + 5, name: 'FreezeCheck' });
  expect(Object.keys(state())).toHaveLength(5);
  createReduxPack.releaseReducerUpdates();
  expect(Object.keys(state())).toHaveLength(6);
  expect(createReduxPack.preventReducerUpdates).toEqual(false);
});

test('check createAction', () => {
  expect(createAction).toBeDefined();
  const action = createAction('text');
  expect(action).toBeDefined();
  expect(action()).toEqual({ type: 'text' });
  expect(action({ a: 1 })).toEqual({ type: 'text', payload: { a: 1 } });
  const actionWithPrepare = createAction('text', ({ a }) => a);
  expect(actionWithPrepare({ a: 1 })).toEqual({ type: 'text', payload: 1 });
});

test('check createSelector', () => {
  expect(createSelector).toBeDefined();
  const selector = createSelector(reducerName + 1, createReduxPack.getLoadingName(testPackName));
  expect(selector).toBeDefined();
  expect(selector({ [reducerName + 1]: { [createReduxPack.getLoadingName(testPackName)]: 1 } })).toEqual(1);
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
  expect(Object.keys(createReduxPack._initialState[reducerName + 1])).toHaveLength(4);
});

test('check errors and fallbacks', () => {
  expect(() => createReduxPack().withGenerator()).toThrowError('CRPack received invalid package info');
  expect(createReduxPack({}).name).toContain('NamelessPack');
  expect(createReduxPack._reducers['UnspecifiedReducer']).toBeDefined();
  expect(makeKeysReadable(1)).toEqual(1);
});

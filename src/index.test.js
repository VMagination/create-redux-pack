import createReduxPack, {
  disableLogger,
  enableLogger,
  configureStore,
  createReducerOn,
  createAction,
  createSelector,
} from './index';

test('pack exists', () => {
  expect(createReduxPack).toBeDefined();
});

test('check logger enables', () => {
  expect(createReduxPack.isLoggerOn).toEqual(false);
  enableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(true);
});

test('check logger disables', () => {
  enableLogger();
  disableLogger();
  expect(createReduxPack.isLoggerOn).toEqual(false);
});

const packName = 'TestPack';
const reducerName = 'TestReducer';
const testPack = createReduxPack({ name: packName, reducerName: reducerName });
const uniqueName = testPack.name;

const packWithPayload = createReduxPack({
  name: 'PackWithPayload',
  reducerName: reducerName + 3,
  payloadMap: {
    item1: {
      key: 'passedItem1',
      initial: null,
    },
    item2: {
      key: 'passedItem2',
      initial: { a: 0 },
      fallback: { a: 10 },
      formatSelector: (item) => item.a,
    },
  },
});

const packWithGenerator = createReduxPack.withGenerator(
  {
    name: 'PackWithGenerator',
    reducerName: reducerName + 4,
    resultInitial: [],
  },
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
      [name + 'Reset']: (state) => ({
        ...state,
        [createReduxPack.getResultName(name)]: [],
        [name + 'Flag']: true,
      }),
    }),
    selectors: ({ reducerName, name }) => ({
      flag: createSelector(reducerName, name + 'Flag'),
    }),
    newParam: () => ({
      anything: 'here',
    }),
  },
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
  expect(testPack.actionNames.success).toEqual(createReduxPack.getSuccessName(uniqueName));
  expect(testPack.actionNames.success).not.toEqual(testPack.actionNames.run);
  expect(testPack.actionNames.success).not.toEqual(testPack.actionNames.fail);
  expect(testPack.actionNames.fail).toEqual(createReduxPack.getFailName(uniqueName));
  expect(testPack.actionNames.fail).not.toEqual(testPack.actionNames.run);
  expect(testPack.actionNames.fail).not.toEqual(testPack.actionNames.success);
});

test('check package stateNames', () => {
  expect(testPack.stateNames.result).toEqual(createReduxPack.getResultName(uniqueName));
  expect(testPack.stateNames.isLoading).toEqual(createReduxPack.getLoadingName(uniqueName));
  expect(testPack.stateNames.error).toEqual(createReduxPack.getErrorName(uniqueName));
  expect(testPack.stateNames.result).not.toEqual(testPack.stateNames.isLoading);
  expect(testPack.stateNames.result).not.toEqual(testPack.stateNames.error);
  expect(testPack.stateNames.error).not.toEqual(testPack.stateNames.isLoading);
});

test('check package actions', () => {
  expect(testPack.actions.run({ a: 1 })).toEqual({ type: uniqueName, payload: { a: 1 } });
  expect(testPack.actions.success({ b: 2 })).toEqual({
    type: createReduxPack.getSuccessName(uniqueName),
    payload: { b: 2 },
  });
  expect(testPack.actions.fail('error')).toEqual({ type: createReduxPack.getFailName(uniqueName), payload: 'error' });
});

test('check package initialState', () => {
  expect(testPack.initialState).toEqual({
    [testPack.stateNames.result]: null,
    [testPack.stateNames.isLoading]: false,
    [testPack.stateNames.error]: null,
  });
});

test('check package selectors', () => {
  expect(testPack.selectors.result).toBeDefined();
  expect(testPack.selectors.error).toBeDefined();
  expect(testPack.selectors.isLoading).toBeDefined();
});

test('check package reducer', () => {
  expect(testPack.reducer[testPack.actions.run]).toBeDefined();
  expect(testPack.reducer[testPack.actions.success]).toBeDefined();
  expect(testPack.reducer[testPack.actions.fail]).toBeDefined();
});

let store;

test('check store configuration', () => {
  expect(createReduxPack.store).toEqual(null);
  expect(
    (() => {
      store = configureStore();
      return store;
    })(),
  ).toBeDefined();
  expect(createReduxPack.store).toBeTruthy();
  expect(createReduxPack.store.getState()).toBeDefined();
  expect(createReduxPack.store.getState()).toEqual({
    [reducerName]: {
      [testPack.stateNames.error]: null,
      [testPack.stateNames.isLoading]: false,
      [testPack.stateNames.result]: null,
    },
    [reducerName + 3]: {
      [packWithPayload.stateNames.error]: null,
      [packWithPayload.stateNames.isLoading]: false,
      [packWithPayload.stateNames.result]: null,
      [packWithPayload.stateNames.item1]: null,
      [packWithPayload.stateNames.item2]: { a: 0 },
    },
    [reducerName + 4]: {
      [packWithGenerator.stateNames.error]: null,
      [packWithGenerator.stateNames.isLoading]: false,
      [packWithGenerator.stateNames.result]: [],
      [packWithGenerator.stateNames.flag]: false,
    },
  });
});

test('check store manipulations', () => {
  const state = () => createReduxPack.store.getState();

  expect(testPack.selectors.isLoading(state())).toEqual(false);
  expect(testPack.selectors.error(state())).toEqual(null);
  expect(testPack.selectors.result(state())).toEqual(null);

  createReduxPack.store.dispatch(testPack.actions.run());

  expect(testPack.selectors.isLoading(state())).toEqual(true);
  expect(testPack.selectors.error(state())).toEqual(null);
  expect(testPack.selectors.result(state())).toEqual(null);

  createReduxPack.store.dispatch(testPack.actions.success({ nothing: 'here' }));

  expect(testPack.selectors.isLoading(state())).toEqual(false);
  expect(testPack.selectors.error(state())).toEqual(null);
  expect(testPack.selectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack.store.dispatch(testPack.actions.run());

  expect(testPack.selectors.isLoading(state())).toEqual(true);
  expect(testPack.selectors.error(state())).toEqual(null);
  expect(testPack.selectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack.store.dispatch(testPack.actions.fail('error'));

  expect(testPack.selectors.isLoading(state())).toEqual(false);
  expect(testPack.selectors.error(state())).toEqual('error');
  expect(testPack.selectors.result(state())).toEqual({ nothing: 'here' });

  createReduxPack.store.dispatch(createReduxPack.resetAction());

  expect(testPack.selectors.isLoading(state())).toEqual(false);
  expect(testPack.selectors.error(state())).toEqual(null);
  expect(testPack.selectors.result(state())).toEqual(null);
});

test('check pack reducer and initial state injection', async () => {
  expect(Object.keys(createReduxPack.reducers)).toHaveLength(3);
  expect(Object.keys(createReduxPack.initialState)).toHaveLength(3);
  expect(Object.keys(createReduxPack.reducers[reducerName])).toHaveLength(3);
  expect(Object.keys(createReduxPack.initialState[reducerName])).toHaveLength(3);

  createReduxPack({ name: 'AnotherPack', reducerName });

  expect(Object.keys(createReduxPack.reducers)).toHaveLength(3);
  expect(Object.keys(createReduxPack.initialState)).toHaveLength(3);
  expect(Object.keys(createReduxPack.reducers[reducerName])).toHaveLength(6);
  expect(Object.keys(createReduxPack.initialState[reducerName])).toHaveLength(6);

  createReduxPack({ name: 'AnotherPackIntoAnotherReducer', reducerName: reducerName + 1 });

  expect(Object.keys(createReduxPack.reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack.initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack.reducers[reducerName + 1])).toHaveLength(3);
  expect(Object.keys(createReduxPack.initialState[reducerName + 1])).toHaveLength(3);
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

  expect(Object.keys(createReduxPack.reducers)).toHaveLength(4);
  expect(Object.keys(createReduxPack.initialState)).toHaveLength(4);
  expect(Object.keys(createReduxPack.reducers[reducerName])).toHaveLength(7);
  expect(Object.keys(createReduxPack.initialState[reducerName])).toHaveLength(9);

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

  expect(Object.keys(createReduxPack.reducers)).toHaveLength(5);
  expect(Object.keys(createReduxPack.initialState)).toHaveLength(5);
  expect(Object.keys(createReduxPack.reducers[reducerName + 2])).toHaveLength(1);
  expect(Object.keys(createReduxPack.initialState[reducerName + 2])).toHaveLength(3);
});

test('check pack with payloadMap', () => {
  const state = () => createReduxPack.store.getState();

  expect(packWithPayload.selectors.isLoading).toBeDefined();
  expect(packWithPayload.selectors.error).toBeDefined();
  expect(packWithPayload.selectors.result).toBeDefined();
  expect(packWithPayload.selectors.item1).toBeDefined();
  expect(packWithPayload.selectors.item2).toBeDefined();
  expect(packWithPayload.stateNames.isLoading).toBeDefined();
  expect(packWithPayload.stateNames.error).toBeDefined();
  expect(packWithPayload.stateNames.result).toBeDefined();
  expect(packWithPayload.stateNames.item1).toBeDefined();
  expect(packWithPayload.stateNames.passedItem1).not.toBeDefined();
  expect(packWithPayload.stateNames.item2).toBeDefined();
  expect(packWithPayload.stateNames.passedItem2).not.toBeDefined();
  expect(packWithPayload.initialState[packWithPayload.stateNames.isLoading]).toBeDefined();
  expect(packWithPayload.initialState[packWithPayload.stateNames.error]).toBeDefined();
  expect(packWithPayload.initialState[packWithPayload.stateNames.result]).toBeDefined();
  expect(packWithPayload.initialState[packWithPayload.stateNames.item1]).toBeDefined();
  expect(packWithPayload.initialState[packWithPayload.stateNames.item2]).toBeDefined();

  expect(packWithPayload.selectors.isLoading(state())).toEqual(false);
  expect(packWithPayload.selectors.error(state())).toEqual(null);
  expect(packWithPayload.selectors.result(state())).toEqual(null);
  expect(packWithPayload.selectors.item1(state())).toEqual(null);
  expect(packWithPayload.selectors.item2(state())).toEqual(0);

  createReduxPack.store.dispatch(packWithPayload.actions.run());

  expect(packWithPayload.selectors.isLoading(state())).toEqual(true);
  expect(packWithPayload.selectors.error(state())).toEqual(null);
  expect(packWithPayload.selectors.result(state())).toEqual(null);
  expect(packWithPayload.selectors.item1(state())).toEqual(null);
  expect(packWithPayload.selectors.item2(state())).toEqual(0);

  createReduxPack.store.dispatch(packWithPayload.actions.success({ passedItem1: 'setItem1', passedItem2: { a: 2 } }));

  expect(packWithPayload.selectors.isLoading(state())).toEqual(false);
  expect(packWithPayload.selectors.error(state())).toEqual(null);
  expect(packWithPayload.selectors.result(state())).toEqual({ passedItem1: 'setItem1', passedItem2: { a: 2 } });
  expect(packWithPayload.selectors.item1(state())).toEqual('setItem1');
  expect(packWithPayload.selectors.item2(state())).toEqual(2);

  createReduxPack.store.dispatch(packWithPayload.actions.run());

  expect(packWithPayload.selectors.isLoading(state())).toEqual(true);
  expect(packWithPayload.selectors.error(state())).toEqual(null);
  expect(packWithPayload.selectors.result(state())).toEqual({ passedItem1: 'setItem1', passedItem2: { a: 2 } });
  expect(packWithPayload.selectors.item1(state())).toEqual('setItem1');
  expect(packWithPayload.selectors.item2(state())).toEqual(2);

  createReduxPack.store.dispatch(packWithPayload.actions.success(undefined));

  expect(packWithPayload.selectors.isLoading(state())).toEqual(false);
  expect(packWithPayload.selectors.error(state())).toEqual(null);
  expect(packWithPayload.selectors.result(state())).toEqual(undefined);
  expect(packWithPayload.selectors.item1(state())).toEqual(undefined);
  expect(packWithPayload.selectors.item2(state())).toEqual(10);

  createReduxPack.store.dispatch(packWithPayload.actions.fail('error1'));

  expect(packWithPayload.selectors.isLoading(state())).toEqual(false);
  expect(packWithPayload.selectors.error(state())).toEqual('error1');
  expect(packWithPayload.selectors.result(state())).toEqual(undefined);
  expect(packWithPayload.selectors.item1(state())).toEqual(undefined);
  expect(packWithPayload.selectors.item2(state())).toEqual(10);
});

test('check pack with generator', () => {
  // const state = () => createReduxPack.store.getState();

  expect(packWithGenerator.name).toBeDefined();
  expect(packWithGenerator.selectors.isLoading).toBeDefined();
  expect(packWithGenerator.selectors.error).toBeDefined();
  expect(packWithGenerator.selectors.result).toBeDefined();
  expect(packWithGenerator.selectors.flag).toBeDefined();
  expect(packWithGenerator.stateNames.isLoading).toBeDefined();
  expect(packWithGenerator.stateNames.error).toBeDefined();
  expect(packWithGenerator.stateNames.result).toBeDefined();
  expect(packWithGenerator.stateNames.flag).toBeDefined();
  expect(packWithGenerator.initialState[packWithGenerator.stateNames.isLoading]).toBeDefined();
  expect(packWithGenerator.initialState[packWithGenerator.stateNames.error]).toBeDefined();
  expect(packWithGenerator.initialState[packWithGenerator.stateNames.result]).toBeDefined();
  expect(packWithGenerator.initialState[packWithGenerator.stateNames.flag]).toBeDefined();
  expect(packWithGenerator.actions.run).toBeDefined();
  expect(packWithGenerator.actions.success).toBeDefined();
  expect(packWithGenerator.actions.fail).toBeDefined();
  expect(packWithGenerator.actions.reset).toBeDefined();
  expect(packWithGenerator.actionNames.run).toBeDefined();
  expect(packWithGenerator.actionNames.success).toBeDefined();
  expect(packWithGenerator.actionNames.fail).toBeDefined();
  expect(packWithGenerator.actionNames.reset).toBeDefined();
  expect(packWithGenerator.reducer[packWithGenerator.actionNames.run]).toBeDefined();
  expect(packWithGenerator.reducer[packWithGenerator.actionNames.success]).toBeDefined();
  expect(packWithGenerator.reducer[packWithGenerator.actionNames.fail]).toBeDefined();
  expect(packWithGenerator.reducer[packWithGenerator.actionNames.reset]).toBeDefined();
  expect(packWithGenerator.newParam.anything).toBeDefined();
  expect(packWithGenerator.newParam.anything).toEqual('here');
});

test('check reducer update freeze', () => {
  const state = () => createReduxPack.store.getState();

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
  const selector = createSelector(reducerName + 1, createReduxPack.getLoadingName(testPack.name));
  expect(selector).toBeDefined();
  expect(selector({ [reducerName + 1]: { [createReduxPack.getLoadingName(testPack.name)]: 1 } })).toEqual(1);
});

test('check getRootReducer', () => {
  expect(createReduxPack.getRootReducer).toBeDefined();
  enableLogger();
  expect(createReduxPack.getRootReducer()).toBeTruthy();
  disableLogger();
  expect(createReduxPack.getRootReducer()).toBeTruthy();
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
  expect(createReduxPack.reducers[reducerName + 6]).toBeDefined();
  expect(createReduxPack.reducers[reducerName + 6].action).toBeDefined();
  expect(Object.keys(createReduxPack.reducers[reducerName + 6])).toHaveLength(1);
  expect(createReduxPack.initialState[reducerName + 6]).toBeDefined();
  expect(createReduxPack.initialState[reducerName + 6].sad).toBeDefined();
  expect(createReduxPack.initialState[reducerName + 6].sad).toEqual(0);
  expect(Object.keys(createReduxPack.initialState[reducerName + 6])).toHaveLength(1);
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
  expect(createReduxPack.reducers[reducerName + 1]).toBeDefined();
  expect(createReduxPack.reducers[reducerName + 1].action).toBeDefined();
  expect(Object.keys(createReduxPack.reducers[reducerName + 1])).toHaveLength(4);
  expect(createReduxPack.initialState[reducerName + 1]).toBeDefined();
  expect(createReduxPack.initialState[reducerName + 1].sad).toBeDefined();
  expect(createReduxPack.initialState[reducerName + 1].sad).toEqual(0);
  expect(Object.keys(createReduxPack.initialState[reducerName + 1])).toHaveLength(4);
});

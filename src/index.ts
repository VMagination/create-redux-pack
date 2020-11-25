import {
  AnyAction,
  configureStore as configureStoreToolkit,
  createAction as createToolkitAction,
  createReducer,
} from '@reduxjs/toolkit';
import {
  Action,
  CreateReduxPackAction,
  CreateReduxPackActionMap,
  CreateReduxPackActionNames,
  CreateReduxPackActions,
  CreateReduxPackCombinedGenerators,
  CreateReduxPackFn,
  CreateReduxPackGenerator,
  CreateReduxPackInitialState,
  CreateReduxPackParams,
  CreateReduxPackPayloadMap,
  CreateReduxPackReducer,
  CreateReduxPackSelectors,
  CreateReduxPackStateNames,
  CreateReduxPackType,
} from './types';
import { combineReducers, Reducer } from 'redux';
import { createSelector as createReSelector, OutputSelector } from 'reselect';

const RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';

const getSuccessName = (name: string) => `${name}Success`;
const getFailName = (name: string) => `${name}Fail`;
const getLoadingName = (name: string) => `is${name}Loading`;
const getResultName = (name: string) => `${name}Result`;
const getErrorName = (name: string) => `${name}Error`;
const getKeyName = (name: string, key: string) => `${name}_${key}`;
const loggerMatcher: any = () => true;

const formatParams = <S = Record<string, any>, PayloadMain = Record<string, any>>({
  name: paramsName,
  ...params
}: CreateReduxPackParams<S, PayloadMain>): CreateReduxPackParams<S, PayloadMain> => {
  const name = `${paramsName}_${Math.random().toString(36).substr(2, 9)}`;
  return { name, ...params };
};

const createReduxPack: CreateReduxPackFn & CreateReduxPackType = Object.assign(
  <S = Record<string, any>, PayloadRun = void, PayloadMain = Record<string, any>>(
    infoRaw: CreateReduxPackParams<S, PayloadMain>,
  ) => {
    const info = formatParams(infoRaw);
    const { reducerName } = info;

    const generatedReducerPart = createReduxPack.generator.reducer<S, PayloadMain, PayloadRun>(info);
    const generatedInitialStatePart = createReduxPack.generator.initialState<S, PayloadMain, PayloadRun>(info);

    createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);

    /*return Object.keys(createReduxPack.generator).reduce(
      (accum, key) => ({ ...accum, [key]: createReduxPack.generator[key]<S, PayloadMain, PayloadRun>(info) }),
      {} as { [P in keyof typeof createReduxPack.generator]: ReturnType<CreateReduxPackGeneratorBlock> },
    );*/

    return {
      name: info.name,
      stateNames: createReduxPack.generator.stateNames<S, PayloadMain, CreateReduxPackStateNames<S>>(info),
      actionNames: createReduxPack.generator.actionNames<S, PayloadMain, CreateReduxPackActionNames>(info),
      actions: createReduxPack.generator.actions<S, PayloadMain, CreateReduxPackActions<S, PayloadRun, PayloadMain>>(
        info,
      ),
      selectors: createReduxPack.generator.selectors<S, PayloadMain, CreateReduxPackSelectors<S>>(info),
      initialState: createReduxPack.generator.initialState<S, PayloadMain, CreateReduxPackInitialState>(info),
      reducer: createReduxPack.generator.reducer<S, PayloadMain, CreateReduxPackReducer<PayloadMain, PayloadRun>>(info),
    };
  },
  {
    reducers: {},
    initialState: {},
    isLoggerOn: false,
    getRootReducer: (
      reducers: Parameters<CreateReduxPackType['getRootReducer']>[0],
      initialState: Parameters<CreateReduxPackType['getRootReducer']>[1],
    ) => {
      const combinedObjects = Object.keys(reducers || {}).reduce(
        (accum, key) =>
          ({
            ...accum,
            ...(accum[key] ? { [key]: { ...accum[key], ...(reducers || {})[key] } } : { [key]: (reducers || {})[key] }),
          } as any),
        createReduxPack.reducers,
      );
      createReduxPack.reducers = combinedObjects;
      const combinedReducers = Object.keys(combinedObjects).reduce(
        (accum, key) => {
          const initial =
            initialState && initialState[key]
              ? { ...createReduxPack.initialState[key], ...initialState[key] }
              : createReduxPack.initialState[key];
          createReduxPack.initialState[key] = initial;
          return {
            ...accum,
            [key]: createReducer(initial, combinedObjects[key]),
          };
        },
        (createReduxPack.isLoggerOn
          ? {
              __Create_Redux_Pack_Logger__: createReducer({}, {}, [
                {
                  matcher: loggerMatcher,
                  reducer: (state, action) => {
                    console.log(`CRPack_Logger: ${action.type}`, { payload: action.payload });
                    return { ...state };
                  },
                },
              ]),
            }
          : {}) as Record<string, Reducer>,
      );
      return (state: any, action: AnyAction) => {
        if (action.type === RESET_ACTION_TYPE) return createReduxPack.initialState;
        return combineReducers(combinedReducers)(state, action);
      };
    },
    resetAction: createToolkitAction(RESET_ACTION_TYPE),
    withGenerator: <S, PayloadRun, PayloadMain, Gen = Record<string, any>>(
      infoRaw: CreateReduxPackParams<S, PayloadMain>,
      generator: {
        [P in Exclude<keyof Gen, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
      },
    ): {
      [P in keyof CreateReduxPackCombinedGenerators<
        Gen,
        S,
        PayloadRun,
        PayloadMain
      >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>[P];
    } => {
      const info = formatParams(infoRaw);
      const { reducerName } = info;

      const combinedKeys = Object.keys({
        ...createReduxPack.generator,
        ...generator,
      }); /* as PrevReturnType<S, PayloadRun, PayloadMain> & Required<typeof generator>;*/

      const pack = combinedKeys.reduce(
        (accum, key) => {
          const currentGen = createReduxPack.generator[key as keyof CreateReduxPackGenerator];
          const appendedGen = generator[key as Exclude<keyof Gen, 'name'>];
          return {
            ...accum,
            [key]: {
              ...(currentGen ? currentGen<S, PayloadMain, ReturnType<typeof currentGen>>(info) : {}),
              ...(appendedGen ? appendedGen(info) : {}),
            },
          };
        },
        {} as {
          [P in keyof CreateReduxPackCombinedGenerators<
            Gen,
            S,
            PayloadRun,
            PayloadMain
          >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>[P];
        },
      );
      createReduxPack.injectReducerInto(reducerName, pack.reducer, pack.initialState);
      return { ...pack, name: info.name };
    },
    updateReducer: () => {
      if (createReduxPack.store && !createReduxPack.preventReducerUpdates) {
        createReduxPack.store.replaceReducer(createReduxPack.getRootReducer());
      }
    },
    injectReducerInto: (
      reducerName: string,
      actionMap: CreateReduxPackActionMap,
      initialState: Record<string, any>,
    ) => {
      createReduxPack.reducers = {
        ...createReduxPack.reducers,
        ...(createReduxPack.reducers[reducerName]
          ? {
              [reducerName]: {
                ...createReduxPack.reducers[reducerName],
                ...actionMap,
              },
            }
          : { [reducerName]: actionMap }),
      } as Record<string, CreateReduxPackReducer>;

      createReduxPack.initialState = {
        ...createReduxPack.initialState,
        ...(createReduxPack.initialState[reducerName]
          ? {
              [reducerName]: {
                ...createReduxPack.initialState[reducerName],
                ...initialState,
              },
            }
          : { [reducerName]: initialState }),
      };

      createReduxPack.updateReducer();
    },
    preventReducerUpdates: false,
    freezeReducerUpdates: () => {
      createReduxPack.preventReducerUpdates = true;
    },
    releaseReducerUpdates: () => {
      createReduxPack.preventReducerUpdates = false;
      createReduxPack.updateReducer();
    },
    store: null,
    generator: {
      actions: <S, PayloadRun, PayloadMain>({ name, formatPayload }: CreateReduxPackParams<S, PayloadMain>) => ({
        run: createToolkitAction(name, (data: PayloadRun) => ({ payload: data })),
        success: createToolkitAction(getSuccessName(name), (data: PayloadMain) => ({
          payload: formatPayload ? formatPayload(data) : data,
        })),
        fail: createToolkitAction(getFailName(name), (data: any) => ({ payload: data })),
      }),
      actionNames: ({ name }) => ({
        run: name,
        success: getSuccessName(name),
        fail: getFailName(name),
      }),
      selectors: <S, PayloadMain>({
        name,
        reducerName,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => {
        const getReducerState = (state: any) => state[reducerName];
        return {
          isLoading: createReSelector<any, any, boolean>(getReducerState, (state) => state[getLoadingName(name)]),
          result: createReSelector<any, any, S>(getReducerState, (state) => state[getResultName(name)]),
          error: createReSelector<any, any, null | string>(getReducerState, (state) => state[getErrorName(name)]),
          ...((Object.keys(payloadMap) as Array<keyof S>).reduce((accum, key) => {
            const format = payloadMap[key]?.formatSelector || ((state): any => state);
            return {
              ...accum,
              [key]: createReSelector<any, any, ReturnType<typeof format>>(getReducerState, (state) =>
                format(state[getKeyName(name, `${key}`)]),
              ),
            };
          }, {}) as {
            [P in keyof S]: OutputSelector<any, S[P], any>;
          }),
        };
      },
      initialState: <S, PayloadMain>({
        name,
        resultInitial = null,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        [getErrorName(name)]: null,
        [getLoadingName(name)]: false,
        [getResultName(name)]: resultInitial,
        ...((Object.keys(payloadMap) as Array<keyof S>).reduce(
          (accum, key) => ({
            ...accum,
            [payloadMap[key]?.modifyValue ? key : getKeyName(name, `${key}`)]: payloadMap[key]?.initial ?? null,
          }),
          {},
        ) as S),
      }),
      stateNames: <S, PayloadMain>({
        name,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        isLoading: getLoadingName(name),
        error: getErrorName(name),
        result: getResultName(name),
        ...(Object.keys(payloadMap).reduce(
          (accum, key) => ({
            ...accum,
            [key]: getKeyName(name, `${key}`),
          }),
          {},
        ) as {
          [P in keyof S]: string;
        }),
      }),
      reducer: <S, PayloadMain, PayloadRun>({
        name,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>): CreateReduxPackReducer<PayloadMain, PayloadRun> => ({
        [name]: (state) => ({
          ...state,
          [getErrorName(name)]: null,
          [getLoadingName(name)]: true,
        }),
        [getSuccessName(name)]: (state, { payload }) => ({
          ...state,
          ...(Object.keys(payloadMap) as Array<keyof S>).reduce(
            (accum, key) => {
              const param = payloadMap[key]?.key;
              const modification = payloadMap[key]?.modifyValue;
              const payloadValue =
                payload && param ? payload[param] ?? payloadMap[key]?.fallback : payloadMap[key]?.fallback;
              return {
                ...accum,
                ...(param
                  ? {
                      [modification ? key : getKeyName(name, `${key}`)]: modification
                        ? modification(payloadValue, state[key as string])
                        : payloadValue,
                    }
                  : {}),
              };
            },
            {
              [getResultName(name)]: payload,
            },
          ),
          [getLoadingName(name)]: false,
        }),
        [getFailName(name)]: (state, action) => ({
          ...state,
          [getErrorName(name)]: action.payload?.error || action.payload,
          [getLoadingName(name)]: false,
        }),
      }),
    } as CreateReduxPackGenerator,
    getSuccessName,
    getFailName,
    getLoadingName,
    getResultName,
    getErrorName,
    getKeyName,
  },
);

const enableLogger = () => {
  if (!createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = true;
    createReduxPack.updateReducer();
  }
};

const disableLogger = () => {
  if (createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = false;
    createReduxPack.updateReducer();
  }
};

const createSelector = <T>(reducerName: string, stateKey: string) =>
  createReSelector<any, any, T>(
    (state) => state[reducerName],
    (state) => state[stateKey],
  );

const createAction = <Payload, Result>(
  name: string,
  formatPayload?: (data: Payload) => Result,
): CreateReduxPackAction<Payload, Result | Payload> =>
  createToolkitAction(name, (data: Payload) => ({
    payload: formatPayload ? formatPayload(data) : data,
  }));

const configureStore: (
  options: Omit<Parameters<typeof configureStoreToolkit>[0], 'reducer'>,
) => ReturnType<typeof configureStoreToolkit> = (options) => {
  const store = configureStoreToolkit({
    ...options,
    reducer: createReduxPack.getRootReducer(),
  });
  createReduxPack.store = store;
  return store;
};

const createReducerOn = <S>(
  reducerName: string,
  initialState: S,
  actionMap: Record<string, (state: S, action: Action<any>) => S>,
): void => {
  /*createReduxPack.reducers = {
    ...createReduxPack.reducers,
    [reducerName]: createReduxPack.reducers[reducerName]
      ? { ...createReduxPack.reducers[reducerName], ...actionMap }
      : { ...actionMap },
  } as typeof createReduxPack.reducers;

  createReduxPack.initialState = {
    ...createReduxPack.initialState,
    [reducerName]: createReduxPack.initialState[reducerName]
      ? { ...createReduxPack.initialState[reducerName], ...initialState }
      : { ...initialState },
  };*/

  createReduxPack.injectReducerInto(reducerName, actionMap, initialState);
};

export { createSelector, createAction, configureStore, enableLogger, disableLogger, createReducerOn };

export default createReduxPack;

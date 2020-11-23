import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import {
  CreateReduxPackAction,
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
import { createSelector, OutputSelector } from 'reselect';

const getSuccessName = (name: string) => `${name}Success`;
const getFailName = (name: string) => `${name}Fail`;
const getLoadingName = (name: string) => `is${name}Loading`;
const getResultName = (name: string) => `${name}Result`;
const getErrorName = (name: string) => `${name}Error`;
const loggerMatcher: any = () => true;

const formatParams = <S = Record<string, any>, PayloadMain = Record<string, any>>({
  name: paramsName,
  ...params
}: CreateReduxPackParams<S, PayloadMain>): CreateReduxPackParams<S, PayloadMain> => {
  const name = `${paramsName}_${Math.random().toString(36).substr(2, 9)}`;
  return { name, ...params };
};

export const createReduxPack: CreateReduxPackFn & CreateReduxPackType = Object.assign(
  <S = Record<string, any>, PayloadRun = void, PayloadMain = Record<string, any>>(
    infoRaw: CreateReduxPackParams<S, PayloadMain>,
  ) => {
    const info = formatParams(infoRaw);
    const { reducerName } = info;

    const generatedReducerPart = createReduxPack.generator.reducers<S, PayloadMain, PayloadRun>(info);
    const generatedInitialStatePart = createReduxPack.generator.initialState<S, PayloadMain, PayloadRun>(info);

    createReduxPack.reducers = {
      ...createReduxPack.reducers,
      ...(createReduxPack.reducers[reducerName]
        ? {
            [reducerName]: {
              ...createReduxPack.reducers[reducerName],
              ...generatedReducerPart,
            },
          }
        : { [reducerName]: generatedReducerPart }),
    } as Record<string, CreateReduxPackReducer>;

    createReduxPack.initialState = {
      ...createReduxPack.initialState,
      ...(createReduxPack.initialState[reducerName]
        ? {
            [reducerName]: {
              ...createReduxPack.initialState[reducerName],
              ...generatedInitialStatePart,
            },
          }
        : { [reducerName]: generatedInitialStatePart }),
    };

    createReduxPack.updateReducer();

    /*return Object.keys(createReduxPack.generator).reduce(
      (accum, key) => ({ ...accum, [key]: createReduxPack.generator[key]<S, PayloadMain, PayloadRun>(info) }),
      {} as { [P in keyof typeof createReduxPack.generator]: ReturnType<CreateReduxPackGeneratorBlock> },
    );*/

    return {
      stateNames: createReduxPack.generator.stateNames<S, PayloadMain, CreateReduxPackStateNames<S>>(info),
      actionNames: createReduxPack.generator.actionNames<S, PayloadMain, CreateReduxPackActionNames>(info),
      actions: createReduxPack.generator.actions<S, PayloadMain, CreateReduxPackActions<S, PayloadRun, PayloadMain>>(
        info,
      ),
      selectors: createReduxPack.generator.selectors<S, PayloadMain, CreateReduxPackSelectors<S>>(info),
      initialState: createReduxPack.generator.initialState<S, PayloadMain, CreateReduxPackInitialState>(info),
      reducer: createReduxPack.generator.reducers<S, PayloadMain, CreateReduxPackReducer<PayloadMain, PayloadRun>>(
        info,
      ),
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
      return combineReducers(combinedReducers);
    },
    useLogger: () => {
      createReduxPack.isLoggerOn = true;
    },
    withGenerator: <S, PayloadRun, PayloadMain, Gen = Record<string, any>>(
      infoRaw: CreateReduxPackParams<S, PayloadMain>,
      generator: {
        [P in keyof Gen]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
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

      const combinedKeys = Object.keys({
        ...createReduxPack.generator,
        ...generator,
      }); /* as PrevReturnType<S, PayloadRun, PayloadMain> & Required<typeof generator>;*/

      return combinedKeys.reduce(
        (accum, key) => {
          const currentGen = createReduxPack.generator[key as keyof CreateReduxPackGenerator];
          const appendedGen = generator[key as keyof Gen];
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
    },
    disableLoggerLive: () => {
      if (!createReduxPack.isLoggerOn) {
        createReduxPack.isLoggerOn = false;
        createReduxPack.updateReducer();
      }
    },
    enableLoggerLive: () => {
      if (createReduxPack.isLoggerOn) {
        createReduxPack.isLoggerOn = false;
        createReduxPack.updateReducer();
      }
    },
    updateReducer: () => {
      if (createReduxPack.store && !createReduxPack.preventReducerUpdates) {
        createReduxPack.store.replaceReducer(createReduxPack.getRootReducer());
      }
    },
    preventReducerUpdates: false,
    freezeReducerUpdates: () => {
      createReduxPack.preventReducerUpdates = true;
    },
    releaseReducerUpdates: () => {
      createReduxPack.preventReducerUpdates = false;
      createReduxPack.updateReducer();
    },
    setStore: (store: Parameters<CreateReduxPackType['setStore']>[0]) => (createReduxPack.store = store),
    configureStore: (options: Parameters<CreateReduxPackType['configureStore']>[0]) => {
      const store = configureStore({
        ...options,
        reducer: createReduxPack.getRootReducer(options.reducer, options.initialState),
      });
      createReduxPack.store = store;
      return store;
    },
    store: null,
    generator: {
      actions: <S, PayloadRun, PayloadMain>({ name, formatPayload }: CreateReduxPackParams<S, PayloadMain>) => ({
        run: createAction(name, (data: PayloadRun) => ({ payload: data })),
        success: createAction(getSuccessName(name), (data: PayloadMain) => ({
          payload: formatPayload ? formatPayload(data) : data,
        })),
        fail: createAction(getFailName(name), (data: any) => ({ payload: data })),
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
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        isLoading: createSelector<any, any, boolean>(
          (state) => state[reducerName],
          (state) => state[getLoadingName(name)],
        ),
        result: createSelector<any, any, S>(
          (state) => state[reducerName],
          (state) => state[getResultName(name)],
        ),
        error: createSelector<any, any, null | string>(
          (state) => state[reducerName],
          (state) => state[getErrorName(name)],
        ),
        ...((Object.keys(payloadMap) as Array<keyof S>).reduce((accum, key) => {
          const format = payloadMap[key]?.formatSelector || ((state): any => state);
          return {
            ...accum,
            [key]: createSelector<any, any, ReturnType<typeof format>>(
              (state) => state[reducerName],
              (state) => (format ? format(state[`${name}${key}`]) : state[`${name}${key}`]),
            ),
          };
        }, {}) as {
          [P in keyof S]: OutputSelector<any, S[P], any>;
        }),
      }),
      initialState: <S, PayloadMain>({
        name,
        resultInitial,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        [getErrorName(name)]: null,
        [getLoadingName(name)]: false,
        [getResultName(name)]: resultInitial,
        ...((Object.keys(payloadMap) as Array<keyof S>).reduce(
          (accum, key) => ({ ...accum, [`${name}${key}`]: payloadMap[key]?.initial ?? null }),
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
            [key]: `${name}${key}`,
          }),
          {},
        ) as {
          [P in keyof S]: string;
        }),
      }),
      reducers: <S, PayloadMain, PayloadRun>({
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
              return {
                ...accum,
                ...(param ? { [`${name}${key}`]: payload[param] ?? payloadMap[key]?.fallback } : {}),
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
    createAction: <Payload, Result>(
      name: string,
      formatPayload?: (data: Payload) => Result,
    ): CreateReduxPackAction<Payload, Result | Payload> =>
      createAction(name, (data: Payload) => ({
        payload: formatPayload ? formatPayload(data) : data,
      })),
    createSelector: <T>(reducerName: string, stateKey: string) =>
      createSelector<any, any, T>(
        (state) => state[reducerName],
        (state) => state[stateKey],
      ),
  },
);

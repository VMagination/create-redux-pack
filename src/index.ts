import { AnyAction, configureStore as configureStoreToolkit, createReducer } from '@reduxjs/toolkit';
import {
  Action,
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
  CreateReduxPackReturnType,
  CreateReduxPackSelectors,
  CreateReduxPackStateNames,
  CreateReduxPackType,
} from './types';
import { combineReducers, Reducer } from 'redux';
import { createSelector as createReSelector, OutputSelector } from 'reselect';
import {
  mergeObjects,
  createAction,
  createReducerCase,
  createSelector,
  mergeGenerators,
  formatParams,
  resetAction,
  hasCRPackName,
  makeKeysReadable,
  addMappedPayloadToState,
  getStateNames,
  getInitial,
  getSelectors,
} from './utils';

const loggerMatcher: any = () => true;

const createReduxPack: CreateReduxPackFn & CreateReduxPackType = Object.assign(
  <S = Record<string, any>, PayloadRun = void, PayloadMain = any>(infoRaw: CreateReduxPackParams<S, PayloadMain>) => {
    const info = formatParams(infoRaw);
    const { reducerName } = info;

    const generatedReducerPart = createReduxPack._generator.reducer<
      S,
      PayloadMain,
      CreateReduxPackReducer<PayloadMain, PayloadRun>
    >(info);
    const generatedInitialStatePart = createReduxPack._generator.initialState<
      S,
      PayloadMain,
      CreateReduxPackInitialState
    >(info);

    createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);

    const pack = {
      name: info.name,
      stateNames: createReduxPack._generator.stateNames<S, PayloadMain, CreateReduxPackStateNames<S>>(info),
      actionNames: createReduxPack._generator.actionNames<S, PayloadMain, CreateReduxPackActionNames>(info),
      actions: createReduxPack._generator.actions<S, PayloadMain, CreateReduxPackActions<S, PayloadRun, PayloadMain>>(
        info,
      ),
      selectors: createReduxPack._generator.selectors<S, PayloadMain, CreateReduxPackSelectors<S>>(info),
      initialState: generatedInitialStatePart,
      reducer: generatedReducerPart,
    };

    return Object.assign(pack, {
      withGenerator: <Gen = Record<string, any>>(
        generator: {
          [P in Exclude<keyof Gen, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
        },
      ) => createReduxPack.withGenerator<S, PayloadRun, PayloadMain, Gen>(info, generator),
    }) as CreateReduxPackReturnType<S, PayloadRun, PayloadMain>;
  },
  {
    _reducers: {},
    _initialState: {},
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
        createReduxPack._reducers,
      );
      createReduxPack._reducers = combinedObjects;
      const combinedReducers = Object.keys(combinedObjects).reduce(
        (accum, key) => {
          const initial =
            initialState && initialState[key]
              ? { ...createReduxPack._initialState[key], ...initialState[key] }
              : createReduxPack._initialState[key];
          createReduxPack._initialState[key] = initial;
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
        if (action.type === resetAction.type) return createReduxPack._initialState;
        return combineReducers(combinedReducers)(state, action);
      };
    },
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
      const mergedGen = mergeGenerators<any, S, PayloadMain>(createReduxPack._generator, generator);
      const pack = {
        ...Object.keys(mergedGen).reduce(
          (accum, key) => ({ ...accum, [key]: mergedGen[key](info) }),
          {} as {
            [P in keyof CreateReduxPackCombinedGenerators<
              Gen,
              S,
              PayloadRun,
              PayloadMain
            >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>[P];
          },
        ),
        name: info.name,
      };

      createReduxPack.injectReducerInto(reducerName, pack.reducer, pack.initialState);
      return pack;
    },
    updateReducer: () => {
      if (createReduxPack._store && !createReduxPack.preventReducerUpdates) {
        createReduxPack._store.replaceReducer(createReduxPack.getRootReducer());
      }
    },
    injectReducerInto: (
      reducerName: string,
      actionMap: CreateReduxPackActionMap,
      initialState: Record<string, any>,
    ) => {
      createReduxPack._reducers = {
        ...createReduxPack._reducers,
        ...(createReduxPack._reducers[reducerName]
          ? {
              [reducerName]: {
                ...createReduxPack._reducers[reducerName],
                ...actionMap,
              },
            }
          : { [reducerName]: actionMap }),
      } as Record<string, CreateReduxPackReducer>;

      createReduxPack._initialState = {
        ...createReduxPack._initialState,
        ...(createReduxPack._initialState[reducerName]
          ? {
              [reducerName]: {
                ...mergeObjects(createReduxPack._initialState[reducerName], initialState),
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
    _store: null,
    _generator: {
      actions: <S, PayloadRun, PayloadMain>({ name, formatPayload }: CreateReduxPackParams<S, PayloadMain>) => ({
        run: createAction<PayloadRun>(createReduxPack.getRunName(name)),
        success: createAction<PayloadMain, S>(createReduxPack.getSuccessName(name), formatPayload),
        fail: createAction<string | ({ error: string } & Record<string, any>)>(createReduxPack.getFailName(name)),
      }),
      actionNames: ({ name }) => ({
        run: createReduxPack.getRunName(name),
        success: createReduxPack.getSuccessName(name),
        fail: createReduxPack.getFailName(name),
      }),
      selectors: <S, PayloadMain>({
        name,
        reducerName,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => {
        const getReducerState = (state: any) => state[reducerName];
        return {
          isLoading: createReSelector<any, any, boolean>(
            getReducerState,
            (state) => state[createReduxPack.getLoadingName(name)],
          ),
          result: createReSelector<any, any, S>(getReducerState, (state) => state[createReduxPack.getResultName(name)]),
          error: createReSelector<any, any, null | string>(
            getReducerState,
            (state) => state[createReduxPack.getErrorName(name)],
          ),
          ...(getSelectors(payloadMap, name, getReducerState) as {
            [P in keyof S]: OutputSelector<any, S[P], any>;
          }),
        };
      },
      initialState: <S, PayloadMain>({
        name,
        resultInitial = null,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        [createReduxPack.getErrorName(name)]: null,
        [createReduxPack.getLoadingName(name)]: false,
        [createReduxPack.getResultName(name)]: resultInitial,
        ...getInitial(payloadMap, name),
      }),
      stateNames: <S, PayloadMain>({
        name,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>) => ({
        isLoading: createReduxPack.getLoadingName(name),
        error: createReduxPack.getErrorName(name),
        result: createReduxPack.getResultName(name),
        ...(getStateNames(payloadMap, name) as {
          [P in keyof S]: string;
        }),
      }),
      reducer: <S, PayloadMain, PayloadRun>({
        name,
        payloadMap = {} as CreateReduxPackPayloadMap<S>,
      }: CreateReduxPackParams<S, PayloadMain>): CreateReduxPackReducer<PayloadMain, PayloadRun> => ({
        [createReduxPack.getRunName(name)]: createReducerCase(() => ({
          [createReduxPack.getErrorName(name)]: null,
          [createReduxPack.getLoadingName(name)]: true,
        })),
        [createReduxPack.getSuccessName(name)]: createReducerCase((state, { payload }) => {
          const newState = {
            [createReduxPack.getLoadingName(name)]: false,
            [createReduxPack.getErrorName(name)]: null,
            [createReduxPack.getResultName(name)]: payload,
          };
          addMappedPayloadToState(newState, payloadMap, name, payload, state);
          return newState;
        }),
        [createReduxPack.getFailName(name)]: createReducerCase((_state, action) => ({
          [createReduxPack.getErrorName(name)]: action.payload?.error || action.payload,
          [createReduxPack.getLoadingName(name)]: false,
        })),
      }),
    } as CreateReduxPackGenerator,
    getRunName: (name: string) => `run ${name}`,
    getSuccessName: (name: string) => `success ${name}`,
    getFailName: (name: string) => `fail ${name}`,
    getLoadingName: (name: string) => `isLoading ${name}`,
    getResultName: (name: string) => `result ${name}`,
    getErrorName: (name: string) => `error ${name}`,
    getKeyName: (name: string, key: string) => (hasCRPackName(key) ? key : `${key} of ${name}`),
  },
);

const enableLogger = (): void => {
  if (!createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = true;
    createReduxPack.updateReducer();
  }
};

const disableLogger = (): void => {
  if (createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = false;
    createReduxPack.updateReducer();
  }
};

const configureStore: (
  options: Omit<Parameters<typeof configureStoreToolkit>[0], 'reducer'>,
) => ReturnType<typeof configureStoreToolkit> = (options) => {
  const store = configureStoreToolkit({
    ...options,
    reducer: createReduxPack.getRootReducer(),
  });
  createReduxPack._store = store;
  return store;
};

const createReducerOn = <S>(
  reducerName: string,
  initialState: S,
  actionMap: Record<string, (state: S, action: Action<any>) => S>,
): void => {
  createReduxPack.injectReducerInto(reducerName || 'UnspecifiedReducer', actionMap || {}, initialState || {});
};

const wasd = createReduxPack({
  name: 'PackWithGenerator',
  reducerName: 'asd' + 4,
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

wasd.name;

export {
  createSelector,
  createAction,
  configureStore,
  enableLogger,
  disableLogger,
  createReducerOn,
  createReducerCase,
  mergeGenerators,
  resetAction,
  makeKeysReadable,
};

export default createReduxPack;

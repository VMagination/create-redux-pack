import { AnyAction, configureStore as configureStoreToolkit, createReducer } from '@reduxjs/toolkit';
import {
  Action,
  CreateReduxPackActionMap,
  CRPackRequestActionNames,
  CRPackRequestActions,
  CreateReduxPackCombinedGenerators,
  CreateReduxPackFn,
  CreateReduxPackGenerator,
  CRPackInitialState,
  CreateReduxPackParams,
  CreateReduxPackPayloadMap,
  CRPackReducer,
  CRPackRequestSelectors,
  CRPackRequestStateNames,
  CreateReduxPackType,
  CRPackPayloadMap,
  CRPackGenObj,
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
  makeKeysReadable,
  addMappedPayloadToState,
  getStateNames,
  getInitial,
  getSelectors,
  getRunName,
  getSuccessName,
  getSetName,
  getResetName,
  getFailName,
  getLoadingName,
  getResultName,
  getValueName,
  getErrorName,
  getKeyName,
  getNameWithInstance,
} from './utils';
import { mergePayloadWithResult } from './utils/mergePayloadWithResult';

const loggerMatcher: any = () => true;

const createReduxPack: CreateReduxPackFn & CreateReduxPackType = Object.assign(
  <
    S = Record<string, any>,
    PayloadRun = void,
    PayloadMain = Record<string, any>,
    PayloadMap extends CRPackPayloadMap<S> = CRPackPayloadMap<S>,
    Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
  >(
    infoRaw: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info,
  ) => {
    const info = formatParams(infoRaw) as any;
    const { reducerName, template = 'request' } = info;
    const templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;

    const generatedReducerPart = templateGen.reducer<S, PayloadMain, CRPackReducer<PayloadMain, PayloadRun>>(info);
    const generatedInitialStatePart = templateGen.initialState<S, PayloadMain, CRPackInitialState>(info);

    createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);

    const pack = {
      name: info.name,
      stateNames: templateGen.stateNames<S, PayloadMain, CRPackRequestStateNames<S>>(info),
      actionNames: templateGen.actionNames<S, PayloadMain, CRPackRequestActionNames>(info),
      actions: templateGen.actions<S, PayloadMain, CRPackRequestActions<S, PayloadRun, PayloadMain>>(info),
      selectors: templateGen.selectors<S, PayloadMain, CRPackRequestSelectors<S>>(info),
      initialState: generatedInitialStatePart,
      reducer: generatedReducerPart,
    };

    return Object.assign(pack, {
      withGenerator: <Gen extends CRPackGenObj<S, PayloadMain, PayloadMap> = CRPackGenObj<S, PayloadMain, PayloadMap>>(
        generator: CRPackGenObj<S, PayloadMain, PayloadMap>,
      ) => createReduxPack.withGenerator<S, PayloadRun, PayloadMain, Gen, PayloadMap, Info>(info, generator),
    }) as any /*CreateReduxPackReturnType<
      S,
      PayloadRun,
      PayloadMain,
      Info['template'] extends 'simple'
        ? CRPackSimpleGen<S, PayloadRun, PayloadMain, PayloadMap>
        : CRPackRequestGen<S, PayloadRun, PayloadMain, PayloadMap>,
      PayloadMap
    >*/;
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
    withGenerator: <
      S,
      PayloadRun,
      PayloadMain,
      Gen = Record<string, any>,
      PayloadMap extends CRPackPayloadMap<S> = CRPackPayloadMap<S>,
      Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
    >(
      infoRaw: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info,
      generator: CRPackGenObj<S, PayloadMain, PayloadMap>,
    ): {
      [P in keyof CreateReduxPackCombinedGenerators<
        Gen,
        S,
        PayloadRun,
        PayloadMain,
        PayloadMap
      >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain, PayloadMap>[P];
    } => {
      const info = formatParams(infoRaw);
      const { reducerName, template = 'request' } = info;
      const templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;
      const mergedGen = mergeGenerators<any, S, PayloadMain, PayloadMap>(templateGen, generator);
      const pack = {
        ...Object.keys(mergedGen).reduce(
          (accum, key) => ({ ...accum, [key]: mergedGen[key](info) }),
          {} as {
            [P in keyof CreateReduxPackCombinedGenerators<
              Gen,
              S,
              PayloadRun,
              PayloadMain,
              PayloadMap
            >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain, PayloadMap>[P];
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
      } as Record<string, CRPackReducer>;

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
    _generators: {
      request: {
        actions: <S, PayloadRun, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          formatPayload,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          run: createAction<PayloadRun>(createReduxPack.getRunName(name)),
          success: createAction<PayloadMain, S>(createReduxPack.getSuccessName(name), formatPayload),
          fail: createAction<string | ({ error: string } & Record<string, any>)>(createReduxPack.getFailName(name)),
        }),
        actionNames: ({ name }) => ({
          run: createReduxPack.getRunName(name),
          success: createReduxPack.getSuccessName(name),
          fail: createReduxPack.getFailName(name),
        }),
        selectors: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          reducerName,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => {
          const getReducerState = (state: any) => state[reducerName];
          return {
            isLoading: Object.assign(
              createReSelector<any, any, boolean>(
                getReducerState,
                (state) => state[createReduxPack.getLoadingName(name)],
              ),
              {
                instances: new Proxy(
                  {},
                  {
                    get: (t, p, s) => {
                      const result = Reflect.get(t, p, s);
                      if (result) return result;
                      if (typeof p !== 'string') return result;
                      Reflect.set(
                        t,
                        p,
                        createReSelector<any, any, boolean>(
                          getReducerState,
                          (state) =>
                            state[createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), p)] ??
                            false,
                        ),
                        s,
                      );
                      return Reflect.get(t, p, s);
                    },
                  },
                ),
              },
            ),
            result: createReSelector<any, any, S>(
              getReducerState,
              (state) => state[createReduxPack.getResultName(name)],
            ),
            error: createReSelector<any, any, null | string>(
              getReducerState,
              (state) => state[createReduxPack.getErrorName(name)],
            ),
            ...(getSelectors(payloadMap, name, getReducerState) as {
              [P in keyof S]: OutputSelector<any, S[P], any>;
            }),
          };
        },
        initialState: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          defaultInitial = null,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          [createReduxPack.getErrorName(name)]: null,
          [createReduxPack.getLoadingName(name)]: false,
          [createReduxPack.getResultName(name)]: defaultInitial,
          ...getInitial(payloadMap, name),
        }),
        stateNames: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          isLoading: createReduxPack.getLoadingName(name),
          error: createReduxPack.getErrorName(name),
          result: createReduxPack.getResultName(name),
          ...(getStateNames(payloadMap, name) as {
            [P in keyof S]: string;
          }),
        }),
        reducer: <S, PayloadMain, PayloadRun, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          mergeByKey,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>): CRPackReducer<PayloadMain, PayloadRun> => ({
          [createReduxPack.getRunName(name)]: createReducerCase((_state, { meta }) => ({
            [createReduxPack.getErrorName(name)]: null,
            [createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta?.instance)]: true,
          })),
          [createReduxPack.getSuccessName(name)]: createReducerCase((state, { payload, meta }) => {
            const newState = {
              [createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta?.instance)]: false,
              [createReduxPack.getErrorName(name)]: null,
              [createReduxPack.getResultName(name)]: mergePayloadWithResult(
                state[createReduxPack.getResultName(name)],
                payload,
                mergeByKey,
              ),
            };
            addMappedPayloadToState(newState, payloadMap, name, payload, state);
            return newState;
          }),
          [createReduxPack.getFailName(name)]: createReducerCase((_state, { payload, meta }) => ({
            [createReduxPack.getErrorName(name)]: (payload?.error || payload) ?? null,
            [createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta?.instance)]: false,
          })),
        }),
      },
      simple: {
        actions: <S, _, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          formatPayload,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          set: createAction<PayloadMain, S>(createReduxPack.getSetName(name), formatPayload),
          reset: createAction<string | ({ error: string } & Record<string, any>)>(createReduxPack.getResetName(name)),
        }),
        actionNames: ({ name }) => ({
          set: createReduxPack.getSetName(name),
          reset: createReduxPack.getResetName(name),
        }),
        selectors: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          reducerName,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => {
          const getReducerState = (state: any) => state[reducerName];
          return {
            value: createReSelector<any, any, S>(getReducerState, (state) => state[createReduxPack.getValueName(name)]),
            ...(getSelectors(payloadMap, name, getReducerState) as {
              [P in keyof S]: OutputSelector<any, S[P], any>;
            }),
          };
        },
        initialState: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          defaultInitial = null,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          [createReduxPack.getValueName(name)]: defaultInitial,
          ...getInitial(payloadMap, name),
        }),
        stateNames: <S, PayloadMain, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>) => ({
          value: createReduxPack.getValueName(name),
          ...(getStateNames(payloadMap, name) as {
            [P in keyof S]: string;
          }),
        }),
        reducer: <S, PayloadMain, PayloadRun, PayloadMap extends CRPackPayloadMap<S>>({
          name,
          mergeByKey,
          defaultInitial = null,
          payloadMap = {} as CreateReduxPackPayloadMap<S, PayloadMap> & PayloadMap,
        }: CreateReduxPackParams<S, PayloadMain, PayloadMap>): CRPackReducer<PayloadMain, PayloadRun> => ({
          [createReduxPack.getSetName(name)]: createReducerCase((state, { payload }) => {
            const newState = {
              [createReduxPack.getValueName(name)]: mergePayloadWithResult(
                state[createReduxPack.getValueName(name)],
                payload,
                mergeByKey,
              ),
            };
            addMappedPayloadToState(newState, payloadMap, name, payload, state);
            return newState;
          }),
          [createReduxPack.getResetName(name)]: createReducerCase(() => ({
            [createReduxPack.getValueName(name)]: defaultInitial,
            ...getInitial(payloadMap, name),
          })),
        }),
      },
    } as Record<string, CreateReduxPackGenerator>,
    getRunName,
    getSuccessName,
    getSetName,
    getResetName,
    getFailName,
    getLoadingName,
    getResultName,
    getValueName,
    getErrorName,
    getKeyName,
    getNameWithInstance,
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

/*
const asd = createReduxPack({
  name: 'PackWithPayload + modify',
  reducerName: 'reducerName' + 3,
  formatPayload: (data: { passedItem1: string | null }) => data,
  payloadMap: {
    item4: {
      formatSelector: ({ sad }) => sad,
      sad: {
        key: 'passedItem1',
        initial: 'sad' as string,
        fallback: null,
      },
    },
  },
});

const a = asd.selectors.isLoading.instances.asd({});
const a1 = asd.actions.run.instances.asd();
*/

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

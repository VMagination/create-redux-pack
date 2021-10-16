import { AnyAction, configureStore as configureStoreToolkit, createReducer } from '@reduxjs/toolkit';
import { Action, CreateReduxPackActionMap, CRPackReducer, CreateReduxPackType, CRPackArbitraryGen } from './types';
import { combineReducers, Reducer } from 'redux';
import {
  mergeObjects,
  createAction,
  createReducerCase,
  createSelector,
  mergeGenerators,
  formatParams,
  resetAction,
  makeKeysReadable,
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
  getActionName,
} from './utils';
import { CRPackFN, CRPackTemplates, Params, CreateReduxPackPayloadMap } from './types';
import { requestDefaultActions, requestGen, simpleDefaultActions, simpleGen } from './generators';
import { requestErrorGen } from './generators/error';
import { resetActionGen } from './generators/reset';

const loggerMatcher: any = () => true;

const cached = Symbol('[CRPack]: cached');
const globalReducerSkip = Symbol('[CRPack]: global reducer skip');

const createReduxPack: CRPackFN & CreateReduxPackType = Object.assign(
  <
    Config extends Params<S, Actions, Template>,
    S = any,
    Actions extends PropertyKey = any,
    Template extends CRPackTemplates = any
  >(
    infoRaw: { payloadMap?: CreateReduxPackPayloadMap<S, Actions, Template> } & Config & {
        actions?: Actions[];
        template?: Template;
      },
  ) => {
    const info = formatParams(infoRaw, createReduxPack._idGeneration) as any;
    const { reducerName, template = 'request' } = info;
    const templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;

    const lazyPack = new Proxy(
      { ...templateGen, [cached]: {} },
      {
        get: (t, p, s) => {
          const val = Reflect.get(t, p, s);
          const saved = Reflect.get(t, cached, s);
          if (p === 'name') return info.name;
          if (templateGen.hasOwnProperty(p)) {
            if (p in saved) {
              return saved[p];
            }
            const result = val(info);
            Reflect.set(t[cached], p, result);
            return result;
          }
          return val;
        },
      },
    ) as any;

    const generatedReducerPart = lazyPack.reducer as any;
    const generatedInitialStatePart = lazyPack.initialState;

    createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);

    return Object.assign(lazyPack, {
      withGenerator: (generator: any) => (createReduxPack as any).withGenerator(info, generator, lazyPack),
    }) as any;
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
                    console.log(`[CRPack_Logger]: %c${action.type}`, 'font-weight: bold', { payload: action.payload });
                    return { ...state };
                  },
                },
              ]),
            }
          : {}) as Record<string, Reducer>,
      );
      return (state: any, action: AnyAction) => {
        if (action.type in (createReduxPack as any)._globalReducers) {
          const result = (createReduxPack as any)._globalReducers[action.type](state, action, globalReducerSkip);
          if (result !== globalReducerSkip) return result;
        }

        if (action.type === resetAction.type) return createReduxPack._initialState;

        return (Object.keys(combinedReducers).length ? combineReducers(combinedReducers) : (state: any) => state)(
          state,
          action,
        );
      };
    },
    _globalReducers: {},
    addGlobalReducers: (actionMap: Record<string, (state: any, action: AnyAction, skip: Symbol) => any>) => {
      const global = (createReduxPack as any)._globalReducers;
      (createReduxPack as any)._globalReducers = { ...global, ...actionMap };
    },
    withGenerator: (info: any, generator: any, originalResult: any, prevGen?: any): any => {
      // const info = formatParams(infoRaw, createReduxPack._idGeneration);
      const { reducerName, template = 'request' } = info;
      const templateGen = prevGen || createReduxPack._generators[template] || createReduxPack._generators.request;
      const mergedGen = mergeGenerators(templateGen, generator);

      const lazyPack = new Proxy(
        { ...mergedGen, [cached]: {} },
        {
          get: (t, p, s) => {
            const val = Reflect.get(t, p, s);
            const saved = Reflect.get(t, cached, s);
            if (p === 'name') return info.name;
            if (mergedGen.hasOwnProperty(p)) {
              if (p in saved) {
                return saved[p];
              }
              const result = val(info, originalResult);
              Reflect.set(t[cached], p, result);
              return result;
            }
            return val;
          },
        },
      );

      createReduxPack.injectReducerInto(reducerName, lazyPack.reducer, lazyPack.initialState);
      return Object.assign(lazyPack, {
        withGenerator: (generator: any) => (createReduxPack as any).withGenerator(info, generator, lazyPack, mergedGen),
      }) as any;
    },
    updateReducer: () => {
      if (createReduxPack._store && !createReduxPack.preventReducerUpdates) {
        createReduxPack._store.replaceReducer(createReduxPack.getRootReducer());
      }
    },
    _idGeneration: true,
    setDefaultIdGeneration: (val: boolean) => {
      createReduxPack._idGeneration = val;
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
      request: requestGen,
      simple: simpleGen,
    } as Record<string, CRPackArbitraryGen>,
    simpleDefaultActions,
    requestDefaultActions,
    getRunName,
    getSuccessName,
    getSetName,
    getResetName,
    getFailName,
    getActionName,
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
  options?: Omit<Parameters<typeof configureStoreToolkit>[0], 'reducer'>,
) => ReturnType<typeof configureStoreToolkit> = (options) => {
  const store = configureStoreToolkit({
    ...(options || {}),
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
  requestErrorGen,
  resetActionGen,
  makeKeysReadable,
};

export default createReduxPack;

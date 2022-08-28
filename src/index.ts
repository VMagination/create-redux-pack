import {
  AnyAction,
  Action,
  CreateReduxPackActionMap,
  CRPackReducer,
  CreateReduxPackType,
  CRPackArbitraryGen,
} from './types';
import { combineReducers, Reducer, Store, createStore as createStoreBase } from 'redux';
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
  getLazyPack,
  createReducer,
  generateId,
  hasCRPackName,
  CRPackRegex,
} from './utils';
import { CRPackFN, CRPackTemplates, Params, CreateReduxPackPayloadMap } from './types';
import { requestDefaultActions, requestGen, simpleDefaultActions, simpleGen } from './generators';
import { requestErrorGen } from './generators/error';
import { resetActionGen } from './generators/reset';
import { mergableRemoveSymbol } from './utils/mergePayloadByKey';
import { generateColorByHash } from './utils/generateColorByHash';

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
    const { reducerName, template = 'request', name } = info;
    createReduxPack._history[reducerName] = { updated: false, [name]: new Date().toISOString() };
    const templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;

    const lazyPack = getLazyPack(templateGen, info);

    const generatedReducerPart = lazyPack.reducer as any;
    const generatedInitialStatePart = lazyPack.initialState;

    createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);

    return Object.assign(lazyPack, {
      withGenerator: (generator: any) => (createReduxPack as any).withGenerator(info, generator, lazyPack),
    }) as any;
  },
  {
    _reducers: {},
    _history: new Proxy(
      {},
      {
        get: (t, p, s) => (p !== 'print' ? Reflect.get(t, p, s) : () => console.log({ CRPackHistory: t })),
        set: (t, p, v, s) => Reflect.set(t, p, { ...Reflect.get(t, p, s), ...v }),
      },
    ) as CreateReduxPackType['_history'],
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
      const markUpdated = new Set<string>();
      const combinedReducers = Object.keys(combinedObjects).reduce((accum, key) => {
        const initial =
          initialState && initialState[key]
            ? { ...createReduxPack._initialState[key], ...initialState[key] }
            : createReduxPack._initialState[key];
        createReduxPack._initialState[key] = initial;
        return {
          ...accum,
          [key]:
            typeof combinedObjects[key] === 'object'
              ? createReducer(initial, combinedObjects[key], (state = initial) => {
                  const reducerHistory = createReduxPack._history[key];
                  if (!reducerHistory?.updated) {
                    markUpdated.add(key);
                    return { ...initial, ...state };
                  }
                  return state;
                })
              : (combinedObjects[key] as any),
        };
      }, {} as Record<string, Reducer>);
      const reducer = Object.keys(combinedReducers).length ? combineReducers(combinedReducers) : (state: any) => state;
      return (state: any, action: AnyAction) => {
        if (action.type in (createReduxPack as any)._globalReducers) {
          const result = (createReduxPack as any)._globalReducers[action.type](state, action, globalReducerSkip);
          if (result !== globalReducerSkip) return result;
        }

        const log = (nextState: any) => {
          if (createReduxPack.isLoggerOn) {
            if (hasCRPackName(action.type)) {
              console.groupCollapsed(
                `[CRPack_Logger]: ${action.type} %cww`,
                `color:transparent;background-color: ${generateColorByHash(
                  action.type?.match?.(CRPackRegex)?.[0] || action.type,
                )}`,
              );
            } else {
              console.groupCollapsed(`[CRPack_Logger]: %c${action.type}`, 'font-weight: bold');
            }
            console.log({ previousState: state });
            console.log({ action });
            console.log({ nextState });
            console.groupEnd();
          }
        };

        if (action.type === resetAction.type) {
          log(createReduxPack._initialState);
          return createReduxPack._initialState;
        }

        const nextState = reducer(state, action);
        if (markUpdated.size) {
          markUpdated.forEach((key) => {
            createReduxPack._history[key] = { updated: new Date().toISOString() };
          });
        }
        log(nextState);
        return nextState;
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

      const lazyPack = getLazyPack(mergedGen, info, originalResult);

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

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;

const createStore: (...args: Parameters<OmitFirstArg<typeof createStoreBase>>) => ReturnType<typeof createStoreBase> = (
  ...args
) => {
  const store = createStoreBase(createReduxPack.getRootReducer(), ...args);
  createReduxPack._store = store;
  return store;
};

const connectStore = (store: Store, reducers: Parameters<typeof combineReducers>[0], initialState?: any) => {
  createReduxPack._store = store;
  if (!reducers) {
    createReduxPack.updateReducer();
    return console.warn(
      "CRPack connectStore didn't receive a reducer, if there are none, please use CRPack's createStore utility instead",
    );
  }
  if (typeof reducers === 'object') {
    const reducerEntries = Object.entries(reducers);
    createReduxPack._reducers = mergeObjects(
      createReduxPack._reducers,
      reducerEntries.reduce(
        (accum, [key, item]) => (typeof item === 'function' ? { ...accum, [key]: item } : accum),
        {},
      ),
    );
    createReduxPack._initialState = mergeObjects(
      createReduxPack._initialState,
      initialState ||
        reducerEntries.reduce(
          (accum, [key, reducer]) =>
            typeof reducer === 'function'
              ? {
                  ...accum,
                  [key]: reducer(undefined, { type: `[CRPack]: init ${generateId(6)}` }),
                }
              : accum,
          {},
        ) ||
        {},
    );
    createReduxPack.updateReducer();
  }
};

const createReducerOn = <S>(
  reducerName: string,
  initialState: S,
  actionMap: Record<string, (state: S, action: Action<any>) => S>,
): void => {
  createReduxPack._history[reducerName] = { updated: false };
  createReduxPack.injectReducerInto(reducerName || 'UnspecifiedReducer', actionMap || {}, initialState || {});
};

export {
  connectStore,
  createSelector,
  createAction,
  createStore,
  enableLogger,
  disableLogger,
  createReducerOn,
  createReducerCase,
  mergeGenerators,
  resetAction,
  requestErrorGen,
  resetActionGen,
  makeKeysReadable,
  mergableRemoveSymbol,
};

export default createReduxPack;

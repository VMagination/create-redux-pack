import { CRPackArbitraryGen, CRPackReducer, Params } from '../types';
import {
  addMappedPayloadToState,
  createAction,
  createReducerCase,
  getActionName,
  getFailName,
  getInitial,
  getLoadingName,
  getNameWithInstance,
  getResultName,
  getRunName,
  getSelectors,
  getStateNames,
  getSuccessName,
} from '../utils';
import { createSelector as createReSelector, OutputSelector } from 'reselect';
import { mergePayloadByKey } from '../utils/mergePayloadByKey';

export const requestDefaultActions = ['run', 'success', 'fail'];

export const requestGen: CRPackArbitraryGen = {
  actions: <Config extends Params>({ name, actions }: Config) => ({
    run: createAction(getRunName(name)),
    success: createAction(getSuccessName(name)),
    fail: createAction(getFailName(name)),
    ...(actions || [])
      .filter((action) => !requestDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [action]: createAction(getActionName(name, action)),
        }),
        {},
      ),
  }),
  actionNames: <Config extends Params>({ name, actions }: Config) => ({
    run: getRunName(name),
    success: getSuccessName(name),
    fail: getFailName(name),
    ...(actions || [])
      .filter((action) => !requestDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [action]: getActionName(name, action),
        }),
        {},
      ),
  }),
  selectors: <Config extends Params>({ name, reducerName, payloadMap = {} }: Config) => {
    const getReducerState = (state: any) => state[reducerName];
    return {
      isLoading: Object.assign(
        createReSelector<any, any, boolean>(getReducerState, (state) => state[getLoadingName(name)]),
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
                    (state) => state[getNameWithInstance(getLoadingName(name), p)] ?? false,
                  ),
                  s,
                );
                return Reflect.get(t, p, s);
              },
            },
          ),
        },
      ),
      result: createReSelector<any, any, Config extends Params<infer S> ? S : never>(
        getReducerState,
        (state) => state[getResultName(name)],
      ),
      ...(getSelectors(payloadMap, name, getReducerState) as {
        [P in keyof (Config extends Params<infer S> ? S : never)]: OutputSelector<
          any,
          (Config extends Params<infer S> ? S : never)[P],
          any
        >;
      }),
    };
  },
  initialState: <Config extends Params>({ name, defaultInitial = null, payloadMap = {} }: Config) => ({
    [getLoadingName(name)]: false,
    [getResultName(name)]: defaultInitial,
    ...getInitial(payloadMap, name),
  }),
  stateNames: <Config extends Params>({ name, payloadMap = {} as any }: Config) => ({
    isLoading: getLoadingName(name),
    result: getResultName(name),
    ...(getStateNames(payloadMap, name) as {
      [P in keyof (Config extends Params<infer S> ? S : never)]: string;
    }),
  }),
  reducer: <Config extends Params>({
    name,
    formatPayload,
    formatMergePayload,
    mergeByKey,
    modifyValue,
    defaultFallback,
    actions,
    payloadMap = {},
  }: Config): CRPackReducer => ({
    ...(actions || [])
      .filter((action) => !requestDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [getActionName(name, action)]: createReducerCase((state, { payload }) => {
            const newState = {};
            addMappedPayloadToState(newState, payloadMap, name, payload, payload, state, action);
            return newState;
          }),
        }),
        {},
      ),
    [getRunName(name)]: createReducerCase((state, { meta, payload }) => {
      const newState = {
        [getNameWithInstance(getLoadingName(name), meta?.instance)]: true,
      };
      addMappedPayloadToState(newState, payloadMap, name, payload, payload, state, 'run');
      return newState;
    }),
    [getSuccessName(name)]: createReducerCase((state, { payload, meta }) => {
      const format = formatPayload || formatMergePayload;
      const finalPayload = (format ? format(payload) : payload) ?? defaultFallback;
      const newState = {
        [getNameWithInstance(getLoadingName(name), meta?.instance)]: false,
        [getResultName(name)]: modifyValue
          ? modifyValue(finalPayload, state[getResultName(name)])
          : mergePayloadByKey(state[getResultName(name)], finalPayload, mergeByKey),
      };
      addMappedPayloadToState(newState, payloadMap, name, payload, payload, state, 'success', true);
      return newState;
    }),
    [getFailName(name)]: createReducerCase((state, { payload, meta }) => {
      const newState = {
        [getNameWithInstance(getLoadingName(name), meta?.instance)]: false,
      };
      addMappedPayloadToState(newState, payloadMap, name, payload, payload, state, 'fail');
      return newState;
    }),
  }),
};

import { CRPackArbitraryGen, CRPackReducer, Params } from '../types';
import {
  addMappedPayloadToState,
  createAction,
  createReducerCase,
  DefaultStateNames,
  getActionName,
  getFailName,
  getInitial,
  getNameWithInstance,
  getRunName,
  getSelectors,
  getStateNames,
  getSuccessName,
} from '../utils';
import { OutputSelector } from 'reselect';
import { mergableRemoveSymbol, mergePayloadByKey } from '../utils/mergePayloadByKey';
import { selectorWithInstances } from '../utils/selectorWithInstances';

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
  selectors: <Config extends Params>({ name, reducerName, payloadMap = {}, defaultInitial }: Config) => {
    const getReducerState = (state: any) => state[reducerName];
    return {
      isLoading: selectorWithInstances(getReducerState, DefaultStateNames.isLoading(name), false),
      result: selectorWithInstances(getReducerState, DefaultStateNames.result(name), defaultInitial),
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
    [DefaultStateNames.isLoading(name)]: false,
    [DefaultStateNames.result(name)]: defaultInitial,
    ...getInitial(payloadMap, name),
  }),
  stateNames: <Config extends Params>({ name, payloadMap = {} as any }: Config) => ({
    isLoading: DefaultStateNames.isLoading(name),
    result: DefaultStateNames.result(name),
    ...(getStateNames(payloadMap, name) as {
      [P in keyof (Config extends Params<infer S> ? S : never)]: string;
    }),
  }),
  reducer: <Config extends Params>({
    name,
    reducerName,
    formatPayload,
    formatMergePayload,
    mergeByKey,
    modifyValue,
    actionToValue,
    defaultFallback,
    defaultInitial,
    defaultInstanced,
    actions,
    payloadMap = {},
  }: Config): CRPackReducer => ({
    ...(actions || [])
      .filter((action) => !requestDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [getActionName(name, action)]: createReducerCase((state, { payload, meta }) => {
            const newState = {};
            addMappedPayloadToState({
              obj: newState,
              payloadMap,
              name,
              payload,
              payloadField: payload,
              state,
              mainState: state,
              reducerName,
              action,
              instance: meta?.instance,
            });
            return newState;
          }),
        }),
        {},
      ),
    [getRunName(name)]: createReducerCase((state, { payload, meta }) => {
      const newState = {
        [getNameWithInstance(DefaultStateNames.isLoading(name), meta?.instance)]: true,
      };
      addMappedPayloadToState({
        obj: newState,
        payloadMap,
        name,
        payload,
        payloadField: payload,
        state,
        mainState: state,
        reducerName,
        action: 'run',
        instance: meta?.instance,
      });
      return newState;
    }),
    [getSuccessName(name)]: createReducerCase((state, { payload, meta }) => {
      const format = formatPayload || formatMergePayload;
      const finalPayload = (format ? format(payload, mergableRemoveSymbol) : payload) ?? defaultFallback;
      const key = getNameWithInstance(DefaultStateNames.result(name), defaultInstanced ? meta?.instance : undefined);
      const modify = actionToValue || modifyValue;
      const newState = {
        [getNameWithInstance(DefaultStateNames.isLoading(name), meta?.instance)]: false,
        [key]: modify
          ? modify(finalPayload, state[key] ?? defaultInitial)
          : mergePayloadByKey(state[key] ?? defaultInitial, finalPayload, mergeByKey),
      };
      addMappedPayloadToState({
        obj: newState,
        payloadMap,
        name,
        payload,
        payloadField: payload,
        state,
        mainState: state,
        reducerName,
        action: 'success',
        isMainAction: true,
        instance: meta?.instance,
      });
      return newState;
    }),
    [getFailName(name)]: createReducerCase((state, { payload, meta }) => {
      const newState = {
        [getNameWithInstance(DefaultStateNames.isLoading(name), meta?.instance)]: false,
      };
      addMappedPayloadToState({
        obj: newState,
        payloadMap,
        name,
        payload,
        payloadField: payload,
        state,
        mainState: state,
        reducerName,
        instance: meta?.instance,
        action: 'fail',
      });
      return newState;
    }),
  }),
};

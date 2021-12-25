import {
  CRPackArbitraryGen,
  CRPackInitialState,
  CRPackReducer,
  CRPackSimpleActionNames,
  CRPackSimpleActions,
  CRPackSimpleSelectors,
  CRPackSimpleStateNames,
  Params,
} from '../types';
import {
  addMappedPayloadToState,
  createAction,
  createReducerCase,
  DefaultStateNames,
  getActionName,
  getInitial,
  getNameWithInstance,
  getResetName,
  getSelectors,
  getSetName,
  getStateNames,
  mergeObjects,
} from '../utils';
import { OutputSelector } from 'reselect';
import { mergableRemoveSymbol, mergePayloadByKey } from '../utils/mergePayloadByKey';
import { selectorWithInstances } from '../utils/selectorWithInstances';

export const simpleDefaultActions = ['set', 'reset'];

export const simpleGen: CRPackArbitraryGen = {
  actions: <Config extends Params>({
    name,
    actions,
  }: Config): CRPackSimpleActions<Config, Config extends Params<unknown, infer Actions> ? Actions : never> => ({
    set: createAction<
      Config extends Params<any, any, any, any, infer Payload> ? Payload : never,
      Config extends Params<infer S> ? S : never
    >(getSetName(name)),
    reset: createAction(getResetName(name)),
    ...(actions || [])
      .filter((action) => !simpleDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [action]: createAction(getActionName(name, action)),
        }),
        {},
      ),
  }),
  actionNames: <Config extends Params>({
    name,
    actions,
  }: Config): CRPackSimpleActionNames<Config extends Params<unknown, infer Actions> ? Actions : never> =>
    ({
      set: getSetName(name),
      reset: getResetName(name),
      ...(actions || [])
        .filter((action) => !simpleDefaultActions.includes(action))
        .reduce(
          (accum, action) => ({
            ...accum,
            [action]: getActionName(name, action),
          }),
          {},
        ),
    } as CRPackSimpleActionNames<Config extends Params<unknown, infer Actions> ? Actions : never>),
  selectors: <Config extends Params>({
    name,
    reducerName,
    payloadMap = {},
    defaultInitial,
  }: Config): CRPackSimpleSelectors<Config> => {
    const getReducerState = (state: any) => state[reducerName];
    return {
      value: selectorWithInstances(getReducerState, DefaultStateNames.value(name), defaultInitial),
      ...(getSelectors(payloadMap, name, getReducerState) as {
        [P in keyof (Config extends Params<infer S> ? S : never)]: OutputSelector<
          any,
          (Config extends Params<infer S> ? S : never)[P],
          any
        >;
      }),
    } as any;
  },
  initialState: <Config extends Params>({
    name,
    defaultInitial = null,
    payloadMap = {},
  }: Config): CRPackInitialState<Config> =>
    ({
      [DefaultStateNames.value(name)]: defaultInitial,
      ...getInitial(payloadMap, name),
    } as CRPackInitialState<Config>),
  stateNames: <Config extends Params>({ name, payloadMap = {} }: Config): CRPackSimpleStateNames<Config> =>
    ({
      value: DefaultStateNames.value(name),
      ...(getStateNames(payloadMap, name) as {
        [P in keyof (Config extends Params<infer S> ? S : never)]: string;
      }),
    } as CRPackSimpleStateNames<Config>),
  reducer: <Config extends Params>({
    name,
    mergeByKey,
    defaultInitial = null,
    defaultFallback = null,
    defaultInstanced,
    formatPayload,
    formatMergePayload,
    actions,
    reducerName,
    modifyValue,
    actionToValue,
    payloadMap = {},
  }: Config): CRPackReducer => ({
    ...(actions || [])
      .filter((action) => !simpleDefaultActions.includes(action))
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
              instance: meta?.instance,
              mainState: state,
              reducerName,
              action,
            });
            return newState;
          }),
        }),
        {},
      ),
    [getSetName(name)]: createReducerCase((state, { payload, meta }) => {
      const format = formatPayload || formatMergePayload;
      const finalPayload = (format ? format(payload, mergableRemoveSymbol) : payload) ?? defaultFallback;
      const key = getNameWithInstance(DefaultStateNames.value(name), defaultInstanced ? meta?.instance : undefined);
      const modify = actionToValue || modifyValue;
      const newState = {
        [key]: modify
          ? modify(payload, state[key] ?? defaultInitial)
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
        instance: meta?.instance,
        action: 'set',
        isMainAction: true,
      });
      return newState;
    }),
    [getResetName(name)]: createReducerCase((state, { payload, meta }) => {
      const key = getNameWithInstance(DefaultStateNames.value(name), defaultInstanced ? meta?.instance : undefined);
      const newState = {
        [key]: defaultInitial,
        ...getInitial(payloadMap, name, meta?.instance, 'reset'),
      };
      const resetWithValue = {};
      addMappedPayloadToState({
        obj: resetWithValue,
        payloadMap,
        name,
        payload,
        payloadField: payload,
        state,
        mainState: state,
        reducerName,
        instance: meta?.instance,
        action: 'reset',
      });
      return mergeObjects(newState, resetWithValue);
    }),
  }),
};

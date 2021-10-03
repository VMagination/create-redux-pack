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
  getActionName,
  getInitial,
  getResetName,
  getSelectors,
  getSetName,
  getStateNames,
  getValueName,
  mergeObjects,
} from '../utils';
import { createSelector as createReSelector, OutputSelector } from 'reselect';
import { mergePayloadByKey } from '../utils/mergePayloadByKey';

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
  selectors: <Config extends Params>({ name, reducerName, payloadMap = {} }: Config): CRPackSimpleSelectors<Config> => {
    const getReducerState = (state: any) => state[reducerName];
    return {
      value: createReSelector<any, any, Config extends Params<infer S> ? S : never>(
        getReducerState,
        (state) => state[getValueName(name)],
      ),
      ...(getSelectors(payloadMap, name, getReducerState) as {
        [P in keyof (Config extends Params<infer S> ? S : never)]: OutputSelector<
          any,
          (Config extends Params<infer S> ? S : never)[P],
          any
        >;
      }),
    } as CRPackSimpleSelectors<Config>;
  },
  initialState: <Config extends Params>({
    name,
    defaultInitial = null,
    payloadMap = {},
  }: Config): CRPackInitialState<Config> =>
    ({
      [getValueName(name)]: defaultInitial,
      ...getInitial(payloadMap, name),
    } as CRPackInitialState<Config>),
  stateNames: <Config extends Params>({ name, payloadMap = {} }: Config): CRPackSimpleStateNames<Config> =>
    ({
      value: getValueName(name),
      ...(getStateNames(payloadMap, name) as {
        [P in keyof (Config extends Params<infer S> ? S : never)]: string;
      }),
    } as CRPackSimpleStateNames<Config>),
  reducer: <Config extends Params>({
    name,
    mergeByKey,
    defaultInitial = null,
    defaultFallback = null,
    formatPayload,
    formatMergePayload,
    actions,
    reducerName,
    modifyValue,
    payloadMap = {},
  }: Config): CRPackReducer => ({
    ...(actions || [])
      .filter((action) => !simpleDefaultActions.includes(action))
      .reduce(
        (accum, action) => ({
          ...accum,
          [getActionName(name, action)]: createReducerCase((state, { payload }) => {
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
            });
            return newState;
          }),
        }),
        {},
      ),
    [getSetName(name)]: createReducerCase((state, { payload }) => {
      const format = formatPayload || formatMergePayload;
      const finalPayload = (format ? format(payload) : payload) ?? defaultFallback;
      const newState = {
        [getValueName(name)]: modifyValue
          ? modifyValue(payload, state[getValueName(name)])
          : mergePayloadByKey(state[getValueName(name)], finalPayload, mergeByKey),
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
        action: 'set',
        isMainAction: true,
      });
      return newState;
    }),
    [getResetName(name)]: createReducerCase((state, { payload }) => {
      const newState = {
        [getValueName(name)]: defaultInitial,
        ...getInitial(payloadMap, name),
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
        action: 'reset',
      });
      return mergeObjects(newState, resetWithValue);
    }),
  }),
};

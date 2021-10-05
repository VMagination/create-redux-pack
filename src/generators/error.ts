import { CreateReduxPackAction, CRPackReducer, GetFormatPayloadType, Params, UnitedNonNever } from '../types';
import {
  createAction,
  createReducerCase,
  createSelector,
  getErrorName,
  getFailName,
  getNameWithInstance,
  getRunName,
  getSuccessName,
} from '../utils';

export const requestErrorGen = {
  stateNames: <Config extends Params>({ name }: Config) => ({
    error: getErrorName(name),
  }),
  initialState: <Config extends Params>({ name }: Config) => ({
    [getErrorName(name)]: null,
  }),
  selectors: <Config extends Params>({ name, reducerName }: Config) => ({
    error: createSelector(reducerName, getErrorName(name)),
  }),
  actions: <Config extends Params>({ name }: Config) => ({
    fail: createAction(getFailName(name), (payload) => payload?.error ?? payload) as CreateReduxPackAction<
      [UnitedNonNever<{ error: any } | any, GetFormatPayloadType<Config['payloadMap'], 'fail'>>]
    >,
  }),
  reducer: <Config extends Params>({ name }: Config): CRPackReducer => ({
    [getRunName(name)]: createReducerCase((_state, { meta }) => ({
      [getNameWithInstance(getErrorName(name), meta?.instance)]: null,
    })),
    [getSuccessName(name)]: createReducerCase((_state, { meta }) => ({
      [getNameWithInstance(getErrorName(name), meta?.instance)]: null,
    })),
    [getFailName(name)]: createReducerCase((_state, { payload, meta }) => ({
      [getNameWithInstance(getErrorName(name), meta?.instance)]: payload,
    })),
  }),
};

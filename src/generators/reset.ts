import { CreateReduxPackAction, CRPackReducer, Params } from '../types';
import { createAction, createReducerCase, getResetName, getErrorName } from '../utils';

export const resetActionGen = {
  actions: <Config extends Params>({ name }: Config) => ({
    reset: createAction(getResetName(name), (payload) => payload?.error ?? payload) as CreateReduxPackAction<[void]>,
  }),
  reducer: <Config extends Params>({ name }: Config, originalResult: any): CRPackReducer => ({
    [getResetName(name)]: createReducerCase((state) => ({
      ...(getErrorName(name) in state ? { [getErrorName(name)]: null } : {}),
      ...originalResult?.initialState,
    })),
  }),
};

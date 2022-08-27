import { CreateReduxPackAction, CRPackReducer, Params } from '../types';
import { createAction, createReducerCase, getResetName } from '../utils';
import { removeMark } from '../constants';

const resetState = (initial: any, state: any, newState: any) => {
  const stateKeys = Object.keys(state);
  Object.keys(initial).forEach((key) => {
    const instances = stateKeys.filter((sKey) => sKey.startsWith(key) && / \[Instance]: .+$/.test(sKey));
    instances.forEach((instance) => {
      newState[instance] = removeMark;
    });
    if (initial[key] && state[key] && typeof initial[key] === 'object' && typeof state[key] === 'object')
      resetState(initial[key], state[key], newState[key]);
  });
};

export const resetActionGen = {
  actions: <Config extends Params>({ name }: Config) => ({
    reset: createAction(getResetName(name)) as CreateReduxPackAction<[void]>,
  }),
  reducer: <Config extends Params>({ name }: Config, originalResult: any): CRPackReducer => ({
    [getResetName(name)]: createReducerCase((state) => {
      const newState = {
        ...originalResult?.initialState,
      };
      resetState(originalResult?.initialState || {}, state, newState);
      return newState;
    }),
  }),
};

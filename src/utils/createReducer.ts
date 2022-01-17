import { Action } from '../types';

export const createReducer = <S = any>(
  initialState: S,
  actionMap: Record<string, (state: S, action: Action<any>) => S>,
  defaultCase?: (state: S, action: Action<any>) => S,
) => (state: S = initialState, action: Action<any>) => {
  if (actionMap.hasOwnProperty(action.type)) {
    return actionMap[action.type](state, action);
  }
  return defaultCase ? defaultCase?.(state, action) : state;
};

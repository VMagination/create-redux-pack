import { Action } from '../types';

export const createReducerCase = <S = Record<string, any>>(
  reducerCase: (state: S, action: Action<any>) => S,
): ((state: S, action: Action<any>, isMerging?: boolean) => S) => {
  return (state: S, action: Action<any>, isMerging?: boolean) => ({
    ...(isMerging ? {} : state),
    ...reducerCase(state, action),
  });
};

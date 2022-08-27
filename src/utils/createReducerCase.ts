import { Action } from '../types';
import { removeMark } from '../constants';

export const removeMarked = (obj: any) => {
  if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      if (value === removeMark) {
        delete obj[key];
      } else {
        removeMarked(obj[key]);
      }
    });
  }
};

export const createReducerCase = <S = Record<string, any>>(
  reducerCase: (state: S, action: Action<any>, isMerging?: boolean) => S,
): ((state: S, action: Action<any>, isMerging?: boolean) => S) => {
  return (state: S, action: Action<any>, isMerging?: boolean) => {
    const nextState = {
      ...(isMerging ? {} : state),
      ...reducerCase(state, action, isMerging),
    };
    !isMerging && removeMarked(nextState);
    return nextState;
  };
};

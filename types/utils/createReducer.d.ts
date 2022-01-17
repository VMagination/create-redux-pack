import { Action } from '../types';
export declare const createReducer: <S = any>(initialState: S, actionMap: Record<string, (state: S, action: Action<any>) => S>, defaultCase?: ((state: S, action: Action<any>) => S) | undefined) => (state: S | undefined, action: Action<any>) => S;

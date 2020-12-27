import { Action } from '../types';
export declare const createReducerCase: <S = Record<string, any>>(reducerCase: (state: S, action: Action<any>) => S) => (state: S, action: Action<any>, isMerging?: boolean | undefined) => S;

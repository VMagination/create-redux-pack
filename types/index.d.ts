import { configureStore as configureStoreToolkit } from '@reduxjs/toolkit';
import { Action, CreateReduxPackFn, CreateReduxPackType } from './types';
import { createAction, createReducerCase, createSelector, mergeGenerators } from './utils';
declare const createReduxPack: CreateReduxPackFn & CreateReduxPackType;
declare const enableLogger: () => void;
declare const disableLogger: () => void;
declare const configureStore: (options: Omit<Parameters<typeof configureStoreToolkit>[0], 'reducer'>) => ReturnType<typeof configureStoreToolkit>;
declare const createReducerOn: <S>(reducerName: string, initialState: S, actionMap: Record<string, (state: S, action: Action<any>) => S>) => void;
export { createSelector, createAction, configureStore, enableLogger, disableLogger, createReducerOn, createReducerCase, mergeGenerators, };
export default createReduxPack;

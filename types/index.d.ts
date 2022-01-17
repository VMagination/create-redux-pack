import { configureStore as configureStoreToolkit } from '@reduxjs/toolkit';
import { Action, CreateReduxPackType } from './types';
import { combineReducers, Store } from 'redux';
import { createAction, createReducerCase, createSelector, mergeGenerators, resetAction, makeKeysReadable } from './utils';
import { CRPackFN } from './types';
import { requestErrorGen } from './generators/error';
import { resetActionGen } from './generators/reset';
import { mergableRemoveSymbol } from './utils/mergePayloadByKey';
declare const createReduxPack: CRPackFN & CreateReduxPackType;
declare const enableLogger: () => void;
declare const disableLogger: () => void;
declare const configureStore: (options?: Omit<Parameters<typeof configureStoreToolkit>[0], 'reducer'>) => ReturnType<typeof configureStoreToolkit>;
declare const connectStore: (store: Store, reducers: Parameters<typeof combineReducers>[0], initialState?: any) => void;
declare const createReducerOn: <S>(reducerName: string, initialState: S, actionMap: Record<string, (state: S, action: Action<any>) => S>) => void;
export { connectStore, createSelector, createAction, configureStore, enableLogger, disableLogger, createReducerOn, createReducerCase, mergeGenerators, resetAction, requestErrorGen, resetActionGen, makeKeysReadable, mergableRemoveSymbol, };
export default createReduxPack;
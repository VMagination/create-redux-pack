import { ActionCreatorWithPreparedPayload, configureStore } from '@reduxjs/toolkit';
import { Reducer } from 'redux';
import { OutputSelector } from 'reselect';
export declare type CreateReduxPackParams<S, PayloadMain> = {
    name: string;
    resultInitial?: any;
    reducerName: string;
    formatPayload?: (data: PayloadMain) => S;
    payloadMap?: CreateReduxPackPayloadMap<S>;
};
export declare type Action<T> = {
    type: string;
    payload: T;
} & Record<string, any>;
export declare type CreateReduxPackGeneratorBlock<RT = any> = <S = Record<string, any>, PayloadMain = Record<string, any>, RTD = Record<string, any>>(info: CreateReduxPackParams<S, PayloadMain>) => RT | RTD;
export declare type CreateReduxPackCustomGenerator<Gen = Record<string, any>> = Record<keyof Gen, CreateReduxPackGeneratorBlock>;
export declare type CreateReduxPackGenerator = {
    actions: CreateReduxPackGeneratorBlock;
    stateNames: CreateReduxPackGeneratorBlock;
    actionNames: CreateReduxPackGeneratorBlock;
    initialState: CreateReduxPackGeneratorBlock;
    reducer: CreateReduxPackGeneratorBlock;
    selectors: CreateReduxPackGeneratorBlock;
};
export declare type CreateReduxPackReducer<PayloadMain = void, PayloadRun = Record<string, any>> = Record<string, (state: any, action: Action<Record<string, any> & {
    error?: string;
} & PayloadMain & PayloadRun>) => any>;
export declare type CreateReduxPackInitialState = Record<string, any>;
declare type CRPackPayloadMapItem<T> = {
    initial: T;
    key?: string;
    fallback?: T;
    modifyValue?: (payloadValue: any, prevStateValue?: T) => T;
} | ({
    [K in keyof T]?: CRPackPayloadMapItem<T[K]>;
} & {
    key?: string;
});
export declare type CreateReduxPackPayloadMap<S> = {
    [P in keyof S]?: CRPackPayloadMapItem<S[P]>;
};
declare type CRPackStateName<S> = S extends Record<string, any> ? {
    [P in keyof S]: S[P] extends Record<string, any> ? CRPackStateName<S[P]> : string;
} : string;
export declare type CreateReduxPackStateNames<S> = {
    isLoading: string;
    result: string;
    error: string;
} & CRPackStateName<S>;
export declare type CreateReduxPackActionNames = {
    run: string;
    success: string;
    fail: string;
};
export declare type CreateReduxPackAction<DT, RT = DT> = ActionCreatorWithPreparedPayload<[DT], RT>;
export declare type CreateReduxPackActions<S, PayloadRun, PayloadMain> = {
    run: CreateReduxPackAction<PayloadRun, PayloadRun>;
    success: CreateReduxPackAction<PayloadMain, PayloadMain | S>;
    fail: CreateReduxPackAction<string, string>;
};
declare type CreateReduxPackSelector<S> = {
    [P in keyof S]: S[P] extends Record<string, any> ? OutputSelector<any, S[P], any> & CreateReduxPackSelector<S[P]> : OutputSelector<any, S[P], any>;
};
export declare type CreateReduxPackSelectors<S> = {
    isLoading: OutputSelector<any, boolean, any>;
    error: OutputSelector<any, null | string, any>;
    result: OutputSelector<any, S, any>;
} & CreateReduxPackSelector<S>;
export declare type CreateReduxPackReturnType<S, PayloadRun, PayloadMain> = {
    stateNames: CreateReduxPackStateNames<S>;
    actionNames: CreateReduxPackActionNames;
    actions: CreateReduxPackActions<S, PayloadRun, PayloadMain>;
    initialState: CreateReduxPackInitialState;
    reducer: CreateReduxPackReducer<PayloadMain, PayloadRun>;
    selectors: CreateReduxPackSelectors<S>;
    name: string;
};
export declare type CreateReduxPackFn = <S = Record<string, any>, PayloadRun = void, PayloadMain = Record<string, any>>(info: CreateReduxPackParams<S, PayloadMain>) => CreateReduxPackReturnType<S, PayloadRun, PayloadMain>;
export declare type CreateReduxPackActionMap = Record<string, (state: any, action: Action<any>) => typeof state>;
export declare type CreateReduxPackType = {
    getRunName: (name: string) => string;
    getSuccessName: (name: string) => string;
    getFailName: (name: string) => string;
    getLoadingName: (name: string) => string;
    getResultName: (name: string) => string;
    getErrorName: (name: string) => string;
    getKeyName: (name: string, key: string) => string;
    _generator: CreateReduxPackGenerator;
    _reducers: Record<string, CreateReduxPackReducer>;
    _initialState: CreateReduxPackInitialState;
    updateReducer: () => void;
    isLoggerOn: boolean;
    getRootReducer: (reducers?: Record<string, CreateReduxPackActionMap>, initialState?: Record<string, any>) => Reducer;
    injectReducerInto: (reducerName: string, actionMap: CreateReduxPackActionMap, initialState: Record<string, any>) => void;
    _store: ReturnType<typeof configureStore> | null;
    preventReducerUpdates: boolean;
    freezeReducerUpdates: () => void;
    releaseReducerUpdates: () => void;
    withGenerator: <S, PayloadRun, PayloadMain, Gen>(info: CreateReduxPackParams<S, PayloadMain>, generator: {
        [P in Exclude<keyof Gen, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
    }) => {
        [P in keyof CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>[P];
    };
};
export declare type CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain> = CreateReduxPackReturnType<S, PayloadRun, PayloadMain> & Gen;
export {};

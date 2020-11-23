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
declare type Action<T> = {
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
    reducers: CreateReduxPackGeneratorBlock;
    selectors: CreateReduxPackGeneratorBlock;
};
export declare type CreateReduxPackReducer<PayloadMain = void, PayloadRun = Record<string, any>> = Record<string, (state: Record<string, any>, action: Action<Record<string, any> & {
    error?: string;
} & PayloadMain & PayloadRun>) => Record<string, null | boolean | string>>;
export declare type CreateReduxPackInitialState = Record<string, any>;
export declare type CreateReduxPackPayloadMap<S> = {
    [P in keyof S]?: {
        initial: any;
        key: string;
        fallback?: any;
        formatSelector?: <DT = any>(data: DT) => any;
    };
};
export declare type CreateReduxPackStateNames<S> = {
    isLoading: string;
    result: string;
    error: string;
} & {
    [P in keyof S]: string;
};
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
export declare type CreateReduxPackSelector<T> = OutputSelector<any, T, any>;
export declare type CreateReduxPackSelectors<S> = {
    isLoading: OutputSelector<any, boolean, any>;
    error: OutputSelector<any, null | string, any>;
    result: OutputSelector<any, S, any>;
} & {
    [P in keyof S]: OutputSelector<any, S[P], any>;
};
export declare type CreateReduxPackReturnType<S, PayloadRun, PayloadMain> = {
    stateNames: CreateReduxPackStateNames<S>;
    actionNames: CreateReduxPackActionNames;
    actions: CreateReduxPackActions<S, PayloadRun, PayloadMain>;
    initialState: CreateReduxPackInitialState;
    reducer: CreateReduxPackReducer<PayloadMain, PayloadRun>;
    selectors: CreateReduxPackSelectors<S>;
};
export declare type CreateReduxPackFn = <S = Record<string, any>, PayloadRun = void, PayloadMain = Record<string, any>>(info: CreateReduxPackParams<S, PayloadMain>) => CreateReduxPackReturnType<S, PayloadRun, PayloadMain>;
export declare type CreateReduxPackType = {
    getSuccessName: (name: string) => string;
    getFailName: (name: string) => string;
    getLoadingName: (name: string) => string;
    getResultName: (name: string) => string;
    getErrorName: (name: string) => string;
    createAction: <Payload, Result>(name: string, formatPayload?: (data: Payload) => Result) => CreateReduxPackAction<Payload, Result | Payload>;
    createSelector: <T>(reducerName: string, stateKey: string) => CreateReduxPackSelector<T>;
    generator: CreateReduxPackGenerator;
    reducers: Record<string, CreateReduxPackReducer>;
    initialState: CreateReduxPackInitialState;
    useLogger: () => void;
    enableLoggerLive: () => void;
    disableLoggerLive: () => void;
    updateReducer: () => void;
    isLoggerOn: boolean;
    getRootReducer: (reducers?: Record<string, Record<string, (state: any, action: Action<any>) => typeof state>>, initialState?: Record<string, any>) => Reducer;
    store: ReturnType<typeof configureStore> | null;
    setStore: (store: ReturnType<typeof configureStore>) => void;
    configureStore: (options: Omit<Parameters<typeof configureStore>[0], 'reducer'> & {
        reducer: Record<string, Record<string, (state: any, action: Action<any>) => typeof state>>;
        initialState: Record<string, any>;
    }) => ReturnType<typeof configureStore>;
    preventReducerUpdates: boolean;
    freezeReducerUpdates: () => void;
    releaseReducerUpdates: () => void;
    withGenerator: <S, PayloadRun, PayloadMain, Gen>(info: CreateReduxPackParams<S, PayloadMain>, generator: {
        [P in keyof Gen]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
    }) => {
        [P in keyof CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>[P];
    };
};
export declare type CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain> = CreateReduxPackReturnType<S, PayloadRun, PayloadMain> & Gen;
export {};

import { ActionCreatorWithPreparedPayload, configureStore } from '@reduxjs/toolkit';
import { Reducer } from 'redux';
import { OutputSelector } from 'reselect';

export type CreateReduxPackParams<S, PayloadMain> = {
  name: string;
  resultInitial?: any;
  reducerName: string;
  formatPayload?: (data: PayloadMain) => S;
  payloadMap?: CreateReduxPackPayloadMap<S>;
};

export type Action<T> = {
  type: string;
  payload: T;
} & Record<string, any>;


export type CreateReduxPackGeneratorBlock<RT = any> = <
  S = Record<string, any>,
  PayloadMain = Record<string, any>,
  RTD = Record<string, any>
>(
  info: CreateReduxPackParams<S, PayloadMain>,
) => RT | RTD;

export type CreateReduxPackCustomGenerator<Gen = Record<string, any>> = Record<
  keyof Gen,
  CreateReduxPackGeneratorBlock
>;

export type CreateReduxPackGenerator = {
  actions: CreateReduxPackGeneratorBlock;
  stateNames: CreateReduxPackGeneratorBlock;
  actionNames: CreateReduxPackGeneratorBlock;
  initialState: CreateReduxPackGeneratorBlock;
  reducer: CreateReduxPackGeneratorBlock;
  selectors: CreateReduxPackGeneratorBlock;
};

export type CreateReduxPackReducer<PayloadMain = void, PayloadRun = Record<string, any>> = Record<
  string,
  (
    state: Record<string, any>,
    action: Action<Record<string, any> & { error?: string } & PayloadMain & PayloadRun>,
  ) => Record<string, null | boolean | string>
>;

export type CreateReduxPackInitialState = Record<string, any>;

export type CreateReduxPackPayloadMap<S> = {
  [P in keyof S]?: {
    initial: any;
    key: string;
    fallback?: any;
    formatSelector?: <DT = any>(data: DT) => any;
  };
};

export type CreateReduxPackStateNames<S> = {
  isLoading: string;
  result: string;
  error: string;
} & {
  [P in keyof S]: string;
};

export type CreateReduxPackActionNames = { run: string; success: string; fail: string };

export type CreateReduxPackAction<DT, RT = DT> = ActionCreatorWithPreparedPayload<[DT], RT>;

export type CreateReduxPackActions<S, PayloadRun, PayloadMain> = {
  run: CreateReduxPackAction<PayloadRun, PayloadRun>;
  success: CreateReduxPackAction<PayloadMain, PayloadMain | S>;
  fail: CreateReduxPackAction<string, string>;
};

export type CreateReduxPackSelector<T> = OutputSelector<any, T, any>;

export type CreateReduxPackSelectors<S> = {
  isLoading: OutputSelector<any, boolean, any>;
  error: OutputSelector<any, null | string, any>;
  result: OutputSelector<any, S, any>;
} & {
  [P in keyof S]: OutputSelector<any, S[P], any>;
};

export type CreateReduxPackReturnType<S, PayloadRun, PayloadMain> = {
  stateNames: CreateReduxPackStateNames<S>;
  actionNames: CreateReduxPackActionNames;
  actions: CreateReduxPackActions<S, PayloadRun, PayloadMain>;
  initialState: CreateReduxPackInitialState;
  reducer: CreateReduxPackReducer<PayloadMain, PayloadRun>;
  selectors: CreateReduxPackSelectors<S>;
  name: string,
};
export type CreateReduxPackFn = <S = Record<string, any>, PayloadRun = void, PayloadMain = Record<string, any>>(
  info: CreateReduxPackParams<S, PayloadMain>,
) => CreateReduxPackReturnType<S, PayloadRun, PayloadMain>;

export type CreateReduxPackActionMap = Record<string, (state: any, action: Action<any>) => typeof state>;

export type CreateReduxPackType = {
  getSuccessName: (name: string) => string;
  getFailName: (name: string) => string;
  getLoadingName: (name: string) => string;
  getResultName: (name: string) => string;
  getErrorName: (name: string) => string;
  getKeyName: (name: string, key: string) => string;

  /*
  createAction: <Payload, Result>(
    name: string,
    formatPayload?: (data: Payload) => Result,
  ) => CreateReduxPackAction<Payload, Result | Payload>;
  createSelector: <T>(reducerName: string, stateKey: string) => CreateReduxPackSelector<T>;
  configureStore: (
    options: Omit<Parameters<typeof configureStore>[0], 'reducer'> & {
      reducer: Record<string, Record<string, (state: any, action: Action<any>) => typeof state>>,
      initialState: Record<string, any>;
    },
  ) => ReturnType<typeof configureStore>;
  enableLogger: () => void;
  disableLogger: () => void;
  */

  generator: CreateReduxPackGenerator;
  reducers: Record<string, CreateReduxPackReducer>;
  initialState: CreateReduxPackInitialState;
  updateReducer: () => void;
  isLoggerOn: boolean;
  getRootReducer: (reducers?: Record<string, CreateReduxPackActionMap>, initialState?: Record<string, any>) => Reducer;
  injectReducerInto: (
    reducerName: string,
    actionMap: CreateReduxPackActionMap,
    initialState: Record<string, any>,
  ) => void;
  store: ReturnType<typeof configureStore> | null;
  preventReducerUpdates: boolean;
  freezeReducerUpdates: () => void;
  releaseReducerUpdates: () => void;
  resetAction: () => Action<any>;
  withGenerator: <S, PayloadRun, PayloadMain, Gen>(
    info: CreateReduxPackParams<S, PayloadMain>,
    generator: {
      [P in Exclude<keyof Gen, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain>) => Gen[P];
    },
  ) => {
    [P in keyof CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain>]: CreateReduxPackCombinedGenerators<
      Gen,
      S,
      PayloadRun,
      PayloadMain
    >[P];
  };
};

export type CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain> = CreateReduxPackReturnType<
  S,
  PayloadRun,
  PayloadMain
> &
  Gen;

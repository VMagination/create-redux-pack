import { ActionCreatorWithPreparedPayload, configureStore } from '@reduxjs/toolkit';
import { Reducer } from 'redux';
import { OutputSelector } from 'reselect';

export type CreateReduxPackParams<S, PayloadMain, PayloadMap extends CRPackPayloadMap<S> = CRPackPayloadMap<S>> = {
  name: string;
  defaultInitial?: any;
  mergeByKey?: string;
  reducerName: string;
  formatPayload?: (data: PayloadMain) => any;
  payloadMap?: CreateReduxPackPayloadMap<S, PayloadMain, PayloadMap> & Partial<PayloadMap>;
} & (
  | { template?: 'simple' }
  | {
      template?: 'request';
    }
);

export type Action<T> = {
  type: string;
  payload: T;
} & Record<string, any>;

export type CreateReduxPackGeneratorBlock<RT = any> = <
  S = Record<string, any>,
  PayloadMain = any,
  RTD = Record<string, any>,
  PayloadMap extends CRPackPayloadMap<S> = any,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
>(
  info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info,
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

export type CRPackReducer<PayloadMain = void, PayloadRun = Record<string, any>> = Record<
  string,
  (state: any, action: Action<Record<string, any> & { error?: string } & PayloadMain & PayloadRun>) => any
>;

export type CRPackInitialState = Record<string, any>;

export type CRPackPayloadMap<S> = Record<string | keyof S, any>;

type CRPackPayloadMapItem<T, PayloadMain, PayloadMap extends CRPackPayloadMap<T>> =
  | {
      initial: T;
      formatSelector?: (state: T) => ReturnType<PayloadMap['formatSelector']>;
      formatPayload?: (payload: PayloadMain) => T;
      fallback?: T;
      asd?: PayloadMain;
      modifyValue?: (payloadValue: T, prevStateValue: T) => T;
    }
  | {
      [K in keyof T]?: CRPackPayloadMapItem<T[K], PayloadMain, PayloadMap[K]>;
    };

export type CreateReduxPackPayloadMap<S, PayloadMain = any, PayloadMap extends CRPackPayloadMap<S> = any> = {
  [P in keyof S]?: CRPackPayloadMapItem<S[P], PayloadMain, PayloadMap[P]>;
};

type CRPackStateName<S> = S extends Record<string, any>
  ? {
      [P in keyof S]: S[P] extends Record<string, any> ? CRPackStateName<S[P]> : string;
    }
  : string;

export type CRPackRequestStateNames<S> = {
  isLoading: string;
  result: string;
  error: string;
} & CRPackStateName<S>;

export type CRPackSimpleStateNames<S> = {
  value: string;
} & CRPackStateName<S>;

export type CRPackRequestActionNames = { run: string; success: string; fail: string };

export type CRPackSimpleActionNames = { set: string; reset: string };

export type CreateReduxPackAction<DT, RT = DT> = ActionCreatorWithPreparedPayload<[DT], RT> & {
  instances: { [key: string]: ActionCreatorWithPreparedPayload<[DT], RT> };
};

export type CRPackRequestActions<_S, PayloadRun, PayloadMain> = {
  run: CreateReduxPackAction<PayloadRun, PayloadRun>;
  success: CreateReduxPackAction<PayloadMain, PayloadMain>;
  d: PayloadMain;
  fail: CreateReduxPackAction<string, string>;
};

export type CRPackSimpleActions<_S, PayloadMain> = {
  set: CreateReduxPackAction<PayloadMain, PayloadMain>;
  reset: CreateReduxPackAction<void, void>;
};

type CreateReduxPackSelector<S, PayloadMap extends CRPackPayloadMap<S>> = {
  [P in keyof S]: S[P] extends Record<string, any>
    ? OutputSelector<
        any,
        'formatSelector' extends keyof PayloadMap[P] ? ReturnType<PayloadMap[P]['formatSelector']> : S[P],
        any
      > &
        CreateReduxPackSelector<S[P], PayloadMap[P]>
    : OutputSelector<
        any,
        'formatSelector' extends keyof PayloadMap[P] ? ReturnType<PayloadMap[P]['formatSelector']> : S[P],
        any
      >;
};

export type CRPackRequestSelectors<S, PayloadMap extends CRPackPayloadMap<S> = any> = {
  isLoading: OutputSelector<any, boolean, any> & { instances: Record<string, OutputSelector<any, boolean, any>> };
  error: OutputSelector<any, null | string, any>;
  result: OutputSelector<any, S, any>;
} & CreateReduxPackSelector<S, PayloadMap>;

export type CRPackSimpleSelectors<S, PayloadMap extends CRPackPayloadMap<S> = any> = {
  value: OutputSelector<any, boolean, any>;
} & CreateReduxPackSelector<S, PayloadMap>;

export type CRPackGenObj<
  S,
  PayloadMain,
  PayloadMap extends CRPackPayloadMap<S> = CRPackPayloadMap<S>,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
> = {
  [P in Exclude<string, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => any;
};

type CRPackGenResult<
  S,
  Gen extends CRPackGenObj<S, PayloadMain, PayloadMap>,
  PayloadMain,
  PayloadMap extends CRPackPayloadMap<S> = any
> = {
  [P in keyof Gen]: ReturnType<Gen[P]>;
};

export type CRPackRequestGen<
  S,
  PayloadRun,
  PayloadMain,
  PayloadMap extends CRPackPayloadMap<S> = any,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
> = {
  stateNames: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackRequestStateNames<S>;
  actionNames: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackRequestActionNames;
  actions: (
    info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info,
  ) => CRPackRequestActions<S, PayloadRun, PayloadMain>;
  initialState: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackInitialState;
  reducer: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackReducer<PayloadMain, PayloadRun>;
  selectors: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackRequestSelectors<S, PayloadMap>;
};

export type CRPackSimpleGen<
  S,
  PayloadRun,
  PayloadMain,
  PayloadMap extends CRPackPayloadMap<S> = any,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
> = {
  stateNames: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackSimpleStateNames<S>;
  actionNames: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackSimpleActionNames;
  actions: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackSimpleActions<S, PayloadMain>;
  initialState: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackInitialState;
  reducer: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackReducer<PayloadMain, PayloadRun>;
  selectors: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => CRPackSimpleSelectors<S, PayloadMap>;
};

export type CreateReduxPackReturnType<
  S,
  PayloadRun,
  PayloadMain,
  TGen extends CRPackGenObj<S, PayloadMain, PayloadMap>,
  PayloadMap extends CRPackPayloadMap<S> = any,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
> = CRPackGenResult<S, TGen, PayloadMain, PayloadMap> & {
  name: string;
} & {
  withGenerator: <Gen = Record<string, any>>(
    generator: {
      [P in Exclude<keyof Gen, 'name'>]: (info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info) => Gen[P];
    },
  ) => {
    [P in keyof CreateReduxPackCombinedGenerators<
      Gen,
      S,
      PayloadRun,
      PayloadMain,
      PayloadMap
    >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain, PayloadMap>[P];
  };
};

export type CreateReduxPackFn = <
  S = any,
  PayloadRun = void,
  PayloadMain = any,
  PayloadMap extends CRPackPayloadMap<S> = any,
  Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
>(
  info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Partial<Info>,
) => CreateReduxPackReturnType<
  S,
  PayloadRun,
  PayloadMain,
  Info['template'] extends 'simple'
    ? CRPackSimpleGen<S, PayloadRun, PayloadMain, PayloadMap>
    : CRPackRequestGen<S, PayloadRun, PayloadMain, PayloadMap>,
  PayloadMap
>;

export type CreateReduxPackActionMap = Record<string, (state: any, action: Action<any>) => typeof state>;

export type CreateReduxPackType = {
  getSetName: (name: string) => string;
  getResetName: (name: string) => string;
  getRunName: (name: string) => string;
  getSuccessName: (name: string) => string;
  getFailName: (name: string) => string;
  getValueName: (name: string) => string;
  getLoadingName: (name: string) => string;
  getResultName: (name: string) => string;
  getErrorName: (name: string) => string;
  getKeyName: (name: string, key: string) => string;
  getNameWithInstance: (name: string, instance?: string) => string;
  _generators: Record<string, CreateReduxPackGenerator>;
  _reducers: Record<string, CRPackReducer>;
  _initialState: CRPackInitialState;
  updateReducer: () => void;
  isLoggerOn: boolean;
  getRootReducer: (reducers?: Record<string, CreateReduxPackActionMap>, initialState?: Record<string, any>) => Reducer;
  injectReducerInto: (
    reducerName: string,
    actionMap: CreateReduxPackActionMap,
    initialState: Record<string, any>,
  ) => void;
  _store: ReturnType<typeof configureStore> | null;
  preventReducerUpdates: boolean;
  freezeReducerUpdates: () => void;
  releaseReducerUpdates: () => void;
  /*
   * @deprecated use pack's withGenerator(gen) method instead
   */
  withGenerator: <
    S,
    PayloadRun,
    PayloadMain,
    Gen,
    PayloadMap extends CRPackPayloadMap<S> = CRPackPayloadMap<S>,
    Info extends CreateReduxPackParams<S, PayloadMain, PayloadMap> = CreateReduxPackParams<S, PayloadMain, PayloadMap>
  >(
    info: CreateReduxPackParams<S, PayloadMain, PayloadMap> & Info,
    generator: CRPackGenObj<S, PayloadMain, PayloadMap>,
  ) => {
    [P in keyof CreateReduxPackCombinedGenerators<
      Gen,
      S,
      PayloadRun,
      PayloadMain,
      PayloadMap
    >]: CreateReduxPackCombinedGenerators<Gen, S, PayloadRun, PayloadMain, PayloadMap>[P];
  };
};

export type CreateReduxPackCombinedGenerators<
  Gen,
  S,
  PayloadRun,
  PayloadMain,
  PayloadMap extends CRPackPayloadMap<S> = any
> = CreateReduxPackReturnType<S, PayloadRun, PayloadMain, PayloadMap> & Gen;

/*type A<T, PS> = {
  initial: T;
  asd?: PS;
};

export type B<S, PS, D> = {
  [P in keyof S]?: A<S[P], PS> & { a?: D };
};

const asd = <S, PS, D>(a: B<S, PS, D>): { a: PS; b: S; c: D } => (a as unknown) as { a: PS; b: S; c: D };

const { a, b, c } = asd({ d: { initial: 1, asd: 'asd', a: null } }); // a - unknown, b - { d: number }, c - unknown
const w = asd({ d: { initial: 1, asd: 'asd', a: 3 } });*/

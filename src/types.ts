import { ActionCreatorWithPreparedPayload, configureStore } from '@reduxjs/toolkit';
import { Reducer } from 'redux';
import { OutputSelector } from 'reselect';

export type CreateReduxPackParams<S, PayloadMain, PayloadMap extends CreateReduxPackPayloadMap<S> = any> = {
  name: string;
  defaultInitial?: any;
  mergeByKey?: any;
  reducerName: string;
  formatPayload?: (data: PayloadMain) => any;
  formatMergePayload?: (data: PayloadMain) => any;
  payloadMap?: PayloadMap;
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

export type CreateReduxPackGenerator = {
  actions: CreateReduxPackGeneratorBlock;
  stateNames: CreateReduxPackGeneratorBlock;
  actionNames: CreateReduxPackGeneratorBlock;
  initialState: CreateReduxPackGeneratorBlock;
  reducer: CreateReduxPackGeneratorBlock;
  selectors: CreateReduxPackGeneratorBlock;
};

export type CRPackReducer = Record<string, (state: any, action: Action<Record<string, any>>) => any>;

export type CRPackInitialState<Config> = Config extends Params<infer S> ? S & Record<string, any> : never;

export type CRPackPayloadMap<S> = Record<string | keyof S, any>;

type CRPackStateName<S> = S extends Record<string, any>
  ? {
      [P in keyof S]: S[P] extends Record<string, any>
        ? (P extends string ? `[${P}]: CRPack-{id}` : never) & CRPackStateName<S[P]>
        : P extends string
        ? `[${P}]: CRPack-{id}`
        : never;
    }
  : never;

/*type CRPackStateName1<S> = S extends Record<string, any>
  ? string &
      {
        [P in keyof S]: S[P] extends Record<string, any> ? CRPackStateName<S[P]> : string;
      }
  : string;*/

export type CRPackRequestStateNames<Config extends Params> = Expand<
  'payloadMap' extends keyof Config
    ? {
        isLoading: string;
        result: string;
      } & (Config extends Params<infer S> ? CRPackStateName<S> : never)
    : {
        isLoading: string;
        result: string;
      }
>;

export type CRPackSimpleStateNames<Config extends Params> = Expand<
  {
    value: string;
  } & (Config extends Params<infer S> ? CRPackStateName<S> : never)
>;

export type CRPackRequestActionNames<Actions extends PropertyKey> = Expand<
  CRPackActionNames<Actions | DefaultRequestActions>
>;

export type CRPackActionNames<Actions extends string | number | symbol> = Expand<
  {
    [key in Actions]: string;
  }
>;

export type CRPackSimpleActionNames<Actions extends PropertyKey> = Expand<
  CRPackActionNames<Actions | DefaultSimpleActions>
>;

export type CreateReduxPackAction<DT extends any[], RT = DT> = ActionCreatorWithPreparedPayload<
  DT extends [never] ? [void] : DT,
  RT
> & {
  instances: {
    [key: string]: ActionCreatorWithPreparedPayload<DT extends [never] ? [void] : DT, RT>;
  };
};

type GetActionType<T, Key> = Expand<
  'initial' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? 'mergeByKey' extends keyof T
            ? T extends CRPackPayloadMapEndItem<infer S, any>
              ? CRPackMergable<S>
              : never
            : T['initial']
          : never
        : never
      : never
    : never
>;

type GetMainActionType<T, Key> = Expand<
  'initial' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? 'mergeByKey' extends keyof T
            ? T extends CRPackPayloadMapEndItem<infer S, any>
              ? CRPackMergable<S>
              : never
            : T['initial']
          : never
        : never
      : 'mergeByKey' extends keyof T
      ? T extends CRPackPayloadMapEndItem<infer S, any>
        ? CRPackMergable<S>
        : never
      : T['initial']
    : never
>;

type GetFormatActionType<T, Key> = Expand<
  'formatPayload' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? GetFirstParam<T['formatPayload']>
          : never
        : never
      : never
    : 'formatMergePayload' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? GetFirstParam<T['formatMergePayload']>
          : never
        : never
      : never
    : never
>;

type GetMainFormatActionType<T, Key> = Expand<
  'formatPayload' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? GetFirstParam<T['formatPayload']>
          : never
        : never
      : GetFirstParam<T['formatPayload']>
    : 'formatMergePayload' extends keyof T
    ? 'actions' extends keyof T
      ? number extends keyof T['actions']
        ? Key extends T['actions'][number]
          ? GetFirstParam<T['formatMergePayload']>
          : never
        : never
      : GetFirstParam<T['formatMergePayload']>
    : never
>;

type GetFirstParam<T> = T extends (...args: any[]) => any ? Parameters<T>[0] : never;

type GetRealActionType<T, Key, Main extends boolean> = 'formatPayload' extends keyof T
  ? never
  : 'formatMergePayload' extends keyof T
  ? never
  : true extends Main
  ? GetMainActionType<T, Key>
  : GetActionType<T, Key>;

type GetKeys<T> = { [K in keyof T]: [T[K]] extends [never] ? never : K }[keyof T];
export type RemoveNever<T> = [keyof Pick<T, GetKeys<T>>] extends [never] ? never : Expand<Pick<T, GetKeys<T>>>;

export type GetFormatPayloadType<T, Key, Main extends boolean = false> = 'initial' extends keyof T
  ? true extends Main
    ? GetMainFormatActionType<T, Key>
    : GetFormatActionType<T, Key>
  : { [K in keyof T]: GetFormatPayloadType<T[K], Key, Main> }[keyof T];

export type GetActionPayload<T, Key, Main extends boolean = false> = Expand<
  'initial' extends keyof T
    ? GetRealActionType<T, Key, Main>
    : Expand<RemoveNever<{ [K in keyof T]: GetActionPayload<T[K], Key, Main> }>>
>;

export type UnitedNonNever<T1, T2> = [T1] extends [never] ? T2 : [T2] extends [never] ? T1 : T1 & T2;
type PrioritizeNonNever<T1, T2> = [T1] extends [never] ? T2 : T1;

const randomStr = `${Math.random().toString(36).substr(2, 9)}` as const;

type MergeLiteral<T1, T2> = typeof randomStr extends T1 ? T2 : T1 | T2;

export type CRPackRequestActions<Config extends Params, Actions extends PropertyKey> = Expand<
  {
    [Key in MergeLiteral<Actions, Exclude<DefaultRequestActions, 'success'>>]: CreateReduxPackAction<
      [
        UnitedNonNever<
          RemoveNever<GetActionPayload<Config['payloadMap'], Key>>,
          GetFormatPayloadType<Config['payloadMap'], Key>
        >,
      ]
    >;
  } & {
    success: CreateReduxPackAction<
      [
        PrioritizeNonNever<
          UnitedNonNever<
            RemoveNever<GetActionPayload<Config['payloadMap'], 'success', true>>,
            GetFormatPayloadType<Config['payloadMap'], 'success', true>
          >,
          Config extends Params<any, any, any, infer Default, infer DefaultPayload>
            ? 'formatPayload' extends keyof Config
              ? DefaultPayload
              : Default
            : never
        >,
      ]
    >;
  }
>;

type FSelector<T, S> = T extends Record<string, any>
  ? OutputSelector<any, T, any> & { [K in keyof S]: FSelector<S[K], S[K]> }
  : OutputSelector<any, T, any>;

type GetSelector<T> = 'formatSelector' extends keyof T
  ? T extends CRPackPayloadMapItem<infer S, any, any, infer Selector>
    ? 'initial' extends keyof T
      ? FSelector<Selector, S>
      : OutputSelector<any, Selector, any> & { [K in Exclude<keyof T, 'formatSelector'>]: GetSelector<T[K]> }
    : never
  : 'initial' extends keyof T
  ? T extends CRPackPayloadMapItem<infer S, any>
    ? FSelector<S, S>
    : never
  : T extends CRPackPayloadMapItem<infer S, any>
  ? OutputSelector<any, S, any> & { [K in Exclude<keyof T, 'formatSelector'>]: GetSelector<T[K]> }
  : never;

export type CRPackRequestSelectors<Config extends Params> = Expand<
  'payloadMap' extends keyof Config
    ? {
        result: OutputSelector<
          any,
          PrioritizeNonNever<
            Config extends Params<infer S, any, any, infer Default, unknown, infer Selector>
              ? 'formatSelector' extends keyof Config
                ? Selector
                : unknown extends Default
                ? S
                : Default
              : never,
            any
          >,
          any
        >;
        isLoading: OutputSelector<any, boolean, any> & { instances: Record<string, OutputSelector<any, boolean, any>> };
      } & { [K in keyof Config['payloadMap']]: GetSelector<Config['payloadMap'][K]> }
    : {
        result: OutputSelector<
          any,
          PrioritizeNonNever<
            Config extends Params<infer S, any, any, infer Default, any, infer Selector>
              ? 'formatSelector' extends keyof Config
                ? Selector
                : unknown extends Default
                ? S
                : Default
              : never,
            any
          >,
          any
        >;
        isLoading: OutputSelector<any, boolean, any> & { instances: Record<string, OutputSelector<any, boolean, any>> };
      }
>;

export type CRPackSimpleSelectors<Config extends Params> = Expand<
  'payloadMap' extends keyof Config
    ? {
        value: OutputSelector<
          any,
          PrioritizeNonNever<
            Config extends Params<infer S, any, any, infer Default, unknown, infer Selector>
              ? 'formatSelector' extends keyof Config
                ? Selector
                : unknown extends Default
                ? S
                : Default
              : never,
            any
          >,
          any
        >;
      } & { [K in keyof Config['payloadMap']]: GetSelector<Config['payloadMap'][K]> }
    : {
        value: OutputSelector<
          any,
          PrioritizeNonNever<
            Config extends Params<infer S, any, any, infer Default, unknown, infer Selector>
              ? 'formatSelector' extends keyof Config
                ? Selector
                : unknown extends Default
                ? S
                : Default
              : never,
            any
          >,
          any
        >;
      }
>;

export type CRPackSimpleActions<Config extends Params, Actions extends PropertyKey> = {
  [Key in Actions | Exclude<DefaultSimpleActions, 'set'>]: CreateReduxPackAction<
    [
      UnitedNonNever<
        RemoveNever<GetActionPayload<Config['payloadMap'], Key>>,
        GetFormatPayloadType<Config['payloadMap'], Key>
      >,
    ]
  >;
} & {
  set: CreateReduxPackAction<
    [
      PrioritizeNonNever<
        UnitedNonNever<
          RemoveNever<GetActionPayload<Config['payloadMap'], 'set', true>>,
          GetFormatPayloadType<Config['payloadMap'], 'set', true>
        >,
        Config extends Params<any, any, any, infer Default, infer DefaultPayload>
          ? 'formatPayload' extends keyof Config
            ? DefaultPayload
            : Default
          : never
      >,
    ]
  >;
};

export type CRPackWithGenFromGen<Config extends Params, Pack extends Record<any, any>> = {
  [P in Exclude<string, 'name'>]: (info: Config, pack: Pack) => any;
};

export type CRPackArbitraryGen = {
  [P in Exclude<string, 'name'>]: (...args: any[]) => any;
};

type CRPackWithGenIteration<I> = I extends 1
  ? 2
  : I extends 2
  ? 3
  : I extends 3
  ? 4
  : I extends 4
  ? 5
  : I extends 5
  ? 6
  : I extends 6
  ? 7
  : I extends 7
  ? 8
  : I extends 8
  ? 9
  : 10;

type CRPackWithGenFromGenResult<
  Config extends Params,
  PResult extends Record<any, any>,
  Gen extends CRPackWithGenFromGen<Config, PResult>,
  OGen extends CRPackArbitraryGen,
  I extends number = 1
> = {
  [P in keyof CombineFn<OGen, Gen>]: ReturnType<CombineFn<OGen, Gen>[P]>;
} & { name: string } & (I extends 10
    ? {}
    : {
        withGenerator: <
          NewGen extends CRPackWithGenFromGen<
            Config,
            {
              [P in keyof CombineFn<OGen, Gen>]: ReturnType<CombineFn<OGen, Gen>[P]>;
            }
          >
        >(
          gen: NewGen,
        ) => CRPackWithGenFromGenResult<
          Config,
          {
            [P in keyof CombineFn<OGen, Gen>]: ReturnType<CombineFn<OGen, Gen>[P]>;
          },
          NewGen,
          CombineFn<OGen, Gen>,
          CRPackWithGenIteration<I>
        >;
      });

export type CRPackGenerator<Config extends Params> = {
  [P in Exclude<string, 'name'>]: (info: Config) => any;
};

type CRPackGeneratorResult<Config extends Params, Gen extends CRPackGenerator<Config>> = {
  [P in keyof Gen]: ReturnType<Gen[P]>;
};

export type CRPackWithGen<Config extends Params, Gen extends CRPackGenerator<Config>> = {
  [P in Exclude<string, 'name'>]: (info: Config, pack: CRPackGeneratorResult<Config, Gen>) => any;
};

type CRPackWithGenResult<
  Config extends Params,
  OGen extends CRPackGenerator<Config>,
  Gen extends CombineFn<OGen, CRPackWithGen<Config, OGen>>
> = {
  [P in keyof Gen]: ReturnType<Gen[P]>;
} & {
  name: string;
  withGenerator: <
    NewGen extends CRPackWithGenFromGen<
      Config,
      {
        [P in keyof Gen]: ReturnType<Gen[P]>;
      }
    >
  >(
    gen: NewGen,
  ) => CRPackWithGenFromGenResult<
    Config,
    {
      [P in keyof Gen]: ReturnType<Gen[P]>;
    },
    NewGen,
    Gen
  >;
};

export type CRPackRequestGen<Config extends Params> = Expand<{
  stateNames: (info: Config) => CRPackRequestStateNames<Config>;
  actionNames: (
    info: Config,
  ) => CRPackRequestActionNames<Config extends Params<unknown, infer Actions> ? Actions : never>;
  actions: (
    info: Config,
  ) => CRPackRequestActions<Config, Config extends Params<unknown, infer Actions> ? Actions : never>;
  initialState: (info: Config) => CRPackInitialState<Config>;
  reducer: (info: Config) => CRPackReducer;
  selectors: (info: Config) => CRPackRequestSelectors<Config>;
}>;

export type CRPackSimpleGen<Config extends Params> = Expand<{
  stateNames: (info: Config) => CRPackSimpleStateNames<Config>;
  actionNames: (
    info: Config,
  ) => CRPackSimpleActionNames<Config extends Params<unknown, infer Actions> ? Actions : never>;
  actions: (
    info: Config,
  ) => CRPackSimpleActions<Config, Config extends Params<unknown, infer Actions> ? Actions : never>;
  initialState: (info: Config) => CRPackInitialState<Config>;
  reducer: (info: Config) => CRPackReducer;
  selectors: (info: Config) => CRPackSimpleSelectors<Config>;
}>;

export type CRPackReturnType<Config extends Params, Gen extends CRPackGenerator<Config>> = CRPackGeneratorResult<
  Config,
  Gen
> & {
  name: string;
  withGenerator: <NewGen extends CRPackWithGen<Config, Gen>>(
    gen: NewGen,
  ) => CRPackWithGenResult<Config, Gen, CombineFn<Gen, NewGen>>;
};

export type CreateReduxPackActionMap = Record<string, (state: any, action: Action<any>) => typeof state>;

export type CreateReduxPackType = {
  getSetName: (name: string) => string;
  getResetName: (name: string) => string;
  getRunName: (name: string) => string;
  getSuccessName: (name: string) => string;
  getFailName: (name: string) => string;
  getActionName: (name: string, actionName: string) => string;
  getValueName: (name: string) => string;
  getLoadingName: (name: string) => string;
  getResultName: (name: string) => string;
  getKeyName: (name: string, key: string) => string;
  getNameWithInstance: (name: string, instance?: string) => string;
  _generators: Record<string, CRPackArbitraryGen>;
  _reducers: Record<string, CRPackReducer>;
  _initialState: CRPackInitialState<any>;
  simpleDefaultActions: string[];
  requestDefaultActions: string[];
  _idGeneration: boolean;
  setDefaultIdGeneration: (val: boolean) => void;
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
};

type FN = (...args: any[]) => any;
type IsObject<T> = T extends Record<any, any> ? (T extends any[] ? false : true) : false;

type CombineObjects<T1, T2> = [never] extends T1
  ? any
  : [never] extends T2
  ? any
  : {
      [K in keyof T2 | keyof T1]: K extends keyof T2
        ? K extends keyof T1
          ? CombineFn<T1[K], T2[K]>
          : T2[K]
        : K extends keyof T1
        ? T1[K]
        : never;
    };

type CombineFns<T1 extends FN, T2 extends FN> = (
  ...params: Parameters<T2> extends never[] ? Parameters<T1> : Parameters<T2>
) => Combine<ReturnType<T1>, ReturnType<T2>>;

type Combine<T1, T2> = [never] extends T1
  ? any
  : [never] extends T2
  ? any
  : IsObject<T1> extends true
  ? IsObject<T2> extends true
    ? CombineObjects<T1, T2>
    : T2
  : T2;

export type CombineFn<T1, T2> = [never] extends T1
  ? any
  : [never] extends T2
  ? any
  : T1 extends FN
  ? T2 extends FN
    ? CombineFns<T1, T2>
    : T2
  : Combine<T1, T2>;

type Expandv2<T> = { [K in keyof T]: T[K] } & {};

type Expand<T> = Expandv2<T>;

type MergeByKey<T> = T extends Array<any> ? keyof T[number] : T extends Record<string, any> ? keyof T : never;

/*type CRPackPayloadMapEndItem<T, Actions extends PropertyKey, PayloadMain = any, SelectorRT = any> = {
  initial: T;
  formatPayload?: (payload: PayloadMain, action: Actions) => T;
  formatSelector?: (state: T) => SelectorRT;
  fallback?: T;
  actions?: Array<Actions>;
  mergeByKey?: MergeByKey<T> | string;
  modifyValue?: (payloadValue: T, prevStateValue: T, action: { code: Actions }) => T;
};*/

type CRPackMergable<T> = T extends Array<infer A> ? A | A[] : T extends Record<string, infer R> ? R | R[] : T;

type CRPackPayloadMapEndItem<T, Actions extends PropertyKey, PayloadMain = any, SelectorRT = any> = {
  initial: T;
  formatSelector?: (state: T) => SelectorRT;
  fallback?: T;
  actions?: Array<Actions>;
} & (
  | {
      mergeByKey?: never;
      formatMergePayload?: never;
      formatPayload?: (payload: PayloadMain, action: Actions) => T;
      modifyValue?: (payloadValue: T, prevStateValue: T, action: { code: Actions }) => T;
    }
  | {
      formatPayload?: never;
      modifyValue?: never;
      mergeByKey: MergeByKey<T>;
      formatMergePayload?: (payload: PayloadMain, action: Actions) => CRPackMergable<T>;
    }
);

type CRPackPayloadMapItem<T, Actions extends PropertyKey, PayloadMain = any, SelectorRT = any> =
  | CRPackPayloadMapEndItem<T, Actions, PayloadMain, SelectorRT>
  | (
      | { formatSelector?: (state: T) => SelectorRT }
      | {
          [K in keyof T]?: CRPackPayloadMapItem<T[K], Actions, PayloadMain>;
        }
    );

export type CreateReduxPackPayloadMap<S = any, Actions extends PropertyKey = any, Template = any> = {
  [P in keyof S]?: CRPackPayloadMapItem<
    S[P],
    Actions | (Template extends 'request' ? DefaultRequestActions : DefaultSimpleActions)
  >;
};

type DefaultRequestActions = Expand<'run' | 'success' | 'fail'>;
type DefaultSimpleActions = Expand<'set' | 'reset'>;

export type CRPackTemplates = Expand<'simple' | 'request'>;
export type CRPackDefaultTemplate = 'request';

export type Params<
  S = any,
  Actions extends PropertyKey = any,
  Template = any,
  Default = any,
  DefaultPayload = any,
  DefaultSelector = any
> = {
  name: string;
  reducerName: string;
  defaultInitial?: Default;
  defaultFallback?: Default;
  actions?: Actions[];
  idGeneration?: boolean;
  formatSelector?: (state: Default) => DefaultSelector;
  payloadMap?: CreateReduxPackPayloadMap<S, Actions, Template>;
} & (
  | {
      mergeByKey?: never;
      formatMergePayload?: never;
      modifyValue?: (payloadValue: Default, prevStateValue: Default) => Default;
      formatPayload?: (payload: DefaultPayload) => Default;
    }
  | {
      formatPayload?: never;
      modifyValue?: never;
      mergeByKey?: MergeByKey<Default>;
      formatMergePayload?: (
        payload: DefaultPayload,
      ) => Default extends Array<infer A> ? A : Default extends Record<string, infer R> ? R : Default;
    }
);

export type CRPackFN = <
  Config extends Params<S, Actions, Template>,
  S = any,
  Actions extends PropertyKey = any,
  Template extends CRPackTemplates = CRPackDefaultTemplate
>(
  info: { payloadMap?: CreateReduxPackPayloadMap<S, Actions, Template> } & Config & {
      actions?: Actions[];
      template?: Template;
    },
) => CRPackReturnType<Config, Template extends 'simple' ? CRPackSimpleGen<Config> : CRPackRequestGen<Config>>;

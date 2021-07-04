import { CreateReduxPackParams } from '../types';
declare const formatComplete: unique symbol;
export declare const formatParams: <S = Record<string, any>, PayloadMain = Record<string, any>>(rawParams: CreateReduxPackParams<S, PayloadMain, import("../types").CRPackPayloadMap<S>>) => CreateReduxPackParams<S, PayloadMain, import("../types").CRPackPayloadMap<S>> & Partial<Record<typeof formatComplete, boolean>>;
export {};

import { CreateReduxPackParams } from '../types';
declare const formatComplete: unique symbol;
export declare const formatParams: <S = Record<string, any>, PayloadMain = Record<string, any>>(rawParams: CreateReduxPackParams<S, PayloadMain>) => CreateReduxPackParams<S, PayloadMain> & Partial<Record<typeof formatComplete, boolean>>;
export {};

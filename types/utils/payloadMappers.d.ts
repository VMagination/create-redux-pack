import { CreateReduxPackPayloadMap } from '../types';
export declare const addStateParam: (obj: Record<string, any>, key: string, payloadMap: Record<string, any>, name: string, payload: any, payloadField: any, state: Record<string, any>, action: string, isMainAction: boolean, prefix?: string) => void;
export declare const addMappedPayloadToState: <S = Record<string, any>, PayloadMain = any>(obj: Record<string, any>, payloadMap: CreateReduxPackPayloadMap<S, any, any>, name: string, payload: PayloadMain, payloadField: any, state: Record<string, any>, action: string, isMainAction?: boolean, prefix?: string, isTop?: boolean) => void;
export declare const getInitial: (payloadMap: Record<string, any>, name: string) => Record<string, any>;
export declare const getStateNames: <S>(payloadMap: CreateReduxPackPayloadMap<S, any, any>, name: string) => Record<string, any>;
export declare const getSelectors: <S>(payloadMap: CreateReduxPackPayloadMap<S, any, any>, name: string, getReducerState: (state: any) => any) => Record<string, any>;

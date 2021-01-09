import { CreateReduxPackPayloadMap } from '../types';
export declare const addStateParam: (obj: Record<string, any>, key: string, payloadMap: Record<string, any>, name: string, payload: Record<string, any>, state: Record<string, any>, prefix?: string) => void;
export declare const addMappedPayloadToState: <S = Record<string, any>>(obj: Record<string, any>, payloadMap: CreateReduxPackPayloadMap<S>, name: string, payload: Record<string, any>, state: Record<string, any>, prefix?: string) => void;
export declare const getInitial: (payloadMap: Record<string, any>, name: string) => Record<string, any>;
export declare const getStateNames: <S>(payloadMap: CreateReduxPackPayloadMap<S>, name: string) => Record<string, any>;
export declare const getSelectors: <S>(payloadMap: CreateReduxPackPayloadMap<S>, name: string, getReducerState: (state: any) => any) => Record<string, any>;

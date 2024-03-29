import { CreateReduxPackPayloadMap } from '../types';
export declare const addStateParam: ({ obj, key, payloadMap, name, reducerName, payload, payloadField, state, mainState, instance, action, isMainAction, prefix, }: {
    obj: Record<string, any>;
    key: string;
    payloadMap: Record<string, any>;
    name: string;
    reducerName: string;
    payload: any;
    payloadField: any;
    state: Record<string, any>;
    mainState: Record<string, any>;
    action: string;
    isMainAction: boolean;
    prefix?: string | undefined;
    instance?: string | undefined;
}) => void;
export declare const addMappedPayloadToState: <S = Record<string, any>, PayloadMain = any>({ reducerName, obj, payloadMap, name, payload, payloadField, state, mainState, action, instance, isMainAction, prefix, isTop, }: {
    obj: Record<string, any>;
    payloadMap: CreateReduxPackPayloadMap<S, any, any>;
    name: string;
    reducerName: string;
    payload: PayloadMain;
    payloadField: any;
    state: Record<string, any>;
    mainState: Record<string, any>;
    action: string;
    isMainAction?: boolean | undefined;
    prefix?: string | undefined;
    instance?: string | undefined;
    isTop?: boolean | undefined;
}) => void;
export declare const getInitial: (payloadMap: Record<string, any>, name: string, instance?: string | undefined, action?: string | undefined) => Record<string, any>;
export declare const getStateNames: <S>(payloadMap: CreateReduxPackPayloadMap<S, any, any>, name: string) => Record<string, any>;
export declare const getSelectors: <S>(payloadMap: CreateReduxPackPayloadMap<S, any, any>, name: string, getReducerState: (state: any) => any) => Record<string, any>;

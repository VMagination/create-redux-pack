import { CreateReduxPackParams, CRPackGenObj, CRPackPayloadMap } from '../types';
export declare const mergeGenerators: <T = Record<string, any>, S = Record<string, any>, PayloadMain = Record<string, any>, PayloadMap extends CRPackPayloadMap<S> = any>(...generators: CRPackGenObj<S, PayloadMain, PayloadMap, CreateReduxPackParams<S, PayloadMain, PayloadMap>>[]) => T;

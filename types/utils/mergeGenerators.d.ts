import { CreateReduxPackParams } from '../types';
export declare const mergeGenerators: <T = Record<string, any>, S = Record<string, any>, PayloadMain = Record<string, any>>(...generators: Record<string, (info: CreateReduxPackParams<S, PayloadMain, any>) => any>[]) => T;

import { CreateReduxPackAction } from '../types';
export declare function createBaseAction<PA extends Function = any>(type: string, prepareAction?: PA): any;
export declare const createAction: <Payload extends any[], FP extends (...data: Payload) => any>(name: string, formatPayload?: FP | undefined) => CreateReduxPackAction<Parameters<FP>, ReturnType<FP>>;

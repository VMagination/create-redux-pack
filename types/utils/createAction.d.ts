import { CreateReduxPackAction } from '../types';
export declare const createAction: <Payload extends any[], FP extends (...data: Payload) => any>(name: string, formatPayload?: FP | undefined) => CreateReduxPackAction<Parameters<FP>, ReturnType<FP>>;

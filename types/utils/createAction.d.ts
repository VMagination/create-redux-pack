import { CreateReduxPackAction } from '../types';
export declare const createAction: <Payload, Result = Payload>(name: string, formatPayload?: ((data: Payload) => Result) | undefined) => CreateReduxPackAction<Payload, Payload | Result>;

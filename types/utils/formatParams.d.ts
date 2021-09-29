import { CRPackTemplates, Params, CreateReduxPackPayloadMap } from '../types';
declare const formatComplete: unique symbol;
export declare const formatParams: <Config extends Params<any, Actions, Template, any, any, any> = any, S = any, Actions extends PropertyKey = any, Template extends CRPackTemplates = "request">(rawParams: {
    payloadMap?: CreateReduxPackPayloadMap<S, Actions, Template> | undefined;
} & Config & {
    actions?: Actions[] | undefined;
    template?: Template | undefined;
}, defaultIdGeneration: boolean) => Config & {
    actions?: Actions[] | undefined;
    template?: Template | undefined;
} & Partial<Record<typeof formatComplete, boolean>>;
export {};

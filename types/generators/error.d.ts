import { CreateReduxPackAction, CRPackReducer, GetFormatPayloadType, Params } from '../types';
export declare const requestErrorGen: {
    stateNames: <Config extends Params<any, any, any, any, any, any>>({ name }: Config) => {
        error: string;
    };
    initialState: <Config_1 extends Params<any, any, any, any, any, any>>({ name }: Config_1) => {
        [x: string]: null;
    };
    selectors: <Config_2 extends Params<any, any, any, any, any, any>>({ name, reducerName }: Config_2) => {
        error: import("reselect").OutputSelector<any, unknown, (res: any) => unknown>;
    };
    actions: <Config_3 extends Params<any, any, any, any, any, any>>({ name }: Config_3) => {
        fail: CreateReduxPackAction<[[GetFormatPayloadType<Config_3["payloadMap"], "fail", false>] extends [never] ? any : any], [[GetFormatPayloadType<Config_3["payloadMap"], "fail", false>] extends [never] ? any : any]>;
    };
    reducer: <Config_4 extends Params<any, any, any, any, any, any>>({ name }: Config_4) => CRPackReducer;
};

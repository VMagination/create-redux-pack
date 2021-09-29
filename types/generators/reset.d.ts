import { CreateReduxPackAction, CRPackReducer, Params } from '../types';
export declare const resetActionGen: {
    actions: <Config extends Params<any, any, any, any, any, any>>({ name }: Config) => {
        reset: CreateReduxPackAction<[void], [void]>;
    };
    reducer: <Config_1 extends Params<any, any, any, any, any, any>>({ name }: Config_1, originalResult: any) => CRPackReducer;
};

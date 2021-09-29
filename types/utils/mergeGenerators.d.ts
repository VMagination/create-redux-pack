import { CombineFn, Params, CRPackWithGen } from '../types';
export declare const mergeGenerators: <Config extends Params<any, any, any, any, any, any>, Gen1 extends CRPackWithGen<Config, any>, Gen2 extends CRPackWithGen<Config, any>>(generators_0: Gen1, generators_1: Gen2) => CombineFn<Gen1, Gen2>;

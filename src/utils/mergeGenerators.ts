import { Action, CombineFn, Params, CRPackWithGen } from '../types';
import {removeMarked} from "./createReducerCase";

export const mergeGenerators = <
  Config extends Params,
  Gen1 extends CRPackWithGen<Config, any>,
  Gen2 extends CRPackWithGen<Config, any>
>(
  ...generators: [Gen1, Gen2]
): CombineFn<Gen1, Gen2> => {
  try {
    const keyList = [...new Set(generators.reduce<string[]>((accum, gen) => [...accum, ...Object.keys(gen)], []))];
    let reducer: (...args: [Config, any]) => Record<string, any> = () => ({});
    if (keyList.includes('reducer')) {
      reducer = (...args) => {
        const reducers = generators
          .filter((gen) => gen.hasOwnProperty('reducer'))
          .map((gen) => gen.reducer(...args))
          .filter((gen) => gen && typeof gen === 'object' && gen?.constructor?.name === 'Object');
        const reducersKeys = [
          ...new Set(reducers.reduce<string[]>((accum, reducer) => [...accum, ...Object.keys(reducer)], [])),
        ];
        return reducersKeys.reduce(
          (accum, reducerKey) => ({
            ...accum,
            [reducerKey]: (state: Record<string, any> = {}, action: Action<any>, isMerging = false) => {
              const currentReducers = reducers.filter((reducer) => reducer.hasOwnProperty(reducerKey));
              return currentReducers.reduce(
                (innerAccum, currentReducer) => {
                  let toReturn = currentReducer[reducerKey](state, action, true);
                  const toReturnKeys = Object.keys(toReturn);
                  if (toReturnKeys.length >= Object.keys(state).length) {
                    console.warn(
                      'CRPack: mergeGenerators received a reducer case with state directly added in result, to improve performance please use createReducerCase and prevent previous state from spreading into result, found in',
                      reducerKey,
                    );
                    toReturn = toReturnKeys.reduce(
                      (accum, key) => ({
                        ...accum,
                        ...(!state[key] || toReturn[key] !== state[key] ? { [key]: toReturn[key] } : {}),
                      }),
                      {},
                    );
                  }
                  const nextState = {
                    ...innerAccum,
                    ...toReturn,
                  };
                  removeMarked(nextState);
                  return nextState;
                },
                isMerging ? {} : { ...state },
              );
            },
          }),
          {},
        );
      };
    }
    const result = keyList.reduce(
      (accum, key) => ({
        ...accum,
        [key]: (...args: [Config, any]) => {
          return generators
            .filter((gen) => gen.hasOwnProperty(key))
            .reduce((accum, gen) => {
              const result = gen[key](...args);
              return result && typeof result === 'object' ? { ...accum, ...gen[key](...args) } : gen[key](...args);
            }, {});
        },
      }),
      {} as Record<string, any>,
    );
    return ({
      ...result,
      reducer,
    } as unknown) as CombineFn<Gen1, Gen2>;
  } catch (e) {
    throw new Error('CRPack: mergeGenerators received invalid generators');
  }
};

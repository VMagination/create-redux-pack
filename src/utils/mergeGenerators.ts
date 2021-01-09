import { Action, CreateReduxPackParams } from '../types';

export const mergeGenerators = <T = Record<string, any>, S = Record<string, any>, PayloadMain = Record<string, any>>(
  ...generators: Record<string, (info: CreateReduxPackParams<S, PayloadMain>) => any>[]
): T => {
  try {
    const keyList = [...new Set(generators.reduce<string[]>((accum, gen) => [...accum, ...Object.keys(gen)], []))];
    let reducer: (info: CreateReduxPackParams<any, any>) => Record<string, any> = () => ({});
    if (keyList.includes('reducer')) {
      reducer = (info) => {
        const reducers = generators
          .filter((gen) => gen.hasOwnProperty('reducer'))
          .map((gen) => gen.reducer(info))
          .filter((gen) => gen && typeof gen === 'object' && gen?.constructor?.name === 'Object');
        const reducersKeys = [
          ...new Set(reducers.reduce<string[]>((accum, reducer) => [...accum, ...Object.keys(reducer)], [])),
        ];
        return reducersKeys.reduce(
          (accum, reducerKey) => ({
            ...accum,
            [reducerKey]: (state: Record<string, any> = {}, action: Action<any>) => {
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
                  return {
                    ...innerAccum,
                    ...toReturn,
                  };
                },
                { ...state },
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
        [key]: (info: CreateReduxPackParams<any, any>) => {
          return generators
            .filter((gen) => gen.hasOwnProperty(key))
            .reduce((accum, gen) => ({ ...accum, ...gen[key](info) }), {});
        },
      }),
      {} as Record<string, any>,
    );
    return ({
      ...result,
      reducer,
    } as unknown) as T;
  } catch (e) {
    throw new Error('CRPack: mergeGenerators received invalid generators');
  }
};

import { createSelector as createReSelector, OutputSelector } from 'reselect';

export const createSelector = <T>(reducerName: string, stateKey: string): OutputSelector<any, T, (res: any) => T> =>
  createReSelector<any, any, T>(
    (state) => state[reducerName],
    (state) => state[stateKey],
  );

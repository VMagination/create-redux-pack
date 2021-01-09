import { createSelector as createReSelector, OutputSelector } from 'reselect';

export const createSelector = <RT, DT = any>(
  reducerOrSource: string | ((state: any) => DT),
  keyOrFormat: string | ((state: DT) => RT),
): OutputSelector<any, RT, (res: DT) => RT> => {
  const source = typeof reducerOrSource === 'string' ? (state: any) => state[reducerOrSource] : reducerOrSource;
  const selection = typeof keyOrFormat === 'string' ? (state: any) => state[keyOrFormat] : keyOrFormat;
  return createReSelector<any, DT, RT>(source, selection);
};

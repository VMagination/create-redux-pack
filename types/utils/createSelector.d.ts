import { OutputSelector } from 'reselect';
export declare const createSelector: <RT, DT = any>(reducerOrSource: string | ((state: any) => DT), keyOrFormat: string | ((state: DT) => RT)) => OutputSelector<any, RT, (res: DT) => RT>;

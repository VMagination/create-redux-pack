import { OutputSelector } from 'reselect';
export declare const createSelector: <T>(reducerName: string, stateKey: string) => OutputSelector<any, T, (res: any) => T>;

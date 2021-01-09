import { CreateReduxPackParams } from '../types';

const formatComplete: unique symbol = Symbol('format complete');

export const formatParams = <S = Record<string, any>, PayloadMain = Record<string, any>>(
  rawParams: CreateReduxPackParams<S, PayloadMain>,
): CreateReduxPackParams<S, PayloadMain> & Partial<Record<typeof formatComplete, boolean>> => {
  try {
    const { name: paramsName = 'NamelessPack', reducerName = 'UnspecifiedReducer', ...params } = rawParams;
    if (formatComplete in params) return rawParams;
    const name = `[${paramsName}]: CRPack-${Math.random().toString(36).substr(2, 9)}`;
    return { name, reducerName, [formatComplete]: true, ...params };
  } catch (e) {
    throw Error('CRPack received invalid package info');
  }
};

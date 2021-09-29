import { CreateReduxPackPayloadMap } from '../types';
import { createSelector as createReSelector } from 'reselect';
import { getReadableKey } from './getReadableKey';
import { getKeyName } from './nameGetters';
import { makeKeysReadable } from './makeKeysReadable';
import { mergePayloadByKey } from './mergePayloadByKey';

const shouldRecursionEnd = (payloadMapByKey: any) => 'initial' in payloadMapByKey;

const empty = Symbol('CRPack value: empty');

const isTreeEmpty = (obj: any): boolean => {
  const c = Object.keys(obj).every((key) => {
    if (obj[key] && typeof obj[key] === 'object') {
      return isTreeEmpty(obj[key]);
    }
    return obj[key] === empty;
  });
  return c;
};

const setEmptyTrees = (obj: any) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        return isTreeEmpty(obj[key]) ? (obj[key] = empty) : setEmptyTrees(obj[key]);
      }
    });
  }
  return obj;
};

const removeEmpties = (obj: any, initial = true) => {
  initial && setEmptyTrees(obj);
  Object.keys(obj).forEach((key) =>
    obj[key] === empty ? delete obj[key] : obj[key] && typeof obj[key] === 'object' && removeEmpties(obj[key]),
  );
  return obj;
};

export const addStateParam = (
  obj: Record<string, any>,
  key: string,
  payloadMap: Record<string, any>,
  name: string,
  payload: any,
  payloadField: any,
  state: Record<string, any>,
  action: string,
  isMainAction: boolean,
  prefix = '',
): void => {
  const payloadMapByKey = payloadMap[key];
  const stateKey = getKeyName(name, `${prefix}${key}`);
  if ((isMainAction && !payloadMapByKey?.actions) || payloadMapByKey?.actions?.includes(action)) {
    const format = payloadMapByKey?.formatPayload || payloadMapByKey?.formatMergePayload;
    const payloadValue = (format ? format(payload) : payloadField) ?? payloadMapByKey?.fallback;
    const modification = payloadMapByKey?.modifyValue;
    obj[stateKey] = modification
      ? modification(payloadValue, state[stateKey], { code: action })
      : mergePayloadByKey(state[stateKey], payloadValue, payloadMapByKey?.mergeByKey);
  } else {
    obj[stateKey] = empty;
  }
};

export const addMappedPayloadToState = <S = Record<string, any>, PayloadMain = any>(
  obj: Record<string, any>,
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  payload: PayloadMain,
  payloadField: any,
  state: Record<string, any>,
  action: string,
  isMainAction = false,
  prefix = '',
  isTop = true,
): void => {
  const keys = Object.keys(payloadMap).filter((key) => key !== 'key');
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    if (shouldRecursionEnd(payloadMapByKey)) {
      addStateParam(obj, key, payloadMap, name, payload, payloadField?.[key], state, action, isMainAction, prefix);
      if (isTop) {
        setEmptyTrees(obj);
        removeEmpties(obj);
      }
      return;
    }
    const innerKey = getKeyName(name, `${prefix}${key}`);
    obj[innerKey] = { ...state[innerKey], ...(obj[innerKey] || {}) };
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    addMappedPayloadToState(
      obj[innerKey],
      payloadMapByKey,
      name,
      payload,
      payloadField?.[key],
      state[innerKey],
      action,
      isMainAction,
      nextPrefix,
      false,
    );
    if (isTop) {
      setEmptyTrees(obj);
      removeEmpties(obj);
    }
  });
};

export const getInitial = (payloadMap: Record<string, any>, name: string): Record<string, any> => {
  const initial = {};
  addMappedInitialToState(initial, payloadMap, name);
  return initial;
};

const addMappedInitialToState = <S = Record<string, any>>(
  obj: Record<string, any>,
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  prefix = '',
) => {
  const keys = Object.keys(payloadMap).filter((key) => key !== 'key');
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    const innerKey = getKeyName(name, `${prefix}${key}`);
    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[innerKey] = payloadMapByKey.initial;
      return;
    }
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    obj[innerKey] = obj[innerKey] || {};
    addMappedInitialToState(obj[innerKey], payloadMapByKey, name, nextPrefix);
  });
};

export const getStateNames = <S>(payloadMap: CreateReduxPackPayloadMap<S>, name: string): Record<string, any> => {
  const stateNames = {};
  addMappedStateNames(stateNames, payloadMap, name);
  return stateNames;
};

const wrapStateName = (key: any): any =>
  new Proxy(new String(key), {
    get: (t: any, p) =>
      typeof t[p] === 'function' ? t[p].bind(key) : typeof p === 'string' ? (p in t && t[p]) || wrapStateName(p) : t[p],
  });

const addMappedStateNames = <S = Record<string, any>>(
  obj: Record<string, any>,
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  prefix = '',
) => {
  const keys = Object.keys(payloadMap).filter((key) => key !== 'key');
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[key] = wrapStateName(getKeyName(name, `${prefix}${key}`));
      return;
    }
    const innerKeys = {};
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    addMappedStateNames(innerKeys, payloadMapByKey, name, nextPrefix);
    obj[key] = Object.assign(getKeyName(name, `${prefix}${key}`), innerKeys);
  });
};

export const getSelectors = <S>(
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  getReducerState: (state: any) => any,
): Record<string, any> => {
  const selectors = {};
  addMappedSelectors(selectors, payloadMap, name, getReducerState);
  return selectors;
};

const selectorContent = Symbol('CRPack selector content');

const wrapSelector = (prevSelector: any, key: any, format = (state: any) => state): any =>
  new Proxy(
    createReSelector(prevSelector, (state: any) => format((state || {})[key])),
    {
      get: (target: any, p) => {
        if (!target[selectorContent]) {
          target[selectorContent] = {
            [p]: wrapSelector(
              createReSelector(prevSelector, (state: any) => (state || {})[key]),
              p,
            ),
          };
        } else {
          if (!target[selectorContent][p]) {
            target[selectorContent][p] = wrapSelector(
              createReSelector(prevSelector, (state: any) => (state || {})[key]),
              p,
            );
          }
        }
        return target[selectorContent][p];
      },
    },
  );

const addMappedSelectors = <S = Record<string, any>>(
  obj: Record<string, any>,
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  prevSelector: (state: any) => any,
  prefix = '',
) => {
  const keys = Object.keys(payloadMap).filter((key) => key !== 'key');
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    const innerKey = getKeyName(name, `${prefix}${key}`);
    if (shouldRecursionEnd(payloadMapByKey)) {
      const format = payloadMapByKey?.formatSelector || ((state: any) => state);
      obj[key] = wrapSelector(prevSelector, innerKey, format);
      return;
    }
    const innerSelectors = {};
    const sourceSelector = createReSelector(prevSelector, (state: any) => {
      const getReadable = (() => {
        let lastResult: any = null;
        return (target: any) => {
          if (lastResult) return lastResult;
          lastResult = makeKeysReadable(target);
          return lastResult;
        };
      })();
      return state[innerKey] && typeof state[innerKey] === 'object'
        ? new Proxy(
            { ...state[innerKey] },
            {
              get: (target, key) => (key in target ? target[key] : getReadable(target)[key]),
              has: (target, key) => key in target || key in getReadable(target),
              ownKeys: (target) => Reflect.ownKeys(getReadable(target)),
              getOwnPropertyDescriptor: (target, key) => Reflect.getOwnPropertyDescriptor(getReadable(target), key),
            },
          )
        : state[innerKey];
    });
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    addMappedSelectors(innerSelectors, payloadMapByKey, name, sourceSelector, nextPrefix);
    obj[key] = Object.assign(sourceSelector, innerSelectors);
  });
};

import { CreateReduxPackPayloadMap } from '../types';
import { createSelector as createReSelector } from 'reselect';
import { getReadableKey } from './getReadableKey';
import { DefaultStateNames, getKeyName, getNameWithInstance } from './nameGetters';
import { makeKeysReadable } from './makeKeysReadable';
import { mergableRemoveSymbol, mergePayloadByKey } from './mergePayloadByKey';
import { selectorWithInstances } from './selectorWithInstances';

const shouldRecursionEnd = (payloadMapByKey: any) => 'initial' in payloadMapByKey;

const empty = Symbol('CRPack value: empty');

const isTreeEmpty = (obj: any): boolean => {
  const keys = Object.keys(obj);
  const result =
    Boolean(keys.length) &&
    keys.every((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        return isTreeEmpty(obj[key]);
      }
      return obj[key] === empty;
    });
  return result;
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

export const addStateParam = ({
  obj,
  key,
  payloadMap,
  name,
  reducerName,
  payload,
  payloadField,
  state,
  mainState,
  instance,
  action,
  isMainAction,
  prefix = '',
}: {
  obj: Record<string, any>;
  key: string;
  payloadMap: Record<string, any>;
  name: string;
  reducerName: string;
  payload: any;
  payloadField: any;
  state: Record<string, any>;
  mainState: Record<string, any>;
  action: string;
  isMainAction: boolean;
  prefix?: string;
  instance?: string;
}): void => {
  const payloadMapByKey = payloadMap[key];
  const instanced = payloadMapByKey?.instanced;
  const isInstanced = Array.isArray(instanced) ? instanced.includes(action) : payloadMapByKey?.instanced;
  let stateKey = getNameWithInstance(getKeyName(name, `${prefix}${key}`), isInstanced ? instance : undefined);
  if (
    payloadMapByKey?.actionToValue?.[action] ||
    (isMainAction && !payloadMapByKey?.actions) ||
    payloadMapByKey?.actions?.includes(action)
  ) {
    const format = payloadMapByKey?.formatPayload || payloadMapByKey?.formatMergePayload;
    const payloadValue =
      (format ? format(payload, action, mergableRemoveSymbol) : payloadField) ?? payloadMapByKey?.fallback;
    const modification =
      ('actionToValue' in payloadMapByKey && typeof payloadMapByKey?.actionToValue === 'function'
        ? payloadMapByKey?.actionToValue
        : payloadMapByKey?.actionToValue?.[action]) || payloadMapByKey?.modifyValue;
    const newValue = modification
      ? modification(
          payloadMapByKey?.actionToValue ? payload ?? payloadMapByKey?.fallback : payloadValue,
          state[stateKey] ?? payloadMapByKey?.initial,
          {
            code: action,
            instance,
            forceInstance: (instanceName?: string) => {
              stateKey = getNameWithInstance(getKeyName(name, `${prefix}${key}`), instanceName);
            },
            updateInstances: (instances: Record<string, (val: any) => any>) => {
              if (!instances) return;
              Object.entries(instances).forEach(([instanceName, item]) => {
                const instanceKey = getNameWithInstance(getKeyName(name, `${prefix}${key}`), instanceName);
                obj[instanceKey] =
                  typeof item === 'function' ? item(state[instanceKey] ?? payloadMapByKey?.initial) : item;
              });
            },
            getInstancedValue: (instanceName?: string) =>
              state[getNameWithInstance(getKeyName(name, `${prefix}${key}`), instanceName)] ?? payloadMapByKey?.initial,
            getStateWithSelector: (selector: any) => selector({ [reducerName]: mainState }),
          },
        )
      : mergePayloadByKey(state[stateKey] ?? payloadMapByKey?.initial, payloadValue, payloadMapByKey?.mergeByKey);
    obj[stateKey] = newValue;
  } else if (!DefaultStateNames[`${prefix}${key}`]) {
    obj[stateKey] = empty;
  }
};

export const addMappedPayloadToState = <S = Record<string, any>, PayloadMain = any>({
  reducerName,
  obj,
  payloadMap,
  name,
  payload,
  payloadField,
  state,
  mainState,
  action,
  instance,
  isMainAction = false,
  prefix = '',
  isTop = true,
}: {
  obj: Record<string, any>;
  payloadMap: CreateReduxPackPayloadMap<S>;
  name: string;
  reducerName: string;
  payload: PayloadMain;
  payloadField: any;
  state: Record<string, any>;
  mainState: Record<string, any>;
  action: string;
  isMainAction?: boolean;
  prefix?: string;
  instance?: string;
  isTop?: boolean;
}): void => {
  const keys = Object.keys(payloadMap);
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    if (shouldRecursionEnd(payloadMapByKey)) {
      addStateParam({
        reducerName,
        obj,
        key,
        payloadMap,
        name,
        payload,
        payloadField: payloadField?.[key],
        state,
        mainState,
        action,
        instance,
        isMainAction,
        prefix,
      });
      if (isTop) {
        setEmptyTrees(obj);
        removeEmpties(obj);
      }
      return;
    }
    const innerKey = getKeyName(name, `${prefix}${key}`);
    obj[innerKey] = { ...state[innerKey], ...(obj[innerKey] || {}) };
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    addMappedPayloadToState({
      reducerName,
      obj: obj[innerKey],
      payloadMap: payloadMapByKey,
      name,
      payload,
      payloadField: payloadField?.[key],
      state: state[innerKey],
      mainState,
      action,
      instance,
      isMainAction,
      prefix: nextPrefix,
      isTop: false,
    });
    if (isTop) {
      setEmptyTrees(obj);
      removeEmpties(obj);
    }
  });
};

export const getInitial = (
  payloadMap: Record<string, any>,
  name: string,
  instance?: string,
  action?: string,
): Record<string, any> => {
  const initial = {};
  addMappedInitialToState(initial, payloadMap, name, instance, action);
  return initial;
};

const addMappedInitialToState = <S = Record<string, any>>(
  obj: Record<string, any>,
  payloadMap: CreateReduxPackPayloadMap<S>,
  name: string,
  instance?: string,
  action?: string,
  prefix = '',
) => {
  const keys = Object.keys(payloadMap);
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    const innerKey = getKeyName(name, `${prefix}${key}`);
    if (shouldRecursionEnd(payloadMapByKey)) {
      const instanced = payloadMapByKey?.instanced;
      const isInstanced = Array.isArray(instanced) ? instanced.includes(action) : payloadMapByKey?.instanced;
      obj[getNameWithInstance(innerKey, isInstanced ? instance : undefined)] = payloadMapByKey.initial;
      return;
    }
    const nextPrefix = `${prefix}${getReadableKey(key)}.`;
    obj[innerKey] = obj[innerKey] || {};
    addMappedInitialToState(obj[innerKey], payloadMapByKey, name, instance, action, nextPrefix);
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
  const keys = Object.keys(payloadMap);
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

const wrapSelector = (
  prevSelector: any,
  key: any,
  format = (state: any) => state,
  initial = undefined,
  isTop = false,
): any =>
  new Proxy(
    isTop
      ? selectorWithInstances(prevSelector, key, initial, format)
      : createReSelector(prevSelector, (state: any) => format((state || {})[key])),
    {
      get: (target: any, p, s) => {
        if (Reflect.get(target, p, s)) return Reflect.get(target, p, s);
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
  const keys = Object.keys(payloadMap);
  keys.forEach((key) => {
    const payloadMapByKey: any = payloadMap[key as keyof S];
    const innerKey = getKeyName(name, `${prefix}${key}`);
    if (shouldRecursionEnd(payloadMapByKey)) {
      const format = payloadMapByKey?.formatSelector || ((state: any) => state);
      obj[key] = wrapSelector(prevSelector, innerKey, format, payloadMapByKey?.initial, true);
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

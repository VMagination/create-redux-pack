import { createAction as createAction$1, createReducer, configureStore as configureStore$1 } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { createSelector as createSelector$1 } from 'reselect';

const mergeGenerators = (...generators) => {
  try {
    const keyList = [...new Set(generators.reduce((accum, gen) => [...accum, ...Object.keys(gen)], []))];

    let reducer = () => ({});

    if (keyList.includes('reducer')) {
      reducer = info => {
        const reducers = generators.filter(gen => gen.hasOwnProperty('reducer')).map(gen => gen.reducer(info)).filter(gen => gen && typeof gen === 'object' && gen?.constructor?.name === 'Object');
        const reducersKeys = [...new Set(reducers.reduce((accum, reducer) => [...accum, ...Object.keys(reducer)], []))];
        return reducersKeys.reduce((accum, reducerKey) => ({ ...accum,
          [reducerKey]: (state = {}, action) => {
            const currentReducers = reducers.filter(reducer => reducer.hasOwnProperty(reducerKey));
            return currentReducers.reduce((innerAccum, currentReducer) => {
              let toReturn = currentReducer[reducerKey](state, action, true);
              const toReturnKeys = Object.keys(toReturn);

              if (toReturnKeys.length >= Object.keys(state).length) {
                console.warn('CRPack: mergeGenerators received a reducer case with state directly added in result, to improve performance please use createReducerCase and prevent previous state from spreading into result, found in', reducerKey);
                toReturn = toReturnKeys.reduce((accum, key) => ({ ...accum,
                  ...(!state[key] || toReturn[key] !== state[key] ? {
                    [key]: toReturn[key]
                  } : {})
                }), {});
              }

              return { ...innerAccum,
                ...toReturn
              };
            }, { ...state
            });
          }
        }), {});
      };
    }

    const result = keyList.reduce((accum, key) => ({ ...accum,
      [key]: info => {
        return generators.filter(gen => gen.hasOwnProperty(key)).reduce((accum, gen) => ({ ...accum,
          ...gen[key](info)
        }), {});
      }
    }), {});
    return { ...result,
      reducer
    };
  } catch (e) {
    throw new Error('CRPack: mergeGenerators received invalid generators');
  }
};

const createReducerCase = reducerCase => {
  return (state, action, isMerging) => ({ ...(isMerging ? {} : state),
    ...reducerCase(state, action)
  });
};

const createAction = (name, formatPayload) => createAction$1(name, data => ({
  payload: formatPayload ? formatPayload(data) : data
}));

const createSelector = (reducerOrSource, keyOrFormat) => {
  const source = typeof reducerOrSource === 'string' ? state => state[reducerOrSource] : reducerOrSource;
  const selection = typeof keyOrFormat === 'string' ? state => state[keyOrFormat] : keyOrFormat;
  return createSelector$1(source, selection);
};

const mergeObjects = (target, source) => {
  const targetCopy = { ...target
  };

  const merge = (target, source) => {
    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
    });
    Object.assign(target ?? {}, source);
    return target;
  };

  merge(targetCopy, source);
  return targetCopy;
};

const formatComplete = Symbol('format complete');
const formatParams = rawParams => {
  try {
    const {
      name: paramsName = 'NamelessPack',
      reducerName = 'UnspecifiedReducer',
      ...params
    } = rawParams;
    if (formatComplete in params) return rawParams;
    const name = `[${paramsName}]: CRPack-${Math.random().toString(36).substr(2, 9)}`;
    return {
      name,
      reducerName,
      [formatComplete]: true,
      ...params
    };
  } catch (e) {
    throw Error('CRPack received invalid package info');
  }
};

const RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';
const resetAction = Object.assign(createAction$1(RESET_ACTION_TYPE), {
  type: RESET_ACTION_TYPE
});

const hasCRPackName = name => /\[.+]: CRPack-.{9}/.test(name);

const makeKeysReadable = obj => {
  if (!(obj && typeof obj === 'object')) return obj;
  const result = { ...obj
  };

  const renameKeys = origin => {
    const keys = Object.keys(origin || {}).filter(hasCRPackName);
    if (!keys.length) return origin;
    const copy = { ...origin
    };
    keys.forEach(k => {
      const [, realKey] = k.match(/\.([^. ]+) /) || [];

      if (realKey) {
        copy[realKey] = renameKeys(copy[k]);
        delete copy[k];
        return;
      }
    });
    return copy;
  };

  return renameKeys(result);
};

const shouldRecursionEnd = payloadMapByKey => 'initial' in payloadMapByKey;

const addStateParam = (obj, key, payloadMap, name, payload, state, prefix = '') => {
  const payloadMapByKey = payloadMap[key];
  const param = payloadMapByKey?.key || key;
  const modification = payloadMapByKey?.modifyValue;
  const payloadValue = param ? getIt(payload, param, payloadMapByKey?.fallback) : payload;
  const stateKey = createReduxPack.getKeyName(name, `${prefix}${key}`);
  obj[stateKey] = modification ? modification(payloadValue, state[stateKey]) : payloadValue;
};

const getIt = (obj = {}, path = '', defaultValue = undefined) => {
  const find = regexp => path.split(regexp).filter(Boolean).reduce((res, key) => res ?? false ? res[key] : res, obj);

  const found = find(/[,[\]]+?/) || find(/[,[\].]+?/);
  return found === undefined || found === obj ? defaultValue : found;
};

const addMappedPayloadToState = (obj, payloadMap, name, payload, state, prefix = '') => {
  const keys = Object.keys(payloadMap).filter(key => key !== 'key');
  keys.forEach(key => {
    const payloadMapByKey = payloadMap[key];

    if (shouldRecursionEnd(payloadMapByKey)) {
      console.log(payloadMapByKey);
      return addStateParam(obj, key, payloadMap, name, payload, state, prefix);
    }

    const param = payloadMapByKey?.key;
    const innerKey = createReduxPack.getKeyName(name, `${prefix}${key}`);
    obj[innerKey] = { ...state[innerKey],
      ...(obj[innerKey] || {})
    };
    const payloadParam = param ? getIt(payload, param) : payload;
    const nextPrefix = `${prefix}${!hasCRPackName(key) ? key : key.replace(/ of .+/, '')}.`;
    addMappedPayloadToState(obj[innerKey], payloadMapByKey, name, payloadParam, state[innerKey], nextPrefix);
  });
};
const getInitial = (payloadMap, name) => {
  const initial = {};
  addMappedInitialToState(initial, payloadMap, name);
  return initial;
};

const addMappedInitialToState = (obj, payloadMap, name, prefix = '') => {
  const keys = Object.keys(payloadMap).filter(key => key !== 'key');
  keys.forEach(key => {
    const payloadMapByKey = payloadMap[key];
    const innerKey = createReduxPack.getKeyName(name, `${prefix}${key}`);

    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[innerKey] = payloadMapByKey.initial;
      return;
    }

    const nextPrefix = `${prefix}${!hasCRPackName(key) ? key : key.replace(/ of .+/, '')}.`;
    obj[innerKey] = obj[innerKey] || {};
    addMappedInitialToState(obj[innerKey], payloadMapByKey, name, nextPrefix);
  });
};

const getStateNames = (payloadMap, name) => {
  const stateNames = {};
  addMappedStateNames(stateNames, payloadMap, name);
  return stateNames;
};

const wrapStateName = key => new Proxy(new String(key), {
  get: (t, p) => typeof t[p] === 'function' ? t[p].bind(key) : typeof p === 'string' ? p in t && t[p] || wrapStateName(p) : t[p]
});

const addMappedStateNames = (obj, payloadMap, name, prefix = '') => {
  const keys = Object.keys(payloadMap).filter(key => key !== 'key');
  keys.forEach(key => {
    const payloadMapByKey = payloadMap[key];

    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[key] = wrapStateName(createReduxPack.getKeyName(name, `${prefix}${key}`));
      return;
    }

    const innerKeys = {};
    const nextPrefix = `${prefix}${!hasCRPackName(key) ? key : key.replace(/ of .+/, '')}.`;
    addMappedStateNames(innerKeys, payloadMapByKey, name, nextPrefix);
    obj[key] = Object.assign(createReduxPack.getKeyName(name, `${prefix}${key}`), innerKeys);
  });
};

const getSelectors = (payloadMap, name, getReducerState) => {
  const selectors = {};
  addMappedSelectors(selectors, payloadMap, name, getReducerState);
  return selectors;
};
const selectorContent = Symbol('CRPack selector content');

const wrapSelector = (prevSelector, key, format = state => state) => new Proxy(createSelector$1(prevSelector, state => format((state || {})[key])), {
  get: (target, p) => {
    if (!target[selectorContent]) {
      target[selectorContent] = {
        [p]: wrapSelector(target, p)
      };
    } else {
      if (!target[selectorContent][p]) {
        target[selectorContent][p] = wrapSelector(target, p);
      }
    }

    return target[selectorContent][p];
  }
});

const addMappedSelectors = (obj, payloadMap, name, prevSelector, prefix = '') => {
  const keys = Object.keys(payloadMap).filter(key => key !== 'key');
  keys.forEach(key => {
    const payloadMapByKey = payloadMap[key];
    const innerKey = createReduxPack.getKeyName(name, `${prefix}${key}`);

    if (shouldRecursionEnd(payloadMapByKey)) {
      const format =
      /*payloadMapByKey?.formatSelector || */
      state => state;

      obj[key] = wrapSelector(prevSelector, innerKey, format);
      return;
    }

    const innerSelectors = {};
    const sourceSelector = createSelector$1(prevSelector, state => {
      const getReadable = (() => {
        let lastResult = null;
        return target => {
          if (lastResult) return lastResult;
          lastResult = makeKeysReadable(target);
          return lastResult;
        };
      })();

      return state[innerKey] && typeof state[innerKey] === 'object' ? new Proxy({ ...state[innerKey]
      }, {
        get: (target, key) => key in target ? target[key] : getReadable(target)[key],
        has: (target, key) => key in target || key in getReadable(target),
        ownKeys: target => Reflect.ownKeys(getReadable(target)),
        getOwnPropertyDescriptor: (target, key) => Reflect.getOwnPropertyDescriptor(getReadable(target), key)
      }) : state[innerKey];
    });
    const nextPrefix = `${prefix}${!hasCRPackName(key) ? key : key.replace(/ of .+/, '')}.`;
    addMappedSelectors(innerSelectors, payloadMapByKey, name, sourceSelector, nextPrefix);
    obj[key] = Object.assign(sourceSelector, innerSelectors);
  });
};

const loggerMatcher = () => true;

const createReduxPack = Object.assign(infoRaw => {
  const info = formatParams(infoRaw);
  const {
    reducerName
  } = info;

  const generatedReducerPart = createReduxPack._generator.reducer(info);

  const generatedInitialStatePart = createReduxPack._generator.initialState(info);

  createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);
  const pack = {
    name: info.name,
    stateNames: createReduxPack._generator.stateNames(info),
    actionNames: createReduxPack._generator.actionNames(info),
    actions: createReduxPack._generator.actions(info),
    selectors: createReduxPack._generator.selectors(info),
    initialState: generatedInitialStatePart,
    reducer: generatedReducerPart
  };
  return Object.assign(pack, {
    withGenerator: generator => createReduxPack.withGenerator(info, generator)
  });
}, {
  _reducers: {},
  _initialState: {},
  isLoggerOn: false,
  getRootReducer: (reducers, initialState) => {
    const combinedObjects = Object.keys(reducers || {}).reduce((accum, key) => ({ ...accum,
      ...(accum[key] ? {
        [key]: { ...accum[key],
          ...(reducers || {})[key]
        }
      } : {
        [key]: (reducers || {})[key]
      })
    }), createReduxPack._reducers);
    createReduxPack._reducers = combinedObjects;
    const combinedReducers = Object.keys(combinedObjects).reduce((accum, key) => {
      const initial = initialState && initialState[key] ? { ...createReduxPack._initialState[key],
        ...initialState[key]
      } : createReduxPack._initialState[key];
      createReduxPack._initialState[key] = initial;
      return { ...accum,
        [key]: createReducer(initial, combinedObjects[key])
      };
    }, createReduxPack.isLoggerOn ? {
      __Create_Redux_Pack_Logger__: createReducer({}, {}, [{
        matcher: loggerMatcher,
        reducer: (state, action) => {
          console.log(`CRPack_Logger: ${action.type}`, {
            payload: action.payload
          });
          return { ...state
          };
        }
      }])
    } : {});
    return (state, action) => {
      if (action.type === resetAction.type) return createReduxPack._initialState;
      return combineReducers(combinedReducers)(state, action);
    };
  },
  withGenerator: (infoRaw, generator) => {
    const info = formatParams(infoRaw);
    const {
      reducerName
    } = info;
    const mergedGen = mergeGenerators(createReduxPack._generator, generator);
    const pack = { ...Object.keys(mergedGen).reduce((accum, key) => ({ ...accum,
        [key]: mergedGen[key](info)
      }), {}),
      name: info.name
    };
    createReduxPack.injectReducerInto(reducerName, pack.reducer, pack.initialState);
    return pack;
  },
  updateReducer: () => {
    if (createReduxPack._store && !createReduxPack.preventReducerUpdates) {
      createReduxPack._store.replaceReducer(createReduxPack.getRootReducer());
    }
  },
  injectReducerInto: (reducerName, actionMap, initialState) => {
    createReduxPack._reducers = { ...createReduxPack._reducers,
      ...(createReduxPack._reducers[reducerName] ? {
        [reducerName]: { ...createReduxPack._reducers[reducerName],
          ...actionMap
        }
      } : {
        [reducerName]: actionMap
      })
    };
    createReduxPack._initialState = { ...createReduxPack._initialState,
      ...(createReduxPack._initialState[reducerName] ? {
        [reducerName]: { ...mergeObjects(createReduxPack._initialState[reducerName], initialState)
        }
      } : {
        [reducerName]: initialState
      })
    };
    createReduxPack.updateReducer();
  },
  preventReducerUpdates: false,
  freezeReducerUpdates: () => {
    createReduxPack.preventReducerUpdates = true;
  },
  releaseReducerUpdates: () => {
    createReduxPack.preventReducerUpdates = false;
    createReduxPack.updateReducer();
  },
  _store: null,
  _generator: {
    actions: ({
      name,
      formatPayload
    }) => ({
      run: createAction(createReduxPack.getRunName(name)),
      success: createAction(createReduxPack.getSuccessName(name), formatPayload),
      fail: createAction(createReduxPack.getFailName(name))
    }),
    actionNames: ({
      name
    }) => ({
      run: createReduxPack.getRunName(name),
      success: createReduxPack.getSuccessName(name),
      fail: createReduxPack.getFailName(name)
    }),
    selectors: ({
      name,
      reducerName,
      payloadMap = {}
    }) => {
      const getReducerState = state => state[reducerName];

      return {
        isLoading: createSelector$1(getReducerState, state => state[createReduxPack.getLoadingName(name)]),
        result: createSelector$1(getReducerState, state => state[createReduxPack.getResultName(name)]),
        error: createSelector$1(getReducerState, state => state[createReduxPack.getErrorName(name)]),
        ...getSelectors(payloadMap, name, getReducerState)
      };
    },
    initialState: ({
      name,
      resultInitial = null,
      payloadMap = {}
    }) => ({
      [createReduxPack.getErrorName(name)]: null,
      [createReduxPack.getLoadingName(name)]: false,
      [createReduxPack.getResultName(name)]: resultInitial,
      ...getInitial(payloadMap, name)
    }),
    stateNames: ({
      name,
      payloadMap = {}
    }) => ({
      isLoading: createReduxPack.getLoadingName(name),
      error: createReduxPack.getErrorName(name),
      result: createReduxPack.getResultName(name),
      ...getStateNames(payloadMap, name)
    }),
    reducer: ({
      name,
      payloadMap = {}
    }) => ({
      [createReduxPack.getRunName(name)]: createReducerCase(() => ({
        [createReduxPack.getErrorName(name)]: null,
        [createReduxPack.getLoadingName(name)]: true
      })),
      [createReduxPack.getSuccessName(name)]: createReducerCase((state, {
        payload
      }) => {
        const newState = {
          [createReduxPack.getLoadingName(name)]: false,
          [createReduxPack.getErrorName(name)]: null,
          [createReduxPack.getResultName(name)]: payload
        };
        addMappedPayloadToState(newState, payloadMap, name, payload, state);
        return newState;
      }),
      [createReduxPack.getFailName(name)]: createReducerCase((_state, action) => ({
        [createReduxPack.getErrorName(name)]: action.payload?.error || action.payload,
        [createReduxPack.getLoadingName(name)]: false
      }))
    })
  },
  getRunName: name => `run ${name}`,
  getSuccessName: name => `success ${name}`,
  getFailName: name => `fail ${name}`,
  getLoadingName: name => `isLoading ${name}`,
  getResultName: name => `result ${name}`,
  getErrorName: name => `error ${name}`,
  getKeyName: (name, key) => hasCRPackName(key) ? key : `${key} of ${name}`
});

const enableLogger = () => {
  if (!createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = true;
    createReduxPack.updateReducer();
  }
};

const disableLogger = () => {
  if (createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = false;
    createReduxPack.updateReducer();
  }
};

const configureStore = options => {
  const store = configureStore$1({ ...options,
    reducer: createReduxPack.getRootReducer()
  });
  createReduxPack._store = store;
  return store;
};

const createReducerOn = (reducerName, initialState, actionMap) => {
  createReduxPack.injectReducerInto(reducerName || 'UnspecifiedReducer', actionMap || {}, initialState || {});
};

export default createReduxPack;
export { configureStore, createAction, createReducerCase, createReducerOn, createSelector, disableLogger, enableLogger, makeKeysReadable, mergeGenerators, resetAction };

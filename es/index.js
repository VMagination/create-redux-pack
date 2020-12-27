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

const createSelector = (reducerName, stateKey) => createSelector$1(state => state[reducerName], state => state[stateKey]);

const RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';

const loggerMatcher = () => true;

const formatParams = ({
  name: paramsName,
  ...params
}) => {
  const name = `${paramsName}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    name,
    ...params
  };
};

const createReduxPack = Object.assign(infoRaw => {
  const info = formatParams(infoRaw);
  const {
    reducerName
  } = info;

  const generatedReducerPart = createReduxPack._generator.reducer(info);

  const generatedInitialStatePart = createReduxPack._generator.initialState(info);

  createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);
  /*return Object.keys(createReduxPack.generator).reduce(
    (accum, key) => ({ ...accum, [key]: createReduxPack.generator[key]<S, PayloadMain, PayloadRun>(info) }),
    {} as { [P in keyof typeof createReduxPack.generator]: ReturnType<CreateReduxPackGeneratorBlock> },
  );*/

  return {
    name: info.name,
    stateNames: createReduxPack._generator.stateNames(info),
    actionNames: createReduxPack._generator.actionNames(info),
    actions: createReduxPack._generator.actions(info),
    selectors: createReduxPack._generator.selectors(info),
    initialState: createReduxPack._generator.initialState(info),
    reducer: createReduxPack._generator.reducer(info)
  };
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
      if (action.type === RESET_ACTION_TYPE) return createReduxPack._initialState;
      return combineReducers(combinedReducers)(state, action);
    };
  },
  resetAction: createAction$1(RESET_ACTION_TYPE),
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
        [reducerName]: { ...createReduxPack._initialState[reducerName],
          ...initialState
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
        ...Object.keys(payloadMap).reduce((accum, key) => {
          const format = payloadMap[key]?.formatSelector || (state => state);

          return { ...accum,
            [key]: createSelector$1(getReducerState, state => format(state[createReduxPack.getKeyName(name, `${key}`)]))
          };
        }, {})
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
      ...Object.keys(payloadMap).reduce((accum, key) => ({ ...accum,
        [payloadMap[key]?.modifyValue ? key : createReduxPack.getKeyName(name, `${key}`)]: payloadMap[key]?.initial ?? null
      }), {})
    }),
    stateNames: ({
      name,
      payloadMap = {}
    }) => ({
      isLoading: createReduxPack.getLoadingName(name),
      error: createReduxPack.getErrorName(name),
      result: createReduxPack.getResultName(name),
      ...Object.keys(payloadMap).reduce((accum, key) => ({ ...accum,
        [key]: createReduxPack.getKeyName(name, `${key}`)
      }), {})
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
      }) => ({ ...Object.keys(payloadMap).reduce((accum, key) => {
          const param = payloadMap[key]?.key || key;
          const modification = payloadMap[key]?.modifyValue;
          const payloadValue = payload && param ? payload[param] ?? payloadMap[key]?.fallback : payloadMap[key]?.fallback;
          return { ...accum,
            ...(param ? {
              [modification ? key : createReduxPack.getKeyName(name, `${key}`)]: modification ? modification(payloadValue, state[key]) : payloadValue
            } : {})
          };
        }, {
          [createReduxPack.getResultName(name)]: payload
        }),
        [createReduxPack.getLoadingName(name)]: false,
        [createReduxPack.getErrorName(name)]: null
      })),
      [createReduxPack.getFailName(name)]: createReducerCase((_state, action) => ({
        [createReduxPack.getErrorName(name)]: action.payload?.error || action.payload,
        [createReduxPack.getLoadingName(name)]: false
      }))
    })
  },
  getRunName: name => `${name}Run`,
  getSuccessName: name => `${name}Success`,
  getFailName: name => `${name}Fail`,
  getLoadingName: name => `is${name}Loading`,
  getResultName: name => `${name}Result`,
  getErrorName: name => `${name}Error`,
  getKeyName: (name, key) => `${name}_${key}`
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
export { configureStore, createAction, createReducerCase, createReducerOn, createSelector, disableLogger, enableLogger, mergeGenerators };

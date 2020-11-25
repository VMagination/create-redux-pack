import { createReducer, createAction as createAction$1, configureStore as configureStore$1 } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { createSelector as createSelector$1 } from 'reselect';

const RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';

const getSuccessName = name => `${name}Success`;

const getFailName = name => `${name}Fail`;

const getLoadingName = name => `is${name}Loading`;

const getResultName = name => `${name}Result`;

const getErrorName = name => `${name}Error`;

const getKeyName = (name, key) => `${name}_${key}`;

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
  const generatedReducerPart = createReduxPack.generator.reducer(info);
  const generatedInitialStatePart = createReduxPack.generator.initialState(info);
  createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);
  /*return Object.keys(createReduxPack.generator).reduce(
    (accum, key) => ({ ...accum, [key]: createReduxPack.generator[key]<S, PayloadMain, PayloadRun>(info) }),
    {} as { [P in keyof typeof createReduxPack.generator]: ReturnType<CreateReduxPackGeneratorBlock> },
  );*/

  return {
    name: info.name,
    stateNames: createReduxPack.generator.stateNames(info),
    actionNames: createReduxPack.generator.actionNames(info),
    actions: createReduxPack.generator.actions(info),
    selectors: createReduxPack.generator.selectors(info),
    initialState: createReduxPack.generator.initialState(info),
    reducer: createReduxPack.generator.reducer(info)
  };
}, {
  reducers: {},
  initialState: {},
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
    }), createReduxPack.reducers);
    createReduxPack.reducers = combinedObjects;
    const combinedReducers = Object.keys(combinedObjects).reduce((accum, key) => {
      const initial = initialState && initialState[key] ? { ...createReduxPack.initialState[key],
        ...initialState[key]
      } : createReduxPack.initialState[key];
      createReduxPack.initialState[key] = initial;
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
      if (action.type === RESET_ACTION_TYPE) return createReduxPack.initialState;
      return combineReducers(combinedReducers)(state, action);
    };
  },
  resetAction: createAction$1(RESET_ACTION_TYPE),
  withGenerator: (infoRaw, generator) => {
    const info = formatParams(infoRaw);
    const {
      reducerName
    } = info;
    const combinedKeys = Object.keys({ ...createReduxPack.generator,
      ...generator
    });
    /* as PrevReturnType<S, PayloadRun, PayloadMain> & Required<typeof generator>;*/

    const pack = combinedKeys.reduce((accum, key) => {
      const currentGen = createReduxPack.generator[key];
      const appendedGen = generator[key];
      return { ...accum,
        [key]: { ...(currentGen ? currentGen(info) : {}),
          ...(appendedGen ? appendedGen(info) : {})
        }
      };
    }, {});
    createReduxPack.injectReducerInto(reducerName, pack.reducer, pack.initialState);
    return { ...pack,
      name: info.name
    };
  },
  updateReducer: () => {
    if (createReduxPack.store && !createReduxPack.preventReducerUpdates) {
      createReduxPack.store.replaceReducer(createReduxPack.getRootReducer());
    }
  },
  injectReducerInto: (reducerName, actionMap, initialState) => {
    createReduxPack.reducers = { ...createReduxPack.reducers,
      ...(createReduxPack.reducers[reducerName] ? {
        [reducerName]: { ...createReduxPack.reducers[reducerName],
          ...actionMap
        }
      } : {
        [reducerName]: actionMap
      })
    };
    createReduxPack.initialState = { ...createReduxPack.initialState,
      ...(createReduxPack.initialState[reducerName] ? {
        [reducerName]: { ...createReduxPack.initialState[reducerName],
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
  store: null,
  generator: {
    actions: ({
      name,
      formatPayload
    }) => ({
      run: createAction$1(name, data => ({
        payload: data
      })),
      success: createAction$1(getSuccessName(name), data => ({
        payload: formatPayload ? formatPayload(data) : data
      })),
      fail: createAction$1(getFailName(name), data => ({
        payload: data
      }))
    }),
    actionNames: ({
      name
    }) => ({
      run: name,
      success: getSuccessName(name),
      fail: getFailName(name)
    }),
    selectors: ({
      name,
      reducerName,
      payloadMap = {}
    }) => {
      const getReducerState = state => state[reducerName];

      return {
        isLoading: createSelector$1(getReducerState, state => state[getLoadingName(name)]),
        result: createSelector$1(getReducerState, state => state[getResultName(name)]),
        error: createSelector$1(getReducerState, state => state[getErrorName(name)]),
        ...Object.keys(payloadMap).reduce((accum, key) => {
          const format = payloadMap[key]?.formatSelector || (state => state);

          return { ...accum,
            [key]: createSelector$1(getReducerState, state => format(state[getKeyName(name, `${key}`)]))
          };
        }, {})
      };
    },
    initialState: ({
      name,
      resultInitial = null,
      payloadMap = {}
    }) => ({
      [getErrorName(name)]: null,
      [getLoadingName(name)]: false,
      [getResultName(name)]: resultInitial,
      ...Object.keys(payloadMap).reduce((accum, key) => ({ ...accum,
        [payloadMap[key]?.modifyValue ? key : getKeyName(name, `${key}`)]: payloadMap[key]?.initial ?? null
      }), {})
    }),
    stateNames: ({
      name,
      payloadMap = {}
    }) => ({
      isLoading: getLoadingName(name),
      error: getErrorName(name),
      result: getResultName(name),
      ...Object.keys(payloadMap).reduce((accum, key) => ({ ...accum,
        [key]: getKeyName(name, `${key}`)
      }), {})
    }),
    reducer: ({
      name,
      payloadMap = {}
    }) => ({
      [name]: state => ({ ...state,
        [getErrorName(name)]: null,
        [getLoadingName(name)]: true
      }),
      [getSuccessName(name)]: (state, {
        payload
      }) => ({ ...state,
        ...Object.keys(payloadMap).reduce((accum, key) => {
          const param = payloadMap[key]?.key;
          const modification = payloadMap[key]?.modifyValue;
          const payloadValue = payload && param ? payload[param] ?? payloadMap[key]?.fallback : payloadMap[key]?.fallback;
          return { ...accum,
            ...(param ? {
              [modification ? key : getKeyName(name, `${key}`)]: modification ? modification(payloadValue, state[key]) : payloadValue
            } : {})
          };
        }, {
          [getResultName(name)]: payload
        }),
        [getLoadingName(name)]: false
      }),
      [getFailName(name)]: (state, action) => ({ ...state,
        [getErrorName(name)]: action.payload?.error || action.payload,
        [getLoadingName(name)]: false
      })
    })
  },
  getSuccessName,
  getFailName,
  getLoadingName,
  getResultName,
  getErrorName,
  getKeyName
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

const createSelector = (reducerName, stateKey) => createSelector$1(state => state[reducerName], state => state[stateKey]);

const createAction = (name, formatPayload) => createAction$1(name, data => ({
  payload: formatPayload ? formatPayload(data) : data
}));

const configureStore = options => {
  const store = configureStore$1({ ...options,
    reducer: createReduxPack.getRootReducer()
  });
  createReduxPack.store = store;
  return store;
};

const createReducerOn = (reducerName, initialState, actionMap) => {
  /*createReduxPack.reducers = {
    ...createReduxPack.reducers,
    [reducerName]: createReduxPack.reducers[reducerName]
      ? { ...createReduxPack.reducers[reducerName], ...actionMap }
      : { ...actionMap },
  } as typeof createReduxPack.reducers;
      createReduxPack.initialState = {
    ...createReduxPack.initialState,
    [reducerName]: createReduxPack.initialState[reducerName]
      ? { ...createReduxPack.initialState[reducerName], ...initialState }
      : { ...initialState },
  };*/
  createReduxPack.injectReducerInto(reducerName, actionMap, initialState);
};

export default createReduxPack;
export { configureStore, createAction, createReducerOn, createSelector, disableLogger, enableLogger };

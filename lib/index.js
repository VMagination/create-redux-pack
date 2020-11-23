'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var toolkit = require('@reduxjs/toolkit');
var redux = require('redux');
var reselect = require('reselect');

const getSuccessName = name => `${name}Success`;

const getFailName = name => `${name}Fail`;

const getLoadingName = name => `is${name}Loading`;

const getResultName = name => `${name}Result`;

const getErrorName = name => `${name}Error`;

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
  const generatedReducerPart = createReduxPack.generator.reducers(info);
  const generatedInitialStatePart = createReduxPack.generator.initialState(info);
  createReduxPack.reducers = { ...createReduxPack.reducers,
    ...(createReduxPack.reducers[reducerName] ? {
      [reducerName]: { ...createReduxPack.reducers[reducerName],
        ...generatedReducerPart
      }
    } : {
      [reducerName]: generatedReducerPart
    })
  };
  createReduxPack.initialState = { ...createReduxPack.initialState,
    ...(createReduxPack.initialState[reducerName] ? {
      [reducerName]: { ...createReduxPack.initialState[reducerName],
        ...generatedInitialStatePart
      }
    } : {
      [reducerName]: generatedInitialStatePart
    })
  };
  createReduxPack.updateReducer();
  /*return Object.keys(createReduxPack.generator).reduce(
    (accum, key) => ({ ...accum, [key]: createReduxPack.generator[key]<S, PayloadMain, PayloadRun>(info) }),
    {} as { [P in keyof typeof createReduxPack.generator]: ReturnType<CreateReduxPackGeneratorBlock> },
  );*/

  return {
    stateNames: createReduxPack.generator.stateNames(info),
    actionNames: createReduxPack.generator.actionNames(info),
    actions: createReduxPack.generator.actions(info),
    selectors: createReduxPack.generator.selectors(info),
    initialState: createReduxPack.generator.initialState(info),
    reducer: createReduxPack.generator.reducers(info)
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
        [key]: toolkit.createReducer(initial, combinedObjects[key])
      };
    }, createReduxPack.isLoggerOn ? {
      __Create_Redux_Pack_Logger__: toolkit.createReducer({}, {}, [{
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
    return redux.combineReducers(combinedReducers);
  },
  useLogger: () => {
    createReduxPack.isLoggerOn = true;
  },
  withGenerator: (infoRaw, generator) => {
    const info = formatParams(infoRaw);
    const combinedKeys = Object.keys({ ...createReduxPack.generator,
      ...generator
    });
    /* as PrevReturnType<S, PayloadRun, PayloadMain> & Required<typeof generator>;*/

    return combinedKeys.reduce((accum, key) => {
      const currentGen = createReduxPack.generator[key];
      const appendedGen = generator[key];
      return { ...accum,
        [key]: { ...(currentGen ? currentGen(info) : {}),
          ...(appendedGen ? appendedGen(info) : {})
        }
      };
    }, {});
  },
  disableLoggerLive: () => {
    if (!createReduxPack.isLoggerOn) {
      createReduxPack.isLoggerOn = false;
      createReduxPack.updateReducer();
    }
  },
  enableLoggerLive: () => {
    if (createReduxPack.isLoggerOn) {
      createReduxPack.isLoggerOn = false;
      createReduxPack.updateReducer();
    }
  },
  updateReducer: () => {
    if (createReduxPack.store && !createReduxPack.preventReducerUpdates) {
      createReduxPack.store.replaceReducer(createReduxPack.getRootReducer());
    }
  },
  preventReducerUpdates: false,
  freezeReducerUpdates: () => {
    createReduxPack.preventReducerUpdates = true;
  },
  releaseReducerUpdates: () => {
    createReduxPack.preventReducerUpdates = false;
    createReduxPack.updateReducer();
  },
  setStore: store => createReduxPack.store = store,
  configureStore: options => {
    const store = toolkit.configureStore({ ...options,
      reducer: createReduxPack.getRootReducer(options.reducer, options.initialState)
    });
    createReduxPack.store = store;
    return store;
  },
  store: null,
  generator: {
    actions: ({
      name,
      formatPayload
    }) => ({
      run: toolkit.createAction(name, data => ({
        payload: data
      })),
      success: toolkit.createAction(getSuccessName(name), data => ({
        payload: formatPayload ? formatPayload(data) : data
      })),
      fail: toolkit.createAction(getFailName(name), data => ({
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
    }) => ({
      isLoading: reselect.createSelector(state => state[reducerName], state => state[getLoadingName(name)]),
      result: reselect.createSelector(state => state[reducerName], state => state[getResultName(name)]),
      error: reselect.createSelector(state => state[reducerName], state => state[getErrorName(name)]),
      ...Object.keys(payloadMap).reduce((accum, key) => {
        const format = payloadMap[key]?.formatSelector || (state => state);

        return { ...accum,
          [key]: reselect.createSelector(state => state[reducerName], state => format ? format(state[`${name}${key}`]) : state[`${name}${key}`])
        };
      }, {})
    }),
    initialState: ({
      name,
      resultInitial,
      payloadMap = {}
    }) => ({
      [getErrorName(name)]: null,
      [getLoadingName(name)]: false,
      [getResultName(name)]: resultInitial,
      ...Object.keys(payloadMap).reduce((accum, key) => ({ ...accum,
        [`${name}${key}`]: payloadMap[key]?.initial ?? null
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
        [key]: `${name}${key}`
      }), {})
    }),
    reducers: ({
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
          return { ...accum,
            ...(param ? {
              [`${name}${key}`]: payload[param] ?? payloadMap[key]?.fallback
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
  createAction: (name, formatPayload) => toolkit.createAction(name, data => ({
    payload: formatPayload ? formatPayload(data) : data
  })),
  createSelector: (reducerName, stateKey) => reselect.createSelector(state => state[reducerName], state => state[stateKey])
});

exports.createReduxPack = createReduxPack;

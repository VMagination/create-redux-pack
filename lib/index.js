'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var toolkit = require('@reduxjs/toolkit');
var redux = require('redux');
var reselect = require('reselect');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defineProperty = _defineProperty;

function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defineProperty$1 = _defineProperty$1;

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        defineProperty$1(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var objectSpread2 = _objectSpread2;

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

var arrayLikeToArray = _arrayLikeToArray;

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
}

var arrayWithoutHoles = _arrayWithoutHoles;

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

var iterableToArray = _iterableToArray;

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

var unsupportedIterableToArray = _unsupportedIterableToArray;

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var nonIterableSpread = _nonIterableSpread;

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}

var toConsumableArray = _toConsumableArray;

var mergeGenerators = function mergeGenerators() {
  for (var _len = arguments.length, generators = new Array(_len), _key = 0; _key < _len; _key++) {
    generators[_key] = arguments[_key];
  }

  try {
    var keyList = toConsumableArray(new Set(generators.reduce(function (accum, gen) {
      return [].concat(toConsumableArray(accum), toConsumableArray(Object.keys(gen)));
    }, [])));

    var reducer = function reducer() {
      return {};
    };

    if (keyList.includes('reducer')) {
      reducer = function reducer(info) {
        var reducers = generators.filter(function (gen) {
          return gen.hasOwnProperty('reducer');
        }).map(function (gen) {
          return gen.reducer(info);
        }).filter(function (gen) {
          var _gen$constructor;

          return gen && _typeof_1(gen) === 'object' && (gen === null || gen === void 0 ? void 0 : (_gen$constructor = gen.constructor) === null || _gen$constructor === void 0 ? void 0 : _gen$constructor.name) === 'Object';
        });

        var reducersKeys = toConsumableArray(new Set(reducers.reduce(function (accum, reducer) {
          return [].concat(toConsumableArray(accum), toConsumableArray(Object.keys(reducer)));
        }, [])));

        return reducersKeys.reduce(function (accum, reducerKey) {
          return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, reducerKey, function () {
            var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var action = arguments.length > 1 ? arguments[1] : undefined;
            var currentReducers = reducers.filter(function (reducer) {
              return reducer.hasOwnProperty(reducerKey);
            });
            return currentReducers.reduce(function (innerAccum, currentReducer) {
              var toReturn = currentReducer[reducerKey](state, action, true);
              var toReturnKeys = Object.keys(toReturn);

              if (toReturnKeys.length >= Object.keys(state).length) {
                console.warn('CRPack: mergeGenerators received a reducer case with state directly added in result, to improve performance please use createReducerCase and prevent previous state from spreading into result, found in', reducerKey);
                toReturn = toReturnKeys.reduce(function (accum, key) {
                  return objectSpread2(objectSpread2({}, accum), !state[key] || toReturn[key] !== state[key] ? defineProperty({}, key, toReturn[key]) : {});
                }, {});
              }

              return objectSpread2(objectSpread2({}, innerAccum), toReturn);
            }, objectSpread2({}, state));
          }));
        }, {});
      };
    }

    var result = keyList.reduce(function (accum, key) {
      return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, key, function (info) {
        return generators.filter(function (gen) {
          return gen.hasOwnProperty(key);
        }).reduce(function (accum, gen) {
          return objectSpread2(objectSpread2({}, accum), gen[key](info));
        }, {});
      }));
    }, {});
    return objectSpread2(objectSpread2({}, result), {}, {
      reducer: reducer
    });
  } catch (e) {
    throw new Error('CRPack: mergeGenerators received invalid generators');
  }
};

var createReducerCase = function createReducerCase(reducerCase) {
  return function (state, action, isMerging) {
    return objectSpread2(objectSpread2({}, isMerging ? {} : state), reducerCase(state, action));
  };
};

var createAction = function createAction(name, formatPayload) {
  return toolkit.createAction(name, function (data) {
    return {
      payload: formatPayload ? formatPayload(data) : data
    };
  });
};

var createSelector = function createSelector(reducerOrSource, keyOrFormat) {
  var source = typeof reducerOrSource === 'string' ? function (state) {
    return state[reducerOrSource];
  } : reducerOrSource;
  var selection = typeof keyOrFormat === 'string' ? function (state) {
    return state[keyOrFormat];
  } : keyOrFormat;
  return reselect.createSelector(source, selection);
};

var mergeObjects = function mergeObjects(target, source) {
  var targetCopy = objectSpread2({}, target);

  var merge = function merge(target, source) {
    Object.keys(source).forEach(function (key) {
      if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
    });
    Object.assign(target !== null && target !== void 0 ? target : {}, source);
    return target;
  };

  merge(targetCopy, source);
  return targetCopy;
};

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var objectWithoutPropertiesLoose = _objectWithoutPropertiesLoose;

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = objectWithoutPropertiesLoose(source, excluded);
  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

var objectWithoutProperties = _objectWithoutProperties;

var formatComplete = Symbol('format complete');
var formatParams = function formatParams(rawParams) {
  try {
    var _rawParams$name = rawParams.name,
        paramsName = _rawParams$name === void 0 ? 'NamelessPack' : _rawParams$name,
        _rawParams$reducerNam = rawParams.reducerName,
        reducerName = _rawParams$reducerNam === void 0 ? 'UnspecifiedReducer' : _rawParams$reducerNam,
        params = objectWithoutProperties(rawParams, ["name", "reducerName"]);

    if (formatComplete in params) return rawParams;
    var name = "[".concat(paramsName, "]: CRPack-").concat(Math.random().toString(36).substr(2, 9));
    return objectSpread2(defineProperty({
      name: name,
      reducerName: reducerName
    }, formatComplete, true), params);
  } catch (e) {
    throw Error('CRPack received invalid package info');
  }
};

var RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';
var resetAction = Object.assign(toolkit.createAction(RESET_ACTION_TYPE), {
  type: RESET_ACTION_TYPE
});

var hasCRPackName = function hasCRPackName(name) {
  return /\[.+]: CRPack-.{9}/.test(name);
};

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

var arrayWithHoles = _arrayWithHoles;

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

var iterableToArrayLimit = _iterableToArrayLimit;

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var nonIterableRest = _nonIterableRest;

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}

var slicedToArray = _slicedToArray;

var makeKeysReadable = function makeKeysReadable(obj) {
  if (!(obj && _typeof_1(obj) === 'object')) return obj;

  var result = objectSpread2({}, obj);

  var renameKeys = function renameKeys(origin) {
    var keys = Object.keys(origin || {}).filter(hasCRPackName);
    if (!keys.length) return origin;

    var copy = objectSpread2({}, origin);

    keys.forEach(function (k) {
      var _ref = k.match(/\.([^. ]+) /) || [],
          _ref2 = slicedToArray(_ref, 2),
          realKey = _ref2[1];

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

var getReadableKey = function getReadableKey(key) {
  return !hasCRPackName(key) ? key : key.replace(/ of .+/, '');
};

var shouldRecursionEnd = function shouldRecursionEnd(payloadMapByKey) {
  return 'initial' in payloadMapByKey;
};

var getIt = function getIt() {
  var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var path = arguments.length > 1 ? arguments[1] : undefined;
  var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
  if (path === '') return obj;

  var find = function find(regexp) {
    return (path !== null && path !== void 0 ? path : '').split(regexp).filter(Boolean).reduce(function (res, key) {
      return (res !== null && res !== void 0 ? res : false) ? res[key] : res;
    }, obj);
  };

  var found = find(/[,[\]]+?/) || find(/[,[\].]+?/);
  return found === undefined || found === obj ? defaultValue : found;
};

var addStateParam = function addStateParam(obj, key, payloadMap, name, payload, state) {
  var prefix = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : '';
  var payloadMapByKey = payloadMap[key];
  var param = (payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.key) || key;
  var modification = payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.modifyValue;
  var payloadValue = param ? getIt(payload, param, payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.fallback) : payload;
  var stateKey = createReduxPack.getKeyName(name, "".concat(prefix).concat(key));
  obj[stateKey] = modification ? modification(payloadValue, state[stateKey]) : payloadValue;
};
var addMappedPayloadToState = function addMappedPayloadToState(obj, payloadMap, name, payload, state) {
  var prefix = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
  var keys = Object.keys(payloadMap).filter(function (key) {
    return key !== 'key';
  });
  keys.forEach(function (key) {
    var payloadMapByKey = payloadMap[key];

    if (shouldRecursionEnd(payloadMapByKey)) {
      return addStateParam(obj, key, payloadMap, name, payload, state, prefix);
    }

    var param = payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.key;
    var innerKey = createReduxPack.getKeyName(name, "".concat(prefix).concat(key));
    obj[innerKey] = objectSpread2(objectSpread2({}, state[innerKey]), obj[innerKey] || {});
    var payloadParam = param ? getIt(payload, param) : payload;
    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    addMappedPayloadToState(obj[innerKey], payloadMapByKey, name, payloadParam, state[innerKey], nextPrefix);
  });
};
var getInitial = function getInitial(payloadMap, name) {
  var initial = {};
  addMappedInitialToState(initial, payloadMap, name);
  return initial;
};

var addMappedInitialToState = function addMappedInitialToState(obj, payloadMap, name) {
  var prefix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
  var keys = Object.keys(payloadMap).filter(function (key) {
    return key !== 'key';
  });
  keys.forEach(function (key) {
    var payloadMapByKey = payloadMap[key];
    var innerKey = createReduxPack.getKeyName(name, "".concat(prefix).concat(key));

    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[innerKey] = payloadMapByKey.initial;
      return;
    }

    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    obj[innerKey] = obj[innerKey] || {};
    addMappedInitialToState(obj[innerKey], payloadMapByKey, name, nextPrefix);
  });
};

var getStateNames = function getStateNames(payloadMap, name) {
  var stateNames = {};
  addMappedStateNames(stateNames, payloadMap, name);
  return stateNames;
};

var wrapStateName = function wrapStateName(key) {
  return new Proxy(new String(key), {
    get: function get(t, p) {
      return typeof t[p] === 'function' ? t[p].bind(key) : typeof p === 'string' ? p in t && t[p] || wrapStateName(p) : t[p];
    }
  });
};

var addMappedStateNames = function addMappedStateNames(obj, payloadMap, name) {
  var prefix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
  var keys = Object.keys(payloadMap).filter(function (key) {
    return key !== 'key';
  });
  keys.forEach(function (key) {
    var payloadMapByKey = payloadMap[key];

    if (shouldRecursionEnd(payloadMapByKey)) {
      obj[key] = wrapStateName(createReduxPack.getKeyName(name, "".concat(prefix).concat(key)));
      return;
    }

    var innerKeys = {};
    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    addMappedStateNames(innerKeys, payloadMapByKey, name, nextPrefix);
    obj[key] = Object.assign(createReduxPack.getKeyName(name, "".concat(prefix).concat(key)), innerKeys);
  });
};

var getSelectors = function getSelectors(payloadMap, name, getReducerState) {
  var selectors = {};
  addMappedSelectors(selectors, payloadMap, name, getReducerState);
  return selectors;
};
var selectorContent = Symbol('CRPack selector content');

var wrapSelector = function wrapSelector(prevSelector, key) {
  var format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (state) {
    return state;
  };
  return new Proxy(reselect.createSelector(prevSelector, function (state) {
    return format((state || {})[key]);
  }), {
    get: function get(target, p) {
      if (!target[selectorContent]) {
        target[selectorContent] = defineProperty({}, p, wrapSelector(reselect.createSelector(prevSelector, function (state) {
          return (state || {})[key];
        }), p));
      } else {
        if (!target[selectorContent][p]) {
          target[selectorContent][p] = wrapSelector(reselect.createSelector(prevSelector, function (state) {
            return (state || {})[key];
          }), p);
        }
      }

      return target[selectorContent][p];
    }
  });
};

var addMappedSelectors = function addMappedSelectors(obj, payloadMap, name, prevSelector) {
  var prefix = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
  var keys = Object.keys(payloadMap).filter(function (key) {
    return key !== 'key';
  });
  keys.forEach(function (key) {
    var payloadMapByKey = payloadMap[key];
    var innerKey = createReduxPack.getKeyName(name, "".concat(prefix).concat(key));

    if (shouldRecursionEnd(payloadMapByKey)) {
      var format = (payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.formatSelector) || function (state) {
        return state;
      };

      obj[key] = wrapSelector(prevSelector, innerKey, format);
      return;
    }

    var innerSelectors = {};
    var sourceSelector = reselect.createSelector(prevSelector, function (state) {
      var getReadable = function () {
        var lastResult = null;
        return function (target) {
          if (lastResult) return lastResult;
          lastResult = makeKeysReadable(target);
          return lastResult;
        };
      }();

      return state[innerKey] && _typeof_1(state[innerKey]) === 'object' ? new Proxy(objectSpread2({}, state[innerKey]), {
        get: function get(target, key) {
          return key in target ? target[key] : getReadable(target)[key];
        },
        has: function has(target, key) {
          return key in target || key in getReadable(target);
        },
        ownKeys: function ownKeys(target) {
          return Reflect.ownKeys(getReadable(target));
        },
        getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, key) {
          return Reflect.getOwnPropertyDescriptor(getReadable(target), key);
        }
      }) : state[innerKey];
    });
    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    addMappedSelectors(innerSelectors, payloadMapByKey, name, sourceSelector, nextPrefix);
    obj[key] = Object.assign(sourceSelector, innerSelectors);
  });
};

var loggerMatcher = function loggerMatcher() {
  return true;
};

var createReduxPack = Object.assign(function (infoRaw) {
  var info = formatParams(infoRaw);
  var reducerName = info.reducerName;

  var generatedReducerPart = createReduxPack._generator.reducer(info);

  var generatedInitialStatePart = createReduxPack._generator.initialState(info);

  createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);
  var pack = {
    name: info.name,
    stateNames: createReduxPack._generator.stateNames(info),
    actionNames: createReduxPack._generator.actionNames(info),
    actions: createReduxPack._generator.actions(info),
    selectors: createReduxPack._generator.selectors(info),
    initialState: generatedInitialStatePart,
    reducer: generatedReducerPart
  };
  return Object.assign(pack, {
    withGenerator: function withGenerator(generator) {
      return createReduxPack.withGenerator(info, generator);
    }
  });
}, {
  _reducers: {},
  _initialState: {},
  isLoggerOn: false,
  getRootReducer: function getRootReducer(reducers, initialState) {
    var combinedObjects = Object.keys(reducers || {}).reduce(function (accum, key) {
      return objectSpread2(objectSpread2({}, accum), accum[key] ? defineProperty({}, key, objectSpread2(objectSpread2({}, accum[key]), (reducers || {})[key])) : defineProperty({}, key, (reducers || {})[key]));
    }, createReduxPack._reducers);
    createReduxPack._reducers = combinedObjects;
    var combinedReducers = Object.keys(combinedObjects).reduce(function (accum, key) {
      var initial = initialState && initialState[key] ? objectSpread2(objectSpread2({}, createReduxPack._initialState[key]), initialState[key]) : createReduxPack._initialState[key];
      createReduxPack._initialState[key] = initial;
      return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, key, toolkit.createReducer(initial, combinedObjects[key])));
    }, createReduxPack.isLoggerOn ? {
      __Create_Redux_Pack_Logger__: toolkit.createReducer({}, {}, [{
        matcher: loggerMatcher,
        reducer: function reducer(state, action) {
          console.log("CRPack_Logger: ".concat(action.type), {
            payload: action.payload
          });
          return objectSpread2({}, state);
        }
      }])
    } : {});
    return function (state, action) {
      if (action.type === resetAction.type) return createReduxPack._initialState;
      return redux.combineReducers(combinedReducers)(state, action);
    };
  },
  withGenerator: function withGenerator(infoRaw, generator) {
    var info = formatParams(infoRaw);
    var reducerName = info.reducerName;
    var mergedGen = mergeGenerators(createReduxPack._generator, generator);

    var pack = objectSpread2(objectSpread2({}, Object.keys(mergedGen).reduce(function (accum, key) {
      return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, key, mergedGen[key](info)));
    }, {})), {}, {
      name: info.name
    });

    createReduxPack.injectReducerInto(reducerName, pack.reducer, pack.initialState);
    return pack;
  },
  updateReducer: function updateReducer() {
    if (createReduxPack._store && !createReduxPack.preventReducerUpdates) {
      createReduxPack._store.replaceReducer(createReduxPack.getRootReducer());
    }
  },
  injectReducerInto: function injectReducerInto(reducerName, actionMap, initialState) {
    createReduxPack._reducers = objectSpread2(objectSpread2({}, createReduxPack._reducers), createReduxPack._reducers[reducerName] ? defineProperty({}, reducerName, objectSpread2(objectSpread2({}, createReduxPack._reducers[reducerName]), actionMap)) : defineProperty({}, reducerName, actionMap));
    createReduxPack._initialState = objectSpread2(objectSpread2({}, createReduxPack._initialState), createReduxPack._initialState[reducerName] ? defineProperty({}, reducerName, objectSpread2({}, mergeObjects(createReduxPack._initialState[reducerName], initialState))) : defineProperty({}, reducerName, initialState));
    createReduxPack.updateReducer();
  },
  preventReducerUpdates: false,
  freezeReducerUpdates: function freezeReducerUpdates() {
    createReduxPack.preventReducerUpdates = true;
  },
  releaseReducerUpdates: function releaseReducerUpdates() {
    createReduxPack.preventReducerUpdates = false;
    createReduxPack.updateReducer();
  },
  _store: null,
  _generator: {
    actions: function actions(_ref7) {
      var name = _ref7.name,
          formatPayload = _ref7.formatPayload;
      return {
        run: createAction(createReduxPack.getRunName(name)),
        success: createAction(createReduxPack.getSuccessName(name), formatPayload),
        fail: createAction(createReduxPack.getFailName(name))
      };
    },
    actionNames: function actionNames(_ref8) {
      var name = _ref8.name;
      return {
        run: createReduxPack.getRunName(name),
        success: createReduxPack.getSuccessName(name),
        fail: createReduxPack.getFailName(name)
      };
    },
    selectors: function selectors(_ref9) {
      var name = _ref9.name,
          reducerName = _ref9.reducerName,
          _ref9$payloadMap = _ref9.payloadMap,
          payloadMap = _ref9$payloadMap === void 0 ? {} : _ref9$payloadMap;

      var getReducerState = function getReducerState(state) {
        return state[reducerName];
      };

      return objectSpread2({
        isLoading: reselect.createSelector(getReducerState, function (state) {
          return state[createReduxPack.getLoadingName(name)];
        }),
        result: reselect.createSelector(getReducerState, function (state) {
          return state[createReduxPack.getResultName(name)];
        }),
        error: reselect.createSelector(getReducerState, function (state) {
          return state[createReduxPack.getErrorName(name)];
        })
      }, getSelectors(payloadMap, name, getReducerState));
    },
    initialState: function initialState(_ref10) {
      var _objectSpread4;

      var name = _ref10.name,
          _ref10$resultInitial = _ref10.resultInitial,
          resultInitial = _ref10$resultInitial === void 0 ? null : _ref10$resultInitial,
          _ref10$payloadMap = _ref10.payloadMap,
          payloadMap = _ref10$payloadMap === void 0 ? {} : _ref10$payloadMap;
      return objectSpread2((_objectSpread4 = {}, defineProperty(_objectSpread4, createReduxPack.getErrorName(name), null), defineProperty(_objectSpread4, createReduxPack.getLoadingName(name), false), defineProperty(_objectSpread4, createReduxPack.getResultName(name), resultInitial), _objectSpread4), getInitial(payloadMap, name));
    },
    stateNames: function stateNames(_ref11) {
      var name = _ref11.name,
          _ref11$payloadMap = _ref11.payloadMap,
          payloadMap = _ref11$payloadMap === void 0 ? {} : _ref11$payloadMap;
      return objectSpread2({
        isLoading: createReduxPack.getLoadingName(name),
        error: createReduxPack.getErrorName(name),
        result: createReduxPack.getResultName(name)
      }, getStateNames(payloadMap, name));
    },
    reducer: function reducer(_ref12) {
      var _ref16;

      var name = _ref12.name,
          _ref12$payloadMap = _ref12.payloadMap,
          payloadMap = _ref12$payloadMap === void 0 ? {} : _ref12$payloadMap;
      return _ref16 = {}, defineProperty(_ref16, createReduxPack.getRunName(name), createReducerCase(function () {
        var _ref13;

        return _ref13 = {}, defineProperty(_ref13, createReduxPack.getErrorName(name), null), defineProperty(_ref13, createReduxPack.getLoadingName(name), true), _ref13;
      })), defineProperty(_ref16, createReduxPack.getSuccessName(name), createReducerCase(function (state, _ref14) {
        var _newState;

        var payload = _ref14.payload;
        var newState = (_newState = {}, defineProperty(_newState, createReduxPack.getLoadingName(name), false), defineProperty(_newState, createReduxPack.getErrorName(name), null), defineProperty(_newState, createReduxPack.getResultName(name), payload), _newState);
        addMappedPayloadToState(newState, payloadMap, name, payload, state);
        return newState;
      })), defineProperty(_ref16, createReduxPack.getFailName(name), createReducerCase(function (_state, action) {
        var _action$payload, _ref15;

        return _ref15 = {}, defineProperty(_ref15, createReduxPack.getErrorName(name), ((_action$payload = action.payload) === null || _action$payload === void 0 ? void 0 : _action$payload.error) || action.payload), defineProperty(_ref15, createReduxPack.getLoadingName(name), false), _ref15;
      })), _ref16;
    }
  },
  getRunName: function getRunName(name) {
    return "run ".concat(name);
  },
  getSuccessName: function getSuccessName(name) {
    return "success ".concat(name);
  },
  getFailName: function getFailName(name) {
    return "fail ".concat(name);
  },
  getLoadingName: function getLoadingName(name) {
    return "isLoading ".concat(name);
  },
  getResultName: function getResultName(name) {
    return "result ".concat(name);
  },
  getErrorName: function getErrorName(name) {
    return "error ".concat(name);
  },
  getKeyName: function getKeyName(name, key) {
    return hasCRPackName(key) ? key : "".concat(key, " of ").concat(name);
  }
});

var enableLogger = function enableLogger() {
  if (!createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = true;
    createReduxPack.updateReducer();
  }
};

var disableLogger = function disableLogger() {
  if (createReduxPack.isLoggerOn) {
    createReduxPack.isLoggerOn = false;
    createReduxPack.updateReducer();
  }
};

var configureStore = function configureStore(options) {
  var store = toolkit.configureStore(objectSpread2(objectSpread2({}, options), {}, {
    reducer: createReduxPack.getRootReducer()
  }));
  createReduxPack._store = store;
  return store;
};

var createReducerOn = function createReducerOn(reducerName, initialState, actionMap) {
  createReduxPack.injectReducerInto(reducerName || 'UnspecifiedReducer', actionMap || {}, initialState || {});
};

exports.configureStore = configureStore;
exports.createAction = createAction;
exports.createReducerCase = createReducerCase;
exports.createReducerOn = createReducerOn;
exports.createSelector = createSelector;
exports.default = createReduxPack;
exports.disableLogger = disableLogger;
exports.enableLogger = enableLogger;
exports.makeKeysReadable = makeKeysReadable;
exports.mergeGenerators = mergeGenerators;
exports.resetAction = resetAction;

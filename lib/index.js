'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var toolkit = require('@reduxjs/toolkit');
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

function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

/* global window */

var root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = symbolObservablePonyfill(root);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */


  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
  } catch (e) {} // eslint-disable-line no-empty

}

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionDescription = actionType && "action \"" + String(actionType) + "\"" || 'an action';
  return "Given " + actionDescription + ", reducer \"" + key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.";
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!isPlainObject(inputState)) {
    return "The " + argumentName + " has unexpected type of \"" + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + "\". Expected argument to be an object with the following " + ("keys: \"" + reducerKeys.join('", "') + "\"");
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });
  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return "Unexpected " + (unexpectedKeys.length > 1 ? 'keys' : 'key') + " " + ("\"" + unexpectedKeys.join('", "') + "\" found in " + argumentName + ". ") + "Expected to find one of the known reducer keys instead: " + ("\"" + reducerKeys.join('", "') + "\". Unexpected keys will be ignored.");
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, {
      type: ActionTypes.INIT
    });

    if (typeof initialState === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
    }

    if (typeof reducer(undefined, {
      type: ActionTypes.PROBE_UNKNOWN_ACTION()
    }) === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle " + ActionTypes.INIT + " or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
    }
  });
}
/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */


function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};

  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning("No reducer provided for key \"" + key + "\"");
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  var finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same
  // keys multiple times.

  var unexpectedKeyCache;

  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {};
  }

  var shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);

      if (warningMessage) {
        warning(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};

    for (var _i = 0; _i < finalReducerKeys.length; _i++) {
      var _key = finalReducerKeys[_i];
      var reducer = finalReducers[_key];
      var previousStateForKey = state[_key];
      var nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(_key, action);
        throw new Error(errorMessage);
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

/*
 * This is a dummy function to check if the function name has been altered by minification.
 * If the function has been minified and NODE_ENV !== 'production', warn the user.
 */

function isCrushed() {}

if (process.env.NODE_ENV !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === "production". ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' + 'to ensure you have the correct code for your production build.');
}

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
  return Object.assign(toolkit.createAction(name, function (data) {
    return {
      payload: formatPayload ? formatPayload(data) : data
    };
  }), {
    instances: new Proxy({}, {
      get: function get(t, p, s) {
        var result = Reflect.get(t, p, s);
        if (result) return result;
        if (typeof p !== 'string') return result;
        Reflect.set(t, p, toolkit.createAction(name, function (data) {
          return {
            payload: formatPayload ? formatPayload(data) : data,
            meta: {
              instance: p
            }
          };
        }), s);
        return Reflect.get(t, p, s);
      }
    })
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
        _rawParams$template = rawParams.template,
        template = _rawParams$template === void 0 ? 'request' : _rawParams$template,
        params = objectWithoutProperties(rawParams, ["name", "reducerName", "template"]);

    if (formatComplete in params) return rawParams;
    var name = "[".concat(paramsName, "]: CRPack-").concat(Math.random().toString(36).substr(2, 9));
    return objectSpread2(defineProperty({
      name: name,
      reducerName: reducerName,
      template: template
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

var getRunName = function getRunName(name) {
  return "run ".concat(name);
};
var getSuccessName = function getSuccessName(name) {
  return "success ".concat(name);
};
var getSetName = function getSetName(name) {
  return "set ".concat(name);
};
var getResetName = function getResetName(name) {
  return "reset ".concat(name);
};
var getFailName = function getFailName(name) {
  return "fail ".concat(name);
};
var getLoadingName = function getLoadingName(name) {
  return "isLoading ".concat(name);
};
var getResultName = function getResultName(name) {
  return "result ".concat(name);
};
var getValueName = function getValueName(name) {
  return "value ".concat(name);
};
var getErrorName = function getErrorName(name) {
  return "error ".concat(name);
};
var getKeyName = function getKeyName(name, key) {
  return hasCRPackName(key) ? key : "".concat(key, " of ").concat(name);
};
var getNameWithInstance = function getNameWithInstance(name, instance) {
  return instance ? "".concat(name, " [Instance]: ").concat(instance) : name;
};

var shouldRecursionEnd = function shouldRecursionEnd(payloadMapByKey) {
  return 'initial' in payloadMapByKey;
};

var addStateParam = function addStateParam(obj, key, payloadMap, name, payload, state) {
  var _payloadMapByKey$form;

  var prefix = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : '';
  var payloadMapByKey = payloadMap[key];
  var payloadValue = payloadMapByKey !== null && payloadMapByKey !== void 0 && payloadMapByKey.formatPayload ? (_payloadMapByKey$form = payloadMapByKey.formatPayload(payload)) !== null && _payloadMapByKey$form !== void 0 ? _payloadMapByKey$form : payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.fallback : payload !== null && payload !== void 0 ? payload : payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.fallback;
  var modification = payloadMapByKey === null || payloadMapByKey === void 0 ? void 0 : payloadMapByKey.modifyValue;
  var stateKey = getKeyName(name, "".concat(prefix).concat(key));
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

    var innerKey = getKeyName(name, "".concat(prefix).concat(key));
    obj[innerKey] = objectSpread2(objectSpread2({}, state[innerKey]), obj[innerKey] || {});
    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    addMappedPayloadToState(obj[innerKey], payloadMapByKey, name, payload, state[innerKey], nextPrefix);
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
    var innerKey = getKeyName(name, "".concat(prefix).concat(key));

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
      obj[key] = wrapStateName(getKeyName(name, "".concat(prefix).concat(key)));
      return;
    }

    var innerKeys = {};
    var nextPrefix = "".concat(prefix).concat(getReadableKey(key), ".");
    addMappedStateNames(innerKeys, payloadMapByKey, name, nextPrefix);
    obj[key] = Object.assign(getKeyName(name, "".concat(prefix).concat(key)), innerKeys);
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
    var innerKey = getKeyName(name, "".concat(prefix).concat(key));

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

var normalizeValue = function normalizeValue(item) {
  if (!item) return '';
  if (_typeof_1(item) === 'object' && Array.isArray(item)) return item.map(function (key) {
    return "".concat(key);
  });
  return "".concat(item);
};

var mergePayloadWithResult = function mergePayloadWithResult(state, payload, key) {
  if (key && payload && _typeof_1(payload) === 'object' && state && _typeof_1(state) === 'object') {
    if (Array.isArray(state)) {
      if (Array.isArray(payload)) {
        var payloadKeys = payload.map(function (_ref) {
          var item = _ref[key];
          return item;
        });
        return [].concat(toConsumableArray(state.filter(function (_ref2) {
          var item = _ref2[key];
          return !normalizeValue(payloadKeys).includes(normalizeValue(item));
        })), toConsumableArray(payload));
      } else {
        return [].concat(toConsumableArray(state.filter(function (_ref3) {
          var item = _ref3[key];
          return normalizeValue(payload[key]) !== normalizeValue(item);
        })), [payload]);
      }
    } else {
      if (Array.isArray(payload)) {
        return objectSpread2(objectSpread2({}, state), payload.reduce(function (accum, item) {
          return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, item[key], item));
        }, {}));
      } else {
        if (payload[key]) {
          return objectSpread2(objectSpread2({}, state), {}, defineProperty({}, payload[key], payload));
        } else if (Object.values(payload).every(function (item) {
          return item === null || item === void 0 ? void 0 : item[key];
        })) {
          var payloadArray = Object.values(payload);
          return objectSpread2(objectSpread2({}, state), payloadArray.reduce(function (accum, item) {
            return objectSpread2(objectSpread2({}, accum), {}, defineProperty({}, item[key], item));
          }, {}));
        } else {
          return objectSpread2(objectSpread2({}, state), payload);
        }
      }
    }
  }

  return key && !payload ? state : payload;
};

var loggerMatcher = function loggerMatcher() {
  return true;
};

var createReduxPack = Object.assign(function (infoRaw) {
  var info = formatParams(infoRaw);
  var reducerName = info.reducerName,
      _info$template = info.template,
      template = _info$template === void 0 ? 'request' : _info$template;
  var templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;
  var generatedReducerPart = templateGen.reducer(info);
  var generatedInitialStatePart = templateGen.initialState(info);
  createReduxPack.injectReducerInto(reducerName, generatedReducerPart, generatedInitialStatePart);
  var pack = {
    name: info.name,
    stateNames: templateGen.stateNames(info),
    actionNames: templateGen.actionNames(info),
    actions: templateGen.actions(info),
    selectors: templateGen.selectors(info),
    initialState: generatedInitialStatePart,
    reducer: generatedReducerPart
  };
  return Object.assign(pack, {
    withGenerator: function withGenerator(generator) {
      return createReduxPack.withGenerator(info, generator);
    }
  })
  /*CreateReduxPackReturnType<
  S,
  PayloadRun,
  PayloadMain,
  Info['template'] extends 'simple'
   ? CRPackSimpleGen<S, PayloadRun, PayloadMain, PayloadMap>
   : CRPackRequestGen<S, PayloadRun, PayloadMain, PayloadMap>,
  PayloadMap
  >*/
  ;
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
      return combineReducers(combinedReducers)(state, action);
    };
  },
  withGenerator: function withGenerator(infoRaw, generator) {
    var info = formatParams(infoRaw);
    var reducerName = info.reducerName,
        _info$template2 = info.template,
        template = _info$template2 === void 0 ? 'request' : _info$template2;
    var templateGen = createReduxPack._generators[template] || createReduxPack._generators.request;
    var mergedGen = mergeGenerators(templateGen, generator);

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
  _generators: {
    request: {
      actions: function actions(_ref7) {
        var name = _ref7.name;
        return {
          run: createAction(createReduxPack.getRunName(name)),
          success: createAction(createReduxPack.getSuccessName(name)),
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
          isLoading: Object.assign(reselect.createSelector(getReducerState, function (state) {
            return state[createReduxPack.getLoadingName(name)];
          }), {
            instances: new Proxy({}, {
              get: function get(t, p, s) {
                var result = Reflect.get(t, p, s);
                if (result) return result;
                if (typeof p !== 'string') return result;
                Reflect.set(t, p, reselect.createSelector(getReducerState, function (state) {
                  var _state$createReduxPac;

                  return (_state$createReduxPac = state[createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), p)]) !== null && _state$createReduxPac !== void 0 ? _state$createReduxPac : false;
                }), s);
                return Reflect.get(t, p, s);
              }
            })
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
            _ref10$defaultInitial = _ref10.defaultInitial,
            defaultInitial = _ref10$defaultInitial === void 0 ? null : _ref10$defaultInitial,
            _ref10$payloadMap = _ref10.payloadMap,
            payloadMap = _ref10$payloadMap === void 0 ? {} : _ref10$payloadMap;
        return objectSpread2((_objectSpread4 = {}, defineProperty(_objectSpread4, createReduxPack.getErrorName(name), null), defineProperty(_objectSpread4, createReduxPack.getLoadingName(name), false), defineProperty(_objectSpread4, createReduxPack.getResultName(name), defaultInitial), _objectSpread4), getInitial(payloadMap, name));
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
        var _ref19;

        var name = _ref12.name,
            formatPayload = _ref12.formatPayload,
            mergeByKey = _ref12.mergeByKey,
            _ref12$payloadMap = _ref12.payloadMap,
            payloadMap = _ref12$payloadMap === void 0 ? {} : _ref12$payloadMap;
        return _ref19 = {}, defineProperty(_ref19, createReduxPack.getRunName(name), createReducerCase(function (_state, _ref13) {
          var _ref14;

          var meta = _ref13.meta;
          return _ref14 = {}, defineProperty(_ref14, createReduxPack.getErrorName(name), null), defineProperty(_ref14, createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta === null || meta === void 0 ? void 0 : meta.instance), true), _ref14;
        })), defineProperty(_ref19, createReduxPack.getSuccessName(name), createReducerCase(function (state, _ref15) {
          var _newState;

          var payload = _ref15.payload,
              meta = _ref15.meta;
          var newState = (_newState = {}, defineProperty(_newState, createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta === null || meta === void 0 ? void 0 : meta.instance), false), defineProperty(_newState, createReduxPack.getErrorName(name), null), defineProperty(_newState, createReduxPack.getResultName(name), mergePayloadWithResult(state[createReduxPack.getResultName(name)], formatPayload ? formatPayload(payload) : payload, mergeByKey)), _newState);
          addMappedPayloadToState(newState, payloadMap, name, payload, state);
          return newState;
        })), defineProperty(_ref19, createReduxPack.getFailName(name), createReducerCase(function (_state, _ref16) {
          var _ref17, _ref18;

          var payload = _ref16.payload,
              meta = _ref16.meta;
          return _ref18 = {}, defineProperty(_ref18, createReduxPack.getErrorName(name), (_ref17 = (payload === null || payload === void 0 ? void 0 : payload.error) || payload) !== null && _ref17 !== void 0 ? _ref17 : null), defineProperty(_ref18, createReduxPack.getNameWithInstance(createReduxPack.getLoadingName(name), meta === null || meta === void 0 ? void 0 : meta.instance), false), _ref18;
        })), _ref19;
      }
    },
    simple: {
      actions: function actions(_ref20) {
        var name = _ref20.name;
        return {
          set: createAction(createReduxPack.getSetName(name)),
          reset: createAction(createReduxPack.getResetName(name))
        };
      },
      actionNames: function actionNames(_ref21) {
        var name = _ref21.name;
        return {
          set: createReduxPack.getSetName(name),
          reset: createReduxPack.getResetName(name)
        };
      },
      selectors: function selectors(_ref22) {
        var name = _ref22.name,
            reducerName = _ref22.reducerName,
            _ref22$payloadMap = _ref22.payloadMap,
            payloadMap = _ref22$payloadMap === void 0 ? {} : _ref22$payloadMap;

        var getReducerState = function getReducerState(state) {
          return state[reducerName];
        };

        return objectSpread2({
          value: reselect.createSelector(getReducerState, function (state) {
            return state[createReduxPack.getValueName(name)];
          })
        }, getSelectors(payloadMap, name, getReducerState));
      },
      initialState: function initialState(_ref23) {
        var name = _ref23.name,
            _ref23$defaultInitial = _ref23.defaultInitial,
            defaultInitial = _ref23$defaultInitial === void 0 ? null : _ref23$defaultInitial,
            _ref23$payloadMap = _ref23.payloadMap,
            payloadMap = _ref23$payloadMap === void 0 ? {} : _ref23$payloadMap;
        return objectSpread2(defineProperty({}, createReduxPack.getValueName(name), defaultInitial), getInitial(payloadMap, name));
      },
      stateNames: function stateNames(_ref24) {
        var name = _ref24.name,
            _ref24$payloadMap = _ref24.payloadMap,
            payloadMap = _ref24$payloadMap === void 0 ? {} : _ref24$payloadMap;
        return objectSpread2({
          value: createReduxPack.getValueName(name)
        }, getStateNames(payloadMap, name));
      },
      reducer: function reducer(_ref25) {
        var _ref27;

        var name = _ref25.name,
            mergeByKey = _ref25.mergeByKey,
            _ref25$defaultInitial = _ref25.defaultInitial,
            defaultInitial = _ref25$defaultInitial === void 0 ? null : _ref25$defaultInitial,
            formatPayload = _ref25.formatPayload,
            _ref25$payloadMap = _ref25.payloadMap,
            payloadMap = _ref25$payloadMap === void 0 ? {} : _ref25$payloadMap;
        return _ref27 = {}, defineProperty(_ref27, createReduxPack.getSetName(name), createReducerCase(function (state, _ref26) {
          var payload = _ref26.payload;

          var newState = defineProperty({}, createReduxPack.getValueName(name), mergePayloadWithResult(state[createReduxPack.getValueName(name)], formatPayload ? formatPayload(payload) : payload, mergeByKey));

          addMappedPayloadToState(newState, payloadMap, name, payload, state);
          return newState;
        })), defineProperty(_ref27, createReduxPack.getResetName(name), createReducerCase(function () {
          return objectSpread2(defineProperty({}, createReduxPack.getValueName(name), defaultInitial), getInitial(payloadMap, name));
        })), _ref27;
      }
    }
  },
  getRunName: getRunName,
  getSuccessName: getSuccessName,
  getSetName: getSetName,
  getResetName: getResetName,
  getFailName: getFailName,
  getLoadingName: getLoadingName,
  getResultName: getResultName,
  getValueName: getValueName,
  getErrorName: getErrorName,
  getKeyName: getKeyName,
  getNameWithInstance: getNameWithInstance
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

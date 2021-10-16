## Create Redux Pack (CRPack)

Create Redux Pack is a wrapper around **@reduxjs/toolkit** and **reselect** meant to reduce development time and amount of common errors working with **redux**.

Most Apps with Redux state management use a lot of boilerplates. This library moves those boilerplates / repetitions away from your eyes. Even if default logic of CRPack doesn't fit your code style you can always make your own reusable generator(s) and still save a lot of time.


## Installation

To install CRPack simple run:

```sh
npm install --save create-redux-pack
```

## Examples

<details>
<summary>Using with configureStore utility</summary>

```js
    // Package
    import createReduxPack from 'create-redux-pack';
  
    export const {
      name,
      stateNames,
      actionNames,
      actions,
      selectors,
      initialState,
      reducer,
    } = createReduxPack({ name: 'SimplePack', reducerName: 'sampleReducer' });

    // React component

    import { actions, selectors } from '@src/store/packages';
    //...
    const dispatch = useDispatch();
    const result = useSelector(selectors.result);
    const isLoading = useSelector(selectors.isLoading);
    
    useEffect(() => dispatch(actions.run()), []);
    //...

    // Redux-Saga
    
    function* fetchSomething() {
      try {
        const data = yield call(Api.getSomething);
        yield put(actions.success(data));
      } catch (error) {
        yield put(actions.fail(error));
      }
    }
    
    function* watcher() {
      yield takeEvery(actionNames.run, fetchSomething);
    }
```
</details>

<details>
<summary>Using without configureStore utility</summary>

To add logic of a pack it is required to inject its reducer and initialState into according reducer, other parts like selectors and actions can be used without other requirements.

```js
    // Package
    import createReduxPack from 'create-redux-pack';
  
    export const pack = createReduxPack({ name: 'SimplePack', reducerName: 'sampleReducer' });

    // Reducer
    import { createReducer } from '@reduxjs/toolkit';
    import { pack } from '@store/packages/pack';

    const initialState = {
      ...pack.initialState,
    } 

    export const sampleReducer = createReducer(initialState, {
      ...pack.reducer,
    });      

    // Or traditional way

    export const sampleReducerFn = (state = initialState, action) => {
      if (pack.reducer[action.type]) {
        return pack.reducer[action.type](state, action)
      }

      switch(action.type) {
      case 'something':
        return {
          ...state,
          whatever: action.payload,
        }
      default: 
        return {
          ...state,
        }
      }
    }  

```
</details>
<details>
<summary>Using with customizations</summary>

```js
    import createReduxPack from "create-redux-pack";

    const { 
      stateNames: firstPackStateNames,  
      initialState: firstPackInitialState, 
      selectors: firstPackSelectors, 
    } = createReduxPack({
      name: 'PackWithPayload',
      reducerName: 'Reducer',
      payloadMap: {
        item1: {
          initial: null,
        },
        item2: {
          innerItem1: {
            item: {
              formatPayload: ({ nestedItem }) => nestedItem,
              initial: { a: 0 },
              fallback: { a: 10 },
              formatSelector: ({ a }) => a,
            },
          },
        },
      },
    });
    
    const PackWithPayloadModify = createReduxPack({
      name: 'PackWithPayload + modify',
      reducerName: 'Reducer',
      payloadMap: {
        [firstPackStateNames.item1]: {
          formatPayload: ({passedItem1}) => passedItem1,
          initial: firstPackInitialState[firstPackStateNames.item1],
          modifyValue: (passedItem, prevValue) => prevValue + passedItem,
        },
      }
    });

    const { actions, selectors, actionNames } = PackWithPayloadModify;

    // React Component
    
    const item1 = useSelector(firstPackSelectors.item1);
    const result = useSelector(selectors.result);
    const isLoading = useSelector(selectors.isLoading);

    dispatch(actions.run());

    // Redux-Saga

    function* fetchSomething() {
      try {
        const data = yield call(Api.getSomething);
        yield put(actions.success({ passedItem: data }));
      } catch (error) {
        yield put(actions.fail(error));
      }
    }
    
    function* watcher() {
      yield takeEvery(actionNames.run, fetchSomething);
    }
```
</details>

## Features and Notes

### CRPack is an extension not a replacement

CRPack is just a utility you can use to create common / simple packs of redux components. Unless you configure store with this library you can just append provided components where you need them. And even if you do configure store with it, it still provides tools to manually create what you need. For example createReducerOn append an action map to reducer and inject it on import (supports lazy loading).

### CRPack generates everything yet it's not overgenerated

Package is a utilized proxy object with caching meaning until you actually access a field of that object that field won't be generated.

### Selectors are fully dynamic

Any field registered inside a package can be chained to infinity using the same proxy approach as above. Any field you access generates a cached Reselector selector even if it's a dynamic field (``pack.selectors.records[id].name``) and even if field doesn't exist it will keep the chain running returning undefined.

### Lazy loading

CRPack fully and internally supports lazy loading. If you are using webpack reducer of each package will be injected on their first import.

> Lazy loading only works if store was configured using provided configureStore utility.

### Instances for actions

It's annoying how sometimes fetching data updates loading everywhere showing loader when and where you did not intend to. With action instances you can separate loaders as well as other values accordingly.

### Dynamic Logger

CRPack has integrated logger which can be enabled and disabled from any part of your code. It will only display type and payload of dispatched actions but practice shows it is enough and if it isn't you should use redux devtools, the main purpose of this logger is to display actions that are dispatched on current page / screen to ease debugging a bit.

### Reducer is an Action Map

In context of CRPack all Action Maps referred as Reducers. The difference of terms is major, yet passing action map to parameter named reducer will result in an actual reducer with same cases making those two terms equal for the library.

> Action Map is an object containing cases for reducer that looks like this <br />**{ [typeOfAction]: (state, action) => ({ ...state, result: action.payload }) }**

## API reference

- [createReduxPack](#createreduxpackpackinfo--pack)
- [pack.withGenerator](#packwithgeneratorgenerator--injectedpack)
- [configureStore](#configurestoreoptions--store)
- [createAction](#createactionname-formatpayload--payload--action)
- [createSelector](#createselectorreducerorsource-keyorformat--selector)
- [createReducerCase](#createreducercasestate-action--partialstate)
- [createReducerOn](#createreduceronreducername-actionmap-initialstate--void)
- [loggerToggle](#enablelogger-and-disablelogger)
- [toggleReducerUpdates](#createreduxpackfreezereducerupdates)
- [resetAction](#resetaction)
- [default id generation](#createreduxpacksetdefaultidgenerationnewdefault)
- [global reducer injection](#createreduxpackaddglobalreducersactionmap--key-actiontype-state-action-skip-symbol--skip--any-)
- [createReduxPack[formatNames]](#createreduxpack-name-formation)
- [createReduxPack[informationalItems]](#createreduxpack_store)

### createReduxPack(packInfo) => pack
Creates pack of redux components with one of default generators

#### packInfo
| Field | Type | Required | Description | Default |
| :---: | :-----: | :---: | :--- | :--- |
| name | string | yes | package name, will be modified to be unique |
| reducerName | string | yes | name of reducer, will be used to add or inject logic into specified reducer |
| template | 'request' / 'simple' | no | template to use when creating a package | 'request' |
| actions | string[] | no | extra actions to be generated, *have to be declared here before using with payloadMap* |
| instanced | boolean | no | should default value be instanced on main action instances | false |
| idGeneration | boolean | no | should generate random field id or keep it static | true / specified default CRPack value |
| defaultInitial | Default | no | initial value of default result/value, should be defined if you are using result/value for state management | null |
| formatPayload | (payload: any) => Default | no | function to format payload for default value field, *overrides formatMergePayload* |
| modifyValue | (value, prevValue) => Default | no | allows modification of default value field, *overrides mergeByKey* |
| mergeByKey | keyof Default | no | if not empty will make reducers try to merge default value with payload using key as identificator, initial and payload should be an array or an object otherwise no merge will commence |
| formatMergePayload | (payload: any) => Default[keyof Default] | no | function to get value for current field from payload during merging |
| payloadMap | PayloadMap | no | object of extra fields that will be appended to state with their own logic |

#### payloadMap

{ [key: string]: Options | { [innerKey: string]: Options | ... }  }

Accepts object with options or nested object with end section containing options, supports keys of  another pack's State.

#### Options:

| Field | Type | Description |
| :---: | :----: | :--- | 
| initial* | any (State) | required, initial value of this field |
| fallback | any (State) | value that will replace current field value in case falsy payload will be provided to an action. It's just a guard to prevent potential crashes of bad payload, fallbacks to `null` |
| instanced | boolean / Actions[] | on what actions field's instanced value should be updated, by default only updates main value |
| actions | Actions[] | actions specified in packInfo, define on what actions to expect this field update, fallbacks to ['success' / 'set'] |
| formatSelector | (data: State) => any | function to format value for selector of this field to return. |
| formatPayload | (payload: any) => State | function to get value for current field from payload, *overrides formatMergePayload* |
| modifyValue | (value, prevValue, action: { code, getStateWithSelector }) => State | used to set new value according or using previous value, *overrides mergeByKey*. getStateWithSelector accepts a CRPack selector, will only work if trying to get value from the same reducer |
| mergeByKey | keyof State | if not empty will make reducers try to merge default value with payload using key as identificator, initial and payload should be an array or an object otherwise no merge will commence |
| formatMergePayload | (payload: any) => State[keyof State] | function to get value for current field from payload during merging |

#### Request Pack contains

- **name** - contains generated name of pack
- **actions** - contains default actions
    - **run** - (payload: PayloadRun) => Action
    - **success** - (payload: PayloadMain) => Action
    - **fail** - () => Action
    - **&ast;.instances.&ast;** - according action with injected instance
- **selectors** - contains selectors for generated fields of state
    - **isLoading** - Selector for loading
    - **isLoading.instances.&ast;** - Selectors for instanced loadings
    - **result** - Selector for result
    - **[key of State]** - Selectors for each field of payloadMap
    - **[key of State][innerKey of State[key]][...]** - Selectors for nested payloadMap object, if field wasn't declared in payloadMap it can still be accessed, failing to acquire that key will result in selector returning *undefined*.
- **initialState** - contains initial state for generated fields can only be accessed with stateNames
- **reducer** - contains action map for reducer can only be accessed with actionNames
- **actionNames** - contains keys to actions of reducers
    - **run** - string
    - **success** - string
    - **fail** - string
- **stateNames** - contains keys to values of state
    - **isLoading** - string
    - **result** - string
    - **[key of State]** - string, fields passed to payloadMap
    - **[key of State][innerKey of State[key]][...]** - string, fields of nested payloadMap object, returns generated key or own key if field wasn't declared.
  
#### Simple Pack contains

- **name** - contains generated name of pack
- **actions** - contains default actions
    - **set** - (payload: PayloadMain) => Action
    - **reset** - () => Action
- **selectors** - contains selectors for generated fields of state
    - **value** - Selector for default value field
    - **[key of State]** - Selectors for each field of payloadMap
    - **[key of State][innerKey of State[key]][...]** - Selectors for nested payloadMap object, if field wasn't declared in payloadMap it can still be accessed, failing to acquire that key will result in selector returning *undefined*.
- **initialState** - contains initial state for generated fields can only be accessed with stateNames
- **reducer** - contains action map for reducer can only be accessed with actionNames
- **actionNames** - contains keys to actions of reducers
    - **set** - string
    - **reset** - string
- **stateNames** - contains keys to values of state
    - **value** - string
    - **[key of State]** - string, fields passed to payloadMap
    - **[key of State][innerKey of State[key]][...]** - string, fields of nested payloadMap object, returns generated key or own key if field wasn't declared.

### pack.withGenerator(generator) => injectedPack

Creates pack of redux components using default generator injected with provided custom generator, **results of generators with same name as default packs parts will be merged including reducer cases**.

> Can be chained indefinitely pack.withGenerator(...).withGenerator(...)

#### generator

Generator is an object containing fields with functions that accept a packInfo parameter and previously generated pack, return any type of data that you want your pack to have

> Field with name of **name** will be rejected. Only default generator can set pack's name.

> Reducer field cases will only be merged if they are wrapped in createReducerCase

```js
  const generator = {
    anyField: (info) => info.name,
    anotherField: () => 'anotherField',
    thunk: (_info, { actions }) => async (dispatch) => {
      dispatch(actions.run());
      try {
        const response = await fetch('api');
        dispatch(actions.success(response));
      } catch {
        dispatch(actions.fail());
      }
    },
  }

  const customPack = createReduxPack({
    name: 'CustomPack',
    reducerName: 'Reducer',
  }).withGenerator(generator);

  console.log(customPack.anotherField) // 'anotherField'

```

Main purpose of withGenerator is to inject logic into default generator and prevent boilerplates using original packages

> It is advised to get packInfo from provided parameter to keep generators reusable and get packInfo modified internally

### Provided generators for common cases

- **resetActionGen** - will add an action to reset default and payloadMap fields of the pack
- **requestErrorGen** - will add error field that will be updated on fail action of request template, with state name and selector

### configureStore(options) => store

Configures store with provided options, **accepts same parameters as configureStore of @reduxjs/toolkit except reducer**, reducer will be added internally, provided will be rejected.

### createAction(name, formatPayload) => (payload) => Action

Creates same action as CRPack creates internally. Accepts action name and a function to format payload.

### createSelector(reducerOrSource, keyOrFormat) => Selector

Creates same selector as CRPack creates internally. Accepts reducer name to get state from and that state's key or source selector and formation.

### createReducerCase(state, action) => Partial<State>

Creates reducer case, will spread state in result itself. Exists to skip comparison stage of generator's merging.

### createReducerOn(reducerName, actionMap, initialState) => void

Creates reducer and inject it to selected place.

> Injection will only happen on file import, meaning it is required to add <br />**import "@store/reducers/myReducer"** <br />to a page you will need it on or to a store configuration file / root file of your app depending on the requirement of lazy loading.

### enableLogger() and disableLogger()

Enables / disables logger

> Doesn't prevent actions from others places to be logged, will display any action that was dispatched while active

> It is advised to remove usage of those functions before building

```js
  import { enableLogger, disableLogger } from 'create-redux-pack';
  // React Component
  
  // Enable logger on mount and disable it on unmount
  useEffect(() => {
    enableLogger();
    return disableLogger
  }, [])
   
```

### createReduxPack.freezeReducerUpdates()

Stops all injections of reducers into store until activated

### createReduxPack.releaseReducerUpdates()

Allows all injections of reducers into store and immediately injects all reducers added since injections disable.

> It is advised to freeze updated in the beginning of files that are being lazy loaded and release updates at their ends. This feature exists because all packages injected separately and single bulk update will be more performant.

### resetAction

Call returns action that can be dispatched to reset store to initial state.
  
### createReduxPack.setDefaultIdGeneration(newDefault)

Sets default id generation value for all packages created after calling this function. **Exists to support libs like redux-persist that require static fields**.

### createReduxPack.addGlobalReducers(actionMap: { [key: actionType]: (state, action, skip: Symbol) => skip | any })

Adds reducer according to action map to update global state. Even if action with global action type dispatched it's still possible to opt out of updates by returning skip symbol passed as third parameter in case this global action is to override some other action conditionally.

### createReduxPack name formation
- *createReduxPack*.**getRunName(name)** - returns run action name
- *createReduxPack*.**getSuccessName(name)** - returns success action name
- *createReduxPack*.**getFailName(name)** - returns fail action name
- *createReduxPack*.**getLoadingName(name)** - returns loading state name
- *createReduxPack*.**getErrorName(name)** - returns error state name
- *createReduxPack*.**getKeyName(name, key)** - returns generic state name

### createReduxPack._store

*ReadOnly*. Contains store configured with configureStore.

### createReduxPack._reducers

*ReadOnly*. Contains all injected reducers (merged)

### createReduxPack._initialState

*ReadOnly*. Contains initialState of all injected reducers (merged)

## ToDo list
- [x] Expose merge for generators
- [x] Merge results of merged reducers
- [x] Resolve payloadMap to support nested payload object
- [x] Add instances for loading
- [x] PayloadMap for any action
- [x] Injection to Root Reducer for global actions
- [ ] Provide utils to work with nested payloadMap within generators

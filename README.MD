## Create Redux Pack (CRPack)

Create Redux Pack is a wrapper around **@reduxjs/toolkit**, **redux** and **reselect** meant to reduce development time and amount of common errors.

Most Apps with Redux state management use a lot of boilerplates. This library moves those boilerplates / repetitions away from your eyes. Even if default logic of CRPack doesn't fit your code style you can always make your own reusable generator(s) and still save a lot of time.

## Lazy loading

CRPack fully and internally supports lazy loading. If you are using webpack reducers will be injected on first package import.

> Lazy loading only works if store was configured using provided configureStore utility.

## Dynamic Logger

CRPack has integrated logger which can be enabled and disabled from any part of your code. It will only display type and payload of dispatched actions but practice shows it is enough and if it isn't you should use redux devtools, the main purpose of this logger is to display actions that are dispatched on current page / screen to ease debugging a bit.

## CRPack is an extension not a replacement

CRPack is just a utility you can use to create common / simple packs of redux components. Unless you configure store with this library you can just append provided components where you need them. And even if you do configure store with it, it still provides tools to manually create what you need. For example createReducerOn append an action map to reducer and inject it on import (supports lazy loading).

## Reducer is an Action Map

In context of CRPack all Action Maps referred as Reducers. The difference of terms is major, yet passing action map to parameter named reducer will result in an actual reducer with same cases making those two terms equal for the library.

> Action Map is an object containing cases for reducer that looks like this <br />**{ [typeOfAction]: (state, action) => ({ ...state, result: action.payload }) }**

## Installation

To install CRPack simple run:

```sh
npm install --save create-redux-pack
```

## Using without configureStore and lazy loading

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
    })        

```

## API reference

### createReduxPack(packInfo) => pack
Creates pack of redux components with default generator

**createReduxPack**<State, PayloadRun, PayloadMain>

- **State** = Record<string, any> - appended State of reducer
- **PayloadRun** = void - type of run Payload
- **PayloadMain** = Record<string, any> - type of success Payload

#### packInfo params

- **name** - *string*, Required, pack name, will be modified to be unique
- **reducerName** - *string*, Required, name of reducer, will be used to add or inject logic into specified reducer
- **resultInitial** - *any*, Optional, initial value of default result, fallbacks to *null*, should be defined if you are using result for state management
- **formatPayload** - *(data: PayloadMain) => State*, Optional, formats success payload to match expected State
- **payloadMap** - *CreateReduxPackPayloadMap\<State\>*, Optional, object of extra fields that will be appended to state

#### payloadMap

{ [key of State]: options }

- **key** - *string*, Required, key of success Payload that will be used to get value for current field
- **initial** - *any*, Required, initial value of this field
- **fallback** - *any*, Optional, value that will replace current field value in case falsy payload will be provided to success action. It's just a guard to prevent potential crashes of bad payload.
- **formatSelector** - *<DT = any>(data: DT) => any*, Optional, format for selector of this field.
- **modifyValue** - *(value: any, prevValue?: State[key of field]) => State[key of field]*, Optional, used to override / modify values of state of others packs. If provided, key will not be changed and when current success case will be triggered, value of another selected package will update.

#### Pack contains

- **name** - contains generated name of pack
- **stateNames** - contains keys to values of state
    - **isLoading** - string
    - **result** - string
    - **error** - string
    - **[key of State]** - string, fields passed to payloadMap
- **actionNames** - contains keys to actions of reducers
    - **run** - string
    - **success** - string
    - **fail** - string
- **actions** - contains default actions
    - **run** - (payload: PayloadRun) => Action
    - **success** - (payload: PayloadMain) => Action
    - **fail** - (error: string) => Action
- **initialState** - contains initial state for generated fields can only be accessed with stateNames
- **reducer** - contains action map for reducer can only be accessed with actionNames  
- **selectors** - contains selectors for generated fields of state
    - **isLoading** - Selector for loading
    - **error** - Selector for error
    - **result** - Selector for result
    - **[key of State]** - Selectors for each field of payloadMap

#### createReduxPack usage example

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
          key: 'passedItem1',
          initial: null,
        },
        item2: {
          key: 'passedItem2',
          initial: { a: 0 },
          fallback: { a: 10 },
          formatSelector: (item) => item.a,
        },
      },
    });
    
    const PackWithPayloadModify = createReduxPack({
      name: 'PackWithPayload + modify',
      reducerName: 'Reducer',
      payloadMap: {
        [firstPackStateNames.item1]: {
          key: 'passedItem1',
          initial: firstPackInitialState[firstPackStateNames.item1],
          modifyValue: (passedItem, prevValue) => prevValue + passedItem,
        },
      },
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
        yield put(actions.success(data));
      } catch (error) {
        yield put(actions.fail(error));
      }
    }
    
    function* Watcher() {
      yield takeEvery(actionNames.run, fetchSomething);
    }
```

### createReduxPack.withGenerator(packInfo, generator) => injectedPack

Creates pack of redux components using default generator injected with provided custom generator, **results of generators with same name as default packs parts will be merged**.

**createReduxPack.withGenerator**<State, PayloadRun, PayloadMain, Gen>

- **State** = Record<string, any> - appended State of reducer
- **PayloadRun** = void - type of run Payload
- **PayloadMain** = Record<string, any> - type of success Payload
- **Gen** = Record<string, any> - type of fields that will be added

#### generator

Accepts an object containing fields with functions that accept a packInfo parameter and return any type of data that you want your pack to have

> Field with name of **name** will be rejected. Only default generator can set pack's name.

```js
  const generator = {
    anyField: (info) => info.name,  
    anotherField: () => 'anotherField',  
  }

  const customPack = createReduxPack.withGenerator({
        name: 'CustomPack',
        reducerName: 'Reducer',
  }, generator);

  console.log(customPack.anotherField) // 'anotherField'

```

Main purpose of withGenerator is to inject logic into default generator

> It is advised to get packInfo from provided parameter to keep generators reusable and get packInfo that was formatted internally

```js
  import createReduxPack, { createAction } from 'create-redux-pack';

  const generator =  {
    actionNames: ({ name }) => ({
      reset: name + 'Reset',
    }),
    actions: ({ name }) => ({
      reset: createAction(name + 'Reset'),
    }),
    reducer: ({ name }) => ({
      [name + 'Reset']: (state) => ({
        ...state,
        [createReduxPack.getResultName(name)]: [],
      }),
    }),
  }

  const customPack = createReduxPack.withGenerator({
        name: 'PackWithCustomAction',
        reducerName: 'Reducer',
  }, generator);
  
  // React Component
  dispatch(customPack.actions.reset());

```

### createAction(name, formatPayload) => (payload) => Action

Creates same action as CRPack creates internally. Accepts action name and a function to format payload.

### createSelector(reducerName, stateKey) => Selector

Creates same selector as CRPack creates internally. Accepts reducer name  to get state from and that state's key.

> Doesn't support getting data from nested objects. It is advised to use reselect createSelector using pack's stateNames to get what you need.

### configureStore(options) => store

Configures store with provided options, **accepts same parameters as configureStore of @reduxjs/toolkit except reducer**, reducer will be added internally, provided will be rejected.

### createReducerOn(reducerName, actionMap, initialState) => void

Creates reducer and inject it to selected place.

> Injection will only happen on file import, meaning it is required to add <br />**import "@store/reducers/myReducer"** <br />to a page you will need it on or to a store configuration file / root file of your app depending on the requirement of lazy loading.

### enableLogger() and disableLogger()

Enables / disables logger

> Doesn't prevent actions from others places to be logged, will display any action that was dispatched while active

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

Allows all injections of reducers into store and immediately injects all reducers added while injections were disabled.

> It is advised to freeze updated in the beginning of files that are being lazy loaded and release updates in their ends. This feature exists because all packages are injected separately and single bulk update will be more performant.

### createReduxPack.store

*ReadOnly*. Contains store configured with configureStore

### createReduxPack.reducers

*ReadOnly*. Contains all injected reducers (merged)

### createReduxPack.initialState

*ReadOnly*. Contains initialState of all injected reducers (merged)

### createReduxPack.generator

*ReadOnly*. Contains default generator object.


## Create Redux Pack (CRPack)

Create Redux Pack is a wrapper around @reduxjs/toolkit, redux and reselect meant to reduce development time and amount of common errors.

Most Apps with Redux state management use a lot of boilerplates. This library moves those boilerplates / repetitions away from your eyes. Even if default logic of CRPack doesn't fit your code style you can always make your own reusable generator(s) and still save a lot of time.

## Lazy loading

CRPack fully supports lazy loading. If you are using webpack reducers will be injected on first package import.

## CRPack is an extension not a replacement

CRPack is just a utility you can use to create common / simple packs of redux components. Unless you configure store with this library you can just append provided components where you need them. And even if you do configure store with it, it still provides tools to manually create what you need. For example createReducerOn append an action map to reducer and inject it on import (supports lazy loading).

## Installation

To install CRPack simple run:

```sh
npm install --save create-redux-pack
```

## API reference

### createReduxPack(packInfo)
creates pack of redux components with default generator

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

### Usage example

```js
    import createReduxPack from "create-redux-pack";

    const packWithPayload = createReduxPack({
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
    
    const packWithPayloadModify = createReduxPack({
      name: 'PackWithPayload + modify',
      reducerName: 'Reducer',
      payloadMap: {
        [packWithPayload.stateNames.item1]: {
          key: 'passedItem1',
          initial: packWithPayload.initialState[packWithPayload.stateNames.item1],
          modifyValue: (passedItem, prevValue) => prevValue + passedItem,
        },
      },
    });
````

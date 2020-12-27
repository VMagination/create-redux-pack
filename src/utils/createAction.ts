import { CreateReduxPackAction } from '../types';
import { createAction as createToolkitAction } from '@reduxjs/toolkit';

export const createAction = <Payload, Result = Payload>(
  name: string,
  formatPayload?: (data: Payload) => Result,
): CreateReduxPackAction<Payload, Result | Payload> =>
  createToolkitAction(name, (data: Payload) => ({
    payload: formatPayload ? formatPayload(data) : data,
  }));

import { createAction } from '@reduxjs/toolkit';

const RESET_ACTION_TYPE = '__CREATE_REDUX_PACK_RESET_ACTION__';

export const resetAction = Object.assign(createAction(RESET_ACTION_TYPE), { type: RESET_ACTION_TYPE });

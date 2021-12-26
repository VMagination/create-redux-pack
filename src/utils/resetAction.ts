import { createAction } from '@reduxjs/toolkit';
import { generateId } from './formatParams';

const RESET_ACTION_TYPE = `[CRPack]: Reset action ${generateId(3)}`;

export const resetAction = Object.assign(createAction(RESET_ACTION_TYPE), { type: RESET_ACTION_TYPE });

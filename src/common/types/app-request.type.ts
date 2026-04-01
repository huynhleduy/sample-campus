import { Request } from 'express';
import { UserAuth } from './api.types';


export type AppRequest = {
  user: UserAuth;
} & Request;

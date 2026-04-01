import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';

import { ContextProvider } from 'src/common/providers';
import { AppRequest } from 'src/common/types/app-request.type';
import { UserAuth } from '../types/api.types';

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AppRequest>();

    const user = <UserAuth>request.user;
    ContextProvider.setAuthUser(user);

    return next.handle();
  }
}

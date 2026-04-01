import { HttpStatus } from '@nestjs/common';

export type IResponse<T> = {
  statusCode: HttpStatus;
  data: T;
  message?: string;
  errors?: string;
  timestamp?: string;
  path?: string;
};
export type IValidationError = {
  field: string;
  errors: string[];
};

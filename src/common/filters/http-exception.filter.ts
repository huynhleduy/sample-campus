import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IResponse, IValidationError } from 'src/common/types/response.type';

@Catch()
export class HttpExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    //  const lang = i18n?.lang || I18N_FALLBACK_LANGUAGE;
    const request = host.switchToHttp().getRequest();
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const { message, stack } = exception;
    Logger.error('log errr mess', JSON.stringify({ message, stack }));
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseMessage = message;
    //  let errors = AppHelper.constantExceptionErrors(
    //    message,
    //    i18n?.service,
    //    lang,
    //  );
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (exception instanceof BadRequestException && exceptionResponse) {
        const validationErrors =
          // eslint-disable-next-line dot-notation
          exceptionResponse?.['message'] || exceptionResponse;
        if (Array.isArray(validationErrors)) {
          responseMessage = validationErrors.map((error) => ({
            field: error.property,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            errors: Object.values(error.constraints),
          })) as IValidationError[];
        } else {
          responseMessage = exceptionResponse;
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        responseMessage = exceptionResponse;
      }

      // errors = Array.isArray(exception.errors)
      //   ? formatI18nErrors(exception.errors, i18n?.service, lang)
      //   : exception?.getResponse()
      //     ? [exception?.getResponse()]
      //     : errors;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const resBody: IResponse<null> = {
      statusCode: status,
      data: null,
      errors: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return response.status(status).json(resBody);
  }

  //   private validationFilter(validationErrors: ValidationError[]): void {
  //     for (const validationError of validationErrors) {
  //       const children = validationError.children;

  //       if (children && !_.isEmpty(children)) {
  //         this.validationFilter(children);

  //         return;
  //       }

  //       delete validationError.children;

  //       const constraints = validationError.constraints;

  //       if (!constraints) {
  //         return;
  //       }

  //       for (const [constraintKey, constraint] of Object.entries(constraints)) {
  //         // convert default messages
  //         if (!constraint) {
  //           // convert error message to error.fields.{key} syntax for i18n translation
  //           constraints[constraintKey] = `error.fields.${_.snakeCase(
  //             constraintKey,
  //           )}`;
  //         }
  //       }
  //     }
  //   }
}

import {ExceptionHostHandler} from '@ebuchi-common/exception/exception-host-handler';
import {HttpException, Injectable, InternalServerErrorException, Logger, type ArgumentsHost} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import type {Response} from 'express';

@Injectable()
export class HttpHostHandler extends ExceptionHostHandler {
  private readonly logger = new Logger(HttpHostHandler.name);

  canHandle(host: ArgumentsHost): boolean {
    return host.getType() === 'http';
  }

  handle(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const httpException = exception instanceof HttpException ? exception : new InternalServerErrorException();

    if (!(exception instanceof HttpException)) {
      Sentry.captureException(exception);
      this.logger.error(exception);
    }

    const status = httpException.getStatus();
    const exceptionResponse = httpException.getResponse();

    const body =
      typeof exceptionResponse === 'string' ? {statusCode: status, message: exceptionResponse} : exceptionResponse;

    response.status(status).json(body);
  }
}

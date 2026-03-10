import {forwardRef, HttpException, Inject, type ArgumentsHost} from '@nestjs/common';

import {ExceptionHostHandlerRegistry} from './exception-host-handler.registry';

export interface HostHandler {
  canHandle(host: ArgumentsHost): boolean;
  handle(exception: unknown, host: ArgumentsHost): Promise<void> | void;
}

export abstract class ExceptionHostHandler implements HostHandler {
  abstract canHandle(host: ArgumentsHost): boolean;
  abstract handle(exception: unknown, host: ArgumentsHost): Promise<void> | void;

  constructor(
    @Inject(forwardRef(() => ExceptionHostHandlerRegistry))
    private registry: ExceptionHostHandlerRegistry
  ) {
    this.registry.register(this);
  }

  protected getExceptionMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return typeof response === 'string' ? response : exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'An unexpected error occurred.';
  }
}

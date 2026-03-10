import {ExceptionHostHandlerRegistry} from '@ebuchi-common/exception/exception-host-handler.registry';
import {ArgumentsHost, Catch, ExceptionFilter, Logger, Injectable} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Catch()
@Injectable()
export class ExceptionHostHandlerFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionHostHandlerFilter.name);

  constructor(private readonly registry: ExceptionHostHandlerRegistry) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const handler = this.registry.findHandler(host);
    if (!handler) {
      this.logger.warn(`No handler found for host type: ${host.getType()}`);

      Sentry.captureException(exception);
      this.logger.error(exception);
      return;
    }

    try {
      await handler.handle(exception, host);
    } catch (handlingException) {
      Sentry.captureException(handlingException);
      this.logger.warn('Error while handling exception:', handlingException);
    }
  }
}

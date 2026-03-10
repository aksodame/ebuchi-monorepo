import {Injectable, Logger, type ArgumentsHost} from '@nestjs/common';

import type {HostHandler} from './exception-host-handler';

@Injectable()
export class ExceptionHostHandlerRegistry {
  private readonly logger = new Logger(ExceptionHostHandlerRegistry.name);
  private readonly handlers: HostHandler[] = [];

  register(handler: HostHandler): void {
    this.handlers.push(handler);
    this.logger.log(`Added ${handler.constructor.name} to ${this.constructor.name}`);
  }

  findHandler(host: ArgumentsHost): HostHandler | undefined {
    return this.handlers.find((handler) => handler.canHandle(host));
  }
}

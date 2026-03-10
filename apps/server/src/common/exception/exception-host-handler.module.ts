import {Global, Module} from '@nestjs/common';
import {APP_FILTER} from '@nestjs/core';

import {ExceptionHostHandlerFilter} from './exception-host-handler.filter';
import {ExceptionHostHandlerRegistry} from './exception-host-handler.registry';

@Global()
@Module({
  providers: [ExceptionHostHandlerRegistry, {provide: APP_FILTER, useClass: ExceptionHostHandlerFilter}],
  exports: [ExceptionHostHandlerRegistry],
})
export class ExceptionHostHandlerModule {}

import {ExceptionHostHandlerModule} from '@ebuchi-common/exception/exception-host-handler.module';
import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';

import {DiscordModule} from './discord/discord.module';
import {HttpHostHandler} from './http-host.handler';
import {InfraModule} from './infra/infra.module';

@Module({
  providers: [HttpHostHandler],
  imports: [
    ExceptionHostHandlerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    InfraModule,
    DiscordModule,
  ],
})
export class AppModule {}

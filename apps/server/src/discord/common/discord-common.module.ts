import {Module} from '@nestjs/common';

import {GuildGuard} from './guards/guild.guard';
import {DeferReplyInterceptor} from './interceptors/defer-reply.interceptor';

@Module({
  providers: [GuildGuard, DeferReplyInterceptor],
  exports: [GuildGuard, DeferReplyInterceptor],
})
export class DiscordCommonModule {}

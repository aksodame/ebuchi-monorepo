import {Module} from '@nestjs/common';

import {RedisModule} from '../redis/redis.module';

import {LavalinkService} from './lavalink.service';

@Module({
  imports: [RedisModule],
  providers: [LavalinkService],
  exports: [LavalinkService],
})
export class LavalinkModule {}

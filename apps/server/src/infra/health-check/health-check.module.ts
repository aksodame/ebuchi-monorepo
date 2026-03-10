import {Module} from '@nestjs/common';
import {TerminusModule} from '@nestjs/terminus';

import {HealthCheckApiPath} from '../infra.providers';
import {RedisModule} from '../redis/redis.module';

import {HealthCheckController} from './health-check.controller';
import {RedisHealthCheckService} from './redis-health-check.service';

@Module({
  imports: [TerminusModule, RedisModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckApiPath, RedisHealthCheckService],
})
export class HealthCheckModule {}

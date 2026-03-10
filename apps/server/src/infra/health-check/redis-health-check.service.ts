import {Injectable} from '@nestjs/common';
import {HealthIndicatorResult, HealthIndicatorService} from '@nestjs/terminus';

import {RedisService} from '../redis/redis.service';

@Injectable()
export class RedisHealthCheckService {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly redis: RedisService
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.redis.ping();

      return indicator.up();
    } catch {
      return indicator.down();
    }
  }
}

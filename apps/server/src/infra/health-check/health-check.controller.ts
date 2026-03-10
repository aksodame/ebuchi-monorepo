import {HEALTHCHECK_API_PATH} from '@ebuchi-infra/infra.constants';
import {Controller, Get, Inject} from '@nestjs/common';
import {DiskHealthIndicator, HealthCheckService, MemoryHealthIndicator} from '@nestjs/terminus';

import {RedisHealthCheckService} from './redis-health-check.service';

@Controller()
export class HealthCheckController {
  constructor(
    @Inject(HEALTHCHECK_API_PATH) apiPath: string,
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redis: RedisHealthCheckService
  ) {
    Reflect.defineMetadata('path', apiPath, HealthCheckController);
  }

  @Get()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', {path: '/', thresholdPercent: 0.8}),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}

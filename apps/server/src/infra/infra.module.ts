import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {PrometheusModule} from '@willsoto/nestjs-prometheus';

import {HealthCheckModule} from './health-check/health-check.module';
import {INFRA_API_PATHS} from './infra.constants';
import {InfraMiddleware} from './infra.middleware';
import {HealthCheckApiPath} from './infra.providers';
import {LavalinkModule} from './lavalink/lavalink.module';
import {RedisModule} from './redis/redis.module';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {enabled: true},
      path: INFRA_API_PATHS.PROMETHEUS,
    }),
    HealthCheckModule,
    LavalinkModule,
    RedisModule,
  ],
  providers: [HealthCheckApiPath],
  exports: [LavalinkModule, RedisModule],
})
export class InfraModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InfraMiddleware).forRoutes(INFRA_API_PATHS.HEALTHCHECK, INFRA_API_PATHS.PROMETHEUS);
  }
}

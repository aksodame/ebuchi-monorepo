import {HEALTHCHECK_API_PATH, INFRA_API_PATHS} from './infra.constants';

import type {Provider} from '@nestjs/common';

export const HealthCheckApiPath: Provider = {
  provide: HEALTHCHECK_API_PATH,
  useValue: INFRA_API_PATHS.HEALTHCHECK,
};

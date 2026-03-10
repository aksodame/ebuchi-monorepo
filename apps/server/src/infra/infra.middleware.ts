import {timingSafeEqual} from 'crypto';

import {Injectable, NestMiddleware, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NextFunction, Request, Response} from 'express';

@Injectable()
export class InfraMiddleware implements NestMiddleware {
  private readonly apiKey: Buffer;

  constructor(config: ConfigService) {
    this.apiKey = Buffer.from(config.getOrThrow<string>('INTERNAL_API_KEY'));
  }

  use(req: Request, _res: Response, next: NextFunction) {
    const bearer = req.headers.authorization?.replace('Bearer ', '');
    if (!bearer) {
      throw new UnauthorizedException();
    }

    const bearerBuffer = Buffer.from(bearer);
    if (bearerBuffer.length !== this.apiKey.length || !timingSafeEqual(bearerBuffer, this.apiKey)) {
      throw new UnauthorizedException();
    }

    next();
  }
}

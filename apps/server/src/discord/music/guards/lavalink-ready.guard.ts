import {LavalinkService} from '@ebuchi-infra/lavalink/lavalink.service';
import {CanActivate, ExecutionContext, Injectable, ServiceUnavailableException} from '@nestjs/common';

@Injectable()
export class LavalinkReadyGuard implements CanActivate {
  constructor(private readonly lavalinkService: LavalinkService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (!this.lavalinkService.manager) {
      throw new ServiceUnavailableException('Music service is not ready yet. Please try again in a moment.');
    }

    return true;
  }
}

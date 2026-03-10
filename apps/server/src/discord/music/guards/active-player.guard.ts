import {LavalinkService} from '@ebuchi-infra/lavalink/lavalink.service';
import {CanActivate, ExecutionContext, Injectable, ForbiddenException} from '@nestjs/common';
import {SlashCommandContext} from 'necord';

@Injectable()
export class ActivePlayerGuard implements CanActivate {
  constructor(private readonly lavalinkService: LavalinkService) {}

  canActivate(context: ExecutionContext): boolean {
    const [interaction] = context.getArgByIndex<SlashCommandContext>(0);
    if (!this.lavalinkService.manager?.getPlayer(interaction.guildId!)) {
      throw new ForbiddenException('Nothing is playing right now.');
    }

    return true;
  }
}

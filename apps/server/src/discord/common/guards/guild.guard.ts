import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {GuildMember} from 'discord.js';
import {SlashCommandContext} from 'necord';

@Injectable()
export class GuildGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const [interaction] = context.getArgByIndex<SlashCommandContext>(0);
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      throw new ForbiddenException('This command can only be used in a server.');
    }

    return true;
  }
}

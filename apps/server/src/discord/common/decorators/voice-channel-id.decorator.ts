import {createParamDecorator, ForbiddenException, type ExecutionContext} from '@nestjs/common';
import {GuildMember} from 'discord.js';

import type {SlashCommandContext} from 'necord';

export const VoiceChannelId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const [interaction] = ctx.getArgByIndex<SlashCommandContext>(0);
  if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
    throw new ForbiddenException('You must be in a voice channel to use this command.');
  }

  return interaction.member.voice.channel.id;
});

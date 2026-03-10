import {LavalinkService} from '@ebuchi-infra/lavalink/lavalink.service';
import {Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {ChannelType, Client, Events, VoiceState} from 'discord.js';
import ms from 'ms';
import {On} from 'necord';

import {MusicEmbeds} from './music.embeds';

@Injectable()
export class MusicEventsService implements OnModuleDestroy {
  private static readonly ALONE_TIMEOUT_MS = ms('2min');

  private readonly logger = new Logger(MusicEventsService.name);
  private readonly aloneTimestamps = new Map<string, number>();

  constructor(
    private readonly client: Client,
    private readonly lavalinkService: LavalinkService
  ) {}

  @On(Events.VoiceStateUpdate)
  onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    if (!this.lavalinkService.manager) {
      return;
    }

    const guild = oldState.guild;
    if (!guild) {
      return;
    }

    const player = this.lavalinkService.manager.getPlayer(guild.id);
    if (!player?.voiceChannelId) {
      return;
    }

    const botChannelId = player.voiceChannelId;
    if (oldState.channelId !== botChannelId && newState.channelId !== botChannelId) {
      return;
    }

    const voiceChannel = guild.channels.cache.get(botChannelId);
    const isVoiceChannel =
      voiceChannel?.type === ChannelType.GuildVoice || voiceChannel?.type === ChannelType.GuildStageVoice;
    if (!voiceChannel || !isVoiceChannel) {
      return;
    }

    const nonBotMembers = voiceChannel.members.filter((m) => !m.user.bot);
    if (nonBotMembers.size === 0 && !this.aloneTimestamps.has(guild.id)) {
      this.aloneTimestamps.set(guild.id, Date.now());
      this.logger.debug(`Bot alone in guild ${guild.id}`);
    } else if (this.aloneTimestamps.delete(guild.id)) {
      this.logger.debug(`Cancelled alone timer for guild ${guild.id}`);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async disconnectIdlePlayers(): Promise<void> {
    const now = Date.now();

    for (const [guildId, since] of this.aloneTimestamps) {
      if (now - since < MusicEventsService.ALONE_TIMEOUT_MS) {
        continue;
      }

      this.aloneTimestamps.delete(guildId);

      const player = this.lavalinkService.manager?.getPlayer(guildId);
      if (!player) {
        continue;
      }

      if (player.textChannelId) {
        const channel = this.client.channels.cache.get(player.textChannelId);
        if (channel?.isSendable()) {
          await channel.send(MusicEmbeds.warning('Left the voice channel — no users for 2 minutes.'));
        }
      }

      await player.destroy();
    }
  }

  onModuleDestroy(): void {
    this.aloneTimestamps.clear();
  }
}

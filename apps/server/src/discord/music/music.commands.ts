import {Injectable, UseGuards, UseInterceptors} from '@nestjs/common';
import {Context, Options, SlashCommand, SlashCommandContext} from 'necord';

import {VoiceChannelId} from '../common/decorators/voice-channel-id.decorator';
import {GuildGuard} from '../common/guards/guild.guard';
import {DeferReplyInterceptor} from '../common/interceptors/defer-reply.interceptor';

import {PlayDto} from './dto/play.dto';
import {VolumeDto} from './dto/volume.dto';
import {ActivePlayerGuard} from './guards/active-player.guard';
import {ActiveTrackGuard} from './guards/active-track.guard';
import {LavalinkReadyGuard} from './guards/lavalink-ready.guard';
import {MusicService} from './music.service';

@UseInterceptors(DeferReplyInterceptor)
@UseGuards(GuildGuard, LavalinkReadyGuard)
@Injectable()
export class MusicCommands {
  constructor(private readonly musicService: MusicService) {}

  @SlashCommand({name: 'play', description: 'Play a song or playlist'})
  async play(
    @VoiceChannelId() voiceChannelId: string,
    @Context() [interaction]: SlashCommandContext,
    @Options() {query}: PlayDto
  ): Promise<void> {
    await interaction.editReply(
      await this.musicService.play({
        guildId: interaction.guildId!,
        textChannelId: interaction.channelId,
        voiceChannelId,
        user: interaction.user,
        query,
      })
    );
  }

  @SlashCommand({name: 'skip', description: 'Skip the current track'})
  @UseGuards(ActiveTrackGuard)
  async skip(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.editReply(await this.musicService.skip(interaction.guildId!));
  }

  @SlashCommand({name: 'stop', description: 'Stop music and leave the voice channel'})
  @UseGuards(ActivePlayerGuard)
  async stop(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.editReply(await this.musicService.stop(interaction.guildId!));
  }

  @SlashCommand({name: 'pause', description: 'Pause or resume the current track'})
  @UseGuards(ActiveTrackGuard)
  async pause(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.editReply(await this.musicService.pause(interaction.guildId!));
  }

  @SlashCommand({name: 'queue', description: 'Show the music queue'})
  @UseGuards(ActiveTrackGuard)
  async queue(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.editReply(this.musicService.queue(interaction.guildId!));
  }

  @SlashCommand({name: 'nowplaying', description: 'Show the currently playing track'})
  @UseGuards(ActiveTrackGuard)
  async nowPlaying(@Context() [interaction]: SlashCommandContext): Promise<void> {
    await interaction.editReply(this.musicService.nowPlaying(interaction.guildId!));
  }

  @SlashCommand({name: 'volume', description: 'Set the volume (0-150)'})
  @UseGuards(ActivePlayerGuard)
  async volume(@Context() [interaction]: SlashCommandContext, @Options() {level}: VolumeDto): Promise<void> {
    await interaction.editReply(await this.musicService.volume(interaction.guildId!, level));
  }
}

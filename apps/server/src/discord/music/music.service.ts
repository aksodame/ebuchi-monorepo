import {LavalinkService} from '@ebuchi-infra/lavalink/lavalink.service';
import {Injectable} from '@nestjs/common';

import {MusicEmbeds} from './music.embeds';

import type {InteractionEditReplyOptions, User} from 'discord.js';

interface PlayOptions {
  guildId: string;
  textChannelId: string;
  voiceChannelId: string;
  user: User;
  query: string;
}

@Injectable()
export class MusicService {
  constructor(private readonly lavalinkService: LavalinkService) {}

  async play(options: PlayOptions): Promise<InteractionEditReplyOptions> {
    const {guildId, textChannelId, voiceChannelId, user, query} = options;
    const manager = this.lavalinkService.manager!;

    const existingPlayer = manager.getPlayer(guildId);
    const player =
      existingPlayer ??
      manager.createPlayer({
        guildId,
        voiceChannelId,
        textChannelId,
        selfDeaf: true,
        selfMute: false,
        volume: 80,
      });

    if (!player.connected) {
      await player.connect();
    }

    let res;
    try {
      res = await player.search({query, source: 'scsearch'}, user);
    } catch (error) {
      if (!existingPlayer) {
        await player.destroy().catch(() => {});
      }

      throw error;
    }

    if (!res || res.loadType === 'error') {
      return MusicEmbeds.error('Failed to find any results.');
    }

    if (res.loadType === 'empty') {
      return MusicEmbeds.error('No results found.');
    }

    if (res.loadType === 'playlist') {
      await player.queue.add(res.tracks);
    } else {
      const track = res.tracks[0];
      if (!track) {
        return MusicEmbeds.error('No results found.');
      }

      await player.queue.add(track);
    }

    if (!player.playing && !player.paused) {
      await player.play({paused: false});
    }

    return res.loadType === 'playlist'
      ? MusicEmbeds.playlistQueued(res.tracks, res.playlist)
      : MusicEmbeds.trackQueued(res.tracks[0]!);
  }

  async skip(guildId: string): Promise<InteractionEditReplyOptions> {
    const player = this.lavalinkService.manager!.getPlayer(guildId)!;
    if (!player.queue.tracks.length) {
      await player.stopPlaying(true, true);
      return MusicEmbeds.success('Skipped the last track. Queue is now empty.');
    }

    await player.skip();
    return MusicEmbeds.success('Skipped the current track.');
  }

  async stop(guildId: string): Promise<InteractionEditReplyOptions> {
    await this.lavalinkService.manager!.getPlayer(guildId)!.destroy();
    return MusicEmbeds.success('Stopped the music and left the voice channel.');
  }

  async pause(guildId: string): Promise<InteractionEditReplyOptions> {
    const player = this.lavalinkService.manager!.getPlayer(guildId)!;
    if (player.paused) {
      await player.resume();
      return MusicEmbeds.success('Resumed the music.');
    }

    await player.pause();
    return MusicEmbeds.warning('Paused the music.');
  }

  queue(guildId: string): InteractionEditReplyOptions {
    return MusicEmbeds.queue(this.lavalinkService.manager!.getPlayer(guildId)!);
  }

  nowPlaying(guildId: string): InteractionEditReplyOptions {
    return MusicEmbeds.nowPlaying(this.lavalinkService.manager!.getPlayer(guildId)!);
  }

  async volume(guildId: string, level: number): Promise<InteractionEditReplyOptions> {
    const clamped = Math.max(0, Math.min(150, level));
    await this.lavalinkService.manager!.getPlayer(guildId)!.setVolume(clamped);
    return MusicEmbeds.success(`Volume set to **${clamped}%**`);
  }
}

import {EmbedBuilder} from 'discord.js';

import type {Player, PlaylistInfo, Track, UnresolvedTrack} from 'lavalink-client';

export class MusicEmbeds {
  static error(description: string) {
    return {embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(description)]};
  }

  static success(description: string) {
    return {embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(description)]};
  }

  static warning(description: string) {
    return {embeds: [new EmbedBuilder().setColor(0xffaa00).setDescription(description)]};
  }

  static trackQueued(track: Track | UnresolvedTrack) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Track Queued')
          .setDescription(`**[${track.info.title}](${track.info.uri})**`)
          .addFields(
            {name: 'Author', value: track.info.author ?? 'Unknown', inline: true},
            {name: 'Duration', value: formatDuration(track.info.duration ?? 0), inline: true}
          )
          .setThumbnail(track.info.artworkUrl ?? null),
      ],
    };
  }

  static playlistQueued(tracks: (Track | UnresolvedTrack)[], playlist: PlaylistInfo | null) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Playlist Queued')
          .setDescription(`Added **${tracks.length}** tracks from **${playlist?.name ?? 'Unknown Playlist'}**`),
      ],
    };
  }

  static queue(player: Player) {
    const current = player.queue.current!;
    const tracks = player.queue.tracks.slice(0, 10);
    const totalTracks = player.queue.tracks.length;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Music Queue')
      .addFields({
        name: 'Now Playing',
        value: `**[${current.info.title}](${current.info.uri})** by ${current.info.author ?? 'Unknown'} [${formatDuration(current.info.duration ?? 0)}]`,
      });

    if (tracks.length > 0) {
      const queueList = tracks
        .map((t, i) => `**${i + 1}.** [${t.info.title}](${t.info.uri}) [${formatDuration(t.info.duration ?? 0)}]`)
        .join('\n');

      embed.addFields({name: `Up Next (${totalTracks} total)`, value: queueList});
    }

    return {embeds: [embed]};
  }

  static nowPlaying(player: Player) {
    const track = player.queue.current!;
    const position = player.position;
    const duration = track.info.duration ?? 0;
    const progress = duration > 0 ? Math.floor((position / duration) * 20) : 0;
    const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(20 - progress);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('Now Playing')
          .setDescription(`**[${track.info.title}](${track.info.uri})**`)
          .addFields(
            {name: 'Author', value: track.info.author ?? 'Unknown', inline: true},
            {name: 'Duration', value: `${formatDuration(position)} / ${formatDuration(duration)}`, inline: true},
            {name: 'Status', value: player.paused ? '⏸ Paused' : '▶ Playing', inline: true},
            {name: 'Progress', value: progressBar}
          )
          .setThumbnail(track.info.artworkUrl ?? null),
      ],
    };
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

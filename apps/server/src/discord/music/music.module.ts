import {LavalinkModule} from '@ebuchi-infra/lavalink/lavalink.module';
import {Module} from '@nestjs/common';

import {DiscordCommonModule} from '../common/discord-common.module';

import {ActivePlayerGuard} from './guards/active-player.guard';
import {ActiveTrackGuard} from './guards/active-track.guard';
import {LavalinkReadyGuard} from './guards/lavalink-ready.guard';
import {MusicEventsService} from './music-events.service';
import {MusicCommands} from './music.commands';
import {MusicService} from './music.service';

@Module({
  imports: [LavalinkModule, DiscordCommonModule],
  providers: [MusicService, MusicCommands, MusicEventsService, LavalinkReadyGuard, ActivePlayerGuard, ActiveTrackGuard],
})
export class MusicModule {}

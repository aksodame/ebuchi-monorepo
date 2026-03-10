import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {GatewayIntentBits} from 'discord.js';
import {NecordModule} from 'necord';

import {DiscordHostHandler} from './discord-host.handler';
import {MusicModule} from './music/music.module';

@Module({
  imports: [
    NecordModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('DISCORD_BOT_TOKEN'),
        development: config.get<string>('DISCORD_DEV_GUILD_ID') ? [config.get<string>('DISCORD_DEV_GUILD_ID')!] : [],
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
      }),
      inject: [ConfigService],
    }),
    MusicModule,
  ],
  providers: [DiscordHostHandler],
})
export class DiscordModule {}

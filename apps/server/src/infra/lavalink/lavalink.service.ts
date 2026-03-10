import {Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Client, Events} from 'discord.js';
import {LavalinkManager, type ChannelDeletePacket, type VoicePacket, type VoiceServer} from 'lavalink-client';
import {Once} from 'necord';

import {RedisService} from '../redis/redis.service';

import {RedisQueueStore} from './redis-queue-store';

@Injectable()
export class LavalinkService implements OnModuleDestroy {
  private readonly logger = new Logger(LavalinkService.name);
  private rawListener: ((data: VoicePacket | VoiceServer | ChannelDeletePacket) => void) | null = null;

  public manager: LavalinkManager | undefined;

  constructor(
    private readonly client: Client,
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  @Once(Events.ClientReady)
  async onClientReady(): Promise<void> {
    const clientInfo = {
      id: this.client.user!.id,
      username: this.client.user!.username,
    };

    this.manager = new LavalinkManager({
      nodes: [
        {
          host: this.config.getOrThrow<string>('LAVALINK_HOST'),
          port: Number(this.config.getOrThrow('LAVALINK_PORT')),
          authorization: this.config.getOrThrow<string>('LAVALINK_PASSWORD'),
          secure: this.config.get<string>('LAVALINK_SECURE') === 'true',
          id: 'main',
        },
      ],
      sendToShard: (guildId, payload) => {
        this.client.guilds.cache.get(guildId)?.shard?.send(payload);
      },
      client: clientInfo,
      playerOptions: {
        applyVolumeAsFilter: false,
        clientBasedPositionUpdateInterval: 50,
        defaultSearchPlatform: 'scsearch',
        volumeDecrementer: 0.75,
      },
      queueOptions: {
        maxPreviousTracks: 25,
        queueStore: new RedisQueueStore(this.redis),
      },
    });

    this.manager.nodeManager.on('create', (node) => {
      this.logger.log(`Lavalink node created: ${node.id}`);
    });

    this.manager.nodeManager.on('connect', (node) => {
      this.logger.log(`Lavalink node connected: ${node.id}`);
    });

    this.manager.nodeManager.on('disconnect', (node, reason) => {
      this.logger.warn(`Lavalink node disconnected: ${node.id}`, {reason});
    });

    this.manager.nodeManager.on('error', (node, error) => {
      this.logger.error(`Lavalink node error: ${node.id}`, error);
    });

    this.rawListener = (data) => this.manager?.sendRawData(data);
    this.client.on('raw', this.rawListener);

    await this.manager.init(clientInfo);

    this.logger.log('Lavalink Manager initialized');
  }

  onModuleDestroy(): void {
    if (this.rawListener) {
      this.client.off('raw', this.rawListener);
      this.rawListener = null;
    }

    this.manager?.nodeManager.removeAllListeners();
  }
}

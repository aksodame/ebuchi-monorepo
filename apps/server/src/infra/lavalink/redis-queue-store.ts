import type Redis from 'ioredis';
import type {QueueStoreManager, StoredQueue} from 'lavalink-client';

const KEY_PREFIX = 'lavalink:queue:';

export class RedisQueueStore implements QueueStoreManager {
  constructor(private readonly redis: Redis) {}

  async get(guildId: string): Promise<StoredQueue | string | undefined> {
    const raw = await this.redis.get(`${KEY_PREFIX}${guildId}`);
    return raw ?? undefined;
  }

  async set(guildId: string, value: StoredQueue | string): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.set(`${KEY_PREFIX}${guildId}`, serialized, 'EX', 86400);
  }

  async delete(guildId: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${guildId}`);
  }

  stringify(value: StoredQueue | string): string {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  parse(value: StoredQueue | string): Partial<StoredQueue> {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value) as Partial<StoredQueue>;
    } catch {
      return {};
    }
  }
}

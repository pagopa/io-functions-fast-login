import * as redis from "redis";
import * as TE from "fp-ts/TaskEither";

export const mockSetEx = jest.fn().mockResolvedValue("OK");
export const mockPing = jest.fn().mockResolvedValue("PONG");
export const mockRedisClientTask = TE.of(({
  setEx: mockSetEx,
  ping: mockPing
} as unknown) as redis.RedisClientType);
